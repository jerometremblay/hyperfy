// Hyperfy pool-table pendant lamp. Y up, +X right, -Z forward; metres.
// Place the app root on the centre of the pool table's playing surface.
// The underside of the lamps hangs `mountHeight` above that surface.
// Two cables raycast upward into physics-enabled structural ceilings.

app.resetOnMove = false

app.configure([
  { type: 'text', key: 'channel', label: 'Switch channel', initial: 'billiards-main', hint: 'Match this value on the wall switch' },
  { type: 'toggle', key: 'initialOn', label: 'Initially on', initial: true },
  { type: 'range', key: 'mountHeight', label: 'Lamp above surface (m)', min: 0.5, max: 2.1, step: 0.01, initial: 0.9 },
  { type: 'range', key: 'fallbackLength', label: 'Cable fallback (m)', min: 0.25, max: 10, step: 0.05, initial: 3 },
  { type: 'range', key: 'maxReach', label: 'Ceiling search (m)', min: 2, max: 25, step: 0.5, initial: 18 },
  { type: 'range', key: 'brightness', label: 'Light power', min: 0, max: 250, step: 0.5, initial: 95 },
  { type: 'range', key: 'lightRange', label: 'Light reach (m)', min: 1, max: 12, step: 0.1, initial: 5.5 },
  { type: 'color', key: 'lightColor', label: 'Light color', initial: '#ffe8ba' },
  { type: 'color', key: 'shadeColor', label: 'Shade color', initial: '#125943' },
  { type: 'toggle', key: 'castLightShadows', label: 'Cast light shadows', initial: false },
])

const channel = String(props.channel || 'billiards-main').trim()
const mountHeight = Math.max(0.5, Number(props.mountHeight ?? 0.9)) + 0.16 // preserve the installed fixture height
const fallbackLength = Math.max(0.25, Number(props.fallbackLength ?? 3))
const maxReach = Math.max(2, Number(props.maxReach ?? 18))
const brightness = Math.max(0, Number(props.brightness ?? 95))
const lightRange = Math.max(1, Number(props.lightRange ?? 5.5))
const brass = '#bb9460'
const brassDark = '#59402c'
const green = props.shadeColor || '#125943'
const ecru = '#ffffff'
const ceilingStart = mountHeight + 0.44

function prim(type, size, position, color, extra = {}) {
  const node = app.create('prim', {
    type, size, position, color,
    physics: null,
    metalness: 0.04, roughness: 0.48,
    castShadow: true, receiveShadow: true,
    ...extra,
  })
  app.add(node)
  return node
}
const box = (size, pos, col, opts={}) => prim('box', size, pos, col, opts)
const cyl = (top, bot, length, pos, col, opts={}) => prim('cylinder', [top,bot,length], pos, col, opts)
const orb = (r, pos, col, opts={}) => prim('sphere', [r], pos, col, opts)
const ring = (r, tube, pos, col, opts={}) => prim('torus',[r,tube],pos,col,{rotation:[Math.PI/2,0,0], ...opts})

// Cast brass load-bearing rail, turned ends, and trim.
box([1.94, 0.068, 0.076], [0, mountHeight + 0.34, 0], brassDark, {metalness:0.75,roughness:0.26})
box([1.92, 0.026, 0.09], [0, mountHeight + 0.38, 0], brass, {metalness:0.75,roughness:0.22})
for (const x of [-0.99,0.99]) {
  orb(0.055,[x,mountHeight+0.34,0],brass,{metalness:0.8,roughness:0.23})
}

const bulbs = []
const diffusers = []
const lights = []
for (const [index, x] of [-0.66, 0, 0.66].entries()) {
  cyl(0.047,0.047,0.14,[x,mountHeight+0.235,0],brass,{metalness:0.7,roughness:0.2})
  // Open conical shells: green outside, white reflector inside; no bottom disk.
  const shade = app.get('ShadeOuter' + index)
  shade.position.set(x, mountHeight + 0.11, 0)
  shade.castShadow = true
  shade.receiveShadow = true
  shade.material.color = green
  const reflector = app.get('ShadeInner' + index)
  reflector.position.set(x, mountHeight + 0.11, 0)
  reflector.castShadow = true
  reflector.receiveShadow = true
  diffusers.push(reflector.material)
  ring(0.29,0.014,[x,mountHeight-0.009,0],brass,{metalness:0.77,roughness:0.2})
  // The entire 11 cm bulb sits above the opening and within the conical liner.
  bulbs.push(orb(0.055,[x,mountHeight+0.08,0],ecru,{
    emissive:'#ffe9a1',emissiveIntensity:2.6,metalness:0,roughness:0.22,castShadow:false,
  }))
  // Point sources sit just inside each shade and illuminate the table below.
  const lamp = app.create('light', {
    type:'point', position:[x,mountHeight-0.09,0], color:props.lightColor || '#ffe8ba',
    intensity:brightness, distance:lightRange, decay:2,
    castShadow:props.castLightShadows === true,
  })
  app.add(lamp)
  lights.push(lamp)
}

