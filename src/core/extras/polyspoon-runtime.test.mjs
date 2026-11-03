import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { Worker } from 'node:worker_threads'
import { build } from 'esbuild'

const workerBundle = await build({
  entryPoints: ['src/server/polyspoonNodeWorker.js'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  write: false,
})
const workerPath = path.resolve(`.polyspoon-sandbox-test-${process.pid}.mjs`)
await writeFile(workerPath, workerBundle.outputFiles[0].contents)
const adapterBundle = await build({
  entryPoints: ['src/core/extras/polyspoon.js'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
const { recipeFromSandbox, createPolyspoonModel } = await import(
  `data:text/javascript;base64,${Buffer.from(adapterBundle.outputFiles[0].contents).toString('base64')}`
)
test.after(async () => unlink(workerPath))

async function run(source, props = {}) {
  const worker = new Worker(workerPath, { resourceLimits: { maxOldGenerationSizeMb: 128 } })
  try {
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('sandbox timed out')), 5000)
      worker.once('error', error => {
        clearTimeout(timer)
        reject(error)
      })
      worker.once('message', message => {
        clearTimeout(timer)
        if (message.error) reject(new Error(message.error))
        else resolve(message.result)
      })
      worker.postMessage({ source, parameters: JSON.stringify(props) })
    })
  } finally {
    await worker.terminate()
  }
}

async function bundleRecipe(file) {
  const contents = await readFile(file, 'utf8')
  const result = await build({
    stdin: { contents, resolveDir: process.cwd(), sourcefile: 'recipe.mjs' },
    bundle: true,
    format: 'iife',
    globalName: 'PolyspoonRecipe',
    platform: 'neutral',
    minify: true,
    write: false,
  })
  return result.outputFiles[0].text
}

test('sandboxed recipes produce parameterized meshes and colliders', async () => {
  const source = await bundleRecipe('test/fixtures/polyspoon/market-stall.recipe.mjs')
  const world = { network: { isServer: true } }
  const first = createPolyspoonModel(world, recipeFromSandbox(await run(source, { width: 2.8 })))
  const second = createPolyspoonModel(
    world,
    recipeFromSandbox(await run(source, { width: 3.5, goods: 'none' }))
  )
  assert.equal(first.fields.find(field => field.key === 'width').initial, 2.8)
  assert.equal(second.fields.find(field => field.key === 'width').initial, 3.5)
  assert.notEqual(first.root.children.length, second.root.children.length)
  assert.ok(second.root.children.find(node => node.name === 'rigidbody').children[0]._geometry.index.count)
  first.dispose()
  second.dispose()
})

test('recipe code has no host, network, module loader, or mutable host constructors', async () => {
  const source = await bundleRecipe('test/fixtures/polyspoon/bookcase.recipe.mjs')
  const checks = `
    if (typeof process !== 'undefined' || typeof fetch !== 'undefined' || typeof require !== 'undefined' ||
        typeof postMessage !== 'undefined' || typeof Worker !== 'undefined' || typeof WebSocket !== 'undefined' ||
        typeof self !== 'undefined' || typeof importScripts !== 'undefined' || typeof document !== 'undefined')
      throw Error('unexpected host capability');
    try { Float32Array.prototype.attacked = true; } catch (_) {}
    if (Float32Array.prototype.attacked) throw Error('mutable host constructor');
    try { Float32Array.constructor('return process')(); throw Error('escaped'); } catch (e) { if (e.message === 'escaped') throw e; }
  `
  const recipe = recipeFromSandbox(await run(checks + source))
  assert.ok(recipe.metadata.controls.length > 0)
  recipe.disposeAsset(recipe.createAsset())
  await assert.rejects(run('while(true){}'), /sandbox timed out/)
  await assert.rejects(run('import(\"node:fs\")'), /import expression rejected/i)
  assert.throws(
    () => recipeFromSandbox('{"meshes":[{"positions":[0]}],"controls":[],"applied":{}}'),
    /Invalid recipe mesh/
  )
})

