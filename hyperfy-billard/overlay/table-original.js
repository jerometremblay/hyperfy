// Realistic 8 ft pool table using primitive and extrusion pieces.
// Coordinates: +Y up, +X right, -Z forward. The app origin is the prompt-box center.
// The app/root origin is the physical contact plane: local Y=0 is the bottom of the feet.

// Expose shadow controls on all visible construction geometry.
// Keep physically invisible colliders and intentionally unshadowed details excluded.
app.configure([
  { type: 'section', label: 'Lighting and shadows' },
  { type: 'toggle', key: 'castShadows', label: 'Cast shadows', initial: true, hint: 'Allow this object to cast shadows from nearby light sources' },
  { type: 'toggle', key: 'receiveShadows', label: 'Receive shadows', initial: true, hint: 'Show shadows from other objects on this object' },
])
const SHADOW_CASTING = props.castShadows !== false
const SHADOW_RECEIVING = props.receiveShadows !== false

const WOOD = '#4a2414'
const WOOD_DARK = '#2f170d'
const WOOD_EDGE = '#6f3b22'
const FELT = '#1f7f39'
const FELT_DARK = '#16662d'
const CUSHION = '#1b7332'
const POCKET = '#080808'
const LEATHER = '#3a2316'
const METAL = '#b89d69'
const IVORY = '#e8dec6'

app.resetOnMove = false

// The original prompt-box build used Y=-0.5 as its base. Shift every authored
// primitive up by 0.5 m so the app root itself is now the contact plane.
const ROOT_Y_OFFSET = 0.5
const detachedColliders = []

function exactWorldTransform(node) {
  const position = node.position.clone().multiply(app.scale).applyQuaternion(app.quaternion).add(app.position)
  const quaternion = app.quaternion.clone().multiply(node.quaternion)
  const scale = node.scale.clone().multiply(app.scale)
  return { position, quaternion, scale }
}

function rebuildPhysics(node) {
  const physics = node.physics
  if (!physics) return
  node.physics = null
  node.physics = physics
}

function attachStaticBoxCollider(node, size) {
  const initial = exactWorldTransform(node)
  const collider = app.create('prim', {
    type: 'box',
    size,
    position: initial.position.toArray(),
    quaternion: initial.quaternion.toArray(),
    scale: initial.scale.toArray(),
    opacity: 0,
    castShadow: false,
    receiveShadow: false,
    physics: 'static',
  })
  world.add(collider)
  detachedColliders.push(collider)

  const lastScale = initial.scale.clone()
  function syncCollider() {
    const transform = exactWorldTransform(node)
    const scaleChanged = !lastScale.equals(transform.scale)
    collider.position.copy(transform.position)
    collider.quaternion.copy(transform.quaternion)
    collider.scale.copy(transform.scale)
    if (scaleChanged) {
      lastScale.copy(transform.scale)
      rebuildPhysics(collider)
    }
  }
  app.on('update', syncCollider)
}

app.on('destroy', () => {
  for (const collider of detachedColliders) world.remove(collider)
})

function prim(type, options) {
  const { physics = null, position = [0, 0, 0], ...rest } = options
  const shiftedPosition = [position[0], position[1] + ROOT_Y_OFFSET, position[2]]
  const node = app.create('prim', {
    type,
    physics: null,
    position: shiftedPosition,
    ...rest,
    castShadow: SHADOW_CASTING && rest.castShadow !== false && (rest.opacity ?? 1) > 0,
    receiveShadow: SHADOW_RECEIVING && rest.receiveShadow !== false && (rest.opacity ?? 1) > 0,
  })
  app.add(node)

  // Use a small structural collision set instead of one body per decorative piece.
  if (physics === 'static' && type === 'box') attachStaticBoxCollider(node, rest.size)
  return node
}

function box(size, position, color, extra = {}) {
  return prim('box', {
    size,
    position,
    color,
    roughness: 0.58,
    metalness: 0.02,
    ...extra,
  })
}

function sphere(radius, position, color, extra = {}) {
  return prim('sphere', {
    size: [radius],
    position,
    color,
    roughness: 0.22,
    metalness: 0.02,
    ...extra,
  })
}

function cylinder(radiusTop, radiusBottom, height, position, color, extra = {}) {
  return prim('cylinder', {
    size: [radiusTop, radiusBottom, height],
    position,
    color,
    roughness: 0.42,
    metalness: 0.05,
    ...extra,
  })
}

function extrude(profile, depth, position, rotation, color, extra = {}) {
  return prim('extrude', {
    profile,
    depth,
    bevelEnabled: true,
    bevelThickness: extra.bevelThickness ?? 0.008,
    bevelSize: extra.bevelSize ?? 0.008,
    bevelSegments: extra.bevelSegments ?? 2,
    curveSegments: extra.curveSegments ?? 6,
    position,
    rotation,
    color,
    roughness: 0.55,
    metalness: 0.02,
    ...extra,
  })
}

