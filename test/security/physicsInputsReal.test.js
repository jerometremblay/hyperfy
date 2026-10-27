// Adapted from https://github.com/dwebxr/coo-world/blob/f40fb416e19909b1a22e5807d18be587b6d8b871/test/physicsInputsReal.test.js
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { bundleRealPhysx, runRealPhysx } from './lib/realPhysx.mjs'

// Phase 3b-2a on the real PhysX wasm: hostile physics inputs from a builder script never reach PhysX, so they never
// reach other actors. Each case runs in its own world with an unrelated bystander body. On the code before this
// change (REAL_PHYSX_SOURCE_ROOT=<a checkout of 8ff54ae>) the cases fail like this:
// - the bystander turns NaN: both 1e-40 masses, the three far controllers, the zero kinematic quaternion, the mesh
//   with a forged bounding box;
// - the hostile body itself turns NaN (and spreads it on contact): setCenterOfMass 3e38, the two 3e38 pushes;
// - the jointed bodies turn NaN: the 1e30 hinge limit, the invalid cone;
// - mount throws: the geometry collider without a geometry;
// - an invalid shape or joint is created (no spread observed in these scenes): the rest.
let bundle
before(async () => {
  bundle = await bundleRealPhysx()
})
after(() => bundle?.destroy())
const probe = (name, fn, args) => test(name, () => runRealPhysx(bundle, fn, args, { deadline: 60000 }))

