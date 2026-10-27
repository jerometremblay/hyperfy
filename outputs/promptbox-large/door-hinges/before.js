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
const E = { halfWidth: 3, front: 7.5, back: 12.35, eave: 6,
  ridge: 6 + 3 * (D.ridge - D.eave) / D.halfWidth }
const C = {
  logs: ['#805b3d', '#896344', '#936c4a', '#876042', '#9b7450'],
  end: '#b08a5d', timber: '#513b2b', trim: '#664932',
  floor: ['#a68154', '#ac885d', '#b08c61', '#9e7950'],
  stone: ['#82796b', '#908675', '#9e9380', '#7b7468', '#a99e8a', '#8c8170'],
  mortar: '#655f55', hearth: '#8e8777', roof: '#333a39', iron: '#333531',
  soffit: '#93734e', glass: '#b6d3d5', inside: '#373731',
}
// Keep structural and door colliders under the house so native transforms
// move them with the app. Door updates run only while a door is animating.
app.resetOnMove = false
let collisionSerial = 0
function collisionBox(size, position, rotation = [0, 0, 0], name = 'structure', extra = {}) {
  const collider = app.create('prim', {
    id: `physics:${name}:${collisionSerial++}`,
    type: 'box', size, position, rotation,
    opacity: 0, castShadow: false, receiveShadow: false,
    physics: extra.physics || 'static',
    staticFriction: extra.staticFriction === undefined ? 0.8 : extra.staticFriction,
    dynamicFriction: extra.dynamicFriction === undefined ? 0.65 : extra.dynamicFriction,
    restitution: extra.restitution === undefined ? 0 : extra.restitution,
  })
  app.add(collider)
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

const lightingPosts = []
const upperFloorShadowLights = []
let section = 'floor'
let serial = 0
function prim(type, data, name = type) {
  // Fireplace pieces opt in; other house sections keep their existing default.
  const castsShadow = section === 'fireplace' ? data.castShadow === true : data.castShadow !== false
  const node = app.create('prim', {
    id: `${section}:${name}:${serial++}`, type, color: C.timber,
    roughness: 0.82, metalness: 0, physics: null,
    ...data,
    castShadow: SHADOW_CASTING && castsShadow && (data.opacity ?? 1) > 0,
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
    { opacity: 0.18, roughness: 0.12, castShadow: false }, 'glass')
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
  box([x1 - x0, 0.21, z1 - z0], [(x0 + x1) / 2, y - 0.155, (z0 + z1) / 2], C.trim, [0, 0, 0], { castShadow: true }, prefix + '-deck')
  const n = Math.ceil((x1 - x0) / 0.36), width = (x1 - x0) / n
  for (let i = 0; i < n; i++) {
    const x = x0 + (i + 0.5) * width
    // Continue the original rear mezzanine boards through the enlarged bedroom.
    const back = prefix === 'rear' && Math.abs(x) + width / 2 <= E.halfWidth
      ? E.back - 0.16 : z1
    box([width - 0.005, 0.05, back - z0],
      [x, y - 0.023, (z0 + back) / 2], C.floor[i % 4], [0, 0, 0], { castShadow: true }, prefix + '-board')
  }
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
for (let i = 0; i < 60; i++) {
  const x = -8.85 + i * 0.3
  const back = Math.abs(x) < E.halfWidth ? E.back : D.halfDepth
  box([0.295, 0.04, back + D.halfDepth], [x, 0.10, (back - D.halfDepth) / 2],
    C.floor[i % 4], [0, 0, 0], {}, 'floorboard')
}
// Low perimeter sill closes the half-course corner staggering at floor level.
// The central rear sill is removed along with the wall, at both floors.
for (const x of [-6, 6]) box([5.70, 0.27, 0.30], [x, 0.255, 7.5], C.trim)
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
  { u: 5.85, width: 2.8, bottom: 0.94, top: 2.65 },
  ...[-5.95, 5.95].map(u => ({ u, width: 2.25, bottom: 4.23, top: 5.66 })),
  // A real full-height opening joins the ground floor and center bedroom
  // to the extension. Do not glaze this former exterior wall.
  { u: 0, width: 6, bottom: 0.12, top: 6.15, passage: true },
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
const hingedDoorOpenAngle = 175 * Math.PI / 180
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
function patioPanel(group, id, direction, width, height, movable = true) {
  for (const x of [0.045, width - 0.045]) {
    doorPrim(group, [0.09, height, 0.11],
      [direction * x, height / 2, 0], C.trim, id + '-stile')
  }
  for (const y of [0.055, height - 0.055]) {
    doorPrim(group, [width, 0.11, 0.11],
      [direction * width / 2, y, 0], C.trim, id + '-rail')
  }
  doorPrim(group, [width - 0.18, height - 0.22, 0.035],
    [direction * width / 2, height / 2, 0], C.glass, id + '-glass',
    { opacity: 0.18, roughness: 0.12, castShadow: false })
  // Grips sit on the outer latch stile beside the jamb.
  if (movable) for (const side of [-1, 1]) {
    doorPrim(group, [0.04, 0.24, 0.045],
      [direction * 0.045, 1.12, side * 0.085], C.iron, id + '-handle',
      { metalness: 0.55 })
  }
}
function registerDoor(id, hingeX, hingeY, hingeZ, direction, width, height, openAngle, face = 'room', slideDistance = 0) {
  // Stand the hinge axis clear of the thick jamb; keep the closed leaf in place.
  const hingeOffsetZ = slideDistance ? 0 : (face === 'entrance' ? -0.20 : 0.20)
  const pivot = app.create('group', { position: [hingeX, hingeY, hingeZ + hingeOffsetZ] })
  app.add(pivot)
  let group = pivot
  if (hingeOffsetZ) {
    group = app.create('group', { position: [0, 0, -hingeOffsetZ] })
    pivot.add(group)
  }
  const d = { id, group: pivot, hingeX, hingeY, hingeZ: hingeZ + hingeOffsetZ,
    leafOffsetZ: -hingeOffsetZ, direction, width, height, openAngle,
    face, slideDistance, slide: 0, angle: 0, target: 0, collider: null }
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
  } else if (face === 'patio') {
    patioPanel(group, id, direction, width, height)
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
    1, 1.02, 2.12, -hingedDoorOpenAngle)
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
function staircase(a, b, count, width, options = {}) {
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
    // The spatial stair's railing ends at the portal plane rather than
    // projecting through the solid mezzanine into the bedrooms. Ordinary
    // stairs are unchanged because they have no railCeiling option.
    const topRailT = options.railCeiling === undefined ? 1 :
      Math.min(1, Math.max(0, (options.railCeiling - a[1] - 1.08) / (b[1] - a[1])))
    if (topRailT > 0) beamBetween(point(0, side * width / 2, 1.08),
      point(topRailT, side * width / 2, 1.08), 0.115, C.timber, 'handrail')
    for (let i = 0; i < count; i++) {
      for (const f of [0.22, 0.65]) {
        const t = (i + f) / count, p = point(t, side * width / 2)
        const foot = a[1] + (i + 1) * rise
        const cap = options.railCeiling === undefined ? p[1] + 1.08 :
          Math.min(options.railCeiling, p[1] + 1.08)
        if (cap > foot + 0.04) beamBetween([p[0], foot, p[2]],
          [p[0], cap, p[2]], 0.065, C.trim, 'stair-baluster')
      }
    }
    for (const t of [0, 0.5, 1]) {
      const p = point(t, side * width / 2)
      const key = p.map(v => v.toFixed(4)).join(':')
      if (!stairNewelPositions.has(key)) {
        stairNewelPositions.add(key)
        guardPostPositions.add(key)
        const cap = options.railCeiling === undefined ? p[1] + 1.15 :
          Math.min(options.railCeiling, p[1] + 1.15)
        if (cap > p[1] + 0.04) beamBetween([p[0], p[1], p[2]],
          [p[0], cap, p[2]], 0.145, C.timber, 'newel')
      }
    }
  }
}
for (const flight of stair.flights) staircase(flight.a, flight.b, stair.steps, stair.width)
floorDeck(-8.765, -7.415, -2.85, -1.5, 1.71, 'stair-landing')
for (const x of [-8.66, -7.53]) box([0.19, 1.33, 0.19], [x, 0.785, -2.69], C.timber, [0, 0, 0], {}, 'landing-support')
railing([-8.765, 1.71, -2.85], [-7.415, 1.71, -2.85], 'landing-back')
railing([-8.765, 1.71, -2.85], [-8.765, 1.71, -1.5], 'landing-side')

// 7b. Astronomical staircase, built with EXACTLY the timber/tread/baluster
// routine used by the two original flights. Cabin-local coordinates: +Y up,
// +X right, -Z forward. This is on the GROUND FLOOR, in the approximate
// prompt-box region but aligned to the west (X=-9) exterior wall, rather than
// the rotated prompt-box axes. It passes through SPACE, not the bedroom floor.
section = 'roof-access-wall-aligned-stairs'
const roofAccess = {
  // Set back 0.30m from the original x=-8.09 stair line to pass the load-bearing
  // wall posts at x=-8.65, which occupy x=-8.825..-8.475.
  x: -7.74,
  steps: 15,
  width: stair.width,                 // 1.35m, identical to existing staircase
  // 320mm going and 176.7mm rise, identical to original house stairs.
  // Stair begins near the front of this footprint and rises toward the rear.
  // Earlier revision ran in the opposite direction.
  a: [-7.74, D.floor, 6.88 - 15 * 0.32],
  b: [-7.74, D.floor + 15 * (3.18/18), 6.88],
  ceilingY: 2.785,                 // below original joists (~2.827 underside)
  portalW: 1.50,                    // stair width + space for side handrails
  portalL: 5.02,                    // full 4.80m flight + 11cm at either end
  portalCenterZ: (6.88 + (6.88 - 15*0.32)) / 2,
  deckY: 8.38,
  deck: { x0: -8.90, x1: -4.20, z0: 0.15, z1: 8.30 },
  // Deck's return aperture matches the ENTIRE staircase, not only its landing.
  hatch: { x0: -7.80, x1: -6.30, z0: 1.65, z1: 6.67 },
}
// Keep the precise joinery, materials, going, and newel pattern already used
// on the existing stairs. The portal clips the rails before the solid upper floor.
staircase(roofAccess.a, roofAccess.b, roofAccess.steps,
  roofAccess.width, { railCeiling: roofAccess.ceilingY - 0.035 })

// Thin timber opening surround directly below the mezzanine floor. The portal
// itself is not a collider; the bedroom above remains a real physical floor.
section = 'roof-access-wall-ceiling-frame'
for (const x of [roofAccess.x - roofAccess.portalW/2 - 0.075,
                 roofAccess.x + roofAccess.portalW/2 + 0.075]) {
  beamBetween([x, roofAccess.ceilingY - 0.05, roofAccess.portalCenterZ - roofAccess.portalL/2],
              [x, roofAccess.ceilingY - 0.05, roofAccess.portalCenterZ + roofAccess.portalL/2],
              0.14, C.timber, 'astronomy-portal-side-beam')
}
for (const z of [roofAccess.portalCenterZ - roofAccess.portalL/2 - 0.075,
                 roofAccess.portalCenterZ + roofAccess.portalL/2 + 0.075]) {
  beamBetween([roofAccess.x - roofAccess.portalW/2, roofAccess.ceilingY - 0.05, z],
              [roofAccess.x + roofAccess.portalW/2, roofAccess.ceilingY - 0.05, z],
              0.14, C.trim, 'astronomy-portal-crossbeam')
}
// Horizontal same-world portals: travel is genuinely noncontiguous. The
// downstairs ceiling looks DOWN and the rooftop floor looks UP, with a matched
// rectangular aperture at BOTH ends.
section = 'roof-access-wall-spatial-portals'
const ceilingPortalId = `${app.instanceId}:astronomy-ceiling`
const roofPortalId = `${app.instanceId}:astronomy-roof-deck`
app.add(app.create('portal', {
  portalId: ceilingPortalId, target: roofPortalId, url: '',
  width: roofAccess.portalW, height: roofAccess.portalL,
  position: [roofAccess.x, roofAccess.ceilingY, roofAccess.portalCenterZ],
  rotation: [Math.PI/2, 0, 0], doubleside: false,
  resolution: 'max', updateRate: 0,
}))
const h = roofAccess.hatch
app.add(app.create('portal', {
  portalId: roofPortalId, target: ceilingPortalId, url: '',
  width: roofAccess.portalW, height: roofAccess.portalL,
  position: [(h.x0+h.x1)/2, roofAccess.deckY-0.05, (h.z0+h.z1)/2],
  // Rotate the rooftop portal 180° in-plane so the portal's "up" direction
  // aligns with the open side in the handrails when arriving from below.
  rotation: [-Math.PI/2, Math.PI, 0], doubleside: false,
  resolution: 'max', updateRate: 0,
}))

section = 'roof-access-observation-deck'
const d=roofAccess.deck
const deckTiles = [
  [d.x0,h.x0,d.z0,d.z1], [h.x1,d.x1,d.z0,d.z1],
  [h.x0,h.x1,d.z0,h.z0], [h.x0,h.x1,h.z1,d.z1],
]
for (let i=0;i<deckTiles.length;i++) {
  const [x0,x1,z0,z1]=deckTiles[i]
  floorDeck(x0,x1,z0,z1,roofAccess.deckY,`astronomy-terrace-${i}`)
}
for (const x of [d.x0+0.12,d.x1-0.12])
  beamBetween([x,roofAccess.deckY-0.19,d.z0+0.15],
              [x,roofAccess.deckY-0.19,d.z1-0.15],0.2,C.timber,'roof-platform-girder')
for (const z of [d.z0+0.12,d.z1-0.12])
  beamBetween([d.x0+0.15,roofAccess.deckY-0.19,z],
              [d.x1-0.15,roofAccess.deckY-0.19,z],0.2,C.timber,'roof-platform-girder')
// Roof support posts sit OUTSIDE the opening, unlike the earlier deck build.
for (const x of [d.x0+0.26, -5.85, d.x1-0.26])
  for (const z of [d.z0+0.33,d.z1-0.33]) {
    const baseY=roofY(x)+0.17
    beamBetween([x,baseY,z],[x,roofAccess.deckY-0.17,z],0.22,C.timber,'roof-platform-support')
    box([0.36,0.075,0.36],[x,baseY,z],C.iron,[0,0,0],{metalness:0.35},'roof-platform-foot')
  }
// The same `railing` helper and warm colors used on the original mezzanine.
railing([d.x0+0.08,roofAccess.deckY,d.z0+0.08],
        [d.x1-0.08,roofAccess.deckY,d.z0+0.08],'roof-perimeter-front')
railing([d.x0+0.08,roofAccess.deckY,d.z1-0.08],
        [d.x1-0.08,roofAccess.deckY,d.z1-0.08],'roof-perimeter-back')
railing([d.x0+0.08,roofAccess.deckY,d.z0+0.08],
        [d.x0+0.08,roofAccess.deckY,d.z1-0.08],'roof-perimeter-left')
railing([d.x1-0.08,roofAccess.deckY,d.z0+0.08],
        [d.x1-0.08,roofAccess.deckY,d.z1-0.08],'roof-perimeter-right')
// Carry handrails up both long sides of the roof's teleportation aperture.
// Guard the low-end of the mirrored flight; leave the new high-end
// unobstructed for circulation onto the roof deck.
for (const x of [h.x0-0.11,h.x1+0.11])
  railing([x,roofAccess.deckY,h.z0-0.04],
          [x,roofAccess.deckY,h.z1+0.04],'roof-portal-handrail')
railing([h.x0-0.11,roofAccess.deckY,h.z0-0.07],
        [h.x1+0.11,roofAccess.deckY,h.z0-0.07],'roof-portal-end-guard')
// Thin dark metal trim around the PORTAL, not across its aperture.
for (const x of [h.x0,h.x1])
  box([0.055,0.05,h.z1-h.z0],[x,roofAccess.deckY+0.027,(h.z0+h.z1)/2],
      C.iron,[0,0,0],{},'roof-hatch-side-rim')
for (const z of [h.z0,h.z1])
  box([h.x1-h.x0,0.05,0.055],[(h.x0+h.x1)/2,roofAccess.deckY+0.027,z],
      C.iron,[0,0,0],{},'roof-hatch-end-rim')

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
extrude(surround, 1.4, 1.0, C.mortar, 0.012, 'arched-surround', { castShadow: true })
box([2.6, 2.12, 0.11], [0, 1.42, 1.62], C.inside, [0, 0, 0], { castShadow: true }, 'recessed-fireback')
box([2.58, 0.045, 1.16], [0, 0.384, 0.98], C.inside, [0, 0, 0], { castShadow: true }, 'firebox-floor')
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
    C.stone[(i + 2) % 6], 0.01, 'arch-voussoir', { castShadow: true })
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
]) for (const o of openings) if (!o.passage) windowFrame(axis, fixed, o, options)
// Broad front screen: door bay, two sidelights, upper lights and shaped gable panes.
for (const x of [-4.6, -1.24, 1.24, 4.6]) {
  const top = roofY(x) - 0.14
  box([0.23, top - 0.10, 0.32], [x, (top + 0.10) / 2, -7.5], C.timber, [0, 0, 0], {}, 'screen-post')
}
for (const y of [2.75, 5.95]) box([9.36, 0.22, 0.34], [0, y, -7.5], C.timber, [0, 0, 0], {}, 'screen-transom')
for (const [left, right] of [[-4.48, -1.37], [1.37, 4.48]]) {
  box([right - left, 2.49, 0.035], [(left + right) / 2, 1.435, -7.5], C.glass, [0, 0, 0],
    { opacity: 0.18, castShadow: false, roughness: 0.12 }, 'glass')
  box([right - left + 0.12, 0.13, 0.35], [(left + right) / 2, 0.18, -7.5], C.trim)
}
for (const [left, right] of [[-4.48, -1.37], [-1.11, 1.11], [1.37, 4.48]]) {
  box([right - left, 2.98, 0.035], [(left + right) / 2, 4.35, -7.5], C.glass, [0, 0, 0],
    { opacity: 0.18, castShadow: false, roughness: 0.12 }, 'glass')
}
const gableGlass = [[-4.48, 6.07], [4.48, 6.07], [4.48, roofY(4.48) - 0.14], [0, 9.66], [-4.48, roofY(4.48) - 0.14]]
extrude(gableGlass, 0.035, -7.5, C.glass, 0, 'gable-glass',
  { opacity: 0.18, castShadow: false, roughness: 0.12 })
