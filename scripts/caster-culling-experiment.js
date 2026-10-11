// Load lighting-benchmark.js first; local diagnostic, no shared scene edits.
// await casterCullingExperiment('E7-vanilla-batch-frustum-culling', 30)
;(() => {
  window.casterCullingExperiment = async (label, seconds = 30) => {
    const saved = []
    let boundComputations = 0
    try {
      for (const model of window.world.stage.models.values()) {
        const mesh = model.iMesh
        const item = {
          model,
          mesh,
          clean: model.clean,
          move: model.move,
          hadClean: Object.hasOwn(model, 'clean'),
          hadMove: Object.hasOwn(model, 'move'),
          culled: mesh.frustumCulled,
          sphere: mesh.boundingSphere,
          compute: mesh.computeBoundingSphere,
          hadCompute: Object.hasOwn(mesh, 'computeBoundingSphere'),
        }
        saved.push(item)
        mesh.frustumCulled = true
        mesh.boundingSphere = null
        mesh.computeBoundingSphere = function () {
          boundComputations++
          return item.compute.call(this)
        }
        model.clean = function () {
          const dirty = this.dirty
          const result = item.clean.call(this)
          if (dirty) this.iMesh.boundingSphere = null
          return result
        }
        model.move = function (...args) {
          const result = item.move.apply(this, args)
          this.iMesh.boundingSphere = null
          return result
        }
      }
      const result = await window.lightingBenchmark.sample(label, seconds)
      return { ...result, batches: saved.length, boundComputations }
    } finally {
      for (const item of saved) {
        item.mesh.frustumCulled = item.culled
        item.mesh.boundingSphere = item.sphere
        if (item.hadClean) item.model.clean = item.clean
        else delete item.model.clean
        if (item.hadMove) item.model.move = item.move
        else delete item.model.move
        if (item.hadCompute) item.mesh.computeBoundingSphere = item.compute
        else delete item.mesh.computeBoundingSphere
      }
    }
  }
})()
