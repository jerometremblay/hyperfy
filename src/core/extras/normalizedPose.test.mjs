import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { VRMHumanoid } from '@pixiv/three-vrm'
import * as THREE from 'three'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./normalizedPose.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { applyNormalizedPose, createNormalizedPoseMapping, getNormalizedPose } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function createRig({
  rootRotation = [0, 0.4, 0],
  hipsPosition = [0, 1, 0],
  hipsRotation = [0.1, -0.2, 0.15],
  spinePosition = [0, 0.3, 0],
  spineRotation = [-0.1, 0, 0],
} = {}) {
  const scene = new THREE.Group()
  const rigRoot = new THREE.Bone()
  rigRoot.name = 'rig-root'
  rigRoot.rotation.set(...rootRotation)
  const hips = new THREE.Bone()
  hips.name = 'mixamorigHips'
  hips.position.set(...hipsPosition)
  hips.rotation.set(...hipsRotation)
  const spine = new THREE.Bone()
  spine.name = 'mixamorigSpine'
  spine.position.set(...spinePosition)
  spine.rotation.set(...spineRotation)
  rigRoot.add(hips)
  hips.add(spine)
  scene.add(rigRoot)
  scene.updateMatrixWorld(true)

  const normalizedRoot = new THREE.Object3D()
  const normalizedHips = new THREE.Object3D()
  const normalizedSpine = new THREE.Object3D()
  normalizedHips.position.fromArray(hipsPosition)
  normalizedSpine.position.fromArray(spinePosition)
  normalizedRoot.add(normalizedHips)
  normalizedHips.add(normalizedSpine)
  normalizedRoot.updateMatrixWorld(true)

  const humanoid = {
    humanBones: {
      hips: { node: hips },
      spine: { node: spine },
    },
    rawRestPose: {
      hips: { position: [0, 1, 0], rotation: hips.quaternion.toArray() },
      spine: { position: [0, 0.3, 0], rotation: spine.quaternion.toArray() },
    },
    getNormalizedBoneNode(name) {
      return { hips: normalizedHips, spine: normalizedSpine }[name] || null
    },
  }

  return { humanoid, hips, scene, spine }
}

test('captures and applies normalized bone rotations and hips translation', () => {
  const { humanoid, hips, scene, spine } = createRig()
  const mapping = createNormalizedPoseMapping(humanoid, scene)
  const before = getNormalizedPose(scene, mapping)
  assert.ok(new THREE.Quaternion().fromArray(before.hips.rotation).angleTo(new THREE.Quaternion()) < 1e-6)
  assert.ok(new THREE.Quaternion().fromArray(before.spine.rotation).angleTo(new THREE.Quaternion()) < 1e-6)
  assert.ok(new THREE.Vector3().fromArray(before.hips.position).length() < 1e-6)

  const target = {
    hips: {
      position: [0.08, -0.04, 0.12],
      rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, -0.15, 0.1)).toArray(),
    },
    spine: {
      rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.35, 0.1, 0.25)).toArray(),
    },
  }
  applyNormalizedPose(scene, mapping, target)
  const actual = getNormalizedPose(scene, mapping)

  assert.ok(
    new THREE.Quaternion()
      .fromArray(actual.hips.rotation)
      .angleTo(new THREE.Quaternion().fromArray(target.hips.rotation)) < 1e-6
  )
  assert.ok(
    new THREE.Quaternion()
      .fromArray(actual.spine.rotation)
      .angleTo(new THREE.Quaternion().fromArray(target.spine.rotation)) < 1e-6
  )
  assert.ok(
    new THREE.Vector3().fromArray(actual.hips.position).distanceTo(new THREE.Vector3(...target.hips.position)) < 1e-6
  )
  assert.notDeepEqual(hips.position.toArray(), [0, 1, 0])
  assert.notEqual(spine.quaternion.x, 0)
})

