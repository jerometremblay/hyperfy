import { createHash } from 'node:crypto'
import { Ranks } from '../core/extras/ranks.js'
import { clientIpKey } from './uploadLimits.js'
import { parseBearer } from './uploadPolicy.js'
import { compilePolyspoonRecipe } from './compilePolyspoonRecipe.js'
import { compilePolyforkRecipe } from './compilePolyforkRecipe.js'
import { compileNativePolyfork } from './compileNativePolyfork.js'
import { resolveNativePolyfork } from './resolveNativePolyfork.js'
import { resolvePolyspoonAsset, applyPolyspoonCatalogPreset } from './polyspoonCatalog.js'

export async function polyspoonRoutes(fastify, {
  polyspoonRegistry, assets, world, readJWT, getSocket, limits,
  clientIpHeader = '', slotTimeoutMs = 0, minFreeBytes = 0,
  compileRecipe = compilePolyspoonRecipe, resolveAsset = resolvePolyspoonAsset,
  resolveNative = resolveNativePolyfork, compileNative = compileNativePolyfork,
}) {
  fastify.get('/api/polyspoon/sandboxed-recipes/:hash', async (request, reply) => {
    const { hash } = request.params
    if (!/^[a-f0-9]{64}$/.test(hash) || !(await polyspoonRegistry.has(hash))) {
      return reply.code(404).send()
    }
    const bytes = await assets.read(`${hash}.js`)
    if (!bytes || createHash('sha256').update(bytes).digest('hex') !== hash) return reply.code(404).send()
    return reply
      .header('Cache-Control', 'no-store')
      .header('X-Content-Type-Options', 'nosniff')
      .type('text/plain; charset=utf-8')
      .send(bytes)
  })

  fastify.get('/api/polyspoon/native-recipes/:hash', async (request, reply) => {
    const { hash } = request.params
    if (!/^[a-f0-9]{64}$/.test(hash) || !(await polyspoonRegistry.hasNative(hash))) return reply.code(404).send()
    const bytes = await assets.read(`${hash}.js`)
    if (!bytes || createHash('sha256').update(bytes).digest('hex') !== hash) return reply.code(404).send()
    return reply.header('Cache-Control', 'no-store').header('X-Content-Type-Options', 'nosniff').type('text/plain; charset=utf-8').send(bytes)
  })

  // The public download endpoint is also used in deployments without registration.
  if (!world || !readJWT || !getSocket || !limits) return

  fastify.decorateRequest('recipeSocket', null)
  fastify.decorateRequest('recipeLease', null)
  const status = socket => {
    if (!socket || socket.disconnected || getSocket(socket.id) !== socket) return 401
    if (!socket.player.isAdmin()) return 403
    return 0
  }
  fastify.get('/api/polyspoon/cdn', async (req, reply) => {
    const token = parseBearer(req.headers.authorization)
    const data = token && await readJWT(token)
    const socket = data?.userId && getSocket(data.userId)
    const code = status(socket)
    if (code) return reply.code(code).send({ error: code === 401 ? 'A connected session is required' : 'Admin rank required' })
    const url = process.env.POLYFORK_CDN_URL || ''
    return reply.header('Cache-Control', 'no-store').send({ url: /^https:\/\/polyfork\.dev\/c\/[a-f0-9]+\/$/.test(url) ? url : '' })
  })
  const authenticate = async (req, reply) => {
    const token = parseBearer(req.headers.authorization)
    const data = token && await readJWT(token)
    const socket = data?.userId && getSocket(data.userId)
    const code = status(socket)
    if (code) return reply.code(code).send({ error: code === 401 ? 'A connected session is required' : 'Admin rank required' })
    req.recipeSocket = socket
    if ((req.headers['content-encoding'] || 'identity').trim().toLowerCase() !== 'identity') {
      return reply.code(415).header('Connection', 'close').send({ error: 'Compressed requests are not accepted' })
    }
    const len = Number(req.headers['content-length'])
    const verdict = limits.beginUpload({
      userId: socket.id,
      wallet: null,
      tier: 'builder',
      trusted: socket.player.data.rank >= Ranks.ADMIN && !socket.player.data.tokenGrantedRank,
      ip: clientIpKey(clientIpHeader ? req.headers[clientIpHeader] : undefined, req.ip),
      estimatedBytes: Number.isFinite(len) ? Math.min(len, 512000) : NaN,
    })
    if (!verdict.ok) {
      return reply.code(verdict.status).header('Retry-After', String(verdict.retryAfter ?? 1))
        .header('Connection', 'close').send({ error: verdict.error })
    }
    req.recipeLease = verdict.lease
    if (slotTimeoutMs > 0) {
      verdict.lease.timer = setTimeout(() => req.raw.destroy(), slotTimeoutMs)
      verdict.lease.timer.unref()
    }
    const onClose = () => { if (!verdict.lease.started) verdict.lease.release() }
    reply.raw.once('close', onClose)
    req.raw.once('aborted', onClose)
  }
  fastify.get('/api/polyspoon/native-source/:hash', async (req, reply) => {
    const token = parseBearer(req.headers.authorization)
    const data = token && await readJWT(token)
    const socket = data?.userId && getSocket(data.userId)
    const code = status(socket)
    if (code) return reply.code(code).send()
    const source = await polyspoonRegistry.readNativeSource(req.params.hash)
    if (source === null) return reply.code(404).send()
    return reply.header('Cache-Control', 'no-store').type('text/plain; charset=utf-8').send(source)
  })

  fastify.post('/api/polyspoon/native-recipes', {
    bodyLimit: 70000, config: { decompress: false }, onRequest: authenticate,
    onResponse: (req, reply, done) => { req.recipeLease?.release(); done() },
  }, async (req, reply) => {
    const lease = req.recipeLease
    lease.start()
    try {
      const { id, hd, cdnBase, params = {} } = req.body || {}
      if (!params || typeof params !== 'object' || Array.isArray(params) || Buffer.byteLength(JSON.stringify(params)) > 65536) return reply.code(400).send({ error: 'Invalid or oversized model parameters' })
      let source, compiled
      try {
        source = await resolveNative({ id, hd, cdnBase })
        compiled = await compileNative(source)
      } catch { return reply.code(400).send({ error: 'Could not obtain or compile the Polyfork model' }) }
      const sourceHash = createHash('sha256').update(source).digest('hex')
      const bytes = Buffer.from(`${compiled}\n// source-sha256:${sourceHash}\n`)
      if (bytes.length > 512000) return reply.code(400).send({ error: 'Compiled Polyfork model is too large' })
      if (minFreeBytes > 0 && typeof assets.freeSpace === 'function') {
        const space = await assets.freeSpace().catch(() => null)
        if (space && space.free - bytes.length - Buffer.byteLength(source) < Math.min(minFreeBytes, Math.floor(space.total * 0.2))) return reply.code(507).send({ error: 'The server is out of storage' })
      }
      const fit = lease.confirm(bytes.length + Buffer.byteLength(source))
      if (!fit.ok) return reply.code(fit.status).send({ error: fit.error })
      const code = status(req.recipeSocket)
      if (code) return reply.code(code).send({ error: 'Your session or permissions changed' })
      const hash = createHash('sha256').update(bytes).digest('hex')
      const created = await assets.upload({ name: `${hash}.js`, buffer: bytes })
      if (created !== false) lease.commit(bytes.length + Buffer.byteLength(source))
      if (status(req.recipeSocket)) return reply.code(403).send({ error: 'Your session or permissions changed' })
      await polyspoonRegistry.approveNative(hash, source)
      return reply.code(201).send({ model: `polyfork://${hash}` })
    } finally { lease.release() }
  })
  fastify.post('/api/polyspoon/recipes', {
    bodyLimit: 3200000,
    config: { decompress: false },
    onRequest: authenticate,
    onResponse: (req, reply, done) => { req.recipeLease?.release(); done() },
  }, async (req, reply) => {
    const lease = req.recipeLease
    lease.start()
    try {
      const params = req.body?.params ?? {}
      if (typeof params !== 'object' || Array.isArray(params) || Buffer.byteLength(JSON.stringify(params)) > 65536) {
        return reply.code(400).send({ error: 'Invalid or oversized recipe parameters' })
      }
      let source = req.body?.source
      let catalog = null
      if (req.body?.assetUrl !== undefined) {
        if (source !== undefined || typeof req.body.assetUrl !== 'string' || req.body.assetUrl.length > 2048) {
          return reply.code(400).send({ error: 'Enter a valid Polyspoon asset URL' })
        }
        try { catalog = await resolveAsset(req.body.assetUrl); source = catalog.source }
        catch (error) { return reply.code(400).send({ error: error.message || 'Could not read the Polyspoon asset' }) }
      }
      if (typeof source !== 'string' || !source || Buffer.byteLength(source) > 512000) {
        return reply.code(400).send({ error: 'Recipe is empty or too large' })
      }
      let compiled
      try {
        compiled = req.body?.format === 'polyfork' ? await compilePolyforkRecipe(source) : await compileRecipe(source)
        if (catalog) compiled = applyPolyspoonCatalogPreset(compiled, catalog.hint)
        const recipe = await world.loader.buildPolyspoonRecipe(compiled, params)
        recipe.disposeAsset(recipe.createAsset())
      } catch {
        return reply.code(400).send({ error: 'Recipe could not be built with these parameters in the sandbox' })
      }
      const bytes = Buffer.from(compiled)
      if (bytes.length > 512000) return reply.code(400).send({ error: 'Compiled recipe is too large' })
      const fit = lease.confirm(bytes.length)
      if (!fit.ok) return reply.code(fit.status).header('Retry-After', String(fit.retryAfter ?? 1)).send({ error: fit.error })
      if (minFreeBytes > 0 && typeof assets.freeSpace === 'function') {
        const space = await assets.freeSpace().catch(() => null)
        if (space && space.free - bytes.length < Math.min(minFreeBytes, Math.floor(space.total * 0.2))) {
          return reply.code(507).send({ error: 'The server is out of storage' })
        }
      }
      let code = status(req.recipeSocket)
      if (code) return reply.code(code).send({ error: 'Your session or permissions changed' })
      const hash = createHash('sha256').update(bytes).digest('hex')
      const created = await assets.upload({ name: `${hash}.js`, buffer: bytes })
      if (created !== false) lease.commit(bytes.length)
      code = status(req.recipeSocket)
      if (code) return reply.code(code).send({ error: 'Your session or permissions changed' })
      await polyspoonRegistry.approve(hash)
      return reply.code(201).send({ model: `polyspoon://${hash}`, ...(catalog ? { name: catalog.name } : {}) })
    } finally {
      lease.release()
    }
  })
}
