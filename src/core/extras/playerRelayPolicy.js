// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/playerRelayPolicy.js
// The player packets a server script sends to one client (playerTeleport, playerPush, playerSessionAvatar).
// Pure: the client checks a payload before it reaches physics or the avatar loader, and the server drops
// the same packets when a client sends them. The client-originated relays of these packets to other
// players were removed; the names stay registered for the server -> client direction.
// Every property is read once, so the value checked is the value kept.
import { isAvatarUrl, isPlainObject, TRANSFORM_LIMIT } from './entityModifyPolicy.js'

export const PUSH_LIMIT = 1e4

// three finite numbers within the relay bound, read once, returned as a new array
function finiteTriple(value, limit) {
  if (!Array.isArray(value) || value.length !== 3) return null
  const x = value[0]
  const y = value[1]
  const z = value[2]
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null
  if (Math.abs(x) > limit || Math.abs(y) > limit || Math.abs(z) > limit) return null
  return [x, y, z]
}

export function sanitizeTeleport(data) {
  if (!isPlainObject(data)) return null
  const position = finiteTriple(data.position, TRANSFORM_LIMIT)
  if (!position) return null
  const safe = { position }
  // a rotationY that is not a finite number is left out, not rejected: respawn hooks pass a quaternion here
  const rotationY = data.rotationY
  if (Number.isFinite(rotationY)) safe.rotationY = rotationY
  return safe
}

export function sanitizePush(data) {
  if (!isPlainObject(data)) return null
  const force = finiteTriple(data.force, PUSH_LIMIT)
  if (!force) return null
  return { force }
}

// `{ avatar }`, where null/undefined clears the session avatar. only a plain object counts as that shape:
// a decoded array, Map or typed array has no avatar and must not clear anything
export function sanitizeSessionAvatar(data) {
  if (!isPlainObject(data)) return null
  const avatar = data.avatar
  if (!isAvatarUrl(avatar)) return null
  return { avatar }
}

// the server's handling of a relay packet a client sent: ignore it and say so once per socket and packet
// name, since a script may send one every frame
export function createRelayDrop(warn = console.warn) {
  const seen = new WeakMap()
  return (socket, name) => {
    let names = seen.get(socket)
    if (!names) seen.set(socket, (names = new Set()))
    if (names.has(name)) return
    names.add(name)
    warn(`[network] ${name} from client ${socket.id} ignored: only server scripts may act on other players`)
  }
}
