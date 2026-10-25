// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/inboundPolicy.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BUILDER_ONLY_PACKETS,
  INBOUND_BURST,
  INBOUND_WORK_PER_TICK,
  INBOUND_QUANTUM,
  INBOUND_DEFAULT_BYTE_LIMIT,
  INBOUND_DEFAULT_NODE_LIMIT,
  INBOUND_RATE_PER_SECOND,
  INBOX_ENTRY_OVERHEAD,
  INBOX_RESERVE,
  INBOX_SOCKET_CAP,
  INBOX_POOL_CAP,
  createInboundGate,
  packetByteLimit,
  packetCost,
  packetNodeLimit,
} from '../../src/core/extras/inboundPolicy.js'
import { writeClientPacket } from '../../src/core/packets.js'
import { strictDecode } from '../../src/core/extras/strictDecode.js'

const KiB = 1024
const make = () => {
  let t = 1_000_000
  let calls = 0
  let scanned = 0
  const logs = []
  const gate = createInboundGate({
    now: () => t,
    log: m => logs.push(m),
    scan: (packet, options) => {
      calls++
      const result = strictDecode(packet, options)
      scanned += result.nodes
      return result
    },
  })
  return {
    gate,
    logs,
    tick: ms => {
      t += ms
    },
    calls: () => calls,
    scanned: () => scanned,
  }
}
// A tuple carrying a single string, sized to the exact byte cap without extra nodes.
const sized = (name, size) => {
  const id = writeClientPacket(name, null)[1]
  const packet = Buffer.alloc(size, 0x61)
  packet.set([0x92, id, 0xdb, 0, 0, 0, 0])
  packet.writeUInt32BE(size - 7, 3)
  return packet
}
const dense = (name, nodes, invalid = false) => {
  const id = writeClientPacket(name, null)[1]
  const packet = Buffer.alloc(nodes + 2)
  packet.set([0x92, id, 0xdc, (nodes - 3) >>> 8, (nodes - 3) & 255])
  if (invalid) packet[packet.length - 1] = 0xc1
  return packet
}

test('constants: exact byte caps, node caps, builder types and scheduler and inbox budgets', () => {
  for (const name of ['entityEvent', 'blueprintAdded', 'blueprintModified', 'ai']) {
    assert.equal(packetByteLimit(name), 64 * KiB)
    assert.equal(packetNodeLimit(name), name === 'ai' ? 1024 : 8192)
  }
  for (const name of ['entityModified', 'chatAdded', 'command', 'ping', 'nope']) {
    assert.equal(packetByteLimit(name), 32 * KiB)
    assert.equal(packetNodeLimit(name), 4096)
  }
  assert.equal(INBOUND_DEFAULT_BYTE_LIMIT, 32 * KiB)
  assert.equal(INBOUND_DEFAULT_NODE_LIMIT, 4096)
  assert.deepEqual([...BUILDER_ONLY_PACKETS], ['blueprintAdded', 'blueprintModified', 'ai'])
  assert.equal(INBOUND_RATE_PER_SECOND, 1024)
  assert.equal(INBOUND_BURST, 2048)
  assert.equal(INBOUND_WORK_PER_TICK, 9216)
  assert.equal(INBOUND_QUANTUM, 512)
  assert.equal(INBOX_ENTRY_OVERHEAD, 160)
  assert.equal(INBOX_RESERVE, 160 * KiB)
  assert.equal(INBOX_SOCKET_CAP, 1024 * KiB)
  assert.equal(INBOX_POOL_CAP, 16 * 1024 * KiB)
})

test('packetCost: one unit plus floor(bytes / 2048)', () => {
  for (const [bytes, cost] of [
    [0, 1],
    [1, 1],
    [2047, 1],
    [2048, 2],
    [65536, 33],
  ]) {
    assert.equal(packetCost(bytes), cost)
  }
})

test('admit: byte and node caps are inclusive, per packet type', () => {
  for (const name of ['entityEvent', 'blueprintAdded', 'blueprintModified', 'ai', 'ping', 'entityModified']) {
    const { gate, calls } = make()
    const s = { id: name }
    const options = { builder: true }
    assert.ok(gate.admit(s, sized(name, packetByteLimit(name)), options))
    assert.equal(gate.admit(s, sized(name, packetByteLimit(name) + 1), options), false)
    assert.equal(calls(), 1, 'oversize does not scan')
    assert.equal(gate.admit(s, dense(name, packetNodeLimit(name)), options).nodes, packetNodeLimit(name))
    assert.equal(gate.admit(s, dense(name, packetNodeLimit(name) + 1), options), false)
    assert.equal(gate.dropped(s), 2)
  }
})

