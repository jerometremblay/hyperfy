import * as THREE from './three'

const flip = new THREE.Matrix4().makeRotationY(Math.PI)
const inverseSource = new THREE.Matrix4()
const cameraPosition = new THREE.Vector3()
const plane = new THREE.Plane()
const clip = new THREE.Vector4()
const q = new THREE.Vector4()
const cameraRay = new THREE.Ray()
const portalPlane = new THREE.Plane()
const inversePortal = new THREE.Matrix4()
const crossingPoint = new THREE.Vector3()

// Portal surfaces have no physics wall, since the player must be able to cross.
// Treat the aperture as an obstacle only for the third-person camera boom.
export function getPortalCameraDistance(portals, origin, direction, distance, radius) {
  if (!portals || distance <= 0) return distance
  cameraRay.set(origin, direction)
  for (const portal of portals) {
    portalPlane.normal.set(0, 0, 1)
    portalPlane.constant = 0
    portalPlane.applyMatrix4(portal.matrixWorld)
    if (!portal.doubleside && portalPlane.distanceToPoint(origin) < 0) continue
    const crossing = cameraRay.distanceToPlane(portalPlane)
    if (crossing === null || crossing < 0) continue
    const approach = Math.abs(portalPlane.normal.dot(direction))
    if (approach < 0.000001) continue
    const limit = Math.max(0, crossing - radius / approach)
    if (limit > distance) continue

    inversePortal.copy(portal.matrixWorld).invert()
    cameraRay.at(limit, crossingPoint)
    portalPlane.projectPoint(crossingPoint, crossingPoint).applyMatrix4(inversePortal)
    const m = inversePortal.elements
    const marginX = radius * Math.hypot(m[0], m[4], m[8])
    const marginY = radius * Math.hypot(m[1], m[5], m[9])
    if (Math.abs(crossingPoint.x) > portal.width / 2 + marginX) continue
    if (Math.abs(crossingPoint.y) > portal.height / 2 + marginY) continue

    distance = Math.min(distance, limit)
  }
  return distance
}

// Map the eye through the two doorways, then clip away the near side of the exit.
export function updatePortalCamera(view, source, destination, eye) {
  if (!!view.camera.isOrthographicCamera !== !!eye.isOrthographicCamera) {
    view.camera = eye.isOrthographicCamera ? new THREE.OrthographicCamera() : new THREE.PerspectiveCamera()
  }
  const camera = view.camera
  inverseSource.copy(source).invert()
  camera.matrixWorld.copy(destination).multiply(flip).multiply(inverseSource).multiply(eye.matrixWorld)
  // Keep the full affine transform, including differently scaled doorways.
  camera.matrixAutoUpdate = false
  camera.matrixWorldAutoUpdate = false
  camera.matrix.copy(camera.matrixWorld)
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert()
  camera.position.setFromMatrixPosition(camera.matrixWorld)
  camera.near = eye.near
  camera.far = eye.far
  camera.layers.mask = eye.layers.mask
  camera.projectionMatrix.copy(eye.projectionMatrix)

  // Project the source aperture into the original eye's screen coordinates.
  // The oblique projection below changes only depth, not these texture coordinates.
  view.textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
  view.textureMatrix.multiply(eye.projectionMatrix).multiply(eye.matrixWorldInverse).multiply(source)

  cameraPosition.setFromMatrixPosition(eye.matrixWorld).applyMatrix4(inverseSource)
  const side = cameraPosition.z >= 0 ? 1 : -1
  plane.normal.set(0, 0, side)
  plane.constant = -0.002
  plane.applyMatrix4(destination)
  plane.applyMatrix4(camera.matrixWorldInverse)
  clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant)
  const p = camera.projectionMatrix.elements
  // Unproject the far corner for either perspective or orthographic projection.
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
  q.set(Math.sign(clip.x), Math.sign(clip.y), 1, 1).applyMatrix4(camera.projectionMatrixInverse)
  clip.multiplyScalar(2 / clip.dot(q))
  p[2] = clip.x - p[3]
  p[6] = clip.y - p[7]
  p[10] = clip.z - p[11]
  p[14] = clip.w - p[15]
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
}
