import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./SpeakerAudio.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { SpeakerAudio, getSpeakerMix } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function setup(t, legacy = false) {
  t.mock.method(
    globalThis,
    'MediaStream',
    class {
      constructor(tracks) {
        this.tracks = tracks
      }
    }
  )
  const connections = []
  const parameters = {}
  const node = name => ({
    name,
    gain: {
      value: 0,
      setValueAtTime(value) {
        this.value = value
      },
      setTargetAtTime(value, time, constant) {
        this.value = value
        this.timeConstant = constant
      },
    },
    disconnected: false,
    connect(target) {
      connections.push([name, target.name])
    },
    disconnect() {
      this.disconnected = true
    },
  })
  const panner = node('panner')
  if (legacy) {
    panner.setPosition = (...values) => {
      parameters.position = values
    }
    panner.setOrientation = (...values) => {
      parameters.orientation = values
    }
  } else {
    for (const key of ['positionX', 'positionY', 'positionZ', 'orientationX', 'orientationY', 'orientationZ']) {
      panner[key] = {
        setValueAtTime(value) {
          parameters[key] = value
        },
        linearRampToValueAtTime(value) {
          parameters[key] = value
        },
      }
    }
  }
  const source = node('source')
  const gain = node('gain')
  const entity = {
    isApp: true,
    blueprint: { props: { refDistance: 9, maxDistance: 50 } },
    root: {
      matrixWorld: { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 12, 1, -4, 1] },
    },
  }
  const entities = new Map([['speaker', entity]])
  const playbackElement = {}
  const playback = { attached: false, context: null, volume: 1, detached: null }
  const track = {
    mediaStreamTrack: 'remote-track',
    isMuted: false,
    setAudioContext(context) {
      playback.context = context
    },
    setVolume(volume) {
      playback.volume = volume
    },
    attach() {
      assert.equal(playback.volume, 0, 'mute the SDK output before starting playback')
      playback.attached = true
      return playbackElement
    },
    detach(element) {
      playback.detached = element
      playback.attached = false
    },
  }
  const world = {
    rig: { position: { x: 12, y: 1, z: -4 } },
    entities: { get: id => entities.get(id) },
    audio: {
      lastDelta: 0.01,
      groupGains: { music: node('music') },
      ctx: {
        currentTime: 1,
        createGain: (() => {
          const gains = [gain, node('stereoGain'), node('spatialGain')]
          return () => gains.shift()
        })(),
        createPanner: () => panner,
        createMediaStreamSource: stream => {
          assert.deepEqual(stream.tracks, ['remote-track'])
          return source
        },
      },
    },
  }
  const speaker = new SpeakerAudio(world, 'speaker', track)
  return {
    speaker,
    connections,
    parameters,
    gain,
    entity,
    entities,
    source,
    panner,
    track,
    playback,
    playbackElement,
    world,
  }
}

// Node has no browser MediaStream; the mock is limited to this file's tests.
globalThis.MediaStream ??= class {}

test('speaker preserves stereo nearby and blends into one attenuated positional path', t => {
  const { speaker, connections, parameters, gain, panner } = setup(t)
  assert.deepEqual(connections, [
    ['source', 'gain'],
    ['gain', 'stereoGain'],
    ['stereoGain', 'music'],
    ['gain', 'panner'],
    ['panner', 'spatialGain'],
    ['spatialGain', 'music'],
  ])
  assert.equal(gain.gain.value, 1)
  assert.equal(speaker.stereoGain.gain.value, 1)
  assert.equal(speaker.spatialGain.gain.value, 0)
  assert.equal(panner.rolloffFactor, 0, 'do not apply distance attenuation twice')
  assert.equal(panner.panningModel, 'equalpower')
  assert.equal(panner.channelCount, 1)
  assert.deepEqual([parameters.positionX, parameters.positionY, parameters.positionZ], [12, 1, -4])
})

