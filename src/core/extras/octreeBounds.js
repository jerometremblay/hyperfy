// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/octreeBounds.js
export const MAX_OCTREE_SIZE = 1e8

// Both octrees expand twice: (c + s, 2s), then (c - s, 4s).
// Preflight the actual arithmetic, including the children created by each expansion.
export function getOctreeExpansions(root, position, radius = 0, loose = false) {
  if (![position.x, position.y, position.z, radius].every(Number.isFinite)) return -1
  let { x, y, z } = root.center
  let size = root.size
  if (!validBounds(x, y, z, size, loose)) return -1
  let expansions = 0
  while (
    radius > size ||
    position.x < x - size ||
    position.x > x + size ||
    position.y < y - size ||
    position.y > y + size ||
    position.z < z - size ||
    position.z > z + size
  ) {
    x += size
    y += size
    z += size
    size *= 2
    if (!validExpansion(x, y, z, size, loose)) return -1
    x -= size
    y -= size
    z -= size
    size *= 2
    if (!validExpansion(x, y, z, size, loose)) return -1
    expansions++
  }
  return expansions
}

function validBounds(x, y, z, size, loose) {
  if (!Number.isFinite(size) || size <= 0 || size > MAX_OCTREE_SIZE) return false
  for (const center of [x, y, z]) {
    if (!Number.isFinite(center) || !Number.isFinite(center - size) || !Number.isFinite(center + size)) return false
    if (loose && (!Number.isFinite(center - size * 2) || !Number.isFinite(center + size * 2))) return false
  }
  return true
}

function validExpansion(x, y, z, size, loose) {
  if (!validBounds(x, y, z, size, loose)) return false
  const halfSize = size / 2
  for (let dx = -1; dx <= 1; dx += 2) {
    for (let dy = -1; dy <= 1; dy += 2) {
      for (let dz = -1; dz <= 1; dz += 2) {
        if (!validBounds(x + halfSize * dx, y + halfSize * dy, z + halfSize * dz, halfSize, loose)) return false
      }
    }
  }
  return true
}
