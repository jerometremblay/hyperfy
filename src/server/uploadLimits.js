// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/server/uploadLimits.js
import net from 'node:net'

// Upload rate limits, quotas and concurrency slots for /api/upload and /api/upload-check.
// Pure: in-memory state keyed by user id (or verified wallet) and client address, with an injectable clock
// for tests. The server is one process on one VM, so nothing here needs to persist.

export const PER_USER_CONCURRENT = 1
export const IP_MULTIPLIER = 4 // the per-address limits are this many times the per-user visitor values
export const RATE_WINDOW_MS = 60_000
export const QUOTA_WINDOW_MS = 86_400_000
// one address can add at most about 34,560 live records a day (240 checks a minute, each a user record that
// lives for a minute, or an upload record that lives for a day); each is well under 1 KB
export const MAX_ENTRIES = 40_000
export const SWEEP_INTERVAL_MS = 60_000
export const LEASE_GRACE_MS = 120_000 // a lease outlives its transfer deadline by this much before the sweep reclaims it

const MB = 1024 * 1024
const CONCURRENCY_RETRY_S = 2
const CAPACITY_RETRY_S = 60

const ENV_DEFAULTS = {
  UPLOAD_CONCURRENT_TOTAL: 4,
  UPLOAD_CONCURRENT_VISITORS: 2,
  UPLOAD_RATE_VISITOR_PER_MIN: 6,
  UPLOAD_RATE_BUILDER_PER_MIN: 60,
  UPLOAD_CHECK_RATE_PER_MIN: 60,
  UPLOAD_QUOTA_VISITOR_MB: 64,
  UPLOAD_QUOTA_BUILDER_MB: 1024,
  UPLOAD_QUOTA_VISITORS_TOTAL_MB: 1024,
  UPLOAD_SLOT_TIMEOUT_S: 120,
  UPLOAD_MIN_FREE_MB: 512,
  UPLOAD_MAX_TRACKED: MAX_ENTRIES,
  UPLOAD_RESERVED_TRUSTED: 1,
}

// every limit is a number >= 0, and 0 disables that limit. unset or empty means the default.
export function readUploadLimitsEnv(env) {
  const read = key => {
    const raw = env[key]
    if (raw === undefined || raw === '') return ENV_DEFAULTS[key]
    const value = Number(raw)
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`[envs] ${key} must be a number >= 0 (0 disables the limit)`)
    }
    return value
  }
  // the proxy header is read only where a proxy is known to set it: on Fly, or when named explicitly
  let clientIpHeader = ''
  if (env.UPLOAD_CLIENT_IP_HEADER !== undefined) {
    clientIpHeader = env.UPLOAD_CLIENT_IP_HEADER.trim().toLowerCase()
  } else if (env.FLY_APP_NAME) {
    clientIpHeader = 'fly-client-ip'
  }
  const concurrentTotal = read('UPLOAD_CONCURRENT_TOTAL')
  const reservedTrusted = read('UPLOAD_RESERVED_TRUSTED')
  if (concurrentTotal > 0 && reservedTrusted >= concurrentTotal) {
    throw new Error('[envs] UPLOAD_RESERVED_TRUSTED must stay below UPLOAD_CONCURRENT_TOTAL')
  }
  return {
    concurrentTotal,
    concurrentVisitors: read('UPLOAD_CONCURRENT_VISITORS'),
    reservedTrusted,
    ratePerMin: { visitor: read('UPLOAD_RATE_VISITOR_PER_MIN'), builder: read('UPLOAD_RATE_BUILDER_PER_MIN') },
    checkRatePerMin: read('UPLOAD_CHECK_RATE_PER_MIN'),
    quotaBytes: { visitor: read('UPLOAD_QUOTA_VISITOR_MB') * MB, builder: read('UPLOAD_QUOTA_BUILDER_MB') * MB },
    visitorsTotalQuotaBytes: read('UPLOAD_QUOTA_VISITORS_TOTAL_MB') * MB,
    slotTimeoutMs: read('UPLOAD_SLOT_TIMEOUT_S') * 1000,
    minFreeBytes: read('UPLOAD_MIN_FREE_MB') * MB,
    maxEntries: read('UPLOAD_MAX_TRACKED'),
    clientIpHeader,
    logClientIp: env.UPLOAD_LOG_CLIENT_IP === 'true',
  }
}

// IPv4 uses one address; IPv6 also carries its /56 and /48 concurrency buckets.
export function clientIpKeys(raw, fallback = '') {
  return parseIp(raw) || parseIp(fallback) || { key: 'unknown', parents: [] }
}

export function clientIpKey(raw, fallback = '') {
  return clientIpKeys(raw, fallback).key
}

