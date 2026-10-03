// Orientation-safe helpers for Hyperfy primitive apps.
// Coordinate convention: +Y up, +X right, -Z forward.

function midpoint(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
}

function distance3(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
}

// Align local +Y to the segment a -> b.
// Keep diagonal structural boxes long on local Y: [thickness, length, thickness].
function yAxisRotationBetween(a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const dz = b[2] - a[2]
  const horizontal = Math.hypot(dx, dz)
  if (horizontal === 0) return [dy >= 0 ? 0 : Math.PI, 0, 0]
  const rx = Math.atan2(horizontal, dy)
  const ry = Math.atan2(dx, dz)
  return [rx, ry, 0]
}

function beamBetween(a, b, thickness, color, extra = {}) {
  const length = distance3(a, b)
  if (length <= 1e-9) throw new Error('beamBetween requires two distinct endpoints')
  return box(
    [thickness, length, thickness],
    midpoint(a, b),
    color,
    yAxisRotationBetween(a, b),
    extra,
  )
}

function cylinderBetween(a, b, radius, color, extra = {}) {
  const length = distance3(a, b)
  if (length <= 1e-9) throw new Error('cylinderBetween requires two distinct endpoints')
  return cylinder(
    radius,
    radius,
    length,
    midpoint(a, b),
    color,
    yAxisRotationBetween(a, b),
    extra,
  )
}

function rotateLocalYEndpoint(position, rotation, offsetY) {
  // This mirrors the viewer's X -> Y -> Z point rotation order.
  let x = 0
  let y = offsetY
  let z = 0
  const [rx, ry, rz] = rotation

  let c = Math.cos(rx), s = Math.sin(rx)
  ;[y, z] = [y * c - z * s, y * s + z * c]

  c = Math.cos(ry); s = Math.sin(ry)
  ;[x, z] = [x * c + z * s, -x * s + z * c]

  c = Math.cos(rz); s = Math.sin(rz)
  ;[x, y] = [x * c - y * s, x * s + y * c]

  return [x + position[0], y + position[1], z + position[2]]
}

function assertSegmentAlignment(a, b, epsilon = 1e-6) {
  const length = distance3(a, b)
  const position = midpoint(a, b)
  const rotation = yAxisRotationBetween(a, b)
  const p0 = rotateLocalYEndpoint(position, rotation, -length / 2)
  const p1 = rotateLocalYEndpoint(position, rotation,  length / 2)

  const forwardError = distance3(p0, a) + distance3(p1, b)
  const reverseError = distance3(p0, b) + distance3(p1, a)
  const error = Math.min(forwardError, reverseError)
  if (error > epsilon * 2) {
    throw new Error(`segment alignment failed: ${error}`)
  }
  return true
}
