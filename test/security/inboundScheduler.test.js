// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/inboundScheduler.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import * as policy from '../../src/core/extras/inboundPolicy.js'
import { strictDecode } from '../../src/core/extras/strictDecode.js'
import { writeClientPacket } from '../../src/core/packets.js'

const { createInboundScheduler, INBOUND_WORK_PER_TICK: W, INBOX_RESERVE, INBOX_SOCKET_CAP, INBOX_POOL_CAP } = policy
const socket = id => ({ id, inbox: [], inboxCost: 0, inQueue: false, disconnected: false })
const add = (scheduler, s, work, id = work) => {
  const bytes = Math.max(1, (work - 8192) * 128)
  const entry = { id, bytes, nodes: work - Math.floor(bytes / 128) }
  assert.equal(scheduler.reserve(s, entry), true)
  assert.equal(entry.work, work)
  scheduler.enqueue(s, entry)
  return entry
}
const disconnect = (scheduler, s) => {
  s.disconnected = true
  scheduler.purge(s)
}
const drain = scheduler => {
  const seen = []
  scheduler.flush((s, e) => {
    assert.equal(e.released, true, 'release precedes dispatch')
    seen.push([s.id, e.id])
  })
  return seen
}

// Observe the actual loop without adding a test hook or iteration counters to production.
const instrumented = () => {
  const probe = { start: [], head: [], iterations: 0 }
  const source = createInboundScheduler
    .toString()
    .replace('flushing = true', 'probe.start = queue.slice(); probe.iterations = 0; flushing = true')
    .replace('while (queue.length) {', 'while (queue.length) { probe.head = queue.slice(); probe.iterations++')
  assert.notEqual(source, createInboundScheduler.toString())
  const create = vm.runInNewContext(`(${source})`, { ...policy, probe })
  return { scheduler: create(), probe }
}

test('scheduler G1/G2: strict work ceiling, per-socket FIFO, and a 512-unit quantum', () => {
  const scheduler = createInboundScheduler()
  const a = socket('A')
  const b = socket('B')
  for (const work of [300, 212, 1, 8704, 512]) add(scheduler, a, work)
  add(scheduler, b, 512)
  assert.deepEqual(drain(scheduler), [
    ['A', 300],
    ['A', 212],
    ['B', 512],
    ['A', 1],
  ])
  assert.deepEqual(drain(scheduler), [
    ['A', 8704],
    ['A', 512],
  ])
  assert.equal(a.inboxCost + b.inboxCost, 0)
  assert.equal(scheduler.pool, 0)
})

test('scheduler G3: at most N + W loop iterations, including empty sockets and lazy tombstones', () => {
  const { scheduler, probe } = instrumented()
  const sockets = Array.from({ length: 64 }, (_, i) => socket(i))
  for (const s of sockets) {
    for (let i = 0; i < 200; i++) add(scheduler, s, 1)
    if (s.id % 3 === 0) disconnect(scheduler, s)
  }
  // An empty queued socket is legal in the pseudocode, even though normal dequeues remove it immediately.
  const empty = socket('empty')
  const e = add(scheduler, empty, 1)
  empty.inbox.shift()
  scheduler.release(empty, e)
  let work = 0
  scheduler.flush((s, entry) => {
    work += entry.work
  })
  assert.equal(work, 8400)
  assert.ok(probe.iterations <= probe.start.length + W)
  assert.equal(probe.iterations, 65)
  assert.ok(sockets.every(s => !s.inQueue))
})

test('scheduler G4: 64 maximal flooders are each served within 64 ticks', () => {
  const scheduler = createInboundScheduler()
  const sockets = Array.from({ length: 64 }, (_, i) => socket(i))
  for (const s of sockets) for (let i = 0; i < 4; i++) add(scheduler, s, 8704, i)
  const served = new Set()
  for (let tick = 0; tick < 64; tick++) {
    const seen = drain(scheduler)
    assert.deepEqual(seen, [[tick, 0]])
    served.add(seen[0][0])
    add(scheduler, sockets[tick], 8704, 4)
  }
  assert.equal(served.size, 64)
})

