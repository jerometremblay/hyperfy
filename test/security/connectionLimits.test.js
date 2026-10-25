// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/connectionLimits.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  SWEEP_INTERVAL_MS,
  createConnectionLimits,
  readConnectionLimitsEnv,
} from '../../src/server/connectionLimits.js'
import { clientIpKeys } from '../../src/server/uploadLimits.js'

const defaults = readConnectionLimitsEnv({})
const clock = (start = 10_000_000) => {
  let t = start
  return { now: () => t, tick: ms => (t += ms) }
}
const make = (overrides = {}) => {
  const c = clock()
  const limits = createConnectionLimits({ ...defaults, ...overrides }, { now: c.now })
  return { limits, c }
}

test('readConnectionLimitsEnv: defaults, overrides, 0 disables, bad values throw', () => {
  assert.deepEqual(defaults, {
    ratePerMin: 10,
    burst: 20,
    ratePerMin56: 20,
    burst56: 40,
    ratePerMin48: 40,
    burst48: 80,
    concurrentPerIp: 8,
    concurrentPer56: 16,
    concurrentPer48: 32,
    maxSockets: 64,
    maxEntries: 40_000,
  })
  assert.deepEqual(
    readConnectionLimitsEnv({
      WS_CONNECT_RATE_PER_MIN: '0',
      WS_CONNECT_BURST: '',
      WS_CONNECT_CONCURRENT_PER_IP: '16',
      WS_CONNECT_MAX_TRACKED: '100',
    }),
    {
      ratePerMin: 0,
      burst: 20,
      ratePerMin56: 20,
      burst56: 40,
      ratePerMin48: 40,
      burst48: 80,
      concurrentPerIp: 16,
      concurrentPer56: 16,
      concurrentPer48: 32,
      maxSockets: 64,
      maxEntries: 100,
    }
  )
  for (const bad of ['-1', 'ten', 'NaN', 'Infinity']) {
    assert.throws(() => readConnectionLimitsEnv({ WS_CONNECT_RATE_PER_MIN: bad }), /WS_CONNECT_RATE_PER_MIN/, bad)
  }
  assert.throws(() => readConnectionLimitsEnv({ WS_CONNECT_BURST: '0' }), /WS_CONNECT_BURST/)
  assert.doesNotThrow(() => readConnectionLimitsEnv({ WS_CONNECT_RATE_PER_MIN: '0', WS_CONNECT_BURST: '0' }))
})

test('admit: a burst of 20 connections from one address, then one more every 6 seconds', () => {
  const { limits, c } = make({ concurrentPerIp: 0 })
  const ok = () => limits.admit({ key: '10.0.0.1' }).ok
  let admitted = 0
  for (let i = 0; i < 200; i++) if (ok()) admitted++
  assert.equal(admitted, 20)
  assert.deepEqual(limits.admit({ key: '10.0.0.1' }), { ok: false, reason: 'too many connections' })
  c.tick(5_000)
  assert.equal(ok(), false)
  c.tick(12_000) // 17 s since the burst: close to three tokens
  assert.equal(ok(), true)
  assert.equal(ok(), true)
  assert.equal(ok(), false)
  c.tick(180_000)
  admitted = 0
  for (let i = 0; i < 200; i++) if (ok()) admitted++
  assert.equal(admitted, 20) // the bucket never holds more than the burst
})

test('admit: at most 8 open connections per address; a release frees a slot once', () => {
  const { limits } = make({ ratePerMin: 0 })
  const leases = []
  for (let i = 0; i < 8; i++) {
    const v = limits.admit({ key: 'a' })
    assert.equal(v.ok, true)
    leases.push(v)
  }
  assert.deepEqual(limits.admit({ key: 'a' }), { ok: false, reason: 'too many connections' })
  assert.equal(limits.admit({ key: 'b' }).ok, true) // another address is not affected
  leases[0].release()
  leases[0].release()
  assert.equal(limits.admit({ key: 'a' }).ok, true)
  assert.equal(limits.admit({ key: 'a' }).ok, false)
  assert.deepEqual(limits.stats(), { tracked: 2, active: 9 })
})

test('admit: six tabs or agents on one address connect; 200 rapid connections from one address do not', () => {
  const { limits } = make()
  const six = Array.from({ length: 6 }, () => limits.admit({ key: 'home' }))
  assert.ok(six.every(v => v.ok))
  let admitted = 0
  for (let i = 0; i < 200; i++) {
    const v = limits.admit({ key: 'churn' })
    if (v.ok) {
      admitted++
      v.release()
    }
  }
  assert.equal(admitted, 20) // opened and closed at once: the burst
  admitted = 0
  for (let i = 0; i < 200; i++) if (limits.admit({ key: 'flood' }).ok) admitted++
  assert.equal(admitted, 8) // held open: the concurrency cap
})

test('admit: 0 disables a limit', () => {
  const { limits } = make({ ratePerMin: 0, concurrentPerIp: 0, maxSockets: 0 })
  for (let i = 0; i < 1000; i++) assert.equal(limits.admit({ key: 'x' }).ok, true)
  assert.deepEqual(limits.stats(), { tracked: 1, active: 1000 })
})

