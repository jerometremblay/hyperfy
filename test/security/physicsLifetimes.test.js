// Adapted from https://github.com/dwebxr/coo-world/blob/f40fb416e19909b1a22e5807d18be587b6d8b871/test/physicsLifetimes.test.js
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { bundleRealPhysx, runRealPhysx } from './lib/realPhysx.mjs'

// Phase 3b-2b on the real PhysX wasm: no native allocation outlives its node, and assigning an unchanged value does
// not rebuild. Live wasm chunks are counted exactly (test/lib/physxHeap.mjs) over a warmed window; PhysX's own pools
// still grow a little (~0.1 chunk per cycle for a bare create/destroy loop), hence the tolerance. On the code before
// this change: RigidBody leaks 1-2 chunks per mount, Controller 4, a Joint node 2, addForceAtPos 2 per node.
let bundle
before(async () => {
  bundle = await bundleRealPhysx()
})
after(() => bundle?.destroy())
const probe = (name, fn, args) => test(name, () => runRealPhysx(bundle, fn, args, { deadline: 120000 }))

function cycles({ B, root, body, liveChunks }, name) {
  const V = (x, y, z) => new B.THREE.Vector3(x, y, z)
  const perCycle = (fn, n = 200) => {
    for (let i = 0; i < 20; i++) fn(i)
    const start = liveChunks()
    for (let i = 0; i < n; i++) fn(i)
    return (liveChunks() - start) / n
  }
  const rigid = (data = {}) => {
    const rb = new B.RigidBody({ type: 'dynamic', ...data })
    rb.add(new B.Collider({ type: 'box', width: 1, height: 1, depth: 1 }))
    return rb
  }
  let leak
  switch (name) {
    case 'RigidBody with a box collider, fresh nodes':
      leak = perCycle(() => {
        const rb = rigid()
        root.add(rb)
        root.remove(rb)
      })
      break
    case 'RigidBody with a box collider, the same node remounted': {
      const rb = rigid()
      leak = perCycle(() => {
        root.add(rb)
        root.remove(rb)
      })
      break
    }
    case 'RigidBody with a centre of mass, remounted by a new mass': {
      const rb = rigid()
      root.add(rb)
      rb.getProxy().setCenterOfMass(V(0, 0.5, 0))
      rb.clean()
      leak = perCycle(i => {
        rb.mass = 1 + (i % 2)
        rb.clean()
      })
      break
    }
    case 'RigidBody addForceAtPos and setKinematicTarget, fresh nodes':
      leak = perCycle(() => {
        const dynamic = rigid()
        root.add(dynamic)
        dynamic.getProxy().addForceAtPos(V(1, 0, 0), V(0, 1, 0))
        root.remove(dynamic)
        const kinematic = rigid({ type: 'kinematic' })
        root.add(kinematic)
        kinematic.getProxy().setKinematicTarget(V(0, 1, 0), new B.THREE.Quaternion())
        root.remove(kinematic)
      })
      break
    case 'Controller, the same node remounted': {
      const node = new B.Controller({ radius: 0.4, height: 1 })
      leak = perCycle(() => {
        root.add(node)
        root.remove(node)
      })
      break
    }
    case 'Joint of each type, fresh nodes': {
      const a = body('RigidBody', { position: [0, 0, 0] })
      const b = body('RigidBody', { position: [3, 0, 0] })
      // each type on its own, so one leaking type cannot hide in an average
      const leaks = ['fixed', 'socket', 'hinge', 'distance'].map(type =>
        perCycle(() => {
          const node = new B.Joint({
            type,
            limitY: 30,
            limitZ: 30,
            limitMin: -10,
            limitMax: 10,
            limitStiffness: 10,
            limitDamping: 1,
          })
          node.body0 = a
          node.body1 = b
          root.add(node)
          root.remove(node)
        })
      )
      leak = Math.max(...leaks)
      break
    }
    case 'Prim box, the same node remounted': {
      const node = new B.Prim({ type: 'box', size: [1, 1, 1], physics: 'dynamic', opacity: 0 })
      leak = perCycle(() => {
        root.add(node)
        root.remove(node)
      })
      break
    }
    default:
      throw new Error(`unknown case ${name}`)
  }
  assert.ok(leak < 0.5, `${name}: ${leak} live chunks per cycle`)
}

