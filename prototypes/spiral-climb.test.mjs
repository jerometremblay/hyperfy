import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const spiralSource = await readFile(new URL('./spiral-climb.js', import.meta.url), 'utf8')
const leaderboardSource = await readFile(new URL('./spiral-climb-leaderboard.js', import.meta.url), 'utf8')

function buildApp({ isServer = false, isClient = false, players = {}, storedScores = {}, state = {}, source = spiralSource } = {}) {
  const nodes = []
  const sent = []
  const emitted = []
  const handlers = new Map()
  const worldHandlers = new Map()
  const storage = new Map(Object.entries(storedScores))
  const chats = []
  const app = {
    instanceId: 'spiral-climb-test-instance',
    state: { ...state },
    create(type, data) {
      const node = {
        kind: type,
        children: [],
        ...data,
        add(child) {
          if (child.parent) child.parent.remove(child)
          child.parent = this
          this.children.push(child)
          return this
        },
        remove(child) {
          const index = this.children.indexOf(child)
          if (index === -1) return this
          child.parent = null
          this.children.splice(index, 1)
          return this
        },
      }
      nodes.push(node)
      return node
    },
    add() {},
    on(name, callback) {
      handlers.set(name, callback)
    },
    send(name, data) {
      sent.push({ name, data })
    },
    emit(name, data) {
      emitted.push({ name, data })
    },
  }
  const world = {
    isServer,
    isClient,
    networkId: 'player-session',
    get(key) {
      return storage.get(key)
    },
    set(key, value) {
      storage.set(key, value)
    },
    getPlayer(playerId) {
      return players[playerId] || null
    },
    getPlayers() {
      return Object.values(players)
    },
    on(name, callback) {
      worldHandlers.set(name, callback)
    },
    getTimestamp() {
      return '2026-09-11T00:00:00.000Z'
    },
    chat(message, broadcast) {
      chats.push({ message, broadcast })
    },
  }

  vm.runInNewContext(source, { app, world, console, Date })
  return { app, nodes, sent, emitted, handlers, worldHandlers, storage, chats }
}

test('builds 200 static circular plates with jump-sized gaps', () => {
  const { nodes } = buildApp()
  const plates = nodes.filter(node => node.kind === 'prim' && node.type === 'cylinder' && !node.trigger)
  const triggers = nodes.filter(node => node.kind === 'prim' && node.trigger)

  assert.equal(plates.length, 200)
  assert.equal(triggers.length, 200)
  assert.ok(plates.every(plate => plate.kind === 'prim' && plate.type === 'cylinder'))
  assert.ok(plates.every(plate => plate.size[0] === 1.2 && plate.size[1] === 1.2))
  assert.ok(plates.every(plate => plate.size[0] * 2 <= 3))
  assert.ok(plates.every(plate => plate.physics === 'static'))
  assert.ok(
    triggers.every(
      trigger =>
        trigger.kind === 'prim' &&
        trigger.type === 'box' &&
        trigger.physics === 'static' &&
        trigger.trigger === true &&
        trigger.opacity === 0 &&
        trigger.transparent === true &&
        typeof trigger.onTriggerEnter === 'function'
    )
  )

  const radii = plates.map(plate => Math.hypot(plate.position[0], plate.position[2]))
  assert.equal(radii[0], 0)
  assert.equal(radii[1], 3.2)
  assert.ok(Math.abs(radii.at(-1) - 24) < 0.000001)
  assert.ok(radii.every(radius => radius <= 24.000001))

  const horizontalDistances = []
  for (let index = 1; index < plates.length; index++) {
    const previous = plates[index - 1].position
    const current = plates[index].position
    const horizontalDistance = Math.hypot(current[0] - previous[0], current[2] - previous[2])
    const edgeGap = horizontalDistance - 2 * 1.2

    horizontalDistances.push(horizontalDistance)
    assert.ok(Math.abs(current[1] - previous[1] - 0.5) < 0.000001)
    assert.ok(horizontalDistance >= 3.2 - 0.000001)
    assert.ok(horizontalDistance <= 4.8 + 0.000001)
    assert.ok(index === 1 || horizontalDistance > horizontalDistances[index - 2])
    assert.ok(edgeGap >= 0.8 - 0.000001)
  }

  assert.ok(Math.abs(horizontalDistances[0] - 3.2) < 0.000001)
  assert.ok(Math.abs(horizontalDistances.at(-1) - 4.8) < 0.000001)
})

