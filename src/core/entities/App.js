import * as THREE from '../extras/three'
import { isArray, isEqual, isFunction, isNumber, isString } from 'lodash-es'
import moment from 'moment'

import { assertScriptActive, handlePhysicsFailure } from '../extras/physicsFailure.js'
import { createEntityProxy } from '../extras/createEntityProxy'
import { Entity } from './Entity'
import { createNode } from '../extras/createNode'
import { LerpVector3 } from '../extras/LerpVector3'
import { LerpQuaternion } from '../extras/LerpQuaternion'
import { ControlPriorities } from '../extras/ControlPriorities'
import { getRef } from '../nodes/Node'
import { Layers } from '../extras/Layers'
import { createPlayerProxy } from '../extras/createPlayerProxy'
import { serializeError } from '../extras/serializeError'
import { registerAppProxy } from '../nodes/refs'
import { createScriptTimers } from '../extras/scriptTimers'
import { createScriptResponse, toHostFetchOptions } from '../extras/scriptFetch'
import { createEventQueue } from '../extras/appEventQueue'
import { briefError, createLogOnce } from '../extras/logOnce'

// Exact shipped WorldPortal assets only: custom scripts keep their own behavior.
function legacyPortalRoot(blueprint) {
  if (blueprint.model !== 'asset://2b332a8c564f68a0b5be0b283c1859979bfe8a0bd7fce465a8de8339e530fa41.glb') return
  if (
    blueprint.script !== 'asset://f8204cf3972edd061cd130dce6db4c48669dd6a0ae0e445df4702f908a752c2d.js' &&
    blueprint.script !== 'asset://3b2352be97555f92bb06f60033cd57cd3987509f90a17c32331fb93f45124431.js'
  )
    return
  const root = createNode('group')
  root.add(createNode('portal', { appConfig: true, position: [0, 1.2, 0] }))
  return root
}

const hotEventNames = ['fixedUpdate', 'update', 'animate', 'lateUpdate']

// an app says once per reason that it is dropping events; the count is kept on the app
const logDroppedEvent = createLogOnce()

const Modes = {
  ACTIVE: 'active',
  MOVING: 'moving',
  LOADING: 'loading',
  CRASHED: 'crashed',
}

let safeMode = false
if (typeof window !== 'undefined') {
  safeMode = new URLSearchParams(window.location.search).get('safemode')
}

export class App extends Entity {
  constructor(world, data, local) {
    super(world, data, local)
    this.isApp = true
    this.n = 0
    this.crashed = false
    this.worldNodes = new Set()
    this.hotEvents = 0
    this.worldListeners = new Map()
    this.listeners = {}
    this.droppedEvents = 0
    this.eventDrops = new Map()
    this.eventQueue = createEventQueue({
      ledger: world.apps?.eventLedger,
      isServer: world.network.isServer,
      onDrop: reason => this.dropEvent(reason),
    })
    this.snaps = []
    this.root = createNode('group')
    this.fields = []
    this.target = null
    this.projectLimit = Infinity
    this.resetOnMove = false
    this.animateDelta = 0
    this.animateRate = 0.001
    this.playerProxies = new Map()
    this.hitResultsPool = []
    this.hitResults = []
    this.deadHook = { dead: false }
    this.timers = createScriptTimers()
    this.build()
  }

  createNode(name, data) {
    const node = createNode(name, data)
    return node
  }

