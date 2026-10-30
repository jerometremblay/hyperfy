import * as THREE from './three'

// Publisher identities are minted by the server for an existing app instance.
export const SPEAKER_PREFIX = 'speaker:'

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
    this.panner = world.audio.ctx.createPanner()
    this.panner.panningModel = 'HRTF'
    this.panner.distanceModel = 'linear'
    this.panner.refDistance = 1
    this.panner.maxDistance = 40
    this.panner.rolloffFactor = 1
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
    this.gain.connect(this.panner)
    this.panner.connect(world.audio.groupGains.music)
  }

  lateUpdate(immediate = false) {
    const entity = this.world.entities.get(this.entityId)
    const active = entity?.isApp && !entity.crashed && !entity.building && !entity.blueprint?.disabled
    this.gain.gain.value = active && !this.track.isMuted ? 1 : 0
    if (!active || !entity.root?.matrixWorld) return
    this.position.setFromMatrixPosition(entity.root.matrixWorld)
    this.quaternion.setFromRotationMatrix(entity.root.matrixWorld)
    this.orientation.set(0, 0, -1).applyQuaternion(this.quaternion)
    const audio = this.world.audio
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
    this.panner.disconnect()
  }
}
