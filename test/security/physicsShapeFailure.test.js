// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/physicsShapeFailure.test.js
import { after, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry } from 'three'
import { bundleProbe } from './lib/workerProbe.mjs'
import { makePhysX } from './lib/physxCookingStub.mjs'

let bundle
let Collider, Prim, Node, geometryToPxMesh, secureRef
let stub
const previousPhysX = Object.getOwnPropertyDescriptor(globalThis, 'PHYSX')
const originalWarn = console.warn
const originalError = console.error
const warnings = []

before(async () => {
  console.warn = value => warnings.push(value)
  console.error = () => {}
  bundle = await bundleProbe(`
    export { Collider } from './src/core/nodes/Collider'
    export { Prim } from './src/core/nodes/Prim'
    export { Node, secureRef } from './src/core/nodes/Node'
    export { geometryToPxMesh } from './src/core/extras/geometryToPxMesh'
  `)
  ;({ Collider, Prim, Node, geometryToPxMesh, secureRef } = await import(bundle.url))
})
beforeEach(() => {
  stub = makePhysX()
  globalThis.PHYSX = stub.physx
})
after(() => {
  console.warn = originalWarn
  console.error = originalError
  bundle?.destroy()
  if (previousPhysX) Object.defineProperty(globalThis, 'PHYSX', previousPhysX)
  else delete globalThis.PHYSX
})

function collider(kind) {
  const geometry = new BoxGeometry()
  const node = new Collider({
    type: kind === 'box' || kind === 'sphere' ? kind : 'geometry',
    geometry: secureRef({}, () => geometry),
    convex: kind === 'convex',
    trigger: kind === 'trigger',
  })
  const parent = new Node()
  const shapes = new Set()
  parent.addShape = shape => {
    assert.ok(shape?.ptr)
    shapes.add(shape)
    stub.state.calls.push('addShape')
  }
  parent.removeShape = shape => {
    if (!shape) return
    assert.ok(shape.ptr)
    assert.equal(shapes.delete(shape), true)
  }
  node.parent = parent
  node.ctx = { world: stub.world }
  return { node, shapes, geometry }
}

function prim(type, physics = 'dynamic') {
  const node = new Prim({ type, physics, opacity: 0 })
  node.ctx = { world: stub.world }
  return { node, shapes: node.shapes }
}

const cases = [
  ...['box', 'sphere', 'convex', 'triangles', 'trigger'].map(kind => ({
    name: `Collider ${kind}`,
    create: () => collider(kind),
  })),
  ...['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane'].map(kind => ({
    name: `Prim ${kind}`,
    create: () => prim(kind),
  })),
  { name: 'Prim static convex', create: () => prim('cylinder', 'static') },
  { name: 'Prim kinematic convex', create: () => prim('cylinder', 'kinematic') },
  {
    name: 'Prim nonuniform sphere',
    create: () => {
      const fixture = prim('sphere')
      fixture.node.matrixWorld.makeScale(1, 2, 1)
      return fixture
    },
  },
]

for (const { name, create } of cases) {
  for (const mode of ['null', 'zero', 'throw']) {
    test(`${name}: ${mode} shape cleans up before unmount and a second mount`, async () => {
      const { node, shapes } = create()
      stub.state.shapeResult = mode
      stub.state.onCreateShape = () => assert.ok(!node.shape, 'shape was published before validation')
      await node.mount()
      assert.equal(node.shape, null)
      assert.equal(node.pmesh, null)
      assert.equal(shapes.size, 0)
      assert.equal(stub.state.shapeCalls.length, 1)
      assert.equal(stub.state.calls.length, 0, 'no shape calls, attachments or scene registration after failure')
      assert.ok(warnings.includes(`[${node.name}] failed to create shape`))
      if (node instanceof Prim) {
        assert.equal(node.actor, null)
        assert.equal(node._tm, null)
        assert.ok(!node.actorHandle)
      }
      stub.assertClean()
      node.unmount()
      node.unmount()
      stub.assertClean()

      stub.state.shapeResult = 'success'
      await node.mount()
      assert.ok(node.shape?.ptr)
      assert.equal(shapes.size, 1)
      assert.equal(stub.state.shapeCalls.length, 2)
      assert.ok(stub.state.calls.includes('setQueryFilterData'))
      if (node instanceof Prim) {
        assert.equal(stub.registered.size, 1)
        assert.ok(stub.state.calls.includes('attachShape'))
      } else {
        assert.ok(stub.state.calls.includes('setLocalPose'))
        assert.ok(stub.state.calls.includes('addShape'))
      }
      node.unmount()
      node.unmount()
      assert.equal(shapes.size, 0)
      stub.assertClean()
    })
  }
}

for (const mode of ['null', 'zero', 'throw']) {
  test(`Prim preserves its fallback box after a ${mode} cook, and recooks on second mount`, async () => {
    const { node } = prim('cylinder')
    stub.state.cookResult = mode
    await node.mount()
    assert.ok(node.shape?.ptr)
    assert.equal(stub.state.shapeCalls[0].geometry, 'PxBoxGeometry')
    assert.equal(stub.registered.size, 1)
    node.unmount()
    stub.assertClean()
    stub.state.cookResult = 'success'
    await node.mount()
    assert.equal(stub.state.cooks.length, 2)
    assert.equal(stub.state.shapeCalls[1].geometry, 'PxConvexMeshGeometry')
    node.unmount()
    stub.assertClean()
  })
}

test('Prim also cleans up its actor and fallback geometry when the fallback shape fails', async () => {
  const { node } = prim('cylinder')
  stub.state.cookResult = 'zero'
  stub.state.shapeResult = 'zero'
  await node.mount()
  assert.equal(node.shape, null)
  assert.equal(node.actor, null)
  assert.equal(node._tm, null)
  assert.equal(stub.state.shapeCalls[0].geometry, 'PxBoxGeometry')
  node.unmount()
  stub.assertClean()
})

test('Collider cooking failure allocates no shape and can be explicitly mounted again after unmount', () => {
  const { node } = collider('convex')
  stub.state.cookResult = 'zero'
  node.mount()
  assert.equal(stub.state.shapeCalls.length, 0)
  node.unmount()
  stub.assertClean()
  stub.state.cookResult = 'success'
  node.mount()
  assert.equal(stub.state.cooks.length, 2)
  node.unmount()
  stub.assertClean()
})

test('Collider shape failure releases only its own handle to a cached mesh', () => {
  const { node, geometry } = collider('convex')
  const other = geometryToPxMesh(stub.world, geometry, true)
  const mesh = other.value
  stub.state.shapeResult = 'zero'
  node.mount()
  node.unmount()
  assert.equal(stub.state.cooks.length, 1)
  assert.equal(mesh.disposals, 0)
  other.release()
  assert.equal(mesh.disposals, 1)
  stub.assertClean()
})

test('Prim shape failure preserves a mesh held by another mounted Prim', async () => {
  const { node: first } = prim('cylinder')
  const { node: second } = prim('cylinder')
  await first.mount()
  const mesh = first.pmesh.value
  stub.state.shapeResult = 'zero'
  await second.mount()
  second.unmount()
  assert.equal(stub.state.cooks.length, 1)
  assert.equal(mesh.disposals, 0)
  assert.equal(stub.registered.size, 1)
  first.unmount()
  assert.equal(mesh.disposals, 1)
  stub.assertClean()
})
