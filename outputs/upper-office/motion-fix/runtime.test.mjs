import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {
  world, clean, flush, events, claim, hotCallbacks, THREE, Controller,
  PlayerLocal, simpleCamLerp, destroyWorlds,
} from './runtime-harness.mjs'

const checks = []
const metrics = {}
test.after(async () => {
  await destroyWorlds()
  await fs.writeFile('outputs/upper-office/motion-fix/runtime-validation.json',
    JSON.stringify({ valid: checks.length === 5, actualPhysXWasm: true,
      actualPlayerLateUpdateAndCamera: true, checks, metrics }, null, 2))
})
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
test('rider camera excludes their chair and standing restores physical collision', async () => {
  const w = await world({ client: true })
  localPlayer(w)
  const chair = w.addFurniture('chair')
  await flush(w)
  await sit(w, chair)
  const camera = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom: 2 }
  const target = { position: new THREE.Vector3(.3, 1.28, -.025), quaternion: new THREE.Quaternion(), zoom: 2 }
  simpleCamLerp(w, camera, target, 1 / 60)
  assert.equal(camera.zoom, 2, 'Backrest must not push the rider camera into the chair')
  assert.equal(chair.worldNodes.size, 1)
  assert.equal(w.physics.handles.size, 3, 'Only floor, player CCT and chair CCT should be mounted')
  chair.emit('seat-ended', { token: 'ride', exit: [0, .01, 1.1] })
  chair.emit('seat-slot', { owner: null, token: null })
  await flush(w)
  assert.equal(chair.worldNodes.size, 0)
  assert.equal(w.physics.handles.size, 7, 'Restore all five physical chair boxes')
  assert.equal(hotCallbacks(chair), 0)
  checks.push('camera remains clear during a ride; standing restores five physical boxes')
})
for (const wall of [true, false]) test(wall
  ? 'delayed multiplayer ride responds immediately, collides and keeps avatar attached'
  : 'open-floor WASD reversals settle smoothly despite variable network delay', async () => {
  const server = await world()
  server.addPlayer('p1')
  const authoritative = server.addFurniture('chair')
  const client = await world({ client: true })
  const player = localPlayer(client)
  const chair = client.addFurniture('chair')
  if (wall) for (const w of [server, client]) w.box([8, 2.5, .2], [0, 1.25, -2])
  await flush(server); await flush(client)
  chair.root.get('executive-seat-action').onTrigger()
  const request = events(client, 'seat-claim').at(-1).args[1][3].request
  const token = claim(server, authoritative, 'p1', request)
  chair.emit('seat-slot', structuredClone(events(server, 'seat-slot').at(-1).args[1][3]))
  chair.emit('seat-reply', structuredClone(events(server, 'seat-reply', 'p1').at(-1).args[1][3]))
  await flush(server); await flush(client)
  const control = client.controlsMade.at(-1)
  let clientIndex = client.networkMessages.length, serverIndex = server.networkMessages.length
  const queue = []
  let deliveryCount = 0, lastDelivery = { client: 0, server: 0 }
  const collect = (w, start, to, time) => {
    const list = w.networkMessages.slice(start)
    for (const message of list) {
      if (message.args[0] !== 'entityEvent') continue
      const [, , name, data] = message.args[1]
      const latency = [.065, .095, .075][deliveryCount++ % 3]
      const at = Math.max(time + latency, lastDelivery[to] + .001)
      lastDelivery[to] = at
      queue.push({ to, at, name, data: structuredClone(data) })
    }
    return w.networkMessages.length
  }
  const initial = chair.root.position.clone()
  control.keyW.down = true
  control.keyW.onPress()
  let firstMovement = null, largestAvatarError = 0, maximumFrameStep = 0
  let previous = chair.root.position.clone()
  let smallestCameraZoom = 2
  for (let i = 1; i <= 220; i++) {
    const time = i / 60
    if (!wall && [45, 90, 120].includes(i)) {
      const next = { 45: 'keyD', 90: 'keyS', 120: 'keyA' }[i]
      const held = ['keyW', 'keyD', 'keyS', 'keyA'].find(key => control[key].down)
      control[held].down = false
      control[held].onRelease()
      control[next].down = true
      control[next].onPress()
    }
    if (i === 150) {
      const held = ['keyW', 'keyD', 'keyS', 'keyA'].find(key => control[key].down)
      control[held].down = false
      control[held].onRelease()
    }
    clientIndex = collect(client, clientIndex, 'server', time)
    serverIndex = collect(server, serverIndex, 'client', time)
    for (const item of [...queue].sort((a, b) => a.at - b.at)) {
      if (item.at > time) continue
      queue.splice(queue.indexOf(item), 1)
      if (item.to === 'server') authoritative.emit(item.name, item.data, 'p1')
      else chair.emit(item.name, item.data)
    }
    frame(server, authoritative)
    frame(client, chair, player)
    if (firstMovement === null && chair.root.position.distanceTo(initial) > .005) firstMovement = time
    const anchor = client.anchors.get('chair:executive-seat')
    largestAvatarError = Math.max(largestAvatarError,
      player.base.position.distanceTo(new THREE.Vector3().setFromMatrixPosition(anchor)))
    maximumFrameStep = Math.max(maximumFrameStep, chair.root.position.distanceTo(previous))
    previous.copy(chair.root.position)
    smallestCameraZoom = Math.min(smallestCameraZoom, player.control.camera.zoom)
    if (wall) {
      const localBlocker = [...chair.worldNodes][0]
      const serverBlocker = [...authoritative.worldNodes][0]
      assert(localBlocker.position.z - localBlocker.radius > -1.901,
        'Local rear-half blocker must collide with the wall')
      assert(serverBlocker.position.z - serverBlocker.radius > -1.901,
        'Authoritative rear-half blocker must collide with the wall')
    }
    assert(Math.abs(chair.root.position.y) < .008)
  }
  assert(firstMovement <= 1 / 60, `Input response delayed by ${firstMovement}s`)
  assert(largestAvatarError < .000001)
  assert(maximumFrameStep < .04, `Visible snap during movement: ${maximumFrameStep}m`)
  assert(smallestCameraZoom > .3, 'Own backrest must not pull the moving camera into the chair')
  assert(chair.root.position.distanceTo(authoritative.root.position) < .01, 'Stop must settle to the server pose')
  assert.equal(hotCallbacks(chair), 0)
  assert.equal(hotCallbacks(authoritative), 0)
  assert(!server.networkMessages.some(m => m.args[0] === 'entityModified'), 'No ride-time app rebuilds')
  const inputPackets = events(client, 'chair-input').length
  assert(inputPackets < (wall ? 30 : 40), 'Prediction must not increase the input packet rate')
  metrics[wall ? 'multiplayer' : 'openFloorReversals'] = { firstMovement, largestAvatarError, maximumFrameStep, smallestCameraZoom,
    finalPoseError: chair.root.position.distanceTo(authoritative.root.position), inputPackets,
    serverPosePackets: events(server, 'chair-pose').length, latencyRangeMs: [65, 95] }
  checks.push(wall
    ? 'native delayed multiplayer ride: immediate input, collision, attached avatar, smooth motion and zero idle callbacks'
    : 'open-floor WASD reversals: smooth server reconciliation, attached avatar and zero idle callbacks')
})
test('stale replies cannot restart a released input; loss of server replies bounds prediction', async () => {
  const w = await world({ client: true })
  const player = localPlayer(w)
  const chair = w.addFurniture('chair')
  await flush(w)
  const control = await sit(w, chair)
  control.keyW.down = true; control.keyW.onPress()
  for (let i = 0; i < 10; i++) frame(w, chair, player)
  control.keyW.down = false; control.keyW.onRelease()
  const stopped = chair.root.position.clone()
  chair.emit('chair-pose', { token: 'ride', sequence: 1, position: [0, .002, -1],
    quaternion: [0, 0, 0, 1] })
  for (let i = 0; i < 10; i++) frame(w, chair, player)
  assert(chair.root.position.distanceTo(stopped) < .002, 'A stale held-key reply must not move the stopped chair')
  control.keyD.down = true; control.keyD.onPress()
  for (let i = 0; i < 60; i++) frame(w, chair, player)
  const disconnected = chair.root.position.clone()
  for (let i = 0; i < 30; i++) frame(w, chair, player)
  assert(chair.root.position.distanceTo(disconnected) < .002, 'Prediction must stop without server replies')
  player.setEffect({ snare: .5 })
  await flush(w)
  assert.equal(chair.worldNodes.size, 0)
  assert.equal(hotCallbacks(chair), 0)
  assert.equal(player.data.effect.snare, .5)
  checks.push('stale replies rejected, disconnected prediction bounded, replacement effect removes controller and callbacks')
})
test('other clients retain a physical chair and interpolate authoritative poses', async () => {
  const w = await world({ client: true, id: 'p2' })
  w.addPlayer('p2')
  const chair = w.addFurniture('chair', [0, .002, 0], [0, 0, 0, 1], [1, 1, 1],
    { slot: { owner: 'p1', token: 'remote' } })
  await flush(w)
  assert.equal(chair.worldNodes.size, 0)
  assert.equal(w.physics.handles.size, 6)
  chair.emit('chair-pose', { token: 'remote', sequence: 1, position: [0, .002, -1],
    quaternion: [0, 0, 0, 1] })
  frame(w, chair)
  assert(chair.root.position.z < 0 && chair.root.position.z > -1)
  for (let i = 0; i < 5; i++) frame(w, chair)
  assert.equal(chair.root.position.z, -1)
  assert.equal(hotCallbacks(chair), 0)
  assert.equal(w.physics.handles.size, 6)
  assert.equal(chair.root.get('executive-seat-action').active, false)
  checks.push('remote observers keep physical chair collision and smooth server pose playback')
})
