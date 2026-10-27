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
  await fs.writeFile(process.env.MOMENTUM_REPORT || 'outputs/upper-office/momentum/validation.json',
    JSON.stringify({ valid: checks.length === 5, actualPhysXWasm: true, actualScriptSandbox: true,
      actualPlayerLateUpdate: true,
      script: 'asset://' + createHash('sha256').update(source).digest('hex') + '.js',
      checks, cases }, null, 2))
})
async function ride({ scale = [1, 1, 1], yaw = 0, zoom = 2 } = {}) {
  const w = await world({ client: true })
  const p = w.addPlayer('p1')
  p.controller = new Controller({ radius: .3, height: 1.1, layer: 'player' })
  p.controller.activate({ world: w }); w.bodies.push(p.controller)
  p.cam = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom }
  p.control = { camera: { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom } }
  p.camHeight = .7; p.avatar = null
  p.getAnchorMatrix = PlayerLocal.prototype.getAnchorMatrix
  w.camera = new THREE.PerspectiveCamera()
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
  const chair = w.addFurniture('chair', [0, .002, 0], q.toArray(), scale)
  await flush(w)
  chair.root.get('executive-seat-action').onTrigger()
  const request = events(w, 'seat-claim').at(-1).args[1][3].request
  chair.emit('seat-slot', { owner: 'p1', token: 'momentum', pose: {
    position: chair.root.position.toArray(), quaternion: chair.root.quaternion.toArray(),
  } })
  chair.emit('seat-reply', { request, accepted: true, owner: 'p1', token: 'momentum' })
  await flush(w)
  const r = { w, p, chair, control: w.controlsMade.at(-1) }
  for (let i = 0; i < 5; i++) frame(r)
  return r
}
function key(r, name, held) {
  r.control[name].down = held
  r.control[name][held ? 'onPress' : 'onRelease']()
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
  const anchor = w.anchors.get('chair:executive-seat')
  assert(p.base.position.distanceTo(new THREE.Vector3().setFromMatrixPosition(anchor)) < 1e-6)
  assert(Math.abs(chair.root.position.y) < .008, 'Chair must stay on the floor')
}
function run(r, seconds, deltas = [1 / 60], sample = () => {}) {
  let elapsed = 0, index = 0
  while (elapsed < seconds - 1e-10) {
    const delta = Math.min(deltas[index++ % deltas.length], seconds - elapsed)
    const before = r.chair.root.position.clone()
    frame(r, delta)
    elapsed += delta
    sample({ delta, elapsed, step: r.chair.root.position.distanceTo(before) })
  }
}
test('translation accelerates and coasts to a finite stop without rebound at different frame rates and camera views', async () => {
  for (const zoom of [0, 2]) {
    for (const deltas of [[1 / 30], [1 / 60], [1 / 120], [.0261, .0329, .017, .031], [.08]]) {
      const r = await ride({ zoom })
      const start = r.chair.root.position.clone()
      key(r, 'keyW', true)
      let firstStep, fullSpeed
      run(r, .6, deltas, ({ delta, step }) => {
        firstStep ??= step
        fullSpeed = step / delta
      })
      assert(firstStep > 0 && firstStep < 1.25 * deltas[0] / 2)
      assert(Math.abs(fullSpeed - 1.25) < 1e-5)
      assert(Math.abs(r.chair.root.position.distanceTo(start) - .59375) < 1e-5)
      key(r, 'keyW', false)
      const released = r.chair.root.position.clone()
      assert(hotCallbacks(r.chair) > 0, 'Simulation must continue while coasting')
      const wheelStart = structuredClone(r.chair.data.state.casters)
      let previousZ = released.z, previousSpeed = 1.25
      run(r, .8, deltas, ({ delta, step }) => {
        assert(r.chair.root.position.z <= previousZ + 1e-6, 'Release cannot move backward')
        assert(step / delta <= previousSpeed + 1e-5, 'Coast must slow down')
        previousZ = r.chair.root.position.z; previousSpeed = step / delta
      })
      const coast = r.chair.root.position.distanceTo(released)
      assert(Math.abs(coast - .3125) < 1e-5, `Coast varies with FPS: ${coast}`)
      assert.notDeepEqual(r.chair.data.state.casters, wheelStart, 'Casters must roll through the coast')
      const stopped = r.chair.root.position.clone()
      const wheels = structuredClone(r.chair.data.state.casters)
      const packetCount = events(r.w, 'chair-drive').length
      run(r, .4, deltas)
      assert(r.chair.root.position.distanceTo(stopped) < 1e-6)
      assert.deepEqual(r.chair.data.state.casters, wheels)
      assert.equal(events(r.w, 'chair-drive').length, packetCount)
      assert.equal(hotCallbacks(r.chair), 0)
      const final = events(r.w, 'chair-drive').at(-1).args[1][3]
      assert(new THREE.Vector3(...final.position).distanceTo(stopped) < 1e-6)
      cases.push({ zoom, deltas, firstStep, fullSpeed, coast, idleCallbacks: 0 })
    }
  }
  checks.push('30/60/120 FPS, varying and 80 ms frames, both camera views: gentle acceleration, 31.25 cm coast, no rebound, exact final packet and no idle work')
})
test('reversals brake existing momentum, diagonal speed is bounded, and repeated starts remain gentle', async () => {
  const r = await ride()
  key(r, 'keyW', true); run(r, .6)
  const released = r.chair.root.position.clone()
  key(r, 'keyW', false); key(r, 'keyS', true)
  frame(r)
  assert(r.chair.root.position.z < released.z, 'Opposite push must first brake the moving chair')
  run(r, .6)
  const previous = r.chair.root.position.clone()
  frame(r)
  assert(r.chair.root.position.z > previous.z)
  key(r, 'keyS', false); run(r, .8)
  const starts = []
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = r.chair.root.position.clone()
    key(r, 'keyW', true); frame(r); key(r, 'keyW', false)
    starts.push(r.chair.root.position.distanceTo(before))
    run(r, .3)
    assert.equal(hotCallbacks(r.chair), 0)
  }
  assert(Math.max(...starts) - Math.min(...starts) < 1e-6)
  key(r, 'keyW', true); key(r, 'keyD', true)
  let speed
  run(r, .6, [1 / 60], ({ delta, step }) => { speed = step / delta })
  assert(Math.abs(speed - 1.25) < 1e-5, 'Diagonal movement must not gain speed')
  cases.push({ repeatedStarts: starts, diagonalSpeed: speed })
  checks.push('Continuous reversals, diagonal speed limit and gentle repeated starts')
})
test('Q/E turns accelerate and settle without snapping, while rolling momentum remains in world space', async () => {
  for (const scale of [[1, 1, 1], [1.5, 1.5, 1.5], [2, 1, .5]]) {
    const r = await ride({ scale, yaw: .7 })
    const start = r.chair.root.quaternion.clone()
    key(r, 'keyQ', true)
    frame(r)
    assert(r.chair.root.quaternion.angleTo(start) < .002)
    run(r, .6 - 1 / 60)
    const released = r.chair.root.quaternion.clone()
    key(r, 'keyQ', false); run(r, .5)
    const coast = r.chair.root.quaternion.angleTo(released)
    assert(Math.abs(coast - (Math.PI / 2) ** 2 / 16) < 1e-5)
    const stopped = r.chair.root.quaternion.clone()
    run(r, .2)
    assert(r.chair.root.quaternion.angleTo(stopped) < 1e-6)
    assert(Math.hypot(r.chair.root.position.x, r.chair.root.position.z) < 1e-5)
    assert.equal(hotCallbacks(r.chair), 0)
    key(r, 'keyE', true); run(r, .6); key(r, 'keyE', false); run(r, .5)
    assert(r.chair.root.quaternion.angleTo(start) < 1e-5)
    key(r, 'keyW', true); run(r, .6); key(r, 'keyW', false)
    const from = r.chair.root.position.clone()
    key(r, 'keyQ', true); run(r, .6); key(r, 'keyQ', false); run(r, .5)
    const travel = r.chair.root.position.clone().sub(from)
    const intended = new THREE.Vector3(0, 0, -1).applyQuaternion(start).multiplyScalar(.3125)
    assert(travel.distanceTo(intended) < 1e-5, 'Turning cannot redirect unpowered momentum')
    cases.push({ scale, angularCoastRadians: coast, unpoweredTravel: travel.toArray() })
  }
  checks.push('Q/E acceleration and short angular coast, scale-safe floor pivot, stable stops and world-space rolling momentum')
})
test('coasting into walls stops physically and cannot store a burst of motion', async () => {
  const r = await ride()
  r.w.box([8, 2.5, .2], [0, 1.25, -1.35])
  clean(r.w)
  key(r, 'keyW', true); run(r, .6); key(r, 'keyW', false)
  run(r, .8)
  assert(r.chair.root.position.z > -.756, 'Caster base must stay outside the wall')
  const stopped = r.chair.root.position.clone()
  run(r, .4)
  assert(r.chair.root.position.distanceTo(stopped) < 1e-6)
  assert.equal(hotCallbacks(r.chair), 0)
  key(r, 'keyW', true); run(r, 1)
  const before = r.chair.root.position.clone()
  key(r, 'keyW', false); key(r, 'keyS', true); frame(r)
  const firstStep = r.chair.root.position.distanceTo(before)
  assert(firstStep > 0 && firstStep < .001)
  cases.push({ wallStop: stopped.toArray(), firstStepAwayFromWall: firstStep })
  checks.push('Physical coast-to-wall stop and no momentum buildup under blocked input')
})
test('standing during the coast immediately stops and releases all movement resources', async () => {
  const r = await ride()
  key(r, 'keyW', true); key(r, 'keyQ', true); run(r, .3)
  key(r, 'keyW', false); key(r, 'keyQ', false)
  frame(r)
  const position = r.chair.root.position.clone(), quaternion = r.chair.root.quaternion.clone()
  r.control.space.onPress()
  assert.equal(r.chair.worldNodes.size, 0)
  assert.equal(hotCallbacks(r.chair), 0)
  run(r, .5)
  assert(r.chair.root.position.distanceTo(position) < 1e-6)
  assert(r.chair.root.quaternion.angleTo(quaternion) < 1e-6)
  const release = events(r.w, 'seat-release').at(-1).args[1][3]
  assert(new THREE.Vector3(...release.pose.position).distanceTo(position) < 1e-6)
  checks.push('Space during coast stops immediately, publishes exact final pose and removes controller/callbacks')
})
