import * as THREE from '../extras/three'
import { ClientNetwork } from './ClientNetwork'

export class PreviewNetwork extends ClientNetwork {
  constructor(world) {
    super(world)
    this.id = 'portal-preview'
    this.endpoints = new Map()
    this.ready = false
    this.error = ''
    this.revision = 0
  }

  init({ wsUrl, snapshot }) {
    if (snapshot) {
      this.frozen = true
      this.apply(snapshot)
      return
    }
    this.readyDeadline = performance.now() + 5000
    this.ws = new WebSocket(wsUrl)
    this.ws.addEventListener('open', this.subscribe)
    this.ws.addEventListener('message', this.onPacket)
    this.ws.addEventListener('close', this.onClose)
    this.ws.addEventListener('error', this.onError)
  }

  setSubscriptions(ids) {
    if (this.frozen) return
    this.portalIds = [...new Set(ids)]
    this.subscribe()
  }

  subscribe = () => {
    if (this.ws?.readyState === 1 && this.portalIds) {
      this.ws.send(JSON.stringify({ type: 'subscribe', version: 1, portalIds: this.portalIds }))
    }
  }

  // App APIs cannot transmit gameplay events or mutations through this connection.
  send() {}
  sendTo() {}
  async upload() {
    throw new Error('Portal previews are read-only')
  }

  preFixedUpdate() {
    this.flush()
    if (this.frozen) return
    const now = performance.now()
    if (!this.ready && now > this.readyDeadline) {
      this.error = 'Remote preview timed out'
      this.ws?.close()
    }
    if (this.ws?.readyState === 1 && now >= this.nextTimeSync) {
      this.nextTimeSync = now + 10000
      this.ws.send(JSON.stringify({ type: 'ping', clientTime: now }))
    }
  }

  onPacket = e => {
    try {
      const data = JSON.parse(e.data)
      if (data.type === 'pong') return this.onPong(data)
      this.enqueue('apply', data)
    } catch {
      this.error = 'Invalid remote preview data'
      this.ws.close()
    }
  }

  apply(data) {
    if (data.type === 'entityModified') {
      this.onEntityModified(data.data)
      return
    }
    if (data.type === 'event') {
      this.onEntityEvent(data.event)
      return
    }
    if (data.version !== 1 || !['snapshot', 'update'].includes(data.type)) {
      this.error = 'Unsupported remote preview protocol'
      this.ws.close()
      return
    }
    this.serverTimeOffset = data.serverTime - performance.now()
    this.serverTimestamp = data.serverTimestamp
    this.clientTimestamp = performance.now()
    this.world.assetsUrl = data.assetsUrl
    this.endpoints = new Map(
      Object.entries(data.endpoints).map(([id, matrix]) => [id, new THREE.Matrix4().fromArray(matrix)])
    )
    this.world.settings.deserialize(this.frozen ? { dayNightCycle: false, ...data.settings } : data.settings)
    for (const blueprint of data.blueprints) {
      if (this.world.blueprints.get(blueprint.id)) this.world.blueprints.modify(blueprint)
      else this.world.blueprints.add(blueprint)
    }
    for (const id of data.removed) this.world.entities.remove(id)
    for (const entity of data.added) {
      const added = this.world.entities.add(entity)
      if (added.isPlayer) added.modify(this.playerChanges(entity))
    }
    for (const changes of data.modified) {
      const entity = this.world.entities.get(changes.id)
      entity?.modify(entity.isPlayer ? this.playerChanges(changes) : changes)
    }
    this.ready = true
    this.error = ''
    this.revision++
  }

  playerChanges(data) {
    const changes = { ...data }
    for (const [field, packet] of Object.entries({
      position: 'p',
      quaternion: 'q',
      mode: 'm',
      axis: 'a',
      gaze: 'g',
      emote: 'e',
      effect: 'ef',
    })) {
      if (Object.hasOwn(data, field)) changes[packet] = data[field]
    }
    return changes
  }

  onClose = () => {
    this.ready = false
    this.error ||= 'Remote preview disconnected'
  }
  onError = () => {
    this.error = 'Remote preview connection failed'
  }

  destroy() {
    this.ws?.removeEventListener('open', this.subscribe)
    this.ws?.removeEventListener('error', this.onError)
    super.destroy()
    this.endpoints.clear()
    this.queue.length = 0
  }
}
