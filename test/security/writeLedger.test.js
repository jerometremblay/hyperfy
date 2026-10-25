// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/writeLedger.test.js
import { callForScript } from '../../src/core/extras/scriptValues.js'
import { chatEnvelope } from '../../src/core/extras/chatPolicy.js'
import { sanitizePlayerSelfModify } from '../../src/core/extras/entityModifyPolicy.js'
import { readVec3, warnOnce } from '../../src/core/extras/physxConvert.js'
import { createEventLedger } from '../../src/core/extras/appEventQueue.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import * as THREE from 'three'
import {
  createWriteLedger,
  PACKET_CAP,
  SNAPSHOT_CAP,
  BACKLOG_CAP,
  SCRIPT_BACKLOG_CAP,
  SCRIPT_TICK_CAP,
  WRITE_OVERHEAD,
} from '../../src/core/extras/writeLedger.js'
import { fakeWs, makeNetwork, Socket, connectionMethod } from './lib/networkHarness.mjs'

const bytes = n => new Uint8Array(n)
const addSocket = (network, id = 'player') => {
  const ws = fakeWs()
  const socket = new Socket({ id, ws, network })
  network.sockets.set(id, socket)
  return socket
}

test('writeLedger: exact-size views, charged overhead, and callbacks release once in any order', () => {
  const ledger = createWriteLedger()
  const ws = fakeWs()
  const backing = Buffer.alloc(10000)
  const view = backing.subarray(13, 42)
  assert.equal(ledger.write(ws, view), true)
  assert.equal(ledger.write(ws, bytes(3)), true)
  const copy = ws.packets[0]
  assert.notEqual(copy.buffer, backing.buffer)
  assert.equal(copy.byteOffset, 0)
  assert.equal(copy.buffer.byteLength, 29)
  assert.equal(ledger.state(ws).queued, 32 + 2 * WRITE_OVERHEAD)
  ws.pending[1]()
  ws.pending[1]()
  assert.equal(ledger.state(ws).queued, 29 + WRITE_OVERHEAD)
  ws.pending[0]()
  assert.equal(ledger.state(ws).queued, 0)
})

test('writeLedger: exact cap is accepted; larger packets refuse without terminating anyone', () => {
  const logs = []
  const ledger = createWriteLedger({ log: line => logs.push(line) })
  const ws = fakeWs()
  assert.equal(ledger.write(ws, bytes(PACKET_CAP)), true)
  for (let i = 0; i < 3; i++) assert.equal(ledger.write(ws, bytes(PACKET_CAP + 1), { name: 'large' }), false)
  assert.equal(ws.terminations, 0)
  assert.equal(logs.length, 1)
  assert.equal(ws.packets.length, 1)
})

test('writeLedger: only explicit system snapshots get the larger cap; warn once across writers', () => {
  const logs = []
  const ledger = createWriteLedger({ log: line => logs.push(line) })
  const ws = fakeWs()
  assert.equal(ledger.write(ws, bytes(SNAPSHOT_CAP / 2), { snapshot: true }), true)
  assert.equal(logs.length, 0)
  ws.drain()
  assert.equal(ledger.write(ws, bytes(SNAPSHOT_CAP / 2 + 1), { snapshot: true }), true)
  assert.equal(logs.length, 1)
  assert.match(logs[0], /warning: snapshot exceeds 50%/)
  ws.drain()
  const other = createWriteLedger({ log: line => logs.push(line) })
  assert.equal(other.write(ws, bytes(SNAPSHOT_CAP), { snapshot: true }), true)
  assert.equal(other.state(ws).queued, BACKLOG_CAP)
  assert.equal(logs.length, 1, 'the warning is per process, not per socket or writer')
  ws.drain()
  assert.equal(other.state(ws).queued, 0)
  assert.equal(other.write(ws, bytes(SNAPSHOT_CAP + 1), { snapshot: true }), false)
  assert.equal(other.write(ws, bytes(900 * 1024), { name: 'snapshot' }), false)
  assert.equal(
    other.asScript(() => other.write(ws, bytes(900 * 1024), { snapshot: true })),
    false
  )
  assert.equal(ws.terminations, 0)
})

