import * as THREE from '../core/extras/three'

export const PORTAL_PREVIEW_VERSION = 1
export const PORTAL_PREVIEW_RADIUS = 50

export function portalEndpoints(world, ids) {
  const endpoints = Object.create(null)
  for (const id of ids) {
    if (!id) {
      const spawn = world.network.spawn
      endpoints[id] = new THREE.Matrix4()
        .compose(
          new THREE.Vector3().fromArray(spawn.position),
          new THREE.Quaternion().fromArray(spawn.quaternion),
          new THREE.Vector3(1, 1, 1)
        )
        .toArray()
      continue
    }
    for (const entity of world.entities.items.values()) {
      if (!entity.isApp || entity.blueprint?.disabled || entity.data.mover) continue
      const visit = node => {
        if (node.name === 'portal' && node.mounted && (node.portalId || entity.data.id || node.id) === id) {
          endpoints[id] = node.matrixWorld.toArray()
        }
      }
      entity.root?.traverse(visit)
      for (const node of entity.worldNodes || []) node.traverse(visit)
    }
  }
  return endpoints
}

export function selectPortalEntities(world, endpoints) {
  const centers = Object.values(endpoints).map(matrix =>
    new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().fromArray(matrix))
  )
  const bounded = new Set()
  const overlapping = new Set()
  const visit = node => {
    for (const item of node.items) {
      const entity = item.getEntity?.()
      if (!entity) continue
      bounded.add(entity.data.id)
      if (centers.some(center => center.distanceTo(item.sphere.center) <= PORTAL_PREVIEW_RADIUS + item.sphere.radius)) {
        overlapping.add(entity.data.id)
      }
    }
    for (const child of node.children) visit(child)
  }
  if (world.stage.octree?.root) visit(world.stage.octree.root)
  const selected = []
  for (const entity of world.entities.items.values()) {
    if (entity.isPlayer) {
      if (
        centers.some(
          center => center.distanceTo(new THREE.Vector3().fromArray(entity.data.position)) <= PORTAL_PREVIEW_RADIUS
        )
      )
        selected.push(entity.serialize())
      continue
    }
    if (!entity.isApp || entity.blueprint?.disabled) continue
    let global = false
    const inspect = node => {
      if (node.name === 'sky' || node.name === 'light') global = true
    }
    entity.root?.traverse(inspect)
    for (const node of entity.worldNodes || []) node.traverse(inspect)
    // Client-only script branches can produce geometry absent from the server bounds.
    const code = entity.script?.code || ''
    const unknown = !bounded.has(entity.data.id) || code.includes('isClient') || code.includes('isServer')
    if (centers.length && (global || unknown || overlapping.has(entity.data.id))) selected.push(entity.serialize())
  }
  return selected
}

/** Preview sockets are deliberately separate from player sockets and their handlers. */
export class PortalPreviews {
  constructor(world) {
    this.world = world
    this.sessions = new Set()
    this.timer = setInterval(() => this.refresh(), 125)
    this.timer.unref?.()
  }

  connect(ws) {
    if (this.sessions.size >= 64) return ws.close(1013, 'Preview capacity reached')
    const session = { ws, ids: [], entities: new Map(), blueprints: new Map(), initial: true }
    this.sessions.add(session)
    session.alive = true
    session.lastPing = Date.now()
    ws.on('pong', () => {
      session.alive = true
    })
    const timeout = setTimeout(() => ws.close(1008, 'Subscription required'), 5000)
    ws.on('close', () => {
      clearTimeout(timeout)
      this.sessions.delete(session)
    })
    ws.on('message', raw => {
      try {
        if (raw.length > 4096) throw new Error('Message too large')
        const data = JSON.parse(raw.toString())
        if (data.type === 'ping' && Number.isFinite(data.clientTime)) {
          return this.send(session, {
            type: 'pong',
            clientTime: data.clientTime,
            serverTime: this.world.network.getServerTime(),
          })
        }
        if (
          data.type !== 'subscribe' ||
          data.version !== PORTAL_PREVIEW_VERSION ||
          !Array.isArray(data.portalIds) ||
          data.portalIds.length > 16 ||
          data.portalIds.some(id => typeof id !== 'string' || id.length > 256)
        ) {
          throw new Error('Invalid preview subscription')
        }
        session.ids = [...new Set(data.portalIds)]
        clearTimeout(timeout)
        this.refreshSession(session)
      } catch {
        ws.close(1008, 'Read-only preview protocol')
      }
    })
  }

