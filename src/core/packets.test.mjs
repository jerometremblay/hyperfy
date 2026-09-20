import assert from 'node:assert/strict'
import test from 'node:test'

import { readPacket, writePacket } from './packets.js'

test('browser input packets decode to the server browser-input handler', () => {
  const data = {
    entityId: 'shared-app',
    url: 'https://radio-canada.ca/',
    input: {
      type: 'mouseWheel',
      u: 0.5,
      v: 0.5,
      deltaX: 0,
      deltaY: 120,
    },
  }

  assert.deepEqual(readPacket(writePacket('browserInput', data)), ['onBrowserInput', data])
})
