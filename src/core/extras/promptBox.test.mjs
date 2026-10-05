import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile, readdir } from 'node:fs/promises'
import { hyperfySkillPlugin } from '../../../scripts/hyperfy-skill-plugin.mjs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { build } from 'esbuild'
import { Vector3, Quaternion, Matrix4, Box3, BoxGeometry, PerspectiveCamera, Scene } from 'three'
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'

const bundle = await build({
  stdin: {
    contents: `export * from './promptBoxTools.js'; export * from './PromptBoxWorkflow.js';
      export * from './PromptBoxResizeControls.js'; export * from './appTools.js';
      export * from './promptBoxIntersections.js'; export * from './LooseOctree.js';`,
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
  },
  plugins: [hyperfySkillPlugin()],
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
  getPromptBoxIntersections,
  getIntersectionSnapshot,
  LooseOctree,
} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)

function fixture() {
  const files = new Map([['asset://box.js', new File([promptBoxScript], 'box.js', { type: 'text/javascript' })]])
  const blueprints = new Map()
  const sent = []
  const undo = []
  const entities = new Map()
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
    entities: {
      items: entities,
      get: id => entities.get(id),
      remove: id => {
        entities.get(id).destroyed = true
        entities.delete(id)
      },
      add: (data, local) => {
        const restored = {
          ...app,
          destroyed: false,
          data: structuredClone(data),
          blueprint: blueprints.get(data.blueprint),
          root: {
            traverse: () => {},
            position: new Vector3().fromArray(data.position),
            quaternion: new Quaternion().fromArray(data.quaternion),
            scale: new Vector3().fromArray(data.scale),
          },
        }
        entities.set(data.id, restored)
        if (local) sent.push(['entityAdded', data])
        return restored
      },
    },
    stage: { octree: new LooseOctree({ scene: new Scene(), center: new Vector3(), size: 10 }), splatMeshes: new Map() },
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
    isApp: true,
    worldNodes: new Set(),
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
      traverse: () => {},
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
  entities.set(app.data.id, app)
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
      props: { promptBoxRequestId: request.requestId, promptBoxTargetEntityId: request.box.entityId },
    },
    async () => file
  )
}

