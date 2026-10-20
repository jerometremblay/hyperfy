import { createHash } from 'node:crypto'
import fs from 'fs-extra'
import path from 'node:path'
import { unpack } from 'msgpackr'
import * as THREE from '../core/extras/three'

export const SNAPSHOT_INTERVAL = 24 * 60 * 60 * 1000
const visualKeys = ['dayNightCycle', 'latitude', 'longitude', 'timeZone', 'timeOffset', 'timeTransition']
const scriptURL = code => `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`
const quaternion = rotation =>
  new THREE.Quaternion().setFromEuler(new THREE.Euler().fromArray(rotation || [0, 0, 0, 'XYZ'])).toArray()

function snapshot(entities, blueprints, spawn, assetsUrl, settings = {}) {
  // A doorway's front faces back toward the arrival view. Its center is above the feet.
  const rotation = new THREE.Quaternion().fromArray(spawn.quaternion)
  rotation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI))
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3().fromArray(spawn.position).add(new THREE.Vector3(0, 1.2, 0)),
    rotation,
    new THREE.Vector3(1, 1, 1)
  )
  return {
    type: 'snapshot',
    version: 1,
    serverTime: 0,
    serverTimestamp: Date.now(),
    assetsUrl,
    endpoints: { '': matrix.toArray() },
    settings: Object.fromEntries(
      visualKeys.filter(key => settings[key] !== undefined).map(key => [key, settings[key]])
    ),
    blueprints,
    added: entities,
    modified: [],
    removed: [],
  }
}

export function convertVanillaSnapshot(data) {
  const player = data.entities.find(entity => entity.type === 'player' && entity.owner === data.id)
  if (!player) throw new Error('Anonymous spawn missing from snapshot')
  const blueprints = data.blueprints.filter(bp => !bp.disabled)
  const allowed = new Set(blueprints.map(bp => bp.id))
  // Keep geometry with unknown extent conservatively; the replica culls by actual bounds after loading.
  const entities = data.entities.filter(
    entity => entity.type === 'app' && allowed.has(entity.blueprint) && !entity.mover
  )
  return snapshot(entities, blueprints, player, data.assetsUrl, data.settings)
}

export function convertLegacySnapshot(data) {
  const spawn = data.snapshot.find(entity => entity.id === 'hyperfy-spawn')
  if (!spawn) throw new Error('Legacy spawn missing from snapshot')
  const entities = [],
    blueprints = []
  for (const item of data.snapshot) {
    const fields = item.state?.$fields || {}
    let model = 'script-only',
      code = ''
    if (item.id === 'hyperfy-model') model = fields.src?.url || fields.url
    else if (item.id === 'hyperfy-grabbable') model = fields.model?.url
    else if (item.id === 'hyperfy-vrm') model = fields.vrm?.url
    else if (item.id === 'hyperfy-image') {
      const src = fields.src?.url || fields.url
      if (!src) continue
      code = `app.add(app.create('image', ${JSON.stringify({ src, height: fields.height || 1, lit: !!fields.lit, doubleside: !!fields.doubleside })}))`
    } else if (item.id === 'hyperfy-sky') {
      code = `app.add(app.create('sky', ${JSON.stringify({ bg: fields.bgFile?.url || null, hdr: fields.hdrFile?.url || null })}))`
    } else continue
    if (!model) continue
    const id = `legacy-${item.uid}`
    const scale = typeof fields.scale === 'number' && fields.scale > 0 ? fields.scale : 1
    blueprints.push({ id, version: 0, name: item.id, model, script: code ? scriptURL(code) : null, props: {} })
    entities.push({
      id,
      type: 'app',
      blueprint: id,
      position: item.position,
      quaternion: quaternion(item.rotation),
      scale: [scale, scale, scale],
      state: {},
    })
  }
  return snapshot(
    entities,
    blueprints,
    { position: spawn.position, quaternion: quaternion(spawn.rotation) },
    'https://data.hyperfy.xyz'
  )
}

async function json(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000), credentials: 'omit' })
  if (!response.ok) throw new Error(`Destination HTTP ${response.status}`)
  return response.json()
}

