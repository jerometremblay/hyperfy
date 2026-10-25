import assert from 'node:assert/strict'
import fs from 'node:fs'
import { test } from 'node:test'
import { DoubleSide, Ray, Vector3 } from 'three'
import { MeshBVH } from 'three-mesh-bvh'
import PhysXModule from '../src/core/physx-js-webidl.js'
import { bundleProbe } from '../test/security/lib/workerProbe.mjs'
import {
  colliderGeometry,
  MAX_EDGE_LENGTH,
  maxEdgeLength,
  readGLB,
  repairMeadowCollider,
} from './repair-meadow-collider.mjs'

const originalBytes = fs.readFileSync(new URL('../outputs/meadow-collider/original-model.glb', import.meta.url))
const repairedBytes = fs.readFileSync(new URL('../outputs/meadow-collider/model.glb', import.meta.url))

test('Meadow repair is reproducible and preserves all existing binary data and non-collider metadata', () => {
  assert.deepEqual(repairMeadowCollider(originalBytes), repairedBytes)
  const original = readGLB(originalBytes)
  const repaired = readGLB(repairedBytes)
  assert.deepEqual(repaired.binary.subarray(0, original.binary.length), original.binary)
  const originalJSON = original.json
  const repairedJSON = repaired.json
  assert.deepEqual(repairedJSON.accessors.slice(0, originalJSON.accessors.length), originalJSON.accessors)
  assert.deepEqual(repairedJSON.bufferViews.slice(0, originalJSON.bufferViews.length), originalJSON.bufferViews)
  repairedJSON.accessors = originalJSON.accessors
  repairedJSON.bufferViews = originalJSON.bufferViews
  repairedJSON.buffers[0].byteLength = originalJSON.buffers[0].byteLength
  repairedJSON.meshes[0].primitives[0].attributes = originalJSON.meshes[0].primitives[0].attributes
  repairedJSON.meshes[0].primitives[0].indices = originalJSON.meshes[0].primitives[0].indices
  assert.deepEqual(repairedJSON, originalJSON)
})

test('Meadow collider keeps its bounds and terrain heights with edges below the repair limit', () => {
  const before = readGLB(originalBytes)
  const after = readGLB(repairedBytes)
  const original = colliderGeometry(before.json, before.binary).geometry
  const repaired = colliderGeometry(after.json, after.binary).geometry
  original.computeBoundingBox()
  repaired.computeBoundingBox()
  assert.deepEqual(repaired.boundingBox, original.boundingBox)
  assert.ok(maxEdgeLength(original) > 500)
  assert.ok(maxEdgeLength(repaired) <= MAX_EDGE_LENGTH)
  const originalTree = new MeshBVH(original, { indirect: true })
  const repairedTree = new MeshBVH(repaired, { indirect: true })
  let hits = 0
  let samples = 0
  let maxDifference = 0
  const compareHeight = (x, z) => {
    samples++
    const ray = new Ray(new Vector3(x, 1000, z), new Vector3(0, -1, 0))
    const a = originalTree.raycastFirst(ray, DoubleSide)
    const b = repairedTree.raycastFirst(ray, DoubleSide)
    assert.equal(Boolean(b), Boolean(a), `Coverage changed at ${x}, ${z}`)
    if (a) {
      hits++
      const difference = Math.abs(a.point.y - b.point.y)
      maxDifference = Math.max(maxDifference, difference)
      assert.ok(difference < 0.0001, `Terrain height changed at ${x}, ${z}: ${difference}`)
    }
  }
  // Avoid exact perimeter rays, where float32 midpoint rounding changes edge hits.
  for (let x = -975; x <= 975; x += 50) {
    for (let z = -975; z <= 975; z += 50) compareHeight(x, z)
  }
  // Sample every original face as well, including the large outer triangles.
  const positions = original.attributes.position
  for (let i = 0; i < original.index.count; i += 3) {
    const indices = [0, 1, 2].map(j => original.index.getX(i + j))
    compareHeight(
      indices.reduce((sum, index) => sum + positions.getX(index), 0) / 3,
      indices.reduce((sum, index) => sum + positions.getZ(index), 0) / 3
    )
  }
  assert.ok(hits > 1500)
  console.log(JSON.stringify({ terrainRaycasts: samples, hits, maxHeightDifference: maxDifference }))
  original.dispose()
  repaired.dispose()
})

test('native PhysX reproduces the original warning and cooks the repaired collider without warnings', async t => {
  const logs = []
  globalThis.PHYSX = await PhysXModule({
    print: line => logs.push(String(line)),
    printErr: line => logs.push(String(line)),
  })
  const allocator = new PHYSX.PxDefaultAllocator()
  const callback = new PHYSX.PxDefaultErrorCallback()
  const foundation = PHYSX.CreateFoundation(PHYSX.PHYSICS_VERSION, allocator, callback)
  const scale = new PHYSX.PxTolerancesScale()
  const cookingParams = new PHYSX.PxCookingParams(scale)
  const bundle = await bundleProbe(`export { geometryToPxMesh } from './src/core/extras/geometryToPxMesh.js'`)
  t.after(() => {
    bundle.destroy()
    PHYSX.destroy(cookingParams)
    PHYSX.destroy(scale)
    foundation.release()
    PHYSX.destroy(callback)
    PHYSX.destroy(allocator)
    delete globalThis.PHYSX
  })
  const { geometryToPxMesh } = await import(bundle.url)
  for (const [label, bytes] of [
    ['original', originalBytes],
    ['repaired', repairedBytes],
  ]) {
    const { json, binary } = readGLB(bytes)
    const { geometry } = colliderGeometry(json, binary)
    logs.length = 0
    const mesh = geometryToPxMesh({ physics: { cookingParams } }, geometry, false)
    try {
      assert.ok(mesh?.value?.ptr, `${label} mesh did not cook`)
      if (label === 'original') assert.ok(logs.some(line => line.includes('triangles are too big')))
      else assert.deepEqual(logs, [], 'Repaired native collider must cook cleanly')
    } finally {
      mesh?.release()
      geometry.dispose()
    }
  }
})
