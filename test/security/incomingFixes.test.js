import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import test from 'node:test'
import { loadClient } from './lib/clientHarness.mjs'
import { PROTOCOL_VERSION } from '../../src/core/packets.js'

const Chat = loadClient('core/systems/Chat.js', 'Chat')
const ServerNetwork = loadClient('core/systems/ServerNetwork.js', 'ServerNetwork', {
  createRelayDrop: () => {},
  createInboundGate: () => {},
  createInboundScheduler: () => {},
  createWriteLedger: () => {},
  createLogOnce: () => {},
})

function chatWorld(id) {
  const world = {
    entities: { player: { data: { id, name: id } }, getPlayer: () => null },
    events: new EventEmitter(),
    network: { isClient: true, send: (name, data) => world.sent.push([name, data]) },
    sent: [],
  }
  world.chat = new Chat(world)
  return world
}

test('chat round trip retains one local echo and sends canonical text to peers', async t => {
  const sender = chatWorld('sender')
  const peer = chatWorld('peer')
  const server = chatWorld('server')
  const network = new ServerNetwork(server)
  t.after(() => clearInterval(network.socketIntervalId))
  network.send = (name, data, ignoredId) => {
    for (const world of [sender, peer]) {
      if (world.entities.player.data.id !== ignoredId) world.chat.add(data, false)
    }
  }
  const local = sender.chat.send(`  ${'x'.repeat(498)}😀tail  `)
  await network.onChatAdded({ id: 'sender', player: sender.entities.player }, sender.sent[0][1])
  assert.equal(sender.chat.msgs.length, 1)
  assert.equal(peer.chat.msgs.length, 1)
  assert.equal(server.chat.msgs.length, 1)
  assert.equal(local.body, `${'x'.repeat(498)}😀`)
  assert.equal(peer.chat.msgs[0].body, local.body)
  assert.equal(peer.chat.msgs[0].fromId, 'sender')
  assert.notEqual(peer.chat.msgs[0].id, local.id, 'the server owns the peer envelope')
  assert.equal(sender.chat.send('  \n '), undefined)
  assert.equal(sender.chat.msgs.length, 1)
  assert.equal(sender.sent.length, 1)
})

class Socket {
  static OPEN = 1
  static CONNECTING = 0
  constructor(url) {
    this.url = new URL(url)
    this.readyState = 1
  }
  addEventListener() {}
  removeEventListener() {}
  close() {
    this.readyState = 3
  }
  send() {}
}

function clientFixture(t) {
  const saved = new Map([['authToken', 'shared-token']])
  const requests = []
  const writes = []
  const Network = loadClient('core/systems/ClientNetwork.js', 'ClientNetwork', {
    PROTOCOL_VERSION,
    emoteUrls: [],
    WebSocket: Socket,
    window: {},
    document: {},
    storage: {
      get: key => saved.get(key),
      set: (key, value) => {
        writes.push([key, value])
        saved.set(key, value)
      },
    },
    hashFile: async () => 'a'.repeat(64),
    CHECK_TIMEOUT_MS: 1000,
    UPLOAD_TIMEOUT_MS: 1000,
    fetchWithRetry: async (url, options) => {
      requests.push({ url, options })
      return { ok: true, json: async () => ({ exists: false }) }
    },
    console: { log() {}, error() {} },
  })
  function client() {
    const world = new EventEmitter()
    world.loader = { preload() {}, execPreload() {} }
    world.collections = { deserialize() {} }
    world.settings = { deserialize() {}, setHasAdminCode() {} }
    world.chat = { deserialize() {}, add() {} }
    world.blueprints = { deserialize() {} }
    world.entities = { deserialize() {} }
    const network = new Network(world)
    t.after(() => network.destroy())
    return network
  }
  return { client, requests, writes, saved }
}

function snapshot(authToken, id = 'client') {
  return {
    id,
    authToken,
    serverTime: 0,
    apiUrl: 'https://example.test/api',
    settings: {},
    collections: [],
    chat: [],
    blueprints: [],
    entities: [],
  }
}

test('headless snapshots work without AI and keep socket/upload credentials per client', async t => {
  const fixture = clientFixture(t)
  const tokens = [[], []]
  const clients = [fixture.client(), fixture.client()]
  for (const [index, client] of clients.entries()) {
    client.init({
      wsUrl: 'wss://example.test/ws',
      authToken: `initial-${index}`,
      onAuthToken: value => tokens[index].push(value),
    })
    assert.equal(client.ws.url.searchParams.get('authToken'), `initial-${index}`)
    assert.equal(client.ws.url.searchParams.get('v'), String(PROTOCOL_VERSION))
    client.onSnapshot(snapshot(`session-${index}`))
  }
  const file = new File(['payload'], 'asset.glb')
  for (const client of clients) await client.uploadFile(file)
  assert.deepEqual(tokens, [['session-0'], ['session-1']])
  assert.equal(fixture.writes.length, 0)
  assert.equal(fixture.saved.get('authToken'), 'shared-token')
  assert.deepEqual(
    fixture.requests.map(request => request.options.headers.Authorization),
    ['Bearer session-0', 'Bearer session-0', 'Bearer session-1', 'Bearer session-1']
  )
})

test('browser clients retain shared storage while caller-owned anonymous clients avoid it', t => {
  const fixture = clientFixture(t)
  const browser = fixture.client()
  browser.init({ wsUrl: 'wss://example.test/ws' })
  assert.equal(browser.ws.url.searchParams.get('authToken'), 'shared-token')
  browser.onSnapshot(snapshot('browser-session'))
  assert.equal(fixture.saved.get('authToken'), 'browser-session')
  const anonymous = fixture.client()
  anonymous.init({ wsUrl: 'wss://example.test/ws', onAuthToken() {} })
  assert.equal(anonymous.ws.url.searchParams.has('authToken'), false)
  const explicitlyEmpty = fixture.client()
  explicitlyEmpty.init({ wsUrl: 'wss://example.test/ws', authToken: '', onAuthToken() {} })
  assert.equal(explicitlyEmpty.ws.url.searchParams.has('authToken'), false)
})

test('a queued kick is delivered before disconnect listeners can tear down the client', t => {
  const fixture = clientFixture(t)
  const client = fixture.client()
  const events = []
  client.world.on('kick', code => events.push(['kick', code]))
  client.world.on('disconnect', () => events.push(['disconnect']))
  client.enqueue('onKick', 'session-expired')
  client.onClose()
  assert.deepEqual(events, [['kick', 'session-expired'], ['disconnect']])
  assert.equal(client.queue.length, 0)
})

test('fatal disconnect discards queued mutations', t => {
  const fixture = clientFixture(t)
  const client = fixture.client()
  client.world.fatalError = 'physics stopped'
  client.onEntityModified = () => assert.fail('a fatal world must not resume mutation')
  client.enqueue('onEntityModified', { id: 'player', position: [1, 2, 3] })
  client.onClose()
  assert.equal(client.queue.length, 0)
})
