// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/server/connectionLimits.js
// Connection limits per client address for /ws. Pure: in-memory state keyed by the address bucket the caller
// derives (see clientIpKeys in uploadLimits.js), with an injectable clock for tests. Checked before a
// connection touches the database or serialises a snapshot.

export const SWEEP_INTERVAL_MS = 60_000

const ENV_DEFAULTS = {
  WS_CONNECT_RATE_PER_MIN: 10,
  WS_CONNECT_BURST: 20,
  WS_CONNECT_RATE_PER_MIN_56: 20,
  WS_CONNECT_BURST_56: 40,
  WS_CONNECT_RATE_PER_MIN_48: 40,
  WS_CONNECT_BURST_48: 80,
  WS_CONNECT_CONCURRENT_PER_IP: 8,
  WS_CONNECT_CONCURRENT_PER_56: 16,
  WS_CONNECT_CONCURRENT_PER_48: 32,
  WS_MAX_SOCKETS: 64,
  WS_CONNECT_MAX_TRACKED: 40_000,
}

// every value is a number >= 0, and 0 disables that limit. unset or empty means the default
export function readConnectionLimitsEnv(env) {
  const read = key => {
    const raw = env[key]
    if (raw === undefined || raw === '') return ENV_DEFAULTS[key]
    const value = Number(raw)
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`[envs] ${key} must be a number >= 0 (0 disables the limit)`)
    }
    return value
  }
  const ratePerMin = read('WS_CONNECT_RATE_PER_MIN')
  const burst = read('WS_CONNECT_BURST')
  if (ratePerMin > 0 && burst < 1) {
    throw new Error('[envs] WS_CONNECT_BURST must be at least 1 while WS_CONNECT_RATE_PER_MIN is set')
  }
  const parentBucket = suffix => {
    const ratePerMin = read(`WS_CONNECT_RATE_PER_MIN_${suffix}`)
    const burst = read(`WS_CONNECT_BURST_${suffix}`)
    if (ratePerMin > 0 && burst > 0 && burst < 1) {
      throw new Error(
        `[envs] WS_CONNECT_BURST_${suffix} must be 0 or at least 1 while WS_CONNECT_RATE_PER_MIN_${suffix} is set`
      )
    }
    return { [`ratePerMin${suffix}`]: ratePerMin, [`burst${suffix}`]: burst }
  }
  return {
    ratePerMin,
    burst,
    ...parentBucket('56'),
    ...parentBucket('48'),
    concurrentPerIp: read('WS_CONNECT_CONCURRENT_PER_IP'),
    concurrentPer56: read('WS_CONNECT_CONCURRENT_PER_56'),
    concurrentPer48: read('WS_CONNECT_CONCURRENT_PER_48'),
    maxSockets: read('WS_MAX_SOCKETS'),
    maxEntries: read('WS_CONNECT_MAX_TRACKED'),
  }
}

/**
 * Connection Limits
 *
 * - admit({ key, parents }) answers { ok: true, release } for a connection that may proceed, or { ok: false, reason }.
 *   release() gives the concurrency slot back; it is safe to call more than once
 * - per address: a token bucket of `burst` connections refilled at `ratePerMin`, and at most `concurrentPerIp`
 *   open connections. IPv6 /56 and /48 parents have their own rate buckets and concurrency caps
 * - address and parent entries are kept while a connection is open or the bucket is below full; `maxEntries` bounds the table
 *   and, while it is full of live entries, an address not yet in it is refused
 *
 */
export function createConnectionLimits(config, { now = Date.now } = {}) {
  const { maxSockets, maxEntries } = config
  const address = { rate: config.ratePerMin, burst: config.burst, concurrent: config.concurrentPerIp }
  const parent56 = { rate: config.ratePerMin56, burst: config.burst56, concurrent: config.concurrentPer56 }
  const parent48 = { rate: config.ratePerMin48, burst: config.burst48, concurrent: config.concurrentPer48 }
  const entries = new Map()
  let active = 0
  let lastSweep = 0

  const refill = (entry, t) => {
    const { rate, burst } = entry.limit
    if (!(rate > 0 && burst > 0)) return
    entry.tokens = Math.min(burst, entry.tokens + ((t - entry.at) / 60_000) * rate)
    entry.at = t
  }
  const idle = (entry, t) => {
    refill(entry, t)
    const { rate, burst } = entry.limit
    return entry.active === 0 && (!(rate > 0 && burst > 0) || entry.tokens >= burst)
  }
  const purge = t => {
    for (const [key, entry] of entries) {
      if (idle(entry, t)) entries.delete(key)
    }
  }
  const sweep = t => {
    if (t - lastSweep < SWEEP_INTERVAL_MS) return
    lastSweep = t
    purge(t)
  }
  const refuse = reason => ({ ok: false, reason })

  function admit({ key, parents = [] }) {
    const t = now()
    sweep(t)
    if (maxSockets > 0 && active >= maxSockets) return refuse('too many connections')
    const buckets = [[key, address], ...parents.map(parent => [parent, parent.endsWith('/56') ? parent56 : parent48])]
    const pending = []
    for (const [key, limit] of buckets) {
      const entry = entries.get(key) || { tokens: limit.burst, at: t, active: 0, limit }
      if (limit.concurrent > 0 && entry.active >= limit.concurrent) return refuse('too many connections')
      refill(entry, t)
      if (limit.rate > 0 && limit.burst > 0 && entry.tokens < 1) return refuse('too many connections')
      pending.push([key, entry])
    }
    const fits = () => entries.size + buckets.filter(([key]) => !entries.has(key)).length <= maxEntries
    if (maxEntries > 0 && !fits()) {
      purge(t)
      if (!fits()) return refuse('busy')
    }
    // All rates, concurrency caps and table capacity pass before charging or inserting any bucket.
    for (const [key, entry] of pending) {
      if (entry.limit.rate > 0 && entry.limit.burst > 0) entry.tokens -= 1
      entry.active++
      entries.set(key, entry)
    }
    active++
    let released = false
    const release = () => {
      if (released) return
      released = true
      active--
      for (const [, entry] of pending) entry.active--
    }
    return { ok: true, release }
  }

  function stats() {
    return { tracked: entries.size, active }
  }

  return { admit, stats }
}