for (const name of [
  'RigidBody with a box collider, fresh nodes',
  'RigidBody with a box collider, the same node remounted',
  'RigidBody with a centre of mass, remounted by a new mass',
  'RigidBody addForceAtPos and setKinematicTarget, fresh nodes',
  'Controller, the same node remounted',
  'Joint of each type, fresh nodes',
  'Prim box, the same node remounted',
]) {
  probe(`physics lifetimes: ${name}`, cycles, name)
}

probe('physics lifetimes: an unchanged value does not rebuild', ({ B, root }) => {
  const mounts = node => {
    let count = 0
    const mount = node.mount
    node.mount = function (...args) {
      count++
      return mount.apply(this, args)
    }
    return () => count
  }
  const rb = new B.RigidBody({ type: 'dynamic', mass: 2, linearDamping: 0.1, angularDamping: 0.2 })
  const collider = new B.Collider({ type: 'box', width: 1, height: 1, depth: 1 })
  rb.add(collider)
  const controller = new B.Controller({ radius: 0.4, height: 1 })
  root.add(rb)
  root.add(controller)
  const rbMounts = mounts(rb)
  const colliderMounts = mounts(collider)
  const controllerMounts = mounts(controller)
  for (let i = 0; i < 10; i++) {
    rb.mass = 2
    rb.linearDamping = 0.1
    rb.angularDamping = 0.2
    rb.getProxy().setCenterOfMass(new B.THREE.Vector3(0, 0, 0))
    collider.width = 1
    collider.staticFriction = 0.6
    collider.layer = 'environment'
    collider.trigger = false
    controller.radius = 0.4
    controller.height = 1
    rb.clean()
    controller.clean()
  }
  assert.deepEqual(
    [rbMounts(), colliderMounts(), controllerMounts()],
    [1, 0, 0],
    'rigid body mounts once (for the centre of mass), the rest never'
  )
  // a different value still rebuilds
  rb.mass = 3
  collider.width = 2
  controller.radius = 0.5
  rb.clean()
  controller.clean()
  assert.ok(rbMounts() >= 2 && colliderMounts() >= 1 && controllerMounts() === 1, 'changed values rebuild')
  // requestRebuild stays unconditional
  const before = colliderMounts()
  collider.requestRebuild()
  collider.clean()
  assert.equal(colliderMounts(), before + 1, 'requestRebuild rebuilds')
})

