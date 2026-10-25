// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/physicsReview.test.js
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { bundleRealPhysx, runRealPhysx } from './lib/realPhysx.mjs'

let bundle, B
before(async () => {
  globalThis.self = { postMessage() {} }
  bundle = await bundleRealPhysx()
  B = await import(bundle.url)
})
after(() => bundle?.destroy())

function appFixture() {
  const world = new B.World()
  world.network = { id: 0, isServer: true, asScript: fn => fn(), send() {} }
  const blueprint = { id: 'bp', version: 0, model: 'cached.glb', scene: true }
  world.blueprints.get = () => blueprint
  const glb = { toNodes: () => new B.Node() }
  world.loader = { get: () => glb }
  const app = new B.App(world, { id: 'app', blueprint: 'bp' })
  return { app, world, blueprint, glb }
}

for (const method of ['onContactStart', 'onContactEnd', 'onTriggerEnter', 'onTriggerLeave']) {
  test(`I1: ${method} logs the error and stack once per run`, { timeout: 30000 }, () =>
    runRealPhysx(
      bundle,
      ({ body, move, step, entity, physics, B, healthy }, method) => {
        const logs = []
        console.error = (...args) => logs.push(args)
        const error = new ReferenceError('missing callback variable')
        const node = body('RigidBody', {
          type: 'static',
          trigger: method.startsWith('onTrigger'),
          [method]: () => {
            throw error
          },
        })
        const moving = body('RigidBody', { position: [1.5, 0, 0] })
        const cycle = () => {
          move(moving, 1.5)
          step()
          move(moving, 10)
          step()
        }
        for (let i = 0; i < 3; i++) cycle()
        assert.equal(logs.length, 1)
        assert.match(logs[0][0], new RegExp(method))
        assert.match(logs[0][0], /entity app/)
        assert.match(logs[0][0], /missing callback variable/)
        assert.equal(logs[0][1], error)
        assert.match(logs[0][1].stack, /ReferenceError: missing callback variable/)
        // The real App cleanup replaces the run identity, even on the same entity.
        entity.world = { setHot() {} }
        entity.emit = () => {}
        entity.playerProxies = new Map()
        entity.worldNodes = new Set()
        entity.clearEventListeners = () => {}
        entity.timers = { clear() {} }
        B.App.prototype.unbuild.call(entity)
        cycle()
        assert.equal(logs.length, 2, 'a rebuilt app can report its next callback error')
        const trap = new WebAssembly.RuntimeError('private trap details')
        entity.crash = () => {
          entity.crashed = true
        }
        node[method] = () => {
          throw trap
        }
        cycle()
        assert.equal(logs.length, 3)
        assert.equal(logs[2].length, 1, 'native traps retain metadata-only logging')
        assert.ok(!logs[2][0].includes('private trap details'))
        assert.equal(physics.callbackFailures.length, 0)
        healthy()
      },
      method
    )
  )
}

test('I2: 60 seconds of throwing World ticks recover with bounded fixed steps', () => {
  const world = new B.World()
  world.systems = []
  let failing = true
  let steps = 0
  world.fixedUpdate = () => {
    steps++
    if (failing) throw new Error('transient')
  }
  for (let i = 1; i <= 1800; i++) assert.throws(() => world.tick((i * 1000) / 30), /transient/)
  failing = false
  steps = 0
  world.tick(61000)
  const limit = Math.ceil((world.maxDeltaTime + world.fixedDeltaTime) / world.fixedDeltaTime)
  assert.ok(steps > 0 && steps <= limit, `recovery ran ${steps} fixed steps; limit ${limit}`)
  for (let i = 1; i <= 100; i++) {
    steps = 0
    world.tick(61000 + i * 1000)
    assert.ok(steps <= limit, 'slow ticks also stay bounded')
  }
})

