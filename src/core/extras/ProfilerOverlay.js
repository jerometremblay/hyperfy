import * as THREE from './three'

// One instanced draw for all orbs; ordinary world mesh batching stays unchanged.
export class ProfilerOverlay {
  constructor(world, profiler) {
    this.world = world
    this.profiler = profiler
    this.geometry = new THREE.SphereGeometry(0.12, 8, 6)
    this.material = new THREE.MeshBasicMaterial({
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.9,
    })
    this.rows = []
  }

  update(rows, metric, selected) {
    if (!this.mesh || this.mesh.instanceMatrix.count < rows.length) {
      this.removeMesh()
      this.mesh = new THREE.InstancedMesh(this.geometry, this.material, Math.max(1, rows.length))
      this.mesh.frustumCulled = false
      this.mesh.renderOrder = 9998
      this.world.stage.scene.add(this.mesh)
      // Use the existing pointer path, retaining the hit instance index.
      const node = {
        parent: null,
        onPointerDown() {},
        resolveHit: hit => ({
          parent: null,
          cursor: 'pointer',
          onPointerDown: () => {
            const row = this.rows[hit.instanceId]
            if (row) this.profiler.select(row.id)
          },
        }),
      }
      this.hitHandle = this.world.stage.insertRaycastObject({ object: this.mesh, node })
    }
    this.rows = rows
    const max = rows.reduce((max, row) => Math.max(max, row[metric] ?? 0), 0)
    const matrix = new THREE.Matrix4()
    const color = new THREE.Color()
    rows.forEach((row, index) => {
      matrix.makeScale(row.id === selected ? 1.6 : 1, row.id === selected ? 1.6 : 1, row.id === selected ? 1.6 : 1)
      matrix.setPosition(row.position)
      this.mesh.setMatrixAt(index, matrix)
      color.setHSL(max ? (1 - row[metric] / max) * 0.33 : 0.33, 0.85, 0.55)
      if (row[metric] == null) color.set('#737b88')
      this.mesh.setColorAt(index, color)
    })
    this.mesh.count = rows.length
    this.mesh.instanceMatrix.needsUpdate = true
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true
  }

  removeMesh() {
    this.hitHandle?.destroy()
    if (this.mesh) {
      this.world.stage.scene.remove(this.mesh)
      this.mesh.dispose()
    }
  }

  destroy() {
    this.removeMesh()
    this.geometry.dispose()
    this.material.dispose()
  }
}
