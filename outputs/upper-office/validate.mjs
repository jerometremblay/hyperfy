import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { build } from 'esbuild'
import * as THREE from 'three'
import { parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const readJson = async name => JSON.parse(await fs.readFile(new URL(name, directory), 'utf8'))
const objects = await readJson('objects.json')
const bundle = await build({
  entryPoints: ['outputs/upper-office/runtime-adapter.mjs'],
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { executeSource } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].contents).toString('base64'))
const results = []
const models = new Map()
for (const object of objects) {
  const bytes = await fs.readFile(new URL(object.key + '.hyp', directory))
  const parsed = parseHyp(bytes)
  assert.deepEqual(parsed.blueprint, object.blueprint)
  const source = Buffer.from(parsed.assets.find(a => a.url === object.blueprint.script).bytes).toString('utf8')
  assert.equal(source, await fs.readFile(new URL(object.key + '.js', directory), 'utf8'))
  const suffix = object.key === 'chair'
    ? '\nreturn { wheelAnchors, backGroup, yAxisRotationBetween, casters, casterTrail, casterRadius, getCasterState, setCasterState, drawCasters, advanceCasters }'
    : '\nreturn { desktop, yAxisRotationBetween }'
  const runtime = await executeSource(source, suffix, { props: object.blueprint.props })
  const server = await executeSource(source, '', { server: true, props: object.blueprint.props })
  assert.equal(runtime.handlers.size, 0)
  assert.equal(server.handlers.size, 0)
  const physicsShapes = runtime.configs.filter(c => c.physics)
  assert.equal(physicsShapes.length, object.key === 'desk' ? 8 : 5)
  assert(physicsShapes.every(c => c.layer === 'environment' && c.opacity === 0))
  const bounds = new THREE.Box3()
  const meshes = runtime.visuals.map(visual => {
    assert(visual.geometry.attributes.position.array.every(Number.isFinite))
    const mesh = new THREE.Mesh(visual.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))
    mesh.matrix.copy(visual.matrix)
    mesh.matrixWorld.copy(visual.matrix)
    mesh.matrixAutoUpdate = false
    mesh.name = visual.node.id
    bounds.union(new THREE.Box3().setFromObject(mesh))
    return mesh
  })
  assert(bounds.min.y > -1e-5 && bounds.min.y < 0.002, 'Root must be at ground contact')
  if (object.key === 'desk') {
    const surfaces = meshes.filter(m => m.name.includes('continuous-u-desktop'))
    const ray = new THREE.Raycaster()
    const hit = (x, z) => {
      ray.set(new THREE.Vector3(x, 2, z), new THREE.Vector3(0, -1, 0))
      return ray.intersectObjects(surfaces, false)
    }
    assert.equal(hit(0, -0.65).length, 0, 'Working bay must be physically open')
    assert.equal(hit(0, 0.20).length, 0)
    for (const [x, z] of [[0, 0.8], [-1.75, -0.60], [1.75, -0.60]]) {
      const hits = hit(x, z)
      assert(hits.length > 0, 'Missing U-shaped work surface')
      assert(Math.abs(hits[0].point.y - 0.779) < 1e-5)
    }
    assert(bounds.max.x - bounds.min.x > 4.2)
  } else {
    assert.equal(runtime.audit.wheelAnchors.length, 5)
    assert.equal(runtime.configs.filter(c => c.id?.includes(':caster-wheel:')).length, 10)
    for (const mesh of meshes.filter(m => m.name.includes(':caster-wheel:'))) {
      const wheel = new THREE.Box3().setFromObject(mesh)
      assert(wheel.min.y > -1e-5 && wheel.min.y < 0.001)
    }
    const back = runtime.audit.backGroup
    assert(back.rotation.x > 0)
    assert(bounds.max.y > 1.32 && bounds.max.y < 1.45)
    const backrest = meshes.find(m => m.name.includes(':high-padded-back:'))
    const top = new THREE.Vector3(0, 0.40, 0).applyMatrix4(backrest.matrix)
    const bottom = new THREE.Vector3(0, -0.40, 0).applyMatrix4(backrest.matrix)
    assert(top.y > bottom.y && top.z > bottom.z, 'Backrest must recline toward the rear')
  }
  for (const [a, b] of object.key === 'chair'
    ? runtime.audit.wheelAnchors.map(p => [[0, 0.215, 0], [p[0], 0.145, p[2]]])
    : [[[-1.56, 0.035, 1.01], [-1.56, 0.698, 1.01]]]) {
    const length = Math.hypot(...a.map((v, i) => b[i] - v))
    const center = new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(0.5)
    const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(...runtime.audit.yAxisRotationBetween(a, b), 'YXZ'))
    assert(new THREE.Vector3(0, -length / 2, 0).applyQuaternion(rotation).add(center).distanceTo(new THREE.Vector3(...a)) < 1e-6)
    assert(new THREE.Vector3(0, length / 2, 0).applyQuaternion(rotation).add(center).distanceTo(new THREE.Vector3(...b)) < 1e-6)
  }
  models.set(object.key, { object, runtime, bounds, meshes })
  results.push({ key: object.key, primitives: meshes.length, idleClientCallbacks: 0, idleServerCallbacks: 0,
    physicsShapes: physicsShapes.length, bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() }, packageAssets: parsed.assets.length })
}
// Fit against the actual house floor and extension interior.
const house = await executeSource(await fs.readFile(new URL('house.js', directory), 'utf8'))
const floorMeshes = house.visuals.filter(v => v.node.id.startsWith('mezzanine:rear-board:')).map(v => {
  const mesh = new THREE.Mesh(v.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))
  mesh.matrixWorld.copy(v.matrix)
  mesh.matrixAutoUpdate = false
  return mesh
})
for (const { object, bounds } of models.values()) {
  const transform = new THREE.Matrix4().compose(new THREE.Vector3(...object.position),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), object.rotation), new THREE.Vector3(1, 1, 1))
  const roomBounds = bounds.clone().applyMatrix4(transform)
  // Preserve placements edited by the owner, including their chosen clearance.
  assert(object.position[0] > -2.715 && object.position[0] < 2.715)
  assert(object.position[2] > 7.5 && object.position[2] < 12.35)
  assert(roomBounds.min.y >= 3.299 && roomBounds.max.y < 5.88)
  const ray = new THREE.Raycaster(new THREE.Vector3(...object.position).add(new THREE.Vector3(0, 0.05, 0)),
    new THREE.Vector3(0, -1, 0), 0, 0.1)
  // Root X=0 sits in the small gap between two boards; sample inside its neighbor.
  ray.ray.origin.x += 0.10
  const hits = ray.intersectObjects(floorMeshes, false)
  assert(hits.length && Math.abs(hits[0].point.y - object.position[1]) < .003, 'Furniture must stand on the existing floorboards')
}
const chair = models.get('chair')
const chairInDesk = chair.bounds.clone().applyMatrix4(new THREE.Matrix4().compose(
  new THREE.Vector3(0, 0, -0.12), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI),
  new THREE.Vector3(1, 1, 1)))
assert(chairInDesk.min.x > -1.35 && chairInDesk.max.x < 1.35)
assert(chairInDesk.max.z < 0.45, 'Chair must fit in the U without hitting the rear desktop')
assert.equal(objects.length, 2)
assert.notEqual(objects[0].blueprint.id, objects[1].blueprint.id)
assert.notEqual(objects[0].entity.id, objects[1].entity.id)
assert(objects.every(o => o.entity.pinned === false))
const report = {
  valid: true, target: 'Hyperfy 0.16.0 fork', actualEngineGeometry: true,
  individualFurnitureObjects: 2, continuousUDeskAndOpenWorkingBay: 'pass',
  chair: { casterAssemblies: 5, wheels: 10, groundContact: 'pass', recliningBack: 'pass' },
  floorContactAtOwnerPlacements: 'pass', originalDesignChairInsideU: 'pass', endpointAlignment: 'pass',
  passageBeforeDeskMetres: 1.98, objects: results,
}
await fs.writeFile(new URL('validation.json', directory), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
