import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import { createHash } from 'node:crypto'
import {
  world, clean, flush, claim, events, hotCallbacks, THREE, destroyWorlds,
  Controller, PlayerLocal,
} from '../motion-fix/runtime-harness.mjs'

const checks = [], metrics = {}
const up = new THREE.Vector3(0, 1, 0)
test.after(async () => {
  await destroyWorlds()
  const source = await fs.readFile('outputs/upper-office/chair.js')
  await fs.writeFile('outputs/upper-office/rotation/validation.json', JSON.stringify({
    valid: checks.length === 4, actualPhysXWasm: true, actualPlayerLateUpdate: true,
    checks, metrics, script: 'asset://' + createHash('sha256').update(source).digest('hex') + '.js',
  }, null, 2))
})
function frame(w, chair, player, delta = 1 / 60) {
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
  if (player) PlayerLocal.prototype.lateUpdate.call(player, delta)
  chair.lateUpdate(delta)
  clean(w)
  assert.equal(chair.scriptError, null)
}
function input(w, chair, token, frames, turn, x = 0, z = 0) {
  for (let i = 0; i < frames; i++) {
    if (i % 5 === 0) chair.emit('chair-input', { token, x, z, turn }, 'p1')
    w.time += 1 / 60
    chair.fixedUpdate(1 / 60)
    clean(w)
    assert.equal(chair.scriptError, null)
  }
}
function localPlayer(w) {
  const p = w.addPlayer('p1')
  p.controller = new Controller({ radius: .3, height: 1.1, layer: 'player' })
  p.controller.activate({ world: w })
  w.bodies.push(p.controller)
  p.cam = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom: 2 }
  p.control = { camera: { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom: 2 } }
  p.camHeight = .7
  p.avatar = null
  p.aura = { position: new THREE.Vector3() }
  p.getAnchorMatrix = PlayerLocal.prototype.getAnchorMatrix
  w.camera = new THREE.PerspectiveCamera()
  return p
}
async function sitClient(w, chair, token = 'ride') {
  chair.root.get('executive-seat-action').onTrigger()
  const request = events(w, 'seat-claim').at(-1).args[1][3].request
  chair.emit('seat-slot', { owner: 'p1', token, pose: {
    position: chair.root.position.toArray(), quaternion: chair.root.quaternion.toArray(),
  } })
  chair.emit('seat-reply', { request, accepted: true, owner: 'p1', token })
  await flush(w)
  return w.controlsMade.at(-1)
}
test('native turning pivots on the floor, drives caster arcs and persists the final yaw', async () => {
  for (const scale of [[1, 1, 1], [1.5, 1.5, 1.5], [2, 1, .5]]) {
    const w = await world()
    w.addPlayer('p1')
    const initial = new THREE.Quaternion().setFromAxisAngle(up, Math.PI * 75 / 180)
    const chair = w.addFurniture('chair', [0, .002, 0], initial.toArray(), scale)
    await flush(w)
    const token = claim(w, chair)
    await flush(w)
    input(w, chair, token, 60, 1)
    const expected = initial.clone().multiply(new THREE.Quaternion().setFromAxisAngle(up, Math.PI / 2))
    assert(chair.root.quaternion.angleTo(expected) < .00001,
      `Q yaw error ${chair.root.quaternion.angleTo(expected)} at scale ${scale}`)
    assert(Math.hypot(chair.root.position.x, chair.root.position.z) < .00001, 'Rotation must keep the floor pivot fixed')
    assert(Math.abs(chair.root.position.y) < .008)
    const blocker = [...chair.worldNodes][0]
    const offset = new THREE.Vector3(0, 0, .2375).multiply(chair.root.scale).applyQuaternion(expected)
    assert(blocker.position.clone().sub(chair.root.position).distanceTo(offset) < .00001)
    assert(chair.data.state.casters.every(c => Math.abs(c[1]) + Math.abs(c[2]) > .5),
      'Every caster must roll as its swivel travels around the base')
    const worldHeadings = chair.data.state.casters.map(c => c[0])
    assert(worldHeadings.some(c => Math.abs(c - worldHeadings[0]) > .1),
      'Each caster must follow its own tangent, rather than all face one direction')
    input(w, chair, token, 60, -1)
    assert(chair.root.quaternion.angleTo(initial) < .00001, 'E must turn right')
    input(w, chair, token, 30, -1, 0, -1)
    assert(chair.root.position.length() > .5, 'Rolling and turning must work together')
    input(w, chair, token, 4, 0)
    const stopped = structuredClone(chair.data.state.casters)
    for (let i = 0; i < 10; i++) frame(w, chair)
    assert.deepEqual(chair.data.state.casters, stopped)
    assert.equal(hotCallbacks(chair), 0)
    const saved = chair.root.quaternion.toArray()
    chair.emit('seat-release', { token }, 'p1')
    await flush(w)
    assert.deepEqual(chair.data.quaternion, saved, 'Standing must save the turned placement')
    assert.equal(chair.worldNodes.size, 0)
    assert.equal(hotCallbacks(chair), 0)
  }
  checks.push('Q/E floor pivot, scaled collision alignment, turning caster arcs, combined rolling and saved final yaw')
})
test('Q/E are captured turn inputs; simultaneous keys cancel; Space stands safely', async () => {
  const w = await world({ client: true })
  const player = localPlayer(w)
  const chair = w.addFurniture('chair')
  await flush(w)
  const c = await sitClient(w, chair)
  assert(c.keyQ.capture && c.keyE.capture && c.space.capture)
  assert(c.actions.some(a => a.type === 'keyQ' && a.label === 'Turn left'))
  assert(c.actions.some(a => a.type === 'keyE' && a.label === 'Turn right'))
  c.keyE.down = true; c.keyE.onPress()
  assert.equal(events(w, 'chair-input').at(-1).args[1][3].turn, -1)
  assert.equal(events(w, 'seat-release').length, 0, 'E must rotate rather than stand')
  frame(w, chair, player)
  assert(chair.root.quaternion.y < 0, 'Right turn must respond in the first frame')
  c.keyQ.down = true; c.keyQ.onPress()
  const simultaneous = chair.root.quaternion.clone()
  for (let i = 0; i < 5; i++) frame(w, chair, player)
  assert(chair.root.quaternion.angleTo(simultaneous) < .00001)
  assert.equal(events(w, 'chair-input').at(-1).args[1][3].turn, 0)
  c.keyE.down = false; c.keyE.onRelease()
  for (let i = 0; i < 5; i++) frame(w, chair, player)
  c.keyQ.down = false; c.keyQ.onRelease()
  const stopped = chair.root.quaternion.clone()
  chair.emit('chair-pose', { token: 'ride', sequence: 1,
    position: [0, .002, 0], quaternion: new THREE.Quaternion().setFromAxisAngle(up, 1).toArray() })
  for (let i = 0; i < 8; i++) frame(w, chair, player)
  assert(chair.root.quaternion.angleTo(stopped) < .00001, 'Stale turn replies must not resume a released key')
  c.space.onPress()
  assert.equal(events(w, 'seat-release').at(-1).args[1][3].token, 'ride')
  chair.emit('seat-ended', { token: 'ride', exit: [0, .01, 1.1] })
  chair.emit('seat-slot', { owner: null, token: null })
  await flush(w)
  assert.equal(player.data.effect, null)
  assert.equal(chair.worldNodes.size, 0)
  assert.equal(hotCallbacks(chair), 0)
  assert.equal(chair.root.get('executive-seat-action').active, true)
  checks.push('Captured Q/E inputs, immediate response, opposite-key cancellation, stale-reply rejection and Space exit')
})
test('native rear blocker stops turning into the actual desktop without driving blocked wheels', async () => {
  const w = await world()
  const player = w.addPlayer('p1')
  w.addFurniture('desk')
  const chair = w.addFurniture('chair', [0, .002, .43], [0, 1, 0, 0])
  player.base.position.copy(chair.root.position)
  await flush(w)
  const token = claim(w, chair)
  await flush(w)
  input(w, chair, token, 120, 1)
  const turned = chair.root.quaternion.clone()
  assert(turned.angleTo(new THREE.Quaternion(0, 1, 0, 0)) > .1)
  const blocker = [...chair.worldNodes][0]
  assert(blocker.position.z + blocker.radius < .451, 'Rotation must not sweep the rear blocker through the desktop')
  const angle = turned.angleTo(new THREE.Quaternion(0, 1, 0, 0))
  assert(angle < Math.PI, 'The desktop must stop a full half-turn')
  const wheels = structuredClone(chair.data.state.casters)
  input(w, chair, token, 120, 1)
  assert(chair.root.quaternion.angleTo(turned) < .00001)
  assert.deepEqual(chair.data.state.casters, wheels, 'Blocked yaw must stop caster animation')
  assert(Math.hypot(chair.root.position.x, chair.root.position.z - .43) < .001,
    `Collision shifted the chair pivot: ${chair.root.position.toArray()}`)
  input(w, chair, token, 4, 0)
  assert.equal(hotCallbacks(chair), 0)
  metrics.desktopStoppedYawRadians = angle
  checks.push('Native rotating blocker stops at the desktop, holds the floor pivot and stops blocked wheels')
})
test('delayed multiplayer rotation keeps the avatar attached and settles without flicker', async () => {
  const server = await world()
  server.addPlayer('p1')
  const authoritative = server.addFurniture('chair')
  const client = await world({ client: true })
  const player = localPlayer(client)
  const chair = client.addFurniture('chair')
  await flush(server); await flush(client)
  chair.root.get('executive-seat-action').onTrigger()
  const request = events(client, 'seat-claim').at(-1).args[1][3].request
  claim(server, authoritative, 'p1', request)
  chair.emit('seat-slot', structuredClone(events(server, 'seat-slot').at(-1).args[1][3]))
  chair.emit('seat-reply', structuredClone(events(server, 'seat-reply', 'p1').at(-1).args[1][3]))
  await flush(server); await flush(client)
  const c = client.controlsMade.at(-1)
  let ci = client.networkMessages.length, si = server.networkMessages.length, count = 0
  const queue = [], last = { server: 0, client: 0 }
  const collect = (w, start, to, time) => {
    for (const m of w.networkMessages.slice(start)) {
      if (m.args[0] !== 'entityEvent') continue
      const [, , name, data] = m.args[1]
      const at = Math.max(time + [.065, .095, .075][count++ % 3], last[to] + .001)
      last[to] = at
      queue.push({ to, at, name, data: structuredClone(data) })
    }
    return w.networkMessages.length
  }
  let maximumAngleStep = 0, maximumFrameStep = 0, maximumAvatarError = 0, maximumAvatarAngleError = 0
  let previous = chair.root.quaternion.clone(), previousPosition = chair.root.position.clone()
  c.keyQ.down = true; c.keyQ.onPress()
  for (let i = 1; i <= 200; i++) {
    const time = i / 60
    if (i === 45) { c.keyW.down = true; c.keyW.onPress() }
    if (i === 75) {
      c.keyQ.down = false; c.keyQ.onRelease()
      c.keyE.down = true; c.keyE.onPress()
    }
    if (i === 120) {
      c.keyE.down = false; c.keyE.onRelease()
      c.keyW.down = false; c.keyW.onRelease()
    }
    ci = collect(client, ci, 'server', time)
    si = collect(server, si, 'client', time)
    for (const item of [...queue].sort((a, b) => a.at - b.at)) {
      if (item.at > time) continue
      queue.splice(queue.indexOf(item), 1)
      if (item.to === 'server') authoritative.emit(item.name, item.data, 'p1')
      else chair.emit(item.name, item.data)
    }
    frame(server, authoritative)
    frame(client, chair, player)
    if (i === 1) assert(chair.root.quaternion.y > .005, 'Rotation must respond without a network round trip')
    maximumAngleStep = Math.max(maximumAngleStep, chair.root.quaternion.angleTo(previous))
    maximumFrameStep = Math.max(maximumFrameStep, chair.root.position.distanceTo(previousPosition))
    previous.copy(chair.root.quaternion)
    previousPosition.copy(chair.root.position)
    const anchor = client.anchors.get('chair:executive-seat')
    maximumAvatarError = Math.max(maximumAvatarError,
      player.base.position.distanceTo(new THREE.Vector3().setFromMatrixPosition(anchor)))
    const anchorQuaternion = new THREE.Quaternion().setFromRotationMatrix(anchor)
    maximumAvatarAngleError = Math.max(maximumAvatarAngleError, player.base.quaternion.angleTo(anchorQuaternion))
    assert(Math.abs(chair.root.position.y) < .008)
    assert(player.control.camera.zoom > .3)
  }
  assert(maximumAngleStep < .06, `Visible yaw snap: ${maximumAngleStep}`)
  assert(maximumFrameStep < .04, `Visible position snap: ${maximumFrameStep}`)
  assert(maximumAvatarError < .000001)
  assert(maximumAvatarAngleError < .00001)
  assert(chair.root.quaternion.angleTo(authoritative.root.quaternion) < .00001)
  assert(chair.root.position.distanceTo(authoritative.root.position) < .01)
  assert.equal(hotCallbacks(chair), 0)
  assert.equal(hotCallbacks(authoritative), 0)
  assert(!server.networkMessages.some(m => m.args[0] === 'entityModified'))
  const inputPackets = events(client, 'chair-input').length
  assert(inputPackets < 35)
  metrics.multiplayer = { maximumAngleStep, maximumFrameStep, maximumAvatarError,
    maximumAvatarAngleError, inputPackets, latencyRangeMs: [65, 95] }
  checks.push('Native delayed Q/E and WASD ride: attached avatar position/yaw, smooth prediction and zero idle callbacks')
})
