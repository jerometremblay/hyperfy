import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'

const dir = new URL('./', import.meta.url)
const object = JSON.parse(await fs.readFile(new URL('object.json', dir)))
const source = await fs.readFile(new URL('speaker.js', dir), 'utf8')
const script = `asset://${createHash('sha256').update(source).digest('hex')}.js`
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, object.origin + '/api/agent')
const client = makeClient(profile)
const before = await client.request('/snapshot?excludeSeatPoses=true')
const blueprint = before.blueprints.find(b => b.id === object.blueprintId)
const entity = before.entities.find(e => e.id === object.entityId)
if (blueprint) assert.equal(blueprint.script, script, 'Speaker source changed; refusing overwrite')
if (entity) assert.equal(entity.blueprint, object.blueprintId, 'Speaker instance ID conflict')
console.log(JSON.stringify({
  target: profile.apiUrl,
  createBlueprint: !blueprint,
  createEntity: !entity,
  position: entity?.position || object.position,
}))
if (!process.argv.includes('--write')) process.exit(0)
await fs.writeFile(new URL('pre-deploy.json', dir), JSON.stringify(before, null, 2))
const uploaded = await client.request('/scripts', { method: 'POST', json: { source } })
assert.equal(uploaded.url, script)
assert.equal((await client.requestBytes('/assets/' + script.slice(8))).bytes.toString(), source)
if (!blueprint) {
  await client.request('/apps', {
    method: 'POST',
    json: {
      id: object.blueprintId,
      name: 'Hyperfy Speaker',
      model: 'script-only',
      script,
      props: {},
      preload: true,
    },
  })
}
if (!entity) {
  await client.request('/entities', {
    method: 'POST',
    json: {
      id: object.entityId,
      blueprint: object.blueprintId,
      position: object.position,
      pinned: true,
    },
  })
}
const after = await client.request('/snapshot?excludeSeatPoses=true')
const placed = after.entities.find(e => e.id === object.entityId)
assert.equal(placed?.blueprint, object.blueprintId)
assert.equal(after.blueprints.find(b => b.id === object.blueprintId)?.script, script)
for (const previous of before.blueprints) {
  assert.deepEqual(after.blueprints.find(b => b.id === previous.id), previous)
}
for (const previous of before.entities) {
  const current = after.entities.find(e => e.id === previous.id)
  for (const key of ['blueprint', 'position', 'quaternion', 'scale', 'pinned']) {
    assert.deepEqual(current[key], previous[key])
  }
}
const report = {
  verified: true,
  target: profile.apiUrl,
  name: 'Hyperfy Speaker',
  blueprintId: object.blueprintId,
  entityId: object.entityId,
  position: placed.position,
  script,
  assetsReadBack: true,
  otherObjectsUnchanged: true,
}
await fs.writeFile(new URL('deployment.json', dir), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report))
