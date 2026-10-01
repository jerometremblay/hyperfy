import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

globalThis.window = { matchMedia: () => ({ matches: false }) }
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { maxTouchPoints: 0, platform: 'Linux' },
})

const actionBundle = await build({
  entryPoints: [fileURLToPath(new URL('./ClientActions.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { ClientActions, getActionPrompt } = await import(
  `data:text/javascript;base64,${Buffer.from(actionBundle.outputFiles[0].contents).toString('base64')}`
)

test('uses the live XR camera position when selecting a nearby action', () => {
  const world = {
    rig: { position: new THREE.Vector3(100, 1.5, 0) },
    camera: new THREE.Object3D(),
    xr: { session: {}, camera: new THREE.Object3D() },
    graphics: { worldToScreenFactor: 0.01 },
    stage: { scene: { add() {}, remove() {} } },
  }
  world.camera.position.set(0, 1.6, 0)
  world.camera.updateMatrixWorld(true)
  // The renderer updates its ArrayCamera during commit(), after ClientActions.update().
  world.xr.camera.position.set(100, 1.6, 0)
  world.xr.camera.updateMatrixWorld(true)

  const actions = new ClientActions(world)
  actions.action = { start() {}, update() {}, stop() {} }
  actions.control = {
    keyE: { down: false },
    touchB: { down: false },
    xrLeftTrigger: { down: false },
    xrRightTrigger: { down: false },
    xrLeftBtn1: { down: false },
    xrRightBtn1: { down: false },
  }
  const node = {
    finished: false,
    worldPos: new THREE.Vector3(0, 0, 0),
    _distance: 3,
    _label: 'Sit',
    _duration: 0.5,
    progress: 0,
  }
  actions.register(node)

  actions.update(1 / 60)

  assert.equal(actions.current.node, node)
})

test('accepts XR primary face buttons as action input', () => {
  const world = {
    rig: { position: new THREE.Vector3() },
    camera: new THREE.Object3D(),
    xr: { session: {}, camera: new THREE.Object3D() },
    graphics: { worldToScreenFactor: 0.01 },
    stage: { scene: { add() {}, remove() {} } },
  }
  world.xr.camera.updateMatrixWorld(true)

  const actions = new ClientActions(world)
  actions.action = { start() {}, update() {}, stop() {} }
  actions.control = {
    keyE: { down: false },
    touchB: { down: false },
    xrLeftTrigger: { down: false },
    xrRightTrigger: { down: false },
    xrLeftBtn1: { down: true },
    xrRightBtn1: { down: false },
  }

  actions.update(1 / 60)

  assert.equal(actions.btnDown, true)
})

test('does not treat the XR A button as action input', () => {
  const world = {
    rig: { position: new THREE.Vector3() },
    camera: new THREE.Object3D(),
    xr: { session: {}, camera: new THREE.Object3D() },
    graphics: { worldToScreenFactor: 0.01 },
    stage: { scene: { add() {}, remove() {} } },
  }
  world.xr.camera.updateMatrixWorld(true)

  const actions = new ClientActions(world)
  actions.action = { start() {}, update() {}, stop() {} }
  actions.control = {
    keyE: { down: false },
    touchB: { down: false },
    xrLeftTrigger: { down: false },
    xrRightTrigger: { down: false },
    xrLeftBtn1: { down: false },
    xrRightBtn1: { down: true },
  }

  actions.update(1 / 60)

  assert.equal(actions.btnDown, false)
})

test('labels only the XR X button for actions', () => {
  assert.equal(
    getActionPrompt({
      xr: { session: { inputSources: [{ handedness: 'left', gamepad: {} }] } },
    }),
    'X'
  )
  assert.equal(
    getActionPrompt({
      xr: {
        session: {
          inputSources: [
            { handedness: 'left', gamepad: {} },
            { handedness: 'right', gamepad: {} },
          ],
        },
      },
    }),
    'X'
  )
  assert.equal(
    getActionPrompt({
      xr: { session: { inputSources: [{ handedness: 'right', gamepad: {} }] } },
    }),
    null
  )
})
