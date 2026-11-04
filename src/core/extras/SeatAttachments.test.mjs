import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'
import { fileURLToPath } from 'node:url'

const result = await build({
  entryPoints: [fileURLToPath(new URL('./SeatAttachments.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { SeatAttachments } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString('base64')}`
)

function fixture() {
  const scene = new THREE.Scene()
  const avatar = new THREE.Group()
  scene.add(avatar)
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camera.position.set(0, 1, 4)
  camera.lookAt(0, 1, 0)
  const messages = []
  const undos = []
  const player = {
    data: {
      effect: { anchorId: 'chair:seat' },
      seatPose: {
        version: 1,
        anchorId: 'chair:seat',
        avatarUrl: 'asset://avatar.vrm',
        offset: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        pose: {},
        attachmentPoints: [{ position: [0, 1, 0], rotation: [0, 0.70710678, 0, 0.70710678] }],
      },
    },
    avatar: { instance: { raw: { scene: avatar } } },
    getAvatarUrl: () => 'asset://avatar.vrm',
    getAnchorMatrix: () => new THREE.Matrix4(),
    isBuilder: () => true,
  }
  let hit
  const world = {
    entities: { player },
    camera,
    graphics: { viewport: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) } },
    stage: { scene, raycastPointer: () => (hit ? [hit] : []), raycastReticle: () => (hit ? [hit] : []) },
    builder: { addUndo: undo => undos.push(undo) },
    network: { send: (...args) => messages.push(args) },
    emit() {},
  }
  const control = { pointer: { locked: false, position: { x: 50, y: 50 } } }
  return {
    world,
    player,
    avatar,
    camera,
    control,
    messages,
    undos,
    attachments: new SeatAttachments(world),
    setHit(value) {
      hit = value
    },
  }
}

test('nearby hover reveals orbs, then two clicks move and rotate an app with undo', () => {
  const { attachments, control, setHit, messages, undos } = fixture()
  attachments.refresh(control)
  assert.equal(attachments.markers.length, 1)
  assert.equal(attachments.markers[0].visible, true)
  assert.equal(attachments.press(control), true)
  assert.equal(attachments.selected, 0)
  assert.equal(messages.length, 0)
  let change
  const app = {
    isApp: true,
    data: { id: 'book', position: [2, 0, 0], quaternion: [0, 0, 0, 1], scale: [1, 1, 1] },
    modify(value) {
      change = value
    },
  }
  control.pointer.position.x = 80
  setHit({ distance: 3, getEntity: () => app })
  assert.equal(attachments.press(control), true)
  assert.equal(attachments.selected, null)
  assert.equal(change, undefined)
  assert.equal(messages[0][0], 'playerSeatAttachment')
  assert.equal(messages[0][1].objectId, 'book')
  assert.deepEqual(messages[0][1].position, [0, 1, 0])
  assert.ok(Math.abs(messages[0][1].quaternion[1] - Math.SQRT1_2) < 1e-6)
  assert.equal(undos.length, 0)
})

test('orbs hide away from the player and cannot be selected through walls or UI', () => {
  const { attachments, control, setHit } = fixture()
  control.pointer.position.x = 100
  attachments.refresh(control)
  assert.equal(attachments.markers[0].visible, false)
  control.pointer.position.x = 50
  setHit({ distance: 1 })
  assert.equal(attachments.press(control), false)
  assert.equal(attachments.selected, null)
  assert.equal(attachments.press(control, { node: {} }), false)
  assert.equal(attachments.markers[0].visible, false)
})

test('cancellation, losing the seat, and opening the editor clear the interaction', () => {
  const { attachments, control, player, world } = fixture()
  attachments.press(control)
  assert.equal(attachments.cancel(), true)
  assert.equal(attachments.cancel(), false)
  attachments.press(control)
  const marker = attachments.markers[0]
  player.poseEditorActive = true
  attachments.refresh(control)
  assert.equal(attachments.selected, null)
  assert.equal(world.stage.scene.children.includes(marker), false)
  player.poseEditorActive = false
  attachments.press(control)
  player.data.effect = null
  attachments.refresh(control)
  assert.equal(attachments.markers.length, 0)
})

test('pinned objects and players without builder permission never send moves', () => {
  for (const pinned of [true, false]) {
    const { attachments, control, player, setHit, messages } = fixture()
    attachments.press(control)
    control.pointer.position.x = 80
    player.isBuilder = () => pinned
    setHit({ getEntity: () => ({ isApp: true, data: { pinned } }) })
    assert.equal(attachments.press(control), true)
    assert.equal(messages.length, 0)
  }
})

test('attachment world transform follows avatar translation and rotation', () => {
  const { attachments, control, avatar } = fixture()
  avatar.position.set(2, 0, 1)
  avatar.rotation.y = Math.PI / 2
  attachments.refresh(control)
  assert.deepEqual(attachments.markers[0].position.toArray(), [2, 1, 1])
  assert.ok(Math.abs(attachments.markers[0].quaternion.y - 1) < 1e-6)
})

test('each orb appears near itself and becomes more transparent only when clickable', () => {
  const { attachments, control, player, setHit } = fixture()
  player.data.seatPose.attachmentPoints.push({ position: [1, 1, 0], rotation: [0, 0, 0, 1] })
  control.pointer.position.x = 53
  attachments.refresh(control)
  const [near, distant] = attachments.markers
  assert.equal(near.visible, true)
  assert.equal(near.material.opacity, 0.72)
  assert.equal(distant.visible, false)
  control.pointer.position.x = 50
  attachments.refresh(control)
  assert.equal(near.material.opacity, 0.4)
  setHit({ distance: 1 })
  attachments.refresh(control)
  assert.equal(near.material.opacity, 0.72)
  assert.equal(attachments.press(control), false)
})

test('smaller orbs fade in from farther away and retain the original selection area', () => {
  const { attachments, control } = fixture()
  control.pointer.position.x = 62
  attachments.refresh(control)
  const marker = attachments.markers[0]
  assert.equal(marker.geometry.parameters.radius, 0.0175)
  assert.equal(marker.visible, true)
  const distantOpacity = marker.material.opacity
  control.pointer.position.x = 56
  attachments.refresh(control)
  assert.ok(marker.material.opacity > distantOpacity)
  assert.ok(marker.material.opacity < 0.72)
  control.pointer.position.x = 50.6
  attachments.refresh(control)
  assert.equal(marker.material.opacity, 0.4)
  assert.equal(attachments.press(control), true)
})
