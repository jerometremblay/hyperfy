import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { harness, player, physics, root } from './helpers.mjs'
const source = await readFile(`${root}cue-rack/rack.js`, 'utf8')
function setup() {
  const players = [player('alice', 'socket-a'), player('bob', 'socket-b')]
  const bus = {}
  const rack = harness({ server: true, source, players, bus })
  const game = harness({ server: true, players, bus })
  return { players, rack, game }
}
test('rack gaps and frame edges target the nearest available cue through an invisible box', () => {
  const rack = harness({ source, players: [player('alice')], state: { holders: [null, 'bob', null, null] } })
  const target = rack.created.find(n => n.name === 'prim' && n.opacity === 0)
  assert.ok(target)
  assert.equal(target.physics, null)
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...target.size), new THREE.MeshBasicMaterial())
  mesh.position.copy(target.position)
  mesh.updateMatrixWorld()
  const actions = rack.created.filter(n => n.name === 'action' && n.distance > 0)
  for (const [x, expectedSlot] of [[-0.30, 1], [-0.124, 1], [-0.062, 1], [0, 3], [0.124, 3], [0.30, 4]]) {
    for (const y of [-1.06, -0.22, 0.48]) {
      const ray = new THREE.Raycaster(new THREE.Vector3(x, y, 1), new THREE.Vector3(0, 0, -1))
      const hit = ray.intersectObject(mesh)[0]
      assert.ok(hit, `rack target at ${x}, ${y}`)
      const nearest = actions.reduce((a, b) => a.position.distanceTo(hit.point) <= b.position.distanceTo(hit.point) ? a : b)
      assert.ok(nearest.position.distanceTo(hit.point) <= 1, 'within native action target radius')
      assert.equal(nearest.label, `Take pool cue ${expectedSlot}`)
      nearest.onTrigger()
      assert.equal(rack.sent.at(-1)[1].slot, expectedSlot - 1)
    }
  }
})
test('only a real held rack cue permits claims; pickup/drop use the transport sender', () => {
  const { players, rack, game } = setup()
  const claim = () => game.emit('pool:claim', { heldCue: true, playerId: 'alice' }, 'socket-a')
  claim()
  assert.equal(game.app.state.pool.owner, null)
  rack.emit('take-cue', { slot: 0, playerId: 'alice' }, 'forged')
  assert.equal(rack.app.state.holders[0], null)
  players[0].position.x = 10
  rack.emit('take-cue', { slot: 0 }, 'socket-a')
  assert.equal(rack.app.state.holders[0], null)
  players[0].position.x = 0
  rack.emit('take-cue', { slot: 0, playerId: 'bob' }, 'socket-a')
  assert.equal(rack.app.state.holders[0], 'alice')
  rack.emit('take-cue', { slot: 1 }, 'socket-a')
  assert.equal(rack.app.state.holders[1], null)
  rack.emit('drop-cue', { slot: 0, playerId: 'alice' }, 'socket-b')
  assert.equal(rack.app.state.holders[0], 'alice')
  claim()
  assert.equal(game.app.state.pool.owner, 'alice')
  rack.emit('drop-cue', { slot: 0 }, 'socket-a')
  assert.equal(game.app.state.pool.owner, null)
  const shots = game.app.state.pool.shots
  game.emit('pool:shoot', { seq: game.app.state.pool.seq, angle: 0, speed: 5 }, 'socket-a')
  assert.equal(game.app.state.pool.shots, shots)
})
test('low camera stays behind the ball and the physical cue points through the selected contact', () => {
  for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 0.37]) {
    const ball = new THREE.Vector3(0.4, physics.BALL_RADIUS, 0.2)
    const forward = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle))
    const pose = physics.shotPose([0.4, -0.2, 0], angle)
    assert.ok(pose.cameraPosition.clone().sub(ball).dot(forward) < -0.679)
    assert.ok(Math.abs(pose.cameraPosition.y - ball.y - 0.14) < 1e-10)
    const look = new THREE.Vector3(0, 0, -1).applyQuaternion(pose.cameraQuaternion)
    assert.ok(look.distanceTo(ball.clone().sub(pose.cameraPosition).normalize()) < 1e-10)
    const cueForward = new THREE.Vector3(0, 1, 0).applyQuaternion(pose.cueQuaternion)
    assert.ok(cueForward.dot(forward) > 0.998)
    const tip = pose.cuePosition.clone().addScaledVector(cueForward, 0.735)
    assert.ok(Math.abs(tip.distanceTo(ball) - physics.BALL_RADIUS - 0.012) < 1e-10)
    assert.ok(new THREE.Vector3().crossVectors(ball.clone().sub(tip), cueForward).length() < 1e-10)
  }
})
test('the held cue aligns for shooter and late observer, then returns to hand on strike', () => {
  const { players, rack, game } = setup()
  rack.emit('take-cue', { slot: 0 }, 'socket-a')
  const clientBus = {}
  const clientRack = harness({ source, players, bus: clientBus, state: structuredClone(rack.app.state) })
  const client = harness({ players, bus: clientBus, state: structuredClone(game.app.state) })
  game.app.deliver = (event, body) => client.emit(event, body)
  client.app.deliver = (event, body) => game.emit(event, body, 'socket-a')
  client.created.find(n => n.name === 'prim' && n.opacity === 0).onPointerDown({ button: 'left' })
  client.emit('update', 1 / 60)
  clientRack.emit('update', 1 / 60)
  const cue = clientRack.created.filter(n => n.name === 'group')[0]
  const pose = physics.shotPose(game.app.state.pool.balls[0].p, game.app.state.aim.angle)
  assert.ok(cue.position.distanceTo(pose.cuePosition.clone().add(client.app.position)) < 1e-8)
  assert.ok(cue.quaternion.angleTo(pose.cueQuaternion) < 1e-7)
  const observerBus = {}
  const observerRack = harness({ source, players: [players[1], players[0]], bus: observerBus, state: structuredClone(rack.app.state) })
  const observer = harness({ players: [players[1], players[0]], bus: observerBus, state: structuredClone(game.app.state) })
  observer.emit('update', 1 / 60)
  observerRack.emit('update', 1 / 60)
  const remoteCue = observerRack.created.filter(n => n.name === 'group')[0]
  assert.ok(remoteCue.position.distanceTo(cue.position) < 1e-8)
  assert.equal(observer.activeControl, null)
  const aiming = client.control
  aiming.space.onPress()
  assert.equal(aiming.camera.write, false)
  assert.equal(client.activeControl, null)
  assert.equal(game.app.state.pool.owner, null)
  assert.equal(game.app.state.pool.shots, 1)
  clientRack.emit('update', 1 / 60)
  assert.ok(cue.position.distanceTo(pose.cuePosition.clone().add(client.app.position)) > 0.1)
  // The cue is still held, and no trajectory-line primitive exists.
  assert.equal(rack.app.state.holders[0], 'alice')
  assert.equal(client.created.some(n => n.name === 'prim' && n.emissiveIntensity > 0), false)
})
test('all game controls release immediately without waiting for a server response', () => {
  const { players, rack, game } = setup()
  rack.emit('take-cue', { slot: 0 }, 'socket-a')
  const client = harness({ players, state: structuredClone(game.app.state) })
  client.app.deliver = (event, body) => game.emit(event, body, 'socket-a')
  game.app.deliver = (event, body) => client.emit(event, body)
  client.created.find(n => n.name === 'prim' && n.opacity === 0).onPointerDown({ button: 'left' })
  client.emit('update', 1 / 60)
  const aiming = client.control
  client.app.deliver = () => {} // Network response held back.
  aiming.space.onPress()
  assert.equal(aiming.camera.write, false)
  assert.equal(client.activeControl, null)
  assert.equal(client.created.find(n => n.name === 'ui').active, false)
})
test('aim packets do not stale the next shot; dropping a cue cancels active aiming', () => {
  const { players, rack, game } = setup()
  rack.emit('take-cue', { slot: 0 }, 'socket-a')
  game.emit('pool:claim', { angle: 0 }, 'socket-a')
  const seq = game.app.state.pool.seq
  game.emit('pool:aim', { angle: 0.5, side: 0, top: 0 }, 'socket-a')
  assert.equal(game.app.state.pool.seq, seq)
  game.emit('pool:shoot', { seq, angle: 0.5, speed: 2.5 }, 'socket-a')
  assert.equal(game.app.state.pool.shots, 1)
  for (let i = 0; i < 1200; i++) game.emit('update', 1 / 60)
  const client = harness({ players, state: structuredClone(game.app.state) })
  client.app.deliver = (event, body) => game.emit(event, body, 'socket-a')
  game.app.deliver = (event, body) => client.emit(event, body)
  client.created.find(n => n.name === 'prim' && n.opacity === 0).onPointerDown({ button: 'left' })
  const aiming = client.control
  assert.equal(aiming.camera.write, true)
  rack.emit('drop-cue', { slot: 0 }, 'socket-a')
  assert.equal(aiming.camera.write, false)
  assert.equal(game.app.state.pool.owner, null)
  assert.equal(client.activeControl, null)
})


