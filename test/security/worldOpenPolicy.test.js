// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/worldOpenPolicy.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { resolveOpenURL } from '../../src/core/extras/worldOpenPolicy.js'

// the world's own resolution rules (World.resolveURL) for asset:// and bare hosts
const ASSETS = 'http://localhost:3000/assets'
const resolve = url => {
  url = url.trim()
  if (url.startsWith('blob')) return url
  if (url.startsWith('asset://')) return url.replace('asset:/', ASSETS)
  if (url.match(/^https?:\/\//i)) return url
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return url
  return `https://${url}`
}
const ctx = { resolve, base: 'http://localhost:3000/?x=1', assetsUrl: ASSETS }
const open = url => resolveOpenURL(url, ctx)

test('worldOpenPolicy: http(s) documents open, including relative paths and bare hosts', () => {
  assert.equal(open('https://example.com/'), 'https://example.com/')
  assert.equal(open('http://example.com/path?q=1#h'), 'http://example.com/path?q=1#h')
  assert.equal(open('  https://example.com/  '), 'https://example.com/')
  assert.equal(open('example.com/docs'), 'https://example.com/docs')
  assert.equal(open('//example.com/x'), 'https://example.com/x')
  assert.equal(open('/about'), 'http://localhost:3000/about')
  assert.equal(open('HTTPS://EXAMPLE.COM'), 'https://example.com/')
})

test('worldOpenPolicy: scheme URLs never open', () => {
  for (const url of [
    'javascript:1',
    'JavaScript:alert(1)',
    'java\nscript:1',
    'data:text/html,x',
    'blob:http://localhost:3000/abc',
    'blob:nodedata:abc',
    'file:///etc/passwd',
    'vbscript:x',
    'ftp://example.com/x',
    'custom-scheme://x',
  ]) {
    assert.equal(open(url), null, url)
  }
})

test('worldOpenPolicy: nothing from the assets store opens as a document', () => {
  assert.equal(open('asset://abc.png'), null)
  assert.equal(open('asset://index.html'), null)
  assert.equal(open('/assets/abc.png'), null)
  assert.equal(open('/assets/'), null)
  assert.equal(open('http://localhost:3000/assets/abc.html'), null)
  assert.equal(open(`${ASSETS}/abc.html`), null)
  assert.equal(open(ASSETS), null)
  // a sibling path on the same origin is fine
  assert.equal(open('/assets-docs/page'), 'http://localhost:3000/assets-docs/page')
  assert.equal(open('http://localhost:3000/other/assets/x'), 'http://localhost:3000/other/assets/x')
})

test('worldOpenPolicy: an assets base on another origin blocks that origin prefix only', () => {
  const cdn = { resolve, base: 'https://world.example/', assetsUrl: 'https://cdn.example/w1/assets/' }
  assert.equal(resolveOpenURL('https://cdn.example/w1/assets/x.png', cdn), null)
  assert.equal(resolveOpenURL('https://cdn.example/w1/assets', cdn), null)
  assert.equal(resolveOpenURL('https://cdn.example/w2/assets/x.png', cdn), 'https://cdn.example/w2/assets/x.png')
  assert.equal(resolveOpenURL('https://world.example/assets/x.png', cdn), null)
  assert.equal(resolveOpenURL('https://world.example/about', cdn), 'https://world.example/about')
  // an assets base at the root of an origin blocks that whole origin
  const rootCdn = { resolve, base: 'https://world.example/', assetsUrl: 'https://cdn.example/' }
  assert.equal(resolveOpenURL('https://cdn.example/anything', rootCdn), null)
})

test('worldOpenPolicy: invalid input is rejected without throwing', () => {
  for (const url of [undefined, null, 42, {}, '', '   ', 'https://exa mple.com', 'http://']) {
    assert.equal(open(url), null, String(url))
  }
  assert.equal(resolveOpenURL('https://example.com/', { base: 'http://localhost/' }), 'https://example.com/')
  assert.equal(resolveOpenURL('/relative', {}), null) // no base: a relative URL cannot be resolved
  assert.equal(resolveOpenURL('https://ok.example/', { resolve: () => 42 }), null)
})

test('worldOpenPolicy: percent-encoded and dot-segment spellings of the assets store are rejected', () => {
  for (const url of [
    '/%61ssets/avatar.vrm',
    'http://localhost:3000/%61ssets/avatar.vrm',
    'http://localhost:3000/%41ssets/../assets/avatar.vrm',
    '/assets/%2e%2e/assets/avatar.vrm',
    '/other/../assets/avatar.vrm',
    '/assets/./avatar.vrm',
    '/assets//avatar.vrm',
    '/%61ssets',
  ]) {
    assert.equal(open(url), null, url)
  }
  // encodings the server and the policy could read differently are refused on origins that serve assets
  for (const url of ['/x%2Fassets/a', '/assets%2Fa', '/a%5Cassets', '/%2561ssets/a', '/assets%25', '/%zz']) {
    assert.equal(open(url), null, url)
  }
  // the same spellings on a foreign origin are not assets
  assert.equal(open('https://example.com/%61ssets/x'), 'https://example.com/%61ssets/x')
  assert.equal(open('https://example.com/a%2Fb'), 'https://example.com/a%2Fb')
  // case matters, as it does for the static file server
  assert.equal(open('/Assets/avatar.vrm'), 'http://localhost:3000/Assets/avatar.vrm')
  assert.equal(open('/%41ssets/avatar.vrm'), 'http://localhost:3000/%41ssets/avatar.vrm')
})

test('worldOpenPolicy: an external assets prefix is matched after decoding too', () => {
  const cdn = { resolve, base: 'https://world.example/', assetsUrl: 'https://cdn.example/w1/assets/' }
  for (const url of [
    'https://cdn.example/w1/%61ssets/x.png',
    'https://cdn.example/%77%31/assets/x.png',
    'https://cdn.example/w1/other/../assets/x.png',
    'https://cdn.example/w1/assets%2Fx.png',
  ]) {
    assert.equal(resolveOpenURL(url, cdn), null, url)
  }
  assert.equal(resolveOpenURL('https://cdn.example/w1/%41ssets/x.png', cdn), 'https://cdn.example/w1/%41ssets/x.png')
  // an encoded configured prefix normalizes the same way
  const encoded = { resolve, base: 'https://world.example/', assetsUrl: 'https://cdn.example/w%31/assets' }
  assert.equal(resolveOpenURL('https://cdn.example/w1/assets/x.png', encoded), null)
  assert.equal(resolveOpenURL('https://cdn.example/w2/assets/x.png', encoded), 'https://cdn.example/w2/assets/x.png')
})
