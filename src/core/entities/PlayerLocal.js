import { createPlayerProxy } from '../extras/createPlayerProxy'
import { Entity } from './Entity'
import { clamp } from '../utils'
import * as THREE from '../extras/three'
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js'
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js'
import { Layers } from '../extras/Layers'
import { DEG2RAD, RAD2DEG } from '../extras/general'
import { createNode } from '../extras/createNode'
import { bindRotations } from '../extras/bindRotations'
import { simpleCamLerp } from '../extras/simpleCamLerp'
import { ISOMETRIC_PITCH, ISOMETRIC_YAW, ISOMETRIC_DISTANCE, RETRO_PITCH } from '../extras/isometricView'
import { stylePlayerBubble } from '../extras/playerBubble'
import { Emotes } from '../extras/playerEmotes'
import { ControlPriorities } from '../extras/ControlPriorities'
import { isBoolean, isNumber } from 'lodash-es'
import { hasRank, Ranks } from '../extras/ranks'
import { getDefaultSittingPose, getMatchingSeatPose } from '../extras/seatPose'
import { getAvatarCameraFocus, getAvatarEyePosition } from '../extras/avatarFocus'
import { XR_HAND_BONES } from '../extras/handTracking'
import { isEmoteUrl, sanitizeName, sanitizePlayerSelfModify } from '../extras/entityModifyPolicy'
import { isRightArmEmote } from '../extras/rightArmEmote'
import { readAnchorPose } from '../extras/anchorPose'
import {
  readVec3,
  writeVec3,
  warnOnce,
  vec3ToPx,
  vec3ToPxPos,
  quatToPxRot,
  pxToVec3,
  pxToQuat,
  scratchPxVec3,
  scratchPxExtVec3,
} from '../extras/physxConvert.js'

const teleportPosition = new THREE.Vector3()
const anchorPosition = new THREE.Vector3()
const anchorQuaternion = new THREE.Quaternion()

const UP = new THREE.Vector3(0, 1, 0)
const DOWN = new THREE.Vector3(0, -1, 0)
const FORWARD = new THREE.Vector3(0, 0, -1)
const SCALE_IDENTITY = new THREE.Vector3(1, 1, 1)
const POINTER_LOOK_SPEED = 0.1
const PAN_LOOK_SPEED = 0.4
const XR_TURN_SPEED = 90 // degrees per second at full stick
const ZOOM_SPEED = 2
const MAX_ZOOM = 8
const STICK_OUTER_RADIUS = 50
const STICK_INNER_RADIUS = 25
const DEFAULT_CAM_HEIGHT = 1.2
const THIRD_PERSON_MIN_ZOOM = 0.3
const FIRST_PERSON_SCROLL_DELAY = 0.3
const CAMERA_DEFAULT_NEAR = 0.2
const CAMERA_CLOSE_NEAR = 0.05
const CAMERA_NEAR_BLEND_RANGE = 0.5

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const v4 = new THREE.Vector3()
const v5 = new THREE.Vector3()
const v6 = new THREE.Vector3()
const e1 = new THREE.Euler(0, 0, 0, 'YXZ')
const q1 = new THREE.Quaternion()
const q2 = new THREE.Quaternion()
const q3 = new THREE.Quaternion()
const q4 = new THREE.Quaternion()
const q5 = new THREE.Quaternion()
const q6 = new THREE.Quaternion()
const q7 = new THREE.Quaternion()
const m1 = new THREE.Matrix4()
const m2 = new THREE.Matrix4()
const m3 = new THREE.Matrix4()

const gazeTiltAngle = 10 * DEG2RAD
const gazeTiltAxis = new THREE.Vector3(1, 0, 0) // X-axis for pitch

export function getPlatformActor(hit) {
  const entity = hit?.handle?.node?.ctx?.entity
  if (entity?.data?.mover) return null
  return hit?.handle?.actor || null
}

export function getXRTurnAngle(stickX, delta) {
  if (!stickX) return 0
  return -stickX * XR_TURN_SPEED * delta
}

// TODO: de-dup createVRMFactory.js has a copy
const Modes = {
  IDLE: 0,
  WALK: 1,
  RUN: 2,
  JUMP: 3,
  FALL: 4,
  FLY: 5,
  TALK: 6,
}

export class PlayerLocal extends Entity {
  constructor(world, data, local) {
    super(world, data, local)
    this.isPlayer = true
    this.isLocal = true
    this.init()
  }

  async init() {
    this.mass = 1
    this.gravity = 20
    this.effectiveGravity = this.gravity * this.mass
    this.jumpHeight = 1.5

    this.capsuleRadius = 0.3
    this.capsuleHeight = 1.6

    this.grounded = false
    this.groundAngle = 0
    this.groundNormal = new THREE.Vector3().copy(UP)
    this.groundSweepRadius = this.capsuleRadius - 0.01 // slighty smaller than player
    this.groundSweepGeometry = new PHYSX.PxSphereGeometry(this.groundSweepRadius)

    this.pushForce = null
    this.pushForceInit = false

    this.slipping = false

    this.jumped = false
    this.jumping = false
    this.justLeftGround = false

    this.fallTimer = 0
    this.falling = false

    this.moveDir = new THREE.Vector3()
    this.velocity = new THREE.Vector3()
    this.moving = false

    this.firstPerson = false
    this.firstPersonHeadOnly = false
    this.lastZoomAt = -Infinity

    this.lastJumpAt = 0
    this.flying = false
    this.flyForce = 100
    this.flyDrag = 300
    this.flyDir = new THREE.Vector3()

    this.platform = {
      actor: null,
      prevTransform: new THREE.Matrix4(),
    }

    this.xrRig = new THREE.Object3D()
    this.xrRig.rotation.reorder('YXZ')
    this.xrControllerFactory = null
    this.xrControllerLeft = null
    this.xrControllerRight = null

    this.mode = Modes.IDLE
    this.axis = new THREE.Vector3()
    this.gaze = new THREE.Vector3()

    this.speaking = false

    this.lastSendAt = 0

    this.base = createNode('group')
    this.base.position.fromArray(this.data.position)
    this.base.quaternion.fromArray(this.data.quaternion)

    this.hmdDelta = new THREE.Vector3()
    this.hmdLast = new THREE.Vector3()
    this.xrHeadOffset = new THREE.Vector3()
    this.xrHeadCalibrationPending = false
    this.xrHeadRecenterPending = false
    this.xrHandPose = null

    this.aura = createNode('group')

    this.nametag = createNode('nametag', { label: '', health: this.data.health, active: false })
    this.aura.add(this.nametag)

    this.bubble = createNode('ui', {
      id: 'bubble',
      // space: 'screen',
      width: 300,
      height: 512,
      // size: 0.01,
      pivot: 'bottom-center',
      // pivot: 'top-left',
      billboard: 'full',
      scaler: [3, 30],
      justifyContent: 'flex-end',
      alignItems: 'center',
      active: false,
    })
    this.bubbleBox = createNode('uiview', {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 10,
      padding: 10,
    })
    this.bubbleText = createNode('uitext', {
      color: 'white',
      fontWeight: 100,
      lineHeight: 1.4,
      fontSize: 16,
    })
    this.bubble.add(this.bubbleBox)
    this.bubbleBox.add(this.bubbleText)
    this.aura.add(this.bubble)
    this.updateBubble()
    this.world.graphics?.on('render-style', this.updateBubble)

    this.aura.activate({ world: this.world, entity: this })
    this.base.activate({ world: this.world, entity: this })

    this.camHeight = DEFAULT_CAM_HEIGHT
    this.cameraFocus = new THREE.Vector3()
    this.cameraFocusBounds = new THREE.Box3()
    this.seatedEyeOffset = null

    this.cam = {}
    this.cam.position = new THREE.Vector3().copy(this.base.position)
    this.cam.position.y += this.camHeight
    this.cam.quaternion = new THREE.Quaternion()
    this.cam.rotation = new THREE.Euler(0, 0, 0, 'YXZ')
    bindRotations(this.cam.quaternion, this.cam.rotation)
    this.cam.quaternion.copy(this.base.quaternion)
    this.cam.rotation.x += -15 * DEG2RAD
    this.cam.zoom = 1.5

    if (this.world.loader?.preloader) {
      await this.world.loader.preloader
    }

    this.applyAvatar()
    this.initCapsule()
    this.initControl()
    if (this.data.resumeCamera) {
      const camera = this.data.resumeCamera
      this.setCamera({ ...camera, quaternion: new THREE.Quaternion().fromArray(camera.quaternion) })
      delete this.data.resumeCamera
    }
    if (this.pendingTeleport) {
      this.teleport(this.pendingTeleport)
      this.pendingTeleport = null
    }

    this.world.setHot(this, true)
    this.world.on('xrSession', this.onXRSession)
    this.world.emit('ready', true)
  }

