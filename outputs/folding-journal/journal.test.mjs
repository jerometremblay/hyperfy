import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import { Vector3, Quaternion, Euler, Matrix4 } from 'three'
import { readPacket, writePacket } from '../../src/core/packets.js'

const source = fs.readFileSync(new URL('./journal.js', import.meta.url), 'utf8')
const NEWS_ORIGIN = 'https://hyperfy-news.jerometremblay.chatgpt.site'

function fixture() {
  let now = 0
  const runtimes = []
  const players = {
    alice: {
      id: 'alice',
      position: new Vector3(0, 0, 1),
      quaternion: new Quaternion(),
      height: 1.7,
      headToHeight: 0.1,
    },
    bob: { id: 'bob', position: new Vector3(1, 0, 1), quaternion: new Quaternion(), height: 1.7, headToHeight: 0.1 },
  }
  function runtime(server, localId = 'alice', state = { open: false }) {
    const events = new Map(),
      worldEvents = new Map(),
      updates = new Set(),
      timers = [],
      sent = []
    const app = {
      state: structuredClone(state),
      position: new Vector3(),
      quaternion: new Quaternion(),
      scale: new Vector3(1, 1, 1),
      create(type, data = {}) {
        return {
          ...data,
          type,
          active: true,
          position: new Vector3().fromArray(data.position || [0, 0, 0]),
          rotation: new Euler().fromArray(data.rotation || [0, 0, 0]),
          scale: new Vector3().fromArray(data.scale || [1, 1, 1]),
          add(child) {
            child.parent = this
          },
        }
      },
      add(child) {
        child.parent = this
      },
      on(event, fn) {
        if (event === 'update') updates.add(fn)
        else events.set(event, fn)
      },
      off(event, fn) {
        if (event === 'update') updates.delete(fn)
        else events.delete(event)
      },
      send(event, data) {
        const [, packet] = readPacket(writePacket('entityEvent', ['journal', 1, event, data]))
        sent.push([packet[2], packet[3]])
      },
      control() {
        return {
          camera: { position: new Vector3(0, 1.6, 1), quaternion: new Quaternion(), zoom: 0 },
          escape: {},
          keyE: {},
        }
      },
    }
    const world = {
      isServer: server,
      isClient: !server,
      isBuilding: false,
      getPlayer: id => players[id ?? localId],
      getTime: () => now,
      on: (event, fn) => worldEvents.set(event, fn),
    }
    const context = vm.createContext({
      app,
      world,
      Vector3,
      Quaternion,
      Matrix4,
      setTimeout: (fn, milliseconds) => timers.push({ fn, at: now + milliseconds / 1000 }),
    })
    vm.runInContext(source, context)
    const result = {
      app,
      world,
      sent,
      events,
      timers,
      updates,
      get: expression => vm.runInContext(expression, context),
    }
    runtimes.push(result)
    return result
  }
  function advance(time) {
    const dt = time - now
    now = time
    for (const runtime of runtimes) {
      for (const timer of runtime.timers.filter(timer => !timer.done && timer.at <= now)) {
        timer.done = true
        timer.fn()
      }
      for (const fn of [...runtime.updates]) fn(dt)
    }
  }
  function deliver(client, packet) {
    client.events.get(packet[0])(structuredClone(packet[1]))
  }
  function deliverManifest(client) {
    client.get(`
      receiveHtmlPageCount({
        origin: NEWS_ORIGIN,
        data: {
          type: 'journal-page-count',
          version: 1,
          count: 6,
          pageCount: 6,
          pages: Array.from({ length: 6 }, (_, index) => ({
            page: index + 1,
            issuePage: index + 1,
            url: '/?issue=2026-10-17&texture=1&page=' + (index + 1),
          })),
        },
      })
    `)
  }
  function acknowledgePageCount(server, ...clients) {
    for (const client of clients) deliverManifest(client)
    const countRequest = clients
      .flatMap(client => client.sent)
      .findLast(([event]) => event === 'journal:page-count')
    server.events.get('journal:page-count')(countRequest?.[1] || { version: 1, count: 6 }, 'alice')
    for (const client of clients) deliver(client, server.sent.at(-1))
  }
  function open(server, ...clients) {
    server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
    for (const client of clients) deliver(client, server.sent.at(-1))
    acknowledgePageCount(server, ...clients)
    advance(now + 0.7)
  }
  return { runtime, advance, deliver, open, acknowledgePageCount }
}

