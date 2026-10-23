import test from 'node:test'
import { Vector3 } from 'three'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'
import { harness, player, physics } from './helpers.mjs'

const folder = fileURLToPath(new URL('../../src/world/collections/default/', import.meta.url))
const load = async name => parseHyp(await fs.readFile(`${folder}${name}.hyp`))
const source = pkg => pkg.assets.find(a => a.url === pkg.blueprint.script).bytes.toString()

test('the four default pool-room choices are self-contained, uniquely named, valid HYP packages', async () => {
  const manifest = JSON.parse(await fs.readFile(`${folder}manifest.json`))
  const ids = new Set()
  for (const name of ['PoolTable', 'CueRack', 'PoolLight', 'WallLightSwitch']) {
    assert.ok(manifest.apps.includes(`${name}.hyp`))
    const pkg = await load(name)
    assert.ok(!ids.has(pkg.blueprint.id))
    ids.add(pkg.blueprint.id)
    assert.equal(pkg.blueprint.unique, false)
    assert.ok(pkg.assets.some(a => a.url === pkg.blueprint.script))
    assert.ok(pkg.assets.some(a => a.url === pkg.blueprint.model))
  }
})

test('adding one pool table includes the simulator, cloth-height balls, sounds and playable controls', async () => {
  const pkg = await load('PoolTable'), players = [player('alice')]
  const props = pkg.blueprint.props
  const server = harness({ source: source(pkg), props, players, server: true, cueHolders: ['alice'] })
  const client = harness({ source: source(pkg), props, players, state: structuredClone(server.app.state) })
  server.app.deliver = (name, data) => client.emit(name, data)
  client.app.deliver = (name, data) => server.emit(name, data, 'alice')
  assert.equal(server.app.state.pool.balls.length, 16)
  assert.equal(pkg.assets.filter(a => a.type === 'audio').length, 4)
  const groups = client.created.filter(n => n.name === 'group')
  const root = groups[0], white = groups[1]
  assert.equal(root.position.y, 0.708)
  assert.equal(white.parent, root)
  assert.equal(white.position.y, physics.BALL_RADIUS)
  assert.equal(white.position.x, -physics.dimensions('8').length / 4)
  client.created.find(n => n.name === 'prim' && n.opacity === 0 && typeof n.onPointerDown === 'function').onPointerDown({ button: 'left' })
  client.emit('update', 0.06)
  const active = client.control
  assert.ok(active.camera.write)
  const ballWorldY = client.app.position.y + root.position.y + white.position.y
  assert.ok(active.camera.position.y > ballWorldY)
  active.space.onPress()
  assert.equal(server.app.state.pool.shots, 1)
  assert.equal(client.activeControl, null)
})

test('the default rack works with the default table without channel configuration', async () => {
  const rack = await load('CueRack'), table = await load('PoolTable')
  const players = [player('alice')], bus = {}
  const rackServer = harness({ source: source(rack), props: rack.blueprint.props, players, bus, server: true })
  const tableServer = harness({ source: source(table), props: table.blueprint.props, players, bus, server: true })
  // Use the rack's authenticated transport event, as in normal cue pickup.
  rackServer.emit('take-cue', { slot: 0 }, 'alice')
  assert.ok(tableServer.app.state.pool.cueHolders.includes('alice'))
})

test('the bundled wall switch controls the matching pendant light', async () => {
  const fixture = await load('PoolLight'), wall = await load('WallLightSwitch')
  assert.equal(fixture.blueprint.props.channel, wall.blueprint.props.channel)
  const players = [player('alice')], bus = {}
  const modelNodes = Object.fromEntries(['Outer', 'Inner'].flatMap(side => [0, 1, 2].map(i =>
    [`Shade${side}${i}`, { position: new Vector3(), material: {} }])))
  const light = harness({ source: source(fixture), props: fixture.blueprint.props, players, bus, server: true, modelNodes })
  const toggle = harness({ source: source(wall), props: wall.blueprint.props, players, bus, server: true })
  assert.equal(light.app.state.on, true)
  toggle.emit('billiards-wall-switch-toggle', {}, 'alice')
  assert.equal(toggle.app.state.on, false)
  assert.equal(light.app.state.on, false)
  toggle.emit('billiards-wall-switch-toggle', {}, 'alice')
  assert.equal(light.app.state.on, true)
})


