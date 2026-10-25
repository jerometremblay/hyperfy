import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { compileSingleObject } from '../../tools/worldsync/src/compiler.mjs'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'
import { ORIGINAL_SHA256 } from '../../scripts/repair-meadow-collider.mjs'

const root = fileURLToPath(new URL('../../../hyperfy-world-jerome/', import.meta.url))
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const expectedHash = '845488eb943361c6bda105b8befa17c40c884e15e3cd94cac5a4e55fe91abded'
const modelURL = 'asset://' + expectedHash + '.glb'
const compiled = await compileSingleObject(root, 'environment/the-meadow')
assert.equal(compiled.role, 'environment')
assert.equal(compiled.blueprint.model, modelURL, 'World source does not contain the tested repair')
const asset = compiled.assets.find(asset => asset.url === modelURL)
assert.ok(asset)
assert.equal(sha256(asset.bytes), expectedHash)
const client = makeClient(await loadProfile(root, 'online-world'))
const endpoint = '/apps/' + encodeURIComponent('$scene')
const before = await client.request(endpoint)
assert.equal(before.id, '$scene')
assert.equal(before.scene, true)
assert.ok(Number.isInteger(before.version))
if (before.model === modelURL) {
  console.log('The live Meadow already uses the tested collider repair')
} else {
  assert.equal(
    before.model,
    'asset://' + ORIGINAL_SHA256 + '.glb',
    'Live scene model changed; inspect before deploying'
  )
  await fs.writeFile(
    new URL(`./live-before-v${before.version}.json`, import.meta.url),
    JSON.stringify(before, null, 2) + '\n',
    { flag: 'wx' }
  )
  await client.uploadAsset(asset)
  const downloaded = await client.requestBytes('/assets/' + expectedHash + '.glb')
  assert.equal(sha256(downloaded.bytes), expectedHash, 'Uploaded model differs from the tested repair')
  const current = await client.request(endpoint)
  assert.deepEqual(current, before, 'Live scene changed during upload; no scene update applied')
  // Use the existing protected scene API and its optimistic version guard.
  // Only the model changes: preserve live props, script, flags and placement.
  await client.request('/world/scene', {
    method: 'PATCH',
    json: { version: before.version, model: modelURL },
  })
  const after = await client.request(endpoint)
  assert.equal(after.model, modelURL)
  assert.equal(after.version, before.version + 1)
  const unchanged = value =>
    Object.fromEntries(Object.entries(value).filter(([key]) => !['model', 'version'].includes(key)))
  assert.deepEqual(unchanged(after), unchanged(before), 'Unexpected scene field change')
  const result = {
    profile: 'online-world',
    scene: 'local-world',
    id: '$scene',
    beforeVersion: before.version,
    afterVersion: after.version,
    changedFields: ['model'],
    beforeModel: before.model,
    afterModel: after.model,
    downloadedModelHashVerified: true,
  }
  await fs.writeFile(new URL('./deployment.json', import.meta.url), JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result, null, 2))
}
