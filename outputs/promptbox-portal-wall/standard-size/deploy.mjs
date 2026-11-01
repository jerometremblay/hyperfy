import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { loadProfile, makeClient } from '../../../tools/worldsync/src/deployment.mjs'
import { packHyp, parseHyp } from '../../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const json = async name => JSON.parse(await read(name))
const save = (name, value) => fs.writeFile(new URL(name, directory), JSON.stringify(value, null, 2))
const before = await json('before.json')
const plan = await json('plan.json')
const validation = await json('validation.json')
const physics = await json('physics-validation.json')
const actions = await json('action-validation.json')
const visual = await json('visual-validation.json')
assert(validation.valid && physics.valid && actions.valid && visual.valid)
const source = (await read('source.js')).toString()
const parsed = parseHyp(await read('house.hyp'))
let desired = parsed.blueprint
assert.equal(desired.script, validation.source)
assert.equal(desired.script, visual.source)
assert.equal(parsed.assets.find(a => a.url === desired.script).bytes.toString(), source)
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const fields = ['id', 'blueprint', 'position', 'quaternion', 'scale', 'pinned']
function unchanged(entity, previous) {
  for (const field of fields) assert.deepEqual(entity[field], previous[field],
    field + ' changed: ' + entity.id)
  assert(!entity.mover && !entity.uploader, 'A target is being edited: ' + entity.id)
}
const snapshot = await client.request('/snapshot?excludeSeatPoses=true')
const house = await client.request('/entities/' + before.entity.id)
unchanged(house, before.entity)
assert.deepEqual(await client.request('/apps/' + house.blueprint), before.blueprint)
assert.equal(snapshot.entities.filter(e => e.blueprint === house.blueprint).length, 1)
for (const portal of plan.portals) {
  unchanged(await client.request('/entities/' + portal.entity.id), portal.entity)
  const current = await client.request('/apps/' + portal.blueprint.id)
  assert.equal(current.model, portal.blueprint.model, 'Native portal geometry changed')
  assert.equal(current.script, portal.blueprint.script, 'Native portal behavior changed')
  // Inspector settings and metadata may change while the user is in the world.
  // The requested aperture edit touches only the model; retain all live fields.
  portal.blueprint = current
  portal.desiredBlueprint = { ...current, version: current.version + 1,
    model: validation.portalModel }
  assert.equal(snapshot.entities.filter(e => e.blueprint === portal.blueprint.id).length, 1)
}
console.log(JSON.stringify({ target: profile.apiUrl, expectedVersion: before.blueprint.version,
  newVersion: desired.version, doors: [.96, 2.12], wall: 'One continuous log wall',
  portalApertures: [.96, 2.12], portalTransformsPreserved: true }))
