// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/physicsAvailability.test.js
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { bundleRealPhysx, runRealPhysx } from './lib/realPhysx.mjs'

let bundle
before(async () => {
  bundle = await bundleRealPhysx()
})
after(() => bundle?.destroy())
const probe = (name, fn, args) => test(name, () => runRealPhysx(bundle, fn, args))

for (const method of ['getVelocityAtPos', 'getLocalVelocityAtLocalPos', 'addForceAtPos', 'addForceAtLocalPos']) {
  probe(
    `real PhysX: static ${method} survives 2000 calls and pending type changes`,
    ({ B, body, healthy }, method) => {
      const node = body('RigidBody', { type: 'static' })
      const proxy = node.getProxy()
      const value = new B.THREE.Vector3(1, 2, 3)
      node.type = 'dynamic' // the old static actor remains live until the dirty commit
      for (let i = 0; i < 2000; i++) {
        const result = proxy[method](value, new B.THREE.Vector3(9, 9, 9))
        if (method.startsWith('get')) assert.deepEqual([result.x, result.y, result.z], [0, 0, 0])
      }
      const dynamic = body('RigidBody', { type: 'dynamic', position: [10, 0, 0] })
      dynamic.type = 'static'
      dynamic.getProxy().setLinearVelocity(value)
      if (method.startsWith('get')) {
        const result = dynamic.getProxy()[method](new B.THREE.Vector3())
        assert.deepEqual([result.x, result.y, result.z], [1, 2, 3])
      }
      healthy()
    },
    method
  )
}

probe('real PhysX: inactive and incompatible actors never touch node scratch', ({ B, body, root, healthy }) => {
  const p = new B.THREE.Vector3()
  const q = new B.THREE.Quaternion()
  const node = new B.RigidBody({ type: 'kinematic' })
  const forbidden = new Proxy(
    {},
    {
      get() {
        assert.fail('inactive scratch accessed')
      },
    }
  )
  node._tm = forbidden
  node.getProxy().setKinematicTarget(p, q)
  const staticNode = body('RigidBody', { type: 'static' })
  staticNode.type = 'kinematic'
  staticNode._tm = forbidden
  staticNode._pv1 = forbidden
  staticNode._pv2 = forbidden
  staticNode.getProxy().setKinematicTarget(p, q)
  staticNode.getProxy().addForceAtPos(p, p)
  staticNode.getProxy().addForceAtLocalPos(p, p)
  const mounted = body('RigidBody', { type: 'kinematic', position: [20, 0, 0] })
  mounted.getProxy().setKinematicTarget(p, q)
  root.remove(mounted)
  mounted._tm = forbidden
  mounted.getProxy().setKinematicTarget(p, q)
  healthy()
})

probe(
  'real PhysX: positive invalid controller descriptors skip creation and teleport keeps position',
  ({ B, root, physics, healthy }) => {
    const create = physics.controllerManager.createController.bind(physics.controllerManager)
    let creates = 0
    physics.controllerManager.createController = desc => {
      creates++
      return create(desc)
    }
    const node = new B.Controller({ radius: 0.01, height: 0.01 })
    root.add(node)
    assert.equal(creates, 0, 'desc.isValid must reject before creation')
    assert.equal(node.controller, null)
    node.getProxy().move(new B.THREE.Vector3(1, 2, 3))
    node.getProxy().teleport(new B.THREE.Vector3(4, 5, 6))
    assert.deepEqual(node.position.toArray(), [4, 5, 6])
    root.remove(node)
    healthy()
  }
)

probe('real PhysX: zero controller pointer never receives setup, move or release', ({ B, root, physics, healthy }) => {
  const create = physics.controllerManager.createController
  physics.controllerManager.createController = () =>
    new Proxy(
      { ptr: 0 },
      {
        get(target, key) {
          if (key !== 'ptr') assert.fail(`zero pointer used: ${key}`)
          return target[key]
        },
      }
    )
  const node = new B.Controller({ radius: 0.3, height: 1.2 })
  root.add(node)
  assert.equal(node.controller, null)
  node.getProxy().move(new B.THREE.Vector3())
  node.getProxy().teleport(new B.THREE.Vector3(7, 8, 9))
  root.remove(node)
  physics.controllerManager.createController = create
  healthy()
})