const outerL = 2.54
const outerW = 1.42
const bedL = 2.24
const bedW = 1.12
const baseY = -0.5 // authored-space base; becomes local Y=0 after ROOT_Y_OFFSET
const railTop = 0.286
const feltTop = 0.207
const slateTop = 0.197
const pocketMouthY = feltTop + 0.004
const ballR = 0.0286

// Cabinet and slate support.
box([2.38, 0.20, 1.26], [0, 0.135, 0], WOOD_DARK, { physics: 'static' })
box([2.48, 0.08, 1.34], [0, 0.225, 0], WOOD)
box([bedL, 0.020, bedW], [0, slateTop - 0.010, 0], '#7d807d', { roughness: 0.86 })
box([bedL, 0.016, bedW], [0, feltTop - 0.008, 0], FELT, { roughness: 0.97 })

// Side aprons.
box([2.40, 0.20, 0.08], [0, 0.055, 0.635], WOOD)
box([2.40, 0.20, 0.08], [0, 0.055, -0.635], WOOD)
box([0.08, 0.20, 1.10], [1.195, 0.055, 0], WOOD)
box([0.08, 0.20, 1.10], [-1.195, 0.055, 0], WOOD)

// Extruded top rails with a more realistic bevel profile.
const railProfile = [
  [-0.075, -0.030],
  [ 0.075, -0.030],
  [ 0.075, -0.010],
  [ 0.050,  0.020],
  [ 0.020,  0.036],
  [-0.020,  0.036],
  [-0.050,  0.020],
  [-0.075, -0.010],
]

function railSegment(length, position, alongX) {
  extrude(
    railProfile,
    length,
    position,
    alongX ? [0, Math.PI / 2, 0] : [0, 0, 0],
    WOOD_EDGE,
    {
      roughness: 0.48,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      curveSegments: 8,
    }
  )
}

const longRailZ = 0.645
const longSegLen = 1.10
for (const z of [-longRailZ, longRailZ]) {
  railSegment(longSegLen, [-0.625, 0.252, z], true)
  railSegment(longSegLen, [0.625, 0.252, z], true)
}
railSegment(1.04, [1.205, 0.252, 0], false)
railSegment(1.04, [-1.205, 0.252, 0], false)

// Extruded cushion noses.
const cushionProfile = [
  [-0.035, -0.020],
  [ 0.035, -0.020],
  [ 0.018,  0.025],
  [-0.018,  0.025],
]
function cushionSegment(length, position, alongX) {
  extrude(
    cushionProfile,
    length,
    position,
    alongX ? [0, Math.PI / 2, 0] : [0, 0, 0],
    CUSHION,
    {
      roughness: 0.90,
      bevelThickness: 0.004,
      bevelSize: 0.004,
    }
  )
}
for (const z of [-0.574, 0.574]) {
  cushionSegment(0.96, [-0.575, 0.225, z], true)
  cushionSegment(0.96, [0.575, 0.225, z], true)
}
cushionSegment(0.92, [1.145, 0.225, 0], false)
cushionSegment(0.92, [-1.145, 0.225, 0], false)

// Pocket liner jaw pieces made with extrusions.
const jawProfile = [
  [-0.055, -0.006],
  [ 0.055, -0.006],
  [ 0.024,  0.018],
  [-0.024,  0.018],
]
const jawProfileShort = [
  [-0.040, -0.006],
  [ 0.040, -0.006],
  [ 0.018,  0.018],
  [-0.018,  0.018],
]

function cornerPocket(sx, sz) {
  const x = sx * 1.115
  const z = sz * 0.555

  // Main mouth and throat.
  cylinder(0.086, 0.076, 0.022, [x, pocketMouthY, z], POCKET, { roughness: 0.96 })
  cylinder(0.052, 0.070, 0.18, [sx * 1.135, 0.112, sz * 0.575], LEATHER, { roughness: 0.88 })

  // Felt-covered jaws that visually taper into the hole.
  extrude(jawProfile, 0.19, [sx * 0.960, feltTop + 0.006, sz * 0.510], [0, Math.PI / 2, 0], FELT_DARK, {
    roughness: 0.96,
    bevelThickness: 0.003,
    bevelSize: 0.003,
  })
  extrude(jawProfile, 0.19, [sx * 1.050, feltTop + 0.006, sz * 0.420], [0, 0, 0], FELT_DARK, {
    roughness: 0.96,
    bevelThickness: 0.003,
    bevelSize: 0.003,
  })
  extrude(jawProfileShort, 0.16, [sx * 1.005, feltTop + 0.006, sz * 0.505], [0, -sx * sz * Math.PI / 4, 0], FELT_DARK, {
    roughness: 0.96,
    bevelThickness: 0.003,
    bevelSize: 0.003,
  })

  // Leather drop panels under the opening.
  extrude(jawProfileShort, 0.18, [sx * 1.110, 0.146, sz * 0.555], [Math.PI / 2, -sx * sz * Math.PI / 4, 0], LEATHER, {
    roughness: 0.84,
    bevelThickness: 0.002,
    bevelSize: 0.002,
  })
}