test('writeLedger: only the recipient exceeding its system backlog terminates; callbacks retain credit', () => {
  const logs = []
  const ledger = createWriteLedger({ log: line => logs.push(line) })
  const a = fakeWs()
  const b = fakeWs()
  const packet = bytes(PACKET_CAP - WRITE_OVERHEAD)
  assert.equal(ledger.write(a, packet), true)
  assert.equal(ledger.write(a, packet), true)
  assert.equal(ledger.state(a).queued, BACKLOG_CAP)
  assert.equal(ledger.write(a, bytes(1)), false)
  assert.equal(ledger.write(a, bytes(1)), false)
  assert.equal(a.terminations, 1)
  assert.equal(logs.length, 1)
  assert.match(logs[0], /queued=1048576/)
  assert.equal(ledger.write(b, bytes(1)), true)
  assert.equal(b.terminations, 0)
  assert.equal(ledger.state(a).queued, BACKLOG_CAP)
  a.drain()
  assert.equal(ledger.state(a).queued, 0)
})

test('writeLedger: broadcast copies once, reserves unique script bytes once, and returns partial delivery', () => {
  const network = makeNetwork()
  const a = addSocket(network, 'a')
  const b = addSocket(network, 'b')
  const entity = {}
  assert.equal(
    network.asScript(() => network.send('entityEvent', bytes(300 * 1024)), entity, 'event'),
    true
  )
  assert.equal(a.ws.packets[0], b.ws.packets[0])
  assert.equal(a.ws.packets[0].buffer.byteLength, a.ws.packets[0].length)
  assert.equal(
    network.asScript(() => network.send('entityEvent', bytes(300 * 1024)), entity, 'event'),
    false
  )
  assert.equal(a.ws.packets.length, 1)
  b.ws.drain()
  network.writer.resetTick()
  assert.equal(
    network.asScript(() => network.send('entityEvent', bytes(300 * 1024)), entity, 'event'),
    false
  )
  assert.equal(a.ws.packets.length, 1)
  assert.equal(b.ws.packets.length, 2)
  assert.equal(a.ws.terminations + b.ws.terminations, 0)
})

test('writeLedger: 40 x 400 KiB script sendTo calls stop at the producer without disconnecting', () => {
  const network = makeNetwork()
  const socket = addSocket(network)
  const entity = {}
  const results = []
  for (let i = 0; i < 40; i++) {
    results.push(network.asScript(() => network.sendTo(socket.id, 'entityEvent', bytes(400 * 1024)), entity, 'burst'))
    socket.ws.drain() // even an immediately reading peer cannot defeat the per-tick producer cap
  }
  assert.equal(results.filter(Boolean).length, 1)
  assert.equal(socket.ws.packets.length, 1)
  assert.equal(socket.ws.terminations, 0)
  network.writer.resetTick()
  assert.equal(
    network.asScript(() => network.sendTo(socket.id, 'entityEvent', bytes(400 * 1024)), entity, 'burst'),
    true
  )
})

test('writeLedger: 995 x 29 B script events skip at half backlog and a reading peer stays connected', () => {
  const ledger = createWriteLedger()
  const ws = fakeWs()
  let sent = 0
  for (let i = 0; i < 995; i++) if (ledger.write(ws, bytes(29), { script: true })) sent++
  assert.equal(sent, Math.floor(SCRIPT_BACKLOG_CAP / (29 + WRITE_OVERHEAD)))
  assert.ok(ledger.state(ws).queued <= SCRIPT_BACKLOG_CAP)
  assert.equal(ws.terminations, 0)
  ws.drain()
  assert.equal(ledger.write(ws, bytes(29), { script: true }), true)
})

test('writeLedger: script tick boundary, system reserve, nested context and throw restoration', () => {
  const ledger = createWriteLedger()
  const ws = fakeWs()
  assert.ok(ledger.prepare(bytes(SCRIPT_TICK_CAP), { script: true }))
  assert.equal(ledger.prepare(bytes(1), { script: true }), false)
  assert.throws(
    () =>
      ledger.asScript(() => {
        throw new Error('script')
      }, {}),
    /script/
  )
  assert.equal(ledger.write(ws, bytes(1)), true)
  assert.equal(
    ledger.asScript(() => {
      ledger.asScript(() => ledger.write(ws, bytes(1)), {})
    }, {}),
    false
  )
  ledger.resetTick()
  assert.equal(
    ledger.asScript(() => ledger.write(ws, bytes(1)), {}),
    true
  )
})

