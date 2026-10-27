import 'ses'
import '../core/lockdown'
import './fetchGuardInstall'
import './bootstrap'

import fs from 'fs-extra'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import Fastify from 'fastify'
import ws from '@fastify/websocket'
import cors from '@fastify/cors'
import compress from '@fastify/compress'
import statics from '@fastify/static'
import multipart from '@fastify/multipart'

import { createServerWorld } from '../core/createServerWorld'
import { getDB } from './db'
import { Storage } from './Storage'
import { assets } from './assets'
import { agentAPI } from './agent-api'
import { collections } from './collections'
import { cleaner } from './cleaner'
import { assetRoutes, uploadRoutes } from './uploadRoutes'
import { createUploadLimits, readUploadLimitsEnv, clientIpKeys } from './uploadLimits'
import { createConnectionLimits, readConnectionLimitsEnv } from './connectionLimits'
import { renderShell } from './escapeHtml'
import { compressOptions } from './compressOptions'
import { errorHandler } from './errorHandler'
import { checkJwtSecret } from './jwtSecret'
import { readJWT } from '../core/utils-server'
import { PROTOCOL_VERSION, writePacket } from '../core/packets'
import { BrowserCapture } from './BrowserCapture'
import { proxyWebViewRequest } from './WebViewProxy'
import { getPortalStatus, getPortalLoadingImage } from './portalStatus'
import { PortalPreviews, PORTAL_PREVIEW_VERSION } from './PortalPreviews'
import { VanillaPortalSnapshots } from './VanillaPortalSnapshots'
import { appHasBrowserSource } from '../core/utils/browser'

const execAsync = promisify(exec)

const rootDir = path.join(__dirname, '../')
const worldDir = path.join(rootDir, process.env.WORLD)
const port = process.env.PORT
const browserCapture = new BrowserCapture()
const vanillaPortalSnapshots = new VanillaPortalSnapshots(path.join(worldDir, 'portal-snapshots'))

// check envs
if (!process.env.WORLD) {
  throw new Error('[envs] WORLD not set')
}
if (!process.env.PORT) {
  throw new Error('[envs] PORT not set')
}
try {
  checkJwtSecret(process.env.JWT_SECRET)
} catch (err) {
  // SES reports uncaught errors without setting the process status; startup rejection must still fail the launcher.
  process.exitCode = 1
  throw err
}
if (!process.env.ADMIN_CODE) {
  console.warn('[envs] ADMIN_CODE not set - all users will have admin permissions!')
}
if (!process.env.SAVE_INTERVAL) {
  throw new Error('[envs] SAVE_INTERVAL not set')
}
if (!process.env.PUBLIC_MAX_UPLOAD_SIZE) {
  throw new Error('[envs] PUBLIC_MAX_UPLOAD_SIZE not set')
}
const maxUploadSize = Number(process.env.PUBLIC_MAX_UPLOAD_SIZE)
if (!Number.isFinite(maxUploadSize) || maxUploadSize < 0) {
  throw new Error('[envs] PUBLIC_MAX_UPLOAD_SIZE must be a non-negative number (0 for unlimited)')
}
if (!process.env.PUBLIC_WS_URL) {
  throw new Error('[envs] PUBLIC_WS_URL not set')
}
if (!process.env.PUBLIC_WS_URL.startsWith('ws')) {
  throw new Error('[envs] PUBLIC_WS_URL must start with ws:// or wss://')
}
if (!process.env.PUBLIC_API_URL) {
  throw new Error('[envs] PUBLIC_API_URL must be set')
}
if (!process.env.ASSETS) {
  throw new Error(`[envs] ASSETS must be set to 'local' or 's3'`)
}
if (!process.env.ASSETS_BASE_URL) {
  throw new Error(`[envs] ASSETS_BASE_URL must be set`)
}
if (process.env.ASSETS_BASE_URL.endsWith('/')) {
  throw new Error('[envs] ASSETS_BASE_URL must not end with /')
}
if (process.env.ASSETS === 's3' && !process.env.ASSETS_S3_URI) {
  throw new Error(`[envs] ASSETS_S3_URI must be set when using ASSETS=s3`)
}

