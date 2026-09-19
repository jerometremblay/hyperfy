/* global app, world */

const RECORDS_EVENT = 'recordsChanged'
const RESET_REQUEST_EVENT = 'resetClimb'
const RESET_WORLD_EVENT = 'spiralClimbReset'
const RECORDS_STORAGE_KEY = 'spiral-climb:records'
const LEGACY_RECORDS_STORAGE_KEY = 'spiral-climb:spiral-climb-prototype-instance:records'
const STEP_COUNT = 200

const BOARD_POSITION = [0, 2.15, -2.88]
const BOARD_STRUCTURE_POSITION = [0, 2.15, -3]
const BOARD_WIDTH = 440
const BOARD_HEIGHT = 640
const BOARD_PANEL_SIZE = [2.9, 4, 0.18]
const BOARD_POST_SIZE = [0.34, 4.4, 0.34]
const BOARD_POST_X = 1.55
const RESET_BUTTON_SIZE = [1.9, 0.75, 0.45]
const RESET_BUTTON_POSITION = [2.85, RESET_BUTTON_SIZE[1] / 2, BOARD_STRUCTURE_POSITION[2]]
const RESET_BUTTON_UI_POSITION = [
  RESET_BUTTON_POSITION[0],
  RESET_BUTTON_POSITION[1],
  BOARD_STRUCTURE_POSITION[2] + RESET_BUTTON_SIZE[2] / 2 + 0.03,
]
const RESET_ACTION_POSITION = [
  RESET_BUTTON_POSITION[0],
  RESET_BUTTON_SIZE[1],
  BOARD_STRUCTURE_POSITION[2] + RESET_BUTTON_SIZE[2] / 2 + 0.15,
]

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

let records = {}

if (world.isServer) {
  records = normalizeRecords(world.get(RECORDS_STORAGE_KEY))
  if (!Object.keys(records).length) {
    records = normalizeRecords(world.get(LEGACY_RECORDS_STORAGE_KEY))
  }

  app.state.records = records
  app.state.ready = true

  world.on(RECORDS_EVENT, data => {
    records = normalizeRecords(data?.records)
    app.state.records = records
    app.send(RECORDS_EVENT, { records })
  })

  app.on(RESET_REQUEST_EVENT, (_data, networkId) => {
    if (!networkId) return
    app.emit(RESET_WORLD_EVENT, { playerId: networkId })
  })

  app.send('init', { records })
}

const leaderboard = app.create('ui', {
  width: BOARD_WIDTH,
  height: BOARD_HEIGHT,
  size: 0.006,
  position: BOARD_POSITION,
  billboard: 'none',
  doubleside: true,
  pointerEvents: false,
  backgroundColor: 'rgba(8, 15, 31, 0.94)',
  borderWidth: 4,
  borderColor: '#38bdf8',
  borderRadius: 18,
  padding: 24,
  flexDirection: 'column',
  gap: 6,
})

const billboardPanel = app.create('prim', {
  type: 'box',
  size: BOARD_PANEL_SIZE,
  position: BOARD_STRUCTURE_POSITION,
  color: '#08111f',
  roughness: 0.9,
  physics: 'static',
  tag: 'spiral-climb-leaderboard-panel',
})

const leftPost = app.create('prim', {
  type: 'box',
  size: BOARD_POST_SIZE,
  position: [-BOARD_POST_X, BOARD_POST_SIZE[1] / 2, BOARD_STRUCTURE_POSITION[2]],
  color: '#334155',
  roughness: 0.85,
  physics: 'static',
  tag: 'spiral-climb-leaderboard-post-left',
})

const rightPost = app.create('prim', {
  type: 'box',
  size: BOARD_POST_SIZE,
  position: [BOARD_POST_X, BOARD_POST_SIZE[1] / 2, BOARD_STRUCTURE_POSITION[2]],
  color: '#334155',
  roughness: 0.85,
  physics: 'static',
  tag: 'spiral-climb-leaderboard-post-right',
})

const resetButton = app.create('prim', {
  type: 'box',
  size: RESET_BUTTON_SIZE,
  position: RESET_BUTTON_POSITION,
  color: '#dc2626',
  emissive: '#7f1d1d',
  emissiveIntensity: 0.35,
  roughness: 0.75,
  physics: 'static',
  tag: 'spiral-climb-leaderboard-reset-button',
})

const resetButtonLabel = app.create('ui', {
  width: 360,
  height: 120,
  size: 0.005,
  position: RESET_BUTTON_UI_POSITION,
  billboard: 'none',
  doubleside: true,
  pointerEvents: false,
  backgroundColor: 'rgba(0, 0, 0, 0)',
  tag: 'spiral-climb-leaderboard-reset-label',
})

const resetButtonText = app.create('uitext', {
  value: 'RESET',
  fontSize: 36,
  fontWeight: 'bold',
  color: '#ffffff',
  textAlign: 'center',
})

const resetAction = app.create('action', {
  label: 'Reset climb',
  distance: 3,
  duration: 0.35,
  position: RESET_ACTION_POSITION,
  onTrigger: () => {
    if (world.isClient) app.send(RESET_REQUEST_EVENT)
  },
})

app.add(billboardPanel)
app.add(leftPost)
app.add(rightPost)
app.add(resetButton)
resetButtonLabel.add(resetButtonText)
app.add(resetButtonLabel)
app.add(resetAction)

const title = app.create('uitext', {
  value: 'SPIRAL CLIMB RECORDS',
  fontSize: 27,
  fontWeight: 'bold',
  color: '#7dd3fc',
  textAlign: 'center',
  margin: [0, 0, 4, 0],
})

const subtitle = app.create('uitext', {
  value: 'BEST STAIR REACHED',
  fontSize: 13,
  color: 'rgba(255, 255, 255, 0.7)',
  textAlign: 'center',
  margin: [0, 0, 10, 0],
})

const recordsContainer = app.create('uiview', {
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 4,
  flexGrow: 1,
})

const emptyRecordsMessage = app.create('uitext', {
  value: 'No records yet',
  fontSize: 15,
  color: 'rgba(255, 255, 255, 0.75)',
  textAlign: 'center',
})

leaderboard.add(title)
leaderboard.add(subtitle)
leaderboard.add(recordsContainer)
recordsContainer.add(emptyRecordsMessage)
app.add(leaderboard)

const recordRows = []
let emptyRecordsMessageAttached = true

function renderRecords(nextRecords) {
  const entries = Object.values(normalizeRecords(nextRecords)).sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score
    return left.name.localeCompare(right.name)
  })

  if (entries.length && emptyRecordsMessageAttached) {
    recordsContainer.remove(emptyRecordsMessage)
    emptyRecordsMessageAttached = false
  } else if (!entries.length) {
    emptyRecordsMessage.value = 'No records yet'
    if (!emptyRecordsMessageAttached) {
      recordsContainer.add(emptyRecordsMessage)
      emptyRecordsMessageAttached = true
    }
  }

  while (recordRows.length < entries.length) {
    const row = app.create('uitext', {
      fontSize: 15,
      color: '#ffffff',
      textAlign: 'left',
    })

    recordsContainer.add(row)
    recordRows.push(row)
  }

  for (let index = 0; index < recordRows.length; index++) {
    const entry = entries[index]
    recordRows[index].value = entry ? `${index + 1}. ${entry.name} — stair ${entry.score}` : ''
  }
}

if (world.isClient) {
  app.on('init', data => {
    renderRecords(data?.records)
  })

  app.on(RECORDS_EVENT, data => {
    renderRecords(data?.records)
  })

  renderRecords(app.state?.ready ? app.state.records : {})
}
