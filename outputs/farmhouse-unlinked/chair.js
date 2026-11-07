app.resetOnMove = false
const sitEmote = props.sitEmote?.url
// One stable sitting place. Back is +Z, so rotation 0 faces outward toward -Z.
const anchor = app.create('anchor', { id: 'farmhouse-seat' })
anchor.position.set(0, 0.52, 0.01)
anchor.rotation.y = Math.PI
app.add(anchor)

const action = app.create('action', {
  label: 'Sit',
  distance: 2.6,
  duration: 0.25,
})
action.position.set(0, 0.65, 0.30)
app.add(action)

const EXIT_LOCAL = [0, 0.05, 0.7]
function localToWorld(local) {
  return app.position.clone().set(local[0], local[1], local[2]).multiply(app.scale).applyQuaternion(app.quaternion).add(app.position)
}

if (world.isServer && app.state && app.send) {
  if (app.state.occupant === undefined) app.state.occupant = null

  app.on('requestSeat', playerId => {
    if (!playerId) return
    if (!app.state.occupant) {
      app.state.occupant = playerId
      app.send('seatState', { occupant: playerId })
    } else if (app.state.occupant === playerId) {
      app.send('seatState', { occupant: playerId })
    } else if (app.sendTo) {
      app.sendTo(playerId, 'seatRejected', { seatId: 'farmhouse-seat' })
    }
  })

  app.on('releaseSeat', playerId => {
    if (app.state.occupant !== playerId) return
    app.state.occupant = null
    app.send('seatState', { occupant: null })
  })

  if (world.on) {
    world.on('leave', event => {
      if (event?.playerId !== app.state.occupant) return
      app.state.occupant = null
      app.send('seatState', { occupant: null })
    })
  }
}

if (world.isClient && world.getPlayer && app.send) {
  const player = world.getPlayer()
  let occupant = app.state?.occupant || null
  let pending = false
  let destroyed = false
  let activeEntry = null

  function refreshAction() {
    action.active = !destroyed && !pending && !activeEntry && !occupant
  }

  function finishSit(entry, releaseSeat, teleportOut) {
    if (activeEntry !== entry) return
    activeEntry = null
    entry.control?.release?.()
    if (releaseSeat && occupant === player.id) app.send('releaseSeat', player.id)
    if (!destroyed && teleportOut && player.teleport) player.teleport(localToWorld(EXIT_LOCAL))
    refreshAction()
  }

  function startSit() {
    if (activeEntry || destroyed) return
    const entry = { control: app.control ? app.control() : null, effect: null }
    activeEntry = entry
    pending = false
    refreshAction()
    entry.effect = player.applyEffect({
      anchor,
      emote: sitEmote,
      cancellable: true,
      onEnd: () => finishSit(entry, true, true),
    })
  }

  action.onTrigger = () => {
    if (destroyed || pending || activeEntry || occupant) return
    pending = true
    refreshAction()
    app.send('requestSeat', player.id)
  }

  app.on('seatState', data => {
    occupant = data?.occupant || null
    pending = false
    if (occupant === player.id) {
      startSit()
    } else if (activeEntry) {
      const entry = activeEntry
      if (entry.effect?.active) entry.effect.cancel()
      else finishSit(entry, false, false)
    }
    refreshAction()
  })

  app.on('seatRejected', () => {
    pending = false
    refreshAction()
  })

  app.on('destroy', () => {
    destroyed = true
    action.active = false
    const entry = activeEntry
    if (!entry) return
    activeEntry = null
    entry.control?.release?.()
    if (occupant === player.id) app.send('releaseSeat', player.id)
    if (entry.effect?.active) entry.effect.cancel()
  })

  refreshAction()
}
