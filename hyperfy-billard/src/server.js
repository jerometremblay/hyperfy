import { Simulation, STEP } from './simulation.js'
import { CUE_EVENT, watchCues } from './cues.js'

// Physics runs only while balls move; ownership expires on a wall-clock timer.
export function startServer(world, app, preset) {
  const sim = new Simulation(preset)
  let owner = null,
    leaseUntil = 0,
    seq = 0,
    rack = 0,
    accumulator = 0,
    sinceSnapshot = 0,
    cueHolders = [],
    aim = null,
    lastAimAt = -Infinity,
    updateAttached = false,
    leaseTimerScheduled = false
  const publish = () => {
    app.state.aim = aim
    app.state.pool = {
      ...sim.snapshot(),
      owner,
      aim,
      cueHolders: cueHolders.slice(),
      seq: ++seq,
      rack,
      events: sim.events.splice(0),
    }
    app.send('pool:snapshot', app.state.pool)
  }
  const playerFor = sender => world.getPlayers().find(p => p.networkId === sender)
  const nearby = player => {
    if (!player) return false
    const center = app.position.clone()
    return player.position.distanceTo(center) <= 5 * Math.max(1, app.scale.x, app.scale.y, app.scale.z)
  }
  const authorized = sender => {
    const player = playerFor(sender)
    return player && player.id === owner && cueHolders.includes(player.id) && nearby(player)
  }
  const scheduleLeaseExpiry = () => {
    // Renewing a lease reuses its pending timer instead of adding frame work.
    if (leaseTimerScheduled || !owner) return
    leaseTimerScheduled = true
    setTimeout(
      () => {
        leaseTimerScheduled = false
        expire()
        if (owner) scheduleLeaseExpiry()
      },
      Math.max(1, leaseUntil - Date.now())
    )
  }
  const renewLease = () => {
    leaseUntil = Date.now() + 60_000
    scheduleLeaseExpiry()
  }
  const cueEvent = CUE_EVENT
  watchCues(world, next => {
    if (JSON.stringify(next) === JSON.stringify(cueHolders)) return
    cueHolders = next
    if (owner && !cueHolders.includes(owner)) {
      owner = aim = null
      leaseUntil = 0
    }
    publish()
  })
  const refreshCues = () => app.emit(`${cueEvent}:request`)
  const validAim = data =>
    data &&
    [data.angle, data.side ?? 0, data.top ?? 0, data.speed ?? 2.5].every(Number.isFinite) &&
    Math.abs(data.angle) <= Math.PI * 2 &&
    Math.hypot(data.side ?? 0, data.top ?? 0) <= 0.450001 &&
    (data.speed ?? 2.5) >= 0.1 &&
    (data.speed ?? 2.5) <= 5
  const expire = () => {
    const player = owner && world.getPlayer(owner)
    if (owner && (Date.now() >= leaseUntil || !nearby(player) || !cueHolders.includes(owner))) {
      owner = aim = null
      leaseUntil = 0
      publish()
    }
  }
  const update = dt => {
    if (!Number.isFinite(dt) || dt <= 0) return
    if (!sim.moving) {
      accumulator = 0
      app.off('update', update)
      updateAttached = false
      return
    }
    // A stall slows the simulation rather than producing one giant physics step.
    accumulator = Math.min(accumulator + dt, 0.25)
    while (accumulator >= STEP && sim.moving) {
      sim.step()
      accumulator -= STEP
    }
    sinceSnapshot += dt
    if (sinceSnapshot >= 0.05 || !sim.moving) {
      sinceSnapshot = 0
      publish()
    }
    if (!sim.moving) {
      app.off('update', update)
      updateAttached = false
    }
  }
  const startUpdates = () => {
    if (sim.moving && !updateAttached) {
      updateAttached = true
      app.on('update', update)
    }
  }
  app.on('pool:claim', (request, sender) => {
    refreshCues()
    expire()
    const player = playerFor(sender)
    if (!sim.moving && nearby(player) && cueHolders.includes(player.id) && (!owner || owner === player.id)) {
      owner = player.id
      aim = { playerId: owner, angle: validAim(request) ? request.angle : 0, side: 0, top: 0 }
      renewLease()
      publish()
    }
  })
  app.on('pool:release', (_, sender) => {
    expire()
    if (authorized(sender)) {
      owner = aim = null
      leaseUntil = 0
      publish()
    }
  })
  app.on('pool:ping', (_, sender) => {
    expire()
    if (authorized(sender)) renewLease()
  })
  app.on('pool:aim', (request, sender) => {
    expire()
    const now = Date.now()
    if (!authorized(sender) || sim.moving || !validAim(request) || now - lastAimAt < 50) return
    lastAimAt = now
    aim = {
      playerId: owner,
      angle: request.angle,
      side: request.side ?? 0,
      top: request.top ?? 0,
      speed: request.speed ?? 2.5,
    }
    app.state.aim = aim
    // Aim packets must not invalidate the sequence used by a following shot.
    app.send('pool:aim', aim)
  })
  // Sequence checks reject duplicated shots and requests from an older rack.
  for (const operation of ['shoot', 'reset', 'place']) {
    app.on(`pool:${operation}`, (request, sender) => {
      refreshCues()
      expire()
      if (!authorized(sender) || !request || request.seq !== seq) return
      renewLease()
      let accepted = false
      if (operation === 'shoot') {
        accepted = sim.shoot(request)
        if (accepted) owner = aim = null
      }
      if (operation === 'place') accepted = sim.place(request.x, request.y)
      if (operation === 'reset' && !sim.moving) {
        sim.reset()
        rack++
        accepted = true
      }
      if (accepted) {
        publish()
        startUpdates()
      }
    })
  }
  refreshCues()
  publish()
  return sim
}
