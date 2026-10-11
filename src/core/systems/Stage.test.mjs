import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const stageBundle = await build({
  stdin: {
    contents: `export { Stage } from './Stage.js'; export * as THREE from '../extras/three.js';`,
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { Stage, THREE } = await import(
  `data:text/javascript;base64,${Buffer.from(stageBundle.outputFiles[0].contents).toString('base64')}`
)

const skinnedMeshBundle = await build({
  entryPoints: [fileURLToPath(new URL('../nodes/SkinnedMesh.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { SkinnedMesh } = await import(
  `data:text/javascript;base64,${Buffer.from(skinnedMeshBundle.outputFiles[0].contents).toString('base64')}`
)

function createStage() {
  const world = { setupMaterial() {} }
  const stage = new Stage(world)
  world.network = { isServer: false }
  world.rig = new THREE.Object3D()
  world.stage = stage
  stage.init({
    viewport: {
      getBoundingClientRect() {
        return { left: 0, top: 0, width: 100, height: 100 }
      },
    },
  })
  return stage
}

function createSkinnedObject() {
  const object = new THREE.Group()
  const bone = new THREE.Bone()
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const skinIndices = new Uint16Array(geometry.attributes.position.count * 4)
  const skinWeights = new Float32Array(geometry.attributes.position.count * 4)
  for (let i = 0; i < geometry.attributes.position.count; i++) {
    skinWeights[i * 4] = 1
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4))
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4))
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial())

  object.add(bone)
  object.add(mesh)
  mesh.bind(new THREE.Skeleton([bone]))
  object.updateMatrixWorld(true)
  return object
}

function raycast(stage, x = 0) {
  return stage.raycast(new THREE.Vector3(x, 0, 5), new THREE.Vector3(0, 0, -1))
}

test('skinned mesh models are selectable and follow entity movement', () => {
  const stage = createStage()
  const entity = { id: 'entity-1' }
  const node = new SkinnedMesh({
    object3d: createSkinnedObject(),
    animations: [],
  })

  node.activate({ world: stage.world, entity })

  let hits = raycast(stage)
  assert.equal(hits[0]?.node, node)
  assert.equal(hits[0]?.getEntity(), entity)

  node.position.x = 3
  stage.clean()

  hits = raycast(stage, 3)
  assert.equal(hits[0]?.node, node)
  assert.equal(hits[0]?.getEntity(), entity)
  assert.equal(raycast(stage).length, 0)

  node.deactivate()
  assert.equal(raycast(stage, 3).length, 0)
})

function createLinkedBatch(stage) {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshStandardMaterial()
  const insert = x =>
    stage.insert({
      linked: true,
      geometry,
      material,
      castShadow: true,
      receiveShadow: true,
      node: { ctx: { entity: { id: `instance-${x}` } } },
      matrix: new THREE.Matrix4().makeTranslation(x, 0, 0),
    })
  return { insert, mesh: () => stage.models.values().next().value.iMesh }
}

function viewAt(x) {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 20)
  camera.position.set(x, 0, 5)
  camera.lookAt(x, 0, 0)
  camera.updateMatrixWorld(true)
  return new THREE.Frustum().setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  )
}

test('linked batches cull outside each camera and refresh bounds for late moves', () => {
  const stage = createStage()
  const batch = createLinkedBatch(stage)
  const handle = batch.insert(100)
  stage.update()
  const mesh = batch.mesh()
  assert.equal(mesh.frustumCulled, true)
  assert.equal(viewAt(0).intersectsObject(mesh), false)
  assert.equal(viewAt(100).intersectsObject(mesh), true)
  const oldSphere = mesh.boundingSphere

  // A node can move after Stage.update, before the main/shadow cameras render.
  handle.move(new THREE.Matrix4().makeTranslation(0, 0, 0))
  assert.equal(viewAt(0).intersectsObject(mesh), true)
  assert.equal(viewAt(100).intersectsObject(mesh), false)
  assert.notEqual(mesh.boundingSphere, oldSphere)
  stage.update()
  assert.equal(viewAt(0).intersectsObject(mesh), true)

  // Unchanged batches reuse their bounds, rather than scanning every instance.
  const sphere = mesh.boundingSphere
  stage.update()
  assert.equal(mesh.boundingSphere, sphere)
})

test('linked batch bounds follow growth, swap removal, emptying and reinsertion', () => {
  const stage = createStage()
  const batch = createLinkedBatch(stage)
  const handles = [batch.insert(0)]
  stage.update()
  const mesh = batch.mesh()
  assert.equal(viewAt(100).intersectsObject(mesh), false)

  // Exceed the initial buffer capacity (10), including a distant instance.
  for (let i = 1; i <= 11; i++) handles.push(batch.insert(i === 11 ? 100 : 0))
  stage.update()
  assert.equal(mesh.count, 12)
  assert.equal(viewAt(100).intersectsObject(mesh), true)
  const matrix = new THREE.Matrix4()
  mesh.getMatrixAt(11, matrix)
  assert.equal(matrix.elements[12], 100)

  handles[0].destroy() // Last, distant instance is swapped into index zero.
  stage.update()
  assert.equal(mesh.count, 11)
  assert.equal(viewAt(100).intersectsObject(mesh), true)
  handles[11].destroy()
  stage.update()
  assert.equal(mesh.count, 10)
  assert.equal(viewAt(100).intersectsObject(mesh), false)
  assert.equal(viewAt(0).intersectsObject(mesh), true)

  for (let i = 1; i <= 10; i++) handles[i].destroy()
  stage.update()
  assert.equal(mesh.parent, null)
  batch.insert(-100)
  stage.update()
  assert.equal(mesh.count, 1)
  assert.equal(viewAt(-100).intersectsObject(mesh), true)
  assert.equal(viewAt(0).intersectsObject(mesh), false)
})
