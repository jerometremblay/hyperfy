import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { hyperfySkillPlugin } from '../../../scripts/hyperfy-skill-plugin.mjs'

globalThis.window = { matchMedia: () => ({ matches: false }) }
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { maxTouchPoints: 0, platform: 'Linux' },
})

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./ClientBuilder.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  plugins: [hyperfySkillPlugin()],
})
const { ClientBuilder } = await import(
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
  ClientBuilder.prototype.validateSplatFileSize.call({ world: { chat: { add: message => messages.push(message) } } }, 501)
  assert.deepEqual(messages, [])
})
