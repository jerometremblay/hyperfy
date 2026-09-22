import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import * as THREE from 'three'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./poseEditorMath.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { clampBoneRotation, getBoneRotationEuler, getMirroredBoneName, mirrorNormalizedRotation, solveTwoBoneIK } =
  await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)

test('mirrors humanoid names and normalized rotations across the sagittal plane', () => {
  assert.equal(getMirroredBoneName('leftUpperArm'), 'rightUpperArm')
  assert.equal(getMirroredBoneName('rightIndexIntermediate'), 'leftIndexIntermediate')
  assert.equal(getMirroredBoneName('spine'), null)

  const source = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, -0.4, 0.2)).toArray()
  const mirrored = new THREE.Quaternion().fromArray(mirrorNormalizedRotation(source))
  assert.ok(Math.abs(mirrored.x - new THREE.Quaternion().fromArray(source).x) < 1e-8)
  assert.ok(Math.abs(mirrored.y + new THREE.Quaternion().fromArray(source).y) < 1e-8)
  assert.ok(Math.abs(mirrored.z + new THREE.Quaternion().fromArray(source).z) < 1e-8)
})

test('joint limits clamp normalized rotations while the limit switch can bypass them', () => {
  const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.8, 0, 0)).toArray()
  const clamped = clampBoneRotation('leftLowerArm', rotation)
  assert.ok(Math.abs(getBoneRotationEuler(clamped).x - -10) < 1e-6)
  assert.ok(
    Math.abs(getBoneRotationEuler(clampBoneRotation('leftLowerArm', rotation, false)).x - (-0.8 * 180) / Math.PI) < 1e-6
  )
})

test('lower-leg limits allow downward knee flexion but prevent upward bending', () => {
  const downward = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.8, 0, 0)).toArray()
  const upward = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.8, 0, 0)).toArray()

  for (const name of ['leftLowerLeg', 'rightLowerLeg']) {
    assert.ok(Math.abs(getBoneRotationEuler(clampBoneRotation(name, downward)).x - (-0.8 * 180) / Math.PI) < 1e-6)
    assert.ok(Math.abs(getBoneRotationEuler(clampBoneRotation(name, upward)).x) < 1e-6)
  }
})

test('two-bone IK moves a limb endpoint to a reachable local-space target', () => {
  const scene = new THREE.Group()
  const upper = new THREE.Bone()
  const lower = new THREE.Bone()
  const hand = new THREE.Bone()
  lower.position.x = 1
  hand.position.x = 1
  upper.add(lower)
  lower.add(hand)
  scene.add(upper)
  scene.updateMatrixWorld(true)

  assert.equal(solveTwoBoneIK(scene, upper, lower, hand, [0, 1.5, 0], [0, 0, 1]), true)
  scene.updateMatrixWorld(true)
  assert.ok(hand.getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(0, 1.5, 0)) < 1e-5)
})