test('ZIP carries exact world placement, physical dimensions, prompt and a portable script-only .hyp', async () => {
  const { workflow, app } = fixture()
  const zip = await workflow.export(app)
  const files = unzipSync(new Uint8Array(await zip.arrayBuffer()))
  assert.deepEqual(
    Object.keys(files)
      .filter(name => !name.startsWith('hyperfy-skill/'))
      .sort(),
    ['authoring.md', 'manifest.json', 'prompt-box.hyp', 'prompt.md']
  )
  const skillRoot = new URL('../../../hyperfy-skill/', import.meta.url)
  const skillPaths = await readdir(skillRoot, { recursive: true, withFileTypes: true })
  const expected = []
  for (const entry of skillPaths.filter(entry => entry.isFile())) {
    const filename = `${entry.parentPath}/${entry.name}`
    const relative = path.relative(fileURLToPath(skillRoot), filename)
    const zipPath = `hyperfy-skill/${relative}`
    expected.push(zipPath)
    assert.deepEqual(Buffer.from(files[zipPath]), await readFile(filename), zipPath)
  }
  assert.deepEqual(
    Object.keys(files)
      .filter(name => name.startsWith('hyperfy-skill/'))
      .sort(),
    expected.sort()
  )
  assert.match(strFromU8(files['prompt.md']), /Follow the bundled Hyperfy skill/)
  assert.match(strFromU8(files['authoring.md']), /contracts take\nprecedence/)
  assert.match(strFromU8(files['authoring.md']), /validate_result\.py result\.zip/)
  const request = JSON.parse(strFromU8(files['manifest.json']))
  assert.deepEqual(request.box.position, [3, 2, -7])
  assert.deepEqual(request.box.quaternion, app.data.quaternion)
  assert.deepEqual(request.box.dimensions, [0.3, 0.4, 0.2])
  assert.equal(request.result.standalone.baseY, -0.2)
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
  assert.equal((await readPromptBoxResult(zip, request))[0].blueprint.name, 'Coffee Mug')
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
    blueprint: {
      model: 'script-only',
      script: 'asset://missing.js',
      props: { promptBoxRequestId: request.requestId, promptBoxTargetEntityId: request.box.entityId },
    },
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
  await assert.rejects(() => readPromptBoxResult(zip, request), /at most one/)
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

function contextApp(f, id, { blueprint, position = f.app.root.position.toArray(), scale = [1, 1, 1] } = {}) {
  const bp = blueprint || {
    id: `${id}-bp`,
    version: 3,
    name: 'Wall',
    model: 'script-only',
    script: 'asset://box.js',
    props: {},
  }
  f.blueprints.set(bp.id, bp)
  const app = {
    isApp: true,
    data: {
      id,
      type: 'app',
      blueprint: bp.id,
      position: [...position],
      quaternion: [0, 0, 0, 1],
      scale: [...scale],
      state: {},
    },
    blueprint: bp,
    worldNodes: new Set(),
    root: {
      position: new Vector3().fromArray(position),
      quaternion: new Quaternion(),
      scale: new Vector3().fromArray(scale),
      traverse: () => {},
    },
    modify(change) {
      Object.assign(this.data, change)
      if (change.blueprint) this.blueprint = f.blueprints.get(change.blueprint)
      for (const key of ['position', 'quaternion', 'scale']) if (change[key]) this.root[key].fromArray(change[key])
      this.scriptError = null
    },
  }
  f.world.entities.items.set(id, app)
  return app
}

function part(
  f,
  app,
  size = [1, 1, 1],
  matrix = new Matrix4().compose(app.root.position, app.root.quaternion, app.root.scale),
  node = {}
) {
  const item = { geometry: new BoxGeometry(...size), matrix, node, getEntity: () => app }
  f.world.stage.octree.insert(item)
  return item
}

function frame(app) {
  return new Matrix4().compose(app.root.position, app.root.quaternion, new Vector3(1, 1, 1))
}

test('intersection detects containment, touching and transformed child parts; excludes non-apps and invisible context', () => {
  const f = fixture()
  const wall = contextApp(f, 'wall')
  part(f, wall, [10, 10, 10]) // Prompt volume fully inside the wall.
  part(f, wall) // Multiple parts still give one instance.
  const offset = contextApp(f, 'offset', { position: [50, 0, 0] })
  part(f, offset, [0.1, 0.1, 0.1], frame(f.app)) // Child is nowhere near its app root.
  const touching = contextApp(f, 'touching')
  part(f, touching, [0.1, 0.1, 0.1], frame(f.app).multiply(new Matrix4().makeTranslation(0.2, 0, 0)))
  for (const [id, change] of [
    ['scene', { scene: true }],
    ['disabled', { disabled: true }],
    ['other-box', { props: { promptBox: true } }],
  ]) {
    const other = contextApp(f, id)
    Object.assign(other.blueprint, change)
    part(f, other)
  }
  const player = contextApp(f, 'player')
  player.isApp = false
  part(f, player)
  const invisible = contextApp(f, 'invisible')
  part(f, invisible, [1, 1, 1], frame(f.app), { visible: false })
  part(f, invisible, [1, 1, 1], frame(f.app), { opacity: 0 })
  part(f, f.app)
  assert.deepEqual(
    getPromptBoxIntersections(f.world, f.app).map(app => app.data.id),
    ['offset', 'other-box', 'touching', 'wall']
  )
})

test('oriented bounds avoid world AABB corners, diagonal part bounds and gaps between parts', () => {
  const f = fixture()
  f.app.root.scale.set(4, 0.4, 0.2)
  const corner = contextApp(f, 'corner')
  // Inside the broad world AABB but outside the rotated narrow prompt volume.
  part(f, corner, [0.05, 0.05, 0.05], frame(f.app).multiply(new Matrix4().makeTranslation(0, 0, 0.5)))
  const gap = contextApp(f, 'gap')
  for (const sign of [-1, 1]) {
    part(f, gap, [0.1, 0.1, 0.1], frame(f.app).multiply(new Matrix4().makeTranslation(sign * 3, 0, 0)))
  }
  const diagonal = contextApp(f, 'diagonal')
  const local = new Matrix4().makeTranslation(2.1, 0, 0.4).multiply(new Matrix4().makeRotationY(Math.PI / 4))
  part(f, diagonal, [1, 0.1, 0.05], frame(f.app).multiply(local))
  assert.deepEqual(getPromptBoxIntersections(f.world, f.app), [])
})

test('reflected, nonuniformly scaled and sheared geometry bounds are supported', () => {
  const f = fixture()
  const other = contextApp(f, 'sheared')
  const shear = new Matrix4().set(-1, 0.8, 0, 0, 0, 2, 0.4, 0, 0, 0, 0.5, 0, 0, 0, 0, 1)
  const item = part(f, other, [1, 1, 1], frame(f.app).multiply(shear))
  assert.deepEqual(getPromptBoxIntersections(f.world, f.app), [other])
  item.matrix.premultiply(new Matrix4().makeTranslation(20, 0, 0))
  f.world.stage.octree.move(item)
  assert.deepEqual(getPromptBoxIntersections(f.world, f.app), [])
})

test('ZIP includes whole intersected apps and distinct transforms for instances of a shared blueprint', async () => {
  const f = fixture()
  const first = contextApp(f, 'wall/one', { scale: [-2, 3, 0.5] })
  const second = contextApp(f, 'wall-two', { blueprint: first.blueprint, position: [3.1, 2, -7] })
  const outside = contextApp(f, 'outside', { position: [99, 0, 0] })
  for (const app of [first, second, outside]) part(f, app)
  const zip = unzipSync(new Uint8Array(await (await f.workflow.export(f.app)).arrayBuffer()))
  const request = JSON.parse(strFromU8(zip['manifest.json']))
  assert.deepEqual(
    request.intersections.map(item => item.entityId),
    ['wall-two', 'wall/one']
  )
  assert.equal(request.intersectionMethod, 'transformed-geometry-bounds')
  assert.ok(zip['apps/wall%2Fone.hyp'])
  assert.ok(zip['apps/wall-two.hyp'])
  assert.equal(Object.keys(zip).filter(name => !name.startsWith('hyperfy-skill/')).length, 6)
  for (const app of [first, second]) {
    const snapshot = request.intersections.find(item => item.entityId === app.data.id)
    assert.deepEqual(snapshot.position, app.root.position.toArray())
    assert.deepEqual(snapshot.quaternion, app.root.quaternion.toArray())
    assert.deepEqual(snapshot.scale, app.root.scale.toArray())
    const local = new Vector3(0.2, 0.3, -0.4).applyMatrix4(new Matrix4().fromArray(snapshot.boxLocalMatrix))
    const world = local.applyMatrix4(frame(f.app))
    const expected = new Vector3(0.2, 0.3, -0.4).applyMatrix4(
      new Matrix4().compose(app.root.position, app.root.quaternion, app.root.scale)
    )
    assert.ok(world.distanceTo(expected) < 1e-12)
    const hyp = await importApp(new File([zip[snapshot.file]], 'wall.hyp'))
    assert.equal(hyp.blueprint.id, first.blueprint.id)
    assert.equal(await hyp.assets[0].file.text(), promptBoxScript)
  }
  assert.match(strFromU8(zip['authoring.md']), /column-major/)
  assert.match(strFromU8(zip['prompt.md']), /2 intersected apps/)
  // Context files do not alter the single-object result contract.
  assert.equal(await f.workflow.import(f.app, await generated(request)), true)
})

test('changed, removed, newly intersecting or rebuilding context rejects an in-flight export', async () => {
  for (const change of ['move', 'version', 'remove', 'new', 'building']) {
    const f = fixture()
    const wall = contextApp(f, 'wall')
    const item = part(f, wall)
    let changed = false
    const resolve = f.world.loader.loadFile
    f.world.loader.loadFile = async url => {
      if (!changed) {
        changed = true
        if (change === 'move') wall.root.position.x += 0.1
        if (change === 'version') wall.blueprint.version++
        if (change === 'remove') f.world.stage.octree.remove(item)
        if (change === 'new') part(f, contextApp(f, 'new'))
        if (change === 'building') wall.building = true
      }
      return resolve(url)
    }
    await assert.rejects(f.workflow.export(f.app), /Intersected apps changed during export/)
    assert.equal(f.app.blueprint.props.promptBoxRequest, undefined)
    assert.equal(f.sent.length, 0)
  }
  const f = fixture()
  const loading = contextApp(f, 'loading')
  loading.building = true
  part(f, loading)
  await assert.rejects(f.workflow.export(f.app), /finish loading or moving/)
})

test('non-indexed world UI, animated meshes and splats provide bounds; splat bounds are cached', () => {
  const f = fixture()
  const ui = contextApp(f, 'ui')
  ui.root.traverse = visit =>
    visit({ name: 'ui', geometry: new BoxGeometry(), mesh: { visible: true, matrixWorld: frame(f.app) } })
  const animated = contextApp(f, 'animated')
  animated.root.traverse = visit =>
    visit({
      name: 'skinnedmesh',
      obj: {
        traverse: callback =>
          callback({
            isMesh: true,
            visible: true,
            geometry: new BoxGeometry(),
            matrixWorld: frame(f.app),
          }),
      },
    })
  const splat = contextApp(f, 'splat')
  let reads = 0
  const mesh = {
    isInitialized: true,
    visible: true,
    opacity: 1,
    matrixWorld: frame(f.app),
    _hyperfyNode: { ctx: { entity: splat } },
    getBoundingBox: centersOnly => {
      assert.equal(centersOnly, false)
      reads++
      return new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
    },
  }
  f.world.stage.splatMeshes.set('splat', mesh)
  assert.deepEqual(
    getPromptBoxIntersections(f.world, f.app).map(app => app.data.id),
    ['animated', 'splat', 'ui']
  )
  mesh.matrixWorld = new Matrix4().makeTranslation(99, 0, 0)
  assert.deepEqual(
    getPromptBoxIntersections(f.world, f.app).map(app => app.data.id),
    ['animated', 'ui']
  )
  assert.equal(reads, 1)
  assert.equal(getIntersectionSnapshot(ui, f.app).name, 'Wall')
})

test('strong shear still intersects beyond the spatial index bounding sphere', () => {
  const f = fixture()
  f.app.root.position.set(1.3, 0.04, 0.04)
  f.app.root.quaternion.identity()
  f.app.root.scale.set(0.05, 0.05, 0.05)
  const wall = contextApp(f, 'sheared-wall', { position: [0, 0, 0] })
  const shear = new Matrix4().set(1, 1, 1, 0, 0, 0.1, 0, 0, 0, 0, 0.1, 0, 0, 0, 0, 1)
  // The transformed solid reaches X=1.5, while the picking sphere has radius <0.9.
  part(f, wall, [1, 1, 1], shear)
  assert.deepEqual(getPromptBoxIntersections(f.world, f.app), [wall])
})

async function modified(request, targetId, name = 'House with Window') {
  const file = new File([`app.add(app.create('prim', {type:'box',size:[1,1,0.1]}))`], 'changed.js', {
    type: 'text/javascript',
  })
  return exportApp(
    {
      name,
      model: 'script-only',
      script: 'asset://changed.js',
      props: {
        promptBoxRequestId: request.requestId,
        promptBoxTargetEntityId: targetId,
      },
    },
    async () => file
  )
}

async function resultZip(request, files) {
  const entries = { 'manifest.json': strToU8(JSON.stringify(request)) }
  for (let i = 0; i < files.length; i++) entries[`changed-${i}.hyp`] = new Uint8Array(await files[i].arrayBuffer())
  return new File([zipSync(entries)], 'result.zip')
}

function houseFixture() {
  const f = fixture()
  const house = contextApp(f, 'house', { position: [2, 1, -7], scale: [2, 1, 0.5] })
  house.root.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 6)
  house.data.quaternion = house.root.quaternion.toArray()
  house.data.state = { rooms: 3, doorsOpen: false }
  part(f, house, [10, 10, 10])
  const twin = contextApp(f, 'twin-house', { blueprint: house.blueprint, position: [100, 0, 0] })
  f.app.blueprint.props.prompt = 'Make a window in the timber frame house'
  return { ...f, house, twin }
}

test('export tells the author to modify a referenced house and align openings to its geometry, not the rotated box', async () => {
  const f = houseFixture()
  const zip = unzipSync(new Uint8Array(await (await f.workflow.export(f.app)).arrayBuffer()))
  const request = JSON.parse(strFromU8(zip['manifest.json']))
  assert.equal(request.version, 2)
  assert.equal(request.result.constructionCoordinates, 'preserve-app-local')
  assert.match(strFromU8(zip['prompt.md']), /edit that app in its original local frame/)
  const guide = strFromU8(zip['authoring.md'])
  assert.match(guide, /Project the hinted center onto the chosen wall plane/)
  assert.match(guide, /Do not create a separate window-shaped object over an intact wall/)
  const snapshot = request.intersections[0]
  const appWorld = new Matrix4().compose(f.house.root.position, f.house.root.quaternion, f.house.root.scale)
  const boxWorld = new Matrix4().compose(f.app.root.position, f.app.root.quaternion, f.app.root.scale)
  const reconstructed = appWorld.multiply(new Matrix4().fromArray(snapshot.boxInAppMatrix))
  assert.ok(reconstructed.elements.every((n, i) => Math.abs(n - boxWorld.elements[i]) < 1e-12))
  assert.deepEqual(snapshot.state, f.house.data.state)
  const hyp = await importApp(new File([zip[snapshot.file]], 'house.hyp'))
  assert.equal(hyp.blueprint.props.promptBoxTargetEntityId, 'house')
  assert.equal(hyp.blueprint.props.promptBoxRequestId, request.requestId)
  assert.equal(f.house.blueprint.props.promptBoxTargetEntityId, undefined)
})

test('a construction result edits only its target in the original frame, consumes the box and undoes everything', async () => {
  const f = houseFixture()
  await f.workflow.export(f.app)
  const request = f.app.blueprint.props.promptBoxRequest
  const original = structuredClone(f.house.data)
  const boxData = structuredClone(f.app.data)
  let confirmation
  f.world.ui.confirm = async value => {
    confirmation = value
    return true
  }
  assert.equal(await f.workflow.import(f.app, await modified(request, 'house')), true)
  assert.equal(confirmation.title, 'Apply construction edits')
  assert.match(confirmation.message, /Remove the completed prompt-box/)
  assert.equal(f.house.blueprint.name, 'House with Window')
  for (const key of ['position', 'quaternion', 'scale', 'state']) assert.deepEqual(f.house.data[key], original[key])
  assert.equal(f.world.entities.get(boxData.id), undefined)
  assert.equal(f.twin.data.blueprint, original.blueprint)
  assert.equal(f.blueprints.get(original.blueprint).name, 'Wall')
  assert.ok(f.sent.some(([name, id]) => name === 'entityRemoved' && id === boxData.id))
  f.workflow.undo()
  assert.deepEqual(f.house.data, original)
  assert.deepEqual(f.world.entities.get(boxData.id).data, boxData)
  assert.ok(f.sent.some(([name]) => name === 'entityAdded'))
})

test('one ZIP can modify several constructions and optionally replace the box; undo is one operation', async () => {
  for (const create of [false, true]) {
    const f = houseFixture()
    const fence = contextApp(f, 'fence')
    part(f, fence)
    await f.workflow.export(f.app)
    const request = f.app.blueprint.props.promptBoxRequest
    const originals = [f.house, fence].map(app => structuredClone(app.data))
    const files = [await modified(request, 'house'), await modified(request, 'fence', 'Fence with Gate')]
    if (create) files.unshift(await generated(request))
    const zip = await resultZip(request, files)
    assert.equal(await f.workflow.import(f.app, zip), true)
    assert.equal(f.house.blueprint.name, 'House with Window')
    assert.equal(fence.blueprint.name, 'Fence with Gate')
    assert.equal(f.world.entities.get(f.app.data.id)?.blueprint.name, create ? 'Coffee Mug' : undefined)
    assert.equal(f.undo.filter(action => action.name === 'replace-prompt-box').length, 1)
    f.workflow.undo()
    assert.deepEqual(f.house.data, originals[0])
    assert.deepEqual(fence.data, originals[1])
    assert.equal(f.world.entities.get(f.app.data.id).blueprint.props.promptBox, true)
  }
})

test('construction edits reject moved, resized, reconfigured, removed or locked targets, including during uploads', async () => {
  for (const timing of ['before', 'upload'])
    for (const mutation of ['move', 'resize', 'version', 'state', 'remove', 'locked']) {
      const f = houseFixture()
      await f.workflow.export(f.app)
      const request = f.app.blueprint.props.promptBoxRequest
      const file = await modified(request, 'house')
      const mutate = () => {
        if (mutation === 'move') f.house.root.position.x++
        if (mutation === 'resize') f.house.root.scale.x++
        if (mutation === 'version') f.house.blueprint.version++
        if (mutation === 'state') f.house.data.state.rooms++
        if (mutation === 'remove') f.world.entities.remove(f.house.data.id)
        if (mutation === 'locked') f.house.blueprint.locked = true
      }
      if (timing === 'before') mutate()
      else f.world.network.upload = async () => mutate()
      await assert.rejects(f.workflow.import(f.app, file), /changed since export|no longer available|locked/)
      assert.equal(f.world.entities.get(f.app.data.id), f.app)
      assert.equal(f.house.data.blueprint, request.intersections[0].blueprintId)
      assert.equal(f.workflow.lastReplacement, null)
    }
})

test('a failed second script rolls back all prior edits without publishing or removing the box', async () => {
  const f = houseFixture()
  const second = contextApp(f, 'second')
  part(f, second)
  await f.workflow.export(f.app)
  const request = f.app.blueprint.props.promptBoxRequest
  const original = structuredClone(f.house.data)
  const change = second.modify.bind(second)
  second.modify = value => {
    change(value)
    if (second.blueprint.name === 'Bad Script') second.scriptError = new Error('bad')
  }
  const zip = await resultZip(request, [
    await modified(request, 'house'),
    await modified(request, 'second', 'Bad Script'),
  ])
  await assert.rejects(f.workflow.import(f.app, zip), /script failed/)
  assert.deepEqual(f.house.data, original)
  assert.equal(second.blueprint.name, 'Wall')
  assert.equal(f.world.entities.get(f.app.data.id), f.app)
  assert.equal(
    f.sent.some(([name]) => name === 'entityModified' || name === 'entityRemoved' || name === 'blueprintAdded'),
    false
  )
})

test('unknown, missing or repeated targets are rejected before upload; old standalone results still work', async () => {
  const f = houseFixture()
  await f.workflow.export(f.app)
  const request = f.app.blueprint.props.promptBoxRequest
  await assert.rejects(readPromptBoxResult(await modified(request, 'unrelated'), request), /identify/)
  await assert.rejects(readPromptBoxResult(await modified(request, null), request), /identify/)
  await assert.rejects(
    readPromptBoxResult(
      await resultZip(request, [await modified(request, 'house'), await modified(request, 'house')]),
      request
    ),
    /duplicate target/
  )
  const legacy = { ...request, version: 1 }
  const results = await readPromptBoxResult(await modified(legacy, null), legacy)
  assert.equal(results[0].targetEntityId, request.box.entityId)
})

test('returned scripts cannot change construction root placement, and undo validates the whole batch first', async () => {
  const f = houseFixture()
  await f.workflow.export(f.app)
  const request = f.app.blueprint.props.promptBoxRequest
  const original = structuredClone(f.house.data)
  const change = f.house.modify.bind(f.house)
  f.house.modify = value => {
    change(value)
    if (f.house.blueprint.name === 'Move House') f.house.root.position.x += 10
  }
  await assert.rejects(f.workflow.import(f.app, await modified(request, 'house', 'Move House')), /root placement/)
  assert.deepEqual(f.house.data, original)
  assert.deepEqual(f.house.root.position.toArray(), original.position)
  f.house.modify = change
  await f.workflow.import(f.app, await modified(request, 'house'))
  const replacement = f.house.data.blueprint
  f.house.data.blueprint = 'newer-edit'
  assert.throws(() => f.workflow.undo(), /no longer available/)
  assert.equal(f.world.entities.get(f.app.data.id), undefined)
  f.house.data.blueprint = replacement
  f.workflow.undo()
  assert.equal(f.world.entities.get(f.app.data.id).blueprint.props.promptBox, true)
})

function multipleBoxFixture() {
  const f = houseFixture()
  const second = contextApp(f, 'second-box', { scale: [0.2, 0.6, 0.3] })
  second.blueprint.props = { promptBox: true, prompt: 'Create a streetlight' }
  second.blueprint.name = 'Prompt Box'
  second.root.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 8)
  second.data.quaternion = second.root.quaternion.toArray()
  second.root.position.x += 0.05
  second.data.position = second.root.position.toArray()
  second.data.state = { placeholder: true }
  part(f, second)
  f.app.blueprint.props.prompt = 'Create a coffee mug'
  return { ...f, second }
}

