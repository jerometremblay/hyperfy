const OBJECT_NAME = 'chair'
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

// Executive work chair. Front faces local -Z; five twin-wheel casters touch Y=0.
const wheelAnchors = []
const casterRadius = 0.060
const casterTrail = 0.025
const casterHalfSpacing = 0.035
const casters = []
for (let i = 0; i < 5; i++) {
  const angle = i * Math.PI * 2 / 5 + Math.PI
  const x = Math.sin(angle) * 0.375, z = Math.cos(angle) * 0.375
  wheelAnchors.push([x, 0.060, z])
  cylinderBetween([0, 0.215, 0], [x, 0.145, z], 0.028,
    C.brass, 'five-spoke-base', { metalness: 0.82, roughness: 0.22 })
  cylinderBetween([x, 0.099, z], [x, 0.156, z], 0.014,
    C.brass, 'caster-stem', { metalness: 0.78 })
  // The vertical swivel is between the tires in X, ahead of their axle in Z.
  const swivel = app.create('group', {
    id: `caster-${i}-swivel`, position: [x, casterRadius, z], rotation: [0, angle, 0],
  })
  app.add(swivel)
  cylinderBetween([0, .044, 0], [0, .060, 0], .019,
    C.brass, 'caster-swivel-bearing', { metalness: .78 }, swivel)
  for (const side of [-1, 1]) {
    cylinderBetween([side * .018, .048, 0], [side * .018, .003, casterTrail], .006,
      C.brass, 'caster-fork', { metalness: .78 }, swivel)
  }
  cylinderBetween([-.049, 0, casterTrail], [.049, 0, casterTrail], .009,
    C.brass, 'caster-horizontal-axle', { metalness: .80 }, swivel)
  const caster = { swivel, wheels: [], yaw: angle, spin: [0, 0], turnSign: i % 2 ? -1 : 1 }
  casters.push(caster)
  for (const side of [-1, 1]) {
    const wheel = app.create('group', {
      id: `caster-${i}-wheel-${side}`, position: [side * casterHalfSpacing, 0, casterTrail],
    })
    swivel.add(wheel)
    caster.wheels.push(wheel)
    cylinderBetween([-.012, 0, 0], [.012, 0, 0], casterRadius,
      C.rubber, 'caster-wheel', { roughness: .83 }, wheel)
    const face = side * .0127
    cylinderBetween([face - .0008, 0, 0], [face + .0008, 0, 0], .025,
      C.brass, 'caster-hub', { metalness: .80, roughness: .23 }, wheel)
    // Asymmetric face details make rotation around the axle visible.
    cylinderBetween([face + side * .001, .006, 0], [face + side * .001, .022, 0], .0015,
      C.black, 'caster-hub-index', {}, wheel)
    prim('sphere', { size: [.003], position: [face, .043, 0], color: C.brass,
      metalness: .78, roughness: .28 }, 'caster-wheel-valve', wheel)
  }
}
cylinderBetween([0, 0.14, 0], [0, 0.26, 0], 0.063, C.black, 'lift-housing')
cylinderBetween([0, 0.22, 0], [0, 0.435, 0], 0.022, C.brass, 'gas-lift',
  { metalness: 0.88, roughness: 0.18 })
box([0.43, 0.055, 0.36], [0, 0.443, 0], C.black, 'tilt-mechanism')
cylinderBetween([0.10, 0.44, 0.015], [0.34, 0.425, 0.015],
  0.010, C.brass, 'adjustment-lever', { metalness: 0.75 })
box([0.075, 0.025, 0.045], [0.34, 0.425, 0.015], C.black, 'lever-grip')

// Beveled upholstery and a dark walnut seat shell.
horizontalPanel(roundedRect(0.585, 0.54, 0.065), 0.472, 0.028,
  C.walnutDark, 'seat-shell', { bevelSize: 0.013, bevelThickness: 0.005 })
horizontalPanel(roundedRect(0.60, 0.57, 0.075), 0.508, 0.067,
  C.leather, 'padded-seat', { bevelSize: 0.025, bevelThickness: 0.013, roughness: 0.53 })
