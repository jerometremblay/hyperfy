import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

import * as THREE from './three'
import { cloneAvatarScene } from './cloneAvatarScene'
import { DEG2RAD } from './general'
import { getTrianglesFromGeometry } from './getTrianglesFromGeometry'
import { getTextureBytesFromMaterial } from './getTextureBytesFromMaterial'
import { Emotes } from './playerEmotes'
import { applyNormalizedPose, createNormalizedPoseMapping, getNormalizedPose } from './normalizedPose'
import { XR_HAND_BONES } from './handTracking'
import { createHandTrackingMapping } from './handRetargeting'
import { clampBoneRotation } from './poseEditorMath'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const q1 = new THREE.Quaternion()
const m1 = new THREE.Matrix4()

const FORWARD = new THREE.Vector3(0, 0, -1)

const DIST_MIN_RATE = 1 / 5 // 5 times per second
const DIST_MAX_RATE = 1 / 60 // 40 times per second
const DIST_MIN = 5 // <= 5m = max rate
const DIST_MAX = 60 // >= 60m = min rate

const MAX_GAZE_DISTANCE = 40

const material = new THREE.MeshBasicMaterial()

const AimAxis = {
  X: new THREE.Vector3(1, 0, 0),
  Y: new THREE.Vector3(0, 1, 0),
  Z: new THREE.Vector3(0, 0, 1),
  NEG_X: new THREE.Vector3(-1, 0, 0),
  NEG_Y: new THREE.Vector3(0, -1, 0),
  NEG_Z: new THREE.Vector3(0, 0, -1),
}

const UpAxis = {
  X: new THREE.Vector3(1, 0, 0),
  Y: new THREE.Vector3(0, 1, 0),
  Z: new THREE.Vector3(0, 0, 1),
  NEG_X: new THREE.Vector3(-1, 0, 0),
  NEG_Y: new THREE.Vector3(0, -1, 0),
  NEG_Z: new THREE.Vector3(0, 0, -1),
}

// TODO: de-dup PlayerLocal.js has a copy
const Modes = {
  IDLE: 0,
  WALK: 1,
  RUN: 2,
  JUMP: 3,
  FALL: 4,
  FLY: 5,
  TALK: 6,
}

