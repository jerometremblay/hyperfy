import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'

const directory = new URL('./', import.meta.url)
const readJson = async name => JSON.parse(await fs.readFile(new URL(name, directory), 'utf8'))
const [before, objects, validation] = await Promise.all(['before.json', 'objects.json', 'validation.json'].map(readJson))
assert.equal(validation.valid, true)
assert.equal(validation.individualFurnitureObjects, 2)
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const snapshot = await client.request('/snapshot?excludeSeatPoses=true')
assert.deepEqual(snapshot.blueprints.find(b => b.id === before.blueprint.id), before.blueprint,
  'The house changed while the furniture was prepared')
assert.deepEqual(snapshot.entities.find(e => e.id === before.house.id),
  before.snapshot.entities.find(e => e.id === before.house.id), 'The house placement changed')
for (const object of objects) {
  const blueprint = snapshot.blueprints.find(b => b.id === object.blueprint.id)
  if (blueprint) assert.deepEqual(blueprint, object.blueprint, 'Furniture blueprint ID conflict')
  const entity = snapshot.entities.find(e => e.id === object.entity.id)
  if (entity) assert.deepEqual(entity, object.entity, 'Furniture entity ID conflict')
  const parsed = parseHyp(await fs.readFile(new URL(object.key + '.hyp', directory)))
  assert.deepEqual(parsed.blueprint, object.blueprint)
  assert(Buffer.from(parsed.assets.find(a => a.url === object.blueprint.script).bytes)
    .equals(await fs.readFile(new URL(object.key + '.js', directory))))
}
const plan = {
  target: profile.apiUrl,
  houseVersion: before.blueprint.version,
  objects: objects.map(o => ({ key: o.key, blueprintId: o.blueprint.id, entityId: o.entity.id, position: o.entity.position,
    houseLocalPosition: o.position, individuallyMovable: !o.entity.pinned })),
}
console.log(JSON.stringify(plan, null, 2))
if (!process.argv.includes('--write')) process.exit(0)
await fs.writeFile(new URL('pre-deploy.json', directory), JSON.stringify(snapshot, null, 2))
const created = []
for (const object of objects) {
  const source = await fs.readFile(new URL(object.key + '.js', directory), 'utf8')
  const uploaded = await client.request('/scripts', { method: 'POST', json: { source } })
  assert.equal(uploaded.url, object.blueprint.script)
  assert.equal((await client.requestBytes('/assets/' + uploaded.url.slice(8))).bytes.toString('utf8'), source)
  const { version, scene, ...body } = object.blueprint
  const blueprint = await client.request('/apps', { method: 'POST', json: body })
  assert.deepEqual(blueprint, object.blueprint)
  // Before adding another instance, verify that the room's transform and source
  // still match the reviewed placement.
  const house = await client.request('/entities/' + before.house.id)
  const currentHouse = await client.request('/apps/' + before.blueprint.id)
  assert.deepEqual(currentHouse, before.blueprint)
  for (const key of ['position', 'quaternion', 'scale', 'pinned']) assert.deepEqual(house[key], before.house[key])
  const entity = await client.request('/entities', { method: 'POST', json: object.entity })
  for (const [key, value] of Object.entries(object.entity)) assert.deepEqual(entity[key], value)
  created.push({ key: object.key, blueprint, entity })
  await fs.writeFile(new URL('created.json', directory), JSON.stringify(created, null, 2))
}
await new Promise(resolve => setTimeout(resolve, 1200))
const profilingBefore = await client.request('/profiling')
await client.request('/profiling', { method: 'POST', json: { enabled: true } })
let profiler
try {
  await new Promise(resolve => setTimeout(resolve, 2300))
  profiler = await client.request('/profiling')
} finally {
  await client.request('/profiling', { method: 'POST', json: { enabled: profilingBefore.server.active } })
}
const after = await client.request('/snapshot?excludeSeatPoses=true')
assert.deepEqual(after.world, snapshot.world)
for (const blueprint of snapshot.blueprints) {
  assert.deepEqual(after.blueprints.find(b => b.id === blueprint.id), blueprint)
}
for (const entity of snapshot.entities) {
  assert.deepEqual(after.entities.find(e => e.id === entity.id), entity)
}
const ids = objects.map(o => o.entity.id)
const newEntities = after.entities.filter(e => !snapshot.entities.some(original => original.id === e.id))
assert(newEntities.every(e => ids.includes(e.id)), 'Unexpected additional entity')
for (const object of objects) {
  assert.deepEqual(after.blueprints.find(b => b.id === object.blueprint.id), object.blueprint)
  assert.deepEqual(after.entities.find(e => e.id === object.entity.id), object.entity)
  assert.equal(after.entities.filter(e => e.blueprint === object.blueprint.id).length, 1)
  const row = profiler.server.rows.find(r => r.id === object.entity.id)
  assert(row)
  assert.equal(row.blueprintVersion, 0)
  assert.equal(row.cpuMsPerSecond, 0)
  assert.deepEqual(row.callbackMsPerSecond, {})
}
assert.equal(profiler.server.stale, false)
const report = {
  ...plan, verified: true, independentlySelectableApps: 2,
  sourceReadback: true, transformsVerified: true, houseAndOtherObjectsUnchanged: true,
  serverProfile: { ...profiler.server, rows: profiler.server.rows.filter(r => ids.includes(r.id)) },
}
await fs.writeFile(new URL('after.json', directory), JSON.stringify(after, null, 2))
await fs.writeFile(new URL('deployment.json', directory), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
