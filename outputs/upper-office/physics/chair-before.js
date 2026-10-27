const OBJECT_NAME = 'chair'
// Coordinates: +Y up, +X right, -Z forward. Metres.
// Root Y=0 is the furniture's contact plane. Native app-owned geometry.
app.configure([
  { type: 'section', label: 'Lighting and shadows' },
  { type: 'toggle', key: 'castShadows', label: 'Cast shadows', initial: true },
  { type: 'toggle', key: 'receiveShadows', label: 'Receive shadows', initial: true },
])
app.resetOnMove = false
let serial = 0
const C = {
  walnut: '#573621', walnutDark: '#382317', grain: '#624029',
  leather: '#35241e', leatherDark: '#231915', stitch: '#976c49',
  brass: '#b18b4b', rubber: '#171715', black: '#222320',
}
function prim(type, data, name, parent = app) {
  const node = app.create('prim', {
    id: `${OBJECT_NAME}:${name}:${serial++}`, type,
    color: C.walnut, roughness: 0.42, metalness: 0, physics: null,
    ...data,
    castShadow: props.castShadows !== false && data.castShadow !== false,
    receiveShadow: props.receiveShadows !== false && data.receiveShadow !== false,
  })
  parent.add(node)
  return node
}
function box(size, position, color, name, extra = {}, parent = app) {
  return prim('box', { size, position, color, ...extra }, name, parent)
}
function roundedRect(width, height, radius, segments = 5) {
  const points = []
  for (const [x, y, start] of [
    [width / 2 - radius, -height / 2 + radius, -Math.PI / 2],
    [width / 2 - radius, height / 2 - radius, 0],
    [-width / 2 + radius, height / 2 - radius, Math.PI / 2],
    [-width / 2 + radius, -height / 2 + radius, Math.PI],
  ]) {
    for (let i = 0; i <= segments; i++) {
      const angle = start + i / segments * Math.PI / 2
      points.push([x + radius * Math.cos(angle), y + radius * Math.sin(angle)])
    }
  }
  return points
}
function extrude(profile, depth, position, color, name, extra = {}, parent = app) {
  return prim('extrude', {
    profile, depth, position, color,
    bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.006,
    bevelSegments: 3, curveSegments: 5, smooth: true,
    ...extra,
  }, name, parent)
}
function horizontalPanel(profileXZ, y, depth, color, name, extra = {}) {
  const xs = profileXZ.map(p => p[0]), zs = profileXZ.map(p => p[1])
  return extrude(profileXZ.map(([x, z]) => [x, -z]), depth,
    [(Math.min(...xs) + Math.max(...xs)) / 2, y, (Math.min(...zs) + Math.max(...zs)) / 2],
    color, name, { rotation: [-Math.PI / 2, 0, 0], ...extra })
}
function yAxisRotationBetween(a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]
  const h = Math.hypot(dx, dz)
  return h === 0 ? [dy >= 0 ? 0 : Math.PI, 0, 0]
    : [Math.atan2(h, dy), Math.atan2(dx, dz), 0]
}
function cylinderBetween(a, b, radius, color, name, extra = {}, parent = app) {
  return prim('cylinder', {
    size: [radius, radius, Math.hypot(...a.map((v, i) => b[i] - v))],
    position: a.map((v, i) => (v + b[i]) / 2),
    rotation: yAxisRotationBetween(a, b), color, ...extra,
  }, name, parent)
}

// Executive work chair. Front faces local -Z; five twin-wheel casters touch Y=0.
const wheelAnchors = []
for (let i = 0; i < 5; i++) {
  const angle = i * Math.PI * 2 / 5 + Math.PI
  const x = Math.sin(angle) * 0.375, z = Math.cos(angle) * 0.375
  const tangent = [Math.cos(angle), 0, -Math.sin(angle)]
  wheelAnchors.push([x, 0.060, z])
  cylinderBetween([0, 0.215, 0], [x, 0.145, z], 0.028,
    C.brass, 'five-spoke-base', { metalness: 0.82, roughness: 0.22 })
  cylinderBetween([x, 0.099, z], [x, 0.156, z], 0.014,
    C.brass, 'caster-stem', { metalness: 0.78 })
  for (const side of [-1, 1]) {
    const center = [x + side * tangent[0] * 0.035, 0.060, z + side * tangent[2] * 0.035]
    const a = center.map((v, j) => v - tangent[j] * 0.012)
    const b = center.map((v, j) => v + tangent[j] * 0.012)
    cylinderBetween(a, b, 0.060, C.rubber, 'caster-wheel', { roughness: 0.83 })
    const rim = center.map((v, j) => v + side * tangent[j] * 0.0125)
    cylinderBetween(rim.map((v, j) => v - tangent[j] * 0.0008),
      rim.map((v, j) => v + tangent[j] * 0.0008),
      0.025, C.brass, 'caster-hub', { metalness: 0.80, roughness: 0.23 })
  }
}
cylinderBetween([0, 0.14, 0], [0, 0.26, 0], 0.063, C.black, 'lift-housing')
cylinderBetween([0, 0.22, 0], [0, 0.435, 0], 0.022, C.brass, 'gas-lift',
  { metalness: 0.88, roughness: 0.18 })
