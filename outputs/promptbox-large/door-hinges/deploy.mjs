import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { loadProfile, makeClient } from '../../../tools/worldsync/src/deployment.mjs'
import { parseHyp, packHyp } from '../../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const json = async name => JSON.parse(await read(name))
const before = await json('before.json')
const validation = await json('validation.json')
const visual = await json('visual-validation.json')
assert(validation.valid && visual.valid)
assert.equal(validation.hingedDoors, 5)
assert.equal(validation.openingDegrees, 175)
assert(validation.patioSlidingUnchanged && validation.wallsClearThroughoutSweep)
assert(validation.hingePinsTouchLeafEdges && validation.movingActionsPerDoor === 2)
const actions = await json('action-validation.json')
assert(actions.valid && actions.actualNativeClientActions && actions.cases.length >= 12)
assert(validation.existingGeometryAndPhysicalShapesPreserved)
const physics = await json('physics-validation.json')
assert(physics.valid && physics.source === validation.source && physics.checks.length === 2)
const source = (await read('source.js')).toString()
const parsed = parseHyp(await read('house.hyp'))
let desired = parsed.blueprint
assert.equal(parsed.assets.find(a => a.url === desired.script).bytes.toString(), source)
const profile = await loadProfile('/Users/jerome/metaverse/hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const [blueprint, entity, snapshot, profilingBefore] = await Promise.all([
  client.request('/apps/' + before.blueprint.id),
  client.request('/entities/' + before.entity.id),
  client.request('/snapshot?excludeSeatPoses=true'),
  client.request('/profiling?entityId=' + before.entity.id),
])
assert.deepEqual(blueprint, before.blueprint, 'House blueprint changed while preparing')
const fields = ['id', 'blueprint', 'position', 'quaternion', 'scale', 'pinned']
for (const field of fields) assert.deepEqual(entity[field], before.entity[field], 'House placement changed: ' + field)
assert(!entity.mover && !entity.uploader)
assert.equal(snapshot.entities.filter(e => e.blueprint === blueprint.id).length, 1)
assert.equal(desired.version, blueprint.version + 1)
const plan = {
  target: profile.apiUrl, entityId: entity.id, blueprintId: blueprint.id,
  expectedVersion: blueprint.version, version: desired.version,
  hingedDoors: 5, openingDegrees: 175,
  hingeAxesClearJambs: true, hingePinsTouchLeafEdges: true, movingActionsPerDoor: 2,
  patioSlidingUnchanged: true, otherGeometryAndPhysicalShapesUnchanged: true,
}
console.log(JSON.stringify(plan, null, 2))
if (!process.argv.includes('--write')) process.exit(0)
await fs.writeFile(new URL('pre-deploy.json', directory), JSON.stringify({ blueprint, entity, snapshot }, null, 2))
const uploaded = await client.request('/scripts', { method: 'POST', json: { source } })
assert.equal(uploaded.url, desired.script)
assert.equal((await client.requestBytes('/assets/' + desired.script.slice(8))).bytes.toString(), source)
const latestEntity = await client.request('/entities/' + entity.id)
for (const field of fields) assert.deepEqual(latestEntity[field], entity[field])
assert(!latestEntity.mover && !latestEntity.uploader)
const state = structuredClone(latestEntity.state)
desired = {
  ...desired,
  props: { ...desired.props, initialDoors: state.doors, initialLighting: state.lighting },
}
await fs.writeFile(new URL('house.hyp', directory), packHyp(desired, parsed.assets))
await fs.writeFile(new URL('desired-blueprint.json', directory), JSON.stringify(desired, null, 2))
const updated = await client.request('/apps/' + blueprint.id, {
  method: 'PATCH', json: { version: blueprint.version, script: desired.script, props: desired.props },
})
assert.deepEqual(updated, desired)
await new Promise(resolve => setTimeout(resolve, 1500))
const house = await client.request('/entities/' + entity.id)
for (const field of fields) assert.deepEqual(house[field], latestEntity[field])
assert.deepEqual(house.state, state, 'Door and lighting state must survive the rebuild')
if (!profilingBefore.server.active) {
  await client.request('/profiling', { method: 'POST', json: { enabled: true } })
}
let profiling
try {
  await new Promise(resolve => setTimeout(resolve, 2300))
  profiling = await client.request('/profiling?entityId=' + entity.id)
} finally {
  if (!profilingBefore.server.active) {
    await client.request('/profiling', { method: 'POST', json: { enabled: false } })
  }
}
const after = await client.request('/snapshot?excludeSeatPoses=true')
assert.deepEqual(after.world, snapshot.world)
for (const app of snapshot.blueprints.filter(b => b.id !== blueprint.id)) {
  assert.deepEqual(after.blueprints.find(b => b.id === app.id), app)
}
assert.deepEqual(after.blueprints.find(b => b.id === blueprint.id), desired)
assert.equal(profiling.server.stale, false)
const row = profiling.server.rows.find(r => r.id === entity.id)
assert.equal(row.blueprintVersion, desired.version)
assert.equal(row.cpuMsPerSecond, 0)
const furniturePlacements = []
for (const id of [
  'd16ab219-9538-445c-a9c1-02a9cbf2ae2e',
  '39fc1d1e-9bd0-42f6-b3f2-2022c70d4f26',
]) {
  const a = snapshot.entities.find(e => e.id === id)
  const b = after.entities.find(e => e.id === id)
  assert(a && b)
  for (const field of fields) assert.deepEqual(b[field], a[field], 'Furniture placement changed: ' + id)
  furniturePlacements.push({ id, preserved: true })
}
const report = {
  ...plan, verified: true, sourceReadback: true, statePreserved: true,
  housePlacementPreserved: true, otherBlueprintsPreserved: true, furniturePlacements,
  serverProfile: row, nativeCameraAndPhysicsValidation: physics,
  visualValidation: visual,
  actionValidation: actions,
}
await fs.writeFile(new URL('after.json', directory), JSON.stringify(after, null, 2))
await fs.writeFile(new URL('deployment.json', directory), JSON.stringify(report, null, 2))
// Keep the existing authoring and preview house copies current.
await fs.writeFile(new URL('../source.js', directory), source)
await fs.writeFile(new URL('../house-extension.hyp', directory), await read('house.hyp'))
await fs.writeFile(new URL('../desired-blueprint.json', directory), JSON.stringify(desired, null, 2))
await fs.writeFile(new URL('../deployment-base-blueprint.json', directory), JSON.stringify(blueprint, null, 2))
await fs.writeFile(new URL('../initial-state.json', directory), JSON.stringify(state, null, 2))
await fs.writeFile(new URL('../../upper-office/house.js', directory), source)
await fs.writeFile(new URL('../../upper-office/house.hyp', directory), await read('house.hyp'))
console.log(JSON.stringify(report, null, 2))
