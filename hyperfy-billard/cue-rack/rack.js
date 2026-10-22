// Wall-mounted four-cue pool rack — +Y up, +X right, -Z forward.
// The prompt-box +Z direction points INTO the room at this wall.
// Each cue is 1.47 m long; rack and cues are in box-local meters.
// Cue ownership is server-authoritative. Press E/click a cue to take it,
// X on desktop (or left controller X in VR) to return it to its slot.

const FINISH = {
  mahogany: '#5a3022',
  walnut: '#342019',
  edges: '#b58249',
  brass: '#ba9456',
  darkBrass: '#5b4932',
  felt: '#183b30',
  rubber: '#18191c',
  ivory: '#efddbb',
  shaft: '#e8c78c',
}
const X_POS = [-0.186, -0.062, 0.062, 0.186]
const CUE_Y = -0.236
const CUE_Z = 0.170
const CUE_LENGTH = 1.47
const HOLD_TILT = -Math.PI * 0.44
const CUE_EVENT = 'billard:cues'
const POSE_EVENT = 'billard:cue-pose'
const aimPoses = new Map()
app.resetOnMove = false

function piece(parent, type, size, position, color, extra = {}) {
  const n = app.create('prim', {
    type, size, position, color,
    roughness: 0.55, metalness: 0.07,
    castShadow: true, receiveShadow: true,
    physics: null, ...extra,
  })
  parent.add(n)
  return n
}
function box(parent, size, position, color, extra) {
  return piece(parent, 'box', size, position, color, extra)
}
function cyl(parent, top, bottom, len, position, color, extra) {
  return piece(parent, 'cylinder', [top, bottom, len], position, color, extra)
}
function torus(parent, r, tube, position, color, extra) {
  return piece(parent, 'torus', [r, tube], position, color, {
    rotation: [Math.PI / 2, 0, 0], ...extra,
  })
}

// Invisible prims remain raycast targets. Fill the frame's gaps so native
// actions pick the closest available cue even when pointing between slots.
box(app, [0.620, 1.560, 0.200], [0, -0.288, 0.130], FINISH.mahogany, {
  opacity: 0, castShadow: false, receiveShadow: false,
})

// Wall-facing polished hardwood uprights; rear edges sit against the logs.
for (const x of [-0.285, 0.285]) {
  box(app, [0.050, 1.55, 0.064], [x, -0.293, 0.067], FINISH.mahogany)
  box(app, [0.016, 1.54, 0.068], [x, -0.293, 0.103], FINISH.edges)
}
// Horizontal stained mounting rails with chamfer-like brass accent strips.
for (const y of [-1.010, 0.377]) {
  box(app, [0.610, 0.076, 0.074], [0, y, 0.082], FINISH.walnut)
  box(app, [0.596, 0.010, 0.078], [0, y + 0.032, 0.084], FINISH.edges)
  box(app, [0.608, 0.010, 0.018], [0, y - 0.033, 0.124], FINISH.brass,
      { metalness: 0.73, roughness: 0.32 })
}
// The middle stretcher gives the rack a genuinely wall-fixed furniture look.
box(app, [0.56, 0.036, 0.046], [0, -0.20, 0.066], FINISH.mahogany)
for (const x of [-0.266, 0.266]) for (const y of [-1.010, 0.377]) {
  cyl(app, 0.008, 0.008, 0.005, [x, y, 0.128], FINISH.brass,
      { rotation: [Math.PI / 2, 0, 0], metalness: 0.82, roughness: 0.22 })
}

// Individual bottom cups support the butts; upper collars keep cues vertical.
for (const x of X_POS) {
  const z = CUE_Z
  box(app, [0.080, 0.042, 0.128], [x, -1.027, 0.129], FINISH.mahogany)
  cyl(app, 0.032, 0.032, 0.017, [x, -0.993, z], FINISH.felt,
      { roughness: 0.95 })
  torus(app, 0.032, 0.008, [x, -0.985, z], FINISH.brass,
        { metalness: 0.77, roughness: 0.29 })
  box(app, [0.070, 0.055, 0.060], [x, 0.303, 0.125], FINISH.mahogany)
  torus(app, 0.028, 0.007, [x, 0.303, z], FINISH.darkBrass,
        { metalness: 0.72, roughness: 0.30 })
  box(app, [0.010, 0.028, 0.036], [x + 0.036, 0.303, 0.150], FINISH.brass,
      { metalness: 0.72, roughness: 0.30 })
}

