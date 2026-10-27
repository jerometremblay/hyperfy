import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import * as THREE from 'three'
import { parseHyp } from '../../../tools/worldsync/src/hyp-format.mjs'
import { loadProfile, makeClient } from '../../../tools/worldsync/src/deployment.mjs'

const directory = new URL('../', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const json = async name => JSON.parse(await read(name))
const before = await json('rider-control/before.json')
const validation = await json('rider-control/validation.json')
const casters = await json('casters/validation.json')
const desired = await json('rider-control/desired-blueprint.json')
assert(validation.valid && validation.script === desired.script)
assert.equal(validation.checks.length, 9)
assert.equal(validation.metrics.shortTaps.length, 24)
assert(casters.valid && casters.script === desired.script)
const source = (await read('chair.js')).toString()
const parsed = parseHyp(await read('chair.hyp'))
assert.deepEqual(parsed.blueprint, desired)
assert.equal(parsed.assets.find(a => a.url === desired.script).bytes.toString(), source)
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const [snapshot, blueprint, placement] = await Promise.all([
  client.request('/snapshot?excludeSeatPoses=true'),
  client.request('/apps/' + before.blueprint.id),
  client.request('/entities/' + before.entity.id),
])
assert.deepEqual(blueprint, before.blueprint, 'Chair blueprint changed during preparation')
assert.equal(snapshot.entities.filter(e => e.blueprint === blueprint.id).length, 1)
assert(!placement.mover && !placement.uploader)
console.log(JSON.stringify({ target: profile.apiUrl, version: [blueprint.version, desired.version],
  occupied: !!placement.state?.slot?.owner,
  currentPosition: placement.state?.pose?.position || placement.position,
  nativeChecks: validation.checks.length, shortTapCases: validation.metrics.shortTaps.length }, null, 2))
if (!process.argv.includes('--write')) process.exit(0)
await fs.writeFile(new URL('rider-control/pre-deploy.json', directory),
  JSON.stringify({ snapshot, blueprint, placement }, null, 2))
const uploaded = await client.request('/scripts', { method: 'POST', json: { source } })
assert.equal(uploaded.url, desired.script)
assert.equal((await client.requestBytes('/assets/' + uploaded.url.slice(8))).bytes.toString(), source)
assert.deepEqual(await client.request('/apps/' + blueprint.id), blueprint)
let latest = await client.request('/entities/' + placement.id)
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
await fs.writeFile(new URL('rider-control/placement-before.json', directory), JSON.stringify(latest, null, 2))
const updated = await client.request('/apps/' + blueprint.id, {
  method: 'PATCH', json: { version: blueprint.version, script: desired.script },
})
assert.deepEqual(updated, desired)
const immediatelyAfter = await client.request('/entities/' + latest.id)
assert.equal(immediatelyAfter.position[0], latest.position[0])
assert.equal(immediatelyAfter.position[2], latest.position[2])
assert.deepEqual(immediatelyAfter.quaternion, latest.quaternion)
await new Promise(resolve => setTimeout(resolve, 1000))
const profileBefore = await client.request('/profiling')
const enabledByUs = !profileBefore.server.active
if (enabledByUs) await client.request('/profiling', { method: 'POST', json: { enabled: true } })
let profiling
try {
  await new Promise(resolve => setTimeout(resolve, 2200))
  profiling = await client.request('/profiling?entityId=' + latest.id)
} finally {
  if (enabledByUs) await client.request('/profiling', { method: 'POST', json: { enabled: false } })
}
const [after, entity, readback] = await Promise.all([
  client.request('/snapshot?excludeSeatPoses=true'),
  client.request('/entities/' + latest.id),
  client.request('/apps/' + blueprint.id),
])
assert.deepEqual(readback, desired)
assert.deepEqual(after.world, snapshot.world)
for (const bp of snapshot.blueprints.filter(b => b.id !== blueprint.id)) {
  assert.deepEqual(after.blueprints.find(b => b.id === bp.id), bp)
}
for (const e of snapshot.entities.filter(e => e.id !== entity.id)) {
  assert.deepEqual(after.entities.find(a => a.id === e.id), e)
}
assert.deepEqual(entity.scale, latest.scale)
assert.equal(entity.pinned, latest.pinned)
const row = profiling.server.rows.find(r => r.id === entity.id)
assert(row && row.blueprintVersion === desired.version && !profiling.server.stale)
assert(!Object.hasOwn(row.callbackMsPerSecond, 'fixedUpdate'))
assert(!Object.hasOwn(row.callbackMsPerSecond, 'update'))
const report = {
  verified: true, version: desired.version, script: desired.script, sourceReadback: true,
  onlyChairUpdated: true, deskHouseAndOtherObjectsUnchanged: true,
  preservedCurrentRidePosition: true, endedRideForUpdate: endedRide,
  positionBeforeUpdate: latest.position, positionImmediatelyAfterUpdate: immediatelyAfter.position,
  nativeRiderControlValidation: validation, casterValidation: casters, serverProfile: row,
  liveClientProfilingAvailable: profiling.clients.length > 0,
}
await fs.writeFile(new URL('rider-control/after.json', directory), JSON.stringify(after, null, 2))
await fs.writeFile(new URL('rider-control/deployment.json', directory), JSON.stringify(report, null, 2))
const objects = await json('objects.json')
const chair = objects.find(o => o.key === 'chair')
chair.entity = { ...chair.entity, position: entity.position, quaternion: entity.quaternion,
  scale: entity.scale, pinned: entity.pinned }
const house = after.entities.find(e => e.id === 'HCzjtaVZFI')
const inverse = new THREE.Quaternion().fromArray(house.quaternion).invert()
chair.position = new THREE.Vector3().fromArray(entity.position)
  .sub(new THREE.Vector3().fromArray(house.position)).applyQuaternion(inverse).toArray()
chair.rotation = new THREE.Euler().setFromQuaternion(inverse
  .multiply(new THREE.Quaternion().fromArray(entity.quaternion)), 'YXZ').y
await fs.writeFile(new URL('objects.json', directory), JSON.stringify(objects, null, 2))
console.log(JSON.stringify(report, null, 2))
