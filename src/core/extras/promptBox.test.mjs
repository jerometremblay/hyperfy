import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { Vector3, Quaternion, PerspectiveCamera, Scene } from 'three'
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'

const bundle = await build({
  stdin: {
    contents: `export * from './promptBoxTools.js'; export * from './PromptBoxWorkflow.js';
      export * from './PromptBoxResizeControls.js'; export * from './appTools.js';`,
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const {
  PromptBoxWorkflow,
  PromptBoxResizeControls,
  resizePromptBoxFace,
  readPromptBoxResult,
  exportApp,
  importApp,
  promptBoxScript,
} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)

function fixture() {
  const files = new Map([['asset://box.js', new File([promptBoxScript], 'box.js', { type: 'text/javascript' })]])
  const blueprints = new Map()
  const sent = []
  const undo = []
  let app
  const world = {
    network: { id: 'client', apiUrl: 'http://test/api', send: (...args) => sent.push(args), upload: async () => {} },
    loader: {
      insert: (_type, url, file) => files.set(url, file),
      load: async () => ({}),
      loadFile: url => files.get(url),
    },
    blueprints: {
      get: id => blueprints.get(id),
      add: bp => blueprints.set(bp.id, bp),
      modify: change => {
        const bp = { ...blueprints.get(change.id), ...change }
        blueprints.set(bp.id, bp)
        if (app.data.blueprint === bp.id) app.blueprint = bp
      },
    },
    builder: { canBuild: () => true, selected: null, addUndo: action => undo.push(action), select: () => {} },
    ui: { confirm: async () => true, setApp: () => {} },
    entities: { get: id => (id === app.data.id ? app : null) },
    emit: () => {},
  }
  const bp = {
    id: 'box-bp',
    version: 0,
    name: 'Prompt Box',
    model: 'script-only',
    script: 'asset://box.js',
    props: { promptBox: true, prompt: 'Create a coffee mug' },
  }
  blueprints.set(bp.id, bp)
  const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 3).toArray()
  app = {
    data: {
      id: 'box-entity',
      blueprint: bp.id,
      position: [3, 2, -7],
      quaternion: rotation,
      scale: [0.3, 0.4, 0.2],
      state: {},
    },
    blueprint: bp,
    building: false,
    destroyed: false,
    root: {
      position: new Vector3(3, 2, -7),
      quaternion: new Quaternion().fromArray(rotation),
      scale: new Vector3(0.3, 0.4, 0.2),
    },
    modify(change) {
      Object.assign(this.data, change)
      if (change.blueprint) this.blueprint = blueprints.get(change.blueprint)
      for (const key of ['position', 'quaternion', 'scale']) if (change[key]) this.root[key].fromArray(change[key])
      this.scriptError = null
    },
  }
  const workflow = new PromptBoxWorkflow(world)
  world.builder.promptBoxes = workflow
  return { app, world, workflow, files, blueprints, sent, undo }
}

async function generated(request, script = `app.add(app.create('prim', {type: 'cylinder', size: [0.1,0.1,0.4]}))`) {
  // Intentionally stale URL: the importer must hash the new asset bytes.
  const file = new File([script], 'old.js', { type: 'text/javascript' })
  return exportApp(
    {
      name: 'Coffee Mug',
      model: 'script-only',
      script: 'asset://old.js',
      props: { promptBoxRequestId: request.requestId },
    },
    async () => file
  )
}

test('ZIP carries exact world placement, physical dimensions, prompt and a portable script-only .hyp', async () => {
  const { workflow, app } = fixture()
  const zip = await workflow.export(app)
  const files = unzipSync(new Uint8Array(await zip.arrayBuffer()))
  assert.deepEqual(Object.keys(files).sort(), ['authoring.md', 'manifest.json', 'prompt-box.hyp', 'prompt.md'])
  const request = JSON.parse(strFromU8(files['manifest.json']))
  assert.deepEqual(request.box.position, [3, 2, -7])
  assert.deepEqual(request.box.quaternion, app.data.quaternion)
  assert.deepEqual(request.box.dimensions, [0.3, 0.4, 0.2])
  assert.equal(request.result.baseY, -0.2)
  assert.match(strFromU8(files['prompt.md']), /Create a coffee mug/)
  const reference = await importApp(new File([files['prompt-box.hyp']], 'prompt-box.hyp'))
  assert.equal(reference.assets.length, 1)
  assert.equal(await reference.assets[0].file.text(), promptBoxScript)
  assert.deepEqual(reference.blueprint.props.promptBoxRequest, request)
})

test('each face holds its opposite face fixed, including a rotated box and minimum size', () => {
  const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 3)
  for (let axis = 0; axis < 3; axis++)
    for (const sign of [-1, 1]) {
      const before = [3, 2, -7]
      const dimensions = [2, 3, 4]
      const result = resizePromptBoxFace(before, rotation.toArray(), dimensions, axis, sign, sign * 2)
      const opposite = new Vector3()
        .setComponent(axis, (-sign * dimensions[axis]) / 2)
        .applyQuaternion(rotation)
        .add(new Vector3(...before))
      const after = new Vector3()
        .setComponent(axis, (-sign * result.scale[axis]) / 2)
        .applyQuaternion(rotation)
        .add(new Vector3(...result.position))
      assert.ok(opposite.distanceTo(after) < 1e-12)
      assert.equal(result.scale[axis], dimensions[axis] + 2)
    }
  assert.equal(resizePromptBoxFace([0, 0, 0], [0, 0, 0, 1], [1, 1, 1], 0, 1, -20).scale[0], 0.01)
})

