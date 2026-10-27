// Adapted from https://github.com/dwebxr/coo-world/blob/f40fb416e19909b1a22e5807d18be587b6d8b871/test/stageModels.test.js
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { bundleRealPhysx, runRealPhysx } from './lib/realPhysx.mjs'

// Phase 3b-2b-2: Stage Models with no instances are released after a while, the materials they render with outlive
// them (so scripts' material proxies and their edits survive), the uber-shader hook is installed once, and prim
// geometry/material keys stay bounded. Uses a real Stage (the physics test world stubs it).
let bundle
before(async () => {
  bundle = await bundleRealPhysx()
})
after(() => bundle?.destroy())
const probe = (name, fn) => test(name, () => runRealPhysx(bundle, fn, undefined, { deadline: 120000 }))

probe(
  'stage: idle Models are released, kept materials and proxies outlive them, the uber hook is installed once',
  ({ B, world }) => {
    world.time = 0
    world.setupMaterial = () => {}
    const stage = new B.Stage(world)
    const geometry = new B.THREE.BoxGeometry(1, 1, 1)
    const material = new B.THREE.MeshStandardMaterial()
    const linked = (geo = geometry) =>
      stage.insertLinked({
        geometry: geo,
        material,
        uberShader: true,
        castShadow: true,
        receiveShadow: true,
        node: {},
        matrix: new B.THREE.Matrix4(),
      })
    const first = linked()
    const proxy = first.material
    proxy.color = 'red'
    const model = [...stage.models.values()][0]
    first.destroy()
    // a visible toggle or an LOD switch: back within the idle window keeps the Model
    world.time = 5
    stage.update()
    const again = linked()
    assert.equal([...stage.models.values()][0], model, 'the same Model is reused within the idle window')
    again.destroy()
    world.time = 6
    stage.update()
    // idle since 6
    world.time = 15
    stage.update()
    assert.equal(stage.models.size, 1, 'not yet: 9 s idle')
    world.time = 17
    stage.update()
    assert.equal(stage.models.size, 0, 'released after 10 s with no instances')
    // a rebuilt Model renders with the same material: the proxy and its edit survive
    const rebuilt = linked()
    assert.equal(rebuilt.material, proxy, 'the same material proxy')
    assert.equal(proxy.color.getHexString(), 'ff0000', 'the edit survives the rebuild')
    // the uber-shader hook declares the instance attributes once, however often the Model was rebuilt
    const raw = [...stage.linkedMaterials.values()][0].raw
    const shader = {
      vertexShader: '#include <color_pars_vertex>\n#include <color_vertex>',
      fragmentShader: '#include <color_pars_fragment>\nvec3 totalEmissiveRadiance = emissive;',
    }
    raw.onBeforeCompile(shader)
    assert.equal(shader.vertexShader.split('attribute vec3 instanceEmissive;').length - 1, 1)
    // geometry variants (a box Mesh whose width keeps changing) do not grow the kept materials past the limit; a small
    // limit stands in for the real 8192
    stage.linkedMaterialLimit = 16
    for (let i = 0; i < 100; i++) {
      linked(new B.THREE.BoxGeometry(1 + i, 1, 1)).destroy()
      world.time += 11
      stage.update()
      world.time += 11
      stage.update()
    }
    assert.ok(stage.linkedMaterials.size <= 16, `${stage.linkedMaterials.size} kept materials`)
    // past the limit with every Model alive: nothing in use is trimmed, the newest included
    for (let i = 0; i < 24; i++) linked(new B.THREE.BoxGeometry(1, 1 + i, 1))
    for (const live of stage.models.values()) {
      assert.ok(stage.linkedMaterials.has(live.id), 'every live Model keeps its material')
    }
    // an unlinked mesh disposes the material it cloned
    let disposed = 0
    const before = new Set(stage.scene.children)
    const single = stage.insertSingle({
      geometry,
      material,
      castShadow: false,
      receiveShadow: false,
      node: {},
      matrix: new B.THREE.Matrix4(),
    })
    const clone = stage.scene.children.find(child => !before.has(child))?.material
    assert.ok(clone && clone !== material, 'the unlinked mesh renders a clone')
    clone.addEventListener('dispose', () => disposed++)
    single.destroy()
    assert.equal(disposed, 1, 'the unlinked clone is disposed')
    // teardown disposes each kept material exactly once
    const disposals = new Map()
    for (const kept of stage.linkedMaterials.values()) {
      kept.raw.addEventListener('dispose', () => disposals.set(kept, (disposals.get(kept) ?? 0) + 1))
    }
    const keptCount = stage.linkedMaterials.size
    stage.destroy()
    assert.equal(disposals.size, keptCount, 'every kept material disposed at teardown')
    assert.ok(
      [...disposals.values()].every(count => count === 1),
      'exactly once'
    )
    assert.equal(stage.models.size, 0)
  }
)

