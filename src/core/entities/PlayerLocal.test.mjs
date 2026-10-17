import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./PlayerLocal.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { PlayerLocal, getPlatformActor } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

test('does not carry the player with an app that is being moved', () => {
  const actor = {}
  const movingApp = { data: { mover: 'builder-1' } }
  const stationaryApp = { data: { mover: null } }
  const movingHit = { handle: { actor, node: { ctx: { entity: movingApp } } } }
  const stationaryHit = { handle: { actor, node: { ctx: { entity: stationaryApp } } } }

  assert.equal(getPlatformActor(movingHit), null)
  assert.equal(getPlatformActor(stationaryHit), actor)
})

test('applying a seated pose recalibrates desktop eyes and XR head tracking', () => {
  let appliedPose
  const player = {
    data: { effect: { anchorId: 'chair:seat' } },
    isXR: true,
    xrHeadCalibrationPending: false,
    seatedEyeOffset: new THREE.Vector3(1, 2, 3),
    avatar: {
      position: { set() {} },
      quaternion: { set() {} },
      setPoseOverride(pose) {
        appliedPose = pose
      },
    },
    getAvatarUrl: () => 'asset://avatar.vrm',
  }

  PlayerLocal.prototype.applySeatPose.call(player)

  assert.ok(appliedPose)
  assert.equal(player.xrHeadCalibrationPending, true)
  assert.equal(player.xrHeadRecenterPending, true)
  assert.equal(player.seatedEyeOffset, null)
})

test('re-centers XR yaw to the seated avatar head', () => {
  const camera = new THREE.PerspectiveCamera()
  camera.position.y = 1.6
  camera.rotation.y = Math.PI / 2
  camera.updateMatrixWorld(true)

  const headMatrix = new THREE.Matrix4().makeRotationY(0)
  headMatrix.setPosition(0, 0.9, 0)
  let turnAngle
  const player = {
    avatar: { getBoneTransform: () => headMatrix },
    world: { camera },
    base: { position: new THREE.Vector3() },
    xrHeadOffset: new THREE.Vector3(),
    xrHeadCalibrationPending: true,
    xrHeadRecenterPending: true,
    turnXRRigAtPlayer(angle) {
      turnAngle = angle
    },
  }

  const calibrated = PlayerLocal.prototype.calibrateXRHead.call(player)

  assert.equal(calibrated, true)
  assert.ok(Math.abs(turnAngle + 90) < 1e-6)
})

test('sends the absolute XR wrist orientation without startup calibration', () => {
  const scene = new THREE.Object3D()
  scene.updateMatrixWorld(true)
  const xrRig = new THREE.Object3D()
  xrRig.updateMatrixWorld(true)
  const initialWrist = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
  const verticalFlip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI)
  const currentWrist = verticalFlip.clone().multiply(initialWrist)
  const source = { joints: { wrist: { p: [0, 0, 0], q: initialWrist.toArray() } } }
  let appliedPose
  const player = {
    isXR: true,
    avatar: {
      instance: { raw: { scene } },
      setHandTrackingPose(pose) {
        appliedPose = pose
      },
    },
    world: { controls: { xrHands: { left: source, right: null } } },
    xrRig,
    xrHandPose: null,
  }

  PlayerLocal.prototype.updateXRHandPose.call(player)
  source.joints.wrist.q = currentWrist.toArray()
  PlayerLocal.prototype.updateXRHandPose.call(player)

  const mappedFlip = new THREE.Quaternion().fromArray(appliedPose.left.w)
  assert.ok(mappedFlip.angleTo(currentWrist) < 1e-6)
})

