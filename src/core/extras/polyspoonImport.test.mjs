import assert from 'node:assert/strict'
import test from 'node:test'
import { importPolyforkModel } from './polyspoonImport.js'

test('HD selection downloads the account edition and retains a refreshable public URL', async () => {
  const requests = []
  const fetcher = async (url, options) => {
    requests.push({ url: String(url), options })
    if (requests.length === 1) return new Response('export const params = {}', { status: 200 })
    return Response.json({ model: `polyspoon://${'a'.repeat(64)}` })
  }
  const world = { network: { apiUrl: '/api', authToken: 'test' } }
  const blueprint = await importPolyforkModel(world, { id: 'lab-stool-f405c7', title: 'Lab Stool' }, fetcher, {}, {
    hd: true, cdnBase: 'https://polyfork.dev/c/abc123/',
  })
  assert.equal(requests[0].url, 'https://polyfork.dev/c/abc123/lab-stool-f405c7-hd.mjs')
  assert.equal(JSON.parse(requests[1].options.body).format, 'polyfork')
  assert.equal(blueprint.url, 'https://polyfork.dev/asset/lab-stool-f405c7?edition=hd')
  assert.ok(!JSON.stringify(blueprint).includes('abc123'))
  await assert.rejects(importPolyforkModel(world, { id: 'lab-stool-f405c7' }, fetcher, {}, { hd: true, cdnBase: 'https://evil.example/' }), /CDN URL/)
})


test('HD selection can use the authenticated server configuration', async () => {
  const requests = []
  const fetcher = async (url, options = {}) => {
    requests.push({url: String(url), options})
    if (requests.length === 1) return Response.json({url: 'https://polyfork.dev/c/abc123/'})
    if (requests.length === 2) return new Response('export const params = {}')
    return Response.json({model: `polyspoon://${'b'.repeat(64)}`})
  }
  const world = {network:{apiUrl:'/api', authToken:'test'}}
  await importPolyforkModel(world, {id:'lab-stool-f405c7'}, fetcher, {}, {hd:true})
  assert.equal(requests[0].url, '/api/polyspoon/cdn')
  assert.equal(requests[0].options.headers.Authorization, 'Bearer test')
  assert.equal(requests[1].url, 'https://polyfork.dev/c/abc123/lab-stool-f405c7-hd.mjs')
})
