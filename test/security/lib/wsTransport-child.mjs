// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/lib/wsTransport-child.mjs
import assert from 'node:assert/strict'
import net from 'node:net'
import http from 'node:http'
import crypto from 'node:crypto'
import { once } from 'node:events'
import { setTimeout as delay, setImmediate as immediate } from 'node:timers/promises'
import { createRequire } from 'node:module'
import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import WebSocket from 'ws'
import { createConnectionLimits, readConnectionLimitsEnv } from '../../../src/server/connectionLimits.js'
import { BACKLOG_CAP, PACKET_CAP, WRITE_OVERHEAD } from '../../../src/core/extras/writeLedger.js'
import { PROTOCOL_VERSION, writeClientPacket } from '../../../src/core/packets.js'
import { loadRoute, makeNetwork, Socket } from './networkHarness.mjs'

const name = process.argv[2]
assert.equal(createRequire(import.meta.url)('ws/package.json').version, '8.22.0')
const until = async (fn, timeout = 5000) => {
  const start = performance.now()
  while (!fn()) {
    assert.ok(performance.now() - start < timeout, `timeout in ${name}`)
    await delay(5)
  }
}
const frame = (opcode, fin, payload) => {
  const size = payload.length
  const header =
    size < 126
      ? Buffer.from([(fin ? 128 : 0) | opcode, 128 | size])
      : Buffer.from([(fin ? 128 : 0) | opcode, 254, size >> 8, size & 255])
  // A zero mask is valid and makes the tiny and padding frames easy to inspect.
  return Buffer.concat([header, Buffer.alloc(4), payload])
}
const limits = createConnectionLimits({ ...readConnectionLimitsEnv({}), ratePerMin: 0, concurrentPerIp: 1 })
const logs = []
const network = makeNetwork(line => logs.push(line))
const connections = []
network.onConnection = ws => {
  const socket = new Socket({ id: String(connections.length), ws, network })
  ws.on('error', () => {})
  network.sockets.set(socket.id, socket)
  connections.push(socket)
}
const app = Fastify({ logger: false })
const route = loadRoute(limits, network)
const transports = []
let unblock
let inUpgrade = false
const gate = new Promise(resolve => {
  unblock = resolve
})
app.addHook('onRequest', (request, reply, done) => {
  transports.push(request.raw.socket)
  done()
})
app.addHook('preHandler', async request => {
  if (request.headers['x-abort']) {
    inUpgrade = true
    await gate
  }
})
await app.register(websocket, route.options)
await app.register(route.register)
try {
  await app.listen({ port: 0, host: '127.0.0.1' })
} catch (err) {
  if (!['EPERM', 'EACCES'].includes(err.code)) throw err
  process.stdout.write(
    JSON.stringify({ skip: `TCP listen denied (${err.code}); run test/wsTransport.test.js outside the sandbox` })
  )
  await app.close()
  process.exit(0)
}
const port = app.server.address().port
const clients = []
const connect = async options => {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?v=${PROTOCOL_VERSION}`, options)
  ws.on('error', () => {})
  clients.push(ws)
  await once(ws, 'open')
  return ws
}
const raw = async (query = `?v=${PROTOCOL_VERSION}`, headers = '') => {
  const socket = net.connect(port, '127.0.0.1')
  socket.on('error', () => {})
  clients.push(socket)
  await once(socket, 'connect')
  const response = once(socket, 'data')
  socket.write(
    `GET /ws${query} HTTP/1.1\r\nHost: localhost\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${crypto.randomBytes(16).toString('base64')}\r\nSec-WebSocket-Version: 13\r\n${headers}\r\n`
  )
  return { socket, response }
}

try {
  if (name === 'refused-upgrade') {
    const first = await connect()
    let connected = false
    const refused = new WebSocket(`ws://127.0.0.1:${port}/ws?v=${PROTOCOL_VERSION}`)
    clients.push(refused)
    refused.on('error', () => {})
    refused.on('open', () => {
      connected = true
    })
    const status = await new Promise(resolve =>
      refused.once('unexpected-response', (req, res) => {
        resolve({ status: res.statusCode, retry: res.headers['retry-after'] })
        res.resume()
        req.destroy()
      })
    )
    assert.deepEqual(status, { status: 503, retry: '10' })
    assert.equal(connected, false)
    assert.equal(connections.length, 1)
    assert.equal(limits.stats().active, 1)
    first.terminate()
    await until(() => limits.stats().active === 0)
  } else if (name === 'keepalive-upgrade') {
    const agent = new http.Agent({ keepAlive: true, maxSockets: 1 })
    try {
      for (let i = 0; i < 8; i++) {
        const status = await new Promise((resolve, reject) => {
          http
            .get({ hostname: '127.0.0.1', port, path: '/ws', agent }, res => {
              res.resume()
              res.once('end', () => resolve(res.statusCode))
            })
            .once('error', reject)
        })
        assert.equal(status, 404)
        assert.equal(limits.stats().active, 0)
      }
      await connect({ agent })
      assert.equal(connections.length, 1)
      assert.equal(limits.stats().active, 1)
      assert.equal(new Set(transports).size, 1, 'GETs and upgrade reuse the same TCP transport')
    } finally {
      agent.destroy()
    }
  } else if (name === 'abort-upgrade') {
    const { socket } = await raw(`?v=${PROTOCOL_VERSION}`, 'X-Abort: yes\r\n')
    await until(() => inUpgrade)
    assert.equal(limits.stats().active, 1)
    socket.resetAndDestroy()
    await until(() => limits.stats().active === 0)
    unblock()
    await immediate()
    assert.equal(connections.length, 0)
    await connect()
    assert.equal(connections.length, 1)
  } else if (name === 'outdated') {
    const start = performance.now()
    const { socket, response } = await raw('')
    const closed = new Promise(resolve => socket.once('close', resolve))
    await response
    await closed // raw peer deliberately never acknowledges the server's close frame
    assert.ok(performance.now() - start <= 2500, 'outdated TCP transport closes within 2.5 s')
    await until(() => limits.stats().active === 0)
    assert.equal(connections.length, 0)
  } else if (name === 'non-reader') {
    const peer = await connect()
    peer._socket.pause()
    const ws = connections[0].ws
    let queuedAtClose
    ws._socket.once('close', () => {
      queuedAtClose = network.writer.state(ws).queued
    })
    const packet = new Uint8Array(PACKET_CAP - WRITE_OVERHEAD)
    let writes = 0
    while (network.write(ws, packet)) {
      writes++
      assert.ok(writes < 10000, 'non-reader eventually fills the transport')
      assert.ok(network.writer.state(ws).queued <= BACKLOG_CAP)
      await immediate()
    }
    assert.ok(writes >= 2)
    assert.equal(network.writer.state(ws).terminated, true)
    await until(() => queuedAtClose !== undefined)
    assert.equal(queuedAtClose, 0, 'all callbacks precede transport close and lease release')
    assert.equal(network.writer.state(ws).queued, 0)
    assert.equal(limits.stats().active, 0)
    assert.equal(logs.filter(line => line.includes('write backlog full')).length, 1)
  } else {
    const { socket, response } = await raw()
    assert.match((await response)[0].toString(), /101 Switching Protocols/)
    await until(() => connections.length === 1)
    const ws = connections[0].ws
    if (name === 'pin') {
      const count = 1200
      const tiny = frame(2, true, writeClientPacket('ping', null))
      const padding = Buffer.concat(Array.from({ length: 460 }, () => frame(9, true, Buffer.alloc(125))))
      const wire = Buffer.concat([tiny, padding])
      let pongs = 0
      socket.on('data', () => pongs++)
      global.gc()
      const before = process.memoryUsage().arrayBuffers
      for (let i = 0; i < count; i++) {
        socket.write(wire)
        await until(() => connections[0].inbox.length === i + 1)
      }
      await delay(20)
      global.gc()
      global.gc()
      const growth = process.memoryUsage().arrayBuffers - before
      let accounted = 0
      for (const entry of connections[0].inbox) {
        assert.equal(entry.copy.buffer.byteLength, entry.bytes)
        accounted += entry.cost
      }
      assert.equal(accounted, connections[0].inboxCost)
      assert.ok(growth <= 2 * accounted + 1024 * 1024, `arrayBuffers growth ${growth}, accounted ${accounted}`)
      assert.equal(pongs, 0, 'autoPong is disabled')
    } else {
      let closeCode
      let received = Buffer.alloc(0)
      socket.on('data', chunk => {
        received = Buffer.concat([received, chunk])
        if (received.length >= 4 && (received[0] & 15) === 8) closeCode = received.readUInt16BE(2)
      })
      if (name === 'fragpin') {
        const padding = Buffer.concat(Array.from({ length: 460 }, () => frame(9, true, Buffer.alloc(125))))
        for (let i = 0; i < 8; i++) {
          socket.write(Buffer.concat([frame(i ? 0 : 2, false, Buffer.from([1])), padding]))
          await until(() => ws._receiver._numFragments === i + 1)
          assert.equal(ws.readyState, WebSocket.OPEN)
        }
        socket.write(frame(0, false, Buffer.from([1])))
        await until(() => closeCode !== undefined)
        assert.equal(closeCode, 1008)
      } else {
        assert.equal(name, '300k-fragments')
        const continuation = frame(0, false, Buffer.alloc(0))
        const wire = Buffer.alloc(300000 * continuation.length)
        for (let i = 0; i < 300000; i++) continuation.copy(wire, i * continuation.length)
        wire[0] = 2
        global.gc()
        const before = process.memoryUsage().heapUsed
        let growth
        ws.once('error', () => {
          global.gc()
          growth = process.memoryUsage().heapUsed - before
        })
        socket.write(wire)
        await until(() => closeCode !== undefined)
        assert.equal(closeCode, 1008)
        assert.ok(growth < 2 * 1024 * 1024, `heap growth ${growth}`)
      }
      assert.equal(connections[0].inbox.length, 0)
      assert.equal(connections[0].inboxCost, 0)
    }
  }
  process.stdout.write(JSON.stringify({ ok: true, name }))
} finally {
  unblock()
  for (const client of clients) {
    if (client instanceof WebSocket) client.terminate()
    else client.destroy()
  }
  for (const { ws } of connections) ws.terminate()
  await app.close()
}