test('sends absolute finger orientations on the first frame and includes metacarpal motion', () => {
  const scene = new THREE.Object3D()
  scene.updateMatrixWorld(true)
  const xrRig = new THREE.Object3D()
  xrRig.updateMatrixWorld(true)
  const parentRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
  const initialFinger = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 4)
  const fingerCurl = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 3)
  const source = {
    joints: {
      wrist: { p: [0, 0, 0], q: [0, 0, 0, 1] },
      'index-finger-metacarpal': { p: [0, 0, 0], q: parentRotation.toArray() },
      'index-finger-phalanx-proximal': {
        p: [0, 0, -0.03],
        q: parentRotation.clone().multiply(initialFinger).toArray(),
      },
      'index-finger-phalanx-intermediate': {
        p: [0, 0, -0.06],
        q: [0, 0, 0, 1],
      },
    },
  }
  let appliedPose
  const player = {
    isXR: true,
    avatar: {
      instance: { raw: { scene } },
      setHandTrackingPose(pose) {
        appliedPose = pose
      },
    },
    world: { controls: { xrHands: { left: source, right: null } } },
    xrRig,
    xrHandPose: null,
  }

  PlayerLocal.prototype.updateXRHandPose.call(player)
  source.joints['index-finger-phalanx-proximal'].q = parentRotation
    .clone()
    .multiply(fingerCurl)
    .multiply(initialFinger)
    .toArray()
  PlayerLocal.prototype.updateXRHandPose.call(player)

  const mappedFinger = new THREE.Quaternion().fromArray(appliedPose.left.f.IndexProximal)
  const expectedFinger = parentRotation.clone().multiply(fingerCurl).multiply(initialFinger)
  assert.ok(mappedFinger.angleTo(expectedFinger) < 1e-6)
  assert.equal(appliedPose.left.kind, 'hand')
  assert.equal(appliedPose.left.i, undefined)
  assert.equal(appliedPose.left.pi, undefined)
})

test('uses controller grip poses when hand tracking is unavailable', () => {
  const scene = new THREE.Object3D()
  scene.updateMatrixWorld(true)
  const xrRig = new THREE.Object3D()
  xrRig.updateMatrixWorld(true)
  const gripPosition = new THREE.Vector3(-0.25, 1.2, -0.4)
  const gripQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.4)
  let appliedPose
  const player = {
    isXR: true,
    avatar: {
      instance: { raw: { scene } },
      setHandTrackingPose(pose) {
        appliedPose = pose
      },
    },
    world: { controls: { xrHands: { left: null, right: null } } },
    control: {
      xrLeftGripPose: { valid: true, position: gripPosition, quaternion: gripQuaternion },
      xrRightGripPose: { valid: false },
    },
    xrRig,
    xrHandPose: null,
  }

  PlayerLocal.prototype.updateXRHandPose.call(player)

  assert.deepEqual(appliedPose.left.p, gripPosition.toArray())
  assert.deepEqual(appliedPose.left.w, gripQuaternion.toArray())
  assert.equal(appliedPose.left.kind, 'controller')
  assert.equal(appliedPose.left.i, undefined)
  assert.equal(appliedPose.left.d, undefined)
  assert.equal(appliedPose.left.pi, undefined)
  assert.deepEqual(appliedPose.left.f, {})
})

