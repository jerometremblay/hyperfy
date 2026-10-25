// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/uploadLimitsRoutes.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import net from 'node:net'
import zlib from 'node:zlib'
import Fastify from 'fastify'
import compress from '@fastify/compress'
import { compressOptions } from '../../src/server/compressOptions.js'

// the real jwt helpers read JWT_SECRET at import time
process.env.JWT_SECRET = 'upload-limits-test-secret'
const { createJWT, readJWT } = await import('../../src/core/utils-server.js')
const { uploadRoutes } = await import('../../src/server/uploadRoutes.js')
const { createUploadLimits, readUploadLimitsEnv } = await import('../../src/server/uploadLimits.js')
const { createOnce } = await import('../../src/server/coalesce.js')

const MAX_MB = 1
const MAX_BYTES = MAX_MB * 1024 * 1024
const FRAMING = 64 * 1024
const GLB = Buffer.concat([Buffer.from('glTF', 'latin1'), Buffer.from([2, 0, 0, 0, 1, 2, 3, 4])])
const glb = tag => Buffer.concat([GLB, Buffer.from(tag)]) // a distinct file per tag
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const until = async (fn, what, timeout = 3000) => {
  const t0 = Date.now()
  while (!fn()) {
    if (Date.now() - t0 > timeout) throw new Error(`timed out waiting for ${what}`)
    await sleep(10)
  }
}

// --- world stand-ins, as in uploadRoutes.test.js: the effective rank mirrors playerRanks.getEffectiveRank ---
const settings = { customAvatars: true, effectiveRank: 0 }
const sockets = new Map()
const connect = (id, rank) => {
  const socket = {
    id,
    disconnected: false,
    player: {
      data: { rank },
      isBuilder() {
        return Math.max(this.data.rank, settings.effectiveRank) >= 1
      },
    },
  }
  sockets.set(id, socket)
  return socket
}
const getSocket = id => sockets.get(id)
const tokens = {}
for (const [id, rank] of [
  ['visitor', 0],
  ['v1', 0],
  ['v2', 0],
  ['v3', 0],
  ['v4', 0],
  ['v5', 0],
  ['builder', 1],
  ['builder2', 1],
  ['builder3', 1],
  ['token', 1],
  ['tok1', 1],
  ['tok2', 1],
  ['tok3', 1],
  ['wa', 1],
  ['wb', 1],
  ['wc', 1],
  ['wd', 1],
  ['admin', 2],
]) {
  connect(id, rank)
  tokens[id] = await createJWT({ userId: id })
}
// builder ranks granted for the session by a wallet token (ServerNetwork.onRequestBuilderByToken), not stored.
// `token` and `tok3` have the flag but no wallet on record (a grant the server lost track of); tok1 and tok2 share one
for (const id of ['token', 'tok1', 'tok2', 'tok3', 'wa', 'wb', 'wc', 'wd'])
  sockets.get(id).player.data.tokenGrantedRank = true
const wallets = new Map([
  ['tok1', 'WALLET_A'],
  ['tok2', 'WALLET_A'],
  ['wa', 'WALLET_1'],
  ['wb', 'WALLET_2'],
  ['wc', 'WALLET_3'],
  ['wd', 'WALLET_4'],
])
const getWallet = id => wallets.get(id) || null

// every limit off; tests switch on the ones they exercise
const unlimited = readUploadLimitsEnv(
  Object.fromEntries(
    [
      'UPLOAD_CONCURRENT_TOTAL',
      'UPLOAD_CONCURRENT_VISITORS',
      'UPLOAD_RATE_VISITOR_PER_MIN',
      'UPLOAD_RATE_BUILDER_PER_MIN',
      'UPLOAD_CHECK_RATE_PER_MIN',
      'UPLOAD_QUOTA_VISITOR_MB',
      'UPLOAD_QUOTA_BUILDER_MB',
      'UPLOAD_QUOTA_VISITORS_TOTAL_MB',
      'UPLOAD_SLOT_TIMEOUT_S',
      'UPLOAD_MIN_FREE_MB',
    ].map(key => [key, '0'])
  )
)

// storage stand-in: dedup by content, and every call can be held back until the test lets it go
const makeAssets = () => {
  const stored = new Map()
  const calls = []
  const waiters = []
  const assets = {
    calls,
    stored,
    upload: file =>
      new Promise((resolve, reject) => {
        const call = {
          file,
          finish: () => {
            if (stored.has(file.name)) return resolve(false)
            stored.set(file.name, file.buffer)
            resolve(true)
          },
          fail: err => reject(err),
        }
        calls.push(call)
        if (waiters.length) waiters.shift()(call)
        else if (!assets.hold) call.finish()
      }),
    exists: async filename => stored.has(filename),
    hold: false,
    // resolves with the next storage call, which is then left pending until finish() / fail()
    nextCall: () => new Promise(resolve => waiters.push(resolve)),
  }
  return assets
}

