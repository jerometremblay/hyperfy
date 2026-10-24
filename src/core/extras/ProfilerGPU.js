// GPU times are scene comparisons, not exclusive per-object draw timings.
function summary(values) {
  if (values.length < 20) throw new Error('Not enough GPU samples. Keep this tab visible and try again.')
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)
  return { mean, error: Math.sqrt(variance / values.length), samples: values.length }
}

function sameView(a, b) {
  // Ignore floating-point noise when portal camera mapping restores the view.
  if (!a.elements || !b.elements) return a.equals(b)
  return a.elements.every((value, index) => Math.abs(value - b.elements[index]) < 0.00001)
}

function hideEntity(entity, shadowsOnly, restores) {
  const seen = new Set()
  const hide = object => {
    if (!object?.isObject3D || seen.has(object)) return
    seen.add(object)
    const visible = object.visible
    object.visible = false
    restores.push(() => {
      object.visible = visible
    })
  }
  const visit = node => {
    if (seen.has(node)) return
    seen.add(node)
    if (shadowsOnly) {
      if (node.light?.castShadow) {
        const light = node.light
        light.castShadow = false
        restores.push(() => {
          light.castShadow = true
        })
      }
      return
    }
    // Use the existing photo exclusion path, preserving physics and app activity.
    if (node.handle?.hideForPhoto) restores.push(node.handle.hideForPhoto())
    for (const value of Object.values(node)) hide(value)
    hide(node.instance?.raw?.scene)
  }
  entity.root.traverse(visit)
  for (const node of entity.worldNodes) node.traverse(visit)
}

export class ProfilerGPU {
  constructor(profiler, entity) {
    this.profiler = profiler
    this.world = profiler.world
    this.entity = entity
    this.id = entity.data.id
    this.version = entity.blueprint?.version ?? 0
    this.phase = 'Warming up'
    this.samples = [[], [], [], []]
    this.pending = []
  }

  start() {
    const { graphics, stats, camera } = this.world
    if (graphics.renderer.xr.isPresenting) throw new Error('GPU comparison is unavailable during XR.')
    this.gl = graphics.renderer.getContext()
    this.ext = this.gl.getExtension('EXT_disjoint_timer_query_webgl2')
    if (!this.ext) throw new Error('GPU timing is unavailable in this browser.')
    if (this.gl.getParameter(this.ext.GPU_DISJOINT_EXT)) throw new Error('GPU timer is unstable. Try again.')
    this.camera = camera.matrixWorld.clone()
    this.objectMatrix = this.entity.root.matrixWorld?.clone()
    this.resolution = [this.gl.drawingBufferWidth, this.gl.drawingBufferHeight]
    this.originalRender = graphics.render
    this.statsTimer = stats.stats
    this.statsExtension = this.statsTimer?.ext
    // Avoid nesting TIME_ELAPSED queries with the existing stats graph.
    if (stats.stats?.activeQuery) stats.stats.end()
    if (this.statsTimer) this.statsTimer.ext = null
    this.index = 0
    this.phaseStarted = performance.now()
    this.phase = 'Baseline (1/4)'
    this.render = (...args) => this.draw(args)
    graphics.render = this.render
    this.timeout = setTimeout(() => this.cancel('Measurement timed out. Keep the tab visible and try again.'), 45000)
  }

  draw(args) {
    const { world, gl, ext } = this
    let changed
    if (document.hidden) changed = 'Tab was hidden.'
    else if (!sameView(this.camera, world.camera.matrixWorld)) changed = 'Camera moved.'
    else if (
      world.entities.items.get(this.id) !== this.entity ||
      (this.entity.blueprint?.version ?? 0) !== this.version ||
      (this.objectMatrix && !sameView(this.objectMatrix, this.entity.root.matrixWorld))
    )
      changed = 'Object changed.'
    else if (gl.drawingBufferWidth !== this.resolution[0] || gl.drawingBufferHeight !== this.resolution[1])
      changed = 'Resolution changed.'
    else if (world.graphics.renderer.xr.isPresenting) changed = 'XR started.'
    if (changed) {
      this.cancel(`${changed} Keep the view still and try again.`)
      return this.originalRender.apply(world.graphics, args)
    }
    if (gl.getParameter(ext.GPU_DISJOINT_EXT)) {
      this.cancel('GPU timer became unstable. Try again.')
      return this.originalRender.apply(world.graphics, args)
    }
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const item = this.pending[i]
      if (!gl.getQueryParameter(item.query, gl.QUERY_RESULT_AVAILABLE)) continue
      if (item.index !== null) this.samples[item.index].push(gl.getQueryParameter(item.query, gl.QUERY_RESULT) * 1e-6)
      gl.deleteQuery(item.query)
      this.pending.splice(i, 1)
    }
    const elapsed = performance.now() - this.phaseStarted
    if (elapsed >= 4000 && this.samples[this.index].length >= 20) {
      this.index++
      if (this.index === 4) {
        this.finish()
        return this.originalRender.apply(world.graphics, args)
      }
      this.phaseStarted = performance.now()
      this.phase = [
        'Baseline (1/4)',
        'Without object shadows (2/4)',
        'Without object rendering (3/4)',
        'Baseline (4/4)',
      ][this.index]
      this.profiler.publish()
    }
    const restores = []
    let query
    try {
      const overlay = this.profiler.overlay?.mesh
      if (overlay) {
        const visible = overlay.visible
        overlay.visible = false
        restores.push(() => {
          overlay.visible = visible
        })
      }
      if (this.index === 1 || this.index === 2) hideEntity(this.entity, this.index === 1, restores)
      query = gl.createQuery()
      if (!query) throw new Error('Could not allocate a GPU timer.')
      gl.beginQuery(ext.TIME_ELAPSED_EXT, query)
      try {
        this.originalRender.apply(world.graphics, args)
      } finally {
        gl.endQuery(ext.TIME_ELAPSED_EXT)
      }
      this.pending.push({ query, index: performance.now() - this.phaseStarted >= 1000 ? this.index : null })
      query = null
    } catch (error) {
      if (query) gl.deleteQuery(query)
      this.cancel(error.message)
    } finally {
      for (let i = restores.length - 1; i >= 0; i--) restores[i]()
    }
  }

  finish() {
    try {
      const phases = this.samples.map(summary)
      const baseline = (phases[0].mean + phases[3].mean) / 2
      const difference = index => {
        const delta = baseline - phases[index].mean
        const uncertainty = Math.max(
          Math.abs(phases[0].mean - phases[3].mean),
          2 * Math.sqrt((phases[0].error ** 2 + phases[3].error ** 2) / 4 + phases[index].error ** 2)
        )
        return { delta, uncertainty, inconclusive: Math.abs(delta) <= uncertainty }
      }
      this.profiler.gpuResults.set(this.id, {
        version: this.version,
        baseline,
        without: phases[2].mean,
        total: difference(2),
        shadows: difference(1),
        resolution: this.resolution,
        samples: phases.map(phase => phase.samples),
      })
      this.cancel()
    } catch (error) {
      this.cancel(error.message)
    }
  }

  cancel(error = null) {
    clearTimeout(this.timeout)
    if (this.originalRender) {
      if (this.world.graphics.render === this.render) this.world.graphics.render = this.originalRender
      if (this.statsTimer) this.statsTimer.ext = this.statsExtension
    }
    for (const item of this.pending) this.gl.deleteQuery(item.query)
    this.pending = []
    if (this.profiler.gpuMeasurement === this) this.profiler.gpuMeasurement = null
    this.profiler.gpuError = error
    this.profiler.publish()
  }
}