for (const x of [-1.24, 0, 1.24]) box([0.12, roofY(x) - 6.17, 0.14], [x, (roofY(x) - 0.1 + 6.07) / 2, -7.51], C.trim)
for (const side of [-1, 1]) beamBetween([side * 9.03, 5.99, -7.67], [0, 9.8, -7.67], 0.24, C.timber, 'gable-frame')
// The structural screen posts at x=+/-1.24 and transom at y=2.75 already
// form this doorway. Do not stack a second matching set of jambs/lintel.
wallBox('x', -7.5, 0, 0.15, 2.52, 0.05, 0.37, C.trim, 'entrance-threshold')
registerDoor('entrance-left', -1.16, 0.17, -7.5, 1, 1.12, 2.44, hingedDoorOpenAngle, 'entrance')
registerDoor('entrance-right', 1.16, 0.17, -7.5, -1, 1.12, 2.44, -hingedDoorOpenAngle, 'entrance')

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



// Rear extension, aligned to the existing center-bedroom partitions rather
// than the approximate prompt-box edges. +Y up, +X right, -Z forward.
// Two connected floors; the original house root, stairs, portals and roof stay.
const extensionRoofY = x => E.ridge - Math.abs(x) * (D.ridge - D.eave) / D.halfWidth
const extensionSideWindows = [
  { u: 9.92, width: 3.15, bottom: 0.88, top: 2.72 },
  { u: 9.92, width: 3.15, bottom: 3.89, top: 5.67 },
]
const extensionRearOpenings = [
  { u: 0, width: 3, bottom: D.floor, top: 2.80, patio: true },
  { u: 0, width: 4.60, bottom: 3.89, top: 5.67 },
]

