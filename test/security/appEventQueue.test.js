// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/appEventQueue.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  APP_EVENT_QUEUE_MAX,
  APP_EVENT_QUEUE_BYTES,
  APP_EVENT_QUEUE_NODES,
  APP_EVENT_LEDGER_BYTES,
  APP_EVENT_LEDGER_NODES,
  APP_EVENT_KEEP_BYTES,
  APP_EVENT_KEEP_NODES,
  APP_EVENT_KEEP_TTL,
  createEventLedger,
  createEventQueue,
} from '../../src/core/extras/appEventQueue.js'
import { writeClientPacket } from '../../src/core/packets.js'
import { strictDecode } from '../../src/core/extras/strictDecode.js'

const event = (n, version = 0) => ({ version, name: `e${n}`, data: n, networkId: 's' })
const meta = (bytes = 1, nodes = 1, socketId = 's') => ({ bytes, nodes, socketId, builder: true })
const keep = { keep: true, blueprintId: 'bp' }
const author = { version: 1, socketId: 's' }
const serverQueue = (options = {}) => createEventQueue({ isServer: true, ...options })
const empty = ledger => {
  assert.equal(ledger.bytes, 0)
  assert.equal(ledger.nodes, 0)
  assert.equal(ledger.keptBytes, 0)
  assert.equal(ledger.keptNodes, 0)
}

test('defaults: queue, ledger, keep caps and TTL match the production limits', () => {
  assert.equal(APP_EVENT_QUEUE_MAX, 64)
  assert.equal(APP_EVENT_QUEUE_BYTES, 256 * 1024)
  assert.equal(APP_EVENT_QUEUE_NODES, 16384)
  assert.equal(APP_EVENT_LEDGER_BYTES, 2 * 1024 * 1024)
  assert.equal(APP_EVENT_LEDGER_NODES, 65536)
  assert.equal(APP_EVENT_KEEP_BYTES, 64 * 1024)
  assert.equal(APP_EVENT_KEEP_NODES, 8192)
  assert.equal(APP_EVENT_KEEP_TTL, 60000)
})

test('client: keeps the newest 64 events, charges zero bytes/nodes and reports every eviction', () => {
  const drops = []
  const ledger = createEventLedger()
  const q = createEventQueue({ ledger, onDrop: reason => drops.push(reason) })
  for (let i = 0; i < 70; i++) assert.equal(q.push(event(i), meta(1000000, 1000000)), true)
  assert.deepEqual(drops, Array(6).fill('queue full'))
  assert.equal(q.size, 64)
  assert.equal(q.bytes, 0)
  assert.equal(q.nodes, 0)
  empty(ledger)
  const names = []
  q.drain(0, e => names.push(e.name))
  assert.equal(names[0], 'e6')
  assert.equal(names[63], 'e69')
  assert.equal(q.size, 0)
})

for (const [dimension, cost, reason] of [
  ['bytes', meta(65536, 1), 'queue bytes'],
  ['nodes', meta(1, 8192), 'queue nodes'],
]) {
  test(`server ${dimension}: exact per-app cap, twice the wire cost, oldest eviction and full release`, () => {
    const ledger = createEventLedger()
    const drops = []
    const q = serverQueue({ ledger, onDrop: reason => drops.push(reason) })
    q.push(event(1), cost)
    q.push(event(2), cost)
    assert.equal(q.bytes, 4 * cost.bytes)
    assert.equal(q.nodes, 2 * cost.nodes)
    assert.equal(ledger.bytes, q.bytes)
    assert.equal(ledger.nodes, q.nodes)
    assert.equal(q.push(event(3), cost), true)
    assert.equal(q.size, 2)
    assert.deepEqual(drops, [reason])
    const seen = []
    q.drain(0, e => seen.push(e.data))
    assert.deepEqual(seen, [2, 3])
    empty(ledger)
  })
}

for (const [dimension, cost, count] of [
  ['bytes', meta(65536, 1), 16],
  ['nodes', meta(1, 8192), 8],
]) {
  test(`ledger ${dimension}: evicts only the receiving app, then drops the new event if others fill it`, () => {
    const ledger = createEventLedger()
    const queues = Array.from({ length: count }, () => serverQueue({ ledger }))
    for (const q of queues) q.push(event(1), cost)
    assert.equal(ledger[dimension], dimension === 'bytes' ? APP_EVENT_LEDGER_BYTES : APP_EVENT_LEDGER_NODES)
    const drops = []
    const own = serverQueue({ ledger, onDrop: reason => drops.push(reason) })
    assert.equal(own.push(event(2), cost), false)
    assert.deepEqual(drops, [`ledger ${dimension}`])
    assert.ok(queues.every(q => q.size === 1))
    assert.equal(queues[0].push(event(3), cost), true, 'the receiving queue can reclaim its own credit')
    assert.equal(queues[0].size, 1)
    queues[0].clear()
    assert.equal(own.push(event(4), cost), true, 'another app can use released credit')
    for (const q of [...queues, own]) q.clear()
    empty(ledger)
  })
}