test('transfers a normalized pose across rigs with different rest rotations and proportions', () => {
  const source = createRig()
  const target = createRig({
    rootRotation: [0.2, -0.9, 0.35],
    hipsPosition: [0.08, 1.35, -0.04],
    hipsRotation: [-0.25, 0.45, -0.18],
    spinePosition: [0, 0.22, 0],
    spineRotation: [0.3, 0.1, -0.2],
  })
  const sourceMapping = createNormalizedPoseMapping(source.humanoid, source.scene)
  const targetMapping = createNormalizedPoseMapping(target.humanoid, target.scene)
  const requested = {
    hips: {
      position: [0.04, -0.12, 0.2],
      rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.28, 0.1, 0.08)).toArray(),
    },
    spine: {
      rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.35, 0.1, 0.25)).toArray(),
    },
  }

  applyNormalizedPose(source.scene, sourceMapping, requested)
  const portablePose = getNormalizedPose(source.scene, sourceMapping)
  applyNormalizedPose(target.scene, targetMapping, portablePose)
  const transferred = getNormalizedPose(target.scene, targetMapping)

  assert.ok(
    new THREE.Quaternion()
      .fromArray(transferred.hips.rotation)
      .angleTo(new THREE.Quaternion().fromArray(requested.hips.rotation)) < 1e-6
  )
  assert.ok(
    new THREE.Quaternion()
      .fromArray(transferred.spine.rotation)
      .angleTo(new THREE.Quaternion().fromArray(requested.spine.rotation)) < 1e-6
  )
  assert.ok(
    new THREE.Vector3(...transferred.hips.position).distanceTo(new THREE.Vector3(...requested.hips.position)) < 1e-6
  )
  assert.notDeepEqual(target.hips.position.toArray(), source.hips.position.toArray())
})

test('keeps hips translation relative to the avatar scene using the real VRM humanoid rig', () => {
  const scene = new THREE.Group()
  scene.position.set(3, 2, -4)
  scene.rotation.y = 0.5
  scene.scale.setScalar(1.7)

  const rigRoot = new THREE.Bone()
  rigRoot.name = 'RigRoot'
  rigRoot.position.set(0.1, 0.2, 0.3)
  rigRoot.rotation.z = 0.3
  const hips = new THREE.Bone()
  hips.name = 'Hips'
  hips.position.set(0, 1, 0)
  hips.rotation.set(0.1, -0.2, 0.15)
  const spine = new THREE.Bone()
  spine.name = 'Spine'
  spine.position.y = 0.3
  spine.rotation.x = -0.1
  rigRoot.add(hips)
  hips.add(spine)
  const mesh = new THREE.SkinnedMesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial())
  mesh.bind(new THREE.Skeleton([rigRoot, hips, spine]))
  scene.add(rigRoot, mesh)
  scene.updateMatrixWorld(true)

  const humanoid = new VRMHumanoid({ hips: { node: hips }, spine: { node: spine } })
  const mapping = createNormalizedPoseMapping(humanoid, scene)
  const sceneRotation = scene.getWorldQuaternion(new THREE.Quaternion())
  const expectedParentRotation = rigRoot.getWorldQuaternion(new THREE.Quaternion()).premultiply(sceneRotation.invert())
  assert.ok(
    new THREE.Quaternion().fromArray(mapping.bones.hips.parentWorldRotation).angleTo(expectedParentRotation) < 1e-6
  )

  // The live VRM factory detaches the skeleton root from the scene.
  scene.remove(rigRoot)
  rigRoot.updateMatrixWorld(true)
  const initialPose = getNormalizedPose(scene, mapping)
  assert.ok(new THREE.Vector3().fromArray(initialPose.hips.position).length() < 1e-6)

  const translation = [0.08, -0.04, 0.12]
  const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, -0.15, 0.1)).toArray()
  applyNormalizedPose(scene, mapping, { hips: { position: translation, rotation } })
  const actual = getNormalizedPose(scene, mapping)
  assert.ok(new THREE.Vector3().fromArray(actual.hips.position).distanceTo(new THREE.Vector3(...translation)) < 1e-6)
  assert.ok(
    new THREE.Quaternion().fromArray(actual.hips.rotation).angleTo(new THREE.Quaternion().fromArray(rotation)) < 1e-6
  )
})
