import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

globalThis.window = { matchMedia: () => ({ matches: false }) }
globalThis.document = { activeElement: { tagName: 'BODY' } }

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

function keyboard(repeat = false) {
  const event = new Event('keydown', { cancelable: true })
  Object.assign(event, { code: 'Space', key: ' ', repeat })
  return event
}

test('a captured Space hold consumes browser defaults through the shot-control handoff', () => {
  const controls = new ClientControls({ emit() {} })
  const player = controls.bind({ priority: 0 })
  const aim = controls.bind({ priority: 1 })
  let followThrough,
    presses = 0,
    releases = 0,
    jumps = 0
  const page = new EventTarget()
  let pageKeydowns = 0
  page.addEventListener('keydown', controls.onKeyDown)
  page.addEventListener('keydown', () => pageKeydowns++)
  player.space.onPress = () => jumps++
  aim.space.capture = true
  aim.space.onPress = () => {
    presses++
    aim.release()
    followThrough = controls.bind({ priority: 1 })
    followThrough.space.capture = true
    followThrough.space.onRelease = () => releases++
  }
  const press = keyboard()
  page.dispatchEvent(press)
  assert.equal(press.defaultPrevented, true, 'the shot press must consume the browser action')
  for (let i = 0; i < 60; i++) {
    const repeat = keyboard(true)
    page.dispatchEvent(repeat)
    assert.equal(repeat.defaultPrevented, true, 'holding Space must keep consuming the browser action')
    assert.equal(followThrough.space.down, true)
  }
  assert.equal(presses, 1)
  assert.equal(jumps, 0)
  assert.equal(pageKeydowns, 0, 'captured holds must not reach other page keyboard handlers')
  controls.onKeyUp(keyboard())
  assert.equal(followThrough.space.down, false)
  assert.equal(releases, 1)
})

test('uncaptured keyboard input and typing keep their browser defaults', () => {
  const controls = new ClientControls({})
  const player = controls.bind({ priority: 0 })
  let presses = 0
  player.space.onPress = () => presses++
  const uncaptured = keyboard()
  controls.onKeyDown(uncaptured)
  assert.equal(uncaptured.defaultPrevented, false)
  assert.equal(presses, 1)
  player.space.capture = true
  for (const tagName of ['INPUT', 'TEXTAREA']) {
    document.activeElement = { tagName }
    const typing = keyboard()
    controls.onKeyDown(typing)
    assert.equal(typing.defaultPrevented, false)
    assert.equal(presses, 1)
  }
  document.activeElement = { tagName: 'BODY' }
})