// Twin small-diameter steel suspension cables. Each is one unit cylinder
// scaled to the detected floor-to-ceiling span (no primitive reconstruction).
const cables = []
for (const x of [-0.79,0.79]) {
  cyl(0.036,0.036,0.10,[x,ceilingStart-0.05,0],brassDark,{metalness:0.8,roughness:0.23})
  const cable = cyl(0.006,0.006,1,[x,ceilingStart + fallbackLength/2,0], '#9f9b95', {
    scale:[1,fallbackLength,1], metalness:0.85,roughness:0.38,
  })
  const canopy = cyl(0.09,0.09,0.035,[x,ceilingStart+fallbackLength+0.022,0],brass,{
    metalness:0.7,roughness:0.27,
  })
  const canopyRing = ring(0.072,0.008,[x,ceilingStart+fallbackLength-0.002,0],brassDark,{metalness:0.6})
  cables.push({x,cable,canopy,canopyRing})
}

// Client-only visual raycasting. Structural roof/ceiling must have physics colliders.
// Ray starts just above the rail and filters to environment collision geometry.
if (world.isClient) {
  let elapsed = 100
  let lastPX = null, lastPY = null, lastPZ = null
  const up = app.position.clone().set(0,1,0)
  const environmentMask = typeof world.createLayerMask === 'function'
    ? world.createLayerMask('environment') : undefined

  function fitCables() {
    for (const item of cables) {
      let length = fallbackLength
      let found = false
      if (typeof world.raycast === 'function') {
        const start = app.position.clone().set(item.x, ceilingStart + 0.09, 0)
          .multiply(app.scale).applyQuaternion(app.quaternion).add(app.position)
        // Start is 9 cm above the rail to avoid detecting the rail itself.
        const hit = world.raycast(start, up, maxReach, environmentMask)
        if (hit && typeof hit.distance === 'number' && hit.distance > 0.15) {
          const verticalScale = Math.abs(app.scale.y) || 1
          length = Math.max(0.15, Math.min(maxReach, hit.distance / verticalScale + 0.05))
          found = true
        }
      }
      // Cable bottoms start exactly at the rail's upper socket.
      // Stop the cable 4 cm below the ceiling; the canopy covers the final gap.
      item.cable.scale.y = length
      item.cable.position.set(item.x,ceilingStart + length/2,0)
      item.canopy.position.set(item.x,ceilingStart + length + 0.022,0)
      item.canopy.active = found
      item.canopyRing.position.set(item.x,ceilingStart + length - 0.002,0)
      item.canopyRing.active = found
    }
  }

  // Recheck as the app is dragged and to handle slowly-loaded house colliders.
  fitCables()
  app.on('update', dt => {
    elapsed += dt
    const moved = lastPX !== app.position.x || lastPY !== app.position.y || lastPZ !== app.position.z
    if (moved || elapsed > 1.8) {
      elapsed = 0
      lastPX=app.position.x;lastPY=app.position.y;lastPZ=app.position.z
      fitCables()
    }
  })
}

function applyVisual(on) {
  for (const light of lights) light.intensity = on ? brightness : 0
  for (const bulb of bulbs) bulb.emissiveIntensity = on ? 2.6 : 0
  for (const diffuser of diffusers) diffuser.emissiveIntensity = on ? 0.42 : 0
}

const defaultOn = props.initialOn !== false
applyVisual(app.state && typeof app.state.on === 'boolean' ? app.state.on : defaultOn)

if (world.isServer) {
  if (!app.state || typeof app.state.on !== 'boolean') app.state = {on:defaultOn}
  const isOurChannel = value => String(value || '').trim() === channel
  function setOn(next) {
    next = !!next
    app.state = { ...app.state, on:next }
    app.send('billiards-fixture-state', {on:next})
  }
  world.on('billiards-light-command', message => {
    if (message && isOurChannel(message.channel)) setOn(message.on)
  })
  app.on('billiards-fixture-query', () => {
    app.send('billiards-fixture-state', {on:app.state.on})
    // Ask a matching switch to assert its authoritative setting.
    app.emit('billiards-light-request', {channel})
  })
  // Request state from any existing switch when the fixture first appears.
  app.emit('billiards-light-request', {channel})
}
if (world.isClient) {
  app.on('billiards-fixture-state', message => {
    if (message && typeof message.on === 'boolean') applyVisual(message.on)
  })
  if (typeof app.send === 'function') app.send('billiards-fixture-query', {})
}
