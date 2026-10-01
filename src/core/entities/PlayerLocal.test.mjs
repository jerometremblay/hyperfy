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
const { PlayerLocal } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

test('marks XR head calibration pending when applying a seated pose', () => {
  let appliedPose
  const player = {
    data: { effect: { anchorId: 'chair:seat' } },
    isXR: true,
    xrHeadCalibrationPending: false,
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

test('uses the posed head as the desktop seated camera pivot', () => {
  globalThis.PHYSX = { PxSphereGeometry: class {} }

  const bodyScene = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 0.6))
  body.position.y = 0.75
  bodyScene.add(body)
  bodyScene.updateMatrixWorld(true)

  const headMatrix = new THREE.Matrix4().makeTranslation(-1, 1.1, 0)
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
    capsule: { getGlobalPose: () => ({}) },
    capsuleHandle: { snap() {} },
    getAnchorMatrix: () => anchor,
    avatar: {
      instance: { raw: { scene: bodyScene } },
      getBoneTransform: () => headMatrix,
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

  assert.ok(Math.abs(player.cam.position.x - -1) < 1e-8)
  assert.ok(Math.abs(player.cam.position.y - 1.1) < 1e-8)
})
