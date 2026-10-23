import * as THREE from './three'
import { Collider } from '../nodes/Collider'
import { RigidBody } from '../nodes/RigidBody'
import { cutPortalCollision, clipPortalCollision } from './portalCollisionGeometry'
import {
  getPortalPlane,
  getPortalTransform,
  isPortalMoving,
  overlapsPortal,
  supportsPortalTraversal,
} from './portalTraversal'

/** Temporary query geometry for the local CCT; original simulation shapes remain intact. */
export class PortalCollisions {
  constructor(world) {
    this.world = world
    this.colliders = new Set()
    this.replacements = new Map()
    this.unchanged = new Map()
  }

  update(controller, displacement) {
    const player = this.world.entities?.player
    if (player?.controller !== controller) return
    const PHYSX = globalThis.PHYSX
    const portals = [...(this.world.graphics?.portals || [])]
    const apertures = []
    for (const portal of portals) {
      if (portal.url || isPortalMoving(portal)) continue
      const destination =
        portal.getTraversalReturn() ||
        portals.find(other => other !== portal && other.portalId === portal.target && !isPortalMoving(other))
      if (!destination || !supportsPortalTraversal(portal, destination)) continue
      const distance = getPortalPlane(portal).distanceToPoint(controller.position)
      if (!portal.doubleside && distance < -0.01) continue
      const margin = controller.radius + displacement.length() + 0.3
      if (!overlapsPortal(portal, controller.position, controller.height + 2 * controller.radius, margin)) continue
      apertures.push({ portal, destination, side: distance >= 0 ? 1 : -1 })
    }
    const active = new Set()
    let changed = false
    for (const collider of this.colliders) {
      if (!apertures.length) break
      const isPrim = !!collider.portalCollisionGeometry
      const ownerBody = isPrim ? collider : collider.parent
      const shape = collider.shape
      if (!shape || (isPrim ? collider.physics : ownerBody?.type) !== 'static' || collider.trigger) continue
      if (!['environment', 'prop'].includes(collider.layer)) continue
      if (!isPrim && collider.type !== 'box' && (collider.type !== 'geometry' || collider.convex)) continue
      // Use the actual PhysX poses. Prim shapes keep their visual geometry scaled
      // separately; Collider triangle meshes also bake their world scale here.
      const actorPose = ownerBody.actor.getGlobalPose()
      const localPose = shape.getLocalPose()
      const pose = data =>
        new THREE.Matrix4().compose(
          new THREE.Vector3().copy(data.p),
          new THREE.Quaternion().copy(data.q),
          new THREE.Vector3(1, 1, 1)
        )
      const matrix = pose(actorPose).multiply(pose(localPose))
      if (isPrim) matrix.scale(new THREE.Vector3().setFromMatrixScale(collider.matrixWorldOffset))
      else if (collider.type === 'geometry') matrix.scale(new THREE.Vector3().setFromMatrixScale(collider.matrixWorld))
      const key =
        `${collider.shape.ptr}:${matrix.elements.join(',')}:` +
        apertures
          .map(
            ({ portal, destination, side }) =>
              `${portal.id}:${side}:${portal.width}:${portal.height}:${portal.matrixWorld.elements.join(',')}:${destination.matrixWorld.elements.join(',')}`
          )
          .join(';')
      if (this.unchanged.get(collider) === key) continue
      let entry = this.replacements.get(collider)
      if (entry?.key === key) {
        active.add(collider)
        continue
      }
      if (entry) {
        this.remove(collider)
        changed = true
      }
      const geometry = isPrim
        ? collider.portalCollisionGeometry
        : collider.type === 'box'
          ? new THREE.BoxGeometry(collider.width, collider.height, collider.depth)
          : collider._geometry
      if (!geometry.boundingBox) geometry.computeBoundingBox()
      const bounds = geometry.boundingBox.clone().applyMatrix4(matrix)
      const nearby = apertures.filter(({ portal, side }) => {
        const volume = new THREE.Box3(
          new THREE.Vector3(-portal.width / 2, -portal.height / 2, side > 0 ? -2.5 : -0.12),
          new THREE.Vector3(portal.width / 2, portal.height / 2, side > 0 ? 0.12 : 2.5)
        ).applyMatrix4(portal.matrixWorld)
        return bounds.intersectsBox(volume)
      })
      const cut = nearby.length ? cutPortalCollision(geometry, matrix, nearby) : null
      const bridges = apertures
        .map(({ portal, destination, side }) =>
          clipPortalCollision(geometry, getPortalTransform(destination, portal).multiply(matrix), portal, side, controller.radius + controller.controller.getContactOffset())
        )
        .filter(Boolean)
      if (!isPrim && collider.type === 'box') geometry.dispose()
      if (!cut && !bridges.length) {
        this.unchanged.set(collider, key)
        continue
      }
      const positions = [cut, ...bridges]
        .filter(Boolean)
        .flatMap(part => Array.from(part.getAttribute('position').array))
      const replacementGeometry = new THREE.BufferGeometry()
        .setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        .setIndex(Array.from({ length: positions.length / 3 }, (_, i) => i))
      for (const part of [cut, ...bridges]) part?.dispose()
      const queryEnabled = shape.getFlags().isSet(PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE)
      const body = new RigidBody({ type: 'static' })
      if (replacementGeometry.getAttribute('position').count) {
        const replacement = new Collider({
          type: 'geometry',
          geometry: replacementGeometry,
          layer: collider.layer,
          staticFriction: collider.staticFriction,
          dynamicFriction: collider.dynamicFriction,
          restitution: collider.restitution,
        })
        body.add(replacement)
        body.activate({ world: this.world, entity: collider.ctx.entity, portalCollisionProxy: true })
        if (!replacement.shape) {
          body.deactivate()
          replacementGeometry.dispose()
          continue
        }
        replacement.shape.setFlag(PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE, false)
      }
      if (cut) shape.setFlag(PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE, false)
      entry = { key, body, geometry: replacementGeometry, shape, queryEnabled }
      this.replacements.set(collider, entry)
      active.add(collider)
      changed = true
    }
    for (const collider of this.replacements.keys()) {
      if (!active.has(collider)) {
        this.remove(collider)
        changed = true
      }
    }
    if (changed) controller.controller.invalidateCache()
  }

  remove(collider) {
    this.unchanged.delete(collider)
    const entry = this.replacements.get(collider)
    if (!entry) return
    const PHYSX = globalThis.PHYSX
    if (collider.shape === entry.shape)
      entry.shape.setFlag(PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE, entry.queryEnabled)
    entry.body.deactivate()
    entry.geometry.dispose()
    this.replacements.delete(collider)
    this.world.entities?.player?.controller?.controller?.invalidateCache()
  }

  clear() {
    for (const collider of this.replacements.keys()) this.remove(collider)
    this.unchanged.clear()
  }

  destroy() {
    this.clear()
    this.colliders.clear()
  }
}
