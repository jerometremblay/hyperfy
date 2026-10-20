import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { build } from 'esbuild'
const bundle = await build({
  entryPoints: ['src/server/VanillaPortalSnapshots.js'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  write: false,
})
// Resolve external packages from this checkout.
const file = path.resolve('node_modules/.cache/vanilla-portal-test.mjs')
const fs = await import('node:fs/promises')
await fs.mkdir(path.dirname(file), { recursive: true })
await fs.writeFile(file, bundle.outputFiles[0].contents)
const { VanillaPortalSnapshots, SNAPSHOT_INTERVAL, convertVanillaSnapshot, convertLegacySnapshot, joinSnapshot } =
  await import(file)

test('daily cache coalesces joins, survives restart and retains stale snapshots on failure', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'portal-cache-'))
  try {
    let calls = 0,
      now = 10,
      fail = false
    const capture = async () => {
      calls++
      if (fail) throw new Error('offline')
      return { added: [{ id: 'saved' }] }
    }
    let cache = new VanillaPortalSnapshots(dir, capture, () => now)
    const [a, b] = await Promise.all([cache.get('https://world.test/'), cache.get('https://world.test/')])
    assert.deepEqual(a, b)
    assert.equal(calls, 1)
    cache = new VanillaPortalSnapshots(dir, capture, () => now)
    now += SNAPSHOT_INTERVAL - 1
    assert.deepEqual((await cache.get('https://world.test/')).added, a.added)
    assert.equal(calls, 1)
    now++
    fail = true
    assert.deepEqual((await cache.get('https://world.test/')).added, a.added)
    assert.equal(calls, 2)
    await cache.get('https://world.test/')
    assert.equal(calls, 2)
    await assert.rejects(cache.get('https://other.test/'), /offline/)
    await assert.rejects(cache.get('https://other.test/'), /24 hours/)
    assert.equal(calls, 3)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('vanilla conversion excludes player, chat, credentials and disabled apps; derives spawn view', () => {
  const result = convertVanillaSnapshot({
    id: 'guest',
    authToken: 'secret',
    chat: ['private'],
    assetsUrl: 'https://world/assets',
    settings: { voice: true, latitude: 42 },
    blueprints: [{ id: 'ok' }, { id: 'disabled', disabled: true }],
    entities: [
      { id: 'guest', owner: 'guest', type: 'player', position: [4, 0, 8], quaternion: [0, 0, 0, 1] },
      { id: 'app', type: 'app', blueprint: 'ok' },
      { id: 'hidden', type: 'app', blueprint: 'disabled' },
    ],
  })
  assert.deepEqual(
    result.added.map(e => e.id),
    ['app']
  )
  assert.deepEqual(result.settings, { latitude: 42 })
  assert.deepEqual(result.endpoints[''].slice(12, 15), [4, 1.2, 8])
  assert.equal(JSON.stringify(result).includes('secret'), false)
})

test('legacy conversion preserves model transforms and images without executing old scripts', () => {
  const result = convertLegacySnapshot({
    snapshot: [
      { id: 'hyperfy-spawn', position: [1, 0, 2], rotation: [0, 0, 0, 'XYZ'] },
      {
        uid: 'model',
        id: 'hyperfy-model',
        position: [3, 0, 4],
        rotation: [0, 0, 0, 'XYZ'],
        state: { $fields: { src: { url: 'https://test/model.glb' }, scale: 2 } },
      },
      {
        uid: 'image',
        id: 'hyperfy-image',
        position: [0, 0, 0],
        state: { $fields: { src: { url: 'https://test/image.png' }, height: 3 } },
      },
      { uid: 'hook', id: 'hyperfy-discord', state: { $fields: { url: 'secret' } } },
    ],
  })
  assert.equal(result.added.length, 2)
  assert.deepEqual(result.added[0].scale, [2, 2, 2])
  assert.equal(result.blueprints[0].model, 'https://test/model.glb')
  assert.match(decodeURIComponent(result.blueprints[1].script), /image.png/)
  assert.equal(JSON.stringify(result).includes('secret'), false)
})

test('anonymous websocket closes immediately after initial snapshot', async () => {
  const { WebSocketServer } = await import('ws')
  const { pack } = await import('msgpackr')
  const server = new WebSocketServer({ port: 0 })
  await new Promise(resolve => server.on('listening', resolve))
  const closed = new Promise(resolve =>
    server.on('connection', ws => {
      ws.on('close', resolve)
      ws.send(pack([0, { id: 'guest' }]))
    })
  )
  assert.deepEqual(await joinSnapshot(`ws://localhost:${server.address().port}`), { id: 'guest' })
  await closed
  await new Promise(resolve => server.close(resolve))
})
