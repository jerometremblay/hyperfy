import assert from 'node:assert/strict'
import test from 'node:test'
import { importPolyforkModel, loadPolyforkSource } from './polyspoonImport.js'

test('source viewer downloads the original module from the Polyfork CDN', async () => {
  let requested
  const source = await loadPolyforkSource({}, { id: 'lab-stool-f405c7' }, async url => {
    requested = String(url)
    return new Response('export const createAsset = () => null')
  })
  assert.equal(requested, 'https://polyfork.dev/cdn/lab-stool-f405c7.mjs')
  assert.match(source, /export const createAsset/)
  await assert.rejects(loadPolyforkSource({}, { id: '../bad' }), /Invalid Polyfork model/)
})

test('HD selection downloads the account edition and retains a refreshable public URL', async () => {
  const requests = []
  const fetcher = async (url, options) => {
    requests.push({ url: String(url), options })
    return Response.json({ model: `polyfork://${'a'.repeat(64)}` })
  }
  const world = { network: { apiUrl: '/api', authToken: 'test' } }
  const blueprint = await importPolyforkModel(world, { id: 'lab-stool-f405c7', title: 'Lab Stool' }, fetcher, {}, {
    hd: true, cdnBase: 'https://polyfork.dev/c/abc123/',
  })
  assert.equal(requests[0].url, '/api/polyspoon/native-recipes')
  assert.deepEqual(JSON.parse(requests[0].options.body), {id:'lab-stool-f405c7', hd:true, cdnBase:'https://polyfork.dev/c/abc123/', params:{}})
  assert.equal(blueprint.url, 'https://polyfork.dev/asset/lab-stool-f405c7?edition=hd')
  assert.ok(!JSON.stringify(blueprint).includes('abc123'))
  await assert.rejects(importPolyforkModel(world, { id: 'lab-stool-f405c7' }, fetcher, {}, { hd: true, cdnBase: 'https://evil.example/' }), /CDN URL/)
})


test('HD selection can use the authenticated server configuration', async () => {
  const requests = []
  const fetcher = async (url, options = {}) => {
    requests.push({url: String(url), options})
    if (requests.length === 1) return Response.json({url: 'https://polyfork.dev/c/abc123/'})
    return Response.json({model: `polyfork://${'b'.repeat(64)}`})
  }
  const world = {network:{apiUrl:'/api', authToken:'test'}}
  await importPolyforkModel(world, {id:'lab-stool-f405c7'}, fetcher, {}, {hd:true})
  assert.equal(requests[0].url, '/api/polyspoon/cdn')
  assert.equal(requests[0].options.headers.Authorization, 'Bearer test')
  assert.equal(requests[1].url, '/api/polyspoon/native-recipes')
})