test('I2/N7: Server catches reset accumulated debt and log stacks once per bounded message', t => {
  t.mock.method(globalThis, 'setTimeout', () => 1)
  t.mock.method(globalThis, 'clearTimeout', () => {})
  const logs = []
  t.mock.method(console, 'error', (...args) => logs.push(args))
  let error
  const world = {
    accumulator: 60,
    tick: () => {
      throw error
    },
  }
  const server = new B.Server(world)
  server.running = true
  for (let i = 0; i < 100; i++) {
    error = new Error(`tick failure ${i}`)
    server.tick()
    server.tick()
  }
  assert.equal(logs.length, 32)
  assert.match(logs[0][1]?.stack || '', /Error: tick failure 0/)
  assert.match(logs[31][1]?.stack || '', /Error: tick failure 31/)
  assert.equal(world.accumulator, 0)
  server.destroy()
})

test('I3: world subscriptions are keyed by callback and name and all cleared on cleanup', () => {
  const { app, world } = appFixture()
  const seen = []
  const f = value => seen.push(value)
  const proxy = app.getWorldProxy()
  proxy.on('enter', f)
  proxy.on('leave', f)
  world.events.emit('enter', 'enter-a')
  proxy.off('enter', f)
  world.events.emit('enter', 'enter')
  world.events.emit('leave', 'leave')
  assert.deepEqual(seen, ['enter-a', 'leave'])
  proxy.on('enter', f)
  app.clearEventListeners()
  assert.equal(world.events.listenerCount('enter'), 0)
  assert.equal(world.events.listenerCount('leave'), 0)
})

for (const native of [false, true]) {
  test(`I4: ${native ? 'native' : 'ordinary'} crash permits destroy cleanup but blocks native calls`, async t => {
    t.mock.method(console, 'error', () => {})
    const { app, world, blueprint, glb } = appFixture()
    const proxy = app.getWorldProxy()
    const pApp = app.getAppProxy()
    const node = new B.Node()
    proxy.add(node.getProxy())
    const f = () => {}
    proxy.on('enter', f)
    let sent = 0
    world.network.send = () => sent++
    let cleanup = 0
    const stopped = native ? /\[physics\] disabled.*native failure/ : /\[app\] this app has stopped/
    app.on('destroy', () => {
      assert.equal(proxy.isServer, true)
      pApp.send('reset')
      proxy.off('enter', f)
      proxy.remove(node.getProxy())
      assert.equal(node.mounted, false)
      assert.throws(() => proxy.raycast(), stopped)
      assert.throws(() => proxy.overlapSphere(), stopped)
      assert.throws(() => pApp.create('rigidbody'), stopped)
      assert.throws(
        () => B.callForScript(() => assert.fail('native work'), { ctx: { entity: app, world } }, []),
        stopped
      )
      cleanup++
    })
    app.on('destroy', () => cleanup++)
    if (native) B.handlePhysicsFailure(new WebAssembly.RuntimeError('native'), { entity: app })
    else app.crash()
    assert.throws(() => proxy.isServer, stopped)
    await Promise.resolve()
    assert.equal(cleanup, 2)
    assert.equal(sent, 1)
    assert.equal(world.events.listenerCount('enter'), 0)
    assert.equal(app.worldNodes.size, 0)
    assert.throws(() => pApp.send('late'), stopped)
    // Recovery resets the cause as well as the latch.
    blueprint.script = 'new.js'
    world.loader.get = type => (type === 'script' ? { exec() {} } : glb)
    await app.build()
    app.crash()
    assert.throws(() => proxy.isServer, /\[app\] this app has stopped/)
    await Promise.resolve()
  })
}

test('N6: a replacement mount trap on an already-crashed app clears building and admits no script', async t => {
  t.mock.method(console, 'error', () => {})
  const { app, world, blueprint, glb } = appFixture()
  app.crash()
  await Promise.resolve()
  let runs = 0
  blueprint.script = 'new.js'
  world.loader.get = type =>
    type === 'script'
      ? { exec: () => runs++ }
      : {
          toNodes() {
            const node = new B.Node()
            node.mount = () => B.handlePhysicsFailure(new WebAssembly.RuntimeError('mount'), { entity: app })
            return node
          },
        }
  await app.build()
  assert.equal(app.building, false)
  assert.equal(app.crashed, true)
  assert.equal(runs, 0)
  world.loader.get = type => (type === 'script' ? { exec: () => runs++ } : glb)
  await app.build()
  assert.equal(app.building, false)
  assert.equal(app.crashed, false)
  assert.equal(runs, 1)
})
