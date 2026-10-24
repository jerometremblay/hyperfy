import { BALL_RADIUS as R } from './simulation.js'

// Short effects can overlap during a break. Sources stay at the impact position.
export function createSounds(app, sources) {
  const voices = []
  let volume = 1
  const play = (event, clock) => {
    const src = sources[event.type]
    if (!src) return
    let voice = voices.find(v => v.until <= clock)
    if (!voice && voices.length < 24) {
      const node = app.create('audio', { group: 'sfx', spatial: true, refDistance: 1, rolloffFactor: 1.5 })
      app.add(node)
      voice = { node, until: 0 }
      voices.push(voice)
    }
    if (!voice) return
    // Remount after positioning so the native panner starts at the new contact,
    // rather than the previous matrix waiting for the next scene commit.
    voice.node.active = false
    voice.node.src = src
    voice.node.position.set(event.position[0], R + event.position[2], -event.position[1])
    const gain = event.type === 'Cushion' ? 0.55 : event.type === 'Pot' ? 0.7 : 1
    voice.gain = gain * Math.min(1, Math.sqrt(event.strength / 5))
    voice.node.volume = voice.gain * volume
    voice.node.active = true
    voice.node.play()
    voice.until = clock + 0.5
  }
  return {
    play,
    setVolume(value) {
      volume = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 1
      for (const voice of voices) voice.node.volume = voice.gain * volume
    },
    update(clock) {
      for (const voice of voices) {
        if (voice.until && voice.until <= clock) { voice.node.stop(); voice.until = 0 }
      }
      return voices.some(voice => voice.until > clock)
    },
    clear() {
      for (const voice of voices) { voice.node.stop(); voice.until = 0 }
    },
  }
}
