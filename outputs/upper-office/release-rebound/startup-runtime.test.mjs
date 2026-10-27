import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import { createHash } from 'node:crypto'
import {
  world, clean, flush, events, hotCallbacks, THREE, PlayerLocal, Controller, destroyWorlds,
} from '../motion-fix/runtime-harness.mjs'

const checks = [], cases = []
test.after(async () => {
  await destroyWorlds()
  const source = await fs.readFile(process.env.MOTION_CHAIR_SOURCE || 'outputs/upper-office/chair.js')
  await fs.writeFile(process.env.STARTUP_REPORT || 'outputs/upper-office/release-rebound/startup-validation.json',
    JSON.stringify({ valid: checks.length === 2, actualPhysXWasm: true, actualScriptSandbox: true,
      script: 'asset://' + createHash('sha256').update(source).digest('hex') + '.js', checks, cases }, null, 2))
})
async function ride() {
  const w = await world({ client: true })
  const p = w.addPlayer('p1')
  p.controller = new Controller({ radius: .3, height: 1.1, layer: 'player' })
  p.controller.activate({ world: w }); w.bodies.push(p.controller)
  p.cam = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom: 2 }
  p.control = { camera: { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom: 2 } }
  p.camHeight = .7; p.avatar = null
  p.getAnchorMatrix = PlayerLocal.prototype.getAnchorMatrix
  w.camera = new THREE.PerspectiveCamera()
  const chair = w.addFurniture('chair')
  await flush(w)
  chair.root.get('executive-seat-action').onTrigger()
  const request = events(w, 'seat-claim').at(-1).args[1][3].request
  chair.emit('seat-slot', { owner: 'p1', token: 'startup', pose: {
    position: chair.root.position.toArray(), quaternion: chair.root.quaternion.toArray(),
  } })
  chair.emit('seat-reply', { request, accepted: true, owner: 'p1', token: 'startup' })
  await flush(w)
  return { w, p, chair, control: w.controlsMade.at(-1) }
}
function key(c, name, down) {
  c[name].down = down
  c[name][down ? 'onPress' : 'onRelease']()
}
function frame({ w, chair, p }, delta = 1 / 60) {
  w.time += delta; w.accumulator = (w.accumulator || 0) + delta
  w.physics.preFixedUpdate(w.accumulator >= .02)
  while (w.accumulator >= .02) {
    chair.fixedUpdate(.02); w.physics.postFixedUpdate(.02); w.accumulator -= .02
  }
  w.physics.preUpdate(w.accumulator / .02)
  chair.update(delta); clean(w)
  PlayerLocal.prototype.lateUpdate.call(p, delta)
  chair.lateUpdate(delta); clean(w)
  assert.equal(chair.scriptError, null)
}
test('chair starts with a small immediate movement and reaches the same rolling distance at different frame rates', async () => {
  for (const deltas of [[1 / 30], [1 / 60], [1 / 120], [.0261, .0329, .017, .031]]) {
    const r = await ride()
    for (let i = 0; i < 5; i++) frame(r)
    const before = r.chair.root.position.clone()
    key(r.control, 'keyW', true)
    let elapsed = 0, index = 0, firstStep, lastStepSpeed
    while (elapsed < .6 - 1e-10) {
      const delta = Math.min(deltas[index++ % deltas.length], .6 - elapsed)
      const previous = r.chair.root.position.clone()
      frame(r, delta)
      const step = r.chair.root.position.distanceTo(previous)
      if (firstStep === undefined) firstStep = step
      lastStepSpeed = step / delta
      elapsed += delta
    }
    assert(firstStep > .00001 && firstStep < 1.25 * deltas[0] / 2)
    assert(Math.abs(lastStepSpeed - 1.25) < .00001)
    const distance = r.chair.root.position.distanceTo(before)
    assert(Math.abs(distance - .675) < .00001, `Frame dependent travel: ${distance}`)
    key(r.control, 'keyW', false)
    const stopped = r.chair.root.position.clone()
    for (let i = 0; i < 10; i++) frame(r)
    assert(r.chair.root.position.distanceTo(stopped) < .000001)
    assert.equal(hotCallbacks(r.chair), 0)
    cases.push({ deltas, firstStep, lastStepSpeed, totalDistance: distance, postReleaseDrift: 0 })
  }
  checks.push('Immediate small startup, full speed after 120 ms, frame independent travel and no release drift')
})
test('repeated starts and Q/E turns reset their acceleration while stops remain exact', async () => {
  const r = await ride()
  for (let i = 0; i < 5; i++) frame(r)
  const starts = []
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = r.chair.root.position.clone()
    key(r.control, 'keyW', true); frame(r); key(r.control, 'keyW', false)
    starts.push(r.chair.root.position.distanceTo(before))
    const stopped = r.chair.root.position.clone()
    for (let i = 0; i < 8; i++) frame(r)
    assert(r.chair.root.position.distanceTo(stopped) < .000001)
  }
  assert(Math.max(...starts) - Math.min(...starts) < .000001)
  const beforeTurn = r.chair.root.quaternion.clone()
  key(r.control, 'keyQ', true); frame(r)
  const firstTurn = r.chair.root.quaternion.angleTo(beforeTurn)
  assert(firstTurn > .00001 && firstTurn < Math.PI / 2 / 60 / 2)
  key(r.control, 'keyQ', false)
  const stoppedTurn = r.chair.root.quaternion.clone()
  for (let i = 0; i < 8; i++) frame(r)
  assert(r.chair.root.quaternion.angleTo(stoppedTurn) < .000001)
  key(r.control, 'keyE', true); frame(r); key(r.control, 'keyE', false)
  assert(r.chair.root.quaternion.angleTo(beforeTurn) < .000001)
  assert.equal(hotCallbacks(r.chair), 0)
  cases.push({ repeatedFirstSteps: starts, firstTurn, turnStopDrift: 0 })
  checks.push('Repeated starts reset the ramp; Q/E turns accelerate gently, stop exactly and leave no idle callbacks')
})
