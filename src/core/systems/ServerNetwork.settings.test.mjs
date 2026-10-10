import assert from 'node:assert/strict'
import Module from 'node:module'
import path from 'node:path'
import test from 'node:test'
import { build } from 'esbuild'
import { getTimeOffset, getWorldTime } from '../extras/dayNight.js'

const bundle = await build({
  stdin: {
    contents: `export { ServerNetwork } from './src/core/systems/ServerNetwork.js';
      export { Settings } from './src/core/systems/Settings.js';
      export { Chat } from './src/core/systems/Chat.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'cjs',
  platform: 'node',
  write: false,
})
const filename = path.join(process.cwd(), 'src/core/systems/settings-test-bundle.cjs')
const compiled = new Module(filename)
compiled.filename = filename
compiled.paths = Module._nodeModulePaths(path.dirname(filename))
compiled._compile(bundle.outputFiles[0].text, filename)
const { ServerNetwork, Settings, Chat } = compiled.exports

test('server rejects malformed location settings instead of relaying them to other visitors', () => {
  const world = {}
  world.settings = new Settings(world)
  const network = new ServerNetwork(world)
  clearInterval(network.socketIntervalId)
  const broadcasts = []
  network.send = (...args) => broadcasts.push(args)
  const socket = { id: 'builder', player: { isBuilder: () => true } }
  const before = world.settings.serialize()
  for (const data of [
    { key: 'latitude', value: 100 },
    { key: 'longitude', value: '-74' },
    { key: 'dayNightCycle', value: 'false' },
    { key: 'timeZone', value: 'not/a-zone' },
  ])
    network.onSettingsModified(socket, data)
  assert.deepEqual(world.settings.serialize(), before)
  assert.deepEqual(
    broadcasts.filter(([event]) => event === 'settingsModified'),
    []
  )

  const data = { key: 'longitude', value: 0 }
  network.onSettingsModified(socket, data)
  assert.equal(world.settings.longitude, 0)
  assert.deepEqual(
    broadcasts.filter(([event]) => event === 'settingsModified'),
    [['settingsModified', data, 'builder']]
  )
})

function createTimeFixture(builder = true) {
  const broadcasts = []
  const replies = []
  const world = { events: { emit() {} } }
  world.settings = new Settings(world)
  const network = new ServerNetwork(world)
  clearInterval(network.socketIntervalId)
  world.network = network
  world.chat = new Chat(world)
  network.send = (...args) => broadcasts.push(args)
  const socket = {
    id: 'caller',
    player: { data: { id: 'caller' }, isBuilder: () => builder },
    send: (...args) => replies.push(args),
  }
  return { broadcasts, replies, world, network, socket }
}

test('server interprets chat in the world timezone and shares the transition and confirmation with everyone', async t => {
  const now = new Date('2026-10-10T00:00:00Z')
  t.mock.timers.enable({ apis: ['Date'], now: now.getTime() })
  const { broadcasts, replies, world, network, socket } = createTimeFixture()
  const sent = []
  const chat = new Chat({
    settings: world.settings,
    events: { emit() {} },
    network: { id: 'caller', send: (...args) => sent.push(args) },
  })
  chat.command('/time set 13h23')
  assert.equal(sent[0][0], 'command')
  const target = now.getTime() + getTimeOffset('13h23', now)
  assert.equal(sent[0][1].timeTarget, undefined)
  world.settings.set('dayNightCycle', false)
  await network.onCommand(socket, sent[0][1])
  const offset = getTimeOffset('13h23', now) - 5000
  const transition = { startedAt: now.getTime(), endsAt: now.getTime() + 5000, fromOffset: 0 }
  assert.equal(world.settings.timeOffset, offset)
  assert.equal(world.settings.dayNightCycle, true)
  assert.deepEqual(
    broadcasts.filter(([event]) => event === 'settingsModified'),
    [
      ['settingsModified', { key: 'timeOffset', value: offset }],
      ['settingsModified', { key: 'timeTransition', value: transition }],
      ['settingsModified', { key: 'dayNightCycle', value: true }],
    ]
  )
  assert.equal(replies.length, 0)
  assert.match(world.chat.msgs.at(-1).body, /13h23 \(America\/Toronto\); then continuing at normal speed/)
  assert.equal(broadcasts.at(-1)[0], 'chatAdded')
  assert.equal(getWorldTime(world.settings), now.getTime())
  const joinedSettings = new Settings({})
  joinedSettings.deserialize(world.settings.serialize())
  t.mock.timers.tick(2500)
  assert.equal(getWorldTime(joinedSettings), getWorldTime(world.settings))
  t.mock.timers.tick(2500)
  assert.equal(getWorldTime(joinedSettings), target)
  t.mock.timers.tick(60000)
  assert.equal(getWorldTime(joinedSettings), target + 60000)
})

test('time commands reject visitors and malformed times without changing the world', async () => {
  const visitor = createTimeFixture(false)
  await visitor.network.onCommand(visitor.socket, { args: ['time', 'set', '13h23'], timeTarget: Date.now() + 1000 })
  assert.deepEqual(visitor.broadcasts, [])
  assert.match(visitor.replies.at(-1)[1].body, /builder permission/)
  const { broadcasts, replies, network, socket, world } = createTimeFixture()
  for (const data of [
    { args: ['time', 'set', '24h00'], timeTarget: Date.now() + 1000 },
    { args: ['time', 'set', '13h60'] },
    { args: ['time', 'set'] },
    { args: ['time', 'reset', 'extra'] },
    { args: ['time', 'set', '13h23', 'extra'], timeTarget: Date.now() + 1000 },
    { args: ['time'] },
  ])
    await network.onCommand(socket, data)
  assert.equal(world.settings.timeOffset, 0)
  assert.deepEqual(
    broadcasts.filter(([event]) => event === 'settingsModified'),
    []
  )
  assert.equal(replies.length, 6)
  assert.ok(replies.every(([, msg]) => msg.body.startsWith('Usage:')))
})

test('/time reset removes the saved offset and enables the real-time cycle', async () => {
  const { broadcasts, network, socket, world, replies } = createTimeFixture()
  world.settings.set('timeOffset', 123456)
  world.settings.set('dayNightCycle', false)
  world.settings.set('timeTransition', { startedAt: Date.now(), endsAt: Date.now() + 5000, fromOffset: 0 })
  await network.onCommand(socket, { args: ['time', 'reset'] })
  assert.equal(world.settings.timeOffset, 0)
  assert.equal(world.settings.dayNightCycle, true)
  assert.equal(world.settings.timeTransition, null)
  assert.deepEqual(
    broadcasts.filter(([event]) => event === 'settingsModified'),
    [
      ['settingsModified', { key: 'timeOffset', value: 0 }],
      ['settingsModified', { key: 'timeTransition', value: null }],
      ['settingsModified', { key: 'dayNightCycle', value: true }],
    ]
  )
  assert.equal(replies.length, 0)
  assert.equal(world.chat.msgs.at(-1).body, 'World time reset to real time.')
  assert.equal(broadcasts.at(-1)[0], 'chatAdded')
})

test('a second command starts at the current animated time without a jump', async t => {
  const start = Date.parse('2026-10-09T14:00:00Z')
  t.mock.timers.enable({ apis: ['Date'], now: start })
  const { world, network, socket } = createTimeFixture()
  await network.onCommand(socket, { args: ['time', 'set', '18h00'], timeTarget: start + 8 * 60 * 60000 })
  t.mock.timers.tick(2500)
  const before = getWorldTime(world.settings)
  await network.onCommand(socket, { args: ['time', 'set', '20h00'], timeTarget: start + 10 * 60 * 60000 })
  assert.equal(getWorldTime(world.settings), before)
  t.mock.timers.tick(5000)
  assert.equal(getWorldTime(world.settings), start + 10 * 60 * 60000)
})

test('server ignores client-selected timestamps and uses the shared timezone', async t => {
  const now = Date.parse('2026-10-09T12:00:00Z')
  t.mock.timers.enable({ apis: ['Date'], now })
  const { world, network, socket } = createTimeFixture()
  world.settings.set('timeZone', 'Asia/Tokyo')
  await network.onCommand(socket, { args: ['time', 'set', '13h23'], timeTarget: 1e20 })
  t.mock.timers.tick(5000)
  assert.equal(world.settings.getTime(), Date.parse('2026-10-10T04:23:00Z'))
})
