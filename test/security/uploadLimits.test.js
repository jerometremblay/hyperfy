// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/uploadLimits.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  IP_MULTIPLIER,
  MAX_ENTRIES,
  QUOTA_WINDOW_MS,
  RATE_WINDOW_MS,
  SWEEP_INTERVAL_MS,
  clientIpKey,
  createUploadLimits,
  readUploadLimitsEnv,
} from '../../src/server/uploadLimits.js'

const MB = 1024 * 1024
const defaults = readUploadLimitsEnv({})

const clock = (start = 10_000_000) => {
  let t = start
  return { now: () => t, tick: ms => (t += ms) }
}
const make = (overrides = {}, options = {}) => {
  const c = clock()
  const limits = createUploadLimits({ ...defaults, ...overrides }, { now: c.now, ...options })
  return { limits, c }
}
const visitor = (userId, extra = {}) => ({
  userId,
  ip: '10.0.0.1',
  tier: 'visitor',
  trusted: false,
  estimatedBytes: 1000,
  ...extra,
})
const builder = (userId, extra = {}) => ({
  userId,
  ip: '10.0.0.2',
  tier: 'builder',
  trusted: true,
  estimatedBytes: 1000,
  ...extra,
})
// an upload that completes at once: admitted, committed and released
const quick = (limits, who, bytes = who.estimatedBytes) => {
  const v = limits.beginUpload(who)
  if (!v.ok) return v
  v.lease.commit(bytes)
  v.lease.release()
  return v
}
const silenced = fn => {
  const warn = console.warn
  const lines = []
  console.warn = (...args) => lines.push(args.join(' '))
  try {
    return [fn(), lines]
  } finally {
    console.warn = warn
  }
}

test('readUploadLimitsEnv: defaults, 0 disables, bad values throw, proxy header only on Fly or by name', () => {
  assert.equal(defaults.concurrentTotal, 4)
  assert.equal(defaults.concurrentVisitors, 2)
  assert.deepEqual(defaults.ratePerMin, { visitor: 6, builder: 60 })
  assert.equal(defaults.checkRatePerMin, 60)
  assert.deepEqual(defaults.quotaBytes, { visitor: 64 * MB, builder: 1024 * MB })
  assert.equal(defaults.visitorsTotalQuotaBytes, 1024 * MB)
  assert.equal(defaults.slotTimeoutMs, 120_000)
  assert.equal(defaults.minFreeBytes, 512 * MB)
  assert.equal(defaults.clientIpHeader, '')
  assert.equal(defaults.logClientIp, false)
  assert.equal(defaults.maxEntries, MAX_ENTRIES)
  assert.equal(readUploadLimitsEnv({ UPLOAD_MAX_TRACKED: '5' }).maxEntries, 5)
  assert.equal(defaults.reservedTrusted, 1)
  assert.equal(readUploadLimitsEnv({ UPLOAD_RESERVED_TRUSTED: '0' }).reservedTrusted, 0)
  assert.throws(() => readUploadLimitsEnv({ UPLOAD_RESERVED_TRUSTED: '4' }), /UPLOAD_RESERVED_TRUSTED must stay below/)
  assert.throws(
    () => readUploadLimitsEnv({ UPLOAD_CONCURRENT_TOTAL: '2', UPLOAD_RESERVED_TRUSTED: '2' }),
    /must stay below/
  )
  assert.equal(
    readUploadLimitsEnv({ UPLOAD_CONCURRENT_TOTAL: '0', UPLOAD_RESERVED_TRUSTED: '9' }).reservedTrusted,
    9,
    'no total, nothing to reserve from'
  )
  const off = readUploadLimitsEnv({
    UPLOAD_RATE_VISITOR_PER_MIN: '0',
    UPLOAD_QUOTA_VISITOR_MB: '0',
    UPLOAD_SLOT_TIMEOUT_S: '',
  })
  assert.equal(off.ratePerMin.visitor, 0)
  assert.equal(off.quotaBytes.visitor, 0)
  assert.equal(off.slotTimeoutMs, 120_000, 'empty means default')
  assert.throws(() => readUploadLimitsEnv({ UPLOAD_CONCURRENT_TOTAL: 'four' }), /UPLOAD_CONCURRENT_TOTAL/)
  assert.throws(() => readUploadLimitsEnv({ UPLOAD_QUOTA_BUILDER_MB: '-1' }), /UPLOAD_QUOTA_BUILDER_MB/)
  assert.equal(readUploadLimitsEnv({ FLY_APP_NAME: 'x' }).clientIpHeader, 'fly-client-ip')
  assert.equal(readUploadLimitsEnv({ FLY_APP_NAME: 'x', UPLOAD_CLIENT_IP_HEADER: '' }).clientIpHeader, '')
  assert.equal(readUploadLimitsEnv({ UPLOAD_CLIENT_IP_HEADER: ' X-Real-IP ' }).clientIpHeader, 'x-real-ip')
  assert.equal(readUploadLimitsEnv({ UPLOAD_LOG_CLIENT_IP: 'true' }).logClientIp, true)
})

