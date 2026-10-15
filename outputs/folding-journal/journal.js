/* global app, world */
// Coordinate convention: Y up, +X right, -Z forward.
// The closed back surface is local Y=0, centered on the placement origin.
// The left cover opens around the spine; printed surfaces have explicit depth gaps.

const NEWS_URL = 'https://hyperfy-news.jerometremblay.chatgpt.site/'
const PI = Math.PI
const PAGE_COUNT = 6
const PAGE_HEIGHT = 0.01
const LEFT_HINGE_HEIGHT = 0.04
const TURN_HINGE_HEIGHT = PAGE_HEIGHT + 0.002

function group(parent, position = [0, 0, 0]) {
  const node = app.create('group', { position })
  parent.add(node)
  return node
}

function box(parent, size, position, color, extra = {}) {
  const node = app.create('prim', {
    type: 'box',
    size,
    position,
    color,
    roughness: 1,
    metalness: 0,
    physics: null,
    castShadow: true,
    receiveShadow: true,
    ...extra,
  })
  parent.add(node)
  return node
}

function text(parent, value, fontSize, color, fontWeight = 'normal') {
  const node = app.create('uitext', {
    value,
    fontSize,
    color,
    fontWeight,
    fontFamily: 'Georgia',
    lineHeight: 1.12,
    textAlign: 'left',
  })
  parent.add(node)
  return node
}

// Place the root at the center of the closed back surface (local Y=0).
// The page layout retains its own spine coordinates inside this fixed frame.
const journalBody = group(app, [-0.31, 0.012, 0])

// Printed outside cover of the folded newspaper.
const folded = group(journalBody)
const frontCover = box(folded, [0.62, 0.004, 0.84], [0, 0, 0], '#fff9ec')

// Printed folded cover. World-space UI is only decorative: reading uses the iframe.
function makeCoverPrint(parent, position, rotation) {
  const cover = app.create('ui', {
    space: 'world',
    width: 580,
    height: 800,
    size: 0.001,
    position,
    rotation,
    backgroundColor: 'rgba(255,255,255,0)',
    pointerEvents: false,
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 9,
    gap: 7,
    lit: false,
  })
  parent.add(cover)
  text(cover, 'HYPERFY', 44, '#1f2730', 'bold')
  text(cover, 'NEWS  •  WORLD EDITION', 17, '#a22a2e', 'bold')
  text(cover, 'THE WORLDS\nARE CONNECTED', 27, '#20252a', 'bold')
  text(cover, 'A new doorway to everything\nhappening across Hyperfy.', 15, '#52514e')
  text(cover, '─────────────────', 15, '#b49e76')
  text(cover, 'TECHNOLOGY   CULTURE   WORLDS', 12, '#4b514f', 'bold')
  text(cover, 'OPEN TO READ THE LIVE EDITION', 13, '#a22a2e', 'bold')

  return cover
}
const cover = makeCoverPrint(folded, [0, 0.004, 0], [-PI / 2, 0, 0])

// Two full-sized newspaper pages, 0.62 m × 0.84 m each.
const opened = group(journalBody)
opened.active = false
const left = group(opened)
const right = group(opened)
const leftLeaf = group(left, [-0.31, 0, 0])
const rightLeaf = group(right, [0.31, 0, 0])
// Both leaves pivot at the center crease instead of changing width.
leftLeaf.rotation.z = 0
rightLeaf.rotation.z = 0
// The printed cover is the outside of the left leaf. It follows the hinge.
folded.position.set(-0.31, -0.008, 0)
folded.rotation.z = PI
left.add(folded)
box(leftLeaf, [0.62, 0.008, 0.84], [0, 0, 0], '#f5efdd')
box(leftLeaf, [0.603, 0.002, 0.823], [0, 0.006, 0], '#fffaf0', { castShadow: false })
box(rightLeaf, [0.62, 0.008, 0.84], [0, 0, 0], '#eee5d0')
box(rightLeaf, [0.603, 0.002, 0.823], [0, 0.006, 0], '#fff9ed', { castShadow: false })

