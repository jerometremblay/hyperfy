import { waitForReplacement } from '../core/extras/appTools'
import { randomUUID } from 'node:crypto'
import { cloneDeep, isEqual } from 'lodash-es'
import { readJWT } from '../core/utils-server'
import {
  canonical,
  implementationDescriptor,
  mergePublishedProps,
  publishedExpectation,
} from '../core/extras/publishedObjects'
import { PublishedSourceResolver, digest, sourceURL } from './PublishedSourceResolver'

function fail(message) {
  throw new Error(message)
}
const blueprintKeys = [
  'name',
  'image',
  'author',
  'url',
  'desc',
  'model',
  'script',
  'props',
  'preload',
  'public',
  'locked',
  'frozen',
  'unique',
  'disabled',
]
const fingerprint = bp => digest(canonical(implementationDescriptor(bp)))

export class PublishedObjects {
  constructor(world, assets, resolver = new PublishedSourceResolver()) {
    this.world = world
    this.assets = assets
    this.resolver = resolver
    this.sessions = new WeakMap()
    this.locks = new Set()
    this.inFlight = new Set()
  }
  session(socket) {
    let session = this.sessions.get(socket)
    if (!session) {
      session = { prepared: new Map(), undo: new Map(), outcomes: new Map(), committing: new Map(), requests: [] }
      this.sessions.set(socket, session)
    }
    for (const [id, item] of session.prepared) if (item.expires < Date.now()) session.prepared.delete(id)
    return session
  }
  authorize(socket) {
    if (!socket?.player?.isBuilder() || this.world.network.sockets.get(socket.id) !== socket)
      fail('Builder permission and an active world connection are required.')
  }
  app(id) {
    const app = this.world.entities.get(id)
    if (!app?.isApp || app.destroyed || app.blueprint?.scene || id === '$scene')
      fail('This app is no longer available.')
    if (app.building || app.data.mover || app.data.uploader || this.locks.has(id))
      fail('Wait for this app to finish loading, moving or updating.')
    return app
  }
  expected(app, expected) {
    if (typeof expected !== 'string' || publishedExpectation(app, this.world.blueprints) !== expected)
      fail('This app changed. Check again before retrying.')
  }
  async persist(app, blueprint) {
    const db = this.world.network.db
    const now = new Date().toISOString()
    await db.transaction(async trx => {
      if (blueprint)
        await trx('blueprints')
          .insert({ id: blueprint.id, data: JSON.stringify(blueprint), createdAt: now, updatedAt: now })
          .onConflict('id')
          .merge({ data: JSON.stringify(blueprint), updatedAt: now })
      await trx('entities')
        .insert({ id: app.data.id, data: JSON.stringify(app.data), createdAt: now, updatedAt: now })
        .onConflict('id')
        .merge({ data: JSON.stringify(app.data), updatedAt: now })
    })
  }
  async link(socket, data) {
    this.authorize(socket)
    const app = this.app(data.id)
    this.expected(app, data.expected)
    const published = data.url ? { schemaVersion: 1, sourceUrl: sourceURL(data.url), verified: false } : null
    const change = { id: app.data.id, published, publishedRevision: (app.data.publishedRevision || 0) + 1 }
    const previous = {
      published: cloneDeep(app.data.published ?? null),
      publishedRevision: app.data.publishedRevision || 0,
    }
    this.locks.add(app.data.id)
    try {
      await app.modify(change)
      await this.persist(app)
      let warning
      try {
        this.world.network.send('entityModified', change)
      } catch {
        warning = 'Source association saved; an observer must reconnect to synchronize.'
      }
      return { change, warning }
    } catch (error) {
      await app.modify(previous)
      throw error
    } finally {
      this.locks.delete(app.data.id)
    }
  }
  async check(socket, data) {
    this.authorize(socket)
    const session = this.session(socket)
    session.requests = session.requests.filter(time => time > Date.now() - 60000)
    if (data.force && session.requests.length >= 6) fail('Too many source checks. Retry in a minute.')
    if (data.force) session.requests.push(Date.now())
    const url = sourceURL(data.url)
    await this.resolver.check(url, !!data.force)
    return this.resolver.status(url)
  }
  async prepare(socket, data) {
    this.authorize(socket)
    const session = this.session(socket)
    if (session.prepared.size >= 4) fail('Too many pending installs. Retry in two minutes.')
    const app = data.id ? this.app(data.id) : null
    if (app) this.expected(app, data.expected)
    const url = sourceURL(app ? app.data.published?.sourceUrl : data.url)
    const candidate = await this.resolver.check(url, false, true)
    this.authorize(socket)
    if (candidate.error || !candidate.info) fail(candidate.error || 'Check the source before installing.')
    if (app) {
      this.app(app.data.id)
      this.expected(app, data.expected)
    }
    if (app?.data.published?.verified && app.data.published.installedHash === candidate.hash) return { current: true }
    const previousBP = app && cloneDeep(this.world.blueprints.get(app.data.blueprint))
    const published = app?.data.published
    const modified =
      !!published?.baselineImplementationFingerprint &&
      published.baselineImplementationFingerprint !== fingerprint(previousBP)
    if ((modified || (app && !published?.verified)) && !data.confirm)
      return {
        confirmation: modified
          ? 'Local implementation edits will be replaced.'
          : 'The installed object has unverified provenance. Its implementation will be replaced.',
      }
    const imported = candidate.info.blueprint
    const blueprint = Object.fromEntries(
      blueprintKeys.filter(key => Object.hasOwn(imported, key)).map(key => [key, cloneDeep(imported[key])])
    )
    Object.assign(blueprint, { id: randomUUID(), version: 0, scene: false })
    const merge = mergePublishedProps(
      previousBP?.props || {},
      published?.verified ? published.baselineProps : null,
      imported.props
    )
    blueprint.props = merge.props
    // Overrides may reference older installed assets; they must still exist locally.
    for (const value of Object.values(blueprint.props))
      if (value?.url && !candidate.info.assets.some(asset => asset.url === value.url)) {
        if (!(await this.assets.exists(value.url.slice(8))))
          fail('A locally configured asset is missing. Restore it or reset the property.')
      }
    for (const asset of candidate.info.assets) await this.assets.upload(asset.file)
    this.authorize(socket)
    if (app) {
      this.app(app.data.id)
      this.expected(app, data.expected)
    }
    const tracking = {
      schemaVersion: 1,
      sourceUrl: url,
      verified: true,
      installedHash: candidate.hash,
      baselineProps: cloneDeep(imported.props),
      baselineImplementationFingerprint: fingerprint(blueprint),
    }
    const change = {
      id: app?.data.id || randomUUID(),
      blueprint: blueprint.id,
      state: {},
      published: tracking,
      publishedRevision: (app?.data.publishedRevision || 0) + 1,
    }
    if (!app) {
      const validVector = (v, n) => Array.isArray(v) && v.length === n && v.every(Number.isFinite)
      if (!validVector(data.position, 3) || !validVector(data.quaternion, 4)) fail('Invalid placement.')
      Object.assign(change, {
        type: 'app',
        position: data.position,
        quaternion: data.quaternion,
        scale: [1, 1, 1],
        pinned: false,
        mover: null,
        uploader: null,
      })
    }
    const token = randomUUID()
    session.prepared.set(token, {
      expires: Date.now() + 120000,
      id: app?.data.id,
      expected: data.expected,
      blueprint,
      change,
      hash: candidate.hash,
      url,
      previousBP,
      previous: app && {
        blueprint: app.data.blueprint,
        state: cloneDeep(app.data.state || {}),
        published: cloneDeep(app.data.published ?? null),
        publishedRevision: app.data.publishedRevision || 0,
      },
    })
    return { token, blueprint, change, reset: merge.reset }
  }
  async commit(socket, data) {
    this.authorize(socket)
    const session = this.session(socket)
    if (session.committing.has(data.token)) return session.committing.get(data.token)
    const operation = this.commitPrepared(socket, data)
    session.committing.set(data.token, operation)
    try {
      return await operation
    } finally {
      session.committing.delete(data.token)
    }
  }
  async commitPrepared(socket, { token, undo = false, stateSnapshot }) {
    this.authorize(socket)
    const session = this.session(socket)
    const records = undo ? session.undo : session.prepared
    if (session.outcomes.has(token)) return session.outcomes.get(token)
    const record = records.get(token)
    if (!record) fail('This installation has expired or belongs to another session.')
    let app = record.id ? this.app(record.id) : null
    if (app) this.expected(app, record.expected)
    if (!undo) {
      const source = this.resolver.cache.get(record.url)
      if (source?.hash !== record.hash || source.error) fail('The source candidate changed. Check again.')
    }
    let blueprint = cloneDeep(record.blueprint)
    let change = cloneDeep(record.change)
    if (undo) {
      blueprint = cloneDeep(record.previousBP)
      if (!isEqual(this.world.blueprints.get(blueprint.id), blueprint)) blueprint.id = randomUUID()
      change = {
        id: record.id,
        ...cloneDeep(record.previous),
        blueprint: blueprint.id,
        publishedRevision: (app.data.publishedRevision || 0) + 1,
      }
    }
    const id = change.id
    const previous = app && {
      blueprint: app.data.blueprint,
      state: cloneDeep(app.data.state || {}),
      published: cloneDeep(app.data.published ?? null),
      publishedRevision: app.data.publishedRevision || 0,
    }
    const placement =
      app &&
      Object.fromEntries(['position', 'quaternion', 'scale', 'pinned'].map(key => [key, cloneDeep(app.data[key])]))
    this.locks.add(id)
    this.world.blueprints.add(blueprint)
    try {
      if (app) {
        app.scriptError = null
        app.loadError = null
        await waitForReplacement(app.modify(change))
      } else {
        app = this.world.entities.add(cloneDeep(change))
        // The constructor starts the first build; wait for that exact build.
        await waitForReplacement(app.buildPromise)
      }
      if (app.scriptError || app.loadError || app.destroyed)
        fail('The app failed to load. The previous installation has been restored.')
      if (placement && Object.keys(placement).some(key => !isEqual(app.data[key], placement[key])))
        fail('The updated app changed its placement while loading.')
      if (!undo) {
        const latest = this.resolver.cache.get(record.url)
        if (latest?.hash !== record.hash || latest.error)
          fail('The source candidate changed while loading. Check again.')
      }
      this.authorize(socket)
      await this.persist(app, blueprint)
      let warning
      try {
        this.world.network.send('blueprintAdded', blueprint, socket.id)
        this.world.network.send(record.id ? 'entityModified' : 'entityAdded', change, socket.id)
      } catch {
        warning = 'Installation saved; an observer must reconnect to synchronize.'
      }
      records.delete(token)
      let undoToken
      if (!undo && record.id) {
        undoToken = randomUUID()
        session.undo.set(undoToken, {
          ...record,
          expected: publishedExpectation(app, this.world.blueprints),
          previous: {
            ...previous,
            state:
              stateSnapshot && typeof stateSnapshot === 'object' && !Array.isArray(stateSnapshot)
                ? cloneDeep(stateSnapshot)
                : previous.state,
          },
        })
        while (session.undo.size > 50) session.undo.delete(session.undo.keys().next().value)
      }
      if (undo) {
        const restored = publishedExpectation(app, this.world.blueprints)
        const withoutRevision = value => {
          const parsed = JSON.parse(value)
          delete parsed.revision
          return canonical(parsed)
        }
        for (const item of session.undo.values())
          if (withoutRevision(item.expected) === withoutRevision(restored)) item.expected = restored
      }
      const result = { blueprint, change, undoToken, created: !record.id, warning }
      session.outcomes.set(token, result)
      while (session.outcomes.size > 100) session.outcomes.delete(session.outcomes.keys().next().value)
      return result
    } catch (error) {
      if (previous && !app.destroyed) await waitForReplacement(app.modify({ ...previous, ...placement }))
      else if (!previous && app) app.destroy()
      throw error
    } finally {
      this.locks.delete(id)
    }
  }
  async cancel(socket, { token }) {
    this.authorize(socket)
    this.session(socket).prepared.delete(token)
    return { ok: true }
  }
  async settled() {
    while (this.inFlight.size) await Promise.allSettled([...this.inFlight])
  }
  track(promise) {
    this.inFlight.add(promise)
    promise.finally(() => this.inFlight.delete(promise)).catch(() => {})
    return promise
  }
}

