import * as THREE from './three'

function getBone(scene, name) {
  let found = null
  scene.traverse(object => {
    if (!found && object.isSkinnedMesh && object.skeleton) {
      found = object.skeleton.getBoneByName(name) || null
    }
  })
  return found || scene.getObjectByName(name)
}

function isWithin(object, ancestor) {
  for (let current = object; current; current = current.parent) {
    if (current === ancestor) return true
  }
  return false
}

function getBonePositionInScene(scene, bone) {
  bone.updateWorldMatrix(true, false)
  const position = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld)
  if (isWithin(bone, scene)) {
    scene.updateWorldMatrix(true, false)
    position.applyMatrix4(new THREE.Matrix4().copy(scene.matrixWorld).invert())
  }
  return position
}

export function createNormalizedPoseMapping(humanoid, scene) {
  const bones = {}
  const restPose = humanoid?.rawRestPose || {}
  const inverseSceneRotation = new THREE.Quaternion()
  if (scene) {
    scene.updateWorldMatrix(true, false)
    scene.getWorldQuaternion(inverseSceneRotation).invert()
  }

  for (const [name, humanBone] of Object.entries(humanoid?.humanBones || {})) {
    const node = humanBone?.node
    if (!node) continue

    node.updateWorldMatrix(true, false)
    const parentWorldRotation = new THREE.Quaternion()
    if (node.parent) {
      node.parent.updateWorldMatrix(true, false)
      node.parent.getWorldQuaternion(parentWorldRotation)
      parentWorldRotation.premultiply(inverseSceneRotation).normalize()
    }
    const rest = restPose[name]
    bones[name] = {
      rawName: node.name,
      parentWorldRotation: parentWorldRotation.toArray(),
      restPosition: rest?.position || node.position.toArray(),
      restRotation: rest?.rotation || node.quaternion.toArray(),
    }
  }

  const rawHips = humanoid?.humanBones?.hips?.node
  const hipsRestPosition = rawHips && scene ? getBonePositionInScene(scene, rawHips).toArray() : [0, 0, 0]

  return { bones, hipsRestPosition }
}

export function getNormalizedPose(scene, mapping) {
  const pose = {}
  const hipsRestPosition = new THREE.Vector3().fromArray(mapping.hipsRestPosition)

  for (const [name, info] of Object.entries(mapping.bones)) {
    const bone = getBone(scene, info.rawName)
    if (!bone) continue

    const parentRotation = new THREE.Quaternion().fromArray(info.parentWorldRotation)
    const inverseParentRotation = parentRotation.clone().invert()
    const inverseRestRotation = new THREE.Quaternion().fromArray(info.restRotation).invert()
    const rotation = parentRotation
      .multiply(bone.quaternion)
      .multiply(inverseRestRotation)
      .multiply(inverseParentRotation)
      .normalize()
    pose[name] = { rotation: rotation.toArray() }

    if (name === 'hips') {
      const position = getBonePositionInScene(scene, bone).sub(hipsRestPosition)
      pose.hips.position = position.toArray()
    }
  }

  return pose
}

export function applyNormalizedPose(scene, mapping, pose) {
  for (const [name, info] of Object.entries(mapping.bones)) {
    const rotation = pose?.[name]?.rotation
    if (!rotation) continue
    const bone = getBone(scene, info.rawName)
    if (!bone) continue

    const parentRotation = new THREE.Quaternion().fromArray(info.parentWorldRotation)
    const rawRestRotation = new THREE.Quaternion().fromArray(info.restRotation)
    bone.quaternion
      .copy(parentRotation)
      .invert()
      .multiply(new THREE.Quaternion().fromArray(rotation))
      .multiply(parentRotation)
      .multiply(rawRestRotation)
    bone.updateMatrix()
  }

  const hipsInfo = mapping.bones.hips
  const hipsBone = hipsInfo && getBone(scene, hipsInfo.rawName)
  const hipsOffset = pose?.hips?.position
  if (hipsBone && hipsOffset) {
    const targetPosition = new THREE.Vector3()
      .fromArray(mapping.hipsRestPosition)
      .add(new THREE.Vector3().fromArray(hipsOffset))
    if (hipsBone.parent) {
      const attachedToScene = isWithin(hipsBone, scene)
      if (attachedToScene) {
        scene.updateWorldMatrix(true, false)
        targetPosition.applyMatrix4(scene.matrixWorld)
      }
      hipsBone.parent.updateWorldMatrix(true, false)
      targetPosition.applyMatrix4(new THREE.Matrix4().copy(hipsBone.parent.matrixWorld).invert())
    }
    hipsBone.position.copy(targetPosition)
    hipsBone.updateMatrix()
  }

  const skeletons = new Set()
  scene.traverse(object => {
    if (object.isSkinnedMesh && object.skeleton) skeletons.add(object.skeleton)
  })
  for (const skeleton of skeletons) {
    for (const bone of skeleton.bones) bone.updateMatrixWorld(true)
    skeleton.update()
  }
}