probe('stage: exact prim recipes evict only unused cached resources', ({ B, world, root }) => {
  world.time = 0
  world.setupMaterial = () => {}
  world.stage = new B.Stage(world)
  const active = new B.Prim({ type: 'torus', size: [1, 0.123456789], roughness: 0.123456789 })
  root.add(active)
  const activeGeometry = active.cachedGeometry
  const activeMaterial = active.cachedMaterial
  let activeDisposed = 0
  activeGeometry.addEventListener('dispose', () => activeDisposed++)
  activeMaterial.addEventListener('dispose', () => activeDisposed++)
  assert.equal(activeGeometry.parameters.tube, 0.123456789, 'no shape quantization')
  assert.equal(activeMaterial.roughness, 0.123456789, 'no material quantization')
  let geometriesDisposed = 0
  let materialsDisposed = 0
  for (let i = 0; i < 1200; i++) {
    const node = new B.Prim({ type: 'torus', size: [1, 0.2 + i / 10000], roughness: 0.2 + i / 10000 })
    root.add(node)
    assert.ok(node.handle, 'the exact prim renders')
    node.cachedGeometry.addEventListener('dispose', () => geometriesDisposed++)
    node.cachedMaterial.addEventListener('dispose', () => materialsDisposed++)
    root.remove(node)
    world.time += 11
    world.stage.update()
  }
  assert.ok(geometriesDisposed >= 1200 - 1024, `${geometriesDisposed} unused geometries evicted`)
  assert.ok(materialsDisposed >= 1200 - 1024, `${materialsDisposed} unused materials evicted`)
  assert.equal(activeDisposed, 0, 'mounted resources survive idle cache churn')
  assert.equal(active.cachedGeometry, activeGeometry)
  assert.equal(active.cachedMaterial, activeMaterial)
  // A re-created exact recipe keeps its model id and retained material edits.
  const target = new B.Prim({ type: 'torus', size: [1, 0.2], roughness: 0.2 })
  root.add(target)
  const id = [...world.stage.models.values()].find(model => model.items.some(item => item.node === target)).id
  const proxy = target.handle.material
  proxy.color = 'red'
  root.remove(target)
  world.time += 11
  world.stage.update()
  world.time += 11
  world.stage.update()
  root.add(target)
  assert.equal([...world.stage.models.values()].find(model => model.items.some(item => item.node === target)).id, id)
  assert.equal(target.handle.material, proxy)
  assert.equal(proxy.color.getHexString(), 'ff0000')
  // Script-owned iterators and arrays cannot alter the retained recipe.
  let reads = 0
  const size = [1, 0.5, 1]
  size[Symbol.iterator] = function* () {
    reads++
    yield 1
    yield 2
    yield 1
  }
  const safe = new B.Prim({ type: 'cylinder', size })
  const copy = safe.size
  copy[1] = 2
  assert.deepEqual(safe.size, [1, 0.5, 1])
  root.add(safe)
  assert.equal(reads, 0)
  for (const value of [new Boolean(true), new Number(0.5)]) {
    assert.throws(() => new B.Prim({ doubleside: value }))
    assert.throws(() => new B.Prim({ roughness: value }))
  }
  const huge = new Proxy([1, 1, 1], { get: (target, key) => (key === 'length' ? 1e9 : target[key]) })
  assert.throws(() => new B.Prim({ size: huge }), /size must be an array of finite numbers/)
  root.remove(safe)
  root.remove(target)
  root.remove(active)
  world.stage.destroy()
})

