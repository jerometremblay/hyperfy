import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import { createHash } from 'node:crypto'
import {
  world, clean, flush, claim, events, hotCallbacks, THREE, destroyWorlds,
  Controller, PlayerLocal, simpleCamLerp,
} from '../motion-fix/runtime-harness.mjs'

const checks = [], metrics = {}
test.after(async () => {
  await destroyWorlds()
  const source = await fs.readFile(process.env.MOTION_CHAIR_SOURCE || 'outputs/upper-office/chair.js')
  await fs.writeFile(process.env.RIDER_REPORT || 'outputs/upper-office/rider-control/validation.json',
    JSON.stringify({ valid: checks.length === 9, actualPhysXWasm: true,
      actualScriptSandbox: true, actualPlayerLateUpdateAndCamera: true, checks, metrics,
      script: 'asset://' + createHash('sha256').update(source).digest('hex') + '.js' }, null, 2))
})
function frame(w, chair, p, delta = 1 / 60) {
  w.time += delta
  w.accumulator = (w.accumulator || 0) + delta
  w.physics.preFixedUpdate(w.accumulator >= .02)
  while (w.accumulator >= .02) {
    chair.fixedUpdate(.02)
    w.physics.postFixedUpdate(.02)
    w.accumulator -= .02
  }
  w.physics.preUpdate(w.accumulator / .02)
  chair.update(delta)
  clean(w)
  if (p) PlayerLocal.prototype.lateUpdate.call(p, delta)
  chair.lateUpdate(delta)
  clean(w)
  assert.equal(chair.scriptError, null)
}
function localPlayer(w) {
  const p = w.addPlayer('p1')
  p.controller = new Controller({ radius: .3, height: 1.1, layer: 'player' })
  p.controller.activate({ world: w })
  w.bodies.push(p.controller)
  p.cam = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom: 2 }
  p.control = { camera: { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom: 2 } }
  p.camHeight = .7; p.avatar = null
  p.aura = { position: new THREE.Vector3() }
  p.getAnchorMatrix = PlayerLocal.prototype.getAnchorMatrix
  w.camera = new THREE.PerspectiveCamera()
  return p
}
async function sit(w, chair, token = 'ride') {
  chair.root.get('executive-seat-action').onTrigger()
  const request = events(w, 'seat-claim').at(-1).args[1][3].request
  chair.emit('seat-slot', { owner: 'p1', token, pose: {
    position: chair.root.position.toArray(), quaternion: chair.root.quaternion.toArray(),
  } })
  chair.emit('seat-reply', { request, accepted: true, owner: 'p1', token })
  await flush(w)
  return w.controlsMade.at(-1)
}
function key(c, name, held) {
  c[name].down = held
  c[name][held ? 'onPress' : 'onRelease']()
}
async function pair({ avatar = false, observer = false, wall = false } = {}) {
  const s = await world(); s.addPlayer('p1'); s.addPlayer('p2')
  const authoritative = s.addFurniture('chair')
  const c = await world({ client: true })
  const p = avatar ? localPlayer(c) : c.addPlayer('p1')
  const chair = c.addFurniture('chair')
  const o = observer ? await world({ client: true, id: 'p2' }) : null
  if (o) o.addPlayer('p2')
  const other = o?.addFurniture('chair')
  if (wall) for (const w of [s, c, o].filter(Boolean)) w.box([8, 2.5, .2], [0, 1.25, -2])
  await flush(s); await flush(c); if (o) await flush(o)
  chair.root.get('executive-seat-action').onTrigger()
  const request = events(c, 'seat-claim').at(-1).args[1][3].request
  const token = claim(s, authoritative, 'p1', request)
  const slot = events(s, 'seat-slot').at(-1).args[1][3]
  chair.emit('seat-slot', structuredClone(slot))
  other?.emit('seat-slot', structuredClone(slot))
  chair.emit('seat-reply', structuredClone(events(s, 'seat-reply', 'p1').at(-1).args[1][3]))
  await flush(s); await flush(c); if (o) await flush(o)
  return { s, authoritative, c, chair, p: avatar ? p : null, o, other, token, control: c.controlsMade.at(-1) }
}
function network(ride, uplink = [65, 95, 75], downlink = [80]) {
  let ci = ride.c.networkMessages.length, si = ride.s.networkMessages.length, up = 0, down = 0
  const queue = [], last = { server: 0, client: 0 }
  const collect = (w, index, to, time) => {
    for (const m of w.networkMessages.slice(index)) {
      if (m.args[0] !== 'entityEvent') continue
      const [, , name, data] = m.args[1]
      const latency = to === 'server' ? uplink[up++ % uplink.length] : downlink[down++ % downlink.length]
      const at = Math.max(time + latency / 1000, last[to] + .001)
      last[to] = at
      queue.push({ to, at, name, data: structuredClone(data) })
    }
    return w.networkMessages.length
  }
  return time => {
    ci = collect(ride.c, ci, 'server', time)
    si = collect(ride.s, si, 'client', time)
    for (const item of [...queue].sort((a, b) => a.at - b.at)) {
      if (item.at > time) continue
      queue.splice(queue.indexOf(item), 1)
      if (item.to === 'server') ride.authoritative.emit(item.name, item.data, 'p1')
      else { ride.chair.emit(item.name, item.data); ride.other?.emit(item.name, item.data) }
    }
  }
}
test('short taps preserve their exact local distance across frame rates and network jitter', async () => {
  const results = []
  for (const fps of [30, 60, 120]) for (const delays of [[0], [80], [95, 65], [65, 95]]) {
    for (const taps of [1, 3]) {
      const ride = await pair()
      const net = network(ride, delays)
      let peak = 0, stopped
      for (let i = 1; i <= fps; i++) {
        if (i === 4) key(ride.control, 'keyW', true)
        if (i === 4 + taps) {
          key(ride.control, 'keyW', false)
          stopped = ride.chair.root.position.clone()
        }
        net(i / fps)
        frame(ride.s, ride.authoritative, null, 1 / fps)
        frame(ride.c, ride.chair, null, 1 / fps)
        peak = Math.max(peak, -ride.chair.root.position.z)
      }
      const end = -ride.chair.root.position.z
      results.push({ fps, tapMs: taps * 1000 / fps, delaysMs: delays, peakDistance: peak,
        finalDistance: end, backwardsMetres: peak - end,
        stopDrift: ride.chair.root.position.distanceTo(stopped),
        serverError: ride.chair.root.position.distanceTo(ride.authoritative.root.position) })
    }
  }
  metrics.shortTaps = results
  assert(results.every(r => r.backwardsMetres < .00001 && r.stopDrift < .00001),
    `Tap rebounds: ${JSON.stringify(results.filter(r => r.backwardsMetres >= .00001 || r.stopDrift >= .00001))}`)
  assert(results.every(r => r.serverError < .00001), 'Server must eventually store the exact rider pose')
  checks.push('24 short-tap cases at 30/60/120 FPS and varying delay: no rebound, no stop drift, exact eventual consistency')
})
for (const wall of [true, false]) test(wall
  ? 'multiplayer physical rolling stops at walls without corrections or camera flicker'
  : 'multiplayer Q/E and WASD keeps the avatar attached and remote observers converge', async () => {
  const ride = await pair({ avatar: true, observer: true, wall })
  const net = network(ride)
  let previous = ride.chair.root.position.clone(), previousQ = ride.chair.root.quaternion.clone()
  let largestStep = 0, largestYawStep = 0, avatarError = 0, avatarYawError = 0, minimumZoom = 2
  key(ride.control, 'keyW', true)
  for (let i = 1; i <= 200; i++) {
    if (!wall && i === 40) key(ride.control, 'keyQ', true)
    if (!wall && i === 75) { key(ride.control, 'keyQ', false); key(ride.control, 'keyE', true) }
    if (!wall && i === 110) key(ride.control, 'keyE', false)
    if (i === 140) key(ride.control, 'keyW', false)
    net(i / 60)
    frame(ride.s, ride.authoritative)
    frame(ride.c, ride.chair, ride.p)
    frame(ride.o, ride.other)
    if (i === 1) assert(ride.chair.root.position.z < -.0001, 'First frame must respond without a round trip')
    largestStep = Math.max(largestStep, ride.chair.root.position.distanceTo(previous))
    largestYawStep = Math.max(largestYawStep, ride.chair.root.quaternion.angleTo(previousQ))
    previous.copy(ride.chair.root.position); previousQ.copy(ride.chair.root.quaternion)
    const anchor = ride.c.anchors.get('chair:executive-seat')
    avatarError = Math.max(avatarError, ride.p.base.position.distanceTo(new THREE.Vector3().setFromMatrixPosition(anchor)))
    avatarYawError = Math.max(avatarYawError, ride.p.base.quaternion.angleTo(new THREE.Quaternion().setFromRotationMatrix(anchor)))
    minimumZoom = Math.min(minimumZoom, ride.p.control.camera.zoom)
    assert(Math.abs(ride.chair.root.position.y) < .008)
    if (wall) assert(ride.chair.root.position.z > -1.406, 'Caster base must stop before the wall')
  }
  assert(largestStep < .022 && largestYawStep < .027)
  assert(avatarError < .000001 && avatarYawError < .00001 && minimumZoom > .3)
  assert(ride.authoritative.root.position.distanceTo(ride.chair.root.position) < .00001)
  assert(ride.other.root.position.distanceTo(ride.chair.root.position) < .00001)
  assert(ride.authoritative.root.quaternion.angleTo(ride.chair.root.quaternion) < .00001)
  assert(ride.other.root.quaternion.angleTo(ride.chair.root.quaternion) < .00001)
  for (const a of [ride.authoritative, ride.chair, ride.other]) assert.equal(hotCallbacks(a), 0)
  assert.equal(ride.authoritative.worldNodes.size, 0, 'Server must not independently simulate the chair')
  assert.equal(ride.other.worldNodes.size, 0)
  assert.equal(ride.o.physics.handles.size, 6 + Number(wall), 'Observers retain all five physical boxes')
  assert(!ride.s.networkMessages.some(m => m.args[0] === 'entityModified'), 'No ride-time app rebuilds')
  metrics[wall ? 'wallRide' : 'turningRide'] = { largestStep, largestYawStep, avatarError,
    avatarYawError, minimumZoom, drivePackets: events(ride.c, 'chair-drive').length }
  checks.push(wall
    ? 'Native rider collision at walls, immediate response, stable camera and no independent server simulation'
    : 'Native Q/E and WASD: avatar follows position/yaw, physical observers converge and all idle callbacks stop')
})
test('turning and half-seat desk insertion retain native collision and caster motion', async () => {
  const w = await world({ client: true })
  const player = localPlayer(w)
  w.addFurniture('desk')
  const chair = w.addFurniture('chair', [0, .002, -.6], [0, 1, 0, 0])
  await flush(w)
  const c = await sit(w, chair)
  key(c, 'keyW', true)
  for (let i = 0; i < 180; i++) frame(w, chair, player)
  assert(chair.root.position.z > .39 && chair.root.position.z < .45,
    `Desk stop: ${chair.root.position.toArray()}`)
  const stopped = chair.root.position.clone(), wheels = structuredClone(chair.data.state.casters)
  for (let i = 0; i < 60; i++) frame(w, chair, player)
  assert(chair.root.position.distanceTo(stopped) < .00001)
  assert.deepEqual(chair.data.state.casters, wheels, 'Blocked rolling must not spin tires')
  key(c, 'keyW', false); key(c, 'keyQ', true)
  for (let i = 0; i < 120; i++) frame(w, chair, player)
  const turned = chair.root.quaternion.clone(), turnedWheels = structuredClone(chair.data.state.casters)
  assert(turned.angleTo(new THREE.Quaternion(0, 1, 0, 0)) > .1)
  const blocker = [...chair.worldNodes][0]
  assert(blocker.position.z + blocker.radius < .451)
  for (let i = 0; i < 60; i++) frame(w, chair, player)
  assert(chair.root.quaternion.angleTo(turned) < .00001)
  assert.deepEqual(chair.data.state.casters, turnedWheels, 'Blocked turning must stop casters')
  key(c, 'keyQ', false)
  assert.equal(hotCallbacks(chair), 0)
  assert.equal(events(w, 'seat-release').length, 0, 'Q/E must not stand')
  c.space.onPress()
  assert.equal(chair.worldNodes.size, 0)
  assert.equal(hotCallbacks(chair), 0)
  checks.push('Actual U desktop: half-seat insertion, blocked rolling/turning stops wheels, Q/E rotates and Space stops immediately')
})
test('scaled rotating controller remains on the floor and the seat anchor follows', async () => {
  for (const [scale, yaw] of [[[1, 1, 1], 0], [[1.5, 1.5, 1.5], .7], [[2, 1, .5], Math.PI * 75 / 180]]) {
    const w = await world({ client: true })
    localPlayer(w)
    const initial = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
    const chair = w.addFurniture('chair', [0, .002, 0], initial.toArray(), scale)
    await flush(w)
    const c = await sit(w, chair)
    key(c, 'keyQ', true)
    for (let i = 0; i < 60; i++) frame(w, chair)
    // One second includes the 120 ms startup ramp: 60 ms less full-speed travel.
    const expected = initial.clone().multiply(new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2 * .94))
    assert(chair.root.quaternion.angleTo(expected) < .00001)
    assert(Math.hypot(chair.root.position.x, chair.root.position.z) < .00001)
    assert(Math.abs(chair.root.position.y) < .008)
    const offset = new THREE.Vector3(0, 0, .2375).multiply(chair.root.scale).applyQuaternion(expected)
    assert([...chair.worldNodes][0].position.clone().sub(chair.root.position).distanceTo(offset) < .00001)
    const seat = new THREE.Vector3(0, .595, -.025).multiply(chair.root.scale)
      .applyQuaternion(expected).add(chair.root.position)
    assert(seat.distanceTo(new THREE.Vector3().setFromMatrixPosition(w.anchors.get('chair:executive-seat'))) < .00001)
    assert(chair.data.state.casters.every(c => Math.abs(c[1]) + Math.abs(c[2]) > .5))
    key(c, 'keyQ', false)
    const paused = chair.root.quaternion.clone()
    chair.emit('chair-pose', { token: 'ride', sequence: 1, position: [0, .002, -1], quaternion: [0, 0, 0, 1] })
    for (let i = 0; i < 10; i++) frame(w, chair)
    assert(chair.root.quaternion.angleTo(paused) < .00001, 'Own echoed poses must never correct the rider')
    assert(Math.hypot(chair.root.position.x, chair.root.position.z) < .00001)
    assert.equal(hotCallbacks(chair), 0)
  }
  checks.push('Identity/uniform/nonuniform rotated scale: floor pivot, aligned native controller and seat, tangent caster rolling and ignored rider echoes')
})
test('exclusive occupancy, valid owner poses and ordered updates preserve server state', async () => {
  const w = await world(); w.addPlayer('p1'); w.addPlayer('p2')
  const chair = w.addFurniture('chair')
  await flush(w)
  const token = claim(w, chair)
  chair.emit('seat-claim', { request: 2 }, 'p2')
  assert.equal(events(w, 'seat-reply', 'p2').at(-1).args[1][3].accepted, false)
  const pose = { token, sequence: 2, position: [1, .002, -1], quaternion: [0, 0, 0, 1],
    casters: Array.from({ length: 5 }, () => [0, 0, 0]) }
  for (const [data, id] of [
    [pose, 'p2'], [{ ...pose, token: 'wrong' }, 'p1'],
    [{ ...pose, position: [NaN, 0, 0] }, 'p1'],
    [{ ...pose, quaternion: [0, 0, 0, 0] }, 'p1'],
    [{ ...pose, casters: [[0, 0, NaN]] }, 'p1'],
  ]) chair.emit('chair-drive', data, id)
  assert(Math.hypot(chair.root.position.x, chair.root.position.z) < .00001)
  chair.emit('chair-drive', pose, 'p1'); clean(w)
  assert.deepEqual(chair.root.position.toArray(), pose.position)
  chair.emit('chair-drive', { ...pose, sequence: 1, position: [5, .002, -5] }, 'p1')
  assert.deepEqual(chair.root.position.toArray(), pose.position)
  assert.equal(chair.worldNodes.size, 0)
  assert.equal(hotCallbacks(chair), 0)
  chair.emit('seat-release', { token: 'wrong' }, 'p1')
  assert.equal(chair.data.state.slot.owner, 'p1')
  w.events.emit('leave', { playerId: 'p1' })
  await flush(w)
  assert.equal(chair.data.state.slot.owner, null)
  assert.deepEqual(chair.data.position, pose.position, 'Disconnect must save the last valid rider pose')
  assert.equal(hotCallbacks(chair), 0)
  checks.push('Exclusive seat, owner/token/finite-pose validation, stale sequence rejection, no server frame loop and disconnect persistence')
})
test('standing sends the exact final pose before release and late joiners receive the current ride', async () => {
  const ride = await pair({ avatar: true })
  const net = network(ride, [95, 65], [80])
  key(ride.control, 'keyW', true); key(ride.control, 'keyQ', true)
  let final, finalQ
  for (let i = 1; i <= 120; i++) {
    if (i === 11) {
      final = ride.chair.root.position.clone(); finalQ = ride.chair.root.quaternion.clone()
      ride.control.space.onPress()
      assert.equal(ride.chair.worldNodes.size, 0)
      assert.equal(hotCallbacks(ride.chair), 0)
    }
    net(i / 60)
    frame(ride.s, ride.authoritative)
    frame(ride.c, ride.chair, ride.p)
  }
  assert(ride.authoritative.root.position.distanceTo(final) < .003)
  assert(ride.authoritative.root.quaternion.angleTo(finalQ) < .00001)
  assert(ride.chair.root.position.distanceTo(final) < .003)
  assert.deepEqual(ride.authoritative.data.quaternion, finalQ.toArray())
  assert.equal(ride.authoritative.data.state.slot.owner, null)
  assert.equal(ride.p.data.effect, null)
  assert.equal(ride.chair.root.get('executive-seat-action').active, true)
  const release = events(ride.c, 'seat-release').at(-1).args[1][3]
  assert(release.pose && new THREE.Vector3(...release.pose.position).distanceTo(final) < .00001)
  const w = await world({ client: true, id: 'p2' }); w.addPlayer('p2')
  const observer = w.addFurniture('chair', [0, .002, 0], [0, 0, 0, 1], [1, 1, 1], {
    slot: { owner: 'p1', token: 'another-ride' },
    pose: { position: [4, .002, 3], quaternion: finalQ.toArray(), casters: release.pose.casters, sequence: 20 },
  })
  await flush(w)
  assert.deepEqual(observer.root.position.toArray(), [4, .002, 3])
  assert(observer.root.quaternion.angleTo(finalQ) < .00001)
  assert.equal(observer.root.get('executive-seat-action').active, false)
  assert.equal(observer.worldNodes.size, 0)
  assert.equal(hotCallbacks(observer), 0)
  checks.push('Immediate Space stop, exact final pose in release, saved yaw/position, safe exit and late-join ride snapshot')
})
test('effect replacement, builder movement and destruction remove control and restore native shells', async () => {
  const w = await world({ client: true })
  const p = localPlayer(w)
  const chair = w.addFurniture('chair')
  await flush(w)
  const c = await sit(w, chair)
  key(c, 'keyW', true)
  for (let i = 0; i < 60; i++) frame(w, chair, p)
  assert(chair.root.position.z < -1, 'Movement must remain local even when replies stop')
  p.setEffect({ snare: .5 })
  await flush(w)
  assert.equal(p.data.effect.snare, .5)
  assert.equal(chair.worldNodes.size, 0)
  assert.equal(hotCallbacks(chair), 0)
  assert.equal(w.physics.handles.size, 7)
  const s = await world(); s.addPlayer('p1')
  const app = s.addFurniture('chair')
  await flush(s); claim(s, app)
  app.modify({ mover: 'builder' })
  app.root.position.set(4, .5, 2); clean(s)
  assert.equal(app.data.state.slot.owner, null)
  app.modify({ mover: null }); frame(s, app); await flush(s)
  assert(Math.abs(app.root.position.y - .002) < .00001)
  assert.equal(hotCallbacks(app), 0)
  chair.unbuild(); await flush(w)
  assert.equal(w.anchors.get('chair:executive-seat'), undefined)
  assert.equal(w.physics.handles.size, 2)
  app.unbuild(); await flush(s)
  assert.equal(s.events.listenerCount('leave'), 0)
  checks.push('No reply dependency, effect replacement preserves the new effect, builder release grounds furniture and destruction removes all ride resources')
})
test('native furniture shells and grounded builder transforms remain intact', async () => {
  const w = await world()
  const desk = w.addFurniture('desk')
  const chair = w.addFurniture('chair', [5, .002, 0])
  await flush(w)
  assert.equal(hotCallbacks(desk), 0); assert.equal(hotCallbacks(chair), 0)
  assert.equal(w.physics.handles.size, 14)
  const down = new THREE.Vector3(0, -1, 0)
  const mask = desk.getWorldProxy().createLayerMask('environment')
  const ray = (x, z) => w.physics.raycast(new THREE.Vector3(x, 2, z), down, 3, mask)
  assert(Math.abs(ray(0, -.65).point.y) < .00001, 'U bay must stay open')
  desk.modify({ mover: 'builder' })
  desk.root.position.set(4, .3, -5)
  desk.root.quaternion.setFromEuler(new THREE.Euler(.17, .7, -.12, 'YXZ'))
  desk.root.scale.set(1.3, .9, 1.1); clean(w)
  desk.modify({ mover: null }); frame(w, desk); await flush(w)
  assert(Math.abs(desk.root.position.y - .002) < .00001)
  assert(Math.abs(desk.root.rotation.x) < .00001 && Math.abs(desk.root.rotation.z) < .00001)
  const sample = new THREE.Vector3(-1.725, 2, -.35).multiply(desk.root.scale)
    .applyQuaternion(desk.root.quaternion).add(desk.root.position)
  const hit = w.physics.raycast(sample, down, 3, mask)
  assert(hit && Math.abs(hit.point.y - (.779 * .9 + .002)) < .00001)
  assert.equal(hotCallbacks(desk), 0)
  const camera = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom: 2 }
  const c = await world({ client: true }); localPlayer(c)
  const seat = c.addFurniture('chair'); await flush(c); await sit(c, seat)
  simpleCamLerp(c, camera, { position: new THREE.Vector3(.3, 1.28, -.025),
    quaternion: new THREE.Quaternion(), zoom: 2 }, 1 / 60)
  assert.equal(camera.zoom, 2)
  checks.push('Native physical desk/chair shells, open U bay, grounded nonuniform builder edits, unchanged floor contact and rider camera clearance')
})