test('server broadcasts a timestamped turn; delayed viewers animate the same phase and late joiners see the current spread', () => {
  const f = fixture(),
    server = f.runtime(true),
    alice = f.runtime(false),
    bob = f.runtime(false, 'bob')
  f.open(server, alice, bob)
  alice.get('turnPage(1)')
  assert.equal(alice.get('turn'), null, 'click requests the server without starting a private animation')
  server.events.get('journal:turn-request')(alice.sent.at(-1)[1], 'alice')
  const start = server.sent.at(-1)
  assert.equal(start[0], 'journal:pages')
  assert.equal(server.app.state.firstPage, 3)
  f.deliver(alice, start)
  f.advance(0.9)
  f.deliver(bob, start)
  assert.equal(alice.get('turn.startedAt'), bob.get('turn.startedAt'))
  assert.equal(
    alice.get('(world.getTime()-turn.startedAt)/TURN_DURATION'),
    bob.get('(world.getTime()-turn.startedAt)/TURN_DURATION')
  )
  const joining = f.runtime(false, 'bob', server.app.state)
  assert.equal(joining.get('turn.destination'), 3)
  assert.equal(joining.get('turn.startedAt'), alice.get('turn.startedAt'))
  f.advance(1.4)
  for (const client of [alice, bob, joining]) {
    f.deliver(client, server.sent.at(-1))
    assert.equal(client.get('firstPage'), 3)
    assert.equal(client.get('turn'), null)
  }
  assert.equal(f.runtime(false, 'bob', server.app.state).get('firstPage'), 3)
})

test('issue page clicks request turns only from the journal origin and in the clicked page direction', () => {
  const f = fixture(),
    server = f.runtime(true),
    client = f.runtime(false)
  f.open(server, client)

  const rightPage = client.get('pageSurfaces[1].page')
  assert.equal(rightPage.interactive, true)
  assert.match(rightPage.src, /&embed=1&hyperfy=1$/)
  assert.equal(typeof rightPage.onMessage, 'function')
  for (const event of [
    { origin: 'https://untrusted.example', data: { type: 'journal-page-click', version: 1, button: 0 } },
    { origin: NEWS_ORIGIN, data: { type: 'journal-page-click', version: 2, button: 0 } },
    { origin: NEWS_ORIGIN, data: { type: 'journal-page-click', version: 1, button: 1 } },
  ]) {
    rightPage.onMessage(event)
  }
  assert.equal(client.sent.some(([name]) => name === 'journal:turn-request'), false)

  rightPage.onMessage({
    origin: NEWS_ORIGIN,
    data: { type: 'journal-page-click', version: 1, button: 0 },
  })
  assert.deepEqual(client.sent.findLast(([name]) => name === 'journal:turn-request')[1], { direction: 1 })

  const back = fixture(),
    backServer = back.runtime(true),
    backClient = back.runtime(false)
  back.open(backServer, backClient)
  backClient.get('pageSurfaces[0].page.onMessage')({
    origin: NEWS_ORIGIN,
    data: { type: 'journal-page-click', version: 1, button: 0 },
  })
  assert.deepEqual(backClient.sent.findLast(([name]) => name === 'journal:turn-request')[1], { direction: -1 })
})

test('focused page keyboard closes the journal with Escape or unmodified E', () => {
  const f = fixture(),
    server = f.runtime(true),
    client = f.runtime(false)
  f.open(server, client)
  client.get('world.getPlayer().getBoneTransform = () => null')
  const page = client.get('pageSurfaces[1].page')
  let released = 0

  function keydown(key, options = {}) {
    page.onMessage({
      origin: NEWS_ORIGIN,
      data: {
        channel: 'hyperfy-webview',
        version: 1,
        type: 'event',
        name: 'keydown',
        detail: {
          key,
          code: options.code || (key === 'Escape' ? 'Escape' : 'KeyE'),
          isTrusted: true,
          defaultPrevented: false,
          repeat: false,
          isComposing: false,
          altKey: options.altKey || false,
          ctrlKey: options.ctrlKey || false,
          metaKey: options.metaKey || false,
          shiftKey: options.shiftKey || false,
          target: options.target || { isEditable: false },
        },
      },
      releaseFocus() { released++ },
    })
  }

  keydown('Escape', { target: { isEditable: true } })
  keydown('e')
  keydown('e', { target: { isEditable: true } })
  keydown('e', { shiftKey: true })

  const closeRequests = client.sent.filter(([name]) => name === 'journal:toggle')
  assert.equal(closeRequests.length, 2)
  assert.equal(released, 2)
  for (const [, request] of closeRequests) {
    server.events.get('journal:toggle')(request, 'alice')
  }
  assert.equal(server.app.state.open, false)
})

test('server enforces opener ownership, bounds, valid direction and one turn at a time', () => {
  const f = fixture(),
    server = f.runtime(true)
  f.open(server)
  for (const [sender, direction] of [
    ['bob', 1],
    ['alice', 0],
    ['alice', -1],
    ['unknown', 1],
  ]) {
    server.events.get('journal:turn-request')({ direction }, sender)
    assert.equal(server.app.state.firstPage, 1)
  }
  server.events.get('journal:turn-request')({ direction: 1 }, 'alice')
  assert.equal(server.app.state.firstPage, 3)
  server.events.get('journal:turn-request')({ direction: 1 }, 'alice')
  assert.equal(server.app.state.firstPage, 3)
  f.advance(1.4)
  server.events.get('journal:turn-request')({ direction: 1 }, 'alice')
  assert.equal(server.app.state.firstPage, 5)
  f.advance(2.1)
  server.events.get('journal:turn-request')({ direction: 1 }, 'alice')
  assert.equal(server.app.state.firstPage, 5)
  server.events.get('journal:turn-request')({ direction: -1 }, 'alice')
  assert.equal(server.app.state.firstPage, 3)
})