test('overlapping prompt-boxes export every prompt and create objects in their own frames with one undo', async () => {
  const f = multipleBoxFixture()
  const zip = unzipSync(new Uint8Array(await (await f.workflow.export(f.app)).arrayBuffer()))
  const request = f.app.blueprint.props.promptBoxRequest
  assert.equal(request.boxes.length, 2)
  assert.deepEqual(request.boxes[1], getIntersectionSnapshot(f.second, f.app).promptBox)
  assert.match(strFromU8(zip['prompt.md']), /Process all 2 prompt-boxes/)
  assert.match(strFromU8(zip['prompt.md']), /Create a streetlight/)
  assert.match(strFromU8(zip['authoring.md']), /Process EVERY entry/)
  assert.match(strFromU8(zip['authoring.md']), /combine those edits in one/)
  const reference = await importApp(new File([zip['apps/second-box.hyp']], 'second-box.hyp'))
  assert.equal(reference.blueprint.props.prompt, 'Create a streetlight')
  const originals = [f.app, f.second].map(app => structuredClone(app.data))
  await f.workflow.import(
    f.app,
    await resultZip(request, [await generated(request), await modified(request, f.second.data.id, 'Streetlight')])
  )
  for (const [i, app] of [f.app, f.second].entries()) {
    assert.deepEqual(app.data.position, originals[i].position)
    assert.deepEqual(app.data.quaternion, originals[i].quaternion)
    assert.deepEqual(app.data.scale, [1, 1, 1])
    assert.deepEqual(app.data.state, {})
  }
  assert.equal(f.second.blueprint.name, 'Streetlight')
  assert.equal(f.undo.length, 1)
  f.workflow.undo()
  assert.deepEqual(f.app.data, originals[0])
  assert.deepEqual(f.second.data, originals[1])
})

