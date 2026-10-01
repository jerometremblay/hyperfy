import * as THREE from './three'
import { XR_HAND_BONES } from './handTracking'

// WebXR joint frames: -Z follows the bone and -Y points out of its palmar surface.
function jointFrame(direction, palmNormal) {
  const z = direction.clone().normalize().negate()
  const x = new THREE.Vector3().crossVectors(palmNormal.clone().negate(), z).normalize()
  const y = new THREE.Vector3().crossVectors(z, x).normalize()
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))
}

export function createHandTrackingMapping(scene, normalizedMapping) {
  const sceneInverse = new THREE.Matrix4().copy(scene.matrixWorld).invert()
  const position = bone => bone.getWorldPosition(new THREE.Vector3()).applyMatrix4(sceneInverse)
  const node = name =>
    normalizedMapping.bones[name] ? scene.getObjectByName(normalizedMapping.bones[name].rawName) : null
  const restRotation = name => {
    const info = normalizedMapping.bones[name]
    return new THREE.Quaternion()
      .fromArray(info.parentWorldRotation)
      .multiply(new THREE.Quaternion().fromArray(info.restRotation))
  }
  const mapping = {}
  for (const side of ['left', 'right']) {
    const hand = node(side + 'Hand')
    if (!hand) continue
    const middle = node(side + 'MiddleProximal') || node(side + 'IndexProximal')
    const index = node(side + 'IndexProximal')
    const little = node(side + 'LittleProximal')
    const forward = middle ? position(middle).sub(position(hand)) : position(hand).sub(position(hand.parent))
    const palmLength = forward.length()
    forward.normalize()
    const palmNormal =
      index && little
        ? new THREE.Vector3()
            .crossVectors(forward, position(index).sub(position(little)))
            .multiplyScalar(side === 'left' ? 1 : -1)
            .normalize()
        : new THREE.Vector3(0, -1, 0)
    const wristFrame = jointFrame(forward, palmNormal)
    const bones = {}
    for (const item of XR_HAND_BONES) {
      const name = side + item.bone
      const bone = node(name)
      if (!bone) continue
      const childItem = XR_HAND_BONES.find(child => child.joint === item.child)
      const child = childItem && node(side + childItem.bone)
      // Terminal VRM bones have no tip node; their incoming segment supplies the rest direction.
      const direction = child ? position(child).sub(position(bone)) : position(bone).sub(position(bone.parent))
      if (direction.lengthSq() < 0.000001) continue
      const surfaceNormal = item.bone.startsWith('Thumb')
        ? new THREE.Vector3()
            .crossVectors(direction, palmNormal)
            .multiplyScalar(side === 'left' ? 1 : -1)
            .normalize()
        : palmNormal
      const frame = jointFrame(direction, surfaceNormal)
      bones[item.bone] = frame.invert().multiply(restRotation(name))
    }
    // gripSpace: +Y points toward the arm; +/-X points out of the back of the hand.
    const gripToWrist = jointFrame(new THREE.Vector3(0, -1, 0), new THREE.Vector3(side === 'left' ? 1 : -1, 0, 0))
    mapping[side] = { wrist: wristFrame.invert().multiply(restRotation(side + 'Hand')), bones, gripToWrist, palmLength }
  }
  return mapping
}
