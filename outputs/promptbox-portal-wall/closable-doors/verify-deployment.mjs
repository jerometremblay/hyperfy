import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { loadProfile, makeClient } from '../../../tools/worldsync/src/deployment.mjs'

const directory = new URL('./', import.meta.url)
const json = async name => JSON.parse(await fs.readFile(new URL(name, directory)))
const save = (name, value) => fs.writeFile(new URL(name, directory), JSON.stringify(value, null, 2))
const before = await json('pre-deploy.json')
const desired = await json('desired-blueprint.json')
const client = makeClient(await loadProfile('../hyperfy-world-jerome', 'online-world'))
assert.deepEqual(await client.request('/apps/' + desired.id), desired)
assert.equal((await client.requestBytes('/assets/' + desired.script.slice(8))).bytes.toString(),
  await fs.readFile(new URL('source.js', directory), 'utf8'))
const fields = ['id', 'blueprint', 'position', 'quaternion', 'scale', 'pinned']
const house = await client.request('/entities/' + before.house.id)
for (const field of fields) assert.deepEqual(house[field], before.house[field])
for (const [id, open] of Object.entries(before.house.state.doors)) {
  assert.equal(house.state.doors[id], open)
}
assert.deepEqual(house.state.lighting, before.house.state.lighting)
for (const id of ['billiards-portal-left', 'billiards-portal-right']) {
  assert.equal(desired.props.initialDoors[id], false)
  assert.equal(typeof house.state.doors[id], 'boolean')
}
for (const portal of before.portals) {
  const current = await client.request('/entities/' + portal.entity.id)
  for (const field of fields) assert.deepEqual(current[field], portal.entity[field])
  assert.deepEqual(await client.request('/apps/' + portal.blueprint.id), portal.blueprint)
}
const oldProfile = await client.request('/profiling?entityId=' + house.id)
if (!oldProfile.server.active) await client.request('/profiling', { method: 'POST', json: { enabled: true } })
let profile
try {
  await new Promise(resolve => setTimeout(resolve, 2400))
  profile = await client.request('/profiling?entityId=' + house.id)
} finally {
  if (!oldProfile.server.active) await client.request('/profiling', { method: 'POST', json: { enabled: false } })
}
const row = profile.server.rows.find(r => r.id === house.id)
assert(!profile.server.stale)
assert.equal(row.blueprintVersion, desired.version)
assert.equal(row.cpuMsPerSecond, 0)
const after = await client.request('/snapshot?excludeSeatPoses=true')
for (const blueprint of before.snapshot.blueprints.filter(b => b.id !== house.blueprint)) {
  assert.deepEqual(after.blueprints.find(b => b.id === blueprint.id), blueprint)
}
for (const entity of before.snapshot.entities) {
  const current = after.entities.find(e => e.id === entity.id)
  for (const field of fields) assert.deepEqual(current[field], entity[field])
}
await save('after.json', after)
await save('deployment.json', {
  verified: true, target: 'https://monstre.duckdns.org:3333', version: desired.version,
  source: desired.script, uploadedSourceReadback: true,
  existingDoorAndLightingStatePreserved: true, twoNewDoorsInitiallyClosed: true,
  liveDoorInteractionObserved: Object.entries(house.state.doors)
    .some(([id, open]) => id.startsWith('billiards-portal-') && open),
  portalBlueprintsAndTransformsPreserved: true, otherBlueprintsAndPlacementsPreserved: true,
  serverProfile: row, state: house.state,
  validation: await json('validation.json'), physics: await json('physics-validation.json'),
  actions: await json('action-validation.json'), visual: await json('visual-validation.json'),
})
console.log(JSON.stringify({ verified: true, version: desired.version, serverProfile: row, state: house.state }))
