import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: ['src/core/systems/ServerProfiler.js'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
})
const { ServerProfiler } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function fixture() {
  const blueprint = { id: 'bp', name: 'Test app', version: 1 }
  const entity = { isApp: true, data: { id: 'a', blueprint: 'bp' } }
  const world = {
    entities: { items: new Map([['a', entity]]), get: id => (id === 'a' ? entity : undefined) },
    blueprints: { get: id => (id === 'bp' ? blueprint : undefined) },
  }
  return { profiler: new ServerProfiler(world), blueprint, entity }
}

test('server callbacks are opt-in, exclusive, normalized by actual elapsed time and reset on stop', t => {
  let clock = 0
  t.mock.method(performance, 'now', () => clock)
  const { profiler } = fixture()
  assert.equal(
    profiler.measure('a', 'update', () => 42),
    42
  )
  assert.equal(profiler.pending.size, 0)
  profiler.toggle(true)
  profiler.measure('a', 'update', () => {
    clock += 2
    profiler.measure('a', 'nested', () => {
      clock += 3
    })
    clock += 1
  })
  assert.equal(profiler.pending.get('a').cpu, 6)
  assert.equal(profiler.pending.get('a').callbacks.update, 3)
  clock = 2000
  profiler.postTick()
  const report = profiler.getReport()
  assert.equal(report.source, 'server')
  assert.equal(report.sampleSeconds, 2)
  assert.equal(report.rows[0].cpuMsPerSecond, 3)
  assert.equal(report.rows[0].peakCallbackMs, 3)
  assert.equal(report.rows[0].callbackMsPerSecond.nested, 1.5)
  assert.equal(profiler.getReport({ entityId: 'other' }).rows.length, 0)
  assert.equal(profiler.getReport({ now: report.sampledAt + 10001 }).stale, true)
  profiler.toggle(false)
  assert.equal(profiler.getReport().rows.length, 0)
  assert.equal(profiler.getReport().active, false)
})

test('throws propagate without breaking timing; rebuilt apps discard outdated measurements', t => {
  let clock = 0
  t.mock.method(performance, 'now', () => clock)
  const { profiler, blueprint } = fixture()
  profiler.toggle(true)
  assert.throws(
    () =>
      profiler.measure('a', 'timer', () => {
        clock += 5
        throw Error('boom')
      }),
    /boom/
  )
  assert.equal(profiler.stack.length, 0)
  blueprint.version++
  clock = 1000
  profiler.postTick()
  assert.equal(profiler.getReport().rows[0].cpuMsPerSecond, 0)
  blueprint.version++
  assert.equal(profiler.getReport().rows.length, 0)
})

test('fresh admin viewers enable server sampling and receive reports; disconnect stops automatic timing', t => {
  let clock = 0
  t.mock.method(performance, 'now', () => clock)
  const { profiler } = fixture()
  const socket = { player: { isAdmin: () => true } }
  const sent = []
  profiler.world.network = {
    sockets: new Map([['s', socket]]),
    profilingReports: new Map([['s', { socket, receivedAt: Date.now() }]]),
    sendTo: (...args) => sent.push(args),
  }
  profiler.refreshActive()
  assert.equal(profiler.active, true)
  clock = 1100
  profiler.postTick()
  assert.equal(sent.length, 1)
  assert.equal(sent[0][0], 's')
  assert.equal(sent[0][1], 'profilerReport')
  assert.equal(sent[0][2].source, 'server')
  profiler.world.network.sockets.clear()
  profiler.postTick()
  assert.equal(profiler.active, false)
  profiler.toggle(true)
  assert.equal(profiler.active, true)
  profiler.toggle(false)
  assert.equal(profiler.active, false)
})
