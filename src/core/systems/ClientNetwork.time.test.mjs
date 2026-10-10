import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const bundle = await build({
  stdin: {
    contents: `export { ClientNetwork } from './src/core/systems/ClientNetwork.js';
      export { ServerNetwork } from './src/core/systems/ServerNetwork.js';
      export { Settings } from './src/core/systems/Settings.js';
      export { Chat } from './src/core/systems/Chat.js';
      export { Apps } from './src/core/systems/Apps.js';
      export { App } from './src/core/entities/App.js';
      export { writePacket } from './src/core/packets.js';`,
    resolveDir: process.cwd(),
  },
  plugins: [
    {
      name: 'in-memory-storage',
      setup(build) {
        build.onResolve({ filter: /^\.\.\/storage$/ }, () => ({ path: 'storage', namespace: 'fixture' }))
        build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
          contents: 'export const storage = { get() {}, set() {} }',
        }))
      },
    },
  ],
  bundle: true,
  format: 'esm',
  banner: {
    js: `import { createRequire as clockRequire } from 'node:module'; const require = clockRequire('${process.cwd()}/clock-test.cjs');`,
  },
  platform: 'node',
  write: false,
})
const directory = await mkdtemp(join(tmpdir(), 'hyperfy-clock-test-'))
const filename = join(directory, 'bundle.mjs')
await writeFile(filename, bundle.outputFiles[0].contents)
const { ClientNetwork, ServerNetwork, Settings, Chat, Apps, App, writePacket } = await import(
  pathToFileURL(filename).href
)
await rm(directory, { recursive: true })

function client(settings, timestamp) {
  const world = {
    events: { emit() {} },
    loader: { preload() {}, execPreload() {} },
    collections: { deserialize() {} },
    ai: { deserialize() {} },
    blueprints: { deserialize() {} },
    entities: { deserialize() {} },
  }
  world.network = new ClientNetwork(world)
  world.settings = new Settings(world)
  world.chat = new Chat(world)
  world.apps = new Apps(world)
  world.network.onSnapshot({
    id: 'visitor',
    serverTime: 5000,
    serverTimestamp: timestamp,
    settings,
    blueprints: [],
    entities: [],
    chat: [],
  })
  const proxy = App.prototype.getWorldProxy.call({ world })
  return { world, network: world.network, proxy }
}

test('clients with different device clocks and uptimes share server world time through commands and late joins', async t => {
  const epoch = Date.parse('2026-10-09T12:00:00Z')
  let deviceTime = epoch
  let uptime = 5000
  t.mock.method(Date, 'now', () => deviceTime)
  t.mock.method(performance, 'now', () => uptime)
  const server = { events: { emit() {} } }
  server.network = new ServerNetwork(server)
  clearInterval(server.network.socketIntervalId)
  server.settings = new Settings(server)
  server.chat = new Chat(server)
  server.apps = new Apps(server)
  const serverProxy = App.prototype.getWorldProxy.call({ world: server })
  uptime = 1000
  deviceTime = epoch - 12 * 3600000
  const first = client(server.settings.serialize(), epoch)
  uptime = 90000
  deviceTime = epoch + 5 * 3600000
  const second = client(server.settings.serialize(), epoch)
  assert.equal(second.proxy.time, epoch)
  second.proxy.time = 0
  assert.equal(second.proxy.time, epoch)
  assert.equal(second.proxy.timeZone, 'America/Toronto')

  const peers = [first, second]
  server.network.send = (event, data) => {
    const previous = uptime
    for (const [i, peer] of peers.entries()) {
      uptime = [1000, 90000][i]
      if (event === 'settingsModified') peer.network.onSettingsModified(data)
      if (event === 'chatAdded') peer.network.onChatAdded(data)
    }
    uptime = previous
  }
  deviceTime = epoch
  uptime = 5000
  const socket = {
    id: 'builder',
    player: { data: { id: 'builder' }, isBuilder: () => true },
    send() {
      throw new Error('Success must be broadcast')
    },
  }
  await server.network.onCommand(socket, { args: ['time', 'set', '13h23'], timeTarget: 1e20 })
  for (const [i, peer] of peers.entries()) {
    uptime = [1000, 90000][i] + 2500
    deviceTime = epoch + 2500 + [12, -5][i] * 3600000
    const expected = server.settings.timeTransition.fromOffset + epoch + 2500 + server.settings.timeOffset / 2
    assert.equal(peer.proxy.time, expected)
    assert.equal(peer.world.chat.msgs.at(-1).body, server.chat.msgs.at(-1).body)
  }
  deviceTime = epoch + 2500
  uptime = 700000
  const late = client(server.settings.serialize(), epoch + 2500)
  uptime = 1000 + 2500
  const firstTime = first.proxy.time
  uptime = 700000
  assert.equal(late.proxy.time, firstTime)
  deviceTime = epoch + 5000
  uptime = 700000 + 2500
  const target = Date.parse('2026-10-09T17:23:00Z')
  assert.equal(late.proxy.time, target)
  assert.equal(serverProxy.time, target)
  uptime += 60000
  deviceTime += 60000
  assert.equal(late.proxy.time, target + 60000)
})

test('round-trip synchronization corrects snapshot latency without depending on client Date.now', t => {
  let uptime = 1000
  t.mock.method(performance, 'now', () => uptime)
  t.mock.method(Date, 'now', () => 0)
  const epoch = Date.parse('2026-10-09T12:00:00Z')
  const { network, proxy } = client(new Settings({}).serialize(), epoch)
  uptime = 1200
  network.onPacket({ data: writePacket('pong', { clientTime: 1000, serverTime: epoch + 100 }) })
  assert.equal(network.queue.length, 0)
  assert.equal(proxy.time, epoch + 200)
  uptime = 2200
  assert.equal(proxy.time, epoch + 1200)
  network.onPong({ clientTime: Infinity, serverTime: 0 })
  assert.equal(proxy.time, epoch + 1200)
  network.onPong({ clientTime: -10000, serverTime: 0 })
  assert.equal(proxy.time, epoch + 1200)
})

test('clock sync works with stats disabled and preserves legacy latency pings', t => {
  let uptime = 0
  t.mock.method(performance, 'now', () => uptime)
  const world = { stats: { onPong: time => assert.equal(time, 123) } }
  const network = new ClientNetwork(world)
  assert.equal(network.getServerTime(), null)
  const pings = []
  network.ws = { readyState: 1 }
  network.send = (...args) => pings.push(args)
  network.preFixedUpdate()
  uptime = 9999
  network.preFixedUpdate()
  assert.equal(pings.length, 1)
  uptime = 10000
  network.preFixedUpdate()
  assert.equal(pings.length, 2)
  network.onVisibilityChange()
  network.preFixedUpdate()
  assert.equal(pings.length, 3)
  network.onPong(123)
  const server = new ServerNetwork({})
  clearInterval(server.socketIntervalId)
  const replies = []
  const socket = { send: (...args) => replies.push(args) }
  server.onPing(socket, 123)
  assert.deepEqual(replies[0], ['pong', 123])
  server.onPing(socket, { clientTime: 10000 })
  assert.equal(replies[1][1].clientTime, 10000)
  assert.equal(replies[1][1].serverTime, server.getServerTime())
})