box([0.43, 0.055, 0.36], [0, 0.443, 0], C.black, 'tilt-mechanism')
cylinderBetween([0.10, 0.44, 0.015], [0.34, 0.425, 0.015],
  0.010, C.brass, 'adjustment-lever', { metalness: 0.75 })
box([0.075, 0.025, 0.045], [0.34, 0.425, 0.015], C.black, 'lever-grip')

// Beveled upholstery and a dark walnut seat shell.
horizontalPanel(roundedRect(0.585, 0.54, 0.065), 0.472, 0.028,
  C.walnutDark, 'seat-shell', { bevelSize: 0.013, bevelThickness: 0.005 })
horizontalPanel(roundedRect(0.60, 0.57, 0.075), 0.508, 0.067,
  C.leather, 'padded-seat', { bevelSize: 0.025, bevelThickness: 0.013, roughness: 0.53 })
for (const z of [-0.218, 0.218]) {
  cylinderBetween([-0.215, 0.555, z], [0.215, 0.555, z],
    0.0011, C.stitch, 'seat-stitching')
}

const backGroup = app.create('group', { id: 'chair-back', position: [0, 0.53, 0.205], rotation: [0.10, 0, 0] })
app.add(backGroup)
const backProfile = [
  [-0.25, 0], [-0.31, 0.15], [-0.30, 0.57], [-0.25, 0.74], [-0.18, 0.80],
  [0.18, 0.80], [0.25, 0.74], [0.30, 0.57], [0.31, 0.15], [0.25, 0],
]
extrude(backProfile, 0.038, [0, 0.40, 0.064], C.walnutDark, 'walnut-back-shell',
  { bevelSize: 0.024, bevelThickness: 0.008, roughness: 0.33 }, backGroup)
extrude(backProfile, 0.105, [0, 0.40, 0], C.leather, 'high-padded-back',
  { bevelSize: 0.018, bevelThickness: 0.015, roughness: 0.55 }, backGroup)
extrude(roundedRect(0.43, 0.145, 0.035), 0.040, [0, 0.18, -0.077],
  C.leatherDark, 'lumbar-cushion',
  { bevelSize: 0.017, bevelThickness: 0.012, roughness: 0.57 }, backGroup)
extrude(roundedRect(0.405, 0.16, 0.035), 0.035, [0, 0.695, -0.086],
  C.leatherDark, 'headrest',
  { bevelSize: 0.018, bevelThickness: 0.011, roughness: 0.55 }, backGroup)

// Diamond quilting on the front face, following the backrest's shared frame.
for (const y of [0.325, 0.485]) for (const x of [-0.15, 0, 0.15]) {
  const points = [[x, y - 0.072, -0.070], [x + 0.072, y, -0.070],
    [x, y + 0.072, -0.070], [x - 0.072, y, -0.070]]
  for (let j = 0; j < 4; j++) {
    cylinderBetween(points[j], points[(j + 1) % 4], 0.0009,
      C.stitch, 'diamond-stitching', { castShadow: false }, backGroup)
  }
  prim('sphere', { size: [0.006], position: [x, y, -0.074],
    scale: [1, 1, 0.4], color: C.leatherDark }, 'tuft-button', backGroup)
}
box([0.11, 0.027, 0.004], [0, 0.62, 0.094], C.brass, 'back-emblem',
  { metalness: 0.78, roughness: 0.24 }, backGroup)

for (const side of [-1, 1]) {
  const x = side * 0.323
  cylinderBetween([side * 0.21, 0.473, 0.11], [x, 0.715, 0.10],
    0.021, C.brass, 'arm-support', { metalness: 0.78, roughness: 0.23 })
  cylinderBetween([x, 0.715, 0.10], [x, 0.715, -0.18],
    0.018, C.brass, 'arm-rail', { metalness: 0.78, roughness: 0.23 })
  const pad = roundedRect(0.092, 0.40, 0.032).map(([px, pz]) => [px + x, pz - 0.04])
  horizontalPanel(pad, 0.743, 0.042, C.leatherDark, 'padded-armrest',
    { bevelSize: 0.009, bevelThickness: 0.008, roughness: 0.55 })
}
