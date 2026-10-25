import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { build } from 'esbuild'
import knex from 'knex'
import 'ses'
import EventEmitter from 'eventemitter3'

const bundle = await build({
  stdin: {
    contents: `export { Apps } from './src/core/systems/Apps.js';
      export { App } from './src/core/entities/App.js';
      export { Entities } from './src/core/systems/Entities.js';
      export { Blueprints } from './src/core/systems/Blueprints.js';
      export { Scripts } from './src/core/systems/Scripts.js';
      export { ServerNetwork } from './src/core/systems/ServerNetwork.js';
      export { Vector3, Quaternion } from './src/core/extras/three.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  packages: 'external',
})
const filename = path.resolve(`.spawning-test-${process.pid}.mjs`)
await fs.writeFile(filename, bundle.outputFiles[0].contents)
let runtime
try {
  runtime = await import(`file://${filename}`)
} finally {
  await fs.unlink(filename)
}
const { Apps, Entities, Blueprints, Scripts, ServerNetwork, Vector3, Quaternion } = runtime
const stripScript = 'asset://strip.js'

function fixture(t, { client = false, script = '' } = {}) {
  const broadcasts = []
  const world = {
    networkRate: 1 / 8,
    events: new EventEmitter(),
    stage: { dirtyNodes: new Set() },
    anchors: { remove() {} },
    setHot() {},
    emit() {},
    settings: { deserialize() {}, setHasAdminCode() {}, on() {} },
  }
  world.network = new ServerNetwork(world)
  clearInterval(world.network.socketIntervalId)
  t.after(() => clearTimeout(world.network.saveTimerId))
  if (client) {
    world.network.isServer = false
    world.network.isClient = true
  }
  world.network.send = (...args) => broadcasts.push(structuredClone(args))
  world.apps = new Apps(world)
  world.blueprints = new Blueprints(world)
  world.entities = new Entities(world)
  const scripts = new Scripts(world)
  const executable = scripts.evaluate(script)
  world.loader = { get: () => executable }
  const bp = {
    id: 'booth-bp',
    version: 0,
    model: 'script-only',
    script: 'asset://booth.js',
    props: { stripScript: { url: stripScript } },
  }
  world.blueprints.add(bp)
  const parent = world.entities.add({
    id: 'booth',
    type: 'app',
    blueprint: bp.id,
    position: [0, 0, 0],
    quaternion: [0, 0, 0, 1],
    scale: [1, 1, 1],
    state: {},
  })
  assert.equal(parent.scriptError, null)
  const options = () => ({
    name: 'Photo strip',
    script: stripScript,
    props: { photo0: { type: 'image', name: 'photo0.jpg', url: 'asset://photo.jpg' }, names: ['Alice', 'Bob'] },
    position: new Vector3(1, 2, 3),
    quaternion: new Quaternion(),
    state: { ready: true },
  })
  return { world, parent, broadcasts, options, proxy: parent.getWorldProxy() }
}

async function database(t, network) {
  const db = knex({ client: 'better-sqlite3', connection: { filename: ':memory:' }, useNullAsDefault: true })
  t.after(() => db.destroy())
  for (const table of ['blueprints', 'entities'])
    await db.schema.createTable(table, table => {
      table.string('id').primary()
      table.text('data')
      table.string('createdAt')
      table.string('updatedAt')
    })
  await db.schema.createTable('config', table => {
    table.string('key').primary()
    table.text('value')
  })
  network.db = db
  return db
}

async function saveNetwork(network) {
  clearTimeout(network.saveTimerId)
  await network.save()
  clearTimeout(network.saveTimerId)
}

test('server spawns a normal app, copies inputs, broadcasts to everyone, and saves both records', async t => {
  const { world, parent, proxy, broadcasts, options } = fixture(t)
  const input = options()
  const id = proxy.spawnApp(input)
  const child = world.entities.get(id)
  assert.equal(typeof id, 'string')
  assert.equal(child.isApp, true)
  assert.equal(child.blueprint.model, 'script-only')
  assert.equal(child.blueprint.name, 'Photo strip')
  assert.equal(child.blueprint.version, 0)
  assert.equal(child.data.spawnedBy, parent.data.id)
  assert.notEqual(child.data.blueprint, parent.data.blueprint)
  for (const flag of ['preload', 'public', 'locked', 'frozen', 'unique', 'scene', 'disabled'])
    assert.equal(child.blueprint[flag], false)
  assert.deepEqual(child.data.scale, [1, 1, 1])
  assert.deepEqual(child.data.state, { ready: true })
  assert.deepEqual(
    broadcasts.map(([event]) => event),
    ['blueprintAdded', 'entityAdded']
  )
  assert.ok(broadcasts.every(args => args.length === 2))
  assert.ok(world.network.dirtyBlueprints.has(child.blueprint.id))
  assert.ok(world.network.dirtyApps.has(id))
  input.props.names.push('Changed')
  input.position.x = 100
  input.state.ready = false
  assert.deepEqual(child.blueprint.props.names, ['Alice', 'Bob'])
  assert.deepEqual(child.data.position, [1, 2, 3])
  assert.equal(child.data.state.ready, true)
  const db = await database(t, world.network)
  await saveNetwork(world.network)
  assert.deepEqual(JSON.parse((await db('blueprints').first()).data), child.blueprint)
  assert.deepEqual(JSON.parse((await db('entities').first()).data), { ...child.data, state: null })
})

test('all three scripting methods throw a server-only error on clients', t => {
  const { proxy, parent, options, broadcasts } = fixture(t, { client: true })
  assert.throws(() => proxy.spawnApp(options()), /server-only/)
  assert.throws(() => proxy.removeApp('anything'), /server-only/)
  assert.throws(() => parent.getAppProxy().setTransform(new Vector3(), new Quaternion()), /server-only/)
  assert.deepEqual(broadcasts, [])
})

test('unreferenced scripts, bad URLs, malformed JSON, oversized UTF-8 props and invalid transforms leave no records', t => {
  const { proxy, world, options, broadcasts } = fixture(t)
  const circular = {}
  circular.self = circular
  for (const patch of [
    { script: 'asset://uploaded.js' },
    { script: 'https://example.com/strip.js' },
    { props: { photo: { url: 'asset://folder/photo.jpg' } } },
    { props: { photo: { url: 'asset://photo.JPG' } } },
    { props: { text: 'é'.repeat(32768) } },
    { props: circular },
    { props: { bad: undefined } },
    { props: { bad: () => {} } },
    { props: { bad: Infinity } },
    { props: { bad: 1n } },
    { props: [] },
    { state: { bad: Symbol() } },
    { position: new Vector3(NaN, 0, 0) },
    { quaternion: new Quaternion(0, 0, Infinity, 1) },
    { position: [0, 0, 0] },
    { name: '' },
  ])
    assert.throws(() => proxy.spawnApp({ ...options(), ...patch }))
  assert.deepEqual(broadcasts, [])
  assert.equal(world.entities.items.size, 1)
  assert.equal(world.blueprints.items.size, 1)
  assert.equal(world.network.dirtyApps.size, 0)
  assert.equal(world.network.dirtyBlueprints.size, 0)
  assert.equal(typeof proxy.spawnApp({ ...options(), script: 'asset://booth.js' }), 'string')
})

test('rate limit survives script rebuilds and removal; expires after one minute', t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 })
  const { proxy, parent, options } = fixture(t)
  for (let i = 0; i < 10; i++) proxy.removeApp(proxy.spawnApp(options()))
  parent.build()
  assert.throws(() => proxy.spawnApp(options()), /rate limit/)
  t.mock.timers.tick(60000)
  assert.equal(typeof proxy.spawnApp(options()), 'string')
})