section = 'extension-floor'
box([6, 0.077, E.back - 7.35], [0, 0.0385, (7.35 + E.back) / 2],
  C.trim, [0, 0, 0], {}, 'contact-slab')
// Only the supporting slab and deck are added here. The original boards
// above already continue through both rooms, preserving their spacing and tones.
box([5.68, 0.21, E.back - 0.16 - 7.35],
  [0, D.upper - 0.155, (7.35 + E.back - 0.16) / 2],
  C.trim, [0, 0, 0], { castShadow: true }, 'extension-upper-deck')
for (let x = -2.65; x <= 2.7; x += 0.88) {
  box([0.15, 0.24, E.back - 7.35], [x, 2.947, (7.35 + E.back) / 2],
    C.trim, [0, 0, 0], {}, 'joist')
}
// Continue the existing ceiling panel through the extension to its rear wall.
const extensionCeilingDepth = E.back - 7.35
const extensionCeilingZ = 7.35 + extensionCeilingDepth / 2
box([5.70, 0.14, extensionCeilingDepth], [0, 5.98, extensionCeilingZ],
  C.soffit, [0, 0, 0], {}, 'bedroom-ceiling')

section = 'extension-logs'
for (const x of [-E.halfWidth, E.halfWidth]) {
  wallLogsWithOpening('z', x, E.front, E.back, D.floor, E.eave,
    extensionSideWindows, { phase: 0.145, tone: x < 0 ? 2 : 3 })
  box([0.30, 0.27, E.back - E.front], [x, 0.255, (E.front + E.back) / 2], C.trim)
}
wallLogsWithOpening('x', E.back, -3, 3, D.floor, E.eave,
  extensionRearOpenings, { tone: 1 })
