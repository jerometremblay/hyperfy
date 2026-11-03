import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import Fastify from 'fastify'
import { agentAPI } from './agent-api.js'
import { polyspoonRoutes } from './polyspoon-routes.js'
import { PolyspoonRegistry } from './PolyspoonRegistry.js'

test('only the write token approves a recipe; the public route serves approved, intact bytes', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'polyspoon-registry-'))
  const registry = new PolyspoonRegistry(dir)
  const files = new Map()
  const assets = {
    upload: async file => files.set(file.name, Buffer.from(await file.arrayBuffer())),
    read: async name => files.get(name),
    exists: async name => files.has(name),
  }
  const world = {
    blueprints: { get: () => null, add() {} },
    network: { send() {}, dirtyBlueprints: new Set() },
    loader: { buildPolyspoonRecipe: async () => ({ createAsset: () => ({}), disposeAsset() {} }) },
  }
  const server = Fastify()
  server.register(polyspoonRoutes, { polyspoonRegistry: registry, assets })
  server.register(agentAPI, {
    prefix: '/api/agent',
    world,
    assets,
    polyspoonRegistry: registry,
    readToken: 'read',
    writeToken: 'write',
  })
  await server.ready()
  t.after(async () => {
    await server.close()
    await rm(dir, { recursive: true, force: true })
  })
  const source = 'module.exports = {}'
  const hash = createHash('sha256').update(source).digest('hex')
  const register = token =>
    server.inject({
      method: 'POST',
      url: '/api/agent/polyspoon/recipes',
      headers: { authorization: `Bearer ${token}` },
      payload: { source },
    })
  const create = () =>
    server.inject({
      method: 'POST',
      url: '/api/agent/apps',
      headers: { authorization: 'Bearer write' },
      payload: { name: 'Recipe', model: `polyspoon://${hash}` },
    })
  const get = () => server.inject({ method: 'GET', url: `/api/polyspoon/sandboxed-recipes/${hash}` })
  assert.equal((await server.inject({ method: 'GET', url: `/api/polyspoon/recipes/${hash}` })).statusCode, 404)
  assert.equal((await register('read')).statusCode, 403)
  assert.equal((await get()).statusCode, 404)
  assert.equal((await create()).statusCode, 400)
  const validated = await server.inject({
    method: 'POST',
    url: '/api/agent/polyspoon/recipes',
    headers: { authorization: 'Bearer write' },
    payload: { source, validateOnly: true },
  })
  assert.deepEqual(validated.json(), { valid: true })
  assert.equal((await get()).statusCode, 404)
  const registered = await register('write')
  assert.equal(registered.statusCode, 201)
  assert.equal(registered.json().model, `polyspoon://${hash}`)
  assert.equal((await get()).body, source)
  assert.equal((await create()).statusCode, 201)
  assert.equal(await new PolyspoonRegistry(dir).has(hash), true)
  files.set(`${hash}.js`, Buffer.from('modified'))
  assert.equal((await get()).statusCode, 404)
  world.loader.buildPolyspoonRecipe = async () => {
    throw new Error('sandbox rejected code')
  }
  const rejectedSource = 'untrusted code'
  const rejected = await server.inject({
    method: 'POST',
    url: '/api/agent/polyspoon/recipes',
    headers: { authorization: 'Bearer write' },
    payload: { source: rejectedSource },
  })
  const rejectedHash = createHash('sha256').update(rejectedSource).digest('hex')
  assert.equal(rejected.statusCode, 400)
  assert.equal(await registry.has(rejectedHash), false)
  assert.equal(files.has(`${rejectedHash}.js`), false)
})

