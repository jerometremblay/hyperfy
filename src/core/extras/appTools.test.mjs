import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

globalThis.window = { matchMedia: () => ({ matches: false }) }
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { maxTouchPoints: 0, platform: 'MacIntel' },
})
const bundle = await build({
  stdin: {
    contents: `export * from './appTools.js'; export { ClientBuilder } from '../systems/ClientBuilder.js';`,
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  plugins: [
    {
      name: 'unused-skill-files',
      setup(build) {
        build.onResolve({ filter: /^hyperfy-skill-files$/ }, () => ({ path: 'skill-files', namespace: 'test' }))
        build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export default {}' }))
      },
    },
  ],
})
const { exportApp, importApp, replaceApp, ClientBuilder } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function fixture() {
  const blueprint = { id: 'original', version: 5, name: 'Original', model: 'script-only', props: {} }
  const blueprints = new Map([[blueprint.id, blueprint]])
  const sent = []
  const uploaded = []
  const cached = new Map()
  const entities = new Map()
  const world = {
    blueprints: { get: id => blueprints.get(id), add: bp => blueprints.set(bp.id, bp) },
    entities: { get: id => entities.get(id) },
    loader: {
      insert: (type, url, file) => cached.set(url, { type, file }),
      load: async () => {},
    },
    network: {
      upload: async file => uploaded.push(file),
      send: (event, data) => sent.push([event, structuredClone(data)]),
    },
    ui: { setApp() {} },
    emit() {},
  }
  // Exercise the real builder undo handler without constructing rendering controls.
  world.builder = Object.assign(Object.create(ClientBuilder.prototype), {
    world,
    selected: null,
    undos: [],
    canBuild: () => true,
  })
  const app = {
    isApp: true,
    blueprint,
    data: {
      id: 'target',
      blueprint: blueprint.id,
      position: [4, 2, -7],
      quaternion: [0, 0.707, 0, 0.707],
      scale: [2, 3, 4],
      pinned: true,
      state: { count: 42 },
      mover: null,
      uploader: null,
    },
    async modify(change) {
      Object.assign(this.data, structuredClone(change))
      this.blueprint = blueprints.get(this.data.blueprint)
      if (this.blueprint.props.fail) this.scriptError = new Error('Script failed')
      else if (this.blueprint.script) this.scriptError = null
    },
  }
  const duplicate = { blueprint, data: { ...structuredClone(app.data), id: 'duplicate' } }
  entities.set(app.data.id, app)
  entities.set(duplicate.data.id, duplicate)
  return { app, duplicate, world, blueprints, sent, uploaded, cached }
}

async function replacement(overrides = {}) {
  return exportApp(
    {
      id: 'untrusted-import-id',
      version: 99,
      name: 'Modified',
      model: 'script-only',
      script: 'asset://modified.js',
      props: { color: 'blue' },
      ...overrides,
    },
    async () => new File(['app.add(app.create("group"))'], 'modified.js', { type: 'text/javascript' })
  )
}

test('replaces one instance, preserves placement and pinning, publishes assets before the entity, and supports undo', async () => {
  const { app, duplicate, world, sent, uploaded, cached } = fixture()
  const original = structuredClone(app.data)
  assert.equal(await replaceApp(world, app, await replacement()), true)
  assert.notEqual(app.data.blueprint, 'original')
  assert.notEqual(app.data.blueprint, 'untrusted-import-id')
  assert.equal(app.blueprint.version, 0)
  assert.equal(app.blueprint.name, 'Modified')
  assert.deepEqual(app.blueprint.props, { color: 'blue' })
  assert.deepEqual(app.data.state, {})
  for (const key of ['id', 'position', 'quaternion', 'scale', 'pinned']) {
    assert.deepEqual(app.data[key], original[key])
  }
  assert.equal(duplicate.data.blueprint, original.blueprint)
  assert.equal(duplicate.blueprint.name, 'Original')
  assert.equal(uploaded.length, 1)
  assert.equal(cached.get('asset://modified.js').type, 'script')
  assert.deepEqual(
    sent.map(([event]) => event),
    ['blueprintAdded', 'entityModified']
  )
  assert.equal(sent[1][1].blueprint, sent[0][1].id)
  world.builder.undo()
  assert.deepEqual(app.data, original)
  assert.equal(sent.at(-1)[0], 'entityModified')
  assert.equal(sent.at(-1)[1].blueprint, original.blueprint)
})

test('failed uploads and asset loads leave the original instance unchanged', async () => {
  for (const failure of ['upload', 'load']) {
    const { app, world, sent } = fixture()
    const original = structuredClone(app.data)
    if (failure === 'upload')
      world.network.upload = async () => {
        throw new Error('Upload failed')
      }
    else
      world.loader.load = async () => {
        throw new Error('Load failed')
      }
    await assert.rejects(replaceApp(world, app, await replacement()), /failed/)
    assert.deepEqual(app.data, original)
    assert.deepEqual(sent, [])
    assert.equal(world.builder.undos.length, 0)
  }
})

test('script execution failures restore the original blueprint and state without publishing', async () => {
  const { app, world, sent } = fixture()
  const original = structuredClone(app.data)
  await assert.rejects(
    replaceApp(world, app, await replacement({ props: { fail: true } })),
    /original app has been restored/
  )
  assert.deepEqual(app.data, original)
  assert.equal(app.blueprint.name, 'Original')
  assert.deepEqual(sent, [])
  assert.equal(world.builder.undos.length, 0)
})

test('a crashed app can be replaced with a model-only app', async () => {
  const { app, world } = fixture()
  app.scriptError = new Error('Old failure')
  await replaceApp(world, app, await replacement({ script: null }))
  assert.equal(app.blueprint.name, 'Modified')
  assert.equal(app.scriptError, null)
})

test('permission loss or concurrent blueprint changes during upload prevent replacement', async () => {
  for (const revoke of [true, false]) {
    const { app, world, blueprints, sent } = fixture()
    const original = structuredClone(app.data)
    world.network.upload = async () => {
      if (revoke) world.builder.canBuild = () => false
      else blueprints.set('original', { ...app.blueprint, version: 6 })
    }
    await assert.rejects(replaceApp(world, app, await replacement()), revoke ? /permission/ : /changed/)
    assert.deepEqual(app.data, original)
    assert.deepEqual(sent, [])
  }
})

test('rejects unavailable, moving, non-builder, and scene targets before upload', async () => {
  for (const condition of ['destroyed', 'moving', 'permission', 'scene']) {
    const { app, world, uploaded, sent } = fixture()
    if (condition === 'destroyed') app.destroyed = true
    if (condition === 'moving') app.data.mover = 'another-client'
    if (condition === 'permission') world.builder.canBuild = () => false
    if (condition === 'scene') app.blueprint.scene = true
    await assert.rejects(replaceApp(world, app, await replacement()))
    assert.deepEqual(uploaded, [])
    assert.deepEqual(sent, [])
  }
})

test('rejects scene imports, incorrect extensions, and malformed properties', async () => {
  const { app, world, uploaded } = fixture()
  await assert.rejects(replaceApp(world, app, new File([], 'model.glb')), /Choose a .hyp/)
  await assert.rejects(replaceApp(world, app, await replacement({ scene: true })), /rather than a scene/)
  await assert.rejects(replaceApp(world, app, await replacement({ props: 'invalid' })), /properties/)
  assert.deepEqual(uploaded, [])
})

test('undo does not overwrite a subsequent replacement by another builder', async () => {
  const { app, world, sent } = fixture()
  await replaceApp(world, app, await replacement())
  app.data.blueprint = 'newer-replacement'
  world.builder.undo()
  assert.equal(app.data.blueprint, 'newer-replacement')
  assert.equal(sent.length, 2)
})

test('rejects truncated headers and asset payloads instead of importing partial files', async () => {
  await assert.rejects(importApp(new File([new Uint8Array(3)], 'bad.hyp')), /header/)
  const headerSize = new Uint8Array(4)
  new DataView(headerSize.buffer).setUint32(0, 100, true)
  await assert.rejects(importApp(new File([headerSize], 'bad.hyp')), /header/)
  const valid = await replacement()
  await assert.rejects(importApp(new File([valid.slice(0, valid.size - 1)], 'bad.hyp')), /asset/)
})
