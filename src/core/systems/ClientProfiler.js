import * as THREE from '../extras/three'
import { System } from './System'
import { createProfilerReport, PROFILER_REPORT_INTERVAL_MS } from '../extras/profilerReports'
import { ProfilerOverlay } from '../extras/ProfilerOverlay'
import { ProfilerGPU } from '../extras/ProfilerGPU'

// Counts describe mounted resources, not GPU work or per-body simulation time.
export class ClientProfiler extends System {
  constructor(world) {
    super(world)
    this.active = false
    this.metric = 'cpu'
    this.rows = []
    this.pending = new Map()
    this.history = new Map()
    this.stack = []
    this.selected = null
    this.elapsed = 0
    this.serverReport = null
    this.gpuResults = new Map()
    this.gpuMeasurement = null
    this.gpuError = null
  }

  start() {
    this.world.on('rank', this.checkPermission)
    this.world.settings.on('change', this.checkPermission)
    this.world.on('disconnect', this.onDisconnect)
  }

  allowed() {
    return !!this.world.entities.player?.isAdmin()
  }

  checkPermission = () => {
    if (this.active && !this.allowed()) this.toggle(false)
  }

  onDisconnect = () => this.toggle(false)

  toggle(value = !this.active) {
    if (value && !this.allowed()) return false
    if (this.active === value) return this.active
    this.gpuMeasurement?.cancel()
    this.gpuResults.clear()
    this.gpuError = null
    this.active = value
    this.pending = new Map()
    this.lastTick = undefined
    this.lastReportAt = undefined
    this.history.clear()
    this.rows = []
    this.elapsed = 0
    this.selected = null
    this.serverReport = null
    if (value) {
      this.world.stats?.toggle(true)
      this.overlay = new ProfilerOverlay(this.world, this)
    } else {
      this.overlay?.destroy()
      this.overlay = null
    }
    if (!value && this.world.network?.ws?.readyState === 1) this.world.network.send('profilerReport', { active: false })
    this.publish()
    return this.active
  }

  entry(id) {
    let item = this.pending.get(id)
    if (!item) {
      item = { cpu: 0, peak: 0, callbacks: Object.create(null), sent: 0, received: 0, messages: 0 }
      this.pending.set(id, item)
    }
    return item
  }

  // Exclusive synchronous callback time avoids charging nested app events twice.
  measure(id, name, fn, args = [], receiver) {
    if (!this.active) return fn.apply(receiver, args)
    const started = performance.now()
    const frame = { children: 0 }
    const pending = this.pending
    this.stack.push(frame)
    try {
      return fn.apply(receiver, args)
    } finally {
      const duration = performance.now() - started
      this.stack.pop()
      const parent = this.stack[this.stack.length - 1]
      if (parent) parent.children += duration
      if (this.active && this.pending === pending) {
        const item = this.entry(id)
        const own = Math.max(0, duration - frame.children)
        item.cpu += own
        item.peak = Math.max(item.peak, own)
        item.callbacks[name] = (item.callbacks[name] || 0) + own
      }
    }
  }

  network(method, data, bytes, outgoing) {
    if (!this.active) return
    let id
    if (method === 'entityEvent' || method === 'onEntityEvent') id = data?.[0]
    if (method === 'entityModified' || method === 'onEntityModified') id = data?.id
    if (method === 'entityAdded' || method === 'onEntityAdded') id = data?.id
    if (method === 'entityRemoved' || method === 'onEntityRemoved') id = data
    if (!this.world.entities.items.get(id)?.isApp) return
    const item = this.entry(id)
    item[outgoing ? 'sent' : 'received'] += bytes
    item.messages++
  }

  setMetric(metric) {
    if (!['cpu', 'serverCpu', 'triangles', 'bodies', 'network', 'lights'].includes(metric)) return
    this.metric = metric
    this.publish()
  }

  receiveServerReport(report) {
    if (!this.active || !this.allowed() || report?.source !== 'server' || !Array.isArray(report.rows)) return
    this.serverReport = { ...report, receivedAt: performance.now() }
    this.applyServerReport()
    this.overlay?.update(this.rows, this.metric, this.selected)
    this.publish()
  }

  serverReady() {
    return !!(
      this.serverReport?.active &&
      !this.serverReport.stale &&
      performance.now() - this.serverReport.receivedAt <= 10000
    )
  }

  applyServerReport() {
    const samples = new Map(this.serverReady() ? this.serverReport.rows.map(row => [row.id, row]) : [])
    for (const row of this.rows) {
      const sample = samples.get(row.id)
      const valid = sample?.blueprintVersion === row.blueprintVersion
      row.serverCpu = valid ? sample.cpuMsPerSecond : null
      row.serverPeak = valid ? sample.peakCallbackMs : null
      row.serverCallbacks = valid ? sample.callbackMsPerSecond : null
    }
  }

  select(id) {
    id = this.selected === id ? null : id
    if (this.selected !== id) {
      this.gpuMeasurement?.cancel()
      this.gpuError = null
    }
    this.selected = id
    this.overlay?.update(this.rows, this.metric, this.selected)
    this.publish()
  }