test('clientIpKey: v4 as is, mapped v4 unwrapped, v6 by its real /64, garbage falls back', () => {
  assert.equal(clientIpKey('203.0.113.9'), '203.0.113.9')
  assert.equal(clientIpKey('::ffff:203.0.113.9'), '203.0.113.9')
  assert.equal(clientIpKey('2001:db8:1:2:3:4:5:6'), '2001:db8:1:2::/64')
  assert.equal(clientIpKey('2001:DB8:1:2:ffff::1'), '2001:db8:1:2::/64', 'same /64, upper case, compressed')
  assert.equal(clientIpKey('2001:db8::1'), '2001:db8:0:0::/64')
  assert.equal(clientIpKey('::1'), '0:0:0:0::/64')
  assert.equal(clientIpKey('fe80::1%en0'), 'fe80:0:0:0::/64', 'zone id dropped')
  // `::` can hide part of the prefix: these two are one /64, and differ from a shorter one
  assert.equal(clientIpKey('2600::1:2:3:4:5'), '2600:0:0:1::/64')
  assert.equal(clientIpKey('2600:0:0:1::5'), '2600:0:0:1::/64')
  assert.equal(clientIpKey('2600::5'), '2600:0:0:0::/64')
  // rotating the interface identifier stays in the bucket, however it is written
  for (const ip of [
    '2001:db8:1:2:aaaa::1',
    '2001:db8:1:2::bbbb:1',
    '2001:db8:1:2:0:0:0:1',
    '2001:db8:1:2:ffff:ffff:ffff:ffff',
  ]) {
    assert.equal(clientIpKey(ip), '2001:db8:1:2::/64', ip)
  }
  assert.notEqual(clientIpKey('2001:db8:1:3::1'), clientIpKey('2001:db8:1:2::1'), 'the next /64 is another bucket')
  // an embedded v4 tail is two groups
  assert.equal(clientIpKey('::1.2.3.4'), '0:0:0:0::/64')
  assert.equal(clientIpKey('64:ff9b::192.0.2.33'), '64:ff9b:0:0::/64')
  assert.equal(clientIpKey('1:2:3:4:5:6:7:8'), '1:2:3:4::/64')
  assert.equal(clientIpKey('1.2.3.4, 5.6.7.8', '::ffff:127.0.0.1'), '127.0.0.1', 'a joined header is not an address')
  assert.equal(clientIpKey(undefined, '10.1.1.1'), '10.1.1.1')
  assert.equal(clientIpKey('nope', 'also nope'), 'unknown')
  assert.equal(clientIpKey(['1.2.3.4'], '10.1.1.1'), '10.1.1.1', 'repeated header')
})

test('concurrency: one upload per user; release frees it; release is idempotent', () => {
  const { limits } = make()
  const first = limits.beginUpload(visitor('a'))
  assert.equal(first.ok, true)
  const second = limits.beginUpload(visitor('a'))
  assert.deepEqual(second, { ok: false, status: 429, error: 'another upload is still in progress', retryAfter: 2 })
  assert.equal(limits.beginUpload(visitor('b')).ok, true)
  assert.deepEqual(limits.stats(), { active: 2, activeVisitors: 2, activePooled: 2, tracked: 3, hits: 4 })
  first.lease.release()
  first.lease.release()
  assert.equal(limits.stats().active, 1)
  assert.equal(limits.beginUpload(visitor('a')).ok, true)
  assert.equal(limits.stats().active, 2)
})

test('global cap and the visitor share; 0 disables', () => {
  const { limits } = make({ concurrentTotal: 4, concurrentVisitors: 2, reservedTrusted: 0 })
  const v1 = limits.beginUpload(visitor('v1'))
  const v2 = limits.beginUpload(visitor('v2'))
  assert.equal(v1.ok && v2.ok, true)
  const v3 = limits.beginUpload(visitor('v3'))
  assert.equal(v3.status, 503)
  assert.match(v3.error, /busy with other uploads/)
  assert.equal(v3.retryAfter, 2)
  assert.equal(limits.beginUpload(builder('b1')).ok, true, 'builders still get the 3rd slot')
  assert.equal(limits.beginUpload(builder('b2')).ok, true, 'and the 4th')
  assert.equal(limits.beginUpload(builder('b3')).status, 503)
  v1.lease.release()
  assert.equal(limits.beginUpload(visitor('v3')).ok, true, 'a freed visitor slot admits the next visitor')
  assert.equal(limits.beginUpload(builder('b3')).status, 503, 'the total is still full')
  const open = make({ concurrentTotal: 0, concurrentVisitors: 0 }).limits
  for (let i = 0; i < 10; i++) assert.equal(open.beginUpload(visitor(`v${i}`)).ok, true)
})