test('admit: every packet pays bytes before unknown, builder and size refusals; rate precedes header reads', () => {
  for (const packet of [Buffer.from([0xc1]), writeClientPacket('ai', null), sized('ping', 32769)]) {
    const { gate, calls, logs } = make()
    const s = { id: 's' }
    const cost = packetCost(packet.length)
    const count = Math.floor(INBOUND_BURST / cost)
    for (let i = 0; i < count; i++) assert.equal(gate.admit(s, packet), false)
    // Only the byte length may be read once the bucket cannot afford another message.
    const unreadable = new Proxy(
      { length: packet.length },
      {
        get(target, key) {
          assert.equal(key, 'length', 'header was read before byte payment')
          return target.length
        },
      }
    )
    assert.equal(gate.admit(s, unreadable), false)
    assert.equal(calls(), 0)
    assert.equal(logs.length, 2)
    assert.match(logs[1], /rate limit/)
    assert.equal(gate.dropped(s), count + 1)
  }
})

test('admit: unknown precedes builder, builder precedes size, and both precede scanning', () => {
  const { gate, calls, logs } = make()
  const s = { id: 'visitor' }
  gate.admit(s, Buffer.alloc(65537))
  for (const name of BUILDER_ONLY_PACKETS) gate.admit(s, sized(name, 65537))
  assert.equal(calls(), 0)
  assert.match(logs[0], /unreadable header/)
  assert.equal(logs.filter(line => line.includes('builder only')).length, 3)
  for (const name of BUILDER_ONLY_PACKETS) assert.ok(gate.admit(s, writeClientPacket(name, null), { builder: true }))
})

test('admit: successful scans charge floor(nodes / 32), allowing the documented burst overshoot', () => {
  const { gate, calls, scanned } = make()
  const s = { id: 'dense' }
  const packet = dense('entityEvent', 8192)
  while (gate.admit(s, packet)) {
    /* consume the burst */
  }
  assert.equal(calls(), 8)
  assert.equal(scanned(), 65536)
  const small = make()
  for (let i = 0; i < INBOUND_BURST; i++) {
    assert.ok(small.gate.admit(s, writeClientPacket('ping', 0)))
  }
  assert.equal(small.gate.admit(s, writeClientPacket('ping', 0)), false)
})

test('admit: failed scans are charged and the flood is held to about 32k scanned nodes/s', () => {
  const { gate, tick, calls, scanned, logs } = make()
  const s = { id: 'failed-scan' }
  const packet = dense('entityEvent', 8192, true)
  // Ten attempted scans per second (about 82k nodes/s). Failure is at the final byte, after visiting the declared slots.
  for (let ms = 0; ms < 5000; ms += 100) {
    gate.admit(s, packet)
    tick(100)
  }
  assert.ok(scanned() <= 73_000 + 5 * 32_768)
  const before = calls()
  for (let ms = 0; ms < 10_000; ms += 100) {
    gate.admit(s, packet)
    tick(100)
  }
  const nodesPerSecond = ((calls() - before) * 8192) / 10
  assert.ok(nodesPerSecond >= 30_000 && nodesPerSecond <= 32_768, `${nodesPerSecond} nodes/s`)
  assert.equal(gate.dropped(s), 150)
  assert.equal(logs.filter(line => line.includes('undecodable')).length, 1)
  assert.equal(logs.filter(line => line.includes('rate limit')).length, 1)
  assert.match(logs[0], /pos 8193/)
})

test('admit: failed huge declarations and continued byte drops clamp debt at -2048', () => {
  const { gate, tick, calls } = make()
  const s = { id: 'bomb' }
  const bomb = Buffer.from([0x92, 8, 0xdd, 1, 0, 0, 0])
  assert.equal(gate.admit(s, bomb), false)
  for (let i = 0; i < 10_000; i++) gate.admit(s, bomb)
  assert.equal(calls(), 1)
  tick(2000)
  const ping = writeClientPacket('ping', 0)
  assert.equal(gate.admit(s, ping), false)
  tick(2)
  assert.ok(gate.admit(s, ping), 'two seconds of refill clears clamped debt')
})

test('admit: logging is once per kind and socket, while every drop is counted', () => {
  const { gate, logs } = make()
  const a = { id: 'a' }
  const b = { id: 'b' }
  const bad = Buffer.from([0x92, 8, 0xc1])
  for (let i = 0; i < 5; i++) {
    gate.admit(a, bad)
    gate.admit(a, writeClientPacket('ai', null))
    gate.admit(a, sized('ping', 32769))
  }
  gate.admit(b, bad)
  assert.equal(logs.length, 4)
  assert.equal(gate.dropped(a), 15)
  assert.equal(gate.dropped(b), 1)
  assert.equal(gate.dropped({}), 0)
  assert.match(
    logs[0],
    /^\[network\] entityEvent from client a dropped: undecodable .*pos 2.*further drops are counted/
  )
})