const tlsKeyFile = process.env.TLS_KEY_FILE
const tlsCertFile = process.env.TLS_CERT_FILE
if ((tlsKeyFile && !tlsCertFile) || (!tlsKeyFile && tlsCertFile)) {
  throw new Error('[envs] TLS_KEY_FILE and TLS_CERT_FILE must be set together')
}

const fastify = Fastify({
  logger: { level: 'error' },
  ...(tlsKeyFile && tlsCertFile
    ? {
        https: {
          key: fs.readFileSync(tlsKeyFile),
          cert: fs.readFileSync(tlsCertFile),
        },
      }
    : {}),
})

// create world folder if needed
await fs.ensureDir(worldDir)

// init assets
await assets.init({ rootDir, worldDir })

// init collections
await collections.init({ rootDir, worldDir })

// init db
const db = await getDB({ worldDir })

// init cleaner
await cleaner.init({ db, worldDir })

// init storage
const storage = new Storage(path.join(worldDir, '/storage.json'))

// create world
const world = createServerWorld()
await world.init({
  assetsDir: assets.dir,
  assetsUrl: assets.url,
  db,
  assets,
  storage,
  collections: collections.list,
})
world.network.browserCapture = browserCapture
const portalPreviews = new PortalPreviews(world)
world.network.portalPreviews = portalPreviews
world.entities.on('removed', entity => {
  if (entity.isApp) {
    browserCapture.close(entity.data.id).catch(error => {
      console.error('[browser] failed to close app session:', error.message)
    })
  }
})

fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || true,
})
fastify.register(compress, {
  // Only compress text-based files, exclude binary and already compressed formats
  customTypes: /text\/|application\/json|application\/javascript|text\/css/,
  encodings: ['gzip', 'deflate'],
  ...compressOptions(),
  inflateIfDeflated: false,
  // Skip compression based on file extension or request path
  skipOnPath(req) {
    const path = req.url || req.raw.url || ''
    // Skip compression for splat files that are already compressed
    return path.endsWith('.spz') || path.endsWith('.sogs') || path.endsWith('.ksplat') || path.endsWith('.zip')
  },
})
fastify.get('/', async (req, reply) => {
  const title = world.settings.title || 'World'
  const desc = world.settings.desc || ''
  const image = world.resolveURL(world.settings.image?.url) || ''
  const arrivalImage = getPortalLoadingImage(world, req.query?.portalId)
  const loadingImage = world.resolveURL(arrivalImage?.url) || image
  const url = process.env.ASSETS_BASE_URL
  const filePath = path.join(__dirname, 'public', 'index.html')
  let html = fs.readFileSync(filePath, 'utf-8')
  html = renderShell(html, { url, title, desc, image, loadingImage, arrivalImage: !!arrivalImage })
  reply.type('text/html').send(html)
})
fastify.register(statics, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
  decorateReply: false,
  setHeaders: reply => {
    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    reply.header('Pragma', 'no-cache')
    reply.header('Expires', '0')
  },
})
if (world.assetsDir) {
  fastify.register(assetRoutes, {
    root: world.assetsDir,
  })
}
fastify.register(multipart, {
  limits: {
    fileSize: maxUploadSize > 0 ? maxUploadSize * 1024 * 1024 : Infinity,
  },
  // Ensure binary files are handled correctly
  attachFieldsToBody: false,
  // Don't parse SPZ files as text
  onFile: async part => {
    const filename = part.filename
    const ext = filename.split('.').pop()?.toLowerCase()

    // For binary files like SPZ, ensure proper handling
    if (['spz', 'ply', 'splat', 'ksplat'].includes(ext)) {
      part.file.readable = true
    }
  },
})
fastify.register(ws, { options: { maxPayload: 65536, maxFragments: 8, perMessageDeflate: false, closeTimeout: 2000 } })
const connectionLimits = createConnectionLimits(readConnectionLimitsEnv(process.env))
const uploadConfig = readUploadLimitsEnv(process.env)
const socketLease = Symbol('wsLease')
fastify.register(worldNetwork)
fastify.register(agentAPI, {
  prefix: '/api/agent',
  world,
  assets,
  readToken: process.env.AGENT_API_READ_TOKEN,
  writeToken: process.env.AGENT_API_WRITE_TOKEN,
})
fastify.addHook('onClose', async () => browserCapture.closeAll())