test('Near keeps full stereo; directional blend and volume change continuously until silence at Far', () => {
  const props = { refDistance: 9, maxDistance: 50 }
  assert.deepEqual(getSpeakerMix(0, props), { stereo: 1, spatial: 0 })
  assert.deepEqual(getSpeakerMix(9, props), { stereo: 1, spatial: 0 })
  assert.deepEqual(getSpeakerMix(29.5, props), { stereo: 0.25, spatial: 0.25 })
  assert.deepEqual(getSpeakerMix(50, props), { stereo: 0, spatial: 0 })
  assert.deepEqual(getSpeakerMix(100, props), { stereo: 0, spatial: 0 })
  let previousDirection = 0
  let previousVolume = 1
  for (let distance = 9.1; distance < 50; distance += 0.1) {
    const mix = getSpeakerMix(distance, props)
    const volume = mix.stereo + mix.spatial
    const direction = mix.spatial / volume
    assert.ok(volume <= previousVolume)
    assert.ok(direction >= previousDirection)
    assert.ok(direction - previousDirection < 0.004, 'no abrupt pan switch')
    previousDirection = direction
    previousVolume = volume
  }
})

test('jukebox defaults, invalid ranges, and unlocalized mode stay finite', () => {
  assert.deepEqual(getSpeakerMix(2), { stereo: 1, spatial: 0 })
  assert.deepEqual(getSpeakerMix(30), { stereo: 0, spatial: 0 })
  for (const props of [
    { refDistance: -2, maxDistance: -10 },
    { refDistance: 'bad', maxDistance: 'bad' },
    { refDistance: 20, maxDistance: 5 },
    { refDistance: Infinity, maxDistance: Infinity },
  ]) {
    const mix = getSpeakerMix(10, props)
    assert.ok(Number.isFinite(mix.stereo) && Number.isFinite(mix.spatial))
    assert.ok(mix.stereo >= 0 && mix.spatial >= 0)
    assert.ok(mix.stereo + mix.spatial <= 1)
  }
  assert.deepEqual(getSpeakerMix(500, { spatial: false }), { stereo: 1, spatial: 0 })
})

test('listener movement and edited ranges smoothly update the two paths', t => {
  const { speaker, world, entity } = setup(t)
  world.rig.position.x += 29.5
  speaker.lateUpdate()
  assert.equal(speaker.stereoGain.gain.value, 0.25)
  assert.equal(speaker.spatialGain.gain.value, 0.25)
  assert.equal(speaker.stereoGain.gain.timeConstant, 0.05)
  world.rig.position.x += 20.5
  speaker.lateUpdate()
  assert.equal(speaker.stereoGain.gain.value, 0)
  assert.equal(speaker.spatialGain.gain.value, 0)
  entity.blueprint.props.maxDistance = 100
  speaker.lateUpdate()
  assert.ok(speaker.spatialGain.gain.value > 0)
  entity.blueprint.props.spatial = false
  speaker.lateUpdate()
  assert.equal(speaker.stereoGain.gain.value, 1)
  assert.equal(speaker.spatialGain.gain.value, 0)
  entity.blueprint.props.volume = 0.4
  speaker.lateUpdate()
  assert.equal(speaker.stereoGain.gain.value, 0.4)
  assert.equal(speaker.stereoGain.gain.timeConstant, 0.05)
  entity.blueprint.props.volume = 0
  speaker.lateUpdate()
  assert.equal(speaker.stereoGain.gain.value, 0)
})

test('speaker volume scales stereo and directional sound, including unlocalized playback', () => {
  const props = { refDistance: 9, maxDistance: 50, volume: 0.4 }
  assert.deepEqual(getSpeakerMix(9, props), { stereo: 0.4, spatial: 0 })
  assert.deepEqual(getSpeakerMix(29.5, props), { stereo: 0.1, spatial: 0.1 })
  assert.deepEqual(getSpeakerMix(500, { ...props, spatial: false }), { stereo: 0.4, spatial: 0 })
  assert.deepEqual(getSpeakerMix(29.5, { ...props, volume: 0 }), { stereo: 0, spatial: 0 })
  assert.deepEqual(getSpeakerMix(0, { volume: 5 }), { stereo: 1, spatial: 0 })
  assert.deepEqual(getSpeakerMix(0, { volume: -1 }), { stereo: 0, spatial: 0 })
  assert.deepEqual(getSpeakerMix(0, { volume: 'bad' }), { stereo: 1, spatial: 0 })
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
  assert.ok(speaker.stereoGain.disconnected && speaker.spatialGain.disconnected)
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