test('rate: sliding 60 s window per user, refusals do not count, the bucket follows the user across tiers', () => {
  const { limits, c } = make()
  for (let i = 0; i < 6; i++) {
    c.tick(1000)
    assert.equal(quick(limits, visitor('a')).ok, true, `post ${i + 1}`)
  }
  const refused = quick(limits, visitor('a'))
  assert.equal(refused.status, 429)
  assert.equal(refused.retryAfter, 55, 'oldest hit was 5 s ago')
  assert.equal(refused.error, 'too many uploads, try again in 55s')
  c.tick(10_000)
  assert.equal(quick(limits, visitor('a')).retryAfter, 45, 'the refusal above did not count')
  c.tick(44_000)
  assert.equal(quick(limits, visitor('a')).retryAfter, 1)
  c.tick(1000)
  assert.equal(quick(limits, visitor('a')).ok, true, 'the oldest hit left the window')
  // a user promoted mid-window keeps the same log, now against the builder limit
  assert.equal(quick(limits, visitor('a', { tier: 'builder' })).ok, true)
  assert.equal(quick(limits, visitor('a')).status, 429, 'demoted again: the log is over the visitor limit')
  const b = make().limits
  for (let i = 0; i < 60; i++) assert.equal(quick(b, builder('x')).ok, true)
  assert.equal(quick(b, builder('x')).status, 429)
  assert.equal(quick(b, builder('y')).ok, true, 'another user is unaffected')
  const off = make({ ratePerMin: { visitor: 0, builder: 0 } }).limits
  for (let i = 0; i < 100; i++) assert.equal(quick(off, visitor('z')).ok, true)
})

test('rate per address: 4x the visitor rate shared by everyone on it; a stored builder is exempt', () => {
  const { limits } = make({ ratePerMin: { visitor: 1, builder: 60 } })
  const ipLimit = 1 * IP_MULTIPLIER
  for (let i = 0; i < ipLimit; i++) assert.equal(quick(limits, visitor(`v${i}`)).ok, true)
  const refused = quick(limits, visitor('fresh'))
  assert.equal(refused.status, 429)
  assert.match(refused.error, /from your network/)
  assert.equal(quick(limits, visitor('elsewhere', { ip: '10.0.0.9' })).ok, true)
  assert.equal(quick(limits, builder('b', { ip: '10.0.0.1' })).ok, true, 'exempt and not counted')
  assert.equal(quick(limits, visitor('fresh2')).status, 429)
})

test('checkRate: its own bucket per user and per address, never the post bucket', () => {
  const { limits, c } = make({ checkRatePerMin: 3, ratePerMin: { visitor: 1, builder: 1 } })
  for (let i = 0; i < 3; i++) assert.equal(limits.checkRate(visitor('a')).ok, true)
  const refused = limits.checkRate(visitor('a'))
  assert.equal(refused.status, 429)
  assert.equal(refused.retryAfter, 60)
  assert.match(refused.error, /too many requests, try again in 60s/)
  assert.equal(quick(limits, visitor('a')).ok, true, 'the post bucket is untouched')
  assert.equal(limits.checkRate(visitor('b')).ok, true)
  // two visitors on one address share 3 x 4 = 12 checks
  const shared = make({ checkRatePerMin: 3 }).limits
  for (let i = 0; i < 6; i++) {
    assert.equal(shared.checkRate(visitor(`u${i}`)).ok, true)
    assert.equal(shared.checkRate(visitor(`w${i}`)).ok, true)
  }
  const net = shared.checkRate(visitor('u99'))
  assert.equal(net.status, 429)
  assert.match(net.error, /from your network/)
  assert.equal(shared.checkRate(builder('b', { ip: '10.0.0.1' })).ok, true)
  c.tick(RATE_WINDOW_MS)
  assert.equal(limits.checkRate(visitor('a')).ok, true)
})

