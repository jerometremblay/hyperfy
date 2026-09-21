import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { getAvatarFocus } from './avatarFocus.js'

test('uses the world-space avatar bounds center as the camera focus', () => {
  const avatar = new THREE.Group()
  avatar.position.set(4, 2, -3)
  avatar.rotation.y = 0.4
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.4), new THREE.MeshBasicMaterial())
  body.position.y = 0.9
  avatar.add(body)
  avatar.updateMatrixWorld(true)

  const expected = new THREE.Box3().setFromObject(avatar).getCenter(new THREE.Vector3())
  const bounds = new THREE.Box3()
  const focus = getAvatarFocus(avatar, undefined, new THREE.Vector3(), bounds)

  assert.ok(focus.distanceTo(expected) < 1e-8)
  assert.ok(bounds.getCenter(new THREE.Vector3()).distanceTo(expected) < 1e-8)
})

test('falls back to avatar origin plus half its height when bounds are empty', () => {
  const avatar = new THREE.Group()
  avatar.position.set(4, 2, -3)
  avatar.updateMatrixWorld(true)

  const focus = getAvatarFocus(avatar, 1.8, new THREE.Vector3(), new THREE.Box3())

  assert.deepEqual(focus.toArray(), [4, 2.9, -3])
})