const multipart = (
  filename,
  data,
  boundary = `----rl${Math.random().toString(36).slice(2).padEnd(10, '0').slice(0, 10)}`
) => ({
  payload: Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`
    ),
    data,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]),
  contentType: `multipart/form-data; boundary=${boundary}`,
})

// what the route reserves for a request: its Content-Length minus the least framing
const estOf = (filename, data) => multipart(filename, data).payload.length - 64

const clock = () => {
  let t = 1_700_000_000_000
  return { now: () => t, tick: ms => (t += ms) }
}

async function makeApp({
  config = {},
  assets = makeAssets(),
  clientIpHeader = 'fly-client-ip',
  slotTimeoutMs = 0,
  minFreeBytes = 0,
  leaseTtlMs,
} = {}) {
  const c = clock()
  const limits = createUploadLimits({ ...unlimited, ...config }, { now: c.now, leaseTtlMs })
  const app = Fastify()
  app.register(compress, compressOptions())
  app.register(uploadRoutes, {
    readJWT,
    getSocket,
    getWallet,
    assets,
    getSettings: () => settings,
    maxUploadSize: MAX_MB,
    limits,
    clientIpHeader,
    slotTimeoutMs,
    minFreeBytes,
  })
  await app.ready()
  const post = async (user, filename, data, headers = {}) => {
    const { payload, contentType } = multipart(filename, data)
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload',
      payload,
      headers: { 'content-type': contentType, authorization: `Bearer ${tokens[user]}`, ...headers },
    })
    return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : null, headers: res.headers }
  }
  const check = async (user, headers = {}, { filename = `${'a'.repeat(64)}.glb`, size } = {}) => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/upload-check?filename=${filename}${size === undefined ? '' : `&size=${size}`}`,
      headers: { authorization: `Bearer ${tokens[user]}`, ...headers },
    })
    return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : null, headers: res.headers }
  }
  return { app, limits, assets, post, check, clock: c, close: () => app.close() }
}

const refusal = (r, status, pattern) => {
  assert.equal(r.status, status)
  assert.match(r.body.error, pattern)
  assert.equal(typeof r.body.retryAfter, 'number')
  assert.equal(r.headers['retry-after'], String(r.body.retryAfter))
  assert.equal(r.headers.connection, 'close')
}

test('concurrency: a second upload from the same user is 429 while the first waits on storage; released after', async () => {
  const { limits, assets, post, close } = await makeApp()
  try {
    assets.hold = true
    const pending = assets.nextCall()
    const first = post('builder', 'one.glb', glb('1'))
    const call = await pending
    assert.equal(limits.stats().active, 1)
    const second = await post('builder', 'two.glb', glb('2'))
    refusal(second, 429, /another upload is still in progress/)
    assert.equal(second.body.retryAfter, 2)
    assert.equal(assets.calls.length, 1, 'the refused request never reached storage')
    assets.hold = false
    assert.equal((await post('builder2', 'three.glb', glb('3'))).status, 200, 'another user is admitted')
    assert.equal(limits.stats().active, 1, 'still held by the first')
    call.finish()
    assert.equal((await first).status, 200)
    await until(() => limits.stats().active === 0, 'release after storage resolved')
    assert.equal((await post('builder', 'two.glb', glb('2'))).status, 200)
    assert.equal(limits.stats().active, 0)
  } finally {
    await close()
  }
})

test('global cap and the visitor share, with Retry-After on the 503', async () => {
  const { assets, post, close } = await makeApp({ config: { concurrentTotal: 2, concurrentVisitors: 1 } })
  try {
    assets.hold = true
    const p1 = assets.nextCall()
    const b1 = post('builder', 'b1.glb', glb('b1'))
    const c1 = await p1
    const p2 = assets.nextCall()
    const b2 = post('builder2', 'b2.glb', glb('b2'))
    const c2 = await p2
    refusal(await post('builder3', 'b3.glb', glb('b3')), 503, /busy with other uploads/)
    c1.finish()
    c2.finish()
    assert.equal((await b1).status, 200)
    assert.equal((await b2).status, 200)
    // one visitor slot of the two
    const p3 = assets.nextCall()
    const v1 = post('v1', 'v1.vrm', glb('v1'))
    const c3 = await p3
    refusal(await post('v2', 'v2.vrm', glb('v2')), 503, /busy with other uploads/)
    assets.hold = false
    assert.equal((await post('builder', 'b4.glb', glb('b4'))).status, 200, 'the other slot is still open to builders')
    c3.finish()
    assert.equal((await v1).status, 200)
  } finally {
    await close()
  }
})

test('rate: visitor posts per minute, a 403 after parsing still counts, the window slides; builders are separate', async () => {
  const { post, clock, close } = await makeApp({ config: { ratePerMin: { visitor: 2, builder: 2 } } })
  try {
    assert.equal((await post('visitor', 'a.vrm', glb('a'))).status, 200)
    assert.equal((await post('visitor', 'b.glb', glb('b'))).status, 403, 'not an avatar: refused after parsing')
    const third = await post('visitor', 'c.vrm', glb('c'))
    refusal(third, 429, /too many uploads, try again in 60s/)
    assert.equal(third.body.retryAfter, 60)
    assert.equal((await post('builder', 'd.glb', glb('d'))).status, 200)
    assert.equal((await post('builder', 'e.glb', glb('e'))).status, 200)
    refusal(await post('builder', 'f.glb', glb('f')), 429, /too many uploads/)
    clock.tick(60_000)
    assert.equal((await post('visitor', 'c.vrm', glb('c'))).status, 200)
    assert.equal((await post('builder', 'f.glb', glb('f'))).status, 200)
  } finally {
    await close()
  }
})

