import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: ['src/server/cleaner.js'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  packages: 'external',
  plugins: [
    {
      name: 'fake-asset-store',
      setup(build) {
        build.onLoad({ filter: /\/server\/assets\.js$/ }, () => ({
          contents: 'export const assets = globalThis.cleanerAssets',
        }))
        build.onLoad({ filter: /\/server\/collections\.js$/ }, () => ({
          contents: 'export const collections = { blueprints: [] }',
        }))
      },
    },
  ],
})
// Keep external package resolution relative to this repository.
const tempModule = path.resolve(`.cleaner-test-${process.pid}.mjs`)
await fs.writeFile(tempModule, bundle.outputFiles[0].contents)
const deleted = []
globalThis.cleanerAssets = {
  list: async () => ['saved.jpg', 'orphan.jpg'],
  delete: async assets => deleted.push(...assets),
}
let cleaner
try {
  ;({ cleaner } = await import(`file://${tempModule}`))
} finally {
  await fs.remove(tempModule)
  delete globalThis.cleanerAssets
}

test('cleaner retains nested storage-only assets, deletes orphans, and fails closed on corrupt storage', async () => {
  const worldDir = await fs.mkdtemp(path.join(os.tmpdir(), 'photo-cleaner-'))
  const oldClean = process.env.CLEAN
  process.env.CLEAN = 'true'
  const db = table => {
    if (table === 'blueprints' || table === 'entities') return Promise.resolve([])
    if (table === 'users') return { select: async () => [] }
    return { where: () => ({ first: async () => ({ value: '{}' }) }) }
  }
  try {
    await fs.writeJson(path.join(worldDir, 'storage.json'), { booth: { strips: [[{ url: 'asset://saved.jpg' }]] } })
    await cleaner.init({ db, worldDir })
    assert.deepEqual(deleted, ['orphan.jpg'])
    await fs.writeFile(path.join(worldDir, 'storage.json'), '{broken')
    deleted.length = 0
    await assert.rejects(cleaner.init({ db, worldDir }))
    assert.deepEqual(deleted, [])
  } finally {
    if (oldClean === undefined) delete process.env.CLEAN
    else process.env.CLEAN = oldClean
    await fs.remove(worldDir)
  }
})