export async function publishedObjectsAPI(fastify, { world, assets, maxBytes }) {
  const service = new PublishedObjects(
    world,
    assets,
    new PublishedSourceResolver({
      maxBytes,
      interval: Math.max(60000, Number(process.env.PUBLISHED_CHECK_INTERVAL_MS) || 6 * 3600000),
    })
  )
  world.network.publishedObjects = service
  fastify.addHook('onClose', async () => service.resolver.destroy())
  service.resolver.start(() =>
    [...world.entities.items.values()].map(app => app.data.published?.sourceUrl).filter(Boolean)
  )
  const authorize = async request => {
    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
    if (!token) fail('Builder authentication is required.')
    const identity = await readJWT(token)
    if (!identity?.userId) fail('Builder authentication is invalid.')
    const { userId } = identity
    const socket = world.network.sockets.get(userId)
    service.authorize(socket)
    return socket
  }
  for (const operation of ['link', 'check', 'prepare', 'commit', 'undo', 'cancel'])
    fastify.post(`/api/published/${operation}`, { bodyLimit: 1024 * 1024 }, async (request, reply) => {
      try {
        const socket = await authorize(request)
        const data = request.body
        if (!data || typeof data !== 'object' || Array.isArray(data)) fail('Invalid published-object request.')
        const promise =
          operation === 'undo' ? service.commit(socket, { ...data, undo: true }) : service[operation](socket, data)
        return await (['link', 'commit', 'undo'].includes(operation) ? service.track(promise) : promise)
      } catch (error) {
        return reply.code(400).send({ error: error.message })
      }
    })
}
