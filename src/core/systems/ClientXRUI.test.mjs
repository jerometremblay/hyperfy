import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import * as THREE from 'three'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./ClientXRUI.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { ClientXRUI } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function setup() {
  const camera = new THREE.PerspectiveCamera()
  camera.position.set(0, 1.6, 0)
  const rig = new THREE.Object3D()
  rig.position.set(2, 0, 3)
  rig.add(camera)
  const base = new THREE.Object3D()
  base.position.copy(rig.position)
  const session = Object.assign(new EventTarget(), { visibilityState: 'visible', inputSources: [] })
  const world = {
    xr: { session, camera },
    camera,
    entities: { player: { xrRig: rig, base } },
    graphics: { renderer: { xr: { getFrame: () => ({}), getReferenceSpace: () => ({}) } } },
    emit() {},
  }
  const ui = new ClientXRUI(world)
  ui.onSession(session)
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.72))
  mesh.scale.setScalar(0.8)
  ui.panelAnchor.add(mesh)
  const pointers = []
  const activations = []
  const cancellations = []
  ui.surface = {
    mesh,
    cancelPointers: () => cancellations.push(true),
    refresh() {},
    updatePointer: (id, uv, down, activate) => {
      pointers.push([id, uv, down])
      if (activate) activations.push([id, uv])
    },
  }
  return { ui, world, camera, rig, base, session, mesh, pointers, activations, cancellations }
}

function setupRay(hand = 'right', trackedHand = true) {
  const fixture = setup()
  const { ui, world, rig, session, mesh } = fixture
  const source = {
    handedness: hand,
    hand: trackedHand ? new Map() : null,
    targetRaySpace: {},
    // Selection comes from browser events, including hands without a gamepad.
  }
  session.inputSources = [source]
  let tracked = true
  const frame = {
    getPose: () => {
      if (!tracked) return null
      const position = mesh.localToWorld(new THREE.Vector3(0.068, 0.072, 1))
      position.applyMatrix4(rig.matrixWorld.clone().invert())
      const orientation = rig
        .getWorldQuaternion(new THREE.Quaternion())
        .invert()
        .multiply(mesh.getWorldQuaternion(new THREE.Quaternion()))
      return { transform: { position, orientation } }
    },
  }
  world.graphics.renderer.xr.getFrame = () => frame
  const dispatch = (type, targetSession = session) => {
    const event = new Event(type)
    event.inputSource = source
    event.frame = frame
    targetSession.dispatchEvent(event)
  }
  return { ...fixture, source, frame, dispatch, setTracked: value => (tracked = value) }
}

test('the panel opens in front of the avatar and follows movement, controller turning, and teleporting', () => {
  const { ui, camera, rig, base, mesh } = setup()
  camera.rotation.set(-0.5, Math.PI / 2, 0, 'YXZ')
  ui.setVisible(true)
  const panelPosition = () => mesh.getWorldPosition(new THREE.Vector3())
  assert.ok(panelPosition().distanceTo(new THREE.Vector3(2, 1.38, 2.3)) < 1e-8)
  const localPosition = mesh.position.clone()
  const localRotation = mesh.quaternion.clone()

  // Pitch and roll do not pull the body-attached surface out from under a hand.
  const openedAt = panelPosition()
  camera.rotation.x += 0.3
  camera.rotation.z += 0.2
  ui.lateUpdate()
  assert.ok(panelPosition().distanceTo(openedAt) < 1e-8)

  base.position.add(new THREE.Vector3(1, 0.2, -2))
  ui.lateUpdate()
  assert.ok(panelPosition().distanceTo(openedAt.clone().add(new THREE.Vector3(1, 0.2, -2))) < 1e-8)

  base.rotation.y = Math.PI / 2
  rig.rotation.y = Math.PI / 2
  base.position.set(40, 3, -70)
  ui.lateUpdate()
  const expected = localPosition.clone().applyQuaternion(rig.quaternion).add(base.position)
  assert.ok(panelPosition().distanceTo(expected) < 1e-8)
  const expectedRotation = rig.quaternion.clone().multiply(localRotation)
  assert.ok(mesh.getWorldQuaternion(new THREE.Quaternion()).angleTo(expectedRotation) < 1e-8)

  // Recenter adjusts height without using the direction the head is looking.
  rig.position.copy(base.position)
  rig.quaternion.copy(base.quaternion)
  ui.placePanel()
  assert.ok(panelPosition().distanceTo(camera.getWorldPosition(new THREE.Vector3())) < 0.8)
})