function hostile({ B, root, step, body }, name) {
  const V = (x, y, z) => new B.THREE.Vector3(x, y, z)
  const finitePose = actor => {
    const t = actor.getGlobalPose()
    return [t.p.x, t.p.y, t.p.z, t.q.x, t.q.y, t.q.z, t.q.w].every(Number.isFinite)
  }
  // a setter that now throws for a value the previous code accepted: the case still runs on both
  const attempt = fn => {
    try {
      fn()
      return true
    } catch {
      return false
    }
  }
  let bystander
  // an unrelated body far from the hostile one, moving
  const far = () => {
    bystander = body('RigidBody', { position: [42, 0, 0] })
    bystander.getProxy().setLinearVelocity(V(-1, 0, 0))
  }
  // a body at the world origin, moving (where a far controller corrupts the scene)
  const origin = () => {
    bystander = body('RigidBody', { position: [0, 0, 0] })
    bystander.getProxy().setLinearVelocity(V(1, 0, 0))
  }
  // a body driven into the hostile one
  const touching = (x = 1.9) => {
    bystander = body('RigidBody', { position: [x, 0, 0] })
    bystander.getProxy().setLinearVelocity(V(-5, 0, 0))
  }
  const rigid = (type, colliderData, data = {}) => {
    const rb = new B.RigidBody({ type, ...data })
    const collider = new B.Collider(colliderData)
    rb.add(collider)
    root.add(rb)
    return { rb, collider }
  }
  const mesh = (positions, index) => {
    const geometry = new B.THREE.BufferGeometry()
    if (positions) geometry.setAttribute('position', new B.THREE.Float32BufferAttribute(positions, 3))
    if (index) geometry.setIndex(index)
    return geometry
  }
  // a tetrahedron (cooks as convex and as triangles)
  const tetra = () => mesh([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], [0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3])
  const prim = data => {
    const node = new B.Prim({ opacity: 0, physics: 'dynamic', ...data })
    root.add(node)
    return node
  }
  const joint = (data, setup) => {
    const a = body('RigidBody', { position: [0, 0, 0] })
    const b = body('RigidBody', { position: [3, 0, 0] })
    const node = new B.Joint(data)
    node.body0 = a
    node.body1 = b
    node.offset0.set(1.5, 0, 0)
    node.offset1.set(-1.5, 0, 0)
    setup?.(node)
    root.add(node)
    b.actor.setAngularVelocity(new globalThis.PHYSX.PxVec3(0, 20, 0))
    b.actor.setAngularVelocity(new globalThis.PHYSX.PxVec3(10, 20, 10))
    return { node, a, b }
  }
  let check = () => {}
  // a hostile body that must itself stay finite (a NaN body spreads NaN to what it touches)
  let self = null
  switch (name) {
    // (R) colliders and prims outside the length window
    case 'Collider sphere radius 1e30, static': {
      const { collider } = rigid('static', { type: 'sphere', radius: 1e30 })
      far()
      check = () => assert.equal(collider.shape, null)
      break
    }
    case 'Collider sphere radius 1e30, dynamic': {
      const { collider } = rigid('dynamic', { type: 'sphere', radius: 1e30 })
      far()
      check = () => assert.equal(collider.shape, null)
      break
    }
    case 'Collider box width 2e30, dynamic': {
      const { collider } = rigid('dynamic', { type: 'box', width: 2e30, height: 1, depth: 1 })
      touching()
      check = () => assert.equal(collider.shape, null)
      break
    }
    case 'Collider sphere radius 1e-9 and 0': {
      const a = rigid('dynamic', { type: 'sphere', radius: 1e-9 })
      const b = rigid('dynamic', { type: 'sphere', radius: 0 })
      touching()
      check = () => assert.deepEqual([a.collider.shape, b.collider.shape], [null, null])
      break
    }
    case 'Prim box size 1e30, dynamic': {
      const node = prim({ type: 'box', size: [1e30, 1, 1] })
      touching()
      check = () => assert.equal(node.actor ?? null, null)
      break
    }
    case 'Prim torus [1, 1e18], dynamic': {
      const node = prim({ type: 'torus', size: [1, 1e18] })
      touching()
      check = () => assert.equal(node.actor ?? null, null)
      break
    }
    case 'Prim box under a NaN node scale': {
      const node = new B.Prim({ opacity: 0, physics: 'dynamic', type: 'box', size: [1, 1, 1] })
      node.scale.set(NaN, 1, 1)
      root.add(node)
      touching()
      check = () => assert.equal(node.actor ?? null, null)
      break
    }
    // (R) denormal masses: PhysX rounds them to 0 with an infinite inverse mass
    case 'RigidBody mass 1e-40 hit by a body': {
      const node = body('RigidBody', { position: [0, 0, 0] })
      const accepted = attempt(() => (node.mass = 1e-40))
      node.clean()
      touching(2.5)
      check = () => assert.equal(accepted, false, 'the setter refuses the mass')
      break
    }
    case 'Prim mass 1e-40 hit by a body': {
      let accepted = true
      try {
        prim({ type: 'box', size: [2, 2, 2], mass: 1e-40 })
      } catch {
        accepted = false
        prim({ type: 'box', size: [2, 2, 2] })
      }
      touching(2.5)
      check = () => assert.equal(accepted, false, 'the setter refuses the mass')
      break
    }
    // (R) controllers outside the position window corrupt the scene without contact
    case 'Controller teleport (1e30, 0, 0) and a move': {
      origin()
      const node = body('Controller', { position: [3, 0, 0] })
      node.getProxy().teleport(V(1e30, 0, 0))
      node.getProxy().move(V(1, 0, 0))
      check = () => assert.ok(Math.abs(node.position.x) < 1e6, 'the teleport is ignored')
      break
    }
    case 'Controller created at (1e30, 0, 0)': {
      origin()
      const node = new B.Controller({ radius: 0.4, height: 1, position: [1e30, 0, 0] })
      root.add(node)
      check = () => assert.equal(node.controller, null)
      break
    }
    case 'Controller remounted under a parent at 1e30': {
      const parent = new B.Node()
      root.add(parent)
      const node = new B.Controller({ radius: 0.4, height: 1 })
      parent.add(node)
      parent.position.x = 1e30
      node.radius = 0.5
      parent.clean()
      origin()
      check = () => assert.equal(node.controller, null)
      break
    }
    // (R) rigid body calls
    case 'setCenterOfMass (3e38, 0, 0)': {
      const node = body('RigidBody', { position: [0, 0, 0] })
      node.getProxy().setCenterOfMass(V(3e38, 0, 0))
      node.clean()
      touching(2.5)
      self = node
      break
    }
    case 'kinematic target with a zero quaternion, overlapping': {
      const node = body('RigidBody', { type: 'kinematic', position: [0, 0, 0] })
      touching(1.5)
      node.getProxy().setKinematicTarget(V(0, 0, 0), new B.THREE.Quaternion(0, 0, 0, 0))
      break
    }
    case 'mass 1e-8 and addForce 3e38': {
      const node = body('RigidBody', { position: [0, 0, 0], mass: 1e-8 })
      touching(2.5)
      node.getProxy().addForce(V(3e38, 0, 0), 'force')
      self = node
      break
    }
    case 'addForceAtPos 3e38 at 3e38': {
      const node = body('RigidBody', { position: [0, 0, 0] })
      touching(2.5)
      node.getProxy().addForceAtPos(V(3e38, 0, 0), V(0, 3e38, 0), 'impulse')
      self = node
      break
    }
    // meshes
    case 'geometry collider with a forged bounding box and a vertex at 3e38': {
      const geometry = mesh([0, 0, 0, 3e38, 0, 0, 0, 1, 0], [0, 1, 2])
      geometry.boundingBox = new B.THREE.Box3(V(-10, -10, -10), V(10, 10, 10))
      const { collider } = rigid('static', { type: 'geometry', geometry })
      touching()
      check = () => assert.equal(collider.shape, null)
      break
    }
    case 'geometry collider scale NaN, 1e30 and a mirrored convex': {
      const nodes = [
        [NaN, 1, 1],
        [1e30, 1, 1],
        [-1, 1, 1],
      ].map(scale => {
        const rb = new B.RigidBody({ type: 'static' })
        const collider = new B.Collider({ type: 'geometry', geometry: tetra(), convex: true })
        collider.scale.set(...scale)
        rb.add(collider)
        root.add(rb)
        return collider
      })
      touching()
      check = () =>
        assert.deepEqual(
          nodes.map(node => node.shape),
          [null, null, null]
        )
      break
    }
    case 'geometry collider without a geometry or positions': {
      const a = rigid('static', { type: 'geometry' })
      const b = rigid('static', { type: 'geometry', geometry: mesh(null, [0, 1, 2]) })
      touching()
      check = () => assert.deepEqual([a.collider.shape, b.collider.shape], [null, null])
      break
    }
    // joints
    case 'hinge limit [1e30, 1e31] degrees, spinning about the axis': {
      const { a, b } = joint({ type: 'hinge', limitMin: 1e30, limitMax: 1e31 })
      far()
      check = () => assert.ok(finitePose(a.actor) && finitePose(b.actor), 'jointed bodies finite')
      break
    }
    case 'socket with an invalid cone [0, 0]': {
      const { node, a, b } = joint({ type: 'socket', limitY: 0, limitZ: 0 })
      far()
      check = () => {
        assert.ok(node.joint, 'the joint exists without the limit')
        assert.ok(finitePose(a.actor) && finitePose(b.actor), 'jointed bodies finite')
      }
      break
    }
    case 'fixed joint with a zero frame rotation': {
      const { node, a, b } = joint({ type: 'fixed' }, node => node.quaternion0.set(0, 0, 0, 0))
      far()
      check = () => {
        assert.equal(node.joint ?? null, null)
        assert.ok(finitePose(a.actor) && finitePose(b.actor), 'jointed bodies finite')
      }
      break
    }
    // code review round 1 (Codex)
    case 'mass 0.3 and an impulse that overflows only after float32 rounding': {
      const node = body('RigidBody', { position: [0, 0, 0], mass: 0.3 })
      touching(2.5)
      node.getProxy().addForce(V(1.0208470936572454e38, 0, 0), 'impulse')
      self = node
      break
    }
    case 'four pushes of 3e38 in one step, each mode': {
      const nodes = ['force', 'impulse', 'acceleration', 'velocityChange'].map((mode, i) => {
        const node = body('RigidBody', { position: [0, 0, i * 10] })
        for (let k = 0; k < 4; k++) node.getProxy().addForce(V(3e38, 0, 0), mode)
        return node
      })
      touching(2.5)
      check = () =>
        assert.ok(
          nodes.every(node => finitePose(node.actor)),
          'every pushed body finite'
        )
      break
    }
    case 'force at a point with a far centre of mass': {
      const node = body('RigidBody', { position: [0, 0, 0] })
      node.getProxy().setCenterOfMass(V(0, 1e6, 0))
      node.clean()
      touching(2.5)
      node.getProxy().addForceAtPos(V(1e38, 0, 0), V(0, 0, 0), 'impulse')
      node.getProxy().addForceAtLocalPos(V(1e38, 0, 0), V(0, 0, 0), 'impulse')
      self = node
      break
    }
    case 'fixed joint to the world with a 3e38 offset': {
      const a = body('RigidBody', { position: [0, 0, 0] })
      const node = new B.Joint({ type: 'fixed' })
      node.body0 = a
      node.offset0.set(3e38, 0, 0)
      root.add(node)
      touching(2.5)
      self = a
      check = () => assert.equal(node.joint ?? null, null)
      break
    }
    case 'jointed bodies moved to 3e38 by setPosition, node position and kinematic target': {
      const make = (type, x) => {
        const a = body('RigidBody', { type, position: [x, 0, 0] })
        const b = body('RigidBody', { position: [x + 3, 0, 0] })
        const node = new B.Joint({ type: 'fixed' })
        node.body0 = a
        node.body1 = b
        node.offset0.set(1.5, 0, 0)
        node.offset1.set(-1.5, 0, 0)
        root.add(node)
        return { a, b }
      }
      const one = make('dynamic', 0)
      const two = make('dynamic', 20)
      const three = make('kinematic', 40)
      one.a.getProxy().setPosition(V(3e38, 0, 0))
      two.a.position.x = 3e38
      two.a.clean()
      three.a.getProxy().setKinematicTarget(V(3e38, 0, 0), new B.THREE.Quaternion())
      touching(4.5)
      check = () =>
        assert.ok(
          [one, two, three].every(({ a, b }) => finitePose(a.actor) && finitePose(b.actor)),
          'jointed bodies finite'
        )
      break
    }
    case 'dynamic mirrored cone': {
      const node = prim({ type: 'cone', size: [1, -2] })
      touching()
      check = () => assert.equal(node.actor ?? null, null)
      break
    }
    case 'collider with a zero or huge local quaternion': {
      const zero = new B.RigidBody({ type: 'static' })
      const c0 = new B.Collider({ type: 'box', width: 1, height: 1, depth: 1 })
      c0.quaternion.set(0, 0, 0, 0)
      zero.add(c0)
      root.add(zero)
      const huge = new B.RigidBody({ type: 'static', position: [0, 0, 10] })
      const c1 = new B.Collider({ type: 'box', width: 1, height: 1, depth: 1 })
      c1.quaternion.set(1e30, 0, 0, 1e30)
      huge.add(c1)
      root.add(huge)
      touching()
      check = () => {
        assert.equal(c0.shape, null, 'zero quaternion skips')
        assert.ok(c1.shape, 'a huge finite quaternion is normalised')
        const q = c1.shape.getLocalPose().q
        assert.ok(Math.abs(Math.hypot(q.x, q.y, q.z, q.w) - 1) < 1e-5, 'unit local rotation')
      }
      break
    }
    case 'visible prims with a float32-overflowing ratio or a sparse size': {
      const torus = new B.Prim({ type: 'torus', size: [1e-6, 1e38], physics: 'dynamic' })
      root.add(torus)
      assert.throws(() => new B.Prim({ type: 'box', size: new Array(3) }), /size must be an array of finite numbers/)
      touching()
      check = () => assert.deepEqual([torus.handle ?? null, torus.actor ?? null], [null, null])
      break
    }
    // fix-diff round 2 (Codex)
    case 'a tiny force at a far local point on a rotated body': {
      const node = body('RigidBody', { position: [0, 0, 0] })
      node.getProxy().setQuaternion(new B.THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.PI / 4))
      touching(2.5)
      node.getProxy().addForceAtLocalPos(V(0, 1e-35, 0), V(3e38, 0, 0), 'impulse')
      self = node
      break
    }
    default:
      throw new Error(`unknown case ${name}`)
  }
  step(120)
  assert.ok(finitePose(bystander.actor), `${name}: the bystander stays finite`)
  if (self) assert.ok(finitePose(self.actor), `${name}: the body itself stays finite`)
  check()
}

