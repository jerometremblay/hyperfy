import * as THREE from './three'
import { MIN_PROMPT_BOX_SIZE } from './promptBoxTools'

// Move a single face, holding its opposite face fixed even on a rotated box.
export function resizePromptBoxFace(position, quaternion, dimensions, axis, sign, distance) {
  const size = [...dimensions]
  size[axis] = Math.max(MIN_PROMPT_BOX_SIZE, dimensions[axis] + sign * distance)
  const offset = new THREE.Vector3()
  offset.setComponent(axis, (sign * (size[axis] - dimensions[axis])) / 2)
  offset.applyQuaternion(new THREE.Quaternion().fromArray(quaternion))
  return { position: new THREE.Vector3().fromArray(position).add(offset).toArray(), scale: size }
}

export class PromptBoxResizeControls {
  constructor(world, app, viewport) {
    this.world = world
    this.app = app
    this.viewport = viewport
    this.group = new THREE.Group()
    this.geometry = new THREE.SphereGeometry(0.045, 16, 12)
    this.material = new THREE.MeshBasicMaterial({ color: '#ffffff', depthTest: false })
    for (let axis = 0; axis < 3; axis++) {
      for (const sign of [-1, 1]) {
        const handle = new THREE.Mesh(this.geometry, this.material)
        handle.userData = { axis, sign }
        handle.renderOrder = 10000
        this.group.add(handle)
      }
    }
    this.raycaster = new THREE.Raycaster()
    this.cursor = new THREE.Vector2()
    world.stage.scene.add(this.group)
    viewport.addEventListener('pointerdown', this.onDown, true)
    window.addEventListener('pointermove', this.onMove, true)
    window.addEventListener('pointerup', this.onUp, true)
    viewport.addEventListener('pointercancel', this.onUp, true)
    window.addEventListener('blur', this.onUp)
    this.update()
  }

  update() {
    const root = this.app.root
    this.group.position.copy(root.position)
    this.group.quaternion.copy(root.quaternion)
    for (const handle of this.group.children) {
      const { axis, sign } = handle.userData
      handle.position.set(0, 0, 0).setComponent(axis, (sign * root.scale.getComponent(axis)) / 2)
    }
    this.group.updateMatrixWorld(true)
  }

  setRay(event) {
    if (document.pointerLockElement) {
      const rect = this.viewport.getBoundingClientRect()
      if (this.drag) {
        this.cursor.x += (event.movementX / rect.width) * 2
        this.cursor.y -= (event.movementY / rect.height) * 2
      } else {
        this.cursor.set(0, 0)
      }
    } else {
      const rect = this.viewport.getBoundingClientRect()
      this.cursor.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1
      )
    }
    this.raycaster.setFromCamera(this.cursor, this.world.camera)
  }

  onDown = event => {
    if (event.button !== 0 || !this.world.builder.canBuild() || this.app.building) return
    this.update()
    this.setRay(event)
    const hit = this.raycaster.intersectObjects(this.group.children)[0]
    if (!hit) return
    const { axis, sign } = hit.object.userData
    const direction = new THREE.Vector3().setComponent(axis, 1).applyQuaternion(this.app.root.quaternion)
    const normal = this.raycaster.ray.direction.clone()
    normal.addScaledVector(direction, -normal.dot(direction))
    // An axis pointing straight at the camera has no useful screen projection.
    // For that face, dragging upward grows outward and downward shrinks inward.
    const endOn = normal.lengthSq() < 0.01
    const plane = endOn ? null : new THREE.Plane().setFromNormalAndCoplanarPoint(normal.normalize(), hit.point)
    const start = endOn ? hit.point : this.raycaster.ray.intersectPlane(plane, new THREE.Vector3())
    if (!start) return
    this.drag = {
      axis,
      sign,
      direction,
      plane,
      start,
      position: this.app.root.position.toArray(),
      quaternion: this.app.root.quaternion.toArray(),
      dimensions: this.app.root.scale.toArray(),
      pointerId: event.pointerId,
      endOn,
      cursorY: this.cursor.y,
      screenScale: hit.distance * Math.tan((this.world.camera.fov * Math.PI) / 360),
    }
    event.preventDefault()
    event.stopImmediatePropagation()
    if (!document.pointerLockElement) this.viewport.setPointerCapture(event.pointerId)
  }

  onMove = event => {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return
    this.setRay(event)
    const point = this.drag.endOn ? null : this.raycaster.ray.intersectPlane(this.drag.plane, new THREE.Vector3())
    if (point || this.drag.endOn) {
      const d = this.drag
      const distance = d.endOn
        ? d.sign * (this.cursor.y - d.cursorY) * d.screenScale
        : point.sub(d.start).dot(d.direction)
      const change = resizePromptBoxFace(d.position, d.quaternion, d.dimensions, d.axis, d.sign, distance)
      this.app.root.position.fromArray(change.position)
      this.app.root.scale.fromArray(change.scale)
      this.update()
    }
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  onUp = event => {
    if (!this.drag) return
    if (this.viewport.hasPointerCapture(this.drag.pointerId)) this.viewport.releasePointerCapture(this.drag.pointerId)
    this.drag = null
    event.stopImmediatePropagation()
  }

  dispose() {
    if (this.drag && this.viewport.hasPointerCapture(this.drag.pointerId))
      this.viewport.releasePointerCapture(this.drag.pointerId)
    this.drag = null
    this.viewport.removeEventListener('pointerdown', this.onDown, true)
    window.removeEventListener('pointermove', this.onMove, true)
    window.removeEventListener('pointerup', this.onUp, true)
    this.viewport.removeEventListener('pointercancel', this.onUp, true)
    window.removeEventListener('blur', this.onUp)
    this.world.stage.scene.remove(this.group)
    this.geometry.dispose()
    this.material.dispose()
  }
}
