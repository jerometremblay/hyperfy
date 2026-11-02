import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { loadProfile, makeClient } from '../../../tools/worldsync/src/deployment.mjs'
import { packHyp, parseHyp } from '../../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const json = async name => JSON.parse(await read(name))
const save = (name, value) => fs.writeFile(new URL(name, directory), JSON.stringify(value, null, 2))
const before = await json('before.json')
const validation = await json('validation.json')
const webgl = await json('webgl-validation.json')
assert(validation.valid && webgl.valid)
const source = (await read('source.js')).toString()
const portalSource = (await read('portal.js')).toString()
const parsed = parseHyp(await read('house.hyp'))
assert.equal(parsed.blueprint.script, validation.source)
assert.equal(parsed.assets.find(a => a.url === validation.source).bytes.toString(), source)
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const ids = ['HCzjtaVZFI', 'PBETNgBqKt', 'OL3wuJiVCk']
const fields = ['id', 'blueprint', 'position', 'quaternion', 'scale', 'pinned']
function unchanged(entity, previous) {
  for (const field of fields) assert.deepEqual(entity[field], previous[field], field + ' changed: ' + entity.id)
  assert(!entity.mover && !entity.uploader, 'Target is currently being edited: ' + entity.id)
}
const snapshot = await client.request('/snapshot?excludeSeatPoses=true')
const targets = []
for (const id of ids) {
  const entity = await client.request('/entities/' + id)
  unchanged(entity, before.entities.find(e => e.id === id))
  const blueprint = await client.request('/apps/' + entity.blueprint)
  assert.deepEqual(blueprint, before.blueprints.find(b => b.id === entity.blueprint),
    'Target blueprint changed since capture: ' + id)
  assert.equal(snapshot.entities.filter(e => e.blueprint === entity.blueprint).length, 1,
    'Each scoped blueprint must have exactly one instance')
  targets.push({ entity, blueprint })
}
const html = await (await fetch(new URL('/', profile.apiUrl))).text()
const asset = html.match(/src="([^" ]*\/index-[^" ]+\.js)/)?.[1]
assert(asset, 'Live client asset missing')
assert((await (await fetch(new URL(asset, profile.apiUrl))).text()).includes('previewFront'),
  'Deploy the native preview API before deploying these app scripts')
console.log(JSON.stringify({
  target: profile.apiUrl,
  updates: targets.map(({ entity, blueprint }) => ({ entity: entity.id, from: blueprint.version, to: blueprint.version + 1 })),
  verifiedNativeApiServed: true,
}))
if (!process.argv.includes('--write')) process.exit(0)
await save('pre-deploy.json', { snapshot, targets })
for (const [text, expected] of [[source, validation.source], [portalSource, validation.portalScript]]) {
  const uploaded = await client.request('/scripts', { method: 'POST', json: { source: text } })
  assert.equal(uploaded.url, expected)
  assert.equal((await client.requestBytes('/assets/' + expected.slice(8))).bytes.toString(), text)
}
// Install the receivers first. Rebuilding the house then broadcasts its current
// door states to both receivers without depending on app loading order.
const updated = []
for (const { entity, blueprint } of [...targets.slice(1), targets[0]]) {
  const latest = await client.request('/entities/' + entity.id)
  unchanged(latest, entity)
  assert.deepEqual(await client.request('/apps/' + blueprint.id), blueprint)
  const isHouse = entity.id === ids[0]
  const props = isHouse ? {
    ...blueprint.props,
    initialDoors: { ...blueprint.props.initialDoors, ...latest.state.doors },
    initialLighting: latest.state.lighting || blueprint.props.initialLighting,
  } : blueprint.props
  const script = isHouse ? validation.source : validation.portalScript
  const result = await client.request('/apps/' + blueprint.id, {
    method: 'PATCH', json: { version: blueprint.version, script, props },
  })
  assert.deepEqual(result, { ...blueprint, version: blueprint.version + 1, script, props })
  updated.push(result)
  if (isHouse) {
    const desired = { ...parsed.blueprint, ...result }
    await fs.writeFile(new URL('house.hyp', directory), packHyp(desired, parsed.assets))
    await save('desired-blueprint.json', desired)
    await save('house-state-before-patch.json', latest.state)
  }
}
await new Promise(resolve => setTimeout(resolve, 1500))
const after = await client.request('/snapshot?excludeSeatPoses=true')
for (const blueprint of updated) assert.deepEqual(after.blueprints.find(b => b.id === blueprint.id), blueprint)
for (const blueprint of snapshot.blueprints.filter(b => !updated.some(u => u.id === b.id))) {
  assert.deepEqual(after.blueprints.find(b => b.id === blueprint.id), blueprint, 'Unrelated blueprint changed')
}
for (const entity of snapshot.entities) {
  const current = after.entities.find(e => e.id === entity.id)
  for (const field of fields) assert.deepEqual(current[field], entity[field], 'Placement changed: ' + entity.id)
}
assert.deepEqual((await client.request('/entities/' + ids[0])).state, await json('house-state-before-patch.json'),
  'All existing door and lighting states must be preserved')
const profilingBefore = await client.request('/profiling')
if (!profilingBefore.server.active) await client.request('/profiling', { method: 'POST', json: { enabled: true } })
let profiling
try {
  await new Promise(resolve => setTimeout(resolve, 2400))
  profiling = await client.request('/profiling')
} finally {
  if (!profilingBefore.server.active) await client.request('/profiling', { method: 'POST', json: { enabled: false } })
}
const rows = profiling.server.rows.filter(row => ids.includes(row.id))
assert(!profiling.server.stale)
assert.equal(rows.length, 3)
for (const row of rows) {
  assert.equal(row.blueprintVersion, updated.find(b => b.id === row.blueprintId).version)
  assert.equal(row.cpuMsPerSecond, 0, 'Scoped apps must not add idle server callbacks')
}
await save('after.json', after)
const report = {
  verified: true, target: profile.apiUrl, nativePreviewApiServed: true,
  updates: updated.map(b => ({ id: b.id, version: b.version, script: b.script })),
  uploadedSourcesReadBack: true, existingDoorAndLightingStatesPreserved: true,
  portalLinksAndSettingsPreserved: true, otherBlueprintsAndAllPlacementsPreserved: true,
  serverProfile: rows, validation, webgl,
}
await save('deployment.json', report)
console.log(JSON.stringify({ deployed: true, updates: report.updates, idleServerCpu: rows.map(r => r.cpuMsPerSecond) }))
