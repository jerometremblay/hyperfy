// Hyperfy primitive leather couch with extruded bevel-softened cushions and arms.
// Coordinate system: +Y up, +X right, -Z forward (front of couch).
// Static model with lightweight structural collision and sittable anchors.

// Expose shadow controls on all visible construction geometry.
// Keep physically invisible colliders and intentionally unshadowed details excluded.
app.configure([
  { type: 'section', label: 'Lighting and shadows' },
  { type: 'toggle', key: 'castShadows', label: 'Cast shadows', initial: true, hint: 'Allow this object to cast shadows from nearby light sources' },
  { type: 'toggle', key: 'receiveShadows', label: 'Receive shadows', initial: true, hint: 'Show shadows from other objects on this object' },
])
const SHADOW_CASTING = props.castShadows !== false
const SHADOW_RECEIVING = props.receiveShadows !== false

const SEAT_COUNT = 3
const MODEL_NAME = 'Cognac Leather Beveled Sofa - 3 Seat'

const C = {
  leather: '#8A4F2B',
  leatherDark: '#6D3B22',
  leatherLight: '#A55F35',
  piping: '#B8774B',
  wood: '#2B1B13',
}

function addPrim(parent, type, props = {}) {
  const node = app.create('prim', {
    type,
    castShadow: true,
    receiveShadow: true,
    roughness: props.roughness ?? 0.5,
    metalness: props.metalness ?? 0.02,
    physics: props.physics ?? null,
    ...props,
    castShadow: SHADOW_CASTING && props.castShadow !== false && (props.opacity ?? 1) > 0,
    receiveShadow: SHADOW_RECEIVING && props.receiveShadow !== false && (props.opacity ?? 1) > 0,
  })
  if (parent) parent.add(node)
  else app.add(node)
  return node
}

function box(parent, size, position, color, rotation = [0, 0, 0], extra = {}) {
  return addPrim(parent, 'box', { size, position, color, rotation, ...extra })
}

function cylinder(parent, radius, height, position, color, rotation = [0, 0, 0], extra = {}) {
  return addPrim(parent, 'cylinder', { size: [radius, radius, height], position, color, rotation, ...extra })
}

function extrudePrim(parent, profile, depth, position, color, rotation = [0, 0, 0], extra = {}) {
  return addPrim(parent, 'extrude', {
    profile,
    depth,
    position,
    color,
    rotation,
    curveSegments: extra.curveSegments ?? 10,
    bevelEnabled: extra.bevelEnabled ?? true,
    bevelSize: extra.bevelSize ?? 0.018,
    bevelThickness: extra.bevelThickness ?? 0.016,
    bevelSegments: extra.bevelSegments ?? 4,
    smooth: extra.smooth ?? true,
    creaseAngle: extra.creaseAngle ?? Math.PI / 3,
    ...extra,
  })
}

function group(position = [0, 0, 0], rotation = [0, 0, 0]) {
  const node = app.create('group', { position, rotation })
  app.add(node)
  return node
}

function colliderBox(size, position, rotation = [0, 0, 0]) {
  return addPrim(null, 'box', {
    size,
    position,
    rotation,
    color: '#ffffff',
    opacity: 0,
    castShadow: false,
    receiveShadow: false,
    roughness: 1,
    metalness: 0,
    physics: 'static',
  })
}

function roundedRectProfile(w, h, r, seg = 6) {
  const pts = []
  function arc(cx, cy, a0, a1, includeStart = false) {
    for (let i = includeStart ? 0 : 1; i <= seg; i++) {
      const t = a0 + (a1 - a0) * (i / seg)
      pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r])
    }
  }
  arc(w / 2 - r, -h / 2 + r, -Math.PI / 2, 0, true)
  arc(w / 2 - r, h / 2 - r, 0, Math.PI / 2)
  arc(-w / 2 + r, h / 2 - r, Math.PI / 2, Math.PI)
  arc(-w / 2 + r, -h / 2 + r, Math.PI, Math.PI * 1.5)
  return pts
}

