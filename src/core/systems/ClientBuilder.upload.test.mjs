import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { hyperfySkillPlugin } from '../../../scripts/hyperfy-skill-plugin.mjs'

globalThis.window = { matchMedia: () => ({ matches: false }), location: { search: '' } }
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { maxTouchPoints: 0, platform: 'Linux' },
})

const bundle = await build({
  stdin: {
    contents: `export { ClientBuilder } from './ClientBuilder.js';
      export { App } from '../entities/App.js';
      export { createUploadQueue } from '../extras/uploadQueue.js';`,
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  plugins: [hyperfySkillPlugin()],
})
const { ClientBuilder, App, createUploadQueue } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

// The drop handler only needs the builder permission and upload setting.
ClientBuilder.prototype.createXRMenu = () => {}

async function dropSplat(maxUploadSize, sizeMB) {
  const messages = []
  const added = []
  const file = { name: 'scene.sog', size: sizeMB * 1024 * 1024 }
  const builder = new ClientBuilder({
    network: { maxUploadSize },
    chat: { add: message => messages.push(message) },
    entities: { player: { isBuilder: () => true } },
  })
  builder.toggle = () => {}
  builder.getSpawnTransform = () => ({ position: [0, 0, 0], quaternion: [0, 0, 0, 1] })
  builder.addSplat = file => added.push(file)

  await builder.onDrop({
    preventDefault() {},
    dataTransfer: { files: [file] },
  })
  return { messages, added, file }
}

test('unlimited uploads accept a SOG file larger than the former 90 MB limit', async () => {
  const { messages, added, file } = await dropSplat('0', 91)
  assert.deepEqual(messages, [])
  assert.deepEqual(added, [file])
})

test('unlimited uploads accept a SOG file larger than the former server cap', async () => {
  const { messages, added, file } = await dropSplat('0', 501)
  assert.deepEqual(messages, [])
  assert.deepEqual(added, [file])
})

test('a positive upload limit still rejects oversized files', async () => {
  const { messages, added } = await dropSplat('90', 91)
  assert.equal(messages.length, 1)
  assert.match(messages[0].body, /File size too large/)
  assert.deepEqual(added, [])
})

test('files at a positive upload limit are accepted', async () => {
  const { messages, added, file } = await dropSplat('90', 90)
  assert.deepEqual(messages, [])
  assert.deepEqual(added, [file])
})

test('large splats do not show the former 500 MB rejection message', t => {
  const messages = []
  t.mock.method(console, 'warn', () => {})
  ClientBuilder.prototype.validateSplatFileSize.call(
    { world: { chat: { add: message => messages.push(message) } } },
    501
  )
  assert.deepEqual(messages, [])
})

function hypFile({ scene = false } = {}) {
  const assets = [
    { type: 'script', url: `asset://${'a'.repeat(64)}.js`, bytes: 'app.state.ready = true' },
    { type: 'audio', url: `asset://${'b'.repeat(64)}.ogg`, bytes: 'OggS' },
    { type: 'texture', url: `asset://${'c'.repeat(64)}.png`, bytes: 'PNG' },
  ]
  const header = new TextEncoder().encode(
    JSON.stringify({
      blueprint: { name: 'Pool Table', model: 'script-only', script: assets[0].url, props: {}, scene },
      assets: assets.map(({ bytes, ...asset }) => ({ ...asset, size: bytes.length })),
    })
  )
  const size = new Uint8Array(4)
  new DataView(size.buffer).setUint32(0, header.length, true)
  return new File([size, header, ...assets.map(asset => asset.bytes)], 'PoolTable.hyp')
}

function importFixture(t, { fail = false } = {}) {
  t.mock.method(console, 'error', () => {})
  const messages = []
  const sent = []
  const uploads = []
  const localApps = new Map()
  const serverApps = new Map()
  const queue = createUploadQueue()
  const scene = { id: '$scene', version: 1, name: 'Existing scene' }
  const world = {
    loader: { insert() {} },
    chat: { add: message => messages.push(message) },
    ui: { confirm: async () => true },
    blueprints: {
      add() {},
      getScene: () => scene,
      modify: change => Object.assign(scene, change),
    },
    network: {
      id: 'builder',
      maxUploadSize: 100,
      upload: (file, options) =>
        queue.enqueue(() => {
          uploads.push(file.name)
          if (fail && file.name.endsWith('.ogg')) throw new Error('Asset upload check failed (400).')
        }, options),
      send(name, data) {
        sent.push([name, structuredClone(data)])
        if (name === 'entityAdded') serverApps.set(data.id, structuredClone(data))
        if (name === 'entityRemoved') serverApps.delete(data)
        if (name === 'entityModified') Object.assign(serverApps.get(data.id), data)
      },
    },
    entities: {
      player: { isBuilder: () => true },
      add(data) {
        const app = {
          world,
          data,
          n: 0,
          eventQueue: { clear() {} },
          unbuild() {},
          destroy: App.prototype.destroy,
          onUploaded: App.prototype.onUploaded,
        }
        localApps.set(data.id, app)
        world.network.send('entityAdded', data)
        return app
      },
      remove: id => localApps.delete(id),
    },
  }
  const builder = new ClientBuilder(world)
  builder.toggle = () => {}
  builder.getSpawnTransform = () => ({ position: [0, 0, 0], quaternion: [0, 0, 0, 1] })
  const addApp = builder.addApp.bind(builder)
  let importing
  builder.addApp = (...args) => {
    const promise = addApp(...args)
    importing = promise.catch(() => {})
    return promise
  }
  const drop = async file => {
    await builder.onDrop({ preventDefault() {}, dataTransfer: { files: [file] } })
    await importing
  }
  const drain = () => queue.enqueue(() => {})
  return { drop, drain, messages, sent, uploads, localApps, serverApps, scene }
}

test('a failed app import removes the server app, cancels remaining uploads and reports the failure', async t => {
  const fixture = importFixture(t, { fail: true })
  await fixture.drop(hypFile())
  await fixture.drain()
  assert.equal(fixture.localApps.size, 0)
  assert.equal(fixture.serverApps.size, 0)
  assert.deepEqual(
    fixture.sent.map(([name]) => name),
    ['entityAdded', 'entityRemoved']
  )
  assert.equal(fixture.uploads.length, 2, 'the texture after the rejected audio is not uploaded')
  assert.equal(fixture.messages.length, 1)
  assert.match(fixture.messages[0].body, /Upload failed.*PoolTable\.hyp/)
  assert.match(fixture.messages[0].body, /Asset upload check failed \(400\)/)
  assert.equal(fixture.messages[0].fromId, null)
})

test('an invalid hyp reports the import failure before creating an app', async t => {
  const fixture = importFixture(t)
  await fixture.drop(new File(['bad'], 'Broken.hyp'))
  assert.equal(fixture.serverApps.size, 0)
  assert.deepEqual(fixture.sent, [])
  assert.equal(fixture.messages.length, 1)
  assert.match(fixture.messages[0].body, /Upload failed.*Broken\.hyp.*Invalid \.hyp file header/)
})

test('a successful app import clears the uploader and shows no failure message', async t => {
  const fixture = importFixture(t)
  await fixture.drop(hypFile())
  assert.equal(fixture.localApps.size, 1)
  assert.equal(fixture.serverApps.size, 1)
  assert.equal([...fixture.serverApps.values()][0].uploader, null)
  assert.deepEqual(
    fixture.sent.map(([name]) => name),
    ['entityAdded', 'entityModified']
  )
  assert.equal(fixture.uploads.length, 3)
  assert.deepEqual(fixture.messages, [])
})

test('a failed scene import keeps the existing scene and reports the failure', async t => {
  const fixture = importFixture(t, { fail: true })
  await fixture.drop(hypFile({ scene: true }))
  await fixture.drain()
  assert.deepEqual(fixture.scene, { id: '$scene', version: 1, name: 'Existing scene' })
  assert.deepEqual(fixture.sent, [])
  assert.equal(fixture.uploads.length, 2)
  assert.equal(fixture.messages.length, 1)
  assert.match(fixture.messages[0].body, /Upload failed.*PoolTable\.hyp/)
})