for (const name of [
  'Collider sphere radius 1e30, static',
  'Collider sphere radius 1e30, dynamic',
  'Collider box width 2e30, dynamic',
  'Collider sphere radius 1e-9 and 0',
  'Prim box size 1e30, dynamic',
  'Prim torus [1, 1e18], dynamic',
  'Prim box under a NaN node scale',
  'RigidBody mass 1e-40 hit by a body',
  'Prim mass 1e-40 hit by a body',
  'Controller teleport (1e30, 0, 0) and a move',
  'Controller created at (1e30, 0, 0)',
  'Controller remounted under a parent at 1e30',
  'setCenterOfMass (3e38, 0, 0)',
  'kinematic target with a zero quaternion, overlapping',
  'mass 1e-8 and addForce 3e38',
  'addForceAtPos 3e38 at 3e38',
  'geometry collider with a forged bounding box and a vertex at 3e38',
  'geometry collider scale NaN, 1e30 and a mirrored convex',
  'geometry collider without a geometry or positions',
  'hinge limit [1e30, 1e31] degrees, spinning about the axis',
  'socket with an invalid cone [0, 0]',
  'fixed joint with a zero frame rotation',
  'mass 0.3 and an impulse that overflows only after float32 rounding',
  'four pushes of 3e38 in one step, each mode',
  'force at a point with a far centre of mass',
  'fixed joint to the world with a 3e38 offset',
  'jointed bodies moved to 3e38 by setPosition, node position and kinematic target',
  'dynamic mirrored cone',
  'collider with a zero or huge local quaternion',
  'visible prims with a float32-overflowing ratio or a sparse size',
  'a tiny force at a far local point on a rotated body',
]) {
  probe(`real PhysX inputs: ${name}`, hostile, name)
}