test('closing preserves the accepted spread and stale completion cannot interrupt a later turn', () => {
  const f = fixture(),
    server = f.runtime(true),
    client = f.runtime(false)
  f.open(server, client)
  server.events.get('journal:turn-request')({ direction: 1 }, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.advance(0.8)
  server.events.get('journal:toggle')(undefined, 'alice')
  f.deliver(client, server.sent.at(-1))
  assert.equal(server.app.state.turn, null)
  assert.equal(client.get('firstPage'), 3)
  assert.equal(client.get('pendingTurn'), null)
  f.advance(1.0)
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.acknowledgePageCount(server, client)
  server.events.get('journal:turn-request')({ direction: 1 }, 'alice')
  const id = server.app.state.turn.id
  f.advance(1.4)
  assert.equal(server.app.state.turn.id, id, 'old timer did not clear new turn')
  assert.equal(server.app.state.firstPage, 5)
})

test('a builder move clearing app state does not create an undefined spread or crash a shared turn', () => {
  const f = fixture(),
    server = f.runtime(true),
    client = f.runtime(false)
  f.open(server, client)
  server.events.get('journal:toggle')(undefined, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.advance(1.4)
  // App.modify({ mover: null, state: {} }) replaces state without rebuilding on move end.
  server.app.state = {}
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.acknowledgePageCount(server, client)
  f.advance(2.1)
  server.events.get('journal:turn-request')({ direction: 1 }, 'alice')
  const packet = server.sent.at(-1)
  assert.doesNotThrow(() => f.deliver(client, packet))
  assert.equal(packet[1].firstPage, 3)
  assert.equal(packet[1].turn.origin, 1)
  f.advance(2.8)
  assert.equal(client.get('firstPage'), 3)
})

test('moving after a completed turn preserves the server spread on reopening', () => {
  const f = fixture(),
    server = f.runtime(true)
  f.open(server)
  server.events.get('journal:turn-request')({ direction: 1 }, 'alice')
  f.advance(1.4)
  assert.equal(server.app.state.firstPage, 3)
  server.app.state = {}
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  assert.equal(server.app.state.firstPage, 3)
  f.acknowledgePageCount(server)
  server.events.get('journal:turn-request')({ direction: 1 }, 'alice')
  assert.equal(server.app.state.firstPage, 5)
})

test('invalid snapshot or network page state cannot index nonexistent surfaces', () => {
  const f = fixture()
  const client = f.runtime(false, 'alice', { open: false, firstPage: NaN, turn: { origin: undefined } })
  assert.equal(client.get('firstPage'), 1)
  for (const packet of [
    null,
    { firstPage: NaN, turn: { origin: undefined, destination: NaN } },
    { firstPage: 7, turn: null },
    { firstPage: 2, turn: null },
    { firstPage: 3, turn: { id: 1, origin: 1, destination: 9, forward: true, startedAt: 0 } },
  ]) {
    assert.doesNotThrow(() => client.events.get('journal:pages')(packet))
    assert.equal(client.get('firstPage'), 1)
    assert.equal(client.get('turn'), null)
  }
})

test('seated eye bones determine the reading position, including a shared bone scratch matrix', () => {
  const f = fixture(),
    server = f.runtime(true),
    client = f.runtime(false)
  // Preserve a shared Matrix4, as the real avatar getBoneTransform implementation does.
  client.get(`
    world.getPlayer().getBoneTransform = (() => {
      const matrix = new Matrix4()
      return name => name === 'leftEye' ? matrix.makeTranslation(-0.03, 1.05, 0.8)
        : name === 'rightEye' ? matrix.makeTranslation(0.03, 1.05, 0.8) : null
    })()
    requestToggle()
  `)
  const request = client.sent.at(-1)[1]
  assert.deepEqual(request.eye, [0, 1.05, 0.8])
  server.events.get('journal:toggle')(request, 'alice')
  const pose = server.app.state.readingPose
  const center = new Vector3(-0.31, 0.012, 0)
    .multiplyScalar(1.2)
    .applyQuaternion(new Quaternion().fromArray(pose.quaternion))
    .add(new Vector3().fromArray(pose.position))
  assert.ok(center.distanceTo(new Vector3(0, 1.05, -0.1)) < 1e-9)
})

test('current posed head is used when eye bones are absent, and invalid eye requests are rejected', () => {
  const f = fixture(),
    server = f.runtime(true),
    client = f.runtime(false)
  client.get(`
    world.getPlayer().getBoneTransform = name => name === 'head' ? new Matrix4().makeTranslation(0.1, 0.95, 0.75) : null
    requestToggle()
  `)
  assert.deepEqual(client.sent.at(-1)[1].eye, [0.1, 0.95, 0.75])
  for (const eye of [
    [0, NaN, 1],
    [0, 1],
    [99, 99, 99],
  ]) {
    server.events.get('journal:toggle')({ eye }, 'alice')
    assert.equal(server.app.state.open, false)
  }
  server.events.get('journal:toggle')(client.sent.at(-1)[1], 'alice')
  assert.equal(server.app.state.open, true)
})