test('two added tables get independent channels, accept any rack cue and keep shots separate', async () => {
  const table = await load('PoolTable'), rack = await load('CueRack')
  const players = [player('alice')], bus = {}
  const a = harness({ instanceId: 'table-a', source: source(table), props: table.blueprint.props, players, bus, server: true })
  const b = harness({ instanceId: 'table-b', source: source(table), props: table.blueprint.props, players, bus, server: true })
  const rackServer = harness({ source: source(rack), props: { poolChannel: 'unrelated-rack' }, players, bus, server: true })
  rackServer.emit('take-cue', { slot: 0 }, 'alice')
  for (const game of [a, b]) {
    game.emit('pool:claim', {}, 'alice')
    assert.equal(game.app.state.pool.owner, 'alice', 'any held cue permits play on either table')
    game.emit('pool:shoot', { seq: game.app.state.pool.seq, angle: 0, speed: 1 }, 'alice')
    assert.equal(game.app.state.pool.shots, 1)
  }
  assert.equal(table.blueprint.props.poolChannel, '', 'new tables default to automatic channels')
})


test('automatic table channels isolate volume and sharing an explicit channel keeps games independent', async () => {
  const table = await load('PoolTable'), players = [player('alice')], bus = {}
  const a = harness({ instanceId: 'table-a', source: source(table), props: { ...table.blueprint.props, soundVolume: 0 }, players, bus })
  const b = harness({ instanceId: 'table-b', source: source(table), props: { ...table.blueprint.props, soundVolume: 3 }, players, bus })
  // Client audio nodes are created lazily on an audible impact.
  for (const h of [a, b]) {
    const game = harness({ server: true, players, cueHolders: ['alice'] })
    h.emit('pool:snapshot', structuredClone(game.app.state.pool))
    h.emit('pool:snapshot', { ...structuredClone(game.app.state.pool), seq: game.app.state.pool.seq + 1, time: 0.1,
      lastEventId: 1, events: [{ id: 1, type: 'Hit', time: 0.05, position: [0, 0, 0], strength: 1 }] })
    h.emit('update', 0.1)
  }
  assert.equal(a.audioPlays[0].volume, 0)
  assert.ok(b.audioPlays[0].volume > 1, 'the other table keeps its boosted volume')
  const shared = { ...table.blueprint.props, poolChannel: 'shared' }, serverBus = {}
  const one = harness({ source: source(table), props: shared, server: true, players, bus: serverBus, cueHolders: ['alice'] })
  const two = harness({ source: source(table), props: shared, server: true, players, bus: serverBus })
  one.emit('pool:claim', {}, 'alice')
  one.emit('pool:shoot', { seq: one.app.state.pool.seq, angle: 0, speed: 1 }, 'alice')
  assert.equal(one.app.state.pool.shots, 1)
  assert.equal(two.app.state.pool.shots, 0)
  two.emit('pool:claim', {}, 'alice')
  assert.equal(two.app.state.pool.owner, 'alice')
})

test('table movement blocker uses physics-only nodes and follows placement and scale', async () => {
  const pkg = await load('PoolTable')
  const client = harness({ source: source(pkg), props: pkg.blueprint.props, players: [player('alice')] })
  const body = client.created.find(n => n.name === 'rigidbody')
  const collider = client.created.find(n => n.name === 'collider')
  assert.equal(body.type, 'static')
  assert.equal(collider.parent, body)
  assert.equal(collider.type, 'box')
  assert.equal(collider.trigger, false)
  assert.deepEqual([collider.width, collider.height, collider.depth], [2.72, 0.76, 1.53])
  assert.equal(collider.position.y - collider.height / 2, 0)
  client.app.position.set(5, 2, 3)
  client.app.scale.set(2, 1.5, 3)
  client.app.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
  client.emit('update', 0.016)
  assert.deepEqual(body.position.toArray(), [5, 2, 3])
  assert.ok(body.quaternion.equals(client.app.quaternion))
  assert.deepEqual([collider.width, collider.height, collider.depth], [2.72 * 2, 0.76 * 1.5, 1.53 * 3])
  assert.equal(collider.position.y, collider.height / 2)
})