  send(session, data) {
    if (session.ws.readyState !== 1) return
    if (session.ws.bufferedAmount > 4 * 1024 * 1024) return session.ws.close(1013, 'Slow preview consumer')
    session.ws.send(JSON.stringify(data))
  }

  refresh() {
    for (const session of this.sessions) {
      if (session.ws.ping && Date.now() - session.lastPing >= 10000) {
        if (!session.alive) {
          session.ws.terminate()
          continue
        }
        session.alive = false
        session.lastPing = Date.now()
        session.ws.ping()
      }
      if (!session.ids.length) continue
      try {
        this.refreshSession(session)
      } catch (error) {
        console.error('[portal-preview]', error)
        session.ws.close(1011, 'Preview failed')
      }
    }
  }

  refreshSession(session) {
    const endpoints = portalEndpoints(this.world, session.ids)
    const entities = selectPortalEntities(this.world, endpoints)
    const blueprints = [...new Set(entities.filter(entity => entity.type === 'app').map(entity => entity.blueprint))]
      .map(id => this.world.blueprints.get(id))
      .filter(Boolean)
    const added = []
    const modified = []
    const removed = []
    const changedBlueprints = []
    const nextEntities = new Map()
    for (const data of entities) {
      const serialized = JSON.stringify(data)
      nextEntities.set(data.id, serialized)
      const previous = session.entities.get(data.id)
      if (!previous) added.push(data)
      else if (previous !== serialized) {
        const old = JSON.parse(previous)
        const changes = { id: data.id }
        for (const key of Object.keys(data)) {
          if (JSON.stringify(old[key]) !== JSON.stringify(data[key])) changes[key] = data[key]
        }
        modified.push(changes)
      }
    }
    for (const id of session.entities.keys()) if (!nextEntities.has(id)) removed.push(id)
    const nextBlueprints = new Map()
    for (const data of blueprints) {
      const serialized = JSON.stringify(data)
      nextBlueprints.set(data.id, serialized)
      if (session.blueprints.get(data.id) !== serialized) changedBlueprints.push(data)
    }
    const settings = this.world.settings.serialize()
    // Only rendering settings are exported; player/admin/voice configuration stays private.
    const visualSettings = Object.fromEntries(
      ['dayNightCycle', 'latitude', 'longitude', 'timeZone', 'timeOffset', 'timeTransition'].map(key => [
        key,
        settings[key],
      ])
    )
    const environment = JSON.stringify([endpoints, visualSettings])
    if (
      session.initial ||
      added.length ||
      modified.length ||
      removed.length ||
      changedBlueprints.length ||
      session.environment !== environment
    ) {
      this.send(session, {
        type: session.initial ? 'snapshot' : 'update',
        version: PORTAL_PREVIEW_VERSION,
        serverTime: performance.now(),
        serverTimestamp: this.world.network.getServerTime(),
        assetsUrl: this.world.assetsUrl,
        endpoints,
        settings: visualSettings,
        blueprints: changedBlueprints,
        added,
        modified,
        removed,
      })
    }
    session.initial = false
    session.entities = nextEntities
    session.blueprints = nextBlueprints
    session.environment = environment
  }

  event(name, data) {
    if (!['entityEvent', 'entityModified'].includes(name)) return
    for (const session of this.sessions) {
      const id = name === 'entityEvent' ? data[0] : data.id
      if (!session.entities.has(id)) continue
      if (name === 'entityEvent') this.send(session, { type: 'event', event: data })
      else {
        this.send(session, { type: 'entityModified', data })
        const entity = this.world.entities.get(id)
        if (entity) session.entities.set(id, JSON.stringify(entity.serialize()))
      }
    }
  }

  destroy() {
    clearInterval(this.timer)
    for (const session of this.sessions) session.ws.close(1001, 'World closed')
    this.sessions.clear()
  }
}