// Outside back cover: separate from the paper slab, with outward-facing print.
const backCover = box(rightLeaf, [0.62, 0.004, 0.84], [0, -0.008, 0], '#e8dfcb')
const backPrint = app.create('ui', {
  space: 'world',
  width: 580,
  height: 800,
  size: 0.001,
  position: [0, -0.012, 0],
  rotation: [PI / 2, 0, PI],
  backgroundColor: 'rgba(255,255,255,0)',
  pointerEvents: false,
  flexDirection: 'column',
  padding: 18,
  gap: 18,
  lit: false,
})
rightLeaf.add(backPrint)
text(backPrint, 'HYPERFY NEWS', 40, '#a22a2e', 'bold')
text(backPrint, 'WORLD EDITION', 20, '#1f2730', 'bold')
text(backPrint, 'Technology • Culture • Worlds', 18, '#52514e')
text(backPrint, 'hyperfy-news.jerometremblay.chatgpt.site', 14, '#52514e')
backCover.onPointerDown = () => requestToggle()

// Fully closed: one solid volume replaces the separated animated leaf layers.
const closedBook = group(journalBody)
const closedBlock = box(closedBook, [0.62, 0.06, 0.84], [0.31, 0.02, 0], '#e8dfcb')
makeCoverPrint(closedBook, [0.31, 0.052, 0], [-PI / 2, 0, 0])
const closedBackPrint = app.create('ui', {
  space: 'world',
  width: 580,
  height: 800,
  size: 0.001,
  position: [0.31, -0.012, 0],
  rotation: [PI / 2, 0, PI],
  backgroundColor: 'rgba(255,255,255,0)',
  pointerEvents: false,
  flexDirection: 'column',
  padding: 18,
  gap: 18,
  lit: false,
})
closedBook.add(closedBackPrint)
text(closedBackPrint, 'HYPERFY NEWS', 40, '#a22a2e', 'bold')
text(closedBackPrint, 'WORLD EDITION', 20, '#1f2730', 'bold')
text(closedBackPrint, 'Technology • Culture • Worlds', 18, '#52514e')
closedBlock.onPointerDown = () => requestToggle()

// Preload all pages while opening; retain them through page turns.
// Fully closing deactivates their WebViews.
const content = group(opened)
content.active = false
const pageSurfaces = []
const TURN_DURATION = 0.65
function validSpread(page) {
  return Number.isInteger(page) && page >= 1 && page <= PAGE_COUNT - 1 && page % 2 === 1
}
function validTurn(value) {
  return (
    value &&
    validSpread(value.origin) &&
    validSpread(value.destination) &&
    Math.abs(value.destination - value.origin) === 2 &&
    value.forward === value.destination > value.origin &&
    Number.isInteger(value.id) &&
    value.id > 0 &&
    Number.isFinite(value.startedAt)
  )
}
let firstPage = validTurn(app.state.turn)
  ? app.state.turn.origin
  : validSpread(app.state.firstPage)
    ? app.state.firstPage
    : 1
let turn = null
let pendingTurn = null
for (let number = 1; number <= PAGE_COUNT; number++) {
  const pivot = group(journalBody, [0, -10000, 0])
  const page = app.create('webview', {
    space: 'world',
    src: NEWS_URL + '?texture=1&page=' + number,
    proxy: false,
    width: 0.611 * 1200,
    height: 0.828 * 1200,
    factor: 1,
    scale: [1 / 1200, 1 / 1200, 1 / 1200],
    interactive: false,
    doubleside: true,
    renderOrder: 1,
    rotation: [-PI / 2, 0, 0],
  })
  pivot.add(page)
  page.onPointerDown = event => {
    event.stopPropagation()
    turnPage(number % 2 === 0 ? 1 : -1)
  }
  pageSurfaces.push({ pivot, page })
}
function parkPages() {
  for (const surface of pageSurfaces) {
    surface.page.renderOrder = 1
    surface.pivot.position.set(0, -10000, 0)
  }
}
function stationaryPage(number, leftSide) {
  const { pivot, page } = pageSurfaces[number - 1]
  pivot.position.set(leftSide ? -0.31 : 0.31, PAGE_HEIGHT, 0)
  pivot.rotation.set(0, 0, 0)
  page.rotation.set(-PI / 2, 0, 0)
}

