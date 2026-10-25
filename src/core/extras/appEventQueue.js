// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/appEventQueue.js
// Events received while an app rebuilds share a ledger, so many apps cannot each retain a full queue.
export const APP_EVENT_QUEUE_MAX = 64
export const APP_EVENT_QUEUE_BYTES = 256 * 1024
export const APP_EVENT_QUEUE_NODES = 16384
export const APP_EVENT_LEDGER_BYTES = 2 * 1024 * 1024
export const APP_EVENT_LEDGER_NODES = 65536
export const APP_EVENT_KEEP_BYTES = 64 * 1024
export const APP_EVENT_KEEP_NODES = 8192
export const APP_EVENT_KEEP_TTL = 60000

export function createEventLedger({
  maxBytes = APP_EVENT_LEDGER_BYTES,
  maxNodes = APP_EVENT_LEDGER_NODES,
  now = Date.now,
} = {}) {
  const entries = new Set()
  const sockets = new Map()
  let bytes = 0
  let nodes = 0
  let keptBytes = 0
  let keptNodes = 0

  return {
    maxBytes,
    maxNodes,
    now,
    get bytes() {
      return bytes
    },
    get nodes() {
      return nodes
    },
    get keptBytes() {
      return keptBytes
    },
    get keptNodes() {
      return keptNodes
    },
    prepareKeep(socketId, blueprintId) {
      const socket = sockets.get(socketId)
      if (socket && socket.blueprintId !== blueprintId) {
        for (const entry of socket.entries) entry.drop('kept blueprint changed')
      }
    },
    overBudget(entry) {
      if (bytes + entry.bytes > maxBytes) return 'ledger bytes'
      if (nodes + entry.nodes > maxNodes) return 'ledger nodes'
      if (entry.kept) {
        const socket = sockets.get(entry.socketId)
        if ((socket?.bytes || 0) + entry.wire > APP_EVENT_KEEP_BYTES) return 'socket kept bytes'
        if ((socket?.nodes || 0) + entry.nodes > APP_EVENT_KEEP_NODES) return 'socket kept nodes'
        if (keptBytes + entry.bytes > maxBytes / 4) return 'kept reserve bytes'
        if (keptNodes + entry.nodes > maxNodes / 4) return 'kept reserve nodes'
      }
    },
    add(entry) {
      entries.add(entry)
      bytes += entry.bytes
      nodes += entry.nodes
      if (entry.kept) {
        keptBytes += entry.bytes
        keptNodes += entry.nodes
        let socket = sockets.get(entry.socketId)
        if (!socket) {
          socket = { blueprintId: entry.blueprintId, bytes: 0, nodes: 0, entries: new Set() }
          sockets.set(entry.socketId, socket)
        }
        socket.bytes += entry.wire
        socket.nodes += entry.nodes
        socket.entries.add(entry)
      }
    },
    release(entry) {
      if (!entries.delete(entry)) return
      bytes -= entry.bytes
      nodes -= entry.nodes
      if (entry.kept) {
        keptBytes -= entry.bytes
        keptNodes -= entry.nodes
        const socket = sockets.get(entry.socketId)
        socket.bytes -= entry.wire
        socket.nodes -= entry.nodes
        socket.entries.delete(entry)
        if (!socket.entries.size) sockets.delete(entry.socketId)
      }
    },
    purgeSocket(id) {
      for (const entry of entries) {
        if (entry.socketId === id) entry.drop('socket disconnected')
      }
    },
    sweepExpired(time = now()) {
      for (const entry of entries) {
        if (entry.kept && entry.expiresAt <= time) entry.drop('kept expired')
      }
    },
  }
}

export function createEventQueue({
  ledger = createEventLedger(),
  isServer = false,
  max = APP_EVENT_QUEUE_MAX,
  maxBytes = APP_EVENT_QUEUE_BYTES,
  maxNodes = APP_EVENT_QUEUE_NODES,
  onDrop = () => {},
} = {}) {
  const entries = []
  let bytes = 0
  let nodes = 0

  function remove(entry, reason) {
    const index = entries.indexOf(entry)
    if (index === -1) return
    entries.splice(index, 1)
    bytes -= entry.bytes
    nodes -= entry.nodes
    ledger.release(entry)
    if (reason) onDrop(reason)
  }

  function overBudget(entry) {
    if (entries.length + 1 > max) return 'queue full'
    if (bytes + entry.bytes > maxBytes) return 'queue bytes'
    if (nodes + entry.nodes > maxNodes) return 'queue nodes'
    return ledger.overBudget(entry)
  }

  function push(event, meta, { keep = false, blueprintId } = {}) {
    if (
      isServer &&
      (!Number.isSafeInteger(meta?.bytes) || meta.bytes < 0 || !Number.isSafeInteger(meta?.nodes) || meta.nodes < 1)
    ) {
      onDrop('invalid cost')
      return false
    }
    if (keep && (!meta?.builder || meta.socketId == null)) {
      onDrop('future version')
      return false
    }
    const entry = {
      event,
      bytes: isServer ? 2 * meta.bytes : 0,
      nodes: isServer ? meta.nodes : 0,
      wire: isServer ? meta.bytes : 0,
      socketId: meta?.socketId,
      blueprintId,
      kept: keep,
      expiresAt: keep ? ledger.now() + APP_EVENT_KEEP_TTL : null,
      drop: reason => remove(entry, reason),
    }
    if (keep) ledger.prepareKeep(entry.socketId, blueprintId)
    let reason
    while ((reason = overBudget(entry))) {
      if (!entries.length) {
        onDrop(reason)
        return false
      }
      remove(entries[0], reason)
    }
    entries.push(entry)
    bytes += entry.bytes
    nodes += entry.nodes
    ledger.add(entry)
    return true
  }

  // Retaining current + 1 must not hold back deliverable events behind it. Release before invoking scripts,
  // which may enqueue more events, clear the queue or rebuild the app again.
  function drain(current, emit, onError, { latest = current, author } = {}) {
    let delivered = 0
    let dropped = 0
    let index = 0
    while (index < entries.length) {
      const entry = entries[index]
      const { event } = entry
      let reason
      if (event.version > latest + 1 || event.version > current + 1) reason = 'future version'
      else if (entry.kept && entry.expiresAt <= ledger.now()) reason = 'kept expired'
      else if (event.version > current) {
        index++
        continue
      } else if (entry.kept && (author?.version !== event.version || author.socketId !== entry.socketId)) {
        reason = 'kept author mismatch'
      }
      remove(entry, reason)
      if (reason) {
        dropped++
        continue
      }
      try {
        emit(event)
        delivered++
      } catch (err) {
        onError?.(err, event)
      }
      index = 0
    }
    return { delivered, dropped }
  }

  function clear() {
    while (entries.length) remove(entries[0], 'queue cleared')
  }

  return {
    push,
    drain,
    clear,
    get size() {
      return entries.length
    },
    get bytes() {
      return bytes
    },
    get nodes() {
      return nodes
    },
  }
}
