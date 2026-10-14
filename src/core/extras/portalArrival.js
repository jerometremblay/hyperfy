import * as THREE from './three'

export function parsePortalPose(value) {
  try {
    const pose = JSON.parse(value)
    if (!Array.isArray(pose) || pose.length !== 6 || !pose.every(Number.isFinite)) return null
    const length = Math.hypot(...pose.slice(3))
    if (!Number.isFinite(length) || length === 0) return null
    return {
      position: new THREE.Vector3().fromArray(pose),
      direction: new THREE.Vector3().fromArray(pose, 3).divideScalar(length),
    }
  } catch {
    return null
  }
}

export function getPortalArrival(portal, sourcePosition, sourceDirection) {
  const position = sourcePosition?.clone() || new THREE.Vector3(0, -portal.height / 2, 1)
  const direction = sourceDirection?.clone() || new THREE.Vector3(0, 0, -1)
  const entrySide = position.z >= 0 ? 1 : -1
  const side = portal.doubleside ? entrySide : 1
  const scale = new THREE.Vector3().setFromMatrixScale(portal.matrixWorld)
  position.x = -position.x
  position.z = side * Math.max(1, 0.6 / Math.abs(scale.z))
  position.applyMatrix4(portal.matrixWorld)
  direction.x = -direction.x
  direction.z = !portal.doubleside && entrySide < 0 ? direction.z : -direction.z
  direction.transformDirection(portal.matrixWorld)
  return { position, rotationY: Math.atan2(-direction.x, -direction.z) }
}