for (const caught of [true, false]) {
  probe(
    `real PhysX: ${caught ? 'caught' : 'uncaught'} script trap latches once during crash rebuild`,
    async ({ B, world, body, healthy }, caught) => {
      const glb = { toNodes: () => new B.Node() }
      let resolveCrash
      const crashAsset = new Promise(resolve => {
        resolveCrash = resolve
      })
      world.loader = {
        get: (type, url) => (url === 'asset://crash-block.glb' ? null : glb),
        load: () => crashAsset,
      }
      const app = new B.App(world, { id: 'trapping', blueprint: 'bp' })
      const node = body('RigidBody', {}, app.root)
      let nativeCalls = 0
      node.actor.addForce = () => {
        nativeCalls++
        throw new WebAssembly.RuntimeError('injected')
      }
      const proxy = node.getProxy()
      const force = new B.THREE.Vector3(1, 0, 0)
      let updates = 0
      app.script = {}
      app.on('fixedUpdate', () => {
        updates++
        if (caught) {
          try {
            proxy.addForce(force)
          } catch {
            /* the script catches the converted trap */
          }
        } else proxy.addForce(force)
      })
      app.setTimeout(() => assert.fail('latched timer ran'), 0)
      let builds = 0
      const build = app.build.bind(app)
      app.build = (...args) => {
        builds++
        return build(...args)
      }
      app.fixedUpdate(1 / 60)
      assert.equal(app.crashed, true, 'latch is synchronous even if script catches')
      assert.equal(app.timers.size, 0)
      assert.equal(builds, 0, 'no rebuild on the failing stack')
      assert.throws(() => proxy.addForce(force), /disabled/)
      assert.equal(nativeCalls, 1)
      await Promise.resolve()
      assert.equal(builds, 1)
      app.fixedUpdate(1 / 60)
      app.emit('fixedUpdate', 1 / 60)
      assert.equal(updates, 1, 'old handlers cannot run while assets are pending')
      app.crash()
      assert.equal(builds, 1)
      healthy()
      resolveCrash(glb)
      await Promise.resolve()
      await Promise.resolve()
      assert.equal(app.crashed, true, 'crash presentation keeps the latch')
      assert.equal(builds, 1, 'App catch and failure handler cannot double crash')
    },
    caught
  )
}

probe(
  'real PhysX: probe detects a genuinely bricked module and flushes before exit',
  async ({ B, physics, world, body, PHYSX }) => {
    const node = body('RigidBody', { type: 'static' })
    const vector = new PHYSX.PxVec3(1, 0, 0)
    let traps = 0
    for (let i = 0; i < 1000; i++) {
      try {
        // HEAD-style raw call intentionally bypasses the new actor guard.
        PHYSX.PxRigidBodyExt.prototype.addForceAtLocalPos(
          node.actor,
          vector,
          vector,
          PHYSX.PxForceModeEnum.eFORCE,
          true
        )
      } catch (err) {
        assert.ok(err instanceof WebAssembly.RuntimeError)
        traps++
      }
    }
    assert.ok(traps > 400)
    assert.throws(() => new PHYSX.PxVec3(), WebAssembly.RuntimeError, 'module is really bricked')
    const calls = []
    world.server = { destroy: () => calls.push('stop') }
    world.network.stopForFatal = () => calls.push('refuse')
    let finishSave
    world.network.flushBeforeExit = ms => {
      assert.equal(ms, 5000)
      calls.push('flush')
      return new Promise(resolve => {
        finishSave = resolve
      })
    }
    world.fatal = B.World.prototype.fatal
    process.exit = code => calls.push(`exit:${code}`)
    physics.recordCallbackFailure(new WebAssembly.RuntimeError(), 'raw regression')
    physics.drainCallbackFailures()
    physics.preTick()
    assert.ok(world.fatalError)
    assert.deepEqual(calls, ['stop', 'refuse', 'flush'])
    physics.postFixedUpdate(1 / 60)
    world.fatal('again')
    finishSave()
    await world.fatalPromise
    assert.deepEqual(calls, ['stop', 'refuse', 'flush', 'exit:1'])
  }
)

for (const boundary of ['cooking', 'collider', 'prim']) {
  probe(
    `real PhysX: ${boundary} swallowing classifies the native trap first`,
    async ({ B, root, entity, physics, PHYSX }, boundary) => {
      let crashes = 0
      entity.crash = () => {
        entity.crashed = true
        crashes++
      }
      const fail = () => {
        throw new WebAssembly.RuntimeError('injected mount failure')
      }
      if (boundary === 'cooking')
        PHYSX.PxConvexMeshDesc = class {
          constructor() {
            fail()
          }
        }
      if (boundary === 'collider') physics.physics.createShape = fail
      if (boundary === 'prim') physics.physics.createRigidDynamic = fail
      const node =
        boundary === 'collider'
          ? new B.RigidBody({ type: 'static' })
          : new B.Prim({ type: boundary === 'cooking' ? 'cylinder' : 'box', physics: 'dynamic', opacity: 0 })
      if (boundary === 'collider') node.add(new B.Collider())
      root.add(node)
      await Promise.resolve()
      assert.equal(entity.crashed, true)
      assert.equal(crashes, 1)
      assert.equal(physics.needsProbe, true)
    },
    boundary
  )
}

probe(
  'real PhysX: probe is script-free and performs a successful fetch and vector lifetime',
  ({ physics, PHYSX, callbacks }) => {
    let callbacksRun = 0,
      allocations = 0,
      destructions = 0,
      fetches = 0
    callbacks.simulation.onContact = () => callbacksRun++
    const Vec3 = PHYSX.PxVec3
    const destroy = PHYSX.destroy
    let vector
    PHYSX.PxVec3 = new Proxy(Vec3, {
      construct(target, args) {
        allocations++
        vector = Reflect.construct(target, args)
        return vector
      },
    })
    PHYSX.destroy = value => {
      if (value === vector) destructions++
      return destroy(value)
    }
    const fetch = physics.probeScene.fetchResults.bind(physics.probeScene)
    physics.probeScene.fetchResults = wait => {
      assert.equal(wait, true)
      fetches++
      return fetch(wait)
    }
    for (let i = 0; i < 100; i++) assert.equal(physics.probe(), true)
    assert.equal(callbacksRun, 0)
    assert.equal(fetches, 100)
    assert.equal(allocations, 100)
    assert.equal(destructions, 100)
  }
)
