import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { loadProfile, makeClient } from '../../../tools/worldsync/src/deployment.mjs'
import { parseHyp, packHyp } from '../../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const json = async name => JSON.parse(await read(name))
const save = (name, value) => fs.writeFile(new URL(name, directory), JSON.stringify(value, null, 2))
const before = await json('before.json')
const validation = await json('validation.json')
const physics = await json('physics-validation.json')
const actions = await json('action-validation.json')
const entry = await json('entry-validation.json')
const visual = await json('visual-validation.json')
assert(validation.valid && physics.valid && actions.valid && entry.valid && visual.valid)
const source = (await read('source.js')).toString()
const parsed = parseHyp(await read('house.hyp'))
let desired = parsed.blueprint
assert.equal(desired.script, validation.source)
assert.equal(desired.script, visual.source)
assert.equal(parsed.assets.find(a => a.url === desired.script).bytes.toString(), source)
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const fields = ['id', 'blueprint', 'position', 'quaternion', 'scale', 'pinned']
function unchanged(entity, previous) {
  for (const field of fields) assert.deepEqual(entity[field], previous[field],
    field + ' changed: ' + entity.id)
  assert(!entity.mover && !entity.uploader, 'A target is currently being edited: ' + entity.id)
}
const snapshot = await client.request('/snapshot?excludeSeatPoses=true')
const house = await client.request('/entities/' + before.entity.id)
unchanged(house, before.entity)
assert.deepEqual(await client.request('/apps/' + house.blueprint), before.blueprint)
assert.equal(snapshot.entities.filter(e => e.blueprint === house.blueprint).length, 1)
const portals = []
for (const id of ['PBETNgBqKt', 'OL3wuJiVCk']) {
  const previous = before.snapshot.entities.find(e => e.id === id)
  const entity = await client.request('/entities/' + id)
  unchanged(entity, previous)
  const blueprint = await client.request('/apps/' + entity.blueprint)
  // Door depth changes only the house script. Keep current portal inspector settings.
  const previousBlueprint = before.snapshot.blueprints.find(b => b.id === entity.blueprint)
  assert.equal(blueprint.model, previousBlueprint.model)
  assert.equal(blueprint.script, previousBlueprint.script)
  portals.push({ entity, blueprint })
}
console.log(JSON.stringify({ target: profile.apiUrl, houseId: house.id,
  expectedVersion: before.blueprint.version, newVersion: desired.version,
  doors: 'Two independent upstairs-size leaves inset 21 mm from the casing face' }))
if (!process.argv.includes('--write')) process.exit(0)
await save('pre-deploy.json', { snapshot, house, portals })
const uploaded = await client.request('/scripts', { method: 'POST', json: { source } })
assert.equal(uploaded.url, desired.script)
assert.equal((await client.requestBytes('/assets/' + desired.script.slice(8))).bytes.toString(), source)
const latest = await client.request('/entities/' + house.id)
unchanged(latest, house)
const state = structuredClone(latest.state)
desired = {
  ...desired,
  props: {
    ...desired.props,
    initialDoors: { ...desired.props.initialDoors, ...state.doors },
    initialLighting: state.lighting || desired.props.initialLighting,
  },
}
await fs.writeFile(new URL('house.hyp', directory), packHyp(desired, parsed.assets))
await save('desired-blueprint.json', desired)
const updated = await client.request('/apps/' + house.blueprint, {
  method: 'PATCH',
  json: { version: before.blueprint.version, script: desired.script, props: desired.props },
})
assert.deepEqual(updated, desired)
await new Promise(resolve => setTimeout(resolve, 1000))
const afterHouse = await client.request('/entities/' + house.id)
unchanged(afterHouse, house)
assert.deepEqual(afterHouse.state, state, 'All doors and lighting must retain their current state')
for (const portal of portals) {
  unchanged(await client.request('/entities/' + portal.entity.id), portal.entity)
  assert.deepEqual(await client.request('/apps/' + portal.blueprint.id), portal.blueprint)
}
const profilingBefore = await client.request('/profiling?entityId=' + house.id)
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
const row = profiling.server.rows.find(r => r.id === house.id)
assert(!profiling.server.stale)
assert.equal(row.blueprintVersion, desired.version)
assert.equal(row.cpuMsPerSecond, 0)
const after = await client.request('/snapshot?excludeSeatPoses=true')
for (const blueprint of snapshot.blueprints.filter(b => b.id !== house.blueprint)) {
  assert.deepEqual(after.blueprints.find(b => b.id === blueprint.id), blueprint)
}
for (const entity of snapshot.entities) {
  const current = after.entities.find(e => e.id === entity.id)
  for (const field of fields) assert.deepEqual(current[field], entity[field],
    'Unrelated placement changed: ' + entity.id)
}
await save('after.json', after)
await save('deployment.json', {
  verified: true, target: profile.apiUrl, version: desired.version, source: desired.script,
  uploadedSourceReadback: true, existingStatePreserved: true,
  portalBlueprintsAndTransformsPreserved: true,
  otherBlueprintsAndPlacementsPreserved: true, serverProfile: row,
  validation, physics, actions, entry, visual, state: afterHouse.state,
})
console.log(JSON.stringify({ deployed: true, version: desired.version, idleServerCpu: row.cpuMsPerSecond }))
