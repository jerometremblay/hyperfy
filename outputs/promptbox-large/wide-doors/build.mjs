import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'
import * as THREE from 'three'
import { OBB } from 'three/examples/jsm/math/OBB.js'
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
const suffix = '\nreturn { doorRegistry, setDoorGeometry, applyAuthoritativeDoorState }'
const options = { state: before.entity.state, props: blueprint.props }
const previous = await executeSource((await read('before.js')).toString(), suffix, options)
const current = await executeSource(source.toString(), suffix, options)
const isGroup = c => c.kind === 'group'
const canonical = configs => configs.filter(c => !isGroup(c)).map(c => JSON.stringify({
  ...c, position: c.position?.map(v => Math.round(v * 1e9) / 1e9),
}))
assert.deepEqual(canonical(current.configs), canonical(previous.configs),
  'All primitive dimensions, closed placements, materials, lights, colliders and actions must be unchanged')
assert.equal(current.configs.filter(isGroup).length, previous.configs.filter(isGroup).length + 5)
const obb = node => new OBB(new THREE.Vector3(),
  new THREE.Vector3(...node.size).multiplyScalar(.5)).applyMatrix4(node.matrixWorld)
const walls = current.nodes.filter(n => n.physics === 'static' && n.type === 'box')
const doors = [], closed = [], sweeps = []
for (const door of Object.values(current.audit.doorRegistry)) {
  const old = previous.audit.doorRegistry[door.id]
  const leaf = current.nodes.find(n => n.id?.startsWith('physics:' + door.id + '-leaf:'))
  current.audit.setDoorGeometry(door, 0)
  previous.audit.setDoorGeometry(old, 0)
  for (const node of [...previous.nodes, ...current.nodes]) node.updateTransform()
  const oldNodes = previous.nodes.filter(n => n.id?.startsWith('doors:' + door.id + '-'))
  for (const n of oldNodes) {
    const now = current.nodes.find(node => node.id === n.id)
    assert(now && now.matrixWorld.elements.every((v, i) => Math.abs(v - n.matrixWorld.elements[i]) < 1e-8))
  }
  closed.push({ id: door.id, originalClosedGeometryPreserved: true })
  if (door.slideDistance) {
    assert.equal(door.slideDistance, old.slideDistance)
    assert.equal(door.openAngle, old.openAngle)
    for (const slide of [0, door.slideDistance / 2, door.slideDistance]) {
      current.audit.setDoorGeometry(door, slide)
      previous.audit.setDoorGeometry(old, slide)
      for (const n of [...previous.nodes, ...current.nodes]) n.updateTransform()
      const oldLeaf = previous.nodes.find(n => n.id === leaf.id)
      assert.deepEqual(leaf.matrixWorld.elements, oldLeaf.matrixWorld.elements)
    }
    continue
  }
  assert(Math.abs(Math.abs(door.openAngle) * 180 / Math.PI - 175) < 1e-8)
  assert.equal(Math.sign(door.openAngle), Math.sign(old.openAngle))
  const samples = []
  for (let degrees = 0; degrees <= 175; degrees++) {
    const angle = Math.sign(door.openAngle) * degrees * Math.PI / 180
    current.audit.setDoorGeometry(door, angle)
    for (const n of current.nodes) n.updateTransform()
    const collisions = walls.filter(n => obb(leaf).intersectsOBB(obb(n)))
    assert.equal(collisions.length, 0, `${door.id} at ${degrees} degrees intersects ${collisions.map(n => n.id)}`)
    const panel = current.nodes.find(n => n.id?.startsWith('doors:' + door.id + '-') &&
      (n.id.includes('-panel:') || n.id.includes('-plank:')))
    const localPlanePoint = new THREE.Vector3(door.direction * door.width / 2, door.height / 2, 0)
      .applyMatrix4(panel.parent.matrixWorld)
    assert(localPlanePoint.distanceTo(new THREE.Vector3().setFromMatrixPosition(leaf.matrixWorld)) < 1e-8)
    if (degrees % 35 === 0 || degrees === 175) samples.push({ degrees, centre: leaf.position.toArray(),
      rotation: leaf.rotation.toArray().slice(0, 3) })
  }
  doors.push({ id: door.id, signedAngle: door.openAngle, hingeOffsetZ: -door.leafOffsetZ })
  sweeps.push({ id: door.id, wallClearanceVerifiedAtEveryDegree: true, samples })
}
assert.equal(doors.length, 5)
const server = await executeSource(source.toString(), suffix, { ...options, state: {}, server: true })
assert.deepEqual(server.app.state, before.entity.state)
for (const runtime of [current, server]) for (const key of ['update', 'fixedUpdate', 'lateUpdate']) {
  assert.equal(runtime.handlers.get(key)?.size || 0, 0)
}
const report = { valid: true, source: script, exactPackageSource: true,
  actualEngineGeometryAndTransforms: true, hingedDoors: 5, openingDegrees: 175,
  existingGeometryAndPhysicalShapesPreserved: true, closed, doors, sweeps,
  patioSlidingUnchanged: true, wallsClearThroughoutSweep: true,
  physicsShapes: current.configs.filter(c => c.physics).length,
  stateRestored: true, idleClientCallbacks: 0, idleServerCallbacks: 0 }
await fs.writeFile(new URL('validation.json', directory), JSON.stringify(report, null, 2))
console.log(JSON.stringify({ valid: true, hingedDoors: 5, openingDegrees: 175,
  closedGeometryPreserved: true, wallsClearThroughoutSweep: true, patioSlidingUnchanged: true }, null, 2))