for (const x of [-2.25, 2.25]) box([1.5, 0.27, 0.30], [x, 0.255, E.back], C.trim)

section = 'extension-frame'
for (const x of [-2.84, 2.84]) {
  for (const z of [7.68, E.back - 0.17]) {
    box([0.25, 5.78, 0.25], [x, 3.01, z], C.timber, [0, 0, 0], {}, 'corner-post')
  }
  beamBetween([x, 5.86, E.front], [x, 5.86, E.back], 0.28, C.timber, 'wall-plate')
}
beamBetween([-2.84, 3.01, E.back - 0.17], [2.84, 3.01, E.back - 0.17],
  0.30, C.timber, 'floor-bearing-beam')
// The existing center bedroom's side partitions continue into these side walls.
// Their rear corner posts sit outside the new circulation passage.

section = 'extension-windows'
for (const x of [-3, 3]) for (const opening of extensionSideWindows) {
  windowFrame('z', x, opening, { phase: 0.145 })
}
windowFrame('x', E.back, extensionRearOpenings[1])
doorFrame('x', E.back, 0, D.floor, 3, 2.62)
// Standard two-track patio door: the left panel slides behind the fixed right
// panel. Travel ends within the existing jambs; no leaf swings into the room.
registerDoor('patio-left', -1.395, 0.18, E.back - 0.10,
  1, 1.425, 2.42, 0, 'patio', 1.365)
