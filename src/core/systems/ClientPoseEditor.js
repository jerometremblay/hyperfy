import * as THREE from '../extras/three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { ControlPriorities } from '../extras/ControlPriorities'
import { getAvatarFocus } from '../extras/avatarFocus'
import {
  clampBoneRotation,
  getBoneRotationEuler,
  getMirroredBoneName,
  mirrorNormalizedRotation,
  solveTwoBoneIK,
} from '../extras/poseEditorMath'
import { System } from './System'

const CAPTURED_KEYS = [
  'escape',
  'keyW',
  'keyA',
  'keyS',
  'keyD',
  'arrowUp',
  'arrowDown',
  'arrowLeft',
  'arrowRight',
  'space',
  'keyC',
  'shiftLeft',
  'shiftRight',
  'keyZ',
  'keyE',
]

const ORBIT_SPEED = 0.005
const ZOOM_SPEED = 0.005
const MIN_DISTANCE = 0.7
const MAX_DISTANCE = 10
const MAX_PITCH = 1.2
const HISTORY_LIMIT = 50
const UP = new THREE.Vector3(0, 1, 0)

function createCoreUIFilteredTarget(viewport) {
  const listeners = new Map()
  return {
    style: viewport.style,
    get ownerDocument() {
      return viewport.ownerDocument
    },
    getBoundingClientRect: () => viewport.getBoundingClientRect(),
    setPointerCapture: pointerId => viewport.setPointerCapture(pointerId),
    releasePointerCapture: pointerId => viewport.releasePointerCapture(pointerId),
    addEventListener(type, listener, options) {
      let typeListeners = listeners.get(type)
      if (!typeListeners) {
        typeListeners = new Map()
        listeners.set(type, typeListeners)
      }
      if (typeListeners.has(listener)) return

      const filteredListener = event => {
        if (!event.isCoreUI) listener.call(viewport, event)
      }
      typeListeners.set(listener, filteredListener)
      viewport.addEventListener(type, filteredListener, options)
    },
    removeEventListener(type, listener, options) {
      const typeListeners = listeners.get(type)
      const filteredListener = typeListeners?.get(listener)
      if (!filteredListener) return
      viewport.removeEventListener(type, filteredListener, options)
      typeListeners.delete(listener)
      if (typeListeners.size === 0) listeners.delete(type)
    },
  }
}

const LIMBS = {
  leftHand: {
    root: 'leftUpperArm',
    middle: 'leftLowerArm',
    end: 'leftHand',
    pole: [0, 0, -1],
  },
  rightHand: {
    root: 'rightUpperArm',
    middle: 'rightLowerArm',
    end: 'rightHand',
    pole: [0, 0, -1],
  },
  leftFoot: {
    root: 'leftUpperLeg',
    middle: 'leftLowerLeg',
    end: 'leftFoot',
    pole: [0, 0, -1],
  },
  rightFoot: {
    root: 'rightUpperLeg',
    middle: 'rightLowerLeg',
    end: 'rightFoot',
    pole: [0, 0, -1],
  },
  back: {
    root: 'spine',
    middle: 'chest',
    end: 'upperChest',
    pole: [0, 0, 1],
  },
}

const GUIDE_COLORS = {
  seat: 0x51e2a3,
  backrest: 0x65b7ff,
  leftArmrest: 0xffcc52,
  rightArmrest: 0xff8f52,
}

function copyJSON(value) {
  return JSON.parse(JSON.stringify(value))
}

function removeSpringBoneColliders(scene) {
  const colliders = []
  scene.traverse(node => {
    if (node.colliderMatrix?.isMatrix4 && !node.shape) colliders.push(node)
  })
  for (const collider of colliders) collider.removeFromParent()
}

function setPreviewSkinnedMeshesAttached(scene) {
  scene.traverse(node => {
    if (node.isSkinnedMesh) node.bindMode = THREE.AttachedBindMode
  })
}

function vectorArray(value, maxAbs = 5) {
  const array = value?.isVector3 ? value.toArray() : value
  if (!Array.isArray(array) || array.length !== 3) return null
  if (!array.every(component => Number.isFinite(component) && Math.abs(component) <= maxAbs)) return null
  return array.map(Number)
}

function normalizeGuides(guides = {}) {
  const normalized = {}
  for (const name of ['seat', 'backrest', 'leftArmrest', 'rightArmrest']) {
    const value = vectorArray(guides[name])
    if (value) normalized[name] = value
  }
  if (Number.isFinite(guides.floorY) && Math.abs(guides.floorY) <= 5) {
    normalized.floorY = guides.floorY
  }
  return normalized
}

function sceneLocalPosition(scene, object) {
  if (!scene || !object) return null
  scene.updateWorldMatrix(true, true)
  const position = object.getWorldPosition(new THREE.Vector3())
  return scene.worldToLocal(position).toArray()
}

export class ClientPoseEditor extends System {
  constructor(world) {
    super(world)
    this.control = null
    this.session = null
    this.openError = null
    this.styles = []
    this.raycaster = new THREE.Raycaster()
    this.pointerNDC = new THREE.Vector2()
    this.dragPoint = new THREE.Vector3()
    this.gizmo = null
    this.gizmoHelper = null
    this.gizmoTarget = null
    this.gizmoActive = false
    this.floorGuidePosition = new THREE.Vector3()
    this.floorGuideRotation = new THREE.Quaternion()
    this.floorGuideScale = new THREE.Vector3()
    this.floorGuideMatrix = new THREE.Matrix4()
  }

  start() {
    this.control = this.world.controls.bind({ priority: ControlPriorities.POINTER })
  }

  getViewState() {
    if (this.session) return this.makeViewState()
    return this.openError ? { active: false, error: this.openError } : { active: false }
  }

  rejectOpen(message) {
    this.openError = message
    this.world.emit('poseEditor', { active: false, error: message })
    return false
  }

  clearOpenError() {
    if (!this.openError) return false
    this.openError = null
    this.world.emit('poseEditor', { active: false })
    return true
  }

