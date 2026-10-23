import * as THREE from './three'

// Split a convex polygon into the positive and negative sides of a plane.
function split(polygon, plane) {
  const inside = []
  const outside = []
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    const da = plane.distanceToPoint(a)
    const db = plane.distanceToPoint(b)
    if (da >= 0) inside.push(a)
    if (da <= 0) outside.push(a)
    if (da * db < 0) {
      const point = a.clone().lerp(b, da / (da - db))
      inside.push(point)
      outside.push(point)
    }
  }
  return { inside, outside }
}

/** Subtract the aperture's rectangular passage from collision triangles only. */
export function cutPortalCollision(geometry, matrix, apertures) {
  const position = geometry.getAttribute('position')
  const index = geometry.getIndex()
  let polygons = []
  for (let i = 0; i < (index?.count || position.count); i += 3) {
    polygons.push(
      [0, 1, 2].map(j =>
        new THREE.Vector3().fromBufferAttribute(position, index ? index.getX(i + j) : i + j).applyMatrix4(matrix)
      )
    )
  }
  let changed = false
  for (const { portal, side = 1, depth = 2.5 } of apertures) {
    // Join the two collision spaces at the portal plane. A clearance gap
    // removes nearby stair treads and the landing that must support crossing.
    const planes = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), portal.width / 2),
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), portal.width / 2),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), portal.height / 2),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), portal.height / 2),
      new THREE.Plane(new THREE.Vector3(0, 0, -side), 0.001),
      new THREE.Plane(new THREE.Vector3(0, 0, side), depth),
    ].map(plane => plane.applyMatrix4(portal.matrixWorld))
    const result = []
    for (const polygon of polygons) {
      // A separating plane means there is no intersection: preserve the face.
      if (planes.some(plane => polygon.every(point => plane.distanceToPoint(point) < 0))) {
        result.push(polygon)
        continue
      }
      let remaining = polygon
      const pieces = []
      for (const plane of planes) {
        if (remaining.length < 3) break
        const { inside, outside } = split(remaining, plane)
        if (outside.length >= 3) pieces.push(outside)
        remaining = inside
      }
      if (remaining.length >= 3) changed = true
      result.push(...pieces)
    }
    polygons = result
  }
  if (!changed) return null
  const vertices = []
  for (const polygon of polygons) {
    for (let i = 1; i < polygon.length - 1; i++) {
      const [a, b, c] = [polygon[0], polygon[i], polygon[i + 1]]
      if (new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).lengthSq() < 1e-16) continue
      vertices.push(...a.toArray(), ...b.toArray(), ...c.toArray())
    }
  }
  return new THREE.BufferGeometry()
    .setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    .setIndex(Array.from({ length: vertices.length / 3 }, (_, i) => i))
}

/** Keep only the other room's geometry that occupies the crossed body volume. */
export function clipPortalCollision(geometry, matrix, portal, side = 1, margin = 0) {
  const planes = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), portal.width / 2 + margin),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), portal.width / 2 + margin),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), portal.height / 2 + margin),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), portal.height / 2 + margin),
    new THREE.Plane(new THREE.Vector3(0, 0, -side), -0.001),
    new THREE.Plane(new THREE.Vector3(0, 0, side), 2.5),
  ].map(plane => plane.applyMatrix4(portal.matrixWorld))
  if (!geometry.boundingBox) geometry.computeBoundingBox()
  const bounds = geometry.boundingBox.clone().applyMatrix4(matrix)
  if (
    planes.some(plane => {
      const point = new THREE.Vector3(
        plane.normal.x >= 0 ? bounds.max.x : bounds.min.x,
        plane.normal.y >= 0 ? bounds.max.y : bounds.min.y,
        plane.normal.z >= 0 ? bounds.max.z : bounds.min.z
      )
      return plane.distanceToPoint(point) < 0
    })
  )
    return null
  const position = geometry.getAttribute('position')
  const index = geometry.getIndex()
  const vertices = []
  for (let i = 0; i < (index?.count || position.count); i += 3) {
    let polygon = [0, 1, 2].map(j =>
      new THREE.Vector3().fromBufferAttribute(position, index ? index.getX(i + j) : i + j).applyMatrix4(matrix)
    )
    for (const plane of planes) {
      if (polygon.length < 3) break
      polygon = split(polygon, plane).inside
    }
    for (let j = 1; j < polygon.length - 1; j++) {
      const [a, b, c] = [polygon[0], polygon[j], polygon[j + 1]]
      if (new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).lengthSq() < 1e-16) continue
      vertices.push(...a.toArray(), ...b.toArray(), ...c.toArray())
    }
  }
  if (!vertices.length) return null
  return new THREE.BufferGeometry()
    .setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    .setIndex(Array.from({ length: vertices.length / 3 }, (_, i) => i))
}
