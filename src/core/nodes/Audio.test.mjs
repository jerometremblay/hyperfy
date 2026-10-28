import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./Audio.js', import.meta.url))],
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { Audio } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)

function setup({ legacy = false, spatial = true, locked = false } = {}) {
  const calls = [], panners = [], pending = []
  const param = name => ({ value: 0,
    setValueAtTime(value, at) { this.value = value; calls.push({ kind: 'set', name, value, at }) },
    linearRampToValueAtTime(value, at) { calls.push({ kind: 'ramp', name, value, at }) },
  })
  const audio = { ctx: { currentTime: 10,
    createBufferSource() {
      let started = false
      return { connect() {},
        stop() {
          if (!started) throw new DOMException('cannot call stop without calling start first', 'InvalidStateError')
          calls.push({ kind: 'stop' })
        },
        start() { started = true; calls.push({ kind: 'start', position: panners.at(-1)?.positionX?.value }) },
      }
    },
    createGain() { return { gain: {}, connect() {}, disconnect() {} } },
    createPanner() {
      const panner = { connect() {}, disconnect() {} }
      if (legacy) {
        panner.setPosition = (...value) => calls.push({ kind: 'position', value })
        panner.setOrientation = (...value) => calls.push({ kind: 'orientation', value })
      } else for (const name of ['positionX', 'positionY', 'positionZ', 'orientationX', 'orientationY', 'orientationZ'])
        panner[name] = param(name)
      panners.push(panner)
      return panner
    },
  }, lastDelta: 1 / 60, groupGains: { sfx: {} }, ready: fn => locked ? pending.push(fn) : fn() }
  const node = new Audio({ src: 'asset://impact.ogg', group: 'sfx', spatial, position: [120, 1, -30] })
  node.activate({ world: { audio, loader: { get: () => ({}) }, stage: { dirtyNodes: new Set() } } })
  return { node, calls, panners, audio, unlock() {
    locked = false
    while (pending.length) pending.pop()()
  } }
}

test('a spatial impact sets its complete position and orientation before starting, without ramps', async () => {
  const { node, calls } = setup()
  node.matrixWorld.makeRotationY(Math.PI / 2).setPosition(120, 1, -30)
  await node.play()
  assert.equal(calls.filter(c => c.kind === 'ramp').length, 0)
  const values = Object.fromEntries(calls.filter(c => c.kind === 'set').map(c => [c.name, c.value]))
  assert.deepEqual([values.positionX, values.positionY, values.positionZ], [120, 1, -30])
  assert.ok(Math.abs(values.orientationX + 1) < 1e-8)
  assert.ok(Math.abs(values.orientationY) < 1e-8 && Math.abs(values.orientationZ) < 1e-8)
  assert.equal(calls.at(-1).kind, 'start')
  assert.equal(calls.at(-1).position, 120)
  assert.ok(calls.filter(c => c.kind === 'set').every(c => c.at === 10))
})

test('later spatial movement remains smoothed, while a reused impact starts at its new position', async () => {
  const { node, calls } = setup()
  await node.play()
  calls.length = 0
  node.matrixWorld.makeTranslation(125, 2, -25)
  node.needsRebuild = false
  node.commit(true)
  assert.equal(calls.filter(c => c.kind === 'ramp').length, 6)
  assert.ok(calls.every(c => c.at === 10 + 1 / 60))
  node.stop()
  calls.length = 0
  await node.play()
  assert.equal(calls.filter(c => c.kind === 'ramp').length, 0)
  assert.equal(calls.at(-1).position, 125)
})

test('non-spatial playback bypasses the panner and legacy spatial playback sets coordinates directly', async () => {
  const flat = setup({ spatial: false })
  await flat.node.play()
  assert.equal(flat.panners.length, 0)
  const old = setup({ legacy: true })
  await old.node.play()
  assert.deepEqual(old.calls[0], { kind: 'position', value: [120, 1, -30] })
  assert.equal(old.calls.at(-1).kind, 'start')
})

test('a locked observer can expire and recycle impacts before interacting', async () => {
  const { node, calls, unlock } = setup({ locked: true })
  for (let i = 0; i < 30; i++) {
    await node.play()
    assert.doesNotThrow(() => node.stop(), 'expiry must cancel the pending source without stopping an unstarted Web Audio node')
    assert.equal(node.source, null)
    assert.equal(node.gainNode, null)
    assert.equal(node.pannerNode, null)
  }
  unlock()
  assert.equal(calls.filter(c => c.kind === 'start').length, 0, 'expired sounds must not replay on interaction')
  await node.play()
  assert.equal(calls.filter(c => c.kind === 'start').length, 1)
  node.stop()
  assert.equal(calls.filter(c => c.kind === 'stop').length, 1)
})

test('unmount and rebuild cancel locked playback; only the current source starts on unlock', async () => {
  const { node, calls, unlock } = setup({ locked: true })
  await node.play()
  assert.doesNotThrow(() => node.unmount())
  await node.play()
  node.commit(false)
  unlock()
  assert.equal(calls.filter(c => c.kind === 'start').length, 1)
  node.stop()
})

test('pausing before unlock preserves the requested offset and playback clock', async () => {
  const { node, calls, audio, unlock } = setup({ locked: true })
  node.currentTime = 0.2
  await node.play()
  audio.ctx.currentTime = 20
  assert.equal(node.currentTime, 0.2)
  assert.doesNotThrow(() => node.pause())
  assert.equal(node.currentTime, 0.2)
  await node.play()
  unlock()
  assert.equal(calls.filter(c => c.kind === 'start').length, 1)
  audio.ctx.currentTime = 20.1
  assert.ok(Math.abs(node.currentTime - 0.3) < 1e-8)
  node.pause()
  assert.ok(Math.abs(node.currentTime - 0.3) < 1e-8)
})