test('connected admins can register a sandboxed recipe; permissions and limits are checked', async t => {
  const { createUploadLimits, readUploadLimitsEnv } = await import('./uploadLimits.js')
  const dir = await mkdtemp(path.join(os.tmpdir(), 'polyspoon-admin-'))
  const registry = new PolyspoonRegistry(dir)
  const files = new Map()
  const assets = {
    upload: async file => { files.set(file.name, file.buffer); return true },
    read: async name => files.get(name),
  }
  let admin = true
  const socket = { id: 'user', disconnected: false, player: { data: { rank: 3 }, isAdmin: () => admin } }
  let rejectSandbox = false
  let receivedParams
  const world = { loader: { buildPolyspoonRecipe: async (source, params) => {
    receivedParams = params
    if (rejectSandbox) throw new Error('bad recipe')
    return { createAsset: () => ({}), disposeAsset() {} }
  } } }
  let revokeDuringCompile = false
  let resolvedAssets = 0
  const server = Fastify()
  server.register(polyspoonRoutes, {
    polyspoonRegistry: registry, assets, world,
    readJWT: async token => token === 'valid' ? { userId: 'user' } : null,
    getSocket: id => id === 'user' ? socket : null,
    limits: createUploadLimits(readUploadLimitsEnv({})),
    compileRecipe: async source => { if (revokeDuringCompile) admin = false; return `compiled:${source}` },
    resolveAsset: async () => { resolvedAssets++; return { source: 'catalog-source', name: 'Lamp', hint: 'lamp' } },
  })
  await server.ready()
  t.after(async () => { await server.close(); await rm(dir, { recursive: true, force: true }) })
  const post = (token, source = 'source') => server.inject({ method: 'POST', url: '/api/polyspoon/recipes', headers: { authorization: `Bearer ${token}` }, payload: { source } })
  assert.equal((await post('bad')).statusCode, 401)
  const postAsset = token => server.inject({ method: 'POST', url: '/api/polyspoon/recipes', headers: { authorization: `Bearer ${token}` }, payload: { assetUrl: 'https://polyspoon.com/asset/example' } })
  assert.equal((await postAsset('bad')).statusCode, 401)
  assert.equal(resolvedAssets, 0)
  admin = false
  assert.equal((await post('valid')).statusCode, 403)
  assert.equal((await postAsset('valid')).statusCode, 403)
  assert.equal(resolvedAssets, 0)
  admin = true
  rejectSandbox = true
  assert.equal((await post('valid')).statusCode, 400)
  assert.equal(files.size, 0)
  rejectSandbox = false
  revokeDuringCompile = true
  assert.equal((await post('valid')).statusCode, 403)
  assert.equal(files.size, 0)
  admin = true
  revokeDuringCompile = false
  assert.equal((await post('valid', 'x'.repeat(512001))).statusCode, 400)
  const response = await post('valid')
  assert.deepEqual(receivedParams, {})
  assert.equal(response.statusCode, 201)
  const hash = createHash('sha256').update('compiled:source').digest('hex')
  assert.equal(response.json().model, `polyspoon://${hash}`)
  assert.equal(await registry.has(hash), true)
  assert.equal((await server.inject({ method: 'GET', url: `/api/polyspoon/sandboxed-recipes/${hash}` })).body, 'compiled:source')
  const withParams = await server.inject({ method: 'POST', url: '/api/polyspoon/recipes', headers: { authorization: 'Bearer valid' }, payload: { source: 'new-version', params: { width: 1.8 } } })
  assert.equal(withParams.statusCode, 201)
  assert.deepEqual(receivedParams, { width: 1.8 })
  const invalidParams = await server.inject({ method: 'POST', url: '/api/polyspoon/recipes', headers: { authorization: 'Bearer valid' }, payload: { source: 'source', params: ['bad'] } })
  assert.equal(invalidParams.statusCode, 400)
  const catalog = await postAsset('valid')
  assert.equal(catalog.statusCode, 201)
  assert.equal(catalog.json().name, 'Lamp')
  assert.equal(resolvedAssets, 1)
  socket.disconnected = true
  assert.equal((await post('valid')).statusCode, 401)
})

test('recipe compiler includes three and rejects other imports', async () => {
  const { compilePolyspoonRecipe } = await import('./compilePolyspoonRecipe.js')
  const { readFile } = await import('node:fs/promises')
  const recipe = await readFile('test/fixtures/polyspoon/market-stall.recipe.mjs', 'utf8')
  assert.ok((await compilePolyspoonRecipe(recipe)).includes('PolyspoonRecipe'))
  await assert.rejects(compilePolyspoonRecipe("import fs from 'node:fs'; export {fs}"), /Recipe may import only three/)
  await assert.rejects(compilePolyspoonRecipe("import x from './other.mjs'; export {x}"), /Recipe may import only three/)
})
