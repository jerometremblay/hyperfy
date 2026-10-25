// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/entityModifyPolicy.js
// Server-side validation of client-sent entity mutations. Pure: no world, no sockets.
// Each sanitizer returns a new object holding only the permitted, well-formed fields
// (plus `id`), or null when nothing usable remains.

const NAME_MAX_LENGTH = 64
export const TRANSFORM_LIMIT = 1e6
export const QUATERNION_NORM_TOLERANCE = 0.1
const JSON_MAX_BYTES = 8 * 1024
const JSON_MAX_DEPTH = 16
const JSON_MAX_ITEMS = 1024
const AVATAR_URL_MAX_LENGTH = 512
// a .vrm in the world's asset store: a built-in name (avatar.vrm) or a content hash
const AVATAR_ASSET_URL = /^asset:\/\/[A-Za-z0-9._-]+\.vrm$/
const EMOTE_URL_MAX_LENGTH = 512
// a .glb in the asset store, with an optional playback query (the static route ignores the query)
const EMOTE_ASSET_URL = /^asset:\/\/[A-Za-z0-9._-]+\.glb(\?[A-Za-z0-9=&._-]*)?$/

const encoder = new TextEncoder()

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

export function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

export function boundedArray(value, length, limit) {
  if (!Array.isArray(value) || value.length !== length) return null
  const result = []
  for (let i = 0; i < length; i++) {
    const v = value[i]
    if (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > limit) return null
    result.push(v)
  }
  return result
}

export function unitQuaternion(value) {
  const q = boundedArray(value, 4, Infinity)
  if (!q) return null
  const n = Math.hypot(...q)
  if (!Number.isFinite(n) || Math.abs(n - 1) > QUATERNION_NORM_TOLERANCE) return null
  return q.map(v => v / n)
}

export function appScale(value) {
  if (!Array.isArray(value) || value.length !== 3) return null
  const result = []
  for (let i = 0; i < 3; i++) {
    const v = value[i]
    if (typeof v !== 'number') return null
    // keep the original scale, but reject values that vanish or overflow in native floats
    const f = Math.fround(v)
    if (!Number.isFinite(f) || f === 0) return null
    result.push(v)
  }
  return result
}

export function sanitizePersistedApp(data, { blueprintExists } = {}) {
  if (!isPlainObject(data) || data.type !== 'app') return null
  if (typeof data.id !== 'string' || !data.id) return null
  if (typeof data.blueprint !== 'string' || !data.blueprint || !blueprintExists?.(data.blueprint)) return null
  const repaired = []
  let position = boundedArray(data.position, 3, TRANSFORM_LIMIT)
  if (!position) {
    position = Array.isArray(data.position) && data.position.length === 3 ? data.position : [0, 0, 0]
    position = Array.from(position, v =>
      typeof v === 'number' && !Number.isNaN(v) ? Math.max(-TRANSFORM_LIMIT, Math.min(TRANSFORM_LIMIT, v)) : 0
    )
    repaired.push('position')
  }
  let quaternion = unitQuaternion(data.quaternion)
  if (!quaternion) {
    const q = boundedArray(data.quaternion, 4, Infinity)
    const max = q && Math.max(...q.map(Math.abs))
    // Scale first so finite, nonzero quaternions also normalize at extreme magnitudes.
    const scaled = max ? q.map(v => v / max) : null
    const norm = scaled && Math.hypot(...scaled)
    quaternion = norm ? unitQuaternion(scaled.map(v => v / norm)) : [0, 0, 0, 1]
  }
  if (!boundedArray(data.quaternion, 4, Infinity) || Math.abs(Math.hypot(...data.quaternion) - 1) > 1e-12) {
    repaired.push('quaternion')
  }
  let scale = appScale(data.scale)
  if (!scale) {
    scale = [1, 1, 1]
    repaired.push('scale')
  }
  return {
    data: { ...data, position, quaternion, scale, state: {} },
    repaired,
  }
}

export function sanitizeSpawn(data) {
  if (!isPlainObject(data)) return null
  const position = boundedArray(data.position, 3, TRANSFORM_LIMIT)
  const quaternion = unitQuaternion(data.quaternion)
  if (!position || !quaternion) return null
  return { position, quaternion }
}

