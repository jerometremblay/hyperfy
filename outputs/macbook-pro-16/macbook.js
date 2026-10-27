/* global app, world */
// +Y up, +X right, -Z forward; local Y=0 is the rubber feet contact plane.
// The user sits on -Z. Screen-right is local -X, screen-up is lid +Y,
// and the screen's outward normal is lid -Z. The lid is offset from a low rear pivot.
// 16-inch 2019 Space Gray proportions: 357.9 × 245.9 mm.
const PI = Math.PI
const WIDTH = 0.3579
const DEPTH = 0.2459
const OPEN_ANGLE = (12 * PI) / 180
const CLOSED_ANGLE = -PI / 2
const DURATION = 0.65
const C = {
  aluminum: '#686a6d',
  edge: '#929498',
  dark: '#3a3b3d',
  black: '#101113',
  key: '#18191b',
  rubber: '#252628',
  silver: '#c4c7cb',
}

function group(id, parent, position) {
  const node = app.create('group', { id, position })
  parent.add(node)
  return node
}
function roundedRect(width, height, radius, segments = 7) {
  const points = []
  for (const [x, y, angle] of [
    [width / 2 - radius, height / 2 - radius, 0],
    [-width / 2 + radius, height / 2 - radius, PI / 2],
    [-width / 2 + radius, -height / 2 + radius, PI],
    [width / 2 - radius, -height / 2 + radius, (3 * PI) / 2],
  ]) {
    for (let i = 0; i <= segments; i++) {
      const a = angle + (i * PI) / (2 * segments)
      points.push([x + radius * Math.cos(a), y + radius * Math.sin(a)])
    }
  }
  return points
}
function extrusion(id, parent, profile, thickness, position, color, rotation, bevel = 0.0003) {
  const node = app.create('prim', {
    id,
    type: 'extrude',
    profile,
    depth: thickness,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    curveSegments: 8,
    smooth: true,
    position,
    rotation,
    color,
    metalness: 0.72,
    roughness: 0.34,
    physics: null,
    castShadow: true,
    receiveShadow: true,
  })
  parent.add(node)
  return node
}
function panel(id, parent, width, height, radius, thickness, position, color, rotation, bevel) {
  return extrusion(id, parent, roundedRect(width, height, radius), thickness, position, color, rotation, bevel)
}
function horizontal(id, width, depth, radius, thickness, position, color, bevel) {
  return panel(id, app, width, depth, radius, thickness, position, color, [PI / 2, 0, 0], bevel)
}
function label(parent, id, value, width, height, position, rotation, fontSize, color) {
  if (world.isPreview || world.isServer) return
  const ui = app.create('ui', {
    id,
    space: 'world',
    width,
    height,
    size: 0.0001,
    position,
    rotation,
    backgroundColor: 'transparent',
    pointerEvents: false,
    lit: false,
    justifyContent: 'center',
    alignItems: 'center',
  })
  ui.add(
    app.create('uitext', {
      value,
      fontSize,
      color,
      textAlign: 'center',
      fontFamily: 'Arial',
      lineHeight: 1,
    })
  )
  parent.add(ui)
}

