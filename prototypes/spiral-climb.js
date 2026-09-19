/* global app, world */

// A 200-step climb that starts at the app origin and spirals out to a 24m radius.
// Each plate is 2.4m across, rises 0.5m, and has a static physics body. The
// horizontal distance between adjacent plates grows with height, from 3.2m to
// 4.8m, so the separate invisible triggers become progressively harder to reach.
const STEP_COUNT = 200
const PLATE_RADIUS = 1.2
const PLATE_THICKNESS = 0.25
const OUTER_RADIUS = 24
const MIN_HORIZONTAL_STEP = 3.2
const MAX_HORIZONTAL_STEP = 4.8
const VERTICAL_STEP = 0.5
const TRIGGER_SIZE = 2.2
const TRIGGER_HEIGHT = 1.2
const PLATE_COLORS = ['#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc']
const SCORE_EVENT = 'stepReached'
const PROGRESS_EVENT = 'progressChanged'
const RECORDS_EVENT = 'recordsChanged'
const RESET_WORLD_EVENT = 'spiralClimbReset'
const SCORE_STORAGE_PREFIX = 'spiral-climb:score'
const RECORDS_STORAGE_KEY = 'spiral-climb:records'
const LEGACY_SCORE_STORAGE_PREFIX = `spiral-climb:${app.instanceId}:score`
const LEGACY_RECORDS_STORAGE_KEY = `spiral-climb:${app.instanceId}:records`

function validStep(value) {
  return Number.isInteger(value) && value >= 1 && value <= STEP_COUNT ? value : null
}

function playerScoreKey(playerId) {
  return `${SCORE_STORAGE_PREFIX}:${playerId}`
}

function legacyPlayerScoreKey(playerId) {
  return `${LEGACY_SCORE_STORAGE_PREFIX}:${playerId}`
}

function playerIdFor(player, fallbackId) {
  return player?.userId || player?.id || fallbackId
}

function validScore(value) {
  return Number.isInteger(value) && value >= 0 && value <= STEP_COUNT ? value : 0
}

function displayName(value) {
  if (typeof value !== 'string') return 'Anonymous'

  const name = value.replace(/\s+/g, ' ').trim().slice(0, 24)
  return name || 'Anonymous'
}

function normalizeRecords(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const normalized = {}
  for (const [playerId, record] of Object.entries(value)) {
  const score = validScore(record?.score ?? record?.lifeScore ?? record)
    if (score <= 0) continue

    normalized[playerId] = {
      name: displayName(record?.name),
      score,
    }
  }

  return normalized
}

function mergeRecords(...recordSets) {
  const merged = {}

  for (const recordSet of recordSets) {
    for (const [playerId, record] of Object.entries(recordSet)) {
      const current = merged[playerId]
      if (!current || record.score >= current.score) merged[playerId] = record
    }
  }

  return merged
}

function storedPlayerScore(playerId) {
  return Math.max(validScore(world.get(playerScoreKey(playerId))), validScore(world.get(legacyPlayerScoreKey(playerId))))
}

const currentHighestByPlayer = new Map()
let records = {}

function persistRecords() {
  world.set(RECORDS_STORAGE_KEY, records)
  app.state.records = records
}

function updatePlayerRecord(player, playerId, lifeScore) {
  const nextRecord = {
    name: displayName(player.name),
    score: lifeScore,
  }
  const currentRecord = records[playerId]
  const recordChanged = !currentRecord || currentRecord.name !== nextRecord.name || currentRecord.score !== nextRecord.score

  if (recordChanged) records[playerId] = nextRecord
  return recordChanged
}

function migratePlayerRecord(player) {
  if (!player) return false

  const playerId = playerIdFor(player)
  if (!playerId) return false

  const storedLifeScore = storedPlayerScore(playerId)
  const lifeScore = Math.max(storedLifeScore, validScore(records[playerId]?.score))
  if (lifeScore <= 0) return false

  return updatePlayerRecord(player, playerId, lifeScore)
}

function resetPlayer(player) {
  const playerId = playerIdFor(player)
  if (!playerId) return

  currentHighestByPlayer.delete(playerId)

  const lifeScore = Math.max(storedPlayerScore(playerId), validScore(records[playerId]?.score))
  const startPosition = typeof app.position?.clone === 'function' ? app.position.clone() : null
  if (startPosition && typeof player.teleport === 'function') {
    startPosition.y += PLATE_THICKNESS + 0.2
    player.teleport(startPosition)
  }

  app.send(PROGRESS_EVENT, {
    playerId,
    highestStep: 0,
    lifeScore,
    reset: true,
  })
}