// structural check of a tree made only of plain objects with string keys, arrays, strings,
// finite numbers, booleans and null, within depth and item limits. `state.chars` accumulates
// string and key characters: each is at least one serialized byte, so going over the byte
// budget here rejects early and keeps the final stringify small
function isJsonTree(value, depth, state) {
  if (value === null) return true
  switch (typeof value) {
    case 'string':
      state.chars += value.length
      return state.chars <= JSON_MAX_BYTES
    case 'number':
      return Number.isFinite(value)
    case 'boolean':
      return true
    case 'object':
      break
    default:
      return false
  }
  if (depth >= JSON_MAX_DEPTH) return false
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) return false
    for (let i = 0; i < value.length; i++) {
      if (++state.items > JSON_MAX_ITEMS) return false
      if (!isJsonTree(value[i], depth + 1, state)) return false
    }
    return true
  }
  if (!isPlainObject(value) || Object.getOwnPropertySymbols(value).length) return false
  for (const key of Object.keys(value)) {
    if (++state.items > JSON_MAX_ITEMS) return false
    state.chars += key.length
    if (state.chars > JSON_MAX_BYTES) return false
    if (!isJsonTree(value[key], depth + 1, state)) return false
  }
  return true
}

// a plain object holding only json values whose exact serialized size (utf-8 bytes of its
// JSON, escapes included) stays within budget. this is what gets retained, persisted and
// rebroadcast, so the retained value is what is bounded
export function isBoundedJsonObject(value) {
  if (!isPlainObject(value)) return false
  if (!isJsonTree(value, 0, { items: 0, chars: 0 })) return false
  try {
    return encoder.encode(JSON.stringify(value)).length <= JSON_MAX_BYTES
  } catch (err) {
    return false
  }
}

export function sanitizeName(value) {
  if (typeof value !== 'string') return undefined
  return value.slice(0, NAME_MAX_LENGTH)
}

// an avatar url a client may set, wherever it arrives from (self-modify, a connection parameter, a
// server-sent session avatar): null/undefined/'' (each clears a session avatar, as '' always has), an asset
// .vrm, or an http(s) url that parses. anything else, including data:/blob:/javascript: urls, is not applied
export function isAvatarUrl(value) {
  if (value === undefined || value === null || value === '') return true
  if (typeof value !== 'string' || value.length > AVATAR_URL_MAX_LENGTH) return false
  if (AVATAR_ASSET_URL.test(value)) return true
  return isHttpUrl(value)
}

// an emote animation other players will load for this player: a .glb in the asset store (a built-in such as
// emote-float.glb or a content hash), optionally with the playback query the avatar reads (?s=1.5, ?l=0,
// ?g=1), or an http(s) url. undefined/null clear. the local player's own emote is not checked here
export function isEmoteUrl(value) {
  if (value === undefined || value === null) return true
  if (typeof value !== 'string' || value.length > EMOTE_URL_MAX_LENGTH) return false
  if (EMOTE_ASSET_URL.test(value)) return true
  return isHttpUrl(value)
}

