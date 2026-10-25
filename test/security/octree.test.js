// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/octree.test.js
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { bundleProbe, runProbe } from './lib/workerProbe.mjs'

let bundle
before(async () => {
  bundle = await bundleProbe(`
    export * as THREE from './src/core/extras/three'
    export { LooseOctree } from './src/core/extras/LooseOctree'
    export { SnapOctree } from './src/core/extras/SnapOctree'
    export { MAX_OCTREE_SIZE, getOctreeExpansions } from './src/core/extras/octreeBounds.js'
    export { Stage } from './src/core/systems/Stage'
    export { Snaps } from './src/core/systems/Snaps'
    export { Snap } from './src/core/nodes/Snap'
    export { Image } from './src/core/nodes/Image'
    export { Mesh } from './src/core/nodes/Mesh'
    export { UI } from './src/core/nodes/UI'
    export { Video } from './src/core/nodes/Video'
    export { Avatar } from './src/core/nodes/Avatar'
    export { createVRMFactory } from './src/core/extras/createVRMFactory'
  `)
})
after(() => bundle?.destroy())

for (const kind of ['LooseOctree', 'SnapOctree']) {
  for (const value of [NaN, Infinity, 1e300, 1e308]) {
    test(`${kind}: rejects centre ${value} without expansion, including repeated moves`, () =>
      runProbe(
        bundle,
        ({ THREE, LooseOctree, SnapOctree }, { kind, value }) => {
          const Tree = kind === 'LooseOctree' ? LooseOctree : SnapOctree
          const tree = new Tree({ center: new THREE.Vector3(), size: 10 })
          const make = x => ({
            position: new THREE.Vector3(x, 0, 0),
            active: true,
            matrix: new THREE.Matrix4().makeTranslation(x, 0, 0),
            geometry: new THREE.BoxGeometry(),
            material: new THREE.MeshBasicMaterial(),
          })
          const ordinary = make(0)
          assert.equal(tree.insert(ordinary), true)
          const root = tree.root
          const depth = node => 1 + Math.max(0, ...node.children.map(depth))
          const originalDepth = depth(root)
          const item = make(value)
          const warning = console.warn
          let warnings = 0
          console.warn = () => warnings++
          try {
            assert.equal(tree.insert(item), false)
            for (let i = 0; i < 100; i++) assert.equal(tree.move(item), false)
            // The warning is shared by tree instances in this process.
            const other = new Tree({ center: new THREE.Vector3(), size: 10 })
            assert.equal(other.insert(make(value)), false)
            assert.equal(warnings, 1)
          } finally {
            console.warn = warning
          }
          assert.equal(item._node, null)
          assert.equal(item._parked, true)
          assert.equal(tree.root, root)
          assert.equal(root.size, 10)
          assert.equal(root.count, 1)
          assert.equal(depth(root), originalDepth)
          if (kind === 'LooseOctree') {
            const hits = tree.raycast(new THREE.Raycaster(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, -1)))
            assert.ok(hits.length)
          } else {
            assert.equal(tree.query(new THREE.Vector3(), 1).length, 1)
          }
          tree.remove(item)
          tree.remove(item)
          assert.equal(item._parked, false)
          item.matrix.identity()
          item.position.set(0, 0, 0)
          tree.move(item)
          assert.equal(item._node, null)
          assert.equal(root.count, 1)
        },
        { kind, value }
      ))
  }

  test(`${kind}: valid -> NaN -> valid recovers, ordinary moves collapse abandoned nodes`, () =>
    runProbe(
      bundle,
      ({ THREE, LooseOctree, SnapOctree }, kind) => {
        const Tree = kind === 'LooseOctree' ? LooseOctree : SnapOctree
        const tree = new Tree({ center: new THREE.Vector3(), size: 10 })
        const item = {
          position: new THREE.Vector3(),
          active: true,
          matrix: new THREE.Matrix4(),
          geometry: new THREE.BoxGeometry(),
          material: new THREE.MeshBasicMaterial(),
        }
        assert.equal(tree.insert(item), true)
        const move = x => {
          item.position.x = x
          item.matrix.makeTranslation(x, 0, 0)
          return tree.move(item)
        }
        assert.equal(move(100), true)
        const previous = item._node
        assert.equal(move(-100), true)
        assert.notEqual(item._node, previous)
        assert.equal(previous.count, 0)
        assert.equal(tree.root.count, 1)
        assert.equal(move(NaN), false)
        assert.equal(tree.root.count, 0)
        assert.equal(tree.root.children.length, 0)
        assert.equal(item._node, null)
        assert.equal(item._parked, true)
        assert.equal(move(0), true)
        assert.equal(item._parked, false)
        if (kind === 'LooseOctree') {
          assert.ok(tree.raycast(new THREE.Raycaster(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, -1))).length)
        } else {
          assert.equal(tree.query(new THREE.Vector3(), 1).length, 1)
          item.active = false
          assert.equal(tree.query(new THREE.Vector3(), 1).length, 0)
        }
        tree.remove(item)
        tree.remove(item)
        assert.equal(tree.root.count, 0)
        assert.equal(item._node, null)
        assert.equal(item._parked, false)
      },
      kind
    ))
}

