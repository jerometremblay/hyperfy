import assert from 'node:assert/strict'
import test from 'node:test'
import { getXRMenuButton, XRPoke } from './xrUI.js'

test('uses the registered left menu index only on profiles that expose it', () => {
  const menu = { pressed: true }
  const source = { handedness: 'left', profiles: ['meta-quest-touch-plus'], gamepad: { buttons: [] } }
  source.gamepad.buttons[7] = menu
  assert.equal(getXRMenuButton(source), menu)
  source.profiles = ['oculus-touch-v3']
  assert.equal(getXRMenuButton(source), menu)
  source.profiles = ['oculus-touch-v2', 'oculus-touch']
  assert.equal(getXRMenuButton(source), null)
  source.profiles = ['generic-trigger-squeeze-thumbstick']
  assert.equal(getXRMenuButton(source), null)
  source.profiles = ['meta-quest-touch-plus']
  source.handedness = 'right'
  assert.equal(getXRMenuButton(source), null)
  source.handedness = 'left'
  source.hand = {}
  assert.equal(getXRMenuButton(source), null)
  delete source.hand
  source.gamepad.buttons = []
  assert.equal(getXRMenuButton(source), null)
})

test('a fingertip poke presses once and must retract before another press', () => {
  const poke = new XRPoke()
  const at = z => poke.update({ x: 0.1, y: 0.1, z }, 0.5, 0.5)
  assert.deepEqual(at(0.04).uv, { x: 0.7, y: 0.3 })
  assert.equal(at(0.007).pressed, true)
  assert.equal(at(-0.01).down, true)
  assert.equal(at(0.009).pressed, false)
  assert.equal(at(0.026).released, true)
  assert.equal(at(0.007).pressed, true)
})

test('starting behind the panel does not click through it', () => {
  const poke = new XRPoke()
  assert.equal(poke.update({ x: 0, y: 0, z: -0.01 }, 0.5, 0.5).down, false)
  assert.equal(poke.update({ x: 0, y: 0, z: 0.01 }, 0.5, 0.5).down, false)
  poke.update({ x: 0, y: 0, z: 0.04 }, 0.5, 0.5)
  assert.equal(poke.update({ x: 0, y: 0, z: 0 }, 0.5, 0.5).pressed, true)
})

test('leaving the bounds or losing tracking releases a press and requires a new approach', () => {
  const poke = new XRPoke()
  poke.update({ x: 0, y: 0, z: 0.04 }, 0.5, 0.5)
  poke.update({ x: 0, y: 0, z: 0 }, 0.5, 0.5)
  const lost = poke.update(null)
  assert.equal(lost.released, true)
  assert.equal(lost.uv, null)
  assert.equal(poke.update({ x: 0, y: 0, z: 0 }, 0.5, 0.5).down, false)
  poke.update({ x: 0, y: 0, z: 0.04 }, 0.5, 0.5)
  const outside = poke.update({ x: 0.3, y: 0, z: 0 }, 0.5, 0.5)
  assert.equal(outside.uv, null)
  assert.equal(outside.pressed, false)
})