test('head rotation and the avatar visual rotation cannot move the panel or change its opening direction', () => {
  const { ui, camera, base, mesh } = setup()
  ui.setVisible(true)
  const openedAt = mesh.getWorldPosition(new THREE.Vector3())
  const openedRotation = mesh.getWorldQuaternion(new THREE.Quaternion())

  camera.rotation.set(-0.4, Math.PI / 2, 0.3, 'YXZ')
  // PlayerLocal turns the rendered avatar toward the headset in first person.
  base.rotation.y = Math.PI / 2
  camera.position.set(0.15, 1.8, -0.1)
  ui.lateUpdate()
  assert.ok(mesh.getWorldPosition(new THREE.Vector3()).distanceTo(openedAt) < 1e-8)
  assert.ok(mesh.getWorldQuaternion(new THREE.Quaternion()).angleTo(openedRotation) < 1e-8)

  // Recenter/open only resamples height; the avatar-relative X/Z stay fixed.
  ui.placePanel()
  const recentered = mesh.getWorldPosition(new THREE.Vector3())
  assert.ok(recentered.distanceTo(openedAt.clone().add(new THREE.Vector3(0, 0.2, 0))) < 1e-8)
  assert.ok(mesh.getWorldQuaternion(new THREE.Quaternion()).angleTo(openedRotation) < 1e-8)
})

test('physical walking carries the panel even when the XR tracking origin does not move', () => {
  const { ui, camera, rig, base, mesh } = setup()
  ui.setVisible(true)
  const openedAt = mesh.getWorldPosition(new THREE.Vector3())
  const trackingOrigin = rig.position.clone()
  camera.position.x += 0.5
  base.position.x += 0.5
  ui.lateUpdate()
  const panelPosition = mesh.getWorldPosition(new THREE.Vector3())
  assert.ok(rig.position.equals(trackingOrigin))
  assert.ok(panelPosition.distanceTo(openedAt.add(new THREE.Vector3(0.5, 0, 0))) < 1e-8)
  assert.ok(panelPosition.distanceTo(camera.getWorldPosition(new THREE.Vector3())) < 0.8)
})

test('opening the sidebar preserves stick movement and turning while capturing world triggers', () => {
  const { ui } = setup()
  ui.control = {
    xrLeftStick: { capture: false },
    xrRightStick: { capture: false },
    xrLeftTrigger: { capture: false },
    xrRightTrigger: { capture: false },
  }
  ui.setVisible(true)
  assert.equal(ui.control.xrLeftStick.capture, false)
  assert.equal(ui.control.xrRightStick.capture, false)
  assert.equal(ui.control.xrLeftTrigger.capture, true)
  assert.equal(ui.control.xrRightTrigger.capture, true)
  ui.surface = null
  ui.setVisible(false)
  assert.equal(ui.control.xrLeftTrigger.capture, false)
  assert.equal(ui.control.xrRightTrigger.capture, false)
})

