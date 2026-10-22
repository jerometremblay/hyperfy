import moment from 'moment'
import { isArray, isEqual, isFunction, isNumber, isPlainObject } from 'lodash-es'
import * as THREE from '../extras/three'

import { System } from './System'
import { uuid } from '../utils'
import { getRef } from '../nodes/Node'
import { Layers } from '../extras/Layers'
import { ControlPriorities } from '../extras/ControlPriorities'
import { warn } from '../extras/warn'

const isBrowser = typeof window !== 'undefined'

const internalEvents = [
  'fixedUpdate',
  'updated',
  'lateUpdate',
  'destroy',
  'enter',
  'leave',
  'chat',
  'command',
  'health',
]

/**
 * Apps System
 *
 * - Runs on both the server and client.
 * - A single place to manage app runtime methods used by all apps
 *
 */
export class Apps extends System {
  constructor(world) {
    super(world)
    this.spawnTimes = new WeakMap()
    this.pendingSpawns = new WeakMap()
    this.initWorldHooks()
    this.initAppHooks()
  }

  initWorldHooks() {
    const self = this
    const world = this.world
    const allowLoaders = ['avatar', 'model']
    this.worldGetters = {
      isPreview() {
        return !!world.isPreview
      },
      networkId(entity) {
        return world.network.id
      },
      isServer(entity) {
        return world.network.isServer
      },
      isClient(entity) {
        return world.network.isClient
      },
      isBuilding() {
        return !!world.builder?.enabled
      },
      time() {
        return world.settings.getTime()
      },
      timeZone() {
        return world.settings.timeZone
      },
    }
    this.worldSetters = {
      // ...
    }
    this.worldMethods = {
      spawnApp(entity, options = {}) {
        requireServer(world, entity, 'spawnApp')
        const { name, script, position, quaternion } = options
        if (typeof name !== 'string' || !name.trim() || name.length > 256) {
          throw new Error('spawnApp name must be a non-empty string of at most 256 characters')
        }
        if (typeof script !== 'string' || !/^asset:\/\/[^/]+\.js$/.test(script)) {
          throw new Error('spawnApp script must be an asset:// JavaScript URL')
        }
        const blueprint = entity.blueprint
        if (script !== blueprint.script && !Object.values(blueprint.props || {}).some(prop => prop?.url === script)) {
          throw new Error('spawnApp script must be referenced by the caller blueprint')
        }
        const props = copyAppJSON(options.props ?? {}, 'props')
        for (const prop of Object.values(props)) {
          const url = prop?.url
          if (typeof url === 'string' && url.startsWith('asset://') && !/^asset:\/\/[^/]+\.[a-z0-9]+$/.test(url)) {
            throw new Error('spawnApp props contain an invalid asset URL')
          }
        }
        const transform = copyAppTransform(position, quaternion)
        const state = copyAppJSON(options.state ?? {}, 'state')
        const pending = self.pendingSpawns.get(entity) || 0
        let live = pending
        for (const child of world.entities.items.values()) {
          if (child.isApp && child.data.spawnedBy === entity.data.id) live++
        }
        if (live >= 50) throw new Error('spawnApp live limit exceeded (50 per parent)')
        const now = Date.now()
        const times = (self.spawnTimes.get(entity) || []).filter(time => now - time < 60000)
        if (times.length >= 10) throw new Error('spawnApp rate limit exceeded (10 per minute per parent)')
        times.push(now)
        self.spawnTimes.set(entity, times)
        const childBlueprint = {
          id: uuid(),
          version: 0,
          name,
          model: 'script-only',
          script,
          props,
          preload: false,
          public: false,
          locked: false,
          frozen: false,
          unique: false,
          scene: false,
          disabled: false,
        }
        const data = {
          id: uuid(),
          type: 'app',
          blueprint: childBlueprint.id,
          ...transform,
          scale: [1, 1, 1],
          mover: null,
          uploader: null,
          pinned: false,
          state,
          spawnedBy: entity.data.id,
        }
        world.blueprints.add(childBlueprint)
        world.network.send('blueprintAdded', childBlueprint)
        world.network.dirtyBlueprints.add(childBlueprint.id)
        // App constructors execute cached scripts before Entities.add registers them.
        // Reserve capacity so synchronous callbacks into the parent still see the cap.
        self.pendingSpawns.set(entity, pending + 1)
        try {
          world.entities.add(data)
        } finally {
          self.pendingSpawns.set(entity, pending)
        }
        world.network.send('entityAdded', data)
        world.network.dirtyApps.add(data.id)
        return data.id
      },
      removeApp(entity, id) {
        requireServer(world, entity, 'removeApp')
        const child = world.entities.get(id)
        if (!child?.isApp || child.data.spawnedBy !== entity.data.id) {
          throw new Error('removeApp can only remove apps spawned by this app instance')
        }
        world.entities.remove(id)
        world.network.send('entityRemoved', id)
        world.network.dirtyApps.add(id)
      },
      add(entity, pNode) {
        const node = getRef(pNode)
        if (!node) return
        if (node.parent) {
          node.parent.remove(node)
        }
        entity.worldNodes.add(node)
        node.activate({ world, entity })
      },
      remove(entity, pNode) {
        const node = getRef(pNode)
        if (!node) return
        if (node.parent) return // its not in world
        if (!entity.worldNodes.has(node)) return
        entity.worldNodes.delete(node)
        node.deactivate()
      },
      attach(entity, pNode) {
        const node = getRef(pNode)
        if (!node) return
        const parent = node.parent
        if (!parent) return
        const finalMatrix = new THREE.Matrix4()
        finalMatrix.copy(node.matrix)
        let currentParent = node.parent
        while (currentParent) {
          finalMatrix.premultiply(currentParent.matrix)
          currentParent = currentParent.parent
        }
        parent.remove(node)
        finalMatrix.decompose(node.position, node.quaternion, node.scale)
        node.activate({ world, entity })
        entity.worldNodes.add(node)
      },
      on(entity, name, callback) {
        entity.onWorldEvent(name, callback)
      },
      off(entity, name, callback) {
        entity.offWorldEvent(name, callback)
      },
      emit(entity, name, data) {
        if (internalEvents.includes(name)) {
          return console.error(`apps cannot emit internal events (${name})`)
        }
        warn('world.emit() is deprecated, use app.emit() instead')
        world.events.emit(name, data)
      },
      getTime(entity) {
        return world.network.getTime()
      },
      getLocation() {
        return { latitude: world.settings.latitude, longitude: world.settings.longitude }
      },
      getTimestamp(entity, format) {
        if (!format) return moment().toISOString()
        return moment().format(format)
      },
      chat(entity, msg, broadcast) {
        if (!msg) return
        world.chat.add(msg, broadcast)
      },
      getPlayer(entity, playerId) {
        return entity.getPlayerProxy(playerId)
      },
      getPlayers(entity) {
        // tip: probably dont wanna call this every frame
        const players = []
        world.entities.players.forEach(player => {
          players.push(entity.getPlayerProxy(player.data.id))
        })
        return players
      },
      createLayerMask(entity, ...groups) {
        let mask = 0
        for (const group of groups) {
          if (!Layers[group]) throw new Error(`[createLayerMask] invalid group: ${group}`)
          mask |= Layers[group].group
        }
        return mask
      },
      raycast(entity, origin, direction, maxDistance, layerMask) {
        if (!origin?.isVector3) throw new Error('[raycast] origin must be Vector3')
        if (!direction?.isVector3) throw new Error('[raycast] direction must be Vector3')
        if (maxDistance !== undefined && maxDistance !== null && !isNumber(maxDistance)) {
          throw new Error('[raycast] maxDistance must be number')
        }
        if (layerMask !== undefined && layerMask !== null && !isNumber(layerMask)) {
          throw new Error('[raycast] layerMask must be number')
        }
        const hit = world.physics.raycast(origin, direction, maxDistance, layerMask)
        if (!hit) return null
        if (!self.raycastHit) {
          self.raycastHit = {
            point: new THREE.Vector3(),
            normal: new THREE.Vector3(),
            distance: 0,
            tag: null,
            playerId: null,
          }
        }
        self.raycastHit.point.copy(hit.point)
        self.raycastHit.normal.copy(hit.normal)
        self.raycastHit.distance = hit.distance
        self.raycastHit.tag = hit.handle?.tag
        self.raycastHit.playerId = hit.handle?.playerId
        return self.raycastHit
      },
      overlapSphere(entity, radius, origin, layerMask) {
        const hits = world.physics.overlapSphere(radius, origin, layerMask)
        return hits.map(hit => {
          return hit.proxy
        })
      },
      get(entity, key) {
        return world.storage?.get(key)
      },
      set(entity, key, value) {
        world.storage?.set(key, value)
      },
      open(entity, url, newWindow = false) {
        if (!url) {
          console.error('[world.open] URL is required')
          return
        }

        if (world.network.isClient) {
          try {
            const resolvedUrl = world.resolveURL(url)

            setTimeout(() => {
              if (newWindow) {
                window.open(resolvedUrl, '_blank')
              } else {
                window.location.href = resolvedUrl
              }
            }, 0)

            console.log(`[world.open] Redirecting to: ${resolvedUrl} ${newWindow ? '(new window)' : ''}`)
          } catch (e) {
            console.error('[world.open] Failed to open URL:', e)
          }
        } else {
          console.warn('[world.open] URL redirection only works on client side')
        }
      },
      capturePhoto(entity, options) {
        if (!world.network.isClient) return Promise.reject(new Error('capturePhoto is client-only'))
        const hook = entity.getDeadHook()
        return new Promise((resolve, reject) => {
          if (hook.dead) return
          world.graphics.photos.capture(entity, options, hook).then(
            photo => {
              if (!hook.dead) resolve(photo)
            },
            err => {
              if (!hook.dead) reject(err)
            }
          )
        })
      },
      load(entity, type, url) {
        return new Promise(async (resolve, reject) => {
          const hook = entity.getDeadHook()
          try {
            if (!allowLoaders.includes(type)) {
              return reject(new Error(`cannot load type: ${type}`))
            }
            let glb = world.loader.get(type, url)
            if (!glb) glb = await world.loader.load(type, url)
            if (hook.dead) return
            const root = glb.toNodes()
            resolve(type === 'avatar' ? root.children[0] : root)
          } catch (err) {
            if (hook.dead) return
            reject(err)
          }
        })
      },
      getQueryParam(entity, key) {
        if (!isBrowser) {
          console.error('getQueryParam() must be called in the browser')
          return null
        }
        const urlParams = new URLSearchParams(window.location.search)
        return urlParams.get(key)
      },
      setQueryParam(entity, key, value) {
        if (!isBrowser) {
          console.error('getQueryParam() must be called in the browser')
          return null
        }
        const urlParams = new URLSearchParams(window.location.search)
        if (value) {
          urlParams.set(key, value)
        } else {
          urlParams.delete(key)
        }
        const query = urlParams.toString()
        const newUrl = window.location.pathname + (query ? `?${query}` : '') + window.location.hash
        window.history.replaceState({}, '', newUrl)
      },
    }
  }

