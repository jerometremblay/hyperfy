import * as THREE from './three'

const SIDE_PAIRS = [
  ['leftEye', 'rightEye'],
  ['leftShoulder', 'rightShoulder'],
  ['leftUpperArm', 'rightUpperArm'],
  ['leftLowerArm', 'rightLowerArm'],
  ['leftHand', 'rightHand'],
  ['leftUpperLeg', 'rightUpperLeg'],
  ['leftLowerLeg', 'rightLowerLeg'],
  ['leftFoot', 'rightFoot'],
  ['leftToes', 'rightToes'],
]

for (const finger of ['Thumb', 'Index', 'Middle', 'Ring', 'Little']) {
  for (const segment of ['Metacarpal', 'Proximal', 'Intermediate', 'Distal']) {
    SIDE_PAIRS.push([`left${finger}${segment}`, `right${finger}${segment}`])
  }
}

const MIRRORED_BONES = new Map(
  SIDE_PAIRS.flatMap(([left, right]) => [
    [left, right],
    [right, left],
  ])
)

const LIMITS = {
  hips: { x: [-70, 90], y: [-60, 60], z: [-45, 45] },
  spine: { x: [-45, 55], y: [-45, 45], z: [-35, 35] },
  chest: { x: [-45, 55], y: [-45, 45], z: [-35, 35] },
  upperChest: { x: [-40, 45], y: [-40, 40], z: [-30, 30] },
  neck: { x: [-50, 50], y: [-60, 60], z: [-45, 45] },
  head: { x: [-50, 50], y: [-80, 80], z: [-45, 45] },
  leftUpperArm: { x: [-150, 150], y: [-120, 120], z: [-170, 170] },
  rightUpperArm: { x: [-150, 150], y: [-120, 120], z: [-170, 170] },
  leftLowerArm: { x: [-10, 155], y: [-80, 80], z: [-80, 80] },
  rightLowerArm: { x: [-10, 155], y: [-80, 80], z: [-80, 80] },
  leftHand: { x: [-90, 90], y: [-90, 90], z: [-90, 90] },
  rightHand: { x: [-90, 90], y: [-90, 90], z: [-90, 90] },
  leftUpperLeg: { x: [-130, 120], y: [-70, 70], z: [-65, 65] },
  rightUpperLeg: { x: [-130, 120], y: [-70, 70], z: [-65, 65] },
  leftLowerLeg: { x: [-155, 0], y: [-35, 35], z: [-35, 35] },
  rightLowerLeg: { x: [-155, 0], y: [-35, 35], z: [-35, 35] },
  leftFoot: { x: [-60, 60], y: [-45, 45], z: [-45, 45] },
  rightFoot: { x: [-60, 60], y: [-45, 45], z: [-45, 45] },
  leftToes: { x: [-60, 60], y: [-45, 45], z: [-45, 45] },
  rightToes: { x: [-60, 60], y: [-45, 45], z: [-45, 45] },
}

const AXES = ['x', 'y', 'z']
const RAD2DEG = 180 / Math.PI
const DEG2RAD = Math.PI / 180

export function getMirroredBoneName(name) {
  return MIRRORED_BONES.get(name) || null
}

export function mirrorNormalizedRotation(rotation) {
  const quaternion = new THREE.Quaternion().fromArray(rotation)
  quaternion.set(quaternion.x, -quaternion.y, -quaternion.z, quaternion.w).normalize()
  return quaternion.toArray()
}

export function getBoneRotationEuler(rotation) {
  const euler = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().fromArray(rotation), 'XYZ')
  return { x: euler.x * RAD2DEG, y: euler.y * RAD2DEG, z: euler.z * RAD2DEG }
}

export function clampBoneRotation(name, rotation, enabled = true) {
  const quaternion = new THREE.Quaternion().fromArray(rotation).normalize()
  if (!enabled) return quaternion.toArray()

  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ')
  const limits = LIMITS[name]
  if (limits) {
    for (const axis of AXES) {
      const [min, max] = limits[axis]
      euler[axis] = THREE.MathUtils.clamp(euler[axis] * RAD2DEG, min, max) * DEG2RAD
    }
  }
  return new THREE.Quaternion().setFromEuler(euler).normalize().toArray()
}