test('LooseOctree: non-finite radii park without growth and recover after correction', () =>
  runProbe(bundle, ({ THREE, LooseOctree }) => {
    for (const radius of [Infinity, -Infinity, NaN]) {
      const tree = new LooseOctree({ center: new THREE.Vector3(), size: 10 })
      const geometry = new THREE.BoxGeometry()
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius)
      const item = { geometry, matrix: new THREE.Matrix4(), material: new THREE.MeshBasicMaterial() }
      assert.equal(tree.insert(item), false)
      assert.equal(tree.root.size, 10)
      assert.equal(tree.root.children.length, 0)
      geometry.computeBoundingSphere()
      assert.equal(tree.move(item), true)
      assert.ok(tree.raycast(new THREE.Raycaster(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, -1))).length)
    }
  }))

test('LooseOctree: a unit cube scaled 1e6 stays raycastable within the absolute budget', () =>
  runProbe(bundle, ({ THREE, LooseOctree, MAX_OCTREE_SIZE }) => {
    const tree = new LooseOctree({ center: new THREE.Vector3(), size: 10 })
    const item = {
      geometry: new THREE.BoxGeometry(),
      matrix: new THREE.Matrix4().makeScale(1e6, 1e6, 1e6),
      material: new THREE.MeshBasicMaterial(),
    }
    assert.equal(tree.insert(item), true)
    assert.equal(tree.root.size, 2621440)
    assert.ok(tree.root.size <= MAX_OCTREE_SIZE)
    const check = node => {
      for (const box of [node.inner, node.outer]) {
        assert.ok([...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite))
      }
      node.children.forEach(check)
    }
    check(tree.root)
    const hits = tree.raycast(new THREE.Raycaster(new THREE.Vector3(0, 0, 2e6), new THREE.Vector3(0, 0, -1)))
    assert.ok(hits.length)
    assert.equal(hits[0].distance, 1.5e6)
  }))

test('octree preflight: exact containment, intermediate roots and generated bounds', () =>
  runProbe(bundle, ({ THREE, LooseOctree, SnapOctree, getOctreeExpansions, MAX_OCTREE_SIZE }) => {
    for (const Tree of [LooseOctree, SnapOctree]) {
      const loose = Tree === LooseOctree
      for (const x of [-1e7, -100, 0, 10, 11, 100, 1e7]) {
        const tree = new Tree({ center: new THREE.Vector3(), size: 10 })
        const position = new THREE.Vector3(x, x, x)
        const radius = loose ? 10 : 0
        const expansions = getOctreeExpansions(tree.root, position, radius, loose)
        assert.ok(expansions >= 0)
        for (let i = 0; i < expansions; i++) {
          assert.equal(
            loose ? tree.root.canContain({ sphere: { center: position, radius } }) : tree.root.canContain(position),
            false
          )
          tree.expand()
        }
        assert.equal(
          loose ? tree.root.canContain({ sphere: { center: position, radius } }) : tree.root.canContain(position),
          true
        )
        assert.ok(tree.root.size <= MAX_OCTREE_SIZE)
      }
    }
    // Radius need not fit inside the inner box; the centre does.
    assert.equal(getOctreeExpansions({ center: { x: 0, y: 0, z: 0 }, size: 10 }, { x: 10, y: 10, z: 10 }, 10, true), 0)
    // The first intermediate root fits, but the second would exceed the budget.
    assert.equal(getOctreeExpansions({ center: { x: 0, y: 0, z: 0 }, size: 4e7 }, { x: 5e7, y: 0, z: 0 }), -1)
    for (const size of [0, NaN, Infinity, 1e308]) {
      assert.equal(getOctreeExpansions({ center: { x: 1e308, y: 0, z: 0 }, size }, { x: 0, y: 0, z: 0 }, 1, true), -1)
    }
  }))

