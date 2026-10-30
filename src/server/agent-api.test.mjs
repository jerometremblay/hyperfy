import assert from 'node:assert/strict'
import test from 'node:test'
import Fastify from 'fastify'
import { agentAPI } from './agent-api.js'

async function setup(t, tokens = { readToken: 'reader', writeToken: 'writer' }) {
  const blueprints = new Map([['box', { id: 'box', version: 0, model: 'script-only', props: {} }]])
  const items = new Map()
  const players = new Map()
  const sockets = new Map([['player-owner', {}]])
  const playerData = { id: 'player-1', type: 'player', owner: 'player-owner', name: 'Jerome', position: [0, 0, 0] }
  players.set(playerData.id, { data: playerData, isPlayer: true })
  const sent = []
  const sentTo = []
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
      players,
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
    network: {
      send: (...args) => sent.push(args),
      sendTo: (...args) => sentTo.push(args),
      sockets,
      dirtyBlueprints: new Set(),
      dirtyApps: new Set(),
    },
  }
  const uploads = []
  const assets = { exists: async () => true, upload: async file => uploads.push(file) }
  const server = Fastify()
  server.register(agentAPI, { prefix: '/api/agent', world, assets, ...tokens })
  t.after(() => server.close())
  await server.ready()
  const call = (method, path, payload, token = 'writer') =>
    server.inject({ method, url: `/api/agent${path}`, payload, headers: { authorization: `Bearer ${token}` } })
  return { server, call, world, sent, sentTo, sockets, uploads }
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

test('speaker sessions require write access, an app instance and configured LiveKit', async t => {
  const { call, world } = await setup(t)
  const created = (await call('POST', '/entities', { blueprint: 'box' })).json()
  const endpoint = `/entities/${created.id}/speaker-session`
  assert.equal((await call('POST', endpoint, {}, 'reader')).statusCode, 403)
  assert.equal((await call('POST', endpoint, {}, 'wrong')).statusCode, 401)
  assert.equal((await call('POST', '/entities/missing/speaker-session', {})).statusCode, 404)
  assert.equal((await call('POST', endpoint, {})).statusCode, 503)
  world.livekit = { enabled: true, createSpeakerSession: async id => ({ entityId: id, token: 'audio-token' }) }
  const session = await call('POST', endpoint, {})
  assert.equal(session.statusCode, 200)
  assert.deepEqual(session.json(), { entityId: created.id, token: 'audio-token' })
  assert.equal(session.headers['cache-control'], 'no-store')
  assert.equal((await call('POST', endpoint, { unexpected: true })).statusCode, 400)
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

test('write-only player inspection and teleport target connected players', async t => {
  const { call, world, sentTo, sockets } = await setup(t)
  assert.equal((await call('GET', '/players', undefined, 'reader')).statusCode, 403)
  assert.deepEqual((await call('GET', '/players')).json(), [{ id: 'player-1', name: 'Jerome', position: [0, 0, 0] }])
  assert.equal((await call('POST', '/players/missing/teleport', { position: [1, 2, 3] })).statusCode, 404)
  assert.equal(
    (await call('POST', '/players/player-1/teleport', { position: [1, 2, 3], unexpected: true })).statusCode,
    400
  )
  const moved = await call('POST', '/players/player-1/teleport', {
    position: [4, 5, 6],
    rotationY: 1.25,
  })
  assert.equal(moved.statusCode, 200)
  assert.deepEqual(moved.json(), { id: 'player-1', name: 'Jerome', position: [4, 5, 6], rotationY: 1.25 })
  assert.deepEqual(sentTo, [['player-owner', 'playerTeleport', { position: [4, 5, 6], rotationY: 1.25 }]])
  assert.equal(world.network.dirtyApps.size, 0)
  world.entities.players.get('player-1').data.effect = { anchorId: 'seat-1' }
  assert.equal((await call('POST', '/players/player-1/teleport', { position: [1, 2, 3] })).statusCode, 409)
  world.entities.players.get('player-1').data.effect = null
  sockets.delete('player-owner')
  assert.equal((await call('POST', '/players/player-1/teleport', { position: [1, 2, 3] })).statusCode, 409)
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
  assert.equal(schema.paths['/players'].get.operationId, 'listPlayers')
  assert.equal(schema.paths['/players/{id}/teleport'].post.responses['200'].description, 'Success')
  assert.equal(schema.components.securitySchemes.bearerAuth.scheme, 'bearer')
})

test('profiling requires write permission and controls only connected admin clients', async t => {
  const { call, world, sockets, sentTo } = await setup(t)
  assert.equal((await call('GET', '/profiling', undefined, 'reader')).statusCode, 403)
  assert.equal((await call('GET', '/profiling')).statusCode, 200)
  assert.equal((await call('GET', '/profiling')).json().clients.length, 0)
  assert.equal((await call('POST', '/players/missing/profiling', { enabled: true })).statusCode, 404)
  const player = world.entities.players.get('player-1')
  player.isAdmin = () => false
  sockets.set('player-owner', { player })
  assert.equal((await call('POST', '/players/player-1/profiling', { enabled: true })).statusCode, 403)
  player.isAdmin = () => true
  assert.equal((await call('POST', '/players/player-1/profiling', { enabled: 'yes' })).statusCode, 400)
  assert.equal((await call('POST', '/players/player-1/profiling', { enabled: true, unexpected: true })).statusCode, 400)
  const enabled = await call('POST', '/players/player-1/profiling', { enabled: true })
  assert.equal(enabled.statusCode, 202)
  assert.deepEqual(enabled.json(), { playerId: 'player-1', enabled: true, status: 'requested' })
  assert.deepEqual(sentTo, [['player-owner', 'profilerControl', { enabled: true }]])
  assert.equal((await call('POST', '/players/player-1/profiling', { enabled: false })).statusCode, 202)
  const schema = (await call('GET', '/openapi.json')).json()
  assert.ok(schema.paths['/profiling'].get)
  assert.ok(schema.paths['/players/{id}/profiling'].post)
})

test('server profiling requires write access and returns server samples separately', async t => {
  const { call, world } = await setup(t)
  assert.equal((await call('POST', '/profiling', { enabled: true }, 'reader')).statusCode, 403)
  assert.equal((await call('POST', '/profiling', { enabled: true })).statusCode, 503)
  let enabled = false
  world.profiler = {
    toggle(value) {
      enabled = value
      return value
    },
    getReport({ entityId }) {
      return { source: 'server', active: enabled, rows: entityId ? [{ id: entityId }] : [] }
    },
  }
  assert.equal((await call('POST', '/profiling', { enabled: 'yes' })).statusCode, 400)
  assert.deepEqual((await call('POST', '/profiling', { enabled: true })).json(), { source: 'server', enabled: true })
  const report = (await call('GET', '/profiling?entityId=a')).json()
  assert.deepEqual(report.server, { source: 'server', active: true, rows: [{ id: 'a' }] })
  assert.deepEqual(report.clients, [])
  assert.deepEqual((await call('POST', '/profiling', { enabled: false })).json(), { source: 'server', enabled: false })
})
