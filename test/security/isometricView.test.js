import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { ISOMETRIC_PITCH, ISOMETRIC_YAW, RETRO_PITCH, getPixelViewport } from '../../src/core/extras/isometricView.js'

test('isometric projection gives all three world axes equal screen length', () => {
  const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(ISOMETRIC_PITCH, ISOMETRIC_YAW, 0, 'YXZ'))
  const inverse = rotation.clone().invert()
  const lengths = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ].map(axis => {
    const projected = new THREE.Vector3(...axis).applyQuaternion(inverse)
    return Math.hypot(projected.x, projected.y)
  })
  assert.ok(Math.max(...lengths) - Math.min(...lengths) < 1e-10)
})

test('retro projection faces straight along the world axes at the prototype elevation', () => {
  const inverse = new THREE.Quaternion().setFromEuler(new THREE.Euler(RETRO_PITCH, 0, 0, 'YXZ')).invert()
  const x = new THREE.Vector3(1, 0, 0).applyQuaternion(inverse)
  const z = new THREE.Vector3(0, 0, 1).applyQuaternion(inverse)
  assert.equal(x.y, 0)
  assert.equal(z.x, 0)
  assert.ok(Math.abs(z.y) > 0.7 && Math.abs(z.y) < 0.8)
})

test('pixel viewport starts at 1024×768 and keeps wide, portrait and small displays proportional', () => {
  assert.deepEqual(getPixelViewport(1024, 768), { width: 1024, height: 768 })
  assert.deepEqual(getPixelViewport(2048, 1536), { width: 1024, height: 768 })
  assert.deepEqual(getPixelViewport(1920, 1080), { width: 1024, height: 576 })
  assert.deepEqual(getPixelViewport(1440, 900), { width: 1024, height: 640 })
  assert.deepEqual(getPixelViewport(390, 844), { width: 355, height: 768 })
  assert.deepEqual(getPixelViewport(320, 180), { width: 320, height: 180 })
  assert.deepEqual(getPixelViewport(0, 0), { width: 1, height: 1 })
})
