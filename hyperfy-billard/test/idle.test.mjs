import test from 'node:test'
import assert from 'node:assert/strict'
import { harness, player } from './helpers.mjs'

const updates = app => app.handlers.update?.length || 0

test('server leases renew and expire without any idle frame callbacks', () => {
  const server = harness({ server: true, players: [player('alice')], cueHolders: ['alice'] })
  assert.equal(updates(server), 0)
  server.emit('pool:claim', {}, 'alice')
  assert.equal(server.app.state.pool.owner, 'alice')
  assert.equal(updates(server), 0)
  server.advanceTime(30)
  server.emit('pool:ping', {}, 'alice')
  assert.equal(server.pendingTimers, 1, 'renewal does not accumulate timers')
  server.advanceTime(31)
  assert.equal(server.app.state.pool.owner, 'alice')
  server.advanceTime(30)
  assert.equal(server.app.state.pool.owner, null)
  assert.equal(updates(server), 0)
  assert.equal(server.pendingTimers, 0)
})

test('physics and client rendering wake for a shot and detach after balls and sounds settle', () => {
  const players = [player('alice')]
  const server = harness({ server: true, players, cueHolders: ['alice'] })
  const client = harness({ players, state: structuredClone(server.app.state) })
  server.app.deliver = (event, body) => client.emit(event, body)
  client.app.deliver = (event, body) => server.emit(event, body, 'alice')
  assert.equal(updates(client), 0)
  const balls = client.created.filter(node => node.name === 'group')
  assert.equal(balls[0].position.x, server.app.state.pool.balls[0].p[0], 'initial positions need no frame')
  const surface = client.created.find(node => node.name === 'prim' && node.opacity === 0)
  surface.onPointerDown({ button: 'left' })
  assert.equal(updates(client), 1)
  assert.equal(updates(server), 0, 'aiming does not activate server physics')
  client.emit('update', 1 / 60)
  client.control.space.onPress()
  assert.equal(updates(server), 1)
  for (let i = 0; i < 1800; i++) {
    server.emit('update', 1 / 60)
    client.emit('update', 1 / 60)
  }
  assert.equal(server.app.state.pool.moving, false)
  assert.equal(updates(server), 0)
  assert.equal(updates(client), 0)
  for (let i = 0; i < balls.length; i++)
    assert.ok(Math.abs(balls[i].position.x - server.app.state.pool.balls[i].p[0]) < 1e-8)
  assert.ok(client.created.filter(node => node.name === 'audio').every(node => node.stops > 0))
  surface.onPointerDown({ button: 'left' })
  assert.equal(updates(client), 1, 'next play wakes a sleeping client')
  client.control.escape.onPress()
  client.emit('update', 0.2)
  assert.equal(updates(client), 0)
})

test('pointer exit and snapshots wake an idle client without accumulating callbacks', () => {
  const players = [player('alice')]
  const server = harness({ server: true, players, cueHolders: ['alice'] })
  const client = harness({ players, state: structuredClone(server.app.state) })
  const surface = client.created.find(node => node.name === 'prim' && node.opacity === 0)
  surface.onPointerEnter()
  assert.equal(client.actionPrompts[0].label, 'Play')
  assert.equal(updates(client), 0)
  surface.onPointerLeave()
  assert.equal(updates(client), 1)
  client.emit('update', 1 / 60)
  assert.equal(client.actionPrompts.length, 0)
  assert.equal(updates(client), 0)
  const snapshot = structuredClone(server.app.state.pool)
  snapshot.seq++
  snapshot.balls[0].p[0] += 0.1
  client.emit('pool:snapshot', snapshot)
  client.emit('pool:aim', null)
  assert.equal(updates(client), 1)
  client.emit('update', 0.2)
  assert.equal(updates(client), 0)
  assert.equal(client.created.find(node => node.name === 'group').position.x, snapshot.balls[0].p[0])
})