  async build(crashed) {
    this.building = true
    const n = ++this.n
    const failureVersion = this.physicsFailureVersion
    // fetch blueprint
    const blueprint = this.world.blueprints.get(this.data.blueprint)

    if (blueprint.disabled) {
      this.unbuild()
      this.blueprint = blueprint
      this.eventQueue.clear() // a disabled app runs no script; nothing queued can be delivered
      this.building = false
      return
    }

    let root
    let script
    // if someone else is uploading glb, show a loading indicator
    if (this.data.uploader && this.data.uploader !== this.world.network.id) {
      root = createNode('mesh')
      root.type = 'box'
      root.width = 1
      root.height = 1
      root.depth = 1
    }
    // otherwise we can load the model and script
    else {
      // Older bundled portals delegate both status and travel to the native primitive.
      const legacyPortal = legacyPortalRoot(blueprint)
      if (legacyPortal) {
        root = legacyPortal
      }
      // load model if present (skip script-only dummy models)
      else if (blueprint.model && blueprint.model.trim() !== '' && blueprint.model !== 'script-only') {
        try {
          // check if it's a splat file
          if (blueprint.model.match(/\.(ply|splat|ksplat|spz)$/i)) {
            // load splat data from cache first, then create node
            let splatData = this.world.loader.get('splat', blueprint.model)
            if (!splatData) splatData = await this.world.loader.load('splat', blueprint.model)

            // create gaussiansplat node directly for splat files
            root = createNode('gaussiansplat', {
              src: blueprint.model,
              splatScale: 1.0,
              opacity: 1.0,
            })
          } else {
            // regular GLB/VRM model
            const type = blueprint.model.endsWith('vrm') ? 'avatar' : 'model'
            let glb = this.world.loader.get(type, blueprint.model)
            if (!glb) glb = await this.world.loader.load(type, blueprint.model)
            root = glb.toNodes()
          }
        } catch (err) {
          console.error(err)
          crashed = true
          // no model, will use crash block below
        }
      } else {
        // no model, create empty group for script-only apps
        root = createNode('group')
      }
      // fetch script (if any)
      if (blueprint.script && !legacyPortal) {
        try {
          script = this.world.loader.get('script', blueprint.script)
          if (!script) script = await this.world.loader.load('script', blueprint.script)
        } catch (err) {
          console.error(err)
          crashed = true
        }
      }
    }
    // if script crashed (or failed to load model), show crash-block
    if (crashed) {
      let glb = this.world.loader.get('model', 'asset://crash-block.glb')
      if (!glb) glb = await this.world.loader.load('model', 'asset://crash-block.glb')
      root = glb.toNodes()
    }
    // if a new build happened while we were fetching, stop here
    if (this.n !== n || this.world.fatalError) return
    // unbuild any previous version
    this.unbuild()
    // mode
    this.mode = Modes.ACTIVE
    if (this.data.mover) this.mode = Modes.MOVING
    if (this.data.uploader && this.data.uploader !== this.world.network.id) this.mode = Modes.LOADING
    // setup
    this.blueprint = blueprint
    this.root = root
    if (!blueprint.scene) {
      this.root.position.fromArray(this.data.position)
      this.root.quaternion.fromArray(this.data.quaternion)
      this.root.scale.fromArray(this.data.scale)
    }
    // activate
    this.root.activate({ world: this.world, entity: this, moving: !!this.data.mover })
    // execute script
    this.script = script
    this.onScript?.(script)
    const runScript =
      script &&
      !crashed &&
      !safeMode &&
      (this.mode === Modes.ACTIVE || (this.mode === Modes.MOVING && !this.resetOnMove))
    // (this.mode === Modes.ACTIVE && script && !crashed) ||
    // (this.mode === Modes.MOVING && !this.resetOnMove && !this.scriptError)
    if (this.n !== n || this.world.fatalError) return
    if (this.physicsFailureVersion !== failureVersion) {
      this.building = false
      return
    }
    if (runScript) {
      this.crashed = false
      this.nativeFailure = false
      this.abortController = new AbortController()
      try {
        this.script.exec(this.getWorldProxy(), this.getAppProxy(), this.fetch, blueprint.props, this.setTimeout)
        if (this.n !== n || this.crashed || this.world.fatalError) return
        this.scriptError = null
      } catch (err) {
        this.scriptError = serializeError(err)
        console.error('script crashed')
        console.error(err)
        return this.crash()
      }
    }
    // if moving we need updates
    if (this.mode === Modes.MOVING) {
      this.world.setHot(this, true)
      // and we need a list of any snap points
      this.snaps = []
      this.root.traverse(node => {
        if (node.name === 'snap') {
          this.snaps.push(node.worldPosition)
        }
      })
    }
    // if remote is moving, set up to receive network updates
    this.networkPos = new LerpVector3(root.position, this.world.networkRate)
    this.networkQuat = new LerpQuaternion(root.quaternion, this.world.networkRate)
    this.networkSca = new LerpVector3(root.scale, this.world.networkRate)
    // execute any events we collected while building. a listener that throws is reported and the rest are
    // still delivered, so the build always finishes
    this.eventQueue.drain(
      this.blueprint.version,
      event => this.emit(event.name, event.data, event.networkId),
      err => this.dropEvent('listener error', err),
      {
        latest: this.world.blueprints.get(this.data.blueprint)?.version,
        author: this.world.blueprints.authors?.get(this.data.blueprint),
      }
    )
    // finished!
    this.building = false
  }

