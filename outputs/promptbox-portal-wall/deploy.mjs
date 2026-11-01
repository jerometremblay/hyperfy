import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'
import { parseHyp, packHyp } from '../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const json = async name => JSON.parse(await read(name))
const save = (name, value) => fs.writeFile(new URL(name, directory), JSON.stringify(value, null, 2))
const targets = await json('targets.json')
const plan = await json('plan.json')
const validation = await json('validation.json')
const physics = await json('physics-validation.json')
const visual = await json('visual-validation.json')
assert(validation.valid && physics.valid && visual.valid)
const source = (await read('source.js')).toString()
const parsed = parseHyp(await read('house.hyp'))
let desired = parsed.blueprint
assert.equal(validation.source, desired.script)
assert.equal(visual.source, desired.script)
assert.equal(parsed.assets.find(a => a.url === desired.script).bytes.toString(), source)
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const fields = ['id', 'blueprint', 'position', 'quaternion', 'scale', 'pinned']
function unchanged(entity, previous) {
  for (const field of fields) assert.deepEqual(entity[field], previous[field], field + ' changed: ' + entity.id)
  assert(!entity.mover && !entity.uploader, 'A target is currently being edited')
}
const snapshot = await client.request('/snapshot?excludeSeatPoses=true')
const house = await client.request('/entities/' + targets.house.id)
unchanged(house, targets.house)
assert.deepEqual(await client.request('/apps/' + targets.blueprint.id), targets.blueprint)
assert.equal(snapshot.entities.filter(e => e.blueprint === house.blueprint).length, 1)
const box = await client.request('/entities/' + plan.boxId)
unchanged(box, targets.box)
const boxBlueprint = snapshot.blueprints.find(b => b.id === box.blueprint)
const originalSnapshot = await json('before.json')
assert.deepEqual(boxBlueprint, originalSnapshot.blueprints.find(b => b.id === box.blueprint))
for (const portal of plan.portals) {
  unchanged(await client.request('/entities/' + portal.entity.id), portal.entity)
  assert.deepEqual(await client.request('/apps/' + portal.blueprint.id), portal.blueprint)
}
const report = {
  target: profile.apiUrl, houseId: house.id, expectedVersion: targets.blueprint.version,
  newVersion: desired.version, wall: 'Two blind timber portal doorways facing the pool table',
  portals: plan.portals.map(p => ({
    id: p.entity.id, transform: p.transform,
    portalId: p.blueprint.props.portalId,
    destination: p.blueprint.props.destination,
    destinationPortalId: p.blueprint.props.destinationPortalId,
    oneSided: true,
  })),
}
console.log(JSON.stringify(report, null, 2))
if (!process.argv.includes('--write')) process.exit(0)
await save('pre-deploy.json', { snapshot, house, box, portals: plan.portals })
const profilingBefore = await client.request('/profiling?entityId=' + house.id)
const uploaded = await client.request('/scripts', { method: 'POST', json: { source } })
assert.equal(uploaded.url, desired.script)
assert.equal((await client.requestBytes('/assets/' + desired.script.slice(8))).bytes.toString(), source)
const latestHouse = await client.request('/entities/' + house.id)
unchanged(latestHouse, house)
const state = structuredClone(latestHouse.state)
desired = {
  ...desired,
  props: { ...desired.props,
    initialDoors: state.doors || desired.props.initialDoors,
    initialLighting: state.lighting || desired.props.initialLighting },
}
await fs.writeFile(new URL('house.hyp', directory), packHyp(desired, parsed.assets))
await save('desired-blueprint.json', desired)
const updated = await client.request('/apps/' + house.blueprint, {
  method: 'PATCH',
  json: { version: targets.blueprint.version, script: desired.script, props: desired.props },
})
assert.deepEqual(updated, desired)
for (const portal of plan.portals) {
  unchanged(await client.request('/entities/' + portal.entity.id), portal.entity)
  const moved = await client.request('/entities/' + portal.entity.id, { method: 'PATCH', json: portal.transform })
  for (const field of ['position', 'quaternion', 'scale']) assert.deepEqual(moved[field], portal.transform[field])
  assert.deepEqual(await client.request('/apps/' + portal.blueprint.id), portal.blueprint)
}
await new Promise(resolve => setTimeout(resolve, 1200))
const afterHouse = await client.request('/entities/' + house.id)
unchanged(afterHouse, house)
assert.deepEqual(afterHouse.state, state, 'Existing door and lighting state must survive')
// Consume the finished prompt only after all requested construction edits verify.
unchanged(await client.request('/entities/' + box.id), box)
assert.deepEqual(await client.request('/apps/' + box.blueprint), boxBlueprint)
await client.request('/entities/' + box.id, { method: 'DELETE' })
if (!profilingBefore.server.active) {
  await client.request('/profiling', { method: 'POST', json: { enabled: true } })
}
let profiling
try {
  await new Promise(resolve => setTimeout(resolve, 2400))
  profiling = await client.request('/profiling?entityId=' + house.id)
} finally {
  if (!profilingBefore.server.active) {
    await client.request('/profiling', { method: 'POST', json: { enabled: false } })
  }
}
const after = await client.request('/snapshot?excludeSeatPoses=true')
assert.deepEqual(after.world, snapshot.world)
assert(!after.entities.some(e => e.id === box.id))
for (const blueprint of snapshot.blueprints.filter(b => b.id !== house.blueprint)) {
  assert.deepEqual(after.blueprints.find(b => b.id === blueprint.id), blueprint)
}
for (const entity of snapshot.entities.filter(e => ![box.id, ...plan.portals.map(p => p.entity.id)].includes(e.id))) {
  const current = after.entities.find(e => e.id === entity.id)
  for (const field of fields) assert.deepEqual(current[field], entity[field], 'Unrelated placement changed: ' + entity.id)
}
const row = profiling.server.rows.find(r => r.id === house.id)
assert(!profiling.server.stale)
assert.equal(row.blueprintVersion, desired.version)
assert.equal(row.cpuMsPerSecond, 0)
await save('after.json', after)
await save('deployment.json', {
  ...report, verified: true, statePreserved: true,
  destinationsAndPortalIdsPreserved: true, housePlacementPreserved: true,
  otherBlueprintsAndPlacementsPreserved: true, completedPromptRemoved: true,
  uploadedSourceReadback: true, serverProfile: row,
  validation, physics, visual,
})
console.log(JSON.stringify({ deployed: true, version: desired.version, movedPortals: 2, idleServerCpu: row.cpuMsPerSecond }))
