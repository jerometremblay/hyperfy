// LARCH HOUSE — a primitive-only Hyperfy mountain lodge.
// Coordinates: +Y up, +X right, -Z forward. Metres. Root Y=0 is ground contact.
// Main floor 0.12, mezzanine 3.30, eaves 6.00, ridge 9.80.
// User-approved roof priority: retain the 9.8 m ridge; pitch is 22.9 degrees.
// Visual architecture plus a compact transform-safe structural collision shell.

// Expose shadow controls on all visible construction geometry.
// Keep physically invisible colliders and intentionally unshadowed details excluded.
app.configure([
  { type: 'section', label: 'Lighting and shadows' },
  { type: 'toggle', key: 'castShadows', label: 'Cast shadows', initial: true, hint: 'Allow this object to cast shadows from nearby light sources' },
  { type: 'toggle', key: 'receiveShadows', label: 'Receive shadows', initial: true, hint: 'Show shadows from other objects on this object' },
])
const SHADOW_CASTING = props.castShadows !== false
const SHADOW_RECEIVING = props.receiveShadows !== false

const D = { halfWidth: 9, halfDepth: 7.5, floor: 0.12, upper: 3.3, eave: 6, ridge: 9.8 }
const C = {
  logs: ['#805b3d', '#896344', '#936c4a', '#876042', '#9b7450'],
  end: '#b08a5d', timber: '#513b2b', trim: '#664932',
  floor: ['#a68154', '#ac885d', '#b08c61', '#9e7950'],
  stone: ['#82796b', '#908675', '#9e9380', '#7b7468', '#a99e8a', '#8c8170'],
  mortar: '#655f55', hearth: '#8e8777', roof: '#333a39', iron: '#333531',
  soffit: '#93734e', glass: '#b6d3d5', inside: '#373731',
}
// Structural physics uses a small set of invisible box anchors plus detached
// world colliders. One shared update hook keeps them aligned if the app is moved,
// rotated, or scaled in the builder; decorative primitives remain visual-only.
app.resetOnMove = false
const physicsEntries = []
function rebuildPhysics(node) {
  const mode = node.physics
  if (!mode) return
  node.physics = null
  node.physics = mode
}
function exactWorldTransform(node) {
  const position = node.position.clone().multiply(app.scale).applyQuaternion(app.quaternion).add(app.position)
  const quaternion = app.quaternion.clone().multiply(node.quaternion)
  const scale = node.scale.clone().multiply(app.scale)
  return { position, quaternion, scale }
}
function collisionBox(size, position, rotation = [0, 0, 0], name = 'structure', extra = {}) {
  const anchor = app.create('prim', {
    id: `physics-anchor:${name}:${physicsEntries.length}`,
    type: 'box', size, position, rotation,
    opacity: 0, castShadow: false, receiveShadow: false, physics: null,
  })
  app.add(anchor)
  const initial = exactWorldTransform(anchor)
  const collider = app.create('prim', {
    id: `physics:${name}:${physicsEntries.length}`,
    type: 'box', size,
    position: initial.position.toArray(), quaternion: initial.quaternion.toArray(), scale: initial.scale.toArray(),
    opacity: 0, castShadow: false, receiveShadow: false,
    physics: extra.physics || 'static',
    staticFriction: extra.staticFriction === undefined ? 0.8 : extra.staticFriction,
    dynamicFriction: extra.dynamicFriction === undefined ? 0.65 : extra.dynamicFriction,
    restitution: extra.restitution === undefined ? 0 : extra.restitution,
  })
  world.add(collider)
  physicsEntries.push({ anchor, collider, lastScale: initial.scale.clone() })
  return collider
}
function wallCollisionWithOpenings(axis, fixed, low, high, bottom, top, openings, depth = 0.34, name = 'wall') {
  const cuts = [bottom, top]
  for (const o of openings) cuts.push(Math.max(bottom, o.bottom), Math.min(top, o.top))
  const ys = [...new Set(cuts.filter(y => y >= bottom && y <= top).map(y => Number(y.toFixed(6))))].sort((a, b) => a - b)
  for (let yi = 0; yi < ys.length - 1; yi++) {
    const y0 = ys[yi], y1 = ys[yi + 1]
    if (y1 - y0 < 0.01) continue
    const midY = (y0 + y1) / 2
    const active = openings.filter(o => midY > o.bottom && midY < o.top)
      .map(o => [o.u - o.width / 2, o.u + o.width / 2]).sort((a, b) => a[0] - b[0])
    let cursor = low
    for (const [a0, b0] of active) {
      const a = Math.max(low, a0), b = Math.min(high, b0)
      if (a > cursor + 0.01) {
        const w = a - cursor, u = (cursor + a) / 2
        collisionBox(axis === 'x' ? [w, y1 - y0, depth] : [depth, y1 - y0, w], wallPoint(axis, fixed, u, midY), [0, 0, 0], name)
      }
      cursor = Math.max(cursor, b)
    }
    if (cursor < high - 0.01) {
      const w = high - cursor, u = (cursor + high) / 2
      collisionBox(axis === 'x' ? [w, y1 - y0, depth] : [depth, y1 - y0, w], wallPoint(axis, fixed, u, midY), [0, 0, 0], name)
    }
  }
}
let lastPhysicsPosition = app.position.clone()
let lastPhysicsQuaternion = app.quaternion.clone()
let lastPhysicsScale = app.scale.clone()
function syncStructuralPhysics(force = false) {
  const scaleChanged = !lastPhysicsScale.equals(app.scale)
  if (!force && !scaleChanged && lastPhysicsPosition.equals(app.position) && lastPhysicsQuaternion.equals(app.quaternion)) return
  for (const entry of physicsEntries) {
    const t = exactWorldTransform(entry.anchor)
    entry.collider.position.copy(t.position)
    entry.collider.quaternion.copy(t.quaternion)
    entry.collider.scale.copy(t.scale)
    if (!entry.lastScale.equals(t.scale)) {
      entry.lastScale.copy(t.scale)
      rebuildPhysics(entry.collider)
    }
  }
  lastPhysicsPosition.copy(app.position)
  lastPhysicsQuaternion.copy(app.quaternion)
  lastPhysicsScale.copy(app.scale)
}
app.on('update', syncStructuralPhysics)
app.on('destroy', () => {
  for (const entry of physicsEntries) world.remove(entry.collider)
})