// positive control: the hazard exists in this wasm when a value bypasses the node checks. (A raw Infinity-radius
// sphere does not spread NaN in this build: measured in .notes/phase3b2/measure/m2.)
probe(
  'real PhysX inputs: control: a raw controller foot at 1e30 turns a bystander at the origin NaN',
  ({ B, PHYSX, step, body }) => {
    const bystander = body('RigidBody', { position: [0, 0, 0] })
    bystander.getProxy().setLinearVelocity(new B.THREE.Vector3(1, 0, 0))
    const node = body('Controller', { position: [3, 0, 0] })
    const foot = new PHYSX.PxExtendedVec3(1e30, 0, 0)
    node.controller.setFootPosition(foot)
    PHYSX.destroy(foot)
    step(120)
    const p = bystander.actor.getGlobalPose().p
    assert.ok(![p.x, p.y, p.z].every(Number.isFinite), 'the raw far controller poisons the bystander')
  }
)

function legit({ B, root, step }) {
  const V = (x, y, z) => new B.THREE.Vector3(x, y, z)
  const bounds = actor => {
    const b = actor.getWorldBounds()
    return [b.maximum.x - b.minimum.x, b.maximum.y - b.minimum.y, b.maximum.z - b.minimum.z]
  }
  const near = (actual, expected, message) =>
    assert.ok(
      actual.every((value, i) => Math.abs(value - expected[i]) < 0.05 * Math.max(1, expected[i])),
      `${message}: ${actual} vs ${expected}`
    )
  const rigid = (colliderData, scale) => {
    const rb = new B.RigidBody({ type: 'static' })
    const collider = new B.Collider(colliderData)
    if (scale) collider.scale.set(...scale)
    rb.add(collider)
    root.add(rb)
    return { rb, collider }
  }
  // collider box and sphere keep their sizes
  const box = rigid({ type: 'box', width: 2, height: 3, depth: 1 })
  near(bounds(box.rb.actor), [2, 3, 1], 'collider box')
  const sphere = rigid({ type: 'sphere', radius: 10 })
  near(bounds(sphere.rb.actor), [20, 20, 20], 'collider sphere')
  // the bounds themselves are inside the window
  const tiny = rigid({ type: 'sphere', radius: 1e-6 })
  assert.ok(tiny.collider.shape, 'radius 1e-6 is inside the window')
  // a triangle mesh mirrored on the collider node's own axis keeps its physics
  const geometry = new B.THREE.BufferGeometry()
  geometry.setAttribute('position', new B.THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], 3))
  geometry.setIndex([0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3])
  const mirrored = rigid({ type: 'geometry', geometry }, [-1, 1, 1])
  assert.ok(mirrored.collider.shape, 'mirrored triangle mesh')
  // prims: mirrored box, one-ended cylinder, flat plane, sphere under a non-uniform scale (convex path)
  const prim = data => {
    const node = new B.Prim({ opacity: 0, physics: 'static', ...data })
    root.add(node)
    assert.ok(node.actor, `${data.type} ${JSON.stringify(data.size)} has physics`)
    return node
  }
  near(bounds(prim({ type: 'box', size: [-2, 1, 3] }).actor), [2, 1, 3], 'mirrored prim box')
  near(bounds(prim({ type: 'cylinder', size: [0, 0.5, 1] }).actor), [1, 1, 1], 'one-ended cylinder')
  prim({ type: 'plane', size: [2, 3] })
  const oval = new B.Prim({ opacity: 0, physics: 'static', type: 'sphere', size: [1] })
  oval.scale.set(1, 2, 1)
  root.add(oval)
  near(bounds(oval.actor), [2, 4, 2], 'sphere under a non-uniform scale')
  // prim configs that divide by zero or lack values skip without throwing
  for (const size of [
    [0, 0, 1],
    [1, 1],
  ]) {
    const node = new B.Prim({ opacity: 0, physics: 'static', type: 'cylinder', size })
    root.add(node)
    assert.equal(node.actor ?? null, null, `cylinder ${size} skips`)
  }
  const ring = new B.Prim({ opacity: 0, physics: 'static', type: 'torus', size: [0, 0.2] })
  root.add(ring)
  assert.equal(ring.actor ?? null, null, 'torus with radius 0 skips')
  step(10)
}
probe('real PhysX inputs: legitimate sizes keep their physics', legit)

