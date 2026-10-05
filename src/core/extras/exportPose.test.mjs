import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const bundle = await build({
  stdin: {
    contents: "export { exportPose } from './exportPose'; export { cloneAvatarScene } from './cloneAvatarScene'",
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { exportPose, cloneAvatarScene } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

// The browser exporter only needs this FileReader operation for texture-free GLBs.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => {
      this.result = result
      this.onloadend?.()
    })
  }
}

test('GLB roundtrip preserves edited skin and a reusable static animation without seat placement', async () => {
  const scene = new THREE.Group()
  scene.name = 'avatar'
  const hips = new THREE.Bone()
  hips.name = 'hips'
  hips.position.y = 1
  const hand = new THREE.Bone()
  hand.name = 'hand'
  hand.position.set(0.4, 0.5, 0)
  hips.add(hand)
  scene.add(hips)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 0, 0.4, 1.5, 0, 0, 1.5, 0], 3))
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute([0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4))
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4))
  const material = new THREE.ShaderMaterial()
  material.color = new THREE.Color('#83aacc')
  const mesh = new THREE.SkinnedMesh(geometry, material)
  scene.add(mesh)
  scene.updateMatrixWorld(true)
  mesh.bind(new THREE.Skeleton([hips, hand]))
  hips.rotation.x = 0.8
  hips.position.set(0.2, 0.7, -0.1)
  hand.rotation.z = 0.5
  scene.matrixAutoUpdate = false
  scene.matrix.makeTranslation(10, 20, 30)
  scene.userData = { previewOnly: true }
  scene.updateMatrixWorld(true)
  mesh.skeleton.update()
  const expectedVertex = mesh.getVertexPosition(1, new THREE.Vector3()).clone()
  const originalMatrix = scene.matrix.clone()
  const originalPose = hips.quaternion.clone()
  const originalInverse = mesh.skeleton.boneInverses[0].clone()

  const file = await exportPose({ cloneScene: cloneAvatarScene }, scene)
  assert.equal(file.name, 'sitting-pose.glb')
  assert.equal(file.type, 'model/gltf-binary')
  const data = await file.arrayBuffer()
  assert.equal(new DataView(data).getUint32(0, true), 0x46546c67)
  const gltf = await new GLTFLoader().parseAsync(data, '')
  assert.equal(gltf.animations.length, 1)
  assert.equal(gltf.animations[0].name, 'SittingPose')
  assert.equal(gltf.animations[0].duration, 1)
  assert.deepEqual(gltf.scene.getObjectByName('avatar').position.toArray(), [0, 0, 0])
  let exportedMesh
  gltf.scene.traverse(node => {
    if (node.isSkinnedMesh) exportedMesh = node
  })
  assert.ok(exportedMesh.material.isMeshStandardMaterial)
  for (const axis of ['r', 'g', 'b']) {
    assert.ok(Math.abs(exportedMesh.material.color[axis] - material.color[axis]) < 1e-6)
  }
  const exportedHips = gltf.scene.getObjectByName('hips')
  assert.ok(exportedHips.quaternion.clone().normalize().angleTo(originalPose) < 1e-6)
  const mixer = new THREE.AnimationMixer(gltf.scene)
  const action = mixer.clipAction(gltf.animations[0]).play()
  exportedHips.quaternion.identity()
  exportedHips.position.set(5, 5, 5)
  mixer.update(0.5)
  assert.ok(exportedHips.quaternion.clone().normalize().angleTo(originalPose) < 1e-6)
  assert.ok(exportedHips.position.distanceTo(hips.position) < 1e-6)
  gltf.scene.updateMatrixWorld(true)
  exportedMesh.skeleton.update()
  assert.ok(exportedMesh.getVertexPosition(1, new THREE.Vector3()).distanceTo(expectedVertex) < 1e-6)
  action.stop()
  assert.ok(scene.matrix.equals(originalMatrix))
  assert.ok(hips.quaternion.equals(originalPose))
  assert.ok(mesh.skeleton.boneInverses[0].equals(originalInverse))
  assert.equal(mesh.material, material)
  assert.deepEqual(scene.userData, { previewOnly: true })
})

test('export rejects models without skeletons', async () => {
  await assert.rejects(exportPose({ cloneScene: cloneAvatarScene }, new THREE.Group()), /exportable skeleton/)
})

test('export snapshots detached bones before later preview edits', async () => {
  const scene = new THREE.Group()
  const hips = new THREE.Bone()
  hips.name = 'hips'
  hips.position.set(0, 0.7, 0)
  hips.rotation.x = 0.4
  const mesh = new THREE.SkinnedMesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial())
  mesh.skeleton = new THREE.Skeleton([hips])
  scene.add(mesh)
  // The clone helper also handles the factory's detached skeleton roots.
  const pending = exportPose({ cloneScene: cloneAvatarScene }, scene)
  hips.position.y = 1.2
  hips.rotation.x = 1
  const gltf = await new GLTFLoader().parseAsync(await (await pending).arrayBuffer(), '')
  const exportedHips = gltf.scene.getObjectByName('hips')
  assert.equal(exportedHips.position.y, 0.7)
  assert.ok(Math.abs(new THREE.Euler().setFromQuaternion(exportedHips.quaternion).x - 0.4) < 1e-6)
  assert.equal(hips.parent, null)
  assert.equal(hips.position.y, 1.2)
})
