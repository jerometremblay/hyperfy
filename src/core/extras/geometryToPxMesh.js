import { handlePhysicsFailure } from './physicsFailure.js'
import { isFiniteF32, warnOnce } from './physxConvert.js'

const cache = new Map() // id -> { id, pmesh, refs }

class PMeshHandle {
  constructor(item) {
    this.value = item.pmesh
    this.item = item
    this.item.refs++
    this.released = false
  }

  release() {
    if (this.released) return
    this.item.refs--
    if (this.item.refs === 0) {
      if (this.item.pmesh.ptr !== 0) this.item.pmesh.release()
      cache.delete(this.item.id)
    }
    this.released = true
    this.value = null
  }
}

export function geometryToPxMesh(world, geometry, convex, entity) {
  const id = `${geometry.uuid}_${convex ? 'convex' : 'triangles'}`

  let item = cache.get(id)
  if (item) {
    return new PMeshHandle(item)
  }

  // Decode the original attribute so normalized and interleaved positions stay intact.
  const position = geometry.attributes.position
  const positions = new Float32Array(position.count * 3)
  for (let i = 0; i < position.count; i++) {
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
  }

  let indices
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
    desc.points.count = position.count
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

  item = { id, pmesh, refs: 0 }
  cache.set(id, item)
  return new PMeshHandle(item)
}