const lightingPosts = []
let section = 'floor'
let serial = 0
function prim(type, data, name = type) {
  const node = app.create('prim', {
    id: `${section}:${name}:${serial++}`, type, color: C.timber,
    roughness: 0.82, metalness: 0, physics: null,
    ...data,
    castShadow: SHADOW_CASTING && data.castShadow !== false && (data.opacity ?? 1) > 0,
    receiveShadow: SHADOW_RECEIVING && data.receiveShadow !== false && (data.opacity ?? 1) > 0,
  })
  app.add(node)
  if (name === 'wall-post') lightingPosts.push({ position: data.position, size: data.size, name })
  return node
}
function box(size, position, color, rotation = [0, 0, 0], extra = {}, name = 'box') {
  return prim('box', { size, position, color, rotation, ...extra }, name)
}
const midpoint = (a, b) => a.map((v, i) => (v + b[i]) / 2)
const distance3 = (a, b) => Math.hypot(...a.map((v, i) => b[i] - v))
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
// Canonical skill helper: align local +Y with endpoints, in Hyperfy's YXZ order.
function yAxisRotationBetween(a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]
  const h = Math.hypot(dx, dz)
  return h === 0 ? [dy >= 0 ? 0 : Math.PI, 0, 0] : [Math.atan2(h, dy), Math.atan2(dx, dz), 0]
}
function beamBetween(a, b, thickness, color = C.timber, name = 'beam') {
  return box([thickness, distance3(a, b), thickness], midpoint(a, b), color,
    yAxisRotationBetween(a, b), {}, name)
}
function cylinderBetween(a, b, radius, color, name = 'log') {
  return prim('cylinder', {
    size: [radius, radius, distance3(a, b)], position: midpoint(a, b),
    rotation: yAxisRotationBetween(a, b), color,
  }, name)
}
// Profiles are in world XY for convenience. Explicitly restore their bounds centre
// because Hyperfy centres extrude geometry; thickness is always local Z.
function extrude(profile, depth, z, color, bevel = 0, name = 'profile', extra = {}) {
  const xs = profile.map(p => p[0]), ys = profile.map(p => p[1])
  return prim('extrude', {
    profile, depth,
    position: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, z],
    bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel,
    bevelSegments: 1, curveSegments: 1, color, ...extra,
  }, name)
}
const roofY = x => D.ridge - Math.abs(x) * (D.ridge - D.eave) / D.halfWidth
const wallPoint = (axis, fixed, u, y) => axis === 'x' ? [u, y, fixed] : [fixed, y, u]
function wallBox(axis, fixed, u, y, w, h, depth, color, name = 'frame') {
  return box(axis === 'x' ? [w, h, depth] : [depth, h, w], wallPoint(axis, fixed, u, y), color, [0, 0, 0], {}, name)
}
function horizontalLog(axis, fixed, a, b, y, radius, color, name = 'course') {
  if (b - a < 0.045) return
  cylinderBetween(wallPoint(axis, fixed, a, y), wallPoint(axis, fixed, b, y), radius, color, name)
}
function wallLogsWithOpening(axis, fixed, low, high, bottom, top, openings, options = {}) {
  const radius = options.radius || 0.16, pitch = options.pitch || 0.29
  let course = 0
  for (let y = bottom + radius + (options.phase || 0); y + radius <= top + 0.08; y += pitch, course++) {
    const project = options.corners ? (course % 2 ? 0.31 : 0.46) : 0
    let segments = [[low - project, high + project]]
    for (const opening of openings) {
      if (y + radius <= opening.bottom || y - radius >= opening.top) continue
      const left = opening.u - opening.width / 2, right = opening.u + opening.width / 2
      segments = segments.flatMap(([a, b]) => right <= a || left >= b ? [[a, b]] :
        [[a, Math.min(left, b)], [Math.max(right, a), b]].filter(([x, z]) => z - x > 0.045))
    }
    for (const [a, b] of segments) horizontalLog(axis, fixed, a, b, y, radius, C.logs[(course + (options.tone || 0)) % C.logs.length])
    if (options.corners) {
      // Thin end-grain discs share each log's axis, at its projecting end.
      for (const [a, b] of segments) for (const u of [a, b]) {
        if (u > low + 0.1 && u < high - 0.1) continue
        cylinderBetween(wallPoint(axis, fixed, u - 0.008, y), wallPoint(axis, fixed, u + 0.008, y), radius * 0.94, C.end, 'end-grain')
      }
    }
  }
}
function logCourseOpeningBounds(o, options = {}) {
  const radius = options.radius || 0.16, pitch = options.pitch || 0.29
  const wallBottom = options.wallBottom ?? 0.12, wallTop = options.wallTop ?? 6
  let bottom = Infinity, top = -Infinity
  for (let y = wallBottom + radius + (options.phase || 0); y + radius <= wallTop + 0.08; y += pitch) {
    if (y + radius <= o.bottom || y - radius >= o.top) continue
    bottom = Math.min(bottom, y - radius)
    top = Math.max(top, y + radius)
  }
  return Number.isFinite(bottom) ? { ...o, bottom, top } : o
}
function windowFrame(axis, fixed, o, options = {}) {
  // Whole log courses are removed when they touch an opening, so the true rough
  // opening is slightly taller and can shift up/down with the wall's course phase.
  // Size the window to that actual opening instead of the nominal cut request.
  const fitted = logCourseOpeningBounds(o, options)
  const { u, width: w, bottom: b, top: t } = fitted, h = t - b
  const jambWidth = 0.22, glassWidth = w - 0.10
  const glassBottom = b + 0.10, glassTop = t - 0.14
  const glassHeight = glassTop - glassBottom, glassY = (glassBottom + glassTop) / 2
  wallBox(axis, fixed, u - w / 2, (b + t) / 2, jambWidth, h + 0.18, 0.36, C.trim, 'window-jamb')
  wallBox(axis, fixed, u + w / 2, (b + t) / 2, jambWidth, h + 0.18, 0.36, C.trim, 'window-jamb')
  wallBox(axis, fixed, u, t, w + 0.46, 0.30, 0.39, C.timber, 'window-header')
  wallBox(axis, fixed, u, b, w + 0.42, 0.22, 0.44, C.trim, 'window-sill')
  const glassSize = axis === 'x' ? [glassWidth, glassHeight, 0.035] : [0.035, glassHeight, glassWidth]
  box(glassSize, wallPoint(axis, fixed, u, glassY), C.glass, [0, 0, 0],
    { opacity: 0.18, transparent: true, roughness: 0.12, castShadow: false }, 'glass')
  wallBox(axis, fixed, u, glassY, 0.075, glassHeight, 0.085, C.trim, 'mullion')
  if (w > 2.4) wallBox(axis, fixed, u, b + h * 0.7, glassWidth, 0.075, 0.067, C.trim, 'transom')
}
function doorFrame(axis, fixed, u, bottom, width, height) {
  for (const side of [-1, 1]) wallBox(axis, fixed, u + side * width / 2, bottom + height / 2,
    0.19, height + 0.12, 0.34, C.timber, 'door-jamb')
  wallBox(axis, fixed, u, bottom + height, width + 0.42, 0.25, 0.38, C.timber, 'door-lintel')
  wallBox(axis, fixed, u, bottom + 0.025, width + 0.18, 0.05, 0.44, C.trim, 'threshold')
}
function floorDeck(x0, x1, z0, z1, y, prefix) {
  box([x1 - x0, 0.21, z1 - z0], [(x0 + x1) / 2, y - 0.155, (z0 + z1) / 2], C.trim, [0, 0, 0], {}, prefix + '-deck')
  const n = Math.ceil((x1 - x0) / 0.36), width = (x1 - x0) / n
  for (let i = 0; i < n; i++) box([width - 0.005, 0.05, z1 - z0],
    [x0 + (i + 0.5) * width, y - 0.023, (z0 + z1) / 2], C.floor[i % 4], [0, 0, 0], {}, prefix + '-board')
}
const guardPostPositions = new Set()
function railing(a, b, name = 'guard') {
  const length = distance3(a, b), bays = Math.ceil(length / 1.65)
  beamBetween(a.map((v, i) => v + (i === 1 ? 1.06 : 0)), b.map((v, i) => v + (i === 1 ? 1.06 : 0)), 0.15, C.timber, name + '-top')
  beamBetween(a.map((v, i) => v + (i === 1 ? 0.17 : 0)), b.map((v, i) => v + (i === 1 ? 0.17 : 0)), 0.10, C.trim, name + '-bottom')
  for (let i = 0; i <= bays; i++) {
    const p = lerp(a, b, i / bays)
    const key = p.map(v => v.toFixed(4)).join(':')
    if (!guardPostPositions.has(key)) {
      guardPostPositions.add(key)
      beamBetween([p[0], p[1] - 0.01, p[2]], [p[0], p[1] + 1.14, p[2]], 0.16, C.timber, name + '-post')
    }
  }
  const bars = Math.ceil(length / 0.155)
  for (let i = 1; i < bars; i++) {
    const p = lerp(a, b, i / bars)
    beamBetween([p[0], p[1] + 0.20, p[2]], [p[0], p[1] + 1.00, p[2]], 0.065, C.trim, name + '-baluster')
  }
}

