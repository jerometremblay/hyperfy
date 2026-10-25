import assert from 'node:assert/strict'
import test from 'node:test'
import 'ses'
import { Room } from 'livekit-client'
import '../../src/core/lockdown.js'

test('LiveKit initializes before lockdown while script intrinsics remain hardened', () => {
  const room = new Room()
  assert.ok(room)
  assert.ok(Object.isFrozen(Promise))
  assert.ok(Object.isFrozen(Array.prototype))
  assert.throws(() => new Compartment().evaluate('Promise.resolve = () => 1'), TypeError)
})