for (const z of [-0.218, 0.218]) {
  cylinderBetween([-0.215, 0.555, z], [0.215, 0.555, z],
    0.0011, C.stitch, 'seat-stitching')
}

const backGroup = app.create('group', { id: 'chair-back', position: [0, 0.53, 0.205], rotation: [0.10, 0, 0] })
app.add(backGroup)
const backProfile = [
  [-0.25, 0], [-0.31, 0.15], [-0.30, 0.57], [-0.25, 0.74], [-0.18, 0.80],
  [0.18, 0.80], [0.25, 0.74], [0.30, 0.57], [0.31, 0.15], [0.25, 0],
]
extrude(backProfile, 0.038, [0, 0.40, 0.064], C.walnutDark, 'walnut-back-shell',
  { bevelSize: 0.024, bevelThickness: 0.008, roughness: 0.33 }, backGroup)
extrude(backProfile, 0.105, [0, 0.40, 0], C.leather, 'high-padded-back',
  { bevelSize: 0.018, bevelThickness: 0.015, roughness: 0.55 }, backGroup)
extrude(roundedRect(0.43, 0.145, 0.035), 0.040, [0, 0.18, -0.077],
  C.leatherDark, 'lumbar-cushion',
  { bevelSize: 0.017, bevelThickness: 0.012, roughness: 0.57 }, backGroup)
extrude(roundedRect(0.405, 0.16, 0.035), 0.035, [0, 0.695, -0.086],
  C.leatherDark, 'headrest',
  { bevelSize: 0.018, bevelThickness: 0.011, roughness: 0.55 }, backGroup)

// Diamond quilting on the front face, following the backrest's shared frame.
for (const y of [0.325, 0.485]) for (const x of [-0.15, 0, 0.15]) {
  const points = [[x, y - 0.072, -0.070], [x + 0.072, y, -0.070],
    [x, y + 0.072, -0.070], [x - 0.072, y, -0.070]]
  for (let j = 0; j < 4; j++) {
    cylinderBetween(points[j], points[(j + 1) % 4], 0.0009,
      C.stitch, 'diamond-stitching', { castShadow: false }, backGroup)
  }
  prim('sphere', { size: [0.006], position: [x, y, -0.074],
    scale: [1, 1, 0.4], color: C.leatherDark }, 'tuft-button', backGroup)
}
box([0.11, 0.027, 0.004], [0, 0.62, 0.094], C.brass, 'back-emblem',
  { metalness: 0.78, roughness: 0.24 }, backGroup)

for (const side of [-1, 1]) {
  const x = side * 0.323
  cylinderBetween([side * 0.21, 0.473, 0.11], [x, 0.715, 0.10],
    0.021, C.brass, 'arm-support', { metalness: 0.78, roughness: 0.23 })
  cylinderBetween([x, 0.715, 0.10], [x, 0.715, -0.18],
    0.018, C.brass, 'arm-rail', { metalness: 0.78, roughness: 0.23 })
  const pad = roundedRect(0.092, 0.40, 0.032).map(([px, pz]) => [px + x, pz - 0.04])
  horizontalPanel(pad, 0.743, 0.042, C.leatherDark, 'padded-armrest',
    { bevelSize: 0.009, bevelThickness: 0.008, roughness: 0.55 })
}

