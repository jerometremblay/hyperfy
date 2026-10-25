import assert from 'node:assert/strict'
import Module from 'node:module'
import path from 'node:path'
import test from 'node:test'
import { build } from 'esbuild'

const bundle = await build({
  stdin: {
    contents: `export { ServerNetwork } from './src/core/systems/ServerNetwork.js';
      export { Settings } from './src/core/systems/Settings.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'cjs',
  platform: 'node',
  write: false,
})
const filename = path.join(process.cwd(), 'src/core/systems/security-test-bundle.cjs')
const compiled = new Module(filename)
compiled.filename = filename
compiled.paths = Module._nodeModulePaths(path.dirname(filename))
compiled._compile(bundle.outputFiles[0].text, filename)
const { ServerNetwork, Settings } = compiled.exports

function fixture(t, builder = false) {
  const changes = []
  const sent = []
  const player = {
    isPlayer: true,
    data: { id: 'visitor', userId: 'visitor', owner: 'visitor', rank: 0 },
    isBuilder: () => builder,
    isAdmin: () => false,
    modify(data) {
      changes.push(data)
      Object.assign(this.data, data)
    },
  }
  const app = {
    isApp: true,
    data: { id: 'app', blueprint: 'blueprint', mover: null, uploader: null },
    modify: data => changes.push(data),
  }
  const world = {
    entities: { get: id => (id === 'visitor' ? player : id === 'app' ? app : null) },
    blueprints: { get: id => (id === 'blueprint' ? { id, version: 0 } : null) },
    chat: { add: msg => changes.push(msg) },
  }
  world.settings = new Settings(world)
  world.settings.setHasAdminCode(true)
  const network = new ServerNetwork(world)
  t.after(() => clearInterval(network.socketIntervalId))
  network.send = (...args) => sent.push(args)
  network.sendTo = (...args) => sent.push(args)
  const socket = { id: 'visitor', player, send: (...args) => sent.push(args) }
  return { network, socket, player, app, world, changes, sent }
}

test('a visitor cannot promote their own rank or change server-controlled player fields', async t => {
  const { network, socket, player, changes } = fixture(t)
  await network.onEntityModified(socket, { id: 'visitor', rank: 2, health: 999, owner: 'other', userId: 'other' })
  assert.equal(player.data.rank, 0)
  assert.equal(player.data.owner, 'visitor')
  assert.equal(player.data.userId, 'visitor')
  assert.equal(changes.length, 0)
})

test('visitors cannot edit apps; a lost builder can release only their own pending edit', async t => {
  const { network, socket, app, changes } = fixture(t)
  await network.onEntityModified(socket, { id: 'app', pinned: true, mover: 'visitor' })
  assert.deepEqual(changes, [])
  app.data.mover = 'visitor'
  await network.onEntityModified(socket, { id: 'app', mover: null, pinned: true, position: [1, 2, 3] })
  assert.deepEqual(changes, [{ id: 'app', mover: null }])
})

test('player motion remains available but invalid transforms never reach an entity', async t => {
  const { network, socket, changes } = fixture(t)
  await network.onEntityModified(socket, { id: 'visitor', p: [NaN, 0, 0], q: [0, 0, 0, 0] })
  assert.deepEqual(changes, [])
  await network.onEntityModified(socket, { id: 'visitor', p: [1, 2, 3], q: [0, 0, 0, 1], rank: 2 })
  assert.deepEqual(changes, [{ id: 'visitor', p: [1, 2, 3], q: [0, 0, 0, 1] }])
})

test('client cross-player teleport, push, and avatar relays are ignored', t => {
  const { network, socket, sent } = fixture(t)
  network.onPlayerTeleport(socket, { networkId: 'other', position: [1, 2, 3] })
  network.onPlayerPush(socket, { networkId: 'other', force: [1, 2, 3] })
  network.onPlayerSessionAvatar(socket, { networkId: 'other', avatar: 'asset://avatar.vrm' })
  assert.deepEqual(sent, [])
})

test('chat attribution, IDs, timestamps, and text limits belong to the server', async t => {
  const { network, socket, changes } = fixture(t)
  await network.onChatAdded(socket, {
    id: 'spoof',
    body: 'x'.repeat(600),
    from: 'Admin',
    fromId: 'admin',
    createdAt: 'fake',
  })
  assert.equal(changes[0].body.length, 500)
  assert.equal(changes[0].fromId, socket.id)
  assert.notEqual(changes[0].id, 'spoof')
  assert.notEqual(changes[0].createdAt, 'fake')
  await network.onChatAdded(socket, { body: { arbitrary: 'object' } })
  assert.equal(changes.length, 1)
})

test('builder settings cannot change admin fields, prototypes, or server-only time state', t => {
  const { network, socket, world } = fixture(t, true)
  const before = world.settings.serialize()
  for (const [key, value] of [
    ['rank', 2],
    ['customAvatars', true],
    ['constructor', null],
    ['hasAdminCode', false],
    ['timeOffset', 1000],
  ]) {
    network.onSettingsModified(socket, { key, value })
  }
  assert.deepEqual(world.settings.serialize(), before)
  assert.equal(world.settings.hasAdminCode, true)
  network.onSettingsModified(socket, { key: 'longitude', value: 10 })
  assert.equal(world.settings.longitude, 10)
})
