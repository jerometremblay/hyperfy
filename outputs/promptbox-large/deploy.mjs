import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'
import { parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const readJson = async name => JSON.parse(await fs.readFile(new URL(name, directory), 'utf8'))
const original = await readJson('house-blueprint.json')
const base = await readJson('deployment-base-blueprint.json').catch(() => original)
const initialState = await readJson('initial-state.json')
const before = await readJson('before.json')
const manifest = await readJson('manifest.json')
const desired = await readJson('desired-blueprint.json')
const validation = await readJson('validation.json')
assert.equal(validation.valid, true)
const profile = await loadProfile('/Users/jerome/metaverse/hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const houseId = manifest.intersections[0].entityId
const boxId = manifest.box.entityId
const [liveBlueprint, liveHouse, liveBox, liveBoxBlueprint, snapshot] = await Promise.all([
  client.request('/apps/' + original.id),
  client.request('/entities/' + houseId),
  client.request('/entities/' + boxId),
  client.request('/apps/' + manifest.box.blueprintId),
  client.request('/snapshot?excludeSeatPoses=true'),
])
assert.deepEqual(liveBlueprint, base, 'House source changed since preparation')
assert.deepEqual(liveBoxBlueprint, before.blueprints.find(b => b.id === manifest.box.blueprintId),
  'Prompt or request changed since preparation')
for (const [entity, expectedId] of [[liveHouse, houseId], [liveBox, boxId]]) {
  const expected = before.entities.find(e => e.id === expectedId)
  for (const field of ['blueprint', 'position', 'quaternion', 'scale', 'pinned']) {
    assert.deepEqual(entity[field], expected[field], `Instance ${expectedId} changed: ${field}`)
  }
  assert(!entity.mover && !entity.uploader, 'Instance is being edited')
}
assert.equal(snapshot.entities.filter(e => e.blueprint === original.id).length, 1,
  'House blueprint gained another instance; a shared patch would affect it')
const parsed = parseHyp(await fs.readFile(new URL('house-extension.hyp', directory)))
assert.deepEqual(parsed.blueprint, desired)
const source = await fs.readFile(new URL('source.js', directory), 'utf8')
const expectedScript = 'asset://' + createHash('sha256').update(source).digest('hex') + '.js'
assert.equal(expectedScript, desired.script)
await fs.writeFile(new URL('pre-repair.json', directory), JSON.stringify({ snapshot, liveHouse, liveBox }, null, 2))
const expectedHouse = { ...liveHouse, state: initialState }
const plan = {
  target: profile.apiUrl, houseId, blueprintId: original.id,
  expectedVersion: liveBlueprint.version, expectedScript,
  completePromptbox: boxId,
  changes: ['house script', 'house description and result tags', 'remove completed promptbox'],
}
console.log(JSON.stringify(plan, null, 2))
if (!process.argv.includes('--write')) process.exit(0)

const uploaded = await client.request('/scripts', { method: 'POST', json: { source } })
assert.equal(uploaded.url, expectedScript, 'Upload hash mismatch')
const uploadedBytes = (await client.requestBytes('/assets/' + expectedScript.slice(8))).bytes
assert.equal(uploadedBytes.toString('utf8'), source, 'Uploaded source did not read back exactly')
const updated = await client.request('/apps/' + original.id, {
  method: 'PATCH',
  json: {
    version: liveBlueprint.version,
    script: desired.script,
    desc: desired.desc,
    props: desired.props,
  },
})
assert.deepEqual(updated, desired, 'Blueprint readback did not match package')
await new Promise(resolve => setTimeout(resolve, 1500))
const readBackHouse = await client.request('/entities/' + houseId)
assert.deepEqual(readBackHouse, expectedHouse, 'House placement or saved state changed')

// Check the request again before consuming its placeholder.
const [boxNow, boxBlueprintNow] = await Promise.all([
  client.request('/entities/' + boxId), client.request('/apps/' + manifest.box.blueprintId),
])
assert.deepEqual(boxNow, liveBox, 'Promptbox changed during deployment')
assert.deepEqual(boxBlueprintNow, liveBoxBlueprint, 'Prompt changed during deployment')
await client.request('/entities/' + boxId, { method: 'DELETE' })

await client.request('/profiling', { method: 'POST', json: { enabled: true } })
let profiler
try {
  await new Promise(resolve => setTimeout(resolve, 2300))
  profiler = await client.request('/profiling?entityId=' + houseId)
} finally {
  await client.request('/profiling', { method: 'POST', json: { enabled: false } })
}
const after = await client.request('/snapshot?excludeSeatPoses=true')
const finalHouse = await client.request('/entities/' + houseId)
assert.deepEqual(finalHouse, expectedHouse, 'Final house placement/state changed')
assert(!after.entities.some(e => e.id === boxId), 'Completed promptbox still exists')
assert.deepEqual(after.blueprints.find(b => b.id === original.id), desired)
assert.deepEqual(after.world, snapshot.world, 'World settings changed')
for (const bp of snapshot.blueprints.filter(b => b.id !== original.id)) {
  assert.deepEqual(after.blueprints.find(b => b.id === bp.id), bp, 'Unrelated blueprint changed: ' + bp.id)
}
for (const entity of snapshot.entities.filter(e => e.id !== boxId)) {
  assert.deepEqual(after.entities.find(e => e.id === entity.id), entity, 'Unrelated placement changed: ' + entity.id)
}
assert.equal(after.entities.length, snapshot.entities.length - 1)
const row = profiler.server?.rows.find(r => r.id === houseId)
assert.equal(row?.blueprintVersion, updated.version, 'No fresh server profile for deployed source')
assert.equal(profiler.server.stale, false)
assert.equal(row.cpuMsPerSecond, 0, 'Unexpected idle script work')
const report = {
  ...plan, verified: true, version: updated.version,
  exactUploadedSourceReadback: true, houseTransformAndStatePreserved: true,
  completedPromptboxRemoved: true, unrelatedBlueprintsAndPlacementsPreserved: true,
  worldSettingsPreserved: true,
  serverProfile: profiler.server,
  clients: profiler.clients,
  persistence: 'Agent API accepted into the normal persistence queue; no server restart tested',
}
await fs.writeFile(new URL('deployment.json', directory), JSON.stringify(report, null, 2))
await fs.writeFile(new URL('after.json', directory), JSON.stringify(after, null, 2))
console.log(JSON.stringify(report, null, 2))
