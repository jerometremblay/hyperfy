// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/callScript.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { callEntry, callScript } from '../../src/core/extras/callScript.js'

function captureErrors(fn) {
  const errors = []
  const original = console.error
  console.error = (...args) => errors.push(args)
  try {
    fn()
  } finally {
    console.error = original
  }
  return errors
}

test('callScript: runs the callback with an undefined receiver and only the given arguments', () => {
  let seenThis = 'unset'
  let seenArgs
  const result = callScript(
    function (...args) {
      seenThis = this
      seenArgs = args
      return 'ok'
    },
    1,
    'two'
  )
  assert.equal(seenThis, undefined)
  assert.deepEqual(seenArgs, [1, 'two'])
  assert.equal(result, 'ok')
  assert.equal(
    callScript(function () {}),
    undefined
  )
})

test('callScript: ignores non-functions and contains errors', () => {
  assert.equal(callScript(undefined), undefined)
  assert.equal(callScript(null, 1), undefined)
  assert.equal(callScript('not a function'), undefined)
  const errors = captureErrors(() => {
    assert.equal(
      callScript(() => {
        throw new Error('boom')
      }),
      undefined
    )
  })
  assert.equal(errors.length, 1)
  assert.match(String(errors[0][0]), /boom/)
})

test('callEntry: runs the callback with the entry as receiver and returns its value', () => {
  const entry = { capture: false, onPress: null }
  entry.onPress = function () {
    this.capture = true
    return true
  }
  assert.equal(callEntry(entry, 'onPress'), true)
  assert.equal(entry.capture, true)
  assert.equal(callEntry(entry, 'onRelease'), undefined)
  assert.equal(callEntry({ onPress: 'x' }, 'onPress'), undefined)
})

test('callEntry: a throwing callback is contained', () => {
  const entry = {
    onRelease() {
      throw new Error('bad release')
    },
  }
  const errors = captureErrors(() => {
    assert.equal(callEntry(entry, 'onRelease'), undefined)
  })
  assert.equal(errors.length, 1)
  assert.match(String(errors[0][0]), /bad release/)
})