  unbuild() {
    // notify any running script; a throwing listener must not skip the teardown below
    this.destroying = true
    try {
      this.emit('destroy')
    } catch (err) {
      console.error('script destroy() crashed', this)
      console.error(err)
    } finally {
      this.destroying = false
    }
    // cancel any control
    this.control?.release()
    this.control = null
    // cancel any effects
    this.playerProxies.forEach(player => {
      player.$cleanup()
    })
    // deactivate local node
    this.root?.deactivate()
    // deactivate world nodes
    for (const node of this.worldNodes) {
      node.deactivate()
    }
    this.worldNodes.clear()
    // clear script event listeners
    this.clearEventListeners()
    this.hotEvents = 0
    // cancel update tracking
    this.world.setHot(this, false)
    // abort fetch's etc
    this.abortController?.abort()
    this.abortController = null
    // cancel script timers
    this.timers.clear()
    // mark dead and re-create hook (async etc)
    this.deadHook.dead = true
    this.deadHook = { dead: false }
    // clear fields
    this.onFields?.([])
  }

  fixedUpdate(delta) {
    // script fixedUpdate()
    if (this.script) {
      try {
        this.emit('fixedUpdate', delta)
      } catch (err) {
        this.scriptError = serializeError(err)
        console.error('script fixedUpdate crashed', this)
        console.error(err)
        this.crash()
        return
      }
    }
  }

  update(delta) {
    // if someone else is moving the app, interpolate updates
    if (this.data.mover && this.data.mover !== this.world.network.id) {
      this.networkPos.update(delta)
      this.networkQuat.update(delta)
      this.networkSca.update(delta)
    }
    // script update/animate
    if (this.script) {
      try {
        // update
        this.emit('update', delta)
        // animate
        this.animateDelta += delta
        while (this.animateDelta >= this.animateRate) {
          this.emit('animate', this.animateDelta)
          this.animateDelta = 0
        }
      } catch (err) {
        this.scriptError = serializeError(err)
        console.error('script update() crashed', this)
        console.error(err)
        this.crash()
        return
      }
    }
  }

  lateUpdate(delta) {
    if (this.script) {
      try {
        this.emit('lateUpdate', delta)
      } catch (err) {
        this.scriptError = serializeError(err)
        console.error('script lateUpdate() crashed', this)
        console.error(err)
        this.crash()
        return
      }
    }
  }

  onUploaded() {
    this.data.uploader = null
    this.world.network.send('entityModified', { id: this.data.id, uploader: null })
  }

