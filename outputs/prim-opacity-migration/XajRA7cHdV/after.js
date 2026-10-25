const PI = Math.PI

app.configure([
  { type: 'range', key: 'lightIntensity', label: 'Light intensity', min: 0, max: 220, step: 0.5, initial: 95 },
  { type: 'range', key: 'lightRange', label: 'Light range (m)', min: 1, max: 12, step: 0.1, initial: 6.5 },
  { type: 'range', key: 'lightDecay', label: 'Light decay', min: 0, max: 4, step: 0.05, initial: 2 },
  { type: 'range', key: 'flickerStrength', label: 'Flicker strength', min: 0, max: 0.5, step: 0.01, initial: 0.12 },
  { type: 'range', key: 'flickerSpeed', label: 'Flicker speed', min: 0.1, max: 3, step: 0.01, initial: 1 },
  { type: 'color', key: 'lightColor', label: 'Light color', initial: '#ffbf67' },
  { type: 'toggle', key: 'castLightShadows', label: 'Cast light shadows', initial: false },
])

const lightBaseIntensity = Math.max(0, Number(props.lightIntensity ?? 95))
const lightRange = Math.max(0.1, Number(props.lightRange ?? 6.5))
const lightDecay = Math.max(0, Number(props.lightDecay ?? 2))
const flickerStrength = Math.max(0, Number(props.flickerStrength ?? 0.12))
const flickerSpeed = Math.max(0.01, Number(props.flickerSpeed ?? 1))
const lampColor = props.lightColor || '#ffbf67'

const iron = '#23262a'
const iron2 = '#353a3e'
const brass = '#b78a3a'
const brassDark = '#76501f'
const copper = '#9e5933'
const copperDark = '#63351f'
const glass = '#f2d7a1'
const warm = '#ffb04a'
const cream = '#ead9aa'
const red = '#8b2f25'

function prim(type, size, position, color, extra = {}) {
  const node = app.create('prim', {
    type,
    size,
    position,
    color,
    metalness: 0.65,
    roughness: 0.38,
    castShadow: true,
    receiveShadow: true,
    ...extra,
  })
  app.add(node)
  return node
}

function ring(radius, tube, y, color = brass, x = 0, z = 0, extra = {}) {
  return prim('torus', [radius, tube], [x, y, z], color, {
    rotation: [PI / 2, 0, 0],
    metalness: 0.82,
    roughness: 0.27,
    ...extra,
  })
}

function pipeY(x, y, z, radius, height, color = copper, extra = {}) {
  return prim('cylinder', [radius, radius, height], [x, y, z], color, extra)
}

function barXY(x1, y1, x2, y2, z, thickness, color, extra = {}) {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = -Math.atan2(dx, dy)
  return prim('cylinder', [thickness, thickness, length], [(x1 + x2) / 2, (y1 + y2) / 2, z], color, {
    rotation: [0, 0, angle],
    ...extra,
  })
}

function barX(x, y, z, length, thickness, color, extra = {}) {
  return prim('cylinder', [thickness, thickness, length], [x, y, z], color, {
    rotation: [0, 0, PI / 2],
    ...extra,
  })
}

function barZ(x, y, z, length, thickness, color, extra = {}) {
  return prim('cylinder', [thickness, thickness, length], [x, y, z], color, {
    rotation: [PI / 2, 0, 0],
    ...extra,
  })
}

// Ground contact and stepped cast-iron base. Base rests at prompt-box base Y=-0.5.
prim('cylinder', [0.34, 0.34, 0.10], [0, -0.45, 0], iron, { physics: 'static', roughness: 0.58 })
prim('cylinder', [0.30, 0.32, 0.10], [0, -0.35, 0], iron2, { physics: 'static', roughness: 0.5 })
prim('cylinder', [0.24, 0.28, 0.13], [0, -0.235, 0], brassDark, { metalness: 0.8, roughness: 0.32 })
ring(0.255, 0.024, -0.285, brass)
ring(0.23, 0.020, -0.165, brass)

// Rivets around the base.
for (let i = 0; i < 8; i++) {
  const a = i * PI / 4
  prim('sphere', [0.024], [Math.cos(a) * 0.27, -0.385, Math.sin(a) * 0.27], brass, {
    metalness: 0.9,
    roughness: 0.22,
  })
}

// Main iron column and ornamental sleeves.
prim('cylinder', [0.105, 0.12, 1.55], [0, 0.61, 0], iron, {
  physics: 'static',
  roughness: 0.48,
})
prim('cylinder', [0.135, 0.15, 0.22], [0, -0.01, 0], iron2, { roughness: 0.45 })
ring(0.132, 0.018, 0.08, brass)
ring(0.122, 0.015, 0.44, brass)
ring(0.122, 0.015, 0.82, brass)
ring(0.132, 0.018, 1.20, brass)