// Planar rolling kinematics. Swivel Y; both wheel axles X; forward is -Z.
// The axle trails the swivel by casterTrail. No lateral slip at its midpoint
// gives d(yaw)/ds = -sin(yaw - travelHeading)/casterTrail.
function wrapCasterAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}
function getCasterState() {
  return casters.map(caster => [caster.yaw, caster.spin[0], caster.spin[1]])
}
function setCasterState(state) {
  if (!Array.isArray(state) || state.length !== casters.length ||
      state.some(value => !Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite))) return
  state.forEach((value, i) => {
    casters[i].yaw = value[0]
    casters[i].spin[0] = value[1]
    casters[i].spin[1] = value[2]
  })
}
function drawCasters() {
  if (!world.isClient) return
  for (const caster of casters) {
    if (caster.swivel.rotation.y !== caster.yaw) caster.swivel.rotation.y = caster.yaw
    caster.wheels.forEach((wheel, i) => {
      if (wheel.rotation.x !== caster.spin[i]) wheel.rotation.x = caster.spin[i]
    })
  }
}
function advanceCasters(dx, dz) {
  const distance = Math.hypot(dx, dz)
  if (distance < 0.000001) return
  const heading = Math.atan2(-dx, -dz)
  for (const caster of casters) {
    const previousYaw = caster.yaw
    let error = wrapCasterAngle(previousYaw - heading)
    // Perfectly reversed casters are an unstable equilibrium. A small,
    // deterministic perturbation lets them swing either way rather than stick.
    if (Math.PI - Math.abs(error) < .002) error = caster.turnSign * (Math.PI - .035)
    const before = Math.tan(error / 2)
    const after = before * Math.exp(-distance / casterTrail)
    const nextYaw = heading + 2 * Math.atan(after)
    const turn = wrapCasterAngle(nextYaw - previousYaw)
    caster.yaw += turn
    if (Math.abs(turn) > .00001) caster.turnSign = Math.sign(turn)
    // Exact travel of the axle midpoint for this constant-direction segment.
    const travel = distance + casterTrail * Math.log((1 + after * after) / (1 + before * before))
    // Differential wheel travel during swivel: inner and outer tire differ.
    caster.spin[0] -= (travel - casterHalfSpacing * turn) / casterRadius
    caster.spin[1] -= (travel + casterHalfSpacing * turn) / casterRadius
  }
}
if (app.state.casters) setCasterState(app.state.casters)
drawCasters()