function jointSurvival({ B, root, step, body, liveChunks, physics }, name) {
  const V = (x, y, z) => new B.THREE.Vector3(x, y, z)
  const constraints = () => physics.scene.getNbConstraints()
  const at = node => {
    const { x, y, z } = node.actor.getGlobalPose().p
    return { x, y, z }
  }
  // a fixed joint holds the two boxes 3 m apart: pushing one drags the other along (the pair turns about them both).
  // Without the joint the first box stays at z = 0 and the gap opens to about 3.9 m.
  const holds = (a, b) => {
    b.getProxy().setLinearVelocity(V(0, 0, 5))
    step(30)
    const pa = at(a)
    const pb = at(b)
    return Math.abs(Math.hypot(pb.x - pa.x, pb.y - pa.y, pb.z - pa.z) - 3) < 0.2 && pa.z > 0.1
  }
  const pair = () => {
    const a = body('RigidBody', { position: [0, 0, 0], linearDamping: 0, angularDamping: 0 })
    const b = body('RigidBody', { position: [3, 0, 0], linearDamping: 0, angularDamping: 0 })
    const joint = new B.Joint({ type: 'fixed' })
    joint.body0 = a
    joint.body1 = b
    joint.offset0.set(1.5, 0, 0)
    joint.offset1.set(-1.5, 0, 0)
    root.add(joint)
    return { a, b, joint }
  }
  switch (name) {
    case 'a new mass on one body': {
      const { a, b } = pair()
      a.mass = 2
      a.clean()
      assert.equal(constraints(), 1)
      assert.ok(holds(a, b), 'the joint still holds')
      break
    }
    case 'the joint cleaned before the body': {
      const { a, b, joint } = pair()
      joint.getProxy().breakForce = 1e9
      a.mass = 2
      joint.clean()
      a.clean()
      assert.equal(constraints(), 1)
      assert.ok(holds(a, b), 'the joint still holds')
      break
    }
    case 'both bodies rebuilt with the joint dirtied first': {
      const { a, b, joint } = pair()
      joint.getProxy().breakForce = 1e9
      a.mass = 2
      b.mass = 3
      joint.clean()
      a.clean()
      b.clean()
      assert.equal(constraints(), 1)
      assert.ok(holds(a, b), 'the joint still holds')
      break
    }
    case 'one body removed, then added back': {
      const { a, b, joint } = pair()
      root.remove(a)
      assert.equal(constraints(), 0, 'the joint waits')
      // the survivor is free, not pinned to the world
      b.getProxy().setLinearVelocity(V(0, 0, 5))
      step(30)
      assert.ok(at(b).z > 0.5, 'the remaining body moves')
      joint.getProxy().active = false
      joint.getProxy().active = true
      root.add(a)
      assert.equal(constraints(), 1, 'the joint mounts again once the body is back')
      const start = liveChunks()
      for (let i = 0; i < 50; i++) {
        root.remove(a)
        root.add(a)
      }
      assert.equal(constraints(), 1)
      assert.ok((liveChunks() - start) / 50 < 0.5, 'no joint is created twice')
      break
    }
    case 'a joint created before its body is mounted': {
      const a = new B.RigidBody({ type: 'dynamic', linearDamping: 0, angularDamping: 0 })
      a.add(new B.Collider({ type: 'box', width: 2, height: 2, depth: 2 }))
      const b = body('RigidBody', { position: [3, 0, 0], linearDamping: 0, angularDamping: 0 })
      const joint = new B.Joint({ type: 'fixed' })
      joint.body0 = a
      joint.body1 = b
      joint.offset0.set(1.5, 0, 0)
      joint.offset1.set(-1.5, 0, 0)
      root.add(joint)
      assert.equal(constraints(), 0, 'the joint waits for the body')
      root.add(a)
      assert.equal(constraints(), 1, 'the joint mounts with the body')
      assert.ok(holds(a, b), 'the joint holds')
      break
    }
    default:
      throw new Error(`unknown case ${name}`)
  }
}

for (const name of [
  'a new mass on one body',
  'the joint cleaned before the body',
  'both bodies rebuilt with the joint dirtied first',
  'one body removed, then added back',
  'a joint created before its body is mounted',
]) {
  probe(`physics lifetimes: joints survive a body rebuild: ${name}`, jointSurvival, name)
}

probe('physics lifetimes: mesh checks and budgets', ({ B, root, world }) => {
  const mesh = (vertexCount, indices) => {
    const geometry = new B.THREE.BufferGeometry()
    // vertex 3k, 3k+1, 3k+2 form a right triangle at x = k, so consecutive index triples never degenerate
    const positions = new Float32Array(vertexCount * 3)
    for (let i = 0; i < vertexCount; i++)
      positions.set([Math.floor(i / 3), i % 3 === 1 ? 1 : 0, i % 3 === 2 ? 1 : 0], i * 3)
    geometry.setAttribute('position', new B.THREE.BufferAttribute(positions, 3))
    // setIndex keeps a bare typed array unwrapped, so wrap it the way a loaded model has it
    if (indices) geometry.setIndex(Array.isArray(indices) ? indices : new B.THREE.BufferAttribute(indices, 1))
    return geometry
  }
  const collide = (geometry, entity, convex = false) => {
    const rb = new B.RigidBody({ type: 'static' })
    const collider = new B.Collider({ type: 'geometry', geometry, convex })
    rb.add(collider)
    // a different app per entity: the per-app budget is charged to ctx.entity
    if (entity) {
      const node = new B.Node()
      node.activate({ world, entity, moving: false })
      node.add(rb)
    } else {
      root.add(rb)
    }
    return collider
  }
  // malformed indices: not whole triangles, an index past the vertices
  assert.equal(collide(mesh(4, [0, 1, 2, 3])).shape, null, 'index count not a multiple of 3')
  assert.equal(collide(mesh(4, [0, 1, 99])).shape, null, 'index past the vertices')
  // a forged negative or fractional vertex count is refused before anything is allocated
  const forged = mesh(3, [0, 1, 2])
  Object.defineProperty(forged.attributes.position, 'count', { value: -1 })
  assert.doesNotThrow(() => collide(forged))
  // per mesh: too many triangles (a 200k-triangle limit; 200 001 triangles over 3 vertices is enough to test it)
  const many = new Uint32Array(200_001 * 3)
  assert.equal(collide(mesh(3, many)).shape, null, 'too many triangles')
  // per app: two 150k-vertex meshes fit one app's 400k budget only once each with their triangles
  const app = { isApp: true, data: { id: 'app-a' }, deadHook: { dead: false } }
  const other = { isApp: true, data: { id: 'app-b' }, deadHook: { dead: false } }
  const big = () =>
    mesh(
      150_000,
      new Uint32Array(30_000 * 3).map((_, i) => i)
    )
  const first = collide(big(), app)
  const second = collide(big(), app)
  const third = collide(big(), app)
  assert.ok(first.shape && second.shape, 'two meshes fit the app budget')
  assert.equal(third.shape, null, 'the third mesh is over the app budget')
  // another app has its own budget
  assert.ok(collide(big(), other).shape, 'another app still gets its mesh')
  // releasing returns the budget
  first.parent.parent.remove(first.parent)
  const fourth = collide(big(), app)
  assert.ok(fourth.shape, 'the budget comes back after a release')
})