  applyLiveProps(blueprint) {
    if (this.building || this.crashed || this.mode !== Modes.ACTIVE || !this.blueprint) return false
    const previous = this.blueprint
    const fields = new Set([...Object.keys(previous), ...Object.keys(blueprint)])
    for (const key of fields) {
      if (key !== 'props' && key !== 'version' && !isEqual(previous[key], blueprint[key])) return false
    }
    const keys = new Set([...Object.keys(previous.props), ...Object.keys(blueprint.props)])
    const changed = [...keys].filter(key => !isEqual(previous.props[key], blueprint.props[key]))
    if (!changed.length || changed.some(key => !this.fields.some(field => field.key === key && field.live === true)))
      return false
    this.blueprint = blueprint
    this.emit('props', blueprint.props)
    return true
  }

  modify(data) {
    let rebuild
    // Track if we're ending a move (mover going from set to null)
    // In this case, position/quaternion/scale are final values and should NOT trigger rebuild
    let endingMove = false

    if (Object.prototype.hasOwnProperty.call(data, 'blueprint')) {
      this.eventQueue.clear()
      this.data.blueprint = data.blueprint
      rebuild = true
    }
    if (data.hasOwnProperty('uploader')) {
      this.data.uploader = data.uploader
      rebuild = true
    }
    if (data.hasOwnProperty('mover')) {
      const wasMover = !!this.data.mover
      const isMover = !!data.mover
      this.data.mover = data.mover
      // Track if we're ending a move - position/quaternion/scale won't need rebuild
      endingMove = wasMover && !isMover
      // Handle mover change without full rebuild (expensive for splats)
      if (wasMover !== isMover) {
        if (isMover) {
          this.mode = Modes.MOVING
          this.world.setHot(this, true)
          // Collect snap points
          this.snaps = []
          this.root?.traverse(node => {
            if (node.name === 'snap') {
              this.snaps.push(node.worldPosition)
            }
          })
        } else {
          this.mode = Modes.ACTIVE
          // Only remove from hot if no hot events are bound
          const hasHotEvents = hotEventNames.some(name => this.listeners[name]?.size > 0)
          if (!hasHotEvents) {
            this.world.setHot(this, false)
          }
          this.snaps = []
        }
      }
    }
    if (data.hasOwnProperty('position')) {
      this.data.position = data.position
      if (this.data.mover) {
        this.networkPos.pushArray(data.position)
      } else if (endingMove && this.root) {
        // Ending a move - apply position directly without rebuild
        this.root.position.fromArray(data.position)
      } else {
        rebuild = true
      }
    }
    if (data.hasOwnProperty('quaternion')) {
      this.data.quaternion = data.quaternion
      if (this.data.mover) {
        this.networkQuat.pushArray(data.quaternion)
      } else if (endingMove && this.root) {
        // Ending a move - apply quaternion directly without rebuild
        this.root.quaternion.fromArray(data.quaternion)
      } else {
        rebuild = true
      }
    }
    if (data.hasOwnProperty('scale')) {
      this.data.scale = data.scale
      if (this.data.mover) {
        this.networkSca.pushArray(data.scale)
      } else if (endingMove && this.root) {
        // Ending a move - apply scale directly without rebuild
        this.root.scale.fromArray(data.scale)
      } else {
        rebuild = true
      }
    }
    if (data.hasOwnProperty('pinned')) {
      this.data.pinned = data.pinned
    }
    if (data.hasOwnProperty('state')) {
      this.data.state = data.state
      // Don't rebuild if ending move (state is just being cleared)
      if (!endingMove) {
        rebuild = true
      }
    }
    if (rebuild) {
      return this.build()
    }
  }

  crash() {
    if (this.crashed || this.destroyed) return
    this.crashed = true
    this.deadHook.dead = true
    this.timers.clear()
    this.world.setHot(this, false)
    const n = ++this.n // invalidate builds already waiting on assets
    queueMicrotask(() => {
      if (this.n !== n || this.destroyed || this.world.fatalError) return
      const promise = this.build(true)
      const build = this.n
      promise.catch(err => {
        handlePhysicsFailure(err, { entity: this, phase: 'crash rebuild' })
        console.error(`[app] crash rebuild failed (entity ${this.data.id})`)
        if (this.n === build) this.building = false
      })
    })
  }