probe('stage: kept materials come back under the limit when a burst of live variants expires', ({ B, world }) => {
  world.time = 0
  world.setupMaterial = () => {}
  const stage = new B.Stage(world)
  stage.linkedMaterialLimit = 16
  const material = new B.THREE.MeshStandardMaterial()
  const handles = []
  for (let i = 0; i < 24; i++) {
    handles.push(
      stage.insertLinked({
        geometry: new B.THREE.BoxGeometry(1, 1, 1 + i),
        material,
        uberShader: true,
        castShadow: true,
        receiveShadow: true,
        node: {},
        matrix: new B.THREE.Matrix4(),
      })
    )
  }
  assert.equal(stage.linkedMaterials.size, 24, 'all in use, none trimmed')
  for (const handle of handles) handle.destroy()
  stage.update()
  world.time = 11
  stage.update()
  assert.equal(stage.models.size, 0)
  assert.ok(stage.linkedMaterials.size <= 16, `${stage.linkedMaterials.size} kept after the burst expired`)
  // flags whose toString changes on every call cannot mint Models: 50 of them on one geometry make a single Model
  const geometry = new B.THREE.BoxGeometry(1, 1, 1)
  let calls = 0
  const flag = () => ({ toString: () => `true-${calls++}`, valueOf: () => true })
  const flagged = []
  for (let i = 0; i < 50; i++) {
    flagged.push(
      stage.insertLinked({
        geometry,
        material,
        uberShader: flag(),
        castShadow: flag(),
        receiveShadow: flag(),
        node: {},
        matrix: new B.THREE.Matrix4(),
      })
    )
  }
  assert.equal(stage.models.size, 1, `${stage.models.size} Models`)
  assert.equal(calls, 0, 'the flags were never stringified')
  for (const handle of flagged) handle.destroy()
  for (const [field, value] of [
    ['metalness', new Number(0.5)],
    ['roughness', new Number(0.5)],
    ['opacity', new Number(0.5)],
    ['castShadow', new Boolean(true)],
    ['receiveShadow', new Boolean(false)],
  ]) {
    assert.throws(() => new B.Prim({ type: 'box', size: [1, 1, 1], [field]: value }), undefined, field)
  }
})