test('in-world registration compiles and validates a real recipe in the sandbox', async t => {
  const { default: Fastify } = await import('fastify')
  const { mkdtemp, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { polyspoonRoutes } = await import('../../server/polyspoon-routes.js')
  const { PolyspoonRegistry } = await import('../../server/PolyspoonRegistry.js')
  const { createUploadLimits, readUploadLimitsEnv } = await import('../../server/uploadLimits.js')
  const dir = await mkdtemp(path.join(tmpdir(), 'polyspoon-world-test-'))
  const registry = new PolyspoonRegistry(dir)
  const files = new Map()
  const assets = {
    upload: async file => { files.set(file.name, file.buffer); return true },
    read: async name => files.get(name),
  }
  const socket = { id: 'admin', player: { data: { rank: 3 }, isAdmin: () => true } }
  const world = { loader: { buildPolyspoonRecipe: async (source, props) => recipeFromSandbox(await run(source, props)) } }
  const app = Fastify()
  app.register(polyspoonRoutes, {
    polyspoonRegistry: registry, assets, world,
    readJWT: async token => token === 'admin' ? { userId: 'admin' } : null,
    getSocket: id => id === 'admin' ? socket : null,
    limits: createUploadLimits(readUploadLimitsEnv({})),
    resolveAsset: async () => ({ source: await readFile('test/fixtures/polyspoon/market-stall.recipe.mjs', 'utf8'), name: 'Pottery Booth', hint: 'Pottery Booth' }),
  })
  await app.ready()
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  const source = await readFile('test/fixtures/polyspoon/bookcase.recipe.mjs', 'utf8')
  const post = source => app.inject({ method: 'POST', url: '/api/polyspoon/recipes', headers: { authorization: 'Bearer admin' }, payload: { source } })
  const response = await post(source)
  assert.equal(response.statusCode, 201, response.body)
  const hash = response.json().model.slice('polyspoon://'.length)
  assert.equal(await registry.has(hash), true)
  const bundle = (await app.inject({ method: 'GET', url: `/api/polyspoon/sandboxed-recipes/${hash}` })).body
  const result = recipeFromSandbox(await run(bundle, { width: 2 }))
  assert.ok(result.metadata.controls.length)
  const malicious = `${source}\nif (typeof process !== 'undefined') throw Error('host access');\nthrow Error('reject')`
  assert.equal((await post(malicious)).statusCode, 400)
  assert.equal(files.size, 1)
  const catalogResponse = await app.inject({ method: 'POST', url: '/api/polyspoon/recipes', headers: { authorization: 'Bearer admin' }, payload: { assetUrl: 'https://polyspoon.com/asset/example' } })
  assert.equal(catalogResponse.statusCode, 201, catalogResponse.body)
  assert.equal(catalogResponse.json().name, 'Pottery Booth')
  const catalogHash = catalogResponse.json().model.slice('polyspoon://'.length)
  const catalogBundle = (await app.inject({ method: 'GET', url: `/api/polyspoon/sandboxed-recipes/${catalogHash}` })).body
  const rejectedParams = await app.inject({ method: 'POST', url: '/api/polyspoon/recipes', headers: { authorization: 'Bearer admin' }, payload: { assetUrl: 'https://polyspoon.com/asset/example', params: { width: 1000 } } })
  assert.equal(rejectedParams.statusCode, 400)
  assert.equal(files.size, 2)
  const catalogRecipe = recipeFromSandbox(await run(catalogBundle, {}))
  const catalogAsset = catalogRecipe.createAsset()
  assert.equal(catalogAsset.userData.design.applied.goods, 'pottery')
  catalogRecipe.disposeAsset(catalogAsset)
})

test('catalog presets are selected inside the sandbox and remain editable', async () => {
  const { compilePolyspoonRecipe } = await import('../../server/compilePolyspoonRecipe.js')
  const { applyPolyspoonCatalogPreset } = await import('../../server/polyspoonCatalog.js')
  const source = await readFile('test/fixtures/polyspoon/market-stall.recipe.mjs', 'utf8')
  const compiled = applyPolyspoonCatalogPreset(await compilePolyspoonRecipe(source), 'Pottery Booth')
  const initial = recipeFromSandbox(await run(compiled, {}))
  const initialAsset = initial.createAsset()
  assert.equal(initialAsset.userData.design.applied.type, 'canopy')
  assert.equal(initialAsset.userData.design.applied.goods, 'pottery')
  initial.disposeAsset(initialAsset)
  const edited = recipeFromSandbox(await run(compiled, { width: 2.5 }))
  const editedAsset = edited.createAsset()
  assert.equal(editedAsset.userData.design.applied.width, 2.5)
  assert.equal(editedAsset.userData.design.applied.goods, 'pottery')
  edited.disposeAsset(editedAsset)
})

test('manual refresh registers a real updated recipe while preserving saved parameters and placement', async t => {
  const { default: Fastify } = await import('fastify')
  const { mkdtemp, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { polyspoonRoutes } = await import('../../server/polyspoon-routes.js')
  const { PolyspoonRegistry } = await import('../../server/PolyspoonRegistry.js')
  const { createUploadLimits, readUploadLimitsEnv } = await import('../../server/uploadLimits.js')
  const { importPolyspoonRecipe, refreshPolyspoonRecipe } = await import('./polyspoonImport.js')
  const dir = await mkdtemp(path.join(tmpdir(), 'polyspoon-refresh-test-'))
  const files = new Map()
  const registry = new PolyspoonRegistry(dir)
  const assets = { upload: async file => { files.set(file.name, file.buffer); return true }, read: async name => files.get(name) }
  const socket = { id: 'admin', player: { data: { rank: 3 }, isAdmin: () => true } }
  const serverWorld = { loader: { buildPolyspoonRecipe: async (source, props) => recipeFromSandbox(await run(source, props)) } }
  const server = Fastify()
  server.register(polyspoonRoutes, {
    polyspoonRegistry: registry, assets, world: serverWorld,
    readJWT: async () => ({ userId: 'admin' }), getSocket: () => socket,
    limits: createUploadLimits(readUploadLimitsEnv({})),
    resolveAsset: async () => ({ source: await readFile('test/fixtures/polyspoon/market-stall.recipe.mjs', 'utf8'), name: 'Market Stall', hint: 'Pottery Booth' }),
  })
  await server.ready()
  t.after(async () => { await server.close(); await rm(dir, { recursive: true, force: true }) })
  const fetcher = async (url, options) => {
    const response = await server.inject({ method: options.method, url: new URL(url).pathname, headers: options.headers, payload: options.body })
    return new Response(response.body, { status: response.statusCode, headers: { 'content-type': 'application/json' } })
  }
  const sourceUrl = `https://polyspoon.com/asset/${'a'.repeat(64)}`
  let blueprint = { ...(await importPolyspoonRecipe({ network: { apiUrl: 'https://world.example/api', authToken: 'token' } }, sourceUrl, fetcher)), id: 'bp', version: 0, props: { width: 2.5 } }
  // Model an earlier approved version without changing the saved URL or parameters.
  blueprint.model = `polyspoon://${'b'.repeat(64)}`
  const app = { data: { id: 'instance', blueprint: 'bp', position: [1, 2, 3] } }
  const clientWorld = {
    network: { apiUrl: 'https://world.example/api', authToken: 'token' },
    entities: { get: () => app, player: { isAdmin: () => true } },
    blueprints: { get: () => blueprint, modify: change => { blueprint = { ...blueprint, ...change }; return true } },
  }
  assert.equal(await refreshPolyspoonRecipe(clientWorld, app, fetcher), true)
  assert.equal(blueprint.url, sourceUrl)
  assert.deepEqual(blueprint.props, { width: 2.5 })
  assert.deepEqual(app.data.position, [1, 2, 3])
  assert.equal(await registry.has(blueprint.model.slice('polyspoon://'.length)), true)
  const source = files.get(`${blueprint.model.slice('polyspoon://'.length)}.js`).toString('utf8')
  const refreshed = recipeFromSandbox(await run(source, blueprint.props))
  const object = refreshed.createAsset()
  assert.equal(object.userData.design.applied.width, 2.5)
  assert.equal(object.userData.design.applied.goods, 'pottery')
  refreshed.disposeAsset(object)
})