// 1. Ground contact slab and wide timber floorboards.
box([18, 0.077, 15], [0, 0.0385, 0], C.trim, [0, 0, 0], {}, 'contact-slab')
for (let i = 0; i < 60; i++) box([0.295, 0.04, 15], [-8.85 + i * 0.3, 0.10, 0], C.floor[i % 4], [0, 0, 0], {}, 'floorboard')
// Low perimeter sill closes the half-course corner staggering at floor level.
box([17.70, 0.27, 0.30], [0, 0.255, 7.5], C.trim)
for (const x of [-6.725, 6.725]) box([4.25, 0.27, 0.30], [x, 0.255, -7.5], C.trim)
for (const x of [-9, 9]) box([0.30, 0.27, 15.32], [x, 0.255, 0], C.trim)

// 2–3. Logs terminate at actual door/window apertures.
section = 'logs'
const frontOpenings = [
  { u: 0, width: 9.2, bottom: 0.12, top: 6.15 },
  { u: -6.85, width: 1.85, bottom: 0.91, top: 2.67 },
  { u: 6.85, width: 1.85, bottom: 0.91, top: 2.67 },
]
const rearOpenings = [
  { u: -5.85, width: 2.8, bottom: 0.94, top: 2.65 },
  { u: 0, width: 2.5, bottom: 0.94, top: 2.65 },
  { u: 5.85, width: 2.8, bottom: 0.94, top: 2.65 },
  ...[-5.95, 0, 5.95].map(u => ({ u, width: 2.25, bottom: 4.23, top: 5.66 })),
]
const leftOpenings = [
  { u: -5.05, width: 2.75, bottom: 0.92, top: 2.67 },
  { u: 4.95, width: 2.85, bottom: 0.92, top: 2.67 },
  { u: -4.6, width: 3.2, bottom: 3.86, top: 5.48 },
  { u: 5.8, width: 1.75, bottom: 4.26, top: 5.64 },
]
const rightOpenings = [
  ...[-4.95, -0.55, 4.8].map((u, i) => ({ u, width: i === 2 ? 2.8 : 3.0, bottom: 0.92, top: 2.67 })),
  { u: -3.1, width: 3.5, bottom: 3.86, top: 5.48 },
  { u: 5.8, width: 1.75, bottom: 4.26, top: 5.64 },
]
wallLogsWithOpening('x', -7.5, -9, 9, 0.12, 6, frontOpenings, { corners: true })
wallLogsWithOpening('x', 7.5, -9, 9, 0.12, 6, rearOpenings, { corners: true, tone: 1 })
wallLogsWithOpening('z', -9, -7.5, 7.5, 0.12, 6, leftOpenings, { corners: true, phase: 0.145, tone: 2 })
wallLogsWithOpening('z', 9, -7.5, 7.5, 0.12, 6, rightOpenings, { corners: true, phase: 0.145, tone: 3 })

// 4. Primary timber frame and load paths below the rear mezzanine.
section = 'timber'
for (const x of [-8.65, 8.65]) for (const z of [-7.14, -4.25, -1.15, 3.0, 7.12]) {
  box([0.35, 5.78, 0.35], [x, 3.01, z], C.timber, [0, 0, 0], {}, 'wall-post')
}
for (const x of [-8.65, -4.75, 4.75, 8.65]) {
  box([0.38, 2.94, 0.38], [x, 1.59, 1.62], C.timber, [0, 0, 0], {}, 'mezzanine-post')
  for (const direction of [-1, 1]) {
    if (Math.abs(x + direction * 0.8) < 8.8) beamBetween([x, 2.16, 1.62], [x + direction * 0.8, 2.92, 1.62], 0.20, C.trim, 'mezzanine-knee')
  }
}
for (const x of [-8.73, 8.73]) box([0.38, 0.40, 15.6], [x, 5.88, 0], C.timber, [0, 0, 0], {}, 'wall-plate')
for (const [a, b] of [[-8.85, -2.45], [2.45, 8.85]]) box([b - a - 0.04, 0.38, 0.34], [(a + b) / 2, 2.99, 1.53], C.timber, [0, 0, 0], {}, 'balcony-edge-beam')
box([4.9, 0.38, 0.34], [0, 2.99, 1.97], C.timber, [0, 0, 0], {}, 'chimney-notch-beam')
box([17.65, 0.36, 0.30], [0, 2.99, 4.15], C.timber, [0, 0, 0], {}, 'bedroom-bearing-beam')

// 5. Partial second floor (about 39% of footprint), with an explicit fireplace notch.
section = 'mezzanine'
floorDeck(-8.83, 8.83, 1.90, 7.35, D.upper, 'rear')
floorDeck(-8.83, -2.45, 1.40, 1.90, D.upper, 'left-front')
floorDeck(2.45, 8.83, 1.40, 1.90, D.upper, 'right-front')
for (let x = -8.25; x < 8.5; x += 0.82) {
  const front = Math.abs(x) < 2.45 ? 1.94 : 1.5
  box([0.15, 0.24, 7.33 - front], [x, 2.947, (front + 7.33) / 2], C.trim, [0, 0, 0], {}, 'joist')
}

