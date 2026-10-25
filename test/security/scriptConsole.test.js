// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/scriptConsole.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import util from 'node:util'

import { createScriptConsole, hostInspect } from '../../src/core/extras/scriptConsole.js'

const custom = Symbol.for('nodejs.util.inspect.custom')

function makeTarget() {
  const calls = []
  const target = {}
  for (const name of ['log', 'warn', 'error', 'time', 'timeEnd']) {
    target[name] = (...args) => calls.push([name, ...args])
  }
  return { target, calls }
}

test('scriptConsole: on Node the host console only ever receives primitives', () => {
  const { target, calls } = makeTarget()
  const scriptConsole = createScriptConsole({ inspect: util.inspect, target })
  const hookArgs = []
  const hostile = {
    a: 1,
    nested: { deep: { deeper: { deepest: { beyond: { gone: true } } } } },
    [custom](...args) {
      hookArgs.push(args)
      return 'custom output'
    },
  }
  const before = { ...util.inspect.defaultOptions }
  scriptConsole.log('label', 42, true, null, undefined, hostile, [1, 'two'], () => {})
  scriptConsole.warn(hostile)
  scriptConsole.error(new TypeError('boom'))
  scriptConsole.time(hostile)
  scriptConsole.timeEnd(hostile)
  assert.equal(hookArgs.length, 0, 'the custom inspect hook is never invoked')
  assert.deepEqual(util.inspect.defaultOptions, before)
  for (const [, ...args] of calls) {
    for (const arg of args) {
      assert.ok(
        arg === null || (typeof arg !== 'object' && typeof arg !== 'function'),
        `${typeof arg} reached the host`
      )
    }
  }
  const [, label, n, bool, nul, undef, rendered, arr, fn] = calls[0]
  assert.equal(label, 'label')
  assert.equal(n, 42)
  assert.equal(bool, true)
  assert.equal(nul, null)
  assert.equal(undef, undefined)
  assert.match(rendered, /a: 1/)
  assert.match(rendered, /\[Object\]/) // depth-limited, still readable
  assert.doesNotMatch(rendered, /custom output/)
  assert.match(arr, /\[ 1, 'two' \]/)
  assert.match(fn, /\[Function/)
  assert.match(calls[2][1], /TypeError: boom/)
  assert.equal(calls[3][0], 'time')
  assert.equal(calls[4][0], 'timeEnd')
})

test('scriptConsole: a value that cannot be inspected is rendered as a placeholder', () => {
  const { target, calls } = makeTarget()
  // util.inspect formats a Proxy's target without running its traps; a hostile Proxy still logs something
  const hostile = new Proxy(
    {},
    {
      ownKeys() {
        throw new Error('trap')
      },
      getPrototypeOf() {
        throw new Error('trap')
      },
    }
  )
  assert.doesNotThrow(() => createScriptConsole({ inspect: util.inspect, target }).log('x', hostile))
  assert.equal(typeof calls[0][2], 'string')
  // and when the formatter itself fails, the placeholder is logged instead of throwing into the script
  const failing = createScriptConsole({
    inspect: () => {
      throw new Error('cannot format')
    },
    target,
  })
  assert.doesNotThrow(() => failing.log('y', { a: 1 }))
  assert.deepEqual(calls[1], ['log', 'y', '[unprintable value]'])
})

test('scriptConsole: without an inspect function (browsers) arguments pass through unchanged', () => {
  const { target, calls } = makeTarget()
  const scriptConsole = createScriptConsole({ target })
  const obj = { a: 1 }
  scriptConsole.log('x', obj)
  assert.equal(calls[0][2], obj)
})

test('scriptConsole: hostInspect resolves util.inspect on Node without a bundler-visible import', () => {
  assert.equal(hostInspect(), util.inspect)
})
