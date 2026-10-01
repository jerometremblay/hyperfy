import * as THREE from 'three'

export function getAvatarCameraFocus(
  avatar,
  fallbackHeight,
  target = new THREE.Vector3(),
  bounds = new THREE.Box3()
) {
  const headMatrix = avatar?.getBoneTransform?.('head')
  if (headMatrix?.isMatrix4) {
    return target.setFromMatrixPosition(headMatrix)
  }

  return getAvatarFocus(avatar?.instance?.raw?.scene, fallbackHeight, target, bounds)
}

export function getAvatarFocus(
  object,
  fallbackHeight,
  target = new THREE.Vector3(),
  bounds = new THREE.Box3()
) {
  bounds.setFromObject(object)
  if (bounds.isEmpty()) {
    object.getWorldPosition(target)
    target.y += fallbackHeight / 2 || 0.85
    return target
  }
  return bounds.getCenter(target)
}