test('combined construction prompts consume all untargeted boxes and undo restores them together', async () => {
  for (const replacePrimary of [false, true]) {
    const f = multipleBoxFixture()
    await f.workflow.export(f.app)
    const request = f.app.blueprint.props.promptBoxRequest
    const originals = [f.app, f.second, f.house].map(app => structuredClone(app.data))
    const files = [await modified(request, 'house')]
    if (replacePrimary) files.push(await generated(request))
    await f.workflow.import(f.app, await resultZip(request, files))
    assert.equal(f.world.entities.get(f.second.data.id), undefined)
    assert.equal(!!f.world.entities.get(f.app.data.id), replacePrimary)
    f.workflow.undo()
    for (const data of originals) assert.deepEqual(f.world.entities.get(data.id).data, data)
  }
})

test('secondary prompt changes invalidate the whole request even if the result only edits a construction', async () => {
  for (const timing of ['before', 'upload']) {
    for (const mutation of ['prompt', 'move', 'resize', 'version', 'remove']) {
      const f = multipleBoxFixture()
      await f.workflow.export(f.app)
      const request = f.app.blueprint.props.promptBoxRequest
      const result = await modified(request, 'house')
      const mutate = () => {
        if (mutation === 'prompt') f.second.blueprint.props.prompt = 'Changed request'
        if (mutation === 'move') f.second.root.position.x++
        if (mutation === 'resize') f.second.root.scale.y++
        if (mutation === 'version') f.second.blueprint.version++
        if (mutation === 'remove') f.world.entities.remove(f.second.data.id)
      }
      if (timing === 'before') mutate()
      else f.world.network.upload = async () => mutate()
      await assert.rejects(f.workflow.import(f.app, result), /changed since export|no longer available/)
      assert.equal(f.workflow.lastReplacement, null)
      assert.equal(f.house.blueprint.name, 'Wall')
    }
  }
})

test('failed primary result restores a previously built secondary object without publishing the batch', async () => {
  const f = multipleBoxFixture()
  await f.workflow.export(f.app)
  const request = f.app.blueprint.props.promptBoxRequest
  const originals = [f.app, f.second].map(app => structuredClone(app.data))
  const modify = f.app.modify.bind(f.app)
  f.app.modify = change => {
    modify(change)
    if (!f.app.blueprint.props.promptBox) f.app.scriptError = new Error('bad')
  }
  await assert.rejects(
    f.workflow.import(
      f.app,
      await resultZip(request, [await generated(request), await modified(request, f.second.data.id, 'Streetlight')])
    ),
    /script failed/
  )
  assert.deepEqual(f.app.data, originals[0])
  assert.deepEqual(f.second.data, originals[1])
  assert.equal(
    f.sent.some(([name]) => name === 'entityModified' || name === 'entityRemoved' || name === 'blueprintAdded'),
    false
  )
})

test('each included prompt-box needs a prompt before export', async () => {
  const f = multipleBoxFixture()
  f.second.blueprint.props.prompt = '   '
  await assert.rejects(f.workflow.export(f.app), /every intersected prompt-box/)
  assert.equal(f.app.blueprint.props.promptBoxRequest, undefined)
})
