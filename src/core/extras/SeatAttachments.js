import * as THREE from './three'
import { getMatchingSeatPose } from './seatPose'

// Desktop interaction for the local player's saved sitting-pose attachment points.
export class SeatAttachments {
  constructor(world) {
    this.world = world
    this.markers = []
    this.raycaster = new THREE.Raycaster()
    this.selected = null
    this.record = null
  }

  clear() {
    for (const marker of this.markers) {
      marker.removeFromParent()
      marker.geometry.dispose()
      marker.material.dispose()
    }
    this.markers = []
    this.selected = null
    this.record = null
    this.player = null
    this.anchorId = null
  }

  refresh(control, screenHit) {
    const world = this.world
    const player = world.entities?.player
    const scene = player?.avatar?.instance?.raw?.scene
    const avatarUrl = player?.getAvatarUrl?.()
    if (
      !player?.data.effect?.anchorId ||
      !player.getAnchorMatrix?.() ||
      !scene ||
      player.poseEditorActive ||
      player.isXR ||
      world.xr?.session ||
      world.builder?.enabled ||
      world.xrUI?.visible
    ) {
      this.clear()
      return false
    }
    if (
      this.player !== player ||
      this.avatarUrl !== avatarUrl ||
      this.anchorId !== player.data.effect.anchorId ||
      this.record !== player.data.seatPose
    ) {
      this.clear()
      this.avatarUrl = avatarUrl
      this.player = player
      this.anchorId = player.data.effect.anchorId
      this.record = player.data.seatPose
      const pose = getMatchingSeatPose(player.data, avatarUrl)
      this.points = pose?.attachmentPoints || []
      for (const _point of this.points) {
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.0175, 16, 12),
          new THREE.MeshBasicMaterial({ color: 0xfff4bf, transparent: true, opacity: 0.85, toneMapped: false })
        )
        marker.visible = false
        world.stage.scene.add(marker)
        this.markers.push(marker)
      }
    }
    if (!this.markers.length) return false
    scene.updateWorldMatrix(true, false)
    this.points.forEach((point, index) => {
      const marker = this.markers[index]
      marker.position.fromArray(point.position).applyMatrix4(scene.matrixWorld)
      marker.quaternion
        .copy(scene.getWorldQuaternion(new THREE.Quaternion()))
        .multiply(new THREE.Quaternion().fromArray(point.rotation))
      marker.updateMatrixWorld(true)
    })
    const viewport = world.graphics?.viewport
    if (!viewport || screenHit) {
      for (const marker of this.markers) marker.visible = false
      return false
    }
    const rect = viewport.getBoundingClientRect()
    const position = control.pointer.position
    if (
      !control.pointer.locked &&
      (position.x < rect.left ||
        position.y < rect.top ||
        position.x > rect.left + rect.width ||
        position.y > rect.top + rect.height)
    ) {
      for (const marker of this.markers) marker.visible = false
      return false
    }
    const ndc = control.pointer.locked
      ? new THREE.Vector2()
      : new THREE.Vector2(
          ((position.x - rect.left) / rect.width) * 2 - 1,
          -((position.y - rect.top) / rect.height) * 2 + 1
        )
    world.camera.updateMatrixWorld(true)
    this.raycaster.setFromCamera(ndc, world.camera)
    this.markers.forEach((marker, index) => {
      const distance = this.raycaster.ray.distanceToPoint(marker.position)
      const nearPoint = distance < 0.65
      marker.visible =
        marker.position.distanceTo(this.raycaster.ray.origin) < 8 && (nearPoint || this.selected === index)
      marker.material.opacity =
        this.selected === index ? 0.72 : 0.72 * THREE.MathUtils.clamp((0.65 - distance) / 0.5, 0, 1)
      marker.scale.setScalar(this.selected === index ? 1.5 : 1)
      marker.material.color.setHex(
        this.selected === index ? 0x65b7ff : this.points[index].attachment ? 0x51e2a3 : 0xfff4bf
      )
      marker.updateMatrixWorld(true)
    })
    const orbHit = this.getOrbHit()
    if (orbHit) {
      const hit = control.pointer.locked
        ? world.stage.raycastReticle()[0]
        : world.stage.raycastPointer(control.pointer.position)[0]
      if (!hit || orbHit.distance <= hit.distance + 0.05) orbHit.object.material.opacity = 0.4
    }
    return true
  }

  getOrbHit() {
    let nearest = null
    for (const marker of this.markers) {
      if (!marker.visible) continue
      const sphere = new THREE.Sphere(marker.position, 0.035 * marker.scale.x)
      const point = this.raycaster.ray.intersectSphere(sphere, new THREE.Vector3())
      if (!point) continue
      const distance = point.distanceTo(this.raycaster.ray.origin)
      if (!nearest || distance < nearest.distance) nearest = { object: marker, distance }
    }
    return nearest
  }

  press(control, screenHit) {
    if (!this.refresh(control, screenHit)) return false
    const hit = control.pointer.locked
      ? this.world.stage.raycastReticle()[0]
      : this.world.stage.raycastPointer(control.pointer.position)[0]
    const orbHit = this.getOrbHit()
    if (orbHit && (!hit || orbHit.distance <= hit.distance + 0.05)) {
      this.selected = this.markers.indexOf(orbHit.object)
      if (this.points[this.selected]?.attachment) {
        this.world.network.send('playerSeatAttachment', {
          action: 'return',
          anchorId: this.anchorId,
          index: this.selected,
        })
        this.selected = null
        return true
      }
      this.world.emit('toast', 'Attachment selected. Click an object to place it; Escape or right-click cancels.')
      return true
    }
    if (this.selected === null) return false
    const index = this.selected
    const marker = this.markers[index]
    this.selected = null
    const entity = hit?.getEntity?.() || hit?.node?.ctx?.entity
    if (!entity?.isApp || entity.destroyed) {
      this.world.emit('toast', 'No object selected. Attachment cancelled.')
      return true
    }
    if (!this.player.isBuilder()) {
      this.world.emit('toast', 'Builder permission is required to move objects.')
      return true
    }
    if (entity.data.pinned || entity.data.mover || entity.data.uploader) {
      this.world.emit('toast', 'That object is pinned or being edited.')
      return true
    }
    this.world.network.send('playerSeatAttachment', {
      action: 'attach',
      anchorId: this.anchorId,
      index,
      objectId: entity.data.id,
      position: marker.position.toArray(),
      quaternion: marker.quaternion.toArray(),
    })
    return true
  }

  cancel() {
    if (this.selected === null) return false
    this.selected = null
    this.world.emit('toast', 'Attachment cancelled.')
    return true
  }
}
