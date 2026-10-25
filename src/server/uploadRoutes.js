// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/server/uploadRoutes.js
import Busboy from '@fastify/busboy'
import statics from '@fastify/static'
import { PhotoUploadLimits, isJPEGUpload, validatePhoto, MAX_PHOTO_BYTES } from './photoUploads.js'

const photoLimits = new PhotoUploadLimits()

import { Ranks } from '../core/extras/ranks.js'
import { clientIpKey } from './uploadLimits.js'
import {
  assetHeaders,
  authorizeUpload,
  extensionOf,
  isAllowedExtension,
  isUploadCheckFilename,
  matchesSignature,
  parseBearer,
} from './uploadPolicy.js'

// explicit `.js` imports only: this module is exercised directly by node:test

const MULTIPART = /^multipart\/form-data(;|$)/i
const FRAMING_BYTES = 64 * 1024 // multipart headers and boundaries around the single file
// the least wrapping a single file part can arrive in; Content-Length minus this bounds the file size from above
const MIN_FRAMING_BYTES = 64
const SLICE_BYTES = 64 * 1024 // how much of the body busboy sees per turn of the event loop
// the client sends exactly one `file` part; a few fields are tolerated, anything beyond is refused
const PART_LIMITS = { files: 1, parts: 8, fields: 4, fieldSize: 1024, headerPairs: 64 }

// parses a buffered multipart body with busboy. every listener is attached before the first byte is
// parsed, so a malformed or early-ended body is an ordinary rejection and never an unhandled stream error.
// the body is fed in slices with a turn of the event loop between them, and never past a rejection, so a
// hostile body cannot hold the loop. `accept(ext)` returns null to proceed or `{ status, error }` to refuse.
function parseUpload({ headers, body, maxUploadSize, accept }) {
  return new Promise(resolve => {
    const result = { upload: null, rejection: null }
    const reject = (status, error) => {
      if (!result.rejection) result.rejection = { status, error }
    }
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve(result)
    }
    let bb
    try {
      bb = Busboy({ headers, limits: { fileSize: maxUploadSize * 1024 * 1024, ...PART_LIMITS } })
    } catch (_err) {
      // no boundary, or a content type busboy cannot handle
      reject(400, 'malformed multipart body')
      return finish()
    }
    let files = 0
    bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
      file.on('error', () => {})
      files++
      if (files > 1) {
        reject(400, 'one file per upload')
        return file.resume()
      }
      const ext = extensionOf(filename)
      const verdict = accept(ext)
      if (verdict) {
        reject(verdict.status, verdict.error)
        return file.resume()
      }
      const chunks = []
      let size = 0
      file.on('data', chunk => {
        size += chunk.length
        if (isJPEGUpload({ filename, mimetype }) && size > MAX_PHOTO_BYTES) {
          reject(413, 'JPEG upload exceeds 1 MB')
          return
        }
        if (!result.rejection) chunks.push(chunk)
      })
      file.on('limit', () => reject(413, `file exceeds ${maxUploadSize}MB`))
      file.on('end', () => {
        if (!file.truncated) result.upload = { filename, ext, mimetype, buffer: Buffer.concat(chunks) }
      })
    })
    bb.on('filesLimit', () => reject(400, 'one file per upload'))
    bb.on('partsLimit', () => reject(400, 'too many parts'))
    bb.on('fieldsLimit', () => reject(400, 'too many parts'))
    bb.on('error', () => {
      reject(400, 'malformed multipart body')
      finish()
    })
    bb.on('finish', finish)
    let offset = 0
    const feed = () => {
      if (settled) return
      if (result.rejection) return finish()
      if (offset >= body.length) return bb.end()
      const slice = body.subarray(offset, offset + SLICE_BYTES)
      offset += slice.length
      bb.write(slice, () => setImmediate(feed))
    }
    feed()
  })
}

