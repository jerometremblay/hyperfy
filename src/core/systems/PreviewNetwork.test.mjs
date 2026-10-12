import 'ses'
import '../lockdown.js'
import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const bundle = await build({
  stdin: {
    contents: "export { createPreviewWorld } from './src/core/createPreviewWorld.js';",
    resolveDir: process.cwd(),
  },
  plugins: [
    {
      name: 'fixture-storage',
      setup(build) {
        build.onResolve({ filter: /^\.\.\/storage$/ }, () => ({ path: 'storage', namespace: 'fixture' }))
        build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
          contents: 'export const storage = { get() {}, set() {} }',
        }))
      },
    },
  ],
  banner: {
    js: `import { createRequire as previewRequire } from 'node:module'; const require = previewRequire('${process.cwd()}/preview-test.cjs');`,
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const directory = await mkdtemp(join(tmpdir(), 'hyperfy-preview-test-'))
const filename = join(directory, 'bundle.mjs')
await writeFile(filename, bundle.outputFiles[0].contents)
const { createPreviewWorld } = await import(pathToFileURL(filename).href)
await rm(directory, { recursive: true })

function fixture() {
  const world = createPreviewWorld(
    { graphics: { renderer: {}, maxAnisotropy: 1, worldToScreenFactor: 1 } },
    'https://destination.example/world'
  )
  world.environment.csm = { setupMaterial() {}, update() {}, dispose() {} }
  return world
}

function snapshot(added = [], blueprints = []) {
  return {
    type: 'snapshot',
    version: 1,
    serverTime: 100,
    serverTimestamp: 123456,
    assetsUrl: 'https://destination.example/assets',
    endpoints: { '': [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] },
    settings: { dayNightCycle: true, latitude: 10, longitude: 20 },
    added,
    blueprints,
    modified: [],
    removed: [],
  }
}

test('preview executes procedural scripts and renders physics-enabled prims without constructing a physics system', async () => {
  const world = fixture()
  const code = `const body = app.create('rigidbody');
    body.add(app.create('collider'));
    body.add(app.create('prim', { type: 'box', size: [2, 3, 4], physics: 'dynamic' }));
    app.add(body);
    app.on('update', dt => { body.rotation.y += dt });
    world.open('https://must-not-navigate.example');`
  world.loader.results.set('script/asset://test.js', world.scripts.evaluate(code))
  world.network.apply(
    snapshot(
      [
        {
          id: 'object',
          type: 'app',
          blueprint: 'bp',
          position: [0, 0, 0],
          quaternion: [0, 0, 0, 1],
          scale: [1, 1, 1],
          state: {},
        },
      ],
      [{ id: 'bp', version: 1, model: 'script-only', script: 'asset://test.js', props: {} }]
    )
  )
  await new Promise(resolve => setImmediate(resolve))
  const app = world.entities.get('object')
  assert.equal(app.scriptError, null)
  assert.equal(world.physics, undefined)
  assert.equal(app.root.children[0].actor, undefined)
  assert.equal(app.root.children[0].children[0].shape, undefined)
  assert.equal(world.stage.models.size, 1)
  world.update(0.25)
  assert.equal(app.root.children[0].rotation.y, 0.25)
  assert.equal(world.resolveURL('/remote.jpg'), 'https://destination.example/remote.jpg')
  assert.equal(world.resolveURL('asset://remote.glb'), 'https://destination.example/assets/remote.glb')
  world.destroy()
  assert.equal(world.entities.items.size, 0)
})

test('preview applies app state, live events, removals and independent time without any outgoing app packets', async () => {
  const world = fixture()
  world.loader.results.set(
    'script/asset://test.js',
    world.scripts.evaluate("app.on('color', color => { app.state.color = color })")
  )
  world.network.apply(
    snapshot(
      [
        {
          id: 'object',
          type: 'app',
          blueprint: 'bp',
          position: [0, 0, 0],
          quaternion: [0, 0, 0, 1],
          scale: [1, 1, 1],
          state: {},
        },
      ],
      [{ id: 'bp', version: 1, model: 'script-only', script: 'asset://test.js', props: {} }]
    )
  )
  await new Promise(resolve => setImmediate(resolve))
  world.network.apply({ type: 'event', event: ['object', 1, 'color', 'red'] })
  assert.equal(world.entities.get('object').data.state.color, 'red')
  let sent = false
  world.network.ws = {
    send() {
      sent = true
    },
  }
  world.apps.appMethods.send(world.entities.get('object'), 'mutate', {})
  assert.equal(sent, false)
  assert.equal(world.entities.player, null)
  assert.equal(world.settings.longitude, 20)
  assert.ok(world.network.getServerTime() >= 123456)
  world.network.apply({ ...snapshot(), type: 'update', removed: ['object'] })
  assert.equal(world.entities.items.size, 0)
  world.network.ws = null
  world.destroy()
})