function showSpread() {
  parkPages()
  stationaryPage(firstPage, true)
  stationaryPage(firstPage + 1, false)
}
function movingPage(number, angle, back) {
  const { pivot, page } = pageSurfaces[number - 1]
  page.renderOrder = 100
  const offset = back ? -0.0005 : 0.0005
  pivot.position.set(
    Math.cos(angle) * 0.31 - Math.sin(angle) * offset,
    TURN_HINGE_HEIGHT + Math.sin(angle) * 0.31 + Math.cos(angle) * offset,
    0
  )
  pivot.rotation.set(0, 0, angle)
  page.rotation.set(back ? PI / 2 : -PI / 2, 0, back ? PI : 0)
}
function renderTurn(t) {
  parkPages()
  const eased = t * t * (3 - 2 * t)
  const angle = PI * (turn.forward ? eased : 1 - eased)
  stationaryPage(turn.forward ? turn.origin : turn.destination, true)
  stationaryPage(turn.forward ? turn.destination + 1 : turn.origin + 1, false)
  // Choose the outward face relative to this viewer, not a fixed halfway frame.
  const camera = readingControl.camera
  const eye = camera.position.clone().add(new Vector3(0, 0, camera.zoom || 0).applyQuaternion(camera.quaternion))
  // Transform the viewer into journal-local space, including reading scale.
  eye.sub(app.position).applyQuaternion(app.quaternion.clone().invert()).divide(app.scale)
  eye.sub(new Vector3(-0.31, 0.012, 0))
  const towardEye = eye.sub(new Vector3(Math.cos(angle) * 0.31, TURN_HINGE_HEIGHT + Math.sin(angle) * 0.31, 0))
  const frontNormal = new Vector3(-Math.sin(angle), Math.cos(angle), 0)
  if (frontNormal.dot(towardEye) >= 0) {
    movingPage(turn.forward ? turn.origin + 1 : turn.destination + 1, angle, false)
  } else {
    movingPage(turn.forward ? turn.destination : turn.origin, angle, true)
  }
}
function finishTurn() {
  if (turn) firstPage = turn.destination
  app.state.firstPage = firstPage
  app.state.turn = null
  turn = null
  app.off('update', animateTurn)
  if (world.isClient && readingPose) applyReadingPose(1)
  showSpread()
}
function animateTurn() {
  if (!turn) return
  const t = Math.max(0, Math.min(1, (world.getTime() - turn.startedAt) / TURN_DURATION))
  renderTurn(t)
  if (t >= 1) finishTurn()
}
function startSharedTurn(sharedTurn) {
  if (!validTurn(sharedTurn)) return
  if (!app.state.open || world.isBuilding) {
    firstPage = sharedTurn.destination
    return
  }
  if (progress < 0.9999) {
    pendingTurn = sharedTurn
    return
  }
  pendingTurn = null
  turn = { ...sharedTurn }
  app.off('update', animateTurn)
  app.on('update', animateTurn)
  animateTurn()
}
function receivePages(message) {
  if (!message || !validSpread(message.firstPage)) return
  if (message.turn && (!validTurn(message.turn) || message.turn.destination !== message.firstPage)) return
  app.state.firstPage = message.firstPage
  app.state.turn = message.turn || null
  if (message.turn) {
    startSharedTurn(message.turn)
  } else {
    pendingTurn = null
    app.off('update', animateTurn)
    turn = null
    firstPage = message.firstPage
    if (progress >= 0.9999 && target === 1 && !world.isBuilding) showSpread()
  }
}
function turnPage(direction) {
  if (world.isBuilding || app.isMoving || turn || pendingTurn || progress < 0.9999 || target !== 1) return
  if (world.getPlayer()?.id !== app.state.readerId) return
  app.send('journal:turn-request', { direction })
}

// The center crease sits between the two coplanar reading surfaces.
const crease = box(content, [0.005, 0.002, 0.77], [0, 0.008, 0], '#cec4ac', {
  castShadow: false,
  receiveShadow: false,
})

// Corner tabs sit outside the reading area and are visible even during unfolding.
const foldTab = box(opened, [0.036, 0.003, 0.056], [0.65, 0.036, 0.318], '#ad3031', { castShadow: false })

// Opening and page turns are shared through authoritative server state.
const action = app.create('action', {
  label: 'Open journal',
  distance: 3,
  duration: 0.15,
  position: [0.24, 0.12, 0.18],
})
journalBody.add(action)