test('writeLedger: logs refusals once per app and name', () => {
  const logs = []
  const ledger = createWriteLedger({ log: line => logs.push(line) })
  const packet = bytes(PACKET_CAP + 1)
  const a = {},
    b = {}
  for (const source of [a, a, b]) ledger.asScript(() => ledger.prepare(packet), source, 'same')
  ledger.asScript(() => ledger.prepare(packet), a, 'different')
  assert.equal(logs.length, 3)
})

test('writeLedger: ping credit clears in callback; unsolicited pong cannot hide a pending ping', () => {
  const network = makeNetwork()
  const socket = addSocket(network)
  network.checkSockets()
  assert.equal(socket.alive, false)
  assert.equal(socket.pingPending, true)
  assert.equal(network.writer.state(socket.ws).queued, WRITE_OVERHEAD)
  socket.ws.emit('pong')
  network.checkSockets()
  assert.equal(socket.ws.terminations, 1)
  socket.ws.drain()
  assert.equal(socket.pingPending, false)
  assert.equal(network.writer.state(socket.ws).queued, 0)
  const other = addSocket(network, 'other')
  network.sockets.delete(socket.id)
  network.checkSockets()
  other.ws.drain()
  other.ws.emit('pong')
  network.checkSockets()
  assert.equal(other.ws.terminations, 0)
  other.ws.drain()
  network.checkSockets() // no pong this time
  assert.equal(other.ws.terminations, 1)
})

test('writeLedger: synchronous send errors release credit and close only that transport', () => {
  const ledger = createWriteLedger()
  const ws = fakeWs()
  ws.send = () => {
    throw new Error('closed')
  }
  assert.equal(ledger.write(ws, bytes(1)), false)
  assert.equal(ledger.state(ws).queued, 0)
  assert.equal(ws.terminations, 1)
})

// Strip imports only; exercise the real script APIs and their synchronous downstream sends.
const System = class {
  constructor(world) {
    this.world = world
  }
}
const loadClass = (file, name, context = {}) => {
  const source = fs.readFileSync(new URL(`../../src/core/${file}`, import.meta.url), 'utf8')
  return vm.runInNewContext(`${source.replace(/^import .*\n/gm, '').replace(/^export /gm, '')}\n${name}`, {
    System,
    console,
    THREE,
    uuid: () => 'id',
    internalEvents: [],
    moment: () => ({ toISOString: () => 'now' }),
    chatEnvelope: msg => chatEnvelope({ ...msg }),
    createEventLedger,
    ...context,
  })
}

test('writeLedger: real Apps send, sendTo, chat, proxy relays and LiveKit updates carry script attribution', () => {
  const network = makeNetwork()
  const socket = addSocket(network)
  const world = { network, events: { emit() {} }, entities: { get: () => player } }
  const player = {
    world,
    data: { id: socket.id, owner: socket.id, health: 100 },
    modify(data) {
      Object.assign(this.data, data)
    },
    setEffect() {},
  }
  const Chat = loadClass('systems/Chat.js', 'Chat')
  const Apps = loadClass('systems/Apps.js', 'Apps')
  const LiveKit = loadClass('systems/ServerLiveKit.js', 'ServerLiveKit', { process: { env: {} } })
  world.chat = new Chat(world)
  world.livekit = new LiveKit(world)
  const apps = new Apps(world)
  const entity = { data: { id: 'app' }, blueprint: { version: 0 } }
  const proxySource = fs.readFileSync(new URL('../../src/core/extras/createPlayerProxy.js', import.meta.url), 'utf8')
  const createProxy = vm.runInNewContext(
    `${proxySource.replace(/^import .*\n/gm, '').replace('export function', 'function')}\ncreatePlayerProxy`,
    {
      THREE,
      readVec3,
      warnOnce,
      callForScript,
      console,
      clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)),
      getStoredSeatPose: () => null,
      sanitizePlayerSelfModify: (data, id) => sanitizePlayerSelfModify({ ef: { ...data.ef } }, id),
    }
  )
  const proxy = createProxy(entity, player)
  // Exhaust only the unique script bytes; every accidental system write would still go through.
  network.writer.prepare(bytes(SCRIPT_TICK_CAP), { script: true })
  for (const call of [
    () => apps.appMethods.send(entity, 'event', 1),
    () => apps.appMethods.sendTo(entity, socket.id, 'event', 1),
    () => apps.worldMethods.chat(entity, { body: 'hello' }, true),
    () => proxy.teleport(new THREE.Vector3(), 0),
    () => proxy.push(new THREE.Vector3()),
    () => proxy.setSessionAvatar('asset://avatar.vrm'),
    () => proxy.damage(1),
    () => proxy.heal(1),
    () => proxy.applyEffect({ freeze: true }),
    () => proxy.setVoiceLevel('global'),
    () => proxy.setVoiceLevel('spatial'),
    () => proxy.setVoiceLevel(null),
  ])
    assert.equal(call(), false)
  assert.equal(socket.ws.packets.length, 0)
  // Engine teardown must undo voice overrides even when scripts exhausted their tick budget.
  proxy.setVoiceLevel('global')
  proxy.$cleanup()
  assert.equal(socket.ws.packets.length, 1)
  assert.equal(network.writer.state(socket.ws).queued > 0, true)
  assert.equal(network.send('chatAdded', { body: 'system' }), true)
  assert.equal(socket.ws.packets.length, 2)
  assert.equal(socket.ws.terminations, 0)
})