probe('real PhysX inputs: setters refuse values that never mean anything and accept zero', ({ B }) => {
  const bad = [NaN, Infinity, -Infinity, '1']
  const refuses = (make, field, values = bad) => {
    for (const value of values) {
      const node = make()
      assert.throws(() => (node[field] = value), undefined, `${field} = ${String(value)}`)
    }
  }
  const collider = () => new B.Collider()
  for (const field of ['width', 'height', 'depth', 'radius', 'staticFriction', 'dynamicFriction', 'restitution']) {
    refuses(collider, field, [...bad, -1])
    const node = collider()
    node[field] = 0
  }
  const rb = () => new B.RigidBody()
  refuses(rb, 'mass', [...bad, -1, 1e-40, 1e-10])
  for (const value of [0, 1e-9, 1e12]) rb().mass = value
  refuses(rb, 'linearDamping')
  refuses(rb, 'angularDamping')
  const prim = () => new B.Prim()
  refuses(prim, 'mass', [...bad, 0, 1e-40])
  refuses(prim, 'staticFriction')
  refuses(prim, 'restitution')
  refuses(prim, 'linearDamping')
  refuses(prim, 'size', [
    [NaN, 1, 1],
    [1, Infinity, 1],
    ['1', 1, 1],
  ])
  refuses(prim, 'layer', ['bogus'])
  assert.throws(() => (new B.Prim().getProxy().layer = 'player'), /layer invalid: player/)
  const controller = () => new B.Controller()
  refuses(controller, 'radius')
  refuses(controller, 'height')
  controller().radius = 0
})

