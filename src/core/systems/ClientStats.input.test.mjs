import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { EventEmitter } from 'node:events'

globalThis.window = { matchMedia: () => ({ matches: false }) }
globalThis.document = {
  createElement: () => Object.assign(new EventTarget(), { style: {}, remove() {} }),
}
const bundle = await build({
  stdin: {
    contents: `export { ClientStats } from './ClientStats'; export { ClientControls } from './ClientControls'`,
    resolveDir: new URL('.', import.meta.url).pathname,
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { ClientStats, ClientControls } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

test('stats portal events preserve UI defaults without reaching world controls', () => {
  const world = new EventEmitter()
  world.prefs = new EventEmitter()
  const stats = new ClientStats(world)
  stats.init({ ui: {} })
  const controls = new ClientControls(world)
  let pointerChanges = 0
  controls.checkPointerChanges = () => pointerChanges++
  for (const [type, handler] of [
    ['pointerdown', controls.onPointerDown],
    ['pointermove', controls.onPointerMove],
    ['pointerup', controls.onPointerUp],
    ['wheel', controls.onScroll],
    ['touchstart', controls.onTouchStart],
    ['click', () => {}],
  ]) {
    const event = new Event(type, { cancelable: true })
    stats.container.dispatchEvent(event)
    handler(event)
    assert.equal(event.isCoreUI, true, type)
    assert.equal(event.defaultPrevented, false, type)
  }
  assert.equal(pointerChanges, 0)
  assert.equal(controls.scroll.delta, 0)
  assert.equal(controls.touches.size, 0)
  controls.onPointerDown(new Event('pointerdown'))
  assert.equal(pointerChanges, 1, 'world input outside the panel still works')
  stats.destroy()
  const event = new Event('pointerdown')
  stats.container.dispatchEvent(event)
  assert.equal(event.isCoreUI, undefined, 'destroy removes input listeners')
})
