import { DartsGame, STEP } from './game.js'

// Network adapter: authentication, authoritative player position and scheduling.
export function startServer(world, app) {
  const game = new DartsGame()
  let updating = false
  let accumulator = 0
  let sincePublish = 0
  const publish = () => {
    app.state.darts = game.snapshot()
    app.send('darts:state', app.state.darts)
  }
  const playerFor = sender => world.getPlayers().find(p => p.networkId === sender)
  const playerPosition = player => {
    const local = player.position.clone().sub(app.position).applyQuaternion(app.quaternion.clone().invert())
    local.x /= app.scale.x
    local.y /= app.scale.y
    local.z /= app.scale.z
    return local.toArray()
  }
  const update = dt => {
    if (!Number.isFinite(dt) || dt <= 0) return
    accumulator = Math.min(accumulator + dt, 0.25)
    while (accumulator >= STEP && (game.flight || game.windup)) {
      if (game.windup) {
        const thrower = world.getPlayers().find(player => player.id === game.windup.playerId)
        game.stepWindup(STEP, thrower ? playerPosition(thrower) : null)
      } else game.step()
      accumulator -= STEP
    }
    sincePublish += dt
    if (sincePublish >= 0.05 || (!game.flight && !game.windup)) {
      sincePublish = 0
      publish()
    }
    if (!game.flight && !game.windup) {
      app.off('update', update)
      updating = false
      accumulator = 0
    }
  }
  const wake = () => {
    if ((game.flight || game.windup) && !updating) {
      updating = true
      app.on('update', update)
    }
    if (!game.flight && !game.windup && updating) {
      updating = false
      app.off('update', update)
      accumulator = 0
    }
  }
  app.on('darts:command', (request, sender) => {
    const player = playerFor(sender)
    if (!player || !request || typeof request !== 'object') return
    if (request.type === 'sync') {
      app.sendTo(player.id, 'darts:state', game.snapshot())
      return
    }
    let accepted = false
    if (request.type === 'leave') accepted = game.leave(player.id)
    else {
      if (request.type === 'join') accepted = game.join(player.id, player.name)
      else if (request.type === 'aim') accepted = game.setAim(player.id, request.aim)
      else if (request.seq === game.seq) {
        if (request.type === 'mode') accepted = game.configure(player.id, request.mode)
        if (request.type === 'start') accepted = game.start(player.id)
        if (request.type === 'reset') accepted = game.reset(player.id)
        if (request.type === 'next') accepted = game.next(player.id, request.seq)
        if (request.type === 'throw') {
          accepted = game.beginThrow(player.id, request.aim, request.seq)
        }
      }
    }
    if (request.type === 'aim') return
    if (accepted) {
      publish()
      wake()
    } else
      app.sendTo(player.id, 'darts:rejected', {
        state: game.snapshot(),
        message:
          request.type === 'join' && game.phase !== 'lobby'
            ? 'Match in progress · watch or join the next lobby'
            : 'Action unavailable · state refreshed',
      })
  })
  const onLeave = ({ playerId }) => {
    if (game.leave(playerId)) {
      publish()
      wake()
    }
  }
  world.on('leave', onLeave)
  app.on('destroy', () => {
    app.off('update', update)
    world.off('leave', onLeave)
  })
  publish()
  return game
}
