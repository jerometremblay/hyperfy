// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/controlProxy.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createControlProxy } from '../../src/core/systems/controlProxy.js'

test('createControlProxy: resolver results are returned', () => {
  const control = { options: { object: { host: true } }, api: { release() {} } }
  const proxy = createControlProxy(prop => (prop in control.api ? control.api[prop] : undefined))
  assert.equal(proxy.release, control.api.release)
  assert.equal(proxy.options, undefined)
})

test('createControlProxy: the wrapped target exposes nothing', () => {
  const proxy = createControlProxy(() => undefined)
  assert.deepEqual(Object.keys(proxy), [])
  assert.equal(Object.getOwnPropertyDescriptor(proxy, 'options'), undefined)
  assert.equal('options' in proxy, false)
})