test('multiple racks preserve all holders and enforce one cue per player across channels', () => {
  const players = [player('alice'), player('bob')], bus = {}
  const a = harness({ source, players, bus, server: true, props: { poolChannel: 'rack-a' } })
  const b = harness({ source, players, bus, server: true, props: { poolChannel: 'rack-b' } })
  const game = harness({ players, bus, server: true, props: { playChannel: 'table-c' } })
  a.emit('take-cue', { slot: 0 }, 'alice')
  b.emit('take-cue', { slot: 0 }, 'alice')
  assert.equal(b.app.state.holders[0], null, 'cannot take a second cue from another rack')
  b.emit('take-cue', { slot: 1 }, 'bob')
  assert.deepEqual([...game.app.state.pool.cueHolders].sort(), ['alice', 'bob'])
  a.emit('drop-cue', { slot: 0 }, 'alice')
  assert.deepEqual([...game.app.state.pool.cueHolders], ['bob'])
  b.emit('take-cue', { slot: 0 }, 'alice')
  assert.equal(b.app.state.holders[0], 'alice', 'returning a cue permits pickup elsewhere')
  a.emit('destroy')
  assert.deepEqual([...game.app.state.pool.cueHolders].sort(), ['alice', 'bob'], 'removing another rack preserves held cues')
  b.emit('destroy')
  assert.deepEqual([...game.app.state.pool.cueHolders], [])
})


