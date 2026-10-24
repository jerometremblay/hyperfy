import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import EventEmitter from 'eventemitter3'

const bundle = await build({
  stdin: {
    contents: `export { App } from './src/core/entities/App'; export { Node } from './src/core/nodes/Node'; export { Apps } from './src/core/systems/Apps'; export { Settings } from './src/core/systems/Settings'; export { LerpVector3 } from './src/core/extras/LerpVector3'; export { LerpQuaternion } from './src/core/extras/LerpQuaternion';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
export const { App, Node, Apps, Settings, LerpVector3, LerpQuaternion } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

export function fixture(server = false) {
  const world = new EventEmitter()
  world.events = new EventEmitter()
  world.stage = { dirtyNodes: new Set() }
  world.network = { id: 'local', isServer: server, isClient: !server, send() {}, dirtyApps: new Set() }
  world.networkRate = 0.2
  world.hot = new Set()
  world.setHot = (app, active) => (active ? world.hot.add(app) : world.hot.delete(app))
  world.settings = new Settings(world)
  world.apps = new Apps(world)
  class TestApp extends App {
    build() {}
  }
  const app = new TestApp(world, { id: 'a', position: [0, 0, 0], quaternion: [0, 0, 0, 1], scale: [1, 1, 1] }, false)
  app.root.activate({ world, entity: app })
  app.networkPos = new LerpVector3(app.root.position, world.networkRate)
  app.networkQuat = new LerpQuaternion(app.root.quaternion, world.networkRate)
  app.networkSca = new LerpVector3(app.root.scale, world.networkRate)
  const flush = () => {
    for (const node of world.stage.dirtyNodes) node.clean()
    world.stage.dirtyNodes.clear()
  }
  return { world, app, flush }
}

test('root transform events coalesce actual changes and do not activate idle apps', () => {
  const { world, app, flush } = fixture()
  const events = []
  app.on('transform', changed => events.push(changed))
  app.root.position.set(1, 2, 3)
  app.root.quaternion.set(0, Math.sin(0.5), 0, Math.cos(0.5))
  app.root.scale.set(2, 2, 2)
  flush()
  assert.deepEqual(events, [{ position: true, rotation: true, scale: true }])
  assert.equal(world.hot.size, 0)
  app.root.position.set(1, 2, 3)
  app.root.quaternion.copy(app.root.quaternion)
  flush()
  assert.equal(events.length, 1)
  app.root.position.set(5, 2, 3)
  app.root.position.set(1, 2, 3)
  flush()
  assert.equal(events.length, 1)
  const child = new Node()
  app.root.add(child)
  child.position.x = 2
  flush()
  assert.equal(events.length, 1)
})

test('transform handlers adjust children in the same commit; new listeners start from current transform', () => {
  const { app, flush } = fixture()
  const child = new Node()
  app.root.add(child)
  const handler = changed => {
    if (changed.rotation) child.quaternion.copy(app.root.quaternion).invert()
  }
  app.on('transform', handler)
  app.root.quaternion.set(0, Math.sin(0.5), 0, Math.cos(0.5))
  flush()
  assert.ok(Math.abs(child.matrixWorld.elements[0] - 1) < 1e-10)
  assert.ok(Math.abs(child.matrixWorld.elements[8]) < 1e-10)
  app.off('transform', handler)
  app.root.position.x = 9
  flush()
  let calls = 0
  app.on('transform', () => calls++)
  app.root.position.x = 9
  flush()
  assert.equal(calls, 0)
  app.root.position.x = 10
  flush()
  assert.equal(calls, 1)
})

test('server setTransform and remote editor interpolation deliver root notifications', () => {
  const { app, world, flush } = fixture(true)
  let events = 0
  app.on('transform', () => events++)
  world.apps.appMethods.setTransform(app, app.root.position.clone().set(1, 0, 0), app.root.quaternion.clone())
  flush()
  assert.equal(events, 1)
  app.modify({ mover: 'remote' })
  app.modify({ position: [3, 0, 0], quaternion: [0, 0.5, 0, Math.sqrt(0.75)] })
  app.update(0.1)
  flush()
  assert.equal(events, 2)
  app.modify({ mover: null, position: [3, 0, 0], quaternion: [0, 0.5, 0, Math.sqrt(0.75)], scale: [1, 1, 1] })
  flush()
  assert.equal(events, 3)
  assert.equal(world.hot.size, 0)
})

test('location events coalesce actual coordinate changes and clean up script subscriptions', () => {
  const { world, app } = fixture()
  const events = []
  app.onWorldEvent('location', value => events.push(value))
  const latitude = world.settings.latitude
  world.settings.set('latitude', latitude + 1)
  world.settings.set('longitude', world.settings.longitude + 1)
  world.settings.preFixedUpdate()
  assert.deepEqual(events, [{ latitude: latitude + 1, longitude: world.settings.longitude }])
  world.settings.set('latitude', latitude + 1)
  world.settings.preFixedUpdate()
  assert.equal(events.length, 1)
  world.settings.set('latitude', latitude + 2)
  world.settings.set('latitude', latitude + 1)
  world.settings.preFixedUpdate()
  assert.equal(events.length, 1)
  world.settings.deserialize({ ...world.settings.serialize(), latitude: latitude + 3 })
  assert.equal(events.length, 2)
  world.settings.deserialize(world.settings.serialize())
  assert.equal(events.length, 2)
  app.clearEventListeners()
  assert.equal(world.events.listenerCount('location'), 0)
})

test('scripts cannot spoof the engine transform and location events', t => {
  const { world, app } = fixture()
  let sent = 0,
    received = 0
  world.network.send = () => sent++
  world.events.on('location', () => received++)
  t.mock.method(console, 'error', () => {})
  world.apps.appMethods.send(app, 'transform', {})
  world.apps.appMethods.send(app, 'location', {})
  world.apps.appMethods.emit(app, 'location', {})
  world.apps.worldMethods.emit(app, 'location', {})
  assert.equal(sent, 0)
  assert.equal(received, 0)
})

test('transform callback failures use app crash handling instead of aborting the stage pass', t => {
  const { app, flush } = fixture()
  let crashed = false
  app.crash = () => {
    crashed = true
  }
  t.mock.method(console, 'error', () => {})
  app.on('transform', () => {
    throw new Error('transform failure')
  })
  app.root.position.x = 1
  assert.doesNotThrow(flush)
  assert.equal(crashed, true)
  assert.ok(app.scriptError)
})