function pipingFront(parent, w, h, d, r, color = C.piping) {
  const z = -d / 2 - 0.010
  const rr = 0.008
  const horizontal = w - 2 * r
  const vertical = h - 2 * r
  const y = h / 2 - r
  const x = w / 2 - r
  cylinder(parent, rr, horizontal, [0, y, z], color, [0, 0, Math.PI / 2], { roughness: 0.58 })
  cylinder(parent, rr, horizontal, [0, -y, z], color, [0, 0, Math.PI / 2], { roughness: 0.58 })
  cylinder(parent, rr, vertical, [x, 0, z], color, [0, 0, 0], { roughness: 0.58 })
  cylinder(parent, rr, vertical, [-x, 0, z], color, [0, 0, 0], { roughness: 0.58 })
}

function extrudedRoundedPanel(position, rotation, size, radius, color, options = {}) {
  const g = group(position, rotation)
  const bevelSize = Math.min(options.bevelSize ?? 0.018, radius * 0.45, size[2] * 0.22)
  const bevelThickness = Math.min(options.bevelThickness ?? 0.016, size[2] * 0.20)
  extrudePrim(g, roundedRectProfile(size[0], size[1], radius, options.profileSegs ?? 7), size[2], [0, 0, 0], color, [0, 0, 0], {
    roughness: options.roughness ?? 0.46,
    bevelEnabled: true,
    bevelSize,
    bevelThickness,
    bevelSegments: options.bevelSegments ?? 4,
    curveSegments: options.curveSegments ?? 10,
  })
  if (options.piping !== false) pipingFront(g, size[0], size[1], size[2], radius)
  return g
}

function stitchDash(parent, pos, rot = [0, 0, 0], size = [0.025, 0.006, 0.006]) {
  box(parent, size, pos, C.piping, rot, { roughness: 0.64, castShadow: false })
}

function addArmStitching(x, armD) {
  const frontZ = -armD / 2 - 0.006
  const baseY = 0.39
  for (let i = 0; i < 8; i++) {
    const y = baseY + i * 0.052
    stitchDash(null, [x, y, frontZ], [0, 0, 0], [0.006, 0.024, 0.006])
  }
  const topY = 0.81
  for (let i = 0; i < 8; i++) {
    const z = -0.30 + i * 0.085
    stitchDash(null, [x, topY, z], [Math.PI / 2, 0, 0], [0.006, 0.024, 0.006])
  }
}

// One local interaction state per couch: hide ALL of its Sit prompts when
// the local player sits, not only the one used to enter the seat. This matters
// for two- and three-seat sofas because Hyperfy otherwise shows adjacent prompts.
const seatActions = []
let seatedEffect = null
let sitSession = 0

function setSeatActionsActive(active) {
  for (const action of seatActions) action.active = active
}

function restoreSeatActions(session) {
  // An older onEnd may arrive after another interaction has started.
  if (session !== sitSession) return
  seatedEffect = null
  setSeatActionsActive(true)
}

// Hyperfy can replace a player effect without calling the previous onEnd.
// Check the returned effect handle to restore prompts after that case, too.
app.on('update', () => {
  if (seatedEffect && seatedEffect.active === false) {
    restoreSeatActions(sitSession)
  }
})

function addSeatInteraction(seatIndex, x, seatY, seatZ) {
  const anchor = app.create('anchor', {
    id: `bevel-seat-${SEAT_COUNT}-${seatIndex + 1}`,
    // Keep the adjusted seat height from the last accepted model.
    position: [x, seatY + 0.04, 0.02],
    rotation: [0, 0, 0],
  })
  app.add(anchor)
  const action = app.create('action', {
    label: 'Sit',
    // Put the nearest-action target near the FRONT of each cushion.
    // Each position is separately selectable on multi-seat couches.
    position: [x, seatY + 0.08, seatZ - 0.32],
    distance: 1.65,
    duration: 0.12,
    onTrigger: () => {
      const player = world.getPlayer ? world.getPlayer() : null
      if (!player) return
      // Ignore repeated triggers while this couch's own effect is active.
      if (seatedEffect && seatedEffect.active) return
      const session = ++sitSession
      setSeatActionsActive(false)
      try {
        seatedEffect = player.applyEffect({
          anchor,
          snare: 1,
          cancellable: true,
          onEnd: () => restoreSeatActions(session),
        })
        if (!seatedEffect) restoreSeatActions(session)
      } catch (error) {
        restoreSeatActions(session)
        throw error
      }
    },
  })
  seatActions.push(action)
  app.add(action)
}