test('replacement preserves position and rotation, applies dimensions once, and undo restores the box', async () => {
  const f = fixture()
  await f.workflow.export(f.app)
  const request = f.app.blueprint.props.promptBoxRequest
  const unrelated = { ...f.app.data, id: 'another-instance' }
  assert.equal(await f.workflow.import(f.app, await generated(request)), true)
  assert.deepEqual(f.app.data.position, request.box.position)
  assert.deepEqual(f.app.data.quaternion, request.box.quaternion)
  assert.deepEqual(f.app.data.scale, [1, 1, 1])
  assert.equal(f.app.blueprint.name, 'Coffee Mug')
  assert.notEqual(f.app.data.blueprint, unrelated.blueprint)
  assert.equal(f.blueprints.get(unrelated.blueprint).props.promptBox, true)
  assert.equal(f.undo.at(-1).name, 'replace-prompt-box')
  assert.match(f.app.blueprint.script, /^asset:\/\/[a-f0-9]{64}\.js$/)
  f.workflow.undo()
  assert.deepEqual(f.app.data.scale, [0.3, 0.4, 0.2])
  assert.equal(f.app.blueprint.props.prompt, 'Create a coffee mug')
  assert.equal(f.app.blueprint.props.promptBox, true)
})

test('result ZIP roundtrip accepts an unchanged manifest and one generated app', async () => {
  const { workflow, app } = fixture()
  await workflow.export(app)
  const request = app.blueprint.props.promptBoxRequest
  const file = await generated(request)
  const zip = new File(
    [
      zipSync({
        'manifest.json': strToU8(JSON.stringify(request)),
        'apps/generated.hyp': new Uint8Array(await file.arrayBuffer()),
      }),
    ],
    'result.zip'
  )
  assert.equal((await readPromptBoxResult(zip, request)).blueprint.name, 'Coffee Mug')
})

test('moving, resizing, prompt edits and re-export invalidate an old result', async () => {
  for (const edit of [
    f => f.app.root.position.x++,
    f => f.app.root.scale.y++,
    f => {
      f.app.blueprint.props.prompt = 'Streetlight'
    },
    f => f.workflow.export(f.app),
  ]) {
    const f = fixture()
    await f.workflow.export(f.app)
    const file = await generated(f.app.blueprint.props.promptBoxRequest)
    await edit(f)
    await assert.rejects(() => f.workflow.import(f.app, file), /changed since export|Expected a generated object/)
    assert.equal(f.app.data.blueprint, 'box-bp')
  }
})

test('upload failure, cancelled confirmation and denied permission retain the original box', async () => {
  for (const kind of ['upload', 'cancel', 'permission']) {
    const f = fixture()
    await f.workflow.export(f.app)
    const file = await generated(f.app.blueprint.props.promptBoxRequest)
    if (kind === 'upload')
      f.world.network.upload = async () => {
        throw new Error('Upload failed')
      }
    if (kind === 'cancel') f.world.ui.confirm = async () => false
    if (kind === 'permission') f.world.builder.canBuild = () => false
    if (kind === 'cancel') assert.equal(await f.workflow.import(f.app, file), false)
    else await assert.rejects(() => f.workflow.import(f.app, file))
    assert.equal(f.app.data.blueprint, 'box-bp')
    assert.equal(f.workflow.lastReplacement, null)
  }
})

test('a runtime script failure restores the original box before publishing replacement', async () => {
  const f = fixture()
  await f.workflow.export(f.app)
  const file = await generated(f.app.blueprint.props.promptBoxRequest)
  const modify = f.app.modify.bind(f.app)
  f.app.modify = change => {
    modify(change)
    if (f.app.blueprint.name === 'Coffee Mug') f.app.scriptError = { message: 'bad script' }
  }
  await assert.rejects(() => f.workflow.import(f.app, file), /script failed/)
  assert.equal(f.app.data.blueprint, 'box-bp')
  assert.equal(f.workflow.lastReplacement, null)
  assert.equal(
    f.sent.some(([name]) => name === 'entityModified'),
    false
  )
})