  open(player, options = {}) {
    if (this.session) return this.session.player === player
    this.openError = null
    if (!this.control || !this.world.network?.isClient) {
      return this.rejectOpen('The pose editor is not ready yet. Try again shortly.')
    }
    if (!player?.isLocal || this.world.entities.player !== player) {
      return this.rejectOpen('Customize sitting is only available for your local avatar.')
    }
    if (player.isXR || this.world.xr?.session) {
      return this.rejectOpen('Exit VR before customizing a sitting pose.')
    }

    const anchor = player.getAnchorMatrix?.()
    const anchorId = player.data.effect?.anchorId
    const profileId = this.world.anchors?.getProfileId?.(anchorId) || null
    const avatarNode = player.avatar
    const sourceScene = avatarNode?.instance?.raw?.scene
    const factory = avatarNode?.factory
    if (!anchorId || !anchor) {
      return this.rejectOpen('The seat anchor is not available. Try sitting down again.')
    }
    if (!sourceScene) {
      return this.rejectOpen('Your seated avatar is still loading. Try again shortly.')
    }
    if (!factory?.cloneScene || !factory?.getNormalizedPose || !factory?.applyNormalizedPose) {
      return this.rejectOpen('Pose editing requires a VRM humanoid avatar.')
    }

    let preview
    let previewScene
    let skeletonHelper
    let session
    try {
      sourceScene.updateWorldMatrix(true, false)
      const inverseAnchor = new THREE.Matrix4().copy(anchor).invert()
      const avatarOffset = new THREE.Matrix4().multiplyMatrices(inverseAnchor, sourceScene.matrixWorld)
      const placementPosition = new THREE.Vector3()
      const placementRotation = new THREE.Quaternion()
      const placementScale = new THREE.Vector3()
      avatarOffset.decompose(placementPosition, placementRotation, placementScale)

      const cloned = factory.cloneScene(sourceScene)
      previewScene = cloned.scene
      if (!previewScene) throw new Error('The avatar preview scene is empty')
      previewScene.matrix.identity()
      previewScene.matrixAutoUpdate = false
      previewScene.matrixWorldAutoUpdate = true
      for (const root of cloned.detachedRoots || []) {
        if (!isWithin(root, previewScene)) previewScene.add(root)
      }
      removeSpringBoneColliders(previewScene)
      setPreviewSkinnedMeshesAttached(previewScene)

      preview = new THREE.Group()
      preview.name = 'avatar-pose-preview'
      preview.matrixAutoUpdate = false
      preview.add(previewScene)
      preview.matrix.multiplyMatrices(anchor, avatarOffset)
      preview.updateMatrixWorld(true)
      previewScene.updateWorldMatrix(true, true)

      const initialPose = copyJSON(factory.getNormalizedPose(sourceScene))
      factory.applyNormalizedPose(previewScene, initialPose)
      previewScene.updateWorldMatrix(true, true)
      skeletonHelper = new THREE.SkeletonHelper(previewScene)
      skeletonHelper.name = 'avatar-pose-skeleton'
      skeletonHelper.frustumCulled = false
      skeletonHelper.renderOrder = 1001
      skeletonHelper.material.depthTest = false
      skeletonHelper.material.depthWrite = false
      skeletonHelper.material.color.set(0x76c7ff)

      this.world.stage.scene.add(preview)
      this.world.stage.scene.add(skeletonHelper)
      preview.updateMatrixWorld(true)
      skeletonHelper.updateMatrixWorld(true)

      const bounds = new THREE.Box3()
      const focus = getAvatarFocus(preview, avatarNode.getHeight?.(), new THREE.Vector3(), bounds)
      const size = bounds.getSize(new THREE.Vector3())
      const focusAvatarLocal = focus.clone().applyMatrix4(preview.matrixWorld.clone().invert())
      const worldRotation = new THREE.Quaternion()
      preview.matrixWorld.decompose(new THREE.Vector3(), worldRotation, new THREE.Vector3())
      const front = new THREE.Vector3(0, 0, 1).applyQuaternion(worldRotation)
      const distance = THREE.MathUtils.clamp(Math.max(size.y * 1.45, size.length() * 0.8), 1.5, MAX_DISTANCE)
      const actualCameraPosition = this.control.camera?.position?.clone?.()
      const actualCameraQuaternion = this.control.camera?.quaternion?.clone?.()
      const actualCameraOffset = actualCameraPosition?.clone().sub(focus)
      const actualCameraDistance = actualCameraOffset?.length() || 0
      const hasActualCamera =
        !!actualCameraPosition &&
        !!actualCameraQuaternion &&
        Number.isFinite(actualCameraDistance) &&
        actualCameraDistance > 1e-5
      const initialCameraDistance = hasActualCamera
        ? THREE.MathUtils.clamp(actualCameraDistance, MIN_DISTANCE, MAX_DISTANCE)
        : distance
      const initialCameraYaw = hasActualCamera
        ? Math.atan2(actualCameraOffset.x, actualCameraOffset.z)
        : Math.atan2(front.x, front.z)
      const initialCameraPitch = hasActualCamera
        ? THREE.MathUtils.clamp(
            Math.atan2(actualCameraOffset.y, Math.hypot(actualCameraOffset.x, actualCameraOffset.z)),
            -MAX_PITCH,
            MAX_PITCH
          )
        : 0.12
      const factoryBoneNames = factory.getNormalizedBoneNames?.() || Object.keys(initialPose)
      if (!factoryBoneNames.length) throw new Error('Avatar does not expose a normalized humanoid skeleton')
      const avatarUrl =
        player.getAvatarUrl?.() || player.data.sessionAvatar || player.data.avatar || 'asset://avatar.vrm'

      session = {
        player,
        avatarNode,
        avatarUrl,
        sourceScene,
        factory,
        playerFactory: factory,
        anchorId,
        profileId,
        preview,
        previewScene,
        skeletonHelper,
        previewAvatarUrl: avatarUrl,
        previewLoading: false,
        previewLoadId: 0,
        selectedMarker: this.createMarker(0xff625e, 0.035),
        guideMarkers: new Map(),
        floorGuide: null,
        boneNames: factoryBoneNames,
        selectedBone: factoryBoneNames.includes('hips') ? 'hips' : factoryBoneNames[0],
        mode: 'placement',
        postureTool: 'rotate',
        jointMarkers: new Map(),
        avatarOffset,
        placementPosition,
        placementRotation,
        placementScale,
        focusAvatarLocal,
        orbit: {
          target: focus.clone(),
          homeYaw: Math.atan2(front.x, front.z),
          yaw: initialCameraYaw,
          pitch: initialCameraPitch,
          distance: initialCameraDistance,
          cameraOffset: 0,
          cameraView: hasActualCamera ? 'orbit' : 'front',
          preserveCamera: hasActualCamera,
          initialCamera:
            hasActualCamera && actualCameraPosition && actualCameraQuaternion
              ? {
                  position: actualCameraPosition,
                  quaternion: actualCameraQuaternion,
                  zoom: this.control.camera.zoom,
                }
              : null,
        },
        pose: initialPose,
        initialPose: copyJSON(initialPose),
        initialPlacement: {
          position: placementPosition.toArray(),
          rotation: placementRotation.toArray(),
        },
        guides: normalizeGuides(options.guides),
        styles: this.styles,
        mirror: false,
        jointLimits: true,
        ikLimb: 'leftHand',
        ikTargets: {},
        ikChainOverrides: {},
        applying: false,
        error: null,
        styleError: null,
        skeletonVisible: true,
        skeletonOpacity: 0.8,
        markerSize: 0.5,
        history: [],
        historyIndex: -1,
        historyGroup: false,
        historyGroupStart: null,
        restoringHistory: false,
        previous: this.captureState(player),
      }

      this.session = session
      session.history.push(this.captureEditState(session))
      session.historyIndex = 0
      skeletonHelper.material.transparent = true
      skeletonHelper.material.opacity = session.skeletonOpacity
      this.world.stage.scene.add(session.selectedMarker)
      this.createJointGizmo()
      this.updateJointMarkers()
      this.updateGuideMarkers()

      player.poseEditorActive = true
      avatarNode.visible = false
      if (player.aura) player.aura.active = false

      this.setInputActive(true)
      this.updateOrbitCamera()
      if (session.previous.pointerLocked) this.control.pointer.unlock()

      this.world.emit('poseEditor', this.makeViewState())
      this.requestStyles()
      return true
    } catch (error) {
      console.error('[pose editor] failed to create avatar preview', error)
      if (session && this.session === session) {
        this.close()
      } else {
        if (preview) this.world.stage.scene.remove(preview)
        if (skeletonHelper) {
          this.world.stage.scene.remove(skeletonHelper)
          skeletonHelper.geometry.dispose()
          skeletonHelper.material.dispose()
        }
      }
      return this.rejectOpen(`Could not create the avatar preview: ${error?.message || 'unknown error'}`)
    }
  }

