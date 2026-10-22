import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: ['src/core/systems/ClientLoader.js'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  packages: 'external',
  write: false,
})
// Keep the bundle beside node_modules so external package imports resolve normally.
const { mkdtemp, writeFile, rm } = await import('node:fs/promises')
const directory = await mkdtemp(new URL('../../../.loader-test-', import.meta.url))
let ClientLoader
try {
  const path = new URL(`file://${directory}/loader.mjs`)
  await writeFile(path, bundle.outputFiles[0].contents)
  ;({ ClientLoader } = await import(path))
} finally {
  await rm(directory, { recursive: true, force: true })
}

test('unique asset loads remain pending through decoding and cache hits do not count twice', async () => {
  const loader = new ClientLoader({ scripts: { evaluate: code => ({ code }) } })
  let resolveFile
  loader.loadFile = () =>
    new Promise(resolve => {
      resolveFile = resolve
    })
  const first = loader.load('script', 'asset://example.js')
  const cached = loader.load('script', 'asset://example.js')
  assert.deepEqual(loader.loading, { pending: 1, completed: 0, failed: 0 })
  resolveFile({ text: async () => 'example' })
  assert.deepEqual(await first, { code: 'example' })
  assert.equal(await cached, await first)
  assert.deepEqual(loader.loading, { pending: 0, completed: 1, failed: 0 })
  loader.destroy()
})

test('failed assets settle without reporting success or blocking later work', async () => {
  const loader = new ClientLoader({})
  loader.loadFile = async () => {
    throw new Error('unavailable')
  }
  await assert.rejects(loader.load('model', 'asset://missing.glb'), /unavailable/)
  assert.deepEqual(loader.loading, { pending: 0, completed: 0, failed: 1 })
  let finish
  const decoding = loader.trackLoading(
    new Promise(resolve => {
      finish = resolve
    })
  )
  assert.equal(loader.loading.pending, 1)
  finish('mesh')
  assert.equal(await decoding, 'mesh')
  assert.deepEqual(loader.loading, { pending: 0, completed: 1, failed: 1 })
  loader.destroy()
})

test('HTTP failures settle as failed assets', async t => {
  const loader = new ClientLoader({ resolveURL: url => url })
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 404 }))
  await assert.rejects(loader.load('model', 'https://example.test/missing.glb'), /404/)
  assert.deepEqual(loader.loading, { pending: 0, completed: 0, failed: 1 })
  loader.destroy()
})

test('image decode failures do not leave a pending load', async t => {
  const loader = new ClientLoader({})
  loader.loadFile = async () => new Blob(['invalid image'])
  const originalImage = globalThis.Image
  t.after(() => {
    if (originalImage === undefined) delete globalThis.Image
    else globalThis.Image = originalImage
  })
  globalThis.Image = class {
    set src(value) {
      this.url = value
      queueMicrotask(() => this.onerror())
    }
    get src() {
      return this.url
    }
  }
  await assert.rejects(loader.load('image', 'asset://broken.png'), /could not be decoded/)
  assert.equal(loader.loading.pending, 0)
  assert.equal(loader.loading.failed, 1)
  loader.destroy()
})
