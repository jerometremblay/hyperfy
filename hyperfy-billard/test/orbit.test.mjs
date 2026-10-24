import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { readFile } from 'node:fs/promises'
import { harness, player, physics } from './helpers.mjs'
const clientSource = process.env.BILLARD_CLIENT_SCRIPT
  ? await readFile(process.env.BILLARD_CLIENT_SCRIPT, 'utf8') : undefined
function playSurface(client) {
  return client.created.find(n => n.name === 'prim' && n.opacity === 0)
}
function clickPlay(client) {
  playSurface(client).onPointerDown({ button: 'left' })
}
function playHint(client) {
  return client.actionPrompts.some(action => action.type === 'mouseLeft' && action.label === 'Play')
}
function setup() {
  const players = [player('alice')]
  const server = harness({ server: true, players, cueHolders: ['alice'] })
  const client = harness({ players, state: structuredClone(server.app.state), source: clientSource })
  server.app.deliver = (event, body) => client.emit(event, body)
  client.app.deliver = (event, body) => server.emit(event, body, 'alice')
  return { players, server, client }
}
function worldBall(client, p) {
  return new THREE.Vector3(p[0], physics.BALL_RADIUS + p[2], -p[1])
    .applyQuaternion(client.app.quaternion).add(client.app.position)
}
function aimedAt(camera, target) {
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
  assert.ok(forward.distanceTo(target.clone().sub(camera.position).normalize()) < 1e-7)
}
test('avatar capsule stays outside the rails and behind the cue over the entire aiming orbit', () => {
  for (const preset of ['8', '9']) {
    const size = physics.dimensions(preset)
    for (const x of [-size.length / 2 + physics.BALL_RADIUS, 0, size.length / 2 - physics.BALL_RADIUS])
      for (const y of [-size.width / 2 + physics.BALL_RADIUS, 0, size.width / 2 - physics.BALL_RADIUS])
        for (let i = 0; i < 360; i++) {
          const angle = i * Math.PI / 180
          const stance = physics.avatarStance([x, y, 0], angle, size, -0.708)
          assert.equal(stance.position.y, -0.708)
          assert.ok(Math.abs(stance.position.x) >= size.length / 2 + 0.48 ||
            Math.abs(stance.position.z) >= size.width / 2 + 0.48)
          const forward = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle))
          const behind = stance.position.clone().sub(new THREE.Vector3(x, -0.708, -y)).dot(forward)
          assert.ok(behind < -(1.47 + physics.BALL_RADIUS + 0.012 + 0.29999))
          assert.ok(new THREE.Vector3(0, 0, -1).applyQuaternion(stance.quaternion).distanceTo(forward) < 1e-7)
        }
  }
})
test('mouse movement orbits the ball, changes shot direction and moves the avatar around the outside', () => {
  const { client, server, players } = setup()
  client.app.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.7)
  clickPlay(client)
  client.emit('update', 0.06)
  const active = client.control
  const position = active.camera.position.clone(), avatar = players[0].position.clone()
  const ball = worldBall(client, server.app.state.pool.balls[0].p)
  aimedAt(active.camera, ball)
  const firstAngle = server.app.state.aim.angle
  active.pointer.delta.set(120, 35, 0)
  server.emit('update', 0.12)
  client.emit('update', 0.12)
  active.pointer.delta.set(0, 0, 0)
  aimedAt(active.camera, ball)
  assert.ok(active.camera.position.distanceTo(position) > 0.1)
  assert.ok(players[0].position.distanceTo(avatar) > 0.1)
  assert.ok(Math.abs(server.app.state.aim.angle - firstAngle) > 0.3)
  const local = players[0].position.clone().sub(client.app.position).applyQuaternion(client.app.quaternion.clone().invert())
  const size = physics.dimensions()
  assert.ok(Math.abs(local.x) > size.length / 2 + 0.48 || Math.abs(local.z) > size.width / 2 + 0.48)
  assert.equal(active.pointer.locked, true)
})
test('scroll pulls the cue back for more power, pushes it closer for less, and sends that power on strike', () => {
  const { client, server, players } = setup()
  let cuePose
  client.world.on('billard:cue-pose', pose => { if (!pose.clear) cuePose = pose })
  clickPlay(client)
  client.emit('update', 1 / 60)
  const control = client.control
  assert.equal(control.scrollDelta.capture, true)
  const camera = control.camera.position.clone()
  const ball = worldBall(client, server.app.state.pool.balls[0].p)
  const cueDistance = () => new THREE.Vector3().fromArray(cuePose.position).distanceTo(ball)
  const initial = cueDistance()
  const scroll = (value, dt = 0.1) => {
    control.scrollDelta.value = value
    server.emit('update', dt)
    client.emit('update', dt)
    control.scrollDelta.value = 0
  }
  scroll(-50)
  assert.equal(server.app.state.aim.speed, 3)
  assert.ok(cueDistance() > initial)
  assert.ok(control.camera.position.equals(camera), 'power changes do not zoom the camera')
  const observer = harness({ players: [player('bob'), players[0]], state: structuredClone(server.app.state), source: clientSource })
  let observerPose
  observer.world.on('billard:cue-pose', pose => { if (!pose.clear) observerPose = pose })
  observer.emit('update', 1 / 60)
  assert.deepEqual(observerPose.position, cuePose.position, 'late observer sees the same pullback')
  scroll(50)
  assert.equal(server.app.state.aim.speed, 2.5)
  assert.ok(Math.abs(cueDistance() - initial) < 1e-8)
  scroll(-10000)
  assert.equal(server.app.state.aim.speed, 5)
  scroll(10000)
  assert.equal(server.app.state.aim.speed, 0.1)
  scroll(-100, 1 / 120)
  const beforeIdle = cueDistance()
  client.emit('update', 1 / 60)
  assert.equal(cueDistance(), beforeIdle, 'no further power change after scrolling stops')
  control.space.onPress()
  assert.equal(client.sent.findLast(([event]) => event === 'pool:shoot')[1].speed, 1.1)
  assert.equal(client.activeControl, null)
})
test('a shot releases every app control and requires another left click to aim again', () => {
  const { client, server, players } = setup()
  const target = playSurface(client)
  clickPlay(client)
  client.emit('update', 0.06)
  const aiming = client.control
  const ballBefore = worldBall(client, server.app.state.pool.balls[0].p)
  aiming.space.onPress()
  assert.equal(players[0].cameraCalls.length, 1)
  assert.equal(players[0].cameraCalls[0].zoom, 0.3)
  assert.equal(players[0].cameraCalls[0].duration, 0.45)
  assert.ok(players[0].cameraCalls[0].target.distanceTo(ballBefore) < 1e-8)
  assert.equal(aiming.camera.write, false)
  assert.equal(client.activeControl, null)
  assert.equal(playHint(client), false)
  const claims = client.sent.filter(([event]) => event === 'pool:claim').length
  target.onPointerDown({ button: 'left' })
  assert.equal(client.sent.filter(([event]) => event === 'pool:claim').length, claims)
  assert.equal(client.activeControl, null)
  const position = aiming.camera.position.clone()
  players[0].position.x += 0.5
  for (let i = 0; i < 1500; i++) {
    server.emit('update', 1 / 60)
    client.emit('update', 1 / 60)
    assert.equal(client.activeControl, null)
  }
  assert.ok(aiming.camera.position.equals(position), 'released camera is never written again')
  assert.equal(players[0].cameraCalls.length, 1, 'no ball tracking after handoff')
  assert.equal(server.app.state.pool.moving, false)
  target.onPointerEnter()
  assert.equal(playHint(client), true)
  target.onPointerDown({ button: 'left' })
  assert.equal(client.activeControl.camera.write, true)
})
test('left-click hint and input require a held cue and a play-surface pointer target', () => {
  const client = harness({ players: [player('alice')] })
  const target = playSurface(client)
  target.onPointerEnter()
  assert.equal(playHint(client), false)
  target.onPointerDown({ button: 'left' })
  assert.equal(client.sent.length, 0)
  assert.equal(client.activeControl, null)
  assert.equal(client.created.find(n => n.name === 'ui').active, false)
  client.world.emit('billard:cues', { rackId: 'test-rack', holders: ['alice'] })
  assert.equal(playHint(client), true)
  client.world.emit('billard:cues', { rackId: 'test-rack', holders: [] })
  assert.equal(playHint(client), false)
  target.onPointerDown({ button: 'left' })
  assert.equal(client.sent.length, 0)
})