test('scheduler G4: [target, A, B] refill and rejoin cannot displace the target', () => {
  const scheduler = createInboundScheduler()
  const target = socket('target')
  const a = socket('A')
  const b = socket('B')
  add(scheduler, target, 8704, 0)
  add(scheduler, target, 8704, 1)
  add(scheduler, a, 512)
  add(scheduler, b, 1)
  assert.deepEqual(drain(scheduler), [
    ['target', 0],
    ['A', 512],
  ])
  add(scheduler, a, 8704, 'rejoin')
  add(scheduler, b, 8704, 'refill')
  assert.deepEqual(drain(scheduler), [
    ['B', 1],
    ['target', 1],
  ])
})

test('scheduler G4: the predecessor bound counts live sockets with tombstones present', () => {
  const scheduler = createInboundScheduler()
  const sockets = Array.from({ length: 64 }, (_, i) => socket(i))
  for (const s of sockets) {
    add(scheduler, s, 8704, 0)
    add(scheduler, s, 8704, 1)
    if (s.id % 4 !== 3) disconnect(scheduler, s)
  }
  const live = sockets.filter(s => !s.disconnected)
  for (let tick = 0; tick < live.length; tick++) {
    assert.deepEqual(drain(scheduler), [[live[tick].id, 0]], `live predecessor deadline ${tick + 1}`)
    const joiner = socket(`new-${tick}`)
    add(scheduler, joiner, 8704)
    disconnect(scheduler, joiner)
  }
})

test('scheduler G5: all work present at tick start is served when its total fits W', () => {
  const scheduler = createInboundScheduler()
  const a = socket('A')
  const b = socket('B')
  for (const work of [1, 255, 256]) add(scheduler, a, work)
  add(scheduler, b, 8704)
  assert.deepEqual(drain(scheduler), [
    ['A', 1],
    ['A', 255],
    ['A', 256],
    ['B', 8704],
  ])
  assert.equal(a.inboxCost + b.inboxCost, 0)
})

test('scheduler G5: A=[512,1], with B joining during dispatch, keeps B deferred', () => {
  const scheduler = createInboundScheduler()
  const a = socket('A')
  const b = socket('B')
  add(scheduler, a, 512)
  add(scheduler, a, 1)
  const seen = []
  scheduler.flush((s, e) => {
    seen.push([s.id, e.id])
    if (e.id === 512) add(scheduler, b, 8704)
    scheduler.purge(b) // A live socket's deferred reservation must survive.
  })
  assert.deepEqual(seen, [
    ['A', 512],
    ['A', 1],
  ])
  assert.equal(b.inbox.length, 1)
  assert.ok(b.inboxCost > 0)
  assert.deepEqual(drain(scheduler), [['B', 8704]])
})

test('scheduler G5: A=[1], B=[8704,1], with an arrival to A, drains B before deferred A', () => {
  const scheduler = createInboundScheduler()
  const a = socket('A')
  const b = socket('B')
  add(scheduler, a, 1, 'old')
  add(scheduler, b, 8704)
  add(scheduler, b, 1)
  const seen = []
  scheduler.flush((s, e) => {
    seen.push([s.id, e.id])
    if (s === a) add(scheduler, a, 8704, 'new')
    scheduler.purge(a)
    scheduler.purge(b)
  })
  assert.deepEqual(seen, [
    ['A', 'old'],
    ['B', 8704],
    ['B', 1],
  ])
  assert.deepEqual(drain(scheduler), [['A', 'new']])
})

test('scheduler: synchronous disconnects of the current, next and later socket skip only the disconnected inbox', () => {
  for (const victim of [0, 1, 3]) {
    const scheduler = createInboundScheduler()
    const sockets = Array.from({ length: 4 }, (_, i) => socket(i))
    for (const s of sockets) {
      add(scheduler, s, 1, 'first')
      add(scheduler, s, 1, 'second')
    }
    const seen = []
    scheduler.flush((s, e) => {
      seen.push([s.id, e.id])
      if (s.id === 0 && e.id === 'first') {
        add(scheduler, sockets[victim], 8704, 'deferred')
        disconnect(scheduler, sockets[victim])
        scheduler.purge(sockets[victim])
      }
    })
    const expected = sockets.flatMap(s =>
      s.id === victim
        ? []
        : [
            [s.id, 'first'],
            [s.id, 'second'],
          ]
    )
    if (victim === 0) expected.unshift([0, 'first'])
    assert.deepEqual(seen, expected)
    assert.deepEqual(drain(scheduler), [])
    assert.ok(sockets.every(s => s.inboxCost === 0 && !s.inQueue))
    assert.equal(scheduler.pool, 0)
  }
})