test('an event larger than a budget evicts each own event, then counts the rejected new event once', () => {
  const ledger = createEventLedger({ maxBytes: 100, maxNodes: 100 })
  const drops = []
  const q = serverQueue({ ledger, onDrop: reason => drops.push(reason) })
  q.push(event(1), meta(10))
  q.push(event(2), meta(10))
  assert.equal(q.push(event(3), meta(51)), false)
  assert.deepEqual(drops, Array(3).fill('ledger bytes'))
  assert.equal(q.size, 0)
  empty(ledger)
})

test('server: missing or invalid cost cannot poison the shared ledger', () => {
  const ledger = createEventLedger()
  const q = serverQueue({ ledger })
  for (const cost of [undefined, {}, meta(NaN), meta(-1), meta(1, Infinity), meta(1, 0)]) {
    assert.equal(q.push(event(1), cost), false)
  }
  empty(ledger)
  assert.equal(q.push(event(2), meta()), true)
})

test('64 x 65 KB reproduction: real decoded payloads retain at most two per app and sixteen globally', () => {
  const ledger = createEventLedger()
  const drops = []
  const queues = Array.from({ length: 64 }, () => serverQueue({ ledger, onDrop: reason => drops.push(reason) }))
  let admitted = 0
  for (let i = 0; i < 64; i++) {
    for (const q of queues) {
      const packet = writeClientPacket('entityEvent', ['app', 0, 'probe', 'x'.repeat(65000)])
      const decoded = strictDecode(packet, { maxNodes: 8192, build: true })
      assert.equal(decoded.ok, true)
      const [, [id, version, name, data]] = decoded.value
      assert.equal(id, 'app')
      q.push({ version, name, data, networkId: 's' }, meta(packet.length, decoded.nodes))
      admitted++
      assert.ok(q.size <= 2)
      assert.ok(q.bytes <= APP_EVENT_QUEUE_BYTES)
      assert.ok(ledger.bytes <= APP_EVENT_LEDGER_BYTES)
      assert.ok(ledger.nodes <= APP_EVENT_LEDGER_NODES)
    }
  }
  const retained = queues.reduce((total, q) => total + q.size, 0)
  assert.equal(retained, 16)
  assert.equal(drops.length, admitted - retained)
  let retainedBytes = 0
  for (const q of queues) {
    q.drain(0, e => {
      retainedBytes += e.data.length
    })
  }
  assert.equal(retainedBytes, 16 * 65000)
  empty(ledger)
})

test('keep: requires builder metadata and a socket, and holds current + 1 without blocking older events', () => {
  const ledger = createEventLedger()
  const drops = []
  const q = serverQueue({ ledger, onDrop: reason => drops.push(reason) })
  assert.equal(q.push(event(1, 1), { ...meta(), builder: false }, keep), false)
  assert.equal(q.push(event(1, 1), { ...meta(), socketId: null }, keep), false)
  assert.equal(q.push(event(2, 1), meta(10, 2), keep), true)
  q.push(event(3), meta(20, 3))
  const seen = []
  assert.deepEqual(
    q.drain(0, e => seen.push(e.data)),
    { delivered: 1, dropped: 0 }
  )
  assert.deepEqual(seen, [3])
  assert.equal(q.size, 1)
  assert.equal(ledger.keptBytes, 20)
  assert.equal(ledger.keptNodes, 2)
  assert.deepEqual(
    q.drain(1, e => seen.push(e.data), undefined, { author }),
    { delivered: 1, dropped: 0 }
  )
  assert.deepEqual(seen, [3, 2])
  assert.deepEqual(drops, ['future version', 'future version'])
  empty(ledger)
})

