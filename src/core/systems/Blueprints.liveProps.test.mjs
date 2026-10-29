import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { build } from 'esbuild'
import EventEmitter from 'eventemitter3'
import 'ses'

const bundle = await build({
  stdin: {
    contents: `export { Apps } from './src/core/systems/Apps.js';
      export { Entities } from './src/core/systems/Entities.js';
      export { Blueprints } from './src/core/systems/Blueprints.js';
      export { Scripts } from './src/core/systems/Scripts.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true, format: 'esm', platform: 'node', write: false, packages: 'external',
})
const filename = path.resolve(`.live-props-test-${process.pid}.mjs`)
await fs.writeFile(filename, bundle.outputFiles[0].contents)
let runtime
try {
  runtime = await import(`file://${filename}`)
} finally {
  await fs.unlink(filename)
}

function fixture(server = true) {
  const world = new EventEmitter()
  world.events = new EventEmitter()
  world.stage = { dirtyNodes: new Set() }
  world.anchors = { remove() {} }
  world.networkRate = 0.2
  world.network = { id: 'local', isServer: server, isClient: !server, send() {}, markAppDeleted() {}, dirtyApps: new Set() }
  world.hot = new Set()
  world.setHot = (entity, hot) => hot ? world.hot.add(entity) : world.hot.delete(entity)
  world.settings = { setHasAdminCode() {}, on() {} }
  world.apps = new runtime.Apps(world)
  world.blueprints = new runtime.Blueprints(world)
  world.entities = new runtime.Entities(world)
  const scripts = new runtime.Scripts(world)
  const executable = scripts.evaluate(`
    app.configure([
      { key: 'resistance', type: 'range', initial: 1, live: true },
      { key: 'size', type: 'switch', initial: '8' },
    ]);
    app.state.match = { shots: 3, owner: 'alice', ball: [0.2, 0.1, 0] };
    app.state.resistance = props.resistance;
    app.on('props', next => { app.state.resistance = next.resistance; });
    app.on('update', () => { app.state.frames = (app.state.frames || 0) + 1; });
  `)
  world.loader = { get: () => executable }
  const blueprint = { id: 'table-bp', version: 0, model: 'script-only', script: 'asset://table.js',
    props: { resistance: 1, size: '8' } }
  world.blueprints.add(blueprint)
  const app = world.entities.add({ id: 'table', type: 'app', blueprint: blueprint.id,
    position: [0, 0, 0], quaternion: [0, 0, 0, 1], scale: [1, 1, 1], state: {} })
  assert.equal(app.scriptError, null)
  return { world, app, blueprint }
}

test('live property changes retain the running app, match state and frame callback on server and client', () => {
  for (const server of [true, false]) {
    const { world, app, blueprint } = fixture(server)
    const state = app.data.state, root = app.root, buildNumber = app.n
    const update = [...app.listeners.update][0]
    const match = state.match
    for (const resistance of [2, 3, 0.5]) {
      world.blueprints.modify({ id: blueprint.id, version: app.blueprint.version + 1,
        props: { resistance, size: '8' } })
      assert.equal(app.data.state, state)
      assert.equal(app.data.state.match, match)
      assert.equal(app.data.state.resistance, resistance)
      assert.equal(app.root, root)
      assert.equal(app.n, buildNumber)
      assert.equal([...app.listeners.update][0], update)
      assert.equal(world.hot.size, 1)
    }
    app.destroy()
  }
})

test('a normal or mixed property edit still uses the normal rebuild', () => {
  for (const props of [{ resistance: 1, size: '9' }, { resistance: 2, size: '9' }]) {
    const { world, app, blueprint } = fixture()
    const root = app.root, state = app.data.state
    world.blueprints.modify({ id: blueprint.id, version: 1, props })
    assert.notEqual(app.root, root)
    assert.notEqual(app.data.state, state)
    assert.equal(app.data.state.resistance, props.resistance)
    app.destroy()
  }
})

test('script and metadata changes are never mistaken for live property edits', () => {
  for (const extra of [{ script: 'asset://changed.js' }, { name: 'Another table' }]) {
    const { world, app, blueprint } = fixture()
    const root = app.root
    world.blueprints.modify({ id: blueprint.id, version: 1, props: { resistance: 2, size: '8' }, ...extra })
    assert.notEqual(app.root, root)
    app.destroy()
  }
})

test('live field opt-in is checked on every app instance', () => {
  const { world, app, blueprint } = fixture()
  const other = world.entities.add({ id: 'other', type: 'app', blueprint: blueprint.id,
    position: [0, 0, 0], quaternion: [0, 0, 0, 1], scale: [1, 1, 1], state: {} })
  other.fields = other.fields.map(field => ({ ...field, live: false }))
  const firstRoot = app.root, otherRoot = other.root
  world.blueprints.modify({ id: blueprint.id, version: 1, props: { resistance: 2, size: '8' } })
  assert.equal(app.root, firstRoot)
  assert.notEqual(other.root, otherRoot)
  app.destroy()
  other.destroy()
})

test('scripts cannot forge the internal property update event', () => {
  for (const server of [true, false]) {
    const { world, app } = fixture(server)
    const errors = [], original = console.error
    console.error = message => errors.push(message)
    try {
      assert.equal(world.apps.appMethods.send(app, 'props', { resistance: 4 }), false)
      assert.equal(world.apps.appMethods.sendTo(app, 'local', 'props', { resistance: 4 }), false)
    } finally {
      console.error = original
    }
    assert.equal(app.data.state.resistance, 1)
    assert.equal(errors.length, 2)
    app.destroy()
  }
})
