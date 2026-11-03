import assert from 'node:assert/strict'
import test from 'node:test'
import { importPolyspoonRecipe, refreshPolyspoonRecipe } from './polyspoonImport.js'
import { sanitizeBlueprintAdd } from './blueprintPolicy.js'

const world = { network: { apiUrl: 'https://world.example/api', authToken: 'session-token' } }
const model = `polyspoon://${'a'.repeat(64)}`

test('downloads without credentials and registers with the world session', async () => {
  const calls = []
  const fetcher = async (url, options) => {
    calls.push({ url, options })
    if (calls.length === 1) return new Response('export const example = 1')
    return Response.json({ model }, { status: 201 })
  }
  const blueprint = await importPolyspoonRecipe(world, 'https://example.com/my-stall.recipe.mjs', fetcher)
  assert.equal(blueprint.name, 'my stall')
  assert.equal(blueprint.model, model)
  assert.equal(blueprint.url, 'https://example.com/my-stall.recipe.mjs')
  assert.equal(calls[0].options.credentials, 'omit')
  assert.equal(calls[0].options.referrerPolicy, 'no-referrer')
  assert.equal(calls[0].options.headers, undefined)
  assert.equal(calls[1].url, 'https://world.example/api/polyspoon/recipes')
  assert.equal(calls[1].options.headers.Authorization, 'Bearer session-token')
  assert.equal(JSON.parse(calls[1].options.body).source, 'export const example = 1')
})

test('refuses insecure URLs, inaccessible hosts, oversized sources and failed registration', async () => {
  await assert.rejects(importPolyspoonRecipe(world, 'http://example.com/a.mjs'), /HTTPS/)
  await assert.rejects(importPolyspoonRecipe(world, 'https://user:pass@example.com/a.mjs'), /HTTPS/)
  await assert.rejects(importPolyspoonRecipe(world, 'https://example.com/a.mjs', async () => { throw new TypeError() }), /cross-origin/)
  await assert.rejects(importPolyspoonRecipe(world, 'https://example.com/a.mjs', async () => new Response('x'.repeat(512001))), /too large/)
  let count = 0
  await assert.rejects(importPolyspoonRecipe(world, 'https://example.com/a.mjs', async () => {
    count++
    return count === 1 ? new Response('source') : Response.json({ error: 'Admin rank required' }, { status: 403 })
  }), /Admin rank required/)
})

test('sends a Polyspoon asset page to the world for resolution', async () => {
  const id = 'a'.repeat(64)
  let call
  const blueprint = await importPolyspoonRecipe(world, `https://polyspoon.com/asset/${id}?offset=24`, async (url, options) => {
    call = { url, options }
    return Response.json({ model, name: 'Park Lamp Iron' }, { status: 201 })
  })
  assert.equal(blueprint.name, 'Park Lamp Iron')
  assert.equal(blueprint.url, `https://polyspoon.com/asset/${id}?offset=24`)
  assert.equal(call.url, 'https://world.example/api/polyspoon/recipes')
  assert.equal(JSON.parse(call.options.body).assetUrl, `https://polyspoon.com/asset/${id}?offset=24`)
  const saved = sanitizeBlueprintAdd({ ...blueprint, id: 'test', version: 0 })
  assert.equal(saved.ok, true)
  assert.equal(JSON.parse(JSON.stringify(saved.value)).url, blueprint.url)
})

function refreshFixture() {
  const original = { id: 'blueprint', version: 3, model: `polyspoon://${'b'.repeat(64)}`, url: `https://polyspoon.com/asset/${'c'.repeat(64)}?offset=24`, props: { width: 1.8 }, frozen: false }
  const app = { data: { id: 'entity', blueprint: original.id, position: [1, 2, 3], quaternion: [0, 0, 0, 1], scale: [1, 1, 1] } }
  const state = { blueprint: original, changes: [] }
  const world = {
    network: { apiUrl: 'https://world.example/api', authToken: 'session-token' },
    entities: { get: id => id === app.data.id ? app : null, player: { isAdmin: () => true } },
    blueprints: {
      get: id => id === original.id ? state.blueprint : null,
      modify: (change, local) => { state.changes.push({ change, local }); state.blueprint = { ...state.blueprint, ...change }; return true },
    },
  }
  return { original, app, state, world }
}

test('refresh retains source, parameters and transform, modifying only the model', async () => {
  const { original, app, state, world } = refreshFixture()
  const before = structuredClone(app.data)
  let request
  const changed = await refreshPolyspoonRecipe(world, app, async (url, options) => {
    request = JSON.parse(options.body)
    return Response.json({ model, name: 'Lamp' }, { status: 201 })
  })
  assert.equal(changed, true)
  assert.equal(request.assetUrl, original.url)
  assert.deepEqual(request.params, original.props)
  assert.deepEqual(state.changes, [{ change: { id: original.id, version: 4, model }, local: true }])
  assert.equal(state.blueprint.url, original.url)
  assert.deepEqual(state.blueprint.props, original.props)
  assert.deepEqual(app.data, before)
})

test('refresh leaves the old recipe in place when unchanged or the update fails', async () => {
  const { original, app, state, world } = refreshFixture()
  assert.equal(await refreshPolyspoonRecipe(world, app, async () => Response.json({ model: original.model })), false)
  await assert.rejects(refreshPolyspoonRecipe(world, app, async () => Response.json({ error: 'Incompatible parameters' }, { status: 400 })), /Incompatible parameters/)
  assert.equal(state.changes.length, 0)
  assert.equal(state.blueprint.model, original.model)
})

test('refresh refuses to overwrite concurrent edits, removal, rank loss or an unsaved update', async () => {
  for (const mutate of [
    ({ state }) => { state.blueprint = { ...state.blueprint, version: 4, props: { width: 2 } } },
    ({ app }) => { app.data.blueprint = 'another' },
    ({ world }) => { world.entities.get = () => null },
    ({ world }) => { world.entities.player.isAdmin = () => false },
  ]) {
    const fixture = refreshFixture()
    await assert.rejects(refreshPolyspoonRecipe(fixture.world, fixture.app, async () => {
      mutate(fixture)
      return Response.json({ model })
    }), /changed while refreshing/)
    assert.equal(fixture.state.changes.length, 0)
  }
  const fixture = refreshFixture()
  fixture.world.blueprints.modify = () => false
  await assert.rejects(refreshPolyspoonRecipe(fixture.world, fixture.app, async () => Response.json({ model })), /Could not save/)
})
