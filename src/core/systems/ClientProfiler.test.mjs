import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { writeFile, mkdir } from 'node:fs/promises'
import * as THREE from 'three'

const bundle = await build({
  stdin: {
    contents: `export { ClientProfiler } from './src/core/systems/ClientProfiler'; export { App } from './src/core/entities/App'; export { Apps } from './src/core/systems/Apps'; export { ClientNetwork } from './src/core/systems/ClientNetwork';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
await mkdir('build', { recursive: true })
await writeFile('build/profiler-test-bundle.mjs', bundle.outputFiles[0].contents)
const { ClientProfiler, App, Apps, ClientNetwork } = await import('../../../build/profiler-test-bundle.mjs')
const { default: EventEmitter } = await import('eventemitter3')

function fixture() {
  const world = new EventEmitter()
  world.settings = new EventEmitter()
  let admin = true
  world.entities = { player: { isAdmin: () => admin }, items: new Map() }
  world.stage = {
    scene: new THREE.Scene(),
    octree: { root: { items: [], children: [] } },
    insertRaycastObject(item) {
      this.hit = item
      return {
        destroy: () => {
          this.hit = null
        },
      }
    },
  }
  world.physics = { handles: new Map(), active: new Set() }
  world.events = new EventEmitter()
  const profiler = (world.profiler = new ClientProfiler(world))
  profiler.start()
  function app(id, position = [0, 0, 0]) {
    const root = {
      matrixWorld: new THREE.Matrix4().makeTranslation(...position),
      traverse(fn) {
        fn(this)
      },
    }
    const entity = { isApp: true, data: { id }, blueprint: { name: id }, root, worldNodes: new Set() }
    world.entities.items.set(id, entity)
    return entity
  }
  return {
    world,
    profiler,
    app,
    setAdmin: value => {
      admin = value
    },
  }
}

test('off mode is inert; permissions, role loss and disconnect dispose every orb resource', () => {
  const { world, profiler, app, setAdmin } = fixture()
  app('a')
  profiler.measure('a', 'update', () => 2)
  profiler.network('entityEvent', ['a'], 80, true)
  profiler.postTick()
  assert.equal(profiler.pending.size, 0)
  assert.equal(world.stage.scene.children.length, 0)
  setAdmin(false)
  assert.equal(profiler.toggle(true), false)
  setAdmin(true)
  profiler.toggle(true)
  profiler.sample(1)
  assert.equal(world.stage.scene.children.length, 1)
  const mesh = profiler.overlay.mesh
  let disposed = 0
  mesh.geometry.addEventListener('dispose', () => disposed++)
  mesh.material.addEventListener('dispose', () => disposed++)
  setAdmin(false)
  world.emit('rank', {})
  assert.equal(profiler.active, false)
  assert.equal(disposed, 2)
  assert.equal(world.stage.hit, null)
  assert.equal(world.stage.scene.children.length, 0)
  setAdmin(true)
  profiler.toggle(true)
  world.emit('disconnect')
  assert.equal(profiler.active, false)
  profiler.destroy()
  assert.equal(world.listenerCount('rank'), 0)
})

test('nested event timing is exclusive, preserves returns/errors and resets across sessions', t => {
  const { profiler, app } = fixture()
  app('a')
  app('b')
  let now = 0
  t.mock.method(performance, 'now', () => now)
  profiler.toggle(true)
  assert.equal(
    profiler.measure('a', 'update', () => {
      now += 2
      profiler.measure('b', 'event', () => {
        now += 5
      })
      now += 3
      return 42
    }),
    42
  )
  assert.equal(profiler.pending.get('a').cpu, 5)
  assert.equal(profiler.pending.get('b').cpu, 5)
  assert.throws(
    () =>
      profiler.measure('a', 'bad', () => {
        now += 4
        throw new Error('expected')
      }),
    /expected/
  )
  assert.equal(profiler.pending.get('a').peak, 5)
  profiler.sample(0.5)
  assert.equal(profiler.rows.find(row => row.id === 'a').cpu, 18)
  assert.equal(profiler.rows.find(row => row.id === 'b').cpu, 10)
  profiler.measure('a', 'switch', () => {
    profiler.toggle(false)
    profiler.toggle(true)
    now += 100
  })
  assert.equal(profiler.pending.size, 0)
  profiler.destroy()
})

test('shared geometry is counted per mounted instance, detached nodes aggregate to their app and markers select instance IDs', () => {
  const { world, profiler, app } = fixture()
  const a = app('a'),
    b = app('b', [10, 1, 0])
  const geometry = new THREE.BoxGeometry(2, 2, 2)
  const material = { uuid: 'shared' }
  const item = (entity, x) => ({
    node: { ctx: { entity } },
    geometry,
    material,
    matrix: new THREE.Matrix4().makeTranslation(x, 0, 0),
  })
  world.stage.octree.root.items.push(item(a, 0), item(a, 2), item(b, 10))
  const light = {
    mounted: true,
    light: { castShadow: true },
    traverse(fn) {
      fn(this)
    },
  }
  a.worldNodes.add(light)
  const handle = { node: { ctx: { entity: a } }, actor: { getNbShapes: () => 2 }, contactedHandles: new Set([{}]) }
  world.physics.handles.set(1, handle)
  world.physics.active.add(handle)
  profiler.toggle(true)
  profiler.sample(1)
  const row = profiler.rows[0]
  assert.equal(row.triangles, 24)
  assert.equal(row.meshes, 2)
  assert.equal(row.materials, 1)
  assert.deepEqual(
    [row.bodies, row.colliders, row.activeBodies, row.contacts, row.lights, row.shadows],
    [1, 2, 1, 1, 1, 1]
  )
  assert.equal(row.position.y, 1.35)
  assert.equal(profiler.overlay.mesh.count, 2)
  world.stage.hit.node.resolveHit({ instanceId: 1 }).onPointerDown()
  assert.equal(profiler.selected, 'b')
  world.entities.items.delete('b')
  profiler.sample(1)
  assert.equal(profiler.rows.length, 1)
  assert.equal(profiler.selected, null)
  assert.equal(profiler.overlay.mesh.count, 1)
  assert.equal(geometry.attributes.position.count, 24)
  profiler.destroy()
})

test('actual App event/world/timer paths are measured and subscriptions can be removed by their original callback', async t => {
  const { world, profiler, app } = fixture()
  app('a')
  class TestApp extends App {
    build() {}
  }
  const entity = new TestApp(world, { id: 'a' }, false)
  let now = 0,
    calls = 0
  t.mock.method(performance, 'now', () => now)
  world.setHot = () => {}
  const callback = () => {
    now += 2
    calls++
  }
  entity.on('test', callback)
  entity.onWorldEvent('one', callback)
  entity.onWorldEvent('two', callback)
  profiler.toggle(true)
  entity.emit('test')
  world.events.emit('one')
  world.events.emit('two')
  await new Promise(resolve =>
    entity.setTimeout(() => {
      callback()
      resolve()
    }, 0)
  )
  assert.equal(calls, 4)
  assert.equal(profiler.pending.get('a').cpu, 8)
  entity.onWorldEvent('receiver', function () {
    assert.equal(this, world.events)
  })
  world.events.emit('receiver')
  profiler.measure('a', '__proto__', callback)
  assert.equal(profiler.pending.get('a').callbacks.__proto__, 2)
  entity.offWorldEvent('one', callback)
  world.events.emit('one')
  assert.equal(calls, 5)
  entity.clearEventListeners()
  assert.equal(world.events.listenerCount('two'), 0)
  profiler.destroy()
})

test('network hooks count encoded app packets in both directions and exclude shared/player traffic', () => {
  const { world, profiler, app } = fixture()
  app('a')
  world.entities.items.set('player', { isApp: false })
  const network = new ClientNetwork(world)
  const packets = []
  network.ws = { send: packet => packets.push(packet) }
  profiler.toggle(true)
  network.send('entityEvent', ['a', 0, 'move', { x: 1 }])
  network.onPacket({ data: packets[0] })
  network.send('ping', 100)
  network.send('entityModified', { id: 'player' })
  profiler.sample(1)
  assert.equal(profiler.rows[0].sent, packets[0].byteLength)
  assert.equal(profiler.rows[0].received, packets[0].byteLength)
  assert.equal(profiler.rows[0].messages, 2)
  assert.equal(network.queue.length, 1)
  profiler.destroy()
})

test('sandbox API validates arguments and gates every toggle on local admin permission', () => {
  const { world, profiler, setAdmin } = fixture()
  world.network = { isClient: true }
  const apps = new Apps(world)
  assert.equal(apps.worldMethods.toggleProfiler({}, 'yes'), false)
  setAdmin(false)
  assert.equal(apps.worldMethods.toggleProfiler({}, true), false)
  setAdmin(true)
  assert.equal(apps.worldMethods.toggleProfiler({}, true), true)
  assert.equal(apps.worldGetters.isProfiling(), true)
  assert.equal(apps.worldMethods.toggleProfiler({}, false), false)
  profiler.destroy()
})

test('bundled physical switch matches its readable script source and content hash', async () => {
  const { readFile } = await import('node:fs/promises')
  const { createHash } = await import('node:crypto')
  const bytes = await readFile(new URL('../../world/collections/default/PerformanceSwitch.hyp', import.meta.url))
  const size = bytes.readUInt32LE(0)
  const header = JSON.parse(bytes.subarray(4, 4 + size))
  const script = bytes.subarray(4 + size)
  assert.deepEqual(script, await readFile(new URL('../../../scripts/profiler-switch.js', import.meta.url)))
  assert.equal(header.blueprint.script, `asset://${createHash('sha256').update(script).digest('hex')}.js`)
})

test('enabled profiler reports at most once per second, handles API control and clears reports on disable', t => {
  const { world, profiler, app, setAdmin } = fixture()
  app('a')
  let now = 0
  t.mock.method(performance, 'now', () => now)
  const sent = []
  world.network = { ws: { readyState: 1 }, send: (...args) => sent.push(args) }
  const network = new ClientNetwork(world)
  network.onProfilerControl({ enabled: true })
  profiler.sample(0.5)
  now = 500
  profiler.sample(0.5)
  assert.equal(sent.length, 1)
  assert.equal(sent[0][0], 'profilerReport')
  assert.equal(sent[0][1].rows[0].id, 'a')
  now = 1000
  profiler.sample(0.5)
  assert.equal(sent.length, 2)
  network.onProfilerControl({ enabled: false })
  assert.deepEqual(sent.at(-1), ['profilerReport', { active: false }])
  assert.equal(profiler.active, false)
  setAdmin(false)
  network.onProfilerControl({ enabled: true })
  assert.equal(profiler.active, false)
  assert.equal(sent.length, 3)
  profiler.destroy()
})

test('server samples rank matching app versions and expire to unavailable rather than zero', t => {
  let clock = 0
  t.mock.method(performance, 'now', () => clock)
  const { profiler, app } = fixture()
  app('a').blueprint.version = 2
  profiler.toggle(true)
  profiler.sample(0.5)
  assert.equal(profiler.rows[0].serverCpu, null)
  profiler.receiveServerReport({
    source: 'server',
    active: true,
    stale: false,
    rows: [{ id: 'a', blueprintVersion: 2, cpuMsPerSecond: 4, peakCallbackMs: 1, callbackMsPerSecond: { update: 4 } }],
  })
  profiler.setMetric('serverCpu')
  assert.equal(profiler.metric, 'serverCpu')
  assert.equal(profiler.rows[0].serverCpu, 4)
  assert.deepEqual(profiler.rows[0].serverCallbacks, { update: 4 })
  clock = 11000
  profiler.sample(0.5)
  assert.equal(profiler.rows[0].serverCpu, null)
  assert.equal(profiler.serverReady(), false)
  profiler.toggle(false)
  profiler.receiveServerReport({ source: 'server', active: true, rows: [] })
  assert.equal(profiler.serverReport, null)
})