// Reading transforms are visual only: the entity's saved placement stays at home.
let homePose = null
let readingPose = app.state.readingPose || null
const readingControl = world.isClient ? app.control() : null
function requestToggle() {
  if (!world.isClient || world.isBuilding || app.isMoving) return
  const player = world.getPlayer()
  if (!player) return
  // Bone transform results share a scratch matrix: copy each position immediately.
  const leftEyeMatrix = player.getBoneTransform('leftEye')
  const leftEye = leftEyeMatrix ? new Vector3().setFromMatrixPosition(leftEyeMatrix) : null
  const rightEyeMatrix = player.getBoneTransform('rightEye')
  const rightEye = rightEyeMatrix ? new Vector3().setFromMatrixPosition(rightEyeMatrix) : null
  let eye
  if (leftEye && rightEye) eye = leftEye.add(rightEye).multiplyScalar(0.5)
  else if (leftEye || rightEye) eye = leftEye || rightEye
  else {
    const head = player.getBoneTransform('head')
    // The camera rig also follows the current seated pose; exclude third-person zoom.
    eye = head ? new Vector3().setFromMatrixPosition(head) : readingControl.camera.position.clone()
  }
  app.send('journal:toggle', { eye: eye.toArray() })
}

function captureHome() {
  if (!homePose)
    homePose = {
      position: app.position.clone(),
      quaternion: app.quaternion.clone(),
      scale: app.scale.clone(),
    }
}
function applyReadingPose(t) {
  if (!world.isClient || !readingPose) return
  captureHome()
  const eased = smooth(t)
  app.position.copy(homePose.position).lerp(new Vector3().fromArray(readingPose.position), eased)
  app.quaternion.copy(homePose.quaternion).slerp(new Quaternion().fromArray(readingPose.quaternion), eased)
  app.scale.copy(homePose.scale).lerp(new Vector3(1.2, 1.2, 1.2), eased)
  if (t <= 0 && target === 0) {
    app.position.copy(homePose.position)
    app.quaternion.copy(homePose.quaternion)
    app.scale.copy(homePose.scale)
    homePose = null
    readingPose = null
  }
}

let progress = app.state.open ? 1 : 0
let target = progress

function smooth(t) {
  return t * t * (3 - 2 * t)
}

function applyPaper(t) {
  applyReadingPose(t)
  const eased = smooth(t)
  // Closed: left sheet lies over the right, with its printed cover facing up.
  // Open: both leaves meet at the same spine and lie on one plane.
  const angle = -PI * (1 - eased)
  const hingeHeight = LEFT_HINGE_HEIGHT * (1 - eased)
  const fullyClosed = t <= 0 && target === 0
  closedBook.active = fullyClosed
  opened.active = !fullyClosed
  folded.active = true
  for (const surface of pageSurfaces) surface.pivot.active = !fullyClosed
  left.scale.set(1, 1, 1)
  right.scale.set(1, 1, 1)
  left.position.y = hingeHeight
  left.rotation.z = angle
  right.rotation.z = 0
  content.active = t >= 0.9999
  if (!turn) {
    parkPages()
    stationaryPage(firstPage + 1, false)
    const { pivot, page } = pageSurfaces[firstPage - 1]
    pivot.position.set(
      Math.cos(angle) * -0.31 - Math.sin(angle) * PAGE_HEIGHT,
      hingeHeight + Math.sin(angle) * -0.31 + Math.cos(angle) * PAGE_HEIGHT,
      0
    )
    pivot.rotation.set(0, 0, angle)
    page.rotation.set(-PI / 2, 0, 0)
  }
  if (t >= 0.9999 && pendingTurn && !turn) startSharedTurn(pendingTurn)
  action.label = target === 1 ? 'Fold journal' : 'Open journal'
  action.position.set(target === 1 ? 0.69 : 0.24, 0.12, target === 1 ? 0.34 : 0.18)
}

function animate(dt) {
  const step = Math.min(1, dt / 0.65)
  progress = target > progress ? Math.min(target, progress + step) : Math.max(target, progress - step)
  if (progress === target) {
    progress = target
    app.off('update', animate)
  }
  applyPaper(progress)
}

function setOpen(isOpen, pose) {
  if (isOpen && pose) {
    captureHome()
    readingPose = pose
  }
  if (!isOpen) pendingTurn = null
  if (!isOpen && turn) finishTurn()
  target = isOpen ? 1 : 0
  if (target !== progress) {
    // Opening reactivates all six page views; closing disables them at rest.
    content.active = false
    app.off('update', animate)
    app.on('update', animate)
  }
  applyPaper(progress)
}

applyPaper(progress)

