import { handlePhysicsFailure } from './physicsFailure.js'
import { isFiniteF32, warnOnce } from './physxConvert.js'

const cache = new Map() // id -> { id, pmesh, refs, maxAbs, size, holders }

// Cooked meshes live in the wasm heap, which only grows and aborts at 2 GB (3.92M triangles cooked to ~700 MB).
// A mesh's size is its vertices plus triangles (a convex
// mesh's input points count as vertices); each mesh, each holder (an app) and the process have a budget, so one app
// cannot take the whole heap and leave later apps' floors without colliders.
export const MESH_LIMITS = {
  vertices: 200_000,
  triangles: 200_000,
  convexPoints: 50_000,
  holder: 400_000,
  process: 2_000_000,
}
let processSize = 0
const holderSizes = new Map() // holder -> size of the distinct cached meshes it holds

class PMeshHandle {
  constructor(item, holder) {
    this.value = item.pmesh
    // largest |vertex coordinate| per axis, for the physics extent check (physicsValidate.extentOk)
    this.maxAbs = item.maxAbs
    this.item = item
    this.holder = holder
    this.item.refs++
    this.item.holders.set(holder, (this.item.holders.get(holder) ?? 0) + 1)
    if (this.item.holders.get(holder) === 1) holderSizes.set(holder, (holderSizes.get(holder) ?? 0) + item.size)
    this.released = false
  }

  release() {
    if (this.released) return
    const count = this.item.holders.get(this.holder) - 1
    if (count === 0) {
      this.item.holders.delete(this.holder)
      const left = holderSizes.get(this.holder) - this.item.size
      if (left > 0) holderSizes.set(this.holder, left)
      else holderSizes.delete(this.holder)
    } else {
      this.item.holders.set(this.holder, count)
    }
    this.item.refs--
    if (this.item.refs === 0) {
      if (this.item.pmesh.ptr !== 0) this.item.pmesh.release()
      cache.delete(this.item.id)
      processSize -= this.item.size
    }
    this.released = true
    this.value = null
  }
}

// whether `holder` may take a mesh of `size` that it does not hold yet (and, for a new cook, the process too)
function withinBudget(holder, size, newCook) {
  if ((holderSizes.get(holder) ?? 0) + size > MESH_LIMITS.holder) return false
  if (newCook && processSize + size > MESH_LIMITS.process) return false
  return true
}

