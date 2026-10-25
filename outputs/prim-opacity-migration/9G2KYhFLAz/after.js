const PI = Math.PI
const baseY = -0.5

// Configurable real-time illumination, independent from the visible flames.
app.configure([
  { type: 'toggle', key: 'lightEnabled', label: 'Emit light', initial: true },
  { type: 'range', key: 'lightIntensity', label: 'Light intensity', min: 0, max: 400, step: 0.5, initial: 110 },
  { type: 'range', key: 'lightDistance', label: 'Light range (m)', min: 1, max: 15, step: 0.1, initial: 7 },
  { type: 'range', key: 'flickerStrength', label: 'Flicker strength', min: 0, max: 0.7, step: 0.01, initial: 0.18 },
  { type: 'range', key: 'flickerSpeed', label: 'Flicker speed', min: 0, max: 3, step: 0.05, initial: 1 },
  { type: 'range', key: 'lightHeight', label: 'Light height over base (m)', min: 0.1, max: 1.3, step: 0.01, initial: 0.53 },
  { type: 'color', key: 'fireLightColor', label: 'Fire light color', initial: '#ff923c' },
  { type: 'toggle', key: 'castFireShadows', label: 'Cast light shadows', initial: false },
])

const lightEnabled = props.lightEnabled !== false
const lightIntensity = Math.max(0, Number(props.lightIntensity ?? 110))
const flickerStrength = Math.max(0, Math.min(0.7, Number(props.flickerStrength ?? 0.18)))
const flickerSpeed = Math.max(0, Number(props.flickerSpeed ?? 1))

function prim(options) {
  const node = app.create('prim', options)
  app.add(node)
  return node
}

// Burnt earth / ash bed.
prim({
  type: 'cylinder', size: [0.62, 0.62, 0.028],
  position: [0, baseY + 0.014, 0],
  color: '#2d2620', roughness: 1, physics: null,
  castShadow: false, receiveShadow: true
})
prim({
  type: 'cylinder', size: [0.43, 0.43, 0.032],
  position: [0, baseY + 0.031, 0],
  color: '#4a3326', roughness: 1, physics: null,
  castShadow: false, receiveShadow: true
})

// Stone fire ring.
for (let i = 0; i < 12; i++) {
  const a = i * PI * 2 / 12
  const r = 0.49
  prim({
    type: 'sphere', size: [0.145],
    position: [Math.sin(a) * r, baseY + 0.105, Math.cos(a) * r],
    scale: [1.25, 0.72, 0.95],
    rotation: [0, a, 0],
    color: i % 3 === 0 ? '#746d62' : (i % 3 === 1 ? '#655f56' : '#81796d'),
    roughness: 1, metalness: 0, physics: 'static'
  })
}

// Crossed burning logs.
const fireLogs = []
function burningLog(y, angle, length, radius) {
  const g = app.create('group', { position: [0, y, 0], rotation: [0, angle, 0] })
  const log = app.create('prim', {
    type: 'cylinder', size: [radius * 0.88, radius, length],
    rotation: [0, 0, PI / 2],
    color: '#5b2f1b', roughness: 0.95, physics: 'static'
  })
  // cylinder is vertical by default; rotate into X, then the group turns it in XZ.
  g.add(log)
  app.add(g)
  fireLogs.push(log)
}
burningLog(baseY + 0.19, PI / 4, 0.86, 0.095)
burningLog(baseY + 0.19, -PI / 4, 0.86, 0.095)
burningLog(baseY + 0.30, PI / 4 + PI / 2, 0.72, 0.082)
burningLog(baseY + 0.30, -PI / 4 + PI / 2, 0.72, 0.082)

// Hot coals.
for (let i = 0; i < 9; i++) {
  const a = i * PI * 2 / 9 + 0.25
  const r = 0.12 + (i % 3) * 0.055
  prim({
    type: 'sphere', size: [0.048 + (i % 2) * 0.012],
    position: [Math.sin(a) * r, baseY + 0.145 + (i % 2) * 0.025, Math.cos(a) * r],
    scale: [1.25, 0.72, 1],
    color: '#7a210b', emissive: '#ff3b0a', emissiveIntensity: 3.5,
    roughness: 0.9, physics: null
  })
}

// Layered, animated flames. Keep the animation modest and deterministic.
const flames = []
const flameData = [
  [-0.10, 0.00, 0.14, 0.43, '#ff6a00', '#ff3300', 5.4, 0.0],
  [ 0.11, 0.03, 0.13, 0.38, '#ff8c00', '#ff4a00', 5.8, 1.1],
  [ 0.02,-0.10, 0.12, 0.34, '#ffb000', '#ff6900', 6.5, 2.0],
  [-0.03, 0.12, 0.10, 0.31, '#ffd35a', '#ff8a00', 7.2, 2.8],
  [ 0.15,-0.10, 0.085,0.27, '#ffdf7a', '#ff9d00', 7.8, 3.7],
  [-0.15,-0.09, 0.09, 0.29, '#ffa014', '#ff5200', 6.2, 4.5],
  [ 0.00, 0.02, 0.075,0.36, '#fff0a0', '#ffb000', 8.0, 5.4]
]
for (let i = 0; i < flameData.length; i++) {
  const d = flameData[i]
  const f = prim({
    type: 'cone', size: [d[2], d[3]],
    position: [d[0], baseY + 0.28 + d[3] / 2, d[1]],
    color: d[4], emissive: d[5], emissiveIntensity: d[6],
    opacity: 0.78,
    roughness: 0.6, metalness: 0, physics: null,
    castShadow: false, receiveShadow: false
  })
  flames.push({ node: f, base: d[6], phase: d[7] })
}

