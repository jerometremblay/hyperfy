import { sanitizeNormalizedPose } from './seatPose'
import { cloneHandTrackingPose } from './handTracking'
import { boundedArray, unitQuaternion } from './entityModifyPolicy'

// Same normalized bones and anatomical hand frames as the pose editor and XR.
// These poses affect the client renderer; gameplay state remains in the app.
export function sanitizeScriptedPose(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const bones = sanitizeNormalizedPose(input.bones || {})
  if (!bones) return null
  const hands = input.hands ? cloneHandTrackingPose(input.hands) : null
  if (input.hands && !hands) return null
  let root
  if (input.root !== undefined) {
    const position = boundedArray(input.root?.position, 3, 1e6)
    const quaternion = unitQuaternion(input.root?.quaternion)
    if (!position || !quaternion) return null
    root = { position, quaternion }
  }
  if (!Object.keys(bones).length && !hands && !root) return null
  for (const side of ['left', 'right']) {
    const hand = hands?.[side]
    if (input.hands?.[side] && !hand) return null
    if (!hand) continue
    if (hand.p.some(value => Math.abs(value) > 4)) return null
    for (const rotation of [hand.w, ...Object.values(hand.f)]) {
      if (rotation.some(value => Math.abs(value) > 1000)) return null
    }
    const pole = input.hands[side].pole
    if (pole !== undefined) {
      if (!Array.isArray(pole) || pole.length !== 3 || !pole.every(Number.isFinite)) return null
      const length = Math.hypot(...pole)
      if (length < 1e-6 || length > 1000) return null
      hand.pole = pole.map(value => value / length)
    }
  }
  return root ? { bones, hands, root } : { bones, hands }
}
