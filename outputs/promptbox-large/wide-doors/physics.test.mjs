import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import { world, clean, flush, THREE, hotCallbacks, destroyWorlds } from '../../upper-office/motion-fix/runtime-harness.mjs'
import { Layers } from '../../../src/core/extras/Layers.js'

const directory = new URL('./', import.meta.url)
const source = await fs.readFile(new URL('source.js', directory), 'utf8')
const validation = JSON.parse(await fs.readFile(new URL('validation.json', directory)))
const checks = [], cases = []
test.after(async () => {
  await destroyWorlds()
  await fs.writeFile(new URL('physics-validation.json', directory),
    JSON.stringify({ valid: checks.length === 2, source: validation.source, actualPhysXWasm: true,
      actualFullHouseScript: true, checks, cases }, null, 2))
})
async function fixture(client = false) {
  const w = await world({ client })
  // Portal rendering is outside the physical door check.
  w.graphics = null
  const executable = w.scripts.evaluate(source)
  const original = w.loader.get
  w.loader.get = (kind, url) => kind === 'script' && url === 'house' ? executable : original(kind, url)
  const app = w.addFurniture('house', [0, 0, 0], [0, 0, 0, 1], [1, 1, 1], { doors: {} })
  await flush(w)
  return { w, app }
}
function settle(w, app) {
  for (let i = 0; i < 65; i++) {
    app.update(.02); clean(w)
    w.physics.preFixedUpdate(true)
    w.physics.postFixedUpdate(.02)
    w.physics.preUpdate(0); clean(w)
  }
  assert.equal(app.scriptError, null)
  assert.equal(hotCallbacks(app), 0, 'Door animation must stop its update callback when settled')
}
function checkOpenLeaf(w, sweep) {
  const sample = sweep.samples.at(-1)
  const normal = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(...sample.rotation, 'YXZ'))
  const door = validation.doors.find(door => door.id === sweep.id)
  if (normal.z * door.hingeOffsetZ < 0) normal.negate()
  const origin = new THREE.Vector3(...sample.centre).addScaledVector(normal, .35)
  const hit = w.physics.raycast(origin, normal.clone().negate(), .5, Layers.environment.group)
  assert(hit && hit.distance > .27 && hit.distance < .31,
    `${sweep.id} must have a solid physical leaf at 175 degrees; distance=${hit?.distance}, point=${hit?.point?.toArray()}`)
  cases.push({ id: sweep.id, nativeRayDistance: hit.distance, nativePhysicalLeafAt175Degrees: true })
}
test('server door animation moves native physical leaves to 175 degrees and closes again', async () => {
  const { w, app } = await fixture()
  for (const door of validation.doors) app.emit('toggleDoor', { id: door.id }, 'p1')
  settle(w, app)
  for (const sweep of validation.sweeps) checkOpenLeaf(w, sweep)
  for (const door of validation.doors) app.emit('toggleDoor', { id: door.id }, 'p1')
  settle(w, app)
  for (const door of validation.doors) assert.equal(app.data.state.doors[door.id], false)
  checks.push('Full server script opens all five native kinematic leaves to 175 degrees, closes them, and stops frame callbacks')
})
test('client receives the same physical opening and patio retains its sliding state', async () => {
  const { w, app } = await fixture(true)
  for (const door of validation.doors) app.emit('doorState', { id: door.id, open: true })
  settle(w, app)
  for (const sweep of validation.sweeps) checkOpenLeaf(w, sweep)
  app.emit('doorState', { id: 'patio-left', open: true })
  settle(w, app)
  const hit = w.physics.raycast(new THREE.Vector3(.6825, 1.39, 12), new THREE.Vector3(0, 0, 1), .4, Layers.environment.group)
  assert(hit && hit.distance > .17 && hit.distance < .24)
  assert.equal(app.worldNodes.size, 0)
  checks.push('Full client script follows synchronized opening events with matching native leaves, unchanged patio sliding, and no detached nodes or idle callbacks')
})
