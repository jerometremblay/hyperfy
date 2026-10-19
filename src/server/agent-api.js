import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { isEqual } from 'lodash-es'

const vector = length => ({ type: 'array', items: { type: 'number' }, minItems: length, maxItems: length })
const transform = { position: vector(3), quaternion: vector(4), scale: vector(3), pinned: { type: 'boolean' } }
const asset = { type: 'string', pattern: '^asset://[a-f0-9]{64}\\.[a-z0-9]+$' }
const externalAsset = { type: 'string', pattern: '^[Hh][Tt][Tt][Pp][Ss]?://' }
const sourceAsset = { anyOf: [asset, externalAsset] }
const optionalString = { anyOf: [{ type: 'string' }, { type: 'null' }] }
const descriptor = {
  anyOf: [
    { type: 'object', properties: { type: { type: 'string' }, name: { type: 'string' }, url: sourceAsset }, required: ['url'] },
    { type: 'null' },
  ],
}
const blueprintFields = {
  name: { type: 'string', maxLength: 256 },
  desc: { anyOf: [{ type: 'string', maxLength: 4096 }, { type: 'null' }] },
  model: { anyOf: [sourceAsset, { const: 'script-only' }, { type: 'null' }] },
  script: { anyOf: [sourceAsset, { type: 'null' }] },
  image: descriptor,
  author: optionalString,
  url: optionalString,
  props: { anyOf: [{ type: 'object' }, { type: 'null' }] },
  preload: { type: 'boolean' },
  public: { type: 'boolean' },
  locked: { type: 'boolean' },
  unique: { type: 'boolean' },
  frozen: { type: 'boolean' },
  disabled: { type: 'boolean' },
}
const body = (properties, required = []) => ({ type: 'object', additionalProperties: false, properties, required })
const params = body({ id: { type: 'string', minLength: 1 } }, ['id'])
const uuid = { type: 'string', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' }
const spawn = {
  type: 'object',
  additionalProperties: false,
  properties: { position: vector(3), quaternion: vector(4) },
  required: ['position', 'quaternion'],
}
const settingsFields = {
  title: { anyOf: [{ type: 'string', maxLength: 256 }, { type: 'null' }] },
  desc: { anyOf: [{ type: 'string', maxLength: 4096 }, { type: 'null' }] },
  image: descriptor,
  avatar: descriptor,
  dayNightCycle: { type: 'boolean' },
  constellationLines: { type: 'boolean' },
  skyAppearance: { type: 'number', minimum: 0, maximum: 100 },
  bortleClass: { type: 'integer', minimum: 1, maximum: 9 },
  latitude: { type: 'number', minimum: -90, maximum: 90 },
  longitude: { type: 'number', minimum: -180, maximum: 180 },
  timeZone: { type: 'string', minLength: 1 },
}

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
  const hasOtherInstance = (blueprintId, excludedId) =>
    [...world.entities.items.values()].some(
      item => item.isApp && item.data.blueprint === blueprintId && item.data.id !== excludedId
    )
  const checkAssets = async data => {
    const urls = new Set()
    const visit = value => {
      if (typeof value === 'string' && value.startsWith('asset://')) urls.add(value)
      else if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') Object.values(value).forEach(visit)
    }
    visit(data)
    for (const url of urls) {
      if (!/^asset:\/\/[a-f0-9]{64}\.[a-z0-9]+$/.test(url)) fail(400, 'Invalid asset URL')
      if (!(await assets.exists(url.slice(8)))) fail(400, 'Asset not found: ' + url)
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
    spawn: world.network.spawn,
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
  route('POST', '/apps', 'createApp', { body: body({ id: uuid, ...blueprintFields }, ['name', 'model']) }, async (request, reply) => {
    await checkAssets(request.body)
    const { id: requestedId, ...fields } = request.body
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
      frozen: false,
      scene: false,
      disabled: false,
      ...fields,
      id: requestedId || randomUUID(),
      version: 0,
    }
    if (data.id === '$scene') fail(409, 'The protected scene blueprint cannot be created as an app')
    const existing = world.blueprints.get(data.id)
    if (existing) {
      const same = Object.keys(blueprintFields).every(key => isEqual(existing[key], data[key]))
      if (existing.scene || !same) fail(409, 'App blueprint id already exists')
      return reply.code(200).send(existing)
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
    'PATCH',
    '/world/scene',
    'updateSceneBlueprint',
    { body: body({ ...blueprintFields, version: { type: 'integer', minimum: 0 } }, ['version']) },
    async request => {
      const current = world.blueprints.get('$scene')
      if (!current?.scene) fail(404, 'Protected scene blueprint not found')
      const currentVersion = Number.isInteger(current.version) && current.version >= 0 ? current.version : 0
      if (request.body.version !== currentVersion) fail(409, 'Scene blueprint version changed; fetch it again')
      const fields = { ...request.body }
      delete fields.version
      await checkAssets(fields)
      const data = { ...fields, id: '$scene', version: currentVersion + 1, scene: true }
      world.blueprints.modify(data)
      world.network.send('blueprintModified', data)
      world.network.dirtyBlueprints.add(data.id)
      return world.blueprints.get('$scene')
    }
  )
  route(
    'PATCH',
    '/world',
    'updateWorld',
    { body: body({ settings: body(settingsFields), spawn }) },
    async request => {
      const settings = request.body.settings || {}
      await checkAssets(settings)
      if (settings.timeZone) {
        try {
          new Intl.DateTimeFormat('en', { timeZone: settings.timeZone })
        } catch {
          fail(400, 'Invalid timeZone')
        }
      }
      if (request.body.spawn) checkTransform({ ...request.body.spawn, scale: [1, 1, 1] })
      for (const [key, value] of Object.entries(settings)) {
        if (world.settings.set(key, value, true) === false) fail(400, 'Invalid setting: ' + key)
      }
      if (Object.keys(settings).length) await world.network.saveSettings()
      if (request.body.spawn) await world.network.setSpawn(request.body.spawn)
      return { settings: world.settings.serialize(), spawn: world.network.spawn }
    }
  )
  route(
    'POST',
    '/entities',
    'createEntity',
    { body: body({ id: uuid, blueprint: { type: 'string' }, ...transform }, ['blueprint']) },
    async (request, reply) => {
      const blueprint = app(request.body.blueprint)
      if (blueprint.scene || blueprint.id === '$scene') fail(409, 'Cannot instantiate the protected scene blueprint')
      checkTransform(request.body)
      const requestedId = request.body.id
      if (blueprint.unique && hasOtherInstance(blueprint.id, requestedId)) {
        fail(409, 'Unique blueprint already has another app instance')
      }
      const desired = {
        position: [0, 0, 0],
        quaternion: [0, 0, 0, 1],
        scale: [1, 1, 1],
        pinned: false,
        ...request.body,
      }
      const existing = requestedId && world.entities.get(requestedId)
      if (existing) {
        const same = ['blueprint', 'position', 'quaternion', 'scale', 'pinned'].every(key =>
          isEqual(existing.data[key], desired[key])
        )
        if (!existing.isApp || !same) fail(409, 'App instance id already exists')
        return reply.code(200).send(existing.serialize())
      }
      const data = {
        position: [0, 0, 0],
        quaternion: [0, 0, 0, 1],
        scale: [1, 1, 1],
        pinned: false,
        ...desired,
        id: requestedId || randomUUID(),
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
  route(
    'PATCH',
    '/entities/:id',
    'updateEntity',
    { params, body: body({ blueprint: { type: 'string' }, ...transform }) },
    async request => {
      const item = entity(request.params.id)
      if (item.data.mover || item.data.uploader) fail(409, 'Instance is being edited or uploaded')
      checkTransform(request.body)
      if (Object.hasOwn(request.body, 'blueprint')) {
        const blueprint = app(request.body.blueprint)
        if (blueprint.scene || blueprint.id === '$scene') fail(409, 'Cannot assign the protected scene blueprint')
        if (blueprint.unique && hasOtherInstance(blueprint.id, item.data.id)) {
          fail(409, 'Unique blueprint already has another app instance')
        }
      }
      const changes = { ...request.body, id: item.data.id }
      if (changes.blueprint && changes.blueprint !== item.data.blueprint) changes.state = {}
      item.modify(changes)
      world.network.send('entityModified', changes)
      world.network.dirtyApps.add(item.data.id)
      return item.serialize()
    }
  )
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
    '/assets',
    'uploadAsset',
    {},
    async (request, reply) => {
      const part = await request.file({ limits: { files: 1, fileSize: 256 * 1024 * 1024 } })
      if (!part) fail(400, 'Asset file is required')
      const match = /^([a-f0-9]{64})[.]([a-z0-9]+)$/.exec(part.filename)
      if (!match) fail(400, 'Asset filename must be a content hash and extension')
      let bytes
      try {
        bytes = await part.toBuffer()
      } catch {
        fail(413, 'Asset exceeds the 256 MiB upload limit')
      }
      if (createHash('sha256').update(bytes).digest('hex') !== match[1]) {
        fail(400, 'Asset content hash does not match its filename')
      }
      await assets.upload(new File([bytes], part.filename, { type: part.mimetype || 'application/octet-stream' }))
      return reply.code(201).send({ url: 'asset://' + part.filename })
    }
  )
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
                ...(item.url === '/assets'
                  ? {
                      requestBody: {
                        required: true,
                        content: {
                          'multipart/form-data': {
                            schema: {
                              type: 'object',
                              properties: { file: { type: 'string', format: 'binary' } },
                              required: ['file'],
                            },
                          },
                        },
                      },
                    }
                  : {}),
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