test('quota: charged on store, refused by Content-Length before parsing, duplicates free, a new day after 24 h', async () => {
  const quota = 6 * 1024 // three 2 KB files; a duplicate still has to fit its reservation to be admitted
  const { assets, post, clock, close } = await makeApp({ config: { quotaBytes: { visitor: quota, builder: quota } } })
  try {
    const twoK = fill => Buffer.concat([GLB, Buffer.alloc(2048 - GLB.length, fill)])
    assert.equal((await post('builder', 'half.glb', twoK(1))).status, 200)
    assert.equal(assets.calls.length, 1)
    // declared size beyond the remainder: refused with nothing parsed or stored
    const big = Buffer.concat([GLB, Buffer.alloc(FRAMING + quota, 2)])
    const r = await post('builder', 'big.glb', big)
    refusal(r, 429, /daily upload limit reached \(0MB\), resets in 24h 0m/)
    assert.equal(assets.calls.length, 1, 'storage not called')
    // the same file again is served from the store and not charged
    assert.equal((await post('builder', 'half.glb', twoK(1))).status, 200)
    assert.equal(assets.calls.length, 2)
    assert.equal((await post('builder', 'other.glb', twoK(3))).status, 200, 'the duplicate left the budget intact')
    refusal(await post('builder', 'more.glb', twoK(4)), 429, /daily upload limit reached/)
    clock.tick(24 * 3600 * 1000)
    assert.equal((await post('builder', 'more.glb', twoK(4))).status, 200)
  } finally {
    await close()
  }
})

test('quota: the shared visitor budget answers 503 and leaves builders alone', async () => {
  const first = Buffer.concat([GLB, Buffer.alloc(52)])
  // exactly the first request's reservation: it is admitted, and what it charges leaves no room for a second
  const { post, close } = await makeApp({ config: { visitorsTotalQuotaBytes: estOf('a.vrm', first) } })
  try {
    assert.equal((await post('v1', 'a.vrm', first)).status, 200)
    refusal(
      await post('v2', 'b.vrm', Buffer.concat([GLB, Buffer.alloc(100)]), { 'fly-client-ip': '198.51.100.2' }),
      503,
      /visitor uploads are paused for today/
    )
    assert.equal((await post('builder', 'c.glb', glb('c'))).status, 200)
  } finally {
    await close()
  }
})

test('release: storage error, signature mismatch and an oversize declaration all leave no slot behind', async () => {
  const { limits, assets, post, close } = await makeApp()
  try {
    assets.hold = true
    const pending = assets.nextCall()
    const failing = post('builder', 'a.glb', glb('a'))
    ;(await pending).fail(new Error('disk full'))
    assert.equal((await failing).status, 500)
    assets.hold = false
    assert.equal(limits.stats().active, 0)
    assert.equal((await post('builder', 'a.glb', glb('a'))).status, 200)
    assert.equal((await post('builder', 'a.png', glb('a'))).status, 415)
    assert.equal(limits.stats().active, 0)
    const huge = Buffer.alloc(MAX_BYTES + FRAMING + 1)
    const r = await post('builder', 'huge.glb', huge)
    assert.equal(r.status, 413)
    assert.match(r.body.error, /exceeds 1MB/)
    assert.equal(r.headers.connection, 'close')
    assert.equal(limits.stats().active, 0)
    assert.equal(assets.calls.length, 2)
  } finally {
    await close()
  }
})

test('per address: the visitor rate times 4 is shared by everyone behind one address; builders are exempt', async () => {
  const { post, clock, close } = await makeApp({ config: { ratePerMin: { visitor: 1, builder: 60 } } })
  try {
    const ip = { 'fly-client-ip': '203.0.113.7' }
    for (const user of ['v1', 'v2', 'v3', 'v4'])
      assert.equal((await post(user, `${user}.vrm`, glb(user), ip)).status, 200)
    refusal(await post('v5', 'v5.vrm', glb('v5'), ip), 429, /from your network/)
    assert.equal((await post('builder', 'b.glb', glb('b'), ip)).status, 200)
    // the same address written as a mapped v4 address is the same bucket
    refusal(await post('v5', 'v5.vrm', glb('v5'), { 'fly-client-ip': '::ffff:203.0.113.7' }), 429, /from your network/)
    // and a v6 address is bucketed by its /64
    assert.equal((await post('v5', 'v5.vrm', glb('v5'), { 'fly-client-ip': '2001:db8:1:2::1' })).status, 200)
    // a minute later, without the header: the socket address is the bucket, shared the same way
    clock.tick(60_000)
    assert.equal((await post('visitor', 'a.vrm', glb('a'))).status, 200)
    for (const user of ['v1', 'v2', 'v3']) assert.equal((await post(user, `${user}2.vrm`, glb(user + 2))).status, 200)
    refusal(await post('v4', 'v42.vrm', glb('v42')), 429, /from your network/)
    assert.equal(
      (await post('v5', 'v52.vrm', glb('v52'), { 'fly-client-ip': '203.0.113.7' })).status,
      200,
      'the forged bucket is separate'
    )
  } finally {
    await close()
  }
})

test('per address: off Fly the proxy header is ignored, so a forged header does not open a new bucket', async () => {
  const { post, close } = await makeApp({ config: { ratePerMin: { visitor: 1, builder: 60 } }, clientIpHeader: '' })
  try {
    for (const user of ['v1', 'v2', 'v3', 'v4']) {
      assert.equal(
        (await post(user, `${user}.vrm`, glb(user), { 'fly-client-ip': `198.51.100.${user.slice(1)}` })).status,
        200
      )
    }
    refusal(await post('v5', 'v5.vrm', glb('v5'), { 'fly-client-ip': '198.51.100.99' }), 429, /from your network/)
  } finally {
    await close()
  }
})