test('entries: a full table makes room from idle addresses and refuses newcomers while none is idle', () => {
  const { limits } = make({ maxEntries: 2, ratePerMin: 0 })
  const a = limits.admit({ key: 'a' })
  limits.admit({ key: 'b' })
  assert.deepEqual(limits.admit({ key: 'c' }), { ok: false, reason: 'busy' })
  a.release()
  // 'a' is idle now: the next newcomer purges it and takes its place
  assert.equal(limits.admit({ key: 'c' }).ok, true)
  assert.equal(limits.stats().tracked, 2)
  assert.deepEqual(limits.admit({ key: 'd' }), { ok: false, reason: 'busy' })
})

test('entries: an address is swept once a minute as soon as nothing is open and its bucket is full again', () => {
  const { limits, c } = make({ concurrentPerIp: 0 })
  for (let i = 0; i < 15; i++) limits.admit({ key: 'a' }).release()
  c.tick(SWEEP_INTERVAL_MS)
  limits.admit({ key: 'b' }) // sweeps: 'a' holds 15 of 20 tokens again, still refilling
  assert.equal(limits.stats().tracked, 2)
  c.tick(SWEEP_INTERVAL_MS)
  limits.admit({ key: 'b' }) // sweeps: 'a' is full and gone; 'b' has connections open
  assert.equal(limits.stats().tracked, 1)
})

test('admit: IPv6 /56 and /48 caps aggregate different /64 keys and release once', () => {
  const { limits } = make({ ratePerMin: 0 })
  const leases = []
  for (let i = 0; i < 32; i++) {
    const parents = [`2001:db8:1:${i < 16 ? '100' : '200'}::/56`, '2001:db8:1::/48']
    const lease = limits.admit({ key: `key-${i}`, parents })
    assert.equal(lease.ok, true)
    leases.push(lease)
    if (i === 15) assert.equal(limits.admit({ key: 'overflow56', parents }).ok, false)
  }
  const next = { key: 'next', parents: ['2001:db8:1:300::/56', '2001:db8:1::/48'] }
  assert.equal(limits.admit(next).ok, false)
  leases[0].release()
  leases[0].release()
  assert.equal(limits.admit(next).ok, true)
  assert.equal(limits.admit(next).ok, false)
  assert.equal(limits.admit({ key: 'elsewhere', parents: ['2001:db8:2:100::/56', '2001:db8:2::/48'] }).ok, true)
})

test('admit: global cap includes IPv4 and IPv6, with no token or parent charge on refusal', () => {
  const { limits } = make({ maxSockets: 2, burst: 1 })
  const a = limits.admit({ key: 'a' })
  const b = limits.admit({ key: 'b', parents: ['prefix::/56', 'prefix::/48'] })
  assert.equal(limits.admit({ key: 'c' }).ok, false)
  a.release()
  a.release()
  assert.equal(limits.admit({ key: 'c' }).ok, true)
  assert.equal(limits.stats().active, 2)
  b.release()
  assert.equal(limits.stats().active, 1)
})

test('admit: parent/global defaults, overrides, disabled values and validation', () => {
  const keys = ['WS_CONNECT_CONCURRENT_PER_56', 'WS_CONNECT_CONCURRENT_PER_48', 'WS_MAX_SOCKETS']
  for (const key of keys) {
    for (const value of ['-1', 'NaN', 'Infinity']) assert.throws(() => readConnectionLimitsEnv({ [key]: value }))
  }
  const config = readConnectionLimitsEnv(Object.fromEntries(keys.map(key => [key, '0'])))
  assert.equal(config.concurrentPer56, 0)
  assert.equal(config.concurrentPer48, 0)
  assert.equal(config.maxSockets, 0)
  const limits = createConnectionLimits({ ...config, ratePerMin: 0, ratePerMin56: 0, ratePerMin48: 0 })
  for (let i = 0; i < 100; i++) assert.equal(limits.admit({ key: `${i}`, parents: ['p::/56', 'p::/48'] }).ok, true)
  const custom = readConnectionLimitsEnv(Object.fromEntries(keys.map(key => [key, '1'])))
  assert.equal(custom.concurrentPer56, 1)
  assert.equal(custom.concurrentPer48, 1)
  assert.equal(custom.maxSockets, 1)
})

test('parent rate envs: overrides, either zero disables the bucket, and invalid values throw', () => {
  for (const suffix of ['56', '48']) {
    const rate = `WS_CONNECT_RATE_PER_MIN_${suffix}`
    const burst = `WS_CONNECT_BURST_${suffix}`
    for (const key of [rate, burst]) {
      for (const value of ['-1', 'NaN', 'Infinity', 'bad']) {
        assert.throws(() => readConnectionLimitsEnv({ [key]: value }), new RegExp(key))
      }
      const config = readConnectionLimitsEnv({ [key]: '0' })
      const limits = createConnectionLimits({ ...config, concurrentPer56: 0, concurrentPer48: 0, maxSockets: 0 })
      for (let i = 0; i < 100; i++) {
        assert.equal(limits.admit({ key: `key-${i}`, parents: [`prefix::/${suffix}`] }).ok, true)
      }
    }
    assert.throws(() => readConnectionLimitsEnv({ [burst]: '0.5' }), new RegExp(burst))
    const config = readConnectionLimitsEnv({ [rate]: '12', [burst]: '24' })
    assert.equal(config[`ratePerMin${suffix}`], 12)
    assert.equal(config[`burst${suffix}`], 24)
  }
})

