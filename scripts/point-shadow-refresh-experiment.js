// Load lighting-benchmark.js first, then paste this into the target console.
// await pointShadowRefreshExperiment('E5-point-shadows-10hz', 10, 30)
// Local diagnostic only: changes no shared world settings or authored assets.
;(() => {
  const summarize = values => {
    if (!values.length) return null
    const sorted = [...values].sort((a, b) => a - b)
    return {
      count: values.length,
      mean: values.reduce((sum, value) => sum + value, 0) / values.length,
      median: sorted[Math.floor((sorted.length - 1) / 2)],
      p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
      min: sorted[0],
      max: sorted.at(-1),
    }
  }

  window.pointShadowRefreshExperiment = async (label, rate = 10, seconds = 30) => {
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('Refresh rate must be positive')
    if (!window.lightingBenchmark) throw new Error('Load lighting-benchmark.js first')
    const world = window.world
    const points = []
    world.stage.scene.traverse(object => {
      if (object.isPointLight && object.castShadow) points.push(object)
    })
    if (points.length !== 7) throw new Error('Expected seven shadow-casting point lights')
    const graphics = world.graphics
    const commit = graphics.commit
    const hadCommit = Object.hasOwn(graphics, 'commit')
    const saved = points.map(light => ({
      light,
      autoUpdate: light.shadow.autoUpdate,
      needsUpdate: light.shadow.needsUpdate,
      getCamera: light.shadow.getCamera,
      hadGetCamera: Object.hasOwn(light.shadow, 'getCamera'),
    }))
    const refreshTimes = []
    let shadowFaces = 0
    let nextRefresh = -Infinity
    try {
      for (const item of saved) {
        item.light.shadow.autoUpdate = false
        item.light.shadow.needsUpdate = false
        item.light.shadow.getCamera = function (...args) {
          shadowFaces++
          if (item.light === points[0] && args[0] === 0) refreshTimes.push(performance.now())
          return item.getCamera.apply(this, args)
        }
      }
      graphics.commit = function () {
        const now = performance.now()
        if (now >= nextRefresh) {
          for (const light of points) light.shadow.needsUpdate = true
          nextRefresh = now + 1000 / rate
        }
        return commit.call(this)
      }
      const result = await window.lightingBenchmark.sample(label, seconds)
      const intervals = refreshTimes.slice(1).map((time, index) => time - refreshTimes[index])
      return {
        ...result,
        requestedMaxRefreshHz: rate,
        refreshBatches: refreshTimes.length,
        achievedRefreshHz: intervals.length ? 1000 / summarize(intervals).mean : null,
        refreshIntervalMs: summarize(intervals),
        pointShadowFaces: shadowFaces,
      }
    } finally {
      if (hadCommit) graphics.commit = commit
      else delete graphics.commit
      for (const item of saved) {
        item.light.shadow.autoUpdate = item.autoUpdate
        item.light.shadow.needsUpdate = item.needsUpdate
        if (item.hadGetCamera) item.light.shadow.getCamera = item.getCamera
        else delete item.light.shadow.getCamera
      }
    }
  }
})()
