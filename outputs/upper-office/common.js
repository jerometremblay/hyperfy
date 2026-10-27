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