test('quota: estimated bytes are reserved, committed bytes charged, dedup uncharged, window resets after 24 h', () => {
  const { limits, c } = make({ quotaBytes: { visitor: 10_000, builder: 20_000 } })
  const first = limits.beginUpload(visitor('a', { estimatedBytes: 6000 }))
  assert.equal(first.ok, true)
  // reserved: another 6000 would overshoot, 4000 fits
  assert.equal(
    limits.beginUpload(visitor('a2', { estimatedBytes: 6000, ip: '10.9.9.9' })).ok,
    true,
    'other users unaffected'
  )
  first.lease.commit(5500)
  first.lease.release()
  assert.equal(limits.beginUpload(visitor('a', { estimatedBytes: 4501 })).status, 429)
  const ok = limits.beginUpload(visitor('a', { estimatedBytes: 4500 }))
  assert.equal(ok.ok, true)
  ok.lease.release() // dedup: never committed, nothing charged
  const again = limits.beginUpload(visitor('a', { estimatedBytes: 4500 }))
  assert.equal(again.ok, true)
  again.lease.release()
  const over = quick(limits, visitor('a', { estimatedBytes: 4501 }))
  assert.equal(over.status, 429)
  assert.match(over.error, /daily upload limit reached \(0MB\), resets in 24h 0m/)
  assert.equal(over.retryAfter, QUOTA_WINDOW_MS / 1000)
  c.tick(QUOTA_WINDOW_MS - 1)
  assert.equal(quick(limits, visitor('a', { estimatedBytes: 4501 })).ok, false)
  c.tick(1)
  assert.equal(quick(limits, visitor('a', { estimatedBytes: 9000 })).ok, true, 'a new day')
  // a file bigger than the whole quota is refused at once
  assert.equal(quick(limits, visitor('fresh', { estimatedBytes: 10_001 })).status, 429)
  assert.equal(quick(limits, builder('b', { estimatedBytes: 15_000 })).ok, true, 'builder quota')
  assert.equal(quick(limits, builder('b', { estimatedBytes: 5001 })).status, 429)
  // no content length: refused before anything else
  assert.deepEqual(limits.beginUpload(visitor('n', { estimatedBytes: NaN })), {
    ok: false,
    status: 411,
    error: 'Content-Length required',
    retryAfter: 1,
  })
  assert.equal(limits.beginUpload(visitor('n', { estimatedBytes: -1 })).status, 411)
  assert.equal(
    limits.stats().tracked,
    3,
    'a (new day) and its address, the builder; a2 expired with its day; refusals create no entry'
  )
})

test('quota per address and the shared visitor budget; stored builders are outside both', () => {
  const { limits } = make({ quotaBytes: { visitor: 1000, builder: 1_000_000 }, visitorsTotalQuotaBytes: 7000 })
  // address: 4 x 1000
  for (let i = 0; i < 4; i++) assert.equal(quick(limits, visitor(`v${i}`, { estimatedBytes: 1000 })).ok, true)
  const net = quick(limits, visitor('v4', { estimatedBytes: 1000 }))
  assert.equal(net.status, 429)
  assert.match(net.error, /for your network reached, resets in 24h 0m/)
  // the shared budget: 7000 total, 4000 used, from other addresses
  assert.equal(quick(limits, visitor('w1', { ip: '10.0.1.1', estimatedBytes: 1000 })).ok, true)
  assert.equal(quick(limits, visitor('w2', { ip: '10.0.2.1', estimatedBytes: 1000 })).ok, true)
  assert.equal(quick(limits, visitor('w3', { ip: '10.0.3.1', estimatedBytes: 1000 })).ok, true)
  const paused = quick(limits, visitor('w4', { ip: '10.0.4.1', estimatedBytes: 1 }))
  assert.deepEqual(paused, {
    ok: false,
    status: 503,
    error: 'visitor uploads are paused for today',
    retryAfter: QUOTA_WINDOW_MS / 1000,
  })
  assert.equal(
    quick(limits, builder('b', { estimatedBytes: 500_000 })).ok,
    true,
    'builders are not in the shared budget'
  )
  assert.equal(quick(limits, builder('b', { estimatedBytes: 500_000 })).ok, true)
  assert.equal(quick(limits, visitor('w5', { ip: '10.0.5.1', estimatedBytes: 1 })).status, 503)
})

test('rank modes: an effective-only builder gets the builder rate but stays in the shared visitor controls', () => {
  const { limits } = make({
    ratePerMin: { visitor: 1, builder: 10 },
    concurrentTotal: 4,
    concurrentVisitors: 1,
    visitorsTotalQuotaBytes: 5000,
  })
  const open = (id, extra = {}) => ({
    userId: id,
    ip: '10.0.0.1',
    tier: 'builder',
    trusted: false,
    estimatedBytes: 1000,
    ...extra,
  })
  // per-user: the builder rate
  assert.equal(quick(limits, open('o1')).ok, true)
  assert.equal(quick(limits, open('o1')).ok, true)
  // per-address: 4 x visitor rate shared with everyone minted on this address
  assert.equal(quick(limits, open('o2')).ok, true)
  assert.equal(quick(limits, open('o3')).ok, true)
  const net = quick(limits, open('o4'))
  assert.equal(net.status, 429)
  assert.match(net.error, /from your network/)
  assert.equal(quick(limits, builder('stored', { ip: '10.0.0.1' })).ok, true, 'a stored rank is exempt')
  // the visitor share of the slots and the shared budget
  const held = limits.beginUpload(open('o5', { ip: '10.0.0.5' }))
  assert.equal(held.ok, true)
  assert.equal(limits.beginUpload(open('o6', { ip: '10.0.0.6' })).status, 503, 'visitor share full')
  assert.equal(limits.beginUpload(builder('stored2')).ok, true)
  held.lease.commit(1000)
  held.lease.release()
  assert.equal(quick(limits, open('o7', { ip: '10.0.0.7', estimatedBytes: 1 })).status, 503, 'shared budget: 5000 used')
})