test('keeps the seated shoulder camera aligned and the first-person eye reference stable', () => {
  globalThis.PHYSX = { PxSphereGeometry: class {} }

  const bodyScene = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 0.6))
  body.position.y = 0.75
  bodyScene.add(body)
  bodyScene.updateMatrixWorld(true)

  const headMatrix = new THREE.Matrix4().makeTranslation(-1, 1.1, 0)
  const eyeMatrix = new THREE.Matrix4()
  const basePosition = new THREE.Vector3()
  basePosition.toPxTransform = () => {}
  const anchor = new THREE.Matrix4()
  const camera = {
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    zoom: 1.5,
  }
  const player = {
    world: {
      xr: { session: null },
      physics: { sweep: () => null },
    },
    isXR: false,
    firstPerson: false,
    poseEditorActive: false,
    base: {
      position: basePosition,
      quaternion: new THREE.Quaternion(),
    },
    controller: { teleport() {} },
    getAnchorMatrix: () => anchor,
    avatar: {
      instance: { raw: { scene: bodyScene } },
      getBoneTransform(name) {
        if (name === 'leftEye') return eyeMatrix.makeTranslation(-1.03, 1.18, 0.08)
        if (name === 'rightEye') return eyeMatrix.makeTranslation(-0.97, 1.18, 0.08)
        return name === 'head' ? headMatrix : null
      },
      getHeight: () => 2,
    },
    aura: { position: new THREE.Vector3() },
    cam: {
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      zoom: 1.5,
    },
    control: { camera },
    cameraFocus: new THREE.Vector3(),
    cameraFocusBounds: new THREE.Box3(),
  }

  PlayerLocal.prototype.lateUpdate.call(player, 1 / 60)

  assert.ok(Math.abs(player.cam.position.x - -0.7) < 1e-8)
  assert.ok(Math.abs(player.cam.position.y - 1.1) < 1e-8)
  assert.ok(Math.abs(player.cam.position.z) < 1e-8)

  player.cam.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
  PlayerLocal.prototype.lateUpdate.call(player, 1 / 60)

  assert.ok(Math.abs(player.cam.position.x - -1) < 1e-8)
  assert.ok(Math.abs(player.cam.position.y - 1.1) < 1e-8)
  assert.ok(Math.abs(player.cam.position.z - -0.3) < 1e-8)

  player.firstPerson = true
  player.camHeight = 1.6
  PlayerLocal.prototype.lateUpdate.call(player, 1 / 60)
  assert.deepEqual(player.cam.position.toArray(), [-1, 1.18, 0.08])

  const seatedEyePosition = player.cam.position.clone()
  let frame = 0
  player.avatar.getBoneTransform = name => {
    if (name === 'leftEye') return eyeMatrix.makeTranslation(-1.03, 1.18 + Math.sin(frame) * 0.02, 0.08)
    if (name === 'rightEye') return eyeMatrix.makeTranslation(-0.97, 1.18 + Math.sin(frame) * 0.02, 0.08)
    return name === 'head' ? headMatrix : null
  }
  for (frame = 1; frame <= 30; frame++) {
    PlayerLocal.prototype.lateUpdate.call(player, 1 / 60)
    assert.deepEqual(
      player.cam.position.toArray(),
      seatedEyePosition.toArray(),
      'head idle animation must not shake the seated camera'
    )
  }

  // A moving seat still carries the stable eye reference with it.
  anchor.makeTranslation(2, 0, 0)
  PlayerLocal.prototype.lateUpdate.call(player, 1 / 60)
  assert.deepEqual(player.cam.position.toArray(), [1, 1.18, 0.08])
  anchor.makeRotationY(Math.PI / 2).setPosition(2, 0, 0)
  PlayerLocal.prototype.lateUpdate.call(player, 1 / 60)
  assert.ok(player.cam.position.distanceTo(new THREE.Vector3(2.08, 1.18, 1)) < 1e-8)

  // Changing pose recalibrates the reference rather than preserving the old head location.
  player.seatedEyeOffset = null
  anchor.identity()
  player.avatar.getBoneTransform = name => (name === 'head' ? headMatrix : null)
  PlayerLocal.prototype.lateUpdate.call(player, 1 / 60)
  assert.deepEqual(player.cam.position.toArray(), [-1, 1.1, 0])

  player.getAnchorMatrix = () => null
  PlayerLocal.prototype.lateUpdate.call(player, 1 / 60)
  assert.deepEqual(player.cam.position.toArray(), [0, 1.6, 0])
})

test('continuous portal travel preserves momentum, body facing, camera pitch and XR offsets', () => {
  const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
  const transform = new THREE.Matrix4().compose(new THREE.Vector3(10, 3, 0), rotation, new THREE.Vector3(1, 1, 1))
  const base = new THREE.Object3D()
  base.position.set(0, -0.8, 0)
  base.updateTransform = () => base.updateMatrixWorld(true)
  const cam = new THREE.Object3D()
  cam.rotation.reorder('YXZ')
  cam.rotation.set(-0.4, 0.2, 0)
  cam.position.set(0, 0.8, 0)
  const camera = { position: cam.position.clone(), quaternion: cam.quaternion.clone() }
  const messages = []
  let teleported
  const player = {
    base,
    controller: {
      teleport: position => {
        teleported = position.clone()
      },
    },
    velocity: new THREE.Vector3(1, -2, 0),
    moveDir: new THREE.Vector3(0, 0, -1),
    flyDir: new THREE.Vector3(0, 0, -1),
    gaze: new THREE.Vector3(0, 0, -1),
    platform: { actor: {} },
    grounded: true,
    groundNormal: new THREE.Vector3(0, 1, 0),
    cam,
    control: { camera },
    isXR: true,
    xrRig: new THREE.Object3D(),
    hmdLast: new THREE.Vector3(0.2, 0, 0),
    world: { network: { send: (...args) => messages.push(args) } },
    data: { id: 'player' },
  }
  PlayerLocal.prototype.crossPortal.call(player, transform)
  assert.ok(teleported.distanceTo(new THREE.Vector3(10, 2.2, 0)) < 1e-10)
  assert.ok(player.velocity.distanceTo(new THREE.Vector3(0, -2, -1)) < 1e-10)
  assert.ok(Math.abs(cam.rotation.x + 0.4) < 1e-10)
  assert.ok(camera.position.distanceTo(new THREE.Vector3(10, 3.8, 0)) < 1e-10)
  assert.ok(player.hmdLast.distanceTo(new THREE.Vector3(0, 0, -0.2)) < 1e-10)
  assert.equal(player.platform.actor, null)
  assert.equal(player.grounded, false)
  assert.equal(messages[0][0], 'entityModified')
  assert.equal(messages[0][1].t, true)
})
