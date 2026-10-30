import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./SpeakerAudio.js', import.meta.url))],
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { SpeakerAudio } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)

function setup(t, legacy = false) {
  t.mock.method(globalThis, 'MediaStream', class { constructor(tracks) { this.tracks = tracks } })
  const connections = []
  const parameters = {}
  const node = name => ({
    name, gain: { value: 0 }, disconnected: false,
    connect(target) { connections.push([name, target.name]) },
    disconnect() { this.disconnected = true },
  })
  const panner = node('panner')
  if (legacy) {
    panner.setPosition = (...values) => { parameters.position = values }
    panner.setOrientation = (...values) => { parameters.orientation = values }
  } else {
    for (const key of ['positionX', 'positionY', 'positionZ', 'orientationX', 'orientationY', 'orientationZ']) {
      panner[key] = {
        setValueAtTime(value) { parameters[key] = value },
        linearRampToValueAtTime(value) { parameters[key] = value },
      }
    }
  }
  const source = node('source')
  const gain = node('gain')
  const entity = {
    isApp: true, blueprint: {}, root: {
      matrixWorld: { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 12, 1, -4, 1] },
    },
  }
  const entities = new Map([['speaker', entity]])
  const playbackElement = {}
  const playback = { attached: false, context: null, volume: 1, detached: null }
  const track = {
    mediaStreamTrack: 'remote-track', isMuted: false,
    setAudioContext(context) { playback.context = context },
    setVolume(volume) { playback.volume = volume },
    attach() {
      assert.equal(playback.volume, 0, 'mute the SDK output before starting playback')
      playback.attached = true
      return playbackElement
    },
    detach(element) { playback.detached = element; playback.attached = false },
  }
  const world = {
    entities: { get: id => entities.get(id) },
    audio: {
      lastDelta: 0.01, groupGains: { music: node('music') },
      ctx: { currentTime: 1, createGain: () => gain, createPanner: () => panner,
        createMediaStreamSource: stream => { assert.deepEqual(stream.tracks, ['remote-track']); return source },
      },
    },
  }
  const speaker = new SpeakerAudio(world, 'speaker', track)
  return { speaker, connections, parameters, gain, entity, entities, source, panner, track,
    playback, playbackElement, world }
}

// Node has no browser MediaStream; the mock is limited to this file's tests.
globalThis.MediaStream ??= class {}

test('speaker audio has one path through spatial processing and the music group', t => {
  const { connections, parameters, gain } = setup(t)
  assert.deepEqual(connections, [['source', 'gain'], ['gain', 'panner'], ['panner', 'music']])
  assert.equal(gain.gain.value, 1)
  assert.deepEqual([parameters.positionX, parameters.positionY, parameters.positionZ], [12, 1, -4])
})

test('movement and rebuilt app roots update the source; disabled/deleted/muted speakers are silent', t => {
  const { speaker, entity, entities, gain, parameters, track } = setup(t)
  entity.root.matrixWorld.elements[12] = 20
  speaker.lateUpdate()
  assert.equal(parameters.positionX, 20)
  entity.blueprint.disabled = true
  speaker.lateUpdate()
  assert.equal(gain.gain.value, 0)
  entity.blueprint.disabled = false
  track.isMuted = true
  speaker.lateUpdate()
  assert.equal(gain.gain.value, 0)
  track.isMuted = false
  entities.delete('speaker')
  speaker.lateUpdate()
  assert.equal(gain.gain.value, 0)
})

test('legacy Web Audio positions work and unsubscribe releases every node', t => {
  const { speaker, parameters, source, gain, panner } = setup(t, true)
  assert.deepEqual(parameters.position, [12, 1, -4])
  speaker.destroy()
  assert.ok(source.disconnected && gain.disconnected && panner.disconnected)
})

test('speaker starts browser playout through a muted SDK attachment and detaches its own element', t => {
  const { speaker, playback, playbackElement, world } = setup(t)
  assert.equal(playback.attached, true)
  assert.equal(playback.context, world.audio.ctx)
  assert.equal(playback.volume, 0)
  speaker.destroy()
  assert.equal(playback.detached, playbackElement)
  assert.equal(playback.attached, false)
})