test('lease TTL: an abandoned lease is reclaimed by the next admission; a started lease is held until released', () => {
  const { limits, c } = make({ slotTimeoutMs: 1000 }) // ttl = 1000 + grace
  const stuck = limits.beginUpload(visitor('a'))
  assert.equal(stuck.ok, true)
  c.tick(120_999)
  assert.equal(limits.beginUpload(visitor('a')).status, 429, 'within the ttl the slot is held')
  c.tick(1)
  const [again, lines] = silenced(() => limits.beginUpload(visitor('a')))
  assert.equal(again.ok, true)
  assert.equal(lines.length, 1)
  assert.match(lines[0], /reclaiming a slot/)
  assert.equal(limits.stats().active, 1)
  stuck.lease.release() // the late release is a no-op
  assert.equal(limits.stats().active, 1)
  again.lease.release()
  // the handler owns a started lease: its buffer is alive until storage settles, so the ttl never applies
  const running = limits.beginUpload(visitor('b', { ip: '10.0.0.2' }))
  running.lease.start()
  c.tick(QUOTA_WINDOW_MS)
  const [held, quiet] = silenced(() => limits.beginUpload(visitor('b', { ip: '10.0.0.2' })))
  assert.equal(held.status, 429, 'still held long past the ttl')
  assert.equal(quiet.length, 0, 'nothing reclaimed')
  assert.equal(limits.stats().active, 1)
  running.lease.commit(1000)
  running.lease.release()
  assert.equal(limits.stats().active, 0)
  assert.equal(limits.beginUpload(visitor('b', { ip: '10.0.0.2' })).ok, true)
  const noTtl = make({ slotTimeoutMs: 0 })
  assert.equal(noTtl.limits.beginUpload(visitor('a')).ok, true)
  noTtl.c.tick(QUOTA_WINDOW_MS)
  assert.equal(noTtl.limits.beginUpload(visitor('a')).status, 429, 'no slot timeout, no ttl')
  const custom = make({}, { leaseTtlMs: 50 })
  assert.equal(custom.limits.beginUpload(visitor('a')).ok, true)
  custom.c.tick(50)
  assert.equal(silenced(() => custom.limits.beginUpload(visitor('a')))[0].ok, true)
})

test('accounting: a reservation is given back exactly once, whichever of release and commit comes first', () => {
  const tight = { quotaBytes: { visitor: 1000, builder: 1000 }, visitorsTotalQuotaBytes: 1000 }
  // release before commit: storage finished after the slot was given up
  const late = make(tight).limits
  const a = late.beginUpload(visitor('a', { estimatedBytes: 300 }))
  a.lease.release()
  a.lease.commit(300)
  assert.equal(quick(late, visitor('a', { estimatedBytes: 700 })).ok, true, '300 charged, nothing reserved')
  assert.equal(quick(late, visitor('a', { estimatedBytes: 1 })).status, 429)
  assert.equal(
    quick(late, visitor('z', { ip: '10.0.0.9', estimatedBytes: 1 })).status,
    503,
    'the shared budget saw it once'
  )
  // commit before release, the usual order
  const usual = make(tight).limits
  const b = usual.beginUpload(visitor('b', { estimatedBytes: 300 }))
  b.lease.commit(100)
  b.lease.release()
  assert.equal(quick(usual, visitor('b', { estimatedBytes: 900 })).ok, true, 'exactly 100 charged')
  assert.equal(quick(usual, visitor('b', { estimatedBytes: 1 })).status, 429)
  // release without a commit returns everything; a second commit charges nothing
  const none = make(tight).limits
  const d = none.beginUpload(visitor('d', { estimatedBytes: 500 }))
  d.lease.release()
  assert.equal(quick(none, visitor('d', { estimatedBytes: 1000 })).ok, true)
  const twice = make(tight).limits
  const e = twice.beginUpload(visitor('e', { estimatedBytes: 100 }))
  e.lease.commit(100)
  e.lease.commit(100)
  e.lease.release()
  assert.equal(quick(twice, visitor('e', { estimatedBytes: 900 })).ok, true)
})