function isHttpUrl(value) {
  // the literal prefix the loader passes through unchanged (World.resolveURL); spellings such as
  // `http:/x` or `https:host/a.vrm` parse but would be rewritten before loading, so they are refused
  if (!/^https?:\/\//i.test(value)) return false
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch (err) {
    return false
  }
}

// fields the owning socket may change on its own player.
// rank, health, owner and userId are server-controlled and never copied.
export function sanitizePlayerSelfModify(data, socketId, { allowAvatar = false } = {}) {
  if (!isPlainObject(data)) return null
  const safe = { id: socketId }
  const p = boundedArray(data.p, 3, TRANSFORM_LIMIT)
  const q = unitQuaternion(data.q)
  const m = data.m
  const a = boundedArray(data.a, 3, TRANSFORM_LIMIT)
  const g = boundedArray(data.g, 3, TRANSFORM_LIMIT)
  if (p) safe.p = p
  if (q) safe.q = q
  if (Number.isFinite(m)) safe.m = m
  if (a) safe.a = a
  if (g) safe.g = g
  // undefined clears the emote; a value other players must not load is turned into null, not dropped, so
  // they do not stay frozen on the previous emote
  if (has(data, 'e')) {
    const e = data.e
    safe.e = isEmoteUrl(e) ? e : null
  }
  if (has(data, 'ef')) {
    let ef = data.ef
    if (isPlainObject(ef) && has(ef, 'anchorId')) {
      // retain the checked anchor id, even when a host caller supplies a getter
      ef = { ...ef }
      if (typeof ef.anchorId !== 'string' || ef.anchorId.length > 128) ef = undefined
    }
    if (ef === null || isBoundedJsonObject(ef)) safe.ef = ef
  }
  if (data.t === true) safe.t = true
  if (has(data, 'name')) {
    const name = sanitizeName(data.name)
    if (name !== undefined) safe.name = name
  }
  // each url is read once, so the value checked is the value kept
  if (has(data, 'sessionAvatar')) {
    const sessionAvatar = data.sessionAvatar
    if (isAvatarUrl(sessionAvatar)) safe.sessionAvatar = sessionAvatar
  }
  if (allowAvatar) {
    const avatar = data.avatar
    if (typeof avatar === 'string' && isAvatarUrl(avatar)) safe.avatar = avatar
  }
  return Object.keys(safe).length > 1 ? safe : null
}

// fields a builder may change on an app
export function sanitizeAppModify(data, socketId, { blueprintExists } = {}) {
  if (!isPlainObject(data)) return null
  const safe = { id: data.id }
  const isOwnerOrNull = value => value === null || value === socketId
  const blueprint = data.blueprint
  if (typeof blueprint === 'string' && blueprint) {
    if (!blueprintExists || blueprintExists(blueprint)) safe.blueprint = blueprint
  }
  // `uploader` is claimed only when the app is added; a modify may only clear it
  if (data.uploader === null) safe.uploader = null
  const mover = data.mover
  if (isOwnerOrNull(mover)) safe.mover = mover
  const position = boundedArray(data.position, 3, TRANSFORM_LIMIT)
  const quaternion = unitQuaternion(data.quaternion)
  const scale = appScale(data.scale)
  if (position) safe.position = position
  if (quaternion) safe.quaternion = quaternion
  if (scale) safe.scale = scale
  const pinned = data.pinned
  if (typeof pinned === 'boolean') safe.pinned = pinned
  if (has(data, 'state')) {
    const state = data.state
    if (state === null || isBoundedJsonObject(state)) safe.state = state
  }
  return Object.keys(safe).length > 1 ? safe : null
}

// a sender that is no longer a builder may only finish or cancel its own move and/or upload:
// only `mover`/`uploader` may be cleared. both releases combine when the sender holds both.
export function sanitizeAppRelease(data, { mover = false, uploader = false } = {}) {
  if (!isPlainObject(data)) return null
  const safe = { id: data.id }
  if (mover && data.mover === null) safe.mover = null
  if (uploader && data.uploader === null) safe.uploader = null
  return Object.keys(safe).length > 1 ? safe : null
}

// a new app entity. structural fields are required; the fields an undo re-add may carry
// stale (mover, uploader, pinned, state) are coerced instead of rejected.
export function sanitizeEntityAdd(data, socketId, { blueprintExists, entityExists } = {}) {
  if (!isPlainObject(data)) return null
  if (data.type !== 'app') return null
  const id = data.id
  const blueprint = data.blueprint
  if (typeof id !== 'string' || !id || (entityExists && entityExists(id))) return null
  if (typeof blueprint !== 'string' || (blueprintExists && !blueprintExists(blueprint))) return null
  const position = boundedArray(data.position, 3, TRANSFORM_LIMIT)
  const quaternion = unitQuaternion(data.quaternion)
  const scale = appScale(data.scale)
  if (!position || !quaternion || !scale) return null
  const isOwnerOrNull = value => value === null || value === socketId
  const mover = data.mover
  const uploader = data.uploader
  const state = data.state
  return {
    id,
    type: 'app',
    blueprint,
    position,
    quaternion,
    scale,
    mover: isOwnerOrNull(mover) ? mover : null,
    uploader: isOwnerOrNull(uploader) ? uploader : null,
    pinned: data.pinned === true,
    state: isBoundedJsonObject(state) ? state : {},
  }
}
