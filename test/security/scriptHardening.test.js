// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/scriptHardening.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

// imported without lockdown: there is no harden() here, as in the viewer and standalone client bundles
import { canHarden, hardenForScripts, hardenScriptClasses } from '../../src/core/extras/scriptHardening.js'

const deepFreeze = value => {
  if (value && (typeof value === 'object' || typeof value === 'function') && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const key of Reflect.ownKeys(value)) deepFreeze(value[key])
  }
  return value
}

test('scriptHardening: without harden() everything is a no-op that returns its input', () => {
  assert.equal(typeof globalThis.harden, 'undefined')
  assert.equal(canHarden(), false)
  const value = { fn: () => {} }
  assert.equal(hardenForScripts(value), value)
  assert.equal(Object.isFrozen(value), false)
  assert.doesNotThrow(() => hardenScriptClasses())
  assert.doesNotThrow(() => hardenScriptClasses())
})

test('scriptHardening: the fake hardener of __hardenTaming__ unsafe is treated as absent', () => {
  const fake = Object.assign(x => x, { isFake: true })
  globalThis.harden = fake
  try {
    assert.equal(canHarden(), false)
    const value = { n: 1 }
    assert.equal(hardenForScripts(value), value)
    assert.equal(Object.isFrozen(value), false)
  } finally {
    delete globalThis.harden
  }
})

test('scriptHardening: with a real hardener values are frozen and the class pass runs once', () => {
  let calls = 0
  globalThis.harden = value => {
    calls++
    return deepFreeze(value)
  }
  try {
    assert.equal(canHarden(), true)
    const helpers = { num: () => 1, nested: { deep: () => 2 } }
    assert.equal(hardenForScripts(helpers), helpers)
    assert.equal(Object.isFrozen(helpers), true)
    assert.equal(Object.isFrozen(helpers.num), true)
    assert.equal(Object.isFrozen(helpers.nested.deep), true)
    assert.equal(calls, 1)
    hardenScriptClasses()
    const afterFirst = calls
    hardenScriptClasses()
    assert.equal(calls, afterFirst) // idempotent
  } finally {
    delete globalThis.harden
  }
})