test('rank modes: an open-build world gives minted users the builder rate, but the address limits still apply', async () => {
  const { post, close } = await makeApp({ config: { ratePerMin: { visitor: 1, builder: 3 } } })
  try {
    settings.effectiveRank = 1
    const ip = { 'fly-client-ip': '203.0.113.9' }
    assert.equal((await post('v1', 'a.glb', glb('a'), ip)).status, 200, 'a glb: builder by the world setting')
    assert.equal((await post('v1', 'b.glb', glb('b'), ip)).status, 200)
    assert.equal((await post('v1', 'c.glb', glb('c'), ip)).status, 200, 'the builder rate, not the visitor one')
    refusal(await post('v1', 'd.glb', glb('d'), ip), 429, /too many uploads, try again/)
    assert.equal((await post('v2', 'e.glb', glb('e'), ip)).status, 200, '4th on the address')
    refusal(await post('v3', 'f.glb', glb('f'), ip), 429, /from your network/)
    assert.equal((await post('builder', 'g.glb', glb('g'), ip)).status, 200, 'a stored rank is exempt')
    settings.effectiveRank = 0
    refusal(await post('v4', 'h.vrm', glb('h'), ip), 429, /from your network/)
  } finally {
    settings.effectiveRank = 0
    await close()
  }
})

test('upload-check: its own per-minute bucket, which the post bucket does not share', async () => {
  const { post, check, close } = await makeApp({
    config: { checkRatePerMin: 3, ratePerMin: { visitor: 1, builder: 1 } },
  })
  try {
    for (let i = 0; i < 3; i++) assert.equal((await check('builder')).status, 200)
    const r = await check('builder')
    refusal(r, 429, /too many requests, try again in 60s/)
    assert.equal((await check('admin')).status, 200)
    assert.equal((await post('builder', 'a.glb', glb('a'))).status, 200, 'checks did not consume the post bucket')
  } finally {
    await close()
  }
})

test('free space: 507 at the floor (never above a fifth of the volume), fail open on error, skipped without statfs', async () => {
  const minFree = 100 * 1024 * 1024
  const assets = makeAssets()
  let space = { free: 0, total: 0 }
  assets.freeSpace = async () => {
    if (space instanceof Error) throw space
    return space
  }
  const { post, close } = await makeApp({ assets, minFreeBytes: minFree })
  const warn = console.warn
  const warned = []
  console.warn = (...args) => warned.push(args.join(' '))
  try {
    const file = glb('a')
    // a large volume: the floor is minFree
    space = { free: minFree + file.length - 1, total: 10 * 1024 * 1024 * 1024 }
    const r = await post('builder', 'a.glb', file)
    assert.equal(r.status, 507)
    assert.equal(r.body.error, 'the server is out of storage')
    assert.equal(assets.calls.length, 0)
    space = { free: minFree + file.length, total: 10 * 1024 * 1024 * 1024 }
    assert.equal((await post('builder', 'a.glb', file)).status, 200)
    // a small volume: the floor is a fifth of it, so the host can still auto-extend at 75% used
    const total = 200 * 1024 * 1024
    space = { free: total * 0.2 + file.length, total }
    assert.equal((await post('builder', 'b.glb', glb('b'))).status, 200)
    space = { free: total * 0.2 + file.length - 1, total }
    assert.equal((await post('builder', 'c.glb', glb('c'))).status, 507)
    // statfs failing is logged once and uploads proceed
    space = new Error('EACCES')
    assert.equal((await post('builder', 'c.glb', glb('c'))).status, 200)
    assert.equal((await post('builder', 'd.glb', glb('d'))).status, 200)
    assert.equal(warned.filter(l => /free space check unavailable/.test(l)).length, 1)
    assert.ok(
      warned.some(l => /free-space floor/.test(l)),
      'the 507 was logged for the operator'
    )
  } finally {
    console.warn = warn
    await close()
  }
  const s3 = await makeApp({ minFreeBytes: minFree })
  try {
    assert.equal((await s3.post('builder', 'a.glb', glb('a'))).status, 200, 'no freeSpace(): no guard')
  } finally {
    await s3.close()
  }
})

// --- a real listener: aborts, stalls and pipelining need a socket ---
const listen = async app => {
  await app.listen({ port: 0, host: '127.0.0.1' })
  return app.server.address().port
}
const rawRequest = (port, user, filename, data, { contentLength } = {}) => {
  const { payload, contentType } = multipart(filename, data)
  const head =
    `POST /api/upload HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nAuthorization: Bearer ${tokens[user]}\r\n` +
    `Content-Type: ${contentType}\r\nContent-Length: ${contentLength ?? payload.length}\r\n\r\n`
  return { head, payload }
}
const connectRaw = port =>
  new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1')
    socket.on('error', () => {}) // resets are expected once the server has closed its side
    socket.once('connect', () => resolve(socket))
    socket.once('error', reject)
  })