probe(
  'physics lifetimes: a native throw mid-mount leaves no temporaries and no stale handle',
  ({ B, PHYSX, root, physics, liveChunks }) => {
    // throw once from a native method, then restore it
    const failOnce = (proto, method) => {
      const original = proto[method]
      proto[method] = function () {
        proto[method] = original
        throw new Error(`injected ${method} failure`)
      }
    }
    const perCycle = (fn, n = 40) => {
      for (let i = 0; i < 5; i++) fn()
      const start = liveChunks()
      for (let i = 0; i < n; i++) fn()
      return (liveChunks() - start) / n
    }
    const collider = () => {
      const rb = new B.RigidBody({ type: 'static' })
      rb.add(new B.Collider({ type: 'box', width: 1, height: 1, depth: 1 }))
      return rb
    }
    // Collider: setLocalPose throws after the shape exists (the throw reaches the caller; the temporaries do not leak)
    const colliderLeak = perCycle(() => {
      const rb = collider()
      failOnce(PHYSX.PxShape.prototype, 'setLocalPose')
      assert.throws(() => root.add(rb), /injected setLocalPose failure/, 'collider setLocalPose throws')
      root.remove(rb)
    })
    assert.ok(colliderLeak < 0.5, `collider temporaries: ${colliderLeak} chunks per throw`)
    // Physics.addActor: scene.addActor throws, so neither the handle nor its registration is published
    const handles = physics.handles.size
    let attempted = null
    const addActor = physics.addActor
    physics.addActor = function (actor, handle) {
      attempted = handle
      return addActor.call(this, actor, handle)
    }
    const rb = collider()
    failOnce(PHYSX.PxScene.prototype, 'addActor')
    assert.throws(() => root.add(rb), /injected addActor failure/, 'scene.addActor throws')
    physics.addActor = addActor
    assert.ok(attempted, 'addActor was reached')
    assert.equal(physics.handles.size, handles, 'no stale handle')
    assert.equal(physics.registrations.has(attempted), false, 'no stale registration')
    root.remove(rb)
    // Prim: the static actor's own attachShape and the shape's setQueryFilterData throw after the geometry and the
    // filter data exist (Prim logs mount failures instead of throwing); each injection must actually be reached
    for (const [proto, method] of [
      [PHYSX.PxRigidStatic.prototype, 'attachShape'],
      [PHYSX.PxShape.prototype, 'setQueryFilterData'],
      [PHYSX.PxShapeFlags.prototype, 'raise'],
    ]) {
      let reached = 0
      const primLeak = perCycle(() => {
        const node = new B.Prim({ type: 'box', size: [1, 1, 1], physics: 'static', opacity: 0 })
        const original = proto[method]
        proto[method] = function () {
          proto[method] = original
          reached++
          throw new Error(`injected ${method} failure`)
        }
        root.add(node)
        proto[method] = original
        root.remove(node)
      })
      assert.ok(reached >= 40, `prim ${method}: the fault was injected (${reached})`)
      assert.ok(primLeak < 0.5, `prim ${method}: ${primLeak} chunks per throw`)
    }
    // a convex collider whose geometry constructor throws after its mesh was cooked: the mesh handle is released
    let cycle = 0
    const convexLeak = perCycle(() => {
      // a fresh geometry each time, so every cycle cooks a new mesh
      const geometry = new B.THREE.BufferGeometry()
      geometry.setAttribute(
        'position',
        new B.THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1 + ++cycle * 1e-3], 3)
      )
      const body = new B.RigidBody({ type: 'static' })
      body.add(new B.Collider({ type: 'geometry', geometry, convex: true }))
      const Original = PHYSX.PxConvexMeshGeometry
      PHYSX.PxConvexMeshGeometry = function () {
        PHYSX.PxConvexMeshGeometry = Original
        throw new Error('injected PxConvexMeshGeometry failure')
      }
      assert.throws(() => root.add(body), /injected PxConvexMeshGeometry failure/, 'convex geometry throws')
      PHYSX.PxConvexMeshGeometry = Original
      root.remove(body)
    })
    assert.ok(convexLeak < 0.5, `convex mesh after a geometry throw: ${convexLeak} chunks per throw`)
    // the mesh scale's own constructor throwing, after its vector and quaternion exist: a convex collider and a convex
    // (tapered cylinder) prim
    const scaleThrow = make => {
      let reached = 0
      const leak = perCycle(() => {
        const Original = PHYSX.PxMeshScale
        PHYSX.PxMeshScale = function () {
          PHYSX.PxMeshScale = Original
          reached++
          throw new Error('injected PxMeshScale failure')
        }
        const node = make()
        try {
          root.add(node)
        } catch {
          // the collider throws to its caller; the prim logs
        }
        PHYSX.PxMeshScale = Original
        root.remove(node)
      })
      return { leak, reached }
    }
    const colliderScale = scaleThrow(() => {
      const geometry = new B.THREE.BufferGeometry()
      geometry.setAttribute(
        'position',
        new B.THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1 + ++cycle * 1e-3], 3)
      )
      const node = new B.RigidBody({ type: 'static' })
      node.add(new B.Collider({ type: 'geometry', geometry, convex: true }))
      return node
    })
    const primScale = scaleThrow(
      () => new B.Prim({ type: 'cylinder', size: [0.5, 1, 1], physics: 'static', opacity: 0 })
    )
    for (const [label, { leak, reached }] of [
      ['collider', colliderScale],
      ['prim', primScale],
    ]) {
      assert.ok(reached >= 40, `${label}: the PxMeshScale fault was injected (${reached})`)
      assert.ok(leak < 0.5, `${label}: ${leak} chunks per PxMeshScale throw`)
    }
  }
)