test('scheduler G1-G5: 2,000-tick churn fuzz with synchronous current, next and later disconnects', () => {
  const { scheduler, probe } = instrumented()
  let seed = 0x5eed
  const random = n => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed % n
  }
  const sockets = []
  const expected = new Map()
  const deadlines = new Map()
  const entries = []
  const killed = [0, 0, 0]
  let tick = 0
  let flushing = false
  const push = s => {
    const work = [1, 32, 256, 512, 513, 8192, 8704][random(7)]
    const e = add(scheduler, s, work, entries.length)
    e.earliest = tick + (flushing ? 1 : 0)
    expected.get(s).push(e)
    entries.push(e)
  }
  const join = () => {
    const s = socket(sockets.length)
    sockets.push(s)
    expected.set(s, [])
    for (let i = 0; i < 3; i++) push(s)
  }
  const kill = s => {
    disconnect(scheduler, s)
    scheduler.purge(s)
    expected.set(s, [])
    deadlines.delete(s)
  }
  for (let i = 0; i < 64; i++) join()
  for (; tick < 2000; tick++) {
    let live = sockets.filter(s => !s.disconnected)
    if (random(2) === 0 && live.length) kill(live[random(live.length)])
    live = sockets.filter(s => !s.disconnected)
    for (const s of live) if (s.inbox.length < 3 && random(3) === 0) push(s)
    for (let i = live.length; i < 64; i++) join()
    const seen = new Set()
    let work = 0
    let startEntries
    let startWork
    flushing = true
    scheduler.flush((s, e) => {
      if (!startEntries) {
        const queued = probe.start.filter(s => !s.disconnected)
        queued.forEach((s, p) => {
          if (!deadlines.has(s)) deadlines.set(s, tick + p)
        })
        // The first entry has already left its inbox at this point.
        startEntries = [e, ...queued.flatMap(s => s.inbox)]
        startWork = startEntries.reduce((n, e) => n + e.work, 0)
      }
      assert.equal(s.disconnected, false)
      assert.equal(e, expected.get(s).shift(), 'FIFO')
      assert.ok(e.earliest <= tick, 'arrivals during flush wait for the next tick')
      assert.equal(e.released, true)
      seen.add(e)
      deadlines.delete(s)
      work += e.work
      assert.ok(work <= W)
      if (random(3) === 0) push(s)
      if (random(7) === 0) {
        const kind = tick % 3
        const followers = probe.head.filter(other => other !== s && !other.disconnected)
        const victim = kind === 0 ? s : kind === 1 ? followers[0] : followers[2]
        if (victim) {
          kill(victim)
          killed[kind]++
        }
      }
    })
    flushing = false
    assert.ok(probe.iterations <= probe.start.length + W, 'G3 iteration bound')
    for (const [s, deadline] of deadlines)
      assert.ok(tick < deadline, `G4: socket ${s.id} deadline ${deadline}, tick ${tick}`)
    if (startWork <= W)
      assert.ok(
        startEntries.every(e => seen.has(e) || e.released),
        'G5: drained or disconnected'
      )
    assert.equal(
      scheduler.pool,
      sockets.reduce((n, s) => n + Math.max(0, s.inboxCost - INBOX_RESERVE), 0)
    )
    for (const s of sockets) {
      assert.deepEqual([...s.inbox], expected.get(s))
      assert.equal(
        s.inboxCost,
        s.inbox.reduce((n, e) => n + e.cost, 0)
      )
    }
  }
  assert.ok(
    killed.every(n => n > 50),
    `disconnect coverage ${killed}`
  )
  for (const s of sockets) kill(s)
  assert.deepEqual(drain(scheduler), [])
  assert.equal(scheduler.pool, 0)
  assert.ok(entries.every(e => e.released))
})

test('inbox: 15 x 64 KiB can be admitted, drained and admitted again with pool back at zero', () => {
  const scheduler = createInboundScheduler()
  const s = socket('large')
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < 15; i++) add(scheduler, s, 8704, i)
    assert.equal(s.inboxCost, 15 * (65536 + 160))
    assert.equal(scheduler.pool, s.inboxCost - INBOX_RESERVE)
    assert.equal(scheduler.reserve(s, { bytes: 65536, nodes: 8192 }), false)
    for (let i = 0; i < 15; i++) assert.deepEqual(drain(scheduler), [['large', i]])
    assert.equal(s.inboxCost, 0)
    assert.equal(scheduler.pool, 0)
  }
})