test('confirm: the real size replaces the estimate; a size that no longer fits is refused and changes nothing', () => {
  const { limits } = make({ quotaBytes: { visitor: 1000, builder: 1000 }, visitorsTotalQuotaBytes: 1500 })
  const a = limits.beginUpload(visitor('a', { estimatedBytes: 100 }))
  let fit = a.lease.confirm(1001)
  assert.equal(fit.status, 429)
  assert.match(fit.error, /daily upload limit reached \(0MB\)/)
  assert.equal(a.lease.confirm(900).ok, true, '100 -> 900')
  assert.equal(a.lease.confirm(1000).ok, true, '900 -> 1000: its own reservation is not double counted')
  assert.equal(a.lease.confirm(1001).status, 429)
  a.lease.commit(1000)
  a.lease.release()
  assert.equal(quick(limits, visitor('a', { estimatedBytes: 1 })).status, 429)
  // the shared budget: 1000 of 1500 are gone
  const b = limits.beginUpload(visitor('b', { ip: '10.0.0.2', estimatedBytes: 100 }))
  fit = b.lease.confirm(501)
  assert.equal(fit.status, 503)
  assert.equal(fit.error, 'visitor uploads are paused for today')
  assert.equal(b.lease.confirm(500).ok, true)
  b.lease.release()
  // after the reservation was given back, confirm reserves nothing more
  const c = limits.beginUpload(visitor('c', { ip: '10.0.0.3', estimatedBytes: 100 }))
  c.lease.release()
  assert.equal(c.lease.confirm(50).ok, true)
  // 500 of the shared 1500 remain; they fit only if confirm reserved nothing on c's behalf
  assert.equal(quick(limits, visitor('c', { ip: '10.0.0.3', estimatedBytes: 500 })).ok, true, 'nothing left reserved')
})

test('tracking: records go once both windows are over; live records are never evicted; a full table refuses newcomers', () => {
  const off = { ratePerMin: { visitor: 0, builder: 0 }, slotTimeoutMs: 0 }
  const { limits, c } = make({ ...off, maxEntries: 0 })
  assert.equal(limits.checkRate(visitor('k1', { ip: '10.0.0.1' })).ok, true)
  assert.equal(limits.stats().tracked, 2, 'a user and its address')
  c.tick(RATE_WINDOW_MS)
  assert.equal(limits.checkRate(visitor('k2', { ip: '10.0.0.2' })).ok, true)
  assert.equal(limits.stats().tracked, 2, 'a check-only record is gone once its minute is over')
  assert.equal(quick(limits, visitor('q', { ip: '10.0.0.3', estimatedBytes: 10 })).ok, true)
  c.tick(QUOTA_WINDOW_MS - 1)
  assert.equal(limits.checkRate(visitor('x', { ip: '10.0.0.4' })).ok, true)
  assert.equal(limits.stats().tracked, 4, 'q and its address stay for the whole quota window')
  c.tick(1 + SWEEP_INTERVAL_MS)
  assert.equal(limits.checkRate(visitor('y', { ip: '10.0.0.5' })).ok, true)
  assert.equal(limits.stats().tracked, 2, 'q expired with its window, x idled out')
  // at capacity: whoever is live keeps their record and their limits; newcomers are refused until a record expires
  const cap = make({ ...off, maxEntries: 4, quotaBytes: { visitor: 1000, builder: 20 } })
  assert.equal(quick(cap.limits, builder('b', { estimatedBytes: 10 })).ok, true)
  assert.equal(quick(cap.limits, visitor('v1', { ip: '10.0.0.1', estimatedBytes: 1 })).ok, true)
  assert.equal(cap.limits.checkRate(visitor('v2', { ip: '10.0.0.1' })).ok, true)
  assert.equal(cap.limits.stats().tracked, 4)
  assert.equal(quick(cap.limits, builder('b', { estimatedBytes: 11 })).status, 429, 'the builder quota is spent')
  const refused = cap.limits.beginUpload(visitor('v3', { ip: '10.0.0.1' }))
  assert.deepEqual(refused, {
    ok: false,
    status: 503,
    error: 'the server is busy, try again in a minute',
    retryAfter: 60,
  })
  assert.equal(cap.limits.checkRate(visitor('v3', { ip: '10.0.0.1' })).status, 503)
  assert.equal(cap.limits.stats().tracked, 4, 'nothing was created for the newcomer')
  assert.equal(
    quick(cap.limits, visitor('v1', { ip: '10.0.0.1', estimatedBytes: 1 })).ok,
    true,
    'existing identities keep working'
  )
  assert.equal(cap.limits.checkRate(visitor('v2', { ip: '10.0.0.1' })).ok, true)
  assert.equal(
    quick(cap.limits, builder('b', { estimatedBytes: 11 })).status,
    429,
    'and the builder quota was not reset'
  )
  cap.c.tick(RATE_WINDOW_MS)
  assert.equal(cap.limits.beginUpload(visitor('v3', { ip: '10.0.0.1' })).ok, true, 'v2 idled out, so there is room')
  // a trusted user with no record is never held to the cap, even once the table is over it
  assert.equal(cap.limits.stats().tracked, 4)
  assert.equal(
    quick(cap.limits, builder('fresh-builder', { estimatedBytes: 1 })).ok,
    true,
    'a stored-rank builder is admitted at capacity'
  )
  assert.equal(cap.limits.checkRate(builder('fresh-builder2')).ok, true, 'and so is their upload-check')
  assert.equal(cap.limits.stats().tracked, 6, 'their records are kept beyond the cap')
  assert.equal(
    cap.limits.beginUpload(visitor('v4', { ip: '10.0.0.1' })).status,
    503,
    'an untrusted newcomer still waits'
  )
  const open = make({ ...off, maxEntries: 0 }).limits
  for (let i = 0; i < 50; i++) assert.equal(open.checkRate(visitor(`n${i}`, { ip: `10.1.0.${i}` })).ok, true)
  assert.equal(open.stats().tracked, 100)
})

