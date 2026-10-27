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

// A small native collision shell, independent of decorative mesh detail.
const collisionTag = `office-${OBJECT_NAME}:${app.instanceId}`
const collisionShapes = []
function collisionBox(size, position, name, parent = app, rotation = [0, 0, 0]) {
  const shape = app.create('prim', {
    id: `${OBJECT_NAME}:collision:${name}`, type: 'box', size, position, rotation,
    opacity: 0, physics: OBJECT_NAME === 'chair' ? 'kinematic' : 'static',
    // Native controller queries require the solid layer's reciprocal player
    // mask; the prop layer in this runtime deliberately excludes players.
    layer: 'environment', tag: collisionTag, castShadow: false, receiveShadow: false,
    staticFriction: 0.7, dynamicFriction: 0.5,
  })
  parent.add(shape)
  collisionShapes.push(shape)
}
let floorDestroyed = false
let watchingPlacement = false
let chairIsOccupied = () => false
let chairWasMoved = () => {}
if (!world.isPreview) {
  app.on('transform', changed => {
    if (!changed.scale) return
    // Native actor movement updates its pose, not its PhysX shape dimensions.
    // Rebuild the small collision shell once when the builder changes scale.
    for (const shape of collisionShapes) {
      const physics = shape.physics
      if (!physics) continue
      shape.physics = null
      shape.physics = physics
    }
  })
  const floorMask = world.createLayerMask('environment')
  const down = new Vector3(0, -1, 0)
  // Search through sloping roof faces, but support furniture on a level floor.
  function floorUnder(position, above = 0.5, distance = 20) {
    const origin = position.clone()
    origin.y += above
    for (let i = 0; i < 8 && distance > 0; i++) {
      const hit = world.raycast(origin, down, distance, floorMask)
      if (!hit) return null
      const furniture = typeof hit.tag === 'string' && hit.tag.startsWith('office-')
      if (!furniture && hit.normal.y > 0.95) return hit.point.clone()
      const travelled = hit.distance + 0.01
      origin.y -= travelled
      distance -= travelled
    }
    return null
  }
  function groundFurniture() {
    if (floorDestroyed || app.isMoving || chairIsOccupied()) return
    // The solid chair base can contain the downward ray's origin. Remove this
    // small shell synchronously for this one placement query, then restore it.
    // This happens after placement, never during an idle frame or a ride.
    const active = collisionShapes.map(shape => shape.active)
    collisionShapes.forEach(shape => { shape.active = false })
    let floor
    try {
      floor = floorUnder(app.position)
    } finally {
      collisionShapes.forEach((shape, i) => { shape.active = active[i] })
    }
    if (!floor) return
    const position = app.position.clone()
    position.y = floor.y + 0.002
    // Furniture rests upright; retain the yaw selected with the builder.
    const forward = new Vector3(0, 0, -1).applyQuaternion(app.quaternion)
    const yaw = Math.atan2(-forward.x, -forward.z)
    const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw)
    if (position.distanceTo(app.position) < 0.0001 &&
        1 - Math.abs(quaternion.dot(app.quaternion)) < 0.00001) return
    app.setTransform(position, quaternion)
  }
  function placementFinished() {
    if (app.isMoving) return
    app.off('update', placementFinished)
    watchingPlacement = false
    // Native collider reactivation/transform commit precedes the floor query.
    setTimeout(groundFurniture, 0)
  }
  if (world.isServer) {
    app.on('transform', () => {
      if (app.isMoving) {
        chairWasMoved()
        if (!watchingPlacement) {
          watchingPlacement = true
          app.on('update', placementFinished)
        }
      } else if (!chairIsOccupied()) {
        setTimeout(groundFurniture, 0)
      }
    })
    setTimeout(groundFurniture, 0)
    // Also cover an app initially loaded during a builder move.
    if (app.isMoving) {
      watchingPlacement = true
      app.on('update', placementFinished)
    }
  }
  app.on('destroy', () => {
    floorDestroyed = true
    app.off('update', placementFinished)
  })
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

// Three slabs preserve the concave U. A convex extrusion would close the bay.
collisionBox([4.20, 0.074, 0.75], [0, 0.742, 0.825], 'rear-desktop')
for (const side of [-1, 1]) {
  collisionBox([0.75, 0.074, 1.60], [side * 1.725, 0.742, -0.35], `return-${side}`)
  collisionBox([0.64, 0.69, 0.90], [side * 1.735, 0.345, -0.55], `pedestal-${side}`)
  collisionBox([0.085, 0.70, 0.085], [side * 1.56, 0.35, 1.01], `rear-leg-${side}`)
}
collisionBox([3.38, 0.32, 0.038], [0, 0.43, 1.055], 'modesty-panel')