// Four real-length 58-inch cues: turned wood, wrap, tapered ash/maple shaft,
// joint rings, ferrule and chalk-blue leather tip. Each gets its own node group.
const cues = []
const slotPositions = []
const buttColors = ['#67402b', '#83492f', '#573c29', '#693f31']
const wrapColors = ['#1b2328', '#49322b', '#243d42', '#352f39']
for (let i = 0; i < 4; i++) {
  const p = [X_POS[i], CUE_Y, CUE_Z]
  const cue = app.create('group', { position: p })
  app.add(cue)
  slotPositions.push(p)
  cues.push(cue)

  // Cue local Y ranges from -0.735 to +0.735 = 1.470 metres.
  cyl(cue, 0.0146, 0.0154, 0.024, [0, -0.723, 0], FINISH.rubber, { roughness: 0.88 })
  cyl(cue, 0.0146, 0.0149, 0.015, [0, -0.704, 0], FINISH.brass,
      { metalness: 0.72, roughness: 0.33 })
  cyl(cue, 0.0140, 0.0148, 0.270, [0, -0.565, 0], wrapColors[i], { roughness: 0.87 })
  // Slim wrap borders and six restrained grip bands.
  for (const y of [-0.699, -0.429]) {
    cyl(cue, 0.0153, 0.0153, 0.009, [0, y, 0], FINISH.brass,
        { metalness: 0.74, roughness: 0.32 })
  }
  for (let j = 0; j < 6; j++) {
    cyl(cue, 0.0142, 0.0142, 0.003, [0, -0.664 + j * 0.041, 0], '#645c4c',
        { metalness: 0.18, roughness: 0.8 })
  }
  cyl(cue, 0.0118, 0.0141, 0.408, [0, -0.224, 0], buttColors[i], { roughness: 0.40 })
  cyl(cue, 0.0112, 0.0118, 0.015, [0, -0.015, 0], FINISH.brass,
      { metalness: 0.82, roughness: 0.22 })
  cyl(cue, 0.0063, 0.0112, 0.680, [0, 0.333, 0], FINISH.shaft, { roughness: 0.44 })
  cyl(cue, 0.0063, 0.0063, 0.036, [0, 0.691, 0], FINISH.ivory, { roughness: 0.45 })
  cyl(cue, 0.0061, 0.0063, 0.026, [0, 0.722, 0], '#32639b', { roughness: 0.88 })
}

const holders = Array.isArray(app.state?.holders) && app.state.holders.length === 4
  ? app.state.holders.slice() : [null, null, null, null]
const attached = [false, false, false, false]
const actions = []
let localControls = null
let localHeld = -1
const rackHolders = new Map()
const heldAnywhere = id => [...rackHolders.values()].some(ids => ids.includes(id))
const publishHolders = () => app.emit(CUE_EVENT, { rackId: app.instanceId, holders: holders.slice() })
const refreshActions = () => {
  const holding = world.isClient && heldAnywhere(world.getPlayer()?.id)
  for (let i = 0; i < actions.length; i++) actions[i].distance = holders[i] || holding ? 0 : 2.8
}
world.on(CUE_EVENT, data => {
  if (!data || typeof data.rackId !== 'string' || !Array.isArray(data.holders)) return
  if (data.holders.length) rackHolders.set(data.rackId, data.holders.filter(id => typeof id === 'string'))
  else rackHolders.delete(data.rackId)
  refreshActions()
})

function applyHolders(next) {
  if (!Array.isArray(next) || next.length !== 4) return
  for (let i = 0; i < 4; i++) {
    holders[i] = typeof next[i] === 'string' ? next[i] : null
    if (actions[i]) actions[i].distance = holders[i] ? 0 : 2.8
    if (!world.isClient || typeof world.getPlayer !== 'function') continue
    if (holders[i] && !attached[i]) {
      app.remove(cues[i])
      world.add(cues[i])
      attached[i] = true
    } else if (!holders[i] && attached[i]) {
      world.remove(cues[i])
      app.add(cues[i])
      cues[i].position.set(...slotPositions[i])
      cues[i].quaternion.set(0, 0, 0, 1)
      attached[i] = false
    }
  }
  for (const id of aimPoses.keys()) if (!holders.includes(id)) aimPoses.delete(id)
  publishHolders()
  if (!world.isClient || typeof world.getPlayer !== 'function') return
  const me = world.getPlayer()
  const nextHeld = me ? holders.findIndex(id => id === me.id) : -1
  if (nextHeld === localHeld) return
  localHeld = nextHeld
  if (localControls) {
    localControls.release()
    localControls = null
  }
  if (localHeld !== -1 && typeof app.control === 'function') {
    localControls = app.control()
    const drop = () => {
      const player = world.getPlayer()
      if (player && localHeld !== -1) app.send('drop-cue', { slot: localHeld })
    }
    if (localControls.keyX) {
      localControls.keyX.onPress = drop
      localControls.keyX.capture = true
    }
    if (localControls.xrLeftBtn1) {
      localControls.xrLeftBtn1.onPress = drop
      localControls.xrLeftBtn1.capture = true
    }
  }
}

