/* global app, world */
// Coordinate convention: Y up, +X right, -Z forward.
// The closed back surface is local Y=0, centered on the placement origin.
// The left cover opens around the spine; printed surfaces have explicit depth gaps.

const NEWS_URL = 'https://hyperfy-news.jerometremblay.chatgpt.site/'
const PI = Math.PI
const PAGE_HEIGHT = 0.01
const LEFT_HINGE_HEIGHT = 0.04
const TURN_HINGE_HEIGHT = PAGE_HEIGHT + 0.002
const NEWS_ORIGIN = 'https://hyperfy-news.jerometremblay.chatgpt.site'
const JOURNAL_BRIDGE_EVENTS = new Set(['click', 'keydown'])

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

// The source sends no-store, so keep its iframes mounted while the journal is closed.
const content = group(opened)
content.active = false
const pageSurfaces = []
const TURN_DURATION = 0.65
const MAX_PAGE_COUNT = 10000
const MIN_PAGE_SURFACES = 2
let pageCount = validPageCount(app.state.pageCount) ? app.state.pageCount : null
let pageCountReady = pageCount !== null && app.state.pageCountReady === true
let activePageSurfaceCount = MIN_PAGE_SURFACES
let latestHtmlPageCount = null
let latestHtmlPageUrls = null
let reportedPageCount = null
let manifestPending = false
let manifestRequest = 0