for (const [dimension, cost] of [
  ['bytes', meta(32768, 1)],
  ['nodes', meta(1, 4096)],
]) {
  test(`keep socket ${dimension}: aggregate cap across apps, own eviction, and released credit`, () => {
    const ledger = createEventLedger()
    const drops = []
    const a = serverQueue({ ledger, onDrop: reason => drops.push(reason) })
    const b = serverQueue({ ledger, onDrop: reason => drops.push(reason) })
    const c = serverQueue({ ledger, onDrop: reason => drops.push(reason) })
    a.push(event(1, 1), cost, keep)
    b.push(event(2, 1), cost, keep)
    assert.equal(c.push(event(3, 1), cost, keep), false)
    assert.equal(a.size, 1)
    assert.equal(b.size, 1)
    assert.equal(a.push(event(4, 1), cost, keep), true)
    assert.deepEqual(drops, Array(2).fill(`socket kept ${dimension}`))
    b.clear()
    assert.equal(c.push(event(5, 1), cost, keep), true)
    a.clear()
    c.clear()
    empty(ledger)
  })
}

test("keep: a different blueprint id evicts that socket's kept events across apps only", () => {
  const ledger = createEventLedger()
  const drops = []
  const a = serverQueue({ ledger, onDrop: reason => drops.push(reason) })
  const b = serverQueue({ ledger, onDrop: reason => drops.push(reason) })
  a.push(event(1, 1), meta(), keep)
  a.push(event(2), meta())
  b.push(event(3, 1), meta(), keep)
  b.push(event(4, 1), meta(1, 1, 'other'), keep)
  b.push(event(5, 1), meta(), { keep: true, blueprintId: 'new' })
  assert.equal(a.size, 1)
  assert.equal(b.size, 2)
  assert.deepEqual(drops, ['kept blueprint changed', 'kept blueprint changed'])
  assert.equal(ledger.bytes, 6)
  assert.equal(ledger.keptBytes, 4)
  a.clear()
  b.clear()
  empty(ledger)
  // Reusing the old id still replaces the current reservation; no stale socket entry survives release.
  assert.equal(a.push(event(6, 1), meta(65536, 8192), keep), true)
})

for (const [dimension, cost, count] of [
  ['bytes', meta(65536, 1), 4],
  ['nodes', meta(1, 8192), 2],
]) {
  test(`keep reserve ${dimension}: all sockets share 25% of the ledger, leaving room for normal events`, () => {
    const ledger = createEventLedger()
    const queues = Array.from({ length: count }, () => serverQueue({ ledger }))
    queues.forEach((q, i) => q.push(event(i, 1), { ...cost, socketId: i }, keep))
    assert.equal(
      dimension === 'bytes' ? ledger.keptBytes : ledger.keptNodes,
      dimension === 'bytes' ? APP_EVENT_LEDGER_BYTES / 4 : APP_EVENT_LEDGER_NODES / 4
    )
    const drops = []
    const q = serverQueue({ ledger, onDrop: reason => drops.push(reason) })
    assert.equal(q.push(event(9, 1), meta(1, 1, 'last'), keep), false)
    assert.deepEqual(drops, [`kept reserve ${dimension}`])
    assert.equal(q.push(event(10), cost), true)
    queues[0].clear()
    assert.equal(q.push(event(11, 1), meta(1, 1, 'last'), keep), true)
    for (const queue of [...queues, q]) queue.clear()
    empty(ledger)
  })
}

test('TTL: sweep expires at 60 seconds exactly, preserves normal events and releases socket credit once', () => {
  let now = 1000
  const ledger = createEventLedger({ now: () => now })
  const drops = []
  const q = serverQueue({ ledger, onDrop: reason => drops.push(reason) })
  q.push(event(1, 1), meta(65536, 8192), keep)
  q.push(event(2), meta())
  ledger.sweepExpired(now + APP_EVENT_KEEP_TTL - 1)
  assert.equal(q.size, 2)
  now += APP_EVENT_KEEP_TTL
  ledger.sweepExpired(now)
  ledger.sweepExpired(now)
  assert.equal(q.size, 1)
  assert.equal(ledger.bytes, 2)
  assert.equal(ledger.keptBytes, 0)
  assert.deepEqual(drops, ['kept expired'])
  assert.equal(q.push(event(3, 1), meta(65536, 8192), keep), true)
  q.clear()
  empty(ledger)
})

test('TTL: drain also refuses expired events even with the matching author', () => {
  let now = 0
  const ledger = createEventLedger({ now: () => now })
  const q = serverQueue({ ledger })
  q.push(event(1, 1), meta(), keep)
  now = APP_EVENT_KEEP_TTL
  assert.deepEqual(
    q.drain(1, () => assert.fail('expired'), undefined, { author }),
    { delivered: 0, dropped: 1 }
  )
  empty(ledger)
})

