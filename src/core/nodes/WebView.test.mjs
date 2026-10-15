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
