import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { parseHyp } from '../../../tools/worldsync/src/hyp-format.mjs'
import { loadProfile, makeClient } from '../../../tools/worldsync/src/deployment.mjs'
const read = async name => JSON.parse(await fs.readFile('outputs/upper-office/' + name, 'utf8'))
const [before, objects, physics, casters] = await Promise.all([
  'casters/before.json', 'objects.json', 'physics/validation.json', 'casters/validation.json',
].map(read))
assert(physics.valid && casters.valid)
assert.equal(physics.checks.length, 6)
const object = objects.find(o => o.key === 'chair')
const original = before.furniture.find(o => o.key === 'chair')
assert.equal(object.blueprint.script, physics.scripts.chair)
assert.equal(object.blueprint.script, casters.script)
const source = await fs.readFile('outputs/upper-office/chair.js', 'utf8')
const parsed = parseHyp(await fs.readFile('outputs/upper-office/chair.hyp'))
assert.deepEqual(parsed.blueprint, object.blueprint)
assert.equal(Buffer.from(parsed.assets.find(a => a.url === object.blueprint.script).bytes).toString('utf8'), source)
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const snapshot = await client.request('/snapshot?excludeSeatPoses=true')
const blueprint = await client.request('/apps/' + original.blueprint.id)
assert.deepEqual(blueprint, original.blueprint, 'Chair blueprint changed during preparation')
assert.equal(snapshot.entities.filter(e => e.blueprint === blueprint.id).length, 1)
let placement = await client.request('/entities/' + object.entity.id)
assert(!placement.mover && !placement.uploader)
console.log(JSON.stringify({ target: profile.apiUrl, chairId: object.entity.id,
  version: [blueprint.version, object.blueprint.version], occupied: !!placement.state?.slot?.owner,
  currentPosition: placement.state?.pose?.position || placement.position }, null, 2))
if (!process.argv.includes('--write')) process.exit(0)
await fs.writeFile('outputs/upper-office/casters/pre-deploy.json', JSON.stringify(snapshot, null, 2))
const uploaded = await client.request('/scripts', { method: 'POST', json: { source } })
assert.equal(uploaded.url, object.blueprint.script)
assert.equal((await client.requestBytes('/assets/' + uploaded.url.slice(8))).bytes.toString('utf8'), source)
assert.deepEqual(await client.request('/apps/' + blueprint.id), blueprint)
placement = await client.request('/entities/' + object.entity.id)
assert(!placement.mover && !placement.uploader)
let endedRide = false
if (placement.state?.slot?.owner) {
  // A script update rebuilds the chair. First save its current authoritative
  // pose via the supported instance API; the existing seating cleanup then
  // stands the rider safely instead of reverting to a previous saved position.
  const current = placement.state.pose
  assert(current?.position && current?.quaternion)
  placement = await client.request('/entities/' + object.entity.id, {
    method: 'PATCH', json: { position: current.position, quaternion: current.quaternion },
  })
  endedRide = true
}
const saved = await client.request('/entities/' + object.entity.id)
await fs.writeFile('outputs/upper-office/casters/placement-before.json', JSON.stringify(saved, null, 2))
const updated = await client.request('/apps/' + blueprint.id, {
  method: 'PATCH', json: { version: blueprint.version, script: uploaded.url, desc: object.blueprint.desc },
})
assert.deepEqual(updated, object.blueprint)
const immediatelyAfter = await client.request('/entities/' + object.entity.id)
assert.equal(immediatelyAfter.position[0], saved.position[0])
assert.equal(immediatelyAfter.position[2], saved.position[2])
await fs.writeFile('outputs/upper-office/casters/applied.json', JSON.stringify(updated, null, 2))
await new Promise(resolve => setTimeout(resolve, 1000))
const previousProfile = await client.request('/profiling')
const enabledByUs = !previousProfile.server.active
if (enabledByUs) await client.request('/profiling', { method: 'POST', json: { enabled: true } })
let profiling
try {
  await new Promise(resolve => setTimeout(resolve, 2200))
  profiling = await client.request('/profiling')
} finally {
  if (enabledByUs) await client.request('/profiling', { method: 'POST', json: { enabled: false } })
}
const after = await client.request('/snapshot?excludeSeatPoses=true')
assert.deepEqual(after.world, snapshot.world)
for (const bp of snapshot.blueprints) {
  if (bp.id !== blueprint.id) assert.deepEqual(after.blueprints.find(b => b.id === bp.id), bp)
}
for (const entity of snapshot.entities) {
  if (entity.id !== object.entity.id) assert.deepEqual(after.entities.find(e => e.id === entity.id), entity)
}
const entity = await client.request('/entities/' + object.entity.id)
assert.deepEqual(await client.request('/apps/' + blueprint.id), object.blueprint)
assert.deepEqual(entity.scale, saved.scale)
assert.equal(entity.pinned, saved.pinned)
const row = profiling.server.rows.find(r => r.id === entity.id)
assert(row && row.blueprintVersion === updated.version && !profiling.server.stale)
if (!entity.state?.slot?.owner) {
  assert.equal(row.cpuMsPerSecond, 0)
  assert.deepEqual(row.callbackMsPerSecond, {})
}
const report = { verified: true, sourceReadback: true, onlyChairUpdated: true,
  deskHouseAndOtherObjectsUnchanged: true, preservedCurrentRidePosition: true,
  positionBeforeUpdate: saved.position, positionImmediatelyAfterUpdate: immediatelyAfter.position,
  endedRideForUpdate: endedRide, version: updated.version, entity,
  casterValidation: casters, runtimeValidation: physics, serverProfile: row }
await fs.writeFile('outputs/upper-office/casters/after.json', JSON.stringify(after, null, 2))
await fs.writeFile('outputs/upper-office/casters/deployment.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