test('wallet keying: identities minted under one verified wallet share one builder bucket and count as trusted', () => {
  const { limits, c } = make({
    ratePerMin: { visitor: 1, builder: 3 },
    quotaBytes: { visitor: 1000, builder: 5000 },
    concurrentTotal: 4,
    concurrentVisitors: 1,
    visitorsTotalQuotaBytes: 1000,
  })
  const tok = (id, extra = {}) => ({
    userId: id,
    wallet: 'WALLETA',
    ip: '10.0.0.1',
    tier: 'builder',
    trusted: true,
    estimatedBytes: 1000,
    ...extra,
  })
  // the rate is shared across identities: 3 a minute for the wallet, whoever sends
  assert.equal(quick(limits, tok('t1')).ok, true)
  assert.equal(quick(limits, tok('t2')).ok, true)
  assert.equal(quick(limits, tok('t3')).ok, true)
  const rate = quick(limits, tok('t4'))
  assert.equal(rate.status, 429)
  assert.match(rate.error, /^too many uploads, try again/, 'the wallet bucket, not the network')
  assert.equal(limits.stats().tracked, 1, 'one record for the wallet, none per identity, none per address')
  // so is the quota: 3000 of 5000 are gone, from a fourth identity's point of view too
  c.tick(RATE_WINDOW_MS)
  assert.equal(quick(limits, tok('t5', { estimatedBytes: 2001 })).status, 429)
  assert.equal(quick(limits, tok('t5', { estimatedBytes: 1000 })).ok, true, '4000 of 5000 now')
  // trusted for the pool: the visitor share may be full, the shared budget spent, the address rate exhausted
  const held = limits.beginUpload(visitor('v', { ip: '10.0.0.1', estimatedBytes: 1000 }))
  assert.equal(held.ok, true)
  assert.equal(limits.stats().activeVisitors, 1)
  assert.equal(limits.beginUpload(visitor('v2', { ip: '10.0.0.2' })).status, 503, 'the visitor share is full')
  c.tick(RATE_WINDOW_MS)
  const w = limits.beginUpload(tok('t6', { estimatedBytes: 1 }))
  assert.equal(w.ok, true, 'the wallet builder is admitted')
  assert.equal(limits.stats().activeVisitors, 1, 'and not counted as a visitor')
  w.lease.release()
  held.lease.release()
  // another wallet is another bucket
  assert.equal(quick(limits, tok('t7', { wallet: 'WALLETB' })).ok, true)
  assert.equal(limits.stats().tracked, 4, 'WALLETA, WALLETB, the visitor and the address')
})

test('rate 0: hits are still pruned to one window, so a log never grows without bound', () => {
  const { limits, c } = make({
    ratePerMin: { visitor: 0, builder: 0 },
    checkRatePerMin: 0,
    quotaBytes: { visitor: 0, builder: 0 },
  })
  for (let i = 0; i < 100; i++) assert.equal(quick(limits, visitor('a')).ok, true)
  for (let i = 0; i < 50; i++) assert.equal(limits.checkRate(visitor('a')).ok, true)
  assert.equal(limits.stats().hits, 300, 'user and address each hold 100 uploads and 50 checks')
  c.tick(RATE_WINDOW_MS + 1)
  assert.equal(quick(limits, visitor('a')).ok, true)
  assert.equal(limits.checkRate(visitor('a')).ok, true)
  assert.equal(limits.stats().hits, 4, 'one upload and one check each, the old window is gone')
})

