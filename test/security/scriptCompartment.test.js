// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/scriptCompartment.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

// the real lockdown config (ses must be imported first, as in src/server/index.js)
import 'ses'
await import('../../src/core/lockdown.js')

import { createScriptCompartment, lockGlobals, wrapRawCode } from '../../src/core/extras/scriptCompartment.js'

class Vector3 {
  constructor(x = 0) {
    this.x = x
  }
}

function makeCompartment(extra = {}) {
  return createScriptCompartment({
    Vector3,
    Math,
    num: () => 4,
    eval: undefined,
    harden: undefined,
    lockdown: undefined,
    ...extra,
  })
}

test('lockdown: harden is real and the intrinsics are frozen', () => {
  assert.equal(typeof globalThis.harden, 'function')
  assert.equal(globalThis.harden.isFake, undefined)
  assert.equal(Object.isFrozen(Object.prototype), true)
  assert.equal(Object.isFrozen(Array.prototype), true)
  assert.equal(Object.isFrozen(Math), true)
  assert.throws(() => {
    'use strict'
    Array.prototype.__probe = 1
  }, TypeError)
})

test('scriptCompartment: intrinsic writes throw inside the script and do not leak', () => {
  const c = makeCompartment()
  assert.throws(() => c.evaluate('Array.prototype.probe = 1'), TypeError)
  assert.throws(() => c.evaluate('Math.floor = () => 0'), TypeError)
  assert.throws(() => c.evaluate('Object.prototype.polluted = true'), TypeError)
  assert.equal(Array.prototype.probe, undefined)
  assert.equal(Math.floor(1.5), 1)
  assert.equal({}.polluted, undefined)
})

test('scriptCompartment: endowed globals cannot be reassigned, redefined or deleted', () => {
  const c = makeCompartment()
  assert.throws(() => c.evaluate('Vector3 = 1'), TypeError)
  assert.throws(() => c.evaluate('globalThis.Vector3 = 1'), TypeError)
  assert.throws(() => c.evaluate('Object.defineProperty(globalThis, "Vector3", { value: 1 })'), TypeError)
  assert.throws(() => c.evaluate('delete globalThis.Vector3'), TypeError)
  assert.throws(() => c.evaluate('num = () => 0'), TypeError)
  assert.throws(() => c.evaluate('globalThis.eval = 1'), TypeError)
  assert.equal(c.evaluate('Vector3'), Vector3)
  assert.equal(c.evaluate('typeof eval'), 'undefined')
  const desc = Object.getOwnPropertyDescriptor(c.globalThis, 'Vector3')
  assert.equal(desc.writable, false)
  assert.equal(desc.configurable, false)
})

test('scriptCompartment: two compartments do not share globals', () => {
  const a = makeCompartment()
  const b = makeCompartment()
  a.evaluate('globalThis.stash = "secret"; var hoisted = 1')
  assert.equal(a.evaluate('stash'), 'secret')
  assert.equal(b.evaluate('typeof stash'), 'undefined')
  assert.equal(b.evaluate('typeof hoisted'), 'undefined')
  assert.equal(typeof globalThis.stash, 'undefined')
  assert.notEqual(a.globalThis, b.globalThis)
  // a shared endowment is the same object, but it is frozen and cannot carry a stash
  assert.throws(() => a.evaluate('Math.stash = 1'), TypeError)
})

test('scriptCompartment: shared persists across exec() calls of one evaluation; a new evaluation starts fresh', () => {
  const code = 'shared.n = (shared.n || 0) + 1; return shared.n'
  const c = makeCompartment()
  const fn = c.evaluate(wrapRawCode(code))
  assert.equal(fn(), 1)
  assert.equal(fn(), 2)
  const fn2 = makeCompartment().evaluate(wrapRawCode(code))
  assert.equal(fn2(), 1)
  // the wrapper still passes the documented arguments, with config as the deprecated alias of props
  const args = c.evaluate(wrapRawCode('return [world, app, typeof fetch, props, config, typeof setTimeout]'))
  assert.deepEqual(
    args(
      'w',
      'a',
      () => {},
      { p: 1 },
      () => {}
    ),
    ['w', 'a', 'function', { p: 1 }, { p: 1 }, 'function']
  )
})

test('scriptCompartment: scripts run in strict mode and see no host globals', () => {
  const c = makeCompartment()
  assert.equal(c.evaluate('(function () { return this })()'), undefined)
  assert.equal(c.evaluate('typeof process'), 'undefined')
  assert.equal(c.evaluate('typeof require'), 'undefined')
  assert.equal(c.evaluate('typeof harden'), 'undefined')
  assert.equal(c.evaluate('typeof lockdown'), 'undefined')
})

test('lockGlobals: skips names that are not present and keeps values', () => {
  const g = { a: 1 }
  lockGlobals(g, ['a', 'missing'])
  assert.equal(g.a, 1)
  assert.equal(Object.getOwnPropertyDescriptor(g, 'a').writable, false)
  assert.equal('missing' in g, false)
})
