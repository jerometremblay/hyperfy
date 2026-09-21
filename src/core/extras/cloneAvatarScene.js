import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

import * as THREE from './three'

function getSkinnedMeshes(scene) {
  const meshes = []
  scene.traverse(object => {
    if (object.isSkinnedMesh) meshes.push(object)
  })
  return meshes
}

function isWithin(object, ancestor) {
  for (let current = object; current; current = current.parent) {
    if (current === ancestor) return true
  }
  return false
}

function getDetachedRoots(scene, skeletons) {
  const bones = [...new Set(skeletons.flatMap(skeleton => skeleton.bones))]
  return bones.filter(bone => {
    if (isWithin(bone, scene)) return false
    return !bones.some(ancestor => ancestor !== bone && isWithin(bone, ancestor))
  })
}

/**
 * Clone an avatar scene whose factory has detached skeleton roots from the
 * rendered scene. SkeletonUtils can only remap bones present in the traversed
 * object tree, so temporarily include those roots while cloning.
 */
export function cloneAvatarScene(sourceScene) {
  const sourceSkeletons = getSkinnedMeshes(sourceScene)
    .map(mesh => mesh.skeleton)
    .filter(Boolean)
  const detachedRoots = getDetachedRoots(sourceScene, sourceSkeletons)

  if (!detachedRoots.length) {
    return { scene: SkeletonUtils.clone(sourceScene), detachedRoots: [] }
  }

  const wrapper = new THREE.Group()
  const parent = sourceScene.parent
  parent?.remove(sourceScene)
  wrapper.add(sourceScene)
  for (const bone of detachedRoots) wrapper.add(bone)

  let clonedWrapper
  try {
    clonedWrapper = SkeletonUtils.clone(wrapper)
  } finally {
    wrapper.remove(sourceScene)
    for (const bone of detachedRoots) wrapper.remove(bone)
    if (parent) parent.add(sourceScene)
    sourceScene.updateMatrixWorld(true)
    for (const bone of detachedRoots) bone.updateMatrixWorld(true)
  }

  const scene = clonedWrapper.children.find(child => child.isScene) || clonedWrapper.children[0]
  const clonedSkeletons = getSkinnedMeshes(scene)
    .map(mesh => mesh.skeleton)
    .filter(Boolean)
  const clonedDetachedRoots = getDetachedRoots(scene, clonedSkeletons)
  for (const bone of clonedDetachedRoots) bone.parent?.remove(bone)

  return { scene, detachedRoots: clonedDetachedRoots }
}
