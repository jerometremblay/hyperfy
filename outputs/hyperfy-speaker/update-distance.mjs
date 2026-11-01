import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'

const dir = new URL('./', import.meta.url)
const object = JSON.parse(await fs.readFile(new URL('object.json', dir)))
let baseline
try {
  baseline = JSON.parse(await fs.readFile(new URL('distance-deployment.json', dir)))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
  baseline = JSON.parse(await fs.readFile(new URL('deployment.json', dir)))
}
const source = await fs.readFile(new URL('speaker.js', dir), 'utf8')
const script = `asset://${createHash('sha256').update(source).digest('hex')}.js`
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, object.origin + '/api/agent')
const client = makeClient(profile)
const before = await client.request('/snapshot?excludeSeatPoses=true')
const blueprint = before.blueprints.find(b => b.id === object.blueprintId)
const entity = before.entities.find(e => e.id === object.entityId)
assert.equal(entity?.blueprint, blueprint?.id, 'Speaker identity changed')
assert.ok([baseline.script, script].includes(blueprint.script), 'Speaker source changed; refusing overwrite')
const jukebox = before.blueprints.find(b => b.name === 'Jukebox rétro' && b.props?.refDistance !== undefined)
const props = {
  volume: 1,
  spatial: true,
  refDistance: jukebox?.props?.refDistance ?? 2,
  maxDistance: jukebox?.props?.maxDistance ?? 30,
  ...blueprint.props,
}
console.log(JSON.stringify({ target: profile.apiUrl, version: blueprint.version, props }))
if (!process.argv.includes('--write')) process.exit(0)
await fs.writeFile(new URL('distance-pre-deploy.json', dir), JSON.stringify(before, null, 2))
const uploaded = await client.request('/scripts', { method: 'POST', json: { source } })
assert.equal(uploaded.url, script)
assert.equal((await client.requestBytes('/assets/' + script.slice(8))).bytes.toString(), source)
await client.request('/apps/' + object.blueprintId, {
  method: 'PATCH', json: { version: blueprint.version, script, props },
})
const after = await client.request('/snapshot?excludeSeatPoses=true')
const updated = after.blueprints.find(b => b.id === blueprint.id)
assert.equal(updated.script, script)
assert.deepEqual(updated.props, props)
assert.equal(updated.version, blueprint.version + 1)
for (const previous of before.blueprints) {
  const current = after.blueprints.find(b => b.id === previous.id)
  assert.deepEqual(current, previous.id === blueprint.id
    ? { ...previous, script, props, version: previous.version + 1 } : previous)
}
for (const previous of before.entities) {
  const current = after.entities.find(e => e.id === previous.id)
  for (const key of ['blueprint', 'position', 'quaternion', 'scale', 'pinned']) {
    assert.deepEqual(current[key], previous[key])
  }
}
const report = {
  verified: true, target: profile.apiUrl, script, props, version: updated.version,
  entityId: entity.id, otherObjectsUnchanged: true,
}
await fs.writeFile(new URL('distance-deployment.json', dir), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report))