function sidePocket(sz) {
  const z = sz * 0.565

  cylinder(0.080, 0.072, 0.022, [0, pocketMouthY, z], POCKET, { roughness: 0.96 })
  cylinder(0.050, 0.064, 0.16, [0, 0.120, sz * 0.600], LEATHER, { roughness: 0.88 })

  extrude(jawProfile, 0.34, [-0.245, feltTop + 0.006, z - sz * 0.035], [0, Math.PI / 2, 0], FELT_DARK, {
    roughness: 0.96,
    bevelThickness: 0.003,
    bevelSize: 0.003,
  })
  extrude(jawProfile, 0.34, [0.245, feltTop + 0.006, z - sz * 0.035], [0, Math.PI / 2, 0], FELT_DARK, {
    roughness: 0.96,
    bevelThickness: 0.003,
    bevelSize: 0.003,
  })
  extrude(jawProfileShort, 0.16, [0, feltTop + 0.006, z - sz * 0.090], [0, 0, 0], FELT_DARK, {
    roughness: 0.96,
    bevelThickness: 0.003,
    bevelSize: 0.003,
  })
  extrude(jawProfileShort, 0.16, [0, 0.150, sz * 0.585], [Math.PI / 2, 0, 0], LEATHER, {
    roughness: 0.84,
    bevelThickness: 0.002,
    bevelSize: 0.002,
  })
}

for (const sx of [-1, 1]) {
  for (const sz of [-1, 1]) cornerPocket(sx, sz)
}
for (const sz of [-1, 1]) sidePocket(sz)

// Brass corner and side trims.
for (const [x, z] of [[-1.245,-0.67],[1.245,-0.67],[-1.245,0.67],[1.245,0.67]]) {
  box([0.10, 0.018, 0.10], [x, railTop + 0.009, z], METAL, { metalness: 0.68, roughness: 0.28 })
}
for (const z of [-0.68, 0.68]) {
  box([0.16, 0.016, 0.08], [0, railTop + 0.008, z], METAL, { metalness: 0.68, roughness: 0.28 })
}

// Rail sights.
for (const z of [-0.654, 0.654]) {
  for (const x of [-0.92, -0.61, -0.31, 0.31, 0.61, 0.92]) {
    sphere(0.010, [x, railTop + 0.012, z], IVORY, { roughness: 0.35 })
  }
}
for (const x of [-1.215, 1.215]) {
  for (const z of [-0.37, -0.12, 0.12, 0.37]) {
    sphere(0.010, [x, railTop + 0.012, z], IVORY, { roughness: 0.35 })
  }
}

// Legs and leveler feet.
for (const x of [-1.00, 1.00]) {
  for (const z of [-0.47, 0.47]) {
    box([0.23, 0.49, 0.23], [x, -0.205, z], WOOD_DARK, { physics: 'static' })
    extrude(
      [
        [-0.145, -0.035],
        [ 0.145, -0.035],
        [ 0.115,  0.035],
        [-0.115,  0.035],
      ],
      0.29,
      [x, -0.455, z],
      [0, 0, 0],
      WOOD,
      { bevelThickness: 0.005, bevelSize: 0.005 }
    )
    cylinder(0.075, 0.070, 0.02, [x, baseY + 0.01, z], METAL, { metalness: 0.72, roughness: 0.24 })
  }
}

// Low stretchers.
box([1.68, 0.10, 0.10], [0, -0.265, 0], WOOD_DARK)
box([0.10, 0.10, 0.76], [0, -0.265, 0], WOOD_DARK)

// Cue ball.
sphere(ballR, [-0.58, feltTop + ballR + 0.002, 0.05], '#f5f2e8', { roughness: 0.20 })

// Fifteen-ball rack.
const ballColors = [
  '#f0c419', '#2358a5', '#c8332d', '#623789', '#e06a20',
  '#2f7a42', '#8b2f2b', '#1d1d1d', '#f0c419', '#2358a5',
  '#c8332d', '#623789', '#e06a20', '#2f7a42', '#8b2f2b',
]
let colorIndex = 0
const rowStep = ballR * 1.82
const colStep = ballR * 2.05
for (let row = 0; row < 5; row++) {
  const x = 0.39 + row * rowStep
  for (let col = 0; col <= row; col++) {
    const z = (col - row / 2) * colStep
    sphere(ballR, [x, feltTop + ballR + 0.002, z], ballColors[colorIndex++], { roughness: 0.19 })
  }
}

// Maker plate.
box([0.26, 0.07, 0.012], [0, 0.055, -0.681], '#b08d57', { metalness: 0.60, roughness: 0.26 })