probe(
  'real PhysX inputs: a skipped collider does not re-cook on moves and mounts once its value is fixed',
  ({ B, root }) => {
    // a mesh that cooks but is larger than the window: one attempt, then skipped (each attempt cooks it again, because
    // the skip releases the cooked mesh)
    const geometry = new B.THREE.BufferGeometry()
    geometry.setAttribute('position', new B.THREE.Float32BufferAttribute([0, 0, 0, 2e6, 0, 0, 0, 1, 0, 0, 0, 1], 3))
    const rb = new B.RigidBody({ type: 'static' })
    const big = new B.Collider({ type: 'geometry', geometry, convex: true })
    let mounts = 0
    const mount = big.mount
    big.mount = function () {
      mounts++
      return mount.call(this)
    }
    rb.add(big)
    root.add(rb)
    assert.equal(big.shape, null)
    assert.equal(mounts, 1)
    for (let i = 0; i < 5; i++) {
      rb.position.x += 1
      rb.clean()
    }
    assert.equal(mounts, 1, 'moves do not retry a skipped collider')
    // a zero radius is skipped, and setting a usable radius from the script mounts it
    const sphere = new B.Collider({ type: 'sphere', radius: 0 })
    rb.add(sphere)
    assert.equal(sphere.shape, null)
    sphere.radius = 1
    sphere.clean()
    assert.ok(sphere.shape, 'the fixed radius mounts')
  }
)

