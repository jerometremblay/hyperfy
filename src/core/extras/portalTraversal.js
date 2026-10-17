import * as THREE from './three'

const flip = new THREE.Matrix4().makeRotationY(Math.PI)

export function getPortalTransform(source, destination) {
  return new THREE.Matrix4().copy(destination.matrixWorld).multiply(flip).multiply(source.matrixWorld.clone().invert())
}

// The character controller and gravity stay upright and retain their physical size.
export function supportsPortalTraversal(source, destination) {
  const matrix = getPortalTransform(source, destination)
  const e = matrix.elements
  const x = new THREE.Vector3(e[0], e[1], e[2])
  const y = new THREE.Vector3(e[4], e[5], e[6])
  const z = new THREE.Vector3(e[8], e[9], e[10])
  return (
    Math.abs(x.lengthSq() - 1) < 1e-5 &&
    y.distanceToSquared(new THREE.Vector3(0, 1, 0)) < 1e-10 &&
    Math.abs(z.lengthSq() - 1) < 1e-5 &&
    Math.abs(x.dot(z)) < 1e-5 &&
    matrix.determinant() > 0
  )
}

export function getPortalPlane(portal, side = 1) {
  return new THREE.Plane(new THREE.Vector3(0, 0, side), 0).applyMatrix4(portal.matrixWorld)
}

export function isPortalMoving(portal) {
  return portal.ctx.entity ? !!portal.ctx.entity.data.mover : !!portal.ctx.moving
}

// Test the standing body's swept bounds against the aperture in portal space.
export function overlapsPortal(portal, position, height = 1.6, radius = 0.3) {
  const inverse = portal.matrixWorld.clone().invert()
  const feet = position.clone().applyMatrix4(inverse)
  const head = position
    .clone()
    .add(new THREE.Vector3(0, height, 0))
    .applyMatrix4(inverse)
  const e = inverse.elements
  const margin = [0, 1, 2].map(i => radius * Math.hypot(e[i], e[i + 4], e[i + 8]))
  return (
    Math.min(feet.z, head.z) <= margin[2] &&
    Math.max(feet.z, head.z) >= -margin[2] &&
    Math.min(feet.x, head.x) <= portal.width / 2 + margin[0] &&
    Math.max(feet.x, head.x) >= -portal.width / 2 - margin[0] &&
    Math.min(feet.y, head.y) <= portal.height / 2 + margin[1] &&
    Math.max(feet.y, head.y) >= -portal.height / 2 - margin[1]
  )
}
