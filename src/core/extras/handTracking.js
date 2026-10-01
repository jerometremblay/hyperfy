export const XR_HAND_JOINTS = [
  'wrist',
  'thumb-metacarpal',
  'thumb-phalanx-proximal',
  'thumb-phalanx-distal',
  'thumb-tip',
  'index-finger-metacarpal',
  'index-finger-phalanx-proximal',
  'index-finger-phalanx-intermediate',
  'index-finger-phalanx-distal',
  'index-finger-tip',
  'middle-finger-metacarpal',
  'middle-finger-phalanx-proximal',
  'middle-finger-phalanx-intermediate',
  'middle-finger-phalanx-distal',
  'middle-finger-tip',
  'ring-finger-metacarpal',
  'ring-finger-phalanx-proximal',
  'ring-finger-phalanx-intermediate',
  'ring-finger-phalanx-distal',
  'ring-finger-tip',
  'pinky-finger-metacarpal',
  'pinky-finger-phalanx-proximal',
  'pinky-finger-phalanx-intermediate',
  'pinky-finger-phalanx-distal',
  'pinky-finger-tip',
]

// VRM has no tip or non-thumb metacarpal bones. Orientations are absolute in
// avatar-scene space; each avatar converts them through its own raw hierarchy.
export const XR_HAND_BONES = [
  { joint: 'thumb-metacarpal', parent: 'wrist', child: 'thumb-phalanx-proximal', bone: 'ThumbMetacarpal' },
  { joint: 'thumb-phalanx-proximal', parent: 'thumb-metacarpal', child: 'thumb-phalanx-distal', bone: 'ThumbProximal' },
  { joint: 'thumb-phalanx-distal', parent: 'thumb-phalanx-proximal', child: 'thumb-tip', bone: 'ThumbDistal' },
  {
    joint: 'index-finger-phalanx-proximal',
    parent: 'index-finger-metacarpal',
    child: 'index-finger-phalanx-intermediate',
    bone: 'IndexProximal',
  },
  {
    joint: 'index-finger-phalanx-intermediate',
    parent: 'index-finger-phalanx-proximal',
    child: 'index-finger-phalanx-distal',
    bone: 'IndexIntermediate',
  },
  {
    joint: 'index-finger-phalanx-distal',
    parent: 'index-finger-phalanx-intermediate',
    child: 'index-finger-tip',
    bone: 'IndexDistal',
  },
  {
    joint: 'middle-finger-phalanx-proximal',
    parent: 'middle-finger-metacarpal',
    child: 'middle-finger-phalanx-intermediate',
    bone: 'MiddleProximal',
  },
  {
    joint: 'middle-finger-phalanx-intermediate',
    parent: 'middle-finger-phalanx-proximal',
    child: 'middle-finger-phalanx-distal',
    bone: 'MiddleIntermediate',
  },
  {
    joint: 'middle-finger-phalanx-distal',
    parent: 'middle-finger-phalanx-intermediate',
    child: 'middle-finger-tip',
    bone: 'MiddleDistal',
  },
  {
    joint: 'ring-finger-phalanx-proximal',
    parent: 'ring-finger-metacarpal',
    child: 'ring-finger-phalanx-intermediate',
    bone: 'RingProximal',
  },
  {
    joint: 'ring-finger-phalanx-intermediate',
    parent: 'ring-finger-phalanx-proximal',
    child: 'ring-finger-phalanx-distal',
    bone: 'RingIntermediate',
  },
  {
    joint: 'ring-finger-phalanx-distal',
    parent: 'ring-finger-phalanx-intermediate',
    child: 'ring-finger-tip',
    bone: 'RingDistal',
  },
  {
    joint: 'pinky-finger-phalanx-proximal',
    parent: 'pinky-finger-metacarpal',
    child: 'pinky-finger-phalanx-intermediate',
    bone: 'LittleProximal',
  },
  {
    joint: 'pinky-finger-phalanx-intermediate',
    parent: 'pinky-finger-phalanx-proximal',
    child: 'pinky-finger-phalanx-distal',
    bone: 'LittleIntermediate',
  },
  {
    joint: 'pinky-finger-phalanx-distal',
    parent: 'pinky-finger-phalanx-intermediate',
    child: 'pinky-finger-tip',
    bone: 'LittleDistal',
  },
]

const HAND_BONE_NAMES = new Set(XR_HAND_BONES.map(item => item.bone))

function isFiniteArray(value, length) {
  return Array.isArray(value) && value.length >= length && value.slice(0, length).every(Number.isFinite)
}

export function cloneHandTrackingPose(pose) {
  if (!pose) return null
  const clone = {}
  for (const side of ['left', 'right']) {
    const hand = pose[side]
    if (!hand) continue
    if (!isFiniteArray(hand.p, 3)) continue
    if (hand.kind !== 'hand' && hand.kind !== 'controller') continue
    if (!isFiniteArray(hand.w, 4) || Math.hypot(...hand.w.slice(0, 4)) < 0.000001) continue
    clone[side] = {
      kind: hand.kind,
      p: hand.p.slice(0, 3),
      w: hand.w.slice(0, 4),
      f: {},
    }
    for (const [bone, rotation] of Object.entries(hand.f || {})) {
      if (HAND_BONE_NAMES.has(bone) && isFiniteArray(rotation, 4) && Math.hypot(...rotation.slice(0, 4)) >= 0.000001) {
        clone[side].f[bone] = rotation.slice(0, 4)
      }
    }
  }
  return Object.keys(clone).length ? clone : null
}
