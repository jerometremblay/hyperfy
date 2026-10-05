import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

import * as THREE from 'three'

const stageBundle = await build({
  entryPoints: [fileURLToPath(new URL('./Stage.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { Stage } = await import(
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
  const world = {}
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