test('a box changed while assets upload is retained', async () => {
  const f = fixture()
  await f.workflow.export(f.app)
  const file = await generated(f.app.blueprint.props.promptBoxRequest)
  f.world.network.upload = async () => {
    f.app.root.scale.y = 9
  }
  await assert.rejects(() => f.workflow.import(f.app, file), /changed since export/)
  assert.equal(f.app.data.blueprint, 'box-bp')
})

test('rejects malformed, truncated, missing-asset and wrong-request results', async () => {
  const { workflow, app } = fixture()
  await workflow.export(app)
  const request = app.blueprint.props.promptBoxRequest
  const valid = await generated(request)
  const bytes = new Uint8Array(await valid.arrayBuffer())
  await assert.rejects(() => readPromptBoxResult(new File([bytes.slice(0, -1)], 'bad.hyp'), request), /Truncated/)
  await assert.rejects(() => readPromptBoxResult(new File([bytes.slice(0, 3)], 'bad.hyp'), request), /header/)
  const wrong = await generated({ ...request, requestId: 'wrong' })
  await assert.rejects(() => readPromptBoxResult(wrong, request), /Expected a generated object/)
  const header = {
    blueprint: { model: 'script-only', script: 'asset://missing.js', props: { promptBoxRequestId: request.requestId } },
    assets: [],
  }
  const json = strToU8(JSON.stringify(header))
  const prefix = new Uint8Array(4)
  new DataView(prefix.buffer).setUint32(0, json.length, true)
  await assert.rejects(
    () => readPromptBoxResult(new File([prefix, json], 'missing.hyp'), request),
    /missing a referenced asset/
  )
  const zip = new File(
    [zipSync({ 'manifest.json': strToU8(JSON.stringify(request)), 'a.hyp': bytes, 'b.hyp': bytes })],
    'two.zip'
  )
  await assert.rejects(() => readPromptBoxResult(zip, request), /exactly one/)
  assert.equal(app.data.blueprint, 'box-bp')
})

test('blank prompt and invalid dimensions cannot be exported', async () => {
  const f = fixture()
  f.app.blueprint.props.prompt = ' '
  await assert.rejects(() => f.workflow.export(f.app), /Write a prompt/)
  f.app.blueprint.props.prompt = 'Mug'
  f.app.root.scale.x = -1
  await assert.rejects(() => f.workflow.export(f.app), /dimensions/)
})

test('new prompt-boxes use independent blueprints and place their bottom on the spawn surface', async () => {
  const f = fixture()
  const spawned = []
  f.world.builder.getSpawnTransform = () => ({ position: [2, 0, -3], quaternion: [0, 0, 0, 1] })
  f.world.entities.add = data => {
    spawned.push(data)
    return { data }
  }
  await f.workflow.create()
  await f.workflow.create()
  assert.deepEqual(spawned[0].position, [2, 0.5, -3])
  assert.deepEqual(spawned[0].scale, [1, 1, 1])
  assert.notEqual(spawned[0].blueprint, spawned[1].blueprint)
  assert.equal(f.blueprints.get(spawned[0].blueprint).unique, true)
})

test('explicit replacement undo removes its matching builder undo entry', async () => {
  const f = fixture()
  f.world.builder.undos = f.undo
  await f.workflow.export(f.app)
  await f.workflow.import(f.app, await generated(f.app.blueprint.props.promptBoxRequest))
  f.workflow.undo()
  assert.equal(f.world.builder.undos.length, 0)
})

test('a face pointing directly at the camera can still be dragged to resize', () => {
  const savedWindow = globalThis.window
  const savedDocument = globalThis.document
  globalThis.window = { addEventListener() {}, removeEventListener() {} }
  globalThis.document = { pointerLockElement: null }
  const f = fixture()
  f.app.root.position.set(0, 0, 0)
  f.app.root.quaternion.set(0, 0, 0, 1)
  f.app.root.scale.set(1, 1, 1)
  f.world.camera = new PerspectiveCamera(60, 1, 0.1, 100)
  f.world.camera.position.set(0, 0, 5)
  f.world.camera.updateMatrixWorld()
  f.world.stage = { scene: new Scene() }
  const viewport = {
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500 }),
    setPointerCapture() {},
    hasPointerCapture: () => false,
  }
  const controls = new PromptBoxResizeControls(f.world, f.app, viewport)
  try {
    const event = {
      button: 0,
      pointerId: 1,
      clientX: 250,
      clientY: 250,
      preventDefault() {},
      stopImmediatePropagation() {},
    }
    controls.onDown(event)
    assert.equal(controls.drag.axis, 2)
    assert.equal(controls.drag.endOn, true)
    controls.onMove({ ...event, clientY: 200 })
    assert.ok(f.app.root.scale.z > 1)
    assert.equal(f.app.root.position.z - f.app.root.scale.z / 2, -0.5)
    controls.onUp(event)
    assert.equal(controls.drag, null)
  } finally {
    controls.dispose()
    globalThis.window = savedWindow
    globalThis.document = savedDocument
  }
})