function setWorldDirection(bone, currentDirection, targetDirection) {
  if (currentDirection.lengthSq() < 1e-10 || targetDirection.lengthSq() < 1e-10) return false
  currentDirection.normalize()
  targetDirection.normalize()

  const currentWorldRotation = bone.getWorldQuaternion(new THREE.Quaternion())
  const delta = new THREE.Quaternion().setFromUnitVectors(currentDirection, targetDirection)
  const targetWorldRotation = delta.multiply(currentWorldRotation)
  const parentWorldRotation = bone.parent
    ? bone.parent.getWorldQuaternion(new THREE.Quaternion())
    : new THREE.Quaternion()
  bone.quaternion.copy(parentWorldRotation.invert().multiply(targetWorldRotation)).normalize()
  bone.updateMatrixWorld(true)
  return true
}

/**
 * Move a two-bone chain toward a target in scene-local coordinates.
 * Bone lengths and the chosen pole direction are preserved; unreachable targets
 * are clamped to the chain's reachable range.
 */
export function solveTwoBoneIK(scene, root, middle, end, target, poleDirection = [0, 0, -1]) {
  if (!scene || !root || !middle || !end || !Array.isArray(target) || target.length !== 3) return false

  scene.updateWorldMatrix(true, true)
  const rootPosition = root.getWorldPosition(new THREE.Vector3())
  const middlePosition = middle.getWorldPosition(new THREE.Vector3())
  const endPosition = end.getWorldPosition(new THREE.Vector3())
  const targetPosition = new THREE.Vector3(...target).applyMatrix4(scene.matrixWorld)
  const upperLength = rootPosition.distanceTo(middlePosition)
  const lowerLength = middlePosition.distanceTo(endPosition)
  if (upperLength < 1e-5 || lowerLength < 1e-5) return false

  const axis = targetPosition.clone().sub(rootPosition)
  const requestedDistance = axis.length()
  if (requestedDistance < 1e-5) return false
  axis.normalize()

  const minDistance = Math.abs(upperLength - lowerLength) + 1e-5
  const maxDistance = upperLength + lowerLength - 1e-5
  const distance = THREE.MathUtils.clamp(requestedDistance, minDistance, maxDistance)
  const reachableTarget = rootPosition.clone().addScaledVector(axis, distance)

  const worldPole = new THREE.Vector3(...poleDirection).transformDirection(scene.matrixWorld)
  const bendDirection = worldPole.addScaledVector(axis, -worldPole.dot(axis))
  if (bendDirection.lengthSq() < 1e-8) {
    bendDirection.set(0, 1, 0).addScaledVector(axis, -axis.y)
  }
  if (bendDirection.lengthSq() < 1e-8) {
    bendDirection.set(1, 0, 0).addScaledVector(axis, -axis.x)
  }
  bendDirection.normalize()

  const along = (upperLength * upperLength + distance * distance - lowerLength * lowerLength) / (2 * distance)
  const across = Math.sqrt(Math.max(upperLength * upperLength - along * along, 0))
  const desiredMiddle = rootPosition.clone().addScaledVector(axis, along).addScaledVector(bendDirection, across)

  const currentUpperDirection = middlePosition.sub(rootPosition)
  const desiredUpperDirection = desiredMiddle.clone().sub(rootPosition)
  if (!setWorldDirection(root, currentUpperDirection, desiredUpperDirection)) return false

  scene.updateWorldMatrix(true, true)
  const nextMiddlePosition = middle.getWorldPosition(new THREE.Vector3())
  const nextEndPosition = end.getWorldPosition(new THREE.Vector3())
  const currentLowerDirection = nextEndPosition.sub(nextMiddlePosition)
  const desiredLowerDirection = reachableTarget.clone().sub(nextMiddlePosition)
  if (!setWorldDirection(middle, currentLowerDirection, desiredLowerDirection)) return false

  scene.updateWorldMatrix(true, true)
  return true
}
