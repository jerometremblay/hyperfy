import assert from 'node:assert/strict'
import Module from 'node:module'
import path from 'node:path'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'

const bundle = await build({
  stdin: {
    contents: `export { ServerNetwork } from './src/core/systems/ServerNetwork.js';
      export { ClientNetwork } from './src/core/systems/ClientNetwork.js';
      export { Portal } from './src/core/nodes/Portal.js';
      export { readPacket } from './src/core/packets.js';`,
    resolveDir: process.cwd(),
  },
  plugins: [
    {
      name: 'connection-fixtures',
      setup(build) {
        build.onResolve({ filter: /^\.\.\/(storage|utils-server)$/ }, args => ({
          path: args.path,
          namespace: 'fixture',
        }))
        build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({
          contents: args.path.endsWith('storage')
            ? 'export const storage = { get() {}, set() {} }'
            : 'export async function readJWT() { return { userId: "visitor" } }; export async function createJWT() { return "token" }',
        }))
      },
    },
  ],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  write: false,
})
const filename = path.join(process.cwd(), 'src/core/systems/portal-arrival-test-bundle.cjs')
const compiled = new Module(filename)
compiled.filename = filename
compiled.paths = Module._nodeModulePaths(path.dirname(filename))
compiled._compile(bundle.outputFiles[0].text, filename)
const { ServerNetwork, ClientNetwork, Portal, readPacket } = compiled.exports

function serverFixture({ doubleside = false, moving = false, disabled = false, worldNode = false } = {}) {
  const items = new Map()
  const world = {
    stage: { dirtyNodes: new Set() },
    settings: { serialize: () => ({}), avatar: null },
    livekit: { serialize: async () => ({}) },
    entities: {
      items,
      add(data) {
        const entity = { data }
        items.set(data.id, entity)
        return entity
      },
      serialize: () => [...items.values()].map(entity => entity.data),
    },
    events: { emit() {} },
    collections: { serialize: () => [] },
    blueprints: { serialize: () => [] },
    chat: { serialize: () => [] },
    ai: { serialize: () => ({}) },
  }
  const entity = {
    isApp: true,
    data: { id: 'exit', mover: moving ? 'builder' : null },
    blueprint: { disabled, props: { doubleside: String(doubleside) } },
  }
  const portal = new Portal({ appConfig: true, position: [10, 1.2, 20], rotation: [0, 0.8, 0] })
  portal.activate({ world, entity })
  if (worldNode) entity.worldNodes = [portal]
  else entity.root = portal
  items.set('exit', entity)
  const network = new ServerNetwork(world)
  clearInterval(network.socketIntervalId)
  network.spawn = { position: [0, 0, 0], quaternion: [0, 0, 0, 1] }
  network.db = () => ({ where: () => ({ first: async () => ({ id: 'visitor', name: 'Visitor', rank: 0 }) }) })
  const packets = []
  const ws = {
    on() {},
    send(packet) {
      packets.push(readPacket(packet))
    },
  }
  return { world, portal, network, packets, ws }
}

for (const doubleside of [false, true]) {
  for (const side of [-1, 1]) {
    test(`connection snapshot starts at portal with matching pose: doubleside=${doubleside}, side=${side}`, async () => {
      const state = serverFixture({ doubleside, worldNode: side === -1 })
      const position = new THREE.Vector3(0.2, -1.2, side * 0.1)
      const direction = new THREE.Vector3(0.3, 0, -side).normalize()
      let expected
      state.portal.ctx.world.graphics = { portals: new Set([state.portal]) }
      state.portal.arrive(
        {
          teleport(data) {
            expected = data
          },
        },
        position,
        direction
      )
      await state.network.onConnection(state.ws, {
        authToken: 'token',
        portalId: 'exit',
        portalPose: JSON.stringify([...position.toArray(), ...direction.toArray()]),
      })
      const snapshot = state.packets.find(([method]) => method === 'onSnapshot')[1]
      const player = snapshot.entities.find(entity => entity.type === 'player')
      assert.deepEqual(player.position, expected.position.toArray())
      const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), expected.rotationY)
      assert.ok(new THREE.Quaternion().fromArray(player.quaternion).angleTo(quaternion) < 1e-7)
      assert.equal(snapshot.portalArrival, true)
      assert.equal(state.portal.portalId, 'exit')
      assert.equal(state.portal.doubleside, doubleside)
    })
  }
}

test('ordinary joins and missing, moving or disabled endpoints fall back to spawn', async () => {
  for (const options of [{}, { moving: true }, { disabled: true }]) {
    for (const portalId of [undefined, 'missing', ...(options.moving || options.disabled ? ['exit'] : [])]) {
      const state = serverFixture(options)
      await state.network.onConnection(state.ws, { authToken: 'token', portalId })
      const snapshot = state.packets.find(([method]) => method === 'onSnapshot')[1]
      assert.deepEqual(snapshot.entities.find(entity => entity.type === 'player').position, [0, 0, 0])
      assert.equal(snapshot.portalArrival, false)
    }
  }
})

test('malformed or out-of-aperture poses use the default portal arrival', () => {
  const { network } = serverFixture()
  const expected = network.getPortalSpawn('exit')
  for (const pose of [
    'broken',
    '[0,0,1,0,0,0]',
    '[0,0,1,1.79e308,1.79e308,1.79e308]',
    '[999,0,1,0,0,-1]',
    '[0,999,1,0,0,-1]',
  ]) {
    assert.deepEqual(network.getPortalSpawn('exit', pose), expected)
  }
})

test('client forwards URL arrival params and consumes acknowledgement before entities load', t => {
  const query = new URLSearchParams('foo=kept&portalId=exit&portalPose=%5B0%2C-1.2%2C0.1%2C0%2C0%2C-1%5D')
  globalThis.window = { location: { search: `?${query}` } }
  globalThis.document = { addEventListener() {} }
  t.after(() => {
    delete globalThis.window
    delete globalThis.document
  })
  let opened
  t.mock.property(
    globalThis,
    'WebSocket',
    class {
      constructor(url) {
        opened = new URL(url)
      }
      addEventListener() {}
    }
  )
  let deserialized = false
  const world = {
    loader: { preload() {}, execPreload() {} },
    apps: {
      worldMethods: {
        setQueryParam(_entity, key) {
          query.delete(key)
        },
      },
    },
    entities: {
      deserialize() {
        assert.equal(query.get('portalId'), null)
        deserialized = true
      },
    },
    settings: { deserialize() {}, setHasAdminCode() {} },
    collections: { deserialize() {} },
    chat: { deserialize() {} },
    ai: { deserialize() {} },
    blueprints: { deserialize() {} },
  }
  const network = new ClientNetwork(world)
  network.init({ wsUrl: 'wss://example.com/ws' })
  assert.equal(opened.searchParams.get('portalId'), 'exit')
  assert.equal(opened.searchParams.get('portalPose'), query.get('portalPose'))
  network.onSnapshot({ portalArrival: true, settings: {}, entities: [], blueprints: [], serverTime: 0 })
  assert.equal(deserialized, true)
  assert.equal(query.has('portalPose'), false)
  assert.equal(query.get('foo'), 'kept')
})