const fixedPatioPanel = app.create('group', { position: [-0.03, 0.18, E.back + 0.10] })
app.add(fixedPatioPanel)
patioPanel(fixedPatioPanel, 'patio-fixed', 1, 1.425, 2.42, false)
collisionBox([1.417, 2.405, 0.105], [0.6825, 1.39, E.back + 0.10],
  [0, 0, 0], 'patio-fixed')
for (const z of [-0.10, 0.10]) {
  box([2.90, 0.014, 0.026], [0, 0.137, E.back + z], C.iron,
    [0, 0, 0], { metalness: 0.55 }, 'patio-bottom-track')
}
box([2.96, 0.055, 0.28], [0, 2.635, E.back], C.iron,
  [0, 0, 0], { metalness: 0.55 }, 'patio-top-track')

section = 'extension-roof'
// A lower gable uses the main roof's pitch and materials, joining the original
// rear wall below its gable. The original 9.8 m ridge and observation deck remain.
for (const [x0, x1] of [[-3.50, 0], [0, 3.50]]) {
  const profile = lower => [
    [x0, extensionRoofY(x0) + lower], [x1, extensionRoofY(x1) + lower],
    [x1, extensionRoofY(x1) + lower + 0.14], [x0, extensionRoofY(x0) + lower + 0.14],
  ]
  extrude(profile(-0.14), 5.50, 10.15, C.soffit, 0, 'roof-deck')
  extrude(profile(0.015), 5.50, 10.15, C.roof, 0, 'roof-cover')
}
for (const z of [8.15, 10.2, 12.55]) for (const side of [-1, 1]) {
  beamBetween([side * 3.42, extensionRoofY(3.42) - 0.22, z],
    [0, E.ridge - 0.22, z], 0.20, C.timber, 'rafter')
}
for (const side of [-1, 1]) {
  beamBetween([side * 3.52, extensionRoofY(3.52) + 0.005, 12.92],
    [0, E.ridge + 0.005, 12.92], 0.22, C.timber, 'rake-fascia')
  box([0.18, 0.25, 5.62], [side * 3.51, extensionRoofY(3.51) - 0.015, 10.15],
    C.timber, [0, 0, 0], {}, 'eave-fascia')
}
box([0.20, 0.12, 5.54], [0, E.ridge + 0.18, 10.15],
  C.roof, [0, 0, 0], {}, 'ridge-cap')
for (let z = 8.15; z <= 12.6; z += 1.28) for (const side of [-1, 1]) {
  beamBetween([side * 3.45, extensionRoofY(3.45) + 0.17, z],
    [side * 0.08, extensionRoofY(0.08) + 0.17, z], 0.035, '#444b48', 'roof-seam')
}
// A real glazed gable; its triangle is not hidden behind a solid wall core.
extrude([[-2.86, 6.08], [2.86, 6.08], [0, E.ridge - 0.10]],
  0.035, E.back, C.glass, 0, 'gable-glass',
  { opacity: 0.18, roughness: 0.12, castShadow: false })
