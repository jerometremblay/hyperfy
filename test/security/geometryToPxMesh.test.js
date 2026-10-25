// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/geometryToPxMesh.test.js
import { after, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { BufferAttribute, BufferGeometry, InterleavedBuffer, InterleavedBufferAttribute } from 'three'
import { geometryToPxMesh } from '../../src/core/extras/geometryToPxMesh.js'
import { makePhysX } from './lib/physxCookingStub.mjs'

const previousPhysX = Object.getOwnPropertyDescriptor(globalThis, 'PHYSX')
const originalWarn = console.warn
const originalError = console.error
const warnings = []
console.warn = value => warnings.push(value)
console.error = () => {}
let stub

beforeEach(() => {
  stub = makePhysX()
  globalThis.PHYSX = stub.physx
})
after(() => {
  console.warn = originalWarn
  console.error = originalError
  if (previousPhysX) Object.defineProperty(globalThis, 'PHYSX', previousPhysX)
  else delete globalThis.PHYSX
})

const coordinates = [1, 0, 0, 0, 1, 0, 0, 0, 1, -1, -0.5, 0]
const integerCoordinates = [32767, 0, 0, 0, 32767, 0, 0, 0, 32767, -32768, -16384, 0]
const triangleIndices = [0, 1, 2, 0, 3, 1, 1, 3, 2, 2, 3, 0]

function fixture(kind = 'float32', IndexType = Uint16Array) {
  const geometry = new BufferGeometry()
  let attribute
  let expected = coordinates
  if (kind === 'float32') {
    attribute = new BufferAttribute(new Float32Array(coordinates), 3)
  } else if (kind === 'float32-padding') {
    const values = coordinates.flatMap((value, i) => (i % 3 === 2 ? [value, 999] : [value]))
    attribute = new BufferAttribute(new Float32Array(values), 4)
  } else if (kind === 'int16') {
    attribute = new BufferAttribute(new Int16Array(integerCoordinates), 3, true)
  } else {
    const values = []
    for (let i = 0; i < integerCoordinates.length; i += 3) {
      values.push(123, ...integerCoordinates.slice(i, i + 3), 456)
    }
    const data = new InterleavedBuffer(new Int16Array(values), 5)
    attribute = new InterleavedBufferAttribute(data, 3, 1, true)
  }
  if (kind === 'int16' || kind === 'interleaved') {
    expected = [1, 0, 0, 0, 1, 0, 0, 0, 1, -1, Math.fround(-16384 / 32767), 0]
  }
  geometry.setAttribute('position', attribute)
  geometry.setIndex(new BufferAttribute(new IndexType(triangleIndices), 1))
  return { geometry, expected, attribute }
}

function cook(geometry, convex) {
  return geometryToPxMesh(stub.world, geometry, convex)
}

for (const kind of ['float32', 'float32-padding', 'int16', 'interleaved']) {
  for (const IndexType of [null, Uint8Array, Uint16Array, Uint32Array]) {
    const convex = IndexType === null
    test(`packs ${kind} into ${convex ? 'convex' : IndexType.name + ' triangles'} without overwriting buffers`, () => {
      const { geometry, expected, attribute } = fixture(kind, IndexType || Uint16Array)
      const handle = cook(geometry, convex)
      assert.ok(handle?.value.ptr)
      assert.equal(geometry.attributes.position, attribute)
      const snapshot = stub.state.cooks[0]
      assert.equal(snapshot.params, stub.world.physics.cookingParams)
      assert.equal(snapshot.kind, convex ? 'convex' : 'triangle')
      assert.deepEqual(snapshot.positions, expected)
      assert.deepEqual(snapshot.points, { count: 4, stride: 12, data: stub.state.allocations[0].ptr })
      const indexBytes = IndexType === Uint32Array ? 48 : 24
      assert.deepEqual(
        stub.state.allocations.map(entry => entry.size),
        convex ? [48] : [48, indexBytes]
      )
      assert.deepEqual(
        stub.state.writes.map(entry => entry.size),
        convex ? [48] : [48, indexBytes]
      )
      assert.equal(snapshot.flags, convex ? 1 : IndexType === Uint32Array ? 0 : 2)
      if (!convex) {
        assert.deepEqual(snapshot.triangles, {
          count: 4,
          stride: IndexType === Uint32Array ? 12 : 6,
          data: stub.state.allocations[1].ptr,
        })
        assert.deepEqual(snapshot.indices, triangleIndices)
        assert.equal(stub.state.writes[1].name, IndexType === Uint32Array ? 'HEAPU32' : 'HEAPU16')
      }
      handle.release()
      handle.release()
      stub.assertClean()
    })
  }
}

for (const convex of [true, false]) {
  for (const bad of [NaN, Infinity, -Infinity, 1e39]) {
    test(`${convex ? 'convex' : 'triangle'} rejects ${bad} vertices before native allocation`, () => {
      const { geometry } = fixture()
      geometry.setAttribute('position', new BufferAttribute(new Float64Array([bad, 0, 0]), 3))
      assert.equal(cook(geometry, convex), null)
      assert.equal(stub.state.allocations.length, 0)
      assert.equal(stub.state.resources.length, 0)
      assert.equal(stub.state.cooks.length, 0)
      assert.ok(warnings.includes('[physics] mesh has non-finite vertices'))
    })
  }

  for (const mode of ['throw', 'zero', 'null', 'undefined']) {
    test(`${convex ? 'convex' : 'triangle'} ${mode} cook frees all temporaries and permits same-UUID retry`, () => {
      const { geometry } = fixture()
      stub.state.cookResult = mode
      assert.equal(cook(geometry, convex), null)
      assert.equal(stub.state.cooks.length, 1)
      assert.equal(stub.state.resources.filter(entry => entry.kind.endsWith('Desc')).length, 1)
      stub.assertClean()
      stub.state.cookResult = 'success'
      const handle = cook(geometry, convex)
      assert.ok(handle?.value.ptr)
      assert.equal(stub.state.cooks.length, 2)
      handle.release()
      stub.assertClean()
    })
  }

  for (const failAllocation of convex ? [1] : [1, 2]) {
    test(`${convex ? 'convex' : 'triangle'} allocation ${failAllocation} returning zero frees only acquired resources`, () => {
      const { geometry } = fixture()
      stub.state.failAllocation = failAllocation
      assert.equal(cook(geometry, convex), null)
      assert.equal(stub.state.allocations.length, failAllocation)
      assert.equal(stub.state.writes.length, failAllocation - 1)
      assert.equal(stub.state.cooks.length, 0)
      stub.assertClean()
      stub.state.failAllocation = null
      const handle = cook(geometry, convex)
      assert.ok(handle?.value.ptr)
      assert.equal(stub.state.cooks.length, 1)
      handle.release()
      stub.assertClean()
    })
  }

  for (const throwAt of convex
    ? ['malloc:1', 'upload:1', 'descriptor', 'flags']
    : ['malloc:1', 'malloc:2', 'upload:1', 'upload:2', 'descriptor', 'flags']) {
    test(`${convex ? 'convex' : 'triangle'} ${throwAt} exception cleans up and is not cached`, () => {
      const { geometry } = fixture()
      stub.state.throwAt = throwAt
      assert.equal(cook(geometry, convex), null)
      assert.equal(stub.state.cooks.length, 0)
      stub.assertClean()
      stub.state.throwAt = null
      const handle = cook(geometry, convex)
      assert.ok(handle?.value.ptr)
      handle.release()
      stub.assertClean()
    })
  }

  test(`${convex ? 'convex' : 'triangle'} cache shares ownership and releases once after its last handle`, () => {
    const { geometry } = fixture()
    const first = cook(geometry, convex)
    const second = cook(geometry, convex)
    const mesh = first.value
    assert.equal(second.value, mesh)
    assert.equal(stub.state.cooks.length, 1)
    first.release()
    first.release()
    assert.equal(first.value, null)
    assert.equal(mesh.disposals, 0)
    second.release()
    second.release()
    assert.equal(mesh.disposals, 1)
    const third = cook(geometry, convex)
    assert.notEqual(third.value, mesh)
    assert.equal(stub.state.cooks.length, 2)
    third.release()
    stub.assertClean()
  })

  test(`${convex ? 'convex' : 'triangle'} handle never releases an already zero-pointer wrapper`, () => {
    const { geometry } = fixture()
    const handle = cook(geometry, convex)
    handle.value.release()
    handle.release()
    handle.release()
    const retry = cook(geometry, convex)
    assert.equal(stub.state.cooks.length, 2)
    retry.release()
    stub.assertClean()
  })
}

for (const IndexType of [null, Uint8Array, Uint16Array, Uint32Array]) {
  test(`uses current heap views after malloc and constructors for ${IndexType?.name || 'convex'}`, () => {
    stub = makePhysX({ growOnMalloc: true, growOnConstruct: true })
    globalThis.PHYSX = stub.physx
    const { geometry, expected } = fixture('interleaved', IndexType || Uint16Array)
    const handle = cook(geometry, IndexType === null)
    assert.ok(handle?.value.ptr)
    assert.deepEqual(stub.state.cooks[0].positions, expected)
    if (IndexType) assert.deepEqual(stub.state.cooks[0].indices, triangleIndices)
    handle.release()
    stub.assertClean()
  })
}

for (const IndexType of [Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, Uint8ClampedArray, Array]) {
  test(`rejects unsupported ${IndexType.name} indices before allocation`, () => {
    const { geometry } = fixture()
    geometry.index = { array: IndexType.from(triangleIndices), itemSize: 1 }
    assert.equal(cook(geometry, false), null)
    assert.equal(stub.state.allocations.length, 0)
    stub.assertClean()
  })
}

for (const representation of ['missing', 'normalized', 'interleaved', 'itemSize']) {
  test(`rejects ${representation} triangle indices before allocation`, () => {
    const { geometry } = fixture()
    if (representation === 'missing') geometry.index = null
    if (representation === 'normalized') geometry.index.normalized = true
    if (representation === 'itemSize') geometry.index.itemSize = 3
    if (representation === 'interleaved') {
      geometry.index = new InterleavedBufferAttribute(new InterleavedBuffer(new Uint16Array([0, 1, 2]), 1), 1, 0)
    }
    assert.equal(cook(geometry, false), null)
    assert.equal(stub.state.allocations.length, 0)
    stub.assertClean()
  })
}

test('convex and triangle caches for one UUID are independent', () => {
  const { geometry } = fixture()
  const convex = cook(geometry, true)
  const triangle = cook(geometry, false)
  assert.notEqual(convex.value, triangle.value)
  assert.equal(stub.state.cooks.length, 2)
  convex.release()
  assert.equal(triangle.value.disposals, 0)
  triangle.release()
  stub.assertClean()
})

test('Uint32 indices retain values beyond the Uint16 range', () => {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(65537 * 3), 3))
  geometry.setIndex(new BufferAttribute(new Uint32Array([0, 1, 65536]), 1))
  stub = makePhysX({ growOnMalloc: true, heapBytes: 1024 * 1024 })
  globalThis.PHYSX = stub.physx
  const handle = cook(geometry, false)
  assert.ok(handle?.value.ptr)
  assert.deepEqual(stub.state.cooks[0].indices, [0, 1, 65536])
  assert.equal(stub.state.cooks[0].triangles.stride, 12)
  assert.equal(stub.state.cooks[0].flags, 0)
  handle.release()
  stub.assertClean()
})

for (const convex of [true, false]) {
  test(`${convex ? 'convex' : 'triangle'} empty buffers allocate and free nothing`, () => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(), 3))
    geometry.setIndex(new BufferAttribute(new Uint16Array(), 1))
    stub.state.cookResult = 'zero'
    assert.equal(cook(geometry, convex), null)
    assert.equal(stub.state.allocations.length, 0)
    assert.equal(stub.state.writes.length, 0)
    assert.equal(stub.state.cooks[0].points.data, 0)
    assert.equal(stub.state.resources.length, 1)
    stub.assertClean()
  })
}

test('reads original XYZ accessors once per vertex without mutating the attribute', () => {
  const { geometry } = fixture('interleaved')
  const position = geometry.attributes.position
  const reads = []
  for (const name of ['getX', 'getY', 'getZ']) {
    const original = position[name]
    position[name] = function (i) {
      reads.push(`${name}:${i}`)
      return original.call(this, i)
    }
  }
  const handle = cook(geometry, true)
  assert.equal(new Set(reads).size, 12)
  assert.equal(reads.length, 12)
  assert.equal(position.normalized, true)
  assert.equal(position.offset, 1)
  handle.release()
  stub.assertClean()
})