  initAppHooks() {
    const world = this.world
    this.appGetters = {
      instanceId(entity) {
        return entity.data.id
      },
      version(entity) {
        return entity.blueprint.version
      },
      modelUrl(entity) {
        return entity.blueprint.model
      },
      state(entity) {
        return entity.data.state
      },
      props(entity) {
        return entity.blueprint.props
      },
      config(entity) {
        // deprecated. will be removed
        return entity.blueprint.props
      },
      resetOnMove(entity) {
        return entity.resetOnMove
      },
      isMoving(entity) {
        return entity.mode === 'moving'
      },
    }
    this.appSetters = {
      state(entity, value) {
        entity.data.state = value
      },
      resetOnMove(entity, value) {
        entity.resetOnMove = value
      },
    }
    this.appMethods = {
      setTransform(entity, position, quaternion) {
        requireServer(world, entity, 'setTransform')
        const transform = copyAppTransform(position, quaternion)
        Object.assign(entity.data, transform)
        // Applying App.modify here would rebuild and re-run the calling script.
        entity.root.position.fromArray(transform.position)
        entity.root.quaternion.fromArray(transform.quaternion)
        world.network.send('entityModified', { id: entity.data.id, ...transform })
        world.network.dirtyApps.add(entity.data.id)
      },
      on(entity, name, callback) {
        entity.on(name, callback)
      },
      off(entity, name, callback) {
        entity.off(name, callback)
      },
      send(entity, name, data, ignoreSocketId) {
        if (internalEvents.includes(name)) {
          return console.error(`apps cannot send internal events (${name})`)
        }
        // NOTE: on the client ignoreSocketId is a no-op because it can only send events to the server
        const event = [entity.data.id, entity.blueprint.version, name, data]
        world.network.send('entityEvent', event, ignoreSocketId)
      },
      sendTo(entity, playerId, name, data) {
        if (internalEvents.includes(name)) {
          return console.error(`apps cannot send internal events (${name})`)
        }
        if (!world.network.isServer) {
          throw new Error('sendTo can only be called on the server')
        }
        const player = world.entities.get(playerId)
        if (!player) return
        const event = [entity.data.id, entity.blueprint.version, name, data]
        world.network.sendTo(playerId, 'entityEvent', event)
      },
      emit(entity, name, data) {
        if (internalEvents.includes(name)) {
          return console.error(`apps cannot emit internal events (${name})`)
        }
        world.events.emit(name, data)
      },
      create(entity, name, data) {
        const node = entity.createNode(name, data)
        return node.getProxy()
      },
      control(entity, options) {
        entity.control?.release()
        // TODO: only allow on user interaction
        // TODO: show UI with a button to release()
        entity.control = world.controls.bind({
          ...options,
          priority: ControlPriorities.APP,
          object: entity,
        })
        return entity.control
      },
      configure(entity, fnOrArray) {
        if (isArray(fnOrArray)) {
          entity.fields = fnOrArray
        } else if (isFunction(fnOrArray)) {
          entity.fields = fnOrArray() // deprecated
        }
        if (!isArray(entity.fields)) {
          entity.fields = []
        }
        const props = entity.blueprint.props
        for (const field of entity.fields) {
          // apply file shortcuts
          fileRemaps[field.type]?.(field)
          // apply any initial values
          if (field.initial !== undefined && props[field.key] === undefined) {
            props[field.key] = field.initial
          }
        }
        entity.onFields?.(entity.fields)
      },
    }
  }