// 6. Exactly three enclosed bedrooms behind one continuous balcony corridor.
section = 'rooms'
const bedrooms = [
  { left: -8.83, right: -3, door: -5.9 },
  { left: -3, right: 3, door: 0 },
  { left: 3, right: 8.83, door: 5.9 },
]
const roomDoors = bedrooms.map(r => ({ u: r.door, width: 1.17, bottom: 3.3, top: 5.51 }))
const doorRegistry = {}
function doorPrim(pivot, size, position, color, name, extra = {}) {
  const node = app.create('prim', {
    id: `doors:${name}:${serial++}`, type: 'box', size, position, color,
    roughness: 0.76, metalness: 0, physics: null, ...extra,
    castShadow: SHADOW_CASTING, receiveShadow: SHADOW_RECEIVING,
  })
  pivot.add(node)
  return node
}
function registerDoor(id, hingeX, hingeY, hingeZ, direction, width, height, openAngle, face = 'room') {
  const group = app.create('group', { position: [hingeX, hingeY, hingeZ] })
  app.add(group)
  const d = { id, group, hingeX, hingeY, hingeZ, direction, width, height, openAngle,
    face, angle: 0, target: 0, physicsEntry: null }
  doorRegistry[id] = d
  if (face === 'entrance') {
    const plankWidth = width / 5
    for (let i = 0; i < 5; i++) {
      doorPrim(group, [plankWidth - 0.004, height, 0.136],
        [direction * (i + 0.5) * plankWidth, height / 2, 0],
        C.logs[(i + 2) % 5], id + '-plank')
    }
    for (const h of [0.29, height / 2, height - 0.29]) {
      doorPrim(group, [width - 0.07, 0.10, 0.026],
        [direction * width / 2, h, -0.078], C.iron, id + '-hinge', { metalness: 0.35 })
    }
    doorPrim(group, [0.055, 0.24, 0.075], [direction * (width - 0.18), height / 2, -0.12], C.iron, id + '-handle')
  } else {
    // A flat closed panel, visibly inset from the wall logs and jambs.
    doorPrim(group, [width, height, 0.11], [direction * width / 2, height / 2, 0], C.trim, id + '-panel')
    for (const h of [0.25, height - 0.25]) {
      doorPrim(group, [width - 0.075, 0.10, 0.04],
        [direction * width / 2, h, -0.075], C.timber, id + '-rail')
    }
    for (const side of [-1, 1]) {
      doorPrim(group, [0.05, 0.16, 0.055],
        [direction * (width - 0.15), height / 2, side * 0.085], C.iron, id + '-latch')
    }
  }
  if (world.isClient) {
    const action = app.create('action', {
      position: [hingeX + direction * width * 0.56, hingeY + 1.30, hingeZ + (face === 'entrance' ? -0.28 : -0.15)],
      label: 'Open door', distance: 2.7, duration: 0.12,
      onTrigger: () => app.send('toggleDoor', { id }),
    })
    app.add(action)
    d.action = action
  }
  return d
}
wallLogsWithOpening('x', 4.2, -8.83, 8.83, 3.3, 5.98, roomDoors, { radius: 0.115, pitch: 0.215, tone: 2 })
for (const x of [-3, 3]) {
  wallLogsWithOpening('z', x, 4.2, 7.5, 3.3, 5.98, [], { radius: 0.115, pitch: 0.215 })
  box([0.25, 2.7, 0.25], [x, 4.65, 4.2], C.timber, [0, 0, 0], {}, 'partition-joint')
}
for (const r of bedrooms) {
  box([r.right - r.left, 0.14, 3.15], [(r.left + r.right) / 2, 5.98, 5.775], C.soffit, [0, 0, 0], {}, 'bedroom-ceiling')
  doorFrame('x', 4.2, r.door, 3.3, 1.17, 2.21)
  registerDoor(`bedroom-${bedrooms.indexOf(r) + 1}`, r.door - 0.51, 3.33, 4.2,
    1, 1.02, 2.12, -1.28)
}

// 7. L stair: eighteen 176.7 mm risers, 320 mm going, 1.35 m tread width.
section = 'stairs'
const stair = {
  width: 1.35, steps: 9,
  flights: [
    { a: [-4.535, 0.12, -2.175], b: [-7.415, 1.71, -2.175] },
    { a: [-8.09, 1.71, -1.5], b: [-8.09, 3.30, 1.38] },
  ],
}
const stairNewelPositions = new Set()
function staircase(a, b, count, width) {
  const dx = b[0] - a[0], dz = b[2] - a[2], run = Math.hypot(dx, dz)
  const ux = dx / run, uz = dz / run, nx = -uz, nz = ux
  const rise = (b[1] - a[1]) / count, going = run / count
  const point = (t, side = 0, dy = 0) => {
    const p = lerp(a, b, t)
    return [p[0] + nx * side, p[1] + dy, p[2] + nz * side]
  }
  for (let i = 0; i < count; i++) {
    const p = point((i + 0.5) / count), top = a[1] + (i + 1) * rise
    box(Math.abs(ux) > 0.5 ? [going + 0.025, 0.085, width] : [width, 0.085, going + 0.025],
      [p[0], top - 0.0425, p[2]], C.floor[i % 4], [0, 0, 0], {}, 'tread')
    const edge = point(i / count)
    box(Math.abs(ux) > 0.5 ? [0.042, rise - 0.05, width - 0.06] : [width - 0.06, rise - 0.05, 0.042],
      [edge[0], top - rise / 2 - 0.025, edge[2]], C.trim, [0, 0, 0], {}, 'riser')
  }
  for (const side of [-1, 1]) {
    beamBetween(point(0, side * (width / 2 - 0.06)), point(1, side * (width / 2 - 0.06)), 0.20, C.timber, 'stringer')
    beamBetween(point(0, side * width / 2, 1.08), point(1, side * width / 2, 1.08), 0.115, C.timber, 'handrail')
    for (let i = 0; i < count; i++) {
      for (const f of [0.22, 0.65]) {
        const t = (i + f) / count, p = point(t, side * width / 2)
        const foot = a[1] + (i + 1) * rise
        beamBetween([p[0], foot, p[2]], [p[0], p[1] + 1.08, p[2]], 0.065, C.trim, 'stair-baluster')
      }
    }
    for (const t of [0, 0.5, 1]) {
      const p = point(t, side * width / 2)
      const key = p.map(v => v.toFixed(4)).join(':')
      if (!stairNewelPositions.has(key)) {
        stairNewelPositions.add(key)
        guardPostPositions.add(key)
        beamBetween([p[0], p[1], p[2]], [p[0], p[1] + 1.15, p[2]], 0.145, C.timber, 'newel')
      }
    }
  }
}
for (const flight of stair.flights) staircase(flight.a, flight.b, stair.steps, stair.width)
floorDeck(-8.765, -7.415, -2.85, -1.5, 1.71, 'stair-landing')
for (const x of [-8.66, -7.53]) box([0.19, 1.33, 0.19], [x, 0.785, -2.69], C.timber, [0, 0, 0], {}, 'landing-support')
railing([-8.765, 1.71, -2.85], [-7.415, 1.71, -2.85], 'landing-back')
railing([-8.765, 1.71, -2.85], [-8.765, 1.71, -1.5], 'landing-side')