export function createVRMFactory(glb, setupMaterial) {
  const normalizedPoseMapping = createNormalizedPoseMapping(glb.userData.vrm.humanoid, glb.scene)

  const handTrackingMapping = createHandTrackingMapping(glb.scene, normalizedPoseMapping)

  // we'll update matrix ourselves
  glb.scene.matrixAutoUpdate = false
  glb.scene.matrixWorldAutoUpdate = false
  // remove expressions from scene
  const expressions = glb.scene.children.filter(n => n.type === 'VRMExpression') // prettier-ignore
  for (const node of expressions) node.removeFromParent()
  // remove VRMHumanoidRig
  const vrmHumanoidRigs = glb.scene.children.filter(n => n.name === 'VRMHumanoidRig') // prettier-ignore
  for (const node of vrmHumanoidRigs) node.removeFromParent()
  // remove secondary
  const secondaries = glb.scene.children.filter(n => n.name === 'secondary') // prettier-ignore
  for (const node of secondaries) node.removeFromParent()
  // enable shadows
  glb.scene.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true
      obj.receiveShadow = true
    }
  })
  // calculate root to hips
  const bones = glb.userData.vrm.humanoid._rawHumanBones.humanBones
  const hipsPosition = v1.setFromMatrixPosition(bones.hips.node.matrixWorld)
  const rootPosition = v2.set(0, 0, 0) //setFromMatrixPosition(bones.root.node.matrixWorld)
  const rootToHips = hipsPosition.y - rootPosition.y
  // get vrm version
  const version = glb.userData.vrm.meta?.metaVersion
  // convert skinned mesh to detached bind mode
  // this lets us remove root bone from scene and then only perform matrix updates on the whole skeleton
  // when we actually need to  for massive performance
  const skinnedMeshes = []
  glb.scene.traverse(node => {
    if (node.isSkinnedMesh) {
      node.bindMode = THREE.DetachedBindMode
      node.bindMatrix.copy(node.matrixWorld)
      node.bindMatrixInverse.copy(node.bindMatrix).invert()
      skinnedMeshes.push(node)
    }
    if (node.isMesh) {
      // bounds tree
      node.geometry.computeBoundsTree()
      // fix csm shadow banding
      node.material.shadowSide = THREE.BackSide
      // csm material setup
      setupMaterial(node.material)
    }
  })
  // remove root bone from scene
  // const rootBone = glb.scene.getObjectByName('RootBone')
  // console.log({ rootBone })
  // rootBone.parent.remove(rootBone)
  // rootBone.updateMatrixWorld(true)

  const skeleton = skinnedMeshes[0].skeleton // should be same across all skinnedMeshes

  // pose arms down
  const normBones = glb.userData.vrm.humanoid._normalizedHumanBones.humanBones
  const leftArm = normBones.leftUpperArm.node
  leftArm.rotation.z = 75 * DEG2RAD
  const rightArm = normBones.rightUpperArm.node
  rightArm.rotation.z = -75 * DEG2RAD
  glb.userData.vrm.humanoid.update(0)
  skeleton.update()

  // get height
  let height = 0.5 // minimum
  for (const mesh of skinnedMeshes) {
    if (!mesh.boundingBox) mesh.computeBoundingBox()
    if (height < mesh.boundingBox.max.y) {
      height = mesh.boundingBox.max.y
    }
  }

  // this.headToEyes = this.eyePosition.clone().sub(headPos)
  const headPos = normBones.head.node.getWorldPosition(new THREE.Vector3())
  const headToHeight = height - headPos.y

  const getBoneName = vrmBoneName => {
    return glb.userData.vrm.humanoid.getRawBoneNode(vrmBoneName)?.name
  }

  const noop = () => {
    // ...
  }

  return {
    create,
    cloneScene(scene = glb.scene) {
      return cloneAvatarScene(scene)
    },
    getNormalizedBoneNames() {
      return Object.keys(normalizedPoseMapping.bones)
    },
    getRawBoneName(name) {
      return normalizedPoseMapping.bones[name]?.rawName || null
    },
    getNormalizedPose(scene = glb.scene) {
      return getNormalizedPose(scene, normalizedPoseMapping)
    },
    applyNormalizedPose(scene, pose) {
      applyNormalizedPose(scene, normalizedPoseMapping, pose)
    },
    applyStats(stats) {
      glb.scene.traverse(obj => {
        if (obj.geometry && !stats.geometries.has(obj.geometry.uuid)) {
          stats.geometries.add(obj.geometry.uuid)
          stats.triangles += getTrianglesFromGeometry(obj.geometry)
        }
        if (obj.material && !stats.materials.has(obj.material.uuid)) {
          stats.materials.add(obj.material.uuid)
          stats.textureBytes += getTextureBytesFromMaterial(obj.material)
        }
      })
    },
  }

  function create(matrix, hooks, node) {
    const vrm = cloneGLB(glb)
    const tvrm = vrm.userData.vrm
    const skinnedMeshes = getSkinnedMeshes(vrm.scene)
    const skeleton = skinnedMeshes[0].skeleton // should be same across all skinnedMeshes
    const rootBone = skeleton.bones[0] // should always be 0
    rootBone.parent.remove(rootBone)
    rootBone.updateMatrixWorld(true)
    vrm.scene.matrix = matrix // synced!
    vrm.scene.matrixWorld = matrix // synced!
    hooks.scene.add(vrm.scene)

    const getEntity = () => node?.ctx.entity

    // spatial capsule
    const cRadius = 0.3
    const sItem = {
      matrix,
      geometry: createCapsule(cRadius, height - cRadius * 2),
      material,
      getEntity,
    }
    hooks.octree?.insert(sItem)

    // debug capsule
    // const foo = new THREE.Mesh(
    //   sItem.geometry,
    //   new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 })
    // )
    // vrm.scene.add(foo)

    // link back entity for raycasts

    vrm.scene.traverse(o => {
      o.getEntity = getEntity
    })

    // i have no idea how but the mixer only needs one of the skinned meshes
    // and if i set it to vrm.scene it no longer works with detached bind mode
    const mixer = new THREE.AnimationMixer(skinnedMeshes[0])

    const bonesByName = {}
    const findBone = name => {
      // name is the official vrm bone name eg 'leftHand'
      // actualName is the actual bone name used in the skeleton which may different across vrms
      if (!bonesByName[name]) {
        const actualName = glb.userData.vrm.humanoid.getRawBoneNode(name)?.name
        bonesByName[name] = skeleton.getBoneByName(actualName)
      }
      return bonesByName[name]
    }

    const mt = new THREE.Matrix4()
    const getBoneTransform = boneName => {
      const bone = findBone(boneName)
      if (!bone) return null
      // combine the scene's world matrix with the bone's world matrix
      return mt.multiplyMatrices(vrm.scene.matrixWorld, bone.matrixWorld)
    }

    const loco = {
      mode: Modes.IDLE,
      axis: new THREE.Vector3(),
      gazeDir: null,
    }
    const setLocomotion = (mode, axis, gazeDir) => {
      loco.mode = mode
      loco.axis = axis
      loco.gazeDir = gazeDir
    }

    // world.updater.add(update)
    const emotes = {
      // [url]: {
      //   url: String
      //   loading: Boolean
      //   action: AnimationAction
      // }
    }
    let currentEmote
    const setEmote = url => {
      if (currentEmote?.url === url) return
      if (currentEmote) {
        currentEmote.action?.fadeOut(0.15)
        currentEmote = null
      }
      if (!url) return
      const opts = getQueryParams(url)
      const loop = opts.l !== '0'
      const speed = parseFloat(opts.s || 1)
      const gaze = opts.g == '1'

      if (emotes[url]) {
        currentEmote = emotes[url]
        if (currentEmote.action) {
          currentEmote.action.clampWhenFinished = !loop
          currentEmote.action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
          currentEmote.action.reset().fadeIn(0.15).play()
          clearLocomotion()
        }
      } else {
        const emote = {
          url,
          loading: true,
          action: null,
          gaze,
        }
        emotes[url] = emote
        currentEmote = emote
        hooks.loader.load('emote', url).then(emo => {
          const clip = emo.toClip({
            rootToHips,
            version,
            getBoneName,
          })
          const action = mixer.clipAction(clip)
          action.timeScale = speed
          emote.action = action
          // if its still this emote, play it!
          if (currentEmote === emote) {
            action.clampWhenFinished = !loop
            action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
            action.play()
            clearLocomotion()
          }
        })
      }
    }

    // IDEA: we should use a global frame "budget" to distribute across avatars
    // https://chatgpt.com/c/4bbd469d-982e-4987-ad30-97e9c5ee6729

    let elapsed = 0
    let rate = 0
    let rateCheck = true
    let distance
    let poseOverride = null
    let handTrackingPose = null
    let handTrackingCurrent = null
    let handTrackingRest = null

    const updateRate = () => {
      const vrmPos = v1.setFromMatrixPosition(vrm.scene.matrix)
      const camPos = v2.setFromMatrixPosition(hooks.camera.matrixWorld) // prettier-ignore
      distance = vrmPos.distanceTo(camPos)
      const clampedDistance = Math.max(distance - DIST_MIN, 0)
      const normalizedDistance = Math.min(clampedDistance / (DIST_MAX - DIST_MIN), 1) // prettier-ignore
      rate = DIST_MAX_RATE + normalizedDistance * (DIST_MIN_RATE - DIST_MAX_RATE) // prettier-ignore
      // console.log('distance', distance)
      // console.log('rate per second', 1 / rate)
    }

    const update = delta => {
      elapsed += delta
      const should = rateCheck ? elapsed >= rate : true
      if (should) {
        mixer.update(elapsed)
        skeleton.bones.forEach(bone => bone.updateMatrixWorld())
        skeleton.update = THREE.Skeleton.prototype.update
        if (!currentEmote) {
          updateLocomotion(delta)
        }
        if (loco.gazeDir && distance < MAX_GAZE_DISTANCE && (currentEmote ? currentEmote.gaze : true)) {
          // aimBone('chest', loco.gazeDir, delta, {
          //   minAngle: -90,
          //   maxAngle: 90,
          //   smoothing: 0.7,
          //   weight: 0.7,
          // })
          aimBone('neck', loco.gazeDir, delta, {
            minAngle: -30,
            maxAngle: 30,
            smoothing: 0.4,
            weight: 0.6,
          })
          aimBone('head', loco.gazeDir, delta, {
            minAngle: -30,
            maxAngle: 30,
            smoothing: 0.4,
            weight: 0.6,
          })
        }
        // tvrm.humanoid.update(elapsed)
        elapsed = 0
      } else {
        skeleton.update = noop
      }
      if (poseOverride) {
        skeleton.update = THREE.Skeleton.prototype.update
        applyNormalizedPose(vrm.scene, normalizedPoseMapping, poseOverride)
      }
      applyHandTrackingPose(delta)
    }

    const aimBone = (() => {
      const smoothedRotations = new Map()
      const normalizedDir = new THREE.Vector3()
      const parentWorldMatrix = new THREE.Matrix4()
      const parentWorldRotationInverse = new THREE.Quaternion()
      const localDir = new THREE.Vector3()
      const currentAimDir = new THREE.Vector3()
      const rot = new THREE.Quaternion()
      const worldUp = new THREE.Vector3()
      const localUp = new THREE.Vector3()
      const rotatedUp = new THREE.Vector3()
      const projectedUp = new THREE.Vector3()
      const upCorrection = new THREE.Quaternion()
      const cross = new THREE.Vector3()
      const targetRotation = new THREE.Quaternion()
      const restToTarget = new THREE.Quaternion()

      return function aimBone(boneName, targetDir, delta, options = {}) {
        // default options
        const {
          aimAxis = AimAxis.NEG_Z,
          upAxis = UpAxis.Y,
          smoothing = 0.7, // smoothing factor (0-1)
          weight = 1.0,
          maintainOffset = false,
          minAngle = -180,
          maxAngle = 180,
        } = options
        const bone = findBone(boneName)
        const parentBone = glb.userData.vrm.humanoid.humanBones[boneName].node.parent
        if (!bone) return console.warn(`aimBone: missing bone (${boneName})`)
        if (!parentBone) return console.warn(`aimBone: no parent bone`)
        // get or create smoothed state for this bone
        const boneId = bone.uuid
        if (!smoothedRotations.has(boneId)) {
          smoothedRotations.set(boneId, {
            current: bone.quaternion.clone(),
            target: new THREE.Quaternion(),
          })
        }
        const smoothState = smoothedRotations.get(boneId)
        // normalize target direction
        normalizedDir.copy(targetDir).normalize()
        // get parent's world matrix
        parentWorldMatrix.multiplyMatrices(vrm.scene.matrixWorld, parentBone.matrixWorld)
        // extract parent's world rotation
        parentWorldMatrix.decompose(v1, parentWorldRotationInverse, v2)
        parentWorldRotationInverse.invert()
        // convert world direction to parent's local space
        localDir.copy(normalizedDir).applyQuaternion(parentWorldRotationInverse)
        // store initial offset if needed
        if (maintainOffset && !bone.userData.initialRotationOffset) {
          bone.userData.initialRotationOffset = bone.quaternion.clone()
        }
        // calc rotation needed to align aimAxis with localDir
        currentAimDir.copy(aimAxis)
        if (maintainOffset && bone.userData.initialRotationOffset) {
          currentAimDir.applyQuaternion(bone.userData.initialRotationOffset)
        }
        // create rotation
        rot.setFromUnitVectors(aimAxis, localDir)
        // get up direction in parent's local space
        worldUp.copy(upAxis)
        localUp.copy(worldUp).applyQuaternion(parentWorldRotationInverse)
        // apply up axis correction
        rotatedUp.copy(upAxis).applyQuaternion(rot)
        projectedUp.copy(localUp)
        projectedUp.sub(v1.copy(localDir).multiplyScalar(localDir.dot(localUp)))
        projectedUp.normalize()
        if (projectedUp.lengthSq() > 0.001) {
          upCorrection.setFromUnitVectors(rotatedUp, projectedUp)
          const angle = rotatedUp.angleTo(projectedUp)
          cross.crossVectors(rotatedUp, projectedUp)
          if (cross.dot(localDir) < 0) {
            upCorrection.setFromAxisAngle(localDir, -angle)
          } else {
            upCorrection.setFromAxisAngle(localDir, angle)
          }
          rot.premultiply(upCorrection)
        }
        // apply initial offset if maintaining it
        targetRotation.copy(rot)
        if (maintainOffset && bone.userData.initialRotationOffset) {
          targetRotation.multiply(bone.userData.initialRotationOffset)
        }
        // apply angle limits
        if (minAngle > -180 || maxAngle < 180) {
          if (!bone.userData.restRotation) {
            bone.userData.restRotation = bone.quaternion.clone()
          }
          restToTarget.copy(bone.userData.restRotation).invert().multiply(targetRotation)
          const w = restToTarget.w
          const angle = 2 * Math.acos(Math.min(Math.max(w, -1), 1))
          const angleDeg = THREE.MathUtils.radToDeg(angle)
          if (angleDeg > maxAngle || angleDeg < minAngle) {
            const clampedAngleDeg = THREE.MathUtils.clamp(angleDeg, minAngle, maxAngle)
            const clampedAngleRad = THREE.MathUtils.degToRad(clampedAngleDeg)
            const scale = clampedAngleRad / angle
            q1.copy(targetRotation)
            targetRotation.slerpQuaternions(bone.userData.restRotation, q1, scale)
          }
        }
        // apply weight
        if (weight < 1.0) {
          targetRotation.slerp(bone.quaternion, 1.0 - weight)
        }
        // update smooth state target
        smoothState.target.copy(targetRotation)
        // smoothly interpolate from current to target
        smoothState.current.slerp(smoothState.target, smoothing)
        // apply smoothed rotation to bone
        bone.quaternion.copy(smoothState.current)
        bone.updateMatrixWorld(true)
      }
    })()

    // position target equivalent of aimBone()
    const aimBoneDir = new THREE.Vector3()
    function aimBoneAt(boneName, targetPos, delta, options = {}) {
      const bone = findBone(boneName)
      if (!bone) return console.warn(`aimBone: missing bone (${boneName})`)
      const boneWorldMatrix = getBoneTransform(boneName)
      const boneWorldPos = v1.setFromMatrixPosition(boneWorldMatrix)
      aimBoneDir.subVectors(targetPos, boneWorldPos).normalize()
      aimBone(boneName, aimBoneDir, delta, options)
    }

    const handBoneMatrix = new THREE.Matrix4()
    const handParentMatrix = new THREE.Matrix4()
    const handRotationMatrix = new THREE.Matrix4()
    const handSceneQuaternion = new THREE.Quaternion()
    const handWorldQuaternion = new THREE.Quaternion()
    const handParentQuaternion = new THREE.Quaternion()
    const handLocalQuaternion = new THREE.Quaternion()
    const handDeltaQuaternion = new THREE.Quaternion()
    const handDirection = new THREE.Vector3()
    const handPole = new THREE.Vector3()
    const handPreviousPole = new THREE.Vector3()
    const handElbow = new THREE.Vector3()
    const handTarget = new THREE.Vector3()
    const handShoulder = new THREE.Vector3()
    const handElbowCurrent = new THREE.Vector3()
    const handWristCurrent = new THREE.Vector3()
    const handTargetPosition = new THREE.Vector3()
    const handTargetDirection = new THREE.Vector3()
    const handTargetRotation = new THREE.Quaternion()
    const handWristQuaternion = new THREE.Quaternion()
    const handRestParentQuaternion = new THREE.Quaternion()
    const handInverseRestParentQuaternion = new THREE.Quaternion()
    const handRestQuaternion = new THREE.Quaternion()
    const handInverseRestQuaternion = new THREE.Quaternion()
    const handNormalizedQuaternion = new THREE.Quaternion()

    function limitHandArmBone(side, name, bone) {
      const boneName = getHandBoneName(side, name)
      const mapping = normalizedPoseMapping.bones[boneName]
      handRestParentQuaternion.fromArray(mapping.parentWorldRotation)
      handRestQuaternion.fromArray(mapping.restRotation)
      handInverseRestParentQuaternion.copy(handRestParentQuaternion).invert()
      handInverseRestQuaternion.copy(handRestQuaternion).invert()
      // Use the same normalized rest frame as the posture editor, rather than raw VRM axes.
      handNormalizedQuaternion
        .copy(handRestParentQuaternion)
        .multiply(bone.quaternion)
        .multiply(handInverseRestQuaternion)
        .multiply(handInverseRestParentQuaternion)
      handNormalizedQuaternion.fromArray(clampBoneRotation(boneName, handNormalizedQuaternion.toArray()))
      bone.quaternion
        .copy(handInverseRestParentQuaternion)
        .multiply(handNormalizedQuaternion)
        .multiply(handRestParentQuaternion)
        .multiply(handRestQuaternion)
      bone.updateMatrixWorld(true)
    }

    function getHandBoneName(side, bone) {
      return `${side}${bone}`
    }

    function getHandBoneWorldPosition(bone, target) {
      bone.updateWorldMatrix(true, false)
      handBoneMatrix.multiplyMatrices(vrm.scene.matrixWorld, bone.matrixWorld)
      return target.setFromMatrixPosition(handBoneMatrix)
    }

    function getHandBoneWorldQuaternion(bone, target) {
      bone.updateWorldMatrix(true, false)
      handBoneMatrix.multiplyMatrices(vrm.scene.matrixWorld, bone.matrixWorld)
      return target.setFromRotationMatrix(handRotationMatrix.extractRotation(handBoneMatrix))
    }

    function setHandBoneWorldQuaternion(bone, target) {
      const parent = bone.parent
      if (parent) {
        parent.updateWorldMatrix(true, false)
        handParentMatrix.multiplyMatrices(vrm.scene.matrixWorld, parent.matrixWorld)
        handParentQuaternion.setFromRotationMatrix(handRotationMatrix.extractRotation(handParentMatrix))
      } else {
        vrm.scene.getWorldQuaternion(handParentQuaternion)
      }
      handLocalQuaternion.copy(handParentQuaternion).invert().multiply(target)
      bone.quaternion.copy(handLocalQuaternion)
      bone.updateMatrixWorld(true)
    }

    function aimHandBoneTowards(bone, target) {
      const child = bone.children.find(child => child.isBone || child.type === 'Bone')
      if (!child) return
      const bonePosition = getHandBoneWorldPosition(bone, handShoulder)
      const childPosition = getHandBoneWorldPosition(child, handElbowCurrent)
      const currentDirection = handDirection.subVectors(childPosition, bonePosition)
      const targetDirection = handTargetDirection.subVectors(target, bonePosition)
      if (currentDirection.lengthSq() < 0.000001 || targetDirection.lengthSq() < 0.000001) return
      handDeltaQuaternion.setFromUnitVectors(currentDirection.normalize(), targetDirection.normalize())
      getHandBoneWorldQuaternion(bone, handWorldQuaternion)
      handWorldQuaternion.premultiply(handDeltaQuaternion)
      setHandBoneWorldQuaternion(bone, handWorldQuaternion)
    }

    function applyHandArmPose(side, target, current) {
      const upperArm = findBone(getHandBoneName(side, 'UpperArm'))
      const lowerArm = findBone(getHandBoneName(side, 'LowerArm'))
      const hand = findBone(getHandBoneName(side, 'Hand'))
      if (!upperArm || !lowerArm || !hand) return

      getHandBoneWorldPosition(upperArm, handShoulder)
      getHandBoneWorldPosition(lowerArm, handElbowCurrent)
      getHandBoneWorldPosition(hand, handWristCurrent)
      const upperLength = handShoulder.distanceTo(handElbowCurrent)
      const lowerLength = handElbowCurrent.distanceTo(handWristCurrent)
      if (upperLength < 0.001 || lowerLength < 0.001) return

      handTarget.copy(target)
      handDirection.subVectors(handTarget, handShoulder)
      let distance = handDirection.length()
      if (distance < 0.001) {
        limitHandArmBone(side, 'UpperArm', upperArm)
        limitHandArmBone(side, 'LowerArm', lowerArm)
        return
      }
      const maxDistance = upperLength + lowerLength - 0.001
      const minDistance = Math.max(Math.abs(upperLength - lowerLength), 0.001)
      distance = THREE.MathUtils.clamp(distance, minDistance, maxDistance)
      handDirection.normalize()
      handTarget.copy(handShoulder).addScaledVector(handDirection, distance)

      vrm.scene.getWorldQuaternion(handSceneQuaternion)
      handPole.set(side === 'left' ? -0.5 : 0.5, -1, 0).applyQuaternion(handSceneQuaternion)
      handPole.addScaledVector(handDirection, -handPole.dot(handDirection))
      handPreviousPole.copy(current.elbowPole).applyQuaternion(handSceneQuaternion)
      handPreviousPole.addScaledVector(handDirection, -handPreviousPole.dot(handDirection))
      if (handPole.lengthSq() < 0.000001) {
        handPole.copy(handPreviousPole)
        if (handPole.lengthSq() < 0.000001) {
          handPole.set(0, 0, 1).applyQuaternion(handSceneQuaternion)
          handPole.addScaledVector(handDirection, -handPole.dot(handDirection))
        }
      }
      handPole.normalize()
      // Keep the previous bend side through the pole singularity instead of flipping the elbow.
      if (handPole.dot(handPreviousPole) < 0) handPole.negate()
      handInverseRestParentQuaternion.copy(handSceneQuaternion).invert()
      current.elbowPole.copy(handPole).applyQuaternion(handInverseRestParentQuaternion)

      const cosine = THREE.MathUtils.clamp(
        (upperLength * upperLength + distance * distance - lowerLength * lowerLength) / (2 * upperLength * distance),
        -1,
        1
      )
      const along = upperLength * cosine
      const height = upperLength * Math.sqrt(Math.max(1 - cosine * cosine, 0))
      handElbow.copy(handShoulder).addScaledVector(handDirection, along).addScaledVector(handPole, height)

      // Solve from rest each frame so successive direction changes cannot accumulate arm twist.
      upperArm.quaternion.fromArray(normalizedPoseMapping.bones[side + 'UpperArm'].restRotation)
      lowerArm.quaternion.fromArray(normalizedPoseMapping.bones[side + 'LowerArm'].restRotation)
      upperArm.updateMatrixWorld(true)
      aimHandBoneTowards(upperArm, handElbow)
      limitHandArmBone(side, 'UpperArm', upperArm)
      aimHandBoneTowards(lowerArm, handTarget)
      limitHandArmBone(side, 'LowerArm', lowerArm)
    }

    function captureHandTrackingRest(side) {
      const rest = {}
      const names = ['UpperArm', 'LowerArm', 'Hand', ...XR_HAND_BONES.map(item => item.bone)]
      for (const name of names) {
        const bone = findBone(getHandBoneName(side, name))
        if (bone) rest[name] = bone.quaternion.clone()
      }
      return rest
    }

    function restoreHandTrackingSide(side) {
      const rest = handTrackingRest?.[side]
      if (!rest) return
      for (const [name, rotation] of Object.entries(rest)) {
        const bone = findBone(getHandBoneName(side, name))
        if (bone) bone.quaternion.copy(rotation)
      }
    }

    function createHandTrackingCurrent(side, hand) {
      return {
        kind: hand.kind,
        position: new THREE.Vector3().fromArray(hand.p),
        wrist: new THREE.Quaternion().fromArray(hand.w).normalize(),
        fingers: {},
        elbowPole: new THREE.Vector3(side === 'left' ? -0.5 : 0.5, -1, 0).normalize(),
      }
    }

    function applyHandTrackingPose(delta) {
      if (!handTrackingPose) return
      const smoothing = 1 - Math.exp(-24 * delta)
      const scene = vrm.scene
      scene.updateMatrixWorld(true)
      skeleton.update = THREE.Skeleton.prototype.update

      for (const side of ['left', 'right']) {
        const target = handTrackingPose[side]
        const mapping = handTrackingMapping[side]
        if (!target?.p || !mapping || !['hand', 'controller'].includes(target.kind)) {
          restoreHandTrackingSide(side)
          if (handTrackingRest) delete handTrackingRest[side]
          if (handTrackingCurrent) delete handTrackingCurrent[side]
          continue
        }
        if (!handTrackingRest) handTrackingRest = {}
        if (!handTrackingRest[side]) handTrackingRest[side] = captureHandTrackingRest(side)
        if (!handTrackingCurrent) handTrackingCurrent = {}
        if (!handTrackingCurrent[side] || handTrackingCurrent[side].kind !== target.kind)
          handTrackingCurrent[side] = createHandTrackingCurrent(side, target)
        const current = handTrackingCurrent[side]
        current.position.lerp(handTargetPosition.fromArray(target.p), smoothing)
        current.wrist.slerp(handTargetRotation.fromArray(target.w).normalize(), smoothing)
        // Drop segments that are absent in this frame instead of freezing their old pose.
        for (const name of Object.keys(current.fingers)) {
          if (!target.f?.[name]) delete current.fingers[name]
        }
        for (const [name, rotation] of Object.entries(target.f || {})) {
          if (!current.fingers[name]) current.fingers[name] = new THREE.Quaternion().fromArray(rotation).normalize()
          else current.fingers[name].slerp(handTargetRotation.fromArray(rotation).normalize(), smoothing)
        }

        handTarget.copy(current.position)
        if (target.kind === 'controller') {
          handTarget.add(handTargetPosition.set(0, mapping.palmLength, 0).applyQuaternion(current.wrist))
        }
        handTarget.applyMatrix4(scene.matrixWorld)
        applyHandArmPose(side, handTarget, current)

        scene.getWorldQuaternion(handSceneQuaternion)
        const wrist = handWristQuaternion.copy(current.wrist)
        if (target.kind === 'controller') wrist.multiply(mapping.gripToWrist)
        const handBone = findBone(getHandBoneName(side, 'Hand'))
        if (handBone) {
          handTargetRotation.copy(handSceneQuaternion).multiply(wrist).multiply(mapping.wrist)
          setHandBoneWorldQuaternion(handBone, handTargetRotation)
        }
        // Absolute anatomical orientations are converted through the CURRENT raw parent.
        // This handles metacarpals missing from VRM and avoids applying wrist motion twice.
        for (const item of XR_HAND_BONES) {
          const bone = findBone(getHandBoneName(side, item.bone))
          const correction = mapping.bones[item.bone]
          if (!bone || !correction) continue
          const rotation = current.fingers[item.bone]
          if (target.kind === 'controller') {
            // Generic holding pose. Index is less closed than the fingers around the handle.
            const segment = item.bone.endsWith('Proximal') ? 1 : item.bone.endsWith('Intermediate') ? 2 : 2.5
            const curl = item.bone.startsWith('Index') ? 0.55 : 0.7
            if (item.bone.startsWith('Thumb')) {
              handTargetRotation.setFromAxisAngle(UpAxis.Y, side === 'left' ? -0.65 : 0.65)
              handLocalQuaternion.setFromAxisAngle(FORWARD, side === 'left' ? -Math.PI / 2 : Math.PI / 2)
              handTargetRotation.multiply(handLocalQuaternion)
            } else {
              handTargetRotation.setFromAxisAngle(AimAxis.X, -curl * segment)
            }
            handTargetRotation.premultiply(wrist).premultiply(handSceneQuaternion).multiply(correction)
            setHandBoneWorldQuaternion(bone, handTargetRotation)
          } else if (rotation) {
            handTargetRotation.copy(handSceneQuaternion).multiply(rotation).multiply(correction)
            setHandBoneWorldQuaternion(bone, handTargetRotation)
          } else {
            const info = normalizedPoseMapping.bones[getHandBoneName(side, item.bone)]
            if (info) bone.quaternion.fromArray(info.restRotation)
            bone.updateMatrixWorld(true)
          }
        }
      }
      skeleton.update()
    }

    // hooks.loader.load('emote', 'asset://rifle-aim.glb').then(emo => {
    //   const clip = emo.toClip({
    //     rootToHips,
    //     version,
    //     getBoneName,
    //   })
    //   // THREE.AnimationUtils.makeClipAdditive(clip, 0, clipI)
    //   // clip.blendMode = THREE.AdditiveAnimationBlendMode
    //   const action = mixer.clipAction(clip)
    //   action.setLoop(THREE.LoopRepeat)
    //   action.setEffectiveWeight(6)
    //   action.reset().fadeIn(0.1).play()
    //   console.log('hi2')
    // })

    const poses = {}
    function addPose(key, url) {
      const opts = getQueryParams(url)
      const speed = parseFloat(opts.s || 1)
      const pose = {
        loading: true,
        active: false,
        action: null,
        weight: 0,
        target: 0,
        setWeight: value => {
          pose.weight = value
          if (pose.action) {
            pose.action.weight = value
            if (!pose.active) {
              pose.action.reset().fadeIn(0.15).play()
              pose.active = true
            }
          }
        },
        fadeOut: () => {
          pose.weight = 0
          pose.action?.fadeOut(0.15)
          pose.active = false
        },
      }
      hooks.loader.load('emote', url).then(emo => {
        const clip = emo.toClip({
          rootToHips,
          version,
          getBoneName,
        })
        pose.action = mixer.clipAction(clip)
        pose.action.timeScale = speed
        pose.action.weight = pose.weight
        pose.action.play()
      })
      poses[key] = pose
    }
    addPose('idle', Emotes.IDLE)
    addPose('walk', Emotes.WALK)
    addPose('walkLeft', Emotes.WALK_LEFT)
    addPose('walkBack', Emotes.WALK_BACK)
    addPose('walkRight', Emotes.WALK_RIGHT)
    addPose('run', Emotes.RUN)
    addPose('runLeft', Emotes.RUN_LEFT)
    addPose('runBack', Emotes.RUN_BACK)
    addPose('runRight', Emotes.RUN_RIGHT)
    addPose('jump', Emotes.JUMP)
    addPose('fall', Emotes.FALL)
    addPose('fly', Emotes.FLY)
    addPose('talk', Emotes.TALK)
    function clearLocomotion() {
      for (const key in poses) {
        poses[key].fadeOut()
      }
    }
    function updateLocomotion(delta) {
      const { mode, axis } = loco
      for (const key in poses) {
        poses[key].target = 0
      }
      if (mode === Modes.IDLE) {
        poses.idle.target = 1
      } else if (mode === Modes.WALK || mode === Modes.RUN) {
        const angle = Math.atan2(axis.x, -axis.z)
        const angleDeg = ((angle * 180) / Math.PI + 360) % 360
        const prefix = mode === Modes.RUN ? 'run' : 'walk'
        const forwardKey = prefix // This should be "walk" or "run"
        const leftKey = `${prefix}Left`
        const backKey = `${prefix}Back`
        const rightKey = `${prefix}Right`
        if (axis.length() > 0.01) {
          if (angleDeg >= 337.5 || angleDeg < 22.5) {
            // Pure forward
            poses[forwardKey].target = 1
          } else if (angleDeg >= 22.5 && angleDeg < 67.5) {
            // Forward-right blend
            const blend = (angleDeg - 22.5) / 45
            poses[forwardKey].target = 1 - blend
            poses[rightKey].target = blend
          } else if (angleDeg >= 67.5 && angleDeg < 112.5) {
            // Pure right
            poses[rightKey].target = 1
          } else if (angleDeg >= 112.5 && angleDeg < 157.5) {
            // Right-back blend
            const blend = (angleDeg - 112.5) / 45
            poses[rightKey].target = 1 - blend
            poses[backKey].target = blend
          } else if (angleDeg >= 157.5 && angleDeg < 202.5) {
            // Pure back
            poses[backKey].target = 1
          } else if (angleDeg >= 202.5 && angleDeg < 247.5) {
            // Back-left blend
            const blend = (angleDeg - 202.5) / 45
            poses[backKey].target = 1 - blend
            poses[leftKey].target = blend
          } else if (angleDeg >= 247.5 && angleDeg < 292.5) {
            // Pure left
            poses[leftKey].target = 1
          } else if (angleDeg >= 292.5 && angleDeg < 337.5) {
            // Left-forward blend
            const blend = (angleDeg - 292.5) / 45
            poses[leftKey].target = 1 - blend
            poses[forwardKey].target = blend
          }
        }
      } else if (mode === Modes.JUMP) {
        poses.jump.target = 1
      } else if (mode === Modes.FALL) {
        poses.fall.target = 1
      } else if (mode === Modes.FLY) {
        poses.fly.target = 1
      } else if (mode === Modes.TALK) {
        poses.talk.target = 1
      }
      const lerpSpeed = 16
      for (const key in poses) {
        const pose = poses[key]
        const weight = THREE.MathUtils.lerp(pose.weight, pose.target, 1 - Math.exp(-lerpSpeed * delta))
        pose.setWeight(weight)
      }
    }

    // console.log('=== vrm ===')
    // console.log('vrm', vrm)
    // console.log('skeleton', skeleton)

    let firstPersonActive = false
    const setFirstPerson = active => {
      if (firstPersonActive === active) return
      const head = findBone('neck')
      head?.scale.setScalar(active ? 0 : 1)
      firstPersonActive = active
    }

    const setHandTrackingPose = pose => {
      if (!pose) {
        restoreHandTrackingSide('left')
        restoreHandTrackingSide('right')
        handTrackingPose = null
        handTrackingCurrent = null
        handTrackingRest = null
        return
      }
      handTrackingPose = pose
    }

    return {
      raw: vrm,
      height,
      headToHeight,
      setEmote,
      setFirstPerson,
      setHandTrackingPose,
      getNormalizedPose() {
        return getNormalizedPose(vrm.scene, normalizedPoseMapping)
      },
      setPoseOverride(pose) {
        poseOverride = pose ? JSON.parse(JSON.stringify(pose)) : null
        if (poseOverride) {
          skeleton.update = THREE.Skeleton.prototype.update
          applyNormalizedPose(vrm.scene, normalizedPoseMapping, poseOverride)
        }
      },
      update,
      updateRate,
      getBoneTransform,
      setLocomotion,
      setVisible(visible) {
        vrm.scene.traverse(o => {
          o.visible = visible
        })
      },
      move(_matrix) {
        matrix.copy(_matrix)
        hooks.octree?.move(sItem)
      },
      disableRateCheck() {
        rateCheck = false
      },
      destroy() {
        hooks.scene.remove(vrm.scene)
        // world.updater.remove(update)
        hooks.octree?.remove(sItem)
      },
    }
  }
}

function cloneGLB(glb) {
  // returns a shallow clone of the gltf but a deep clone of the scene.
  // uses SkeletonUtils.clone which is the same as Object3D.clone except also clones skinned meshes etc
  return { ...glb, scene: SkeletonUtils.clone(glb.scene) }
}

function getSkinnedMeshes(scene) {
  let meshes = []
  scene.traverse(o => {
    if (o.isSkinnedMesh) {
      meshes.push(o)
    }
  })
  return meshes
}

function createCapsule(radius, height) {
  const fullHeight = radius + height + radius
  const geometry = new THREE.CapsuleGeometry(radius, height)
  geometry.translate(0, fullHeight / 2, 0)
  return geometry
}

let queryParams = {}
function getQueryParams(url) {
  if (!queryParams[url]) {
    url = new URL(url)
    const params = {}
    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value
    }
    queryParams[url] = params
  }
  return queryParams[url]
}