// Twin external copper steam pipes with brass clamps.
for (const x of [-0.16, 0.16]) {
  pipeY(x, 0.57, 0.015, 0.027, 1.20, copper, { metalness: 0.75, roughness: 0.3 })
  for (const y of [0.18, 0.58, 0.98]) {
    ring(0.036, 0.009, y, brass, x, 0.015)
  }
  barXY(x, 1.14, x * 0.48, 1.30, 0.015, 0.026, copper)
}

// Small pressure tank / regulator body.
prim('cylinder', [0.10, 0.10, 0.23], [0, 0.54, -0.14], brassDark, {
  rotation: [PI / 2, 0, 0],
  metalness: 0.78,
  roughness: 0.3,
})
ring(0.105, 0.014, 0.54, brass, 0, -0.245, { rotation: [0, 0, 0] })

// Front pressure gauge: bezel, cream face, hub, needle and tiny tick marks.
prim('cylinder', [0.105, 0.105, 0.035], [0, 0.78, -0.128], iron2, {
  rotation: [PI / 2, 0, 0],
  metalness: 0.72,
  roughness: 0.32,
})
prim('cylinder', [0.089, 0.089, 0.012], [0, 0.78, -0.151], cream, {
  rotation: [PI / 2, 0, 0],
  metalness: 0.05,
  roughness: 0.72,
})
prim('sphere', [0.015], [0, 0.78, -0.165], brass, { metalness: 0.9, roughness: 0.2 })
prim('box', [0.012, 0.075, 0.008], [0.023, 0.806, -0.171], red, {
  rotation: [0, 0, -0.72],
  metalness: 0.25,
  roughness: 0.45,
})
for (let i = 0; i < 9; i++) {
  const a = -1.15 + i * (2.3 / 8)
  const r = 0.068
  prim('box', [0.006, 0.018, 0.006], [Math.sin(a) * r, 0.78 + Math.cos(a) * r, -0.169], iron, {
    rotation: [0, 0, -a],
    metalness: 0.5,
    roughness: 0.45,
  })
}

// Side valve wheel with spokes.
prim('torus', [0.095, 0.013], [0.205, 0.37, 0], red, {
  rotation: [0, PI / 2, 0],
  metalness: 0.72,
  roughness: 0.34,
})
barZ(0.205, 0.37, 0, 0.15, 0.008, red)
barXY(0.205, 0.295, 0.205, 0.445, 0, 0.008, red, { rotation: [0, PI / 2, 0] })
prim('cylinder', [0.026, 0.026, 0.07], [0.205, 0.37, 0], brass, {
  rotation: [0, 0, PI / 2],
  metalness: 0.88,
  roughness: 0.23,
})

// Ornamental gear on rear of the pole.
prim('torus', [0.10, 0.022], [0, 0.97, 0.135], brassDark, {
  metalness: 0.84,
  roughness: 0.28,
})
for (let i = 0; i < 10; i++) {
  const a = i * 2 * PI / 10
  prim('box', [0.035, 0.018, 0.032], [Math.cos(a) * 0.118, 0.97 + Math.sin(a) * 0.118, 0.135], brass, {
    rotation: [0, 0, a],
    metalness: 0.84,
    roughness: 0.28,
  })
}
prim('sphere', [0.026], [0, 0.97, 0.135], copper, { metalness: 0.82, roughness: 0.3 })

// Decorative transition crown and braces supporting the lantern.
prim('cylinder', [0.19, 0.14, 0.16], [0, 1.43, 0], iron2, { roughness: 0.42 })
ring(0.19, 0.022, 1.36, brass)
ring(0.17, 0.018, 1.51, brass)
barXY(-0.25, 1.52, -0.13, 1.72, 0, 0.025, iron2)
barXY(0.25, 1.52, 0.13, 1.72, 0, 0.025, iron2)
barX(0, 1.54, 0, 0.52, 0.024, brassDark)
for (const x of [-0.255, 0.255]) {
  prim('sphere', [0.032], [x, 1.54, 0], brass, { metalness: 0.9, roughness: 0.22 })
}

// Lantern lower tray.
prim('cylinder', [0.29, 0.25, 0.08], [0, 1.72, 0], iron, {
  physics: 'static',
  roughness: 0.46,
})
ring(0.268, 0.018, 1.755, brass)
prim('cylinder', [0.235, 0.255, 0.07], [0, 1.795, 0], brassDark, {
  metalness: 0.8,
  roughness: 0.31,
})

// Four lantern corner uprights and glass panes.
for (const x of [-0.205, 0.205]) {
  for (const z of [-0.205, 0.205]) {
    pipeY(x, 2.005, z, 0.018, 0.44, brass, { metalness: 0.88, roughness: 0.23 })
    prim('sphere', [0.026], [x, 1.80, z], brass, { metalness: 0.9, roughness: 0.2 })
    prim('sphere', [0.026], [x, 2.215, z], brass, { metalness: 0.9, roughness: 0.2 })
  }
}