  getAvatarUrl() {
    return this.data.sessionAvatar || this.data.avatar || 'asset://avatar.vrm'
  }

  applyAvatar() {
    const avatarUrl = this.getAvatarUrl()
    if (this.avatarUrl === avatarUrl) return
    this.world.loader
      .load('avatar', avatarUrl)
      .then(src => {
        if (this.getAvatarUrl() !== avatarUrl) return
        if (this.avatar) this.avatar.deactivate()
        this.avatar = src.toNodes().get('avatar')
        this.avatar.disableRateCheck() // max fps for local player
        this.applySeatPose()
        this.avatar.setFirstPerson(this.firstPerson || !!this.cameraTransition?.headOnly || !!this.cameraTransition?.armsOnly, {
          headOnly: !!this.firstPersonHeadOnly || !!this.cameraTransition?.headOnly,
          armsOnly: !!this.cameraTransition?.armsOnly,
        })
        this.avatar.setHandTrackingPose(this.xrHandPose)
        this.avatar.setScriptedPose(this.scriptedPose || null)
        this.base.add(this.avatar)
        this.nametag.position.y = this.avatar.getHeadToHeight() + 0.2
        this.updateBubble()
        if (!this.bubble.active) {
          this.nametag.active = true
        }
        this.avatarUrl = avatarUrl
        this.camHeight = this.avatar.getHeight() - this.avatar.getHeadToHeight()
        this.world.emit('player', this)
      })
      .catch(err => {
        console.error(err)
      })
  }

  applySeatPose() {
    this.seatedEyeOffset = null
    if (!this.avatar) return
    const avatarUrl = this.getAvatarUrl()
    const seatPose = getMatchingSeatPose(this.data, avatarUrl)
    const defaultPose = !seatPose && this.data.effect?.anchorId ? getDefaultSittingPose() : null
    this.avatar.position.set(...(seatPose?.offset || [0, 0, 0]))
    this.avatar.quaternion.set(...(seatPose?.rotation || [0, 0, 0, 1]))
    this.avatar.setPoseOverride(seatPose?.pose || defaultPose)
    if (this.isXR) {
      this.xrHeadCalibrationPending = true
      if (this.data.effect?.anchorId) this.xrHeadRecenterPending = true
    }
  }

  initCapsule() {
    // PxCapsuleControllerDesc.height is the cylindrical section, not the
    // complete capsule height. Keep the same 1.6m total height as the old
    // dynamic capsule: 1.0m cylinder + two 0.3m hemispheres.
    const height = this.capsuleHeight - this.capsuleRadius * 2
    this.controller = createNode('controller', {
      radius: this.capsuleRadius,
      height,
      layer: 'player',
    })
    this.controller.position.copy(this.base.position)
    this.controller.activate({ world: this.world, entity: this })
  }

  initControl() {
    this.control = this.world.controls.bind({
      priority: ControlPriorities.PLAYER,
      onTouch: touch => {
        if (!this.stick && touch.position.x < this.control.screen.width / 2) {
          this.stick = {
            center: touch.position.clone(),
            active: false,
            touch,
          }
        } else if (!this.pan) {
          this.pan = touch
        }
      },
      onTouchEnd: touch => {
        if (this.stick?.touch === touch) {
          this.stick = null
          this.world.emit('stick', null)
        }
        if (this.pan === touch) {
          this.pan = null
        }
      },
    })
    const expressions = ['happy', 'angry', 'sad', 'relaxed', 'surprised']
    expressions.forEach((name, i) => {
      this.control[`digit${i + 1}`].onPress = () => {
        if (this.world.builder?.enabled || this.world.xr?.session) return
        const proxy = createPlayerProxy(null, this)
        const active = this.data.x?.[name] > 0
        proxy.clearExpressions()
        if (!active) proxy.setExpression(name, 1)
      }
    })
    this.control.camera.write = true
    this.control.camera.position.copy(this.cam.position)
    this.control.camera.quaternion.copy(this.cam.quaternion)
    this.control.camera.zoom = this.cam.zoom
    // this.control.setActions([{ type: 'space', label: 'Jump / Double-Jump' }])
    // this.control.setActions([{ type: 'escape', label: 'Menu' }])
  }

  onXRSession = session => {
    if (session) {
      if (!this.xrControllerFactory) {
        this.xrControllerFactory = new XRControllerModelFactory()
        this.xrControllerLeft = this.world.graphics.renderer.xr.getControllerGrip(0)
        this.xrControllerLeft.add(this.xrControllerFactory.createControllerModel(this.xrControllerLeft))
        this.xrRig.add(this.xrControllerLeft)
        this.xrControllerRight = this.world.graphics.renderer.xr.getControllerGrip(1)
        this.xrControllerRight.add(this.xrControllerFactory.createControllerModel(this.xrControllerRight))
        this.xrRig.add(this.xrControllerRight)
      }
      const debug = new URLSearchParams(window.location.search)
      if (debug.get('xrHands') === '1' && !this.xrDebugHands) {
        const factory = new XRHandModelFactory()
        this.xrDebugHands = [0, 1].map(index => {
          const hand = this.world.graphics.renderer.xr.getHand(index)
          hand.add(factory.createHandModel(hand, 'spheres'))
          this.xrRig.add(hand)
          return hand
        })
      }
      if (debug.get('xrRecord') === '1')
        this.xrHandRecording = { version: 1, frames: [], startedAt: null, lastAt: -Infinity }
      this.world.stage.scene.add(this.xrRig)
      this.xrRig.add(this.world.camera)
      this.cam.zoom = 0
      this.control.camera.write = false
      this.isXR = true
      this.xrHandPose = null
      this.avatar?.setHandTrackingPose(null)
      this.xrHeadOffset.set(0, 0, 0)
      this.xrHeadCalibrationPending = true
      this.xrHeadRecenterPending = !!this.data.effect?.anchorId
      this.world.graphics.on('render', this.onXRRender)
    } else {
      this.downloadXRHandRecording()
      this.world.graphics.off('render', this.onXRRender)
      this.world.stage.scene.remove(this.xrRig)
      this.world.rig.add(this.world.camera)
      this.world.camera.position.set(0, 0, 0)
      this.world.camera.rotation.set(0, 0, 0)
      this.cam.zoom = 1
      this.control.camera.write = true
      this.isXR = false
      this.xrHandPose = null
      this.avatar?.setHandTrackingPose(null)
      this.xrHeadOffset.set(0, 0, 0)
      this.xrHeadCalibrationPending = false
      this.xrHeadRecenterPending = false
    }
  }

  calibrateXRHead() {
    if (!this.avatar) return false
    const matrix = this.avatar.getBoneTransform('head')
    const camera = this.world.camera
    if (!matrix || camera.position.y <= 0) return false

    const headPosition = v1.setFromMatrixPosition(matrix)
    // setXRPlayerPosition targets the point directly below the camera. Subtract
    // the current local HMD Y so this pose lands on the avatar's head; later
    // headset movement remains relative to that calibrated point.
    const target = v3.set(headPosition.x, headPosition.y - camera.position.y, headPosition.z)
    this.xrHeadOffset.subVectors(target, this.base.position)
    if (this.xrHeadRecenterPending) {
      // Recenter only yaw around the headset; pitch and roll remain user-controlled.
      const headQuaternion = q2.setFromRotationMatrix(matrix)
      const cameraQuaternion = q3
      this.world.camera.getWorldQuaternion(cameraQuaternion)
      e1.setFromQuaternion(cameraQuaternion).reorder('YXZ')
      const cameraYaw = e1.y
      e1.setFromQuaternion(headQuaternion).reorder('YXZ')
      let turn = e1.y - cameraYaw
      if (turn > Math.PI) turn -= Math.PI * 2
      if (turn < -Math.PI) turn += Math.PI * 2
      this.turnXRRigAtPlayer(turn * RAD2DEG)
      this.xrHeadRecenterPending = false
    }
    this.xrHeadCalibrationPending = false
    return true
  }

