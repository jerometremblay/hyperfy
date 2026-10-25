import { receiveProfilerReport } from '../extras/profilerReports'
import { applyPlayerExpression } from '../extras/playerExpressions'
import moment from 'moment'
import { sanitizePlayerSession } from '../extras/playerSession'
import { writePacket } from '../packets'
import { appPersistenceData, persistenceRecord } from '../extras/persistenceRecord'
import { briefError, createLogOnce } from '../extras/logOnce'
import { Socket } from '../Socket'
import { uuid } from '../utils'
import { System } from './System'
import {
  isPlainObject,
  sanitizePlayerSelfModify,
  sanitizeAppModify,
  sanitizeAppRelease,
  sanitizeEntityAdd,
  sanitizePersistedApp,
  sanitizeSpawn,
  sanitizeName,
  isAvatarUrl,
} from '../extras/entityModifyPolicy'
import { sanitizeBlueprintAdd, sanitizeBlueprintModify, WORLD_BLUEPRINT_BYTES } from '../extras/blueprintPolicy'
import { sanitizeChatMessage } from '../extras/chatPolicy'
import { createRelayDrop } from '../extras/playerRelayPolicy'
import { isKnownSettingKey, isAdminOnlySettingKey, normalizeSettingValue } from '../extras/settingsPolicy'
import { internalEvents } from '../extras/internalEvents'
import { createInboundGate, createInboundScheduler, packetNodeLimit } from '../extras/inboundPolicy'
import { readInboundPacket } from '../../server/inboundDecode'
import { createWriteLedger } from '../extras/writeLedger'
import { createJWT, readJWT } from '../utils-server'
import { appHasBrowserSource } from '../utils/browser'
import { cloneDeep, isNumber } from 'lodash-es'
import * as THREE from '../extras/three'
import { Ranks } from '../extras/ranks'
import { isValidDayNightSetting, getWorldTime, getTimeOffset, TIME_TRANSITION_DURATION } from '../extras/dayNight'
import { cloneHandTrackingPose } from '../extras/handTracking'
import { getPortalArrival, parsePortalPose } from '../extras/portalArrival'
import {
  getStoredSeatPose,
  sanitizeNormalizedPose,
  sanitizePoseStyleName,
  sanitizePoseStyles,
  sanitizeSeatProfileId,
  sanitizeSeatPoseInput,
  SEAT_POSE_VERSION,
  seatPoseProfileStorageKey,
  seatPoseStorageKey,
  seatPoseStylesStorageKey,
} from '../extras/seatPose'

const SAVE_INTERVAL = parseInt(process.env.SAVE_INTERVAL || '60') // seconds
const PING_RATE = 10 // seconds
const defaultSpawn = '{ "position": [0, 0, 0], "quaternion": [0, 0, 0, 1] }'

const HEALTH_MAX = 100

/**
 * Server Network System
 *
 * - runs on the server
 * - provides abstract network methods matching ClientNetwork
 *
 */
export class ServerNetwork extends System {
  constructor(world) {
    super(world)
    this.id = 0
    this.ids = -1
    this.sockets = new Map()
    this.profilingReports = new Map()
    this.socketIntervalId = setInterval(() => this.checkSockets(), PING_RATE * 1000)
    this.saveTimerId = null
    this.dirtyBlueprints = new Set()
    this.dirtyApps = new Set()
    this.browserCapture = null
    this.isServer = true
    this.queue = []
    this.dropPlayerRelay = createRelayDrop()
    this.gate = createInboundGate()
    this.scheduler = createInboundScheduler()
    this.writer = createWriteLedger({ log: line => console.warn(line) })
    this.connecting = new Set()
    this.logOnce = createLogOnce()
    this.savePromise = null
    this.configPromise = null
    this.stopping = false
  }

  init({ db }) {
    this.db = db
  }

  async start() {
    // get spawn
    const spawnRow = await this.db('config').where('key', 'spawn').first()
    try {
      this.spawn = sanitizeSpawn(JSON.parse(spawnRow ? spawnRow.value : defaultSpawn))
    } catch {
      // Invalid persisted JSON falls back to the default below.
    }
    if (!this.spawn) {
      this.spawn = JSON.parse(defaultSpawn)
      this.logOnce(this, 'spawn-invalid', '[network] invalid stored spawn; using default spawn')
    }
    const blueprints = await this.db('blueprints')
    for (const row of blueprints) {
      try {
        const result = sanitizeBlueprintAdd(JSON.parse(row.data))
        if (!result.ok || result.value.id !== row.id) throw new Error('invalid blueprint')
        this.world.blueprints.add(result.value)
      } catch {
        console.warn(`[network] skipped invalid blueprint ${String(row.id).slice(0, 64)}`)
      }
    }
    const entities = await this.db('entities')
    for (const row of entities) {
      try {
        const result = sanitizePersistedApp(JSON.parse(row.data), {
          blueprintExists: id => !!this.world.blueprints.get(id),
        })
        if (!result || result.data.id !== row.id) throw new Error('invalid app')
        this.world.entities.add(result.data, true)
      } catch {
        console.warn(`[network] skipped invalid app ${String(row.id).slice(0, 64)}`)
      }
    }
    // hydrate settings
    let settingsRow = await this.db('config').where('key', 'settings').first()
    try {
      const settings = JSON.parse(settingsRow?.value || '{}')
      this.world.settings.deserialize(settings)
      this.world.settings.setHasAdminCode(!!process.env.ADMIN_CODE)
    } catch (err) {
      console.error(err)
    }
    // watch settings changes
    this.world.settings.on('change', this.saveSettings)
    // queue first save
    if (SAVE_INTERVAL) {
      this.saveTimerId = setTimeout(this.save, SAVE_INTERVAL * 1000)
    }
  }

