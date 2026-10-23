import { Vector3, Quaternion, Euler } from 'three'
import { BALL_RADIUS as R } from './simulation.js'
import { createSounds } from './sound.js'
import { CUE_EVENT, POSE_EVENT, watchCues } from './cues.js'
import { shotPose, avatarStance, AIM_ELEVATION } from './aim.js'

export function startClient(world, app, { balls, ghost, surfaceTarget, size, playChannel, soundSources }) {
  if (!world.getPlayer) return
  const me = world.getPlayer()
  if (!me) {
    const ready = () => {
      if (!world.getPlayer()) return
      world.off('player', ready)
      startClient(world, app, { balls, ghost, surfaceTarget, size, playChannel, soundSources })
    }
    world.on('player', ready)
    return
  }
  let latest = app.state?.pool, frames = [], clock = 0, control = null, idle = null
  let pending = false, requestedAt = 0, shotPending = false, shotRequestSeq = -1, ping = 0, sinceAim = 0
  let angle = 0, speed = 2.5, side = 0, top = 0
  let elevation = AIM_ELEVATION, floorY = 0, lastStanceAt = -1
  let placeX = -size.length / 4, placeY = 0
  let cueHolders = latest?.cueHolders || [], aim = app.state?.aim, posedPlayer = null
  const sounds = createSounds(app, soundSources || {})
  const volumeEvent = `billard:volume:${playChannel}`
  world.on(volumeEvent, value => sounds.setVolume(value))
  app.emit(`${volumeEvent}:request`)
  let soundEvents = [], lastEventId = latest?.lastEventId || 0
  const cueEvent = CUE_EVENT
  const aimingEvent = `billard:aiming:${playChannel}`
  const poseEvent = POSE_EVENT
  const hasCue = () => cueHolders.includes(me.id)
  const canPlay = () => hasCue() && !control && !pending && !shotPending && !latest?.moving && !latest?.owner
  const ui = app.create('ui', {
    space: 'screen', width: 620, height: 92, position: [0.5, 1, 0],
    offset: [0, -24, 0], pivot: 'bottom-center', backgroundColor: '#101b29',
    padding: 14, pointerEvents: false,
  })
  const text = app.create('uitext', { fontSize: 16, color: '#ffffff', value: '', textAlign: 'center' })
  ui.add(text)
  ui.active = false
  app.add(ui)
  let playHintControl = null
  let hintMode = null
  let hoverRefreshPending = false
  let updateAttached = false
  let update
  const wake = () => {
    if (!update || updateAttached) return
    updateAttached = true
    app.on('update', update)
  }
  const isNearby = () => me.position.distanceTo(app.position) < 15
  const setBallsActive = active => {
    for (const ball of balls) ball.active = active
  }
  setBallsActive(isNearby())
  const renderPositions = snapshot => {
    snapshot?.balls?.forEach((state, i) => {
      balls[i].position.set(state.p[0], R + state.p[2], -state.p[1])
      if (isNearby()) balls[i].active = state.state !== 'InPocket'
    })
  }
  renderPositions(latest)
  const hoveredTargets = new Set()
  const clearPlayHint = () => {
    playHintControl?.setActions([])
    playHintControl?.release()
    playHintControl = null
    hintMode = null
  }
  const refresh = () => {
    const waiting = hoveredTargets.size > 0 && (shotPending || latest?.moving) && me.position.distanceTo(app.position) < 15
    const mode = waiting ? 'waiting' : canPlay() && hoveredTargets.size > 0 ? 'play' : null
    if (mode !== hintMode) {
      if (mode) {
        playHintControl ||= app.control()
        playHintControl.setActions([mode === 'waiting'
          ? { type: 'hourglass', position: 'pointer', opacity: 0.5 }
          : { type: 'mouseLeft', label: 'Play', position: 'pointer', opacity: 0.5 }])
        hintMode = mode
      } else clearPlayHint()
    }
    app.emit(aimingEvent, !!control)
  }
  for (const target of [surfaceTarget, ...balls]) {
    target.onPointerEnter = () => {
      hoveredTargets.add(target)
      hoverRefreshPending = false
      if (isNearby()) setBallsActive(true)
      refresh()
    }
    target.onPointerLeave = () => {
      hoveredTargets.delete(target)
      // Pointer leave runs before enter when crossing between cloth and balls.
      hoverRefreshPending = true
      wake()
    }
  }
  const clearPose = () => {
    if (posedPlayer) app.emit(poseEvent, { playerId: posedPlayer, tableId: app.instanceId, clear: true })
    posedPlayer = null
  }
  const stop = (release = true) => {
    const active = control
    control = null
    pending = false
    clearPose()
    if (active) { active.camera.write = false; active.release() }
    if (release && active) app.send('pool:release', {})
    idle?.release()
    idle = null
    ui.active = ghost.active = false
    refresh()
  }
  const request = (operation, data = {}) => app.send(`pool:${operation}`, { ...data, seq: latest?.seq })
  const placeCueBall = () => {
    if (!control || !latest || latest.moving || !latest.scratched || !hasCue()) return false
    request('place', { x: placeX, y: placeY })
    return true
  }
  const begin = () => {
    if (control || !pending || !hasCue() || latest?.moving) return
    pending = false
    side = top = 0
    if (latest.scratched) { placeX = -size.length / 4; placeY = 0 }
    control = app.control()
    idle = null
    for (const key of ['keyW', 'keyA', 'keyS', 'keyD', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'space', 'keyR', 'escape'])
      control[key].capture = true
    control.camera.write = true
    control.camera.zoom = 0
    control.space.onPress = () => {
      if (!latest || latest.moving || !hasCue()) return
      if (latest.scratched) placeCueBall()
      else {
        const ball = latest.balls[0].p
        me.setCamera?.({ target: worldPosition(new Vector3(ball[0], R + ball[2], -ball[1])), zoom: 0.3, duration: 0.45 })
        shotPending = true
        shotRequestSeq = latest.seq
        request('shoot', { angle, speed, side, top })
        stop()
      }
    }
    control.mouseLeft.onPress = placeCueBall
    control.keyR.onPress = () => { if (!latest?.moving) request('reset') }
    control.escape.onPress = () => stop()
    ui.active = true
    sinceAim = 1
    elevation = AIM_ELEVATION
    const local = me.position.clone().sub(app.position).applyQuaternion(app.quaternion.clone().invert())
    floorY = local.y < -0.35 ? local.y : -0.708
    lastStanceAt = -1
  }
  const receive = snapshot => {
    if (!snapshot || (latest && snapshot.seq <= latest.seq)) return
    if (Object.hasOwn(snapshot, 'aim')) aim = snapshot.aim
    if (shotPending && snapshot.seq > shotRequestSeq) shotPending = false
    if (latest && snapshot.scratched !== latest.scratched && !snapshot.moving) frames = []
    if (latest && snapshot.rack !== latest.rack) {
      frames = []
      soundEvents = []
      sounds.clear()
    }
    if (!latest) lastEventId = snapshot.lastEventId || 0
    for (const event of snapshot.events || []) {
      if (event.id > lastEventId) soundEvents.push(event)
    }
    lastEventId = Math.max(lastEventId, snapshot.lastEventId || 0)
    latest = snapshot
    cueHolders = snapshot.cueHolders || []
    frames.push({ at: clock, snapshot })
    frames = frames.slice(-8)
    if (latest.owner === me.id && !latest.moving && hasCue()) begin()
    else if (control) stop(false)
    if (!hasCue() || latest.moving || (latest.owner && latest.owner !== me.id)) pending = false
    if (!latest.owner || latest.moving) clearPose()
    if (!pending && idle) { idle.release(); idle = null }
    refresh()
    wake()
  }
  app.on('pool:snapshot', receive)
  app.on('pool:aim', next => { aim = next; wake() })
  watchCues(world, holders => {
    cueHolders = holders
    if (!hasCue() && control) stop()
    refresh()
    wake()
  })
  if (latest) frames = [{ at: clock, snapshot: latest }]
  const play = () => {
    if (!canPlay()) return
    const local = me.position.clone().sub(app.position).applyQuaternion(app.quaternion.clone().invert())
    const ball = latest?.scratched ? [-size.length / 4, 0, 0] : latest?.balls[0]?.p || [-size.length / 4, 0, 0]
    angle = Math.atan2(ball[1] + local.z, ball[0] - local.x)
    pending = true
    requestedAt = clock
    if (isNearby()) setBallsActive(true)
    idle = app.control()
    idle.pointer.lock()
    app.send('pool:claim', { angle })
    refresh()
    wake()
  }
  const playOrPlace = event => {
    if (event?.button !== 'left') return
    if (!placeCueBall()) play()
  }
  for (const target of [surfaceTarget, ...balls]) target.onPointerDown = playOrPlace
  world.on(`${aimingEvent}:request`, refresh)
  refresh()
  app.emit(`${cueEvent}:request`)
  const axis = new Vector3()
  const worldPosition = local => local.clone().multiply(app.scale).applyQuaternion(app.quaternion).add(app.position)
  update = dt => {
    if (!Number.isFinite(dt) || dt <= 0) return
    clock += dt
    if (hoverRefreshPending) {
      hoverRefreshPending = false
      refresh()
    }
    if (pending && clock - requestedAt > 2) stop(false)
    const nearby = isNearby()
    if (nearby) setBallsActive(true)
    if (!nearby) { if (control) stop(); clearPose(); sounds.clear(); soundEvents = [] }
    const renderAt = clock - 0.1
    while (frames.length > 1 && frames[1].at <= renderAt) frames.shift()
    const a = frames[0], b = frames[1] || a
    if (a) {
      const alpha = a === b ? 1 : Math.max(0, Math.min(1, (renderAt - a.at) / (b.at - a.at || 1)))
      const displayedTime = a.snapshot.time + (b.snapshot.time - a.snapshot.time) * alpha
      const futureEvents = []
      for (const event of soundEvents) {
        if (event.time > displayedTime) futureEvents.push(event)
        else if (nearby && displayedTime - event.time <= 0.12) sounds.play(event, clock)
      }
      soundEvents = futureEvents
      a.snapshot.balls.forEach((state, i) => {
        const next = b.snapshot.balls[i]
        const p = state.p.map((v, j) => v + (next.p[j] - v) * alpha)
        if (nearby) balls[i].active = state.state !== 'InPocket'
        balls[i].position.set(p[0], R + p[2], -p[1])
        axis.set(state.w[0], state.w[2], -state.w[1])
        const rotationSpeed = axis.length()
        if (rotationSpeed > 0) balls[i].quaternion.premultiply(
          new Quaternion().setFromAxisAngle(axis.multiplyScalar(1 / rotationSpeed), rotationSpeed * Math.min(dt, 0.1)))
      })
    }
    const soundsActive = sounds.update(clock)
    if (nearby && control && (me.position.distanceTo(app.position) > 5 || !hasCue())) stop()
    if (control) {
      ping += dt
      if (ping > 15) { ping = 0; app.send('pool:ping', {}) }
      const horizontal = Number(control.arrowRight.down) - Number(control.arrowLeft.down)
      const vertical = Number(control.arrowUp.down) - Number(control.arrowDown.down)
      const pointer = control.pointer.delta
      const turn = horizontal * dt + pointer.x * 0.003
      angle = Math.atan2(Math.sin(angle - turn), Math.cos(angle - turn))
      elevation = Math.max(0.08, Math.min(0.75, elevation + pointer.y * 0.003))
      if (latest?.scratched) {
        const forward = Number(control.keyW.down) - Number(control.keyS.down)
        const right = Number(control.keyD.down) - Number(control.keyA.down)
        const distance = dt * 0.5 / Math.max(1, Math.hypot(forward, right))
        placeX = Math.max(-size.length / 2 + 2 * R, Math.min(size.length / 2 - 2 * R,
          placeX + (Math.cos(angle) * forward + Math.sin(angle) * right) * distance))
        placeY = Math.max(-size.width / 2 + 2 * R, Math.min(size.width / 2 - 2 * R,
          placeY + (Math.sin(angle) * forward - Math.cos(angle) * right) * distance))
        // Preview on the real cue-ball mesh; click or Space asks the server to commit.
        balls[0].active = true
        balls[0].position.set(placeX, R, -placeY)
      } else {
        speed = Math.max(0.1, Math.min(5, speed + vertical * dt))
        side += (Number(control.keyD.down) - Number(control.keyA.down)) * dt * 0.3
        top += (Number(control.keyW.down) - Number(control.keyS.down)) * dt * 0.3
        const spin = Math.hypot(side, top)
        if (spin > 0.45) { side *= 0.45 / spin; top *= 0.45 / spin }
      }
      const ball = latest?.scratched ? [placeX, placeY, 0] : latest?.balls[0]?.p
      if (ball) {
        const pose = shotPose(ball, angle, side, top, elevation)
        control.camera.position.copy(worldPosition(pose.cameraPosition))
        control.camera.quaternion.copy(app.quaternion).multiply(pose.cameraQuaternion)
        // Use the normal player teleport API to keep the complete capsule
        // outside the rail exterior and the avatar behind the cue's butt.
        if (clock - lastStanceAt >= 0.05) {
          const stance = avatarStance(ball, angle, size, floorY)
          const position = worldPosition(stance.position)
          const quaternion = app.quaternion.clone().multiply(stance.quaternion)
          if (me.position.distanceTo(position) > 0.025 || me.quaternion.angleTo(quaternion) > 0.02)
            me.teleport(position, new Euler().setFromQuaternion(quaternion, 'YXZ').y)
          lastStanceAt = clock
        }
      }
      sinceAim += dt
      if (sinceAim >= 0.1) { sinceAim = 0; app.send('pool:aim', { angle, side, top }) }
      ghost.active = false
      text.value = latest?.error || (latest?.scratched
        ? 'Scratch · Mouse / ← →: orbit · WASD: move white ball\nClick / Space: confirm · R: re-rack · Esc: leave'
        : `Mouse: orbit / aim · ↑ ↓ Power ${speed.toFixed(1)} m/s · W/S Top ${top.toFixed(2)} · A/D Side ${side.toFixed(2)}\nSpace: shoot · Esc: leave · X: return cue`)
    }
    // Move the actual cue from the existing rack, visible to every observer.
    const shooter = latest?.owner
    const aiming = shooter && !latest.moving && !latest.scratched &&
      (shooter === me.id ? !!control : aim?.playerId === shooter)
    if (aiming && latest.balls[0]) {
      const params = shooter === me.id ? { angle, side, top } : aim
      const pose = shotPose(latest.balls[0].p, params.angle, params.side, params.top)
      if (posedPlayer && posedPlayer !== shooter) clearPose()
      posedPlayer = shooter
      app.emit(poseEvent, { playerId: shooter, tableId: app.instanceId, position: worldPosition(pose.cuePosition).toArray(),
        quaternion: app.quaternion.clone().multiply(pose.cueQuaternion).toArray() })
    } else clearPose()
    if (!control && !pending && !hoverRefreshPending && !latest?.moving && frames.length <= 1 &&
      soundEvents.length === 0 && !soundsActive) {
      app.off('update', update)
      updateAttached = false
    }
  }
  if (latest?.moving || latest?.owner) wake()
  app.on('destroy', () => {
    stop()
    clearPlayHint()
  })
}