// The underside, separate bottom-cover seam and machined top deck.
horizontal('bottom-cover', WIDTH - 0.002, DEPTH - 0.002, 0.01, 0.0018, [0, 0.0033, 0], C.dark, 0.00025)
horizontal('aluminum-unibody', WIDTH - 0.001, DEPTH - 0.001, 0.01, 0.0082, [0, 0.0079, 0], C.aluminum, 0.0005)
horizontal('top-deck', WIDTH - 0.0022, DEPTH - 0.0022, 0.0095, 0.0008, [0, 0.01245, 0], C.edge, 0.0002)
for (const x of [-0.142, 0.142]) {
  for (const z of [-0.089, 0.089]) {
    const foot = horizontal('rubber-foot', 0.018, 0.014, 0.006, 0.0018, [x, 0.00115, z], C.rubber, 0.00025)
    foot.metalness = 0
    foot.roughness = 0.86
  }
}
// Dark, inset keyboard well; keys are individually rounded extrusions.
horizontal('keyboard-recess', 0.28, 0.09, 0.003, 0.00065, [0, 0.01312, 0.043], C.black, 0)
const keyRows = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'delete'],
  ['tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'return'],
  ['shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'shift'],
  ['fn', 'ctrl', 'opt', 'cmd', '', 'cmd', 'opt', '←', '↑↓', '→'],
]
for (let row = 0; row < keyRows.length; row++) {
  const values = keyRows[row]
  const weights = values.map(value =>
    value === '' ? 5.6 : ['shift', 'caps', 'return', 'delete', 'tab'].includes(value) ? 1.65 : 1
  )
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  const pitch = 0.27 / total
  let cursor = -0.135
  for (let col = 0; col < values.length; col++) {
    const width = weights[col] * pitch - 0.0014
    const x = -(cursor + (weights[col] * pitch) / 2)
    const z = 0.076 - row * 0.0167
    const key = horizontal('key-' + row + '-' + col, width, 0.0148, 0.0015, 0.001, [x, 0.01375, z], C.key, 0.00012)
    key.metalness = 0
    key.roughness = 0.68
    if (values[col])
      label(
        app,
        'legend-' + row + '-' + col,
        values[col],
        width * 10000,
        120,
        [x, 0.01445, z],
        [-PI / 2, PI, 0],
        values[col].length > 2 ? 20 : 32,
        '#c3c6cb'
      )
    cursor += weights[col] * pitch
  }
}
// Touch Bar, separate Escape key and square Touch ID button.
horizontal('touch-bar', 0.227, 0.0065, 0.0016, 0.0005, [-0.001, 0.0135, 0.097], '#07090c', 0.0001)
horizontal('escape-key', 0.018, 0.009, 0.0015, 0.0007, [0.129, 0.0135, 0.097], C.key, 0.0001)
horizontal('touch-id', 0.015, 0.009, 0.0015, 0.0007, [-0.128, 0.0135, 0.097], C.black, 0.0001)
label(
  app,
  'touch-bar-icons',
  'esc                 ◀  ▶                 ☀      ▰       ♪',
  2250,
  60,
  [0, 0.014, 0.097],
  [-PI / 2, PI, 0],
  28,
  '#dce2ef'
)
// Speaker grilles are fine dark slots, separate from the keyboard.
for (const side of [-1, 1]) {
  for (let row = 0; row < 31; row++) {
    const slot = horizontal(
      'speaker-slot',
      0.017,
      0.00065,
      0.00025,
      0.00012,
      [side * 0.157, 0.0131, -0.002 + row * 0.0031],
      '#343537',
      0
    )
    slot.castShadow = false
  }
}
horizontal('trackpad-border', 0.161, 0.099, 0.0042, 0.00035, [0, 0.0131, -0.065], '#3a3b3e', 0)
horizontal('glass-trackpad', 0.1598, 0.0978, 0.0038, 0.0004, [0, 0.0133, -0.065], '#717377', 0)
// Front finger recess and real inset-looking USB-C port details.
panel('finger-recess', app, 0.046, 0.0031, 0.0014, 0.00015, [0, 0.0112, -DEPTH / 2 - 0.00015], '#303134', [0, PI, 0], 0)
for (const side of [-1, 1]) {
  for (const z of [0.064, 0.088]) {
    panel(
      'usb-c-rim',
      app,
      0.0095,
      0.0033,
      0.0015,
      0.0002,
      [side * (WIDTH / 2 - 0.00025), 0.0078, z],
      '#a1a3a7',
      [0, (side * PI) / 2, 0],
      0
    )
    panel(
      'usb-c-socket',
      app,
      0.008,
      0.0024,
      0.0011,
      0.00022,
      [(side * WIDTH) / 2, 0.0078, z],
      '#090a0c',
      [0, (side * PI) / 2, 0],
      0
    )
  }
}
const audio = app.create('prim', {
  id: 'headphone-jack',
  type: 'cylinder',
  size: [0.0018, 0.0018, 0.0003],
  position: [-WIDTH / 2, 0.0078, 0.029],
  rotation: [0, 0, PI / 2],
  color: '#090a0c',
  physics: null,
})
app.add(audio)

// A low rear pivot with an offset lid: flush when closed, behind the base when open.
const hingeZ = DEPTH / 2 - 0.0025
const hingeY = 0.0085
app.add(
  app.create('prim', {
    id: 'hinge-barrel',
    type: 'cylinder',
    size: [0.0025, 0.0025, 0.274],
    position: [0, hingeY, hingeZ],
    rotation: [0, 0, PI / 2],
    color: C.black,
    roughness: 0.48,
    physics: null,
  })
)
const hinge = group('lid-hinge', app, [0, hingeY, hingeZ])
panel('hinge-bridge', hinge, 0.274, 0.004, 0.001, 0.0081, [0, 0.001, 0.00405], C.black, undefined, 0)
const lid = group('display-assembly', hinge, [0, 0.002, 0.0081])
const lidHeight = DEPTH - 0.0045
panel(
  'aluminum-display-lid',
  lid,
  WIDTH - 0.0015,
  lidHeight,
  0.009,
  0.0021,
  [0, lidHeight / 2, 0],
  C.aluminum,
  undefined,
  0.00035
)
// Four open rim profiles form a rounded skirt without unsupported extrusion holes.
const outerRim = roundedRect(WIDTH - 0.0015, lidHeight, 0.009)
const innerRim = roundedRect(WIDTH - 0.0039, lidHeight - 0.0024, 0.0078)
for (let corner = 0; corner < 4; corner++) {
  const outside = []
  const inside = []
  for (let i = 0; i <= 8; i++) {
    const index = (corner * 8 + i) % outerRim.length
    outside.push(outerRim[index])
    inside.push(innerRim[index])
  }
  const profile = outside.concat(inside.reverse())
  const xs = profile.map(point => point[0])
  const ys = profile.map(point => point[1])
  // Native extrusions center the geometry on its bounds.
  const x = (Math.min(...xs) + Math.max(...xs)) / 2
  const y = (Math.min(...ys) + Math.max(...ys)) / 2
  extrusion(
    'lid-edge-skirt-' + corner,
    lid,
    profile,
    0.0022,
    [x, lidHeight / 2 + y, -0.00245],
    C.aluminum,
    undefined,
    0
  )
}
panel(
  'display-gasket',
  lid,
  WIDTH - 0.004,
  lidHeight - 0.002,
  0.008,
  0.0003,
  [0, lidHeight / 2, -0.00165],
  '#27282b',
  undefined,
  0
)
// The perimeter meets the deck at Y=13.05 mm when closed; the glass remains recessed.
for (const side of [-1, 1]) {
  panel(
    'gasket-side-' + side,
    lid,
    0.0012,
    lidHeight - 0.017,
    0.00055,
    0.0022,
    [side * (WIDTH / 2 - 0.004), lidHeight / 2, -0.00245],
    C.rubber,
    undefined,
    0
  )
  panel(
    'gasket-edge-' + side,
    lid,
    WIDTH - 0.016,
    0.0012,
    0.00055,
    0.0022,
    [0, lidHeight / 2 + side * (lidHeight / 2 - 0.004), -0.00245],
    C.rubber,
    undefined,
    0
  )
}
panel(
  'black-display-glass',
  lid,
  WIDTH - 0.0055,
  lidHeight - 0.0035,
  0.007,
  0.00035,
  [0, lidHeight / 2, -0.00195],
  '#080a0d',
  undefined,
  0
)
const screenWidth = 0.3446
const screenHeight = screenWidth / 1.6
const screenY = 0.127
const display = panel(
  'retina-screen',
  lid,
  screenWidth,
  screenHeight,
  0.0015,
  0.00012,
  [0, screenY, -0.00225],
  '#111b2a',
  undefined,
  0
)
display.emissive = '#152538'
display.emissiveIntensity = 0.3
// One packaged texture follows the lid without a browser or idle callbacks.
lid.add(
  app.create('image', {
    id: 'github-screen',
    src: 'asset://71e0ff650384fc65920f0618c894aec315971cf30311165c998ac5a809c3831b.png',
    width: screenWidth,
    height: screenHeight,
    position: [0, screenY, -0.00255],
    rotation: [0, PI, 0],
    color: '#212830',
    fit: 'contain',
    lit: false,
    doubleside: false,
    castShadow: false,
    receiveShadow: false,
  })
)
const camera = app.create('prim', {
  id: 'facetime-camera',
  type: 'sphere',
  size: [0.00115],
  position: [0, lidHeight - 0.0041, -0.0026],
  color: '#142431',
  physics: null,
})
lid.add(camera)
label(lid, 'model-name', 'MacBook Pro', 850, 55, [0, 0.0092, -0.00265], [0, PI, 0], 39, '#9fa1a5')

// Transparent logo image, packaged with the app and facing out from the lid.
lid.add(
  app.create('image', {
    id: 'apple-logo-image',
    src: 'asset://6d371d9a0477787328a16b002d02f7e5a7036da153a3cc791be7594beb4d16d2.png',
    width: 0.022,
    height: 0.022 * (615 / 500),
    position: [0, lidHeight / 2, 0.00165],
    color: 'transparent',
    fit: 'contain',
    lit: true,
    doubleside: false,
    castShadow: false,
    receiveShadow: true,
  })
)

const state = app.state || {}
let open = state.open !== false
let progress = open ? 1 : 0
let target = progress
let action = null
hinge.rotation.x = open ? OPEN_ANGLE : CLOSED_ANGLE

function applyPose() {
  const eased = progress * progress * (3 - 2 * progress)
  hinge.rotation.x = CLOSED_ANGLE + (OPEN_ANGLE - CLOSED_ANGLE) * eased
  if (action) action.label = open ? 'Close MacBook' : 'Open MacBook'
}
function animate(delta) {
  progress = Math.max(0, Math.min(1, progress + ((target === 1 ? 1 : -1) * delta) / DURATION))
  applyPose()
  if (progress === target) app.off('update', animate)
}
function setOpen(value) {
  open = value
  state.open = value
  target = open ? 1 : 0
  if (world.isClient && progress !== target) {
    app.off('update', animate)
    app.on('update', animate)
  } else {
    progress = target
  }
  applyPose()
}

if (world.isServer) {
  app.state.open = open
  app.on('macbook:toggle', (_, networkId) => {
    const player = world.getPlayer(networkId)
    if (!player || player.position.distanceTo(app.position) > 3) return
    setOpen(!open)
    app.send('macbook:state', { open })
  })
}
if (world.isClient && !world.isPreview) {
  action = app.create('action', {
    id: 'lid-action',
    label: 'Close MacBook',
    distance: 2,
    duration: 0.15,
    position: [0, 0.04, -0.104],
    onTrigger: () => app.send('macbook:toggle', {}),
  })
  app.add(action)
  app.on('macbook:state', message => {
    if (typeof message?.open === 'boolean') setOpen(message.open)
  })
  app.on('destroy', () => app.off('update', animate))
}
applyPose()