  preFixedUpdate() {
    this.writer.resetTick()
    this.flush()
  }

  send(name, data, ignoreSocketId) {
    // console.log('->>>', name, data)
    this.portalPreviews?.event(name, data)
    const packet = this.writer.prepare(writePacket(name, data), { name })
    if (packet === false) return false
    let delivered = true
    this.sockets.forEach(socket => {
      if (socket.id === ignoreSocketId) return
      if (!this.writer.write(socket.ws, packet, { name, prepared: true })) delivered = false
    })
    return delivered
  }

  sendTo(socketId, name, data) {
    const socket = this.sockets.get(socketId)
    return socket?.send(name, data) ?? false
  }

  write(ws, packet, options) {
    return this.writer.write(ws, packet, { snapshot: options?.name === 'snapshot', ...options })
  }

  asScript(fn, source, name) {
    return this.writer.asScript(fn, source, name)
  }

  checkSockets() {
    // see: https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections
    const dead = []
    this.sockets.forEach(socket => {
      if (!socket.alive || socket.pingPending) {
        dead.push(socket)
      } else {
        socket.ping()
      }
    })
    dead.forEach(socket => socket.disconnect())
  }

  admit(socket, packet) {
    if (this.stopping || this.world.fatalError) return false
    return this.gate.admit(socket, packet, { builder: socket.player?.isBuilder() === true })
  }

  enqueue(socket, packet, entry) {
    if (this.stopping || this.world.fatalError) return false
    if (!this.scheduler.reserve(socket, entry)) return false
    try {
      entry.copy = Uint8Array.prototype.slice.call(packet)
    } catch {
      this.scheduler.release(socket, entry)
      return false
    }
    this.scheduler.enqueue(socket, entry)
    return true
  }

  flush() {
    if (this.stopping || this.world.fatalError) return
    this.scheduler.flush((socket, entry) => {
      try {
        const [method, data] = readInboundPacket(entry.copy, { maxNodes: packetNodeLimit(entry.name) })
        const result = this[method]?.(socket, data, {
          socketId: socket.id,
          bytes: entry.bytes,
          nodes: entry.nodes,
          builder: entry.builder,
        })
        result?.catch?.(() => console.warn('[network] rejected asynchronous packet handler'))
      } catch (err) {
        this.gate.refuse(socket, 'handler', entry.name, 'invalid packet or handler failure')
      }
    })
  }

  getTime() {
    return performance.now() / 1000 // seconds
  }

  getServerTime() {
    return Date.now()
  }

  markAppDeleted(id) {
    this.dirtyApps.add(id)
  }

  save = () => {
    clearTimeout(this.saveTimerId)
    const promise = (this.savePromise || Promise.resolve())
      .then(() => this.saveDirty())
      .finally(() => {
        if (this.savePromise !== promise) return
        this.savePromise = null
        if (SAVE_INTERVAL && !this.stopping) this.saveTimerId = setTimeout(this.save, SAVE_INTERVAL * 1000)
      })
    this.savePromise = promise
    return promise
  }

  async saveDirty() {
    const now = moment().toISOString()
    for (const [table, dirty] of [
      ['blueprints', this.dirtyBlueprints],
      ['entities', this.dirtyApps],
    ]) {
      const read = id => {
        const data = table === 'blueprints' ? this.world.blueprints.get(id) : this.world.entities.get(id)?.data
        if (!data) return null
        if (table === 'entities' && (data.mover || data.uploader)) return undefined
        return persistenceRecord(table === 'entities' ? appPersistenceData(data) : data)
      }
      for (const id of [...dirty]) {
        if (this.flushExpired) return
        try {
          const record = read(id)
          if (record === undefined) continue
          if (record === null) await this.db(table).where('id', id).delete()
          else
            await this.db(table)
              .insert({ ...record, createdAt: now, updatedAt: now })
              .onConflict('id')
              .merge({ ...record, updatedAt: now })
          const current = read(id)
          if (current?.data === record?.data) dirty.delete(id)
        } catch (err) {
          console.error(`[network] save failed for ${table}: ${briefError(err)}`)
        }
      }
    }
  }