probe(
  'mesh: box and sphere geometries are shared while in use, and at most 1024 unused ones stay cached',
  ({ B, world, root }) => {
    world.time = 0
    world.setupMaterial = () => {}
    world.stage = new B.Stage(world)
    const material = new B.THREE.MeshStandardMaterial()
    const placeholder = new B.THREE.BufferGeometry()
    // an unlinked mesh renders the shared geometry itself (a linked Model clones it)
    const mounted = options => {
      const node = new B.Mesh({ geometry: placeholder, material, linked: false, ...options })
      root.add(node)
      return { node, geometry: world.stage.scene.children.at(-1).geometry }
    }
    const rendered = options => {
      const { node, geometry } = mounted(options)
      root.remove(node)
      return geometry
    }
    for (const [type, field] of [
      ['box', 'width'],
      ['sphere', 'radius'],
    ]) {
      const size = i => ({ type, [field]: 1 + i / 1000 })
      const seen = new Set()
      let disposed = 0
      const watch = geometry => {
        if (!seen.has(geometry)) {
          seen.add(geometry)
          geometry.addEventListener('dispose', () => disposed++)
        }
        return geometry
      }
      // a mesh that stays mounted keeps its geometry through any churn
      const held = mounted(size(9000))
      watch(held.geometry)
      // least recently released first out: 1024 unused sizes fill the cache; touching the oldest makes the next one
      // the oldest, so one more size evicts that one and keeps the touched one
      const geometries = []
      for (let i = 0; i < 1024; i++) geometries.push(watch(rendered(size(i))))
      assert.equal(disposed, 0, `${type}: 1024 unused sizes stay cached`)
      assert.equal(rendered(size(0)), geometries[0], `${type}: the same size reuses its geometry`)
      watch(rendered(size(1024)))
      assert.equal(disposed, 1, `${type}: one evicted`)
      assert.equal(rendered(size(0)), geometries[0], `${type}: the touched size survives`)
      assert.notEqual(watch(rendered(size(1))), geometries[1], `${type}: the next oldest was evicted`)
      // 2000 more sizes: the cache keeps 1024 unused geometries plus the mounted one, and disposes the rest
      for (let i = 2000; i < 4000; i++) watch(rendered(size(i)))
      assert.equal(seen.size - disposed, 1024 + 1, `${type}: ${seen.size - disposed} geometries kept`)
      // two meshes share it: removing one leaves it held by the other through churn, removing both releases it
      const sharer = mounted(size(9000))
      assert.equal(sharer.geometry, held.geometry, `${type}: the mounted size kept its geometry`)
      let heldDisposed = 0
      held.geometry.addEventListener('dispose', () => heldDisposed++)
      root.remove(held.node)
      for (let i = 4000; i < 6000; i++) watch(rendered(size(i)))
      assert.equal(heldDisposed, 0, `${type}: still held by the other mesh`)
      const third = mounted(size(9000))
      assert.equal(third.geometry, held.geometry, `${type}: the same geometry`)
      root.remove(sharer.node)
      root.remove(third.node)
      for (let i = 6000; i < 8000; i++) watch(rendered(size(i)))
      assert.equal(heldDisposed, 1, `${type}: released by its last mesh, then evicted`)
    }
    // a linked mesh keeps its Model, and the material edit kept under it, through churn and a visibility toggle, and
    // through a deactivation long enough for its geometry to be evicted (the geometry made again has the same id)
    const linked = new B.Mesh({ type: 'box', width: 7, geometry: placeholder, material })
    root.add(linked)
    const proxy = linked.material
    proxy.color = 'red'
    for (let i = 0; i < 2000; i++) rendered({ type: 'box', width: 10 + i / 1000 })
    linked.visible = false
    linked.commit(false)
    linked.visible = true
    linked.commit(false)
    assert.equal(linked.material, proxy, 'the same material proxy')
    assert.equal(linked.material.color.getHexString(), 'ff0000', 'the edit survives')
    root.remove(linked)
    for (let i = 0; i < 2000; i++) rendered({ type: 'box', width: 20 + i / 1000 })
    root.add(linked)
    assert.equal(linked.material, proxy, 'the same material proxy after eviction')
    assert.equal(linked.material.color.getHexString(), 'ff0000', 'the edit survives eviction')
    // a failed insert (the octree takes the item, then throws) leaves nothing rendering or in the octree, disposes the
    // material an unlinked mesh cloned, and releases the geometry; so does a second mount
    const stage = world.stage
    const children = stage.scene.children.length
    const octreeItems = node => [...node.items, ...node.children.flatMap(octreeItems)]
    const insert = stage.octree.insert
    const createMaterial = stage.createMaterial
    for (const options of [{ linked: false }, { linked: true }, { visible: false }]) {
      const label = JSON.stringify(options)
      const cloned = []
      stage.createMaterial = (...args) => {
        const created = createMaterial.apply(stage, args)
        let disposals = 0
        created.raw.addEventListener('dispose', () => disposals++)
        cloned.push(() => disposals)
        return created
      }
      stage.octree.insert = item => {
        insert.call(stage.octree, item)
        throw new Error('octree')
      }
      const failing = new B.Mesh({ type: 'box', width: 30, geometry: placeholder, material, ...options })
      assert.throws(() => root.add(failing), /octree/)
      stage.octree.insert = insert
      stage.createMaterial = createMaterial
      assert.equal(stage.scene.children.length, children, `${label}: nothing left in the scene`)
      assert.equal(
        failing.handle ?? failing.sItem ?? failing.shared ?? null,
        null,
        `${label}: nothing kept by the node`
      )
      const models = [...stage.models.values()].filter(model => model.items.some(item => item.node === failing))
      assert.equal(models.length, 0, `${label}: no instance left in a Model`)
      const stray = octreeItems(stage.octree.root).filter(item => item.node === failing)
      assert.equal(stray.length, 0, `${label}: nothing left in the octree`)
      if (!options.linked && options.visible !== false) {
        assert.deepEqual(
          cloned.map(disposals => disposals()),
          [1],
          `${label}: the cloned material is disposed`
        )
      }
    }
    const twice = mounted({ type: 'box', width: 31 })
    let twiceDisposed = 0
    twice.geometry.addEventListener('dispose', () => twiceDisposed++)
    twice.node.mount()
    root.remove(twice.node)
    assert.equal(stage.scene.children.length, children, 'a second mount left nothing behind')
    for (let i = 0; i < 2000; i++) rendered({ type: 'box', width: 40 + i / 1000 })
    assert.equal(twiceDisposed, 1, 'its geometry was released, so it could be evicted')
    // a Number object (its toString could mint keys) and non-finite sizes are refused
    for (const field of ['width', 'height', 'depth', 'radius']) {
      for (const value of [new Number(1), { valueOf: () => 1 }, NaN, Infinity, '1']) {
        assert.throws(() => new B.Mesh({ type: 'box', [field]: value }), /not a number/, `${field} ${String(value)}`)
      }
    }
  }
)

