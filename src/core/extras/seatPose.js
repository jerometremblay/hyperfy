export const SEAT_POSE_VERSION = 1

export function sanitizeSeatProfileId(input) {
  if (typeof input !== 'string') return null
  const profileId = input.trim()
  const hasControlCharacter = Array.from(profileId).some(character => {
    const code = character.codePointAt(0)
    return code <= 0x1f || code === 0x7f
  })
  if (!profileId || profileId.length > 128 || hasControlCharacter) return null
  return profileId
}

const SIDES = ['left', 'right']
const FINGERS = ['Thumb', 'Index', 'Middle', 'Ring', 'Little']
const FINGER_SEGMENTS = ['Metacarpal', 'Proximal', 'Intermediate', 'Distal']
const HUMAN_BONES = new Set(['hips', 'spine', 'chest', 'upperChest', 'neck', 'head', 'jaw', 'leftEye', 'rightEye'])

for (const side of SIDES) {
  for (const bone of ['Shoulder', 'UpperArm', 'LowerArm', 'Hand', 'UpperLeg', 'LowerLeg', 'Foot', 'Toes']) {
    HUMAN_BONES.add(`${side}${bone}`)
  }
  for (const finger of FINGERS) {
    for (const segment of FINGER_SEGMENTS) {
      HUMAN_BONES.add(`${side}${finger}${segment}`)
    }
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function finiteArray(value, length, maxAbs) {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every(item => Number.isFinite(item) && Math.abs(item) <= maxAbs)
  )
}

function sanitizeVector(value, maxAbs) {
  if (!finiteArray(value, 3, maxAbs)) return null
  return value.map(component => Number(component))
}

function sanitizeQuaternion(value) {
  if (!finiteArray(value, 4, 1000)) return null
  const length = Math.hypot(...value)
  if (length < 1e-6) return null
  return value.map(component => component / length)
}

export function sanitizeNormalizedPose(input) {
  if (!isRecord(input)) return null
  const entries = Object.entries(input)
  if (entries.length > HUMAN_BONES.size) return null

  const pose = {}
  for (const [name, transform] of entries) {
    if (!HUMAN_BONES.has(name) || !isRecord(transform)) return null
    const normalized = {}
    if (Object.hasOwn(transform, 'rotation')) {
      normalized.rotation = sanitizeQuaternion(transform.rotation)
      if (!normalized.rotation) return null
    }
    if (Object.hasOwn(transform, 'position')) {
      if (name !== 'hips') return null
      normalized.position = sanitizeVector(transform.position, 2)
      if (!normalized.position) return null
    }
    if (!Object.keys(normalized).length) return null
    pose[name] = normalized
  }
  return pose
}

export function sanitizeSeatPoseInput(input) {
  if (!isRecord(input)) return null
  if (typeof input.avatarUrl !== 'string' || input.avatarUrl.length < 1 || input.avatarUrl.length > 2048) return null
  const offset = sanitizeVector(input.offset, 2)
  const rotation = sanitizeQuaternion(input.rotation)
  const pose = sanitizeNormalizedPose(input.pose)
  if (!offset || !rotation || !pose) return null
  return { avatarUrl: input.avatarUrl, offset, rotation, pose }
}

export function sanitizeSeatPoseRecord(input) {
  if (!isRecord(input) || input.version !== SEAT_POSE_VERSION) return null
  if (typeof input.anchorId !== 'string' || input.anchorId.length < 1 || input.anchorId.length > 256) return null
  const hasProfileId = Object.hasOwn(input, 'profileId')
  const profileId = hasProfileId ? sanitizeSeatProfileId(input.profileId) : null
  if (hasProfileId && !profileId) return null
  const normalized = sanitizeSeatPoseInput(input)
  if (!normalized) return null
  return { version: SEAT_POSE_VERSION, anchorId: input.anchorId, ...(profileId ? { profileId } : {}), ...normalized }
}

export function getMatchingSeatPose(data, avatarUrl) {
  const record = sanitizeSeatPoseRecord(data?.seatPose)
  if (!record || record.anchorId !== data.effect?.anchorId || record.avatarUrl !== avatarUrl) return null
  return record
}

export function getStoredSeatPose(world, player) {
  const anchorId = player.data.effect?.anchorId
  if (!anchorId || !world.anchors?.get(anchorId)) return null
  const avatarUrl = player.data.sessionAvatar || player.data.avatar || 'asset://avatar.vrm'
  const userId = player.data.userId || player.data.id
  const key = seatPoseStorageKey(userId, avatarUrl, anchorId)
  const record = sanitizeSeatPoseRecord(world.storage?.get(key))
  if (record?.anchorId === anchorId && record.avatarUrl === avatarUrl) return record

  const profileId = sanitizeSeatProfileId(world.anchors.getProfileId?.(anchorId))
  if (!profileId) return null
  const profile = world.storage?.get(seatPoseProfileStorageKey(userId, avatarUrl, profileId))
  if (!isRecord(profile) || profile.version !== SEAT_POSE_VERSION || profile.profileId !== profileId) return null
  const normalized = sanitizeSeatPoseInput(profile)
  if (!normalized || normalized.avatarUrl !== avatarUrl) return null
  return { version: SEAT_POSE_VERSION, anchorId, profileId, ...normalized }
}

export function sanitizePoseStyleName(input) {
  if (typeof input !== 'string') return null
  const name = input.trim()
  const hasControlCharacter = Array.from(name).some(character => {
    const code = character.codePointAt(0)
    return code <= 0x1f || code === 0x7f
  })
  if (!name || name.length > 32 || hasControlCharacter) return null
  return name
}

export function sanitizePoseStyles(input) {
  if (!Array.isArray(input) || input.length > 20) return null
  const styles = []
  const names = new Set()
  for (const item of input) {
    if (!isRecord(item)) return null
    const name = sanitizePoseStyleName(item.name)
    const pose = sanitizeNormalizedPose(item.pose)
    const key = name?.toLocaleLowerCase('en')
    if (!name || !pose || names.has(key)) return null
    names.add(key)
    styles.push({ name, pose })
  }
  return styles
}

export function seatPoseStorageKey(userId, avatarUrl, anchorId) {
  return `seatPose:${encodeURIComponent(String(userId))}:${encodeURIComponent(String(avatarUrl))}:${encodeURIComponent(String(anchorId))}`
}

export function seatPoseProfileStorageKey(userId, avatarUrl, profileId) {
  return `seatPoseProfile:${encodeURIComponent(String(userId))}:${encodeURIComponent(String(avatarUrl))}:${encodeURIComponent(String(profileId))}`
}

export function seatPoseStylesStorageKey(userId) {
  return `seatPoseStyles:${encodeURIComponent(String(userId))}`
}
