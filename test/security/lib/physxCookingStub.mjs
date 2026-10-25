// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/lib/physxCookingStub.mjs
import assert from 'node:assert/strict'

export function makePhysX(options = {}) {
  const state = {
    cookResult: 'success',
    shapeResult: 'success',
    ...options,
    allocations: [],
    writes: [],
    frees: [],
    resources: [],
    cooks: [],
    shapeCalls: [],
    calls: [],
  }
  let buffer = new ArrayBuffer(options.heapBytes || 65536)
  let nextBufferPtr = 64
  let nextNativePtr = 1000000

  function grow() {
    const next = new ArrayBuffer(buffer.byteLength * 2)
    new Uint8Array(next).set(new Uint8Array(buffer))
    structuredClone(buffer, { transfer: [buffer] })
    buffer = next
    installViews()
  }

  function installViews() {
    for (const [name, Type] of [
      ['HEAPF32', Float32Array],
      ['HEAPU16', Uint16Array],
      ['HEAPU32', Uint32Array],
    ]) {
      const view = new Type(buffer)
      view.set = (source, offset) => {
        assert.equal(view.buffer, buffer, 'upload used a stale heap view')
        const ptr = offset * Type.BYTES_PER_ELEMENT
        const allocation = state.allocations.find(entry => entry.ptr === ptr && ptr !== 0)
        assert.ok(allocation, 'upload must target an acquired buffer')
        assert.equal(source.byteLength, allocation.size, 'allocated bytes must equal written bytes')
        state.writes.push({ name, ptr, size: source.byteLength, values: [...source] })
        if (state.throwAt === `upload:${state.writes.length}`) throw new Error('injected upload failure')
        Type.prototype.set.call(view, source, offset)
      }
      physx[name] = view
    }
  }

  function live(value) {
    assert.ok(value && value.ptr !== 0, 'native call on a zero pointer')
    assert.equal(value.disposed, false, 'native call on a disposed resource')
  }

  class Resource {
    constructor(kind, args = []) {
      this.kind = kind
      this.args = args
      this.ptr = nextNativePtr++
      this.disposed = false
      this.disposals = 0
      state.resources.push(this)
      if (state.growOnConstruct) grow()
    }
    release() {
      live(this)
      this.disposed = true
      this.disposals++
      this.disposalMethod = 'release'
      this.ptr = 0
    }
    raise(flag) {
      live(this)
      this.bits = (this.bits || 0) | flag
    }
    setQueryFilterData(data) {
      live(this)
      live(data)
      state.calls.push('setQueryFilterData')
    }
    setSimulationFilterData(data) {
      live(this)
      live(data)
      state.calls.push('setSimulationFilterData')
    }
    setLocalPose(pose) {
      live(this)
      live(pose)
      state.calls.push('setLocalPose')
    }
    attachShape(shape) {
      live(this)
      live(shape)
      state.calls.push('attachShape')
    }
    setRigidBodyFlag() {
      live(this)
    }
    setLinearDamping() {
      live(this)
    }
    setAngularDamping() {
      live(this)
    }
  }

  function descriptor(kind) {
    if (state.throwAt === 'descriptor') throw new Error('injected descriptor failure')
    const desc = new Resource(kind)
    desc.points = {}
    desc.triangles = {}
    desc.flags = {
      bits: 0,
      raise(flag) {
        live(desc)
        if (state.throwAt === 'flags') throw new Error('injected descriptor setup failure')
        this.bits |= flag
      },
    }
    return desc
  }

  function cook(kind, params, desc) {
    live(desc)
    const points = desc.points
    const triangles = desc.triangles
    const indexType = triangles.stride === 6 ? Uint16Array : Uint32Array
    state.cooks.push({
      kind,
      params,
      points: { ...points },
      triangles: { ...triangles },
      flags: desc.flags.bits,
      positions: [...new Float32Array(buffer, points.data, points.count * 3)],
      indices: kind === 'triangle' ? [...new indexType(buffer, triangles.data, triangles.count * 3)] : null,
    })
    return result(state.cookResult, `${kind}Mesh`)
  }

  function result(mode, kind) {
    if (mode === 'throw') throw new Error(`injected ${kind} failure`)
    if (mode === 'null') return null
    if (mode === 'undefined') return undefined
    if (mode === 'zero') {
      return {
        ptr: 0,
        release: () => assert.fail('released a zero-pointer wrapper'),
        setQueryFilterData: () => assert.fail('used a zero-pointer shape'),
        setSimulationFilterData: () => assert.fail('used a zero-pointer shape'),
        setLocalPose: () => assert.fail('used a zero-pointer shape'),
      }
    }
    return new Resource(kind)
  }

  const physx = {
    _webidl_malloc(size) {
      assert.ok(size > 0)
      const attempt = state.allocations.length + 1
      if (state.throwAt === `malloc:${attempt}`) throw new Error('injected allocation failure')
      if (state.failAllocation === attempt) {
        state.allocations.push({ ptr: 0, size })
        return 0
      }
      const ptr = nextBufferPtr
      nextBufferPtr += Math.ceil(size / 8) * 8
      state.allocations.push({ ptr, size })
      if (state.growOnMalloc) grow()
      return ptr
    },
    _webidl_free(ptr) {
      assert.ok(ptr !== 0 && state.allocations.some(entry => entry.ptr === ptr), 'free of unowned buffer')
      assert.ok(!state.frees.includes(ptr), 'buffer freed twice')
      state.frees.push(ptr)
    },
    destroy(value) {
      live(value)
      value.disposed = true
      value.disposals++
      value.disposalMethod = 'destroy'
      value.ptr = 0
    },
    PxConvexMeshDesc: class {
      constructor() {
        return descriptor('convexDesc')
      }
    },
    PxTriangleMeshDesc: class {
      constructor() {
        return descriptor('triangleDesc')
      }
    },
    CreateConvexMesh: (params, desc) => cook('convex', params, desc),
    CreateTriangleMesh: (params, desc) => cook('triangle', params, desc),
    PxConvexFlagEnum: { eCOMPUTE_CONVEX: 1 },
    PxTriangleMeshFlagEnum: { e16_BIT_INDICES: 2 },
    PxShapeFlagEnum: { eTRIGGER_SHAPE: 1, eSCENE_QUERY_SHAPE: 2, eSIMULATION_SHAPE: 4 },
    PxPairFlagEnum: { eNOTIFY_TOUCH_FOUND: 1, eNOTIFY_TOUCH_LOST: 2, eNOTIFY_CONTACT_POINTS: 4 },
    PxIDENTITYEnum: { PxIdentity: 0 },
    PxRigidBodyFlagEnum: { eKINEMATIC: 1 },
    PxRigidBodyExt: { prototype: { setMassAndUpdateInertia: actor => live(actor) } },
    PxTransform: class extends Resource {
      constructor() {
        super('transform')
        this.p = { x: 0, y: 0, z: 0 }
        this.q = { x: 0, y: 0, z: 0, w: 1 }
      }
    },
  }
  for (const name of [
    'PxVec3',
    'PxQuat',
    'PxMeshScale',
    'PxBoxGeometry',
    'PxSphereGeometry',
    'PxConvexMeshGeometry',
    'PxTriangleMeshGeometry',
    'PxShapeFlags',
    'PxFilterData',
  ]) {
    physx[name] = class extends Resource {
      constructor(...args) {
        super(name, args)
      }
    }
  }
  installViews()

  const material = { ptr: 2000000, release: () => assert.fail('released cached material') }
  const registered = new Set()
  const world = {
    stage: { octree: { insert() {}, remove() {} } },
    physics: {
      cookingParams: {},
      getMaterial: () => material,
      physics: {
        createRigidStatic: () => new Resource('actor'),
        createRigidDynamic: () => new Resource('actor'),
        createShape(geometry, actualMaterial, exclusive, flags) {
          live(geometry)
          live(flags)
          assert.equal(actualMaterial, material)
          assert.equal(exclusive, true)
          state.shapeCalls.push({ geometry: geometry.kind, flags: flags.bits })
          state.onCreateShape?.()
          return result(state.shapeResult, 'shape')
        },
      },
      addActor(actor) {
        live(actor)
        registered.add(actor)
        state.calls.push('addActor')
        return {
          destroy() {
            live(actor)
            assert.equal(registered.delete(actor), true, 'actor unregistered twice')
          },
        }
      },
    },
  }
  return {
    physx,
    world,
    state,
    registered,
    assertClean() {
      assert.deepEqual(
        [...state.frees].sort(),
        state.allocations
          .filter(entry => entry.ptr)
          .map(entry => entry.ptr)
          .sort()
      )
      for (const resource of state.resources) {
        assert.equal(resource.disposals, 1, `leaked ${resource.kind}`)
        const method = ['convexMesh', 'triangleMesh', 'actor', 'shape'].includes(resource.kind) ? 'release' : 'destroy'
        assert.equal(resource.disposalMethod, method, `wrong disposal for ${resource.kind}`)
      }
      assert.equal(registered.size, 0)
    },
  }
}