  update() {
    const session = this.session
    if (!session) return

    const player = session.player
    const anchor = player.getAnchorMatrix?.()
    if (
      this.world.entities.items.get(player.data.id) !== player ||
      player.data.effect?.anchorId !== session.anchorId ||
      !anchor ||
      (this.world.anchors?.getProfileId?.(session.anchorId) || null) !== session.profileId ||
      player.avatar !== session.avatarNode ||
      player.avatar?.instance?.raw?.scene !== session.sourceScene ||
      player.isXR ||
      this.world.xr?.session
    ) {
      this.close()
      return
    }

    if (!session.applying && !this.gizmoActive && this.control.mouseRight.down) {
      session.orbit.preserveCamera = false
      const delta = this.control.pointer.delta
      session.orbit.yaw -= delta.x * ORBIT_SPEED
      session.orbit.pitch = THREE.MathUtils.clamp(session.orbit.pitch + delta.y * ORBIT_SPEED, -MAX_PITCH, MAX_PITCH)
      if (session.orbit.cameraView !== 'orbit') {
        session.orbit.cameraView = 'orbit'
        this.emitState()
      }
    }

    if (!session.applying && !this.gizmoActive && this.control.mouseLeft.pressed) {
      if (session.mode === 'placement') this.beginPlacementDrag()
      if (session.mode === 'posture' && session.postureTool === 'rotate') this.selectJointAtPointer()
    }
    if (!session.applying && !this.gizmoActive && session.drag && this.control.mouseLeft.down) {
      this.updatePlacementDrag()
    }
    if (this.control.mouseLeft.released) {
      if (session.drag) this.endHistoryGroup()
      session.drag = null
    }

    if (!session.applying && this.control.scrollDelta.value) {
      session.orbit.preserveCamera = false
      session.orbit.distance = THREE.MathUtils.clamp(
        session.orbit.distance + this.control.scrollDelta.value * ZOOM_SPEED,
        MIN_DISTANCE,
        MAX_DISTANCE
      )
    }
    this.updateOrbitCamera()
  }

  getPointerRay() {
    const pointer = this.control.pointer.coords
    const camera = this.world.camera
    if (!pointer || !camera) return null
    this.pointerNDC.set(pointer.x * 2 - 1, 1 - pointer.y * 2)
    camera.updateMatrixWorld(true)
    this.raycaster.setFromCamera(this.pointerNDC, camera)
    return this.raycaster.ray
  }

  beginPlacementDrag() {
    const session = this.session
    const anchor = session?.player.getAnchorMatrix?.()
    const ray = this.getPointerRay()
    if (!session || session.applying || session.mode !== 'placement' || !anchor || !ray) return false

    session.previewScene.updateWorldMatrix(true, true)
    const hit = this.raycaster.intersectObject(session.previewScene, true)[0]
    if (!hit) return false

    this.beginHistoryGroup()
    if (this.control.shiftLeft.down || this.control.shiftRight.down) {
      session.drag = {
        kind: 'vertical',
        startY: session.placementPosition.y,
        startPointerY: this.control.pointer.coords.y,
      }
      return true
    }

    const inverseAnchor = new THREE.Matrix4().copy(anchor).invert()
    const seatUp = new THREE.Vector3(0, 1, 0).transformDirection(anchor)
    session.drag = {
      kind: 'ground',
      plane: new THREE.Plane().setFromNormalAndCoplanarPoint(seatUp, hit.point),
      inverseAnchor,
      startSeatPoint: hit.point.clone().applyMatrix4(inverseAnchor),
      startPosition: session.placementPosition.clone(),
    }
    return true
  }

  updatePlacementDrag() {
    const session = this.session
    if (!session?.drag) return

    if (session.drag.kind === 'vertical') {
      session.placementPosition.y = THREE.MathUtils.clamp(
        session.drag.startY + (session.drag.startPointerY - this.control.pointer.coords.y) * 2,
        -2,
        2
      )
      this.updatePreviewAndState()
      return
    }

    const ray = this.getPointerRay()
    if (!ray) return
    const point = ray.intersectPlane(session.drag.plane, this.dragPoint)
    if (!point) return
    const seatPoint = point.clone().applyMatrix4(session.drag.inverseAnchor)
    session.placementPosition.copy(session.drag.startPosition).add(seatPoint.sub(session.drag.startSeatPoint))
    this.updatePreviewAndState()
  }

  selectJointAtPointer() {
    const session = this.session
    const ray = this.getPointerRay()
    if (!session || session.applying || !ray) return false
    const markers = [...session.jointMarkers.values(), session.selectedMarker].filter(marker => marker.visible)
    const hit = this.raycaster.intersectObjects(markers, false)[0]
    const boneName = hit?.object?.userData?.poseBoneName
    if (!boneName) return false
    this.setSelectedBone(boneName)
    return true
  }

  lateUpdate() {
    const session = this.session
    if (!session) return
    const anchor = session.player.getAnchorMatrix?.()
    if (!anchor) return this.close()

    const offset = new THREE.Matrix4().compose(
      session.placementPosition,
      session.placementRotation,
      session.placementScale
    )
    session.avatarOffset.copy(offset)
    session.preview.matrix.multiplyMatrices(anchor, offset)
    session.preview.updateMatrixWorld(true)
    session.previewScene.updateWorldMatrix(true, true)
    session.orbit.target.copy(session.focusAvatarLocal).applyMatrix4(session.preview.matrixWorld)
    this.updateSkeleton()
    this.updateOrbitCamera()
  }

  setMode(mode) {
    if (!this.session || !['placement', 'posture', 'ik'].includes(mode)) return
    this.endHistoryGroup()
    this.session.mode = mode
    this.session.drag = null
    this.updateJointMarkers()
    this.emitState()
  }

  async setPreviewAvatar(url) {
    const session = this.session
    if (!session || session.applying || typeof url !== 'string') return false
    const previewUrl = url.trim()
    if (!previewUrl) {
      session.error = 'Enter a VRM URL to preview'
      this.emitState()
      return false
    }

    const requestId = ++session.previewLoadId
    session.error = null
    if (previewUrl === session.avatarUrl) {
      try {
        this.installPreviewAvatar(session, previewUrl, session.playerFactory, session.sourceScene)
        session.previewLoading = false
        this.emitState()
        return true
      } catch (error) {
        session.previewLoading = false
        session.error = error?.message || 'Could not restore your avatar preview'
        this.emitState()
        return false
      }
    }

    session.previewLoading = true
    this.emitState()
    try {
      const asset = await this.world.loader.load('avatar', previewUrl)
      if (this.session !== session || session.previewLoadId !== requestId) return false
      if (!asset?.factory?.cloneScene || !asset.factory.getNormalizedBoneNames) {
        throw new Error('The URL did not load a compatible humanoid VRM')
      }
      this.installPreviewAvatar(session, previewUrl, asset.factory)
      session.previewLoading = false
      this.emitState()
      return true
    } catch (error) {
      if (this.session !== session || session.previewLoadId !== requestId) return false
      session.previewLoading = false
      session.error = error?.message || 'Could not load the preview avatar'
      this.emitState()
      return false
    }
  }