  measureGPU() {
    if (!this.active || !this.allowed() || this.gpuMeasurement) return
    const entity = this.world.entities.items.get(this.selected)
    if (!entity?.isApp) return
    this.gpuError = null
    this.gpuResults.delete(this.selected)
    const measurement = new ProfilerGPU(this, entity)
    this.gpuMeasurement = measurement
    try {
      measurement.start()
    } catch (error) {
      measurement.cancel(error.message)
    }
    this.publish()
  }

  publish() {
    this.emit('change')
  }

  postTick() {
    if (!this.active) return
    if (!this.allowed()) return this.toggle(false)
    const now = performance.now()
    if (this.lastTick !== undefined) this.elapsed += (now - this.lastTick) / 1000
    this.lastTick = now
    if (this.elapsed >= 0.5) {
      this.sample(this.elapsed)
      this.elapsed = 0
    }
  }

  sample(seconds) {
    const rows = new Map()
    for (const entity of this.world.entities.items.values()) {
      if (!entity.isApp) continue
      const id = entity.data.id
      const activity = this.pending.get(id) || {
        cpu: 0,
        peak: 0,
        callbacks: Object.create(null),
        sent: 0,
        received: 0,
        messages: 0,
      }
      const previous = this.history.get(id)
      // Time-based EWMA with a two-second time constant.
      const alpha = 1 - Math.exp(-seconds / 2)
      const smooth = (key, value) => (previous ? previous[key] + alpha * (value - previous[key]) : value)
      const row = {
        id,
        name: entity.blueprint?.name || id,
        blueprintVersion: entity.blueprint?.version ?? 0,
        cpu: smooth('cpu', activity.cpu / seconds),
        peak: activity.peak,
        callbacks: Object.fromEntries(Object.entries(activity.callbacks).map(([key, value]) => [key, value / seconds])),
        sent: smooth('sent', activity.sent / seconds),
        received: smooth('received', activity.received / seconds),
        messages: activity.messages / seconds,
        triangles: 0,
        meshes: 0,
        materials: new Set(),
        bodies: 0,
        colliders: 0,
        activeBodies: 0,
        contacts: 0,
        lights: 0,
        shadows: 0,
        bounds: new THREE.Box3(),
        position: entity.root.matrixWorld
          ? new THREE.Vector3().setFromMatrixPosition(entity.root.matrixWorld)
          : new THREE.Vector3(),
      }
      row.network = row.sent + row.received
      const visited = new Set()
      const visit = node => {
        if (visited.has(node)) return
        visited.add(node)
        if (node.mounted && node.light) {
          row.lights++
          if (node.light.castShadow) row.shadows++
        }
      }
      entity.root.traverse(visit)
      for (const node of entity.worldNodes) node.traverse(visit)
      rows.set(id, row)
    }
    const box = new THREE.Box3()
    const visit = octant => {
      for (const item of octant.items) {
        const row = rows.get(item.node?.ctx?.entity?.data.id)
        if (!row) continue
        const geometry = item.geometry
        const count = geometry.index?.count ?? geometry.attributes.position?.count ?? 0
        const range = geometry.drawRange
        row.triangles += Math.floor(Math.max(0, Math.min(count - (range?.start || 0), range?.count ?? count)) / 3)
        row.meshes++
        for (const material of Array.isArray(item.material) ? item.material : [item.material])
          if (material) row.materials.add(material.uuid)
        if (!geometry.boundingBox) geometry.computeBoundingBox()
        if (geometry.boundingBox) row.bounds.union(box.copy(geometry.boundingBox).applyMatrix4(item.matrix))
      }
      for (const child of octant.children) visit(child)
    }
    visit(this.world.stage.octree.root)
    for (const handle of this.world.physics.handles.values()) {
      const row = rows.get(handle.node?.ctx?.entity?.data.id)
      if (!row) continue
      row.bodies++
      row.colliders += handle.actor.getNbShapes()
      row.contacts += handle.contactedHandles.size
      if (this.world.physics.active.has(handle)) row.activeBodies++
    }
    for (const row of rows.values()) {
      row.materials = row.materials.size
      if (!row.bounds.isEmpty()) {
        row.bounds.getCenter(row.position)
        row.position.y = row.bounds.max.y
      }
      row.position.y += 0.35
      delete row.bounds
    }
    this.rows = [...rows.values()]
    this.applyServerReport()
    this.history = rows
    this.pending.clear()
    if (!rows.has(this.selected)) this.selected = null
    this.overlay?.update(this.rows, this.metric, this.selected)
    const now = performance.now()
    if (
      this.world.network?.ws?.readyState === 1 &&
      (this.lastReportAt === undefined || now - this.lastReportAt >= PROFILER_REPORT_INTERVAL_MS)
    ) {
      this.world.network.send('profilerReport', createProfilerReport(this.rows, seconds))
      this.lastReportAt = now
    }
    this.publish()
  }

  destroy() {
    this.toggle(false)
    this.world.off('rank', this.checkPermission)
    this.world.settings.off('change', this.checkPermission)
    this.world.off('disconnect', this.onDisconnect)
    this.removeAllListeners()
  }
}