function validPageCount(count) {
  return Number.isSafeInteger(count) && count >= 1 && count <= MAX_PAGE_COUNT
}
function surfaceCountFor(count) {
  return Math.max(MIN_PAGE_SURFACES, Math.ceil(count / 2) * 2)
}
function maxSpreadFirstPage(count) {
  return surfaceCountFor(count) - 1
}
function clampSpread(page, count) {
  if (!Number.isInteger(page) || page < 1) return 1
  const firstPage = page % 2 === 1 ? page : page - 1
  return Math.min(firstPage, maxSpreadFirstPage(count))
}
function validStoredSpread(page) {
  return Number.isInteger(page) && page >= 1 && page <= MAX_PAGE_COUNT - 1 && page % 2 === 1
}
function validManifestPage(entry, index) {
  if (entry?.page !== index + 1 || !Number.isSafeInteger(entry.issuePage) || entry.issuePage < 1) return false
  const match = typeof entry.url === 'string'
    ? entry.url.match(/^\/\?issue=[^&#]+&texture=1&page=([1-9]\d*)$/)
    : null
  return Boolean(match && Number(match[1]) === entry.issuePage)
}
function validSpread(page, count = pageCount) {
  const maxPage = validPageCount(count) ? maxSpreadFirstPage(count) : activePageSurfaceCount - 1
  return Number.isInteger(page) && page >= 1 && page <= maxPage && page % 2 === 1
}
function validTurn(value, count = pageCount) {
  return (
    value &&
    validSpread(value.origin, count) &&
    validSpread(value.destination, count) &&
    Math.abs(value.destination - value.origin) === 2 &&
    value.forward === value.destination > value.origin &&
    Number.isInteger(value.id) &&
    value.id > 0 &&
    Number.isFinite(value.startedAt)
  )
}
let firstPage = validTurn(app.state.turn)
  ? app.state.turn.origin
  : validStoredSpread(app.state.firstPage)
    ? app.state.firstPage
    : 1
let turn = null
let pendingTurn = null

function hasHtmlPageManifest() {
  return !manifestPending && latestHtmlPageCount !== null &&
    latestHtmlPageUrls?.length === latestHtmlPageCount &&
    pageCount === latestHtmlPageCount
}

function maybeSendHtmlPageCount() {
  if (!app.state.open || world.getPlayer()?.id !== app.state.readerId) return
  if (!hasHtmlPageManifest()) return
  if (reportedPageCount === latestHtmlPageCount) return
  reportedPageCount = latestHtmlPageCount
  app.send('journal:page-count', { version: 1, count: latestHtmlPageCount })
}

function releaseReadingFocus(number, event) {
  if (typeof event.releaseFocus === 'function') {
    event.releaseFocus()
    return
  }
  // Older worlds do not yet provide WebView.releaseFocus(); rebuilding its
  // existing surface drops iframe focus.
  const page = pageSurfaces[number - 1]?.page
  const src = page?.src
  if (src) {
    page.src = ''
    page.src = src
  }
}

function requestClose() {
  if (!world.isClient || app.isMoving || !app.state.open) return
  if (world.getPlayer()?.id !== app.state.readerId) return
  app.send('journal:toggle')
}

function receiveHtmlPageCount(event) {
  if (event?.origin !== NEWS_ORIGIN) return
  const message = event.data
  if (
    message?.type !== 'journal-page-count' ||
    message.version !== 1 ||
    !validPageCount(message.count) ||
    message.pageCount !== message.count ||
    !Array.isArray(message.pages) ||
    message.pages.length !== message.count ||
    !message.pages.every(validManifestPage)
  ) return

  manifestPending = false
  const pageUrls = message.pages.map(entry => NEWS_ORIGIN + entry.url + '&embed=1&hyperfy=1')
  const sameManifest = latestHtmlPageUrls?.length === pageUrls.length &&
    latestHtmlPageUrls.every((url, index) => url === pageUrls[index])
  latestHtmlPageCount = message.count
  latestHtmlPageUrls = pageUrls
  if (!sameManifest) {
    reportedPageCount = null
    pageCountReady = false
    app.state.pageCountReady = false
  }
  applyPageCount(message.count, sameManifest && pageCountReady && app.state.pageCount === message.count, app.state.firstPage)

  for (let index = 0; index < pageSurfaces.length; index++) {
    const surface = pageSurfaces[index]
    const src = pageUrls[index] || ''
    if (surface.src === src) continue
    surface.src = src
    surface.page.src = src
  }
  maybeSendHtmlPageCount()
}

function receiveHtmlBridgeEvent(number, event) {
  if (event?.origin !== NEWS_ORIGIN) return
  const message = event.data
  const generic = message?.channel === 'hyperfy-webview' &&
    message.version === 1 &&
    message.type === 'event'
  const legacy = message?.version === 1
  if (!generic && !legacy) return

  const name = generic ? message.name :
    message.type === 'journal-page-click' ? 'surface-click' :
    message.type === 'journal-keydown' ? 'keydown' : null
  if (generic && !JOURNAL_BRIDGE_EVENTS.has(name)) return
  const detail = generic ? message.detail : message
  const target = detail?.target

  if (
    (name === 'surface-click' && detail?.button === 0) ||
    (name === 'click' && detail?.isTrusted === true && !detail.defaultPrevented && detail.button === 0 && !target?.isInteractive)
  ) {
    turnPage(number % 2 === 0 ? 1 : -1)
    return
  }

  if (name !== 'keydown') return
  if (detail?.isTrusted !== true || detail.repeat || detail.isComposing) return
  const escape = detail.key === 'Escape' || detail.code === 'Escape'
  const keyX = detail.code === 'KeyX' ||
    (typeof detail.key === 'string' && detail.key.toLowerCase() === 'x')
  const unmodifiedX =
    keyX &&
    !detail.altKey &&
    !detail.ctrlKey &&
    !detail.metaKey &&
    !detail.shiftKey &&
    !target?.isEditable
  if (!escape && !unmodifiedX) return
  releaseReadingFocus(number, event)
  if (unmodifiedX) requestClose()
}

function createPageSurface(number) {
  const pivot = group(journalBody, [0, -10000, 0])
  const page = app.create('webview', {
    space: 'world',
    src: '',
    proxy: false,
    width: 0.611 * 1200,
    height: 0.828 * 1200,
    factor: 1,
    scale: [1 / 1200, 1 / 1200, 1 / 1200],
    interactive: true,
    doubleside: true,
    renderOrder: 1,
    rotation: [-PI / 2, 0, 0],
    onMessage: world.isClient ? event => {
      receiveHtmlBridgeEvent(number, event)
    } : null,
  })
  pivot.add(page)
  page.onPointerDown = event => {
    event.stopPropagation()
    // Locked clicks reach the 3D reticle, not the iframe's browser event bridge.
    if (readingControl?.pointer.locked && event.button === 'left') {
      turnPage(number % 2 === 0 ? 1 : -1)
    }
  }
  pageSurfaces.push({ pivot, page, src: '' })
}
function ensurePageSurfaces(count = pageCount) {
  activePageSurfaceCount = validPageCount(count)
    ? surfaceCountFor(count)
    : Math.max(MIN_PAGE_SURFACES, firstPage + 1)
  while (pageSurfaces.length < activePageSurfaceCount) createPageSurface(pageSurfaces.length + 1)
}

// One hidden wrapper reports the current all-editions page manifest. Individual
// reading surfaces then load only their own issue page instead of nesting the
// all-editions iframe set once per surface.
const manifestPivot = group(journalBody, [0, -10000, 0])
const manifest = app.create('webview', {
  space: 'world',
  src: NEWS_URL + '?texture=1&page=1',
  proxy: false,
  width: 0.611 * 1200,
  height: 0.828 * 1200,
  factor: 1,
  scale: [1 / 1200, 1 / 1200, 1 / 1200],
  interactive: false,
  doubleside: true,
  renderOrder: 1,
  rotation: [-PI / 2, 0, 0],
  onMessage: world.isClient ? receiveHtmlPageCount : null,
})
manifestPivot.add(manifest)

function refreshManifest(attempt = 0) {
  if (!world.isClient) return
  manifestPending = true
  pageCountReady = false
  app.state.pageCountReady = false
  reportedPageCount = null
  const request = ++manifestRequest
  // Changing src rebuilds just the manifest iframe; reading pages stay mounted.
  manifest.src = NEWS_URL + '?texture=1&page=1&journalRefresh=' + Date.now() + '-' + request
  // An edition iframe can fail before the wrapper reports its manifest. Retry
  // that load instead of leaving this instance permanently unable to turn.
  if (attempt < 2) setTimeout(() => {
    if (app.state.open && manifestPending && manifestRequest === request) refreshManifest(attempt + 1)
  }, 30000)
}
ensurePageSurfaces()

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
function applyPageCount(count, ready, currentFirstPage = app.state.firstPage) {
  if (!validPageCount(count)) return false
  pageCount = count
  pageCountReady = ready
  app.state.pageCount = count
  app.state.pageCountReady = ready
  firstPage = clampSpread(currentFirstPage ?? firstPage, count)
  app.state.firstPage = firstPage
  ensurePageSurfaces(count)
  applyPaper(progress)
  if (progress >= 0.9999 && target === 1 && !turn) showSpread()
  return true
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
  if (!app.state.open) {
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
    if (progress >= 0.9999 && target === 1) showSpread()
  }
}
function receivePageCount(message) {
  if (
    message?.version !== 1 ||
    message.pageCountReady !== true ||
    !validPageCount(message.count) ||
    !validSpread(message.firstPage, message.count)
  ) return
  if (!applyPageCount(message.count, true, message.firstPage)) return
  receivePages({ firstPage: message.firstPage, turn: message.turn || null })
}
function turnPage(direction) {
  if (!pageCountReady || !hasHtmlPageManifest() || app.isMoving || turn || pendingTurn || progress < 0.9999 || target !== 1) return
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
  if (!world.isClient || app.isMoving) return
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
  left.scale.set(1, 1, 1)
  right.scale.set(1, 1, 1)
  left.position.y = hingeHeight
  left.rotation.z = angle
  right.rotation.z = 0
  content.active = t >= 0.9999
  if (!turn) {
    parkPages()
    if (!fullyClosed && pageSurfaces[firstPage - 1]) {
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

function updateCloseControl() {
  if (!readingControl?.keyX) return
  const reading = app.state.open && world.getPlayer()?.id === app.state.readerId
  readingControl.keyX.onPress = reading ? requestClose : null
  readingControl.keyX.capture = !!reading
}

function setOpen(isOpen, pose) {
  updateCloseControl()
  if (isOpen && pose) {
    captureHome()
    readingPose = pose
  }
  if (!isOpen) pendingTurn = null
  if (!isOpen && turn) finishTurn()
  target = isOpen ? 1 : 0
  if (target !== progress) {
    // Page WebViews stay mounted off-page while the journal is closed.
    content.active = false
    app.off('update', animate)
    app.on('update', animate)
  }
  applyPaper(progress)
}

applyPaper(progress)

if (world.isServer) {
  if (typeof app.state.open !== 'boolean') app.state.open = false
  if (!validPageCount(app.state.pageCount)) app.state.pageCount = null
  app.state.pageCountReady = app.state.pageCountReady === true && validPageCount(app.state.pageCount)
  let lastFirstPage = validSpread(app.state.firstPage) ? app.state.firstPage : 1
  function ensurePageState() {
    const count = validPageCount(app.state.pageCount) ? app.state.pageCount : MAX_PAGE_COUNT
    if (!validSpread(app.state.firstPage, count)) app.state.firstPage = clampSpread(lastFirstPage, count)
    lastFirstPage = app.state.firstPage
  }
  ensurePageState()
  let turnSequence = 0
  app.state.turn = null
  app.on('journal:page-count', (request, networkId) => {
    const player = world.getPlayer(networkId)
    if (!player || !app.state.open || app.state.readerId !== player.id) return
    if (request?.version !== 1 || !validPageCount(request.count)) return
    if (!app.state.pageCountReady || app.state.pageCount !== request.count) {
      app.state.pageCount = request.count
      app.state.pageCountReady = true
      app.state.firstPage = clampSpread(app.state.firstPage, request.count)
      app.state.turn = null
      lastFirstPage = app.state.firstPage
      applyPageCount(request.count, true, app.state.firstPage)
    }
    app.send('journal:page-count', {
      version: 1,
      count: app.state.pageCount,
      pageCountReady: true,
      firstPage: app.state.firstPage,
      turn: null,
    })
  })
  app.on('journal:turn-request', (request, networkId) => {
    const player = world.getPlayer(networkId)
    if (!player || !app.state.open || !app.state.pageCountReady || app.state.readerId !== player.id) return
    ensurePageState()
    if (request?.direction !== 1 && request?.direction !== -1) return
    if (app.state.turn && world.getTime() < app.state.turn.startedAt + TURN_DURATION) return
    const origin = app.state.firstPage
    const destination = Math.max(1, Math.min(maxSpreadFirstPage(app.state.pageCount), origin + request.direction * 2))
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
    app.send('journal:state', {
      open: false,
      firstPage: app.state.firstPage,
      pageCount: app.state.pageCount,
      pageCountReady: app.state.pageCountReady,
    })
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
    app.state.pageCountReady = false
    app.send('journal:state', {
      open: true,
      pose,
      readerId: player.id,
      firstPage: app.state.firstPage,
      pageCount: app.state.pageCount,
      pageCountReady: app.state.pageCountReady,
    })
  })
  world.on('leave', event => {
    if (event.playerId === app.state.readerId) publishClosed()
  })
}

if (world.isClient) {
  updateCloseControl()
  action.onTrigger = requestToggle
  app.on('journal:pages', receivePages)
  app.on('journal:page-count', receivePageCount)
  app.on('journal:state', message => {
    const opening = message.open && !app.state.open
    app.state.open = message.open
    app.state.readerId = message.readerId || null
    app.state.readingPose = message.pose || null
    if (validPageCount(message.pageCount)) {
      applyPageCount(message.pageCount, message.pageCountReady === true, message.firstPage)
    } else {
      pageCountReady = false
      app.state.pageCountReady = false
    }
    if (opening) refreshManifest()
    if (message.open) {
      if (message.pageCountReady !== true) reportedPageCount = null
      maybeSendHtmlPageCount()
    }
    if (Number.isInteger(message.firstPage)) receivePages({ firstPage: message.firstPage, turn: null })
    setOpen(message.open, message.pose)
  })
  if (app.state.open) refreshManifest()
  // Opening and folding use the shared action target in build mode too.
  if (app.state.open && app.state.turn) startSharedTurn(app.state.turn)
}
