import * as THREE from 'three'

const eyePosition = new THREE.Vector3()

export function getAvatarEyePosition(avatar, target = new THREE.Vector3()) {
  // getBoneTransform reuses a scratch matrix; read each position before the next call.
  const leftEye = avatar?.getBoneTransform?.('leftEye')
  const hasLeftEye = !!leftEye?.isMatrix4
  if (hasLeftEye) target.setFromMatrixPosition(leftEye)
  const rightEye = avatar?.getBoneTransform?.('rightEye')
  if (rightEye?.isMatrix4) {
    if (hasLeftEye) return target.add(eyePosition.setFromMatrixPosition(rightEye)).multiplyScalar(0.5)
    return target.setFromMatrixPosition(rightEye)
  }
  if (hasLeftEye) return target
  const head = avatar?.getBoneTransform?.('head')
  return head?.isMatrix4 ? target.setFromMatrixPosition(head) : null
}

export function getAvatarCameraFocus(avatar, fallbackHeight, target = new THREE.Vector3(), bounds = new THREE.Box3()) {
  const headMatrix = avatar?.getBoneTransform?.('head')
  if (headMatrix?.isMatrix4) {
    return target.setFromMatrixPosition(headMatrix)
  }

  return getAvatarFocus(avatar?.instance?.raw?.scene, fallbackHeight, target, bounds)
}

export function getAvatarFocus(object, fallbackHeight, target = new THREE.Vector3(), bounds = new THREE.Box3()) {
  bounds.setFromObject(object)
  if (bounds.isEmpty()) {
    object.getWorldPosition(target)
    target.y += fallbackHeight / 2 || 0.85
    return target
  }
  return bounds.getCenter(target)
}
