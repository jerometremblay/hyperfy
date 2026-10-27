import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'
import * as THREE from 'three'
import { packHyp, parseHyp } from '../../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const before = JSON.parse(await read('before.json'))
const source = await read('source.js')
const script = 'asset://' + createHash('sha256').update(source).digest('hex') + '.js'
const blueprint = { ...before.blueprint, version: before.blueprint.version + 1, script,
  props: { ...before.blueprint.props,
    initialDoors: before.entity.state.doors, initialLighting: before.entity.state.lighting } }
const bytes = packHyp(blueprint, [
  { type: 'model', url: blueprint.model, bytes: await read('model.glb'), mime: 'model/gltf-binary' },
  { type: 'script', url: script, bytes: source, mime: 'text/javascript' },
])
assert(parseHyp(bytes).assets.find(a => a.url === script).bytes.equals(source))
await fs.writeFile(new URL('house.hyp', directory), bytes)
await fs.writeFile(new URL('desired-blueprint.json', directory), JSON.stringify(blueprint, null, 2))
const bundled = await build({ entryPoints: [new URL('../runtime-adapter.mjs', directory).pathname],
  bundle: true, format: 'esm', platform: 'node', write: false })
const { executeSource } = await import('data:text/javascript;base64,' +
  Buffer.from(bundled.outputFiles[0].contents).toString('base64'))
const options = { state: before.entity.state, props: blueprint.props }
const previous = await executeSource((await read('before.js')).toString(), '', options)
const current = await executeSource(source.toString(), '', options)
const ceiling = c => c.id?.includes('bedroom-ceiling')
const ceilingCollider = c => /^physics:(room-ceiling-|extension-front-ceiling:)/.test(c.id || '')
const extensionCeiling = c => ceiling(c) && c.position[2] > 7.35
const extensionCollider = c => c.id?.startsWith('physics:extension-front-ceiling:')
const fixture = c => c.id?.startsWith('extension-lighting:') &&
  ['ceiling-trim', 'ceiling-lens', 'extension-downlight'].some(name => c.id.includes(':' + name + ':')) &&
  c.position[1] > 5.6 && c.position[2] < 12
const canonical = configs => configs.filter(c => !extensionCeiling(c) && !extensionCollider(c) && !fixture(c))
  .map(c => JSON.stringify({ ...c, id: c.id?.replace(/:\d+$/, '') })).sort()
assert.deepEqual(canonical(current.configs), canonical(previous.configs),
  'Only the existing extension ceiling, its collision box and upstairs extension fixture may change')
const ceilings = current.configs.filter(ceiling)
const colliders = current.configs.filter(ceilingCollider)
assert.equal(previous.configs.filter(ceiling).length, 4)
assert.equal(ceilings.length, 4)
assert.equal(colliders.length, 4)
for (const panel of ceilings) {
  assert.equal(panel.size[1], .14)
  assert.equal(panel.size[2], extensionCeiling(panel) ? 5 : 3.15)
  const collider = colliders.find(c => JSON.stringify(c.size) === JSON.stringify(panel.size) &&
    JSON.stringify(c.position) === JSON.stringify(panel.position))
  assert(collider?.physics === 'static' && collider.opacity === 0)
}
assert.deepEqual(current.configs.filter(c => c.physics && !extensionCollider(c)),
  previous.configs.filter(c => c.physics && !extensionCollider(c)),
  'All other existing physical floors, walls, doors, ceilings and roof must be preserved')
const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
const meshes = current.visuals.map(v => {
  const mesh = new THREE.Mesh(v.geometry, material)
  mesh.matrix.copy(v.matrix); mesh.matrixWorld.copy(v.matrix); mesh.matrixAutoUpdate = false
  mesh.name = v.node.id
  return mesh
})
const up = point => new THREE.Raycaster(new THREE.Vector3(...point), new THREE.Vector3(0, 1, 0), .001, 10)
  .intersectObjects(meshes, false)[0]
const coverage = []
for (const point of [[-5.5, 4.7, 5.3], [1.4, 4.7, 5.3], [5.5, 4.7, 5.3],
  [1.4, 4.7, 8.9], [1.4, 4.7, 10.35], [0, 4.7, 10.7], [1.4, 4.7, 11.4],
  [-1.4, 4.7, 11.7], [1.4, 4.7, 12.0]]) {
  const hit = up(point)
  assert(hit.object.name.includes('bedroom-ceiling'), `Ceiling coverage at ${point}: ${hit.object.name}`)
  assert(Math.abs(hit.point.y - 5.91) < .000001)
  coverage.push({ origin: point, ceilingY: hit.point.y })
}
const trim = current.configs.find(c => fixture(c) && c.id.includes('ceiling-trim'))
assert(new THREE.Vector3(...trim.position).distanceTo(new THREE.Vector3(0, 5.82, 9.85)) < .000001)
assert(trim.position[1] + trim.size[2] / 2 < 5.91)
assert.equal(previous.configs.filter(fixture).length, current.configs.filter(fixture).length)
const server = await executeSource(source.toString(), '', { ...options, state: {}, server: true })
assert.deepEqual(server.app.state, before.entity.state)
for (const runtime of [current, server]) for (const key of ['update', 'fixedUpdate', 'lateUpdate']) {
  assert.equal(runtime.handlers.get(key)?.size || 0, 0)
}
const report = { valid: true, source: script, exactPackageSource: true,
  actualEngineGeometryAndTransforms: true, extendedExistingPanel: true, totalCeilingPanels: 4,
  originalRooms: 3, ceilingDepth: 3.15, extensionCeilingDepth: 5, extensionCeilingRange: [7.35, 12.35],
  originalRoomCeilingsPreserved: true, ceilings, colliders, coverage,
  existingGeometryAndPhysicalShapesPreserved: true,
  retainedRafters: current.configs.filter(c => c.id?.includes(':rafter:')).length,
  roofDecks: current.configs.filter(c => c.id?.includes(':roof-deck:')).length,
  physicsShapes: current.configs.filter(c => c.physics).length,
  stateRestored: true, idleClientCallbacks: 0, idleServerCallbacks: 0,
  upstairsFixtureBelowCeiling: true }
await fs.writeFile(new URL('validation.json', directory), JSON.stringify(report, null, 2))
console.log(JSON.stringify({ valid: report.valid, ceilings: ceilings.length, staticCeilingColliders: colliders.length,
  extensionCeilingRange: report.extensionCeilingRange, extendedExistingPanel: true,
  physicsShapes: report.physicsShapes, idleCallbacks: 0 }, null, 2))
