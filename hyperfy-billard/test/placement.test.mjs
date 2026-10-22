import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { harness, player, physics } from './helpers.mjs'

function setup() {
  const players = [player('alice')]
  const client = harness({ players, state: { pool: {
    ...new physics.Simulation().snapshot(), seq: 1, rack: 0, owner: null,
    scratched: true, cueHolders: ['alice'],
  } } })
  // A stationary scratch uses the same authoritative snapshot shape as the server.
  const state = structuredClone(client.app.state.pool)
  state.balls[0] = { ...state.balls[0], p: [1.3, 0.65, -0.2], state: 'InPocket' }
  client.emit('pool:snapshot', { ...state, seq: 2 })
  client.created.find(n => n.name === 'action').onTrigger()
  client.emit('pool:snapshot', { ...state, seq: 3, owner: 'alice' })
  client.emit('update', 0.06)
  return { client, control: client.control, state, players,
    white: client.created.filter(n => n.name === 'group')[0] }
}

function aimedAt(client, control, white) {
  const target = white.position.clone().multiply(client.app.scale).applyQuaternion(client.app.quaternion).add(client.app.position)
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(control.camera.quaternion)
  assert.ok(direction.distanceTo(target.sub(control.camera.position).normalize()) < 1e-7)
}

test('scratch uses the real white ball and normal orbit, without changing its placement', () => {
  const { client, control, white, players } = setup()
  const position = white.position.clone(), camera = control.camera.position.clone()
  const avatar = players[0].position.clone()
  assert.equal(white.active, true)
  assert.equal(white.position.y, physics.BALL_RADIUS)
  assert.equal(client.created.find(n => n.name === 'prim' && n.opacity === 0.4).active, false)
  aimedAt(client, control, white)
  control.pointer.delta.set(120, 35, 0)
  client.emit('update', 0.1)
  control.pointer.delta.set(0, 0, 0)
  assert.ok(white.position.equals(position))
  assert.ok(control.camera.position.distanceTo(camera) > 0.1)
  assert.ok(players[0].position.distanceTo(avatar) > 0.1)
  aimedAt(client, control, white)
  control.arrowLeft.down = true
  client.emit('update', 0.1)
  assert.ok(white.position.equals(position), 'left/right arrows orbit instead of placing')
  aimedAt(client, control, white)
})

test('WASD moves the actual ball relative to the orbit view, with normalized diagonals and table bounds', () => {
  const { client, control, white } = setup()
  client.app.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.7)
  const before = white.position.clone()
  const angle = client.sent.filter(([name]) => name === 'pool:aim').at(-1)[1].angle
  control.keyW.down = true
  client.emit('update', 0.2)
  const forward = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle))
  assert.ok(white.position.clone().sub(before).distanceTo(forward.clone().multiplyScalar(0.1)) < 1e-8)
  aimedAt(client, control, white)
  control.keyD.down = true
  const diagonalStart = white.position.clone()
  client.emit('update', 0.2)
  assert.ok(Math.abs(white.position.distanceTo(diagonalStart) - 0.1) < 1e-8)
  control.keyW.down = control.keyD.down = false
  control.keyS.down = true
  client.emit('update', 0.2)
  const backwardEnd = white.position.clone()
  control.keyS.down = false
  control.keyA.down = true
  client.emit('update', 0.2)
  const right = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle))
  assert.ok(white.position.clone().sub(backwardEnd).distanceTo(right.multiplyScalar(-0.1)) < 1e-8)
  for (let i = 0; i < 200; i++) client.emit('update', 0.1)
  const size = physics.dimensions(), R = physics.BALL_RADIUS
  assert.ok(Math.abs(white.position.x) <= size.length / 2 - 2 * R)
  assert.ok(Math.abs(white.position.z) <= size.width / 2 - 2 * R)
  assert.equal(client.sent.filter(([name]) => name === 'pool:place').length, 0)
  assert.equal(client.sent.filter(([name]) => name === 'pool:aim').at(-1)[1].side, 0)
  assert.equal(client.sent.filter(([name]) => name === 'pool:aim').at(-1)[1].top, 0)
})

test('Space confirms the selected position and continues aiming there; escape cancels the preview', () => {
  const { client, control, white, state } = setup()
  control.keyW.down = true
  client.emit('update', 0.2)
  control.keyW.down = false
  const position = white.position.clone()
  control.space.onPress()
  const request = client.sent.find(([name]) => name === 'pool:place')[1]
  assert.equal(request.x, position.x)
  assert.equal(request.y, -position.z)
  assert.equal(request.seq, 3)
  client.emit('pool:snapshot', { ...state, seq: 4, owner: 'alice', scratched: false,
    balls: [{ ...state.balls[0], state: 'Stationary', p: [request.x, request.y, 0] }, ...state.balls.slice(1)] })
  client.emit('update', 0.01)
  assert.ok(white.position.equals(position), 'confirmation must not return to buffered pocket coordinates')
  assert.equal(client.activeControl, control)
  aimedAt(client, control, white)
  const other = setup()
  other.control.escape.onPress()
  other.client.emit('update', 0.2)
  assert.equal(other.white.active, false)
  assert.equal(other.client.activeControl, null)
  assert.equal(other.client.sent.filter(([name]) => name === 'pool:place').length, 0)
})


test('left click confirms placement, consumes that click, and never shoots after confirmation or exit', () => {
  const { client, control, white, state } = setup()
  control.keyD.down = true
  client.emit('update', 0.2)
  control.keyD.down = false
  const position = white.position.clone()
  assert.equal(control.mouseLeft.onPress(), true)
  const placements = client.sent.filter(([name]) => name === 'pool:place')
  assert.equal(placements.length, 1)
  assert.equal(placements[0][1].x, position.x)
  assert.equal(placements[0][1].y, -position.z)
  assert.equal(placements[0][1].seq, 3)
  assert.equal(client.sent.filter(([name]) => name === 'pool:shoot').length, 0)
  client.emit('pool:snapshot', { ...state, seq: 4, owner: 'alice', scratched: false,
    balls: [{ ...state.balls[0], state: 'Stationary', p: [position.x, -position.z, 0] }, ...state.balls.slice(1)] })
  client.emit('update', 0.01)
  control.mouseLeft.onPress()
  assert.equal(client.sent.filter(([name]) => name === 'pool:place').length, 1)
  assert.equal(client.sent.filter(([name]) => name === 'pool:shoot').length, 0)
  assert.equal(client.activeControl, control)
  aimedAt(client, control, white)
  const cancelled = setup()
  cancelled.control.escape.onPress()
  cancelled.control.mouseLeft.onPress()
  assert.equal(cancelled.client.sent.filter(([name]) => name === 'pool:place').length, 0)
})
