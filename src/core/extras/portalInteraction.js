import * as THREE from './three'
import { getPortalTransform, isPortalMoving } from './portalTraversal'

// Follow the same single destination view as renderPortal. All portal surfaces
// are hidden in that view, so interaction never recurses through another link.
export function resolvePortalHit(world, hit) {
  const portals = world.graphics?.portals
  const source = hit?.node
  if (!portals?.has(source) || source.url || isPortalMoving(source)) return hit
  const destination =
    source.getTraversalReturn?.() ||
    [...portals].find(portal => portal !== source && portal.portalId === source.target && !isPortalMoving(portal))
  if (!destination) return hit

  const stage = world.stage
  const raycaster = stage.raycaster
  const ray = raycaster.ray.clone()
  const localOrigin = ray.origin.clone().applyMatrix4(source.matrixWorld.clone().invert())
  if (!source.doubleside && localOrigin.z < 0) return hit

  const transform = getPortalTransform(source, destination)
  const origin = ray.origin.clone().applyMatrix4(transform)
  const crossing = hit.point.clone().applyMatrix4(transform)
  const direction = ray.origin.clone().add(ray.direction).applyMatrix4(transform).sub(origin)
  const scale = direction.length()
  direction.normalize()
  // Clip the near side of the destination, just as the preview camera does.
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, localOrigin.z >= 0 ? 1 : -1), -0.002)
  plane.applyMatrix4(destination.matrixWorld)
  const clipDistance = new THREE.Ray(origin, direction).distanceToPlane(plane)
  const near = Math.max(raycaster.near * scale, clipDistance ?? origin.distanceTo(crossing))
  const far = raycaster.far * scale
  const { layers } = raycaster
  const originalNear = raycaster.near
  const originalFar = raycaster.far
  try {
    const result = stage
      .raycast(origin, direction, layers, near, far)
      .find(item => !portals.has(item.node) && plane.distanceToPoint(item.point) >= 0)
    if (!result) return null
    result.direction = direction
    result.portalTransform = transform
    return result
  } finally {
    raycaster.ray.copy(ray)
    raycaster.near = originalNear
    raycaster.far = originalFar
  }
}