test('inbox: exact reserve, per-socket and pool boundaries; a full pool still permits two maximal packets', () => {
  const scheduler = createInboundScheduler()
  const sockets = []
  while (scheduler.pool < INBOX_POOL_CAP) {
    const s = socket(sockets.length)
    sockets.push(s)
    while (s.inboxCost < INBOX_SOCKET_CAP && scheduler.pool < INBOX_POOL_CAP) {
      const cost = Math.min(
        65536 + 160,
        INBOX_SOCKET_CAP - s.inboxCost,
        Math.max(0, INBOX_RESERVE - s.inboxCost) + INBOX_POOL_CAP - scheduler.pool
      )
      const e = { bytes: cost - 160, nodes: 3 }
      assert.ok(e.bytes >= 0)
      assert.equal(scheduler.reserve(s, e), true)
      scheduler.enqueue(s, e)
    }
  }
  assert.equal(sockets[0].inboxCost, INBOX_SOCKET_CAP)
  assert.equal(scheduler.reserve(sockets[0], { bytes: 1, nodes: 1 }), false)
  assert.equal(scheduler.pool, INBOX_POOL_CAP)
  const fresh = socket('reserved')
  add(scheduler, fresh, 8704)
  add(scheduler, fresh, 8704)
  const e = { bytes: INBOX_RESERVE - fresh.inboxCost - 160, nodes: 3 }
  assert.equal(scheduler.reserve(fresh, e), true)
  scheduler.enqueue(fresh, e)
  assert.equal(fresh.inboxCost, INBOX_RESERVE)
  assert.equal(scheduler.reserve(fresh, { bytes: 1, nodes: 1 }), false)
  assert.equal(scheduler.pool, INBOX_POOL_CAP)
  for (const s of [...sockets, fresh]) disconnect(scheduler, s)
  assert.equal(scheduler.pool, 0)
})

test('inbox: live purges do nothing; disconnect releases inbox and deferred reservations exactly once', () => {
  const scheduler = createInboundScheduler()
  const s = socket('s')
  const other = socket('other')
  const entries = Array.from({ length: 5 }, () => add(scheduler, s, 8704))
  add(scheduler, other, 8704)
  const before = s.inboxCost
  scheduler.purge(s)
  assert.equal(s.inboxCost, before)
  scheduler.flush(current => {
    assert.equal(current, s)
    entries.push(add(scheduler, s, 8704))
    entries.push(add(scheduler, s, 8704))
    assert.equal(s.inboxCost, 6 * (65536 + 160))
    assert.equal(scheduler.pool, s.inboxCost - INBOX_RESERVE)
    disconnect(scheduler, s)
    assert.equal(s.inboxCost, 0)
    assert.equal(scheduler.pool, 0)
    scheduler.purge(s)
    for (const e of entries) scheduler.release(s, e)
    assert.equal(s.inboxCost, 0)
    assert.equal(scheduler.pool, 0)
  })
  assert.ok(entries.every(e => e.released))
  assert.equal(s.inbox.length, 0)
  assert.equal(scheduler.reserve(s, { bytes: 1, nodes: 1 }), false)
  assert.deepEqual(drain(scheduler), [['other', 8704]])
})

test('inbox: work uses counted bin nodes exactly once and floor(bytes / 128)', () => {
  const scheduler = createInboundScheduler()
  const s = socket('bin')
  for (const bytes of [127, 128, 255, 256]) {
    const e = { bytes, nodes: 6 }
    assert.equal(scheduler.reserve(s, e), true)
    assert.equal(e.cost, bytes + 160)
    assert.equal(e.work, 6 + Math.floor(bytes / 128))
    scheduler.release(s, e)
  }
  const copy = writeClientPacket('entityEvent', new Uint8Array(256))
  const scan = strictDecode(copy, { build: false })
  assert.equal(scan.nodes, 6) // root + id + bin (4)
  const e = { bytes: copy.length, nodes: scan.nodes }
  assert.equal(scheduler.reserve(s, e), true)
  assert.equal(e.work, 8)
  scheduler.release(s, e)
})
