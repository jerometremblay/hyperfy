import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import * as THREE from 'three'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./cloneAvatarScene.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { cloneAvatarScene } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

test('clones a skinned avatar with its detached skeleton roots independently', () => {
  const parent = new THREE.Scene()
  const scene = new THREE.Group()
  scene.name = 'avatar'
  const root = new THREE.Bone()
  root.name = 'RigRoot'
  const hips = new THREE.Bone()
  hips.name = 'Hips'
  root.add(hips)
  const mesh = new THREE.SkinnedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())
  mesh.bind(new THREE.Skeleton([root, hips]))
  scene.add(root, mesh)
  parent.add(scene)
  scene.updateMatrixWorld(true)
  root.updateMatrixWorld(true)
  scene.remove(root)

  const { scene: clonedScene, detachedRoots } = cloneAvatarScene(scene)
  const clonedMesh = clonedScene.children.find(child => child.isSkinnedMesh)
  const clonedRoot = clonedMesh.skeleton.bones[0]
  const clonedHips = clonedMesh.skeleton.bones[1]

  assert.notEqual(clonedScene, scene)
  assert.notEqual(clonedMesh, mesh)
  assert.notEqual(clonedRoot, root)
  assert.notEqual(clonedHips, hips)
  assert.equal(clonedRoot.parent, null)
  assert.equal(root.parent, null)
  assert.deepEqual(detachedRoots, [clonedRoot])
  assert.equal(clonedMesh.geometry, mesh.geometry)
  assert.equal(clonedMesh.material, mesh.material)

  clonedHips.rotation.x = 0.5
  assert.equal(hips.rotation.x, 0)
})