  onXRRender = () => {
    if (!this.isXR || !this.xrHeadCalibrationPending || !this.calibrateXRHead()) return

    const camera = this.world.camera
    this.setXRPlayerPosition(this.base.position)

    // The calibration happens after the render, so refresh the transforms
    // before resetting the physical-movement baseline for the next frame.
    this.xrRig.updateMatrixWorld(true)
    camera.updateMatrixWorld(true)
    camera.getWorldPosition(v2)
    v2.y = 0
    v3.copy(this.xrRig.position)
    v3.y = 0
    this.hmdLast.copy(v2).sub(v3)
  }

  setXRPlayerPosition(position) {
    const parent = this.xrRig
    const child = this.world.camera
    const feetWorldPos = child.getWorldPosition(v2)
    feetWorldPos.y -= child.position.y
    const target = v3.copy(position).add(this.xrHeadOffset)
    const offset = v1.subVectors(target, feetWorldPos)
    parent.position.add(offset)

    // const offset = v1.copy(position)
    // const offset = v1.copy(position)
    // offset.x -= parent.position.x + child.position.x
    // offset.y -= parent.position.y
    // offset.z -= parent.position.z + child.position.z
    // parent.position.add(offset)
  }

  turnXRRigAtPlayer(degrees) {
    const parent = this.xrRig
    const child = this.world.camera
    // console.log(child.getWorldPosition(new THREE.Vector3()))
    const pivotWorld = new THREE.Vector3()
    child.getWorldPosition(pivotWorld)
    parent.rotateOnAxis(UP, degrees * THREE.MathUtils.DEG2RAD)
    const offset = child.position.clone()
    offset.applyQuaternion(parent.quaternion)
    parent.position.copy(pivotWorld).sub(offset)
    // console.log(child.getWorldPosition(new THREE.Vector3()))
  }

  updateXRHandPose() {
    if (!this.isXR || !this.avatar?.instance?.raw?.scene) {
      if (this.xrHandPose) {
        this.xrHandPose = null
        this.avatar?.setHandTrackingPose(null)
      }
      return null
    }

    const sources = this.world.controls?.xrHands || {}
    const controllerPoses = {
      left: this.control?.xrLeftGripPose,
      right: this.control?.xrRightGripPose,
    }
    const hasControllerPose = side => controllerPoses[side]?.valid
    if (!sources.left && !sources.right && !hasControllerPose('left') && !hasControllerPose('right')) {
      if (this.xrHandPose) {
        this.xrHandPose = null
        this.avatar.setHandTrackingPose(null)
      }
      return null
    }

    const scene = this.avatar.instance.raw.scene
    scene.updateMatrixWorld(true)
    this.xrRig.updateMatrixWorld(true)
    const avatarInverse = m3.copy(scene.matrixWorld).invert()
    const avatarRotation = scene.getWorldQuaternion(q5)
    const xrRotation = this.xrRig.getWorldQuaternion(q6)
    const xrToAvatar = q7.copy(avatarRotation).invert().multiply(xrRotation)
    const pose = {}

    for (const side of ['left', 'right']) {
      const source = sources[side]
      const trackedHand = source?.joints?.wrist ? source : null
      const controllerPose = !trackedHand && hasControllerPose(side) ? controllerPoses[side] : null
      const wrist =
        trackedHand?.joints?.wrist ||
        (controllerPose && {
          p: controllerPose.position.toArray(),
          q: controllerPose.quaternion.toArray(),
        })
      if (!wrist) continue

      const wristMatrix = m1.compose(v4.fromArray(wrist.p), q4.fromArray(wrist.q), SCALE_IDENTITY)
      wristMatrix.premultiply(this.xrRig.matrixWorld).premultiply(avatarInverse)
      const hand = {
        kind: trackedHand ? 'hand' : 'controller',
        p: v5.setFromMatrixPosition(wristMatrix).toArray(),
        w: q1.copy(xrToAvatar).multiply(q4).normalize().toArray(),
        f: {},
      }
      if (trackedHand) {
        for (const item of XR_HAND_BONES) {
          const joint = trackedHand.joints[item.joint]
          if (joint) hand.f[item.bone] = q1.copy(xrToAvatar).multiply(q2.fromArray(joint.q)).normalize().toArray()
        }
      }
      pose[side] = hand
    }

    this.xrHandPose = Object.keys(pose).length ? pose : null
    this.avatar.setHandTrackingPose(this.xrHandPose)
    if (this.xrHandRecording) this.recordXRHands(sources, scene)
    return this.xrHandPose
  }

  recordXRHands(sources, scene) {
    const recording = this.xrHandRecording
    if (!recording) return
    const now = performance.now()
    if (recording.startedAt === null) recording.startedAt = now
    const time = now - recording.startedAt
    if (time > 10000 || now - recording.lastAt < 1000 / 30) return
    recording.lastAt = now
    recording.frames.push(
      JSON.parse(
        JSON.stringify({
          time,
          hands: sources,
          pose: this.xrHandPose,
          xrRig: this.xrRig.matrixWorld.toArray(),
          avatar: scene.matrixWorld.toArray(),
        })
      )
    )
  }

