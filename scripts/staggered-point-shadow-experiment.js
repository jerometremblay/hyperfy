// Load lighting-benchmark.js first, then paste this into the target console.
// await staggeredPointShadowExperiment('E6-staggered-one-map-per-frame', 10, 30)
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

  window.staggeredPointShadowExperiment = async (label, rate = 10, seconds = 30) => {
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
    const period = 1000 / rate
    const start = performance.now()
    saved.forEach((item, index) => {
      item.due = start + (index * period) / points.length
      item.times = []
      item.ages = []
      item.faces = 0
    })
    const mapsPerFrame = []
    let maps = 0
    try {
      for (const item of saved) {
        item.light.shadow.autoUpdate = false
        item.light.shadow.needsUpdate = false
        item.light.shadow.getCamera = function (...args) {
          item.faces++
          if (args[0] === 0) {
            maps++
            item.times.push(performance.now())
          }
          return item.getCamera.apply(this, args)
        }
      }
      graphics.commit = function () {
        const now = performance.now()
        let selected = null
        for (const item of saved) {
          if (item.due <= now && (!selected || item.due < selected.due)) selected = item
        }
        if (selected) {
          selected.light.shadow.needsUpdate = true
          selected.due = now + period
        }
        maps = 0
        const result = commit.call(this)
        mapsPerFrame.push(maps)
        const end = performance.now()
        for (const item of saved) {
          if (item.times.length) item.ages.push(end - item.times.at(-1))
        }
        return result
      }
      const result = await window.lightingBenchmark.sample(label, seconds)
      return {
        ...result,
        requestedMaxRefreshHz: rate,
        maxMapsPerFrame: 1,
        actualMapsPerFrame: summarize(mapsPerFrame),
        pointShadowFaces: saved.reduce((sum, item) => sum + item.faces, 0),
        perLight: saved.map((item, index) => {
          const intervals = item.times.slice(1).map((time, i) => time - item.times[i])
          return {
            index,
            range: item.light.distance,
            refreshes: item.times.length,
            achievedRefreshHz: intervals.length ? 1000 / summarize(intervals).mean : null,
            refreshIntervalMs: summarize(intervals),
            cacheAgeAtFrameEndMs: summarize(item.ages),
            faces: item.faces,
          }
        }),
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