// 8. Massive stone fireplace: actual arched void, mantel, tapered XY extrusion.
section = 'fireplace'
box([5.12, 0.24, 2.12], [0, 0.24, 0.72], C.hearth, [0, 0, 0], {}, 'hearth')
const openingRadius = 1.3, spring = 1.18
const surround = [[-2.3, 0.36], [-1.3, 0.36], [-1.3, spring]]
for (let i = 1; i <= 16; i++) {
  const angle = Math.PI - i / 16 * Math.PI
  surround.push([openingRadius * Math.cos(angle), spring + openingRadius * Math.sin(angle)])
}
surround.push([1.3, 0.36], [2.3, 0.36], [2.3, 2.98], [-2.3, 2.98])
extrude(surround, 1.4, 1.0, C.mortar, 0.012, 'arched-surround')
box([2.6, 2.12, 0.11], [0, 1.42, 1.62], C.inside, [0, 0, 0], {}, 'recessed-fireback')
box([2.58, 0.045, 1.16], [0, 0.384, 0.98], C.inside, [0, 0, 0], {}, 'firebox-floor')
const chimneyProfile = [[-2.3, 2.98], [2.3, 2.98], [2.3, 3.24], [1.05, 6.0], [0.95, 6.5],
  [0.95, 10.72], [-0.95, 10.72], [-0.95, 6.5], [-1.05, 6.0], [-2.3, 3.24]]
extrude(chimneyProfile, 1.4, 1.0, C.mortar, 0.02, 'tapered-chimney')
const chimneyHalf = y => y <= 3.24 ? 2.3 : y < 6 ? 2.3 - (y - 3.24) * 1.25 / 2.76 : y < 6.5 ? 1.05 - (y - 6) * 0.2 : 0.95
function facingStone(x0, x1, y0, y1, index, back = false) {
  const chip = Math.min(0.048, (x1 - x0) * 0.14)
  const profile = [[x0 + chip, y0], [x1 - chip * 0.5, y0 + 0.009], [x1, y0 + chip],
    [x1 - chip * 0.3, y1 - chip], [x1 - chip, y1], [x0 + chip * 0.5, y1 - 0.011], [x0, y1 - chip]]
  const z = back ? 1.708 + (index % 3) * 0.009 : 0.259 - (index % 3) * 0.009
  extrude(profile, 0.105, z, C.stone[index % C.stone.length], 0.015, back ? 'rear-stone' : 'facing-stone')
}
let stoneIndex = 0
for (let row = 0, y = 0.40; y < 10.68; row++, y += 0.365) {
  const top = Math.min(y + 0.34, 10.70), half = Math.min(chimneyHalf(y), chimneyHalf(top)) - 0.022
  const width = row % 2 ? 0.73 : 0.84
  for (let x = -half; x < half - 0.08;) {
    const w = x === -half && row % 2 ? width * 0.5 : width, right = Math.min(half, x + w)
    const clear = y < spring ? 1.32 : y < spring + openingRadius ? Math.sqrt(Math.max(0, openingRadius ** 2 - (y - spring) ** 2)) + 0.06 : 0
    if (right - x > 0.10) facingStone(x + 0.009, right - 0.009, y, top, stoneIndex++, true)
    const spans = clear === 0 ? [[x, right]] : [[x, Math.min(right, -clear)], [Math.max(x, clear), right]]
    for (const [left, end] of spans) if (end - left > 0.10) facingStone(left + 0.009, end - 0.009, y, top, stoneIndex++)
    x = right
  }
  // Side stones follow the taper; continuous solid core stays behind the joints.
  for (const side of [-1, 1]) for (let k = 0; k < 2; k++) {
    const low = chimneyHalf(y), high = chimneyHalf(top)
    extrude([[side * (low - 0.018), y + 0.01], [side * (low + 0.065), y + 0.01],
      [side * (high + 0.065), top - 0.01], [side * (high - 0.018), top - 0.01]],
      0.66, 0.65 + k * 0.70, C.stone[(row + k + (side === 1 ? 2 : 0)) % 6], 0.012, 'side-stone')
  }
}
// Radial voussoirs make the arch legible without filling its opening.
for (let i = 0; i < 13; i++) {
  const a = i / 13 * Math.PI + 0.011, b = (i + 1) / 13 * Math.PI - 0.011
  const p = (r, t) => [r * Math.cos(t), spring + r * Math.sin(t)]
  extrude([p(1.31, a), p(1.64, a), p(1.64, b), p(1.31, b)], 0.18, 0.175,
    C.stone[(i + 2) % 6], 0.01, 'arch-voussoir')
}
box([5.18, 0.29, 0.63], [0, 3.005, 0.11], C.timber, [0, 0, 0], {}, 'mantel')
for (const x of [-1.84, 1.84]) box([0.30, 0.32, 0.61], [x, 2.77, 0.26], C.trim, [0, 0, 0], {}, 'mantel-corbels')
box([2.22, 0.20, 1.73], [0, 10.68, 1], C.hearth, [0, 0, 0], {}, 'chimney-crown')
for (const x of [-0.84, 0.84]) for (const z of [0.40, 1.60]) box([0.075, 0.43, 0.075], [x, 10.965, z], C.iron)
box([2.40, 0.13, 1.94], [0, 11.2, 1], C.iron, [0, 0, 0], { metalness: 0.35 }, 'chimney-cap')

// 9. Exposed rafters, ridge and two substantial king-post trusses.
section = 'roof-frame'
for (const [z0, z1] of [[-8.40, 0.10], [1.90, 8.40]]) box([0.42, 0.46, z1 - z0], [0, 9.48, (z0 + z1) / 2], C.timber, [0, 0, 0], {}, 'ridge-beam')
for (const z of [-7.60, -4.25, -1.15, 2.8, 5.8, 7.60]) for (const side of [-1, 1]) {
  beamBetween([side * 9.45, roofY(9.45) - 0.28, z], [0, 9.51, z], 0.29, C.timber, 'rafter')
}
for (const z of [-4.25, -1.15]) {
  beamBetween([-8.72, 5.84, z], [8.72, 5.84, z], 0.40, C.timber, 'truss-tie')
  beamBetween([0, 5.85, z], [0, 9.47, z], 0.31, C.timber, 'king-post')
  for (const side of [-1, 1]) {
    beamBetween([side * 4.9, 5.96, z], [0, 9.39, z], 0.245, C.trim, 'truss-strut')
    beamBetween([side * 8.63, 4.69, z], [side * 7.35, 5.82, z], 0.24, C.timber, 'frame-knee')
  }
}
// Purlins are interrupted where the stone chimney emerges.
for (const x of [-5.7, 5.7]) box([0.25, 0.27, 16.15], [x, roofY(x) - 0.27, 0], C.trim, [0, 0, 0], {}, 'purlin')

