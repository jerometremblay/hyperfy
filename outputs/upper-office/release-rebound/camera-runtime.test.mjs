import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import { createHash } from 'node:crypto'
import {
  world, clean, flush, events, THREE, PlayerLocal, Controller, Avatar, destroyWorlds,
} from '../motion-fix/runtime-harness.mjs'

const cases = [], checks = []
const baseline = !!process.env.EXPECT_CAMERA_REBOUND
test.after(async () => {
  await destroyWorlds()
  const engine = await fs.readFile(process.env.MOTION_PLAYER_SOURCE || 'src/core/entities/PlayerLocal.js')
  await fs.writeFile(process.env.CAMERA_REPORT || 'outputs/upper-office/release-rebound/camera-runtime-validation.json',
    JSON.stringify({ valid: checks.length === 4, baseline, actualPhysXWasm: true,
      actualPlayerLateUpdate: true, actualNodeAndAvatarCommits: true,
      playerSourceSha256: createHash('sha256').update(engine).digest('hex'), checks, cases }, null, 2))
})

// The factory uses the same live avatar matrix reference as createVRMFactory.
// Its head is in avatar space; Avatar.commit carries the posed bone into world space.
function posedAvatar(w, p, offset = [0, 0, 0]) {
  const head = new THREE.Matrix4().makeTranslation(.025, .71, -.13)
  const scratch = new THREE.Matrix4()
  const avatar = new Avatar({
    position: offset,
    factory: {
      create(matrix) {
        return {
          raw: { scene: { matrixWorld: matrix } }, height: 1.8,
          getBoneTransform: () => scratch.multiplyMatrices(matrix, head),
          setEmote() {}, setVisible() {}, setFirstPerson() {}, setPoseOverride() {},
          setHandTrackingPose() {}, move(next) { matrix.copy(next) }, destroy() {},
        }
      },
    },
  })
  w.avatars = { add() {}, remove() {} }
  p.base.add(avatar)
  p.avatar = avatar
  return avatar
}
async function ride(firstPerson = false, scale = [1, 1, 1], offset = [0, 0, 0]) {
  const w = await world({ client: true })
  const p = w.addPlayer('p1')
  p.controller = new Controller({ radius: .3, height: 1.1, layer: 'player' })
  p.controller.activate({ world: w })
  w.bodies.push(p.controller)
  p.cam = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom: firstPerson ? 0 : 2 }
  p.control = { camera: { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom: p.cam.zoom } }
  p.camHeight = 1.2; p.firstPerson = firstPerson
  p.cameraFocus = new THREE.Vector3(); p.cameraFocusBounds = new THREE.Box3()
  p.aura = { position: new THREE.Vector3() }
  p.getAnchorMatrix = PlayerLocal.prototype.getAnchorMatrix
  w.camera = new THREE.PerspectiveCamera()
  posedAvatar(w, p, offset)
  const chair = w.addFurniture('chair', [0, .002, 0], [0, 0, 0, 1], scale)
  await flush(w)
  chair.root.get('executive-seat-action').onTrigger()
  const request = events(w, 'seat-claim').at(-1).args[1][3].request
  chair.emit('seat-slot', { owner: 'p1', token: 'camera-test', pose: {
    position: chair.root.position.toArray(), quaternion: chair.root.quaternion.toArray(),
  } })
  chair.emit('seat-reply', { request, accepted: true, owner: 'p1', token: 'camera-test' })
  await flush(w)
  return { w, chair, p, control: w.controlsMade.at(-1) }
}
function key(c, name, held) {
  c[name].down = held
  c[name][held ? 'onPress' : 'onRelease']()
}
function frame(r, delta) {
  const { w, chair, p } = r
  w.time += delta
  w.accumulator = (w.accumulator || 0) + delta
  w.physics.preFixedUpdate(w.accumulator >= .02)
  while (w.accumulator >= .02) {
    chair.fixedUpdate(.02); w.physics.postFixedUpdate(.02); w.accumulator -= .02
  }
  w.physics.preUpdate(w.accumulator / .02)
  chair.update(delta)
  clean(w) // World.postUpdate commits the chair, before anchored player lateUpdate.
  PlayerLocal.prototype.lateUpdate.call(p, delta)
  chair.lateUpdate(delta)
  const captured = p.control.camera.position.clone()
  clean(w) // World.postLateUpdate commits the avatar before rendering.
  assert.equal(chair.scriptError, null)
  return captured
}
for (const firstPerson of [false, true]) test(`${firstPerson ? 'first' : 'third'}-person start and release stay attached to the rendered chair`, async () => {
  const results = []
  for (const fps of [30, 60, 120]) for (const taps of [1, 3, 10]) {
    const r = await ride(firstPerson)
    for (let i = 0; i < 5; i++) frame(r, 1 / fps)
    const localFocus = r.p.control.camera.position.clone().sub(r.chair.root.position)
    let maximumFocusError = 0, startError, releaseCamera, releaseChair, releaseDrift = 0
    key(r.control, 'keyW', true)
    for (let i = 0; i < taps + 5; i++) {
      if (i === taps) {
        key(r.control, 'keyW', false)
        releaseCamera = r.p.control.camera.position.clone()
        releaseChair = r.chair.root.position.clone()
      }
      const camera = frame(r, 1 / fps)
      const error = camera.clone().sub(r.chair.root.position).distanceTo(localFocus)
      maximumFocusError = Math.max(maximumFocusError, error)
      if (i === 0) startError = error
      if (i >= taps) {
        releaseDrift = Math.max(releaseDrift, camera.distanceTo(releaseCamera))
        assert(r.chair.root.position.distanceTo(releaseChair) < .000001)
      }
    }
    results.push({ firstPerson, fps, tapFrames: taps, startError, maximumFocusError, releaseDrift })
  }
  cases.push(...results)
  if (baseline && !firstPerson) {
    assert(results.some(r => r.releaseDrift > .01), 'Baseline must reproduce camera catch-up after chair stops')
  } else {
    assert(results.every(r => r.maximumFocusError < .000001 && r.releaseDrift < .000001),
      JSON.stringify(results))
  }
  checks.push(firstPerson ? 'First-person starts and stops with the chair at 30/60/120 FPS'
    : 'Third-person starts and stops with the chair at 30/60/120 FPS')
})
test('scaled rotating chairs and customized avatar offsets keep the native camera on the current posed head', async () => {
  const r = await ride(false, [1.3, 1.6, .8], [.08, -.04, .03])
  for (let i = 0; i < 5; i++) frame(r, 1 / 60)
  key(r.control, 'keyQ', true); key(r.control, 'keyW', true)
  let maximumHeadError = 0
  for (let i = 0; i < 45; i++) {
    const camera = frame(r, 1 / 60)
    const renderedHead = new THREE.Vector3().setFromMatrixPosition(r.p.avatar.getBoneTransform('head'))
    renderedHead.x += .3 // Native shoulder offset at identity camera orientation.
    maximumHeadError = Math.max(maximumHeadError, camera.distanceTo(renderedHead))
  }
  cases.push({ kind: 'scaled-turn', maximumHeadError })
  if (baseline) assert(maximumHeadError > .01)
  else assert(maximumHeadError < .000001, `Camera/head difference ${maximumHeadError}`)
  checks.push('Scaled rotating seat and customized avatar offset match the rendered head')
})
test('initial first-person sitting pose and standing camera retain their native behavior', async () => {
  const r = await ride(true, [1, 1, 1], [.08, -.04, .03])
  const initialCamera = frame(r, 1 / 60)
  const renderedHead = new THREE.Vector3().setFromMatrixPosition(r.p.avatar.getBoneTransform('head'))
  const initialEyeError = initialCamera.distanceTo(renderedHead)
  if (baseline) assert(initialEyeError > .1)
  else assert(initialEyeError < .000001)
  r.p.data.effect = null; r.p.firstPerson = false
  const standing = frame(r, 1 / 60)
  const expected = r.p.base.position.clone().add(new THREE.Vector3(.3, r.p.camHeight, 0))
  assert(standing.distanceTo(expected) < .000001)
  assert.equal(r.p.seatedEyeOffset, null)
  cases.push({ kind: 'initial-sit-and-stand', initialEyeError })
  checks.push('Initial seated eye capture uses the posed head; standing focus and eye cache reset remain native')
})
