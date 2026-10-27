import { DartsController } from './controller.js'
import { textLines } from './text.js'
import { THROW_DURATION } from './throw.js'

export function startClient(world, app, display) {
  const me = world.getPlayer()
  if (!me) {
    const ready = () => {
      if (world.getPlayer()) {
        world.off('player', ready)
        startClient(world, app, display)
      }
    }
    world.on('player', ready)
    app.on('destroy', () => world.off('player', ready))
    return
  }
  const game = new DartsController(me.id)
  let control = null
  let updating = false
  let sinceSnapshot = 0
  let ping = 0
  let error = ''
  let action = null
  let animatedThrow = null
  let throwEffect = null
  const handPosition = new Vector3()
  const holding = () => {
    const windup = game.state?.windup
    const playerId = windup?.playerId || (control && game.canThrow ? me.id : null)
    if (!playerId) return
    const thrower = world.getPlayer(playerId)
    const matrix = thrower?.getBoneTransform?.('rightHand')
    if (!matrix) return
    handPosition.setFromMatrixPosition(matrix).sub(app.position).applyQuaternion(app.quaternion.clone().invert())
    handPosition.x /= app.scale.x
    handPosition.y /= app.scale.y
    handPosition.z /= app.scale.z
    const { yaw, pitch } = windup?.aim || game.aim
    display.positionDart(display.held, {
      position: handPosition.toArray(),
      direction: [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)],
    })
  }
  const ui = app.create('ui', {
    space: 'screen',
    width: 600,
    height: 165,
    position: [0.5, 1, 0],
    offset: [0, -18, 0],
    pivot: 'bottom-center',
    backgroundColor: '#111c22',
    padding: 14,
    gap: 4,
    pointerEvents: false,
  })
  const text = textLines(app, ui, 12, { fontSize: 16, color: '#fff2d9', textAlign: 'center', lineHeight: 1.1 })
  app.add(ui)
  ui.active = false
  const send = command => {
    if (command) app.send('darts:command', command)
  }
  const stance = () => {
    const inverse = app.quaternion.clone().invert()
    const position = me.position.clone().sub(app.position).applyQuaternion(inverse)
    position.x /= app.scale.x
    position.y /= app.scale.y
    position.z /= app.scale.z
    const direction = new Vector3(0, 0, -1).applyQuaternion(control.camera.quaternion).applyQuaternion(inverse)
    return { position: position.toArray(), direction: direction.toArray() }
  }
  const wake = () => {
    if (!updating) {
      updating = true
      app.on('update', update)
    }
  }
  const stop = () => {
    game.exit()
    if (control) {
      control.release()
      control = null
    }
    if (action) action.active = true
    ui.active = display.held.active = display.reticle.active = false
    if (!game.state?.flight && !game.state?.windup && updating) {
      app.off('update', update)
      updating = false
    }
  }
  const refresh = () => {
    if (!game.state) return
    display.show(game.state, game.frame(game.state, sinceSnapshot))
    const value = error || game.hud()
    text(value)
    const height = Math.max(
      80,
      32 + value.split('\n').reduce((lines, line) => lines + Math.max(1, Math.ceil(line.length / 68)), 0) * 21
    )
    if (ui.height !== height) ui.height = height
    display.reticle.active = !!control && game.canThrow
    display.held.active = (!!control && game.canThrow) || !!game.state.windup
    holding()
  }
  const receive = state => {
    if (!game.receive(state)) return
    error = ''
    sinceSnapshot = 0
    const windup = state.windup
    if (windup?.playerId === me.id && animatedThrow !== windup.id) {
      animatedThrow = windup.id
      throwEffect?.cancel()
      throwEffect = me.applyEffect({
        emote: `${DARTS_THROW}?m=rightArm&l=0&t=${windup.time.toFixed(3)}`,
        duration: Math.max(0.01, THROW_DURATION - windup.time),
        turn: true,
      })
    }
    if (state.phase !== 'playing' || !state.players.some(player => player.id === me.id)) {
      throwEffect?.cancel()
      throwEffect = null
    }
    refresh()
    if (state.flight || state.windup || control) wake()
    else if (updating) {
      app.off('update', update)
      updating = false
    }
  }
  app.on('darts:state', receive)
  app.on('darts:rejected', rejection => {
    game.pending = false
    receive(rejection.state)
    error = rejection.message
    refresh()
  })
  const onCommand = key => {
    error = ''
    game.input(stance(), 0)
    send(game.command(key))
    refresh()
  }
  const begin = () => {
    if (control) return
    control = app.control()
    action.active = false
    for (const key of [
      'keyQ',
      'keyZ',
      'arrowLeft',
      'arrowRight',
      'arrowUp',
      'arrowDown',
      'space',
      'keyM',
      'keyR',
      'keyX',
      'escape',
    ])
      control[key].capture = true
    control.space.onPress = () => onCommand('throw')
    control.keyM.onPress = () => onCommand('mode')
    control.keyR.onPress = () => onCommand('reset')
    control.keyX.onPress = () => {
      send(game.command('leave'))
      stop()
    }
    control.escape.onPress = stop
    send(game.focus())
    game.input(stance(), 0)
    ui.active = true
    refresh()
    wake()
  }
  action = app.create('action', {
    label: 'Play darts',
    distance: Infinity,
    duration: 0.15,
    position: [0, 1.5, 0.15],
    onTrigger: begin,
  })
  app.add(action)
  const update = dt => {
    if (!Number.isFinite(dt) || dt <= 0) return
    sinceSnapshot += dt
    if (control) {
      game.input(
        {
          ...stance(),
          right: Number(control.arrowRight.down) - Number(control.arrowLeft.down),
          up: Number(control.arrowUp.down) - Number(control.arrowDown.down),
          power: Number(control.keyQ.down) - Number(control.keyZ.down),
        },
        dt
      )
      const pose = game.pose()
      if (pose) {
        display.reticle.position.fromArray(pose.reticle)
        display.positionDart(display.held, pose.held)
      }
      ping += dt
      if (ping > 2) {
        ping = 0
        send({ type: 'sync' })
      }
    }
    refresh()
    // A stopped server or a late packet cannot leave a permanent client callback.
    if (!control && ((!game.state?.flight && !game.state?.windup) || sinceSnapshot > 2)) {
      app.off('update', update)
      updating = false
    }
  }
  app.on('destroy', () => {
    stop()
    app.off('update', update)
    updating = false
    throwEffect?.cancel()
  })
  if (app.state.darts) receive(app.state.darts)
  send({ type: 'sync' })
}
