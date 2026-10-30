import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const saved = new Map()
globalThis.window = {}
globalThis.localStorage = {
  getItem: key => saved.get(key),
  setItem: (key, value) => saved.set(key, value),
  removeItem: key => saved.delete(key),
}
const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./ClientAudio.js', import.meta.url))],
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { ClientAudio } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)

function setup(t) {
  saved.clear()
  const ctx = {
    state: 'running', destination: {},
    listener: { setPosition() {}, setOrientation() {} },
    createGain: () => ({ gain: {}, connect() {} }),
    async setSinkId(id) {
      if (id === 'missing') throw new Error('Device not available')
      this.sinkId = id
    },
  }
  t.mock.method(globalThis, 'AudioContext', class { constructor() { return ctx } })
  const world = { prefs: { music: 1, sfx: 1, voice: 1, on() {} } }
  return new ClientAudio(world)
}

globalThis.AudioContext ??= class {}

test('playback selection persists only after the browser accepts the physical device', async t => {
  const audio = setup(t)
  await audio.setOutputDevice('headphones')
  assert.equal(audio.ctx.sinkId, 'headphones')
  assert.equal(saved.get('audioOutputDevice'), '"headphones"')
  await assert.rejects(audio.setOutputDevice('missing'))
  assert.equal(audio.outputDevice, 'headphones')
  assert.equal(saved.get('audioOutputDevice'), '"headphones"')
})

test('device discovery closes its temporary capture and excludes loopback outputs', async t => {
  const audio = setup(t)
  let calls = 0
  let stopped = false
  const original = navigator.mediaDevices
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
    async enumerateDevices() {
      calls++
      return calls === 1 ? [{ kind: 'audiooutput', deviceId: 'default', label: '' }] : [
        { kind: 'audiooutput', deviceId: 'default', label: 'Default' },
        { kind: 'audiooutput', deviceId: 'loopback', label: 'Hyperfy Speaker' },
        { kind: 'audiooutput', deviceId: 'blackhole', label: 'BlackHole 2ch' },
        { kind: 'audiooutput', deviceId: 'headphones', label: 'Headphones' },
        { kind: 'audioinput', deviceId: 'microphone', label: 'Microphone' },
      ]
    },
    async getUserMedia() { return { getTracks: () => [{ stop() { stopped = true } }] } },
  } })
  t.after(() => Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: original }))
  const devices = await audio.getOutputDevices()
  assert.equal(stopped, true)
  assert.deepEqual(devices.map(device => device.deviceId), ['headphones'])
})
