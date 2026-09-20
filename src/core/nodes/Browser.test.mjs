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

test('browser screenshot texture is not tinted black', () => {
  const restoreWindow = replaceGlobal('window', {
    addEventListener() {},
    removeEventListener() {},
  })
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
    browser.onWheel({
      deltaX: 0,
      deltaY: 120,
      preventDefault() {},
    })
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
