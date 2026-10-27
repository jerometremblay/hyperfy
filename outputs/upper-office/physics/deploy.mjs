import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { parseHyp } from '../../../tools/worldsync/src/hyp-format.mjs'
import { loadProfile, makeClient } from '../../../tools/worldsync/src/deployment.mjs'

const read = async name => JSON.parse(await fs.readFile('outputs/upper-office/' + name, 'utf8'))
const [before, objects, validation, physical] = await Promise.all([
  'physics/before.json', 'objects.json', 'validation.json', 'physics/validation.json',
].map(read))
assert(validation.valid && physical.valid)
assert.equal(physical.checks.length, 5)
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const snapshot = await client.request('/snapshot?excludeSeatPoses=true')
const plans = []
for (const object of objects) {
  const original = before.furniture.find(f => f.key === object.key)
  const blueprint = await client.request('/apps/' + object.blueprint.id)
  const entity = await client.request('/entities/' + object.entity.id)
  assert.deepEqual(blueprint, original.blueprint, 'Furniture blueprint changed during preparation')
  assert(!entity.mover && !entity.uploader, 'Furniture is currently being edited')
  assert.equal(entity.blueprint, blueprint.id)
  assert.equal(snapshot.entities.filter(e => e.blueprint === blueprint.id).length, 1)
  const source = await fs.readFile('outputs/upper-office/' + object.key + '.js', 'utf8')
  const hash = 'asset://' + createHash('sha256').update(source).digest('hex') + '.js'
  assert.equal(hash, object.blueprint.script)
  assert.equal(hash, physical.scripts[object.key], 'Runtime tests must cover these exact bytes')
  const parsed = parseHyp(await fs.readFile('outputs/upper-office/' + object.key + '.hyp'))
  assert.deepEqual(parsed.blueprint, object.blueprint)
  assert.equal(Buffer.from(parsed.assets.find(a => a.url === hash).bytes).toString('utf8'), source)
  plans.push({ object, original, blueprint, entity, source })
}
console.log(JSON.stringify({ target: profile.apiUrl, updates: plans.map(p => ({
  key: p.object.key, entityId: p.entity.id, blueprintId: p.blueprint.id,
  fromVersion: p.blueprint.version, toVersion: p.object.blueprint.version,
  preservePosition: p.entity.position, physics: true,
})) }, null, 2))
if (!process.argv.includes('--write')) process.exit(0)
await fs.writeFile('outputs/upper-office/physics/pre-deploy.json', JSON.stringify(snapshot, null, 2))
const applied = []
for (const plan of plans) {
  const uploaded = await client.request('/scripts', { method: 'POST', json: { source: plan.source } })
  assert.equal(uploaded.url, plan.object.blueprint.script)
  assert.equal((await client.requestBytes('/assets/' + uploaded.url.slice(8))).bytes.toString('utf8'), plan.source)
  const current = await client.request('/apps/' + plan.blueprint.id)
  assert.deepEqual(current, plan.blueprint)
  const placement = await client.request('/entities/' + plan.entity.id)
  assert(!placement.mover && !placement.uploader)
  const updated = await client.request('/apps/' + plan.blueprint.id, {
    method: 'PATCH', json: { version: current.version, script: uploaded.url, desc: plan.object.blueprint.desc },
  })
  assert.deepEqual(updated, plan.object.blueprint)
  applied.push({ key: plan.object.key, blueprint: updated, placementBefore: placement })
  await fs.writeFile('outputs/upper-office/physics/applied.json', JSON.stringify(applied, null, 2))
}
await new Promise(resolve => setTimeout(resolve, 1100))
const previousProfile = await client.request('/profiling')
await client.request('/profiling', { method: 'POST', json: { enabled: true } })
let profileReport
try {
  await new Promise(resolve => setTimeout(resolve, 2200))
  profileReport = await client.request('/profiling')
} finally {
  await client.request('/profiling', { method: 'POST', json: { enabled: previousProfile.server.active } })
}
const after = await client.request('/snapshot?excludeSeatPoses=true')
const ids = objects.map(o => o.entity.id)
const blueprintIds = objects.map(o => o.blueprint.id)
assert.deepEqual(after.world, snapshot.world)
for (const bp of snapshot.blueprints) {
  if (!blueprintIds.includes(bp.id)) assert.deepEqual(after.blueprints.find(b => b.id === bp.id), bp)
}
for (const entity of snapshot.entities) {
  if (!ids.includes(entity.id)) assert.deepEqual(after.entities.find(e => e.id === entity.id), entity)
}
const results = []
for (const plan of plans) {
  const bp = await client.request('/apps/' + plan.blueprint.id)
  const entity = await client.request('/entities/' + plan.entity.id)
  assert.deepEqual(bp, plan.object.blueprint)
  assert.equal(entity.position[0], plan.entity.position[0])
  assert.equal(entity.position[2], plan.entity.position[2])
  assert(Math.abs(entity.position[1] - plan.entity.position[1]) < 0.01)
  assert.deepEqual(entity.scale, plan.entity.scale)
  assert.equal(entity.pinned, plan.entity.pinned)
  assert.equal(after.entities.filter(e => e.blueprint === bp.id).length, 1)
  const row = profileReport.server.rows.find(r => r.id === entity.id)
  assert(row)
  assert.equal(row.blueprintVersion, bp.version)
  if (!entity.state?.slot?.owner && !entity.mover) {
    assert.equal(row.cpuMsPerSecond, 0)
    assert.deepEqual(row.callbackMsPerSecond, {})
  }
  results.push({ key: plan.object.key, version: bp.version, position: entity.position, serverProfile: row,
    state: entity.state })
}
assert.equal(profileReport.server.stale, false)
const report = {
  verified: true, target: profile.apiUrl, sourceReadback: true,
  individualPhysicalObjects: 2, ownerPlacementsPreserved: true,
  houseAndOtherObjectsUnchanged: true, actualEngineRuntimeTests: physical,
  furniture: results,
}
await fs.writeFile('outputs/upper-office/physics/after.json', JSON.stringify(after, null, 2))
await fs.writeFile('outputs/upper-office/physics/deployment.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
