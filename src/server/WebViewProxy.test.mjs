import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeWebURL } from './webURL.js'
import { proxyWebViewRequest, rewriteWebViewDocument, rewriteWebViewStylesheet } from './WebViewProxy.js'

test('normalizes bare WebView hostnames to HTTPS and rejects other schemes', () => {
  assert.equal(normalizeWebURL('slashdot.org', 'WebView URL'), 'https://slashdot.org/')
  assert.equal(normalizeWebURL('//slashdot.org/news', 'WebView URL'), 'https://slashdot.org/news')
  assert.throws(() => normalizeWebURL('file:///tmp/page.html', 'WebView URL'), /http or https/)
})

test('rewrites WebView document resources and removes frame-blocking CSP metadata', () => {
  const html = `
    <html><head>
      <meta http-equiv="Content-Security-Policy" content="frame-ancestors 'self'">
      <link rel="stylesheet" href="/styles/site.css">
    </head><body>
      <a href="/story">Story</a>
      <img src="https://slashdot.org/images/logo.png">
    </body></html>
  `

  const rewritten = rewriteWebViewDocument(html, 'https://slashdot.org/', '/api/webview/proxy')
  assert.match(rewritten, /<base href="https:\/\/slashdot\.org\/">/)
  assert.doesNotMatch(rewritten, /Content-Security-Policy/)
  assert.match(rewritten, /\/api\/webview\/proxy\?url=https%3A%2F%2Fslashdot\.org%2Fstyles%2Fsite\.css/)
  assert.match(rewritten, /\/api\/webview\/proxy\?url=https%3A%2F%2Fslashdot\.org%2Fstory/)
  assert.match(rewritten, /\/api\/webview\/proxy\?url=https%3A%2F%2Fslashdot\.org%2Fimages%2Flogo\.png/)
})

test('rewrites WebView stylesheet resources relative to the stylesheet URL', () => {
  const rewritten = rewriteWebViewStylesheet(
    "body { background: url('../images/bg.png') } @import url('/styles/theme.css');",
    'https://slashdot.org/assets/site.css',
    '/api/webview/proxy'
  )
  assert.match(rewritten, /url\(['"]\/api\/webview\/proxy\?url=https%3A%2F%2Fslashdot\.org%2Fimages%2Fbg\.png['"]\)/)
  assert.match(rewritten, /url\(['"]\/api\/webview\/proxy\?url=https%3A%2F%2Fslashdot\.org%2Fstyles%2Ftheme\.css['"]\)/)
})

test('fetches a safe page through redirects and rewrites the response body', async () => {
  const requests = []
  const responses = [
    new Response(null, { status: 302, headers: { location: 'https://example.com/home' } }),
    new Response('<html><head></head><body><img src="/logo.png"></body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }),
  ]

  const result = await proxyWebViewRequest(
    'example.com',
    async (url, options) => {
      requests.push({ url, options })
      return responses.shift()
    },
    async () => [{ address: '93.184.216.34', family: 4 }]
  )

  assert.equal(result.status, 200)
  assert.equal(result.contentType, 'text/html; charset=utf-8')
  assert.match(result.body.toString(), /\/api\/webview\/proxy\?url=https%3A%2F%2Fexample\.com%2Flogo\.png/)
  assert.deepEqual(
    requests.map(request => request.url),
    ['https://example.com/', 'https://example.com/home']
  )
  assert.ok(requests.every(request => request.options.redirect === 'manual'))
})

test('rejects private WebView proxy targets before fetching them', async () => {
  let fetched = false
  await assert.rejects(
    proxyWebViewRequest(
      'internal.example',
      async () => {
        fetched = true
      },
      async () => [{ address: '10.0.0.4', family: 4 }]
    ),
    /public host/
  )
  assert.equal(fetched, false)
})