test('places the panel in front of the avatar when the renderer XR camera is detached from the player rig', () => {
  const { ui, world, camera, rig, base, mesh } = setup()
  rig.position.set(12, 0.3, -8)
  rig.rotation.y = Math.PI / 2
  base.position.copy(rig.position)
  base.quaternion.copy(rig.quaternion)
  camera.position.set(0.1, 1.6, 0.2)
  camera.rotation.set(-0.2, 0.1, 0, 'YXZ')
  rig.updateMatrixWorld(true)

  // WebXRManager applies the player rig to matrixWorld while its ArrayCamera
  // remains parentless and keeps its local headset pose in position/quaternion.
  const xrCamera = new THREE.ArrayCamera()
  xrCamera.position.copy(camera.position)
  xrCamera.quaternion.copy(camera.quaternion)
  xrCamera.updateMatrix()
  xrCamera.matrixWorld.copy(camera.matrixWorld)
  world.xr.camera = xrCamera

  const head = camera.getWorldPosition(new THREE.Vector3())
  const expected = base.position
    .clone()
    .add(new THREE.Vector3(0, head.y - base.position.y - 0.22, -0.7).applyQuaternion(rig.quaternion))
  ui.setVisible(true)
  const panelPosition = mesh.getWorldPosition(new THREE.Vector3())
  assert.ok(
    Math.hypot(panelPosition.x - head.x, panelPosition.z - head.z) < 1,
    'panel must use the player rig position'
  )
  assert.ok(panelPosition.distanceTo(expected) < 1e-8)
  assert.ok(panelPosition.distanceTo(head) < 1)
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion()))
  const towardAvatar = base.position.clone().sub(panelPosition).setY(0).normalize()
  assert.ok(forward.distanceTo(towardAvatar) < 1e-8)
})

test('holding the left menu toggles once, releasing and pressing toggles again', () => {
  const { ui, session } = setup()
  const button = { pressed: false }
  session.inputSources = [{ handedness: 'left', profiles: ['oculus-touch-v3'], gamepad: { buttons: [] } }]
  session.inputSources[0].gamepad.buttons[7] = button
  button.pressed = true
  ui.update()
  assert.equal(ui.visible, true)
  ui.update()
  assert.equal(ui.visible, true)
  button.pressed = false
  ui.update()
  button.pressed = true
  // Avoid touching the DOM in this geometry-only fixture on close.
  ui.surface = null
  ui.update()
  assert.equal(ui.visible, false)
})

test('Y toggles on older Quest profiles, while an unknown controller button is ignored', () => {
  const { ui, session } = setup()
  const buttons = []
  buttons[5] = { pressed: true }
  session.inputSources = [{ handedness: 'left', profiles: ['generic-trigger'], gamepad: { buttons } }]
  ui.update()
  assert.equal(ui.visible, false)
  session.inputSources[0].profiles = ['oculus-touch-v2', 'oculus-touch']
  ui.update()
  assert.equal(ui.visible, true)
})

test('uses the browser hand ray and native pinch events through a moved and rotated avatar', () => {
  const { ui, rig, base, session, source, pointers, dispatch } = setupRay()
  ui.setVisible(true)
  base.position.add(new THREE.Vector3(5, 0.4, -3))
  base.rotation.y = 0.5
  rig.rotation.y = 0.7
  rig.updateMatrixWorld(true)
  ui.lateUpdate()
  assert.equal(pointers.findLast(([id]) => id === 102)[2], false)
  dispatch('selectstart')
  const press = pointers.find(([id, uv, down]) => id === 102 && down)
  assert.ok(press)
  assert.ok(Math.abs(press[1].x - 0.6) < 1e-8)
  assert.ok(Math.abs(press[1].y - 0.4) < 1e-8)
  ui.lateUpdate()
  assert.equal(pointers.findLast(([id]) => id === 102)[2], true)
  dispatch('select')
  dispatch('selectend')
  assert.equal(pointers.at(-1)[2], false)

  dispatch('selectstart')
  session.inputSources = []
  ui.lateUpdate()
  assert.equal(ui.selectedSources.has(source), false)
  assert.deepEqual(pointers.at(-1), [102, null, false])
})

test('a quick native pinch produces press and release even between animation frames', () => {
  const { ui, pointers, activations, dispatch } = setupRay('left')
  ui.setVisible(true)
  dispatch('selectstart')
  dispatch('select')
  assert.equal(pointers.at(-2)[2], true)
  assert.equal(pointers.at(-1)[2], false)
  dispatch('selectend')
  assert.equal(activations.length, 1)
  assert.equal(activations[0][0], 101)
  assert.equal(pointers.at(-1)[2], false)
})

