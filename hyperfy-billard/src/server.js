import { Simulation, STEP } from './simulation.js'

// Use the transport's sender ID. Never accept a player ID from a request body.
export function startServer(world, app, preset, playChannel = 'classic-8-ft-pool-table') {
  const sim = new Simulation(preset)
  let owner = null,
    lease = 0,
    seq = 0,
    rack = 0,
    elapsed = 0,
    accumulator = 0,
    sinceSnapshot = 0,
    cueHolders = [],
    aim = null,
    lastAim = -1
  const publish = () => {
    app.state.aim = aim
    app.state.pool = { ...sim.snapshot(), owner, aim, cueHolders: cueHolders.slice(), seq: ++seq, rack, events: sim.events.splice(0) }
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
  const cueEvent = `billard:cues:${playChannel}`
  // Only local server apps can emit this event; clients cannot self-report a cue.
  world.on(cueEvent, holders => {
    if (!Array.isArray(holders)) return
    const next = holders.filter(id => typeof id === 'string')
    if (JSON.stringify(next) === JSON.stringify(cueHolders)) return
    cueHolders = next
    if (owner && !cueHolders.includes(owner)) owner = aim = null
    publish()
  })
  const refreshCues = () => app.emit(`${cueEvent}:request`)
  const validAim = data => data && [data.angle, data.side ?? 0, data.top ?? 0].every(Number.isFinite) &&
    Math.abs(data.angle) <= Math.PI * 2 && Math.hypot(data.side ?? 0, data.top ?? 0) <= 0.450001
  const expire = () => {
    const player = owner && world.getPlayer(owner)
    if (owner && (elapsed > lease || !nearby(player) || !cueHolders.includes(owner))) {
      owner = aim = null
      publish()
    }
  }
  app.on('pool:claim', (request, sender) => {
    refreshCues()
    expire()
    const player = playerFor(sender)
    if (!sim.moving && nearby(player) && cueHolders.includes(player.id) && (!owner || owner === player.id)) {
      owner = player.id
      aim = { playerId: owner, angle: validAim(request) ? request.angle : 0, side: 0, top: 0 }
      lease = elapsed + 60
      publish()
    }
  })
  app.on('pool:release', (_, sender) => {
    if (authorized(sender)) {
      owner = aim = null
      publish()
    }
  })
  app.on('pool:ping', (_, sender) => {
    if (authorized(sender)) lease = elapsed + 60
  })
  app.on('pool:aim', (request, sender) => {
    if (!authorized(sender) || sim.moving || !validAim(request) || elapsed - lastAim < 0.05) return
    lastAim = elapsed
    aim = { playerId: owner, angle: request.angle, side: request.side ?? 0, top: request.top ?? 0 }
    app.state.aim = aim
    // Aim poses do not change the shot sequence: a pose in flight must not
    // invalidate the following strike on the same ordered connection.
    app.send('pool:aim', aim)
  })
  // Every mutating request includes the last authoritative sequence. This also
  // rejects duplicated shots and delayed reset/place packets from an old rack.
  for (const operation of ['shoot', 'reset', 'place']) {
    app.on(`pool:${operation}`, (request, sender) => {
      refreshCues()
      expire()
      if (!authorized(sender) || !request || request.seq !== seq) return
      lease = elapsed + 60
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
      if (accepted) publish()
    })
  }
  app.on('update', dt => {
    if (!Number.isFinite(dt) || dt <= 0) return
    elapsed += dt
    expire()
    if (!sim.moving) {
      accumulator = 0
      return
    }
    // At most 0.25 s of work per frame. A stall slows simulation; no giant step.
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
  })
  refreshCues()
  publish()
  return sim
}