// Exactly one initial snapshot, no gameplay/voice, no reuse or persistence of guest credentials.
export function joinSnapshot(url, legacyToken) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'
    let settled = false
    const finish = (error, data) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      ws.close()
      if (error) reject(error)
      else resolve(data)
    }
    const timeout = setTimeout(() => finish(new Error('Anonymous snapshot timed out')), 15000)
    ws.onopen = () => {
      if (legacyToken)
        ws.send(JSON.stringify({ t: 'e', n: 'auth', d: { authToken: legacyToken, deviceType: 'desktop' } }))
    }
    ws.onmessage = event => {
      try {
        if (legacyToken) {
          const message = JSON.parse(event.data)
          if (message.n === 'init') finish(null, message.d)
        } else {
          const [id, data] = unpack(new Uint8Array(event.data))
          if (id === 0) finish(null, data)
          else if (typeof data === 'string' && ['outdated', 'player_limit'].includes(data))
            finish(new Error(`Anonymous join refused: ${data}`))
        }
      } catch (error) {
        finish(error)
      }
    }
    ws.onerror = () => finish(new Error('Anonymous connection failed'))
    ws.onclose = () => finish(new Error('Anonymous connection closed before snapshot'))
  })
}

export async function captureVanillaPortal(destination) {
  const url = new URL(destination)
  if (url.hostname === 'hyperfy.io') {
    const world = await json(
      `https://api.hyperfy.io/world?slug=${encodeURIComponent(url.pathname.split('/').filter(Boolean)[0] || 'world')}`
    )
    const guest = await json('https://api.hyperfy.io/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const shard = url.pathname.split('/').filter(Boolean)[1]
    const server = await json(
      `https://api.hyperfy.io/server?worldId=${encodeURIComponent(world.id)}${shard ? `&shard=${encodeURIComponent(shard)}` : ''}`,
      { headers: { 'X-Auth-Token': guest.authToken } }
    )
    if (!server.url) throw new Error('Legacy server unavailable')
    return convertLegacySnapshot(await joinSnapshot(server.url, guest.authToken))
  }
  // env.js is a plain public assignment. Parse its JSON; never execute destination code on the server.
  const envURL = new URL('env.js', `${url.origin}${url.pathname.replace(/\/$/, '')}/`)
  const response = await fetch(envURL, { signal: AbortSignal.timeout(15000), credentials: 'omit' })
  if (!response.ok) throw new Error('Destination environment unavailable')
  const source = await response.text()
  const assignment = source.match(/(?:globalThis|window)\.env\s*=\s*(\{[^\n]*\})/g)?.at(-1)
  if (!assignment) throw new Error('Destination environment unsupported')
  const env = JSON.parse(assignment.slice(assignment.indexOf('=') + 1).trim())
  const socket = new URL(env.PUBLIC_WS_URL)
  if (!['ws:', 'wss:'].includes(socket.protocol)) throw new Error('Invalid destination socket')
  socket.searchParams.set('authToken', 'null')
  // Vanilla v2 accepts extra query parameters; current upstream revisions require v=2.
  socket.searchParams.set('v', '2')
  return convertVanillaSnapshot(await joinSnapshot(socket.href))
}

/** Shared persistent daily cache; failures retain the previous successful snapshot. */
export class VanillaPortalSnapshots {
  constructor(directory, capture = captureVanillaPortal, now = Date.now) {
    this.directory = directory
    this.capture = capture
    this.now = now
    this.pending = new Map()
  }

  get(url) {
    if (this.pending.has(url)) return this.pending.get(url)
    const operation = this.load(url).finally(() => this.pending.delete(url))
    this.pending.set(url, operation)
    return operation
  }

  async load(url) {
    const file = path.join(this.directory, `${createHash('sha256').update(url).digest('hex')}.json`)
    let cached = await fs.readJson(file).catch(() => null)
    if (cached && this.now() - cached.attemptedAt < SNAPSHOT_INTERVAL) {
      if (!cached.snapshot) throw new Error('Destination snapshot unavailable; next refresh within 24 hours')
      return { ...cached.snapshot, refreshAt: cached.attemptedAt + SNAPSHOT_INTERVAL }
    }
    cached = { ...cached, attemptedAt: this.now() }
    try {
      cached.snapshot = await this.capture(url)
      cached.capturedAt = this.now()
    } catch (error) {
      if (!cached.snapshot) cached.error = error.message
    }
    await fs.ensureDir(this.directory)
    await fs.writeJson(`${file}.tmp`, cached)
    await fs.move(`${file}.tmp`, file, { overwrite: true })
    if (!cached.snapshot) throw new Error(cached.error || 'Destination snapshot unavailable')
    return { ...cached.snapshot, refreshAt: cached.attemptedAt + SNAPSHOT_INTERVAL }
  }
}
