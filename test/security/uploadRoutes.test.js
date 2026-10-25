// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/uploadRoutes.test.js
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import Fastify from 'fastify'

// the real jwt helpers read JWT_SECRET at import time
process.env.JWT_SECRET = 'upload-routes-test-secret'
const { createJWT, readJWT } = await import('../../src/core/utils-server.js')
const { assetRoutes, uploadRoutes } = await import('../../src/server/uploadRoutes.js')
const { createUploadLimits, readUploadLimitsEnv } = await import('../../src/server/uploadLimits.js')

// this file makes dozens of builder posts in one process: every limit is off (see uploadLimitsRoutes.test.js)
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

const MAX_MB = 1
const GLB = Buffer.concat([Buffer.from('glTF', 'latin1'), Buffer.from([2, 0, 0, 0, 1, 2, 3, 4])])
const PNG = Buffer.concat([Buffer.from([0x89]), Buffer.from('PNG\r\n\x1a\n', 'latin1'), Buffer.from([1, 2, 3])])
const HTML = Buffer.from('<!doctype html><script>document.title = "x"</script>')

// --- world stand-ins: sockets with players whose effective rank mirrors playerRanks.getEffectiveRank ---
const settings = { customAvatars: false, effectiveRank: 0 }
const sockets = new Map()
const makeSocket = (id, rank) => ({
  id,
  disconnected: false,
  player: {
    data: { rank },
    isBuilder() {
      return Math.max(this.data.rank, settings.effectiveRank) >= 1
    },
  },
})
const connect = (id, rank) => {
  const socket = makeSocket(id, rank)
  sockets.set(id, socket)
  return socket
}
// the route looks a socket up twice per request: at authentication and again right before the commit.
// `onCommitLookup(id, fn)` runs fn at the start of that second lookup, i.e. after the body was consumed
const pending = new Map()
const onCommitLookup = (id, fn) => pending.set(id, { fn, lookups: 0 })
const getSocket = id => {
  const hook = pending.get(id)
  if (hook && ++hook.lookups === 2) {
    pending.delete(id)
    hook.fn(sockets.get(id))
  }
  return sockets.get(id)
}
const stored = new Map()
let lastUploadWasBuffer = null
const assets = {
  // the route hands over `{ name, buffer }`; a File is still accepted the way the other callers use it
  upload: async file => {
    lastUploadWasBuffer = Buffer.isBuffer(file.buffer)
    stored.set(file.name, Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(await file.arrayBuffer()))
  },
  exists: async filename => stored.has(filename),
}

