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
  let inputX = 0, inputZ = 0, inputTurn = 0, poseSequence = 0
  let velocityY = 0, sendAge = 0
  let turnVelocity = 0
  const velocity = new Vector3()
  const targetVelocity = new Vector3()
  const velocityChange = new Vector3()
  const requestedDisplacement = new Vector3()
  const blockedMotion = new Vector3()
  let simulating = false
  const down = new Vector3(0, -1, 0)
  const displacement = new Vector3()
  const casterDisplacement = new Vector3()
  const controllerOffset = new Vector3()
  const controllerTarget = new Vector3()
  const rollingOrigin = new Vector3()
  const rollingDirection = new Vector3()
  const up = new Vector3(0, 1, 0)
  const turnQuaternion = new Quaternion()
  const nextQuaternion = new Quaternion()
  const nextOffset = new Vector3()
  const previousController = new Vector3()
  let interpolation = null
  function teleportController(position, quaternion = app.quaternion) {
    controllerOffset.set(0, 0, 0.2375).multiply(app.scale).applyQuaternion(quaternion)
    if (controller) controller.teleport(controllerTarget.copy(position).add(controllerOffset))
  }
  // Native root movement carries the geometry, colliders, action and anchor.
  // Only the final saved transform is broadcast through setTransform, because
  // that message rebuilds remote apps and would interrupt a seated ride.
  function pose() {
    return { position: app.position.toArray(), quaternion: app.quaternion.toArray(),
      casters: getCasterState(), sequence: poseSequence }
  }
  function sendPose() {
    if (!localSeat) return null
    poseSequence++
    const data = { ...pose(), token: localSeat.token }
    app.state.pose = data
    app.state.casters = data.casters
    app.send('chair-drive', data)
    sendAge = 0
    return data
  }
  function applyPose(data) {
    if (!data || app.isMoving || localSeat) return
    interpolation = null
    app.off('update', animatePose)
    app.position.fromArray(data.position)
    app.quaternion.fromArray(data.quaternion)
    if (world.isClient) teleportController(app.position)
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
    if (active) app.on('update', roll)
    else app.off('update', roll)
  }
  function createController() {
    collisionShapes.forEach(shape => { shape.physics = null })
    // The rider also excludes their own chair from camera sweeps and CCT
    // queries. Other clients retain the physical chair shell.
    // Wait until native Prim.commit has removed this local collision shell.
    const token = localSeat?.token
    setTimeout(() => {
      const current = localSeat
      if (destroyed || app.isMoving || !current || current.token !== token) return
      // The rear-half blocker lets the front seat/base tuck beneath a desktop.
      // Keep the chair root at floor contact; only the native CCT is offset.
      controllerOffset.set(0, 0, 0.2375).multiply(app.scale).applyQuaternion(app.quaternion)
      const radius = 0.2375 * Math.max(app.scale.x, app.scale.z)
      const height = Math.max(0.01, 1.35 * app.scale.y - 2 * radius)
      controller = app.create('controller', {
        // Tool excludes the controller from its own forward sweep and camera.
        id: 'rolling-controller', radius, height, layer: 'tool', tag: collisionTag,
        position: controllerTarget.copy(app.position).add(controllerOffset).toArray(), visible: false,
      })
      // Controller.move uses world coordinates. This independent body exists
      // only during a ride; all furniture geometry remains app-owned.
      world.add(controller)
      teleportController(app.position)
      velocityY = 0
      setSimulation(true)
    }, 0)
  }
  function roll(delta) {
    if (!controller || !localSeat) return
    if (app.isMoving) {
      leaveLocal(null, true, false)
      return
    }
    // Sweep the rear blocker around the chair's floor pivot before accepting
    // a turn. A blocked sweep keeps the previous pose, rather than clipping
    // the seated rider through the desktop.
    // Integrate acceleration and rolling resistance, including the partial
    // frame in which the target speed is reached. Release coasts to an exact
    // stop; changing direction brakes the existing velocity before reversing.
    const targetTurn = inputTurn * Math.PI / 2
    const turnAcceleration = inputTurn ? 6 : 8
    const turnTime = Math.abs(targetTurn - turnVelocity) / turnAcceleration
    const turnRamp = Math.min(delta, turnTime)
    const nextTurnVelocity = turnVelocity +
      Math.sign(targetTurn - turnVelocity) * turnAcceleration * turnRamp
    let turn = (turnVelocity + nextTurnVelocity) / 2 * turnRamp +
      targetTurn * (delta - turnRamp)
    turnVelocity = turnRamp === turnTime ? targetTurn : nextTurnVelocity
    if (turn) {
      nextQuaternion.copy(app.quaternion).multiply(turnQuaternion.setFromAxisAngle(up, turn))
      nextOffset.set(0, 0, 0.2375).multiply(app.scale).applyQuaternion(nextQuaternion)
      previousController.copy(controller.position)
      displacement.copy(nextOffset).sub(controllerOffset)
      controllerTarget.copy(previousController).add(displacement)
      controller.move(displacement, delta)
      if (Math.hypot(controller.position.x - controllerTarget.x,
          controller.position.z - controllerTarget.z) > 0.00001) {
        controller.teleport(previousController)
        turn = 0
        turnVelocity = 0
      } else {
        app.quaternion.copy(nextQuaternion)
        controllerOffset.copy(nextOffset)
      }
    }
    targetVelocity.set(inputX, 0, inputZ)
    if (targetVelocity.lengthSq() > 1) targetVelocity.normalize()
    targetVelocity.applyQuaternion(app.quaternion).multiplyScalar(1.25)
    // Velocity stays in world space: swivelling the chair while coasting
    // cannot rotate its travel direction without a new push.
    velocityChange.copy(targetVelocity).sub(velocity)
    const rollTime = velocityChange.length() / (inputX || inputZ ? 5 : 2.5)
    const rollRamp = Math.min(delta, rollTime)
    displacement.copy(velocity).multiplyScalar(rollRamp)
    if (rollTime > 0) {
      velocityChange.multiplyScalar(rollRamp / rollTime)
      displacement.addScaledVector(velocityChange, rollRamp / 2)
      velocity.add(velocityChange)
    }
    if (rollRamp === rollTime) {
      velocity.copy(targetVelocity)
      displacement.addScaledVector(targetVelocity, delta - rollRamp)
    }
    // Keep floor-level obstacles outside the caster footprint. This low probe
    // passes beneath desktops while walls and pedestals still stop the base.
    const travel = Math.hypot(displacement.x, displacement.z)
    if (travel > 0) {
      rollingOrigin.copy(app.position)
      rollingOrigin.y += 0.11 * app.scale.y
      rollingDirection.set(displacement.x / travel, 0, displacement.z / travel)
      const clearance = 0.475 * Math.max(app.scale.x, app.scale.z)
      const hit = world.raycast(rollingOrigin, rollingDirection, clearance + travel + 0.02, solidMask)
      if (hit && hit.tag !== collisionTag && hit.normal.y < 0.5) {
        const fraction = Math.min(1, Math.max(0, hit.distance - clearance - 0.02) / travel)
        displacement.x *= fraction
        displacement.z *= fraction
        if (fraction < 1) velocity.set(0, 0, 0)
      }
    }
    velocityY = controller.isGrounded ? -0.5 : Math.max(-8, velocityY - 9.81 * delta)
    displacement.y = velocityY * delta
    casterDisplacement.copy(app.position)
    previousController.copy(controller.position)
    requestedDisplacement.copy(displacement)
    controller.move(displacement, delta)
    // Discard momentum into a collision while retaining motion along it.
    // Held input can still push; it cannot accumulate a burst behind a wall.
    blockedMotion.copy(requestedDisplacement).sub(controller.position).add(previousController)
    blockedMotion.y = 0
    if (blockedMotion.lengthSq() > .00000001) {
      blockedMotion.normalize()
      const blockedSpeed = velocity.dot(blockedMotion)
      if (blockedSpeed > 0) velocity.addScaledVector(blockedMotion, -blockedSpeed)
      if (velocity.lengthSq() < .00000001) velocity.set(0, 0, 0)
    }
    app.position.copy(controller.position).sub(controllerOffset)
    // Actual collision-resolved travel drives wheel motion; blocked input does
    // not keep spinning the wheels.
    casterDisplacement.sub(app.position).negate()
      .applyQuaternion(app.quaternion.clone().invert()).divide(app.scale)
    if (controller.isGrounded) advanceCasters(casterDisplacement.x, casterDisplacement.z, turn)
    if (world.isClient) drawCasters()
    const stopped = !inputX && !inputZ && !inputTurn &&
      velocity.lengthSq() === 0 && turnVelocity === 0 && controller.isGrounded
    app.state.casters = getCasterState()
    sendAge += delta
    if (sendAge >= 1 / 15 || stopped) sendPose()
    if (stopped) setSimulation(false)
  }
  // Rear exit is preferred: the front of this chair can be beneath a desktop.
  // Check standing clearance and supporting floor before selecting an exit.
  function safeExit() {
    const base = app.position
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
    inputX = 0; inputZ = 0; inputTurn = 0
    velocity.set(0, 0, 0); turnVelocity = 0
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
    const turn = Number(c.keyQ.down) - Number(c.keyE.down)
    inputX = x; inputZ = z; inputTurn = turn
    const active = !!(x || z || turn)
    if (active && interpolation) {
      interpolation = null
      app.off('update', animatePose)
      teleportController(app.position)
    }
    // Keep the rider's simulation and pose packets running through the coast.
    // roll() sends the final settled pose before removing its own callback.
    if (controller) setSimulation(true)
  }
  function leaveLocal(exit = null, notify = true, teleport = true) {
    const current = localSeat
    if (!current) return
    const finalPose = notify ? sendPose() : null
    localSeat = null
    interpolation = null
    app.off('update', animatePose)
    setSimulation(false)
    if (controller) { world.remove(controller); controller = null }
    if (!destroyed) collisionShapes.forEach(shape => { shape.physics = 'kinematic' })
    inputX = 0; inputZ = 0; inputTurn = 0
    velocity.set(0, 0, 0); turnVelocity = 0
    if (notify) {
      awaitingExit = current
      app.send('seat-release', { token: current.token, pose: finalPose })
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
      poseSequence = 0
      sendAge = 0
      app.state.pose = pose()
      publishSlot()
      app.sendTo(playerId, 'seat-reply', { request: data.request, accepted: true, ...serverSlot })
      updateAction()
    })
    // Like native player movement, the current rider supplies physical poses.
    // The server owns the seat and relays valid ordered updates, without a
    // second simulation based on when key messages happen to arrive.
    function receivePose(data, playerId) {
      if (!serverSlot.owner || playerId !== serverSlot.owner || data?.token !== serverSlot.token) return
      if (app.isMoving || !Number.isSafeInteger(data.sequence) || data.sequence <= poseSequence ||
          !Array.isArray(data.position) || data.position.length !== 3 || !data.position.every(Number.isFinite) ||
          !Array.isArray(data.quaternion) || data.quaternion.length !== 4 || !data.quaternion.every(Number.isFinite) ||
          !Array.isArray(data.casters) || data.casters.length !== casters.length ||
          data.casters.some(c => !Array.isArray(c) || c.length !== 3 || !c.every(Number.isFinite))) return
      const norm = data.quaternion.reduce((sum, value) => sum + value * value, 0)
      if (Math.abs(norm - 1) > .001) return
      poseSequence = data.sequence
      applyPose(data)
      app.state.pose = pose()
      app.state.casters = app.state.pose.casters
      app.send('chair-pose', { ...app.state.pose, token: serverSlot.token })
    }
    app.on('chair-drive', receivePose)
    app.on('seat-release', (data, playerId) => {
      if (playerId === serverSlot.owner && data?.token === serverSlot.token) {
        if (data.pose) receivePose(data.pose, playerId)
        endServerSeat()
      }
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
      if (!localSeat && !awaitingExit) applyPose(data.pose)
      updateAction()
    })
    app.on('chair-pose', data => {
      if (data.token === slot.token && !localSeat && awaitingExit?.token !== data.token) {
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
      poseSequence = 0
      current.control = app.control({ onRelease: () => leaveLocal(null, true, false) })
      for (const key of ['keyW', 'keyA', 'keyS', 'keyD', 'keyQ', 'keyE',
        'arrowUp', 'arrowDown', 'arrowLeft', 'arrowRight']) {
        const button = current.control[key]
        button.capture = true
        button.onPress = sendInput
        button.onRelease = sendInput
      }
      current.control.space.capture = true
      current.control.space.onPress = () => leaveLocal(null, true, false)
      current.control.setActions([
        { type: 'keyW', label: 'Roll (WASD / arrows)' },
        { type: 'keyQ', label: 'Turn left' },
        { type: 'keyE', label: 'Turn right' },
        { type: 'space', label: 'Stand' },
      ])
      current.effect = player.applyEffect({
        anchor: seat, snare: 1, cancellable: false,
        onEnd: () => { if (localSeat === current) leaveLocal(null, true, false) },
      })
      if (!current.effect?.active) leaveLocal(null, true, false)
      else createController()
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
    })
  }
  updateAction()
}
