// Paste into the target world's browser console, then run:
// await lightingBenchmark.sample('baseline', 30)
// Reads local renderer state only; does not change world settings or assets.
;(() => {
  const summarize = values => {
    if (!values.length) return null
    const sorted = [...values].sort((a, b) => a - b)
    return {
      count: sorted.length,
      mean: values.reduce((sum, value) => sum + value, 0) / values.length,
      median: sorted[Math.floor((sorted.length - 1) * 0.5)],
      p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
      min: sorted[0],
      max: sorted.at(-1),
    }
  }

  const snapshot = world => {
    const renderer = world.graphics.renderer
    const gl = renderer.getContext()
    const debug = gl.getExtension('WEBGL_debug_renderer_info')
    const csm = world.environment.csm
    const lights = []
    let meshes = 0
    let casters = 0
    let receivers = 0
    let uncullableCasters = 0
    world.stage.scene.traverse(object => {
      if (object.isLight)
        lights.push({
          type: object.type,
          castShadow: object.castShadow,
          intensity: object.intensity,
          mapSize: object.shadow?.mapSize.toArray(),
          autoUpdate: object.shadow?.autoUpdate,
        })
      if (!object.isMesh) return
      meshes++
      if (object.receiveShadow) receivers++
      if (object.castShadow) {
        casters++
        if (!object.frustumCulled) uncullableCasters++
      }
    })
    return {
      url: location.origin + location.pathname,
      userAgent: navigator.userAgent,
      gpu: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
      viewport: [innerWidth, innerHeight],
      drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
      devicePixelRatio,
      preferences: Object.fromEntries(
        ['shadows', 'dpr', 'postprocessing', 'bloom', 'ao'].map(key => [key, world.prefs[key]])
      ),
      cameraMatrix: world.camera.matrixWorld.toArray(),
      cameraProjection: world.camera.projectionMatrix.toArray(),
      sun: {
        cascades: csm.cascades,
        maxFar: csm.maxFar,
        mapSize: csm.shadowMapSize,
        direction: csm.lightDirection.toArray(),
      },
      dayNightCycle: world.settings.dayNightCycle,
      rendererShadows: {
        enabled: renderer.shadowMap.enabled,
        type: renderer.shadowMap.type,
        autoUpdate: renderer.shadowMap.autoUpdate,
        needsUpdate: renderer.shadowMap.needsUpdate,
      },
      meshes,
      casters,
      receivers,
      uncullableCasters,
      lights,
    }
  }

  let running = false
  window.lightingBenchmark = {
    async sample(label, seconds = 30) {
      if (running) throw new Error('A lighting sample is already running')
      if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 60)
        throw new Error('Sample duration must be between 0 and 60 seconds')
      const world = window.world
      if (!world?.environment?.csm) throw new Error('World is not ready')
      if (document.hidden) throw new Error('Keep the target tab visible while measuring')
      running = true
      const renderer = world.graphics.renderer
      const stats = world.stats.stats
      const preTick = world.preTick
      const postTick = world.postTick
      const hadPreTick = Object.hasOwn(world, 'preTick')
      const hadPostTick = Object.hasOwn(world, 'postTick')
      const processGpuQueries = stats?.processGpuQueries
      const autoReset = renderer.info.autoReset
      const before = snapshot(world)
      const intervals = [],
        cpu = [],
        gpu = [],
        calls = [],
        triangles = []
      const sampledQueries = new WeakSet()
      let previousStart,
        frameStart,
        hidden = false
      const startedAt = new Date().toISOString()
      const start = performance.now()
      renderer.info.autoReset = false
      world.preTick = function () {
        frameStart = performance.now()
        if (previousStart !== undefined) intervals.push(frameStart - previousStart)
        previousStart = frameStart
        hidden ||= document.hidden
        renderer.info.reset()
        return preTick.call(this)
      }
      world.postTick = function () {
        postTick.call(this)
        cpu.push(performance.now() - frameStart)
        calls.push(renderer.info.render.calls)
        triangles.push(renderer.info.render.triangles)
      }
      if (stats?.ext && processGpuQueries) {
        stats.processGpuQueries = function () {
          if (!this.gl.getParameter(this.ext.GPU_DISJOINT_EXT)) {
            for (const item of this.gpuQueries) {
              if (
                !sampledQueries.has(item.query) &&
                this.gl.getQueryParameter(item.query, this.gl.QUERY_RESULT_AVAILABLE)
              ) {
                gpu.push(this.gl.getQueryParameter(item.query, this.gl.QUERY_RESULT) * 1e-6)
                sampledQueries.add(item.query)
              }
            }
          }
          return processGpuQueries.call(this)
        }
      }
      try {
        await new Promise(resolve => setTimeout(resolve, seconds * 1000))
        const elapsedSeconds = (performance.now() - start) / 1000
        const after = snapshot(world)
        const result = {
          label,
          startedAt,
          elapsedSeconds,
          valid: !hidden && !document.hidden,
          frames: cpu.length,
          fps: intervals.length ? 1000 / summarize(intervals).mean : null,
          frameIntervalMs: summarize(intervals),
          cpuFrameMs: summarize(cpu),
          gpuFrameMs: summarize(gpu),
          drawCallsPerFrame: summarize(calls),
          trianglesPerFrame: summarize(triangles),
          cameraUnchanged: JSON.stringify(before.cameraMatrix) === JSON.stringify(after.cameraMatrix),
          before,
          after,
        }
        return result
      } finally {
        if (hadPreTick) world.preTick = preTick
        else delete world.preTick
        if (hadPostTick) world.postTick = postTick
        else delete world.postTick
        if (stats && processGpuQueries) stats.processGpuQueries = processGpuQueries
        renderer.info.autoReset = autoReset
        running = false
      }
    },
  }
})()