test('builds a static grounded billboard frame around the records board', () => {
  const { nodes } = buildApp({ source: leaderboardSource })
  const panel = nodes.find(node => node.tag === 'spiral-climb-leaderboard-panel')
  const posts = nodes.filter(node => node.tag?.startsWith('spiral-climb-leaderboard-post-'))
  const resetButton = nodes.find(node => node.tag === 'spiral-climb-leaderboard-reset-button')
  const resetButtonLabel = nodes.find(node => node.tag === 'spiral-climb-leaderboard-reset-label')
  const resetAction = nodes.find(node => node.kind === 'action')

  assert.equal(panel.type, 'box')
  assert.deepEqual([...panel.size], [2.9, 4, 0.18])
  assert.equal(panel.physics, 'static')
  assert.equal(posts.length, 2)
  assert.ok(posts.every(post => post.type === 'box' && post.physics === 'static'))
  assert.ok(posts.every(post => post.position[1] - post.size[1] / 2 === 0))
  assert.ok(posts.every(post => Math.abs(post.position[0]) === 1.55))
  assert.deepEqual([...resetButton.size], [1.9, 0.75, 0.45])
  assert.equal(resetButton.color, '#dc2626')
  assert.equal(resetButton.physics, 'static')
  assert.equal(resetButton.position[1] - resetButton.size[1] / 2, 0)
  assert.equal(resetButtonLabel.children[0].value, 'RESET')
  assert.equal(resetAction.label, 'Reset climb')
  assert.equal(resetAction.duration, 0.35)
})

test('sends a reset request from the physical board button', () => {
  const runtime = buildApp({ source: leaderboardSource, isClient: true })
  const resetAction = runtime.nodes.find(node => node.kind === 'action')

  resetAction.onTrigger()

  assert.equal(runtime.sent.length, 1)
  assert.equal(runtime.sent[0].name, 'resetClimb')
})

test('sends only local landings to the server', () => {
  const runtime = buildApp({ isClient: true })
  const trigger = runtime.nodes.filter(node => node.trigger)[2]

  trigger.onTriggerEnter({ isLocalPlayer: false })
  assert.deepEqual(runtime.sent, [])

  trigger.onTriggerEnter({ isLocalPlayer: true })
  assert.equal(runtime.sent.length, 1)
  assert.equal(runtime.sent[0].name, 'stepReached')
  assert.equal(runtime.sent[0].data.step, 3)
})

test('persists each player life score and announces a new record', () => {
  const player = { id: 'user-1', userId: 'user-1', name: 'Ada' }
  const runtime = buildApp({ isServer: true, players: { 'player-session': player } })
  const onStepReached = runtime.handlers.get('stepReached')
  runtime.sent.length = 0

  onStepReached({ step: 0 }, 'player-session')
  onStepReached({ step: 201 }, 'player-session')
  onStepReached({ step: 1 }, 'unknown-player')
  assert.equal(runtime.storage.size, 0)
  assert.equal(runtime.chats.length, 0)
  assert.equal(runtime.sent.length, 0)

  onStepReached({ step: 4 }, 'player-session')

  assert.equal(runtime.storage.get('spiral-climb:score:user-1'), 4)
  const persistedRecords = runtime.storage.get('spiral-climb:records')
  assert.equal(persistedRecords['user-1'].name, 'Ada')
  assert.equal(persistedRecords['user-1'].score, 4)
  assert.equal(runtime.chats.length, 1)
  assert.equal(runtime.chats[0].broadcast, true)
  assert.equal(runtime.chats[0].message.from, 'Spiral Climb')
  assert.equal(runtime.chats[0].message.fromId, null)
  assert.equal(runtime.chats[0].message.body, 'Ada reached stair 4 — new life score!')
  assert.equal(typeof runtime.chats[0].message.createdAt, 'string')
  const progressUpdate = runtime.sent.find(event => event.name === 'progressChanged')
  const recordsUpdate = runtime.sent.find(event => event.name === 'recordsChanged')
  assert.equal(progressUpdate.name, 'progressChanged')
  assert.equal(progressUpdate.data.playerId, 'user-1')
  assert.equal(progressUpdate.data.highestStep, 4)
  assert.equal(progressUpdate.data.lifeScore, 4)
  assert.equal(recordsUpdate.data.records['user-1'].name, 'Ada')
  assert.equal(recordsUpdate.data.records['user-1'].score, 4)

  onStepReached({ step: 4 }, 'player-session')
  onStepReached({ step: 2 }, 'player-session')
  assert.equal(runtime.chats.length, 1)
  assert.equal(runtime.sent.length, 2)

  onStepReached({ step: 5 }, 'player-session')
  assert.equal(runtime.storage.get('spiral-climb:score:user-1'), 5)
  assert.equal(runtime.chats.length, 2)
  assert.equal(runtime.sent.length, 4)
})

