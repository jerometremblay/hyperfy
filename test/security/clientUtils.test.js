import assert from 'node:assert/strict'
import test from 'node:test'
import { cls, isTouch } from '../../src/client/utils.js'

test('shared controls utilities load in a headless Node client without browser globals', () => {
  assert.equal(isTouch, false)
  assert.equal(cls('app', { active: true, hidden: false }), ' app active')
})