test('live cap counts persistent children and builder removals free capacity', t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 })
  const { world, proxy, options } = fixture(t)
  for (let minute = 0; minute < 5; minute++) {
    for (let i = 0; i < 10; i++) proxy.spawnApp(options())
    t.mock.timers.tick(60000)
  }
  // Recreating the Apps system models a server restart: cap is based on entity data.
  world.apps = new Apps(world)
  assert.throws(() => world.apps.worldMethods.spawnApp(world.entities.get('booth'), options()), /live limit/)
  const id = [...world.entities.items.keys()].at(-1)
  world.network.onEntityRemoved({ id: 'builder', player: { isBuilder: () => true } }, id)
  assert.ok(world.network.dirtyApps.has(id))
  assert.equal(world.entities.get(id), undefined)
  assert.equal(typeof world.apps.worldMethods.spawnApp(world.entities.get('booth'), options()), 'string')
})

test('removeApp enforces instance ownership, persists deletion, and parent deletion leaves children', async t => {
  const { world, proxy, parent, options, broadcasts } = fixture(t)
  const id = proxy.spawnApp(options())
  const db = await database(t, world.network)
  await saveNetwork(world.network)
  const other = world.entities.add({ ...structuredClone(parent.data), id: 'other-booth' })
  assert.throws(() => other.getWorldProxy().removeApp(id), /this app instance/)
  assert.throws(() => proxy.removeApp(parent.data.id), /this app instance/)
  proxy.removeApp(id)
  assert.deepEqual(broadcasts.at(-1), ['entityRemoved', id])
  await saveNetwork(world.network)
  assert.equal((await db('entities')).length, 0)
  assert.equal((await db('blueprints')).length, 1) // existing cleaner owns orphan cleanup
  const independentId = proxy.spawnApp(options())
  world.network.onEntityRemoved({ id: 'builder', player: { isBuilder: () => true } }, parent.data.id)
  assert.ok(world.entities.get(independentId))
  assert.throws(() => proxy.spawnApp(options()), /destroyed app/)
})