test('previewUpload: the verdict a post would get, with nothing counted or held', () => {
  const { limits } = make({ ratePerMin: { visitor: 2, builder: 60 }, quotaBytes: { visitor: 1000, builder: 1000 } })
  const before = () => JSON.stringify(limits.stats())
  assert.deepEqual(limits.previewUpload(visitor('a')), { ok: true })
  assert.deepEqual(limits.previewUpload(visitor('a', { estimatedBytes: 1001 })), {
    ok: false,
    status: 429,
    error: 'daily upload limit reached (0MB), resets in 24h 0m',
    retryAfter: QUOTA_WINDOW_MS / 1000,
  })
  assert.equal(limits.stats().tracked, 0, 'a preview creates no record')
  const held = limits.beginUpload(visitor('a'))
  const snapshot = before()
  assert.equal(limits.previewUpload(visitor('a')).error, 'another upload is still in progress')
  assert.equal(limits.previewUpload(visitor('b', { ip: '10.0.0.2' })).ok, true)
  assert.equal(before(), snapshot, 'previews change nothing')
  held.lease.commit(100)
  held.lease.release()
  assert.equal(quick(limits, visitor('a', { estimatedBytes: 100 })).ok, true, 'the second upload of the minute')
  assert.match(limits.previewUpload(visitor('a')).error, /too many uploads, try again/)
  // the size defaults to nothing: an exhausted quota still answers
  const spent = limits.previewUpload({ userId: 'a', ip: '10.0.0.1', tier: 'visitor', trusted: false })
  assert.match(spent.error, /too many uploads/)
})

test('reserve: untrusted and wallet sessions together leave reservedTrusted slots to stored-rank users', () => {
  const walletSession = (id, extra = {}) => ({
    userId: id,
    wallet: `W${id}`,
    ip: '10.0.0.1',
    tier: 'builder',
    trusted: true,
    estimatedBytes: 1,
    ...extra,
  })
  // four distinct wallets: the fourth is refused, a stored-rank builder is admitted into the reserved slot
  const { limits } = make({ concurrentTotal: 4, concurrentVisitors: 2, reservedTrusted: 1 })
  const w1 = limits.beginUpload(walletSession('a'))
  const w2 = limits.beginUpload(walletSession('b'))
  const w3 = limits.beginUpload(walletSession('c'))
  assert.equal(w1.ok && w2.ok && w3.ok, true)
  const w4 = limits.beginUpload(walletSession('d'))
  assert.deepEqual(w4, {
    ok: false,
    status: 503,
    error: 'the server is busy with other uploads, try again in a moment',
    retryAfter: 2,
  })
  assert.deepEqual(limits.stats(), { active: 3, activeVisitors: 0, activePooled: 3, tracked: 3, hits: 3 })
  const stored = limits.beginUpload(builder('stored', { estimatedBytes: 1 }))
  assert.equal(stored.ok, true, 'the reserved slot')
  assert.equal(limits.beginUpload(builder('stored2', { estimatedBytes: 1 })).status, 503, 'the total is full')
  stored.lease.release()
  assert.equal(limits.beginUpload(walletSession('e')).status, 503, 'the free slot stays reserved')
  w1.lease.release()
  assert.equal(limits.beginUpload(walletSession('e')).ok, true, 'a pooled slot came back')
  // visitors 2 (their share) + wallet 1: a further wallet is refused, a stored builder is admitted
  const mixed = make({ concurrentTotal: 4, concurrentVisitors: 2, reservedTrusted: 1 }).limits
  assert.equal(mixed.beginUpload(visitor('v1', { ip: '10.0.0.1' })).ok, true)
  assert.equal(mixed.beginUpload(visitor('v2', { ip: '10.0.0.2' })).ok, true)
  assert.equal(mixed.beginUpload(visitor('v3', { ip: '10.0.0.3' })).status, 503, 'the visitor share')
  assert.equal(mixed.beginUpload(walletSession('a')).ok, true)
  assert.equal(mixed.beginUpload(walletSession('b')).status, 503, 'pooled 3 of 4')
  assert.equal(mixed.stats().activeVisitors, 2, 'wallet sessions are not visitors')
  assert.equal(mixed.beginUpload(builder('stored', { estimatedBytes: 1 })).ok, true)
  assert.equal(mixed.stats().active, 4)
  // the reserve set to 0 restores the old behaviour: wallets can take every slot
  const open = make({ concurrentTotal: 4, concurrentVisitors: 2, reservedTrusted: 0 }).limits
  for (const id of ['a', 'b', 'c', 'd']) assert.equal(open.beginUpload(walletSession(id)).ok, true)
  assert.equal(open.beginUpload(builder('stored', { estimatedBytes: 1 })).status, 503)
  // and without a total there is nothing to reserve from
  const noTotal = make({ concurrentTotal: 0, concurrentVisitors: 0, reservedTrusted: 1 }).limits
  for (let i = 0; i < 10; i++) assert.equal(noTotal.beginUpload(walletSession(`n${i}`)).ok, true)
})
