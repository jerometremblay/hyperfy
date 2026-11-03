import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'

const bundle = await build({
  stdin: { contents: `export { createPolyspoonModel } from './src/core/extras/polyspoon.js'; export * as fruitStall from './test/fixtures/polyspoon/market-stall.recipe.mjs'; export * as bookcase from './test/fixtures/polyspoon/bookcase.recipe.mjs';`, resolveDir: process.cwd() },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
const { createPolyspoonModel, fruitStall, bookcase } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

test('fruit stall creates independent Hyperfy meshes and releases its geometry', () => {
  const world = { network: { isServer: true } }
  const first = createPolyspoonModel(world, fruitStall)
  const second = createPolyspoonModel(world, fruitStall)
  assert.equal(first.root.children.filter(node => node.name === 'mesh').length, 60)
  const body = first.root.children.find(node => node.name === 'rigidbody')
  assert.equal(body.children[0].name, 'collider')
  assert.equal(body.children[0]._geometry.index.count / 3, 2340)
  const geometry = first.root.children[0]._geometry
  let disposed = false
  geometry.addEventListener('dispose', () => { disposed = true })
  first.dispose()
  assert.equal(disposed, true)
  assert.notEqual(second.root.children[0]._geometry, geometry)
  second.dispose()
})

test('wide cottage bookcase keeps its preset and exposes recipe controls', () => {
  const world = { network: { isServer: true } }
  const defaults = { ...bookcase.metadata.presets.find(preset => preset.id === 'cottage').parameters, width: 1.68 }
  const model = createPolyspoonModel(world, bookcase, defaults)
  assert.equal(model.fields.find(field => field.key === 'width').initial, 1.68)
  assert.equal(model.fields.find(field => field.key === 'colorway').initial, 'painted')
  assert.equal(model.root.children.filter(node => node.name === 'mesh').length, 70)
  assert.ok(model.root.children.find(node => node.name === 'rigidbody').children[0]._geometry.index.count > 0)
  model.dispose()
  const changed = createPolyspoonModel(world, bookcase, { ...defaults, width: 1.8 })
  assert.equal(changed.fields.find(field => field.key === 'width').initial, 1.8)
  changed.dispose()
})
