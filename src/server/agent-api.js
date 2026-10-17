import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'

const vector = length => ({ type: 'array', items: { type: 'number' }, minItems: length, maxItems: length })
const transform = { position: vector(3), quaternion: vector(4), scale: vector(3), pinned: { type: 'boolean' } }
const asset = { type: 'string', pattern: '^asset://[a-f0-9]{64}\\.[a-z0-9]+$' }
const blueprintFields = {
  name: { type: 'string', maxLength: 256 },
  desc: { type: 'string', maxLength: 4096 },
  model: { anyOf: [asset, { const: 'script-only' }] },
  script: { anyOf: [asset, { type: 'null' }] },
  props: { type: 'object' },
  disabled: { type: 'boolean' },
}
const body = (properties, required = []) => ({ type: 'object', additionalProperties: false, properties, required })
const params = body({ id: { type: 'string', minLength: 1 } }, ['id'])

// One registration per running world. Tokens are never exposed through public envs.
export async function agentAPI(fastify, { world, assets, readToken, writeToken }) {
  if (!readToken && !writeToken) return
  const digest = value => createHash('sha256').update(value).digest()
  const matches = (value, token) => Boolean(token) && timingSafeEqual(digest(value), digest(token))
  fastify.addHook('onRequest', async (request, reply) => {
    reply.header('Cache-Control', 'no-store')
    const authorization = request.headers.authorization || ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    const writer = matches(token, writeToken)
    request.agentWrite = writer
    if (!writer && !matches(token, readToken)) {
      return reply.code(401).header('WWW-Authenticate', 'Bearer').send({ error: 'Invalid agent token' })
    }
    if (!['GET', 'HEAD'].includes(request.method) && !writer) {
      return reply.code(403).send({ error: 'Write token required' })
    }
  })
  fastify.setErrorHandler((error, request, reply) => {
    const status = error.validation ? 400 : error.statusCode || 500
    if (status >= 500) request.log.error(error)
    reply.code(status).send({ error: status >= 500 ? 'Agent API operation failed' : error.message })
  })
  const fail = (statusCode, message) => {
    throw Object.assign(new Error(message), { statusCode })
  }
  const app = id => world.blueprints.get(id) || fail(404, 'App blueprint not found')
  const entity = id => {
    const value = world.entities.get(id)
    if (!value?.isApp) fail(404, 'App instance not found')
    if (value.data.blueprint === '$scene' || world.blueprints.get(value.data.blueprint)?.scene)
      fail(409, 'Scene instance is protected')
    return value
  }
  const checkAssets = async data => {
    for (const field of ['model', 'script']) {
      const url = data[field]
      if (url && url !== 'script-only' && !(await assets.exists(url.slice(8)))) fail(400, `${field} asset not found`)
    }
  }
  const checkTransform = data => {
    if (data.quaternion && Math.abs(Math.hypot(...data.quaternion) - 1) > 0.001)
      fail(400, 'Quaternion must be normalized')
    if (data.scale?.some(value => value <= 0)) fail(400, 'Scale must be positive')
  }
  const routes = []
  const route = (method, url, operationId, schema, handler, successStatus) => {
    routes.push({ method, url, operationId, schema, successStatus })
    fastify.route({
      method,
      url,
      schema,
      handler,
      preValidation: async request => {
        if (
          schema.body &&
          request.body &&
          Object.keys(request.body).some(key => !Object.hasOwn(schema.body.properties, key))
        ) {
          fail(400, 'Unknown request field')
        }
      },
    })
  }
  route('GET', '/world', 'getWorld', {}, async () => ({
    settings: world.settings.serialize(),
    apps: world.blueprints.items.size,
    entities: world.entities.items.size,
    players: world.entities.players.size,
  }))
  route('GET', '/apps', 'listApps', {}, async () => world.blueprints.serialize())
  route('GET', '/apps/:id', 'getApp', { params }, async request => app(request.params.id))
  route('GET', '/entities', 'listEntities', {}, async () =>
    [...world.entities.items.values()].filter(item => item.isApp).map(item => item.serialize())
  )
  route('GET', '/players', 'listPlayers', {}, async request => {
    if (!request.agentWrite) fail(403, 'Write token required')
    return [...world.entities.players.values()]
      .filter(player => world.network.sockets.has(player.data.owner))
      .map(player => ({
        id: player.data.id,
        name: player.data.name,
        position: player.data.position,
      }))
  })
  route('GET', '/entities/:id', 'getEntity', { params }, async request => entity(request.params.id).serialize())
  route('POST', '/apps', 'createApp', { body: body(blueprintFields, ['name', 'model']) }, async (request, reply) => {
    await checkAssets(request.body)
    const data = {
      image: null,
      author: null,
      url: null,
      desc: '',
      script: null,
      props: {},
      preload: false,
      public: false,
      locked: false,
      unique: false,
      scene: false,
      disabled: false,
      ...request.body,
      id: randomUUID(),
      version: 0,
    }
    world.blueprints.add(data)
    world.network.send('blueprintAdded', data)
    world.network.dirtyBlueprints.add(data.id)
    return reply.code(201).send(data)
  })
  route(
    'PATCH',
    '/apps/:id',
    'updateApp',
    { params, body: body({ ...blueprintFields, version: { type: 'integer', minimum: 0 } }, ['version']) },
    async request => {
      await checkAssets(request.body)
      const current = app(request.params.id)
      if (current.id === '$scene' || current.scene) fail(409, 'Scene blueprint is protected')
      if (request.body.version !== current.version) fail(409, 'Blueprint version changed; fetch it again')
      const data = { ...request.body, id: current.id, version: current.version + 1 }
      world.blueprints.modify(data)
      world.network.send('blueprintModified', data)
      world.network.dirtyBlueprints.add(data.id)
      return app(data.id)
    }
  )
  route(
    'POST',
    '/entities',
    'createEntity',
    { body: body({ blueprint: { type: 'string' }, ...transform }, ['blueprint']) },
    async (request, reply) => {
      const blueprint = app(request.body.blueprint)
      if (blueprint.scene || blueprint.unique || blueprint.id === '$scene')
        fail(409, 'Cannot instantiate scene or unique blueprint')
      checkTransform(request.body)
      const data = {
        position: [0, 0, 0],
        quaternion: [0, 0, 0, 1],
        scale: [1, 1, 1],
        pinned: false,
        ...request.body,
        id: randomUUID(),
        type: 'app',
        mover: null,
        uploader: null,
        state: {},
      }
      const created = world.entities.add(data)
      world.network.send('entityAdded', data)
      world.network.dirtyApps.add(data.id)
      return reply.code(201).send(created.serialize())
    }
  )
  route('PATCH', '/entities/:id', 'updateEntity', { params, body: body(transform) }, async request => {
    const item = entity(request.params.id)
    if (item.data.mover || item.data.uploader) fail(409, 'Instance is being edited or uploaded')
    checkTransform(request.body)
    const changes = { ...request.body, id: item.data.id }
    item.modify(changes)
    world.network.send('entityModified', changes)
    world.network.dirtyApps.add(item.data.id)
    return item.serialize()
  })
  route(
    'POST',
    '/players/:id/teleport',
    'teleportPlayer',
    { params, body: body({ position: vector(3), rotationY: { type: 'number' } }, ['position']) },
    async request => {
      const target = world.entities.players.get(request.params.id)
      if (!target?.isPlayer) fail(404, 'Player not found')
      if (!world.network.sockets.has(target.data.owner)) fail(409, 'Player is not connected')
      if (target.data.effect?.anchorId) fail(409, 'Player is seated')
      const data = {
        position: request.body.position,
        ...(Object.hasOwn(request.body, 'rotationY') ? { rotationY: request.body.rotationY } : {}),
      }
      world.network.sendTo(target.data.owner, 'playerTeleport', data)
      return { id: target.data.id, name: target.data.name, ...data }
    },
    200
  )
  route('DELETE', '/entities/:id', 'deleteEntity', { params }, async (request, reply) => {
    const item = entity(request.params.id)
    if (item.data.mover || item.data.uploader) fail(409, 'Instance is being edited or uploaded')
    world.entities.remove(item.data.id)
    world.network.send('entityRemoved', item.data.id)
    world.network.dirtyApps.add(item.data.id)
    return reply.code(204).send()
  })
  route(
    'POST',
    '/scripts',
    'uploadScript',
    { body: body({ source: { type: 'string', maxLength: 262144 } }, ['source']) },
    async (request, reply) => {
      const source = request.body.source
      const filename = `${createHash('sha256').update(source).digest('hex')}.js`
      await assets.upload(new File([source], filename, { type: 'text/javascript' }))
      return reply.code(201).send({ url: `asset://${filename}` })
    }
  )
  route('GET', '/openapi.json', 'getOpenAPI', {}, async () => ({
    openapi: '3.1.0',
    info: { title: 'Hyperfy Agent API', version: '1.0.0' },
    servers: [{ url: '/api/agent' }],
    security: [{ bearerAuth: [] }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } },
    paths: Object.fromEntries(
      [...new Set(routes.map(item => item.url))].map(url => [
        url.replace(':id', '{id}'),
        Object.fromEntries(
          routes
            .filter(item => item.url === url)
            .map(item => [
              item.method.toLowerCase(),
              {
                operationId: item.operationId,
                ...(item.schema.params
                  ? { parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
                  : {}),
                ...(item.schema.body
                  ? { requestBody: { required: true, content: { 'application/json': { schema: item.schema.body } } } }
                  : {}),
                responses: {
                  [item.successStatus || (item.method === 'POST' ? '201' : item.method === 'DELETE' ? '204' : '200')]: {
                    description: 'Success',
                  },
                  400: { description: 'Invalid request' },
                  401: { description: 'Invalid token' },
                  403: { description: 'Write token required' },
                  404: { description: 'Not found' },
                  409: { description: 'Conflict' },
                },
              },
            ])
        ),
      ])
    ),
  }))
}