beamBetween([-3, 6.0, E.back], [3, 6.0, E.back], 0.23, C.timber, 'gable-bottom')
for (const side of [-1, 1]) {
  beamBetween([side * 3, 6.0, E.back], [0, E.ridge, E.back], 0.20, C.timber, 'gable-frame')
}
beamBetween([0, 6.08, E.back], [0, E.ridge - 0.10, E.back], 0.09, C.trim, 'gable-mullion')

section = 'extension-physics'
collisionBox([6, 0.12, E.back - 7.35], [0, 0.06, (7.35 + E.back) / 2],
  [0, 0, 0], 'extension-ground-floor')
collisionBox([5.68, 0.20, E.back - 0.16 - 7.35],
  [0, 3.20, (7.35 + E.back - 0.16) / 2], [0, 0, 0], 'extension-upper-floor')
for (const x of [-3, 3]) {
  collisionBox([0.34, 5.88, E.back - E.front], [x, 3.06, (E.front + E.back) / 2],
    [0, 0, 0], 'extension-side-wall')
}
wallCollisionWithOpenings('x', E.back, -3, 3, D.floor, E.eave,
  [{ u: 0, width: 2.81, bottom: D.floor, top: 2.615 }], 0.34, 'extension-rear-wall')
const extensionPitch = Math.atan2(D.ridge - D.eave, D.halfWidth)
for (const side of [-1, 1]) {
  collisionBox([3.50 / Math.cos(extensionPitch), 0.22, 5.50],
    [side * 1.75, extensionRoofY(1.75), 10.15],
    [0, 0, -side * extensionPitch], 'extension-roof')
}
// One level threshold outside the patio; no per-detail collision.
section = 'extension-patio'
box([3.35, 0.12, 0.88], [0, 0.06, E.back + 0.50], C.hearth, [0, 0, 0], {}, 'patio-step')
collisionBox([3.35, 0.12, 0.88], [0, 0.06, E.back + 0.50], [0, 0, 0], 'patio-step')

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
wallCollisionWithOpenings('x', 7.5, -9, 9, 0.12, 6,
  [{ u: 0, width: 6, bottom: 0.12, top: 6.15 }], 0.34, 'rear-wall')
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

// The wall-aligned astronomical stairs use the EXACT existing tread collider
// generation, with their footprint still aligned to the actual cabin wall.
staircaseCollision(roofAccess.a,roofAccess.b,roofAccess.steps,
  roofAccess.width,'astronomy-stair')
// Do not add a ceiling collider over the portal: the existing mezzanine above
// remains intact, and traversal must be tested in-world for head clearance.
for (let i=0;i<deckTiles.length;i++) {
  const [x0,x1,z0,z1]=deckTiles[i]
  collisionBox([x1-x0,0.15,z1-z0],
    [(x0+x1)/2,roofAccess.deckY-0.085,(z0+z1)/2],
    [0,0,0],`astronomy-roof-floor-${i}`)
}
collisionBox([d.x1-d.x0,1.10,0.12],
  [(d.x0+d.x1)/2,roofAccess.deckY+0.55,d.z0+0.08],[0,0,0],'astronomy-roof-front-guard')
collisionBox([d.x1-d.x0,1.10,0.12],
  [(d.x0+d.x1)/2,roofAccess.deckY+0.55,d.z1-0.08],[0,0,0],'astronomy-roof-back-guard')
collisionBox([0.12,1.10,d.z1-d.z0],
  [d.x0+0.08,roofAccess.deckY+0.55,(d.z0+d.z1)/2],[0,0,0],'astronomy-roof-left-guard')
collisionBox([0.12,1.10,d.z1-d.z0],
  [d.x1-0.08,roofAccess.deckY+0.55,(d.z0+d.z1)/2],[0,0,0],'astronomy-roof-right-guard')

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

// 17. Server-authoritative hinged doors and the sliding patio panel. The server alone changes
// app.state.doors; clients receive broadcast updates, and late joiners obtain
// the current values in their initial app.state snapshot.
section = 'doors'
function setDoorGeometry(door, angle) {
  if (door.slideDistance) {
    door.slide = angle
    if (world.isClient) door.group.position.x = door.hingeX + angle
    if (door.collider) {
      door.collider.position.set(door.hingeX + angle + door.direction * door.width / 2,
        door.hingeY + door.height / 2, door.hingeZ)
    }
    return
  }
  door.angle = angle
  if (world.isClient) door.group.rotation.y = angle
  if (door.collider) {
    const x = door.direction * door.width / 2
    door.collider.position.set(door.hingeX + x * Math.cos(angle) + door.leafOffsetZ * Math.sin(angle),
      door.hingeY + door.height / 2,
      door.hingeZ - x * Math.sin(angle) + door.leafOffsetZ * Math.cos(angle))
    door.collider.rotation.y = angle
  }
}

for (const door of Object.values(doorRegistry)) {
  const centreX = door.hingeX + door.direction * door.width / 2
  door.collider = collisionBox([door.width - 0.008, door.height - 0.015, door.face === 'entrance' ? 0.132 : 0.105],
    [centreX, door.hingeY + door.height / 2, door.hingeZ + door.leafOffsetZ], [0, 0, 0], `${door.id}-leaf`,
    { physics: 'kinematic', staticFriction: 0.7 })
}