probe('prim: bounded extrusion recipes remain exact and ignore script iterators', ({ B, world, root }) => {
  world.time = 0
  world.setupMaterial = () => {}
  world.stage = new B.Stage(world)
  const profile = [
    [0, 0],
    [0.123456789, 0],
    [0.1, 0.5],
    [0, 0.5],
  ]
  let iterations = 0
  profile[Symbol.iterator] = () => {
    iterations++
    throw new Error('script iterator')
  }
  for (let i = 0; i < profile.length; i++) profile[i][Symbol.iterator] = profile[Symbol.iterator]
  const node = new B.Prim({ type: 'extrude', profile, depth: 0.234567891, bevelEnabled: false, physics: 'static' })
  profile[1][0] = 99
  const copy = node.getProxy().profile
  copy[0][0] = 88
  assert.equal(node.profile[1][0], 0.123456789)
  assert.equal(node.profile[0][0], 0)
  root.add(node)
  assert.ok(node.handle && node.actor?.ptr, 'the fork extrusion renders and collides')
  assert.equal(node.cachedGeometry.parameters.options.depth, 0.234567891)
  assert.equal(iterations, 0)
  for (const options of [
    { profile: Array.from({ length: 257 }, () => [0, 0]) },
    {
      profile: [
        [0, 0],
        [1e39, 0],
        [0, 1],
      ],
    },
    { depth: new Number(1) },
    { bevelSegments: 17 },
    { curveSegments: 65 },
    { bevelEnabled: new Boolean(true) },
  ])
    assert.throws(() => new B.Prim({ type: 'extrude', ...options }))
  root.remove(node)
  world.stage.destroy()
})

probe(
  'prim: pending textures release their pins and stale failures preserve a newer mount',
  async ({ B, world, root }) => {
    world.time = 0
    world.setupMaterial = () => {}
    world.resolveURL = url => url
    world.stage = new B.Stage(world)
    let rejectLoad
    world.loader = {
      get() {},
      load: () =>
        new Promise((resolve, reject) => {
          rejectLoad = reject
        }),
    }
    const node = new B.Prim({ texture: 'pending-texture.png' })
    root.add(node)
    const oldMaterial = node.cachedMaterial
    root.remove(node)
    node.texture = null
    root.add(node)
    const current = node.handle
    rejectLoad(new Error('injected texture failure'))
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(node.handle, current, 'a stale rejection cannot unmount the current visual')
    assert.equal(node.cachedMaterial.map, null)
    root.remove(node)
    // The failed cached recipe can retry and complete, instead of remaining an unresolved promise.
    world.loader = { get: () => new B.THREE.Texture() }
    node.texture = 'pending-texture.png'
    root.add(node)
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.ok(node.handle)
    assert.equal(node.cachedMaterial, oldMaterial)
    assert.ok(node.cachedMaterial.map?.isTexture)
    root.remove(node)
    // A current failure cleans up both raw-resource pins and any partial visual state.
    world.loader = {
      get() {},
      load: async () => {
        throw new Error('injected current failure')
      },
    }
    const failed = new B.Prim({ texture: 'failed-texture.png' })
    root.add(failed)
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(failed.cachedMaterial, null)
    assert.equal(failed.cachedGeometry, null)
    assert.ok(!failed.handle)
    root.remove(failed)
    world.stage.destroy()
  }
)