// One point light at the heart of the flames illuminates the surrounding
// logs, stone ring and seating. Keep it in the app hierarchy so it follows
// the campfire when the app is moved or rotated.
const fireLight = app.create('light', {
  type: 'point',
  position: [0, baseY + Number(props.lightHeight ?? 0.53), 0],
  color: props.fireLightColor || '#ff923c',
  intensity: lightEnabled ? lightIntensity : 0,
  distance: Math.max(0.1, Number(props.lightDistance ?? 7)),
  decay: 2,
  // Shadow-casting may require the custom CSM shader fix in older Hyperfy forks.
  castShadow: props.castFireShadows === true,
})
app.add(fireLight)

let fireTime = 0
if (world.isClient) app.on('update', delta => {
  // Keep phase time bounded so the fire can run indefinitely without losing
  // floating-point resolution after a very long world session.
  fireTime = (fireTime + delta) % 10000
  for (let i = 0; i < flames.length; i++) {
    const f = flames[i]
    const pulse = 1 + Math.sin(fireTime * 7.5 + f.phase) * 0.07 + Math.sin(fireTime * 12.3 + f.phase * 1.7) * 0.035
    f.node.scale.y = pulse
    f.node.scale.x = 1 / Math.sqrt(pulse)
    f.node.scale.z = 1 / Math.sqrt(pulse)
    f.node.emissiveIntensity = f.base * (0.90 + Math.sin(fireTime * 10.5 + f.phase) * 0.10)
  }
  if (world.isClient && lightEnabled) {
    const t = fireTime * flickerSpeed
    const variation = (Math.sin(t * 8.7) * 0.7 + Math.sin(t * 14.3 + 1.8) * 0.3)
    fireLight.intensity = lightIntensity * Math.max(0, 1 + flickerStrength * variation)
  }
})

// Six seats around the fire. Their anchors face toward the origin.
const stumpRadius = 1.37
const stumpTopY = baseY + 0.43
for (let i = 0; i < 6; i++) {
  const a = i * PI * 2 / 6
  const x = Math.sin(a) * stumpRadius
  const z = Math.cos(a) * stumpRadius
  const yaw = Math.atan2(x, z)

  prim({
    type: 'cylinder', size: [0.285, 0.325, 0.41],
    position: [x, baseY + 0.205, z],
    color: i % 2 ? '#6b3d23' : '#714327',
    roughness: 1, metalness: 0, physics: 'static'
  })
  prim({
    type: 'cylinder', size: [0.279, 0.279, 0.026],
    position: [x, stumpTopY - 0.013, z],
    color: '#b4895a', roughness: 0.95, physics: null,
    castShadow: true, receiveShadow: true
  })

  // Growth rings on the cut face.
  for (let ring = 0; ring < 2; ring++) {
    prim({
      type: 'torus', size: [0.105 + ring * 0.065, 0.007],
      position: [x, stumpTopY + 0.003 + ring * 0.001, z],
      rotation: [PI / 2, 0, 0],
      color: '#765333', roughness: 1, physics: null,
      castShadow: false, receiveShadow: true
    })
  }

  // A few darker bark ridges give each stump more depth.
  for (let j = 0; j < 5; j++) {
    const ba = a + j * PI * 2 / 5 + i * 0.17
    const bx = x + Math.sin(ba) * 0.31
    const bz = z + Math.cos(ba) * 0.31
    prim({
      type: 'box', size: [0.035, 0.30 + (j % 2) * 0.045, 0.026],
      position: [bx, baseY + 0.20, bz],
      rotation: [0, ba, 0],
      color: '#4b2d1c', roughness: 1, physics: null
    })
  }

  const seat = app.create('anchor', {
    id: 'campfire-stump-seat-' + i,
    position: [x, stumpTopY + 0.012, z],
    rotation: [0, yaw, 0]
  })
  app.add(seat)

  const action = app.create('action', {
    label: 'Sit on stump',
    position: [x, stumpTopY + 0.16, z],
    distance: 1.05,
    duration: 0.12,
    onTrigger: () => {
      const player = world.getPlayer()
      if (!player) return
      action.active = false
      player.applyEffect({
        anchor: seat,
        cancellable: true,
        onEnd: () => {
          action.active = true
        }
      })
    }
  })
  app.add(action)

}

// Small pile of split firewood beside the stump at roughly 2 o'clock.
const pile = app.create('group', {
  position: [1.46, baseY, 1.30],
  rotation: [0, -0.25, 0]
})
function pileLog(x, y, z, angle, length, radius, color) {
  const g = app.create('group', { position: [x, y, z], rotation: [0, angle, 0] })
  const log = app.create('prim', {
    type: 'cylinder', size: [radius * 0.92, radius, length],
    rotation: [0, 0, PI / 2],
    color: color, roughness: 1, physics: 'static'
  })
  g.add(log)
  pile.add(g)
}
pileLog(-0.11, 0.105, -0.10,  0.10, 0.52, 0.070, '#75472a')
pileLog( 0.12, 0.105,  0.08, -0.18, 0.50, 0.068, '#694025')
pileLog(-0.02, 0.205,  0.00,  0.36, 0.46, 0.064, '#805033')
pileLog( 0.08, 0.285, -0.02, -0.32, 0.40, 0.058, '#714329')
app.add(pile)