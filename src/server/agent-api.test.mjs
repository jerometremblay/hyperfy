import assert from 'node:assert/strict'
import test from 'node:test'
import Fastify from 'fastify'
import { agentAPI } from './agent-api.js'

async function setup(t, tokens = { readToken: 'reader', writeToken: 'writer' }) {
  const blueprints = new Map([['box', { id: 'box', version: 0, model: 'script-only', props: {} }]])
  const items = new Map()
  const sent = []
  const world = {
    settings: { serialize: () => ({ title: 'Test' }) },
    blueprints: {
      items: blueprints,
      get: id => blueprints.get(id),
      serialize: () => [...blueprints.values()],
      add: data => blueprints.set(data.id, data),
      modify: data => blueprints.set(data.id, { ...blueprints.get(data.id), ...data }),
    },
    entities: {
      items,
      players: new Map(),
      get: id => items.get(id),
      remove: id => items.delete(id),
      add(data) {
        const item = {
          data,
          isApp: true,
          serialize: () => structuredClone(data),
          modify: change => Object.assign(data, change),
        }
        items.set(data.id, item)
        return item
      },
    },
    network: { send: (...args) => sent.push(args), dirtyBlueprints: new Set(), dirtyApps: new Set() },
  }
  const uploads = []
  const assets = { exists: async () => true, upload: async file => uploads.push(file) }
  const server = Fastify()
  server.register(agentAPI, { prefix: '/api/agent', world, assets, ...tokens })
  t.after(() => server.close())
  await server.ready()
  const call = (method, path, payload, token = 'writer') =>
    server.inject({ method, url: `/api/agent${path}`, payload, headers: { authorization: `Bearer ${token}` } })
  return { server, call, world, sent, uploads }
}

test('disabled by default; tokens separate read and write access', async t => {
  const disabled = await setup(t, {})
  assert.equal((await disabled.call('GET', '/world')).statusCode, 404)
  const { call, sent } = await setup(t)
  assert.equal((await call('GET', '/world', undefined, 'wrong')).statusCode, 401)
  assert.equal((await call('GET', '/world', undefined, 'reader')).json().settings.title, 'Test')
  assert.equal((await call('POST', '/entities', { blueprint: 'box' }, 'reader')).statusCode, 403)
  assert.equal(sent.length, 0)
})

test('create, move, and remove use broadcasts and persistence tracking', async t => {
  const { call, world, sent } = await setup(t)
  const created = await call('POST', '/entities', { blueprint: 'box' })
  assert.equal(created.statusCode, 201)
  const id = created.json().id
  assert.equal(world.network.dirtyApps.has(id), true)
  assert.equal((await call('PATCH', `/entities/${id}`, { position: [1, 2, 3] })).statusCode, 200)
  assert.deepEqual(world.entities.get(id).data.position, [1, 2, 3])
  world.entities.get(id).data.mover = 'someone'
  assert.equal((await call('DELETE', `/entities/${id}`)).statusCode, 409)
  world.entities.get(id).data.mover = null
  assert.equal((await call('DELETE', `/entities/${id}`)).statusCode, 204)
  assert.equal(world.entities.get(id), undefined)
  assert.deepEqual(
    sent.map(item => item[0]),
    ['entityAdded', 'entityModified', 'entityRemoved']
  )
})

test('blueprint version conflicts and invalid bodies cannot mutate world', async t => {
  const { call, world } = await setup(t)
  assert.equal((await call('PATCH', '/apps/box', { version: 0, props: { color: 'red' } })).statusCode, 200)
  assert.equal(world.blueprints.get('box').version, 1)
  assert.equal(world.network.dirtyBlueprints.has('box'), true)
  assert.equal((await call('PATCH', '/apps/box', { version: 0, name: 'stale' })).statusCode, 409)
  for (const payload of [
    { position: [1, 2] },
    { quaternion: [0, 0, 0, 0] },
    { scale: [-1, 1, 1] },
    { owner: 'injected' },
  ]) {
    const created = (await call('POST', '/entities', { blueprint: 'box' })).json()
    assert.equal((await call('PATCH', `/entities/${created.id}`, payload)).statusCode, 400)
  }
  assert.equal((await call('POST', '/entities', { blueprint: 'missing' })).statusCode, 404)
  world.blueprints.add({ id: '$scene', version: 0 })
  assert.equal((await call('PATCH', '/apps/$scene', { version: 0, name: 'scene' })).statusCode, 409)
  assert.equal((await call('PATCH', '/entities/player', { position: [0, 0, 0] })).statusCode, 404)
})

test('script storage, app creation and OpenAPI describe the usable workflow', async t => {
  const { call, uploads } = await setup(t)
  const uploaded = await call('POST', '/scripts', { source: 'app.on("update", () => {})' })
  assert.equal(uploaded.statusCode, 201)
  assert.match(uploaded.json().url, /^asset:\/\/[a-f0-9]{64}\.js$/)
  assert.equal(await uploads[0].text(), 'app.on("update", () => {})')
  const created = await call('POST', '/apps', { name: 'Test', model: 'script-only', script: uploaded.json().url })
  assert.equal(created.statusCode, 201)
  assert.equal((await call('GET', `/apps/${created.json().id}`)).json().script, uploaded.json().url)
  const schema = (await call('GET', '/openapi.json', undefined, 'reader')).json()
  assert.equal(schema.paths['/entities/{id}'].patch.operationId, 'updateEntity')
  assert.equal(schema.components.securitySchemes.bearerAuth.scheme, 'bearer')
})
