import { System } from './System'

// Opt-in exclusive synchronous script timing; native physics and async work are excluded.
export class ServerProfiler extends System {
  constructor(world) {
    super(world)
    this.active = false
    this.requested = false
    this.pending = new Map()
    this.stack = []
    this.report = null
  }

  toggle(enabled = !this.requested) {
    this.requested = enabled
    return this.refreshActive()
  }

  refreshActive() {
    const network = this.world.network
    const now = Date.now()
    const viewing = [...(network?.profilingReports || [])].some(([id, report]) => {
      const socket = network.sockets.get(id)
      return socket === report.socket && socket.player?.isAdmin() && now - report.receivedAt <= 10000
    })
    const enabled = this.requested || viewing
    if (this.active === enabled) return this.active
    this.active = enabled
    this.pending = new Map()
    this.report = null
    this.startedAt = performance.now()
    return this.active
  }

  measure(id, name, fn, args = [], receiver) {
    if (!this.active) return fn.apply(receiver, args)
    const entity = this.world.entities.get(id)
    const version = this.world.blueprints.get(entity?.data.blueprint)?.version
    const pending = this.pending
    const started = performance.now()
    const frame = { children: 0 }
    this.stack.push(frame)
    try {
      return fn.apply(receiver, args)
    } finally {
      const duration = performance.now() - started
      this.stack.pop()
      const parent = this.stack[this.stack.length - 1]
      if (parent) parent.children += duration
      if (this.active && this.pending === pending) {
        let item = this.pending.get(id)
        if (!item || item.blueprintVersion !== version) {
          item = { id, blueprintVersion: version, cpu: 0, peak: 0, callbacks: Object.create(null) }
          this.pending.set(id, item)
        }
        const own = Math.max(0, duration - frame.children)
        item.cpu += own
        item.peak = Math.max(item.peak, own)
        item.callbacks[name] = (item.callbacks[name] || 0) + own
      }
    }
  }

  postTick() {
    if (!this.active) return
    this.refreshActive()
    if (!this.active) return
    const now = performance.now()
    const sampleSeconds = (now - this.startedAt) / 1000
    if (sampleSeconds < 1) return
    const rows = []
    for (const entity of this.world.entities.items.values()) {
      if (!entity.isApp) continue
      const blueprint = this.world.blueprints.get(entity.data.blueprint)
      if (!blueprint) continue
      const pending = this.pending.get(entity.data.id)
      const item = pending?.blueprintVersion === blueprint.version ? pending : null
      rows.push({
        id: entity.data.id,
        blueprintId: blueprint.id,
        blueprintVersion: blueprint.version,
        name: blueprint.name || entity.data.id,
        cpuMsPerSecond: (item?.cpu || 0) / sampleSeconds,
        peakCallbackMs: item?.peak || 0,
        callbackMsPerSecond: Object.fromEntries(
          Object.entries(item?.callbacks || {}).map(([name, ms]) => [name, ms / sampleSeconds])
        ),
      })
    }
    this.report = { sampledAt: Date.now(), sampleSeconds, rows }
    this.pending.clear()
    this.startedAt = now
    const report = this.getReport()
    const network = this.world.network
    for (const [id, client] of network?.profilingReports || []) {
      const socket = network.sockets.get(id)
      if (socket !== client.socket || !socket.player?.isAdmin() || Date.now() - client.receivedAt > 10000) continue
      network.sendTo(id, 'profilerReport', report)
    }
  }

  getReport({ entityId, now = Date.now() } = {}) {
    const rows = (this.report?.rows || []).filter(row => {
      if (entityId && row.id !== entityId) return false
      const entity = this.world.entities.get(row.id)
      return (
        entity?.isApp &&
        entity.data.blueprint === row.blueprintId &&
        this.world.blueprints.get(row.blueprintId)?.version === row.blueprintVersion
      )
    })
    const ageMs = this.report ? Math.max(0, now - this.report.sampledAt) : null
    return {
      source: 'server',
      active: this.active,
      sampledAt: this.report?.sampledAt ?? null,
      ageMs,
      stale: ageMs === null || ageMs > 10000,
      sampleSeconds: this.report?.sampleSeconds ?? null,
      rows,
    }
  }

  destroy() {
    this.requested = false
    this.active = false
    this.pending.clear()
    this.report = null
  }
}