test('the visible cursor does not intercept the hand ray or replace the panel coordinates', () => {
  const { ui, mesh, pointers, dispatch } = setupRay()
  const cursor = new THREE.Mesh(new THREE.SphereGeometry(0.007), new THREE.MeshBasicMaterial())
  cursor.position.set(0.068, 0.072, 0.006)
  mesh.add(cursor)
  ui.setVisible(true)
  dispatch('selectstart')
  const [, uv, down] = pointers.at(-1)
  assert.equal(down, true)
  assert.ok(Math.abs(uv.x - 0.6) < 1e-8)
  assert.ok(Math.abs(uv.y - 0.4) < 1e-8)
})

test('a cancelled native pinch releases the pointer without activating a control', () => {
  const { ui, pointers, activations, dispatch } = setupRay()
  ui.setVisible(true)
  dispatch('selectstart')
  dispatch('selectend')
  assert.equal(pointers.at(-1)[2], false)
  assert.equal(activations.length, 0)
})

test('controller triggers use the same standard selection events as hands', () => {
  const { ui, pointers, dispatch } = setupRay('left', false)
  ui.setVisible(true)
  dispatch('selectstart')
  assert.equal(pointers.at(-1)[2], true)
  dispatch('select')
  dispatch('selectend')
  assert.equal(pointers.at(-1)[2], false)
})

test('suspending the XR session immediately cancels a pinch and requires a new selection', () => {
  const { ui, session, mesh, source, pointers, cancellations, dispatch } = setupRay()
  ui.setVisible(true)
  dispatch('selectstart')
  assert.equal(ui.selectedSources.has(source), true)
  const cancelledBefore = cancellations.length
  session.visibilityState = 'visible-blurred'
  session.dispatchEvent(new Event('visibilitychange'))
  assert.equal(mesh.visible, false)
  assert.equal(ui.selectedSources.has(source), false)
  assert.equal(cancellations.length, cancelledBefore + 1)
  dispatch('selectstart')
  assert.equal(ui.selectedSources.has(source), false)
  session.visibilityState = 'visible'
  ui.lateUpdate()
  assert.equal(mesh.visible, true)
  assert.equal(pointers.findLast(([id]) => id === 102)[2], false)
  dispatch('selectstart')
  assert.equal(pointers.at(-1)[2], true)
})

test('losing a pointing pose cancels selection without clicking when tracking resumes', () => {
  const { ui, source, pointers, activations, dispatch, setTracked } = setupRay()
  ui.setVisible(true)
  dispatch('selectstart')
  setTracked(false)
  ui.lateUpdate()
  assert.equal(ui.selectedSources.has(source), false)
  assert.deepEqual(
    pointers.findLast(([id]) => id === 102),
    [102, null, false]
  )
  setTracked(true)
  ui.lateUpdate()
  assert.equal(pointers.findLast(([id]) => id === 102)[2], false)
  dispatch('select')
  dispatch('selectend')
  assert.equal(activations.length, 0)
})

test('removing a hand cancels its native selection immediately', () => {
  const { ui, session, source, pointers, dispatch } = setupRay()
  ui.setVisible(true)
  dispatch('selectstart')
  const event = new Event('inputsourceschange')
  event.removed = [source]
  session.inputSources = []
  session.dispatchEvent(event)
  assert.equal(ui.selectedSources.has(source), false)
  assert.deepEqual(pointers.at(-1), [102, null, false])
})

test('a replaced XR session cannot send selections to the sidebar', () => {
  const { ui, world, source, pointers, dispatch } = setupRay()
  const nextSession = Object.assign(new EventTarget(), { visibilityState: 'visible', inputSources: [source] })
  world.xr.session = nextSession
  ui.onSession(nextSession)
  ui.setVisible(true)
  const before = pointers.length
  dispatch('selectstart')
  assert.equal(pointers.length, before)
  dispatch('selectstart', nextSession)
  assert.equal(pointers.at(-1)[2], true)
  ui.onSession(null)
  ui.setVisible(true)
  const endedAt = pointers.length
  dispatch('selectstart', nextSession)
  assert.equal(pointers.length, endedAt)
})