const publicEnvs = {}
for (const key in process.env) {
  if (key.startsWith('PUBLIC_')) {
    const value = process.env[key]
    publicEnvs[key] = value
  }
}
const envsCode = `
  if (!globalThis.env) globalThis.env = {}
  globalThis.env = ${JSON.stringify(publicEnvs)}
`
fastify.get('/env.js', async (req, reply) => {
  reply.type('application/javascript').send(envsCode)
})

fastify.register(uploadRoutes, {
  readJWT,
  getSocket: id => world.network.sockets.get(id),
  assets,
  getSettings: () => world.settings,
  maxUploadSize: maxUploadSize || 256,
  limits: createUploadLimits(uploadConfig),
  clientIpHeader: uploadConfig.clientIpHeader,
  slotTimeoutMs: uploadConfig.slotTimeoutMs,
  minFreeBytes: uploadConfig.minFreeBytes,
})

fastify.get('/api/avatars', async () => {
  const users = await db('users').select('name', 'avatar')
  const assetFiles = await assets.list()
  const avatars = new Map()
  const addAvatar = (url, name) => {
    if (typeof url !== 'string' || !url.startsWith('asset://')) return
    const filename = url.slice('asset://'.length)
    if (filename !== 'avatar.vrm' && !/^[a-f0-9]{64}\.vrm$/i.test(filename)) return
    if (filename !== 'avatar.vrm' && !assetFiles.has(filename)) return
    if (!avatars.has(url)) avatars.set(url, { url, name })
  }

  addAvatar('asset://avatar.vrm', 'World default')
  addAvatar(world.settings.avatar?.url, 'World default')
  for (const user of users) {
    addAvatar(user.avatar, user.name ? `${user.name}'s avatar` : 'Server avatar')
  }

  return [...avatars.values()]
})

fastify.get('/api/browser/screenshot', async (request, reply) => {
  const { entityId, url } = request.query
  const entity = world.entities.get(entityId)
  if (!entity?.isApp || !appHasBrowserSource(entity, url)) {
    return reply.code(404).send({ error: 'Browser app instance not found' })
  }
  try {
    const screenshot = await browserCapture.capture(entityId, url)
    reply.header('Cache-Control', 'no-store')
    return reply.type('image/jpeg').send(screenshot)
  } catch (error) {
    console.error('[browser] screenshot failed:', error.message)
    return reply.code(502).send({ error: 'Browser screenshot unavailable' })
  }
})

fastify.get('/api/webview/proxy', async (request, reply) => {
  try {
    const result = await proxyWebViewRequest(request.query?.url)
    reply.header('Cache-Control', 'no-store')
    return reply.code(result.status).type(result.contentType).send(result.body)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const invalidURL = message.startsWith('WebView URL')
    console.error('[webview] proxy failed:', message)
    return reply.code(invalidURL ? 400 : 502).send({
      error: invalidURL ? message : 'WebView proxy unavailable',
    })
  }
})

fastify.get('/api/backup', async (req, reply) => {
  if (!process.env.ADMIN_CODE || req.query.adminCode !== process.env.ADMIN_CODE) {
    return reply.code(401).send({ error: 'Invalid admin code' })
  }
  const zipPath = path.join(rootDir, 'world-backup.zip')
  // remove old zip if exists
  await fs.remove(zipPath)
  // create zip from world directory and wait for it to finish
  await execAsync(`zip -r "${zipPath}" .`, { cwd: worldDir })
  // read the completed file
  const buffer = await fs.readFile(zipPath)
  // clean up
  await fs.remove(zipPath)
  // send it
  reply.type('application/zip')
  reply.header('Content-Disposition', 'attachment; filename="world-backup.zip"')
  return reply.send(buffer)
})

fastify.post('/api/restore', async (req, reply) => {
  if (!process.env.ADMIN_CODE || req.query.adminCode !== process.env.ADMIN_CODE) {
    return reply.code(401).send({ error: 'Invalid admin code' })
  }
  const mp = await req.file()
  const zipPath = path.join(rootDir, 'restore-upload.zip')
  // save uploaded file
  const chunks = []
  for await (const chunk of mp.file) {
    chunks.push(chunk)
  }
  await fs.writeFile(zipPath, Buffer.concat(chunks))
  // clear and restore
  await fs.emptyDir(worldDir)
  await execAsync(`unzip -o "${zipPath}" -d "${worldDir}"`)
  await fs.remove(zipPath)
  return { success: true, message: 'World restored. Restart server to apply changes.' }
})

