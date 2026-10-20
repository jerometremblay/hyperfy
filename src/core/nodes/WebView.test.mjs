import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./WebView.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { WebView } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

test('WebView proxy mode is opt-in and exposed to scripts', () => {
  const webview = new WebView({ src: 'https://slashdot.org', proxy: true })
  webview.ctx = { world: { network: { apiUrl: 'https://world.test/api' } } }

  assert.equal(webview.proxy, true)
  assert.equal(
    webview.getIframeSource(),
    'https://world.test/api/webview/proxy?url=https%3A%2F%2Fslashdot.org'
  )
  assert.equal(webview.getProxy().proxy, true)

  webview.getProxy().proxy = false
  assert.equal(webview.proxy, false)
  assert.equal(webview.getIframeSource(), 'https://slashdot.org')
})

test('WebView proxy defaults to direct iframe loading', () => {
  const webview = new WebView({ src: 'https://example.com' })
  webview.ctx = { world: { network: { apiUrl: 'https://world.test/api' } } }

  assert.equal(webview.proxy, false)
  assert.equal(webview.getIframeSource(), 'https://example.com')
})

test('WebView render order updates CSS stacking and cutout without rebuilding its iframe', () => {
  const webview = new WebView({ renderOrder: 0 })
  const iframe = {}
  webview.iframe = iframe
  webview.mesh = { renderOrder: 0 }
  webview.objectCSS = { element: { style: {} } }
  webview.needsRebuild = false
  const proxy = webview.getProxy()
  proxy.renderOrder = 100
  assert.equal(webview.mesh.renderOrder, 100)
  assert.equal(webview.objectCSS.element.style.zIndex, '100')
  assert.equal(proxy.renderOrder, 100)
  assert.equal(webview.needsRebuild, false)
  assert.equal(webview.iframe, iframe)
  proxy.renderOrder = 0
  assert.equal(webview.objectCSS.element.style.zIndex, 'auto')
  assert.equal(webview.mesh.renderOrder, 0)
  assert.throws(() => { proxy.renderOrder = Infinity }, /integer/)
  assert.throws(() => { proxy.renderOrder = 1.5 }, /integer/)
})

function worldWebViewFixture(locked = false) {
  const previousDocument = globalThis.document
  globalThis.document = {
    createElement() {
      return { style: {}, children: [], listeners: {}, setAttribute() {},
        appendChild(child) { this.children.push(child) },
        addEventListener(name, callback) { this.listeners[name] = callback },
        blur() { this.blurred = true },
      }
    },
  }
  const events = new Map()
  const controls = { pointer: { locked } }
  const webview = new WebView({ src: 'https://example.com', interactive: true })
  webview.ctx = { world: {
    network: { isServer: false }, controls,
    stage: { scene: { add() {}, remove() {} }, octree: { insert() {}, remove() {} } },
    on(name, callback) { events.set(name, callback) },
    off(name, callback) { if (events.get(name) === callback) events.delete(name) },
  } }
  webview.build()
  return { webview, controls, events, cleanup() { webview.unbuild(); globalThis.document = previousDocument } }
}

test('camera lock disables a hovered iframe and releases its focus until a fresh cursor hover', () => {
  const f = worldWebViewFixture()
  try {
    const { webview, controls, events } = f
    webview.inner.listeners.mouseenter()
    assert.equal(webview.iframe.style.pointerEvents, 'auto')
    controls.pointer.locked = true
    events.get('pointer-lock')?.(true)
    assert.equal(webview.iframe.style.pointerEvents, 'none')
    assert.equal(webview.objectCSS.interacting, false)
    assert.equal(webview.iframe.blurred, true)
    webview.inner.listeners.mouseenter()
    assert.equal(webview.iframe.style.pointerEvents, 'none', 'hover cannot steal camera clicks')
    controls.pointer.locked = false
    events.get('pointer-lock')?.(false)
    webview.inner.listeners.mouseenter()
    assert.equal(webview.iframe.style.pointerEvents, 'auto', 'free cursor still follows links')
    webview.unbuild()
    assert.equal(events.has('pointer-lock'), false)
  } finally { f.cleanup() }
})

test('an iframe built while the camera is locked ignores mouseenter', () => {
  const f = worldWebViewFixture(true)
  try {
    f.webview.inner.listeners.mouseenter()
    assert.equal(f.webview.iframe.style.pointerEvents, 'none')
    assert.equal(f.webview.objectCSS.interacting, false)
  } finally { f.cleanup() }
})
