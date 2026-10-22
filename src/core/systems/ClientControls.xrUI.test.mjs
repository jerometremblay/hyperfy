import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

globalThis.window = { matchMedia: () => ({ matches: false }) }

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./ClientControls.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { ClientControls } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

for (const hand of ['left', 'right']) {
  test(`XR sidebar captures the ${hand} trigger before world interactions and returns it on close`, () => {
    const controls = new ClientControls({
      graphics: { renderer: { xr: { getFrame: () => ({}), getReferenceSpace: () => ({}) } } },
      entities: {},
    })
    const button = { pressed: true, value: 1 }
    controls.xrSession = { inputSources: [{ handedness: hand, gamepad: { buttons: [button] } }] }
    const sidebar = controls.bind({ priority: 7 })
    const player = controls.bind({ priority: 0 })
    const key = hand === 'left' ? 'xrLeftTrigger' : 'xrRightTrigger'
    const sidebarTrigger = sidebar[key]
    const playerTrigger = player[key]
    controls.preFixedUpdate()
    assert.equal(playerTrigger.down, true)
    sidebarTrigger.capture = true
    controls.preFixedUpdate()
    assert.equal(sidebarTrigger.down, true)
    assert.equal(playerTrigger.down, false)
    assert.equal(playerTrigger.value, 0)
    assert.equal(playerTrigger.released, true)
    button.pressed = false
    button.value = 0
    controls.preFixedUpdate()
    sidebarTrigger.capture = false
    button.pressed = true
    button.value = 1
    controls.preFixedUpdate()
    assert.equal(playerTrigger.down, true)
    assert.equal(playerTrigger.value, 1)
  })
}

test('releasing an app control removes its pickup hint without removing another app hint', () => {
  const emitted = []
  const world = { emit: (event, data) => emitted.push([event, data]) }
  const controls = new ClientControls(world)
  const cue = controls.bind({ priority: 1 }), journal = controls.bind({ priority: 1 })
  cue.setActions([{ type: 'keyX', label: 'Put the cue away', position: 'bottom-left' }])
  journal.setActions([{ type: 'keyX', label: 'Put the journal away', position: 'bottom-left' }])
  assert.equal(controls.actions.length, 2)
  cue.release()
  assert.deepEqual(controls.actions.map(action => action.label), ['Put the journal away'])
  journal.release()
  assert.deepEqual(controls.actions, [])
  assert.equal(emitted.at(-1)[0], 'actions')
})
