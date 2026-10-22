import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { build } from 'esbuild'
import Knex from 'knex'
import EventEmitter from 'eventemitter3'
import Fastify from 'fastify'
import 'ses'

process.env.JWT_SECRET = 'published-objects-test-only-secret'
const bundle = await build({
  stdin: {
    contents: `export { createNode } from './src/core/extras/createNode.js'; export { Apps } from './src/core/systems/Apps.js'; export { Blueprints } from './src/core/systems/Blueprints.js'; export { Entities } from './src/core/systems/Entities.js'; export { Scripts } from './src/core/systems/Scripts.js'; export { ServerNetwork } from './src/core/systems/ServerNetwork.js'; export { ClientBuilder } from './src/core/systems/ClientBuilder.js'; export { PublishedObjectClient } from './src/core/extras/PublishedObjectClient.js'; export * from './src/core/extras/appTools.js'; export * from './src/core/extras/publishedObjects.js'; export * from './src/server/published-objects.js'; export { digest } from './src/server/PublishedSourceResolver.js'; export { createJWT } from './src/core/utils-server.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  packages: 'external',
  write: false,
  plugins: [
    {
      name: 'skill-files',
      setup(build) {
        build.onResolve({ filter: /^hyperfy-skill-files$/ }, () => ({ path: 'skill-files', namespace: 'test' }))
        build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export default {}' }))
      },
    },
  ],
})
const filename = path.resolve(`.published-runtime-test-${process.pid}.mjs`)
await fs.writeFile(filename, bundle.outputFiles[0].contents)
let runtime
try {
  runtime = await import(`file://${filename}`)
} finally {
  await fs.unlink(filename)
}
const {
  createNode,
  Apps,
  Blueprints,
  Entities,
  Scripts,
  ServerNetwork,
  ClientBuilder,
  PublishedObjectClient,
  exportApp,
  publishedExpectation,
  publishedObjectsAPI,
  createJWT,
  digest,
} = runtime
const url = 'https://objects.example/test.hyp'

async function fixture(t) {
  const files = new Map()
  const broadcasts = []
  const db = Knex({ client: 'better-sqlite3', connection: { filename: ':memory:' }, useNullAsDefault: true })
  t.after(() => db.destroy())
  for (const name of ['entities', 'blueprints'])
    await db.schema.createTable(name, table => {
      table.string('id').primary()
      table.text('data')
      table.string('createdAt')
      table.string('updatedAt')
    })
  await db.schema.createTable('config', table => {
    table.string('key').primary()
    table.text('value')
  })
  function makeWorld(client = false) {
    const world = new EventEmitter()
    Object.assign(world, {
      networkRate: 1 / 8,
      events: new EventEmitter(),
      stage: { dirtyNodes: new Set() },
      anchors: { remove() {} },
      setHot() {},
      settings: Object.assign(new EventEmitter(), { deserialize() {}, setHasAdminCode() {} }),
      ui: { confirm: async () => true },
    })
    world.network = new ServerNetwork(world)
    clearInterval(world.network.socketIntervalId)
    world.network.isServer = !client
    world.network.isClient = client
    world.network.id = client ? 'builder' : 0
    world.network.db = db
    world.apps = new Apps(world)
    world.blueprints = new Blueprints(world)
    world.entities = new Entities(world)
    const scripts = new Scripts(world)
    const cache = new Map()
    world.loader = {
      get: (_type, url) => cache.get(url),
      async load(type, url) {
        if (cache.has(url)) return cache.get(url)
        if (type === 'script') {
          const bytes = files.get(url.slice(8))
          if (!bytes) throw new Error('missing script')
          const value = scripts.evaluate(bytes.toString())
          cache.set(url, value)
          return value
        }
        if (type === 'model' && url === 'asset://crash-block.glb') return { toNodes: () => createNode('group') }
        throw new Error(`Unexpected loader ${type}`)
      },
    }
    world.network.send = (name, data) => broadcasts.push([name, structuredClone(data)])
    t.after(() => {
      clearTimeout(world.network.saveTimerId)
      for (const app of [...world.entities.items.values()]) app.destroy()
    })
    return world
  }
  const server = makeWorld()
  const client = makeWorld(true)
  const observer = makeWorld(true)
  const observerBuilds = []
  server.network.send = (name, data, ignore) => {
    broadcasts.push([name, structuredClone(data)])
    if (name === 'blueprintAdded') observer.blueprints.add(structuredClone(data))
    if (name === 'entityAdded') observerBuilds.push(observer.entities.add(structuredClone(data)).buildPromise)
    if (name === 'entityModified')
      observerBuilds.push(Promise.resolve(observer.entities.get(data.id)?.modify(structuredClone(data))))
    if (ignore !== 'builder') {
      if (name === 'blueprintAdded') client.blueprints.add(structuredClone(data))
      if (name === 'entityModified') client.entities.get(data.id)?.modify(structuredClone(data))
    }
  }
  const socket = { id: 'builder', player: { isBuilder: () => true }, send() {} }
  server.network.sockets.set(socket.id, socket)
  const http = Fastify()
  http.register(publishedObjectsAPI, {
    world: server,
    assets: {
      upload: async file => files.set(file.name, Buffer.from(await file.arrayBuffer())),
      exists: async name => files.has(name),
    },
    maxBytes: 1024 * 1024,
  })
  await http.ready()
  t.after(() => http.close())
  let bytes
  const publish = async (revision, props = { color: 'blue', intensity: 1 }, code) => {
    const script = Buffer.from(code || `app.add(app.create('group', { id: '${revision}' }));`)
    const scriptURL = `asset://${digest(script).slice(7)}.js`
    const file = await exportApp(
      { id: 'package', version: 1, name: revision, model: 'script-only', script: scriptURL, props },
      async () => new File([script], scriptURL.slice(8))
    )
    bytes = Buffer.from(await file.arrayBuffer())
    const cached = server.network.publishedObjects.resolver.cache.get(url)
    if (cached) cached.nextCheck = 0
  }
  server.network.publishedObjects.resolver.fetcher = async () => ({ bytes })
  const token = await createJWT({ userId: socket.id })
  const request = async (operation, data) => {
    const result = await http.inject({
      method: 'POST',
      url: `/api/published/${operation}`,
      headers: { authorization: `Bearer ${token}` },
      payload: data,
    })
    const body = result.json()
    if (result.statusCode !== 200) throw new Error(body.error)
    return body
  }
  client.builder = Object.assign(Object.create(ClientBuilder.prototype), {
    world: client,
    undos: [],
    canBuild: () => true,
  })
  client.builder.published = new PublishedObjectClient(client)
  client.builder.published.request = request
  return { server, client, observer, socket, http, request, publish, broadcasts, observerBuilds, db, makeWorld }
}

test('real app scripts, HTTP authentication, client coordinator, observer sync and keyboard Undo complete the lifecycle', async t => {
  const f = await fixture(t)
  await f.publish('v1')
  await f.client.builder.published.install(null, url, { position: [1, 2, 3], quaternion: [0, 0, 0, 1] })
  const app = [...f.client.entities.items.values()][0]
  assert.equal(app.root.children[0].id, 'v1')
  const serverApp = f.server.entities.get(app.data.id)
  serverApp.data.state = { count: 42 }
  app.data.state = { count: 42 }
  app.blueprint.props.color = 'red'
  serverApp.blueprint.props.color = 'red'
  const before = structuredClone(app.data)
  await f.publish('v2', { color: 'green', intensity: 0.8 })
  await f.client.builder.published.check(url)
  await f.client.builder.published.install(app)
  assert.equal(app.root.children[0].id, 'v2')
  assert.equal(f.client.builder.undos.length, 1)
  assert.deepEqual(app.blueprint.props, { color: 'red', intensity: 0.8 })
  await Promise.all(f.observerBuilds)
  assert.equal(f.observer.entities.get(app.data.id).root.children[0].id, 'v2')
  await f.client.builder.undo()
  assert.equal(f.client.builder.undos.length, 0)
  assert.equal(app.root.children[0].id, 'v1')
  assert.deepEqual(app.data.state, before.state)
  assert.deepEqual(app.data.published, before.published)
  assert.deepEqual(app.data.position, before.position)
  await Promise.all(f.observerBuilds)
  assert.equal(f.observer.entities.get(app.data.id).root.children[0].id, 'v1')
  const saved = JSON.parse((await f.db('entities').where('id', app.data.id).first()).data)
  assert.deepEqual(saved.published, before.published)
  const restarted = f.makeWorld()
  await restarted.network.start()
  const restored = restarted.entities.get(app.data.id)
  await restored.buildPromise
  assert.equal(restored.root.children[0].id, 'v1')
  assert.deepEqual(restored.data.published, before.published)
  assert.deepEqual(restored.blueprint.props, { color: 'red', intensity: 1 })
  const unauthorized = await f.http.inject({ method: 'POST', url: '/api/published/check', payload: { url } })
  assert.equal(unauthorized.statusCode, 400)
})

test('real client script failure restores v1 with zero Undo; permission-blocked Undo stays on the builder stack', async t => {
  const f = await fixture(t)
  await f.publish('v1')
  await f.client.builder.published.install(null, url, { position: [0, 0, 0], quaternion: [0, 0, 0, 1] })
  const app = [...f.client.entities.items.values()][0]
  const before = structuredClone(app.data)
  await f.publish('bad', { color: 'red' }, 'throw new Error("broken published script")')
  await assert.rejects(f.client.builder.published.install(app), /failed to load/)
  assert.equal(app.root.children[0].id, 'v1')
  assert.deepEqual(app.data, before)
  assert.equal(f.client.builder.undos.length, 0)
  assert.deepEqual(f.server.entities.get(app.data.id).data, before)
  await f.publish('v2')
  await f.client.builder.published.install(app)
  f.socket.player.isBuilder = () => false
  await f.client.builder.undo()
  assert.equal(f.client.builder.undos.length, 1)
  assert.equal(app.root.children[0].id, 'v2')
  f.socket.player.isBuilder = () => true
  await f.client.builder.undo()
  assert.equal(f.client.builder.undos.length, 0)
  assert.equal(app.root.children[0].id, 'v1')
})
