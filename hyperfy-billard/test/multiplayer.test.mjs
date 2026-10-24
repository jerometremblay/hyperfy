import test from 'node:test'
import assert from 'node:assert/strict'
import { harness, player } from './helpers.mjs'
const setup = () => {
  const players = [player('alice', 'socket-a'), player('bob', 'socket-b')]
  return { players, server: harness({ server: true, players, cueHolders: players.map(p => p.id) }) }
}

test('sender authentication, exclusive claim, distance, duplicate and stale commands', () => {
  const { server, players } = setup()
  const send = (op, body, who = 'socket-a') => server.emit(`pool:${op}`, body, who)
  send('shoot', { seq: 1, angle: 0, speed: 5, playerId: 'alice' }, 'forged')
  assert.equal(server.app.state.pool.shots, 0)
  send('claim', {})
  assert.equal(server.app.state.pool.owner, 'alice')
  send('claim', {}, 'socket-b')
  assert.equal(server.app.state.pool.owner, 'alice')
  const seq = server.app.state.pool.seq
  send('shoot', { seq, angle: 0, speed: 5 }, 'socket-b')
  assert.equal(server.app.state.pool.shots, 0)
  send('shoot', { seq, angle: 0, speed: 5 })
  assert.equal(server.app.state.pool.shots, 1)
  assert.equal(server.app.state.pool.owner, null)
  send('shoot', { seq, angle: 0, speed: 5 })
  send('reset', { seq })
  assert.equal(server.app.state.pool.shots, 1)
  players[0].position.x = 20
  server.emit('update', 0.1)
  assert.equal(server.app.state.pool.owner, null)
  send('claim', {})
  assert.equal(server.app.state.pool.owner, null)
  send('claim', {}, 'socket-b')
  assert.equal(server.app.state.pool.owner, null, 'cannot aim while balls move')
  for (let i = 0; i < 1200; i++) server.emit('update', 1 / 60)
  send('claim', {}, 'socket-b')
  assert.equal(server.app.state.pool.owner, 'bob')
})
test('late join, two real-node clients, interpolation, input release, snapshots at rest', () => {
  const { server, players } = setup()
  const alice = harness({ state: structuredClone(server.app.state), players })
  const bob = harness({ state: structuredClone(server.app.state), players: [players[1], players[0]] })
  server.app.deliver = (event, value) => {
    alice.emit(event, value)
    bob.emit(event, value)
  }
  alice.app.deliver = (event, value) => server.emit(event, value, 'socket-a')
  bob.app.deliver = (event, value) => server.emit(event, value, 'socket-b')
  alice.created.find(n => n.name === 'prim' && n.opacity === 0).onPointerDown({ button: 'left' })
  assert.ok(alice.control)
  assert.equal(alice.control.keyW.capture, true)
  assert.equal(alice.control.camera.write, true)
  assert.equal(bob.activeControl, null)
  alice.emit('update', 1 / 60)
  const aimingControl = alice.control
  aimingControl.space.onPress()
  assert.equal(aimingControl.camera.write, false)
  assert.equal(alice.activeControl, null)
  assert.equal(server.app.state.pool.owner, null)
  for (let i = 0; i < 900; i++) {
    server.emit('update', 1 / 60)
    alice.emit('update', 1 / 60)
    bob.emit('update', 1 / 60)
  }
  assert.equal(server.app.state.pool.error, null)
  assert.equal(server.app.state.pool.moving, false)
  // Both clients render the exact same authoritative final positions.
  const groups = c => c.created.filter(n => n.name === 'group')
  for (let i = 0; i < 16; i++) {
    const a = groups(alice)[i],
      b = groups(bob)[i],
      p = server.app.state.pool.balls[i].p
    assert.ok(a.position.distanceTo(b.position) < 1e-8)
    assert.ok(Math.abs(a.position.x - p[0]) < 1e-8)
    assert.equal(a.physics, undefined)
  }
  const late = harness({ state: structuredClone(server.app.state), players: [players[1]] })
  late.emit('update', 0.2)
  assert.ok(Math.abs(groups(late)[0].position.x - server.app.state.pool.balls[0].p[0]) < 1e-8)
  const count = server.sent.length
  server.emit('update', 1)
  assert.equal(server.sent.length, count)
  assert.equal(server.app.state.pool.owner, null)
  assert.ok(alice.released >= 2)
  assert.ok(alice.created.filter(n => n.name === 'prim').every(n => n.physics === null))
})
test('disconnect and abandoned lease release ownership without stopping a shot', () => {
  const { server, players } = setup()
  server.emit('pool:claim', {}, 'socket-a')
  server.emit('pool:shoot', { seq: server.app.state.pool.seq, angle: 0, speed: 5 }, 'socket-a')
  players.shift()
  server.emit('update', 0.1)
  assert.equal(server.app.state.pool.owner, null)
  assert.equal(server.app.state.pool.moving, true)
  server.emit('pool:claim', {}, 'socket-b')
  assert.equal(server.app.state.pool.owner, null)
  for (let i = 0; i < 1200; i++) server.emit('update', 1 / 60)
  server.emit('pool:claim', {}, 'socket-b')
  assert.equal(server.app.state.pool.owner, 'bob')
  server.emit('update', 61)
  assert.equal(server.app.state.pool.owner, null)
})
test('client initializes after its local player arrives', () => {
  const players = []
  const client = harness({ players })
  assert.equal(client.created.filter(n => n.name === 'ui').length, 0)
  players.push(player('late'))
  client.world.emit('player', { playerId: 'late' })
  assert.equal(client.created.filter(n => n.name === 'ui').length, 1)
  client.world.emit('player', { playerId: 'late' })
  assert.equal(client.created.filter(n => n.name === 'ui').length, 1)
})
