import assert from 'node:assert/strict'
import test from 'node:test'
import { resolvePolyspoonAsset } from './polyspoonCatalog.js'

const id = 'a'.repeat(64)
const input = `https://polyspoon.com/asset/${id}?offset=24`
function fixture(overrides = {}) {
  const calls = []
  const responses = {
    [`/api/catalog/${id}`]: JSON.stringify({ id, title: 'Park Lamp Iron', sourceFamily: 'lamp-post', candidate: 'park-lamp', ...overrides }),
    [`/asset/${id}`]: '<link rel="modulepreload" href="/app/assets/recipe-loader-AbC.js">',
    '/app/assets/recipe-loader-AbC.js': 'var x=`/app/assets/asset-123.mjs`,y=`/app/assets/asset-456.mjs`;var map={"./modules/lamp-post/0.9.0/asset.mjs":x,"./modules/lamp-post/1.0.0/asset.mjs":y};',
    '/app/assets/asset-456.mjs': 'export const metadata = {}',
  }
  return { calls, fetcher: async (url, options) => {
    calls.push({ url, options })
    const path = new URL(url).pathname
    return responses[path] === undefined ? new Response('', { status: 404 }) : new Response(responses[path])
  } }
}

test('resolves catalog metadata and selects the current family recipe without executing site code', async () => {
  const { calls, fetcher } = fixture()
  const result = await resolvePolyspoonAsset(input, fetcher)
  assert.equal(result.name, 'Park Lamp Iron')
  assert.equal(result.recipeUrl, 'https://polyspoon.com/app/assets/asset-456.mjs')
  assert.equal(result.source, 'export const metadata = {}')
  assert.match(result.hint, /park-lamp/)
  assert.equal(calls.length, 4)
  for (const call of calls) {
    assert.equal(new URL(call.url).origin, 'https://polyspoon.com')
    assert.equal(call.options.redirect, 'error')
  }
})

test('refuses arbitrary hosts, malformed ids, unavailable families and source packages', async () => {
  for (const url of [`https://other.example/asset/${id}`, `https://polyspoon.com.evil.example/asset/${id}`, `https://user@polyspoon.com/asset/${id}`, 'https://polyspoon.com/asset/../../admin', 'http://polyspoon.com/asset/' + id]) {
    await assert.rejects(resolvePolyspoonAsset(url, () => { throw Error('should not fetch') }), /valid Polyspoon/)
  }
  for (const overrides of [{ sourceFamily: '../admin' }, { sourceFamily: null }, { sourcePackage: { path: 'source.zip' } }]) {
    await assert.rejects(resolvePolyspoonAsset(input, fixture(overrides).fetcher), /not supported|supported recipe/)
  }
})

test('bounds upstream data and rejects failed or redirected responses', async () => {
  await assert.rejects(resolvePolyspoonAsset(input, async () => new Response('x'.repeat(1000001))), /Could not read/)
  await assert.rejects(resolvePolyspoonAsset(input, async () => { throw new Error('redirect blocked') }), /Could not read/)
})
