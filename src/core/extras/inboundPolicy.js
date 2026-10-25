// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/inboundPolicy.js
// Admission pays for bytes before inspecting the header, then for every node the strict scan charges.
import { packetNameById, peekPacketId } from '../packets.js'
import { createLogOnce } from './logOnce.js'
import { strictDecode } from './strictDecode.js'

export const INBOUND_BYTE_LIMITS = Object.freeze({
  entityEvent: 64 * 1024,
  blueprintAdded: 64 * 1024,
  blueprintModified: 64 * 1024,
  ai: 64 * 1024,
})
export const INBOUND_DEFAULT_BYTE_LIMIT = 32 * 1024
export const INBOUND_NODE_LIMITS = Object.freeze({
  entityEvent: 8192,
  blueprintAdded: 8192,
  blueprintModified: 8192,
  ai: 1024,
})
export const INBOUND_DEFAULT_NODE_LIMIT = 4096
const CLIENT_PACKET_NAMES = new Set([
  'command',
  'chatAdded',
  'blueprintAdded',
  'blueprintModified',
  'entityAdded',
  'entityModified',
  'entityEvent',
  'entityRemoved',
  'settingsModified',
  'spawnModified',
  'modifyRank',
  'kick',
  'mute',
  'ai',
  'ping',
  'browserInput',
  'playerSeatPose',
  'playerSeatPoseStyles',
  'playerExpression',
  'profilerReport',
  'playerSession',
])

export const BUILDER_ONLY_PACKETS = Object.freeze(['blueprintAdded', 'blueprintModified', 'ai'])

export const INBOUND_RATE_PER_SECOND = 1024
export const INBOUND_BURST = 2048
export const INBOUND_UNIT_BYTES = 2048

export const INBOUND_WORK_PER_TICK = 9216
export const INBOUND_QUANTUM = 512
export const INBOX_ENTRY_OVERHEAD = 160
export const INBOX_RESERVE = 160 * 1024
export const INBOX_SOCKET_CAP = 1024 * 1024
export const INBOX_POOL_CAP = 16 * 1024 * 1024

export function packetByteLimit(name) {
  return INBOUND_BYTE_LIMITS[name] ?? INBOUND_DEFAULT_BYTE_LIMIT
}

export function packetNodeLimit(name) {
  return INBOUND_NODE_LIMITS[name] ?? INBOUND_DEFAULT_NODE_LIMIT
}

export function packetCost(bytes) {
  return 1 + Math.floor(bytes / INBOUND_UNIT_BYTES)
}

/**
 * Inbound Gate
 * - admit(socket, packet, { builder }) checks the header, byte cap and strict node scan before enqueueing.
 * - each refusal is counted per socket and the first of each kind is logged without packet content;
 *   the gate never closes the socket for a refused packet.
 */
export function createInboundGate({ now = Date.now, log = console.warn, scan = strictDecode } = {}) {
  const states = new WeakMap()
  const logOnce = createLogOnce(log)

  const stateOf = socket => {
    let state = states.get(socket)
    if (!state) states.set(socket, (state = { tokens: INBOUND_BURST, at: now(), dropped: 0 }))
    return state
  }
  const refuse = (socket, key, name, reason) => {
    stateOf(socket).dropped++
    logOnce(socket, key, `[network] ${name} from client ${socket.id} dropped: ${reason} (further drops are counted)`)
    return false
  }

  function admit(socket, packet, { builder = false } = {}) {
    const bytes = packet.length
    const state = stateOf(socket)
    const t = now()
    state.tokens = Math.min(INBOUND_BURST, state.tokens + ((t - state.at) / 1000) * INBOUND_RATE_PER_SECOND)
    state.at = t
    const cost = packetCost(bytes)
    const ok = state.tokens >= cost
    state.tokens = Math.max(-INBOUND_BURST, state.tokens - cost)
    if (!ok) return refuse(socket, 'rate', 'packet', 'rate limit')

    const name = packetNameById(peekPacketId(packet))
    if (name && !CLIENT_PACKET_NAMES.has(name)) return refuse(socket, 'direction', name, 'server-only packet')
    if (!name) return refuse(socket, 'unknown', 'packet', 'unreadable header')
    if (!builder && BUILDER_ONLY_PACKETS.includes(name)) {
      return refuse(socket, `${name}:builder`, name, 'builder only')
    }
    const limit = packetByteLimit(name)
    if (bytes > limit) {
      return refuse(socket, `${name}:size`, name, `${bytes} bytes over the ${limit} byte limit`)
    }
    const result = scan(packet, { maxNodes: packetNodeLimit(name), build: false })
    state.tokens = Math.max(-INBOUND_BURST, state.tokens - Math.floor(result.nodes / 32))
    if (!result.ok) {
      return refuse(socket, 'undecodable', name, `undecodable (${result.reason} at pos ${result.pos})`)
    }
    return { name, bytes, nodes: result.nodes, builder }
  }

  function dropped(socket) {
    return states.get(socket)?.dropped ?? 0
  }

  return { admit, refuse, dropped }
}

