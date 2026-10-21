import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { harness, player, physics } from './helpers.mjs'
function setup() {
  const players = [player('alice')]
  const server = harness({ server: true, players, cueHolders: ['alice'] })
  const client = harness({ players, state: structuredClone(server.app.state) })
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
  client.created.find(n => n.name === 'action').onTrigger()
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
test('a shot releases every app control and requires another Play action to aim again', () => {
  const { client, server, players } = setup()
  const action = client.created.find(n => n.name === 'action')
  action.onTrigger()
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
  action.onTrigger()
  assert.equal(client.activeControl.camera.write, true)
})
test('Play silently disables without a held cue and follows cue pickup and return', () => {
  const client = harness({ players: [player('alice')] })
  const action = client.created.find(n => n.name === 'action')
  assert.equal(action.label, 'Play')
  assert.equal(action.distance, 0)
  action.onTrigger()
  assert.equal(client.sent.length, 0)
  assert.equal(client.activeControl, null)
  assert.equal(client.created.find(n => n.name === 'ui').active, false)
  client.world.emit('billard:cues:classic-8-ft-pool-table', ['alice'])
  assert.equal(action.distance, 3)
  client.world.emit('billard:cues:classic-8-ft-pool-table', [])
  assert.equal(action.distance, 0)
})

test('Play hides on all table actions while aiming; each new shot resets spin', async () => {
  const { readFile } = await import('node:fs/promises')
  const { root } = await import('./helpers.mjs')
  const players = [player('alice')], bus = {}
  const server = harness({ server: true, players, cueHolders: ['alice'] })
  const client = harness({ players, bus, state: structuredClone(server.app.state) })
  const table = harness({ source: await readFile(`${root}upstream-table/table.js`, 'utf8'), players, bus, cueHolders: ['alice'] })
  server.app.deliver = (event, body) => client.emit(event, body)
  client.app.deliver = (event, body) => server.emit(event, body, 'alice')
  const action = client.created.find(n => n.name === 'action')
  const actions = table.created.filter(n => n.name === 'action')
  assert.ok(actions.every(a => a.distance === 3))
  table.app.onPointerDown()
  assert.equal(action.distance, 0)
  assert.ok(actions.every(a => a.distance === 0))
  client.control.keyD.down = client.control.keyW.down = true
  client.emit('update', 0.2)
  assert.ok(server.app.state.aim.side > 0)
  assert.ok(server.app.state.aim.top > 0)
  const claims = client.sent.filter(([event]) => event === 'pool:claim').length
  table.app.onPointerDown()
  assert.equal(client.sent.filter(([event]) => event === 'pool:claim').length, claims)
  client.control.escape.onPress()
  assert.equal(action.distance, 3)
  assert.ok(actions.every(a => a.distance === 3))
  table.app.onPointerDown()
  client.emit('update', 0.01)
  assert.equal(server.app.state.aim.side, 0)
  assert.equal(server.app.state.aim.top, 0)
  client.control.space.onPress()
  assert.equal(action.distance, 3)
  assert.ok(actions.every(a => a.distance === 3))
})