fastify.get('/api/portal-status', async request => ({
  ...getPortalStatus(world, request.query?.portalId),
  preview: {
    version: PORTAL_PREVIEW_VERSION,
    wsUrl: new URL('./portal-preview', process.env.PUBLIC_WS_URL).href,
    apiUrl: process.env.PUBLIC_API_URL,
  },
}))

fastify.get('/api/portal-snapshot', async (request, reply) => {
  // Only destinations actually placed in this world may initiate anonymous joins.
  const normalize = value => {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
      throw new Error('Invalid destination')
    url.search = ''
    url.hash = ''
    url.pathname = url.pathname.replace(/\/$/, '')
    return url.href
  }
  let destination
  try {
    destination = normalize(request.query?.url)
  } catch {
    return reply.code(400).send({ error: 'Invalid destination' })
  }
  const allowed = [...world.entities.items.values()].some(entity => {
    if (!entity.isApp) return false
    let found = false
    const inspect = node => {
      if (node.name !== 'portal' || !node.url) return
      try {
        if (normalize(node.url) === destination) found = true
      } catch {
        // Ignore invalid portal URLs when checking the requested destination.
      }
    }
    entity.root?.traverse(inspect)
    for (const node of entity.worldNodes || []) node.traverse(inspect)
    return found
  })
  if (!allowed) return reply.code(403).send({ error: 'Destination has no portal in this world' })
  try {
    return await vanillaPortalSnapshots.get(destination)
  } catch (error) {
    return reply.code(502).send({ error: error.message })
  }
})

fastify.get('/health', async (request, reply) => {
  try {
    // Basic health check
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }

    return reply.code(200).send(health)
  } catch (error) {
    console.error('Health check failed:', error)
    return reply.code(503).send({
      status: 'error',
      timestamp: new Date().toISOString(),
    })
  }
})

fastify.get('/status', async (request, reply) => {
  try {
    const status = {
      uptime: Math.round(world.time),
      protected: process.env.ADMIN_CODE !== undefined ? true : false,
      connectedUsers: [],
      commitHash: process.env.COMMIT_HASH,
    }
    for (const socket of world.network.sockets.values()) {
      status.connectedUsers.push({
        id: socket.player.data.userId,
        position: socket.player.position.value.toArray(),
        name: socket.player.data.name,
      })
    }

    return reply.code(200).send(status)
  } catch (error) {
    console.error('Status failed:', error)
    return reply.code(503).send({
      status: 'error',
      timestamp: new Date().toISOString(),
    })
  }
})

fastify.setErrorHandler(errorHandler)

try {
  await fastify.listen({ port, host: '0.0.0.0' })
} catch (err) {
  console.error(err)
  console.error(`failed to launch on port ${port}`)
  process.exit(1)
}

function admitConnection(request, reply, done) {
  if (request.ws !== true) return done()
  const transport = request.raw.socket
  if (transport[socketLease]) return reply.code(503).header('Retry-After', '10').send()
  const header = uploadConfig.clientIpHeader
  const lease = connectionLimits.admit(clientIpKeys(header ? request.headers[header] : undefined, request.ip))
  if (!lease.ok) return reply.code(503).header('Retry-After', '10').send()
  transport[socketLease] = lease
  transport.once('close', lease.release)
  transport.once('error', () => transport.destroy())
  if (transport.destroyed) lease.release()
  done()
}

async function worldNetwork(fastify) {
  fastify.get('/portal-preview', { websocket: true }, ws => portalPreviews.connect(ws))
  fastify.get('/ws', { websocket: true, preValidation: admitConnection }, (ws, req) => {
    if (req.query.v !== String(PROTOCOL_VERSION)) {
      ws.send(writePacket('kick', 'outdated'))
      ws.close(1008, 'outdated')
      return
    }
    world.network.onConnection(ws, req.query)
  })
}

console.log(`server listening on port ${port}`)

// Graceful shutdown
process.on('SIGINT', async () => {
  await fastify.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await fastify.close()
  process.exit(0)
})
