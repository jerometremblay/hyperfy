import * as THREE from 'three'

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