  stopForFatal() {
    this.stopping = true
    clearTimeout(this.saveTimerId)
    clearInterval(this.socketIntervalId)
  }

  async flushBeforeExit(deadlineMs) {
    this.stopForFatal()
    let timer
    try {
      await Promise.race([
        (async () => {
          await this.configPromise
          await this.save()
          await this.saveSettings()
        })(),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            this.flushExpired = true
            reject(new Error('save deadline exceeded'))
          }, deadlineMs)
        }),
      ])
      if (this.dirtyBlueprints.size || this.dirtyApps.size) throw new Error('final save incomplete')
    } finally {
      clearTimeout(timer)
    }
  }

  saveConfig(key, data) {
    const value = JSON.stringify(data)
    const promise = (this.configPromise || Promise.resolve()).then(async () => {
      if (this.flushExpired) return
      await this.db('config').insert({ key, value }).onConflict('key').merge({ value })
    })
    this.configPromise = promise.catch(err => console.error(`[network] config save failed: ${briefError(err)}`))
    return promise
  }

  saveSettings = () => this.saveConfig('settings', this.world.settings.serialize()).catch(() => {})

  setSpawn = async spawn => {
    const safe = sanitizeSpawn(spawn)
    if (!safe) return
    this.spawn = safe
    await this.saveConfig('spawn', safe)
  }

  getPortalSpawn(portalId, portalPose) {
    if (typeof portalId !== 'string' || !portalId || portalId.length > 256) return null
    let portal
    for (const entity of this.world.entities.items.values()) {
      if (!entity.isApp || entity.blueprint?.disabled || entity.data.mover) continue
      const visit = node => {
        if (node.name === 'portal' && node.mounted && node.portalId === portalId) portal = node
      }
      entity.root?.traverse(visit)
      for (const node of entity.worldNodes || []) node.traverse(visit)
      if (portal) break
    }
    if (!portal) return null
    let pose = typeof portalPose === 'string' && portalPose.length <= 1024 ? parsePortalPose(portalPose) : null
    // URL input may preserve an aperture offset, but cannot select an arbitrary spawn position.
    if (pose && (Math.abs(pose.position.x) > portal.width / 2 || Math.abs(pose.position.y) > portal.height / 2 + 0.1)) {
      pose = null
    }
    const arrival = getPortalArrival(portal, pose?.position, pose?.direction)
    const position = arrival.position.toArray()
    if (!position.every(Number.isFinite) || !Number.isFinite(arrival.rotationY)) return null
    const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), arrival.rotationY).toArray()
    return { position, quaternion }
  }

  async onConnection(ws, params) {
    let cancelled = false
    let reserved = null
    let socket = null
    ws.once('close', () => {
      cancelled = true
    })
    try {
      if (this.stopping || this.world.fatalError) return ws.close(1011)
      // check player limit
      const playerLimit = this.world.settings.playerLimit
      if (isNumber(playerLimit) && playerLimit > 0 && this.sockets.size >= playerLimit) {
        const packet = writePacket('kick', 'player_limit')
        this.write(ws, packet, { name: 'kick' })
        ws.close()
        return
      }

      // check connection params
      let authToken = params.authToken
      let name = params.name
      let avatar = params.avatar

      // get or create user
      let user
      if (authToken) {
        try {
          const payload = await readJWT(authToken)
          if (cancelled) return
          if (typeof payload?.userId === 'string') user = await this.db('users').where('id', payload.userId).first()
        } catch (err) {
          console.warn('[network] invalid session token')
        }
      }
      if (!user) {
        user = {
          id: uuid(),
          name: 'Anonymous',
          avatar: null,
          rank: 0,
          createdAt: moment().toISOString(),
        }
        await this.db('users').insert(user)
        authToken = await createJWT({ userId: user.id })
      }

      if (cancelled) return
      // disconnect if user already in this world
      if (this.sockets.has(user.id) || this.connecting.has(user.id)) {
        const packet = writePacket('kick', 'duplicate_user')
        this.write(ws, packet, { name: 'kick' })
        ws.close()
        return
      }

      if (isNumber(playerLimit) && playerLimit > 0 && this.sockets.size + this.connecting.size >= playerLimit) {
        this.write(ws, writePacket('kick', 'player_limit'), { name: 'kick' })
        ws.close()
        return
      }
      reserved = user.id
      this.connecting.add(user.id)
      // livekit options
      const livekit = await this.world.livekit.serialize(user.id)
      if (cancelled || this.stopping) return

      // create socket
      socket = new Socket({ id: user.id, ws, network: this })

      const arrival = this.getPortalSpawn(params.portalId, params.portalPose)
      const saved = this.world.storage?.get(`playerSession:${user.id}`)
      const session = !arrival && sanitizePlayerSession(saved)
      const spawn = arrival || session || this.spawn
      const anchorId = saved?.effect?.anchorId
      const occupied =
        anchorId &&
        [...this.world.entities.items.values()].some(
          entity => entity.isPlayer && entity.data.effect?.anchorId === anchorId
        )
      const effect =
        session && anchorId && this.world.anchors?.get(anchorId) && !occupied
          ? { anchorId, snare: 1, cancellable: true }
          : null
      // spawn player
      const playerData = {
        id: user.id,
        type: 'player',
        position: spawn.position.slice(),
        quaternion: spawn.quaternion.slice(),
        owner: socket.id, // deprecated, same as userId
        userId: user.id, // deprecated, same as userId
        name: sanitizeName(name) || user.name,
        health: HEALTH_MAX,
        avatar: user.avatar || this.world.settings.avatar?.url || 'asset://avatar.vrm',
        sessionAvatar: isAvatarUrl(avatar) ? avatar || null : null,
        rank: user.rank,
        enteredAt: Date.now(),
        effect,
        loading: params.loading === '1' ? 0 : null,
      }
      // Entity construction broadcasts immediately; include the saved pose before adding it.
      if (effect) playerData.seatPose = getStoredSeatPose(this.world, { data: playerData })
      socket.player = this.world.entities.add(playerData, true)

      // send snapshot
      const sent = socket.send('snapshot', {
        playerSession: session || null,
        id: socket.id,
        serverTime: performance.now(),
        serverTimestamp: this.getServerTime(),
        assetsUrl: process.env.ASSETS_BASE_URL,
        apiUrl: process.env.PUBLIC_API_URL,
        maxUploadSize: process.env.PUBLIC_MAX_UPLOAD_SIZE,
        collections: this.world.collections.serialize(),
        settings: this.world.settings.serialize(),
        chat: this.world.chat.serialize(),
        ai: this.world.ai.serialize(),
        blueprints: this.world.blueprints.serialize(),
        entities: this.world.entities.serialize(),
        livekit,
        authToken,
        hasAdminCode: !!process.env.ADMIN_CODE,
        portalArrival: !!arrival,
      })

      if (sent === false) throw new Error('snapshot write failed')
      this.sockets.set(socket.id, socket)

      // enter events on the server are sent after the snapshot.
      // on the client these are sent during PlayerRemote.js entity instantiation!
      this.world.events.emit('enter', { playerId: socket.player.data.id })
    } catch (err) {
      this.logOnce(ws, 'connection', `[network] connection failed: ${briefError(err)}`)
      if (socket) {
        socket.player ||= this.world.entities.get?.(socket.id)
        try {
          this.onDisconnect(socket)
        } catch {
          // Connection cleanup is best-effort; the transport is closed below.
        }
      }
      ws.close(1011)
    } finally {
      if (reserved) this.connecting.delete(reserved)
    }
  }

  onChatAdded = async (socket, msg) => {
    if (this.stopping || this.world.fatalError) return
    const safe = sanitizeChatMessage(msg)
    if (!safe) return
    const message = {
      ...safe,
      id: uuid(),
      from: socket.player.data.name || 'Anonymous',
      fromId: socket.id,
      createdAt: moment().toISOString(),
    }
    this.world.chat.add(message, false)
    this.send('chatAdded', message, socket.id)
  }

  onCommand = async (socket, data) => {
    if (this.stopping || this.world.fatalError) return
    const { args } = data
    // handle slash commands
    const player = socket.player
    const playerId = player.data.id
    const [cmd, arg1, arg2] = args
    // become admin command
    if (cmd === 'admin') {
      const code = arg1
      if (process.env.ADMIN_CODE && process.env.ADMIN_CODE === code) {
        const id = player.data.id
        const userId = player.data.userId
        const granted = !player.isAdmin()
        let rank
        if (granted) {
          rank = Ranks.ADMIN
        } else {
          rank = Ranks.VISITOR
        }
        player.modify({ rank })
        this.send('entityModified', { id, rank })
        socket.send('chatAdded', {
          id: uuid(),
          from: null,
          fromId: null,
          body: granted ? 'Admin granted!' : 'Admin revoked!',
          createdAt: moment().toISOString(),
        })
        await this.db('users').where('id', userId).update({ rank })
      }
    }
    if (cmd === 'name') {
      const name = arg1
      if (name) {
        const id = player.data.id
        const userId = player.data.userId
        player.data.name = name
        player.modify({ name })
        this.send('entityModified', { id, name })
        socket.send('chatAdded', {
          id: uuid(),
          from: null,
          fromId: null,
          body: `Name set to ${name}!`,
          createdAt: moment().toISOString(),
        })
        await this.db('users').where('id', userId).update({ name })
      }
    }
    if (cmd === 'spawn') {
      const op = arg1
      this.onSpawnModified(socket, op)
    }
    if (cmd === 'time') {
      this.onTimeCommand(socket, data)
    }
    if (cmd === 'chat') {
      const op = arg1
      if (op === 'clear' && socket.player.isBuilder()) {
        this.world.chat.clear(true)
      }
    }
    if (cmd === 'server') {
      const op = arg1
      if (op === 'stats') {
        function send(body) {
          socket.send('chatAdded', {
            id: uuid(),
            from: null,
            fromId: null,
            body,
            createdAt: moment().toISOString(),
          })
        }
        const stats = await this.world.monitor.getStats()
        send(`CPU: ${stats.currentCPU.toFixed(3)}%`)
        send(
          `Memory: ${stats.currentMemory} / ${stats.maxMemory} MB (${((stats.currentMemory / stats.maxMemory) * 100).toFixed(1)}%)`
        )
      }
    }
    // emit event for all except admin
    if (cmd !== 'admin') {
      this.world.events.emit('command', { playerId, args })
    }
  }

  onModifyRank = async (socket, data) => {
    if (this.stopping || this.world.fatalError) return
    if (!socket.player.isAdmin() || !isPlainObject(data)) return
    const { playerId, rank } = data
    if (!playerId) return
    if (![Ranks.VISITOR, Ranks.BUILDER, Ranks.ADMIN].includes(rank)) return
    const player = this.world.entities.get(playerId)
    if (!player || !player.isPlayer) return
    player.modify({ rank })
    this.send('entityModified', { id: playerId, rank })
    await this.db('users').where('id', playerId).update({ rank })
  }

  onKick = (socket, playerId) => {
    const player = this.world.entities.get(playerId)
    if (!player) return
    // admins can kick builders + visitors
    // builders can kick visitors
    // visitors cannot kick anyone
    if (socket.player.data.rank <= player.data.rank) return
    const tSocket = this.sockets.get(playerId)
    tSocket.send('kick', 'moderation')
    tSocket.disconnect()
  }

  onMute = (socket, data) => {
    const player = this.world.entities.get(data.playerId)
    if (!player) return
    // admins can mute builders + visitors
    // builders can mute visitors
    // visitors cannot mute anyone
    if (socket.player.data.rank <= player.data.rank) return
    this.world.livekit.setMuted(data.playerId, data.muted)
  }

  blueprintFits(value) {
    let bytes = 0
    for (const blueprint of this.world.blueprints.items.values()) {
      if (blueprint.id !== value.id) bytes += Buffer.byteLength(JSON.stringify(blueprint))
    }
    return bytes + Buffer.byteLength(JSON.stringify(value)) <= WORLD_BLUEPRINT_BYTES
  }

  onBlueprintAdded = (socket, blueprint) => {
    if (this.stopping || this.world.fatalError) return
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to add blueprint without builder permission')
    }
    const { ok, value } = sanitizeBlueprintAdd(blueprint)
    if (!ok || this.world.blueprints.get(value.id) || !this.blueprintFits(value)) return
    this.world.blueprints.add(value)
    this.send('blueprintAdded', value, socket.id)
    this.dirtyBlueprints.add(value.id)
  }

  onBlueprintModified = (socket, data) => {
    if (this.stopping || this.world.fatalError) return
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to modify blueprint without builder permission')
    }
    const result = sanitizeBlueprintModify(data)
    if (!result.ok) return
    data = result.value
    const blueprint = this.world.blueprints.get(data.id)
    if (!blueprint) return
    // if new version is greater than current version, allow it
    if (data.version > blueprint.version && this.blueprintFits({ ...blueprint, ...data })) {
      this.world.blueprints.modify(data, false, { authorSocketId: socket.id })
      this.send('blueprintModified', data, socket.id)
      this.dirtyBlueprints.add(data.id)
    }
    // otherwise, send a revert back to client, because someone else modified before them
    else {
      socket.send('blueprintModified', blueprint)
    }
  }

  onEntityAdded = (socket, data) => {
    if (this.stopping || this.world.fatalError) return
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to add entity without builder permission')
    }
    const safe = sanitizeEntityAdd(data, socket.id, {
      blueprintExists: id => !!this.world.blueprints.get(id),
      entityExists: id => !!this.world.entities.get(id),
    })
    if (!safe) return
    const entity = this.world.entities.add(safe)
    this.send('entityAdded', safe, socket.id)
    if (entity.isApp) this.dirtyApps.add(entity.data.id)
  }

  onProfilerReport = (socket, data) => {
    if (receiveProfilerReport(this, socket, data)) this.world.profiler?.refreshActive()
  }

  onPlayerExpression = (socket, data) => {
    if (this.stopping || this.world.fatalError) return
    if (!data || typeof data !== 'object') return
    const player = this.world.entities.get(data.id)
    // Client scripts can control their own player; server scripts can control any player.
    if (!player?.isPlayer || player.data.owner !== socket.id) return
    applyPlayerExpression(player, data)
  }

  onEntityModified = async (socket, data) => {
    if (this.stopping || this.world.fatalError) return
    if (!isPlainObject(data)) return
    const entity = this.world.entities.get(data.id)
    if (!entity) return
    if (entity.isPlayer && entity.data.owner !== socket.id) {
      return console.error('player attempted to modify another player', { socketId: socket.id, playerId: data.id })
    }
    if (entity.isPlayer && Object.hasOwn(data, 'x')) return
    if (
      entity.isPlayer &&
      Object.hasOwn(data, 'loading') &&
      data.loading !== null &&
      (!Number.isInteger(data.loading) || data.loading < 0 || data.loading > 100)
    )
      return
    if (entity.isPlayer && Object.hasOwn(data, 'seatPose')) {
      return console.error('player attempted to modify authoritative seat pose data', { playerId: data.id })
    }
    let changes
    if (entity.isPlayer) {
      changes = sanitizePlayerSelfModify(data, socket.id, {
        allowAvatar: socket.player.isBuilder() || !!this.world.settings.customAvatars,
      }) || { id: socket.id }
      if (Object.hasOwn(data, 'h')) changes.h = cloneHandTrackingPose(data.h)
      if (Object.hasOwn(data, 'loading')) changes.loading = data.loading
    } else if (entity.isApp) {
      const mover = entity.data.mover === socket.id
      const uploader = entity.data.uploader === socket.id
      changes = socket.player.isBuilder()
        ? sanitizeAppModify(data, socket.id, { blueprintExists: id => !!this.world.blueprints.get(id) })
        : sanitizeAppRelease(data, { mover, uploader })
      if (changes?.mover === null && entity.data.mover && !mover) delete changes.mover
      if (changes?.uploader === null && entity.data.uploader && !uploader) delete changes.uploader
    }
    if (!changes || Object.keys(changes).length <= 1) return
    entity.modify(changes)
    const seatContextChanged =
      entity.isPlayer &&
      (Object.hasOwn(changes, 'ef') || Object.hasOwn(changes, 'avatar') || Object.hasOwn(changes, 'sessionAvatar'))
    if (seatContextChanged) {
      const seatPose = getStoredSeatPose(this.world, entity)
      entity.modify({ seatPose })
      changes = { ...changes, seatPose }
    }
    this.send('entityModified', changes, socket.id)
    if (seatContextChanged) {
      socket.send('entityModified', { id: entity.data.id, seatPose: changes.seatPose })
      this.persistPlayerSession(socket)
    }
    if (entity.isApp) {
      // mark for saving
      this.dirtyApps.add(entity.data.id)
    }
    if (entity.isPlayer) {
      // persist player name and avatar changes
      const changes = {}
      let changed
      if (Object.hasOwn(data, 'name') && typeof entity.data.name === 'string') {
        changes.name = entity.data.name
        changed = true
      }
      if (Object.hasOwn(data, 'avatar') && (socket.player.isBuilder() || this.world.settings.customAvatars)) {
        changes.avatar = entity.data.avatar
        changed = true
      }
      if (changed) {
        await this.db('users').where('id', entity.data.userId).update(changes)
      }
    }
  }

  onEntityEvent = (socket, event, meta) => {
    if (this.stopping || this.world.fatalError) return
    if (!Array.isArray(event)) return
    const [id, version, name, data] = event
    if (typeof name !== 'string' || internalEvents.includes(name) || !Number.isSafeInteger(version) || version < 0)
      return
    const entity = this.world.entities.get(id)
    entity?.onEvent(version, name, data, socket.id, meta)
  }

  onBrowserInput = (socket, data) => {
    if (this.stopping || this.world.fatalError) return
    if (!socket.player?.isPlayer) return
    const { entityId, url, input } = data || {}
    const entity = this.world.entities.get(entityId)
    if (!entity?.isApp || !appHasBrowserSource(entity, url)) return
    if (input?.type === 'mouseMoved') {
      const now = Date.now()
      if (now - (socket.browserMoveAt || 0) < 30) return
      socket.browserMoveAt = now
    }
    this.browserCapture?.dispatchInput(entityId, url, input).catch(error => {
      console.error('[browser] input failed:', error.message)
    })
  }

  onPlayerSeatPose = (socket, data) => {
    if (this.stopping || this.world.fatalError) return
    const player = socket.player
    const reject = message => socket.send('playerSeatPoseResult', { ok: false, message })
    if (!player?.isPlayer || player.data.owner !== socket.id || player.data.id !== socket.id) {
      return reject('Only your own player can save a sitting pose')
    }

    const anchorId = player.data.effect?.anchorId
    if (!anchorId || !this.world.anchors.get(anchorId)) {
      return reject('You must be sitting in a seat to save its pose')
    }
    if (data?.anchorId !== anchorId) return reject('Your seat changed; reopen the pose editor')

    const profileId = sanitizeSeatProfileId(this.world.anchors.getProfileId?.(anchorId))
    if ((sanitizeSeatProfileId(data?.profileId) || null) !== profileId) {
      return reject('Your furniture profile changed; reopen the pose editor')
    }
    if (Object.hasOwn(data, 'saveToProfile') && typeof data.saveToProfile !== 'boolean') {
      return reject('The furniture profile option is invalid')
    }
    const saveToProfile = data.saveToProfile === true
    if (saveToProfile && !profileId) return reject('This seat has no reusable furniture profile')

    const avatarUrl = player.data.sessionAvatar || player.data.avatar || 'asset://avatar.vrm'
    if (data?.avatarUrl !== avatarUrl) return reject('Your avatar changed; reopen the pose editor')
    const userId = player.data.userId || player.data.id
    const reset = data.reset === true
    if (Object.hasOwn(data, 'reset') && typeof data.reset !== 'boolean') {
      return reject('The sitting pose reset option is invalid')
    }
    if (!this.world.storage?.set || (reset && !this.world.storage?.delete)) {
      return reject('Pose persistence is unavailable')
    }

    const seatKey = seatPoseStorageKey(userId, avatarUrl, anchorId)
    if (reset) {
      this.world.storage.delete(seatKey)
      if (profileId) this.world.storage.delete(seatPoseProfileStorageKey(userId, avatarUrl, profileId))
      player.modify({ seatPose: null })
      this.send('entityModified', { id: player.data.id, seatPose: null })
      socket.send('playerSeatPoseResult', { ok: true })
      return
    }

    const pose = sanitizeSeatPoseInput(data)
    if (!pose) return reject('The sitting pose data is invalid')
    const record = { version: SEAT_POSE_VERSION, anchorId, ...(profileId ? { profileId } : {}), ...pose }
    this.world.storage.set(seatKey, record)
    if (saveToProfile) {
      this.world.storage.set(seatPoseProfileStorageKey(userId, avatarUrl, profileId), {
        version: SEAT_POSE_VERSION,
        profileId,
        ...pose,
      })
    }
    player.modify({ seatPose: record })
    this.send('entityModified', { id: player.data.id, seatPose: record })
    socket.send('playerSeatPoseResult', { ok: true })
  }

  onPlayerSeatPoseStyles = (socket, data = {}) => {
    if (this.stopping || this.world.fatalError) return
    const player = socket.player
    const reply = (styles, error = null) => socket.send('playerSeatPoseStylesResult', { styles, error })
    if (!player?.isPlayer || player.data.owner !== socket.id || player.data.id !== socket.id) {
      return reply([], 'Only your own player can manage pose styles')
    }

    const userId = player.data.userId || player.data.id
    const key = seatPoseStylesStorageKey(userId)
    const styles = sanitizePoseStyles(this.world.storage?.get(key) || []) || []
    if (data.action === 'list') return reply(styles)

    if (data.action === 'save') {
      const name = sanitizePoseStyleName(data.name)
      const pose = sanitizeNormalizedPose(data.pose)
      if (!name || !pose) return reply(styles, 'Pose style name or pose is invalid')
      const index = styles.findIndex(style => style.name.toLocaleLowerCase('en') === name.toLocaleLowerCase('en'))
      if (index === -1 && styles.length >= 20) return reply(styles, 'You can save at most 20 pose styles')
      if (index === -1) styles.push({ name, pose })
      else styles[index] = { name, pose }
    } else if (data.action === 'delete') {
      const name = sanitizePoseStyleName(data.name)
      if (!name) return reply(styles, 'Pose style name is invalid')
      const index = styles.findIndex(style => style.name.toLocaleLowerCase('en') === name.toLocaleLowerCase('en'))
      if (index !== -1) styles.splice(index, 1)
    } else {
      return reply(styles, 'Unknown pose style action')
    }

    if (!this.world.storage?.set) return reply(styles, 'Pose persistence is unavailable')
    this.world.storage.set(key, styles)
    return reply(styles)
  }

  onEntityRemoved = (socket, id) => {
    if (this.stopping || this.world.fatalError) return
    if (typeof id !== 'string') return
    const entity = this.world.entities.get(id)
    if (!entity?.isApp) return
    if (!socket.player.isBuilder() && entity.data.uploader !== socket.id) return
    this.world.entities.remove(id)
    this.send('entityRemoved', id, socket.id)
    if (entity.isApp) this.dirtyApps.add(id)
  }

  onSettingsModified = (socket, data) => {
    if (this.stopping || this.world.fatalError) return
    if (!socket.player.isBuilder())
      return console.error('player attempted to modify settings without builder permission')
    if (!isPlainObject(data) || !isKnownSettingKey(data.key)) return
    if (isAdminOnlySettingKey(data.key) && !socket.player.isAdmin()) return
    const result = normalizeSettingValue(data.key, data.value)
    if (!result.ok || this.world.settings.set(data.key, result.value) === false) return
    this.send('settingsModified', { key: data.key, value: result.value }, socket.id)
  }

  onTimeCommand = (socket, data) => {
    const reply = (body, broadcast = false) => {
      const msg = {
        id: uuid(),
        from: null,
        fromId: null,
        body,
        createdAt: moment().toISOString(),
      }
      if (broadcast) this.world.chat.add(msg, true)
      else socket.send('chatAdded', msg)
    }
    if (!socket.player.isBuilder()) return reply('Changing world time requires builder permission.')
    const [, op, time] = data.args
    const now = this.getServerTime()
    const currentTime = getWorldTime(this.world.settings, now)
    const delta = getTimeOffset(time, new Date(currentTime), this.world.settings.timeZone)
    let offset
    let transition = null
    if (op === 'reset' && data.args.length === 2) {
      offset = 0
    } else if (op === 'set' && data.args.length === 3 && delta !== null) {
      const duration = Math.min(TIME_TRANSITION_DURATION, delta)
      offset = currentTime + delta - (now + duration)
      if (duration > 0) transition = { startedAt: now, endsAt: now + duration, fromOffset: currentTime - now }
    } else {
      return reply('Usage: /time set 13h23 (00h00–23h59), or /time reset.')
    }
    // Include the sender: commands do not apply an optimistic settings change on the client.
    this.world.settings.set('timeOffset', offset)
    this.send('settingsModified', { key: 'timeOffset', value: offset })
    this.world.settings.set('timeTransition', transition)
    this.send('settingsModified', { key: 'timeTransition', value: transition })
    if (!this.world.settings.dayNightCycle) {
      this.world.settings.set('dayNightCycle', true)
      this.send('settingsModified', { key: 'dayNightCycle', value: true })
    }
    reply(
      op === 'reset'
        ? 'World time reset to real time.'
        : `Fast-forwarding world time to ${time} (${this.world.settings.timeZone}); then continuing at normal speed.`,
      true
    )
  }

  onSpawnModified = async (socket, op) => {
    if (this.stopping || this.world.fatalError) return
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to modify spawn without builder permission')
    }
    const player = socket.player
    if (op === 'set') {
      const spawn = sanitizeSpawn(player.data)
      if (!spawn)
        return socket.send('chatAdded', {
          id: uuid(),
          body: 'Spawn not updated: invalid player transform',
          createdAt: moment().toISOString(),
        })
      await this.setSpawn(spawn)
    } else if (op === 'clear') {
      await this.setSpawn({ position: [0, 0, 0], quaternion: [0, 0, 0, 1] })
    } else {
      return
    }
    socket.send('chatAdded', {
      id: uuid(),
      from: null,
      fromId: null,
      body: op === 'set' ? 'Spawn updated' : 'Spawn cleared',
      createdAt: moment().toISOString(),
    })
  }

  onPlayerTeleport = (socket, data) => {
    this.dropPlayerRelay(socket, 'playerTeleport')
  }

  onPlayerPush = (socket, data) => {
    this.dropPlayerRelay(socket, 'playerPush')
  }

  onPlayerSessionAvatar = (socket, data) => {
    this.dropPlayerRelay(socket, 'playerSessionAvatar')
  }

  onAi = (socket, action) => {
    if (this.stopping || this.world.fatalError) return
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to use ai but they are not a builder')
    }
    this.world.ai.onAction(action)
  }

  onPing = (socket, time) => {
    socket.send(
      'pong',
      time && typeof time === 'object' ? { clientTime: time.clientTime, serverTime: this.getServerTime() } : time
    )
  }

  destroy() {
    this.profilingReports.clear()
    this.portalPreviews?.destroy()
    clearInterval(this.socketIntervalId)
    clearTimeout(this.saveTimerId)
  }

  onDisconnect = (socket, code) => {
    this.scheduler.purge(socket)
    this.world.apps?.eventLedger?.purgeSocket(socket.id)
    if (!socket.player) return
    this.persistPlayerSession(socket)
    this.world.livekit.clearModifiers(socket.id)
    socket.player.destroy(true)
    if (this.sockets.get(socket.id) === socket) this.sockets.delete(socket.id)
    this.profilingReports.delete(socket.id)
  }

  onPlayerSession = (socket, data) => {
    if (this.stopping || this.world.fatalError) return
    const session = sanitizePlayerSession(data)
    if (!session || !socket.player) return
    socket.playerSession = session
    this.persistPlayerSession(socket)
  }

  persistPlayerSession(socket) {
    if (!socket.playerSession || !socket.player) return
    const session = {
      ...socket.playerSession,
      effect: socket.player.data.effect?.anchorId ? { anchorId: socket.player.data.effect.anchorId } : null,
    }
    const serialized = JSON.stringify(session)
    if (serialized === socket.savedPlayerSession) return
    this.world.storage?.set(`playerSession:${socket.id}`, session)
    socket.savedPlayerSession = serialized
  }
}