// Thin transparent glass enclosure.
const glassPanels = [
  [[0, 2.01, -0.215], [0.38, 0.38, 0.012]],
  [[0, 2.01, 0.215], [0.38, 0.38, 0.012]],
  [[-0.215, 2.01, 0], [0.012, 0.38, 0.38]],
  [[0.215, 2.01, 0], [0.012, 0.38, 0.38]],
]
for (const [position, size] of glassPanels) {
  prim('box', size, position, '#f5d99b', {
    opacity: 0.17,
    metalness: 0.0,
    roughness: 0.06,
    castShadow: false,
  })
}

// Gas burner assembly and animated luminous mantle.
prim('cylinder', [0.075, 0.095, 0.10], [0, 1.83, 0], copperDark, { metalness: 0.78, roughness: 0.31 })
prim('cylinder', [0.038, 0.050, 0.18], [0, 1.94, 0], brass, { metalness: 0.82, roughness: 0.24 })
const flame = prim('sphere', [0.095], [0, 2.045, 0], warm, {
  scale: [0.72, 1.45, 0.72],
  emissive: '#ff8a24',
  emissiveIntensity: 7.0,
  metalness: 0,
  roughness: 0.2,
  castShadow: false,
})
const glow1 = prim('sphere', [0.17], [0, 2.045, 0], '#ffc46b', {
  opacity: 0.10,
  emissive: '#ffad42',
  emissiveIntensity: 3.2,
  metalness: 0,
  roughness: 1,
  castShadow: false,
  receiveShadow: false,
})
const glow2 = prim('sphere', [0.25], [0, 2.045, 0], '#ffcb78', {
  opacity: 0.040,
  emissive: '#ffaf45',
  emissiveIntensity: 1.8,
  metalness: 0,
  roughness: 1,
  castShadow: false,
  receiveShadow: false,
})
const lamp = app.create('light', {
  type: 'point',
  position: [0, 2.03, 0],
  color: lampColor,
  intensity: lightBaseIntensity,
  distance: lightRange,
  decay: lightDecay,
  castShadow: props.castLightShadows === true,
})
app.add(lamp)

// Upper lantern cap, vents, chimney and finial.
prim('cylinder', [0.29, 0.25, 0.08], [0, 2.26, 0], iron, { roughness: 0.46 })
ring(0.268, 0.018, 2.225, brass)
prim('cone', [0.30, 0.23], [0, 2.405, 0], iron2, { roughness: 0.43 })
ring(0.15, 0.015, 2.34, brass)
prim('cylinder', [0.065, 0.078, 0.16], [0, 2.56, 0], copperDark, { metalness: 0.8, roughness: 0.29 })
ring(0.075, 0.012, 2.49, brass)
for (let i = 0; i < 6; i++) {
  const a = i * PI / 3
  prim('box', [0.025, 0.07, 0.018], [Math.cos(a) * 0.067, 2.56, Math.sin(a) * 0.067], iron, {
    rotation: [0, -a, 0],
    roughness: 0.44,
  })
}
prim('sphere', [0.065], [0, 2.685, 0], brass, { metalness: 0.9, roughness: 0.2 })
prim('cone', [0.05, 0.14], [0, 2.79, 0], brassDark, { metalness: 0.85, roughness: 0.25 })

// Four ornamental scroll-like corner braces below the lantern.
for (const s of [-1, 1]) {
  barXY(0.10 * s, 1.60, 0.27 * s, 1.72, -0.15, 0.014, copper)
  barXY(0.27 * s, 1.72, 0.20 * s, 1.84, -0.15, 0.014, copper)
}

// Subtle warm pool on the ground to visually sell local illumination.
const pool = prim('plane', [0.86, 0.86], [0, -0.495, 0], '#ffb65c', {
  rotation: [-PI / 2, 0, 0],
  opacity: 0.085,
  emissive: '#ff9e34',
  emissiveIntensity: 2.0,
  metalness: 0,
  roughness: 1,
  doubleside: true,
  castShadow: false,
  receiveShadow: false,
})

// Animate brightness in place; changing opacity rebuilds primitive meshes.
// Visual flicker belongs only to clients, not the server simulation.
let t = 0
if (world.isClient) app.on('update', dt => {
  t += dt
  const tt = t * flickerSpeed
  const flicker = 0.92 + Math.sin(tt * 7.1) * 0.035 + Math.sin(tt * 13.7) * 0.025 + Math.sin(tt * 29.3) * 0.012
  const flickerScale = 1 + (flicker - 0.92) * (flickerStrength / 0.08)
  flame.emissiveIntensity = 7.0 * flickerScale
  flame.scale.y = 1.45 * (0.96 + Math.sin(tt * 10.7) * 0.04)
  glow1.emissiveIntensity = 3.2 * flickerScale
  glow2.emissiveIntensity = 1.8 * flickerScale
  pool.emissiveIntensity = 2.0 * flickerScale
  lamp.intensity = lightBaseIntensity * flickerScale
})
