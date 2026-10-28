// Browser measurements are client-reported diagnostics, never server CPU timings.
export const PROFILER_MAX_ROWS = 2048
export const PROFILER_REPORT_INTERVAL_MS = 1000
export const PROFILER_STALE_MS = 10000

const fields = {
  cpu: 'cpuMsPerSecond',
  peak: 'peakCallbackMs',
  sent: 'sentBytesPerSecond',
  received: 'receivedBytesPerSecond',
  messages: 'messagesPerSecond',
  triangles: 'triangles',
  meshes: 'meshes',
  materials: 'materials',
  bodies: 'bodies',
  colliders: 'colliders',
  activeBodies: 'activeBodies',
  contacts: 'contactLinks',
  lights: 'lights',
  shadows: 'shadowCasters',
  webviews: 'webviews',
  iframes: 'iframes',
  cssLayers: 'cssLayers',
}
const counts = new Set([
  'triangles',
  'meshes',
  'materials',
  'bodies',
  'colliders',
  'activeBodies',
  'contactLinks',
  'lights',
  'shadowCasters',
  'webviews',
  'iframes',
  'cssLayers',
])
// Older browser clients do not report these counts; preserve "unknown" rather than zero.
const optionalCounts = new Set(['webviews', 'iframes', 'cssLayers'])
const validNumber = value => Number.isFinite(value) && value >= 0 && value <= 1e12

export function createProfilerReport(rows, sampleSeconds) {
  return {
    active: true,
    sampleSeconds,
    totalApps: rows.length,
    rows: [...rows]
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, PROFILER_MAX_ROWS)
      .map(row => ({
        id: row.id,
        blueprintVersion: row.blueprintVersion,
        ...Object.fromEntries(Object.entries(fields).map(([from, to]) => [to, row[from]])),
        callbackMsPerSecond: Object.fromEntries(
          Object.entries(row.callbacks)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 64)
        ),
      })),
  }
}

export function sanitizeProfilerReport(data) {
  if (!data || typeof data !== 'object' || typeof data.active !== 'boolean') return null
  if (!data.active) return { active: false }
  if (!Number.isFinite(data.sampleSeconds) || data.sampleSeconds <= 0 || data.sampleSeconds > 3600) return null
  if (!Array.isArray(data.rows) || data.rows.length > PROFILER_MAX_ROWS) return null
  if (!Number.isInteger(data.totalApps) || data.totalApps < data.rows.length || data.totalApps > 1e6) return null
  const rows = [],
    ids = new Set()
  for (const row of data.rows) {
    if (
      !row ||
      typeof row !== 'object' ||
      typeof row.id !== 'string' ||
      !row.id ||
      row.id.length > 256 ||
      ids.has(row.id)
    )
      return null
    if (!Number.isInteger(row.blueprintVersion) || row.blueprintVersion < 0) return null
    ids.add(row.id)
    const clean = { id: row.id, blueprintVersion: row.blueprintVersion }
    for (const name of Object.values(fields)) {
      if (optionalCounts.has(name) && row[name] === undefined) {
        clean[name] = null
        continue
      }
      if (!validNumber(row[name]) || (counts.has(name) && !Number.isInteger(row[name]))) return null
      clean[name] = row[name]
    }
    const callbacks = row.callbackMsPerSecond
    if (!callbacks || typeof callbacks !== 'object' || Array.isArray(callbacks)) return null
    const entries = Object.entries(callbacks)
    if (entries.length > 64 || entries.some(([key, value]) => key.length > 128 || !validNumber(value))) return null
    clean.callbackMsPerSecond = Object.fromEntries(entries)
    rows.push(clean)
  }
  return { active: true, sampleSeconds: data.sampleSeconds, totalApps: data.totalApps, rows }
}

export function receiveProfilerReport(network, socket, data, now = Date.now()) {
  if (network.sockets.get(socket.id) !== socket || !socket.player?.isAdmin()) {
    network.profilingReports.delete(socket.id)
    return false
  }
  if (data?.active === false) {
    network.profilingReports.delete(socket.id)
    return true
  }
  const previous = network.profilingReports.get(socket.id)
  if (previous && now - previous.receivedAt < PROFILER_REPORT_INTERVAL_MS) return false
  const report = sanitizeProfilerReport(data)
  if (!report) return false
  network.profilingReports.set(socket.id, { ...report, receivedAt: now, socket })
  return true
}

export function getProfilerReports(world, { entityId, now = Date.now() } = {}) {
  const clients = []
  for (const [socketId, report] of world.network.profilingReports || []) {
    const socket = world.network.sockets.get(socketId)
    if (socket !== report.socket || !socket.player?.isAdmin()) continue
    const ageMs = Math.max(0, now - report.receivedAt)
    const rows = []
    for (const row of report.rows) {
      if (entityId && row.id !== entityId) continue
      const entity = world.entities.get(row.id)
      if (!entity?.isApp) continue
      const blueprint = world.blueprints.get(entity.data.blueprint)
      // A changed script invalidates measurements from its previous implementation.
      if (!blueprint || blueprint.version !== row.blueprintVersion) continue
      rows.push({ ...row, blueprintId: blueprint.id, name: blueprint.name || row.id })
    }
    clients.push({
      playerId: socket.player.data.id,
      source: 'client',
      receivedAt: report.receivedAt,
      ageMs,
      stale: ageMs > PROFILER_STALE_MS,
      sampleSeconds: report.sampleSeconds,
      smoothingSeconds: 2,
      totalApps: report.totalApps,
      truncated: report.totalApps > report.rows.length,
      rows,
    })
  }
  return {
    schemaVersion: 1,
    staleAfterMs: PROFILER_STALE_MS,
    clients,
    server: world.profiler?.getReport({ entityId, now }) ?? null,
    limitations:
      'Client-reported synchronous script CPU, mounted resource counts and app packet rates. Iframe counts cover native WebView frames, including off-screen pages, but exclude nested frames and iframe page CPU. Server report measures exclusive synchronous server script callbacks separately. Excludes GPU timings, per-body physics time, async continuations and native node callbacks. No client reports means no compatible connected admin client is profiling.',
  }
}
