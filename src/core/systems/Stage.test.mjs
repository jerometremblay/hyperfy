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

test('camera clipping survives moves, swap removal and resizing without cutting unrelated instances', () => {
  const stage = createStage()
  const batch = createLinkedBatch(stage)
  const first = batch.insert(0)
  const second = batch.insert(1)
  stage.update()
  const mesh = batch.mesh()
  const ordinaryBuffer = mesh.instanceMatrix
  const restore = second.clipForCamera(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.25))
  const model = [...stage.models.values()][0]
  const clipped = model.items[1].cameraMesh
  assert.equal(clipped.parent, stage.scene)
  assert.equal(clipped.material.clippingPlanes[0].constant, 0.25)
  const matrix = new THREE.Matrix4()
  mesh.getMatrixAt(1, matrix)
  assert.equal(matrix.elements[0], 0)
  second.move(new THREE.Matrix4().makeTranslation(5, 0, 0))
  assert.equal(clipped.matrixWorld.elements[12], 5)
  first.destroy() // hidden second instance moves to slot zero
  stage.update()
  mesh.getMatrixAt(0, matrix)
  assert.equal(matrix.elements[0], 0)
  for (let i = 0; i < 12; i++) batch.insert(10 + i)
  stage.update()
  mesh.getMatrixAt(0, matrix)
  assert.equal(matrix.elements[0], 0)
  mesh.getMatrixAt(1, matrix)
  assert.equal(matrix.elements[12], 10)
  restore()
  assert.equal(clipped.parent, null)
  mesh.getMatrixAt(0, matrix)
  assert.equal(matrix.elements[0], 1)
  assert.equal(matrix.elements[12], 5)
  assert.notEqual(mesh.instanceMatrix, ordinaryBuffer, 'growth creates a new ordinary buffer')
  const destroyedRestore = second.clipForCamera(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.25))
  second.destroy()
  destroyedRestore()
  stage.update()
  mesh.getMatrixAt(0, matrix)
  assert.equal(matrix.elements[0], 1, 'destroyed hidden instance cannot alter its replacement')
  assert.ok(raycast(stage, 21).length)
})

test('camera and shadow instance draws keep separate identities and share the cached mask', () => {
  const stage = createStage()
  const batch = createLinkedBatch(stage)
  batch.insert(0)
  const handle = batch.insert(1)
  stage.update()
  const model = [...stage.models.values()][0]
  const source = batch.mesh()
  const originalMatrix = source.instanceMatrix
  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.25)
  const restore = handle.clipForCamera(plane)
  const cameraDraw = model.cameraBatch
  assert.ok(cameraDraw !== source, 'the native upload cache must not confuse camera and shadow draws')
  assert.ok(cameraDraw.instanceMatrix === model.cameraMatrix)
  assert.ok(cameraDraw.geometry === source.geometry && cameraDraw.material === source.material)
  assert.ok(cameraDraw.boundingSphere === source.boundingSphere)
  assert.equal(cameraDraw.castShadow, false)
  assert.equal(cameraDraw.receiveShadow, source.receiveShadow)
  assert.equal(cameraDraw.parent, stage.scene)
  assert.equal(source.visible, false)
  restore()
  assert.equal(source.visible, true)
  assert.ok(source.instanceMatrix === originalMatrix)
  assert.equal(cameraDraw.parent, null)
  const resumeRestore = handle.clipForCamera(plane)
  assert.ok(model.cameraBatch === cameraDraw, 'camera draw is cached across shadow and portal suspensions')
  handle.move(new THREE.Matrix4().makeTranslation(3, 0, 0))
  assert.ok(cameraDraw.boundingSphere === source.boundingSphere)
  resumeRestore()
  let disposed = false
  cameraDraw.addEventListener('dispose', () => {
    disposed = true
  })
  model.release()
  assert.equal(disposed, true)
  assert.equal(cameraDraw.parent, null)
})

