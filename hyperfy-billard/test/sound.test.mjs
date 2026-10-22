import test from 'node:test'
import assert from 'node:assert/strict'
import { harness, player, physics } from './helpers.mjs'

const setup = () => {
  const players = [player('alice')]
  const server = harness({ server: true, players, cueHolders: ['alice'] })
  const client = harness({ state: structuredClone(server.app.state), players })
  const other = harness({ state: structuredClone(server.app.state), players })
  server.app.deliver = (name, data) => { client.emit(name, data); other.emit(name, data) }
  server.emit('pool:claim', {}, 'alice')
  server.emit('pool:shoot', { seq: server.app.state.pool.seq, angle: 0, speed: 5 }, 'alice')
  return { server, client, other, players }
}

test('physics records immutable positions, impact strength and simulation timestamps', () => {
  const sim = new physics.Simulation()
  sim.shoot({ angle: 0, speed: 5 })
  assert.equal(sim.events[0].type, 'Hit')
  assert.equal(sim.events[0].time, 0)
  assert.equal(sim.events[0].strength, 5)
  let impact
  for (let i = 0; i < 480; i++) {
    sim.step()
    impact = sim.events.find(e => e.type === 'Collision')
    if (impact) break
  }
  assert.ok(impact)
  const position = [...impact.position]
  const time = impact.time
  for (let i = 0; i < 480; i++) sim.step()
  assert.deepEqual(impact.position, position)
  assert.equal(impact.time, time)
  assert.ok(impact.strength > 0)
  assert.ok(sim.snapshot().time > impact.time)
  assert.ok(sim.events.some(e => e.type === 'Cushion'))
})

test('server publishes each event once and stalls advance the physics clock only by simulated work', () => {
  const { server } = setup()
  const before = server.app.state.pool.time
  server.emit('update', 2)
  assert.ok(server.app.state.pool.time - before <= 0.251)
  assert.ok(server.app.state.pool.time - before >= 0.24)
  for (let i = 0; i < 1200; i++) server.emit('update', 1 / 60)
  const events = server.sent.flatMap(([name, data]) => name === 'pool:snapshot' ? data.events : [])
  assert.ok(events.length > 10)
  assert.equal(new Set(events.map(e => e.id)).size, events.length)
  assert.equal(events.filter(e => e.type === 'Hit').length, 1)
  assert.ok(events.some(e => e.type === 'Pot'))
  for (const e of events) {
    assert.equal(e.position.length, 3)
    assert.ok(e.position.every(Number.isFinite))
    assert.ok(e.strength >= 0.03)
  }
})

test('audio waits for interpolated movement, uses contact coordinates, and ignores duplicate packets', () => {
  const { server, client } = setup()
  client.emit('update', 0.01)
  const initialCount = client.audioPlays.length
  const previous = structuredClone(server.app.state.pool)
  const event = { id: previous.lastEventId + 1, type: 'Collision', time: previous.time + 0.05,
    position: [0.2, 0.3, 0], strength: 1.25 }
  client.emit('update', 0.05)
  const snapshot = { ...previous, seq: previous.seq + 1, time: previous.time + 0.1,
    events: [event], lastEventId: event.id }
  client.emit('pool:snapshot', snapshot)
  assert.equal(client.audioPlays.length, initialCount)
  client.emit('update', 0.071) // render time is halfway between these snapshots
  assert.equal(client.audioPlays.length, initialCount + 1)
  const play = client.audioPlays.at(-1)
  assert.ok(play.src.endsWith('.ogg'))
  assert.equal(play.position.x, 0.2)
  assert.equal(play.position.z, -0.3)
  assert.equal(play.position.y, physics.BALL_RADIUS)
  assert.equal(play.volume, 0.5)
  client.emit('pool:snapshot', snapshot)
  client.emit('pool:snapshot', { ...snapshot, seq: snapshot.seq + 1 })
  client.emit('update', 0.1)
  assert.equal(client.audioPlays.length, initialCount + 1)
})

