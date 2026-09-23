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

const DEFAULT_SITTING_POSE = {
  hips: {
    rotation: [-0.013890632255055371, 0.026158481901196722, -0.002337336235813372, 0.9995585630764714],
    position: [0, -0.77, 0],
  },
  spine: {
    rotation: [0.028213875775333446, -0.006640460336598644, 0.001633149044301738, 0.9995785183388302],
  },
  chest: {
    rotation: [-0.00783688570955307, -0.015269712242523563, -0.004802751248403456, 0.9998411637309459],
  },
  upperChest: {
    rotation: [-0.0070351777432304296, -0.01546466585424033, -0.004707579397118226, 0.9998445824628734],
  },
  neck: {
    rotation: [-0.008459260704221813, -0.004029407659400441, -0.017557804377044687, 0.9998019445308705],
  },
  head: {
    rotation: [0.011307979315425045, 0.01294510443633399, 0.031120439056191405, 0.999367836258444],
  },
  leftEye: {
    rotation: [0, 0, 0, 1],
  },
  rightEye: {
    rotation: [0, 0, 0, 1],
  },
  leftUpperLeg: {
    rotation: [0.7071067811865475, 0, 0, 0.7071067811865475],
  },
  leftLowerLeg: {
    rotation: [-0.7071067811865475, 0, 0, 0.7071067811865475],
  },
  leftFoot: {
    rotation: [0, 0, 0, 1],
  },
  leftToes: {
    rotation: [7.069700491823777e-9, -5.381922469960702e-9, 6.261266608636351e-9, 1],
  },
  rightUpperLeg: {
    rotation: [0.7071067811865475, 0, 0, 0.7071067811865475],
  },
  rightLowerLeg: {
    rotation: [-0.7071067811865475, 0, 0, 0.7071067811865475],
  },
  rightFoot: {
    rotation: [0, 0, 0, 1],
  },
  rightToes: {
    rotation: [5.295237369002806e-8, -2.3077291107187657e-8, -2.6332235232893918e-9, 0.9999999999999984],
  },
  leftShoulder: {
    rotation: [0.045375284502448376, 0.033310704783447755, -0.0385849927405227, -0.9976686217569267],
  },
  leftUpperArm: {
    rotation: [-0.14376360273130673, -0.3254843180887511, 0.45124316331828057, 0.8183957433702397],
  },
  leftLowerArm: {
    rotation: [-0.020836362122999854, -0.5039391169062016, -0.05029672410889345, 0.8620217236295098],
  },
  leftHand: {
    rotation: [0.016335353951962527, -0.00432540866774787, -0.09709391918625473, 0.9951317590692069],
  },
  rightShoulder: {
    rotation: [-0.10284228989719693, 0.0916474289696811, -0.038597355363491945, 0.9897143306686493],
  },
  rightUpperArm: {
    rotation: [-0.14376360273130664, 0.3254843180887511, -0.45124316331828046, 0.8183957433702399],
  },
  rightLowerArm: {
    rotation: [-0.020836362122999896, 0.5039391169062013, 0.05029672410889346, 0.8620217236295099],
  },
  rightHand: {
    rotation: [0.07598527794479082, -0.04932372785742146, 0.0831209617891404, 0.9924133781429733],
  },
  leftThumbMetacarpal: {
    rotation: [0, 0, 0, 1],
  },
  leftThumbProximal: {
    rotation: [-0.057691742330498445, 0.10622499508253963, -0.03511948154591231, 0.9920456316634494],
  },
  leftThumbDistal: {
    rotation: [-0.024184610905308473, 0.269129564632585, -0.03583913215950059, 0.9621330150463021],
  },
  leftIndexProximal: {
    rotation: [0.015761868924759684, 0.015740830301012552, -0.10127894618660564, -0.9946086490719674],
  },
  leftIndexIntermediate: {
    rotation: [-0.0008466356798131718, 0.00028763624072976996, -0.14753982412698502, -0.9890557116613792],
  },
  leftIndexDistal: {
    rotation: [-0.002529931080622987, 0.001532624352557731, -0.1323835793309387, -0.9911941477000611],
  },
  leftMiddleProximal: {
    rotation: [0.003308741372890229, -0.014043823430934051, 0.3100202815177562, 0.9506204543884058],
  },
  leftMiddleIntermediate: {
    rotation: [-0.005942512197188051, 0.00349700141189007, -0.20781079053602877, -0.9781447402438467],
  },
  leftMiddleDistal: {
    rotation: [-0.003522166445582633, 0.0030915724310033497, -0.045084978048996735, -0.9989721624138257],
  },
  leftRingProximal: {
    rotation: [0.016709853934282252, -0.015153789455980707, 0.4059152188020831, 0.9136322994462684],
  },
  leftRingIntermediate: {
    rotation: [0.0032360541203109577, -0.0020863053216486544, 0.1337191226450086, 0.9910117918182832],
  },
  leftRingDistal: {
    rotation: [0.0024700578428745075, -0.0030062749840128232, 0.19880660533628491, 0.9800310172640638],
  },
  leftLittleProximal: {
    rotation: [0.03008375125009062, -0.07040878348965414, 0.41905209490854456, 0.9047280878092545],
  },
  leftLittleIntermediate: {
    rotation: [0.0036792221422189417, -0.0027376325856493565, 0.22065876225435818, 0.975340288992836],
  },
  leftLittleDistal: {
    rotation: [0.002433435485205275, -0.0039061493696588975, 0.1725620444731312, 0.98498789900998],
  },
  rightThumbMetacarpal: {
    rotation: [0, 0, 0, 1],
  },
  rightThumbProximal: {
    rotation: [-0.058781428480920175, -0.10561682616022344, 0.03504826115978535, 0.9920491162675662],
  },
  rightThumbDistal: {
    rotation: [-0.0276679680612792, -0.16812639152895134, 0.03422405162656495, 0.9847825720965396],
  },
  rightIndexProximal: {
    rotation: [-0.015569654838433096, 0.015930096214520916, -0.09916526036184932, 0.994821626735253],
  },
  rightIndexIntermediate: {
    rotation: [-0.0008806398553133265, -0.00019406117963661985, 0.18567582415634998, -0.9826106426950422],
  },
  rightIndexDistal: {
    rotation: [-0.0024286139895204942, -0.0015860100055918036, 0.1518302310712868, -0.988402330703035],
  },
  rightMiddleProximal: {
    rotation: [0.004493481121216512, 0.013712787659632826, -0.23761349354481115, 0.9712525911252156],
  },
  rightMiddleIntermediate: {
    rotation: [-0.006151855498180714, -0.0032205924997507993, 0.30963906738247365, -0.9508288123570888],
  },
  rightMiddleDistal: {
    rotation: [0.0033677899638572266, 0.003196562261230336, -0.045052446901663705, 0.9989738319939329],
  },
  rightRingProximal: {
    rotation: [0.0173200373228098, 0.014446569144037783, -0.3767658726406416, 0.9260339033536724],
  },
  rightRingIntermediate: {
    rotation: [0.0031643039419134047, 0.0018565885116103612, -0.1815894640185942, 0.9833675847907035],
  },
  rightRingDistal: {
    rotation: [0.0023950908619754293, 0.002904396528245234, -0.19783869299919757, 0.980227361163184],
  },
  rightLittleProximal: {
    rotation: [0.03484580980713148, 0.06828520421254655, -0.366259313795749, 0.9273494570454026],
  },
  rightLittleIntermediate: {
    rotation: [0.0037742257711873193, 0.0023757750971311817, -0.2963145114073948, 0.9550800077699843],
  },
  rightLittleDistal: {
    rotation: [0.002168902020626087, 0.003912120907507771, -0.1902195042937499, 0.9817313947105236],
  },
}

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

export function getDefaultSittingPose() {
  return Object.fromEntries(
    Object.entries(DEFAULT_SITTING_POSE).map(([name, transform]) => [
      name,
      {
        ...(transform.position ? { position: transform.position.slice() } : {}),
        ...(transform.rotation ? { rotation: transform.rotation.slice() } : {}),
      },
    ])
  )
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
