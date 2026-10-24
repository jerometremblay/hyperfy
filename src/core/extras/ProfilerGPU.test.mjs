import assert from 'node:assert/strict'
import test from 'node:test'
import { ProfilerGPU } from './ProfilerGPU.js'

globalThis.document = { hidden: false }

function fixture(t) {
  let now = 0,
    disjoint = false
  t.mock.method(performance, 'now', () => now)
  t.mock.property(globalThis, 'document', { hidden: false })
  const ext = { TIME_ELAPSED_EXT: 1, GPU_DISJOINT_EXT: 2 }
  const queries = new Set()
  let current = null
  const gl = {
    QUERY_RESULT_AVAILABLE: 3,
    QUERY_RESULT: 4,
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
    getExtension: () => ext,
    getParameter: () => disjoint,
    createQuery() {
      const query = {}
      queries.add(query)
      return query
    },
    beginQuery(type, query) {
      assert.equal(current, null)
      current = query
    },
    endQuery() {
      current = null
    },
    getQueryParameter(query, key) {
      return key === 3 ? true : query.time * 1e6
    },
    deleteQuery(query) {
      queries.delete(query)
    },
  }
  const light = { isObject3D: true, visible: true, castShadow: true }
  let renderVisible = true,
    restoreCount = 0,
    renders = 0
  const handle = {
    hideForPhoto() {
      renderVisible = false
      return () => {
        renderVisible = true
        restoreCount++
      }
    },
  }
  const node = { handle, light }
  const entity = {
    data: { id: 'fire' },
    blueprint: { version: 1 },
    root: {
      traverse(fn) {
        fn(node)
      },
    },
    worldNodes: new Set(),
  }
  const matrix = {
    clone() {
      return this
    },
    equals(other) {
      return other === this
    },
  }
  const stats = { active: true, stats: { ext } }
  const graphics = {
    renderer: { xr: { isPresenting: false }, getContext: () => gl },
    render() {
      renders++
      if (current) assert.equal(profiler.overlay.mesh.visible, false)
      if (current) current.time = !renderVisible ? 6 : !light.castShadow ? 8 : 10
    },
  }
  const originalRender = graphics.render
  const profiler = {
    world: { graphics, stats, camera: { matrixWorld: matrix }, entities: { items: new Map([['fire', entity]]) } },
    overlay: { mesh: { visible: true } },
    gpuResults: new Map(),
    publish() {},
  }
  const measurement = new ProfilerGPU(profiler, entity)
  profiler.gpuMeasurement = measurement
  const step = (delta = 100) => {
    now += delta
    graphics.render()
  }
  const verify = () => {
    assert.equal(graphics.render, originalRender)
    assert.equal(stats.active, true)
    assert.equal(stats.stats.ext, ext)
    assert.equal(light.visible, true)
    assert.equal(light.castShadow, true)
    assert.equal(renderVisible, true)
    assert.equal(profiler.overlay.mesh.visible, true)
    assert.equal(queries.size, 0)
    assert.equal(profiler.gpuMeasurement, null)
  }
  return {
    profiler,
    measurement,
    step,
    verify,
    graphics,
    light,
    stats,
    gl,
    queries,
    setDisjoint: () => {
      disjoint = true
    },
    get restoreCount() {
      return restoreCount
    },
    get renders() {
      return renders
    },
  }
}

test('GPU comparison reports scene deltas, preserves graph state, and restores render visibility each frame', t => {
  const f = fixture(t)
  f.measurement.start()
  assert.equal(f.stats.stats.ext, null, 'existing GPU timer cannot nest queries')
  for (let i = 0; i < 161; i++) {
    f.step()
    assert.equal(f.light.visible, true)
    assert.equal(f.light.castShadow, true)
    assert.equal(f.profiler.overlay.mesh.visible, true)
  }
  f.verify()
  const result = f.profiler.gpuResults.get('fire')
  assert.equal(result.total.delta, 4)
  assert.equal(result.shadows.delta, 2)
  assert.equal(result.total.inconclusive, false)
  assert.ok(result.samples.every(count => count >= 20))
  assert.ok(f.restoreCount > 0)
})

for (const reason of ['cancel', 'camera', 'disjoint', 'removed', 'hidden', 'resolution']) {
  test(`GPU comparison cleans up immediately on ${reason}`, t => {
    const f = fixture(t)
    f.measurement.start()
    f.step()
    if (reason === 'cancel') f.measurement.cancel()
    if (reason === 'camera') f.profiler.world.camera.matrixWorld = {}
    if (reason === 'disjoint') f.setDisjoint()
    if (reason === 'removed') f.profiler.world.entities.items.clear()
    if (reason === 'hidden') document.hidden = true
    if (reason === 'resolution') f.gl.drawingBufferWidth++
    if (reason !== 'cancel') {
      f.step()
    }
    f.verify()
    assert.equal(f.profiler.gpuResults.size, 0)
  })
}

test('unsupported GPU timing leaves existing rendering and stats untouched', t => {
  const f = fixture(t)
  f.gl.getExtension = () => null
  assert.throws(() => f.measurement.start(), /unavailable/)
  f.measurement.cancel('unavailable')
  f.verify()
})

test('delayed GPU queries keep sampling instead of publishing an undersampled result', t => {
  const f = fixture(t)
  f.gl.getQueryParameter = () => false
  f.measurement.start()
  for (let i = 0; i < 50; i++) f.step()
  assert.equal(f.measurement.index, 0)
  assert.equal(f.profiler.gpuResults.size, 0)
  f.measurement.cancel()
  f.verify()
})

test('render failures restore hidden instances, light visibility, timer and render callback', t => {
  const f = fixture(t)
  f.graphics.render = () => {
    throw new Error('render failed')
  }
  f.measurement.start()
  f.measurement.index = 2
  f.step()
  assert.equal(f.light.visible, true)
  assert.equal(f.light.castShadow, true)
  assert.equal(f.profiler.overlay.mesh.visible, true)
  assert.equal(f.stats.stats.ext, f.gl.getExtension())
  assert.equal(f.queries.size, 0)
  assert.equal(f.profiler.gpuMeasurement, null)
  assert.equal(f.profiler.gpuError, 'render failed')
})