test('abort before the body is complete frees the slot; abort after the body keeps it until storage resolves', async () => {
  const { app, limits, assets, post, close } = await makeApp()
  try {
    const port = await listen(app)
    // (a) headers and a slice of a 1 MB body, then gone
    const big = Buffer.concat([GLB, Buffer.alloc(MAX_BYTES - 4096)])
    const { head, payload } = rawRequest(port, 'builder', 'big.glb', big)
    const socket = await connectRaw(port)
    socket.write(head)
    socket.write(payload.subarray(0, 64 * 1024))
    await until(() => limits.stats().active === 1, 'admission')
    socket.destroy()
    await until(() => limits.stats().active === 0, 'release after the abort')
    assert.equal(assets.calls.length, 0)
    assert.equal((await post('builder', 'a.glb', glb('a'))).status, 200, 'the user is admitted again')
    // (b) the full body, then gone while storage is still working: the slot is held until it resolves
    assets.hold = true
    const pending = assets.nextCall()
    const full = rawRequest(port, 'builder', 'b.glb', glb('b'))
    const socket2 = await connectRaw(port)
    socket2.write(full.head)
    socket2.end(full.payload)
    const call = await pending
    assert.equal(limits.stats().active, 1)
    socket2.destroy()
    await sleep(100)
    assert.equal(limits.stats().active, 1, 'still held: the buffer is alive until storage is done')
    call.finish()
    await until(() => limits.stats().active === 0, 'release after storage')
    assets.hold = false
    assert.equal(assets.stored.has('b.glb'), true, 'the upload was stored and charged although nobody is listening')
  } finally {
    await close()
  }
})

test('slot timeout: a stalled transfer is cut and freed; slow storage after a complete body is not', async () => {
  const { app, limits, assets, close } = await makeApp({ slotTimeoutMs: 200 })
  try {
    const port = await listen(app)
    const { head, payload } = rawRequest(port, 'builder', 'stall.glb', Buffer.concat([GLB, Buffer.alloc(100 * 1024)]))
    const socket = await connectRaw(port)
    const closed = new Promise(resolve => socket.once('close', resolve))
    socket.write(head)
    socket.write(payload.subarray(0, 1024))
    await until(() => limits.stats().active === 1, 'admission')
    const t0 = Date.now()
    await closed
    assert.ok(Date.now() - t0 < 2000, 'the server closed the stalled connection')
    await until(() => limits.stats().active === 0, 'release after the timeout')
    assert.equal(assets.calls.length, 0)
    // a complete body whose storage takes longer than the slot timeout is left alone
    assets.hold = true
    const pending = assets.nextCall()
    const ok = new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: '127.0.0.1',
          port,
          method: 'POST',
          path: '/api/upload',
          headers: { 'content-type': multipart('x', GLB).contentType },
        },
        res => {
          let body = ''
          res.on('data', d => (body += d))
          res.on('end', () => resolve({ status: res.statusCode, body }))
        }
      )
      req.on('error', reject)
      const { payload: p, contentType } = multipart('slow.glb', glb('slow'))
      req.setHeader('content-type', contentType)
      req.setHeader('authorization', `Bearer ${tokens.builder2}`)
      req.end(p)
    })
    const call = await pending
    await sleep(400)
    assert.equal(limits.stats().active, 1, 'the slot is still held')
    call.finish()
    assert.equal((await ok).status, 200)
    assets.hold = false
  } finally {
    await close()
  }
})

test('411: a chunked body without Content-Length is refused before anything is buffered', async () => {
  const { app, limits, assets, close } = await makeApp()
  try {
    const port = await listen(app)
    const { payload, contentType } = multipart('a.glb', glb('a'))
    const socket = await connectRaw(port)
    const reply = new Promise(resolve => {
      let data = ''
      socket.on('data', d => (data += d.toString('latin1')))
      socket.on('close', () => resolve(data))
    })
    socket.write(
      `POST /api/upload HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nAuthorization: Bearer ${tokens.builder}\r\n` +
        `Content-Type: ${contentType}\r\nTransfer-Encoding: chunked\r\n\r\n${payload.length.toString(16)}\r\n`
    )
    socket.write(payload)
    const data = await reply
    assert.match(data.split('\r\n')[0], /^HTTP\/1\.1 411/)
    assert.match(data, /connection: close/i)
    assert.match(data, /"error":"Content-Length required"/)
    assert.equal(assets.calls.length, 0)
    assert.equal(limits.stats().active, 0)
  } finally {
    await close()
  }
})

test('pipelining: two posts on one socket, then the socket dies; the started leases are held past the ttl until storage settles', async () => {
  const { app, limits, assets, clock, close } = await makeApp({ leaseTtlMs: 1000 })
  const warn = console.warn
  const warned = []
  console.warn = (...args) => warned.push(args.join(' '))
  try {
    const port = await listen(app)
    assets.hold = true
    const first = rawRequest(port, 'builder', 'p1.glb', glb('p1'))
    const second = rawRequest(port, 'builder2', 'p2.glb', glb('p2'))
    const socket = await connectRaw(port)
    const c1 = assets.nextCall()
    const c2 = assets.nextCall()
    socket.write(first.head)
    socket.write(first.payload)
    socket.write(second.head)
    socket.write(second.payload)
    const [call1, call2] = await Promise.all([c1, c2])
    assert.equal(limits.stats().active, 2, 'both admitted, both waiting on storage')
    socket.destroy()
    await sleep(100)
    assert.equal(limits.stats().active, 2, 'still held: the handlers own the slots')
    clock.tick(1000)
    // the next admission reclaims nothing: the buffers are alive until storage is done
    assets.hold = false
    const { post } = await makeAppOn(app)
    assert.equal((await post('admin', 'next.glb', glb('next'))).status, 200)
    assert.equal(limits.stats().active, 2, 'both still held')
    assert.equal(warned.filter(l => /reclaiming a slot/.test(l)).length, 0)
    call1.finish()
    call2.finish()
    await until(() => limits.stats().active === 0, 'release after storage')
    assert.equal(assets.stored.has('p1.glb') && assets.stored.has('p2.glb'), true, 'both stored and charged')
    assert.equal((await post('builder', 'after.glb', glb('after'))).status, 200)
  } finally {
    console.warn = warn
    await close()
  }
})

