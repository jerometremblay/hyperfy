import assert from 'node:assert/strict'
import test from 'node:test'
import { XR_HAND_BONES, cloneHandTrackingPose } from './handTracking.js'

test('maps every tracked finger segment to one VRM bone', () => {
  const names = XR_HAND_BONES.map(item => item.bone)
  assert.equal(XR_HAND_BONES.length, 15)
  assert.equal(new Set(names).size, names.length)
  assert.ok(XR_HAND_BONES.every(item => item.joint && item.parent && item.child))
})

test('clones network hand poses without sharing mutable arrays', () => {
  const source = {
    left: {
      kind: 'hand',
      p: [1, 2, 3],
      w: [0, 0, 0, 1],
      f: { IndexProximal: [0, 0, 0, 1] },
    },
  }

  const clone = cloneHandTrackingPose(source)
  clone.left.p[0] = 9
  clone.left.f.IndexProximal[3] = 0

  assert.deepEqual(source.left.p, [1, 2, 3])
  assert.deepEqual(source.left.f.IndexProximal, [0, 0, 0, 1])
})

test('drops malformed or unknown network hand fields', () => {
  const clone = cloneHandTrackingPose({
    left: {
      kind: 'hand',
      p: [0, 1, 2],
      w: [0, 0, 0, 1],
      f: {
        Unknown: [0, 0, 0, 1],
        IndexProximal: [0, 0, 0, 1],
      },
    },
    right: { p: ['bad', 0, 0] },
  })

  assert.deepEqual(clone, {
    left: {
      kind: 'hand',
      p: [0, 1, 2],
      w: [0, 0, 0, 1],
      f: { IndexProximal: [0, 0, 0, 1] },
    },
  })
})

test('rejects old calibration packets, invalid kinds, and zero quaternions', () => {
  const valid = { kind: 'hand', p: [0, 1, 0], w: [0, 0, 0, 1], f: {} }
  assert.equal(cloneHandTrackingPose({ left: { ...valid, kind: undefined } }), null)
  assert.equal(cloneHandTrackingPose({ left: { ...valid, kind: 'unknown' } }), null)
  assert.equal(cloneHandTrackingPose({ left: { ...valid, w: [0, 0, 0, 0] } }), null)
  const clone = cloneHandTrackingPose({ left: { ...valid, f: { IndexDistal: [0, 0, 0, 0] } } })
  assert.deepEqual(clone.left.f, {})
})
