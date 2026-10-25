import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { compileSingleObject } from '../../tools/worldsync/src/compiler.mjs'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'

const directory = new URL('./', import.meta.url)
const root = fileURLToPath(new URL('../../../hyperfy-world-jerome/', import.meta.url))
const plan = JSON.parse(await fs.readFile(new URL('./plan.json', directory), 'utf8'))
const client = makeClient(await loadProfile(root, 'online-world'))
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const prepared = []

// Preflight every source and destination before updating any live app.
for (const app of plan) {
  const compiled = await compileSingleObject(root, app.key)
  const script = 'asset://' + app.newHash + '.js'
  assert.equal(compiled.blueprint.script, script, app.name + ' source changed')
  const asset = compiled.assets.find(asset => asset.url === script)
  assert.ok(asset)
  assert.equal(sha256(asset.bytes), app.newHash)
  const endpoint = '/apps/' + encodeURIComponent(app.id)
  const before = await client.request(endpoint)
  assert.equal(before.id, app.id)
  assert.ok(!before.scene)
  assert.ok(Number.isInteger(before.version))
  assert.ok(before.script === app.script || before.script === script, app.name + ' live script changed')
  prepared.push({ app, asset, endpoint, before, script })
}

const results = []
for (const { app, asset, endpoint, before, script } of prepared) {
  if (before.script === script) {
    results.push({ id: app.id, name: app.name, version: before.version, alreadyCurrent: true })
    continue
  }
  await fs.writeFile(
    new URL(`./${app.id}/live-before-v${before.version}.json`, directory),
    JSON.stringify(before, null, 2) + '\n',
    { flag: 'wx' }
  )
  await client.uploadAsset(asset)
  const downloaded = await client.requestBytes('/assets/' + app.newHash + '.js')
  assert.equal(sha256(downloaded.bytes), app.newHash)
  assert.deepEqual(await client.request(endpoint), before, app.name + ' changed during upload')
  // Preserve live props, frozen flags, model and other fields, even when source differs.
  await client.request(endpoint, {
    method: 'PATCH',
    json: { version: before.version, script },
  })
  const after = await client.request(endpoint)
  assert.equal(after.script, script)
  assert.equal(after.version, before.version + 1)
  const unchanged = value =>
    Object.fromEntries(Object.entries(value).filter(([key]) => !['script', 'version'].includes(key)))
  assert.deepEqual(unchanged(after), unchanged(before), app.name + ' unrelated fields changed')
  results.push({
    id: app.id,
    key: app.key,
    name: app.name,
    beforeVersion: before.version,
    afterVersion: after.version,
    beforeScript: before.script,
    afterScript: script,
    changedFields: ['script'],
    downloadedScriptHashVerified: true,
    unchangedFieldsVerified: true,
  })
  await fs.writeFile(new URL('./deployment.json', directory), JSON.stringify(results, null, 2) + '\n')
}
console.log(
  JSON.stringify(
    results.map(({ id, name, beforeVersion, afterVersion, alreadyCurrent }) => ({
      id,
      name,
      beforeVersion,
      afterVersion,
      ...(alreadyCurrent ? { alreadyCurrent } : {}),
    })),
    null,
    2
  )
)
