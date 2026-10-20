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
          init: async function(options) { this.options = options }, tick() { this.ticks = (this.ticks || 0) + 1 }, destroy() { this.disposed = true },
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
    network: { apiUrl: 'http://local.example/api' },
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

test('vanilla worlds use a local cached snapshot without a preview socket', async t => {
  const requests = []
  t.mock.method(globalThis, 'fetch', async url => {
    requests.push(url)
    return {
      ok: true,
      json: async () => (url.includes('portal-snapshot?') ? { type: 'snapshot', version: 1 } : { available: true }),
    }
  })
  const { world, manager, portal } = fixture()
  const source = portal('')
  world.graphics.portals.add(source)
  manager.update()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(requests.length, 2)
  assert.match(requests[1], /^http:\/\/local.example\/api\/portal-snapshot\?url=/)
  const remote = manager.worlds.values().next().value.remote
  assert.ok(remote)
  assert.equal(remote.options.wsUrl, undefined)
  assert.equal(remote.options.snapshot.version, 1)
  assert.equal(source.url, 'http://remote.example/')
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

test('saved scene culling retains overlapping large models and global lights and removes distant geometry', () => {
  const { manager } = fixture()
  const removed = []
  const app = (id, nodes = []) => ({ isApp: true, data: { id }, root: { traverse: fn => nodes.forEach(fn) } })
  const far = app('far'),
    large = app('large'),
    light = app('light', [{ name: 'light' }]),
    near = app('near')
  const item = (entity, x, radius) => ({
    getEntity: () => entity,
    sphere: new THREE.Sphere(new THREE.Vector3(x, 0, 0), radius),
  })
  const remote = {
    network: { endpoints: new Map([['', new THREE.Matrix4()]]) },
    stage: {
      octree: {
        root: {
          items: [item(far, 100, 1), item(large, 100, 60), item(light, 100, 1), item(near, 20, 1)],
          children: [],
        },
      },
    },
    entities: { remove: id => removed.push(id) },
  }
  manager.cullSnapshot(remote)
  assert.deepEqual(removed, ['far'])
  manager.destroy()
})

test('a timed-out custom preview discovery still falls back to the vanilla snapshot', async t => {
  // Exercise discovery's abort separately from the lifetime of the snapshot request.
  t.mock.method(AbortSignal, 'timeout', () => AbortSignal.abort(new DOMException('Timed out', 'TimeoutError')))
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, { signal }) => {
    requests.push(url)
    signal.throwIfAborted()
    return { ok: true, json: async () => ({ type: 'snapshot', version: 1 }) }
  })
  const { world, manager, portal } = fixture()
  world.graphics.portals.add(portal(''))
  manager.update()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(requests.length, 2)
  const entry = manager.worlds.values().next().value
  assert.equal(entry.error, '')
  assert.equal(entry.remote.options.snapshot.version, 1)
  manager.destroy()
})

test('active vanilla scenes refresh at the shared server deadline and retain the previous scene on failure', async t => {
  let now = 0,
    captures = 0,
    fail = false
  const epoch = 100000
  t.mock.method(performance, 'now', () => now)
  t.mock.method(Date, 'now', () => epoch + now)
  t.mock.method(globalThis, 'fetch', async url => {
    if (!url.includes('portal-snapshot?')) return { ok: false }
    captures++
    if (fail) throw new Error('temporary failure')
    return { ok: true, json: async () => ({ type: 'snapshot', version: 1, refreshAt: epoch + 120000 }) }
  })
  const { world, manager, portal } = fixture()
  world.graphics.portals.add(portal(''))
  manager.update()
  await new Promise(resolve => setImmediate(resolve))
  const entry = manager.worlds.values().next().value
  const original = entry.remote
  assert.equal(entry.refreshAt, 120000)
  now = 119999
  manager.update()
  assert.equal(captures, 1)
  now = 120000
  fail = true
  manager.update()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(captures, 2)
  assert.equal(entry.remote, original)
  assert.equal(original.disposed, undefined)
  assert.match(entry.error, /temporary failure/)
  fail = false
  now = entry.retryAt
  manager.update()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(captures, 3)
  assert.notEqual(entry.remote, original)
  assert.equal(original.disposed, true)
  manager.destroy()
})