  destroy(local) {
    if (this.destroyed) return
    this.destroyed = true
    this.n++
    this.eventQueue.clear()

    this.unbuild()

    this.world.entities.remove(this.data.id)
    // if removed locally we need to broadcast to server/clients
    if (local) {
      this.world.network.send('entityRemoved', this.data.id)
    }
  }

  on(name, callback) {
    if (!this.listeners[name]) {
      this.listeners[name] = new Set()
    }
    if (this.listeners[name].has(callback)) return
    if (name === 'transform' && !this.listeners[name].size) {
      this.lastTransform = {
        position: this.root.position.clone(),
        quaternion: this.root.quaternion.clone(),
        scale: this.root.scale.clone(),
      }
    }
    this.listeners[name].add(callback)
    if (hotEventNames.includes(name)) {
      this.hotEvents++
      this.world.setHot(this, this.hotEvents > 0)
    }
  }

  emitTransform() {
    if (!this.listeners.transform?.size) return
    const { position, quaternion, scale } = this.root
    const previous = this.lastTransform
    const changed = {
      position: !position.equals(previous.position),
      rotation: !quaternion.equals(previous.quaternion),
      scale: !scale.equals(previous.scale),
    }
    if (!changed.position && !changed.rotation && !changed.scale) return
    previous.position.copy(position)
    previous.quaternion.copy(quaternion)
    previous.scale.copy(scale)
    try {
      this.emit('transform', changed)
    } catch (err) {
      this.scriptError = serializeError(err)
      console.error('script transform crashed', this)
      this.crash()
    }
  }

  off(name, callback) {
    if (!this.listeners[name]) return
    if (!this.listeners[name].has(callback)) return
    this.listeners[name].delete(callback)
    if (hotEventNames.includes(name)) {
      this.hotEvents--
      this.world.setHot(this, this.hotEvents > 0)
    }
  }

  emit(name, a1, a2) {
    // a crashed app still gets its destroy event so the script can clean up; native work from it is
    // refused by the latched script boundaries
    const suppressed = () => (this.crashed && name !== 'destroy') || this.world.fatalError
    if (suppressed()) return
    if (!this.listeners[name]) return
    for (const callback of this.listeners[name]) {
      if (suppressed()) return
      if (this.world.profiler?.active) this.world.profiler.measure(this.data.id, name, callback, [a1, a2])
      else callback(a1, a2)
    }
  }

  onWorldEvent(name, callback) {
    let entries = this.worldListeners.get(callback)
    if (!entries) this.worldListeners.set(callback, (entries = new Map()))
    if (entries.has(name)) return
    const run = this.deadHook
    const wrapped = (...args) => {
      if (this.crashed || this.world.fatalError || run.dead) return
      if (this.world.profiler?.active)
        return this.world.profiler.measure(this.data.id, `world:${name}`, callback, args, undefined)
      return callback(...args)
    }
    entries.set(name, wrapped)
    this.world.events.on(name, wrapped)
  }

  offWorldEvent(name, callback) {
    const entries = this.worldListeners.get(callback)
    const wrapped = entries?.get(name)
    if (!wrapped) return
    entries.delete(name)
    if (!entries.size) this.worldListeners.delete(callback)
    this.world.events.off(name, wrapped)
  }

  clearEventListeners() {
    // local
    this.listeners = {}
    // world
    for (const entries of this.worldListeners.values()) {
      for (const [name, wrapped] of entries) this.world.events.off(name, wrapped)
    }
    this.worldListeners.clear()
  }

