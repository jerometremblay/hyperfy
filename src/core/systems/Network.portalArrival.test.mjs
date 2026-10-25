import { readInboundPacket } from '../../server/inboundDecode.js'
import assert from 'node:assert/strict'
import Module from 'node:module'
import path from 'node:path'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'
import { sanitizePlayerSession } from '../extras/playerSession.js'
import { Storage } from '../../server/Storage.js'
import fs from 'node:fs/promises'
import os from 'node:os'
import { Entity } from '../entities/Entity.js'
import { seatPoseStorageKey } from '../extras/seatPose.js'

const bundle = await build({
  stdin: {
    contents: `export { ServerNetwork } from './src/core/systems/ServerNetwork.js';
      export { ClientNetwork } from './src/core/systems/ClientNetwork.js';
      export { Portal } from './src/core/nodes/Portal.js';
      export { Nametags } from './src/core/systems/Nametags.js';
      export { Nametag } from './src/core/nodes/Nametag.js';
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
const { ServerNetwork, ClientNetwork, Portal, Nametags, Nametag, readPacket } = compiled.exports

function serverFixture({ doubleside = false, moving = false, disabled = false, worldNode = false } = {}) {
  const items = new Map()
  const stored = new Map()
  const world = {
    storage: { get: key => stored.get(key), set: (key, value) => stored.set(key, value) },
    anchors: { get: id => (id === 'sofa:seat' ? {} : null) },
    stage: { dirtyNodes: new Set() },
    settings: { serialize: () => ({}), avatar: null },
    livekit: { serialize: async () => ({}) },
    entities: {
      items,
      get: id => items.get(id),
      add(data, local) {
        const entity = new Entity(world, data, local)
        entity.isPlayer = data.type === 'player'
        entity.isBuilder = () => data.rank >= 1
        entity.modify = changes => {
          Object.assign(data, changes)
        }
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
  world.network = network
  clearInterval(network.socketIntervalId)
  network.spawn = { position: [0, 0, 0], quaternion: [0, 0, 0, 1] }
  network.db = () => ({ where: () => ({ first: async () => ({ id: 'visitor', name: 'Visitor', rank: 0 }) }) })
  const packets = []
  const ws = {
    readyState: 1,
    close() {},
    terminate() {},
    once() {},
    on() {},
    send(packet, callback) {
      packets.push(readPacket(packet))
      callback?.()
    },
  }
  return { world, portal, network, packets, ws, stored }
}

const session = {
  position: [4, 1, 7],
  quaternion: [0, 0, 0, 1],
  camera: { quaternion: [0, 1, 0, 0], zoom: 0, firstPerson: true },
}

test('an existing observer receives the custom seat pose in the returning player announcement', async () => {
  const remoteBundle = await build({
    entryPoints: [path.join(process.cwd(), 'src/core/entities/PlayerRemote.js')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
  })
  const { PlayerRemote } = await import(
    `data:text/javascript;base64,${Buffer.from(remoteBundle.outputFiles[0].contents).toString('base64')}`
  )
  const fixture = serverFixture()
  const observerPackets = []
  fixture.network.sockets.set('observer', {
    id: 'observer',
    ws: {
      readyState: 1,
      send(packet, callback) {
        observerPackets.push(readPacket(packet))
        callback?.()
      },
    },
  })
  const pose = {
    version: 1,
    anchorId: 'sofa:seat',
    avatarUrl: 'asset://avatar.vrm',
    offset: [0.12, -0.08, 0.2],
    rotation: [0, 0, 0, 1],
    pose: { hips: { rotation: [0, 0, 0, 1], position: [0, 0.1, 0] } },
  }
  fixture.stored.set('playerSession:visitor', { ...session, effect: { anchorId: pose.anchorId } })
  fixture.stored.set(seatPoseStorageKey('visitor', pose.avatarUrl, pose.anchorId), pose)

  await fixture.network.onConnection(fixture.ws, { authToken: 'token' })

  const snapshot = fixture.packets.find(([name]) => name === 'onSnapshot')[1]
  const localData = snapshot.entities.find(entity => entity.id === 'visitor')
  assert.deepEqual(localData.seatPose, pose)
  const remoteData = observerPackets.find(([name]) => name === 'onEntityAdded')[1]
  assert.deepEqual(remoteData.seatPose, pose)
  const avatar = {
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    setPoseOverride(value) {
      this.pose = value
    },
  }
  PlayerRemote.prototype.applySeatPose.call({ data: remoteData, avatar })
  assert.deepEqual(avatar.position.toArray(), pose.offset)
  assert.deepEqual(avatar.quaternion.toArray(), pose.rotation)
  assert.deepEqual(avatar.pose, pose.pose)
  const nametag = new Nametag({ loading: remoteData.loading })
  const updates = []
  nametag.handle = { setLoading: value => updates.push(value) }
  const remote = { data: remoteData, nametag }
  PlayerRemote.prototype.modify.call(remote, { loading: 42 })
  PlayerRemote.prototype.modify.call(remote, { loading: null })
  assert.deepEqual(updates, [42, null])
})

test('returning player resumes a persisted sofa seat and camera; portal arrivals take priority', async () => {
  for (const portalArrival of [false, true]) {
    const fixture = serverFixture()
    fixture.stored.set('playerSession:visitor', { ...session, effect: { anchorId: 'sofa:seat' } })
    await fixture.network.onConnection(fixture.ws, {
      authToken: 'token',
      ...(portalArrival ? { portalId: 'exit' } : {}),
    })
    const snapshot = fixture.packets.find(([name]) => name === 'onSnapshot')[1]
    const player = snapshot.entities.find(entity => entity.id === 'visitor')
    assert.deepEqual(snapshot.playerSession, portalArrival ? null : session)
    assert.deepEqual(player.effect, portalArrival ? null : { anchorId: 'sofa:seat', snare: 1, cancellable: true })
    if (!portalArrival) assert.deepEqual(player.position, session.position)
  }
})

test('missing and occupied seats do not restore a seating effect', async () => {
  for (const anchorId of ['deleted:seat', 'sofa:seat']) {
    const fixture = serverFixture()
    fixture.stored.set('playerSession:visitor', { ...session, effect: { anchorId } })
    fixture.world.entities.items.set('other', { isPlayer: true, data: { effect: { anchorId: 'sofa:seat' } } })
    await fixture.network.onConnection(fixture.ws, { authToken: 'token' })
    assert.equal(fixture.world.entities.items.get('visitor').data.effect, null)
  }
})

test('session checkpoints persist only the sender and current seat, rejecting malformed data', () => {
  const fixture = serverFixture()
  const socket = { id: 'visitor', player: { data: { effect: { anchorId: 'sofa:seat' } } } }
  fixture.network.onPlayerSession(socket, { ...session, effect: { anchorId: 'forged:seat' } })
  assert.deepEqual(fixture.stored.get('playerSession:visitor'), { ...session, effect: { anchorId: 'sofa:seat' } })
  fixture.network.onPlayerSession(socket, { ...session, position: [NaN, 1, 2] })
  assert.deepEqual(fixture.stored.get('playerSession:visitor').position, session.position)
  socket.player.data.effect = null
  fixture.network.persistPlayerSession(socket)
  assert.equal(fixture.stored.get('playerSession:visitor').effect, null)
  assert.equal(sanitizePlayerSession({ ...session, camera: { ...session.camera, quaternion: [0, 0, 0, 0] } }), null)
})

test('saved location and camera survive storage reload and a new connection', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'hyperfy-session-'))
  const filename = path.join(directory, 'storage.json')
  const fixture = serverFixture()
  const storage = new Storage(filename)
  fixture.world.storage = storage
  try {
    fixture.network.onPlayerSession({ id: 'visitor', player: { data: { effect: null } } }, session)
    storage.save.cancel()
    await storage.persist()
    const restored = serverFixture()
    restored.world.storage = new Storage(filename)
    await restored.network.onConnection(restored.ws, { authToken: 'token' })
    const snapshot = restored.packets.find(([name]) => name === 'onSnapshot')[1]
    assert.deepEqual(snapshot.playerSession, session)
    assert.deepEqual(restored.world.entities.items.get('visitor').data.position, session.position)
  } finally {
    storage.save.cancel()
    await fs.rm(directory, { recursive: true, force: true })
  }
})

test('client checkpoints the native camera and final location without sending before initialization', () => {
  const world = { entities: {} }
  const network = new ClientNetwork(world)
  const packets = []
  network.ws = { readyState: 1, send: packet => packets.push(readInboundPacket(packet)) }
  network.savePlayerSession()
  assert.equal(packets.length, 0)
  world.entities.player = {
    control: {},
    base: {
      position: new THREE.Vector3().fromArray(session.position),
      quaternion: new THREE.Quaternion().fromArray(session.quaternion),
    },
    cam: { quaternion: new THREE.Quaternion().fromArray(session.camera.quaternion), zoom: 0 },
    firstPerson: true,
  }
  network.onVisibilityChange()
  assert.deepEqual(packets, [['onPlayerSession', session]])
})

test('loading progress follows the asset bar and clears only after controls and assets are ready', () => {
  const loader = { loading: { pending: 4, completed: 3, failed: 1 }, loadingBatchStart: 2 }
  const world = { loader }
  const network = new ClientNetwork(world)
  const packets = []
  network.id = 'visitor'
  network.ws = { readyState: 1, send: packet => packets.push(readInboundPacket(packet)) }
  network.publishLoading()
  assert.deepEqual(packets.pop(), ['onEntityModified', { id: 'visitor', loading: 33 }])
  network.publishLoading()
  assert.equal(packets.length, 0)
  loader.loading = { pending: 0, completed: 6, failed: 2 }
  network.publishLoading()
  assert.deepEqual(packets.pop(), ['onEntityModified', { id: 'visitor', loading: 99 }])
  network.onPlayerReady(true)
  assert.deepEqual(packets.pop(), ['onEntityModified', { id: 'visitor', loading: null }])
  // Later loads use the same status as the local asset bar, including failures.
  loader.loadingBatchStart = 8
  loader.loading = { pending: 2, completed: 6, failed: 2 }
  network.publishLoading()
  assert.deepEqual(packets.pop(), ['onEntityModified', { id: 'visitor', loading: 0 }])
  loader.loading = { pending: 1, completed: 6, failed: 3 }
  network.publishLoading()
  assert.deepEqual(packets.pop(), ['onEntityModified', { id: 'visitor', loading: 50 }])
  loader.loading = { pending: 0, completed: 7, failed: 3 }
  network.onLoadingChanged()
  network.sendLoading.flush()
  assert.deepEqual(packets.pop(), ['onEntityModified', { id: 'visitor', loading: null }])
  network.sendLoading.cancel()
})

test('player loading updates reach observers and late joins while rejecting forged and invalid updates', async () => {
  const fixture = serverFixture()
  const observerPackets = []
  fixture.network.sockets.set('observer', {
    id: 'observer',
    ws: {
      readyState: 1,
      send(packet, callback) {
        observerPackets.push(readPacket(packet))
        callback?.()
      },
    },
  })
  await fixture.network.onConnection(fixture.ws, { authToken: 'token', loading: '1' })
  const player = fixture.world.entities.items.get('visitor')
  assert.equal(observerPackets[0][1].loading, 0)
  const socket = fixture.network.sockets.get('visitor')
  await fixture.network.onEntityModified(socket, { id: 'visitor', loading: 42 })
  assert.deepEqual(observerPackets.at(-1), ['onEntityModified', { id: 'visitor', loading: 42 }])
  assert.equal(fixture.world.entities.serialize().find(data => data.id === 'visitor').loading, 42)
  for (const loading of [-1, 101, NaN, '50', {}, undefined]) {
    await fixture.network.onEntityModified(socket, { id: 'visitor', loading })
    assert.equal(player.data.loading, 42)
  }
  const originalError = console.error
  console.error = () => {}
  try {
    await fixture.network.onEntityModified({ id: 'other' }, { id: 'visitor', loading: null })
    assert.equal(player.data.loading, 42)
  } finally {
    console.error = originalError
  }
  await fixture.network.onEntityModified(socket, { id: 'visitor', loading: null })
  assert.equal(player.data.loading, null)
})

test('clients without asset-loading support do not get a permanent loading indicator', async () => {
  const fixture = serverFixture()
  await fixture.network.onConnection(fixture.ws, { authToken: 'token' })
  assert.equal(fixture.world.entities.items.get('visitor').data.loading, null)
})

test('nametag draws loading below the name and health and clears it when ready', () => {
  const texts = []
  const fills = []
  const ctx = {
    clearRect() {},
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    arc() {},
    closePath() {},
    strokeText() {},
    fillText: (text, x, y) => texts.push({ text, x, y }),
    fill() {
      fills.push(this.fillStyle)
    },
    measureText: text => ({ width: text.length * 10 }),
  }
  const system = { ctx, texture: {}, fitText: Nametags.prototype.fitText }
  const tag = { idx: 0, name: 'Visitor', health: 80, loading: 42 }
  Nametags.prototype.draw.call(system, tag)
  assert.deepEqual(
    texts.map(item => item.text),
    ['Visitor', 'Loading assets 42%']
  )
  assert.ok(texts[1].y > texts[0].y + 32 + 24)
  assert.ok(texts[1].y + 32 < 110, 'loading bar fits within its atlas slot')
  assert.deepEqual(fills, ['rgba(0, 0, 0, 0.6)', '#229710', 'rgba(0,0,0,0.6)', 'white'])
  texts.length = 0
  tag.loading = null
  Nametags.prototype.draw.call(system, tag)
  assert.deepEqual(
    texts.map(item => item.text),
    ['Visitor']
  )
  const node = new Nametag({ loading: 0 })
  const updates = []
  node.handle = { setLoading: value => updates.push(value) }
  node.loading = 42
  node.loading = null
  assert.deepEqual(updates, [42, null])
})

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