if (world.isServer) {
  if (typeof app.state.open !== 'boolean') app.state.open = false
  let lastFirstPage = validSpread(app.state.firstPage) ? app.state.firstPage : 1
  function ensurePageState() {
    if (!validSpread(app.state.firstPage)) app.state.firstPage = lastFirstPage
    lastFirstPage = app.state.firstPage
  }
  ensurePageState()
  let turnSequence = 0
  app.state.turn = null
  app.on('journal:turn-request', (request, networkId) => {
    const player = world.getPlayer(networkId)
    if (!player || !app.state.open || app.state.readerId !== player.id) return
    ensurePageState()
    if (request?.direction !== 1 && request?.direction !== -1) return
    if (app.state.turn && world.getTime() < app.state.turn.startedAt + TURN_DURATION) return
    const origin = app.state.firstPage
    const destination = Math.max(1, Math.min(PAGE_COUNT - 1, origin + request.direction * 2))
    if (destination === origin) return
    const sharedTurn = {
      id: ++turnSequence,
      origin,
      destination,
      forward: request.direction > 0,
      startedAt: world.getTime(),
    }
    app.state.firstPage = destination
    lastFirstPage = destination
    app.state.turn = sharedTurn
    app.send('journal:pages', { firstPage: destination, turn: sharedTurn })
    setTimeout(() => {
      if (app.state.turn?.id !== sharedTurn.id) return
      app.state.turn = null
      app.send('journal:pages', { firstPage: app.state.firstPage, turn: null })
    }, TURN_DURATION * 1000)
  })
  function publishClosed() {
    ensurePageState()
    app.state.open = false
    app.state.readerId = null
    app.state.readingPose = null
    app.state.turn = null
    app.send('journal:state', { open: false, firstPage: app.state.firstPage })
  }
  app.on('journal:toggle', (request, networkId) => {
    const player = world.getPlayer(networkId)
    if (!player) return
    ensurePageState()
    if (app.state.open) {
      if (app.state.readerId === player.id) publishClosed()
      return
    }
    if (player.position.distanceTo(app.position) > 5) return
    const forward = new Vector3(0, 0, -1).applyQuaternion(player.quaternion)
    forward.y = 0
    if (forward.lengthSq() < 0.0001) return
    forward.normalize()
    if (!Array.isArray(request?.eye) || request.eye.length !== 3 || !request.eye.every(Number.isFinite)) return
    const eye = new Vector3().fromArray(request.eye)
    if (eye.distanceTo(player.position) > 3) return
    const center = eye.addScaledVector(forward, 0.9)
    const yaw = Math.atan2(-forward.x, -forward.z)
    const bookQ = new Quaternion()
      .setFromAxisAngle(new Vector3(0, 1, 0), yaw)
      .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), PI / 2))
    const position = center.add(new Vector3(0.31, -0.012, 0).multiplyScalar(1.2).applyQuaternion(bookQ))
    const pose = { position: position.toArray(), quaternion: bookQ.toArray() }
    app.state.open = true
    app.state.readerId = player.id
    app.state.readingPose = pose
    app.send('journal:state', { open: true, pose, readerId: player.id, firstPage: app.state.firstPage })
  })
  world.on('leave', event => {
    if (event.playerId === app.state.readerId) publishClosed()
  })
}

if (world.isClient) {
  action.onTrigger = requestToggle
  frontCover.onPointerDown = requestToggle
  foldTab.onPointerDown = requestToggle
  app.on('journal:pages', receivePages)
  app.on('journal:state', message => {
    app.state.open = message.open
    app.state.readerId = message.readerId || null
    app.state.readingPose = message.pose || null
    if (Number.isInteger(message.firstPage)) receivePages({ firstPage: message.firstPage, turn: null })
    if (!world.isBuilding || !message.open) setOpen(message.open, message.pose)
  })
  function setEditing(enabled) {
    action.active = !enabled
    if (!enabled) return
    pendingTurn = null
    if (turn) finishTurn()
    app.off('update', animate)
    progress = 0
    target = 0
    applyPaper(0)
    const player = world.getPlayer()
    if (app.state.open && app.state.readerId === player?.id) {
      app.send('journal:toggle')
    }
  }
  world.on('build-mode', setEditing)
  if (world.isBuilding) setEditing(true)
  else if (app.state.open && app.state.turn) startSharedTurn(app.state.turn)
}
