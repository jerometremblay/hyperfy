import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./Audio.js', import.meta.url))],
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { Audio } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)

function setup({ legacy = false, spatial = true } = {}) {
  const calls = [], panners = []
  const param = name => ({ value: 0,
    setValueAtTime(value, at) { this.value = value; calls.push({ kind: 'set', name, value, at }) },
    linearRampToValueAtTime(value, at) { calls.push({ kind: 'ramp', name, value, at }) },
  })
  const audio = { ctx: { currentTime: 10,
    createBufferSource() { return { connect() {}, stop() {},
      start() { calls.push({ kind: 'start', position: panners.at(-1)?.positionX?.value }) },
    } },
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
  }, lastDelta: 1 / 60, groupGains: { sfx: {} }, ready: fn => fn() }
  const node = new Audio({ src: 'asset://impact.ogg', group: 'sfx', spatial, position: [120, 1, -30] })
  node.activate({ world: { audio, loader: { get: () => ({}) }, stage: { dirtyNodes: new Set() } } })
  return { node, calls, panners, audio }
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
