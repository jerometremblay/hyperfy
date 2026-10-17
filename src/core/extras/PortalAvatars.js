import * as THREE from './three'
import {
  getPortalPlane,
  getPortalTransform,
  isPortalMoving,
  overlapsPortal,
  supportsPortalTraversal,
} from './portalTraversal'
import { getAvatarEyePosition } from './avatarFocus'

const cameraAnchor = new THREE.Vector3()

/** Two draws of one animated skeleton; never a second player or physics actor. */
export class PortalAvatars {
  constructor(world) {
    this.world = world
    this.copies = new Map()
  }

  update() {
    const pairs = []
    const portals = [...(this.world.graphics?.portals || [])].filter(portal => !isPortalMoving(portal))
    for (const source of portals) {
      if (source.url || !source.target) continue
      const destination = portals.find(portal => portal !== source && portal.portalId === source.target)
      if (destination && supportsPortalTraversal(source, destination)) {
        pairs.push([source, destination], [destination, source])
      }
    }
    const active = new Set()
    for (const player of this.world.entities?.players?.values() || []) {
      const scene = player.avatar?.instance?.raw?.scene
      if (!scene || !player.base) continue
      const pair = pairs.find(
        ([portal]) =>
          (portal.doubleside || getPortalPlane(portal).distanceToPoint(player.base.position) >= 0) &&
          overlapsPortal(portal, player.base.position, player.avatar.getHeight() || 1.6, player.capsuleRadius || 0.3)
      )
      if (!pair) continue
      const [source, destination] = pair
      const distance = getPortalPlane(source).distanceToPoint(player.base.position)
      const side = distance >= 0 ? 1 : -1
      active.add(player)
      let copy = this.copies.get(player)
      if (copy?.sourceScene !== scene) {
        this.remove(player)
        copy = null
      }
      if (!copy) {
        copy = { sourceScene: scene, meshes: [], sourcePlane: new THREE.Plane(), exitPlane: new THREE.Plane() }
        scene.traverse(mesh => {
          if (!mesh.isMesh) return
          const replica = mesh.clone(false)
          replica.matrixAutoUpdate = false
          replica.matrixWorldAutoUpdate = false
          replica.frustumCulled = false
          const original = mesh.material
          const cloneMaterial = plane => {
            const clone = material => {
              const result = material.clone()
              result.onBeforeCompile = material.onBeforeCompile
              result.customProgramCacheKey = material.customProgramCacheKey
              result.clippingPlanes = [...(material.clippingPlanes || []), plane]
              result.clipShadows = true
              return result
            }
            return Array.isArray(original) ? original.map(clone) : clone(original)
          }
          const local = cloneMaterial(copy.sourcePlane)
          mesh.material = local
          replica.material = cloneMaterial(copy.exitPlane)
          // Detached VRM skeletons already contain the current pose in avatar
          // space. Share them, morph weights and geometry with the original draw.
          replica.morphTargetInfluences = mesh.morphTargetInfluences
          this.world.stage.scene.add(replica)
          copy.meshes.push({ mesh, replica, original, local })
        })
        this.copies.set(player, copy)
      }
      copy.source = source
      copy.destination = destination
      copy.side = side
      copy.sourcePlane.copy(getPortalPlane(source, side))
      copy.exitPlane.copy(getPortalPlane(destination, side))
      const transform = getPortalTransform(source, destination)
      scene.updateMatrixWorld(true)
      for (const { mesh, replica } of copy.meshes) {
        replica.geometry = mesh.geometry
        replica.matrixWorld.multiplyMatrices(transform, mesh.matrixWorld)
        replica.matrix.copy(replica.matrixWorld)
        replica.visible = mesh.visible && scene.visible
      }
    }
    for (const player of this.copies.keys()) if (!active.has(player)) this.remove(player)
    const player = this.world.entities?.player
    if (player?.portalTraversal && !active.has(player)) player.portalTraversal = null
  }

  // Physics follows the feet; the rendered viewpoint follows the eye independently.
  mapCamera() {
    const player = this.world.entities?.player
    const copy = this.copies.get(player)
    if (!copy) return
    const camera = this.world.camera
    // Follow the projected head even when a third-person camera boom puts the
    // lens outside a narrow aperture. Fall back to the lens before the avatar
    // has a posed head transform.
    const anchor = getAvatarEyePosition(player.avatar, cameraAnchor) || camera.getWorldPosition(cameraAnchor)
    if (copy.sourcePlane.distanceToPoint(anchor) >= 0) return
    const localAnchor = anchor.clone().applyMatrix4(copy.source.matrixWorld.clone().invert())
    if (Math.abs(localAnchor.x) > copy.source.width / 2 || Math.abs(localAnchor.y) > copy.source.height / 2) return
    const rig = player.isXR ? player.xrRig : this.world.rig
    const position = rig.position.clone()
    const quaternion = rig.quaternion.clone()
    const scale = rig.scale.clone()
    rig.updateMatrixWorld(true)
    const matrix = getPortalTransform(copy.source, copy.destination).multiply(rig.matrixWorld)
    if (rig.parent) matrix.premultiply(rig.parent.matrixWorld.clone().invert())
    matrix.decompose(rig.position, rig.quaternion, rig.scale)
    rig.updateMatrixWorld(true)
    return () => {
      rig.position.copy(position)
      rig.quaternion.copy(quaternion)
      rig.scale.copy(scale)
      rig.updateMatrixWorld(true)
    }
  }

  remove(player) {
    const copy = this.copies.get(player)
    if (!copy) return
    for (const { mesh, replica, original, local } of copy.meshes) {
      if (mesh.material === local) mesh.material = original
      replica.removeFromParent()
      for (const material of [local, replica.material].flat()) material.dispose()
    }
    this.copies.delete(player)
  }

  destroy() {
    for (const player of this.copies.keys()) this.remove(player)
  }
}