// 10. Continuous roof panels; a real opening surrounds the chimney at the ridge.
section = 'roof'
function roofPanel(x0, x1, z0, z1, lower, thickness, color, name) {
  extrude([[x0, roofY(x0) + lower], [x1, roofY(x1) + lower],
    [x1, roofY(x1) + lower + thickness], [x0, roofY(x0) + lower + thickness]],
    z1 - z0, (z0 + z1) / 2, color, 0, name)
}
for (const side of [-1, 1]) {
  const bounds = side === -1 ? [-9.85, 0] : [0, 9.85]
  for (const [z0, z1] of [[-8.35, 0.10], [1.90, 8.35]]) {
    roofPanel(...bounds, z0, z1, -0.13, 0.153, C.soffit, 'roof-deck')
    roofPanel(...bounds, z0, z1, 0.03, 0.10, C.roof, 'roof-cover')
  }
  const middle = side === -1 ? [-9.85, -1.12] : [1.12, 9.85]
  roofPanel(...middle, 0.10, 1.90, -0.13, 0.153, C.soffit, 'roof-deck')
  roofPanel(...middle, 0.10, 1.90, 0.03, 0.10, C.roof, 'roof-cover')
  for (const z of [-8.36, 8.36]) beamBetween([side * 9.87, roofY(9.87) - 0.015, z],
    [0, 9.79, z], 0.26, C.timber, 'rake-fascia')
  box([0.20, 0.28, 16.92], [side * 9.86, roofY(9.86) - 0.02, 0], C.timber, [0, 0, 0], {}, 'eave-fascia')
}
for (const [z0, z1] of [[-8.4, 0.1], [1.9, 8.4]]) box([0.24, 0.13, z1 - z0], [0, 9.94, (z0 + z1) / 2], C.roof, [0, 0, 0], {}, 'ridge-cap')
// Folded metal flashing seals the structural opening without crossing the flue.
for (const [x0, x1] of [[-1.18, -0.98], [0.98, 1.18]]) roofPanel(x0, x1, 0.08, 1.93, 0.135, 0.035, C.iron, 'side-flashing')
for (const [x0, x1] of [[-1.13, 0], [0, 1.13]]) for (const [z0, z1] of [[0.07, 0.28], [1.70, 1.94]]) {
  roofPanel(x0, x1, z0, z1, 0.135, 0.035, C.iron, 'apron-flashing')
}
// A few standing seams convey scale; each uses endpoint geometry on the slope.
for (let z = -7.65; z <= 8; z += 1.28) for (const side of [-1, 1]) {
  const endX = z > 0.1 && z < 1.9 ? side * 1.14 : side * 0.1
  beamBetween([side * 9.8, roofY(9.8) + 0.145, z], [endX, roofY(endX) + 0.145, z], 0.035, '#444b48', 'roof-seam')
}

// Triangular gables follow the roof profile; no rectangular wall crosses the attic.
section = 'gables'
extrude([[-9, 6], [9, 6], [0, 9.8]], 0.18, 7.5, C.logs[1], 0, 'rear-gable-core')
extrude([[-9, 6], [-4.6, 6], [-4.6, roofY(4.6)]], 0.18, -7.5, C.logs[1], 0, 'front-left-gable')
extrude([[4.6, 6], [9, 6], [4.6, roofY(4.6)]], 0.18, -7.5, C.logs[1], 0, 'front-right-gable')
for (let y = 6.16, row = 0; y < 9.62; y += 0.29, row++) {
  const edge = Math.max(0, (9.8 - y - 0.15) * 9 / 3.8)
  horizontalLog('x', 7.5, -edge, edge, y, 0.15, C.logs[row % 5], 'gable-log')
  if (edge > 4.62) {
    horizontalLog('x', -7.5, -edge, -4.6, y, 0.15, C.logs[row % 5], 'gable-log')
    horizontalLog('x', -7.5, 4.6, edge, y, 0.15, C.logs[row % 5], 'gable-log')
  }
}

// 11. Glazing, timber frames and open, thick entrance doors.
section = 'windows'
for (const [axis, fixed, openings, options] of [
  ['x', -7.5, frontOpenings.slice(1), {}],
  ['x', 7.5, rearOpenings, {}],
  ['z', -9, leftOpenings, { phase: 0.145 }],
  ['z', 9, rightOpenings, { phase: 0.145 }],
]) for (const o of openings) windowFrame(axis, fixed, o, options)
// Broad front screen: door bay, two sidelights, upper lights and shaped gable panes.
for (const x of [-4.6, -1.24, 1.24, 4.6]) {
  const top = roofY(x) - 0.14
  box([0.23, top - 0.10, 0.32], [x, (top + 0.10) / 2, -7.5], C.timber, [0, 0, 0], {}, 'screen-post')
}
for (const y of [2.75, 5.95]) box([9.36, 0.22, 0.34], [0, y, -7.5], C.timber, [0, 0, 0], {}, 'screen-transom')
for (const [left, right] of [[-4.48, -1.37], [1.37, 4.48]]) {
  box([right - left, 2.49, 0.035], [(left + right) / 2, 1.435, -7.5], C.glass, [0, 0, 0],
    { opacity: 0.18, transparent: true, castShadow: false, roughness: 0.12 }, 'glass')
  box([right - left + 0.12, 0.13, 0.35], [(left + right) / 2, 0.18, -7.5], C.trim)
}
for (const [left, right] of [[-4.48, -1.37], [-1.11, 1.11], [1.37, 4.48]]) {
  box([right - left, 2.98, 0.035], [(left + right) / 2, 4.35, -7.5], C.glass, [0, 0, 0],
    { opacity: 0.18, transparent: true, castShadow: false, roughness: 0.12 }, 'glass')
}
const gableGlass = [[-4.48, 6.07], [4.48, 6.07], [4.48, roofY(4.48) - 0.14], [0, 9.66], [-4.48, roofY(4.48) - 0.14]]
extrude(gableGlass, 0.035, -7.5, C.glass, 0, 'gable-glass',
  { opacity: 0.18, transparent: true, castShadow: false, roughness: 0.12 })
for (const x of [-1.24, 0, 1.24]) box([0.12, roofY(x) - 6.17, 0.14], [x, (roofY(x) - 0.1 + 6.07) / 2, -7.51], C.trim)
for (const side of [-1, 1]) beamBetween([side * 9.03, 5.99, -7.67], [0, 9.8, -7.67], 0.24, C.timber, 'gable-frame')
// The structural screen posts at x=+/-1.24 and transom at y=2.75 already
// form this doorway. Do not stack a second matching set of jambs/lintel.
wallBox('x', -7.5, 0, 0.15, 2.52, 0.05, 0.37, C.trim, 'entrance-threshold')
registerDoor('entrance-left', -1.16, 0.17, -7.5, 1, 1.12, 2.44, 2, 'entrance')
registerDoor('entrance-right', 1.16, 0.17, -7.5, -1, 1.12, 2.44, -2, 'entrance')