test('setTransform updates the root without rerunning the server script, survives save/restart, and reaches late joiners', async t => {
  const { world, proxy, options, broadcasts } = fixture(t, { script: `app.state.runs = (app.state.runs || 0) + 1` })
  const id = proxy.spawnApp(options())
  const child = world.entities.get(id)
  const db = await database(t, world.network)
  const position = new Vector3(4, 5, 6)
  const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
  child.getAppProxy().setTransform(position, quaternion)
  assert.equal(child.data.state.runs, 1)
  assert.deepEqual(child.root.position.toArray(), [4, 5, 6])
  assert.deepEqual(child.root.quaternion.toArray(), quaternion.toArray())
  assert.deepEqual(broadcasts.at(-1), ['entityModified', { id, position: [4, 5, 6], quaternion: quaternion.toArray() }])
  const snapshot = world.entities.serialize().find(entity => entity.id === id)
  assert.deepEqual(snapshot.position, [4, 5, 6])
  position.x = 200
  assert.deepEqual(child.data.position, [4, 5, 6])
  assert.throws(() => child.getAppProxy().setTransform(new Vector3(Infinity, 0, 0), quaternion), /finite/)
  assert.throws(() => child.getAppProxy().setTransform(position, new Quaternion(0, NaN, 0, 1)), /finite/)
  await saveNetwork(world.network)
  const restarted = fixture(t)
  restarted.world.entities.destroy()
  restarted.world.blueprints.destroy()
  restarted.world.network.db = db
  await restarted.world.network.start()
  const reloaded = restarted.world.entities.get(id)
  assert.deepEqual(reloaded.data.position, [4, 5, 6])
  assert.deepEqual(reloaded.root.quaternion.toArray(), quaternion.toArray())
  assert.equal(reloaded.data.spawnedBy, 'booth')
  // Normal builder move and delete paths work for the reloaded child.
  await restarted.world.network.onEntityModified(
    { id: 'builder', player: { isBuilder: () => true } },
    { id, position: [7, 8, 9], mover: null }
  )
  assert.deepEqual(reloaded.data.position, [7, 8, 9])
  restarted.world.network.onEntityRemoved({ id: 'builder', player: { isBuilder: () => true } }, id)
  assert.equal(restarted.world.entities.get(id), undefined)
})

test('server and client execute the spawned script through the normal app lifecycle', t => {
  const { world, proxy, options } = fixture(t, {
    script: `app.state.side = world.isServer ? 'server' : 'client'; app.add(app.create('group', { id: 'strip' }))`,
  })
  const id = proxy.spawnApp(options())
  assert.equal(world.entities.get(id).data.state.side, 'server')
  assert.equal(world.entities.get(id).root.children[0].id, 'strip')
  const client = fixture(t, {
    client: true,
    script: `app.state.side = 'client'; app.add(app.create('group', { id: 'strip' }))`,
  })
  client.world.blueprints.deserialize(structuredClone(world.blueprints.serialize()))
  client.world.entities.add(structuredClone(world.entities.get(id).data))
  assert.equal(client.world.entities.get(id).data.state.side, 'client')
  assert.equal(client.world.entities.get(id).root.children[0].id, 'strip')
})

test('synchronous child script callbacks cannot exceed the live cap before entity registration', t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 })
  const { world, proxy, options } = fixture(t, {
    script: `if (world.isServer && props.reenter) app.emit('spawn-more')`,
  })
  for (let i = 0; i < 49; i++) {
    if (i % 10 === 0) t.mock.timers.tick(60000)
    proxy.spawnApp(options())
  }
  t.mock.timers.tick(60000)
  const errors = []
  const input = { ...options(), props: { reenter: true } }
  world.events.on('spawn-more', () => {
    try {
      proxy.spawnApp(input)
    } catch (error) {
      errors.push(error)
    }
  })
  proxy.spawnApp(input)
  assert.equal([...world.entities.items.values()].filter(entity => entity.data.spawnedBy === 'booth').length, 50)
  assert.match(errors[0].message, /live limit/)
})