  downloadXRHandRecording() {
    const recording = this.xrHandRecording
    this.xrHandRecording = null
    if (!recording?.frames.length) return
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ version: recording.version, frames: recording.frames })], { type: 'application/json' })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'xr-hands.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  toggleFlying(value) {
    value = isBoolean(value) ? value : !this.flying
    if (this.flying === value) return
    this.flying = value
    if (this.flying) {
      // zero out vertical velocity when entering fly mode
      this.velocity.y = 0
    } else {
      // ...
    }
    this.lastJumpAt = -999
  }

  getAnchorMatrix() {
    if (this.data.effect?.anchorId) {
      return this.world.anchors.get(this.data.effect.anchorId)
    }
    return null
  }

  outranks(otherPlayer) {
    const rank = Math.max(this.data.rank, this.world.settings.effectiveRank)
    const otherRank = Math.max(otherPlayer.data.rank, this.world.settings.effectiveRank)
    return rank > otherRank
  }

  isAdmin() {
    const rank = Math.max(this.data.rank, this.world.settings.effectiveRank)
    return hasRank(rank, Ranks.ADMIN)
  }

  isBuilder() {
    const rank = Math.max(this.data.rank, this.world.settings.effectiveRank)
    return hasRank(rank, Ranks.BUILDER)
  }

  isMuted() {
    return this.world.livekit.isMuted(this.data.id)
  }

  destroy(local) {
    if (this.destroyed) return
    this.destroyed = true
    this.world.graphics?.off('render-style', this.updateBubble)

    this.control?.release()
    this.control = null
    this.world.off('xrSession', this.onXRSession)
    if (this.isXR) this.onXRSession(null)
    this.controller?.deactivate()
    this.controller = null
    this.base.deactivate()
    this.avatar = null
    this.world.setHot(this, false)
    this.world.events.emit('leave', { playerId: this.data.id })
    this.aura.deactivate()
    this.aura = null

    if (local) {
      this.world.network.send('entityRemoved', this.data.id)
    }
  }

  fixedUpdate(delta) {
    const anchor = this.getAnchorMatrix()
    let snare = this.data.effect?.snare
    if (!Number.isFinite(snare) || snare < 0 || snare > 1) snare = 0

    if (this.poseEditorActive) {
      this.jumpDown = false
      this.jumpPressed = false
      this.moveDir.set(0, 0, 0)
      this.moving = false
      return
    }

    if (anchor) {
      /**
       *
       * ZERO MODE
       *
       */
    } else if (!this.flying) {
      /**
       *
       * STANDARD MODE
       *
       */

      // CCTs do not receive the old rigid-body platform impulse, so carry the
      // platform's transform delta into the next controller move instead.
      const platformDelta = v5.set(0, 0, 0)
      if (this.grounded) {
        // find any potentially moving platform
        const origin = v1.copy(this.controller.position)
        origin.y += 0.2
        const hitMask = Layers.environment.group | Layers.prop.group
        const hit = this.world.physics.raycast(origin, DOWN, 2, hitMask)
        const actor = getPlatformActor(hit)
        // if we found a new platform, set it up for tracking
        if (this.platform.actor !== actor) {
          this.platform.actor = actor
          if (actor) {
            const platformPose = this.platform.actor.getGlobalPose()
            pxToVec3(v1, platformPose.p)
            pxToQuat(q1, platformPose.q)
            this.platform.prevTransform.compose(v1, q1, SCALE_IDENTITY)
          }
        }
        // move with platform
        if (this.platform.actor) {
          // get current platform transform
          const currTransform = m1
          const platformPose = this.platform.actor.getGlobalPose()
          pxToVec3(v1, platformPose.p)
          pxToQuat(q1, platformPose.q)
          currTransform.compose(v1, q1, SCALE_IDENTITY)
          // get delta transform
          const deltaTransform = m2.multiplyMatrices(currTransform, this.platform.prevTransform.clone().invert())
          // extract delta position and quaternion
          const deltaPosition = v2
          const deltaQuaternion = q2
          const deltaScale = v3
          deltaTransform.decompose(deltaPosition, deltaQuaternion, deltaScale)
          // Apply the delta to the CCT's foot position. The controller itself
          // does not rotate, but the visual player should follow platform yaw.
          v4.copy(this.controller.position)
          q3.set(0, 0, 0, 1)
          const playerTransform = m3
          playerTransform.compose(v4, q3, SCALE_IDENTITY)
          playerTransform.premultiply(deltaTransform)
          playerTransform.decompose(platformDelta, q4, v6)
          platformDelta.sub(v4)
          // rotate ghost by Y only
          e1.setFromQuaternion(deltaQuaternion).reorder('YXZ')
          e1.x = 0
          e1.z = 0
          q1.setFromEuler(e1)
          this.base.quaternion.multiply(q1)
          this.base.updateTransform()
          // store current transform for next frame
          this.platform.prevTransform.copy(currTransform)
        }
      } else {
        this.platform.actor = null
      }

      // sweep down to see if we hit ground
      let sweepHit
      {
        const geometry = this.groundSweepGeometry
        const origin = v1.copy(this.controller.position)
        origin.y += this.groundSweepRadius + 0.12 // move up inside player + a bit
        const direction = DOWN
        const maxDistance = 0.12 + 0.1 // outside player + a bit more
        const hitMask = Layers.environment.group | Layers.prop.group
        sweepHit = this.world.physics.sweep(geometry, origin, direction, maxDistance, hitMask)
      }

      // update grounded info
      if (sweepHit || this.controller.isGrounded) {
        this.justLeftGround = false
        this.grounded = true
        this.groundNormal.copy(sweepHit?.normal || UP)
        this.groundAngle = UP.angleTo(this.groundNormal) * RAD2DEG
      } else {
        this.justLeftGround = !!this.grounded
        this.grounded = false
        this.groundNormal.copy(UP)
        this.groundAngle = 0
      }

      // if on a steep slope, unground and track slipping
      if (this.grounded && this.groundAngle > 60) {
        this.justLeftGround = false
        this.grounded = false
        this.groundNormal.copy(UP)
        this.groundAngle = 0
        this.slipping = true
      } else {
        this.slipping = false
      }

      // A CCT has no mass to load a dynamic platform. Preserve the old
      // downward compensation so seesaws and other dynamic platforms still
      // respond while the player is standing on them.
      if (this.grounded && this.platform.actor) {
        const isStatic = this.platform.actor instanceof PHYSX.PxRigidStatic
        const rigidBodyFlags = this.platform.actor.getRigidBodyFlags?.()
        const isKinematic = rigidBodyFlags?.isSet(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC)
        if (!isKinematic && !isStatic) {
          const force = v1.set(0, -9.81 * 0.2, 0)
          PHYSX.PxRigidBodyExt.prototype.addForceAtPos(
            this.platform.actor,
            vec3ToPx(force, scratchPxVec3()),
            vec3ToPx(this.controller.position, scratchPxExtVec3()),
            PHYSX.PxForceModeEnum.eFORCE,
            true
          )
        }
      }

      // if we jumped and have now left the ground, progress to jumping
      if (this.jumped && !this.grounded) {
        this.jumped = false
        this.jumping = true
      }

      // if not grounded and our velocity is downward, start timing our falling
      if (!this.grounded && this.velocity.y < 0) {
        this.fallTimer += delta
      } else {
        this.fallTimer = 0
      }
      // if we've been falling for a bit then progress to actual falling
      // this is to prevent animation jitter when only falling for a very small amount of time
      if (this.fallTimer > 0.1 && !this.falling) {
        this.jumping = false
        this.airJumping = false
        this.falling = true
        this.fallStartY = this.base.position.y
      }

      // if falling track distance
      if (this.falling) {
        this.fallDistance = this.fallStartY - this.base.position.y
      }

      // if falling and we're now on the ground, clear it
      if (this.falling && this.grounded) {
        this.falling = false
      }

      // if jumping and we're now on the ground, clear it
      if (this.jumping && this.grounded) {
        this.jumping = false
      }

      // if airJumping and we're now on the ground, clear it
      if (this.airJumped && this.grounded) {
        this.airJumped = false
        this.airJumping = false
      }

      // CCT movement is explicit, so keep only the vertical and push velocity
      // here. Horizontal input is supplied directly to the controller below.
      const velocity = this.velocity
      // apply drag, orientated to ground normal
      // this prevents ice-skating & yeeting us upward when going up ramps
      const dragCoeff = Math.min(1, 10 * delta)
      const perpComponent = v2.copy(this.groundNormal).multiplyScalar(velocity.dot(this.groundNormal))
      const parallelComponent = v3.copy(velocity).sub(perpComponent)
      parallelComponent.multiplyScalar(1 - dragCoeff)
      velocity.copy(parallelComponent.add(perpComponent))
      // cancel out velocity in ground normal direction (up oriented to ground normal)
      // this helps us stick to elevators
      if (this.grounded && !this.jumping) {
        const projectedLength = velocity.dot(this.groundNormal)
        const projectedVector = v2.copy(this.groundNormal).multiplyScalar(projectedLength)
        velocity.sub(projectedVector)
      }
      // when walking off an edge or over the top of a ramp, attempt to snap down to a surface
      if (this.justLeftGround && !this.jumping) {
        velocity.y = -5
      }
      // if slipping ensure we can't gain upward velocity
      if (this.slipping) {
        // increase downward velocity to prevent sliding upward when walking at a slope
        velocity.y -= 0.5
      }

      if (!this.grounded) {
        velocity.y -= this.effectiveGravity * delta
      }

      // apply additional push force
      if (this.pushForce) {
        if (!this.pushForceInit) {
          this.pushForceInit = true
          // if we're pushing up, act like a jump so we don't stick to the ground
          if (this.pushForce.y) {
            this.jumped = true
            // ensure other stuff is reset
            this.jumping = false
            this.falling = false
            this.airJumped = false
            this.airJumping = false
          }
        }
        velocity.add(this.pushForce)
        const drag = 20
        const decayFactor = 1 - drag * delta
        if (decayFactor < 0) {
          // if drag * delta > 1, just set to zero
          this.pushForce.set(0, 0, 0)
        } else {
          this.pushForce.multiplyScalar(Math.max(decayFactor, 0))
        }
        if (this.pushForce.length() < 0.01) {
          this.pushForce = null
        }
      }

      // Apply movement directly. PhysX CCT handles the collision resolution,
      // including its configured step offset, instead of a force emergently
      // overcoming the obstacle.
      const displacement = v4.set(0, 0, 0)
      if (this.moving) {
        let moveSpeed = (this.running ? 6 : 3) * this.mass // run
        moveSpeed *= 1 - snare
        const slopeRotation = q1.setFromUnitVectors(UP, this.groundNormal)
        displacement.copy(this.moveDir).multiplyScalar(moveSpeed * delta).applyQuaternion(slopeRotation) // prettier-ignore
      }

      // A grounded CCT needs a small downward component for PhysX's
      // constrained climbing path to enforce stepOffset. Do not retain this
      // as velocity; it is only the per-move grounding probe.
      if (this.grounded && !this.jumping && !this.jumped) {
        displacement.y -= delta
      }

      // ground/air jump
      const shouldJump = this.grounded && !this.jumping && this.jumpDown && !snare && !this.data.effect?.freeze
      const shouldAirJump =
        false && !this.grounded && !this.airJumped && this.jumpPressed && !this.world.builder?.enabled // temp: disabled
      if (shouldJump || shouldAirJump) {
        // calc velocity needed to reach jump height
        let jumpVelocity = Math.sqrt(2 * this.effectiveGravity * this.jumpHeight)
        jumpVelocity = jumpVelocity * (1 / Math.sqrt(this.mass))
        // update velocity
        velocity.y = jumpVelocity
        // ground jump init (we haven't left the ground yet)
        if (shouldJump) {
          this.jumped = true
        }
        // air jump init
        if (shouldAirJump) {
          this.falling = false
          this.fallTimer = 0
          this.jumping = true
          this.airJumped = true
          this.airJumping = true
        }
      }

      displacement.addScaledVector(velocity, delta).add(platformDelta)
      this.controller.move(displacement, delta)
      this.base.position.copy(this.controller.position)
      if (this.controller.isGrounded && velocity.y < 0) {
        velocity.y = 0
      }
    } else {
      /**
       *
       * FLYING MODE
       *
       */

      // apply force in the direction we want to go
      if (this.moving || this.jumpDown || this.control.keyC.down) {
        const flySpeed = this.flyForce * (this.running ? 2 : 1)
        const force = v1.copy(this.flyDir).multiplyScalar(flySpeed)
        // handle vertical movement
        if (this.jumpDown) {
          force.y = flySpeed
        } else if (this.control.keyC.down) {
          force.y = -flySpeed
        }
        this.velocity.addScaledVector(force, delta)
      }

      // Match the old force-based damping while keeping the CCT displacement
      // explicit: the old drag force was integrated for another `delta`.
      const dragFactor = Math.max(0, 1 - this.flyDrag * delta * delta)
      this.velocity.multiplyScalar(dragFactor)
      this.controller.move(v1.copy(this.velocity).multiplyScalar(delta), delta)
      this.base.position.copy(this.controller.position)

      // if non-xr and not in build mode, cancel flying
      if (!this.world.builder?.enabled && !this.isXR) {
        this.toggleFlying()
      }
    }

    // double jump in build mode, toggle flying
    // double jump in xr and "can" build, toggle flying
    if (this.jumpPressed && (this.world.builder?.enabled || (this.isXR && this.world.builder?.canBuild()))) {
      if (this.world.time - this.lastJumpAt < 0.4) {
        this.toggleFlying()
      }
      this.lastJumpAt = this.world.time
    }

    // consume jump press so we dont run it across multiple fixedUpdates in one frame
    this.jumpPressed = false
  }

  update(delta) {
    this.avatar?.setExpressions(this.data.x)
    this.avatar?.setSpeaking(this.speaking)
    if (this.poseEditorActive) {
      this.moveDir.set(0, 0, 0)
      this.axis.set(0, 0, 0)
      this.moving = false
      this.running = false
      this.jumpDown = false
      this.jumpPressed = false
      this.mode = Modes.IDLE
      const emote = this.data.effect?.emote || null
      if (this.emote !== emote) this.emote = emote
      this.avatar?.setEmote(this.emote)
      this.updateXRHandPose()
      this.avatar?.instance?.setLocomotion(this.mode, this.axis, this.gaze)
      this.updateEffectDuration(delta)
      return
    }

    const xr = this.isXR
    const freeze = this.data.effect?.freeze
    const anchor = this.getAnchorMatrix()

    // if (xr) return
    // console.log('update')

    if (xr) {
      // If the first render happened before the avatar pose was available,
      // calibrate on the next update once WebXR has populated the local pose.
      const calibrated = this.xrHeadCalibrationPending && this.calibrateXRHead()
      // move the rig so that the ground underneath the camera aligns with the base player
      this.setXRPlayerPosition(this.base.position)
      if (calibrated) {
        this.world.camera.getWorldPosition(v1)
        v1.y = 0
        v2.copy(this.xrRig.position)
        v2.y = 0
        this.hmdLast.copy(v1).sub(v2)
      }
      // fetch any physical movement delta
      this.world.camera.getWorldPosition(v1)
      v1.y = 0
      v2.copy(this.xrRig.position)
      v2.y = 0
      v3.copy(v1).sub(v2)
      this.hmdDelta.copy(v3).sub(this.hmdLast)
      this.hmdLast.copy(v3)
      // Physical XR movement is an intentional relocation, not locomotion.
      v2.copy(this.controller.position).add(this.hmdDelta)
      this.controller.teleport(v2)
      this.base.position.copy(this.controller.position)
    }

    const isometric = this.world.camera.isOrthographicCamera && !xr
    if (isometric && !this.isometricCameraState) {
      this.isometricCameraState = this.getCamera()
      this.firstPerson = false
      this.firstPersonHeadOnly = false
      this.avatar?.setFirstPerson(false, { headOnly: false })
      if (this.avatar) this.avatar.visible = true
    } else if (!isometric && this.isometricCameraState) {
      this.setCamera(this.isometricCameraState)
      this.isometricCameraState = null
    }
    // update cam look direction
    if (isometric) {
      const retro = this.world.graphics.renderStyle === 'pixel-retro'
      this.cam.rotation.set(retro ? RETRO_PITCH : ISOMETRIC_PITCH, retro ? 0 : ISOMETRIC_YAW, 0, 'YXZ')
      this.cam.zoom = ISOMETRIC_DISTANCE
    } else if (xr) {
      // in xr clear camera rotation (handled internally)
      // in xr we only track turn here, which is added to the xr camera later on
      // this.cam.rotation.x = 0
      // this.cam.rotation.z = 0
      const turn = getXRTurnAngle(this.control.xrRightStick.value.x, delta)
      if (turn) {
        this.turnXRRigAtPlayer(turn)
        // Refresh the HMD baseline to cancel out the rig rotation.
        this.world.camera.getWorldPosition(v1)
        v1.y = 0
        v2.copy(this.xrRig.position)
        v2.y = 0
        v3.copy(v1).sub(v2)
        this.hmdLast.copy(v3)
      }
    } else if (this.control.pointer.locked) {
      // or pointer lock, rotate camera with pointer movement
      this.cam.rotation.x += -this.control.pointer.delta.y * POINTER_LOOK_SPEED * delta
      this.cam.rotation.y += -this.control.pointer.delta.x * POINTER_LOOK_SPEED * delta
      this.cam.rotation.z = 0
    } else if (this.pan) {
      // or when touch panning
      this.cam.rotation.x += -this.pan.delta.y * PAN_LOOK_SPEED * delta
      this.cam.rotation.y += -this.pan.delta.x * PAN_LOOK_SPEED * delta
      this.cam.rotation.z = 0
    }

    // ensure we can't look too far up/down
    if (!xr) {
      this.cam.rotation.x = clamp(this.cam.rotation.x, -89 * DEG2RAD, 89 * DEG2RAD)
    }

    if (!isometric) this.updateZoom(delta)

    // stick movement threshold
    if (this.stick && !this.stick.active) {
      this.stick.active = this.stick.center.distanceTo(this.stick.touch.position) > 3
    }

    // watch jump presses to either fly or air-jump
    this.jumpDown = xr ? this.control.xrRightBtn1.down : this.control.space.down || this.control.touchA.down
    if (xr ? this.control.xrRightBtn1.pressed : this.control.space.pressed || this.control.touchA.pressed) {
      this.jumpPressed = true
    }

    // get our movement direction
    this.moveDir.set(0, 0, 0)
    if (xr) {
      // in xr use controller input
      this.moveDir.x = this.control.xrLeftStick.value.x
      this.moveDir.z = this.control.xrLeftStick.value.z
    } else if (this.stick?.active) {
      // if we have a touch joystick use that
      const touchX = this.stick.touch.position.x
      const touchY = this.stick.touch.position.y
      const centerX = this.stick.center.x
      const centerY = this.stick.center.y
      const dx = centerX - touchX
      const dy = centerY - touchY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const moveRadius = STICK_OUTER_RADIUS - STICK_INNER_RADIUS
      if (distance > moveRadius) {
        this.stick.center.x = touchX + (moveRadius * dx) / distance
        this.stick.center.y = touchY + (moveRadius * dy) / distance
      }
      const stickX = (touchX - this.stick.center.x) / moveRadius
      const stickY = (touchY - this.stick.center.y) / moveRadius
      this.moveDir.x = stickX
      this.moveDir.z = stickY
      this.world.emit('stick', this.stick)
    } else {
      // otherwise use keyboard
      if (this.control.keyW.down || this.control.arrowUp.down) this.moveDir.z -= 1
      if (this.control.keyS.down || this.control.arrowDown.down) this.moveDir.z += 1
      if (this.control.keyA.down || this.control.arrowLeft.down) this.moveDir.x -= 1
      if (this.control.keyD.down || this.control.arrowRight.down) this.moveDir.x += 1
    }

    // we're moving if direction is set
    this.moving = this.moveDir.length() > 0

    // check effect cancel
    if (this.data.effect?.cancellable && (this.moving || this.jumpDown)) {
      this.setEffect(null)
    }

    if (freeze || anchor) {
      // cancel movement
      this.moveDir.set(0, 0, 0)
      this.moving = false
    }

    // determine if we're "running"
    if (this.stick?.active || xr) {
      // touch/xr joysticks at full extent
      this.running = this.moving && this.moveDir.length() > 0.9
    } else {
      // or keyboard shift key
      this.running = this.moving && (this.control.shiftLeft.down || this.control.shiftRight.down)
    }

    // normalize direction (also prevents surfing)
    this.moveDir.normalize()

    // flying direction
    if (xr) {
      this.flyDir.copy(this.moveDir)
      this.world.camera.getWorldQuaternion(q1)
      this.flyDir.applyQuaternion(q1)
    } else {
      this.flyDir.copy(this.moveDir)
      this.flyDir.applyQuaternion(this.cam.quaternion)
    }

    // store un-rotated move direction (axis)
    this.axis.copy(this.moveDir)

    // get un-rotated move direction in degrees
    // Octant ranges (8 directions)
    // Forward:         337.5° to 22.5° (or -22.5° to 22.5°)
    // Forward-Right:   22.5° to 67.5°
    // Right:           67.5° to 112.5°
    // Backward-Right:  112.5° to 157.5°
    // Backward:        157.5° to 202.5°
    // Backward-Left:   202.5° to 247.5°
    // Left:            247.5° to 292.5°
    // Forward-Left:    292.5° to 337.5°
    const moveRad = Math.atan2(this.axis.x, -this.axis.z)
    let moveDeg = moveRad * RAD2DEG
    if (moveDeg < 0) moveDeg += 360

    // rotate direction to face camera Y direction
    if (xr) {
      this.world.camera.getWorldQuaternion(q1)
      e1.setFromQuaternion(q1).reorder('YXZ')
      // e1.y += this.xrRig.rotation.y
      // e1.y += this.cam.rotation.y // why not world.camera now?
      const yQuaternion = q1.setFromAxisAngle(UP, e1.y)
      this.moveDir.applyQuaternion(yQuaternion)
    } else {
      const yQuaternion = q1.setFromAxisAngle(UP, this.cam.rotation.y)
      this.moveDir.applyQuaternion(yQuaternion)
    }

    // get initial facing angle matching camera
    let rotY = 0
    if (xr) {
      this.world.camera.getWorldQuaternion(q1)
      e1.setFromQuaternion(q1).reorder('YXZ')
      rotY = e1.y
      // rotY = e1.y + this.cam.rotation.y
    } else {
      rotY = this.cam.rotation.y
    }
    this.updateFacing(delta, rotY, isometric)

    // apply emote
    const rawEmote = this.data.effect?.emote
    if (!Object.is(this.effectEmoteRaw, rawEmote)) {
      this.effectEmoteRaw = rawEmote
      this.effectEmoteValid = typeof rawEmote === 'string' && isEmoteUrl(rawEmote)
      this.effectEmoteMasked = isRightArmEmote(rawEmote)
    }
    const emote = this.effectEmoteValid ? rawEmote : undefined
    if (this.emote !== emote) {
      this.emote = emote
    }
    this.avatar?.setEmote(this.emote)

    // get locomotion mode
    let mode
    if (emote && !this.effectEmoteMasked) {
      // emote overrides locomotion
    } else if (this.flying) {
      mode = Modes.FLY
    } else if (this.airJumping) {
      mode = Modes.FLIP
    } else if (this.jumping) {
      mode = Modes.JUMP
    } else if (this.falling) {
      mode = this.fallDistance > 1.6 ? Modes.FALL : Modes.JUMP
    } else if (this.moving) {
      mode = this.running ? Modes.RUN : Modes.WALK
    } else if (this.speaking) {
      mode = Modes.TALK
    }
    if (!mode) mode = Modes.IDLE
    this.mode = mode

    // set gaze direction
    if (xr) {
      this.world.camera.getWorldQuaternion(q1)
      this.gaze.copy(FORWARD).applyQuaternion(q1)
    } else if (isometric) {
      this.gaze.copy(FORWARD).applyQuaternion(this.base.quaternion)
    } else {
      this.gaze.copy(FORWARD).applyQuaternion(this.cam.quaternion)
      if (!this.firstPerson) {
        // tilt slightly up in third person as people look from above
        v1.copy(gazeTiltAxis).applyQuaternion(this.cam.quaternion) // tilt in cam space
        this.gaze.applyAxisAngle(v1, gazeTiltAngle) // positive for upward tilt
      }
    }

    if (xr) {
      // hint to controls that xr rig is in a new position
      this.world.controls.applyXRRig(this.xrRig)
    }

    this.updateXRHandPose()

    // apply locomotion
    this.avatar?.instance?.setLocomotion(this.mode, this.axis, this.gaze)

    // send network updates
    this.lastSendAt += delta
    if (this.lastSendAt >= this.world.networkRate) {
      if (!this.lastState) {
        this.lastState = {
          id: this.data.id,
          p: this.base.position.clone(),
          q: this.base.quaternion.clone(),
          m: this.mode,
          a: this.axis.clone(),
          g: this.gaze.clone(),
          e: null,
          h: null,
        }
      }
      const data = {
        id: this.data.id,
      }
      let hasChanges
      if (!this.lastState.p.equals(this.base.position)) {
        data.p = this.base.position.toArray()
        this.lastState.p.copy(this.base.position)
        hasChanges = true
      }
      if (!this.lastState.q.equals(this.base.quaternion)) {
        data.q = this.base.quaternion.toArray()
        this.lastState.q.copy(this.base.quaternion)
        hasChanges = true
      }
      if (this.lastState.m !== this.mode) {
        data.m = this.mode
        this.lastState.m = this.mode
        hasChanges = true
      }
      if (!this.lastState.a.equals(this.axis)) {
        data.a = this.axis.toArray()
        this.lastState.a.copy(this.axis)
        hasChanges = true
      }
      if (!this.lastState.g.equals(this.gaze)) {
        data.g = this.gaze.toArray()
        this.lastState.g.copy(this.gaze)
        hasChanges = true
      }
      if (this.lastState.e !== this.emote) {
        data.e = isEmoteUrl(this.emote) ? this.emote : null
        this.lastState.e = this.emote
        hasChanges = true
      }
      const handPose = this.xrHandPose ? JSON.stringify(this.xrHandPose) : null
      if (this.lastState.h !== handPose) {
        data.h = this.xrHandPose
        this.lastState.h = handPose
        hasChanges = true
      }
      if (hasChanges) {
        this.world.network.send('entityModified', data)
      }
      this.lastSendAt = 0
    }

    this.updateEffectDuration(delta)
  }

  updateFacing(delta, cameraYaw, orthographic = false) {
    if (this.scriptedPose?.root) return
    if (!this.moving && !this.firstPerson && this.data.effect?.turn !== true) return
    const faceMovement = orthographic && this.moving && this.data.effect?.turn !== true
    const yaw = faceMovement ? Math.atan2(-this.moveDir.x, -this.moveDir.z) : cameraYaw
    e1.set(0, yaw, 0)
    q1.setFromEuler(e1)
    this.base.quaternion.slerp(q1, 1 - Math.pow(0.00000001, delta))
    if (orthographic) {
      // Animate movement in body space, so turning doesn't leave a strafe/backward walk.
      this.axis.copy(this.moveDir).applyQuaternion(q1.copy(this.base.quaternion).invert())
    }
  }

  updateBubble = () => stylePlayerBubble(this)

  updateEffectDuration(delta) {
    if (!this.data.effect?.duration) return
    this.data.effect.duration -= delta
    if (this.data.effect.duration <= 0) this.setEffect(null)
  }

  lateUpdate(delta) {
    const xr = this.isXR
    const anchor = this.getAnchorMatrix()

    // if (xr) return
    // console.log('lateUpdate')

    // if we're anchored, force into that pose
    if (anchor && readAnchorPose(anchor, anchorPosition, anchorQuaternion)) {
      this.base.position.copy(anchorPosition)
      this.base.quaternion.copy(anchorQuaternion)
      this.controller.teleport(this.base.position)
      // Camera focus reads avatar bone matrices. Commit the current seat pose
      // first so the camera and rendered avatar follow the same anchor frame.
      this.base.clean()
    }
    if (this.poseEditorActive) {
      this.seatedEyeOffset = null
      return
    }
    if (!anchor || !this.firstPerson || xr) this.seatedEyeOffset = null
    // make camera follow our position horizontally
    this.cam.position.copy(this.base.position)
    if (xr) {
      // ...
    } else {
      if (anchor && this.avatar?.instance?.raw?.scene) {
        if (this.firstPerson) {
          if (!this.seatedEyeOffset) {
            const eyes = getAvatarEyePosition(this.avatar, this.cameraFocus)
            if (!eyes) {
              getAvatarCameraFocus(this.avatar, this.avatar.getHeight(), this.cameraFocus, this.cameraFocusBounds)
            }
            // Keep the posed eye reference in seat space, without copying idle/head animation into the camera.
            this.seatedEyeOffset = this.cameraFocus.clone().applyMatrix4(m1.copy(anchor).invert())
          }
          this.cam.position.copy(this.seatedEyeOffset).applyMatrix4(anchor)
        } else {
          getAvatarCameraFocus(this.avatar, this.avatar.getHeight(), this.cameraFocus, this.cameraFocusBounds)
          this.cam.position.copy(this.cameraFocus)
        }
      } else {
        // Standing uses the default camera height; seated views follow the posed avatar.
        this.cam.position.y += this.camHeight
      }
      // and slightly to the right over the avatars shoulder, when not first person / xr
      if (!this.firstPerson) {
        const forward = v1.copy(FORWARD).applyQuaternion(this.cam.quaternion)
        const right = v2.crossVectors(forward, UP).normalize()
        this.cam.position.add(right.multiplyScalar(0.3))
      }
    }
    if (xr) {
      // in vr snap camera
      // this.control.camera.position.copy(this.cam.position)
      // this.control.camera.quaternion.copy(this.cam.quaternion)
    } else {
      // otherwise interpolate camera towards target
      let target = this.cam
      const transition = this.cameraTransition
      if (transition) {
        const elapsed = Number.isFinite(transition.startedAt) && Number.isFinite(this.world.time)
          ? Math.max(0, this.world.time - transition.startedAt) : transition.elapsed + delta
        transition.elapsed = Math.min(transition.duration, elapsed)
        if (transition.duration - transition.elapsed < 1e-8) transition.elapsed = transition.duration
        const t = transition.elapsed / transition.duration
        const ease = t * t * (3 - 2 * t)
        const quaternion = transition.quaternion.clone().slerp(this.cam.quaternion, ease)
        const zoom = transition.zoom + (this.cam.zoom - transition.zoom) * ease
        // Blend the rendered view directly, then recover the native camera pivot.
        // Blending the pivot alone makes the changing rotation and zoom arc the view.
        const start = this.base.position.clone().add(transition.offset)
          .add(new THREE.Vector3(0, 0, transition.zoom).applyQuaternion(transition.quaternion))
        const end = this.cam.position.clone()
          .add(new THREE.Vector3(0, 0, this.cam.zoom).applyQuaternion(this.cam.quaternion))
        target = {
          position: start.lerp(end, ease).sub(new THREE.Vector3(0, 0, zoom).applyQuaternion(quaternion)),
          quaternion,
          zoom,
        }
        // Apply the eased pose exactly; keep native collision checks on every frame.
        this.control.camera.quaternion.copy(target.quaternion)
        this.control.camera.zoom = target.zoom
        if (t === 1) {
          this.cameraTransition = null
          if (transition.headOnly || transition.armsOnly) this.avatar?.setFirstPerson(this.firstPerson, { headOnly: this.firstPersonHeadOnly })
        }
      }
      if (this.world.camera.isOrthographicCamera) {
        // The isometric camera sits outside the scene; third-person wall sweeps
        // would pull it through foreground roofs and change the composition.
        this.control.camera.position.lerp(this.cam.position, 1 - Math.exp(-5 * delta))
        this.control.camera.quaternion.copy(this.cam.quaternion)
        this.control.camera.zoom = ISOMETRIC_DISTANCE
      } else {
        simpleCamLerp(this.world, this.control.camera, target, delta)
      }
      const nearBlend = clamp((this.control.camera.zoom - THIRD_PERSON_MIN_ZOOM) / CAMERA_NEAR_BLEND_RANGE, 0, 1)
      const near = CAMERA_CLOSE_NEAR + (CAMERA_DEFAULT_NEAR - CAMERA_CLOSE_NEAR) * nearBlend
      if (this.world.camera.near !== near) {
        this.world.camera.near = near
        this.world.camera.updateProjectionMatrix()
      }
    }
    if (this.avatar) {
      const matrix = this.avatar.getBoneTransform('head')
      if (matrix) this.aura.position.setFromMatrixPosition(matrix)
    }
  }

  crossPortal(transform) {
    if (this.cameraTransition?.headOnly || this.cameraTransition?.armsOnly) this.avatar?.setFirstPerson(this.firstPerson, { headOnly: this.firstPersonHeadOnly })
    this.cameraTransition = null
    const rotation = new THREE.Quaternion().setFromRotationMatrix(transform)
    const position = this.base.position.clone().applyMatrix4(transform)
    this.controller.teleport(position)
    this.base.position.copy(position)
    this.base.quaternion.premultiply(rotation)
    this.velocity.applyQuaternion(rotation)
    this.moveDir.applyQuaternion(rotation)
    this.flyDir.applyQuaternion(rotation)
    this.gaze.applyQuaternion(rotation)
    this.platform.actor = null
    this.grounded = false
    this.groundNormal.set(0, 1, 0)
    this.cam.position.applyMatrix4(transform)
    this.cam.quaternion.premultiply(rotation)
    this.control.camera.position.applyMatrix4(transform)
    this.control.camera.quaternion.premultiply(rotation)
    if (this.isXR) {
      this.xrRig.position.applyMatrix4(transform)
      this.xrRig.quaternion.premultiply(rotation)
      this.hmdLast.applyQuaternion(rotation)
      this.xrRig.updateMatrixWorld(true)
    }
    this.base.updateTransform()
    this.world.network.send('entityModified', {
      id: this.data.id,
      p: position.toArray(),
      q: this.base.quaternion.toArray(),
      t: true,
    })
  }

  updateZoom(delta) {
    if (!this.isXR) {
      const zoomDelta = -this.control.scrollDelta.value * ZOOM_SPEED * delta
      if (zoomDelta !== 0) {
        const now = this.world.time
        if (this.firstPerson) {
          if (zoomDelta > 0) {
            this.cam.zoom = THIRD_PERSON_MIN_ZOOM
            this.zoomExitPending = true
            this.firstPerson = false
            this.firstPersonHeadOnly = false
            this.avatar?.setFirstPerson(false, { headOnly: false })
            if (this.avatar) this.avatar.visible = true
          }
        } else if (this.zoomExitPending && zoomDelta > 0 && now - this.lastZoomAt < FIRST_PERSON_SCROLL_DELAY) {
          // Consume the rest of the gesture that exited first person.
        } else if (
          zoomDelta < 0 &&
          this.cam.zoom <= THIRD_PERSON_MIN_ZOOM &&
          now - this.lastZoomAt >= FIRST_PERSON_SCROLL_DELAY
        ) {
          this.cam.zoom = 0
          this.firstPerson = true
          this.firstPersonHeadOnly = false
          if (this.avatar) this.avatar.visible = true
          this.avatar?.setFirstPerson(true, { headOnly: false })
        } else {
          this.zoomExitPending = false
          this.cam.zoom = clamp(this.cam.zoom + zoomDelta, THIRD_PERSON_MIN_ZOOM, MAX_ZOOM)
        }
        this.lastZoomAt = now
      }
    }
  }

  getCamera() {
    return {
      quaternion: this.cam.quaternion.clone(),
      zoom: this.cam.zoom,
      firstPerson: this.firstPerson,
      headOnly: !!this.firstPersonHeadOnly,
    }
  }

  // Set the native view once; ordinary player input and collision remain active.
  setCamera({ target, quaternion: orientation, firstPerson = false, headOnly = false, zoom = THIRD_PERSON_MIN_ZOOM, duration = 0, armsOnly = false } = {}) {
    const direction = orientation
      ? [orientation.x, orientation.y, orientation.z, orientation.w]
      : target && [target.x, target.y, target.z]
    if (this.isXR || !direction || ![...direction, zoom, duration].every(Number.isFinite) || duration < 0) return false
    if (typeof headOnly !== 'boolean' || typeof armsOnly !== 'boolean') return false
    if (orientation && direction.every(value => value === 0)) return false
    // Start at the rendered eyes, retaining their visibility mask until the
    // camera has eased outside the head instead of jumping to the shoulder.
    const keepHeadHidden = duration > 0 && !firstPerson &&
      ((this.firstPerson && this.firstPersonHeadOnly) || !!this.cameraTransition?.headOnly)
    const keepArmsOnly = duration > 0 && armsOnly
    this.cameraTransition =
      duration > 0
        ? {
            elapsed: 0,
            startedAt: this.world.time,
            duration: Math.min(duration, 2),
            offset: this.control.camera.position.clone().sub(this.base.position),
            quaternion: this.control.camera.quaternion.clone(),
            zoom: this.control.camera.zoom,
            headOnly: keepHeadHidden,
            armsOnly: keepArmsOnly,
          }
        : null
    this.firstPerson = !!firstPerson
    this.firstPersonHeadOnly = this.firstPerson && headOnly
    if (keepArmsOnly) {
      this.avatar?.setFirstPerson(true, { headOnly: false, armsOnly: true })
    } else {
      this.avatar?.setFirstPerson(this.firstPerson || keepHeadHidden, { headOnly: this.firstPersonHeadOnly || keepHeadHidden })
    }
    if (this.avatar) this.avatar.visible = true
    this.cam.zoom = firstPerson ? 0 : clamp(zoom, THIRD_PERSON_MIN_ZOOM, MAX_ZOOM)
    const eye = this.base.position.clone().add(new THREE.Vector3(0, this.camHeight, 0))
    if (firstPerson && this.getAnchorMatrix?.() && this.avatar) {
      getAvatarEyePosition(this.avatar, eye) ||
        getAvatarCameraFocus(this.avatar, this.avatar.getHeight(), eye, this.cameraFocusBounds)
    }
    const rotation = new THREE.Euler(0, 0, 0, 'YXZ')
    const quaternion = new THREE.Quaternion()
    const pivot = eye.clone()
    if (orientation) {
      quaternion.copy(orientation).normalize()
      rotation.setFromQuaternion(quaternion, 'YXZ')
      if (!firstPerson) pivot.add(new THREE.Vector3(Math.cos(rotation.y), 0, -Math.sin(rotation.y)).multiplyScalar(0.3))
    } else if (firstPerson) {
      const look = new THREE.Vector3().subVectors(target, eye)
      rotation.set(Math.atan2(look.y, Math.hypot(look.x, look.z)), Math.atan2(-look.x, -look.z), 0, 'YXZ')
      quaternion.setFromEuler(rotation)
    }
    // Account for the native shoulder offset and zoom when looking at the target.
    for (let i = 0; !orientation && !firstPerson && i < 12; i++) {
      pivot.copy(eye).add(new THREE.Vector3(Math.cos(rotation.y), 0, -Math.sin(rotation.y)).multiplyScalar(0.3))
      const view = pivot.clone().add(new THREE.Vector3(0, 0, this.cam.zoom).applyQuaternion(quaternion))
      const look = new THREE.Vector3().subVectors(target, view)
      rotation.set(Math.atan2(look.y, Math.hypot(look.x, look.z)), Math.atan2(-look.x, -look.z), 0, 'YXZ')
      quaternion.setFromEuler(rotation)
    }
    this.cam.position.copy(pivot)
    this.cam.quaternion.copy(quaternion)
    if (!this.cameraTransition) {
      this.control.camera.position.copy(pivot)
      this.control.camera.quaternion.copy(quaternion)
      this.control.camera.zoom = this.cam.zoom
    }
    return true
  }

  teleport({ position, rotationY }) {
    // Server corrections do not interrupt a first-person view of a predicted visual root.
    const predictedView = this.firstPerson && this.avatar?._scriptedPose?.root && this.cameraTransition?.armsOnly
    if (!predictedView) {
      if (this.cameraTransition?.headOnly || this.cameraTransition?.armsOnly) this.avatar?.setFirstPerson(this.firstPerson, { headOnly: this.firstPersonHeadOnly })
      this.cameraTransition = null
    }
    this.portalTraversal = null
    if (Array.isArray(position)) position = teleportPosition.fromArray(position)
    if (!readVec3(position, teleportPosition, '[player] teleport position must be Vector3')) return
    position = teleportPosition
    // Server recovery can arrive while the initial scene is still preloading.
    if (!this.controller || !this.control) {
      this.pendingTeleport = { position: position.toArray(), rotationY }
      return
    }
    const hasRotation = Number.isFinite(rotationY)
    // snap to position
    this.controller.teleport(position)
    this.velocity.set(0, 0, 0)
    this.grounded = false
    this.falling = false
    this.fallTimer = 0
    this.fallDistance = 0
    this.platform.actor = null
    this.base.position.copy(this.controller.position)
    if (hasRotation) this.base.rotation.y = rotationY
    // send network update
    this.world.network.send('entityModified', {
      id: this.data.id,
      p: this.base.position.toArray(),
      q: this.base.quaternion.toArray(),
      t: true,
    })
    // snap camera
    this.cam.position.copy(this.base.position)
    this.cam.position.y += this.camHeight
    if (hasRotation) this.cam.rotation.y = rotationY
    this.control.camera.position.copy(this.cam.position)
    this.control.camera.quaternion.copy(this.cam.quaternion)
  }

  setEffect(effect, onEnd) {
    const safe = sanitizePlayerSelfModify({ ef: effect }, this.data.id)
    if (!safe || !Object.prototype.hasOwnProperty.call(safe, 'ef')) return
    effect = safe.ef
    if (this.data.effect === effect) return
    if (this.data.effect) {
      this.data.effect = null
      this.onEffectEnd?.()
      this.onEffectEnd = null
    }
    this.data.effect = effect
    this.onEffectEnd = onEnd
    this.applySeatPose()
    this.world.emit('player', this)
    // send network update
    this.world.network.send('entityModified', {
      id: this.data.id,
      ef: effect,
    })
  }

  setSpeaking(speaking) {
    if (this.speaking === speaking) return
    if (speaking && this.isMuted()) return
    this.speaking = speaking
  }

  push(force) {
    force = v1.fromArray(force)
    // squash vertical to emulate what our huge horizontal drag coefficient does
    // force.y *= 0.1
    // add to any existing push
    if (this.pushForce) {
      this.pushForce.add(force)
    }
    // otherwise start push
    else {
      this.pushForce = force.clone()
      this.pushForceInit = false
    }
  }

  setName(name) {
    name = sanitizeName(name)
    if (name === undefined) return
    this.modify({ name })
    this.world.network.send('entityModified', { id: this.data.id, name })
  }

  setSessionAvatar(avatar) {
    this.data.sessionAvatar = avatar
    this.applyAvatar()
    this.world.network.send('entityModified', {
      id: this.data.id,
      sessionAvatar: avatar,
    })
  }

  chat(msg) {
    this.updateBubble()
    this.nametag.active = false
    this.bubbleText.value = msg
    this.bubble.active = true
    clearTimeout(this.chatTimer)
    this.chatTimer = setTimeout(() => {
      this.bubble.active = false
      this.nametag.active = true
    }, 5000)
  }

  modify(data) {
    if (Object.hasOwn(data, 'x')) this.data.x = data.x
    let avatarChanged
    let changed
    if (data.hasOwnProperty('name')) {
      this.data.name = data.name
      this.world.emit('name', { playerId: this.data.id, name: this.data.name })
      changed = true
    }
    if (data.hasOwnProperty('health')) {
      this.data.health = data.health
      this.nametag.health = data.health
      this.world.events.emit('health', { playerId: this.data.id, health: data.health })
      console.log('modify', data.health)
      // changed = true
    }
    if (data.hasOwnProperty('avatar')) {
      this.data.avatar = data.avatar
      avatarChanged = true
      changed = true
    }
    if (data.hasOwnProperty('sessionAvatar')) {
      this.data.sessionAvatar = data.sessionAvatar
      avatarChanged = true
      changed = true
    }
    if (data.hasOwnProperty('ef')) {
      if (this.data.effect) {
        this.data.effect = null
        this.onEffectEnd?.()
        this.onEffectEnd = null
      }
      this.data.effect = data.ef
      changed = true
    }
    if (Object.hasOwn(data, 'seatPose')) {
      this.data.seatPose = data.seatPose
      changed = true
    }
    if (data.hasOwnProperty('rank')) {
      this.data.rank = data.rank
      this.world.emit('rank', { playerId: this.data.id, rank: this.data.rank })
      changed = true
    }
    if (avatarChanged) {
      this.applyAvatar()
    }
    if (avatarChanged || Object.hasOwn(data, 'ef') || Object.hasOwn(data, 'seatPose')) {
      this.applySeatPose()
    }
    if (changed) {
      this.world.emit('player', this)
    }
  }
}