// 12. Balcony guards, leaving the stair arrival and chimney mass unobstructed.
section = 'railings'
railing([-7.37, 3.3, 1.48], [-2.48, 3.3, 1.48], 'left-balcony')
railing([2.48, 3.3, 1.48], [8.72, 3.3, 1.48], 'right-balcony')
railing([-2.48, 3.3, 1.48], [-2.48, 3.3, 1.97], 'left-notch')
railing([2.48, 3.3, 1.48], [2.48, 3.3, 1.97], 'right-notch')

// 13–15. Selective joinery, pegged connections and entrance timber detailing.
section = 'details'
for (const x of [-4.61, 4.61]) {
  const side = Math.sign(x)
  beamBetween([x, 4.76, -7.71], [x + side * 1.1, 5.90, -7.71], 0.21, C.trim, 'facade-knee')
}
for (const z of [-4.25, -1.15]) for (const x of [-8.64, 0, 8.64]) {
  box([0.29, 0.52, 0.027], [x, 5.89, z - 0.215], C.iron, [0, 0, 0], {}, 'truss-plate')
  for (const y of [5.74, 6.04]) cylinderBetween([x, y, z - 0.24], [x, y, z - 0.28], 0.038, '#766d59', 'joint-peg')
}
// Side mezzanine skirting and bedroom crown beams make the rooms part of the frame.
for (const x of [-8.76, 8.76]) box([0.14, 0.18, 5.35], [x, 3.40, 4.625], C.trim)
box([17.62, 0.22, 0.28], [0, 5.84, 4.2], C.timber, [0, 0, 0], {}, 'room-crown')


// 16. Compact structural collision shell. The wall colliders intentionally treat
// fixed glazing as solid while preserving the actual entrance and bedroom doors.
section = 'physics'

// Main floor and mezzanine walking surfaces.
collisionBox([18, 0.12, 15], [0, 0.06, 0], [0, 0, 0], 'main-floor')
collisionBox([17.66, 0.20, 5.45], [0, 3.20, 4.625], [0, 0, 0], 'mezzanine-rear')
collisionBox([6.38, 0.20, 0.50], [-5.64, 3.20, 1.65], [0, 0, 0], 'mezzanine-left-front')
collisionBox([6.38, 0.20, 0.50], [5.64, 3.20, 1.65], [0, 0, 0], 'mezzanine-right-front')

// Exterior envelope. Only the open double entrance is traversable; windows remain solid.
const entranceOpening = [{ u: 0, width: 2.48, bottom: 0.12, top: 2.75 }]
wallCollisionWithOpenings('x', -7.5, -9, 9, 0.12, 6.0, entranceOpening, 0.34, 'front-wall')
collisionBox([18, 5.88, 0.34], [0, 3.06, 7.5], [0, 0, 0], 'rear-wall')
collisionBox([0.34, 5.88, 15], [-9, 3.06, 0], [0, 0, 0], 'left-wall')
collisionBox([0.34, 5.88, 15], [9, 3.06, 0], [0, 0, 0], 'right-wall')

// Bedroom wall and partitions, preserving all three open bedroom doors.
wallCollisionWithOpenings('x', 4.2, -8.83, 8.83, 3.3, 5.98, roomDoors, 0.28, 'bedroom-front-wall')
for (const x of [-3, 3]) collisionBox([0.28, 2.68, 3.30], [x, 4.64, 5.85], [0, 0, 0], 'bedroom-partition')

// Stairs use exact tread-sized boxes for predictable walking and a solid landing.
function staircaseCollision(a, b, count, width, name) {
  const dx = b[0] - a[0], dz = b[2] - a[2], run = Math.hypot(dx, dz)
  const ux = dx / run, uz = dz / run
  const rise = (b[1] - a[1]) / count, going = run / count
  for (let i = 0; i < count; i++) {
    const p = lerp(a, b, (i + 0.5) / count), top = a[1] + (i + 1) * rise
    collisionBox(Math.abs(ux) > 0.5 ? [going + 0.025, 0.085, width] : [width, 0.085, going + 0.025],
      [p[0], top - 0.0425, p[2]], [0, 0, 0], `${name}-tread`)
  }
}
staircaseCollision(stair.flights[0].a, stair.flights[0].b, stair.steps, stair.width, 'lower-stair')
staircaseCollision(stair.flights[1].a, stair.flights[1].b, stair.steps, stair.width, 'upper-stair')
collisionBox([1.35, 0.14, 1.35], [-8.09, 1.64, -2.175], [0, 0, 0], 'stair-landing')

// Guard volumes keep players behind the visible balcony and landing railings.
collisionBox([4.89, 1.12, 0.12], [-4.925, 3.86, 1.48], [0, 0, 0], 'left-balcony-guard')
collisionBox([6.24, 1.12, 0.12], [5.60, 3.86, 1.48], [0, 0, 0], 'right-balcony-guard')
collisionBox([0.12, 1.12, 0.49], [-2.48, 3.86, 1.725], [0, 0, 0], 'left-notch-guard')
collisionBox([0.12, 1.12, 0.49], [2.48, 3.86, 1.725], [0, 0, 0], 'right-notch-guard')
collisionBox([1.35, 1.12, 0.12], [-8.09, 2.27, -2.85], [0, 0, 0], 'landing-back-guard')
collisionBox([0.12, 1.12, 1.35], [-8.765, 2.27, -2.175], [0, 0, 0], 'landing-side-guard')

// Fireplace: hearth, jambs, arch/lintel zone, and the narrowing chimney mass.
collisionBox([5.12, 0.24, 2.12], [0, 0.24, 0.72], [0, 0, 0], 'hearth')
collisionBox([1.00, 2.62, 1.40], [-1.80, 1.67, 1.0], [0, 0, 0], 'fireplace-left-jamb')
collisionBox([1.00, 2.62, 1.40], [1.80, 1.67, 1.0], [0, 0, 0], 'fireplace-right-jamb')
collisionBox([4.60, 0.50, 1.40], [0, 2.73, 1.0], [0, 0, 0], 'fireplace-arch-top')
collisionBox([4.30, 1.50, 1.40], [0, 3.73, 1.0], [0, 0, 0], 'chimney-lower')
collisionBox([2.90, 1.50, 1.40], [0, 5.23, 1.0], [0, 0, 0], 'chimney-taper')
collisionBox([1.90, 4.72, 1.40], [0, 8.36, 1.0], [0, 0, 0], 'chimney-upper')

