// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/internalEvents.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { internalEvents } from '../../src/core/extras/internalEvents.js'

test('internalEvents: covers every app hook and world event the engine raises', () => {
  // app hooks emitted by App.js and the world events emitted by the systems
  for (const name of [
    'fixedUpdate',
    'update',
    'animate',
    'lateUpdate',
    'destroy',
    'enter',
    'leave',
    'chat',
    'command',
    'health',
  ]) {
    assert.ok(internalEvents.includes(name), name)
  }
  assert.equal(internalEvents.includes('customEvent'), false)
})