test('purge: releases all events from one socket across apps, with repeated purge/clear safe', () => {
  const ledger = createEventLedger()
  const drops = []
  const a = serverQueue({ ledger, onDrop: reason => drops.push(reason) })
  const b = serverQueue({ ledger, onDrop: reason => drops.push(reason) })
  a.push(event(1), meta())
  b.push(event(2, 1), meta(), keep)
  b.push(event(3, 1), meta(2, 2, 'other'), keep)
  ledger.purgeSocket('s')
  ledger.purgeSocket('s')
  assert.equal(a.size, 0)
  assert.equal(b.size, 1)
  assert.deepEqual(drops, ['socket disconnected', 'socket disconnected'])
  assert.equal(ledger.bytes, 4)
  assert.equal(ledger.nodes, 2)
  assert.equal(ledger.keptBytes, 4)
  b.clear()
  b.clear()
  ledger.purgeSocket('other')
  empty(ledger)
})

test('authors: only the matching version and socket can deliver a kept event, including version <= current', () => {
  for (const record of [
    undefined,
    { version: 1, socketId: 'other' },
    { version: 2, socketId: 's' },
    { version: 1, socketId: null },
    author,
  ]) {
    const ledger = createEventLedger()
    const q = serverQueue({ ledger })
    q.push({ ...event(1, 1), networkId: 'not-the-author' }, meta(), keep)
    const seen = []
    const result = q.drain(2, e => seen.push(e.data), undefined, { author: record })
    assert.deepEqual(result, record === author ? { delivered: 1, dropped: 0 } : { delivered: 0, dropped: 1 })
    assert.deepEqual(seen, record === author ? [1] : [])
    empty(ledger)
  }
})

test('drain: far future events drop, current + 1 stays, and older events pass in FIFO order', () => {
  const q = createEventQueue()
  q.push(event(1, 1e12))
  q.push(event(2, 3))
  q.push(event(3, 4))
  q.push(event(4, 2))
  const seen = []
  assert.deepEqual(
    q.drain(3, e => seen.push(e.data)),
    { delivered: 2, dropped: 1 }
  )
  assert.deepEqual(seen, [2, 4])
  assert.equal(q.size, 1)
  assert.deepEqual(
    q.drain(4, e => seen.push(e.data)),
    { delivered: 1, dropped: 0 }
  )
  assert.deepEqual(seen, [2, 4, 3])
  assert.deepEqual(
    q.drain(4, () => assert.fail('empty')),
    { delivered: 0, dropped: 0 }
  )
  q.push(event(5, 4))
  assert.deepEqual(
    q.drain(4, () => assert.fail('above latest + 1'), undefined, { latest: 2 }),
    { delivered: 0, dropped: 1 }
  )
})

test('drain: listener errors are contained, later events still deliver and all credit is released', () => {
  const ledger = createEventLedger()
  const q = serverQueue({ ledger })
  for (let i = 0; i < 4; i++) q.push(event(i), meta())
  const seen = []
  const errors = []
  const result = q.drain(
    0,
    e => {
      if (e.data === 1) throw new Error('boom')
      seen.push(e.data)
    },
    (err, e) => errors.push([err.message, e.data])
  )
  assert.deepEqual(seen, [0, 2, 3])
  assert.deepEqual(errors, [['boom', 1]])
  assert.deepEqual(result, { delivered: 3, dropped: 0 })
  empty(ledger)
  q.push(event(9), meta())
  q.push(event(10), meta())
  assert.deepEqual(
    q.drain(0, e => {
      if (e.data === 9) throw new Error('boom')
    }),
    { delivered: 1, dropped: 0 }
  )
  empty(ledger)
})

test('drain: releases before listeners, handles reentrant pushes/clears and drains new arrivals in the same pass', () => {
  const ledger = createEventLedger()
  const q = serverQueue({ ledger, max: 2 })
  q.push(event(1, 1), meta(), keep)
  q.push(event(2), meta())
  const seen = []
  q.drain(0, e => {
    seen.push(e.data)
    assert.equal(ledger.bytes, e.data === 2 ? 2 : 0)
    if (e.data === 2) {
      q.clear()
      q.push(event(3), meta())
    }
  })
  assert.deepEqual(seen, [2, 3])
  assert.equal(q.size, 0)
  empty(ledger)
})
