import * as THREE from './three'

const DURATION = 0.18
const copy = value => JSON.parse(JSON.stringify(value))

function interpolate(from, to, t) {
  const vector = (a, b) => a.map((value, i) => value + (b[i] - value) * t)
  const rotation = (a, b) => new THREE.Quaternion().fromArray(a).slerp(new THREE.Quaternion().fromArray(b), t).toArray()
  const pose = {}
  for (const [name, target] of Object.entries(to.pose)) {
    const previous = from.pose[name] || target
    pose[name] = {}
    if (target.rotation) pose[name].rotation = rotation(previous.rotation || target.rotation, target.rotation)
    if (target.position) pose[name].position = vector(previous.position || target.position, target.position)
  }
  return { offset: vector(from.offset, to.offset), rotation: rotation(from.rotation, to.rotation), pose }
}

function render(avatar, value) {
  avatar.position.set(...value.offset)
  avatar.quaternion.set(...value.rotation)
  avatar.setPoseOverride(value.pose)
}

// The selected point identifies a free-sit session; a new seat starts without
// morphing from the previous seat. Retarget from the currently displayed pose.
export function setFreeSitBlend(player, avatar, value, target) {
  const key = JSON.stringify(target)
  const valueKey = JSON.stringify(value)
  const previous = player.freeSitBlend
  if (previous?.avatar === avatar && previous.key === key) {
    if (previous.valueKey === valueKey) return
    previous.from = copy(previous.current)
    previous.to = copy(value)
    previous.valueKey = valueKey
    previous.elapsed = 0
    return
  }
  const initial = copy(value)
  player.freeSitBlend = { avatar, key, valueKey, current: initial, from: initial, to: initial, elapsed: DURATION }
  render(avatar, initial)
}

export function updateFreeSitBlend(player, delta) {
  const blend = player.freeSitBlend
  if (!blend || blend.avatar !== player.avatar || blend.elapsed >= DURATION) return
  blend.elapsed = Math.min(DURATION, blend.elapsed + Math.max(0, delta))
  const t = blend.elapsed / DURATION
  blend.current = t >= 1 ? copy(blend.to) : interpolate(blend.from, blend.to, t * t * (3 - 2 * t))
  render(blend.avatar, blend.current)
}