  installPreviewAvatar(session, url, factory, sourceScene = null) {
    if (!factory?.cloneScene || !factory.getNormalizedPose || !factory.getNormalizedBoneNames) {
      throw new Error('The avatar does not provide a normalized humanoid skeleton')
    }

    const cloned = factory.cloneScene(sourceScene || undefined)
    const previewScene = cloned?.scene
    const boneNames = factory.getNormalizedBoneNames()
    if (!previewScene || !boneNames?.length) {
      throw new Error('The avatar does not provide a normalized humanoid skeleton')
    }

    previewScene.matrix.identity()
    previewScene.matrixAutoUpdate = false
    previewScene.matrixWorldAutoUpdate = true
    for (const root of cloned.detachedRoots || []) {
      if (!isWithin(root, previewScene)) previewScene.add(root)
    }
    removeSpringBoneColliders(previewScene)
    setPreviewSkinnedMeshesAttached(previewScene)
    factory.applyNormalizedPose(previewScene, session.pose)
    previewScene.updateWorldMatrix(true, true)

    this.world.stage.scene.remove(session.skeletonHelper)
    session.skeletonHelper.geometry.dispose()
    session.skeletonHelper.material.dispose()
    session.preview.remove(session.previewScene)
    for (const marker of session.jointMarkers.values()) {
      this.world.stage.scene.remove(marker)
      marker.geometry.dispose()
      marker.material.dispose()
    }
    session.jointMarkers.clear()

    session.factory = factory
    session.previewAvatarUrl = url
    session.previewScene = previewScene
    session.preview.add(previewScene)
    session.boneNames = boneNames.slice()
    if (!session.boneNames.includes(session.selectedBone)) {
      session.selectedBone = session.boneNames.includes('hips') ? 'hips' : session.boneNames[0]
    }

    const skeletonHelper = new THREE.SkeletonHelper(previewScene)
    skeletonHelper.name = 'avatar-pose-skeleton'
    skeletonHelper.frustumCulled = false
    skeletonHelper.renderOrder = 1001
    skeletonHelper.material.depthTest = false
    skeletonHelper.material.depthWrite = false
    skeletonHelper.material.transparent = true
    skeletonHelper.material.opacity = session.skeletonOpacity
    skeletonHelper.material.color.set(0x76c7ff)
    skeletonHelper.visible = session.skeletonVisible
    session.skeletonHelper = skeletonHelper
    this.world.stage.scene.add(skeletonHelper)

    session.preview.updateMatrixWorld(true)
    const bounds = new THREE.Box3()
    const focus = getAvatarFocus(
      session.preview,
      session.avatarNode.getHeight?.(),
      new THREE.Vector3(),
      bounds
    )
    const size = bounds.getSize(new THREE.Vector3())
    session.focusAvatarLocal.copy(focus).applyMatrix4(session.preview.matrixWorld.clone().invert())
    session.orbit.target.copy(focus)
    session.orbit.distance = THREE.MathUtils.clamp(Math.max(size.y * 1.45, size.length() * 0.8), 1.5, MAX_DISTANCE)
    this.updateSkeleton()
    this.updateOrbitCamera()
  }

  setPostureTool(tool) {
    const session = this.session
    if (!session || session.applying || !['rotate', 'moveHips'].includes(tool)) return
    this.endHistoryGroup()
    session.postureTool = tool
    if (tool === 'moveHips') session.selectedBone = 'hips'
    this.updateJointMarkers()
    this.emitState()
  }

  setPlacementAxis(axis, value) {
    const session = this.session
    if (!session || session.applying || !['x', 'y', 'z'].includes(axis) || !Number.isFinite(value)) return
    session.placementPosition[axis] = THREE.MathUtils.clamp(value, -2, 2)
    this.updatePreviewAndState()
  }

  setPlacementYaw(value) {
    const session = this.session
    if (!session || session.applying || !Number.isFinite(value)) return
    const euler = new THREE.Euler().setFromQuaternion(session.placementRotation, 'YXZ')
    euler.y = THREE.MathUtils.clamp(value, -180, 180) * THREE.MathUtils.DEG2RAD
    session.placementRotation.setFromEuler(euler)
    this.updatePreviewAndState()
  }

  setSelectedBone(name) {
    const session = this.session
    if (!session || session.applying || session.postureTool !== 'rotate' || !session.boneNames.includes(name)) return
    session.selectedBone = name
    this.updateJointMarkers()
    this.emitState()
  }

  setSelectedRotation(axis, degrees) {
    const session = this.session
    if (!session || session.applying || !['x', 'y', 'z'].includes(axis) || !Number.isFinite(degrees)) return
    this.setBoneRotation(session.selectedBone, axis, degrees)
  }