probe('physics lifetimes: the mesh budget counts the index array, not index.count', ({ B, root }) => {
  // index.count says one triangle; the array holds 200 001
  const geometry = new B.THREE.BufferGeometry()
  geometry.setAttribute('position', new B.THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3))
  const index = new B.THREE.BufferAttribute(
    new Uint32Array(200_001 * 3).map((_, i) => i % 3),
    1
  )
  Object.defineProperty(index, 'count', { value: 3 })
  geometry.setIndex(index)
  const rb = new B.RigidBody({ type: 'static' })
  const collider = new B.Collider({ type: 'geometry', geometry })
  rb.add(collider)
  root.add(rb)
  assert.equal(collider.shape, null, 'refused: too many triangles')
})

probe('physics lifetimes: joint bookkeeping survives failures and body swaps', ({ B, PHYSX, root, body, physics }) => {
  const constraints = () => physics.scene.getNbConstraints()
  const fixed = (a, b) => {
    const joint = new B.Joint({ type: 'fixed' })
    joint.body0 = a
    joint.body1 = b
    return joint
  }
  // a joint whose configuration throws during a body rebuild is released and waits, not left unregistered
  const a = body('RigidBody', { position: [0, 0, 0] })
  const b = body('RigidBody', { position: [3, 0, 0] })
  const joint = fixed(a, b)
  root.add(joint)
  assert.equal(constraints(), 1)
  const original = PHYSX.PxFixedJoint.prototype.setBreakForce
  PHYSX.PxFixedJoint.prototype.setBreakForce = function () {
    PHYSX.PxFixedJoint.prototype.setBreakForce = original
    throw new Error('injected setBreakForce failure')
  }
  a.mass = 2
  a.clean() // the re-mount fails and is contained (logged), the rebuild completes
  PHYSX.PxFixedJoint.prototype.setBreakForce = original
  assert.equal(constraints(), 0, 'the half-configured joint was released')
  assert.equal(joint.joint, null)
  b.mass = 2
  b.clean() // the next rebuild of either body mounts it again
  assert.equal(constraints(), 1, 'the joint mounts again on the next rebuild')
  root.remove(joint)
  assert.equal(constraints(), 0)
  // replacing a body while the joint waits leaves no registration on the old body
  const waitingA = new B.RigidBody({ type: 'dynamic' })
  waitingA.add(new B.Collider({ type: 'box', width: 1, height: 1, depth: 1 }))
  const waitingB = new B.RigidBody({ type: 'dynamic', position: [3, 0, 0] })
  waitingB.add(new B.Collider({ type: 'box', width: 1, height: 1, depth: 1 }))
  const swap = fixed(waitingA, waitingB)
  root.add(swap)
  assert.ok(waitingA.pendingJoints.has(swap), 'waits for the first body')
  const c = body('RigidBody', { position: [0, 5, 0] })
  swap.getProxy().body0 = c.getProxy()
  root.add(waitingB)
  swap.clean()
  assert.equal(constraints(), 1, 'mounted against the new body')
  root.remove(swap)
  assert.equal(waitingA.pendingJoints.has(swap), false, 'no stale registration on the replaced body')
  assert.equal(constraints(), 0)
})

