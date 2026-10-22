import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import { transform } from 'esbuild'

// Run the actual hint layout effect with a controlled frame clock and viewport.
const ui = fs.readFileSync(new URL('./CoreUI.js', import.meta.url), 'utf8')
const component = ui.slice(ui.indexOf('function ActionHint('), ui.indexOf('function getActionIcon('))
const { code } = await transform(component, { loader: 'jsx', jsxFactory: 'h' })
function mount(position, locked = false) {
  let now = 0, effect, cleanup, frameId = 0
  const frames = new Map(), refs = []
  const element = { style: {}, offsetWidth: 200, offsetHeight: 24 }
  const rect = { left: 10, top: 20, right: 1290, bottom: 740, width: 1280, height: 720 }
  const pointer = { locked, position: { x: 700, y: 300 } }
  const world = { controls: { pointer, viewport: { getBoundingClientRect: () => rect } } }
  const context = vm.createContext({
    performance: { now: () => now },
    window: { innerHeight: 760 },
    requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId },
    cancelAnimationFrame: id => frames.delete(id),
    useRef: initial => { const ref = { current: initial }; refs.push(ref); return ref },
    useLayoutEffect: fn => { effect = fn },
    css: () => '', h: () => null, getActionIcon: () => null,
  })
  vm.runInContext(code + '\nthis.mount = ActionHint', context)
  context.mount({ action: { position }, world })
  refs[0].current = element
  cleanup = effect()
  return { element, pointer, rect, frames, cleanup, advance(time) {
    now = time
    const callbacks = [...frames.values()]
    frames.clear()
    for (const fn of callbacks) fn()
  } }
}

test('pickup hints follow the pointer for 750ms then slide to the lower left and stay there', () => {
  for (const locked of [false, true]) {
    const hint = mount('bottom-left', locked)
    assert.equal(hint.element.style.visibility, 'visible')
    assert.equal(hint.element.style.left, locked ? '650px' : '710px')
    hint.advance(749)
    assert.equal(hint.element.style.transition, undefined)
    hint.advance(750)
    assert.equal(hint.element.style.transition, 'left 450ms ease-in-out, bottom 450ms ease-in-out, transform 450ms ease-in-out')
    assert.equal(hint.element.style.left, '32px')
    assert.equal(hint.element.style.bottom, '32px')
    assert.equal(hint.element.style.transform, 'translateX(0)')
    hint.pointer.position.x = 1000
    hint.advance(1200)
    assert.equal(hint.element.style.left, '32px')
    hint.rect.bottom = 600
    hint.advance(1300)
    assert.equal(hint.element.style.bottom, '32px', 'docked hint stays at the screen bottom when the viewport changes')
    hint.cleanup()
    assert.equal(hint.frames.size, 0, 'closing cancels pending animation work')
  }
})

test('ordinary click hints continue to follow the pointer without docking', () => {
  const hint = mount('pointer')
  hint.pointer.position.x = 1000
  hint.advance(1500)
  assert.equal(hint.element.style.left, '1010px')
  assert.equal(hint.element.style.transition, undefined)
  hint.cleanup()
})

test('pickup starts at the same position as the click hint and docks using the screen bottom edge', () => {
  const pickup = mount('bottom-left'), click = mount('pointer')
  assert.equal(pickup.element.style.bottom, click.element.style.bottom, 'both hints must start directly under the cursor')
  assert.equal(pickup.element.style.left, '710px')
  assert.equal(pickup.element.style.bottom, '402px')
  assert.equal(pickup.element.style.transform, 'translateX(-50%)')
  pickup.advance(750)
  assert.equal(pickup.element.style.bottom, '32px', 'anchor to the bottom edge, independent of text height')
  pickup.cleanup()
  click.cleanup()
})