  onEvent(version, name, data, networkId, meta) {
    if (!Number.isSafeInteger(version) || version < 0) return this.dropEvent('invalid version')
    const latest = this.world.blueprints.get(this.data.blueprint)?.version
    // An optimistic upload can run its cached script before announcing the next blueprint version.
    const keep = version === latest + 1
    if (version > latest && (!keep || !meta?.builder)) return this.dropEvent('future version')
    if (this.building || version > this.blueprint.version) {
      this.eventQueue.push({ version, name, data, networkId }, meta, { keep, blueprintId: this.data.blueprint })
    } else {
      try {
        this.emit(name, data, networkId)
      } catch (err) {
        this.dropEvent('listener error', err)
      }
    }
  }

  dropEvent(reason, err) {
    this.droppedEvents++
    this.eventDrops.set(reason, (this.eventDrops.get(reason) || 0) + 1)
    logDroppedEvent(
      this,
      reason,
      `[app] ${String(this.data.id).slice(0, 64)}: event dropped (${reason}); further drops for this app are counted only${err ? `: ${briefError(err)}` : ''}`
    )
  }

  // scripts get a whitelisted request init and a response of plain values (see scriptFetch.js)
  fetch = async (url, options = {}) => {
    if (this.world.isPreview) {
      if (!['GET', 'HEAD'].includes((options.method || 'GET').toUpperCase())) return
      options = { ...options, credentials: 'omit' }
      url = this.world.resolveURL(url)
    }
    try {
      const resp = await fetch(url, {
        ...toHostFetchOptions(options),
        signal: this.abortController.signal,
      })
      return createScriptResponse(resp)
    } catch (err) {
      console.error(err)
      // this.crash()
    }
  }

  // scripts get an opaque handle; the timer itself stays host-private
  setTimeout = (fn, ms) => {
    assertScriptActive(this)
    const run = this.deadHook
    return this.timers.set(() => {
      if (this.crashed || this.world.fatalError || run.dead) return
      if (this.world.profiler?.active) this.world.profiler.measure(this.data.id, 'timer', fn)
      else fn()
    }, ms)
  }

  getDeadHook = () => {
    return this.deadHook
  }

  getNodes() {
    // note: this is currently just used in the nodes tab in the app inspector
    // to get a clean hierarchy
    if (!this.blueprint) return
    const legacyPortal = legacyPortalRoot(this.blueprint)
    if (legacyPortal) return legacyPortal
    const type = this.blueprint.model.endsWith('vrm') ? 'avatar' : 'model'
    let glb = this.world.loader.get(type, this.blueprint.model)
    if (!glb) return
    return glb.toNodes()
  }

  getPlayerProxy(playerId) {
    if (playerId === undefined) playerId = this.world.entities.player?.data.id
    let proxy = this.playerProxies.get(playerId)
    if (!proxy || proxy.destroyed) {
      const player = this.world.entities.getPlayer(playerId)
      if (!player) return null
      proxy = createPlayerProxy(this, player)
      this.playerProxies.set(playerId, proxy)
    }
    return proxy
  }

  getWorldProxy() {
    if (!this.worldProxy) {
      const entity = this
      this.worldProxy = createEntityProxy(entity, {
        getters: this.world.apps.worldGetters,
        setters: this.world.apps.worldSetters,
        methods: this.world.apps.worldMethods,
        destroyMethods: ['off', 'remove'],
      })
    }
    return this.worldProxy
  }

  getAppProxy() {
    if (!this.appProxy) {
      const entity = this
      this.appProxy = createEntityProxy(entity, {
        getters: this.world.apps.appGetters,
        setters: this.world.apps.appSetters,
        methods: this.world.apps.appMethods,
        destroyMethods: ['off', 'send', 'sendTo'],
        // root node props
        fallbackGet: prop => entity.root.getProxy()[prop],
        fallbackSet: (prop, value) => {
          if (Object.prototype.hasOwnProperty.call(entity.root.getProxy(), prop)) {
            entity.root.getProxy()[prop] = value
            return true
          }
          return true
        },
      })
      // lets world.add(app) etc resolve to the app's root node
      registerAppProxy(this.appProxy, () => entity.root.getProxy())
    }
    return this.appProxy
  }
}