// Constructors are plain writable module properties, so a throwing constructor can be injected; native property
// accessors are defined non-configurable around the original getter/setter functions, so throws from them (the
// creation-transform and centre-of-mass population, the controller descriptor setters) cannot be injected here and
// are covered by the same allocate-inside-try pattern, checked by review.
probe(
  'physics lifetimes: a throwing constructor mid-mount leaves no earlier temporary behind',
  ({ B, PHYSX, root, body, liveChunks }) => {
    const throwOn = (name, nth) => {
      const Original = PHYSX[name]
      let calls = 0
      let reached = false
      PHYSX[name] = function (...args) {
        if (++calls === nth) {
          reached = true
          PHYSX[name] = Original
          throw new Error(`injected ${name} failure`)
        }
        return new Original(...args)
      }
      return () => {
        PHYSX[name] = Original
        return reached
      }
    }
    const perCycle = (fn, n = 40) => {
      for (let i = 0; i < 5; i++) fn()
      const start = liveChunks()
      for (let i = 0; i < n; i++) fn()
      return (liveChunks() - start) / n
    }
    const a = body('RigidBody', { position: [0, 0, 0] })
    const b = body('RigidBody', { position: [3, 0, 0] })
    const cases = [
      // the controller's shape flags, after its filter data exists
      ['PxShapeFlags', 1, () => new B.Controller({ radius: 0.4, height: 1 })],
      // the second joint frame, after the first exists
      ['PxTransform', 2, () => Object.assign(new B.Joint({ type: 'fixed' }), { body0: a, body1: b })],
      // the cone and the angular limit, after their spring exists
      [
        'PxJointLimitCone',
        1,
        () =>
          Object.assign(new B.Joint({ type: 'socket', limitY: 30, limitZ: 30, limitStiffness: 10, limitDamping: 1 }), {
            body0: a,
            body1: b,
          }),
      ],
      [
        'PxJointAngularLimitPair',
        1,
        () =>
          Object.assign(
            new B.Joint({ type: 'hinge', limitMin: -10, limitMax: 10, limitStiffness: 10, limitDamping: 1 }),
            { body0: a, body1: b }
          ),
      ],
    ]
    for (const [name, nth, make] of cases) {
      let reachedAll = true
      const leak = perCycle(() => {
        const node = make()
        const restore = throwOn(name, nth)
        try {
          root.add(node)
        } catch {
          // the throw reaches the caller; what matters is what it leaves behind
        }
        reachedAll = restore() && reachedAll
        root.remove(node)
      })
      assert.ok(reachedAll, `${name}: the fault was injected every cycle`)
      assert.ok(leak < 0.5, `${name}: ${leak} chunks per throw`)
    }
  }
)