function parseIp(value) {
  if (typeof value !== 'string') return null
  const ip = value.trim()
  const kind = net.isIP(ip)
  if (kind === 4) return { key: ip, parents: [] }
  if (kind !== 6) return null
  const groups = expandIpv6(ip)
  if (!groups) return null
  if (groups.slice(0, 5).every(n => n === 0) && groups[5] === 0xffff) {
    return { key: [groups[6] >> 8, groups[6] & 255, groups[7] >> 8, groups[7] & 255].join('.'), parents: [] }
  }
  const prefix = groups
    .slice(0, 3)
    .map(n => n.toString(16))
    .join(':')
  return {
    key: `${prefix}:${groups[3].toString(16)}::/64`,
    parents: [`${prefix}:${(groups[3] & 0xff00).toString(16)}::/56`, `${prefix}::/48`],
  }
}

// all eight hextets of a syntactically valid IPv6 address: `::` is widened to the missing zero groups
// wherever it sits, an embedded IPv4 tail counts as two groups, and a zone id is dropped
function expandIpv6(ip) {
  let text = ip.split('%')[0].toLowerCase()
  const tail4 = /^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(text)
  if (tail4) {
    const [a, b, c, d] = tail4[2].split('.').map(Number)
    text = `${tail4[1]}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  const halves = text.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const missing = 8 - head.length - tail.length
  if (missing < 0 || (halves.length === 1 && missing !== 0)) return null
  const groups = [...head, ...Array(missing).fill('0'), ...tail].map(g => parseInt(g, 16))
  return groups.length === 8 && groups.every(n => n >= 0 && n <= 0xffff) ? groups : null
}

const seconds = ms => Math.max(1, Math.ceil(ms / 1000))
const resetsIn = s => {
  const h = Math.floor(s / 3600)
  const m = Math.ceil((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

/**
 * Upload Limits
 *
 * - beginUpload({ userId, wallet, ip, tier, trusted, estimatedBytes }) admits a POST or refuses it with a status
 * - previewUpload(same) gives the verdict a POST would get right now, without counting or holding anything
 * - checkRate({ userId, wallet, ip, trusted }) admits an upload-check GET or refuses it
 * - a lease holds the user's slot until release(); confirm(bytes) swaps the declared size for the real one
 *   once the body is in, refusing if it no longer fits; commit(bytes) charges the quota once
 *
 * The per-user bucket is the user id, or the verified wallet when one is given: identities minted under one
 * wallet then share a single rate and quota. `tier` ('visitor' | 'builder') follows the effective rank and
 * picks the per-user rate and quota. `trusted` is true for a rank stored on the user or backed by a verified
 * wallet: a trusted user is exempt from the per-address limits, the visitor share of the slots, the shared
 * visitor budget and the tracking cap (their number is bounded elsewhere). An identity minted by a fresh
 * connection is never trusted on its own, whatever rank the world setting gives it.
 *
 * Only a stored rank is beyond the reach of minting: `reservedTrusted` slots of the total are kept for
 * those users, so untrusted and wallet-backed sessions together can hold at most total − reserve.
 *
 */
export function createUploadLimits(config, { now = Date.now, leaseTtlMs } = {}) {
  const ttlMs = leaseTtlMs ?? (config.slotTimeoutMs > 0 ? config.slotTimeoutMs + LEASE_GRACE_MS : 0)
  const maxEntries = config.maxEntries ?? MAX_ENTRIES
  // slots open to sessions that are not stored-rank: the total less the reserve, or no bound without a total
  const pooledMax =
    config.concurrentTotal > 0 && config.reservedTrusted > 0 ? config.concurrentTotal - config.reservedTrusted : 0
  const entries = new Map()
  const global = { active: 0, activeVisitors: 0, activePooled: 0, dayStart: null, dayBytes: 0, reserved: 0 }
  const leases = new Set()
  let lastSweep = 0
  let hits = 0 // timestamps held across every log, kept as they come and go

  const newEntry = () => ({ uploads: [], checks: [], active: 0, dayStart: null, dayBytes: 0, reserved: 0, touched: 0 })
  const peek = key => entries.get(key) || newEntry()
  const ensure = key => {
    let entry = entries.get(key)
    if (!entry) {
      entry = newEntry()
      entries.set(key, entry)
    }
    return entry
  }
  const subjectKey = ({ userId, wallet }) => (wallet ? `w:${wallet}` : `u:${userId}`)

  const prune = (log, t) => {
    while (log.length && log[0] <= t - RATE_WINDOW_MS) {
      log.shift()
      hits--
    }
  }
  // a hit is logged after the window is pruned, so a log never outgrows one window even with no limit set
  const record = (log, t) => {
    prune(log, t)
    log.push(t)
    hits++
  }
  // a rate verdict: null when under the limit, else how long until the oldest hit leaves the window
  const rateRetry = (log, limit, t) => {
    prune(log, t)
    if (!(limit > 0) || log.length < limit) return null
    return seconds(log[0] + RATE_WINDOW_MS - t)
  }
  // bytes already spoken for in the current window, and when the window ends. the window opens at the first charge
  const windowExpired = (entry, t) => entry.dayStart === null || t - entry.dayStart >= QUOTA_WINDOW_MS
  const used = (entry, t) => (windowExpired(entry, t) ? 0 : entry.dayBytes) + entry.reserved
  // `exclude` is a reservation of the caller's own that `bytes` replaces
  const quotaRetry = (entry, limit, bytes, t, exclude = 0) => {
    if (!(limit > 0)) return null
    const spent = used(entry, t) - exclude
    if (spent < limit && spent + bytes <= limit) return null
    return windowExpired(entry, t) ? QUOTA_WINDOW_MS / 1000 : seconds(entry.dayStart + QUOTA_WINDOW_MS - t)
  }
  const charge = (entry, bytes, t) => {
    if (windowExpired(entry, t)) {
      entry.dayStart = t
      entry.dayBytes = 0
    }
    entry.dayBytes += bytes
  }

  const refuse = (status, error, retryAfter) => ({ ok: false, status, error, retryAfter })

  // the quota budgets a request draws on, with the answer each one gives when it is exhausted
  const quotaHolders = ({ user, addr, tier, shared }) => {
    const quota = config.quotaBytes[tier]
    const holders = [
      {
        entry: user,
        limit: quota,
        refuse: retry =>
          refuse(429, `daily upload limit reached (${Math.round(quota / MB)}MB), resets in ${resetsIn(retry)}`, retry),
      },
    ]
    if (shared) {
      holders.push({
        entry: addr,
        limit: config.quotaBytes.visitor * IP_MULTIPLIER,
        refuse: retry =>
          refuse(429, `daily upload limit for your network reached, resets in ${resetsIn(retry)}`, retry),
      })
      holders.push({
        entry: global,
        limit: config.visitorsTotalQuotaBytes,
        refuse: retry => refuse(503, 'visitor uploads are paused for today', retry),
      })
    }
    return holders
  }

  // an entry carries nothing once its quota window is over and its rate window has emptied
  const expired = (entry, t) =>
    entry.active === 0 && entry.reserved === 0 && windowExpired(entry, t) && t - entry.touched >= RATE_WINDOW_MS
  // once a minute every log is trimmed to its window, so a record that is not touched again holds no stale hits
  const purge = t => {
    for (const [key, entry] of entries) {
      prune(entry.uploads, t)
      prune(entry.checks, t)
      if (expired(entry, t)) {
        hits -= entry.uploads.length + entry.checks.length
        entries.delete(key)
      }
    }
  }
  // a lease whose body never arrived and whose connection never signalled its end is reclaimed late.
  // a lease the handler owns is never reclaimed: its buffer lives until storage settles
  const reclaim = t => {
    if (!(ttlMs > 0)) return
    for (const lease of leases) {
      if (lease.started || t - lease.admittedAt < ttlMs) continue
      console.warn('[upload] reclaiming a slot whose body never arrived')
      lease.release()
    }
  }
  const sweep = t => {
    reclaim(t)
    if (t - lastSweep < SWEEP_INTERVAL_MS) return
    lastSweep = t
    purge(t)
  }
  // live records are never evicted to make room: when the table is full, untrusted identities not yet in it
  // wait. trusted users are not held to the cap: their number is bounded by the database and the wallets
  const room = (keys, t) => {
    if (!(maxEntries > 0)) return true
    const fresh = keys.filter(key => !entries.has(key)).length
    if (fresh === 0 || entries.size + fresh <= maxEntries) return true
    purge(t)
    return entries.size + fresh <= maxEntries
  }
  const full = () => refuse(503, 'the server is busy, try again in a minute', CAPACITY_RETRY_S)

  // every admission check, against the records as they are: a refusal, or the entries a lease would hold
  const evaluate = ({ userId, wallet, ip, tier, trusted, estimatedBytes }, t) => {
    if (!Number.isFinite(estimatedBytes) || estimatedBytes < 0) return refuse(411, 'Content-Length required', 1)
    const userKey = subjectKey({ userId, wallet })
    const ipKey = `ip:${ip}`
    const shared = !trusted
    const pooled = shared || !!wallet // everything a token stash or a fresh connection can mint
    if (shared && !room([userKey, ipKey], t)) return full()
    const user = peek(userKey)
    const addr = peek(ipKey)
    // concurrency
    if (PER_USER_CONCURRENT > 0 && user.active >= PER_USER_CONCURRENT) {
      return refuse(429, 'another upload is still in progress', CONCURRENCY_RETRY_S)
    }
    const busy = 'the server is busy with other uploads, try again in a moment'
    if (shared && config.concurrentVisitors > 0 && global.activeVisitors >= config.concurrentVisitors) {
      return refuse(503, busy, CONCURRENCY_RETRY_S)
    }
    if (pooled && pooledMax > 0 && global.activePooled >= pooledMax) return refuse(503, busy, CONCURRENCY_RETRY_S)
    if (config.concurrentTotal > 0 && global.active >= config.concurrentTotal)
      return refuse(503, busy, CONCURRENCY_RETRY_S)
    // rate
    let retry = rateRetry(user.uploads, config.ratePerMin[tier], t)
    if (retry) return refuse(429, `too many uploads, try again in ${retry}s`, retry)
    if (shared) {
      retry = rateRetry(addr.uploads, config.ratePerMin.visitor * IP_MULTIPLIER, t)
      if (retry) return refuse(429, `too many uploads from your network, try again in ${retry}s`, retry)
    }
    // quota
    for (const q of quotaHolders({ user, addr, tier, shared })) {
      retry = quotaRetry(q.entry, q.limit, estimatedBytes, t)
      if (retry) return q.refuse(retry)
    }
    return { ok: true, userKey, ipKey, shared, pooled }
  }

  function previewUpload(request) {
    const t = now()
    sweep(t)
    const verdict = evaluate({ estimatedBytes: 0, ...request }, t)
    return verdict.ok ? { ok: true } : verdict
  }

  function beginUpload(request) {
    const t = now()
    sweep(t)
    const verdict = evaluate(request, t)
    if (!verdict.ok) return verdict
    const { userKey, ipKey, shared, pooled } = verdict
    const { tier, estimatedBytes } = request
    // admitted: count the attempt, take the slots and reserve the bytes until commit or release
    const userEntry = ensure(userKey)
    const addrEntry = shared ? ensure(ipKey) : null
    const holders = quotaHolders({ user: userEntry, addr: addrEntry, tier, shared })
    record(userEntry.uploads, t)
    userEntry.touched = t
    if (addrEntry) {
      record(addrEntry.uploads, t)
      addrEntry.touched = t
    }
    userEntry.active++
    global.active++
    if (shared) global.activeVisitors++
    if (pooled) global.activePooled++
    let reservedBytes = estimatedBytes
    for (const h of holders) h.entry.reserved += reservedBytes
    let released = false
    let committed = false
    let settled = false
    // the reservation is given back exactly once, whether commit or release gets there first
    const settle = () => {
      if (settled) return
      settled = true
      for (const h of holders) h.entry.reserved -= reservedBytes
    }
    const lease = {
      admittedAt: t,
      started: false,
      timer: null, // the route parks its body-transfer timer here
      start() {
        lease.started = true
        clearTimeout(lease.timer)
        lease.timer = null
      },
      confirm(bytes) {
        const at = now()
        const own = settled ? 0 : reservedBytes
        for (const h of holders) {
          const retry = quotaRetry(h.entry, h.limit, bytes, at, own)
          if (retry) return h.refuse(retry)
        }
        if (!settled) {
          for (const h of holders) h.entry.reserved += bytes - reservedBytes
          reservedBytes = bytes
        }
        return { ok: true }
      },
      commit(bytes) {
        if (committed) return
        committed = true
        const at = now()
        settle()
        for (const h of holders) charge(h.entry, bytes, at)
      },
      release() {
        if (released) return
        released = true
        clearTimeout(lease.timer)
        lease.timer = null
        leases.delete(lease)
        settle()
        userEntry.active--
        global.active--
        if (shared) global.activeVisitors--
        if (pooled) global.activePooled--
      },
    }
    leases.add(lease)
    return { ok: true, lease }
  }

  function checkRate({ userId, wallet, ip, trusted }) {
    const t = now()
    sweep(t)
    const userKey = subjectKey({ userId, wallet })
    const ipKey = `ip:${ip}`
    if (!trusted && !room([userKey, ipKey], t)) return full()
    let retry = rateRetry(peek(userKey).checks, config.checkRatePerMin, t)
    if (retry) return refuse(429, `too many requests, try again in ${retry}s`, retry)
    if (!trusted) {
      retry = rateRetry(peek(ipKey).checks, config.checkRatePerMin * IP_MULTIPLIER, t)
      if (retry) return refuse(429, `too many requests from your network, try again in ${retry}s`, retry)
    }
    const user = ensure(userKey)
    record(user.checks, t)
    user.touched = t
    if (!trusted) {
      const addr = ensure(ipKey)
      record(addr.checks, t)
      addr.touched = t
    }
    return { ok: true }
  }

  // constant time: /status is public
  function stats() {
    return {
      active: global.active,
      activeVisitors: global.activeVisitors,
      activePooled: global.activePooled,
      tracked: entries.size,
      hits,
    }
  }

  return { beginUpload, previewUpload, checkRate, stats }
}