test('an admitted request whose body never arrives and whose connection never closes is reclaimed after the ttl', async () => {
  const { app, limits, assets, clock, close } = await makeApp({ slotTimeoutMs: 0, leaseTtlMs: 500 })
  const warn = console.warn
  const warned = []
  console.warn = (...args) => warned.push(args.join(' '))
  try {
    const port = await listen(app)
    const big = Buffer.concat([GLB, Buffer.alloc(MAX_BYTES - 4096)])
    const { head, payload } = rawRequest(port, 'builder', 'big.glb', big)
    const socket = await connectRaw(port)
    socket.write(head)
    socket.write(payload.subarray(0, 64 * 1024))
    await until(() => limits.stats().active === 1, 'admission')
    clock.tick(499)
    const { post } = await makeAppOn(app)
    assert.equal((await post('admin', 'a.glb', glb('a'))).status, 200)
    assert.equal(limits.stats().active, 1, 'within the ttl the slot is held')
    clock.tick(1)
    assert.equal(
      (await post('builder', 'b.glb', glb('b'))).status,
      200,
      'the same user is admitted again once the lease is reclaimed'
    )
    assert.equal(warned.filter(l => /reclaiming a slot/.test(l)).length, 1)
    assert.equal(limits.stats().active, 0)
    socket.destroy()
    await sleep(50)
    assert.equal(limits.stats().active, 0, 'the late close is a no-op')
    assert.equal(assets.calls.length, 2)
  } finally {
    console.warn = warn
    await close()
  }
})

test('a compressed request body is refused with 415 before admission; the plugin never inflates it', async () => {
  const { app, limits, assets, post, close } = await makeApp()
  try {
    assert.equal(app.hasReplyDecorator('compress'), true, 'the production compression plugin is registered')
    const { payload, contentType } = multipart('a.glb', glb('a'))
    for (const [encoding, body] of [
      ['gzip', zlib.gzipSync(payload)],
      ['deflate', zlib.deflateSync(payload)],
      ['br', zlib.brotliCompressSync(payload)],
      ['GZIP', zlib.gzipSync(payload)],
    ]) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/upload',
        payload: body,
        headers: {
          'content-type': contentType,
          'content-encoding': encoding,
          authorization: `Bearer ${tokens.builder}`,
        },
      })
      assert.equal(res.statusCode, 415, encoding)
      assert.equal(res.json().error, 'compressed uploads are not accepted')
      assert.equal(res.headers.connection, 'close')
    }
    assert.equal(assets.calls.length, 0)
    assert.equal(limits.stats().active, 0)
    assert.equal((await post('builder', 'a.glb', glb('a'), { 'content-encoding': 'identity' })).status, 200)
    assert.equal((await post('builder', 'b.glb', glb('b'))).status, 200)
  } finally {
    await close()
  }
})

test('reservation: the declared length minus the least framing is held, so a small file cannot slip under a near-empty quota', async () => {
  const { payload: small } = multipart('b.glb', glb('b'))
  const reserved = small.length - 64
  const first = Buffer.concat([GLB, Buffer.alloc(1000 - GLB.length, 7)])
  // after the first file there is one byte less left than the second request reserves
  const quota = 1000 + reserved - 1
  const { assets, post, close } = await makeApp({ config: { quotaBytes: { visitor: quota, builder: quota } } })
  try {
    assert.equal((await post('builder', 'first.glb', first)).status, 200)
    const r = await post('builder', 'b.glb', glb('b'))
    refusal(r, 429, /daily upload limit reached/)
    assert.equal(assets.calls.length, 1, 'refused before parsing')
  } finally {
    await close()
  }
})

test('rank modes: a session-only token grant gets the builder rate but stays in the address limits and the shared budget', async () => {
  // three files charged plus the fourth's reservation: the fourth is admitted, nothing shared fits after it
  const budget = 3 * glb('t0').length + estOf('t3.glb', glb('t3'))
  const { post, close } = await makeApp({
    config: { ratePerMin: { visitor: 1, builder: 60 }, visitorsTotalQuotaBytes: budget },
  })
  try {
    const ip = { 'fly-client-ip': '203.0.113.21' }
    for (let i = 0; i < 4; i++)
      assert.equal((await post('token', `t${i}.glb`, glb(`t${i}`), ip)).status, 200, `upload ${i + 1}`)
    refusal(await post('token', 't4.glb', glb('t4'), ip), 429, /from your network/)
    assert.equal(
      (await post('builder', 'b.glb', glb('b'), ip)).status,
      200,
      'a stored rank on the same address is exempt'
    )
    // the token user's bytes count toward the shared visitor budget, which is now spent
    refusal(
      await post('v1', 'v.vrm', Buffer.concat([GLB, Buffer.alloc(20)]), { 'fly-client-ip': '203.0.113.22' }),
      503,
      /paused for today/
    )
    assert.equal((await post('builder2', 'c.glb', Buffer.concat([GLB, Buffer.alloc(20)]))).status, 200)
  } finally {
    await close()
  }
})

