import { Quaternion } from 'three'

export const isRightArmEmote = url => typeof url === 'string' && /[?&]m=rightArm(?:&|$)/.test(url)

// Sample the retargeted Three.js tracks over the current locomotion pose.
// Restore that pose before the next mixer update, including when it is unchanged.
export function createRightArmEmote(clip, findBone) {
  const tracks = []
  for (const name of ['rightShoulder', 'rightUpperArm', 'rightLowerArm', 'rightHand']) {
    const bone = findBone(name)
    const track = bone && clip.tracks.find(track => track.name === `${bone.name}.quaternion`)
    if (track) tracks.push({ bone, sample: track.createInterpolant(), base: bone.quaternion.clone() })
  }
  const rotation = new Quaternion()
  let start = 0
  let offset = 0
  let speed = 1
  let stopped = null
  let applied = false
  return {
    play(clock, time = 0, rate = 1) {
      start = clock
      offset = time
      speed = rate
      stopped = null
    },
    stop(clock) {
      stopped = clock
    },
    restore() {
      if (!applied) return
      for (const { bone, base } of tracks) bone.quaternion.copy(base)
      applied = false
    },
    update(clock) {
      const time = Math.max(0, offset + (clock - start) * speed)
      const fadeOut = stopped === null ? (clip.duration - time) / 0.15 : 1 - (clock - stopped) / 0.15
      const weight = Math.max(0, Math.min(1, (clock - start) / 0.1, fadeOut))
      if (!weight) return time < clip.duration && stopped === null
      for (const { bone, sample, base } of tracks) {
        base.copy(bone.quaternion)
        rotation.fromArray(sample.evaluate(Math.min(time, clip.duration)))
        bone.quaternion.slerp(rotation, weight)
      }
      applied = true
      return true
    },
  }
}