test('late join, obsolete events, distant listeners and rack reset do not replay old impacts', () => {
  const { server, client, players } = setup()
  server.app.deliver = null
  for (let i = 0; i < 60; i++) server.emit('update', 1 / 60)
  const late = harness({ state: structuredClone(server.app.state), players })
  late.emit('update', 0.2)
  assert.equal(late.audioPlays.length, 0)
  client.emit('pool:snapshot', { ...server.app.state.pool,
    events: [{ id: 1, type: 'Hit', time: 0, position: [0, 0, 0], strength: 5 }] })
  client.emit('update', 1) // old events have expired
  assert.equal(client.audioPlays.length, 0)
  const previous = structuredClone(server.app.state.pool)
  const event = { id: previous.lastEventId + 1, type: 'Hit', time: previous.time + 0.1,
    position: [0, 0, 0], strength: 5 }
  client.emit('pool:snapshot', { ...previous, seq: previous.seq + 1,
    time: event.time, events: [event], lastEventId: event.id })
  // Re-rack before the queued impact reaches the screen.
  client.emit('pool:snapshot', { ...previous, rack: previous.rack + 1, seq: previous.seq + 2,
    time: 0, events: [], lastEventId: event.id })
  client.emit('update', 0.2)
  assert.equal(client.audioPlays.length, 0)
  players[0].position.x = 50
  client.emit('pool:snapshot', { ...previous, rack: previous.rack + 1, seq: previous.seq + 3,
    events: [{ ...event, id: event.id + 1, time: previous.time }], lastEventId: event.id + 1 })
  client.emit('update', 0.2)
  players[0].position.x = 0
  client.emit('update', 0.2)
  assert.equal(client.audioPlays.length, 0)
})

test('break sounds overlap with bounded spatial voices, and both clients play the same events', () => {
  const { server, client, other } = setup()
  for (let i = 0; i < 1200; i++) {
    server.emit('update', 1 / 60)
    client.emit('update', 1 / 60)
    other.emit('update', 1 / 60)
  }
  const a = client.audioPlays
  assert.ok(a.length > 10)
  assert.deepEqual(a.map(p => [p.src, p.volume, p.position.toArray()]),
    other.audioPlays.map(p => [p.src, p.volume, p.position.toArray()]))
  const voices = client.created.filter(n => n.name === 'audio')
  assert.ok(voices.length > 1 && voices.length <= 24)
  assert.ok(voices.every(n => n.group === 'sfx' && n.spatial))
  assert.ok(voices.every(n => n.stops > 0))
})

test('visible table volume setting boosts, mutes and restores pool sounds across startup order', async () => {
  const { readFile } = await import('node:fs/promises')
  const { root } = await import('./helpers.mjs')
  const source = await readFile(`${root}upstream-table/table.js`, 'utf8')
  for (const tableFirst of [false, true]) {
    const players = [player('alice')], bus = {}
    const server = harness({ server: true, players, cueHolders: ['alice'] })
    const makeTable = volume => harness({ source, players, bus, props: { soundVolume: volume } })
    if (tableFirst) makeTable(3)
    const client = harness({ players, bus, state: structuredClone(server.app.state) })
    if (!tableFirst) makeTable(3)
    server.app.deliver = (name, data) => client.emit(name, data)
    server.emit('pool:claim', {}, 'alice')
    server.emit('pool:shoot', { seq: server.app.state.pool.seq, angle: 0, speed: 5 }, 'alice')
    client.emit('update', 0.01)
    assert.equal(client.audioPlays[0].volume, 3)
    const voice = client.audioPlays[0].node
    client.world.emit('billard:volume:classic-8-ft-pool-table', 0)
    assert.equal(voice.volume, 0, 'mute applies to an already playing sound')
    client.world.emit('billard:volume:classic-8-ft-pool-table', 1)
    assert.equal(voice.volume, 1)
    client.world.emit('billard:volume:classic-8-ft-pool-table', 99)
    assert.equal(voice.volume, 5)
    client.world.emit('billard:volume:another-table', 0)
    assert.equal(voice.volume, 5, 'table channels stay independent')
  }
})