probe('real PhysX inputs: distance joint limits apply only the ends that are set', ({ B, root, step, body }) => {
  const separation = data => {
    const a = body('RigidBody', { position: [0, 0, 0] })
    const b = body('RigidBody', { position: [3, 0, 0] })
    const node = new B.Joint({ type: 'distance', ...data })
    node.body0 = a
    node.body1 = b
    root.add(node)
    step(60)
    // getGlobalPose returns one shared temporary, so copy each position before the next call
    const at = node => {
      const { x, y, z } = node.actor.getGlobalPose().p
      return { x, y, z }
    }
    const pa = at(a)
    const pb = at(b)
    const d = Math.hypot(pb.x - pa.x, pb.y - pa.y, pb.z - pa.z)
    root.remove(node)
    root.remove(a)
    root.remove(b)
    return d
  }
  // a new PhysX distance joint enables the max limit at 0; it must not pull the bodies together
  assert.ok(separation({ limitMin: 2 }) > 2.5, 'min only: the bodies stay apart')
  assert.ok(separation({}) > 2.5, 'no limits: no constraint')
  assert.ok(separation({ limitMin: 5, limitMax: 1 }) > 2.5, 'reversed limits are skipped')
  assert.ok(separation({ limitMax: 1 }) < 1.2, 'max only: the bodies are pulled within it')
})

