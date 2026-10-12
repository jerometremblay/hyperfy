import assert from 'node:assert/strict'
import test from 'node:test'
import { EventEmitter } from 'node:events'
import { build } from 'esbuild'
import * as THREE from 'three'

const bundle = await build({
  entryPoints: ['src/server/PortalPreviews.js'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { PortalPreviews, portalEndpoints, selectPortalEntities } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function fixture() {
  const world = {
    assetsUrl: 'http://destination/assets',
    network: { spawn: { position: [0, 0, 0], quaternion: [0, 0, 0, 1] }, getServerTime: () => 123456 },
    entities: { items: new Map() },
    blueprints: { get: id => ({ id, model: 'script-only', props: {} }) },
    stage: { octree: { root: { items: [], children: [] } } },
    settings: {
      serialize: () => ({
        dayNightCycle: true,
        latitude: 10,
        longitude: 20,
        timeOffset: 100,
        timeZone: 'UTC',
        rank: 3,
        voice: true,
      }),
    },
  }
  function app(id, x, radius = 1, nodes = []) {
    const entity = {
      isApp: true,
      data: { id, type: 'app', blueprint: `bp-${id}`, position: [x, 0, 0], state: {} },
      blueprint: {},
      root: { traverse: fn => nodes.forEach(fn) },
      serialize() {
        return this.data
      },
    }
    world.entities.items.set(id, entity)
    world.stage.octree.root.items.push({
      getEntity: () => entity,
      sphere: new THREE.Sphere(new THREE.Vector3(x, 0, 0), radius),
    })
    return entity
  }
  return { world, app }
}

class Connection extends EventEmitter {
  readyState = 1
  bufferedAmount = 0
  messages = []
  send(data) {
    this.messages.push(JSON.parse(data))
  }
  close(code) {
    this.code = code
    this.readyState = 3
    this.emit('close')
  }
  subscribe(portalIds = ['']) {
    this.emit('message', Buffer.from(JSON.stringify({ type: 'subscribe', version: 1, portalIds })))
  }
}

test('regional selection includes overlapping geometry, global sky, unknown client geometry and nearby avatars', () => {
  const { world, app } = fixture()
  app('near', 20)
  app('overlap', 70, 25)
  app('far', 100)
  app('sky', 500, 1, [{ name: 'sky' }])
  const client = app('client-only', 500)
  client.script = { code: 'if (world.isClient) app.create(...)' }
  const serverBranch = app('server-branch', 500)
  serverBranch.script = { code: 'if (!world.isServer) app.create(...)' }
  const unknown = app('unknown', 1000)
  world.stage.octree.root.items.pop()
  for (const [id, x] of [
    ['avatar-near', 49],
    ['avatar-far', 100],
  ]) {
    world.entities.items.set(id, {
      isPlayer: true,
      data: { id, position: [x, 0, 0] },
      serialize() {
        return this.data
      },
    })
  }
  const selected = selectPortalEntities(world, portalEndpoints(world, [''])).map(item => item.id)
  assert.deepEqual(selected, [
    'near',
    'overlap',
    'sky',
    client.data.id,
    serverBranch.data.id,
    unknown.data.id,
    'avatar-near',
  ])
  assert.deepEqual(selectPortalEntities(world, {}), [])
})

test('endpoint lookup follows nested native portals, excludes moving endpoints, and resolves spawn', () => {
  const { world, app } = fixture()
  const matrix = new THREE.Matrix4().makeTranslation(17, 2, 31)
  app('door', 17, 1, [{ name: 'portal', mounted: true, portalId: 'exit', matrixWorld: matrix }])
  const mover = app('moving', 0, 1, [{ name: 'portal', mounted: true, portalId: 'moving', matrixWorld: matrix }])
  mover.data.mover = 'builder'
  const endpoints = portalEndpoints(world, ['exit', 'moving', 'missing', ''])
  assert.deepEqual(endpoints.exit, matrix.toArray())
  assert.equal(endpoints.moving, undefined)
  assert.equal(endpoints.missing, undefined)
  assert.deepEqual(endpoints[''], new THREE.Matrix4().toArray())
})

test('preview connection sends regional state and live deltas without a user, player, credentials or private settings', () => {
  const { world, app } = fixture()
  const entity = app('near', 10)
  const service = new PortalPreviews(world)
  const ws = new Connection()
  service.connect(ws)
  ws.subscribe()
  const snapshot = ws.messages.at(-1)
  assert.equal(snapshot.type, 'snapshot')
  assert.equal(snapshot.added.length, 1)
  assert.equal(snapshot.blueprints.length, 1)
  assert.equal(snapshot.settings.voice, undefined)
  assert.equal(snapshot.settings.rank, undefined)
  assert.equal(snapshot.authToken, undefined)
  assert.equal(world.entities.items.size, 1)
  entity.data.state = { doorOpen: true }
  entity.data.position = [15, 0, 0]
  service.refresh()
  assert.deepEqual(ws.messages.at(-1).modified, [{ id: 'near', position: [15, 0, 0], state: { doorOpen: true } }])
  service.event('entityEvent', ['near', 1, 'animate', { x: 2 }])
  assert.equal(ws.messages.at(-1).type, 'event')
  world.stage.octree.root.items[0].sphere.center.x = 100
  service.refresh()
  assert.deepEqual(ws.messages.at(-1).removed, ['near'])
  service.destroy()
  assert.equal(service.sessions.size, 0)
})

test('a preview rejects gameplay packets and unsupported protocol versions before dispatch', () => {
  const { world } = fixture()
  const service = new PortalPreviews(world)
  for (const packet of [
    { type: 'entityModified', id: 'anything' },
    { type: 'subscribe', version: 99, portalIds: [''] },
    { type: 'subscribe', version: 1, portalIds: new Array(17).fill('') },
  ]) {
    const ws = new Connection()
    service.connect(ws)
    ws.emit('message', Buffer.from(JSON.stringify(packet)))
    assert.equal(ws.code, 1008)
    assert.equal(service.sessions.size, 0)
  }
  service.destroy()
})

test('endpoint IDs remain valid when they match object prototype properties', () => {
  const { world, app } = fixture()
  const matrix = new THREE.Matrix4().makeTranslation(5, 0, 0)
  app('door', 5, 1, [{ name: 'portal', mounted: true, portalId: '__proto__', matrixWorld: matrix }])
  const endpoints = portalEndpoints(world, ['__proto__'])
  assert.equal(Object.getPrototypeOf(endpoints), null)
  assert.deepEqual(JSON.parse(JSON.stringify(endpoints))['__proto__'], matrix.toArray())
  assert.equal(Object.keys(endpoints).length, 1)
})
