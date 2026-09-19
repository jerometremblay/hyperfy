import assert from 'node:assert/strict'
import test from 'node:test'

import { detectBuilderFileType } from './splatFormats.js'

test('detects Hyperfy apps as builder files', () => {
  assert.equal(detectBuilderFileType('primitive_cottage_detailed.hyp'), 'hyp')
})

test('preserves the existing builder file types', () => {
  assert.equal(detectBuilderFileType('house.glb'), 'glb')
  assert.equal(detectBuilderFileType('avatar.vrm'), 'vrm')
  assert.equal(detectBuilderFileType('garden.ply'), 'ply')
  assert.equal(detectBuilderFileType('notes.txt'), null)
})