if (world.isServer && (!app.state?.doors || typeof app.state.doors !== 'object')) {
  // Replace the top-level state so Hyperfy can retain the update.
  app.state = { ...(app.state || {}), doors: { ...(props.initialDoors || {}) } }
}
for (const door of Object.values(doorRegistry)) {
  const isOpen = (app.state?.doors?.[door.id] ?? props.initialDoors?.[door.id]) === true
  door.target = isOpen ? (door.slideDistance || door.openAngle) : 0
  setDoorGeometry(door, door.target)
  if (door.action) door.action.label = door.slideDistance ? (isOpen ? 'Slide closed' : 'Slide open') : (isOpen ? 'Close door' : 'Open door')
}
let doorUpdateRegistered = false
function updateDoors(delta) {
  const dt = Math.min(Math.max(delta || 0, 0), 0.08)
  if (!dt) return
  let changedUpperDoor = false
  for (const door of Object.values(doorRegistry)) {
    const current = door.slideDistance ? door.slide : door.angle
    const diff = door.target - current
    if (Math.abs(diff) < 0.0001) continue
    const step = dt * (door.slideDistance ? 1.2 : 3.2)
    const next = Math.abs(diff) <= step ? door.target : current + Math.sign(diff) * step
    setDoorGeometry(door, next)
    if (world.isClient && door.hingeY >= D.upper) changedUpperDoor = true
  }
  if (changedUpperDoor) for (const light of upperFloorShadowLights) {
    if (typeof light.refreshShadow === 'function') light.refreshShadow()
  }
  if (Object.values(doorRegistry).every(door => Math.abs(door.target - (door.slideDistance ? door.slide : door.angle)) < 0.0001)) {
    app.off('update', updateDoors)
    doorUpdateRegistered = false
  }
}
function startDoorUpdates() {
  if (doorUpdateRegistered) return
  doorUpdateRegistered = true
  app.on('update', updateDoors)
}
function applyAuthoritativeDoorState(data) {
  if (!data || typeof data.id !== 'string' || typeof data.open !== 'boolean') return
  const door = doorRegistry[data.id]
  if (!door) return
  door.target = data.open ? (door.slideDistance || door.openAngle) : 0
  if (door.action) door.action.label = door.slideDistance ? (data.open ? 'Slide closed' : 'Slide open') : (data.open ? 'Close door' : 'Open door')
  if (Math.abs(door.target - (door.slideDistance ? door.slide : door.angle)) >= 0.0001) startDoorUpdates()
}
if (world.isServer) {
  app.on('toggleDoor', (request) => {
    if (!request || typeof request.id !== 'string' || !Object.prototype.hasOwnProperty.call(doorRegistry, request.id)) return
    const state = app.state || {}
    const doors = state.doors || {}
    const open = !doors[request.id]
    // Nested mutation does not reliably notify the entity-state manager.
    app.state = { ...state, doors: { ...doors, [request.id]: open } }
    applyAuthoritativeDoorState({ id: request.id, open })
    app.send('doorState', { id: request.id, open })
  })
}
if (world.isClient) app.on('doorState', applyAuthoritativeDoorState)


// 16. Four warm paired-cone sconces: two downstairs and two upstairs.
// Native spots illuminate surfaces; the small emissive lenses show the openings.
// The house is the authoritative receiver of the four-gang wall switch's
// three independent house circuits. Light objects and luminous lenses respond.
const houseLightCircuits = ['house-exterior', 'house-interior-lower', 'house-interior-upper']
const circuitFixtures = {}
for (const circuit of houseLightCircuits) circuitFixtures[circuit] = { lights: [], lenses: [] }
function addCircuitLens(circuit, lens, emissiveIntensity) {
  circuitFixtures[circuit].lenses.push({ lens, emissiveIntensity })
}
function spot(position, up, intensity, distance, name, shadowMode = null, circuit = 'house-interior-lower') {
  const light = app.create('light', {
    id: `${section}:${name}:${serial++}`, type: 'spot', color: '#ffd29a',
    position, rotation: [up ? Math.PI : 0, 0, 0],
    intensity, distance, decay: 2, angle: Math.PI / 3, penumbra: 0.65,
    castShadow: shadowMode !== null,
    ...(shadowMode ? { shadowMode } : {}),
  })
  app.add(light)
  if (shadowMode) upperFloorShadowLights.push(light)
  circuitFixtures[circuit].lights.push({ light, intensity })
}
section = 'interior-lighting'
const interiorFixtures = lightingPosts.filter(post => post.name === 'wall-post' && [-4.25, 3.0].includes(post.position[2]))
for (const post of interiorFixtures) {
  const [x, cy, z] = post.position
  const height = post.size[1], bottom = cy - height / 2
  const isUpperFloor = z === 3.0
  const y = isUpperFloor ? D.upper + 2.15 : bottom + 2.15
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
    const circuit = isUpperFloor ? 'house-interior-upper' : 'house-interior-lower'
    const lens = prim('cylinder', { size: [0.145, 0.145, 0.015], position: [fx, y + direction * 0.245, fz],
      color: '#ffe0af', emissive: '#ffd29a', emissiveIntensity: 1.5, castShadow: false }, 'sconce-lens')
    addCircuitLens(circuit, lens, 1.5)
    spot([fx, y + direction * 0.27, fz], up, up ? 25 : 5, up ? 9 : 7,
      up ? 'sconce-up' : 'sconce-down', isUpperFloor && !up ? 'static' : null, circuit)
  }
}