// Five boxes describe the seat, back, arms and caster envelope.
collisionBox([0.95, 0.22, 0.95], [0, 0.11, 0], 'caster-base')
collisionBox([0.60, 0.10, 0.57], [0, 0.505, 0], 'seat')
collisionBox([0.62, 0.82, 0.145], [0, 0.40, 0], 'back', backGroup)
for (const side of [-1, 1]) {
  collisionBox([0.092, 0.30, 0.40], [side * 0.323, 0.622, -0.04], `arm-${side}`)
}
if (!world.isPreview) {
  const seat = app.create('anchor', {
    id: 'executive-seat', profileId: 'executive-office-chair-v1',
    position: [0, 0.595, -0.025],
  })
  app.add(seat)
  const action = app.create('action', {
    id: 'executive-seat-action', label: 'Sit', distance: 1.8, duration: 0.15,
    position: [0, 0.66, -0.30], onTrigger: requestSeat,
  })
  app.add(action)
  const solidMask = world.createLayerMask('environment', 'prop')
  const floorMask = world.createLayerMask('environment')
  let destroyed = false
  let controller = null
  let serverSlot = app.state.slot || { owner: null, token: null }
  let slot = serverSlot
  let localSeat = null
  let awaitingExit = null
  let pending = null
  let requestNumber = 0
  let inputX = 0, inputZ = 0, inputAge = 0, velocityY = 0, sendAge = 0
  let simulating = false
  let heartbeat = false
  let heartbeatAge = 0
  const down = new Vector3(0, -1, 0)
  const displacement = new Vector3()
  const casterDisplacement = new Vector3()
  let interpolation = null
  // Native root movement carries the geometry, colliders, action and anchor.
  // Only the final saved transform is broadcast through setTransform, because
  // that message rebuilds remote apps and would interrupt a seated ride.
  function pose() {
    return { position: app.position.toArray(), quaternion: app.quaternion.toArray(), casters: getCasterState() }
  }
  function applyPose(data) {
    if (!data || app.isMoving) return
    interpolation = null
    app.off('update', animatePose)
    app.position.fromArray(data.position)
    app.quaternion.fromArray(data.quaternion)
    if (data.casters) setCasterState(data.casters)
    drawCasters()
  }
  function queuePose(data) {
    if (!data || app.isMoving) return
    const nextPosition = new Vector3(...data.position)
    const nextQuaternion = new Quaternion(...data.quaternion)
    const currentCasters = getCasterState()
    const sameCasters = !data.casters || data.casters.every((values, i) =>
      values.every((angle, axis) => Math.abs(angle - currentCasters[i][axis]) < .0000001))
    if (!interpolation && app.position.distanceTo(nextPosition) < .000001 &&
        1 - Math.abs(app.quaternion.dot(nextQuaternion)) < .0000001 && sameCasters) return
    interpolation = {
      elapsed: 0, position: app.position.clone(), quaternion: app.quaternion.clone(),
      casters: currentCasters, target: data,
    }
    app.on('update', animatePose)
  }
  function animatePose(delta) {
    if (!interpolation) return
    if (app.isMoving) {
      interpolation = null
      app.off('update', animatePose)
      return
    }
    interpolation.elapsed += delta
    const t = Math.min(1, interpolation.elapsed * 15)
    const target = interpolation.target
    app.position.copy(interpolation.position).lerp(new Vector3(...target.position), t)
    app.quaternion.copy(interpolation.quaternion).slerp(new Quaternion(...target.quaternion), t)
    if (target.casters) setCasterState(target.casters.map((values, i) =>
      values.map((angle, axis) => interpolation.casters[i][axis] + (angle - interpolation.casters[i][axis]) * t)))
    drawCasters()
    if (t === 1) {
      interpolation = null
      app.off('update', animatePose)
    }
  }
  function updateAction() {
    action.active = !destroyed && !app.isMoving && !slot.owner && !pending && !localSeat
  }
  function publishSlot() {
    app.state.slot = serverSlot
    app.send('seat-slot', { ...serverSlot, pose: pose() })
  }
  function setSimulation(active) {
    if (simulating === active) return
    simulating = active
    if (active) app.on('fixedUpdate', roll)
    else app.off('fixedUpdate', roll)
  }
  function createController() {
    collisionShapes.forEach(shape => { shape.physics = null })
    // Wait until native Prim.commit has removed our own server collision shell.
    const token = serverSlot.token
    setTimeout(() => {
      if (destroyed || app.isMoving || serverSlot.token !== token || !serverSlot.owner) return
      const radius = 0.475 * Math.max(app.scale.x, app.scale.z)
      const height = Math.max(0.01, 1.35 * app.scale.y - 2 * radius)
      controller = app.create('controller', {
        // Tool excludes this server-only controller from its own forward
        // environment/prop sweep. The client collision shell is solid.
        id: 'rolling-controller', radius, height, layer: 'tool', tag: collisionTag,
        position: app.position.toArray(), visible: false,
      })
      // Controller.move uses world coordinates. This independent body exists
      // only during a ride; all furniture geometry remains app-owned.
      world.add(controller)
      controller.teleport(app.position)
      inputAge = 0
      velocityY = 0
      setSimulation(true)
    }, 0)
  }
  function roll(delta) {
    if (!controller || !serverSlot.owner) return
    if (app.isMoving) { endServerSeat(false); return }
    inputAge += delta
    if (inputAge > 0.65) { inputX = 0; inputZ = 0 }
    displacement.set(inputX, 0, inputZ)
    if (displacement.lengthSq() > 1) displacement.normalize()
    displacement.applyQuaternion(app.quaternion).multiplyScalar(1.25 * delta)
    velocityY = controller.isGrounded ? -0.5 : Math.max(-8, velocityY - 9.81 * delta)
    displacement.y = velocityY * delta
    casterDisplacement.copy(app.position)
    controller.move(displacement, delta)
    app.position.copy(controller.position)
    // Actual collision-resolved travel drives wheel motion; blocked input does
    // not keep spinning the wheels. Authoritative math has no server animation.
    casterDisplacement.sub(app.position).negate()
      .applyQuaternion(app.quaternion.clone().invert()).divide(app.scale)
    if (controller.isGrounded) advanceCasters(casterDisplacement.x, casterDisplacement.z)
    app.state.casters = getCasterState()
    app.state.pose = pose()
    sendAge += delta
    const stopped = !inputX && !inputZ && controller.isGrounded
    if (sendAge >= 1 / 15 || stopped) {
      app.send('chair-pose', { ...app.state.pose, token: serverSlot.token })
      sendAge = 0
    }
    if (stopped) setSimulation(false)
  }
  // Rear exit is preferred: the front of this chair can be beneath a desktop.
  // Check standing clearance and supporting floor before selecting an exit.
  function safeExit() {
    const base = controller ? controller.position : app.position
    const offsets = [[0, 0, 1.05], [1.05, 0, 0], [-1.05, 0, 0], [0, 0, -1.05],
      [0, 0, 1.55], [1.55, 0, 0], [-1.55, 0, 0], [0, 0, -1.55]]
    for (const offset of offsets) {
      const point = new Vector3(...offset).multiply(app.scale).applyQuaternion(app.quaternion).add(base)
      const floorOrigin = point.clone(); floorOrigin.y += 0.55
      const floor = world.raycast(floorOrigin, down, 1.4, floorMask)
      if (!floor || floor.normal.y < 0.95) continue
      point.y = floor.point.y + 0.01
      let clear = true
      // Vertical probes across the player's footprint exclude tables/ceilings.
      for (const [x, z] of [[0, 0], [.27, 0], [-.27, 0], [0, .27], [0, -.27]]) {
        const origin = point.clone().add(new Vector3(x, 0.04, z))
        const hit = world.raycast(origin, new Vector3(0, 1, 0), 1.85, solidMask)
        if (hit && hit.tag !== collisionTag) { clear = false; break }
      }
      if (clear) return point.toArray()
    }
    return null
  }
  function endServerSeat(save = true) {
    if (!serverSlot.owner) return
    const previous = serverSlot
    const exit = safeExit()
    const finalPose = pose()
    setSimulation(false)
    if (controller) { world.remove(controller); controller = null }
    collisionShapes.forEach(shape => { shape.physics = 'kinematic' })
    inputX = 0; inputZ = 0
    serverSlot = { owner: null, token: null }
    slot = serverSlot
    app.state.pose = null
    app.sendTo(previous.owner, 'seat-ended', { token: previous.token, exit })
    publishSlot()
    updateAction()
    if (save && !destroyed && !app.isMoving) {
      app.setTransform(new Vector3(...finalPose.position), new Quaternion(...finalPose.quaternion))
    }
  }
  function requestSeat() {
    if (!world.isClient || destroyed || localSeat || pending || slot.owner || app.isMoving) return
    pending = ++requestNumber
    updateAction()
    app.send('seat-claim', { request: pending })
    const request = pending
    setTimeout(() => {
      if (pending !== request || destroyed) return
      pending = null
      app.send('seat-withdraw', { request })
      updateAction()
    }, 4000)
  }
  function sendInput() {
    if (!localSeat) return
    const c = localSeat.control
    const x = Number(c.keyD.down || c.arrowRight.down) - Number(c.keyA.down || c.arrowLeft.down)
    const z = Number(c.keyS.down || c.arrowDown.down) - Number(c.keyW.down || c.arrowUp.down)
    app.send('chair-input', { token: localSeat.token, x, z })
    const active = !!(x || z)
    if (heartbeat === active) return
    heartbeat = active
    heartbeatAge = 0
    if (active) app.on('update', inputHeartbeat)
    else app.off('update', inputHeartbeat)
  }
  function inputHeartbeat(delta) {
    heartbeatAge += delta
    if (heartbeatAge >= 0.10) { heartbeatAge = 0; sendInput() }
  }
  function leaveLocal(exit = null, notify = true, teleport = true) {
    const current = localSeat
    if (!current) return
    localSeat = null
    heartbeat = false
    app.off('update', inputHeartbeat)
    if (notify) {
      awaitingExit = current
      app.send('seat-release', { token: current.token })
    }
    current.control?.release()
    current.effect?.cancel()
    // Server-selected exits are authoritative. Effect replacement only releases
    // this seat; it must not teleport a player away from a newly applied effect.
    if (teleport && exit && !current.player.destroyed) {
      const forward = new Vector3(0, 0, -1).applyQuaternion(app.quaternion)
      current.player.teleport(new Vector3(...exit), Math.atan2(-forward.x, -forward.z))
    }
    updateAction()
  }
  if (world.isServer) {
    // State is ephemeral; a stale occupant never survives a server script build.
    serverSlot = { owner: null, token: null }
    slot = serverSlot
    app.state.slot = serverSlot
    app.state.pose = null
    chairIsOccupied = () => !!serverSlot.owner
    chairWasMoved = () => endServerSeat(false)
    app.on('seat-claim', (data, playerId) => {
      const player = world.getPlayer(playerId)
      if (destroyed || app.isMoving || serverSlot.owner || !player ||
          !Number.isSafeInteger(data?.request) || data.request < 1 ||
          player.position.distanceTo(app.position) > 2.6) {
        app.sendTo(playerId, 'seat-reply', { request: data?.request, accepted: false })
        return
      }
      serverSlot = { owner: playerId, token: uuid(), request: data.request }
      slot = serverSlot
      app.state.pose = pose()
      publishSlot()
      app.sendTo(playerId, 'seat-reply', { request: data.request, accepted: true, ...serverSlot })
      updateAction()
      createController()
    })
    app.on('chair-input', (data, playerId) => {
      if (!serverSlot.owner || playerId !== serverSlot.owner || data?.token !== serverSlot.token) return
      if (!Number.isFinite(data.x) || !Number.isFinite(data.z)) return
      inputX = Math.max(-1, Math.min(1, data.x))
      inputZ = Math.max(-1, Math.min(1, data.z))
      inputAge = 0
      if (controller) setSimulation(true)
    })
    app.on('seat-release', (data, playerId) => {
      if (playerId === serverSlot.owner && data?.token === serverSlot.token) endServerSeat()
    })
    app.on('seat-withdraw', (data, playerId) => {
      if (playerId === serverSlot.owner && data?.request === serverSlot.request) endServerSeat()
    })
    const onLeave = ({ playerId }) => { if (playerId === serverSlot.owner) endServerSeat() }
    world.on('leave', onLeave)
    app.on('destroy', () => {
      destroyed = true
      endServerSeat(false)
      world.off('leave', onLeave)
      setSimulation(false)
    })
  } else {
    if (app.state.pose) applyPose(app.state.pose)
    app.on('seat-slot', data => {
      slot = data
      app.state.slot = data
      app.state.pose = data.owner ? data.pose : null
      if (data.pose?.casters) app.state.casters = data.pose.casters
      applyPose(data.pose)
      updateAction()
    })
    app.on('chair-pose', data => {
      if (data.token === slot.token) {
        app.state.pose = data
        if (data.casters) app.state.casters = data.casters
        queuePose(data)
      }
    })
    app.on('seat-reply', data => {
      if (data.request !== pending || destroyed) {
        if (data.accepted) app.send('seat-release', { token: data.token })
        return
      }
      pending = null
      if (!data.accepted) { updateAction(); return }
      const player = world.getPlayer()
      const current = { player, token: data.token, control: null, effect: null }
      localSeat = current
      current.control = app.control({ onRelease: () => leaveLocal(null, true, false) })
      for (const key of ['keyW', 'keyA', 'keyS', 'keyD', 'arrowUp', 'arrowDown', 'arrowLeft', 'arrowRight']) {
        const button = current.control[key]
        button.capture = true
        button.onPress = sendInput
        button.onRelease = sendInput
      }
      for (const key of ['space', 'keyE']) {
        current.control[key].capture = true
        current.control[key].onPress = () => app.send('seat-release', { token: current.token })
      }
      current.control.setActions([
        { type: 'keyW', label: 'Roll (WASD / arrows)' },
        { type: 'space', label: 'Stand (Space / E)' },
      ])
      current.effect = player.applyEffect({
        anchor: seat, snare: 1, cancellable: false,
        onEnd: () => { if (localSeat === current) leaveLocal(null, true, false) },
      })
      if (!current.effect?.active) leaveLocal(null, true, false)
      updateAction()
    })
    app.on('seat-ended', data => {
      if (localSeat?.token === data.token) leaveLocal(data.exit, false)
      else if (awaitingExit?.token === data.token) {
        const player = awaitingExit.player
        awaitingExit = null
        if (!player.destroyed && !player.hasEffect() && data.exit) {
          const forward = new Vector3(0, 0, -1).applyQuaternion(app.quaternion)
          player.teleport(new Vector3(...data.exit), Math.atan2(-forward.x, -forward.z))
        }
      }
    })
    app.on('destroy', () => {
      destroyed = true
      pending = null
      interpolation = null
      app.off('update', animatePose)
      leaveLocal(safeExit(), true)
      app.off('update', inputHeartbeat)
    })
  }
  updateAction()
}
