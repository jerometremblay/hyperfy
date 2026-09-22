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