// 17. Recessed exterior downlights beneath both eaves and the gable overhangs.
section = 'exterior-lighting'
const roofLights = []
for (const x of [-9.48, 9.48]) for (const z of [-5.1, 0, 5.1]) roofLights.push([x, roofY(x) - 0.19, z])
for (const z of [-8.05, 8.05]) for (const x of [-4.5, 4.5]) roofLights.push([x, roofY(x) - 0.19, z])
for (const [x, y, z] of roofLights) {
  prim('cylinder', { size: [0.18, 0.18, 0.06], position: [x, y, z], color: C.iron, metalness: 0.65 }, 'roof-light-trim')
  const lens = prim('cylinder', { size: [0.13, 0.13, 0.012], position: [x, y - 0.037, z],
    color: '#ffe0af', emissive: '#ffd29a', emissiveIntensity: 0.2, castShadow: false }, 'roof-light-lens')
  addCircuitLens('house-exterior', lens, 0.2)
  spot([x, y - 0.055, z], false, 15, 22, 'roof-downlight', null, 'house-exterior')
}


// Three static fixtures extend the existing switch circuits, without new
// frame callbacks or shadow maps.
section = 'extension-lighting'
for (const [y, circuit] of [
  [3.00, 'house-interior-lower'], [5.82, 'house-interior-upper'],
  [5.72, 'house-exterior'],
]) {
  // The upstairs fixture sits below the restored front ceiling.
  const z = circuit === 'house-exterior' ? E.back + 0.38
    : circuit === 'house-interior-upper' ? extensionCeilingZ : 10.0
  prim('cylinder', { size: [0.16, 0.16, 0.045], position: [0, y, z],
    color: C.iron, metalness: 0.55 }, 'ceiling-trim')
  const lens = prim('cylinder', { size: [0.115, 0.115, 0.012],
    position: [0, y - 0.03, z], color: '#ffe0af', emissive: '#ffd29a',
    emissiveIntensity: 0.5, castShadow: false }, 'ceiling-lens')
  addCircuitLens(circuit, lens, 0.5)
  spot([0, y - 0.045, z], false, 10, 10, 'extension-downlight', null, circuit)
}

// Three independent, persistent circuits for the new wall controls.
// An app.emit() reaches world.on() on the same server; server app.send() then
// synchronizes the real light intensities and lens glow on every client.
const appliedLighting = {}
function applyHouseLighting(lighting) {
  for (const circuit of houseLightCircuits) {
    const on = lighting?.[circuit] !== false
    if (appliedLighting[circuit] === on) continue
    appliedLighting[circuit] = on
    for (const { light, intensity } of circuitFixtures[circuit].lights) {
      light.intensity = on ? intensity : 0
      if (typeof light.refreshShadow === 'function') light.refreshShadow()
    }
    for (const { lens, emissiveIntensity } of circuitFixtures[circuit].lenses) {
      lens.emissiveIntensity = on ? emissiveIntensity : 0
      lens.color = on ? '#ffe0af' : '#695f52'
    }
  }
}
const defaultLighting = {}
for (const circuit of houseLightCircuits) defaultLighting[circuit] = true
if (world.isServer) {
  if (!app.state?.lighting) {
    app.state = { ...(app.state || {}), lighting: { ...defaultLighting, ...(props.initialLighting || {}) } }
  }
  world.on('larch-house-light-command', message => {
    if (!message || !houseLightCircuits.includes(message.channel) || typeof message.on !== 'boolean') return
    const lighting = { ...defaultLighting, ...app.state.lighting, [message.channel]: message.on }
    app.state = { ...(app.state || {}), lighting }
    applyHouseLighting(lighting)
    app.send('larch-house-light-state', { lighting })
  })
  applyHouseLighting(app.state.lighting)
  // Supports either startup order without polling or resetting saved switch state.
  app.emit('larch-house-light-request', {})
}
if (world.isClient) {
  applyHouseLighting({ ...defaultLighting, ...(props.initialLighting || {}), ...(app.state?.lighting || {}) })
  app.on('larch-house-light-state', message => {
    if (message?.lighting) applyHouseLighting(message.lighting)
  })
}

// The same app-owned structural boxes used by walls and floors also block
// native camera sweeps. One shape per ceiling; the rear roof stays exposed.
const roomCeilingColliders = bedrooms.map((r, i) =>
  collisionBox([r.right - r.left, 0.14, 3.15],
    [(r.left + r.right) / 2, 5.98, 5.775], [0, 0, 0], `room-ceiling-${i + 1}`))
roomCeilingColliders.push(collisionBox([5.70, 0.14, extensionCeilingDepth],
  [0, 5.98, extensionCeilingZ], [0, 0, 0], 'extension-front-ceiling'))
app.on('transform', changed => {
  if (!changed.scale) return
  // Native actor movement updates the pose; scale edits need new shape sizes.
  for (const collider of roomCeilingColliders) {
    collider.physics = null
    collider.physics = 'static'
  }
})