// operator log for server-wide refusals, at most once a minute per reason
const warned = new Map()
function warnThrottled(key, message) {
  const now = Date.now()
  if (now - (warned.get(key) || 0) < 60_000) return
  warned.set(key, now)
  console.warn(message)
}

/**
 * Upload Routes
 *
 * - readJWT(token) resolves to the token payload or null
 * - getSocket(userId) returns the live socket of a connected user, if any
 * - getWallet(userId) returns the verified wallet behind a session-only builder grant, or null
 * - assets.upload(file) resolves true when stored, false when the content already existed;
 *   assets.exists(filename); assets.freeSpace() is optional and local-only
 * - getSettings() returns the live world settings (customAvatars)
 * - maxUploadSize is in MB, the same limit the client applies
 * - limits is an uploadLimits instance (required: no deployment runs unlimited by accident)
 * - clientIpHeader names the proxy header carrying the client address, or '' for the socket address
 * - slotTimeoutMs bounds the body transfer once admitted; minFreeBytes is the storage floor (0 disables either)
 *
 */
export async function uploadRoutes(
  fastify,
  {
    readJWT,
    getSocket,
    getWallet = () => null,
    assets,
    getSettings,
    maxUploadSize,
    limits,
    clientIpHeader = '',
    slotTimeoutMs = 0,
    minFreeBytes = 0,
    logClientIp = false,
  }
) {
  if (!limits) throw new Error('uploadRoutes: limits is required')
  const maxBytes = maxUploadSize * 1024 * 1024

  // the body is buffered up to the cap (plus framing) and parsed by the route itself
  // Replace the inherited streaming parser in this plugin's scope only. The
  // separately authenticated agent API keeps its multipart parser.
  fastify.removeContentTypeParser('multipart/form-data')
  fastify.addContentTypeParser(
    'multipart/form-data',
    { parseAs: 'buffer', bodyLimit: maxBytes + FRAMING_BYTES },
    (req, body, done) => done(null, body)
  )
  // keep the body-limit answer in the same shape as the other rejections; anything else goes to the parent handler
  fastify.setErrorHandler((err, req, reply) => {
    if (err.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
      return reply.code(413).send({ error: `upload exceeds ${maxUploadSize}MB` })
    }
    throw err
  })
  fastify.decorateRequest('uploadSocket', null)
  fastify.decorateRequest('uploadLease', null)

  const clientIp = req => {
    const key = clientIpKey(clientIpHeader ? req.headers[clientIpHeader] : undefined, req.ip)
    if (logClientIp) console.warn(`[upload] client ip key ${key}`)
    return key
  }
  // the effective rank picks the per-user limits. a rank stored on the user is trusted, and so is a session
  // rank backed by a verified wallet, which then keys the limits instead of the user id: identities minted
  // under one wallet share one bucket. a session grant whose wallet is unknown, or a rank that comes only
  // from the world setting, stays in the shared controls
  const identity = socket => {
    const { player } = socket
    const wallet = player.data.tokenGrantedRank ? getWallet(socket.id) : null
    return {
      userId: socket.id,
      wallet,
      tier: player.isBuilder() ? 'builder' : 'visitor',
      trusted: player.data.rank >= Ranks.BUILDER && (!player.data.tokenGrantedRank || !!wallet),
    }
  }
  // the client is told when to come back. a refusal that leaves a body unread also ends the connection
  const refuse = (reply, verdict, { close = true } = {}) => {
    reply.code(verdict.status).header('Retry-After', String(verdict.retryAfter ?? 1))
    if (close) reply.header('Connection', 'close')
    return reply.send({ error: verdict.error, retryAfter: verdict.retryAfter ?? 1 })
  }

  const resolveSocket = async req => {
    const token = parseBearer(req.headers.authorization)
    if (!token) return null
    const data = await readJWT(token)
    if (!data?.userId) return null
    const socket = getSocket(data.userId)
    return socket && !socket.disconnected ? socket : null
  }

  // runs before any body parsing: the bearer token names the user, the live socket carries the rank
  const authenticate = async (req, reply) => {
    const socket = await resolveSocket(req)
    if (!socket) return reply.code(401).send({ error: 'upload requires a connected session' })
    req.uploadSocket = socket
  }

  // the part of the rank rule that needs no extension, and the body shape, still before parsing
  const authorizeRequest = async (req, reply) => {
    const { player } = req.uploadSocket
    if (!player.isBuilder() && !getSettings().customAvatars) {
      return reply.code(403).send({ error: 'builder rank required' })
    }
    if (!MULTIPART.test(req.headers['content-type'] || '')) {
      return reply.code(415).send({ error: 'expected multipart/form-data' })
    }
    // the declared length must be the file's length: a body that inflates after admission would dodge the
    // quota reservation. browsers and the node client never compress request bodies
    const encoding = (req.headers['content-encoding'] || 'identity').trim().toLowerCase()
    if (encoding !== 'identity') {
      return reply.code(415).header('Connection', 'close').send({ error: 'compressed uploads are not accepted' })
    }
  }

  // still before the body: the declared size is checked against the cap and the quota, then a slot is taken.
  // nothing is counted for a request refused here.
  const admitUpload = async (req, reply) => {
    const len = Number(req.headers['content-length'])
    if (Number.isFinite(len) && len > maxBytes + FRAMING_BYTES) {
      return reply
        .code(413)
        .header('Connection', 'close')
        .send({ error: `upload exceeds ${maxUploadSize}MB` })
    }
    const estimatedBytes = Number.isFinite(len) ? Math.max(0, len - MIN_FRAMING_BYTES) : NaN
    const verdict = limits.beginUpload({ ...identity(req.uploadSocket), ip: clientIp(req), estimatedBytes })
    if (!verdict.ok) {
      if (verdict.status === 503) warnThrottled('503', `[upload] refusing uploads server-wide: ${verdict.error}`)
      return refuse(reply, verdict)
    }
    const { lease } = verdict
    req.uploadLease = lease
    // while the body is in transit a stalled transfer is cut and a closed connection frees the slot.
    // once the handler runs it owns the slot, so an abort after the body cannot free memory early
    if (slotTimeoutMs > 0) {
      lease.timer = setTimeout(() => req.raw.destroy(), slotTimeoutMs)
      lease.timer.unref()
    }
    const onClose = () => {
      if (!lease.started) lease.release()
    }
    reply.raw.once('close', onClose)
    req.raw.once('aborted', onClose)
  }
  const releaseUpload = (req, reply, done) => {
    req.uploadLease?.release()
    done()
  }

  // the floor keeps the volume writable for the database that shares it. it never rises above a fifth of the
  // volume, so a host that grows volumes at 75% full still gets to do so. an unreadable statfs fails open
  let freeSpaceWarned = false
  const outOfSpace = async bytes => {
    if (!(minFreeBytes > 0) || typeof assets.freeSpace !== 'function') return false
    let space
    try {
      space = await assets.freeSpace()
    } catch (err) {
      if (!freeSpaceWarned) console.warn('[upload] free space check unavailable:', err?.message || err)
      freeSpaceWarned = true
      return false
    }
    const floor = Math.min(minFreeBytes, Math.floor(space.total * 0.2))
    return space.free - bytes < floor
  }

  fastify.post(
    '/api/upload',
    {
      onRequest: [authenticate, authorizeRequest, admitUpload],
      onResponse: releaseUpload,
      // the body is taken as sent: a compressed request is refused above, and the compression plugin
      // registered on the server must not inflate one here either
      config: { decompress: false },
    },
    async (req, reply) => {
      const socket = req.uploadSocket
      const lease = req.uploadLease
      lease.start()
      try {
        if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
          return reply.code(400).send({ error: 'expected a multipart file' })
        }
        const { upload, rejection } = await parseUpload({
          headers: req.headers,
          body: req.body,
          maxUploadSize,
          accept: ext => {
            if (!isAllowedExtension(ext))
              return { status: 415, error: `file type "${ext.slice(0, 16)}" is not allowed` }
            const auth = authorizeUpload({ player: socket.player, settings: getSettings(), ext })
            return auth.ok ? null : { status: 403, error: auth.reason }
          },
        })
        // the file bytes have been copied out; let the raw body go before the asset is written
        req.body = null
        if (rejection) return reply.code(rejection.status).send({ error: rejection.error })
        if (!upload) return reply.code(400).send({ error: 'expected a multipart file' })
        if (isJPEGUpload(upload)) {
          photoLimits.take(clientIp(req))
          validatePhoto(upload.buffer)
        }
        // the body took time to arrive: the session and the rank rule must still hold when the asset is committed
        if (getSocket(socket.id) !== socket || socket.disconnected) {
          return reply.code(401).send({ error: 'session ended during upload' })
        }
        const auth = authorizeUpload({ player: socket.player, settings: getSettings(), ext: upload.ext })
        if (!auth.ok) return reply.code(403).send({ error: auth.reason })
        const signature = matchesSignature(upload.ext, upload.buffer)
        if (!signature.ok) return reply.code(415).send({ error: signature.reason })
        // the real size replaces the declared one; if it no longer fits the quota nothing is written
        const fit = lease.confirm(upload.buffer.length)
        if (!fit.ok) {
          return reply
            .code(fit.status)
            .header('Retry-After', String(fit.retryAfter))
            .send({ error: fit.error, retryAfter: fit.retryAfter })
        }
        if (await outOfSpace(upload.buffer.length)) {
          warnThrottled('507', '[upload] refusing uploads: the assets volume is at the free-space floor')
          return reply.code(507).send({ error: 'the server is out of storage' })
        }
        // upload: the bytes go to storage as they are, without a File copy in between.
        // only new content counts against the quota; a store that does not say is charged
        const created = await assets.upload({ name: upload.filename, buffer: upload.buffer })
        if (created !== false) lease.commit(upload.buffer.length)
      } finally {
        lease.release()
      }
    }
  )

  const admitCheck = async (req, reply) => {
    const verdict = limits.checkRate({ ...identity(req.uploadSocket), ip: clientIp(req) })
    if (!verdict.ok) return refuse(reply, verdict)
  }

  fastify.get('/api/upload-check', { onRequest: [authenticate, admitCheck] }, async (req, reply) => {
    const filename = req.query.filename
    if (!isUploadCheckFilename(filename)) return reply.code(400).send({ error: 'invalid asset filename' })
    const exists = await assets.exists(filename)
    if (exists) return { exists }
    // the upload that follows would be refused: say so here, on a request whose answer always gets through.
    // nothing is counted or held; the upload decides for itself when it arrives
    const size = Number(req.query.size)
    const bytes = Number.isFinite(size) && size >= 0 ? size : 0
    if (bytes > maxBytes) return reply.code(413).send({ error: `upload exceeds ${maxUploadSize}MB` })
    const verdict = limits.previewUpload({ ...identity(req.uploadSocket), ip: clientIp(req), estimatedBytes: bytes })
    if (!verdict.ok) return refuse(reply, verdict, { close: false })
    return { exists }
  })
}

/**
 * Asset Routes
 *
 * serves the local assets dir. uploaded files never run as same-origin documents here: explicit type,
 * no sniffing, and anything that is not plain media is delivered as a sandboxed download.
 *
 */
export async function assetRoutes(fastify, { root }) {
  fastify.addHook('onSend', async (req, reply) => {
    reply.headers(assetHeaders(extensionOf(req.url.split('?')[0])))
  })
  fastify.register(statics, {
    root,
    prefix: '/assets/',
    decorateReply: false,
    setHeaders: res => {
      // all assets are hashed & immutable so we can use aggressive caching
      res.header('Cache-Control', 'public, max-age=31536000, immutable') // 1 year
      res.header('Expires', new Date(Date.now() + 31536000000).toUTCString()) // older browsers
    },
  })
}
