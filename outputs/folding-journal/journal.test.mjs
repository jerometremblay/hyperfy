import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { Vector3, Quaternion, Euler, Matrix4, BoxGeometry, MeshBasicMaterial, Raycaster } from 'three'
import { readPacket, writePacket } from '../../src/core/packets.js'
import { parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'

const source = fs.readFileSync(new URL('./journal.js', import.meta.url), 'utf8')
const NEWS_ORIGIN = 'https://hyperfy-news.jerometremblay.chatgpt.site'
const pointerBundle = await build({
  entryPoints: [fileURLToPath(new URL('../../src/core/systems/ClientPointer.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { ClientPointer } = await import(
  `data:text/javascript;base64,${Buffer.from(pointerBundle.outputFiles[0].contents).toString('base64')}`
)

const webviewBundle = await build({
  stdin: { contents: `
    export { WebView } from './src/core/nodes/WebView.js'
    export { Prim } from './src/core/nodes/Prim.js'
    export { Node, getRef } from './src/core/nodes/Node.js'
    export { LooseOctree } from './src/core/extras/LooseOctree.js'
  `, resolveDir: fileURLToPath(new URL('../../', import.meta.url)) },
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { WebView, Prim, Node, getRef, LooseOctree } = await import(
  `data:text/javascript;base64,${Buffer.from(webviewBundle.outputFiles[0].contents).toString('base64')}`
)

function fixture({ fetchImpl, storage = new Map(), props = {} } = {}) {
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
  function runtime(server, localId = 'alice', state = { open: false }, realWebViews = false) {
    const events = new Map(),
      worldEvents = new Map(),
      updates = new Set(),
      timers = [],
      sent = [],
      webviews = [],
      downloads = []
    const stage = {
      dirtyNodes: new Set(), scene: { add() {}, remove() {} },
      octree: new LooseOctree({ center: new Vector3(), size: 10 }),
    }
    const root = new Node()
    const nodeWorld = { stage, network: { isServer: server }, controls: {
      pointer: { locked: true }, unlockPointer() { throw new Error('unexpected pointer unlock') },
    } }
    if (realWebViews) root.activate({ world: nodeWorld })
    const app = {
      state: structuredClone(state),
      position: realWebViews ? root.position : new Vector3(),
      quaternion: realWebViews ? root.quaternion : new Quaternion(),
      scale: realWebViews ? root.scale : new Vector3(1, 1, 1),
      create(type, data = {}) {
        if (type === 'prim') new Prim(data)
        if (realWebViews) {
          const node = type === 'webview' ? new WebView(data) : new Node(data)
          if (type === 'webview') {
            // Exercise real mounting, movement and raycasting without browser DOM.
            const buildWorld = node.buildWorld
            node.buildWorld = function () {
              this.buildCount = (this.buildCount || 0) + 1
              const src = this._src
              this._src = ''
              buildWorld.call(this)
              this._src = src
            }
            webviews.push(node)
          } else if (type === 'prim') {
            node.mount = function () {
              this.sItem = { matrix: this.matrixWorld, geometry: new BoxGeometry(...data.size),
                material: new MeshBasicMaterial(), node: this }
              stage.octree.insert(this.sItem)
            }
            node.commit = function (moved) { if (moved) stage.octree.move(this.sItem) }
            node.unmount = function () { stage.octree.remove(this.sItem) }
          }
          return node.getProxy()
        }
        return {
          ...data,
          type,
          active: true,
          position: new Vector3().fromArray(data.position || [0, 0, 0]),
          rotation: new Euler().fromArray(data.rotation || [0, 0, 0]),
          scale: new Vector3().fromArray(data.scale || [1, 1, 1]),
          add(child) {
            if (!child._isRef) child.parent = this
          },
        }
      },
      add(child) {
        if (realWebViews) root.add(getRef(child))
        else child.parent = this
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
          setActions(value) { app.hints = value },
          escape: {},
          keyE: {},
          keyX: {},
          pointer: { locked: false },
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
      get: key => structuredClone(storage.get(key)),
      set: (key, value) => storage.set(key, structuredClone(value)),
    }
    const context = vm.createContext({
      app,
      world,
      Vector3,
      Quaternion,
      Matrix4,
      Date,
      props,
      console,
      fetch: (...args) => {
        downloads.push(args[0])
        return fetchImpl ? fetchImpl(...args) : new Promise(() => {})
      },
      setTimeout: (fn, milliseconds) => timers.push({ fn, at: now + milliseconds / 1000 }),
    })
    vm.runInContext(source, context)
    const result = {
      app,
      world,
      sent,
      webviews,
      stage,
      root,
      events,
      timers,
      updates,
      downloads,
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
      for (const node of runtime.stage.dirtyNodes) node.clean()
      runtime.stage.dirtyNodes.clear()
    }
  }
  function deliver(client, packet) {
    client.events.get(packet[0])(structuredClone(packet[1]))
  }
  function deliverManifest(client, count = 6, issue = '2026-10-17') {
    client.get(`
      receiveHtmlPageCount({
        origin: NEWS_ORIGIN,
        data: {
          type: 'journal-page-count',
          version: 1,
          count: ${count},
          pageCount: ${count},
          pages: Array.from({ length: ${count} }, (_, index) => ({
            page: index + 1,
            issuePage: index + 1,
            url: '/?issue=${issue}&texture=1&page=' + (index + 1),
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
  return { runtime, advance, deliver, open, acknowledgePageCount, deliverManifest }
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

test('camera-linked reticle clicks turn either page through the 3D pointer', () => {
  for (const [index, direction] of [[1, 1], [0, -1]]) {
    const f = fixture(),
      server = f.runtime(true),
      client = f.runtime(false)
    f.open(server, client)
    // Start in the middle so both directions are accepted by the real server handler.
    server.events.get('journal:turn-request')({ direction: 1 }, 'alice')
    f.deliver(client, server.sent.at(-1))
    f.advance(1.4)
    f.deliver(client, server.sent.at(-1))
    client.get('readingControl.pointer.locked = true')
    const hit = { node: client.get(`pageSurfaces[${index + 2}].page`) }
    const pointer = new ClientPointer({ stage: { raycastReticle: () => [hit] } })
    pointer.control = {
      pointer: client.get('readingControl.pointer'),
      xrLeftTrigger: { value: 0 },
      xrRightTrigger: { value: 0 },
      mouseLeft: { pressed: true },
      mouseRight: {},
    }
    client.sent.length = 0
    pointer.update(0)
    assert.deepEqual(client.sent, [['journal:turn-request', { direction }]])
    server.events.get('journal:turn-request')(client.sent[0][1], 'alice')
    assert.equal(server.app.state.firstPage, 3 + direction * 2)
    assert.equal(pointer.control.pointer.locked, true)
  }
})

test('3D page presses leave free-cursor clicks to the iframe and ignore other mouse buttons', () => {
  const f = fixture(), server = f.runtime(true), client = f.runtime(false)
  f.open(server, client)
  const page = client.get('pageSurfaces[1].page')
  let stopped = 0
  const press = button => page.onPointerDown({ button, stopPropagation() { stopped++ } })
  client.sent.length = 0
  press('left')
  client.get('readingControl.pointer.locked = true')
  press('right')
  assert.equal(stopped, 2)
  assert.deepEqual(client.sent, [])
})

test('Escape releases page focus and only unmodified X closes the journal', () => {
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
          code: options.code || (key === 'Escape' ? 'Escape' : 'Key' + key.toUpperCase()),
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
  assert.equal(client.sent.filter(([name]) => name === 'journal:toggle').length, 0)
  keydown('e')
  keydown('x')
  keydown('x', { target: { isEditable: true } })
  keydown('x', { shiftKey: true })

  const closeRequests = client.sent.filter(([name]) => name === 'journal:toggle')
  assert.equal(closeRequests.length, 1)
  assert.equal(released, 2)
  for (const [, request] of closeRequests) {
    server.events.get('journal:toggle')(request, 'alice')
  }
  assert.equal(server.app.state.open, false)
})

test('X closes the journal from world controls and is reserved only for its reader', () => {
  const f = fixture(), server = f.runtime(true), client = f.runtime(false), other = f.runtime(false, 'bob')
  assert.equal(client.get('readingControl.keyX.capture'), false)
  f.open(server, client, other)
  assert.equal(client.get('readingControl.keyX.capture'), true)
  assert.equal(other.get('readingControl.keyX.capture'), false)
  client.get('readingControl.keyX.onPress()')
  const request = client.sent.findLast(([name]) => name === 'journal:toggle')
  server.events.get('journal:toggle')(request[1], 'alice')
  f.deliver(client, server.sent.at(-1))
  f.deliver(other, server.sent.at(-1))
  assert.equal(server.app.state.open, false)
  assert.equal(client.get('readingControl.keyX.capture'), false)
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


test('every opening checks edition metadata and waits for an uncached manifest before acknowledging', () => {
  const f = fixture(), server = f.runtime(true), client = f.runtime(false)
  f.open(server, client)
  const oldRequests = client.downloads.length
  server.events.get('journal:toggle')(undefined, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.advance(1.4)
  client.sent.length = 0
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  assert.equal(client.downloads.length, oldRequests + 1, 'reopen checks the issue index')
  assert.ok(client.downloads.at(-1).includes(encodeURIComponent('/api/issues')))
  assert.equal(client.sent.some(([name]) => name === 'journal:page-count'), false, 'cached manifest must not enable turns')
  f.acknowledgePageCount(server, client)
  f.advance(2.1)
  assert.equal(client.get('pageCountReady'), true)
  client.get('turnPage(1)')
  assert.equal(client.sent.at(-1)[0], 'journal:turn-request')
})

test('a new instance whose manifest failed can recover on reopening without delete/undo', () => {
  const f = fixture(), server = f.runtime(true), client = f.runtime(false)
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.advance(0.7)
  const failedRequest = client.get('manifestRequest')
  client.get('turnPage(1)')
  assert.equal(client.sent.length, 0, 'no valid manifest has arrived')
  server.events.get('journal:toggle')(undefined, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.advance(1.4)
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  assert.ok(client.get('manifestRequest') > failedRequest)
  f.acknowledgePageCount(server, client)
  f.advance(2.1)
  client.get('readingControl.pointer.locked = true')
  client.get('pageSurfaces[1].page.onPointerDown')({ button: 'left', stopPropagation() {} })
  assert.equal(client.sent.at(-1)[0], 'journal:turn-request')
})

test('camera clicks use the real WebView script proxy without invoking its default unlock', () => {
  const f = fixture(), server = f.runtime(true), client = f.runtime(false, 'alice', { open: false }, true)
  f.open(server, client)
  client.get('readingControl.pointer.locked = true')
  const page = client.webviews[2] // manifest, then left and right pages
  client.sent.length = 0
  const pointer = new ClientPointer({ stage: { raycastReticle: () => [{ node: page }] } })
  pointer.control = {
    pointer: client.get('readingControl.pointer'), xrLeftTrigger: { value: 0 },
    xrRightTrigger: { value: 0 }, mouseLeft: { pressed: true }, mouseRight: {},
  }
  pointer.update(0)
  assert.deepEqual(client.sent, [['journal:turn-request', { direction: 1 }]])
})


test('fresh manifests replace issue URLs even when the release has the same page count', () => {
  const f = fixture(), server = f.runtime(true), client = f.runtime(false)
  f.open(server, client)
  const page = client.get('pageSurfaces[1].page')
  server.events.get('journal:toggle')(undefined, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.advance(1.4)
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.deliverManifest(client, 6, '2026-10-20')
  assert.equal(client.get('pageSurfaces[1].page'), page, 'reading node remains mounted')
  assert.match(page.src, /issue=2026-10-20/)
  assert.equal(client.get('pageCountReady'), false)
  server.events.get('journal:page-count')(client.sent.at(-1)[1], 'alice')
  f.deliver(client, server.sent.at(-1))
  assert.equal(client.get('pageCountReady'), true)
})

test('new releases expand the page surfaces and accepted server bounds', () => {
  const f = fixture(), server = f.runtime(true), client = f.runtime(false)
  f.open(server, client)
  f.deliverManifest(client, 9, '2026-10-20')
  server.events.get('journal:page-count')(client.sent.at(-1)[1], 'alice')
  f.deliver(client, server.sent.at(-1))
  assert.equal(server.app.state.pageCount, 9)
  assert.equal(client.get('pageSurfaces.length'), 10)
  assert.match(client.get('pageSurfaces[8].page.src'), /issue=2026-10-20.*page=9/)
  assert.equal(client.get('pageSurfaces[9].page.src'), '')
})

test('manifest loads retry while open, stop after success, and are bounded on failure', () => {
  const f = fixture(), server = f.runtime(true), client = f.runtime(false)
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  const firstRequest = client.get('manifestRequest')
  f.advance(30)
  const retryRequest = client.get('manifestRequest')
  assert.ok(retryRequest > firstRequest)
  f.acknowledgePageCount(server, client)
  f.advance(60)
  assert.equal(client.get('manifestRequest'), retryRequest)

  const failed = fixture(), failedServer = failed.runtime(true), failedClient = failed.runtime(false)
  failedServer.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  failed.deliver(failedClient, failedServer.sent.at(-1))
  failed.advance(30)
  failed.advance(60)
  const lastRequest = failedClient.get('manifestRequest')
  failed.advance(90)
  assert.equal(failedClient.get('manifestRequest'), lastRequest)
  assert.equal(failedClient.get('manifestRequest'), 3)
})

test('closed instances cancel pending manifest retries and late joiners refresh an open journal', () => {
  const f = fixture(), server = f.runtime(true), client = f.runtime(false)
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  const joining = f.runtime(false, 'alice', server.app.state)
  assert.equal(joining.get('manifestRequest'), 1)
  assert.equal(joining.get('manifestPending'), true)
  server.events.get('journal:toggle')(undefined, 'alice')
  f.deliver(client, server.sent.at(-1))
  const source = client.get('manifest.src')
  f.advance(30)
  assert.equal(client.get('manifest.src'), source)
})

test('closed journals mount no WebViews and have no idle frame callbacks on clients or servers', () => {
  const f = fixture()
  for (const server of [false, true]) {
    const runtime = f.runtime(server, 'alice', { open: false, pageCount: 50 }, true)
    assert.equal(runtime.webviews.filter(node => node.mounted).length, 0)
    assert.equal(runtime.webviews.reduce((sum, node) => sum + (node.buildCount || 0), 0), 0)
    assert.equal(runtime.updates.size, 0)
    assert.equal(runtime.timers.length, 0)
  }
  f.advance(60)
})

test('reading mounts only the spread, turns retain at most four pages, and closing unmounts everything', () => {
  const f = fixture(), server = f.runtime(true), client = f.runtime(false, 'alice', { open: false }, true)
  const mounted = () => client.webviews.filter(node => node.mounted)
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  assert.equal(mounted().length, 0, 'metadata uses fetch and mounts no remote wrapper')
  f.deliverManifest(client, 50)
  assert.equal(getRef(client.get('manifest')).mounted, false, 'release the manifest after reading its metadata')
  server.events.get('journal:page-count')(client.sent.at(-1)[1], 'alice')
  f.deliver(client, server.sent.at(-1))
  f.advance(0.7)
  assert.equal(mounted().length, 2)
  assert.equal(client.updates.size, 0, 'an open stationary journal does not poll')
  server.events.get('journal:turn-request')({ direction: 1 }, 'alice')
  f.deliver(client, server.sent.at(-1))
  assert.equal(mounted().length, 4)
  f.advance(0.7)
  const before = new Map(mounted().map(node => [node, node.buildCount]))
  for (let frame = 1; frame <= 8; frame++) {
    f.advance(0.7 + frame / 60)
    assert.equal(mounted().length, 4)
    for (const node of mounted()) {
      assert.equal(node.buildCount, before.get(node), 'turning must not rebuild an iframe each frame')
    }
  }
  f.advance(1.4)
  f.deliver(client, server.sent.at(-1))
  assert.equal(mounted().length, 2)
  assert.equal(client.get('firstPage'), 3)
  server.events.get('journal:toggle')(undefined, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.advance(2.1)
  assert.equal(mounted().length, 0)
  assert.equal(client.updates.size, 0)
  f.deliverManifest(client, 50)
  assert.equal(mounted().length, 0, 'late iframe messages cannot reactivate a closed journal')
  f.advance(60)
  assert.equal(mounted().length, 0)
  assert.equal(client.updates.size, 0)
  f.open(server, client)
  assert.equal(mounted().length, 2, 'reopening restores the accepted spread')
  assert.equal(client.get('firstPage'), 3)
})


test('readable pages remain the nearest reticle target after instance placement and repeated turns', () => {
  const f = fixture(), server = f.runtime(true), client = f.runtime(false, 'alice', { open: false }, true)
  f.open(server, client)
  client.get('readingControl.pointer.locked = true')
  for (const direction of [1, 1, -1, -1, 1]) {
    const number = client.get('firstPage') + (direction === 1 ? 1 : 0)
    const page = getRef(client.get(`pageSurfaces[${number - 1}].page`))
    const position = new Vector3().setFromMatrixPosition(page.matrixWorld)
    const normal = new Vector3(0, 0, 1).transformDirection(page.matrixWorld)
    const ray = new Raycaster(position.clone().addScaledVector(normal, 0.5), normal.negate())
    const hits = client.stage.octree.raycast(ray)
    assert.equal(hits[0]?.node, page, 'paper geometry must not intercept readable pages')
    const pointer = new ClientPointer({ stage: { raycastReticle: () => hits } })
    pointer.control = {
      pointer: client.get('readingControl.pointer'), xrLeftTrigger: { value: 0 },
      xrRightTrigger: { value: 0 }, mouseLeft: { pressed: true }, mouseRight: {},
    }
    pointer.update(0)
    server.events.get('journal:turn-request')(client.sent.at(-1)[1], 'alice')
    f.deliver(client, server.sent.at(-1))
    f.advance(client.get('world.getTime()') + 0.7)
    f.deliver(client, server.sent.at(-1))
  }
})


test('the default journal package and worldsync catalog contain the reviewed script', () => {
  const catalog = fs.readFileSync(new URL('../../tools/worldsync/catalog/objects/apps/hyperfy-news-folding-journal/script.js', import.meta.url), 'utf8')
  assert.equal(catalog, source)
  const { blueprint, assets } = parseHyp(fs.readFileSync(new URL('../../src/world/collections/default/HyperfyJournal.hyp', import.meta.url)))
  assert.equal(Buffer.from(assets.find(asset => asset.url === blueprint.script).bytes).toString(), source)
})

const archive = JSON.parse(fs.readFileSync(new URL('./content.json', import.meta.url), 'utf8'))
const cachedIndex = archive.index.slice(0, 1)
const cachedEdition = archive.issues[cachedIndex[0].id]
const seed = { index: cachedIndex, issues: { [cachedIndex[0].id]: cachedEdition } }
const contentProps = { content: { type: 'other', url: 'asset://archive.json' } }
const jsonResponse = data => ({ ok: true, json: async () => structuredClone(data) })
const settle = () => new Promise(resolve => setImmediate(resolve))

test('downloaded world content mounts local pages and reopening downloads only the small edition index', async () => {
  const f = fixture({ props: contentProps, fetchImpl: url =>
    url === '/assets/archive.json' ? jsonResponse(seed) : jsonResponse(cachedIndex) })
  const server = f.runtime(true), client = f.runtime(false, 'alice', { open: false }, true)
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  await settle()
  f.advance(0.7)
  assert.equal(client.downloads.length, 2)
  assert.ok(client.get('pageSurfaces[0].page.src').startsWith('data:text/html;'))
  assert.equal(client.get('manifest.src'), '', 'cached editions need no pagination iframe')
  assert.equal(client.webviews.filter(node => node.mounted).length, 2)
  const pageSource = client.get('pageSurfaces[0].page.src')
  server.events.get('journal:page-count')(client.sent.at(-1)[1], 'alice')
  f.deliver(client, server.sent.at(-1))
  server.events.get('journal:turn-request')({ direction: 1 }, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.advance(1.4)
  assert.equal(client.downloads.length, 2, 'turns never request HTML')
  server.events.get('journal:toggle')(undefined, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.advance(2.1)
  assert.equal(client.webviews.filter(node => node.mounted).length, 0)
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  await settle()
  assert.equal(client.downloads.length, 3)
  assert.equal(client.get('pageSurfaces[0].page.src'), pageSource)
})

test('persistent pages survive a new client runtime and remain readable when the publisher is unavailable', async () => {
  const storage = new Map()
  const first = fixture({ storage, props: contentProps, fetchImpl: url =>
    url === '/assets/archive.json' ? jsonResponse(seed) : jsonResponse(cachedIndex) })
  const server = first.runtime(true), client = first.runtime(false)
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  first.deliver(client, server.sent.at(-1))
  await settle()
  const next = fixture({ storage, props: contentProps, fetchImpl: () => new Promise(() => {}) })
  const joined = next.runtime(false, 'alice', server.app.state)
  assert.ok(joined.get('pageSurfaces[0].page.src').startsWith('data:text/html;'))
  assert.equal(joined.downloads.length, 1)
  assert.ok(joined.downloads[0].includes(encodeURIComponent('/api/issues')))
  assert.equal(joined.get('manifestPending'), false)
  assert.equal(joined.sent.at(-1)[0], 'journal:page-count')
})

test('a revised edition is downloaded once and replaces static pages even with the same page count', async () => {
  let index = cachedIndex
  const html = '<style>.page{}</style><script>function paginate(reports){};' +
    'const allPages=[];Promise.resolve([]).then(paginate);</script>'
  const f = fixture({ props: contentProps, fetchImpl: url => {
    if (url === '/assets/archive.json') return jsonResponse(seed)
    if (decodeURIComponent(url).includes('/api/issues')) return jsonResponse(index)
    return { ok: true, text: async () => html }
  } })
  const server = f.runtime(true), client = f.runtime(false)
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  await settle()
  const originalSource = client.get('pageSurfaces[0].page.src')
  index = [{ ...cachedIndex[0], updated_at: '2026-10-28T10:00:00Z' }]
  client.get('refreshManifest()')
  await settle()
  assert.ok(client.get('manifest.src').startsWith('data:text/html;'))
  assert.equal(client.downloads.length, 4)
  client.get(`receiveCachedIssue({origin:"null",data:{type:"journal-cached-issue",version:1,
    issue:${JSON.stringify(index[0].id)},style:".page{}",pages:
    Array.from({length:${cachedEdition.pages.length}},()=>'<section class="page">Revised copy</section>')}})`)
  await settle()
  assert.notEqual(client.get('pageSurfaces[0].page.src'), originalSource)
  assert.ok(decodeURIComponent(client.get('pageSurfaces[0].page.src')).includes('Revised copy'))
  client.get('refreshManifest()')
  await settle()
  assert.equal(client.downloads.length, 5, 'only metadata is rechecked after storing the revision')
})

test('closing during a download prevents a late result from mounting the pagination frame', async () => {
  let finishDownload
  const f = fixture({ fetchImpl: url => decodeURIComponent(url).includes('/api/issues')
    ? jsonResponse(cachedIndex)
    : new Promise(resolve => { finishDownload = resolve }) })
  const server = f.runtime(true), client = f.runtime(false, 'alice', { open: false }, true)
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  await settle()
  assert.equal(typeof finishDownload, 'function')
  server.events.get('journal:toggle')(undefined, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.advance(0.7)
  finishDownload({ ok: true, text: async () => '<html>late</html>' })
  await settle()
  assert.equal(client.webviews.filter(node => node.mounted).length, 0)
  assert.equal(client.get('manifest.src'), '')
})

test('unavailable browser storage still permits local archive pages and memory-cached reopening', async () => {
  const f = fixture({ props: contentProps, fetchImpl: url =>
    url === '/assets/archive.json' ? jsonResponse(seed) : new Promise(() => {}) })
  const server = f.runtime(true), client = f.runtime(false)
  client.world.get = client.world.set = () => { throw new Error('Storage unavailable') }
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  await settle()
  assert.ok(client.get('pageSurfaces[0].page.src').startsWith('data:text/html;'))
  server.events.get('journal:toggle')(undefined, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.advance(0.7)
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  await settle()
  assert.equal(client.downloads.length, 3)
  assert.equal(client.get('manifestPending'), false)
})

test('local page bridge messages require a cached data document and metadata keeps only the newest dated revision', async () => {
  const f = fixture({ props: contentProps, fetchImpl: url =>
    url === '/assets/archive.json' ? jsonResponse(seed) : jsonResponse(cachedIndex) })
  const server = f.runtime(true), client = f.runtime(false)
  server.events.get('journal:toggle')({ eye: [0, 1.6, 1] }, 'alice')
  f.deliver(client, server.sent.at(-1))
  await settle()
  server.events.get('journal:page-count')(client.sent.at(-1)[1], 'alice')
  f.deliver(client, server.sent.at(-1))
  f.advance(0.7)
  const before = client.sent.length
  client.get('pageSurfaces[1].page.onMessage({origin:"null",data:{channel:"hyperfy-webview",version:1,type:"event",name:"click",detail:{isTrusted:true,button:0,target:{isInteractive:false}}}})')
  assert.equal(client.sent.length, before + 1)
  assert.equal(client.sent.at(-1)[0], 'journal:turn-request')
  const index = client.get(`selectIssues([
    {id:"2026-10-17--revision",layout:"dated-issue-v1"},
    {id:"2026-10-17",layout:"dated-issue-v1"},
    {id:"2026-10-14",layout:"legacy-publication"}])`)
  assert.deepEqual(Array.from(index, item => item.id), ['2026-10-17--revision'])
})

test('the packaged archive has every local page and embeds portraits without remote scripts or nested frames', () => {
  const { blueprint, assets } = parseHyp(fs.readFileSync(new URL('../../src/world/collections/default/HyperfyJournal.hyp', import.meta.url)))
  const content = assets.find(asset => asset.url === blueprint.props.content.url)
  assert.equal(Buffer.from(content.bytes).toString(), JSON.stringify(archive))
  assert.equal(archive.index.length, Object.keys(archive.issues).length)
  for (const issue of Object.values(archive.issues)) {
    assert.ok(issue.pages.length > 0)
    for (const page of issue.pages) {
      assert.ok(page.startsWith('<section'))
      assert.doesNotMatch(page, /<script|<iframe|<img\b[^>]*src="https?:/i)
    }
  }
  const f = fixture()
  const client = f.runtime(false)
  assert.equal(client.get('JOURNAL_BRIDGE_SOURCE'),
    fs.readFileSync(new URL('../../hyperfy-webview-bridge.js', import.meta.url), 'utf8'))
})

test('only the reader transitions to first person and restores the first opening snapshot on close', () => {
  const f = fixture(), server = f.runtime(true), client = f.runtime(false), observer = f.runtime(false, 'bob')
  for (const runtime of [client, observer]) runtime.get(`
    world.getPlayer().cameraCalls = []
    world.getPlayer().getCamera = () => ({ quaternion: new Quaternion(), zoom: 4, firstPerson: false })
    world.getPlayer().setCamera = options => { world.getPlayer().cameraCalls.push(options); return true }
  `)
  f.open(server, client, observer)
  assert.equal(client.get('world.getPlayer().cameraCalls.length'), 1)
  assert.equal(observer.get('world.getPlayer().cameraCalls.length'), 0)
  const opening = client.get('world.getPlayer().cameraCalls[0]')
  assert.equal(opening.firstPerson, true)
  assert.equal(opening.duration, 0.65)
  assert.ok(opening.target.distanceTo(new Vector3(0, 1.6, 0.1)) < 1e-7)
  f.deliver(client, server.sent.find(([event, data]) => event === 'journal:state' && data.open))
  assert.equal(client.get('world.getPlayer().cameraCalls.length'), 1, 'duplicate state must preserve snapshot')
  server.events.get('journal:toggle')({}, 'alice')
  f.deliver(client, server.sent.at(-1))
  f.deliver(observer, server.sent.at(-1))
  const closing = client.get('world.getPlayer().cameraCalls[1]')
  assert.equal(closing.firstPerson, false)
  assert.equal(closing.zoom, 4)
  assert.equal(closing.duration, 0.65)
  assert.equal(observer.get('world.getPlayer().cameraCalls.length'), 0)
})

test('journal X hint appears only for the reader and clears on close without restarting on duplicate state', () => {
  const f = fixture(), server = f.runtime(true), client = f.runtime(false), observer = f.runtime(false, 'bob')
  f.open(server, client, observer)
  assert.equal(client.app.hints[0].label, 'Put the journal away')
  assert.equal(client.app.hints[0].position, 'bottom-left')
  assert.equal(observer.app.hints, undefined)
  const hints = client.app.hints
  f.deliver(client, server.sent.find(([event, data]) => event === 'journal:state' && data.open))
  assert.equal(client.app.hints, hints)
  server.events.get('journal:toggle')({}, 'alice')
  f.deliver(client, server.sent.at(-1))
  assert.equal(client.app.hints.length, 0)
})