export function createInboundScheduler() {
  const queue = []
  const deferred = []
  let flushing = false
  let pool = 0

  // Reserve before copying. Deferred arrivals hold the same credit as inbox entries.
  function reserve(socket, entry) {
    if (socket.disconnected) return false
    const cost = entry.bytes + INBOX_ENTRY_OVERHEAD
    const before = socket.inboxCost
    const after = before + cost
    const over = Math.max(0, after - INBOX_RESERVE) - Math.max(0, before - INBOX_RESERVE)
    if (after > INBOX_RESERVE && (after > INBOX_SOCKET_CAP || pool + over > INBOX_POOL_CAP)) return false
    socket.inboxCost = after
    pool += over
    entry.cost = cost
    entry.work = entry.nodes + Math.floor(entry.bytes / 128)
    entry.released = false
    return true
  }

  function release(socket, entry) {
    if (entry.released) return
    entry.released = true
    const before = socket.inboxCost
    socket.inboxCost -= entry.cost
    pool -= Math.max(0, before - INBOX_RESERVE) - Math.max(0, socket.inboxCost - INBOX_RESERVE)
  }

  function enqueue(socket, entry) {
    if (flushing) {
      deferred.push([socket, entry])
      return
    }
    socket.inbox.push(entry)
    if (!socket.inQueue) {
      socket.inQueue = true
      queue.push(socket)
    }
  }

  function purge(socket) {
    if (!socket.disconnected) return
    for (const entry of socket.inbox.splice(0)) release(socket, entry)
    for (let i = deferred.length - 1; i >= 0; i--) {
      if (deferred[i][0] !== socket) continue
      release(socket, deferred[i][1])
      deferred.splice(i, 1)
    }
  }

  function flush(dispatch) {
    flushing = true
    let workLeft = INBOUND_WORK_PER_TICK
    try {
      while (queue.length) {
        const socket = queue[0]
        if (socket.disconnected) {
          queue.shift()
          socket.inQueue = false
          purge(socket)
          continue
        }
        if (socket.inbox.length === 0) {
          queue.shift()
          socket.inQueue = false
          continue
        }
        if (socket.inbox[0].work > workLeft) break
        queue.shift()
        let used = 0
        do {
          const entry = socket.inbox.shift()
          release(socket, entry)
          used += entry.work
          workLeft -= entry.work
          dispatch(socket, entry)
        } while (
          !socket.disconnected &&
          socket.inbox.length &&
          used + socket.inbox[0].work <= INBOUND_QUANTUM &&
          socket.inbox[0].work <= workLeft
        )
        if (!socket.disconnected && socket.inbox.length) queue.push(socket)
        else {
          socket.inQueue = false
          if (socket.disconnected) purge(socket)
        }
      }
    } finally {
      flushing = false
      for (const [socket, entry] of deferred.splice(0)) enqueue(socket, entry)
    }
  }

  return {
    reserve,
    release,
    enqueue,
    purge,
    flush,
    get pool() {
      return pool
    },
  }
}