// Two broad sloped roof colliders are enough for the structural shell; decorative
// seams, rafters, flashing, and fascia remain visual-only.
const roofCollisionRun = 9.85
const roofCollisionDrop = D.ridge - roofY(roofCollisionRun)
const roofCollisionPitch = Math.atan2(roofCollisionDrop, roofCollisionRun)
const roofCollisionLength = Math.hypot(roofCollisionRun, roofCollisionDrop)
const roofCollisionY = (D.ridge + roofY(roofCollisionRun)) / 2
collisionBox([roofCollisionLength, 0.22, 16.70], [-roofCollisionRun / 2, roofCollisionY, 0], [0, 0, roofCollisionPitch], 'left-roof')
collisionBox([roofCollisionLength, 0.22, 16.70], [roofCollisionRun / 2, roofCollisionY, 0], [0, 0, -roofCollisionPitch], 'right-roof')

// 17. Animated, server-authoritative hinged doors. The server alone changes
// app.state.doors; clients receive broadcast updates, and late joiners obtain
// the current values in their initial app.state snapshot.
section = 'doors'
function setDoorGeometry(door, angle) {
  door.angle = angle
  door.group.rotation.y = angle
  if (door.physicsEntry) {
    const p = door.physicsEntry.anchor
    const x = door.direction * door.width / 2
    p.position.set(door.hingeX + x * Math.cos(angle), door.hingeY + door.height / 2,
      door.hingeZ - x * Math.sin(angle))
    p.rotation.y = angle
  }
}
for (const door of Object.values(doorRegistry)) {
  const centreX = door.hingeX + door.direction * door.width / 2
  collisionBox([door.width - 0.008, door.height - 0.015, door.face === 'entrance' ? 0.132 : 0.105],
    [centreX, door.hingeY + door.height / 2, door.hingeZ], [0, 0, 0], `${door.id}-leaf`,
    { physics: 'kinematic', staticFriction: 0.7 })
  door.physicsEntry = physicsEntries[physicsEntries.length - 1]
}

if (world.isServer && (!app.state.doors || typeof app.state.doors !== 'object')) {
  app.state.doors = {}
}
for (const door of Object.values(doorRegistry)) {
  const isOpen = app.state?.doors?.[door.id] === true
  door.target = isOpen ? door.openAngle : 0
  setDoorGeometry(door, door.target)
  if (door.action) door.action.label = isOpen ? 'Close door' : 'Open door'
}
syncStructuralPhysics(true)

function applyAuthoritativeDoorState(data) {
  if (!data || typeof data.id !== 'string' || typeof data.open !== 'boolean') return
  const door = doorRegistry[data.id]
  if (!door) return
  door.target = data.open ? door.openAngle : 0
  if (door.action) door.action.label = data.open ? 'Close door' : 'Open door'
}
if (world.isServer) {
  app.on('toggleDoor', (request) => {
    if (!request || typeof request.id !== 'string' || !Object.prototype.hasOwnProperty.call(doorRegistry, request.id)) return
    const doors = app.state.doors || {}
    const open = !doors[request.id]
    app.state.doors = { ...doors, [request.id]: open }
    applyAuthoritativeDoorState({ id: request.id, open })
    app.send('doorState', { id: request.id, open })
  })
}
if (world.isClient) app.on('doorState', applyAuthoritativeDoorState)

app.on('update', (delta) => {
  const step = Math.min(Math.max(delta || 0, 0), 0.08) * 3.2
  if (!step) return
  let changed = false
  for (const door of Object.values(doorRegistry)) {
    const diff = door.target - door.angle
    if (Math.abs(diff) < 0.0001) continue
    const next = Math.abs(diff) <= step ? door.target : door.angle + Math.sign(diff) * step
    setDoorGeometry(door, next)
    changed = true
  }
  if (changed) syncStructuralPhysics(true)
})

// 16. Four warm paired-cone sconces: two downstairs and two upstairs.
// Native spots illuminate surfaces; the small emissive lenses show the openings.
function spot(position, up, intensity, distance, name) {
  const light = app.create('light', {
    id: `${section}:${name}:${serial++}`, type: 'spot', color: '#ffd29a',
    position, rotation: [up ? Math.PI : 0, 0, 0],
    intensity, distance, decay: 2, angle: Math.PI / 3, penumbra: 0.65,
    castShadow: false,
  })
  app.add(light)
}
section = 'interior-lighting'
const interiorFixtures = lightingPosts.filter(post => post.name === 'wall-post' && [-4.25, 3.0].includes(post.position[2]))
for (const post of interiorFixtures) {
  const [x, cy, z] = post.position
  const height = post.size[1], bottom = cy - height / 2
  const y = z === 3.0 ? D.upper + 2.15 : bottom + 2.15
  // Side posts face inward; other posts carry their fixture on the front face.
  const side = post.name === 'wall-post' || (post.name === 'mezzanine-post' && Math.abs(x) > 8)
  const fx = side ? x - Math.sign(x) * (post.size[0] / 2 + 0.22) : x
  const fz = side ? z : z - post.size[2] / 2 - 0.22
  box(side ? [0.065, 0.48, 0.22] : [0.22, 0.48, 0.065],
    [side ? x - Math.sign(x) * (post.size[0] / 2 + 0.035) : x, y,
      side ? z : z - post.size[2] / 2 - 0.035], C.iron, [0, 0, 0], { metalness: 0.65 }, 'sconce-backplate')
  for (const up of [false, true]) {
    const direction = up ? 1 : -1
    prim('cone', { size: [0.18, 0.22], position: [fx, y + direction * 0.13, fz],
      rotation: [up ? Math.PI : 0, 0, 0], color: C.iron, metalness: 0.65 }, 'sconce-cone')
    prim('cylinder', { size: [0.145, 0.145, 0.015], position: [fx, y + direction * 0.245, fz],
      color: '#ffe0af', emissive: '#ffd29a', emissiveIntensity: 1.5, castShadow: false }, 'sconce-lens')
    spot([fx, y + direction * 0.27, fz], up, up ? 25 : 5, up ? 9 : 7,
      up ? 'sconce-up' : 'sconce-down')
  }
}

// 17. Recessed exterior downlights beneath both eaves and the gable overhangs.
section = 'exterior-lighting'
const roofLights = []
for (const x of [-9.48, 9.48]) for (const z of [-5.1, 0, 5.1]) roofLights.push([x, roofY(x) - 0.19, z])
for (const z of [-8.05, 8.05]) for (const x of [-4.5, 4.5]) roofLights.push([x, roofY(x) - 0.19, z])
for (const [x, y, z] of roofLights) {
  prim('cylinder', { size: [0.18, 0.18, 0.06], position: [x, y, z], color: C.iron, metalness: 0.65 }, 'roof-light-trim')
  prim('cylinder', { size: [0.13, 0.13, 0.012], position: [x, y - 0.037, z],
    color: '#ffe0af', emissive: '#ffd29a', emissiveIntensity: 0.2, castShadow: false }, 'roof-light-lens')
  spot([x, y - 0.055, z], false, 15, 22, 'roof-downlight')
}