for (const linked of [false, true]) {
  test(`Stage ${linked ? 'linked' : 'single'}: parked insert -> move -> raycast -> destroy`, () =>
    runProbe(
      bundle,
      ({ THREE, Stage }, linked) => {
        const stage = new Stage({ setupMaterial() {} })
        const matrix = new THREE.Matrix4().makeTranslation(NaN, 0, 0)
        const node = { ctx: { entity: {} } }
        const handle = stage.insert({
          linked,
          matrix,
          node,
          geometry: new THREE.BoxGeometry(),
          material: new THREE.MeshBasicMaterial(),
        })
        assert.equal(stage.octree.root.count, 0)
        matrix.identity()
        handle.move(matrix)
        const hits = stage.octree.raycast(new THREE.Raycaster(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, -1)))
        assert.ok(hits.length)
        assert.equal(hits[0].getEntity(), node.ctx.entity)
        handle.destroy()
        assert.equal(stage.octree.root.count, 0)
      },
      linked
    ))
}

test('Image: invalid creation -> commit after matrix copy -> hit -> destroy', () =>
  runProbe(bundle, async ({ THREE, Stage, Image }) => {
    const world = {
      setupMaterial() {},
      network: { isServer: false },
      graphics: { maxAnisotropy: 1 },
      loader: { get: () => ({ width: 1, height: 1 }) },
    }
    world.stage = new Stage(world)
    const node = new Image({ src: 'asset://image.png' })
    node.ctx = { world, entity: {} }
    node.matrixWorld.makeTranslation(NaN, 0, 0)
    await node.build()
    assert.equal(node.sItem._parked, true)
    node.matrixWorld.identity()
    const move = world.stage.octree.move.bind(world.stage.octree)
    world.stage.octree.move = item => {
      assert.deepEqual(node.mesh.matrixWorld.elements, node.matrixWorld.elements)
      return move(item)
    }
    node.commit(true)
    assert.equal(node.sItem._parked, false)
    assert.ok(
      world.stage.octree.raycast(new THREE.Raycaster(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, -1))).length
    )
    node.unmount()
    node.commit(true)
    assert.equal(world.stage.octree.root.count, 0)
    assert.equal(node.sItem, null)
  }))

test('Mesh direct item: parked mount -> commit -> hit -> unmount', () =>
  runProbe(bundle, ({ THREE, Stage, Mesh }) => {
    const world = { setupMaterial() {} }
    world.stage = new Stage(world)
    const node = new Mesh({
      visible: false,
      geometry: new THREE.BoxGeometry(),
      material: new THREE.MeshBasicMaterial(),
    })
    node.ctx = { world, entity: {} }
    node.matrixWorld.makeTranslation(NaN, 0, 0)
    node.mount()
    assert.equal(node.sItem._parked, true)
    node.matrixWorld.identity()
    node.commit(true)
    assert.ok(
      world.stage.octree.raycast(new THREE.Raycaster(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, -1))).length
    )
    node.unmount()
    assert.equal(world.stage.octree.root.count, 0)
  }))

test('Snap / Snaps: parked creation -> commit -> query -> unmount', () =>
  runProbe(bundle, ({ THREE, Snap, Snaps }) => {
    const world = {}
    world.snaps = new Snaps(world)
    const node = new Snap()
    node.ctx = { world }
    node.matrixWorld.makeTranslation(NaN, 0, 0)
    node.mount()
    assert.equal(world.snaps.octree.root.count, 0)
    node.matrixWorld.identity()
    node.commit(true)
    assert.equal(world.snaps.octree.query(new THREE.Vector3(), 1).length, 1)
    node.unmount()
    assert.equal(world.snaps.octree.root.count, 0)
    node.matrixWorld.makeTranslation(NaN, 0, 0)
    node.mount()
    node.unmount()
    assert.equal(world.snaps.octree.root.count, 0)
  }))

