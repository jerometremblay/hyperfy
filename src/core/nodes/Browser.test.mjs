import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const browserBundle = await build({
  entryPoints: [fileURLToPath(new URL('./Browser.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { Browser } = await import(
  `data:text/javascript;base64,${Buffer.from(browserBundle.outputFiles[0].contents).toString('base64')}`
)

function replaceGlobal(name, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name)
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  return () => {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor)
    else delete globalThis[name]
  }
}

function createTestBrowser({ locked = false } = {}) {
  const sent = []
  const mouseCaptures = []
  const pointer = { locked }
  const browser = new Browser({ src: 'https://radio-canada.ca/' })
  browser.ctx = {
    entity: { data: { id: 'browser-test' } },
    world: {
      controls: { pointer },
      pointer: {
        setMouseCapture: (value, button = 'left') => mouseCaptures.push({ value, button }),
      },
      network: {
        isClient: true,
        send: (...args) => sent.push(args),
      },
    },
  }
  return { browser, mouseCaptures, pointer, sent }
}

test('browser screenshot texture is white and its wheel does not zoom the camera', () => {
  const windowListeners = []
  const windowMock = {
    addEventListener(type, listener, options) {
      windowListeners.push({ type, listener, options })
    },
    removeEventListener() {},
  }
  const restoreWindow = replaceGlobal('window', windowMock)
  const restoreDocument = replaceGlobal('document', {
    body: { appendChild() {} },
    createElement(tag) {
      if (tag === 'img') {
        return {
          set src(value) {
            this._src = value
            this.onload?.()
          },
          get src() {
            return this._src
          },
        }
      }
      return {
        style: {},
        setAttribute() {},
        addEventListener() {},
        removeEventListener() {},
        remove() {},
        focus() {},
        blur() {},
      }
    },
  })

  const sent = []
  const browser = new Browser({ src: 'https://radio-canada.ca/' })
  browser.ctx = {
    entity: { data: { id: 'browser-test' } },
    world: {
      network: {
        isServer: false,
        isClient: true,
        apiUrl: 'https://world.test/api',
        send: (...args) => sent.push(args),
      },
      graphics: { maxAnisotropy: 1 },
      setupMaterial() {},
      stage: {
        scene: { add() {}, remove() {} },
        octree: { insert() {}, remove() {}, move() {} },
      },
    },
  }

  try {
    browser.build()

    assert.ok(browser.texture)
    assert.equal(browser.mesh.material.map, browser.texture)
    assert.equal(browser.mesh.material.color.getHex(), 0xffffff)

    browser.onPointerEnter({ uv: { x: 0.25, y: 0.75 } })
    const wheelListener = windowListeners.find(({ type }) => type === 'wheel')
    const capturesWheel = wheelListener.options === true || wheelListener.options?.capture
    const event = {
      deltaX: 0,
      deltaY: 120,
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() {
        this.defaultPrevented = true
      },
      stopPropagation() {
        this.propagationStopped = true
      },
    }
    let cameraScrollDelta = 0
    if (capturesWheel) wheelListener.listener(event)
    if (!event.propagationStopped) cameraScrollDelta += event.deltaY
    if (!capturesWheel) wheelListener.listener(event)

    assert.equal(cameraScrollDelta, 0)
    assert.equal(event.defaultPrevented, true)
    assert.equal(event.propagationStopped, true)
    assert.deepEqual(sent, [
      [
        'browserInput',
        {
          entityId: 'browser-test',
          url: 'https://radio-canada.ca/',
          input: { type: 'mouseWheel', u: 0.25, v: 0.75, deltaX: 0, deltaY: 120 },
        },
      ],
    ])
  } finally {
    browser.unbuild()
    restoreDocument()
    restoreWindow()
  }
})

test('browser clicks are ignored while the pointer is locked in character mode', () => {
  const { browser, mouseCaptures, sent } = createTestBrowser({ locked: true })
  let focused = false
  let stopped = false
  browser.focusKeyboard = () => {
    focused = true
  }

  try {
    browser.onPointerEnter({ uv: { x: 0.25, y: 0.75 } })
    browser.onPointerDown({
      uv: { x: 0.25, y: 0.75 },
      stopPropagation() {
        stopped = true
      },
    })
    browser.onPointerDown({
      button: 'right',
      uv: { x: 0.25, y: 0.75 },
      stopPropagation() {
        stopped = true
      },
    })

    assert.deepEqual(sent, [])
    assert.ok(mouseCaptures.length > 0)
    assert.ok(mouseCaptures.every(({ value }) => !value))
    assert.equal(focused, false)
    assert.equal(stopped, false)
  } finally {
    browser.unbuild()
  }
})

test('browser captures mouse-mode clicks from world controls', () => {
  const { browser, mouseCaptures, sent } = createTestBrowser()
  let focused = false
  let stopped = false
  browser.focusKeyboard = () => {
    focused = true
  }

  try {
    browser.onPointerEnter({ uv: { x: 0.25, y: 0.75 } })
    browser.onPointerDown({
      uv: { x: 0.25, y: 0.75 },
      stopPropagation() {
        stopped = true
      },
    })

    assert.ok(mouseCaptures.some(({ value, button }) => value && button === 'left'))
    assert.ok(mouseCaptures.some(({ value, button }) => value && button === 'right'))
    assert.deepEqual(
      sent.map(([, payload]) => payload.input.type),
      ['mouseMoved', 'mousePressed']
    )
    assert.equal(focused, true)
    assert.equal(stopped, true)
  } finally {
    browser.unbuild()
  }
})

test('browser stops capturing mouse clicks when character mode resumes', () => {
  const { browser, mouseCaptures, pointer, sent } = createTestBrowser()
  let stopped = false

  try {
    browser.onPointerEnter({ uv: { x: 0.25, y: 0.75 } })
    pointer.locked = true
    browser.onPointerMove({ uv: { x: 0.25, y: 0.75 } })
    browser.onPointerDown({
      uv: { x: 0.25, y: 0.75 },
      stopPropagation() {
        stopped = true
      },
    })

    assert.equal(mouseCaptures[0].value, true)
    assert.equal(mouseCaptures.at(-1).value, false)
    assert.equal(
      sent.some(([, payload]) => payload.input.type === 'mousePressed'),
      false
    )
    assert.equal(stopped, false)
  } finally {
    browser.unbuild()
  }
})

test('browser forwards right-clicks in mouse mode', () => {
  const { browser, sent } = createTestBrowser()
  let focused = false
  let stopped = false
  browser.focusKeyboard = () => {
    focused = true
  }

  try {
    browser.onPointerEnter({ uv: { x: 0.25, y: 0.75 } })
    const downEvent = {
      button: 'right',
      uv: { x: 0.25, y: 0.75 },
      stopPropagation() {
        stopped = true
      },
    }
    browser.onPointerDown(downEvent)
    browser.onPointerUp(downEvent)

    assert.deepEqual(
      sent.map(([, payload]) => payload.input),
      [
        { type: 'mouseMoved', u: 0.25, v: 0.75, buttons: 0 },
        { type: 'mousePressed', u: 0.25, v: 0.75, button: 'right', buttons: 2 },
        { type: 'mouseReleased', u: 0.25, v: 0.75, button: 'right', buttons: 0 },
      ]
    )
    assert.equal(focused, false)
    assert.equal(stopped, true)
  } finally {
    browser.unbuild()
  }
})

test('browser teardown tolerates the server window shim without event APIs', () => {
  const restoreWindow = replaceGlobal('window', {})
  const browser = new Browser({ src: 'https://radio-canada.ca/' })
  browser.mounted = true

  try {
    assert.doesNotThrow(() => browser.deactivate())
  } finally {
    restoreWindow()
  }
})