test('admit: rotating /64s exhausts /56 and /48 bursts, then refills at their own rates', () => {
  for (const [suffix, burst, interval] of [
    ['56', 40, 3000],
    ['48', 80, 1500],
  ]) {
    const { limits, c } = make()
    let i = 0
    const attempt = () => {
      const lease = limits.admit({ key: `key-${i++}`, parents: [`prefix::/${suffix}`] })
      if (lease.ok) lease.release()
      return lease.ok
    }
    for (let j = 0; j < burst; j++) assert.equal(attempt(), true)
    assert.equal(attempt(), false)
    c.tick(interval - 1)
    assert.equal(attempt(), false)
    c.tick(2) // allow for floating-point refill rounding
    assert.equal(attempt(), true)
    assert.equal(attempt(), false)
    c.tick(180000)
    for (let j = 0; j < burst; j++) assert.equal(attempt(), true)
    assert.equal(attempt(), false)
  }
})

test('admit: parent rate or concurrency refusals charge no address or parent bucket', () => {
  for (const concurrency of [false, true]) {
    const { limits, c } = make({
      burst: 1,
      ratePerMin56: 1,
      burst56: 1,
      ratePerMin48: 60,
      burst48: concurrency ? 10 : 1,
      concurrentPer48: concurrency ? 1 : 0,
    })
    const first = limits.admit({ key: 'first', parents: ['first::/56', 'shared::/48'] })
    assert.equal(first.ok, true)
    if (!concurrency) first.release()
    const candidate = { key: 'candidate', parents: ['candidate::/56', 'shared::/48'] }
    for (let i = 0; i < 50; i++) assert.equal(limits.admit(candidate).ok, false)
    assert.equal(limits.stats().tracked, 3, 'refused candidates create no partial entries')
    if (concurrency) first.release()
    else c.tick(1000)
    assert.equal(limits.admit(candidate).ok, true, 'earlier buckets retained their only token')
  }
  const { limits } = make({ burst: 1, burst56: 1, burst48: 2 })
  limits.admit({ key: 'first', parents: ['shared::/56', 'shared::/48'] }).release()
  for (let i = 0; i < 50; i++) {
    assert.equal(limits.admit({ key: 'refused', parents: ['shared::/56', 'shared::/48'] }).ok, false)
  }
  assert.equal(limits.admit({ key: 'other', parents: ['other::/56', 'shared::/48'] }).ok, true)
})

test('parent entries: shared table cap and idle purge preserve partially refilled and active buckets', () => {
  const { limits, c } = make({ maxEntries: 4 })
  const parents = ['prefix::/56', 'prefix::/48']
  const first = limits.admit({ key: 'a', parents })
  const second = limits.admit({ key: 'b', parents })
  assert.equal(first.ok && second.ok, true)
  assert.equal(limits.stats().tracked, 4)
  assert.deepEqual(limits.admit({ key: 'c', parents }), { ok: false, reason: 'busy' })
  first.release()
  second.release()
  assert.equal(limits.admit({ key: 'c', parents }).ok, false, 'unfilled buckets are retained')
  c.tick(6000)
  const next = limits.admit({ key: 'next', parents: ['next::/56', 'next::/48'] })
  assert.equal(next.ok, true, 'on-demand purge frees all three bucket levels')
  assert.equal(limits.stats().tracked, 3)
  c.tick(SWEEP_INTERVAL_MS)
  assert.equal(limits.admit({ key: 'ipv4' }).ok, true)
  assert.equal(limits.stats().tracked, 4, 'active parent entries survive the sweep')
  next.release()
  c.tick(SWEEP_INTERVAL_MS)
  limits.admit({ key: 'ipv4' })
  assert.equal(limits.stats().tracked, 1)
})

test('admit: reviewer /48 churn stays below burst plus 40 per minute', () => {
  let now = 0
  const limits = createConnectionLimits(defaults, { now: () => now })
  const live = []
  let admitted = 0
  let address = 0
  for (; now < 60000; now++) {
    while (live.length && live[0].end <= now) live.shift().release()
    while (live.length < 32) {
      const keys = clientIpKeys(`2001:db8:1:${(address++ % 65536).toString(16)}::1`)
      const lease = limits.admit(keys)
      if (!lease.ok) break
      admitted++
      live.push({ end: now + 20, release: lease.release })
    }
  }
  assert.ok(admitted >= 118 && admitted <= 120, `admitted ${admitted}`)
  assert.ok(limits.stats().tracked <= defaults.maxEntries)
})