test('left-click hint hides while aiming and after a shot; spin resets for the next shot', () => {
  const { client, server } = setup()
  const target = playSurface(client)
  target.onPointerEnter()
  assert.equal(playHint(client), true)
  clickPlay(client)
  server.emit('update', 0.06)
  client.emit('update', 0.06)
  assert.equal(playHint(client), false)
  client.control.keyD.down = client.control.keyW.down = true
  server.emit('update', 0.2)
  client.emit('update', 0.2)
  assert.ok(server.app.state.aim.side > 0)
  assert.ok(server.app.state.aim.top > 0)
  const claims = client.sent.filter(([event]) => event === 'pool:claim').length
  target.onPointerDown({ button: 'left' })
  assert.equal(client.sent.filter(([event]) => event === 'pool:claim').length, claims)
  client.control.escape.onPress()
  assert.equal(playHint(client), true)
  clickPlay(client)
  server.emit('update', 0.06)
  client.emit('update', 0.01)
  assert.equal(server.app.state.aim.side, 0)
  assert.equal(server.app.state.aim.top, 0)
  client.control.space.onPress()
  assert.equal(playHint(client), false)
})

test('crossing between cloth and balls keeps the native hint until the pointer leaves the play area', () => {
  const { client } = setup()
  const surface = playSurface(client)
  const ball = client.created.find(node => node.name === 'group' && node.onPointerEnter)
  surface.onPointerEnter()
  const hint = client.actionPrompts[0]
  assert.equal(hint.type, 'mouseLeft')
  for (let i = 0; i < 3; i++) {
    surface.onPointerLeave()
    ball.onPointerEnter()
    client.emit('update', 1 / 60)
    assert.equal(client.actionPrompts[0], hint)
    ball.onPointerLeave()
    surface.onPointerEnter()
    client.emit('update', 1 / 60)
    assert.equal(client.actionPrompts[0], hint)
  }
  surface.onPointerLeave()
  client.emit('update', 1 / 60)
  assert.equal(client.actionPrompts.length, 0)
})