test('duplicates uploaded at the same time are stored once and charged once', async () => {
  // a store shaped like AssetsLocal: existence is checked when the write starts, overlapping writes coalesce
  const stored = new Map()
  const writes = new Map()
  const holds = []
  const assets = {
    calls: [],
    stored,
    upload: file =>
      createOnce(writes, file.name, async () => {
        assets.calls.push(file.name)
        if (stored.has(file.name)) return false
        if (assets.hold) await new Promise(resolve => holds.push(resolve))
        stored.set(file.name, file.buffer)
        return true
      }),
    exists: async name => stored.has(name),
    hold: true, // the pair is held in flight; later writes go straight through
  }
  const file = Buffer.concat([GLB, Buffer.alloc(88)]) // 100 bytes
  // both reservations must fit; afterwards a third upload fits only if the pair was charged once
  const budget = 2 * estOf('same.vrm', file)
  const framing = estOf('third.vrm', Buffer.alloc(0))
  const third = Buffer.concat([GLB, Buffer.alloc(budget - 150 - framing - GLB.length)])
  assert.ok(
    100 + estOf('third.vrm', third) <= budget && 200 + estOf('third.vrm', third) > budget,
    'third is sized to the question'
  )
  const { post, close } = await makeApp({ assets, config: { visitorsTotalQuotaBytes: budget } })
  try {
    const a = post('v1', 'same.vrm', file, { 'fly-client-ip': '203.0.113.31' })
    const b = post('v2', 'same.vrm', file, { 'fly-client-ip': '203.0.113.32' })
    await until(() => holds.length === 1 && assets.calls.length === 1, 'one write in flight')
    await sleep(50)
    assert.equal(assets.calls.length, 1, 'the second upload waits on the first instead of writing')
    holds[0]()
    assert.deepEqual(
      (await Promise.all([a, b])).map(r => r.status),
      [200, 200]
    )
    assert.equal(stored.size, 1)
    assets.hold = false
    const r3 = await post('v3', 'third.vrm', third, { 'fly-client-ip': '203.0.113.33' })
    assert.equal(r3.status, 200, 'only one of the two was charged')
  } finally {
    await close()
  }
})

// inject against an app that is also listening
async function makeAppOn(app) {
  const post = async (user, filename, data) => {
    const { payload, contentType } = multipart(filename, data)
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload',
      payload,
      headers: { 'content-type': contentType, authorization: `Bearer ${tokens[user]}` },
    })
    return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : null }
  }
  return { post }
}

test('wallet keying: two identities under one wallet share the builder rate and quota; the wallet is trusted for the pool', async () => {
  const fileBytes = glb('x').length
  const quota = 3 * fileBytes + estOf('w3.glb', glb('w3')) - 1 // three files, the fourth no longer fits
  const { limits, assets, post, clock, close } = await makeApp({
    config: {
      ratePerMin: { visitor: 1, builder: 3 },
      quotaBytes: { visitor: 1000, builder: quota },
      concurrentTotal: 4,
      concurrentVisitors: 1,
      visitorsTotalQuotaBytes: estOf('v.vrm', glb('v')), // one visitor upload, and nothing shared after it
    },
  })
  try {
    const ip = { 'fly-client-ip': '203.0.113.41' }
    assert.equal((await post('tok1', 'w0.glb', glb('w0'), ip)).status, 200)
    assert.equal((await post('tok1', 'w1.glb', glb('w1'), ip)).status, 200)
    assert.equal(
      (await post('tok2', 'w2.glb', glb('w2'), ip)).status,
      200,
      'the second identity draws on the same rate'
    )
    refusal(await post('tok2', 'w3.glb', glb('w3'), ip), 429, /^too many uploads, try again/)
    assert.equal(limits.stats().tracked, 1, 'one wallet record; no user or address records')
    clock.tick(60_000)
    refusal(await post('tok1', 'w3.glb', glb('w3'), ip), 429, /daily upload limit reached/)
    refusal(await post('tok2', 'w3.glb', glb('w3'), ip), 429, /daily upload limit reached/)
    assert.equal(assets.calls.length, 3)
    // the pool: the only visitor slot is held and the shared budget is tiny, the wallet builder still goes through
    assets.hold = true
    const pending = assets.nextCall()
    const v = post('v1', 'v.vrm', glb('v'), { 'fly-client-ip': '203.0.113.42' })
    const call = await pending
    assert.equal(limits.stats().activeVisitors, 1)
    clock.tick(24 * 3600 * 1000)
    assets.hold = false
    assert.equal((await post('tok2', 'w4.glb', glb('w4'), ip)).status, 200, 'admitted while the visitor share is full')
    assert.equal(limits.stats().activeVisitors, 1, 'not counted as a visitor')
    refusal(await post('v2', 'v2.vrm', glb('v2'), { 'fly-client-ip': '203.0.113.43' }), 503, /busy with other uploads/)
    call.finish()
    assert.equal((await v).status, 200)
    // the wallet keeps its own budget and rate: a fresh minute, the other identity, the same address
    clock.tick(60_000)
    assert.equal((await post('tok1', 'a0.glb', glb('a0'), ip)).status, 200)
    // a session flagged as token-granted whose wallet the server does not know draws on the visitor pool
    refusal(await post('tok3', 't3.glb', glb('t3'), ip), 503, /visitor uploads are paused for today/)
  } finally {
    await close()
  }
})

