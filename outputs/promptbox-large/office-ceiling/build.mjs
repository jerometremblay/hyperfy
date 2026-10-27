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
const blueprint = {
  ...before.blueprint, version: before.blueprint.version + 1, script,
  props: {
    ...before.blueprint.props,
    initialDoors: before.entity.state.doors,
    initialLighting: before.entity.state.lighting,
  },
}
const bytes = packHyp(blueprint, [
  { type: 'model', url: blueprint.model, bytes: await read('model.glb'), mime: 'model/gltf-binary' },
  { type: 'script', url: script, bytes: source, mime: 'text/javascript' },
])
const parsed = parseHyp(bytes)
assert(parsed.assets.find(a => a.url === script).bytes.equals(source))
await fs.writeFile(new URL('house.hyp', directory), bytes)
await fs.writeFile(new URL('desired-blueprint.json', directory), JSON.stringify(blueprint, null, 2))

const bundled = await build({
  entryPoints: [new URL('../runtime-adapter.mjs', directory).pathname],
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { executeSource } = await import('data:text/javascript;base64,' +
  Buffer.from(bundled.outputFiles[0].contents).toString('base64'))
const options = { state: before.entity.state, props: blueprint.props }
const previous = await executeSource((await read('before.js')).toString(), '', options)
const current = await executeSource(source.toString(), '', options)
const ceiling = c => c.id?.includes('bedroom-ceiling') && c.position[0] === 0
const fixture = c => c.id?.startsWith('extension-lighting:') &&
  ['ceiling-trim', 'ceiling-lens', 'extension-downlight'].some(name => c.id.includes(':' + name + ':')) &&
  c.position[1] > 5.6 && c.position[2] < 12
assert.equal(previous.configs.filter(ceiling).length, 2)
assert.equal(current.configs.filter(ceiling).length, 0)
assert.equal(current.configs.filter(c => c.id?.includes('bedroom-ceiling')).length, 2)
assert.equal(previous.configs.filter(fixture).length, 3)
assert.equal(current.configs.filter(fixture).length, 3)
const canonical = configs => configs.filter(c => !ceiling(c) && !fixture(c))
  .map(c => JSON.stringify({ ...c, id: c.id?.replace(/:\d+$/, '') })).sort()
assert.deepEqual(canonical(current.configs), canonical(previous.configs),
  'Only the office ceiling panels and their downlight may change')
const previousColliders = previous.configs.filter(c => c.physics)
const currentColliders = current.configs.filter(c => c.physics)
assert.deepEqual(currentColliders, previousColliders, 'Physical floors, walls, doors and roof must remain unchanged')

const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
const meshes = runtime => runtime.visuals.map(v => {
  const mesh = new THREE.Mesh(v.geometry, material)
  mesh.matrix.copy(v.matrix)
  mesh.matrixWorld.copy(v.matrix)
  mesh.matrixAutoUpdate = false
  mesh.name = v.node.id
  return mesh
})
const oldMeshes = meshes(previous), newMeshes = meshes(current)
const up = (objects, point) => new THREE.Raycaster(
  new THREE.Vector3(...point), new THREE.Vector3(0, 1, 0), 0.001, 10)
  .intersectObjects(objects, false)
const clearance = []
for (const point of [[1.4, 4.7, 5.3], [-1.4, 4.7, 6.5], [1.4, 4.7, 9.0], [-1.4, 4.7, 11.1]]) {
  assert(up(oldMeshes, point)[0].object.name.includes('bedroom-ceiling'))
  const hit = up(newMeshes, point)[0]
  assert(hit.object.name.includes('roof-deck'), 'Office must open directly to the angled lining')
  assert(hit.point.y > 6.4)
  clearance.push({ origin: point, ceilingY: hit.point.y, surface: hit.object.name })
}
const trim = current.configs.find(c => fixture(c) && c.id.includes('ceiling-trim'))
const beamHit = up(newMeshes.filter(m => m.name.includes('extension-roof:rafter:')), trim.position)[0]
assert(beamHit, 'Downlight needs a supporting roof beam')
const attachmentGap = beamHit.point.y - trim.position[1] - trim.size[2] / 2
assert(Math.abs(attachmentGap) < 0.002, 'Downlight must touch the beam underside')
const server = await executeSource(source.toString(), '', { ...options, state: {}, server: true })
assert.deepEqual(server.app.state, before.entity.state, 'Rebuild must restore doors and lighting')
for (const runtime of [current, server]) {
  assert.equal(runtime.handlers.get('update')?.size || 0, 0)
  assert.equal(runtime.handlers.get('fixedUpdate')?.size || 0, 0)
}
const report = {
  valid: true, source: script, packageSourceAndHashes: true,
  removedOfficeCeilingPanels: 2, retainedOtherRoomCeilingPanels: 2,
  allOtherGeometryPreserved: true, allPhysicalShapesPreserved: true,
  roofDecks: current.configs.filter(c => c.id?.includes(':roof-deck:')).length,
  retainedRafters: current.configs.filter(c => c.id?.includes(':rafter:')).length,
  physicsShapes: currentColliders.length, officeClearance: clearance,
  officeDownlight: { position: trim.position, beamAttachmentGap: attachmentGap },
  stateRestored: true, idleClientCallbacks: 0, idleServerCallbacks: 0,
  geometry: 'Actual Hyperfy Prim.mount geometry and native node transforms',
}
await fs.writeFile(new URL('validation.json', directory), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
