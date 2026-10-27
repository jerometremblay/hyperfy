import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'

const dir = new URL('./', import.meta.url)
const read = async name => JSON.parse(await fs.readFile(new URL(name, dir)))
const [object, validation, before] = await Promise.all(
  ['object.json', 'validation.json', 'deployment-baseline.json'].map(read)
)
assert.equal(validation.valid, true)
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const snapshot = await client.request('/snapshot?excludeSeatPoses=true')
const deskBlueprint = before.blueprints.find(b => b.id === object.desk.blueprint)
assert.deepEqual(
  snapshot.blueprints.find(b => b.id === deskBlueprint.id),
  deskBlueprint,
  'Desk changed during preparation'
)
assert.deepEqual(
  snapshot.entities.find(e => e.id === object.desk.id),
  object.desk,
  'Desk placement changed during preparation'
)
const parsed = parseHyp(await fs.readFile(new URL('macbook-pro-16.hyp', dir)))
assert.deepEqual(parsed.blueprint, object.blueprint)
const source = await fs.readFile(new URL('macbook.js', dir), 'utf8')
assert.equal(Buffer.from(parsed.assets.find(a => a.type === 'script').bytes).toString(), source)
const existingBlueprint = snapshot.blueprints.find(b => b.id === object.blueprint.id)
const existingEntity = snapshot.entities.find(e => e.id === object.entity.id)
if (existingBlueprint && existingBlueprint.script !== object.blueprint.script) {
  const previous = before.blueprints.find(b => b.id === object.blueprint.id)
  assert.deepEqual(existingBlueprint, previous, 'Laptop changed since preparation')
  assert.equal(object.blueprint.version, existingBlueprint.version + 1)
} else if (existingBlueprint) {
  assert.deepEqual(existingBlueprint, object.blueprint, 'Laptop blueprint ID conflict')
}
if (existingEntity) {
  for (const [key, value] of Object.entries(object.entity))
    assert.deepEqual(existingEntity[key], value, 'Laptop entity ID conflict')
}
console.log(
  JSON.stringify({
    target: profile.apiUrl,
    name: object.blueprint.name,
    position: object.entity.position,
    independent: true,
  })
)
if (!process.argv.includes('--write')) process.exit(0)
await fs.writeFile(new URL('pre-deploy.json', dir), JSON.stringify(snapshot, null, 2))
for (const asset of parsed.assets) {
  if (asset.type === 'script') {
    const uploaded = await client.request('/scripts', { method: 'POST', json: { source } })
    assert.equal(uploaded.url, asset.url)
  } else {
    const [sha256, extension] = asset.url.slice(8).split('.')
    await client.uploadAsset({
      ...asset,
      extension,
      sha256,
      source: 'standalone-package',
    })
  }
  assert(
    Buffer.from((await client.requestBytes('/assets/' + asset.url.slice(8))).bytes).equals(Buffer.from(asset.bytes))
  )
}
if (!existingBlueprint) {
  const { version, scene, ...body } = object.blueprint
  const blueprint = await client.request('/apps', { method: 'POST', json: body })
  assert.deepEqual(blueprint, object.blueprint)
} else if (existingBlueprint.script !== object.blueprint.script) {
  const { id, version, scene, ...body } = object.blueprint
  const updated = await client.request('/apps/' + id, {
    method: 'PATCH',
    json: { ...body, version: existingBlueprint.version },
  })
  assert.deepEqual(updated, object.blueprint)
}
// Recheck placement at the point of instantiation.
const currentDesk = await client.request('/entities/' + object.desk.id)
for (const [key, value] of Object.entries(object.desk)) assert.deepEqual(currentDesk[key], value)
assert.equal(currentDesk.mover, null)
assert.equal(currentDesk.uploader, null)
if (!existingEntity) await client.request('/entities', { method: 'POST', json: object.entity })
const after = await client.request('/snapshot?excludeSeatPoses=true')
assert.deepEqual(
  after.blueprints.find(b => b.id === object.blueprint.id),
  object.blueprint
)
for (const [key, value] of Object.entries(object.entity)) {
  assert.deepEqual(after.entities.find(e => e.id === object.entity.id)[key], value)
}
for (const blueprint of snapshot.blueprints) {
  if (blueprint.id !== object.blueprint.id) {
    assert.deepEqual(
      after.blueprints.find(b => b.id === blueprint.id),
      blueprint
    )
  }
}
for (const entity of snapshot.entities) {
  const current = after.entities.find(e => e.id === entity.id)
  for (const key of ['blueprint', 'position', 'quaternion', 'scale', 'pinned'])
    assert.deepEqual(current[key], entity[key])
}
const profilingBefore = await client.request('/profiling')
await client.request('/profiling', { method: 'POST', json: { enabled: true } })
let profiling
try {
  await new Promise(resolve => setTimeout(resolve, 2200))
  profiling = await client.request('/profiling?entityId=' + object.entity.id)
} finally {
  await client.request('/profiling', { method: 'POST', json: { enabled: profilingBefore.server.active } })
}
const row = profiling.server.rows.find(r => r.id === object.entity.id)
assert(row)
assert.equal(row.cpuMsPerSecond, 0)
assert.deepEqual(row.callbackMsPerSecond, {})
assert.equal(profiling.server.stale, false)
const report = {
  verified: true,
  target: profile.apiUrl,
  blueprint: object.blueprint,
  entity: object.entity,
  deskLocal: object.deskLocal,
  independentMovableObject: true,
  assetsUploadedAndReadBack: true,
  deskAndOtherPlacementsUnchanged: true,
  serverProfile: row,
}
await fs.writeFile(new URL('after.json', dir), JSON.stringify(after, null, 2))
await fs.writeFile(new URL('deployment.json', dir), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
