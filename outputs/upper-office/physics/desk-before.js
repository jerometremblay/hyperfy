const OBJECT_NAME = 'desk'
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

// One continuous U-shaped desktop; the open working bay faces local -Z.
// Overall width 4.2 m, depth 2.35 m, working surface 0.779 m.
const desktop = [
  [-2.10, -1.15], [-1.35, -1.15], [-1.35, 0.45], [1.35, 0.45],
  [1.35, -1.15], [2.10, -1.15], [2.10, 1.20], [-2.10, 1.20],
]
horizontalPanel(desktop, 0.700, 0.018, C.brass, 'brass-desktop-edge',
  { bevelSize: 0.014, bevelThickness: 0.002, metalness: 0.72, roughness: 0.27 })
horizontalPanel(desktop, 0.744, 0.058, C.walnut, 'continuous-u-desktop',
  { bevelSize: 0.018, bevelThickness: 0.006, roughness: 0.30 })

// Two storage pedestals carry the long returns. Drawers face the working bay.
for (const side of [-1, 1]) {
  const x = side * 1.735
  box([0.64, 0.06, 0.90], [x, 0.03, -0.55], C.black, 'pedestal-plinth')
  box([0.64, 0.63, 0.90], [x, 0.375, -0.55], C.walnutDark, 'storage-pedestal')
  box([0.646, 0.012, 0.904], [x, 0.062, -0.55], C.brass, 'plinth-trim',
    { metalness: 0.72, roughness: 0.3 })
  for (const [y, height] of [[0.18, 0.185], [0.39, 0.185], [0.59, 0.175]]) {
    box([0.024, height, 0.815], [side * 1.404, y, -0.55], C.walnut, 'drawer-front')
    box([0.025, 0.013, 0.22], [side * 1.379, y + 0.035, -0.55], C.brass, 'drawer-pull',
      { metalness: 0.78, roughness: 0.23 })
  }
  box([0.54, 0.51, 0.018], [x, 0.38, -1.009], C.walnut, 'pedestal-front-panel')
  cylinderBetween([side * 1.56, 0.035, 1.01], [side * 1.56, 0.698, 1.01],
    0.028, C.brass, 'rear-leg', { metalness: 0.76, roughness: 0.26 })
  cylinderBetween([side * 1.56, 0, 1.01], [side * 1.56, 0.025, 1.01],
    0.066, C.black, 'rear-foot', { roughness: 0.8 })
}
box([3.38, 0.32, 0.038], [0, 0.43, 1.055], C.walnutDark, 'rear-modesty-panel')
box([3.40, 0.012, 0.045], [0, 0.265, 1.055], C.brass, 'modesty-trim',
  { metalness: 0.65 })
box([2.60, 0.032, 0.15], [0, 0.655, 0.985], C.black, 'under-desk-cable-tray')

// Fine grain accents keep the walnut surface quiet rather than plank-like.
for (const z of [0.58, 0.70, 0.83, 0.97, 1.10]) {
  box([4.11, 0.0008, 0.004], [0, 0.7793, z], C.grain, 'walnut-grain',
    { castShadow: false, roughness: 0.4 })
}
for (const x of [-1.96, -1.72, -1.49, 1.49, 1.72, 1.96]) {
  box([0.003, 0.0008, 1.49], [x, 0.7793, -0.35], C.grain, 'return-grain',
    { castShadow: false, roughness: 0.4 })
}

// A leather writing pad and flush cable grommets are part of the desk object.
const pad = roundedRect(1.30, 0.44, 0.045).map(([x, z]) => [x, z + 0.755])
horizontalPanel(pad, 0.783, 0.004, C.leatherDark, 'leather-writing-pad',
  { bevelSize: 0.003, bevelThickness: 0.001, roughness: 0.72 })
for (const x of [-1.11, 1.11]) {
  cylinderBetween([x, 0.778, 1.055], [x, 0.784, 1.055],
    0.038, C.brass, 'cable-grommet', { metalness: 0.75, roughness: 0.25 })
  cylinderBetween([x, 0.784, 1.055], [x, 0.785, 1.055],
    0.026, C.black, 'grommet-center')
}