const multipartBody = (files, fields = []) => {
  const boundary = `----p0${Math.random().toString(36).slice(2)}`
  const parts = []
  for (const [name, value] of fields) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`))
  }
  for (const { filename, data, type = 'application/octet-stream' } of files) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${type}\r\n\r\n`
      ),
      data,
      Buffer.from('\r\n')
    )
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`))
  return { payload: Buffer.concat(parts), contentType: `multipart/form-data; boundary=${boundary}` }
}

let app
let tokens
const auth = token => (token === null ? {} : { authorization: `Bearer ${token}` })
const post = async (token, files, { fields, headers = {} } = {}) => {
  const { payload, contentType } = multipartBody(files, fields)
  const res = await app.inject({
    method: 'POST',
    url: '/api/upload',
    payload,
    headers: { 'content-type': contentType, ...auth(token), ...headers },
  })
  // a stored upload answers 200 with an empty body
  return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : null }
}
const check = async (token, filename) => {
  const res = await app.inject({
    method: 'GET',
    url: `/api/upload-check?filename=${encodeURIComponent(filename)}`,
    headers: auth(token),
  })
  return { status: res.statusCode, body: res.statusCode === 200 ? res.json() : null }
}

before(async () => {
  app = Fastify()
  app.register(uploadRoutes, {
    readJWT,
    getSocket,
    assets,
    getSettings: () => settings,
    maxUploadSize: MAX_MB,
    limits: createUploadLimits(unlimited),
  })
  await app.ready()
  connect('visitor', 0)
  connect('builder', 1)
  connect('admin', 2)
  connect('offline', 2)
  sockets.delete('offline')
  tokens = {
    visitor: await createJWT({ userId: 'visitor' }),
    builder: await createJWT({ userId: 'builder' }),
    admin: await createJWT({ userId: 'admin' }),
    offline: await createJWT({ userId: 'offline' }),
    unknown: await createJWT({ userId: 'nobody' }),
    noUser: await createJWT({ foo: 'bar' }),
  }
})
after(async () => {
  await app.close()
})

test('upload: no bearer -> 401 before any body parsing (malformed json never reaches the parser)', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/upload',
    payload: '{not json',
    headers: { 'content-type': 'application/json' },
  })
  assert.equal(res.statusCode, 401)
  assert.equal(res.json().error, 'upload requires a connected session')
})

test('upload: jwt must verify, name a user, and that user must be connected', async () => {
  assert.equal((await post('garbage', [{ filename: 'a.glb', data: GLB }])).status, 401)
  const forged = tokens.builder.replace(/\.[^.]+$/, '.AAAA')
  assert.equal((await post(forged, [{ filename: 'a.glb', data: GLB }])).status, 401)
  assert.equal((await post(tokens.noUser, [{ filename: 'a.glb', data: GLB }])).status, 401)
  assert.equal((await post(tokens.unknown, [{ filename: 'a.glb', data: GLB }])).status, 401)
  assert.equal((await post(tokens.offline, [{ filename: 'a.glb', data: GLB }])).status, 401)
  const builder = sockets.get('builder')
  builder.disconnected = true
  assert.equal((await post(tokens.builder, [{ filename: 'a.glb', data: GLB }])).status, 401)
  builder.disconnected = false
  assert.equal(stored.size, 0)
})

test('upload: visitor without the avatar exception -> 403 before parsing; with it, only vrm', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/upload',
    payload: '{not json',
    headers: { 'content-type': 'application/json', ...auth(tokens.visitor) },
  })
  assert.equal(res.statusCode, 403)
  assert.equal((await post(tokens.visitor, [{ filename: 'a.glb', data: GLB }])).status, 403)
  settings.customAvatars = true
  assert.equal((await post(tokens.visitor, [{ filename: 'a.glb', data: GLB }])).status, 403)
  assert.equal((await post(tokens.visitor, [{ filename: 'a.vrm', data: GLB }])).status, 200)
  assert.equal((await post(tokens.visitor, [{ filename: 'a.js', data: Buffer.from('1') }])).status, 403)
  settings.customAvatars = false
  assert.equal(stored.has('a.vrm'), true)
  stored.clear()
})

test('upload: effective rank comes from the world setting as well as the player rank', async () => {
  assert.equal((await post(tokens.visitor, [{ filename: 'a.glb', data: GLB }])).status, 403)
  settings.effectiveRank = 1
  assert.equal((await post(tokens.visitor, [{ filename: 'a.glb', data: GLB }])).status, 200)
  settings.effectiveRank = 0
  assert.equal((await post(tokens.visitor, [{ filename: 'a.glb', data: GLB }])).status, 403)
  stored.clear()
})

test('upload: a builder with a non-multipart body -> 415, nothing parsed', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/upload',
    payload: '{not json',
    headers: { 'content-type': 'application/json', ...auth(tokens.builder) },
  })
  assert.equal(res.statusCode, 415)
  assert.equal(res.json().error, 'expected multipart/form-data')
})

test('upload: builder -> 200 and stored; disallowed type, signature mismatch and empty requests are rejected', async () => {
  assert.equal((await post(tokens.builder, [{ filename: 'model.glb', data: GLB }])).status, 200)
  assert.equal(stored.has('model.glb'), true)
  assert.equal(stored.get('model.glb').equals(GLB), true)
  assert.equal(lastUploadWasBuffer, true, 'storage receives the bytes directly, not a File')
  assert.equal((await post(tokens.admin, [{ filename: 'pic.png', data: PNG }])).status, 200)
  for (const filename of ['a.html', 'a.svg', 'a.json', 'noext', 'js', 'a.', 'a.glb/../../x', 'a.js\\..\\x']) {
    const r = await post(tokens.builder, [{ filename, data: GLB }])
    assert.equal(r.status, 415, filename)
    assert.match(r.body.error, /not allowed/)
  }
  const bad = await post(tokens.builder, [{ filename: 'a.png', data: HTML }])
  assert.equal(bad.status, 415)
  assert.match(bad.body.error, /png/)
  assert.equal((await post(tokens.builder, [{ filename: 'a.glb', data: HTML }])).status, 415)
  assert.equal((await post(tokens.builder, [])).status, 400)
  assert.equal((await post(tokens.builder, [], { fields: [['note', 'hi']] })).status, 400)
  assert.equal(stored.size, 2)
  stored.clear()
})

test('upload: only one file per request; a second file rejects the whole request and stores nothing', async () => {
  const r = await post(tokens.builder, [
    { filename: 'one.glb', data: GLB },
    { filename: 'two.glb', data: GLB },
  ])
  assert.equal(r.status, 400)
  assert.equal(stored.size, 0)
  // a field before the file is fine
  assert.equal(
    (await post(tokens.builder, [{ filename: 'one.glb', data: GLB }], { fields: [['note', 'x']] })).status,
    200
  )
  stored.clear()
})

test('upload: a body stuffed with empty fields is refused as 400 and the loop is not held', async () => {
  // thousands of parts, but under the 1 MB test cap so the parts limit (not the body limit) answers
  const fields = Array.from({ length: 5000 }, (_, i) => [`f${i}`, ''])
  let maxGap = 0
  let last = performance.now()
  const timer = setInterval(() => {
    const now = performance.now()
    maxGap = Math.max(maxGap, now - last)
    last = now
  }, 1)
  try {
    const r = await post(tokens.builder, [{ filename: 'a.glb', data: GLB }], { fields })
    assert.equal(r.status, 400)
    assert.equal(r.body.error, 'too many parts')
  } finally {
    clearInterval(timer)
  }
  assert.equal(stored.size, 0)
  // shared CI runners pause the loop for GC and scheduling; a held parser shows up as seconds, not tens of ms
  const limit = process.env.CI ? 250 : 50
  assert.ok(maxGap < limit, `event loop held for ${maxGap.toFixed(1)}ms`)
  // a handful of fields next to the file is still fine
  assert.equal(
    (await post(tokens.builder, [{ filename: 'a.glb', data: GLB }], { fields: fields.slice(0, 3) })).status,
    200
  )
  stored.clear()
})

test('upload: the size cap truncates and rejects with 413; just under the cap is stored', async () => {
  const big = Buffer.alloc(MAX_MB * 1024 * 1024 + 1024)
  big.write('glTF', 0, 'latin1')
  const r = await post(tokens.builder, [{ filename: 'big.glb', data: big }])
  assert.equal(r.status, 413)
  assert.match(r.body.error, /1MB/)
  assert.equal(stored.size, 0)
  const under = Buffer.alloc(MAX_MB * 1024 * 1024 - 1024)
  under.write('glTF', 0, 'latin1')
  assert.equal((await post(tokens.builder, [{ filename: 'under.glb', data: under }])).status, 200)
  assert.equal(stored.get('under.glb').length, under.length)
  stored.clear()
})

test('upload: the session must still be live and allowed when the asset is committed', async () => {
  // disconnected after authentication, while the body was being read
  onCommitLookup('builder', s => {
    s.disconnected = true
  })
  let r = await post(tokens.builder, [{ filename: 'a.glb', data: GLB }])
  assert.equal(r.status, 401)
  assert.equal(r.body.error, 'session ended during upload')
  sockets.get('builder').disconnected = false
  // replaced by a newer socket for the same user
  onCommitLookup('builder', () => connect('builder', 1))
  r = await post(tokens.builder, [{ filename: 'a.glb', data: GLB }])
  assert.equal(r.status, 401)
  assert.equal(r.body.error, 'session ended during upload')
  // demoted
  onCommitLookup('builder', s => {
    s.player.data.rank = 0
  })
  assert.equal((await post(tokens.builder, [{ filename: 'a.glb', data: GLB }])).status, 403)
  sockets.get('builder').player.data.rank = 1
  // the avatar exception switched off while a visitor's vrm was in flight
  settings.customAvatars = true
  onCommitLookup('visitor', () => {
    settings.customAvatars = false
  })
  assert.equal((await post(tokens.visitor, [{ filename: 'a.vrm', data: GLB }])).status, 403)
  settings.customAvatars = false
  assert.equal(pending.size, 0, 'every hook fired at the commit-time lookup')
  assert.equal(stored.size, 0)
  // and the same request succeeds when nothing changes
  assert.equal((await post(tokens.builder, [{ filename: 'a.glb', data: GLB }])).status, 200)
  stored.clear()
})

test('upload: a body above the cap is refused by the body limit as 413; a storage failure is still a 500', async () => {
  const huge = Buffer.alloc(MAX_MB * 1024 * 1024 + 256 * 1024)
  huge.write('glTF', 0, 'latin1')
  const r = await post(tokens.builder, [{ filename: 'huge.glb', data: huge }])
  assert.equal(r.status, 413)
  assert.match(r.body.error, /exceeds 1MB/)
  assert.equal(stored.size, 0)
  const upload = assets.upload
  assets.upload = async () => {
    throw new Error('disk full')
  }
  try {
    assert.equal((await post(tokens.builder, [{ filename: 'a.glb', data: GLB }])).status, 500)
  } finally {
    assets.upload = upload
  }
  assert.equal(stored.size, 0)
})

test('upload: malformed multipart is 400, not 500', async () => {
  const headers = auth(tokens.builder)
  const noBoundary = await app.inject({
    method: 'POST',
    url: '/api/upload',
    payload: Buffer.from(
      '--x\r\nContent-Disposition: form-data; name="file"; filename="a.glb"\r\n\r\nglTF\r\n--x--\r\n'
    ),
    headers: { 'content-type': 'multipart/form-data', ...headers },
  })
  assert.equal(noBoundary.statusCode, 400)
  assert.equal(noBoundary.json().error, 'malformed multipart body')
  const { payload, contentType } = multipartBody([{ filename: 'a.glb', data: GLB }])
  const truncated = await app.inject({
    method: 'POST',
    url: '/api/upload',
    payload: payload.subarray(0, payload.length - 12), // cut inside the closing boundary
    headers: { 'content-type': contentType, ...headers },
  })
  assert.equal(truncated.statusCode, 400)
  const garbage = await app.inject({
    method: 'POST',
    url: '/api/upload',
    payload: Buffer.from('this is not a multipart body'),
    headers: { 'content-type': 'multipart/form-data; boundary=abc', ...headers },
  })
  assert.equal(garbage.statusCode, 400)
  assert.equal(stored.size, 0)
  // the route is still healthy afterwards
  assert.equal((await post(tokens.builder, [{ filename: 'a.glb', data: GLB }])).status, 200)
  stored.clear()
})

test('upload-check: connected users only, canonical filenames only', async () => {
  const name = `${'a'.repeat(64)}.glb`
  stored.set(name, GLB)
  assert.equal((await check(null, name)).status, 401)
  assert.equal((await check(tokens.offline, name)).status, 401)
  assert.deepEqual(await check(tokens.visitor, name), { status: 200, body: { exists: true } })
  assert.deepEqual(await check(tokens.builder, `${'b'.repeat(64)}.glb`), { status: 200, body: { exists: false } })
  for (const bad of ['crash-block.glb', `${'a'.repeat(64)}.html`, `../${name}`, `${name}/../x`, '..', '']) {
    assert.equal((await check(tokens.builder, bad)).status, 400, bad)
  }
  stored.clear()
})

test('assets: nosniff + explicit type on 200/206/304; sandbox + attachment off the media set', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'p0-assets-'))
  await fs.writeFile(path.join(dir, 'a.js'), 'app.on("update", () => {})')
  await fs.writeFile(path.join(dir, 'a.png'), PNG)
  await fs.writeFile(path.join(dir, 'a.glb'), GLB)
  await fs.writeFile(path.join(dir, 'legacy.html'), HTML)
  const server = Fastify()
  server.register(assetRoutes, { root: dir })
  await server.ready()
  try {
    const inert = h =>
      h['x-content-type-options'] === 'nosniff' &&
      h['content-security-policy'] === "sandbox; default-src 'none'" &&
      h['content-disposition'] === 'attachment'
    const media = h =>
      h['x-content-type-options'] === 'nosniff' && !h['content-security-policy'] && !h['content-disposition']
    const js = await server.inject({ method: 'GET', url: '/assets/a.js' })
    assert.equal(js.statusCode, 200)
    assert.equal(inert(js.headers), true, JSON.stringify(js.headers))
    assert.equal(js.headers['content-type'], 'text/javascript')
    assert.equal(js.body, 'app.on("update", () => {})')
    const png = await server.inject({ method: 'GET', url: '/assets/a.png' })
    assert.equal(png.statusCode, 200)
    assert.equal(media(png.headers), true, JSON.stringify(png.headers))
    assert.equal(png.headers['content-type'], 'image/png')
    const glb = await server.inject({ method: 'GET', url: '/assets/a.glb?v=1' })
    assert.equal(media(glb.headers), true)
    assert.equal(glb.headers['content-type'], 'model/gltf-binary')
    const legacy = await server.inject({ method: 'GET', url: '/assets/legacy.html' })
    assert.equal(legacy.statusCode, 200)
    assert.equal(inert(legacy.headers), true, JSON.stringify(legacy.headers))
    assert.equal(legacy.headers['content-type'], 'application/octet-stream')
    const partial = await server.inject({ method: 'GET', url: '/assets/a.js', headers: { range: 'bytes=0-3' } })
    assert.equal(partial.statusCode, 206)
    assert.equal(inert(partial.headers), true, JSON.stringify(partial.headers))
    assert.equal(partial.body, 'app.')
    const notModified = await server.inject({
      method: 'GET',
      url: '/assets/a.js',
      headers: { 'if-none-match': js.headers.etag },
    })
    assert.equal(notModified.statusCode, 304)
    assert.equal(inert(notModified.headers), true, JSON.stringify(notModified.headers))
    const head = await server.inject({ method: 'HEAD', url: '/assets/a.js' })
    assert.equal(head.statusCode, 200)
    assert.equal(inert(head.headers), true)
    const missing = await server.inject({ method: 'GET', url: `/assets/${'f'.repeat(64)}.glb` })
    assert.equal(missing.statusCode, 404)
  } finally {
    await server.close()
    await fs.rm(dir, { recursive: true, force: true })
  }
})
