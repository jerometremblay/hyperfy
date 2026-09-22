import assert from 'node:assert/strict'
import test from 'node:test'

import { BrowserCapture } from './BrowserCapture.js'

class FakeWebSocket {
  static OPEN = 1

  constructor() {
    this.readyState = FakeWebSocket.OPEN
    this.listeners = new Map()
    this.commands = []
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || new Set()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener)
  }

  send(payload) {
    const command = JSON.parse(payload)
    this.commands.push(command)
    queueMicrotask(() => {
      const event = { data: JSON.stringify({ id: command.id, result: {} }) }
      for (const listener of this.listeners.get('message') || []) listener(event)
    })
  }

  close() {}
}

test("routes viewers' browser input through one app-instance session in order", async () => {
  const browser = new BrowserCapture()
  const socket = new FakeWebSocket()
  let opened = 0
  browser.openSession = async url => {
    opened += 1
    return { url, socket, WebSocketImpl: FakeWebSocket, sessionId: 'page-1' }
  }

  const url = 'https://radio-canada.ca/'
  await Promise.all([
    browser.dispatchInput('shared-app', url, { type: 'mousePressed', u: 0.5, v: 0.5 }),
    browser.dispatchInput('shared-app', url, { type: 'mouseReleased', u: 0.5, v: 0.5 }),
  ])

  assert.equal(opened, 1)
  assert.deepEqual(
    socket.commands.map(command => command.method),
    ['Input.dispatchMouseEvent', 'Input.dispatchMouseEvent']
  )
  assert.deepEqual(
    socket.commands.map(command => command.params.type),
    ['mousePressed', 'mouseReleased']
  )
  assert.deepEqual(
    socket.commands.map(command => [command.params.x, command.params.y]),
    [
      [640, 360],
      [640, 360],
    ]
  )
  assert.ok(socket.commands.every(command => command.sessionId === 'page-1'))
})

test('defaults bare browser hostnames to HTTPS', async () => {
  const browser = new BrowserCapture()
  const socket = new FakeWebSocket()
  let openedUrl
  browser.openSession = async url => {
    openedUrl = url
    return { url, socket, WebSocketImpl: FakeWebSocket, sessionId: 'page-1' }
  }

  await browser.dispatchInput('slashdot', 'slashdot.org', {
    type: 'keyDown',
    key: 'a',
    code: 'KeyA',
  })

  assert.equal(openedUrl, 'https://slashdot.org/')
})

test('rejects malformed browser input before creating a browser session', async () => {
  const browser = new BrowserCapture()
  let opened = 0
  browser.openSession = async () => {
    opened += 1
    return {}
  }

  await assert.rejects(
    browser.dispatchInput('shared-app', 'https://radio-canada.ca/', {
      type: 'mousePressed',
      u: 3,
      v: 0.5,
    }),
    /invalid browser input/i
  )
  await assert.rejects(
    browser.dispatchInput('shared-app', 'https://radio-canada.ca/', {
      type: 'mousePressed',
      button: 'middle',
      u: 0.5,
      v: 0.5,
    }),
    /invalid browser input/i
  )
  assert.equal(opened, 0)
})

test('forwards shared-page right-clicks as right-button Chrome input', async () => {
  const browser = new BrowserCapture()
  const socket = new FakeWebSocket()
  browser.openSession = async url => ({
    url,
    socket,
    WebSocketImpl: FakeWebSocket,
    sessionId: 'page-1',
  })

  const url = 'https://radio-canada.ca/'
  await browser.dispatchInput('shared-app', url, {
    type: 'mousePressed',
    button: 'right',
    buttons: 2,
    u: 0.5,
    v: 0.5,
  })
  await browser.dispatchInput('shared-app', url, {
    type: 'mouseReleased',
    button: 'right',
    buttons: 0,
    u: 0.5,
    v: 0.5,
  })

  assert.deepEqual(
    socket.commands.map(command => command.params),
    [
      {
        type: 'mousePressed',
        x: 640,
        y: 360,
        button: 'right',
        buttons: 2,
        clickCount: 1,
      },
      {
        type: 'mouseReleased',
        x: 640,
        y: 360,
        button: 'right',
        buttons: 0,
        clickCount: 1,
      },
    ]
  )
})

test('forwards shared-page scrolling and keyboard text to the same Chrome page', async () => {
  const browser = new BrowserCapture()
  const socket = new FakeWebSocket()
  let opened = 0
  browser.openSession = async url => {
    opened += 1
    return { url, socket, WebSocketImpl: FakeWebSocket, sessionId: 'page-1' }
  }

  const url = 'https://radio-canada.ca/'
  await browser.dispatchInput('shared-app', url, {
    type: 'mouseWheel',
    u: 0.25,
    v: 0.75,
    deltaX: 0,
    deltaY: 120,
  })
  await browser.dispatchInput('shared-app', url, {
    type: 'keyDown',
    key: 'a',
    code: 'KeyA',
    modifiers: 0,
  })
  await browser.dispatchInput('shared-app', url, { type: 'insertText', text: 'a' })

  assert.equal(opened, 1)
  assert.deepEqual(
    socket.commands.map(command => command.method),
    ['Input.dispatchMouseEvent', 'Input.dispatchKeyEvent', 'Input.insertText']
  )
  assert.deepEqual(socket.commands[0].params, {
    type: 'mouseWheel',
    x: 320,
    y: 180,
    deltaX: 0,
    deltaY: 120,
  })
  assert.equal(socket.commands[1].params.type, 'rawKeyDown')
  assert.deepEqual(socket.commands[2].params, { text: 'a' })
  assert.ok(socket.commands.every(command => command.sessionId === 'page-1'))
})
