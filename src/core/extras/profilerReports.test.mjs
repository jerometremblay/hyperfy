import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createProfilerReport,
  sanitizeProfilerReport,
  receiveProfilerReport,
  getProfilerReports,
  PROFILER_MAX_ROWS,
} from './profilerReports.js'
import { writePacket, readPacket } from '../packets.js'

function row(id = 'app') {
  return {
    id,
    blueprintVersion: 3,
    cpu: 2.5,
    peak: 0.8,
    sent: 20,
    received: 30,
    messages: 2,
    triangles: 12,
    meshes: 1,
    materials: 1,
    bodies: 1,
    colliders: 1,
    activeBodies: 0,
    contacts: 0,
    lights: 0,
    shadows: 0,
    webviews: 3,
    iframes: 2,
    cssLayers: 1,
    callbacks: { update: 2.3 },
    position: { x: 42, y: 0, z: 0 },
  }
}
function fixture() {
  let admin = true
  const socket = { id: 'socket', player: { data: { id: 'viewer' }, isAdmin: () => admin } }
  const entity = { isApp: true, data: { id: 'app', blueprint: 'blueprint' } }
  const blueprint = { id: 'blueprint', version: 3, name: 'Actual server name' }
  const world = {
    network: { sockets: new Map([['socket', socket]]), profilingReports: new Map() },
    entities: { get: id => (id === 'app' ? entity : undefined) },
    blueprints: { get: () => blueprint },
  }
  return {
    world,
    socket,
    blueprint,
    setAdmin: value => {
      admin = value
    },
  }
}

test('round-trips real MessagePack reports with explicit units and no location or client names', () => {
  const report = createProfilerReport([row()], 0.5)
  const [method, decoded] = readPacket(writePacket('profilerReport', report))
  assert.equal(method, 'onProfilerReport')
  const clean = sanitizeProfilerReport(decoded)
  assert.equal(clean.rows[0].cpuMsPerSecond, 2.5)
  assert.equal(clean.rows[0].sentBytesPerSecond, 20)
  assert.equal(clean.rows[0].webviews, 3)
  assert.equal(clean.rows[0].iframes, 2)
  assert.equal(clean.rows[0].cssLayers, 1)
  assert.deepEqual(clean.rows[0].callbackMsPerSecond, { update: 2.3 })
  assert.equal(clean.rows[0].position, undefined)
  assert.equal(clean.rows[0].name, undefined)
  assert.equal(readPacket(writePacket('profilerControl', { enabled: true }))[0], 'onProfilerControl')
})

test('rejects malformed, oversized, duplicate and non-finite reports before caching', () => {
  const report = createProfilerReport([row()], 0.5)
  for (const value of [
    null,
    {},
    { active: 'yes' },
    { ...report, sampleSeconds: 0 },
    { ...report, totalApps: 0 },
    { ...report, rows: [report.rows[0], report.rows[0]], totalApps: 2 },
    { ...report, rows: new Array(PROFILER_MAX_ROWS + 1).fill(report.rows[0]), totalApps: PROFILER_MAX_ROWS + 1 },
  ])
    assert.equal(sanitizeProfilerReport(value), null)
  for (const patch of [
    { cpuMsPerSecond: NaN },
    { cpuMsPerSecond: Infinity },
    { sentBytesPerSecond: -1 },
    { triangles: 1.2 },
    { webviews: -1 },
    { iframes: 1.2 },
    { cssLayers: Infinity },
    { blueprintVersion: -1 },
    { id: 'x'.repeat(257) },
    { callbackMsPerSecond: { update: -3 } },
    { callbackMsPerSecond: Object.fromEntries(Array.from({ length: 65 }, (_, i) => ['callback' + i, 1])) },
  ]) {
    assert.equal(sanitizeProfilerReport({ ...report, rows: [{ ...report.rows[0], ...patch }] }), null)
  }
})

test('reports from older clients leave iframe resource counts unknown', () => {
  const report = createProfilerReport([row()], 0.5)
  for (const field of ['webviews', 'iframes', 'cssLayers']) delete report.rows[0][field]
  const clean = sanitizeProfilerReport(report)
  assert.equal(clean.rows[0].webviews, null)
  assert.equal(clean.rows[0].iframes, null)
  assert.equal(clean.rows[0].cssLayers, null)
  assert.equal(clean.rows[0].cpuMsPerSecond, 2.5)
})

test('only connected admins can report, throttling preserves last valid sample and disable clears immediately', () => {
  const { world, socket, setAdmin } = fixture(),
    network = world.network
  const report = createProfilerReport([row()], 0.5)
  assert.equal(receiveProfilerReport(network, socket, report, 1000), true)
  assert.equal(receiveProfilerReport(network, socket, report, 1100), false)
  assert.equal(network.profilingReports.get('socket').receivedAt, 1000)
  assert.equal(receiveProfilerReport(network, socket, { active: false }, 1200), true)
  assert.equal(network.profilingReports.size, 0)
  setAdmin(false)
  assert.equal(receiveProfilerReport(network, socket, report, 2000), false)
  setAdmin(true)
  assert.equal(receiveProfilerReport(network, { ...socket }, report, 2000), false)
  assert.equal(receiveProfilerReport(network, socket, report, 2000), true)
  setAdmin(false)
  assert.equal(getProfilerReports(world).clients.length, 0)
  assert.equal(receiveProfilerReport(network, socket, report, 4000), false)
  assert.equal(network.profilingReports.size, 0)
})

test('snapshot exposes authoritative identities, freshness, optional entity filter and invalidates replaced scripts', () => {
  const { world, socket, blueprint } = fixture()
  receiveProfilerReport(world.network, socket, createProfilerReport([row(), row('deleted')], 0.5), 1000)
  const snapshot = getProfilerReports(world, { now: 2000 })
  assert.equal(snapshot.clients[0].playerId, 'viewer')
  assert.equal(snapshot.clients[0].source, 'client')
  assert.equal(snapshot.clients[0].ageMs, 1000)
  assert.equal(snapshot.clients[0].stale, false)
  assert.equal(snapshot.clients[0].rows.length, 1)
  assert.equal(snapshot.clients[0].rows[0].name, 'Actual server name')
  assert.equal(getProfilerReports(world, { now: 12000 }).clients[0].stale, true)
  assert.equal(getProfilerReports(world, { entityId: 'other', now: 2000 }).clients[0].rows.length, 0)
  blueprint.version++
  assert.equal(getProfilerReports(world, { now: 2000 }).clients[0].rows.length, 0)
  world.network.sockets.clear()
  assert.equal(getProfilerReports(world).clients.length, 0)
})

test('large worlds report the highest CPU apps with explicit truncation', () => {
  const rows = Array.from({ length: PROFILER_MAX_ROWS + 2 }, (_, i) => ({ ...row('app' + i), cpu: i }))
  const report = createProfilerReport(rows, 0.5)
  assert.equal(report.totalApps, rows.length)
  assert.equal(report.rows.length, PROFILER_MAX_ROWS)
  assert.equal(report.rows[0].cpuMsPerSecond, rows.length - 1)
  assert.ok(sanitizeProfilerReport(report))
})