// Actions are independent: player points at the desired cue and presses E.
for (let i = 0; i < 4; i++) {
  const action = app.create('action', {
    label: `Take pool cue ${i + 1}`,
    position: [X_POS[i], -0.22, CUE_Z + 0.03],
    distance: holders[i] ? 0 : 2.8,
    duration: 0.15,
    onTrigger: () => {
      if (!world.isClient || typeof world.getPlayer !== 'function' || holders[i]) return
      const me = world.getPlayer()
      if (me && !heldAnywhere(me.id)) app.send('take-cue', { slot: i })
    },
  })
  app.add(action)
  actions.push(action)
}

if (world.isServer) {
  // App state may survive a rebuild; disconnected holders must not keep cues.
  for (let i = 0; i < holders.length; i++) if (holders[i] && !world.getPlayer(holders[i])) holders[i] = null
  app.state.holders = holders.slice()
  const valid = (slot, playerId) => Number.isInteger(slot) && slot >= 0 && slot < 4 &&
    typeof playerId === 'string' && playerId.length > 0 && !!world.getPlayer(playerId)
  const publish = () => {
    app.state.holders = holders.slice()
    app.send('cue-holders', holders.slice())
    publishHolders()
  }
  const playerFor = sender => world.getPlayers().find(player => player.networkId === sender)
  app.on('take-cue', ({ slot } = {}, sender) => {
    const player = playerFor(sender)
    const playerId = player?.id
    app.emit(`${CUE_EVENT}:request`)
    if (!valid(slot, playerId) || holders[slot] || heldAnywhere(playerId)) return
    if (player.position.distanceTo(app.position) > 3.4) return
    holders[slot] = playerId
    publish()
  })
  app.on('drop-cue', ({ slot } = {}, sender) => {
    const playerId = playerFor(sender)?.id
    if (!valid(slot, playerId) || holders[slot] !== playerId) return
    holders[slot] = null
    publish()
  })
  app.on('request-cues', () => publish())
  world.on(`${CUE_EVENT}:request`, publishHolders)
  app.on('destroy', () => {
    holders.fill(null)
    app.emit(CUE_EVENT, { rackId: app.instanceId, holders: [] })
  })
  publish()
  // Reset abandoned cues for disconnects, without one physics body per cue.
  let checkElapsed = 0
  app.on('update', dt => {
    checkElapsed += dt
    if (checkElapsed < 2) return
    checkElapsed = 0
    let changed = false
    for (let i = 0; i < 4; i++) {
      if (holders[i] && !world.getPlayer(holders[i])) {
        holders[i] = null
        changed = true
      }
    }
    if (changed) publish()
  })
}

if (world.isClient && typeof world.getPlayer === 'function') {
  world.on(`${CUE_EVENT}:request`, publishHolders)
  world.on(POSE_EVENT, pose => {
    if (!pose || !holders.includes(pose.playerId)) return
    if (pose.clear) {
      if (aimPoses.get(pose.playerId)?.tableId === pose.tableId) aimPoses.delete(pose.playerId)
      return
    }
    if (Array.isArray(pose.position) && pose.position.length === 3 && pose.position.every(Number.isFinite) &&
        Array.isArray(pose.quaternion) && pose.quaternion.length === 4 && pose.quaternion.every(Number.isFinite))
      aimPoses.set(pose.playerId, pose)
  })
  app.on('cue-holders', next => applyHolders(next))
  applyHolders(holders)
  app.send('request-cues')
  app.emit(`${CUE_EVENT}:request`)

  // Only held cues move. In the rack the entire construction is static.
  let localPlayerId = world.getPlayer()?.id
  app.on('update', () => {
    if (world.getPlayer()?.id !== localPlayerId) {
      localPlayerId = world.getPlayer()?.id
      applyHolders(holders)
    }
    for (let i = 0; i < 4; i++) {
      if (!attached[i] || !holders[i]) continue
      const player = world.getPlayer(holders[i])
      if (!player) continue
      const pose = aimPoses.get(holders[i])
      if (pose) {
        cues[i].position.fromArray(pose.position)
        cues[i].quaternion.fromArray(pose.quaternion)
        continue
      }
      const handMatrix = player.getBoneTransform?.('rightHand')
      const bodyQuat = player.quaternion
      const tilt = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), HOLD_TILT)
      const cueQuat = bodyQuat.clone().multiply(tilt)
      let handPos
      if (handMatrix) {
        handPos = new Vector3().setFromMatrixPosition(handMatrix)
      } else {
        handPos = player.position.clone().add(
          new Vector3(0.35, 1.13, -0.35).applyQuaternion(bodyQuat)
        )
      }
      // The local lower third of the cue aligns with the player's right hand.
      const gripToCenter = new Vector3(0, 0.38, 0).applyQuaternion(cueQuat)
      cues[i].position.copy(handPos.add(gripToCenter))
      cues[i].quaternion.copy(cueQuat)
    }
  })
  app.on('destroy', () => {
    if (localControls) localControls.release()
    holders.fill(null)
    app.emit(CUE_EVENT, { rackId: app.instanceId, holders: [] })
    for (let i = 0; i < 4; i++) if (attached[i]) world.remove(cues[i])
  })
}