test('clipped primitive draws retain per-instance color and emissive without batch shader attributes', () => {
  const stage = createStage()
  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshStandardMaterial()
  const handle = stage.insertLinked({
    geometry,
    material,
    uberShader: true,
    castShadow: true,
    receiveShadow: true,
    node: { ctx: { entity: { isApp: true } } },
    matrix: new THREE.Matrix4(),
  })
  handle.setColor('#3366ff')
  handle.setEmissive('#ff2200')
  handle.setEmissiveIntensity(2)
  stage.update()
  const restore = handle.clipForCamera(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.25))
  const model = [...stage.models.values()][0]
  const item = model.items[0]
  const draw = item.cameraMesh
  assert.equal(draw.material.color.getHexString(), '3366ff')
  assert.equal(draw.material.emissive.getHexString(), 'ff2200')
  assert.equal(draw.material.emissiveIntensity, 2)
  assert.equal(Object.hasOwn(draw.material.defines, 'USE_UBER_SHADER'), false)
  assert.equal(draw.geometry, geometry)
  assert.equal(model.material.raw.defines.USE_UBER_SHADER, '')
  restore()
  handle.setColor('#00ff00')
  const secondRestore = handle.clipForCamera(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.3))
  assert.equal(item.cameraMesh, draw, 'temporary cut draws and materials are cached')
  assert.equal(draw.material.color.getHexString(), '00ff00')
  secondRestore()
  let disposed = false
  draw.material.addEventListener('dispose', () => {
    disposed = true
  })
  handle.destroy()
  assert.equal(disposed, true)
})

test('pieces entirely above or below the cut need no replacement meshes or materials', () => {
  const stage = createStage()
  const batch = createLinkedBatch(stage)
  const handle = batch.insert(0)
  stage.update()
  const model = [...stage.models.values()][0]
  assert.equal(handle.clipForCamera(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.6)), undefined)
  assert.equal(model.items[0].cameraMesh, null)
  assert.equal(model.items[0].cameraMaterial, null)
  const restore = handle.clipForCamera(new THREE.Plane(new THREE.Vector3(0, -1, 0), -0.6))
  assert.equal(model.items[0].cameraHidden, true)
  assert.equal(model.items[0].cameraMesh, null)
  assert.equal(model.items[0].cameraMaterial, null)
  restore()
  assert.equal(model.items[0].cameraHidden, false)
})

test('camera masking preserves ordinary frustum bounds before and after hidden-instance movement', () => {
  const stage = createStage()
  const batch = createLinkedBatch(stage)
  const handle = batch.insert(100)
  stage.update()
  const mesh = batch.mesh()
  assert.equal(mesh.boundingSphere, null)
  const restore = handle.clipForCamera(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.25))
  assert.equal(viewAt(100).intersectsObject(mesh), true)
  handle.move(new THREE.Matrix4().makeTranslation(-100, 0, 0))
  assert.equal(viewAt(-100).intersectsObject(mesh), true)
  restore()
  assert.equal(viewAt(-100).intersectsObject(mesh), true)
  assert.equal(viewAt(100).intersectsObject(mesh), false)
})

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

test('photo hiding affects one linked instance and restores it without moving the node or octree', () => {
  const stage = createStage()
  const batch = createLinkedBatch(stage)
  const first = batch.insert(1)
  const second = batch.insert(3)
  stage.update()
  const matrix = new THREE.Matrix4()
  const restore = first.hideForPhoto()
  batch.mesh().getMatrixAt(0, matrix)
  assert.equal(matrix.determinant(), 0)
  batch.mesh().getMatrixAt(1, matrix)
  assert.equal(matrix.elements[12], 3)
  assert.ok(raycast(stage, 1).length, 'capture hiding must leave raycasting unchanged')
  restore()
  batch.mesh().getMatrixAt(0, matrix)
  assert.equal(matrix.elements[12], 1)
  assert.equal(matrix.determinant(), 1)
  first.destroy()
  second.destroy()
})