test('UI: parked build -> lateUpdate -> hit -> unmount', () =>
  runProbe(
    bundle,
    ({ THREE, Stage, UI }) => {
      globalThis.document = { createElement: () => ({ getContext: () => ({}) }) }
      const world = {
        setupMaterial() {},
        setHot() {},
        network: { isServer: false },
        graphics: { maxAnisotropy: 1 },
        camera: new THREE.Object3D(),
      }
      world.stage = new Stage(world)
      const node = new UI()
      node.ctx = { world, entity: {} }
      node.matrixWorld.makeTranslation(NaN, 0, 0)
      node.build()
      assert.equal(node.sItem._parked, true)
      node.matrixWorld.identity()
      node.lateUpdate(0.1)
      assert.equal(node.sItem._parked, false)
      assert.ok(
        world.stage.octree.raycast(new THREE.Raycaster(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, -1))).length
      )
      node.unmount()
      assert.equal(world.stage.octree.root.count, 0)
    },
    { browser: true }
  ))

test('Video: parked mount -> commit -> hit -> unmount', () =>
  runProbe(bundle, async ({ THREE, Stage, Video }) => {
    const world = { setupMaterial() {}, network: { isServer: false }, livekit: { unregisterScreenNode() {} } }
    world.stage = new Stage(world)
    const node = new Video()
    node.ctx = { world, entity: {} }
    node.matrixWorld.makeTranslation(NaN, 0, 0)
    await node.mount()
    assert.equal(node.sItem._parked, true)
    node.matrixWorld.identity()
    node.commit(true)
    assert.equal(node.sItem._parked, false)
    assert.ok(
      world.stage.octree.raycast(new THREE.Raycaster(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, -1))).length
    )
    node.unmount()
    assert.equal(world.stage.octree.root.count, 0)
  }))

test('Avatar / VRM factory: parked capsule -> commit -> hit -> unmount', () =>
  runProbe(bundle, async ({ THREE, Stage, Avatar, createVRMFactory }) => {
    const scene = new THREE.Scene()
    const root = new THREE.Bone()
    root.name = 'hips'
    const head = new THREE.Bone()
    head.name = 'head'
    head.position.y = 1
    root.add(head)
    scene.add(root)
    const geometry = new THREE.BoxGeometry(1, 2, 1)
    const count = geometry.attributes.position.count
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(count * 4), 4))
    const weights = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) weights[i * 4] = 1
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4))
    const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial())
    scene.add(mesh)
    scene.updateMatrixWorld(true)
    mesh.bind(new THREE.Skeleton([root, head]))
    const humanBones = {
      hips: { node: root },
      head: { node: head },
      leftUpperArm: { node: head },
      rightUpperArm: { node: head },
    }
    const glb = {
      scene,
      userData: {
        vrm: {
          meta: { metaVersion: '1' },
          humanoid: {
            _rawHumanBones: { humanBones },
            _normalizedHumanBones: { humanBones },
            update() {},
            getRawBoneNode: name => humanBones[name]?.node,
          },
        },
      },
    }
    const world = { setupMaterial() {}, setHot() {}, avatars: { add() {}, remove() {} } }
    world.stage = new Stage(world)
    const factory = createVRMFactory(glb, world.setupMaterial)
    const hooks = {
      scene: world.stage.scene,
      octree: world.stage.octree,
      loader: { load: async () => ({ toClip: () => new THREE.AnimationClip('idle', 1, []) }) },
    }
    const node = new Avatar({ factory, hooks })
    node.ctx = { world, entity: {} }
    node.matrixWorld.makeTranslation(NaN, 0, 0)
    await node.mount()
    assert.equal(world.stage.octree.root.count, 0)
    node.matrixWorld.identity()
    node.commit(true)
    assert.equal(world.stage.octree.root.count, 1)
    assert.ok(
      world.stage.octree.raycast(new THREE.Raycaster(new THREE.Vector3(0, 0.5, 5), new THREE.Vector3(0, 0, -1))).length
    )
    node.unmount()
    assert.equal(world.stage.octree.root.count, 0)
  }))
