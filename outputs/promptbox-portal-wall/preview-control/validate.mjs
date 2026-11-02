import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { build } from 'esbuild'
import { loadProfile, makeClient } from '../../../tools/worldsync/src/deployment.mjs'
import { packHyp, parseHyp } from '../../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const save = (name, data) => fs.writeFile(new URL(name, directory), JSON.stringify(data, null, 2))
const snapshot = JSON.parse(await read('before.json'))
const house = JSON.parse(await read('house-before.json'))
const blueprint = snapshot.blueprints.find(b => b.id === house.blueprint)
const source = (await read('source.js')).toString()
const portalSource = (await read('portal.js')).toString()
const ids = ['billiards-portal-left', 'billiards-portal-right']
const portalIds = ['f7dada59-f925-4fcd-9fb9-4a6253d86890', '7b846fcc-2366-4782-8259-4390855b234e']
const scriptUrl = text => 'asset://' + createHash('sha256').update(text).digest('hex') + '.js'
const bundle = await build({
  stdin: {
    contents: `export { executeSource } from './outputs/promptbox-large/runtime-adapter.mjs';
      export { Portal } from './src/core/nodes/Portal.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { executeSource, Portal } = await import('data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].contents).toString('base64'))
const client = makeClient(await loadProfile('../hyperfy-world-jerome', 'online-world'))
const original = (await client.requestBytes('/assets/' + blueprint.script.slice(8))).bytes.toString()
const suffix = '\nreturn { doorRegistry, applyAuthoritativeDoorState, updateDoors }'
const cases = []

for (const server of [false, true]) {
  for (const portalFirst of [false, true]) {
    const bus = new EventEmitter()
    const portals = portalIds.map(portalId => new Portal({ portalId, previewBack: true }))
    const runPortals = () => portals.forEach(portal => {
      new Function('app', 'world', 'props', portalSource)({
        instanceId: portal.portalId,
        get: id => { assert.equal(id, 'WorldPortal'); return portal.getProxy() },
        emit: (name, data) => bus.emit(name, data),
      }, {
        isClient: !server,
        on: (name, callback) => bus.on(name, callback),
      }, { portalId: portal.portalId })
    })
    if (portalFirst) runPortals()
    const state = { ...house.state, doors: { ...house.state.doors, [ids[0]]: false, [ids[1]]: false } }
    const options = { server, state, props: blueprint.props, onEmit: (name, data) => bus.emit(name, data) }
    const runtime = await executeSource(source, suffix, options)
    for (const [name, callbacks] of runtime.worldHandlers) {
      for (const callback of callbacks) bus.on(name, callback)
    }
    if (!portalFirst) runPortals()
    const old = await executeSource(original, suffix, options)
    assert.deepEqual(JSON.parse(JSON.stringify(runtime.configs)), JSON.parse(JSON.stringify(old.configs)),
      'every geometry, collision and interaction config is preserved')
    assert.deepEqual(runtime.app.state, old.app.state)
    if (!server) assert.deepEqual(portals.map(p => p.previewFront), [false, false])
    const advance = (count = 60) => {
      for (let frame = 0; frame < count; frame++) runtime.audit.updateDoors(.02)
    }
    for (let index = 0; index < 2; index++) {
      runtime.audit.applyAuthoritativeDoorState({ id: ids[index], open: true })
      if (!server) assert.equal(portals[index].previewFront, true, 'enable before the first animation frame')
      advance()
      runtime.audit.applyAuthoritativeDoorState({ id: ids[index], open: false })
      if (!server) assert.equal(portals[index].previewFront, true, 'retain the view while closing')
      advance(1)
      if (!server) assert.equal(portals[index].previewFront, true)
      advance()
      if (!server) assert.equal(portals[index].previewFront, false, 'stop once fully closed')
      assert.equal(portals[1 - index].previewFront, server, 'the other door remains independent')
      assert.ok(portals.every(p => p.previewBack), 'back preview settings are untouched')
      assert.equal(runtime.handlers.get('update')?.size || 0, 0, 'no idle polling')
    }
    runtime.audit.applyAuthoritativeDoorState({ id: ids[0], open: true })
    advance(1)
    runtime.audit.applyAuthoritativeDoorState({ id: ids[0], open: false })
    advance()
    if (!server) assert.equal(portals[0].previewFront, false, 'reversing mid-swing closes cleanly')
    runPortals()
    if (!server) assert.ok(portals.every(p => !p.previewFront), 'rebuild handshake restores current closed states')
    runtime.audit.applyAuthoritativeDoorState({ id: 'bedroom-1', open: false })
    advance()
    if (!server) assert.ok(portals.every(p => !p.previewFront), 'ordinary doors do not change previews')
    cases.push({ server, portalFirst, preservedGeometry: true, independentDoors: true, idleCallbacks: 0 })
  }
}

for (const [left, right] of [[true, false], [false, true], [true, true]]) {
  const messages = []
  const runtime = await executeSource(source, suffix, {
    state: { ...house.state, doors: { ...house.state.doors, [ids[0]]: left, [ids[1]]: right } },
    props: blueprint.props, onEmit: (name, data) => {
      if (name === 'larch-house-portal-preview') messages.push(data)
    },
  })
  assert.deepEqual(messages, portalIds.map((portalId, i) => ({ portalId, enabled: [left, right][i] })))
  assert.equal(runtime.handlers.get('update')?.size || 0, 0)
}

const desired = {
  ...blueprint, version: blueprint.version + 1, script: scriptUrl(source),
  props: { ...blueprint.props, initialDoors: { ...blueprint.props.initialDoors, ...house.state.doors },
    initialLighting: house.state.lighting || blueprint.props.initialLighting },
}
const model = (await client.requestBytes('/assets/' + desired.model.slice(8))).bytes
const assets = [
  { type: 'model', url: desired.model, bytes: model, mime: 'model/gltf-binary' },
  { type: 'script', url: desired.script, bytes: Buffer.from(source), mime: 'text/javascript' },
]
const bytes = packHyp(desired, assets)
const parsed = parseHyp(bytes)
assert.equal(parsed.assets.find(a => a.url === desired.script).bytes.toString(), source)
for (const asset of parsed.assets) assert.equal(createHash('sha256').update(asset.bytes).digest('hex'), asset.url.slice(8, 72))
await fs.writeFile(new URL('house.hyp', directory), bytes)
await save('desired-blueprint.json', desired)
const validation = { valid: true, source: desired.script, portalScript: scriptUrl(portalSource),
  exactPackageSource: true, hashesVerified: true, actualNativeConstructors: true,
  openingAndClosingTransitions: true, lateJoinAndRebuild: true, cases }
await save('validation.json', validation)
console.log(JSON.stringify(validation))
