import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { loadProfile, makeClient } from '../../../tools/worldsync/src/deployment.mjs'
import { parseHyp, packHyp } from '../../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('../', import.meta.url)
const readJson = async name => JSON.parse(await fs.readFile(new URL(name, directory), 'utf8'))
const before = await readJson('sliding/live-before.json')
let desired = await readJson('desired-blueprint.json')
const validation = await readJson('validation.json')
assert.equal(validation.valid, true)
assert.equal(validation.patioDoor.zeroRotation, 'pass')
const profile = await loadProfile('/Users/jerome/metaverse/hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const [blueprint, entity, snapshot, profileBefore] = await Promise.all([
  client.request('/apps/' + before.blueprint.id),
  client.request('/entities/' + before.entity.id),
  client.request('/snapshot?excludeSeatPoses=true'),
  client.request('/profiling?entityId=' + before.entity.id),
])
assert.deepEqual(blueprint, before.blueprint, 'Live house source changed')
for (const field of ['id', 'blueprint', 'position', 'quaternion', 'scale', 'pinned']) {
  assert.deepEqual(entity[field], before.entity[field], 'House placement changed: ' + field)
}
assert(!entity.mover && !entity.uploader, 'House is being edited')
assert.equal(snapshot.entities.filter(e => e.blueprint === blueprint.id).length, 1)
function stateForSlider(state) {
  const expected = structuredClone(state)
  if (expected.doors['patio-right']) expected.doors['patio-left'] = true
  delete expected.doors['patio-right']
  return expected
}
assert.equal(desired.version, blueprint.version + 1)
const parsed = parseHyp(await fs.readFile(new URL('house-extension.hyp', directory)))
assert.deepEqual(parsed.blueprint, desired)
const source = await fs.readFile(new URL('source.js', directory), 'utf8')
assert.equal(parsed.assets.find(a => a.url === desired.script).bytes.toString('utf8'), source)
function seedState(state) {
  desired = { ...desired, props: { ...desired.props, initialDoors: state.doors, initialLighting: state.lighting } }
}
seedState(stateForSlider(entity.state))
const plan = {
  target: profile.apiUrl, entityId: entity.id, blueprintId: blueprint.id,
  expectedVersion: blueprint.version, version: desired.version,
  motion: 'left panel slides behind the fixed right panel',
  slideMetres: 1.365, rotation: 0, preserveState: true,
}
console.log(JSON.stringify(plan, null, 2))
if (!process.argv.includes('--write')) process.exit(0)

await fs.writeFile(new URL('sliding/pre-deploy.json', directory), JSON.stringify({ entity, blueprint, snapshot }, null, 2))
const uploaded = await client.request('/scripts', { method: 'POST', json: { source } })
assert.equal(uploaded.url, desired.script)
assert.equal((await client.requestBytes('/assets/' + desired.script.slice(8))).bytes.toString('utf8'), source)
// Doors may be used while the source is prepared. Take their latest values
// immediately before the blueprint rebuild, rather than replaying an old seed.
const latestEntity = await client.request('/entities/' + entity.id)
for (const field of ['id', 'blueprint', 'position', 'quaternion', 'scale', 'pinned']) {
  assert.deepEqual(latestEntity[field], entity[field], 'House placement changed during upload')
}
assert(!latestEntity.mover && !latestEntity.uploader)
const expectedState = stateForSlider(latestEntity.state)
seedState(expectedState)
await fs.writeFile(new URL('house-extension.hyp', directory), packHyp(desired, parsed.assets))
await fs.writeFile(new URL('desired-blueprint.json', directory), JSON.stringify(desired, null, 2))
await fs.writeFile(new URL('initial-state.json', directory), JSON.stringify(expectedState, null, 2))
const updated = await client.request('/apps/' + blueprint.id, {
  method: 'PATCH',
  json: { version: blueprint.version, script: desired.script, desc: desired.desc, props: desired.props },
})
assert.deepEqual(updated, desired)
await new Promise(resolve => setTimeout(resolve, 1500))
const house = await client.request('/entities/' + entity.id)
assert.deepEqual(house, { ...latestEntity, state: expectedState }, 'Door or lighting state was not restored')
await client.request('/profiling', { method: 'POST', json: { enabled: true } })
let profiler
try {
  await new Promise(resolve => setTimeout(resolve, 2300))
  profiler = await client.request('/profiling?entityId=' + entity.id)
} finally {
  await client.request('/profiling', { method: 'POST', json: { enabled: profileBefore.server.active } })
}
const after = await client.request('/snapshot?excludeSeatPoses=true')
assert.deepEqual(after.world, snapshot.world)
assert.deepEqual(after.entities, snapshot.entities)
for (const app of snapshot.blueprints.filter(b => b.id !== blueprint.id)) {
  assert.deepEqual(after.blueprints.find(b => b.id === app.id), app)
}
assert.deepEqual(after.blueprints.find(b => b.id === blueprint.id), desired)
assert.equal(profiler.server.stale, false)
const row = profiler.server.rows.find(r => r.id === entity.id)
assert.equal(row.blueprintVersion, desired.version)
assert.equal(row.cpuMsPerSecond, 0)
const report = {
  ...plan, verified: true, sourceReadback: true, statePreserved: true,
  transformsAndOtherAppsPreserved: true,
  serverProfile: profiler.server,
  runtimeChecks: 'Translation, collision placement, reversal and server authority verified in the actual-node harness; live API source/state readback and server idle profiling verified',
}
await fs.writeFile(new URL('sliding/deployment.json', directory), JSON.stringify(report, null, 2))
await fs.writeFile(new URL('deployment.json', directory), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