test('does not announce when a step is below the persisted life score', () => {
  const player = { id: 'user-1', userId: 'user-1', name: 'Ada' }
  const runtime = buildApp({
    isServer: true,
    players: { 'player-session': player },
    storedScores: { 'spiral-climb:score:user-1': 8 },
  })
  runtime.sent.length = 0

  runtime.handlers.get('stepReached')({ step: 6 }, 'player-session')

  assert.equal(runtime.chats.length, 0)
  const progressUpdate = runtime.sent.find(event => event.name === 'progressChanged')
  assert.equal(progressUpdate.data.playerId, 'user-1')
  assert.equal(progressUpdate.data.highestStep, 6)
  assert.equal(progressUpdate.data.lifeScore, 8)
  assert.equal(runtime.sent.length, 1)
  const persistedRecords = runtime.storage.get('spiral-climb:records')
  assert.equal(persistedRecords['user-1'].name, 'Ada')
  assert.equal(persistedRecords['user-1'].score, 8)
})

test('resets a player attempt without changing their life score', () => {
  const player = {
    id: 'user-1',
    userId: 'user-1',
    name: 'Ada',
    teleport(position) {
      this.teleportedTo = position
    },
  }
  const runtime = buildApp({
    isServer: true,
    players: { 'player-session': player },
    storedScores: { 'spiral-climb:score:user-1': 8 },
  })
  runtime.app.position = {
    clone() {
      return { x: 3, y: 0, z: -6 }
    },
  }
  const onStepReached = runtime.handlers.get('stepReached')

  onStepReached({ step: 4 }, 'player-session')
  runtime.sent.length = 0

  runtime.worldHandlers.get('spiralClimbReset')({ playerId: 'player-session' })

  const resetUpdate = runtime.sent.find(event => event.name === 'progressChanged')
  assert.equal(resetUpdate.data.highestStep, 0)
  assert.equal(resetUpdate.data.lifeScore, 8)
  assert.equal(resetUpdate.data.reset, true)
  assert.equal(player.teleportedTo.x, 3)
  assert.equal(player.teleportedTo.y, 0.45)
  assert.equal(player.teleportedTo.z, -6)

  runtime.sent.length = 0
  runtime.chats.length = 0
  onStepReached({ step: 1 }, 'player-session')

  const nextAttemptUpdate = runtime.sent.find(event => event.name === 'progressChanged')
  assert.equal(nextAttemptUpdate.data.highestStep, 1)
  assert.equal(nextAttemptUpdate.data.lifeScore, 8)
  assert.equal(runtime.chats.length, 0)
  assert.equal(runtime.storage.get('spiral-climb:score:user-1'), 8)
})

test('migrates legacy records into the shared leaderboard storage', () => {
  const runtime = buildApp({
    isServer: true,
    storedScores: {
      'spiral-climb:spiral-climb-test-instance:records': {
        'user-1': { name: 'Ada', score: 8 },
      },
    },
  })

  assert.equal(JSON.stringify(runtime.storage.get('spiral-climb:records')), JSON.stringify({
    'user-1': { name: 'Ada', score: 8 },
  }))
})

test('broadcasts migrated records when the climbing app initializes', () => {
  const runtime = buildApp({
    isServer: true,
    storedScores: {
      'spiral-climb:spiral-climb-test-instance:records': {
        'user-1': { name: 'Ada', score: 8 },
      },
    },
  })

  const recordsEvent = runtime.emitted.find(event => event.name === 'recordsChanged')
  assert.ok(recordsEvent)
  assert.equal(recordsEvent.data.records['user-1'].score, 8)
})

test('relays shared record updates to leaderboard clients', () => {
  const runtime = buildApp({ isServer: true, source: leaderboardSource })
  runtime.sent.length = 0

  runtime.worldHandlers.get('recordsChanged')({
    records: {
      'user-1': { name: 'Ada', score: 8 },
    },
  })

  assert.equal(JSON.stringify(runtime.sent), JSON.stringify([
    {
      name: 'recordsChanged',
      data: { records: { 'user-1': { name: 'Ada', score: 8 } } },
    },
  ]))
})

test('forwards reset button requests with the authenticated player id', () => {
  const runtime = buildApp({ source: leaderboardSource, isServer: true })

  runtime.handlers.get('resetClimb')({ playerId: 'spoofed-player' }, 'player-session')

  const resetEvent = runtime.emitted.find(event => event.name === 'spiralClimbReset')
  assert.equal(resetEvent.data.playerId, 'player-session')
})

test('renders a billboard with every persisted player record', () => {
  const runtime = buildApp({
    source: leaderboardSource,
    isClient: true,
    state: {
      ready: true,
      records: {
        'user-1': { name: 'Zoe', score: 3 },
        'user-2': { name: 'Ada', score: 8 },
      },
    },
  })

  const board = runtime.nodes.find(node => node.kind === 'ui')
  const recordsContainer = runtime.nodes.find(node => node.kind === 'uiview')

  assert.equal(board.billboard, 'none')
  assert.deepEqual([...board.position], [0, 2.15, -2.88])
  assert.equal(board.children.length, 3)
  assert.equal(recordsContainer.children.length, 2)
  assert.equal(recordsContainer.children[0].value, '1. Ada — stair 8')
  assert.equal(recordsContainer.children[1].value, '2. Zoe — stair 3')
})
