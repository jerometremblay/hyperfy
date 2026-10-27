import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import * as THREE from 'three'
import { loadProfile, makeClient } from '../../../tools/worldsync/src/deployment.mjs'
import { parseHyp } from '../../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const json = async name => JSON.parse(await fs.readFile(new URL(name, directory)))
const before = await json('before.json')
const validation = await json('validation.json')
const rider = await json('rider-validation.json')
const desired = await json('desired-blueprint.json')
const casters = JSON.parse(await fs.readFile(new URL('../casters/validation.json', directory)))
for (const report of [validation, rider, casters]) {
  assert(report.valid && report.script === desired.script)
}
assert.equal(validation.checks.length, 5)
assert.equal(rider.checks.length, 9)
const source = await fs.readFile(new URL('../chair.js', directory), 'utf8')
const parsed = parseHyp(await fs.readFile(new URL('../chair.hyp', directory)))
assert.deepEqual(parsed.blueprint, desired)
assert.equal(parsed.assets.find(a => a.url === desired.script).bytes.toString(), source)
for (const field of Object.keys(before.blueprint).filter(k => !['script', 'version'].includes(k))) {
  assert.deepEqual(desired[field], before.blueprint[field], 'Unrelated blueprint change: ' + field)
}
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const [snapshot, blueprint, entity] = await Promise.all([
  client.request('/snapshot?excludeSeatPoses=true'),
  client.request('/apps/' + before.blueprint.id),
  client.request('/entities/' + before.entity.id),
])
assert.deepEqual(blueprint, before.blueprint, 'Live chair changed while preparing momentum')
assert.equal(snapshot.entities.filter(e => e.blueprint === blueprint.id).length, 1)
assert(!entity.mover && !entity.uploader)
const fields = ['id', 'blueprint', 'scale', 'pinned']
for (const field of fields) assert.deepEqual(entity[field], before.entity[field])
const plan = {
  target: profile.apiUrl, expectedVersion: blueprint.version, version: desired.version,
  occupied: !!entity.state?.slot?.owner, currentRidePlacementPreserved: true,
  nativeChecks: validation.checks.length + rider.checks.length,
  coastSecondsAtFullSpeed: .5, coastMetresAtFullSpeed: .3125,
}
console.log(JSON.stringify(plan))
if (!process.argv.includes('--write')) process.exit(0)
await fs.writeFile(new URL('pre-deploy.json', directory), JSON.stringify({ snapshot, blueprint, entity }, null, 2))
const uploaded = await client.request('/scripts', { method: 'POST', json: { source } })
assert.equal(uploaded.url, desired.script)
assert.equal((await client.requestBytes('/assets/' + uploaded.url.slice(8))).bytes.toString(), source)
assert.deepEqual(await client.request('/apps/' + blueprint.id), blueprint)
let latest = await client.request('/entities/' + entity.id)
assert(!latest.mover && !latest.uploader)
let endedRide = false
if (latest.state?.slot?.owner) {
  const pose = latest.state.pose
  assert(pose?.position && pose?.quaternion)
  await client.request('/entities/' + latest.id, {
    method: 'PATCH', json: { position: pose.position, quaternion: pose.quaternion },
  })
  endedRide = true
}
latest = await client.request('/entities/' + latest.id)
await fs.writeFile(new URL('placement-before.json', directory), JSON.stringify(latest, null, 2))
const updated = await client.request('/apps/' + blueprint.id, {
  method: 'PATCH', json: { version: blueprint.version, script: desired.script },
})
assert.deepEqual(updated, desired)
const immediatelyAfter = await client.request('/entities/' + latest.id)
assert(Math.hypot(immediatelyAfter.position[0] - latest.position[0],
  immediatelyAfter.position[2] - latest.position[2]) < 1e-7)
assert(new THREE.Quaternion().fromArray(immediatelyAfter.quaternion)
  .angleTo(new THREE.Quaternion().fromArray(latest.quaternion)) < 1e-7)
await new Promise(resolve => setTimeout(resolve, 1100))
const profilerBefore = await client.request('/profiling')
const enabledByUs = !profilerBefore.server.active
if (enabledByUs) await client.request('/profiling', { method: 'POST', json: { enabled: true } })
let profiling
try {
  await new Promise(resolve => setTimeout(resolve, 2300))
  profiling = await client.request('/profiling?entityId=' + entity.id)
} finally {
  if (enabledByUs) await client.request('/profiling', { method: 'POST', json: { enabled: false } })
}
const [after, finalEntity, finalBlueprint] = await Promise.all([
  client.request('/snapshot?excludeSeatPoses=true'),
  client.request('/entities/' + entity.id),
  client.request('/apps/' + blueprint.id),
])
assert.deepEqual(finalBlueprint, desired)
assert.deepEqual(after.world, snapshot.world)
for (const other of snapshot.blueprints.filter(b => b.id !== blueprint.id)) {
  assert.deepEqual(after.blueprints.find(b => b.id === other.id), other)
}
for (const other of snapshot.entities.filter(e => e.id !== entity.id)) {
  assert.deepEqual(after.entities.find(e => e.id === other.id), other)
}
for (const field of fields) assert.deepEqual(finalEntity[field], latest[field])
const row = profiling.server.rows.find(r => r.id === entity.id)
assert(row && row.blueprintVersion === desired.version && !profiling.server.stale)
assert(!Object.hasOwn(row.callbackMsPerSecond, 'fixedUpdate'))
assert(!Object.hasOwn(row.callbackMsPerSecond, 'update'))
const report = {
  verified: true, version: desired.version, script: desired.script, sourceReadback: true,
  onlyChairUpdated: true, otherBlueprintsAndPlacementsPreserved: true,
  preservedCurrentRidePosition: true, endedRideForUpdate: endedRide,
  nativeChecks: validation.checks.length + rider.checks.length, serverProfile: row,
  liveClientProfilingAvailable: profiling.clients.length > 0,
}
await fs.writeFile(new URL('after.json', directory), JSON.stringify(after, null, 2))
await fs.writeFile(new URL('deployment.json', directory), JSON.stringify(report, null, 2))
const objects = JSON.parse(await fs.readFile(new URL('../objects.json', directory)))
const chair = objects.find(o => o.key === 'chair')
chair.entity = { ...chair.entity, position: finalEntity.position, quaternion: finalEntity.quaternion,
  scale: finalEntity.scale, pinned: finalEntity.pinned }
const house = after.entities.find(e => e.id === 'HCzjtaVZFI')
const inverse = new THREE.Quaternion().fromArray(house.quaternion).invert()
chair.position = new THREE.Vector3().fromArray(finalEntity.position)
  .sub(new THREE.Vector3().fromArray(house.position)).applyQuaternion(inverse).toArray()
chair.rotation = new THREE.Euler().setFromQuaternion(inverse
  .multiply(new THREE.Quaternion().fromArray(finalEntity.quaternion)), 'YXZ').y
await fs.writeFile(new URL('../objects.json', directory), JSON.stringify(objects, null, 2))
console.log(JSON.stringify(report))