export function geometryToPxMesh(world, geometry, convex, entity) {
  if (!geometry) {
    warnOnce('[physics] mesh has no geometry')
    return null
  }
  const id = `${geometry.uuid}_${convex ? 'convex' : 'triangles'}`
  const holder = entity ?? world

  let item = cache.get(id)
  if (item) {
    if (!item.holders.has(holder) && !withinBudget(holder, item.size, false)) {
      warnOnce('[physics] mesh skipped: this app holds its whole mesh budget')
      return null
    }
    return new PMeshHandle(item, holder)
  }

  // Decode the original attribute so normalized and interleaved positions stay intact.
  const position = geometry?.attributes?.position
  if (!position) {
    warnOnce('[physics] mesh has no positions')
    return null
  }
  // every count is checked before anything is allocated for it
  const count = position.count
  if (!Number.isInteger(count) || count < 0) {
    warnOnce('[physics] mesh has an invalid vertex count')
    return null
  }
  if (count > (convex ? MESH_LIMITS.convexPoints : MESH_LIMITS.vertices)) {
    warnOnce('[physics] mesh skipped: too many vertices')
    return null
  }
  // the index representation is validated first, and its array's own length is the one count used for the limits,
  // the budget and the cook (index.count can disagree with it)
  let indices
  let triangleCount = 0
  if (!convex) {
    const index = geometry.index
    indices = index?.array
    if (
      !index ||
      index.itemSize !== 1 ||
      index.normalized ||
      index.isInterleavedBufferAttribute ||
      !(indices instanceof Uint8Array || indices instanceof Uint16Array || indices instanceof Uint32Array)
    ) {
      warnOnce('[physics] mesh has unsupported indices')
      return null
    }
    const length = indices.length
    if (length % 3 !== 0) {
      warnOnce('[physics] mesh has an index count that is not whole triangles')
      return null
    }
    triangleCount = length / 3
    if (triangleCount > MESH_LIMITS.triangles) {
      warnOnce('[physics] mesh skipped: too many triangles')
      return null
    }
  }
  const size = count + triangleCount
  if (!withinBudget(holder, size, true)) {
    warnOnce('[physics] mesh skipped: the mesh budget is spent')
    return null
  }
  const positions = new Float32Array(count * 3)
  // scanned here rather than read from geometry.boundingBox, which a model file sets from its own accessor min/max
  const maxAbs = [0, 0, 0]
  for (let i = 0; i < count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    if (!isFiniteF32(x) || !isFiniteF32(y) || !isFiniteF32(z)) {
      warnOnce('[physics] mesh has non-finite vertices')
      return null
    }
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    maxAbs[0] = Math.max(maxAbs[0], Math.abs(x))
    maxAbs[1] = Math.max(maxAbs[1], Math.abs(y))
    maxAbs[2] = Math.max(maxAbs[2], Math.abs(z))
  }

  if (!convex) {
    // every index must name a vertex
    for (let i = 0; i < indices.length; i++) {
      if (indices[i] >= count) {
        warnOnce('[physics] mesh has an index past its vertices')
        return null
      }
    }
    // Some GLBs use Uint8 indices; PhysX requires at least 16 bits.
    if (indices instanceof Uint8Array) indices = new Uint16Array(indices)
  }

  let pointsPtr = 0
  let indexPtr = 0
  let desc
  let pmesh
  try {
    if (positions.byteLength) {
      pointsPtr = PHYSX._webidl_malloc(positions.byteLength)
      if (pointsPtr === 0) return null
      PHYSX.HEAPF32.set(positions, pointsPtr >> 2)
    }

    desc = convex ? new PHYSX.PxConvexMeshDesc() : new PHYSX.PxTriangleMeshDesc()
    desc.points.count = count
    desc.points.stride = 12
    desc.points.data = pointsPtr

    if (convex) {
      desc.flags.raise(PHYSX.PxConvexFlagEnum.eCOMPUTE_CONVEX)
      pmesh = PHYSX.CreateConvexMesh(world.physics.cookingParams, desc)
    } else {
      if (indices.byteLength) {
        indexPtr = PHYSX._webidl_malloc(indices.byteLength)
        if (indexPtr === 0) return null
        if (indices instanceof Uint16Array) {
          PHYSX.HEAPU16.set(indices, indexPtr >> 1)
        } else {
          PHYSX.HEAPU32.set(indices, indexPtr >> 2)
        }
      }
      if (indices instanceof Uint16Array) {
        desc.triangles.stride = 6
        desc.flags.raise(PHYSX.PxTriangleMeshFlagEnum.e16_BIT_INDICES)
      } else {
        desc.triangles.stride = 12
      }
      desc.triangles.count = indices.length / 3
      desc.triangles.data = indexPtr
      pmesh = PHYSX.CreateTriangleMesh(world.physics.cookingParams, desc)
    }
  } catch (err) {
    handlePhysicsFailure(err, { entity, world, phase: 'geometryToPxMesh' })
    console.error('geometryToPxMesh failed...')
    console.error(err)
    return null
  } finally {
    if (indexPtr) PHYSX._webidl_free(indexPtr)
    if (pointsPtr) PHYSX._webidl_free(pointsPtr)
    if (desc) PHYSX.destroy(desc)
  }

  if (!pmesh || pmesh.ptr === 0) return null

  item = { id, pmesh, refs: 0, maxAbs, size, holders: new Map() }
  cache.set(id, item)
  processSize += size
  return new PMeshHandle(item, holder)
}
