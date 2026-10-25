// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/logOnce.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { briefError, createLogOnce } from '../../src/core/extras/logOnce.js'

test('createLogOnce: logs once per subject and key, and says whether it did', () => {
  const lines = []
  const logOnce = createLogOnce(m => lines.push(m))
  const a = { id: 'a' }
  const b = { id: 'b' }
  assert.equal(logOnce(a, 'size', 'a too big'), true)
  assert.equal(logOnce(a, 'size', 'a too big again'), false)
  assert.equal(logOnce(a, 'rate', 'a too fast'), true)
  assert.equal(logOnce(b, 'size', 'b too big'), true)
  assert.equal(logOnce(b, 'size', 'b too big again'), false)
  assert.deepEqual(lines, ['a too big', 'a too fast', 'b too big'])
})

test('createLogOnce: defaults to console.warn', () => {
  const warn = console.warn
  const lines = []
  console.warn = m => lines.push(m)
  try {
    const logOnce = createLogOnce()
    logOnce({}, 'k', 'hello')
    assert.deepEqual(lines, ['hello'])
  } finally {
    console.warn = warn
  }
})

test('briefError: only own strings, bounded and safe against accessors and hostile thrown values', () => {
  assert.equal(briefError(new Error('message')), 'message')
  assert.equal(briefError({ name: 'TypeError', message: 'bad' }), 'TypeError: bad')
  assert.equal(briefError({ message: 'x'.repeat(1000) }), 'x'.repeat(200))
  assert.equal(briefError(Object.create({ message: 'inherited' })), 'error')
  assert.equal(
    briefError({
      get message() {
        throw new Error('getter')
      },
    }),
    'error'
  )
  assert.equal(
    briefError({
      message: {
        toString() {
          throw new Error('coercion')
        },
      },
    }),
    'error'
  )
  assert.equal(
    briefError(
      new Proxy(
        {},
        {
          getOwnPropertyDescriptor() {
            throw new Error('proxy')
          },
        }
      )
    ),
    'error'
  )
  for (const value of [null, undefined, 123, 'string']) assert.equal(briefError(value), 'error')
})
