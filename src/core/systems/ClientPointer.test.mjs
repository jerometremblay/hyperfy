import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const pointerBundle = await build({
  entryPoints: [fileURLToPath(new URL('./ClientPointer.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { ClientPointer } = await import(
  `data:text/javascript;base64,${Buffer.from(pointerBundle.outputFiles[0].contents).toString('base64')}`
)

test('unlocked pointer targets interactive 3D nodes under the cursor', () => {
  const events = []
  const pointerPosition = { x: 120, y: 80 }
  const hit = {
    uv: { x: 0.25, y: 0.75 },
    node: {
      onPointerEnter: event => events.push([event.type, event.uv]),
      onPointerMove: event => events.push([event.type, event.uv]),
      onPointerDown: event => events.push([event.type, event.uv]),
    },
  }
  let raycastPosition
  const pointer = new ClientPointer({
    stage: {
      raycastPointer(position) {
        raycastPosition = position
        return [hit]
      },
    },
  })
  pointer.control = {
    xrLeftTrigger: { value: 0 },
    xrRightTrigger: { value: 0 },
    pointer: { locked: false, position: pointerPosition },
    mouseLeft: { pressed: true, released: false, capture: false },
    mouseRight: { pressed: false, released: false, capture: false },
  }

  pointer.update(0)

  assert.equal(raycastPosition, pointerPosition)
  assert.deepEqual(events, [
    ['pointerenter', { x: 0.25, y: 0.75 }],
    ['pointermove', { x: 0.25, y: 0.75 }],
    ['pointerdown', { x: 0.25, y: 0.75 }],
  ])
})

test('unlocked pointer preserves right-button down and up events', () => {
  const events = []
  const hit = {
    uv: { x: 0.25, y: 0.75 },
    node: {
      onPointerDown: event => events.push([event.type, event.button]),
      onPointerUp: event => events.push([event.type, event.button]),
    },
  }
  const pointer = new ClientPointer({
    stage: { raycastPointer: () => [hit] },
  })
  const rightMouse = { pressed: true, released: false, capture: false }
  pointer.control = {
    xrLeftTrigger: { value: 0 },
    xrRightTrigger: { value: 0 },
    pointer: { locked: false, position: { x: 120, y: 80 } },
    mouseLeft: { pressed: false, released: false, capture: false },
    mouseRight: rightMouse,
  }

  pointer.update(0)
  rightMouse.pressed = false
  rightMouse.released = true
  pointer.update(0)

  assert.deepEqual(events, [
    ['pointerdown', 'right'],
    ['pointerup', 'right'],
  ])
})

test('pointer mouse capture controls whether clicks reach lower-priority bindings', () => {
  const pointer = new ClientPointer({})
  pointer.control = {
    mouseLeft: { capture: false },
    mouseRight: { capture: false },
  }

  const screenHit = { node: {} }
  pointer.setScreenHit(screenHit)
  assert.equal(pointer.screenHit, screenHit)
  assert.equal(pointer.control.mouseLeft.capture, true)

  pointer.setScreenHit(null)
  assert.equal(pointer.control.mouseLeft.capture, false)

  pointer.setMouseCapture(true)
  assert.equal(pointer.control.mouseLeft.capture, true)

  pointer.setMouseCapture(false)
  assert.equal(pointer.control.mouseLeft.capture, false)

  pointer.setMouseCapture(true, 'right')
  assert.equal(pointer.control.mouseRight.capture, true)

  pointer.setMouseCapture(false, 'right')
  assert.equal(pointer.control.mouseRight.capture, false)
})
