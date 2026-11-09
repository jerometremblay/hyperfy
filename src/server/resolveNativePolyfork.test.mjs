import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveNativePolyfork } from './resolveNativePolyfork.js'

test('native model source is fetched from the Polyfork CDN without redirects', async () => {
  let request
  const source = await resolveNativePolyfork({ id: 'iron-bound-door-e0e953', hd: true, cdnBase: 'https://polyfork.dev/c/abc123/' }, async (url, options) => {
    request = { url, options }
    return new Response('export const createAsset = () => null')
  })
  assert.equal(request.url, 'https://polyfork.dev/c/abc123/iron-bound-door-e0e953-hd.mjs')
  assert.equal(request.options.redirect, 'error')
  assert.match(source, /createAsset/)
})

test('native model source rejects arbitrary URLs and oversized downloads', async () => {
  await assert.rejects(resolveNativePolyfork({ id: '../door' }), /Invalid Polyfork model/)
  await assert.rejects(resolveNativePolyfork({ id: 'door', hd: true, cdnBase: 'https://evil.example/' }), /Invalid Polyfork CDN/)
  await assert.rejects(resolveNativePolyfork({ id: 'door' }, async () => new Response(new Uint8Array(512001))), /too large/)
})
