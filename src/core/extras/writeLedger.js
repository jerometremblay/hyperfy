// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/writeLedger.js
export const PACKET_CAP = 512 * 1024
export const BACKLOG_CAP = 1024 * 1024
export const SCRIPT_BACKLOG_CAP = 512 * 1024
export const SCRIPT_TICK_CAP = 512 * 1024
export const WRITE_OVERHEAD = 1024
export const SNAPSHOT_CAP = BACKLOG_CAP - WRITE_OVERHEAD

let snapshotWarned = false

// Transport state is weakly held; callbacks own their credit until ws completes each write.
export function createWriteLedger({ log = () => {} } = {}) {
  const states = new WeakMap()
  const warnings = new WeakMap()
  const systemWarnings = new Set()
  let scriptBytesThisTick = 0
  let scriptDepth = 0
  let context = null

  function state(ws) {
    let value = states.get(ws)
    if (!value) {
      value = { queued: 0, terminated: false, pingPending: false }
      states.set(ws, value)
    }
    return value
  }

  function failed() {
    for (let current = context; current; current = current.parent) current.failed = true
    return false
  }

  function refuse(name, reason) {
    const source = context?.source
    let seen = systemWarnings
    if (source) {
      seen = warnings.get(source)
      if (!seen) warnings.set(source, (seen = new Set()))
    }
    const key = context?.name || name
    if (!seen.has(key)) {
      seen.add(key)
      log(`[network] ${key} refused: ${reason}`)
    }
    return failed()
  }

  function asScript(fn, source, name) {
    const current = { parent: context, source: source || context?.source, name, failed: false }
    context = current
    scriptDepth++
    try {
      const result = fn()
      return current.failed ? false : result
    } finally {
      scriptDepth--
      context = current.parent
    }
  }

  // Called once before fan-out, so shared bytes and the exact-size copy are reserved only once.
  function prepare(packet, { script = false, name = 'packet', snapshot = false } = {}) {
    script ||= scriptDepth > 0
    snapshot &&= !script
    if (packet.length > (snapshot ? SNAPSHOT_CAP : PACKET_CAP)) return refuse(name, 'packet too large')
    if (snapshot && packet.length > SNAPSHOT_CAP / 2 && !snapshotWarned) {
      snapshotWarned = true
      log(`[network] warning: snapshot exceeds 50% of cap: bytes=${packet.length} cap=${SNAPSHOT_CAP}`)
    }
    if (script) {
      if (scriptBytesThisTick + packet.length > SCRIPT_TICK_CAP) return refuse(name, 'script tick full')
      scriptBytesThisTick += packet.length
    }
    if (packet.byteOffset !== 0 || packet.byteLength !== packet.buffer.byteLength) {
      return Uint8Array.prototype.slice.call(packet)
    }
    return packet
  }

  // A null packet is a ping. It has the same callback accounting as a data write.
  function write(ws, packet, { script = false, name = 'packet', prepared = false, snapshot = false } = {}) {
    script ||= scriptDepth > 0
    const entry = state(ws)
    if (entry.terminated || ws.readyState !== 1) return failed()
    const ping = packet === null
    if (!ping && !prepared) {
      packet = prepare(packet, { script, name, snapshot })
      if (packet === false) return false
    }
    const cost = (ping ? 0 : packet.length) + WRITE_OVERHEAD
    if (script && entry.queued + cost > SCRIPT_BACKLOG_CAP) return refuse(name, 'script backlog full')
    if (entry.queued + cost > BACKLOG_CAP) {
      entry.terminated = true
      log(`[network] write backlog full: queued=${entry.queued}`)
      ws.terminate()
      return failed()
    }
    entry.queued += cost
    if (ping) entry.pingPending = true
    let completed = false
    const complete = () => {
      if (completed) return
      completed = true
      entry.queued -= cost
      if (ping) entry.pingPending = false
    }
    try {
      if (ping) ws.ping(undefined, false, complete)
      else ws.send(packet, complete)
    } catch {
      complete()
      entry.terminated = true
      ws.terminate()
      return failed()
    }
    return true
  }

  function resetTick() {
    scriptBytesThisTick = 0
  }

  return { state, prepare, write, asScript, resetTick }
}