probe('real PhysX inputs: the push budget sums every push in a step and starts over after it', ({ B, step, body }) => {
  const V = (x, y, z) => new B.THREE.Vector3(x, y, z)
  // copy at once: getLinearVelocity returns a shared temporary
  const speed = node => {
    const { x, y, z } = node.actor.getLinearVelocity()
    return Math.hypot(x, y, z)
  }
  const node = body('RigidBody', { position: [0, 0, 0], linearDamping: 0, angularDamping: 0 })
  const proxy = node.getProxy()
  // three velocity changes of 4e5 m/s: each inside the 1e6 budget, the third would take the sum above it
  for (let i = 0; i < 3; i++) proxy.addForce(V(4e5, 0, 0), 'velocityChange')
  step(1)
  const first = speed(node)
  assert.ok(first > 7e5 && first < 9e5, `two of the three pushes applied: ${first}`)
  // the next step has a fresh budget
  proxy.addForce(V(-4e5, 0, 0), 'velocityChange')
  step(1)
  const second = speed(node)
  assert.ok(second > 3e5 && second < 5e5, `the push after the step applied: ${second}`)
})

probe(
  'real PhysX inputs: a force at a point counts the centre-of-mass lever toward the angular budget',
  ({ B, step, body }) => {
    const V = (x, y, z) => new B.THREE.Vector3(x, y, z)
    const spin = node => {
      const { x, y, z } = node.actor.getAngularVelocity()
      return Math.hypot(x, y, z)
    }
    for (const [i, method] of ['addForceAtPos', 'addForceAtLocalPos'].entries()) {
      const node = body('RigidBody', { position: [i * 50, 0, 0], linearDamping: 0, angularDamping: 0 })
      node.getProxy().setCenterOfMass(V(0, 1e6, 0))
      node.clean()
      // 1e5 N·s is inside the linear budget; with the centre of mass 1e6 m away the torque is 1e11, far above it
      // at the body's own origin: the ordinary lever is 0, so only the centre-of-mass offset can exceed the budget
      node.getProxy()[method](V(1e5, 0, 0), method === 'addForceAtPos' ? V(i * 50, 0, 0) : V(0, 0, 0), 'impulse')
      step(1)
      assert.equal(spin(node), 0, `${method}: the push is ignored`)
    }
  }
)

probe(
  'real PhysX inputs: a push from a callback dispatched before the step shares the step budget',
  ({ B, root, step, body }) => {
    const V = (x, y, z) => new B.THREE.Vector3(x, y, z)
    const speed = node => {
      const { x, y, z } = node.actor.getLinearVelocity()
      return Math.hypot(x, y, z)
    }
    const a = body('RigidBody', { position: [0, 0, 0], linearDamping: 0, angularDamping: 0 })
    const b = body('RigidBody', { position: [1.9, 0, 0] })
    const proxy = a.getProxy()
    a.onContactStart = () => {}
    a.onContactEnd = () => proxy.addForce(V(0, 4e5, 0), 'velocityChange')
    step(1) // the boxes overlap, so the contact starts
    proxy.setLinearVelocity(V(0, 0, 0))
    proxy.addForce(V(0, 4e5, 0), 'velocityChange')
    proxy.addForce(V(0, 4e5, 0), 'velocityChange')
    // removing b queues a's contact end, dispatched at the start of the next step, before simulate
    root.remove(b)
    step(1)
    const v = speed(a)
    assert.ok(v > 7e5 && v < 9e5, `the callback's push exceeds the shared budget and is ignored: ${v}`)
  }
)

probe('real PhysX inputs: a tiny force at a far world point is ignored', ({ B, step, body }) => {
  const node = body('RigidBody', { position: [0, 0, 0], linearDamping: 0, angularDamping: 0 })
  node.getProxy().addForceAtPos(new B.THREE.Vector3(0, 1e-3, 0), new B.THREE.Vector3(2e6, 0, 0), 'impulse')
  step(1)
  const { x, y, z } = node.actor.getAngularVelocity()
  assert.equal(Math.hypot(x, y, z), 0)
})