if (world.isServer) {
  records = mergeRecords(
    normalizeRecords(world.get(LEGACY_RECORDS_STORAGE_KEY)),
    normalizeRecords(world.get(RECORDS_STORAGE_KEY))
  )
  app.state.records = records
  app.state.ready = true

  if (Object.keys(records).length) persistRecords()

  let recordsChanged = false
  if (typeof world.getPlayers === 'function') {
    for (const player of world.getPlayers()) {
      recordsChanged = migratePlayerRecord(player) || recordsChanged
    }
  }

  if (recordsChanged) persistRecords()

  if (Object.keys(records).length) {
    app.emit(RECORDS_EVENT, { records })
  }

  if (typeof world.on === 'function') {
    world.on(RESET_WORLD_EVENT, data => {
      const player = world.getPlayer(data?.playerId)
      if (player) resetPlayer(player)
    })

    world.on('enter', event => {
      const player = world.getPlayer(event?.playerId)
      if (!migratePlayerRecord(player)) return

      persistRecords()
      app.send(RECORDS_EVENT, { records })
      app.emit(RECORDS_EVENT, { records })
    })
  }

  app.on(SCORE_EVENT, (data, networkId) => {
    if (!networkId) return

    const step = validStep(data?.step)
    if (step === null) return

    const player = world.getPlayer(networkId)
    if (!player) return

    const playerId = playerIdFor(player, networkId)
    const currentHighest = currentHighestByPlayer.get(playerId) || 0
    if (step <= currentHighest) return

    currentHighestByPlayer.set(playerId, step)

    const scoreKey = playerScoreKey(playerId)
    const storedLifeScore = storedPlayerScore(playerId)
    const currentStableLifeScore = validScore(world.get(scoreKey))
    const previousLifeScore = Math.max(storedLifeScore, validScore(records[playerId]?.score))
    const lifeScore = Math.max(previousLifeScore, step)

    if (lifeScore > currentStableLifeScore) {
      world.set(scoreKey, lifeScore)
    }

    const recordChanged = updatePlayerRecord(player, playerId, lifeScore)
    if (recordChanged) persistRecords()

    if (lifeScore > previousLifeScore) {
      world.chat(
        {
          from: 'Spiral Climb',
          fromId: null,
          body: `${player.name || 'A climber'} reached stair ${step} — new life score!`,
          createdAt: world.getTimestamp(),
        },
        true
      )
    }

    app.send(PROGRESS_EVENT, {
      playerId,
      highestStep: step,
      lifeScore,
    })

    if (recordChanged) {
      app.send(RECORDS_EVENT, { records })
      app.emit(RECORDS_EVENT, { records })
    }
  })

  app.send('init', { records })
}

let localHighestStairReached = 0
let localLifeScore = 0

if (world.isClient) {
  app.on(PROGRESS_EVENT, data => {
    if (data?.playerId !== world.networkId) return
    // Keep the local copy available to future HUD/leaderboard UI.
    if (data.reset) {
      localHighestStairReached = 0
    } else {
      localHighestStairReached = Math.max(localHighestStairReached, validScore(data.highestStep))
    }
    localLifeScore = Math.max(localLifeScore, validScore(data.lifeScore))
  })
}

let angle = 0
for (let index = 0; index < STEP_COUNT; index++) {
  const progress = index === 0 ? 0 : (index - 1) / (STEP_COUNT - 2)
  const horizontalStep = MIN_HORIZONTAL_STEP + (MAX_HORIZONTAL_STEP - MIN_HORIZONTAL_STEP) * progress
  const radius = index === 0 ? 0 : MIN_HORIZONTAL_STEP + (OUTER_RADIUS - MIN_HORIZONTAL_STEP) * progress
  if (index > 1) {
    const previousRadius = MIN_HORIZONTAL_STEP + (OUTER_RADIUS - MIN_HORIZONTAL_STEP) * ((index - 2) / (STEP_COUNT - 2))
    const cosine = (previousRadius ** 2 + radius ** 2 - horizontalStep ** 2) / (2 * previousRadius * radius)
    angle += Math.acos(Math.min(1, Math.max(-1, cosine)))
  }
  const step = index + 1
  const plateTop = PLATE_THICKNESS + index * VERTICAL_STEP

  const plate = app.create('prim', {
    type: 'cylinder',
    size: [PLATE_RADIUS, PLATE_RADIUS, PLATE_THICKNESS],
    position: [Math.cos(angle) * radius, plateTop - PLATE_THICKNESS / 2, Math.sin(angle) * radius],
    color: PLATE_COLORS[index % PLATE_COLORS.length],
    roughness: 0.8,
    physics: 'static',
  })

  const trigger = app.create('prim', {
    type: 'box',
    size: [TRIGGER_SIZE, TRIGGER_HEIGHT, TRIGGER_SIZE],
    position: [Math.cos(angle) * radius, plateTop + TRIGGER_HEIGHT / 2, Math.sin(angle) * radius],
    opacity: 0,
    transparent: true,
    physics: 'static',
    trigger: true,
    tag: `spiral-climb-step-${step}`,
    onTriggerEnter: event => {
      if (!world.isClient || !event.isLocalPlayer) return
      app.send(SCORE_EVENT, { step })
    },
  })

  app.add(plate)
  app.add(trigger)
}