test('Apps: unknown players and internal-event refusals return false without sending', () => {
  const logs = []
  const Apps = loadClass('systems/Apps.js', 'Apps', {
    internalEvents: ['update'],
    console: { error: line => logs.push(line) },
  })
  const world = {
    network: { isServer: true, send: () => assert.fail('unexpected send') },
    entities: { get: () => undefined },
  }
  const apps = new Apps(world)
  assert.equal(apps.appMethods.send({}, 'update', {}), false)
  assert.equal(apps.appMethods.sendTo({}, 'missing', 'update', {}), false)
  assert.equal(apps.appMethods.sendTo({}, 'missing', 'probe', {}), false)
  assert.equal(logs.length, 2)
})

test('ServerNetwork: oversized snapshot closes with 1011 and never writes the snapshot', async () => {
  const logs = []
  const network = makeNetwork(line => logs.push(line))
  network.spawn = { position: [0, 0, 0], quaternion: [0, 0, 0, 1] }
  network.connecting = new Set()
  const user = { id: 'player', rank: 0 }
  network.db = () => ({ where: () => ({ first: async () => user }) })
  const serial = { serialize: () => [] }
  network.world = {
    ...network.world,
    settings: { ...serial, playerLimit: 0 },
    livekit: { ...serial, clearModifiers() {} },
    collections: serial,
    chat: serial,
    ai: serial,
    blueprints: { serialize: () => 'x'.repeat(SNAPSHOT_CAP) },
    entities: { ...serial, add: () => ({ data: user, destroy() {} }) },
    events: { emit() {} },
  }
  const method = connectionMethod({
    isNumber: n => typeof n === 'number',
    sanitizeName: () => 'name',
    isAvatarUrl: () => false,
    readJWT: async () => ({ userId: user.id }),
    process: { env: {} },
    performance,
    HEALTH_MAX: 100,
    console: { error: line => logs.push(line) },
  })
  const ws = fakeWs()
  ws.close = code => {
    ws.closeCode = code
  }
  await method.call(network, ws, { authToken: 'valid' })
  assert.equal(ws.closeCode, 1011)
  assert.equal(logs.filter(line => /snapshot write failed/.test(line)).length, 1)
  assert.equal(logs.length, 2, 'one write refusal and one connection failure are logged')
  assert.equal(ws.packets.length, 0)
  assert.equal(network.sockets.size, 0)
})

test('ServerNetwork: each tick resets the script budget before dispatching inbound handlers', () => {
  const network = makeNetwork()
  const socket = addSocket(network)
  network.writer.prepare(bytes(SCRIPT_TICK_CAP), { script: true })
  const send = () => network.send('entityEvent', 1)
  assert.equal(network.asScript(send, {}), false)
  network.flush = () => assert.equal(network.asScript(send, {}), true)
  network.preFixedUpdate()
  assert.equal(socket.ws.packets.length, 1)
})

test('writeLedger: explicit system option cannot bypass script attribution and closed writes return false', () => {
  const ledger = createWriteLedger()
  const ws = fakeWs()
  ledger.prepare(bytes(SCRIPT_TICK_CAP), { script: true })
  assert.equal(
    ledger.asScript(() => ledger.write(ws, bytes(1), { script: false }), {}),
    false
  )
  ws.readyState = 3
  assert.equal(
    ledger.asScript(() => {
      ledger.write(ws, bytes(1))
    }, {}),
    false
  )
})