test('clients hide pickup on every rack while holding a cue and aim it on either table', () => {
  const players = [player('alice')], bus = {}
  const a = harness({ source, players, bus, state: { holders: ['alice', null, null, null] } })
  const b = harness({ source, players, bus })
  assert.ok(b.created.filter(n => n.name === 'action').every(n => n.distance === 0))
  b.created.find(n => n.name === 'action').onTrigger()
  assert.equal(b.sent.some(([event]) => event === 'take-cue'), false)
  for (const channel of ['table-a', 'table-b']) {
    const game = harness({ server: true, players, cueHolders: ['alice'] })
    const client = harness({ instanceId: channel, players, bus, props: { playChannel: channel }, state: structuredClone(game.app.state) })
    client.app.deliver = (event, data) => game.emit(event, data, 'alice')
    game.app.deliver = (event, data) => client.emit(event, data)
    client.created.find(n => n.name === 'prim' && n.opacity === 0).onPointerDown({ button: 'left' })
    client.emit('update', 1 / 60)
    a.emit('update', 1 / 60)
    const cue = a.created.find(n => n.name === 'group')
    const pose = physics.shotPose(game.app.state.pool.balls[0].p, game.app.state.aim.angle)
    assert.ok(cue.position.distanceTo(pose.cuePosition.clone().add(client.app.position)) < 1e-8)
    client.emit('destroy')
  }
  a.emit('cue-holders', [null, null, null, null])
  assert.ok(b.created.filter(n => n.name === 'action').every(n => n.distance > 0))
  a.emit('cue-holders', ['alice', null, null, null])
  a.emit('destroy')
  assert.ok(b.created.filter(n => n.name === 'action').every(n => n.distance > 0))
})