  inject({ world, app }) {
    if (world) {
      for (const key in world) {
        const value = world[key]
        const isFunction = typeof value === 'function'
        if (isFunction) {
          this.worldMethods[key] = value
          continue
        }
        if (value.get) {
          this.worldGetters[key] = value.get
        }
        if (value.set) {
          this.worldSetters[key] = value.set
        }
      }
    }
    if (app) {
      for (const key in app) {
        const value = app[key]
        const isFunction = typeof value === 'function'
        if (isFunction) {
          this.appMethods[key] = value
          continue
        }
        if (value.get) {
          this.appGetters[key] = value.get
        }
        if (value.set) {
          this.appSetters[key] = value.set
        }
      }
    }
  }
}

export const fileRemaps = {
  avatar: field => {
    field.type = 'file'
    field.kind = 'avatar'
  },
  emote: field => {
    field.type = 'file'
    field.kind = 'emote'
  },
  model: field => {
    field.type = 'file'
    field.kind = 'model'
  },
  texture: field => {
    field.type = 'file'
    field.kind = 'texture'
  },
  image: field => {
    field.type = 'file'
    field.kind = 'image'
  },
  video: field => {
    field.type = 'file'
    field.kind = 'video'
  },
  hdr: field => {
    field.type = 'file'
    field.kind = 'hdr'
  },
  audio: field => {
    field.type = 'file'
    field.kind = 'audio'
  },
}

