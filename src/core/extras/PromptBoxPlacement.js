import * as THREE from './three'

// A local scene helper: no entity or blueprint is published until placement is confirmed.
export class PromptBoxPlacement {
  constructor(world, onFinish) {
    this.world = world
    this.onFinish = onFinish
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: '#6ac4dc', transparent: true, opacity: 0.3, depthWrite: false })
    )
    this.mesh.visible = false
    world.stage.scene.add(this.mesh)
    this.update()
  }

  update() {
    const { world, mesh } = this
    const pointer = world.builder.control.pointer
    const hit = (pointer.locked ? world.stage.raycastReticle() : world.stage.raycastPointer(pointer.position))[0]
    mesh.visible = !!hit
    this.transform = null
    if (!hit) return
    const entity = hit.getEntity?.()
    const rotation = new THREE.Euler().setFromQuaternion(entity?.root.quaternion || world.rig.quaternion, 'YXZ')
    mesh.quaternion.setFromEuler(new THREE.Euler(0, rotation.y, 0, 'YXZ'))
    mesh.position.copy(hit.point)
    const normal = hit.face?.normal.clone()
    if (normal) {
      // Octree hits reuse a temporary mesh; the hit node owns the stable world matrix.
      const matrix = hit.node?.matrixWorld || hit.object.matrixWorld
      normal.applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(matrix))
    }
    if (normal && Math.abs(normal.y) < 0.5) {
      // Wall: local Z faces the wall normal; center the volume across the wall.
      mesh.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(normal.x, normal.z))
    } else {
      // Floor: preserve the construction's heading and rest the bottom on the surface.
      mesh.position.y += 0.5
    }
    this.transform = { position: mesh.position.toArray(), quaternion: mesh.quaternion.toArray() }
  }

  finish(confirm) {
    if (confirm && !this.transform) return
    this.world.stage.scene.remove(this.mesh)
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
    this.onFinish(confirm ? this.transform : null)
  }
}