if (!process.argv.includes('--write')) process.exit(0)
await save('pre-deploy.json', { snapshot, house, portals: plan.portals })
const uploaded = await client.request('/scripts', { method: 'POST', json: { source } })
assert.equal(uploaded.url, desired.script)
assert.equal((await client.requestBytes('/assets/' + desired.script.slice(8))).bytes.toString(), source)
const model = await read('portal.glb')
const sha256 = createHash('sha256').update(model).digest('hex')
const modelURL = 'asset://' + sha256 + '.glb'
assert.equal(modelURL, validation.portalModel)
const upload = await client.request('/assets', {
  method: 'POST', file: { bytes: model, sha256, extension: 'glb', mime: 'model/gltf-binary' },
})
assert.equal(upload.url, modelURL)
assert((await client.requestBytes('/assets/' + modelURL.slice(8))).bytes.equals(model))
assert.deepEqual(await client.request('/apps/' + house.blueprint), before.blueprint)
for (const portal of plan.portals) {
  unchanged(await client.request('/entities/' + portal.entity.id), portal.entity)
  const current = await client.request('/apps/' + portal.blueprint.id)
  assert.equal(current.model, portal.blueprint.model)
  assert.equal(current.script, portal.blueprint.script)
  portal.blueprint = current
  portal.desiredBlueprint = { ...current, version: current.version + 1, model: modelURL }
  const updated = await client.request('/apps/' + portal.blueprint.id, {
    method: 'PATCH', json: { version: current.version, model: modelURL },
  })
  assert.deepEqual(updated, portal.desiredBlueprint)
}
await save('plan.json', plan)
// Include the settings currently in use in the downloadable native packages.
for (const [index, portal] of plan.portals.entries()) {
  const imageAssets = []
  for (const [key, image] of Object.entries(portal.blueprint.props)) {
    if (!key.startsWith('arrivalImage_') || !image?.url) continue
    const bytes = (await client.requestBytes('/assets/' + image.url.slice(8))).bytes
    imageAssets.push({ type: 'image', url: image.url, bytes, mime: 'image/jpeg' })
  }
  await fs.writeFile(new URL('portal-' + index + '.hyp', directory),
    packHyp(portal.desiredBlueprint, [
      { type: 'model', url: modelURL, bytes: model, mime: 'model/gltf-binary' },
      ...imageAssets,
    ]))
}
const latest = await client.request('/entities/' + house.id)
unchanged(latest, house)
const state = structuredClone(latest.state)
desired = {
  ...desired,
  props: {
    ...desired.props,
    initialDoors: { ...desired.props.initialDoors, ...state.doors },
    initialLighting: state.lighting || desired.props.initialLighting,
  },
}
await fs.writeFile(new URL('house.hyp', directory), packHyp(desired, parsed.assets))
await save('desired-blueprint.json', desired)
const updated = await client.request('/apps/' + house.blueprint, {
  method: 'PATCH',
  json: { version: before.blueprint.version, script: desired.script, props: desired.props },
})
assert.deepEqual(updated, desired)
await new Promise(resolve => setTimeout(resolve, 700))
const afterHouse = await client.request('/entities/' + house.id)
unchanged(afterHouse, house)
assert.deepEqual(afterHouse.state, state, 'Door and lighting state must survive the resize')
for (const portal of plan.portals) {
  unchanged(await client.request('/entities/' + portal.entity.id), portal.entity)
  assert.deepEqual(await client.request('/apps/' + portal.blueprint.id), portal.desiredBlueprint)
  assert.deepEqual(portal.desiredBlueprint.props, portal.blueprint.props)
}
const profileBefore = await client.request('/profiling?entityId=' + house.id)
if (!profileBefore.server.active) {
  await client.request('/profiling', { method: 'POST', json: { enabled: true } })
}
let profiling
try {
  await new Promise(resolve => setTimeout(resolve, 2400))
  profiling = await client.request('/profiling?entityId=' + house.id)
} finally {
  if (!profileBefore.server.active) {
    await client.request('/profiling', { method: 'POST', json: { enabled: false } })
  }
}
const row = profiling.server.rows.find(r => r.id === house.id)
assert(!profiling.server.stale)
assert.equal(row.blueprintVersion, desired.version)
assert.equal(row.cpuMsPerSecond, 0)
const after = await client.request('/snapshot?excludeSeatPoses=true')
const changedBlueprints = new Set([house.blueprint, ...plan.portals.map(p => p.blueprint.id)])
for (const blueprint of snapshot.blueprints.filter(b => !changedBlueprints.has(b.id))) {
  assert.deepEqual(after.blueprints.find(b => b.id === blueprint.id), blueprint)
}
for (const entity of snapshot.entities) {
  const current = after.entities.find(e => e.id === entity.id)
  for (const field of fields) assert.deepEqual(current[field], entity[field],
    'Placement changed: ' + entity.id)
}
await save('after.json', after)
await save('deployment.json', {
  verified: true, target: profile.apiUrl, version: desired.version, source: desired.script,
  uploadedScriptAndModelReadback: true, existingStatePreserved: true,
  portalDestinationsAndTransformsPreserved: true,
  otherBlueprintsAndAllPlacementsPreserved: true, serverProfile: row,
  validation, physics, actions, visual, state: afterHouse.state,
})
console.log(JSON.stringify({ deployed: true, version: desired.version,
  portalModelVersions: plan.portals.map(p => p.desiredBlueprint.version),
  idleServerCpu: row.cpuMsPerSecond }))
