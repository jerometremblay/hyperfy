import * as THREE from './three'

// Publisher identities are minted by the server for an existing app instance.
export const SPEAKER_PREFIX = 'speaker:'

export function getSpeakerMix(distance, props = {}) {
  const level = Number(props.volume ?? 1)
  const volume = Number.isFinite(level) ? THREE.MathUtils.clamp(level, 0, 1) : 1
  if (props.spatial === false) return { stereo: volume, spatial: 0 }
  const near = THREE.MathUtils.clamp(Number(props.refDistance) || 2, 1, 20)
  const far = Math.max(near + 1, THREE.MathUtils.clamp(Number(props.maxDistance) || 30, 5, 100))
  const progress = THREE.MathUtils.clamp((distance - near) / (far - near), 0, 1)
  const directional = progress * progress * (3 - 2 * progress)
  const attenuated = volume * (1 - progress)
  return { stereo: attenuated * (1 - directional), spatial: attenuated * directional }
}

export class SpeakerAudio {
  constructor(world, entityId, track) {
    this.world = world
    this.entityId = entityId
    this.track = track
    this.position = new THREE.Vector3()
    this.orientation = new THREE.Vector3()
    this.quaternion = new THREE.Quaternion()
    this.gain = world.audio.ctx.createGain()
    this.gain.gain.value = 0
    this.stereoGain = world.audio.ctx.createGain()
    this.spatialGain = world.audio.ctx.createGain()
    this.stereoGain.gain.value = 0
    this.spatialGain.gain.value = 0
    this.panner = world.audio.ctx.createPanner()
    // Equal-power panning avoids phase coloration when blending the same music
    // with its direct stereo path. The distant path becomes a mono point source.
    this.panner.panningModel = 'equalpower'
    this.panner.channelCount = 1
    this.panner.channelCountMode = 'explicit'
    this.panner.distanceModel = 'linear'
    this.panner.refDistance = 1
    this.panner.maxDistance = 40
    // Both paths share the explicit Near/Far attenuation below.
    this.panner.rolloffFactor = 0
    this.panner.coneInnerAngle = 360
    this.panner.coneOuterAngle = 360
    this.lateUpdate(true)
    // Chrome needs the normal LiveKit playback attachment to start remote audio
    // playout. Mute the SDK's separate output; our spatial path handles playback.
    this.track.setAudioContext(world.audio.ctx)
    this.track.setVolume(0)
    this.playbackElement = this.track.attach()
    this.source = world.audio.ctx.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]))
    this.source.connect(this.gain)
    this.gain.connect(this.stereoGain)
    this.stereoGain.connect(world.audio.groupGains.music)
    this.gain.connect(this.panner)
    this.panner.connect(this.spatialGain)
    this.spatialGain.connect(world.audio.groupGains.music)
  }

  lateUpdate(immediate = false) {
    const entity = this.world.entities.get(this.entityId)
    const active =
      entity?.isApp && !entity.crashed && !entity.building && !entity.blueprint?.disabled && entity.root?.matrixWorld
    this.gain.gain.value = active && !this.track.isMuted ? 1 : 0
    if (!active) return
    this.position.setFromMatrixPosition(entity.root.matrixWorld)
    this.quaternion.setFromRotationMatrix(entity.root.matrixWorld)
    this.orientation.set(0, 0, -1).applyQuaternion(this.quaternion)
    const audio = this.world.audio
    const mix = getSpeakerMix(this.position.distanceTo(this.world.rig.position), entity.blueprint.props)
    for (const [name, value] of Object.entries(mix)) {
      if (this.mix?.[name] === value) continue
      const param = this[`${name}Gain`].gain
      if (immediate) param.setValueAtTime(value, audio.ctx.currentTime)
      else param.setTargetAtTime(value, audio.ctx.currentTime, 0.05)
    }
    this.mix = mix
    if (this.panner.positionX) {
      const method = immediate ? 'setValueAtTime' : 'linearRampToValueAtTime'
      const time = audio.ctx.currentTime + (immediate ? 0 : audio.lastDelta)
      for (const [name, value] of [
        ['positionX', this.position.x],
        ['positionY', this.position.y],
        ['positionZ', this.position.z],
        ['orientationX', this.orientation.x],
        ['orientationY', this.orientation.y],
        ['orientationZ', this.orientation.z],
      ]) {
        this.panner[name][method](value, time)
      }
    } else {
      this.panner.setPosition(this.position.x, this.position.y, this.position.z)
      this.panner.setOrientation(this.orientation.x, this.orientation.y, this.orientation.z)
    }
  }

  destroy() {
    this.track.detach(this.playbackElement)
    this.source.disconnect()
    this.gain.disconnect()
    this.stereoGain.disconnect()
    this.spatialGain.disconnect()
    this.panner.disconnect()
  }
}
