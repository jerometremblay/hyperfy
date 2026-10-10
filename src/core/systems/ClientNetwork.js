import moment from 'moment'
import { emoteUrls } from '../extras/playerEmotes'
import { readPacket, writePacket } from '../packets'
import { storage } from '../storage'
import { uuid } from '../utils'
import { hashFile } from '../utils-client'
import { System } from './System'

/**
 * Client Network System
 *
 * - runs on the client
 * - provides abstract network methods matching ServerNetwork
 *
 */
export class ClientNetwork extends System {
  constructor(world) {
    super(world)
    this.ids = -1
    this.ws = null
    this.apiUrl = null
    this.id = null
    this.isClient = true
    this.queue = []
    this.serverTimestamp = null
    this.clientTimestamp = 0
    this.nextTimeSync = 0
  }

  init({ wsUrl, name, avatar }) {
    this.portalView =
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('portalView') === '1'
    const params = new URLSearchParams()
    if (!this.portalView) {
      params.set('authToken', storage.get('authToken'))
      if (name) params.set('name', name)
      if (avatar) params.set('avatar', avatar)
    }
    const query = params.toString()
    const url = query ? `${wsUrl}${wsUrl.includes('?') ? '&' : '?'}${query}` : wsUrl
    this.ws = new WebSocket(url)
    this.ws.binaryType = 'arraybuffer'
    this.ws.addEventListener('message', this.onPacket)
    this.ws.addEventListener('close', this.onClose)
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.onVisibilityChange)
  }

  preFixedUpdate() {
    this.flush()
    const now = performance.now()
    if (this.ws?.readyState === 1 && now >= this.nextTimeSync) {
      this.nextTimeSync = now + 10000
      this.send('ping', { clientTime: now })
    }
  }

  send(name, data) {
    // console.log('->', name, data)
    const packet = writePacket(name, data)
    this.ws.send(packet)
  }

  async upload(file) {
    {
      // first check if we even need to upload it
      const hash = await hashFile(file)
      const ext = file.name.split('.').pop().toLowerCase()
      const filename = `${hash}.${ext}`
      const url = `${this.apiUrl}/upload-check?filename=${filename}`
      const resp = await fetch(url)
      if (!resp.ok) throw new Error(`Asset upload check failed (${resp.status}).`)
      const data = await resp.json()
      if (data.exists) return // console.log('already uploaded:', filename)
    }
    // then upload it
    const form = new FormData()
    form.append('file', file)
    const url = `${this.apiUrl}/upload`
    const resp = await fetch(url, {
      method: 'POST',
      body: form,
    })
    if (!resp.ok) throw new Error(`Asset upload failed (${resp.status}).`)
  }

  enqueue(method, data) {
    this.queue.push([method, data])
  }

  flush() {
    while (this.queue.length) {
      try {
        const [method, data] = this.queue.shift()
        this[method]?.(data)
      } catch (err) {
        console.error(err)
      }
    }
  }

  getTime() {
    return (performance.now() + this.serverTimeOffset) / 1000 // seconds
  }

  getServerTime() {
    if (this.serverTimestamp === null) return null
    return this.serverTimestamp + performance.now() - this.clientTimestamp
  }

  onPacket = e => {
    const [method, data] = readPacket(e.data)
    // Measure clock replies on arrival, before any rendering/frame queue delay.
    if (method === 'onPong' && data && typeof data === 'object') return this.onPong(data)
    this.enqueue(method, data)
    // console.log('<-', method, data)
  }

  onSnapshot(data) {
    this.id = data.id
    this.serverTimeOffset = data.serverTime - performance.now()
    this.serverTimestamp = Number.isFinite(data.serverTimestamp) ? data.serverTimestamp : null
    this.clientTimestamp = performance.now()
    this.apiUrl = data.apiUrl
    this.maxUploadSize = data.maxUploadSize
    this.world.assetsUrl = data.assetsUrl

    // preload environment model and avatar
    // if (this.world.environment.base) {
    //   this.world.loader.preload('model', this.world.environment.base.model)
    // }
    if (data.settings.avatar) {
      this.world.loader.preload('avatar', data.settings.avatar.url)
    }
    // preload some blueprints
    for (const item of data.blueprints) {
      if (item.preload && !item.disabled) {
        if (item.model) {
          const type = item.model.endsWith('.vrm') ? 'avatar' : 'model'
          this.world.loader.preload(type, item.model)
        }
        if (item.script) {
          this.world.loader.preload('script', item.script)
        }
        for (const value of Object.values(item.props || {})) {
          if (value === undefined || value === null || !value?.url || !value?.type) continue
          this.world.loader.preload(value.type, value.url)
        }
      }
    }
    // preload emotes
    for (const url of emoteUrls) {
      this.world.loader.preload('emote', url)
    }
    // preload local player avatar
    for (const item of data.entities) {
      if (item.type === 'player' && item.owner === this.id) {
        const url = item.sessionAvatar || item.avatar
        this.world.loader.preload('avatar', url)
      }
    }
    this.world.loader.execPreload()

    this.world.collections.deserialize(data.collections)
    this.world.settings.deserialize(data.settings)
    this.world.settings.setHasAdminCode(data.hasAdminCode)
    this.world.chat.deserialize(data.chat)
    this.world.ai.deserialize(data.ai)
    this.world.blueprints.deserialize(data.blueprints)
    this.world.entities.deserialize(data.entities)
    this.world.livekit?.deserialize(data.livekit)
    if (!this.portalView) storage.set('authToken', data.authToken)
  }

  onSettingsModified = data => {
    this.world.settings.set(data.key, data.value)
  }

  onChatAdded = msg => {
    this.world.chat.add(msg, false)
  }

  onChatCleared = () => {
    this.world.chat.clear()
  }

  onBlueprintAdded = blueprint => {
    this.world.blueprints.add(blueprint)
  }

  onBlueprintModified = change => {
    this.world.blueprints.modify(change)
  }

  onEntityAdded = data => {
    this.world.entities.add(data)
  }

  onEntityModified = data => {
    const entity = this.world.entities.get(data.id)
    if (!entity) return console.error('onEntityModified: no entity found', data)
    entity.modify(data)
  }

  onEntityEvent = event => {
    const [id, version, name, data] = event
    const entity = this.world.entities.get(id)
    entity?.onEvent(version, name, data)
  }

  onEntityRemoved = id => {
    this.world.entities.remove(id)
  }

  onPlayerTeleport = data => {
    this.world.entities.player?.teleport(data)
  }

  onPlayerPush = data => {
    this.world.entities.player?.push(data.force)
  }

  onPlayerSessionAvatar = data => {
    this.world.entities.player?.setSessionAvatar(data.avatar)
  }

  onPlayerSeatPoseResult = data => {
    this.world.poseEditor?.onApplyResult(data)
  }

  onPlayerSeatPoseStylesResult = data => {
    this.world.poseEditor?.setStyles(data.styles, data.error)
  }

  onLiveKitLevel = data => {
    this.world.livekit.setLevel(data.playerId, data.level)
  }

  onMute = data => {
    this.world.livekit.setMuted(data.playerId, data.muted)
  }

  onPong = time => {
    if (time && typeof time === 'object') {
      const now = performance.now()
      if (!Number.isFinite(time.clientTime) || !Number.isFinite(time.serverTime) || time.clientTime > now) return
      const roundTrip = now - time.clientTime
      if (roundTrip > 5000) return // Discard replies delayed by suspension or a stalled connection.
      this.serverTimestamp = time.serverTime + roundTrip / 2
      this.clientTimestamp = now
      return
    }
    this.world.stats?.onPong(time)
  }

  onVisibilityChange = () => {
    this.nextTimeSync = 0
  }

  onKick = code => {
    this.world.emit('kick', code)
  }

  onClose = code => {
    this.world.chat.add({
      id: uuid(),
      from: null,
      fromId: null,
      body: `You have been disconnected.`,
      createdAt: moment().toISOString(),
    })
    this.world.emit('disconnect', code || true)
    console.log('disconnect', code)
  }

  destroy() {
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.onVisibilityChange)
    if (this.ws) {
      this.ws.removeEventListener('message', this.onPacket)
      this.ws.removeEventListener('close', this.onClose)
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close()
      }
      this.ws = null
    }
  }
}