test('upload-check answers the refusal the upload would get, without counting or holding anything', async () => {
  const first = Buffer.concat([GLB, Buffer.alloc(1000 - GLB.length, 5)])
  const quota = estOf('first.glb', first) + 100 // one file, then almost nothing
  const { limits, assets, post, check, close } = await makeApp({
    config: { quotaBytes: { visitor: quota, builder: quota } },
  })
  try {
    const name = `${'c'.repeat(64)}.glb`
    assert.deepEqual((await check('builder', {}, { filename: name, size: 1000 })).body, { exists: false })
    assert.equal((await post('builder', 'first.glb', first)).status, 200)
    // the quota is spent: a check for a new file says so, bodiless, with retryAfter, and keeps the connection
    const r = await check('builder', {}, { filename: name, size: 500 })
    assert.equal(r.status, 429)
    assert.match(r.body.error, /daily upload limit reached/)
    assert.equal(typeof r.body.retryAfter, 'number')
    assert.equal(r.headers['retry-after'], String(r.body.retryAfter))
    assert.notEqual(r.headers.connection, 'close')
    // a file the server already has is never refused: nothing would follow
    assets.stored.set(name, first)
    assert.deepEqual((await check('builder', {}, { filename: name, size: 500 })).body, { exists: true })
    // a size over the cap is a 413 at the check
    assert.equal((await check('builder', {}, { size: MAX_BYTES + 1 })).status, 413)
    // an upload in flight for this user: the check says so too
    assets.hold = true
    const pending = assets.nextCall()
    const held = post('admin', 'held.glb', glb('h'))
    const call = await pending
    const busy = await check('admin')
    assert.equal(busy.status, 429)
    assert.equal(busy.body.error, 'another upload is still in progress')
    assert.equal(busy.body.retryAfter, 2)
    assert.equal(limits.stats().active, 1, 'the check held nothing')
    call.finish()
    assert.equal((await held).status, 200)
    assets.hold = false
    assert.deepEqual((await check('admin')).body, { exists: false })
    // previews are not counted against the post rate
    const tight = await makeApp({ config: { ratePerMin: { visitor: 60, builder: 1 } } })
    try {
      for (let i = 0; i < 5; i++) assert.deepEqual((await tight.check('builder2')).body, { exists: false })
      assert.equal((await tight.post('builder2', 'p.glb', glb('p'))).status, 200, 'the checks consumed no post')
      assert.equal((await tight.check('builder2')).status, 429, 'and now the check reports the spent rate')
    } finally {
      await tight.close()
    }
  } finally {
    await close()
  }
})

test('reserve: wallet and visitor sessions together leave a slot to stored-rank users; 0 disables it', async () => {
  const hold = async (ctx, user, name, headers = {}) => {
    const pending = ctx.assets.nextCall()
    const result = ctx.post(user, name, glb(name), headers)
    const call = await pending
    return { result, call }
  }
  // four wallets: the fourth is 503 with Retry-After, the admin (stored rank) is admitted alongside the three
  const four = await makeApp({ config: { concurrentTotal: 4, concurrentVisitors: 2, reservedTrusted: 1 } })
  try {
    four.assets.hold = true
    const held = []
    for (const user of ['wa', 'wb', 'wc']) held.push(await hold(four, user, `${user}.glb`))
    assert.equal(four.limits.stats().activePooled, 3)
    refusal(await four.post('wd', 'wd.glb', glb('wd')), 503, /busy with other uploads/)
    const admin = await hold(four, 'admin', 'adm.glb')
    assert.equal(four.limits.stats().active, 4, 'the stored-rank user took the reserved slot')
    for (const h of [...held, admin]) h.call.finish()
    assert.deepEqual(
      (await Promise.all([...held, admin].map(h => h.result))).map(r => r.status),
      [200, 200, 200, 200]
    )
    await until(() => four.limits.stats().active === 0, 'release')
  } finally {
    await four.close()
  }
  // visitors 2 + wallet 1: another wallet is refused, a stored-rank builder goes through
  const mixed = await makeApp({ config: { concurrentTotal: 4, concurrentVisitors: 2, reservedTrusted: 1 } })
  try {
    mixed.assets.hold = true
    const v1 = await hold(mixed, 'v1', 'v1.vrm', { 'fly-client-ip': '203.0.113.51' })
    const v2 = await hold(mixed, 'v2', 'v2.vrm', { 'fly-client-ip': '203.0.113.52' })
    refusal(await mixed.post('v3', 'v3.vrm', glb('v3'), { 'fly-client-ip': '203.0.113.53' }), 503, /busy/)
    const wa = await hold(mixed, 'wa', 'wa.glb')
    refusal(await mixed.post('wb', 'wb.glb', glb('wb')), 503, /busy with other uploads/)
    assert.equal(mixed.limits.stats().activeVisitors, 2, 'the wallet session is not a visitor')
    const b = await hold(mixed, 'builder', 'b.glb')
    assert.equal(mixed.limits.stats().active, 4)
    for (const h of [v1, v2, wa, b]) h.call.finish()
    assert.deepEqual(
      (await Promise.all([v1, v2, wa, b].map(h => h.result))).map(r => r.status),
      [200, 200, 200, 200]
    )
  } finally {
    await mixed.close()
  }
  // reserve 0: four wallets fill the server and the stored-rank builder waits like anyone else
  const open = await makeApp({ config: { concurrentTotal: 4, concurrentVisitors: 2, reservedTrusted: 0 } })
  try {
    open.assets.hold = true
    const held = []
    for (const user of ['wa', 'wb', 'wc', 'wd']) held.push(await hold(open, user, `${user}.glb`))
    refusal(await open.post('builder', 'b.glb', glb('b')), 503, /busy with other uploads/)
    for (const h of held) h.call.finish()
    await Promise.all(held.map(h => h.result))
  } finally {
    await open.close()
  }
})