function requireServer(world, entity, method) {
  if (!world.network.isServer) throw new Error(`${method} is server-only`)
  if (entity.destroyed) throw new Error(`${method} cannot be called by a destroyed app`)
}

function copyAppTransform(position, quaternion) {
  if (!position?.isVector3 || ![position.x, position.y, position.z].every(Number.isFinite)) {
    throw new Error('position must be a finite Vector3')
  }
  if (!quaternion?.isQuaternion || ![quaternion.x, quaternion.y, quaternion.z, quaternion.w].every(Number.isFinite)) {
    throw new Error('quaternion must be a finite Quaternion')
  }
  return {
    position: [position.x, position.y, position.z],
    quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
  }
}

function copyAppJSON(value, label) {
  if (!isPlainObject(value)) throw new Error(`${label} must be a JSON object`)
  const ancestors = new Set()
  function validate(item) {
    if (item === null || typeof item === 'string' || typeof item === 'boolean') return
    if (typeof item === 'number' && Number.isFinite(item)) return
    if (!Array.isArray(item) && !isPlainObject(item)) throw new Error(`${label} must be JSON-serializable`)
    if (ancestors.has(item)) throw new Error(`${label} must be JSON-serializable (circular value)`)
    ancestors.add(item)
    for (const child of Array.isArray(item) ? item : Object.values(item)) validate(child)
    ancestors.delete(item)
  }
  validate(value)
  const json = JSON.stringify(value)
  if (new TextEncoder().encode(json).length > 64 * 1024) throw new Error(`${label} exceeds 64 KB`)
  return JSON.parse(json)
}