  setBoneRotation(name, axis, degrees) {
    const session = this.session
    if (!session || session.applying || !session.boneNames.includes(name) || !['x', 'y', 'z'].includes(axis)) return
    if (!Number.isFinite(degrees)) return

    const current = session.pose[name]?.rotation || [0, 0, 0, 1]
    const eulerValues = getBoneRotationEuler(current)
    eulerValues[axis] = THREE.MathUtils.clamp(degrees, -180, 180)
    const rotation = new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          eulerValues.x * THREE.MathUtils.DEG2RAD,
          eulerValues.y * THREE.MathUtils.DEG2RAD,
          eulerValues.z * THREE.MathUtils.DEG2RAD,
          'XYZ'
        )
      )
      .toArray()
    this.setNormalizedRotation(name, rotation)
    this.applyPoseToPreview()
  }

  setNormalizedRotation(name, rotation) {
    const session = this.session
    if (!session) return
    const limited = clampBoneRotation(name, rotation, session.jointLimits)
    session.pose[name] = { ...session.pose[name], rotation: limited }
    if (session.mirror) {
      const mirroredName = getMirroredBoneName(name)
      if (mirroredName && session.boneNames.includes(mirroredName)) {
        session.pose[mirroredName] = {
          ...session.pose[mirroredName],
          rotation: clampBoneRotation(mirroredName, mirrorNormalizedRotation(limited), session.jointLimits),
        }
      }
    }
  }

  setHipsTranslation(axis, value) {
    const session = this.session
    if (!session || session.applying || !['x', 'y', 'z'].includes(axis) || !Number.isFinite(value)) return
    if (!session.pose.hips) session.pose.hips = { rotation: [0, 0, 0, 1], position: [0, 0, 0] }
    if (!session.pose.hips.position) session.pose.hips.position = [0, 0, 0]
    session.pose.hips.position['xyz'.indexOf(axis)] = THREE.MathUtils.clamp(value, -1, 1)
    this.applyPoseToPreview()
  }

  setMirror(value) {
    if (!this.session || this.session.applying) return
    this.session.mirror = !!value
    this.emitState()
  }

  setJointLimits(value) {
    if (!this.session || this.session.applying) return
    this.session.jointLimits = !!value
    this.emitState()
  }

  resetSelectedJoint() {
    const session = this.session
    const name = session?.selectedBone
    if (!session || session.applying || !name) return false

    session.pose[name] = { ...session.pose[name], rotation: [0, 0, 0, 1] }
    if (session.mirror) {
      const mirroredName = getMirroredBoneName(name)
      if (mirroredName && session.boneNames.includes(mirroredName)) {
        session.pose[mirroredName] = { ...session.pose[mirroredName], rotation: [0, 0, 0, 1] }
      }
    }
    if (name === 'hips') {
      session.pose.hips = { ...session.pose.hips, position: [0, 0, 0] }
    }
    this.applyPoseToPreview()
    return true
  }

  mirrorSelectedJoint() {
    const session = this.session
    const name = session?.selectedBone
    const targetName = name && getMirroredBoneName(name)
    const rotation = name && session?.pose[name]?.rotation
    if (!session || session.applying || !targetName || !session.boneNames.includes(targetName) || !rotation)
      return false

    session.pose[targetName] = {
      ...session.pose[targetName],
      rotation: clampBoneRotation(targetName, mirrorNormalizedRotation(rotation), session.jointLimits),
    }
    this.applyPoseToPreview()
    return true
  }

  setSkeletonVisible(visible) {
    const session = this.session
    if (!session || session.applying) return
    session.skeletonVisible = !!visible
    session.skeletonHelper.visible = session.skeletonVisible
    this.emitState()
  }

  setSkeletonOpacity(value) {
    const session = this.session
    if (!session || session.applying || !Number.isFinite(value)) return
    session.skeletonOpacity = THREE.MathUtils.clamp(value, 0, 1)
    session.skeletonHelper.material.opacity = session.skeletonOpacity
    this.emitState()
  }

  setMarkerSize(value) {
    const session = this.session
    if (!session || session.applying || !Number.isFinite(value)) return
    session.markerSize = THREE.MathUtils.clamp(value, 0.5, 2)
    const markers = [session.selectedMarker, ...session.jointMarkers.values(), ...session.guideMarkers.values()]
    for (const marker of markers) marker.scale.setScalar(session.markerSize)
    this.emitState()
  }

  setCameraView(view) {
    const session = this.session
    if (!session || session.applying) return
    const yawOffsets = { front: 0, back: Math.PI, left: Math.PI / 2, right: -Math.PI / 2, orbit: Math.PI / 4 }
    if (!Object.hasOwn(yawOffsets, view)) return
    session.orbit.preserveCamera = false
    session.orbit.cameraView = view
    session.orbit.yaw = session.orbit.homeYaw + yawOffsets[view]
    session.orbit.pitch = view === 'orbit' ? 0.22 : 0.12
    this.updateOrbitCamera()
    this.emitState()
  }

  setPosePreset(preset) {
    const session = this.session
    if (!session || session.applying || !['tPose', 'relaxedStanding', 'sitting'].includes(preset)) return false

    if (preset === 'sitting') {
      session.pose = copyJSON(session.initialPose)
    } else {
      const pose = {}
      for (const name of session.boneNames) {
        pose[name] = { ...session.pose[name], rotation: [0, 0, 0, 1] }
      }
      if (pose.hips) pose.hips.position = [0, 0, 0]

      if (preset === 'relaxedStanding') {
        for (const [name, degrees] of [
          ['leftUpperArm', 75],
          ['rightUpperArm', -75],
        ]) {
          if (!session.boneNames.includes(name)) continue
          pose[name].rotation = new THREE.Quaternion()
            .setFromAxisAngle(new THREE.Vector3(0, 0, 1), degrees * THREE.MathUtils.DEG2RAD)
            .toArray()
        }
      }
      session.pose = pose
    }
    this.applyPoseToPreview()
    return true
  }

  setTPose() {
    return this.setPosePreset('tPose')
  }

  captureEditState(session = this.session) {
    if (!session) return null
    return {
      pose: copyJSON(session.pose),
      position: session.placementPosition.toArray(),
      rotation: session.placementRotation.toArray(),
    }
  }

  storeHistory(snapshot) {
    const session = this.session
    if (!session) return
    const history = session.history.slice(0, session.historyIndex + 1)
    if (JSON.stringify(history.at(-1)) === JSON.stringify(snapshot)) return
    history.push(copyJSON(snapshot))
    if (history.length > HISTORY_LIMIT) history.shift()
    session.history = history
    session.historyIndex = history.length - 1
  }

  commitHistory() {
    const session = this.session
    if (!session || session.restoringHistory || session.historyGroup) return
    this.storeHistory(this.captureEditState(session))
  }

  beginHistoryGroup() {
    const session = this.session
    if (!session || session.historyGroup) return
    session.historyGroup = true
    session.historyGroupStart = this.captureEditState(session)
  }

  endHistoryGroup() {
    const session = this.session
    if (!session?.historyGroup) return
    const start = session.historyGroupStart
    const end = this.captureEditState(session)
    session.historyGroup = false
    session.historyGroupStart = null
    if (JSON.stringify(start) !== JSON.stringify(end)) {
      this.storeHistory(end)
      this.emitState()
    }
  }

  undo() {
    const session = this.session
    if (!session || session.applying || session.historyIndex <= 0) return false
    this.endHistoryGroup()
    if (session.historyIndex <= 0) return false
    this.restoreHistory(session.historyIndex - 1)
    return true
  }

  redo() {
    const session = this.session
    if (!session || session.applying || session.historyIndex >= session.history.length - 1) return false
    this.endHistoryGroup()
    if (session.historyIndex >= session.history.length - 1) return false
    this.restoreHistory(session.historyIndex + 1)
    return true
  }

  restoreHistory(index) {
    const session = this.session
    const snapshot = session?.history[index]
    if (!session || !snapshot) return
    session.restoringHistory = true
    session.historyIndex = index
    session.pose = copyJSON(snapshot.pose)
    session.placementPosition.fromArray(snapshot.position)
    session.placementRotation.fromArray(snapshot.rotation)
    session.ikTargets = {}
    this.updatePreviewAndState()
    this.applyPoseToPreview()
    session.restoringHistory = false
    this.emitState()
  }

  setIKLimb(name) {
    const session = this.session
    if (!session || session.applying || !LIMBS[name]) return
    session.ikLimb = name
    const chain = session?.ikChainOverrides?.[name] || LIMBS[name]
    const end = this.getBone(chain.end)
    if (end && !session.ikTargets[name]) {
      session.ikTargets[name] = sceneLocalPosition(session.previewScene, end)
    }
    this.emitState()
  }

  setIKTargetAxis(axis, value) {
    const session = this.session
    if (!session || session.applying || !['x', 'y', 'z'].includes(axis) || !Number.isFinite(value)) return
    const target = this.getIKTarget()
    if (!target) return
    target['xyz'.indexOf(axis)] = THREE.MathUtils.clamp(value, -2, 2)
    session.ikTargets[session.ikLimb] = target
    this.solveIK(session.ikLimb)
  }

  getIKTarget() {
    const session = this.session
    if (!session) return null
    const current = session.ikTargets[session.ikLimb]
    if (current) return current.slice()
    const chain = session.ikChainOverrides[session.ikLimb] || LIMBS[session.ikLimb]
    const end = this.getBone(chain?.end)
    return end ? sceneLocalPosition(session.previewScene, end) : null
  }

  solveIK(name, emit = true) {
    const session = this.session
    const chain = session?.ikChainOverrides[name] || LIMBS[name]
    const target = session?.ikTargets[name]
    if (!session || !chain || !target) return false

    session.factory.applyNormalizedPose(session.previewScene, session.pose)
    const root = this.getBone(chain.root)
    const middle = this.getBone(chain.middle)
    const end = this.getBone(chain.end)
    const solved = solveTwoBoneIK(session.previewScene, root, middle, end, target, chain.pole)
    if (!solved) return false

    session.pose = copyJSON(session.factory.getNormalizedPose(session.previewScene))
    this.limitChain(session, chain)
    session.factory.applyNormalizedPose(session.previewScene, session.pose)
    this.updateSkeleton()
    this.commitHistory()
    if (emit) this.emitState()
    return true
  }

  limitChain(session, chain) {
    for (const name of [chain.root, chain.middle]) {
      if (session.pose[name]?.rotation) {
        session.pose[name].rotation = clampBoneRotation(name, session.pose[name].rotation, session.jointLimits)
      }
    }
  }

  setFloorY(value) {
    const session = this.session
    if (!session || session.applying || !Number.isFinite(value)) return
    session.guides.floorY = THREE.MathUtils.clamp(value, -5, 5)
    this.updateGuideMarkers()
    this.emitState()
  }

  alignGuide(name) {
    const session = this.session
    if (!session || session.applying) return false
    if (name === 'seat' && session.guides.seat) {
      const hips = this.getBone('hips')
      if (!hips || !session.pose.hips) return false
      const target = this.seatPointToAvatarLocal(session.guides.seat)
      const current = sceneLocalPosition(session.previewScene, hips)
      if (!target || !current) return false
      const offset = session.pose.hips.position || [0, 0, 0]
      session.pose.hips.position = offset.map((value, axis) => value + target[axis] - current[axis])
      this.applyPoseToPreview()
      return true
    }
    if (name === 'backrest' && session.guides.backrest) {
      const chain = this.getBackrestChain()
      if (!chain) return false
      session.ikLimb = 'back'
      session.ikTargets.back = this.seatPointToAvatarLocal(session.guides.backrest)
      return this.solveIK('back')
    }
    if (name === 'leftArmrest' || name === 'rightArmrest') {
      const target = session.guides[name]
      if (!target) return false
      const limb = name === 'leftArmrest' ? 'leftHand' : 'rightHand'
      session.ikLimb = limb
      session.ikTargets[limb] = this.seatPointToAvatarLocal(target)
      this.emitState()
      return this.solveIK(limb)
    }
    if (name === 'floor') return this.alignFeetToFloor()
    return false
  }

  alignFeetToFloor() {
    const session = this.session
    if (!session || !Number.isFinite(session.guides.floorY)) return false
    const placement = new THREE.Matrix4().compose(
      session.placementPosition,
      session.placementRotation,
      session.placementScale
    )
    const inversePlacement = placement.clone().invert()
    let changed = false
    this.beginHistoryGroup()
    for (const name of ['leftFoot', 'rightFoot']) {
      const chain = LIMBS[name]
      const foot = this.getBone(chain.end)
      const local = foot && sceneLocalPosition(session.previewScene, foot)
      if (!local) continue
      const seatPoint = new THREE.Vector3(...local).applyMatrix4(placement)
      seatPoint.y = session.guides.floorY
      session.ikLimb = name
      session.ikTargets[name] = seatPoint.applyMatrix4(inversePlacement).toArray()
      changed = this.solveIK(name, false) || changed
    }
    this.endHistoryGroup()
    this.emitState()
    return changed
  }

  getBackrestChain() {
    const session = this.session
    const chains = [
      { root: 'spine', middle: 'chest', end: 'upperChest', pole: [0, 0, 1] },
      { root: 'spine', middle: 'upperChest', end: 'neck', pole: [0, 0, 1] },
    ]
    const chain =
      chains.find(item => this.getBone(item.root) && this.getBone(item.middle) && this.getBone(item.end)) || null
    if (chain) session.ikChainOverrides.back = chain
    return chain
  }

  getBone(name) {
    const session = this.session
    const rawName = session?.factory.getRawBoneName?.(name)
    return rawName ? session.previewScene.getObjectByName(rawName) : null
  }

  seatPointToAvatarLocal(point) {
    const session = this.session
    const anchor = session?.player.getAnchorMatrix?.()
    if (!session || !anchor) return null
    const worldPoint = new THREE.Vector3(...point).applyMatrix4(anchor)
    session.previewScene.updateWorldMatrix(true, true)
    return session.previewScene.worldToLocal(worldPoint).toArray()
  }

  updatePreviewAndState() {
    const session = this.session
    if (!session) return
    const anchor = session.player.getAnchorMatrix?.()
    if (!anchor) return this.close()
    const offset = new THREE.Matrix4().compose(
      session.placementPosition,
      session.placementRotation,
      session.placementScale
    )
    session.avatarOffset.copy(offset)
    session.preview.matrix.multiplyMatrices(anchor, offset)
    session.preview.updateMatrixWorld(true)
    session.previewScene.updateWorldMatrix(true, true)
    session.orbit.target.copy(session.focusAvatarLocal).applyMatrix4(session.preview.matrixWorld)
    this.updateSkeleton()
    this.updateOrbitCamera()
    this.commitHistory()
    this.emitState()
  }

  applyPoseToPreview() {
    const session = this.session
    if (!session) return
    session.factory.applyNormalizedPose(session.previewScene, session.pose)
    session.previewScene.updateWorldMatrix(true, true)
    this.updateSkeleton()
    this.commitHistory()
    this.emitState()
  }

  updateSkeleton() {
    const session = this.session
    if (!session) return
    session.previewScene.updateWorldMatrix(true, true)
    session.skeletonHelper.updateMatrixWorld(true)
    session.skeletonHelper.geometry.computeBoundingSphere()
    this.updateJointMarkers()
    this.updateGuideMarkers()
  }

  createMarker(color, radius) {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 12, 8),
      new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, toneMapped: false })
    )
    marker.renderOrder = 1002
    marker.frustumCulled = false
    return marker
  }

  updateSelectedMarker() {
    const session = this.session
    if (!session) return
    const bone = this.getBone(session.selectedBone)
    session.selectedMarker.visible = !!bone && session.mode === 'posture' && session.postureTool === 'rotate'
    session.selectedMarker.userData.poseBoneName = session.selectedBone
    if (bone) {
      session.selectedMarker.position.copy(bone.getWorldPosition(new THREE.Vector3()))
      session.selectedMarker.updateMatrixWorld(true)
    }
  }

  updateJointMarkers() {
    const session = this.session
    if (!session) return
    for (const name of session.boneNames) {
      const bone = this.getBone(name)
      let marker = session.jointMarkers.get(name)
      if (!bone) {
        if (marker) marker.visible = false
        continue
      }
      if (!marker) {
        marker = this.createMarker(0x65b7ff, 0.04)
        marker.scale.setScalar(session.markerSize)
        marker.userData.poseBoneName = name
        this.world.stage.scene.add(marker)
        session.jointMarkers.set(name, marker)
      }
      marker.visible = session.mode === 'posture' && session.postureTool === 'rotate' && name !== session.selectedBone
      marker.position.copy(bone.getWorldPosition(new THREE.Vector3()))
      marker.updateMatrixWorld(true)
    }
    this.updateSelectedMarker()
    this.syncJointGizmo()
  }

  createJointGizmo() {
    const session = this.session
    const viewport = this.world.graphics?.viewport
    if (!session || !viewport) return

    const gizmo = new TransformControls(this.world.camera, createCoreUIFilteredTarget(viewport))
    gizmo.mode = 'rotate'
    gizmo.space = 'local'
    gizmo.setSize(0.7)
    gizmo.addEventListener('mouseDown', () => {
      if (this.selectJointAtPointer()) {
        gizmo.pointerUp(null)
        return
      }
      this.gizmoActive = true
      this.beginHistoryGroup()
    })
    gizmo.addEventListener('mouseUp', () => {
      this.gizmoActive = false
      this.endHistoryGroup()
    })
    gizmo.addEventListener('objectChange', this.onJointGizmoObjectChange)

    const target = new THREE.Object3D()
    target.name = 'avatar-pose-joint-gizmo-target'
    const helper = gizmo.getHelper()
    helper.visible = false

    this.gizmo = gizmo
    this.gizmoTarget = target
    this.gizmoHelper = helper
    this.world.stage.scene.add(target)
    this.world.stage.scene.add(helper)
    this.syncJointGizmo()
  }

  onJointGizmoObjectChange = () => {
    const session = this.session
    if (!session || session.applying || !this.gizmoTarget) return

    const inverseSceneRotation = session.previewScene.getWorldQuaternion(new THREE.Quaternion()).invert()
    const normalizedRotation = inverseSceneRotation
      .multiply(this.gizmoTarget.getWorldQuaternion(new THREE.Quaternion()))
      .normalize()
    this.setNormalizedRotation(session.selectedBone, normalizedRotation.toArray())
    this.applyPoseToPreview()
  }

  syncJointGizmo() {
    const session = this.session
    if (!session || !this.gizmo || !this.gizmoTarget || !this.gizmoHelper) return

    const bone =
      session.mode === 'posture' && session.postureTool === 'rotate' && !session.applying
        ? this.getBone(session.selectedBone)
        : null
    if (!bone) {
      this.gizmo.enabled = false
      this.gizmoHelper.visible = false
      this.gizmoActive = false
      if (this.gizmo.object) this.gizmo.detach()
      return
    }

    session.previewScene.updateWorldMatrix(true, true)
    bone.updateWorldMatrix(true, false)
    this.gizmoTarget.position.copy(bone.getWorldPosition(new THREE.Vector3()))
    const sceneRotation = session.previewScene.getWorldQuaternion(new THREE.Quaternion())
    const normalizedRotation = new THREE.Quaternion().fromArray(
      session.pose[session.selectedBone]?.rotation || [0, 0, 0, 1]
    )
    this.gizmoTarget.quaternion.copy(sceneRotation.multiply(normalizedRotation))
    this.gizmoTarget.scale.setScalar(1)
    this.gizmoTarget.updateMatrixWorld(true)
    this.gizmo.enabled = true
    this.gizmoHelper.visible = true
    if (this.gizmo.object !== this.gizmoTarget) this.gizmo.attach(this.gizmoTarget)
  }

  destroyJointGizmo() {
    if (!this.gizmo) return
    this.gizmoActive = false
    this.gizmo.detach()
    this.gizmo.disconnect()
    this.gizmo.dispose()
    this.world.stage.scene.remove(this.gizmoHelper)
    this.world.stage.scene.remove(this.gizmoTarget)
    this.gizmo = null
    this.gizmoHelper = null
    this.gizmoTarget = null
  }

  updateGuideMarkers() {
    const session = this.session
    if (!session) return
    const anchor = session.player.getAnchorMatrix?.()
    if (!anchor) return
    for (const name of ['seat', 'backrest', 'leftArmrest', 'rightArmrest']) {
      const point = session.guides[name]
      if (!point) {
        const marker = session.guideMarkers.get(name)
        if (marker) {
          this.world.stage.scene.remove(marker)
          marker.geometry.dispose()
          marker.material.dispose()
          session.guideMarkers.delete(name)
        }
        continue
      }
      let marker = session.guideMarkers.get(name)
      if (!marker) {
        marker = this.createMarker(GUIDE_COLORS[name], 0.05)
        marker.scale.setScalar(session.markerSize)
        this.world.stage.scene.add(marker)
        session.guideMarkers.set(name, marker)
      }
      marker.position.fromArray(point).applyMatrix4(anchor)
    }

    if (!Number.isFinite(session.guides.floorY)) {
      if (session.floorGuide) {
        this.world.stage.scene.remove(session.floorGuide)
        session.floorGuide.geometry.dispose()
        session.floorGuide.material.dispose()
        session.floorGuide = null
      }
      return
    }

    if (!session.floorGuide) {
      const guide = new THREE.GridHelper(4, 20, 0x65b7ff, 0x54738a)
      guide.name = 'avatar-pose-floor-guide'
      guide.material.transparent = true
      guide.material.opacity = 0.38
      guide.material.depthTest = false
      guide.renderOrder = 1000
      guide.frustumCulled = false
      session.floorGuide = guide
      this.world.stage.scene.add(guide)
    }

    this.floorGuideMatrix.copy(anchor).decompose(this.floorGuidePosition, this.floorGuideRotation, this.floorGuideScale)
    session.floorGuide.position.set(0, session.guides.floorY, 0).applyMatrix4(anchor)
    session.floorGuide.quaternion.copy(this.floorGuideRotation)
    session.floorGuide.scale.set(this.floorGuideScale.x, 1, this.floorGuideScale.z)
    session.floorGuide.updateMatrixWorld(true)
  }

  updateOrbitCamera() {
    const session = this.session
    if (!session || !this.control) return
    if (session.orbit.preserveCamera && session.orbit.initialCamera) {
      const { position, quaternion, zoom } = session.orbit.initialCamera
      this.control.camera.position.copy(position)
      this.control.camera.quaternion.copy(quaternion)
      if (Number.isFinite(zoom)) this.control.camera.zoom = zoom
      this.control.camera.write = true
      return
    }
    const { yaw, pitch, distance, target, cameraOffset } = session.orbit
    const cosPitch = Math.cos(pitch)
    const cameraPosition = target
      .clone()
      .add(
        new THREE.Vector3(Math.sin(yaw) * cosPitch, Math.sin(pitch), Math.cos(yaw) * cosPitch).multiplyScalar(distance)
      )
    const look = new THREE.Matrix4().lookAt(cameraPosition, target, UP)
    const rotation = new THREE.Quaternion().setFromRotationMatrix(look)
    const cameraLocalOffset = new THREE.Vector3(0, 0, cameraOffset).applyQuaternion(rotation)
    this.control.camera.position.copy(cameraPosition).sub(cameraLocalOffset)
    this.control.camera.quaternion.copy(rotation)
    this.control.camera.zoom = cameraOffset
    this.control.camera.write = true
  }

  makeViewState() {
    const session = this.session
    if (!session) return { active: false }
    const currentRotation = session.pose[session.selectedBone]?.rotation || [0, 0, 0, 1]
    const currentHipsPosition = session.pose.hips?.position || [0, 0, 0]
    const yaw = new THREE.Euler().setFromQuaternion(session.placementRotation, 'YXZ').y * THREE.MathUtils.RAD2DEG
    return {
      active: true,
      mode: session.mode,
      postureTool: session.postureTool,
      anchorId: session.anchorId,
      profileId: session.profileId,
      avatarUrl: session.avatarUrl,
      previewAvatarUrl: session.previewAvatarUrl,
      previewingAnotherAvatar: session.previewAvatarUrl !== session.avatarUrl,
      previewLoading: session.previewLoading,
      boneNames: session.boneNames.slice(),
      selectedBone: session.selectedBone,
      mirrorTargetAvailable:
        !!getMirroredBoneName(session.selectedBone) &&
        session.boneNames.includes(getMirroredBoneName(session.selectedBone)),
      selectedRotation: getBoneRotationEuler(currentRotation),
      hipsPosition: currentHipsPosition.slice(),
      placement: {
        position: session.placementPosition.toArray(),
        yaw,
      },
      pose: copyJSON(session.pose),
      mirror: session.mirror,
      jointLimits: session.jointLimits,
      ikLimb: session.ikLimb,
      ikTarget: this.getIKTarget(),
      guides: copyJSON(session.guides),
      styles: copyJSON(session.styles || []),
      skeletonVisible: session.skeletonVisible,
      skeletonOpacity: session.skeletonOpacity,
      markerSize: session.markerSize,
      cameraView: session.orbit.cameraView,
      canUndo: session.historyIndex > 0,
      canRedo: session.historyIndex < session.history.length - 1,
      applying: session.applying,
      error: session.error,
      styleError: session.styleError,
    }
  }

  emitState() {
    if (this.session) this.world.emit('poseEditor', this.makeViewState())
  }

  apply(saveToProfile = false) {
    const session = this.session
    if (!session || session.applying) return false
    if (saveToProfile && !session.profileId) {
      session.error = 'This seat does not have a reusable furniture profile'
      this.emitState()
      return false
    }
    if (session.previewLoading || session.previewAvatarUrl !== session.avatarUrl) {
      session.error = 'Return to your avatar before applying; you can save this pose as a reusable style'
      this.emitState()
      return false
    }
    if (!session.player.getAnchorMatrix?.() || session.player.data.effect?.anchorId !== session.anchorId) {
      this.close()
      return false
    }
    session.applying = true
    session.error = null
    this.setInputActive(true)
    this.emitState()
    try {
      this.world.network.send('playerSeatPose', {
        anchorId: session.anchorId,
        profileId: session.profileId,
        saveToProfile: !!saveToProfile,
        avatarUrl: session.avatarUrl,
        offset: session.placementPosition.toArray(),
        rotation: session.placementRotation.toArray(),
        pose: session.pose,
      })
    } catch (error) {
      session.applying = false
      session.error = error?.message || 'Could not send the sitting pose'
      this.emitState()
      return false
    }
    return true
  }

  onApplyResult(result) {
    const session = this.session
    if (!session?.applying) return
    if (result?.ok) {
      this.close()
    } else {
      session.applying = false
      session.error = result?.message || 'The server rejected this sitting pose'
      this.emitState()
    }
  }

  requestStyles() {
    if (!this.session) return
    this.world.network.send('playerSeatPoseStyles', { action: 'list' })
  }

  setStyles(styles, error = null) {
    if (!Array.isArray(styles)) return
    this.styles = styles.map(style => ({ name: style.name, pose: copyJSON(style.pose) }))
    if (this.session) this.session.styleError = error
    if (this.session) {
      this.session.styles = this.styles
      this.emitState()
    }
  }

  saveStyle(name) {
    const session = this.session
    if (!session || session.applying || !name?.trim()) return false
    session.styleError = null
    this.world.network.send('playerSeatPoseStyles', { action: 'save', name: name.trim(), pose: session.pose })
    this.emitState()
    return true
  }

  deleteStyle(name) {
    if (!this.session || this.session.applying) return false
    this.session.styleError = null
    this.world.network.send('playerSeatPoseStyles', { action: 'delete', name })
    this.emitState()
    return true
  }

  applyStyle(name) {
    const session = this.session
    const style = session?.styles.find(item => item.name === name)
    if (!style || session.applying) return false
    session.pose = copyJSON(session.initialPose)
    for (const [bone, transform] of Object.entries(style.pose)) {
      session.pose[bone] = { ...session.pose[bone], ...copyJSON(transform) }
    }
    for (const bone of session.boneNames) {
      if (session.pose[bone]?.rotation) {
        session.pose[bone].rotation = clampBoneRotation(bone, session.pose[bone].rotation, session.jointLimits)
      }
    }
    this.applyPoseToPreview()
    return true
  }

  reset() {
    const session = this.session
    if (!session || session.applying) return
    this.beginHistoryGroup()
    session.pose = copyJSON(session.initialPose)
    session.placementPosition.fromArray(session.initialPlacement.position)
    session.placementRotation.fromArray(session.initialPlacement.rotation)
    session.ikTargets = {}
    this.updatePreviewAndState()
    this.applyPoseToPreview()
    this.endHistoryGroup()
  }

  close() {
    const session = this.session
    if (!session) {
      this.clearOpenError()
      return false
    }
    this.session = null
    this.openError = null
    this.destroyJointGizmo()

    this.world.stage.scene.remove(session.preview)
    this.world.stage.scene.remove(session.skeletonHelper)
    this.world.stage.scene.remove(session.selectedMarker)
    session.jointMarkers.forEach(marker => {
      this.world.stage.scene.remove(marker)
      marker.geometry.dispose()
      marker.material.dispose()
    })
    session.guideMarkers.forEach(marker => {
      this.world.stage.scene.remove(marker)
      marker.geometry.dispose()
      marker.material.dispose()
    })
    if (session.floorGuide) {
      this.world.stage.scene.remove(session.floorGuide)
      session.floorGuide.geometry.dispose()
      session.floorGuide.material.dispose()
    }
    session.skeletonHelper.geometry.dispose()
    session.skeletonHelper.material.dispose()
    session.selectedMarker.geometry.dispose()
    session.selectedMarker.material.dispose()

    const { player, previous } = session
    player.poseEditorActive = previous.poseEditorActive
    if (player.avatar === session.avatarNode) session.avatarNode.visible = previous.avatarVisible
    if (player.aura && previous.auraActive !== null) player.aura.active = previous.auraActive

    if (player.cam && previous.playerCam) {
      player.cam.position.copy(previous.playerCam.position)
      player.cam.quaternion.copy(previous.playerCam.quaternion)
      player.cam.zoom = previous.playerCam.zoom
    }
    if (player.control?.camera && previous.playerControlCamera) {
      player.control.camera.position.copy(previous.playerControlCamera.position)
      player.control.camera.quaternion.copy(previous.playerControlCamera.quaternion)
      player.control.camera.zoom = previous.playerControlCamera.zoom
      player.control.camera.write = previous.playerControlCamera.write
    }

    this.world.rig.position.copy(previous.rigPosition)
    this.world.rig.quaternion.copy(previous.rigQuaternion)
    this.world.camera.position.z = previous.cameraZoom

    this.setInputActive(false, previous.editorInput)
    this.control.camera.position.copy(previous.editorCamera.position)
    this.control.camera.quaternion.copy(previous.editorCamera.quaternion)
    this.control.camera.zoom = previous.editorCamera.zoom
    this.control.camera.write = previous.editorCamera.write

    this.world.emit('poseEditor', { active: false })
    if (previous.pointerLocked && this.world.entities.player === player) {
      player.control?.pointer?.lock()
    }
    return true
  }

  captureState(player) {
    const editorInput = {
      captures: Object.fromEntries(CAPTURED_KEYS.map(key => [key, !!this.control[key].capture])),
      mouseLeft: !!this.control.mouseLeft.capture,
      mouseRight: !!this.control.mouseRight.capture,
      scroll: !!this.control.scrollDelta.capture,
      cameraWrite: !!this.control.camera.write,
      escapeOnPress: this.control.escape.onPress,
    }
    return {
      avatarVisible: player.avatar.visible,
      auraActive: player.aura ? player.aura.active : null,
      poseEditorActive: !!player.poseEditorActive,
      pointerLocked: this.world.controls.pointer.locked,
      playerCam: player.cam
        ? {
            position: player.cam.position.clone(),
            quaternion: player.cam.quaternion.clone(),
            zoom: player.cam.zoom,
          }
        : null,
      playerControlCamera: player.control.camera
        ? {
            position: player.control.camera.position.clone(),
            quaternion: player.control.camera.quaternion.clone(),
            zoom: player.control.camera.zoom,
            write: player.control.camera.write,
          }
        : null,
      rigPosition: this.world.rig.position.clone(),
      rigQuaternion: this.world.rig.quaternion.clone(),
      cameraZoom: this.world.camera.position.z,
      editorCamera: {
        position: this.control.camera.position.clone(),
        quaternion: this.control.camera.quaternion.clone(),
        zoom: this.control.camera.zoom,
        write: this.control.camera.write,
      },
      editorInput,
    }
  }

  setInputActive(active, previous = null) {
    for (const key of CAPTURED_KEYS) {
      this.control[key].capture = active ? true : previous?.captures?.[key] || false
    }
    this.control.mouseLeft.capture = active ? true : previous?.mouseLeft || false
    this.control.mouseRight.capture = active ? true : previous?.mouseRight || false
    this.control.scrollDelta.capture = active ? true : previous?.scroll || false
    this.control.camera.write = active ? true : previous?.cameraWrite || false
    this.control.hideReticle(active)
    this.control.escape.onPress = active
      ? () => {
          this.close()
          return true
        }
      : previous?.escapeOnPress || null
  }

  destroy() {
    this.close()
    this.control?.release()
    this.control = null
  }
}

function isWithin(object, ancestor) {
  for (let current = object; current; current = current.parent) {
    if (current === ancestor) return true
  }
  return false
}