function buildCouch() {
  const seatW = 0.70
  const gap = 0.008
  const armW = 0.235
  const innerW = SEAT_COUNT * seatW + (SEAT_COUNT - 1) * gap
  const totalW = innerW + armW * 2 + 0.012
  const leftInner = -innerW / 2

  const footX = totalW / 2 - 0.16
  for (const x of [-footX, footX]) {
    for (const z of [-0.285, 0.275]) {
      box(null, [0.13, 0.18, 0.13], [x, 0.09, z], C.wood, [0.02 * Math.sign(z), 0, 0.015 * Math.sign(x)], { roughness: 0.78 })
    }
  }

  box(null, [totalW - 0.02, 0.30, 0.78], [0, 0.30, 0.03], C.leatherDark, [0, 0, 0], { roughness: 0.53 })
  extrudedRoundedPanel([0, 0.38, -0.33], [0, 0, 0], [totalW - 0.04, 0.11, 0.07], 0.035, C.leather, {
    piping: false,
    bevelSize: 0.012,
    bevelThickness: 0.010,
    roughness: 0.50,
    profileSegs: 5,
  })
  box(null, [innerW + 0.08, 0.27, 0.18], [0, 0.675, 0.30], C.leatherDark, [0.04, 0, 0], { roughness: 0.55 })

  const armX = innerW / 2 + armW / 2 + 0.006
  const armSize = [armW, 0.65, 0.84]
  for (const x of [-armX, armX]) {
    extrudedRoundedPanel([x, 0.56, 0.015], [0, 0, 0], armSize, 0.09, C.leather, {
      piping: false,
      bevelSize: 0.02,
      bevelThickness: 0.018,
      profileSegs: 7,
      roughness: 0.47,
    })
    const ag = group([x, 0.56, 0.015], [0, 0, 0])
    pipingFront(ag, armSize[0], armSize[1], armSize[2], 0.09, C.piping)
    addArmStitching(x, armSize[2])
  }

  for (let i = 0; i < SEAT_COUNT; i++) {
    const x = leftInner + seatW / 2 + i * (seatW + gap)
    const seatY = 0.545
    const seatZ = -0.085
    extrudedRoundedPanel([x, seatY, seatZ], [0, 0, 0], [seatW + 0.04, 0.21, 0.66], 0.08, C.leatherLight, {
      bevelSize: 0.02,
      bevelThickness: 0.018,
      profileSegs: 8,
      roughness: 0.44,
    })
    addSeatInteraction(i, x, seatY, seatZ)

    const back = extrudedRoundedPanel([x, 0.79, 0.245], [0.14, 0, 0], [seatW + 0.025, 0.51, 0.22], 0.09, C.leather, {
      bevelSize: 0.018,
      bevelThickness: 0.016,
      profileSegs: 8,
      roughness: 0.46,
    })
    box(back, [0.018, 0.30, 0.014], [0, -0.015, -0.11], C.leatherDark, [0, 0, 0], { roughness: 0.62, castShadow: false })
  }

  const seamZ = -0.35
  cylinder(null, 0.007, totalW - 0.16, [0, 0.405, seamZ], C.piping, [0, 0, Math.PI / 2], { roughness: 0.62 })
  for (let i = 1; i < SEAT_COUNT; i++) {
    const x = -innerW / 2 + i * seatW + (i - 0.5) * gap
    cylinder(null, 0.006, 0.18, [x, 0.285, seamZ], C.piping, [0, 0, 0], { roughness: 0.62 })
  }
  for (let i = 0; i < SEAT_COUNT; i++) {
    const x = leftInner + seatW / 2 + i * (seatW + gap)
    box(null, [seatW + 0.015, 0.04, 0.06], [x, 0.448, -0.345], C.leatherDark, [0, 0, 0], { roughness: 0.68 })
  }

  colliderBox([totalW - 0.03, 0.31, 0.79], [0, 0.30, 0.03])
  colliderBox([innerW + 0.10, 0.42, 0.26], [0, 0.78, 0.23], [0.14, 0, 0])
  colliderBox([armW * 0.96, 0.65, 0.82], [-armX, 0.56, 0.015])
  colliderBox([armW * 0.96, 0.65, 0.82], [armX, 0.56, 0.015])

  return totalW
}

buildCouch()
