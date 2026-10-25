import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bundleProbe } from './lib/workerProbe.mjs'

test('legacy transparent warns once across primitives and leaves opacity authoritative', async t => {
  const bundle = await bundleProbe(`export { Prim } from './src/core/nodes/Prim.js'`)
  t.after(() => bundle.destroy())
  const { Prim } = await import(bundle.url)
  const warn = console.warn
  const warnings = []
  console.warn = message => warnings.push(message)
  t.after(() => {
    console.warn = warn
  })
  for (let i = 0; i < 20; i++) {
    const prim = new Prim({ opacity: 0.5 })
    const proxy = prim.getProxy()
    proxy.transparent = true
    proxy.transparent = false
    assert.equal(prim.opacity, 0.5)
    proxy.opacity = 0.25
    assert.equal(prim.opacity, 0.25)
  }
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /transparent.*ignored.*opacity/)
})
