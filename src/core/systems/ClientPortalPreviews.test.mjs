import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'

const bundle = await build({
  stdin: {
    contents:
      "export { ClientPortalPreviews } from './src/core/systems/ClientPortalPreviews.js'; export { created } from './src/core/createPreviewWorld.js';",
    resolveDir: process.cwd(),
  },
  plugins: [
    {
      name: 'preview-fixture',
      setup(build) {
        build.onResolve({ filter: /createPreviewWorld/ }, () => ({ path: 'preview', namespace: 'fixture' }))
        build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
          contents: `
      export const created = [];
      export function createPreviewWorld() {
        const remote = {
          init: async () => {}, tick() { this.ticks = (this.ticks || 0) + 1 }, destroy() { this.disposed = true },
          network: { ready: true, endpoints: new Map(), setSubscriptions(ids) { this.ids = ids } },
        }; created.push(remote); return remote;
      }`,
        }))
      },
    },
  ],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { ClientPortalPreviews, created } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function fixture() {
  const world = {
    graphics: { portals: new Set() },
    rig: { position: new THREE.Vector3() },
    environment: { base: { hdr: '/Clear_08_4pm_LDR.hdr' } },
  }
  const manager = new ClientPortalPreviews(world)
  const portal = target => ({ url: 'http://remote.example/', target, matrixWorld: new THREE.Matrix4(), ctx: {} })
  return { world, manager, portal }
}

test('portals share one replica and union of endpoint subscriptions, then release unused replicas', async t => {
  let now = 0
  t.mock.method(performance, 'now', () => now)
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({ preview: { version: 1, wsUrl: 'ws://remote.example/portal-preview' } }),
  }))
  const { world, manager, portal } = fixture()
  const first = portal('first')
  const second = portal('second')
  world.graphics.portals.add(first).add(second)
  manager.update()
  await new Promise(resolve => setImmediate(resolve))
  manager.update()
  assert.equal(manager.worlds.size, 1)
  const remote = created.at(-1)
  assert.deepEqual(remote.network.ids, ['first', 'second'])
  remote.network.endpoints.set('first', new THREE.Matrix4())
  remote.network.endpoints.set('second', new THREE.Matrix4().makeTranslation(100, 0, 0))
  manager.update()
  assert.equal(manager.get(first).world, manager.get(second).world)
  world.graphics.portals.delete(first)
  manager.update()
  assert.deepEqual(remote.network.ids, ['second'])
  world.graphics.portals.delete(second)
  now = 10001
  manager.update()
  assert.equal(remote.disposed, true)
  assert.equal(manager.worlds.size, 0)
  manager.destroy()
})

test('unsupported worlds retain their travel configuration and are retried without opening a player connection', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ available: true }) }))
  const { world, manager, portal } = fixture()
  const source = portal('exit')
  const before = created.length
  world.graphics.portals.add(source)
  manager.update()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(created.length, before)
  assert.equal(source.url, 'http://remote.example/')
  assert.equal(source.target, 'exit')
  assert.equal(manager.get(source), undefined)
  assert.match([...manager.worlds.values()][0].error, /does not support previews/)
  manager.destroy()
})

test('destroy cancels a pending discovery and prevents a late replica from becoming active', async t => {
  let cancelled = false
  t.mock.method(
    globalThis,
    'fetch',
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          cancelled = true
          reject(new Error('Aborted'))
        })
      })
  )
  const { world, manager, portal } = fixture()
  world.graphics.portals.add(portal('exit'))
  manager.update()
  manager.destroy()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(cancelled, true)
  assert.equal(manager.worlds.size, 0)
})
