import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import { createHash } from 'node:crypto'
import {
  world, clean, flush, claim, events, hotCallbacks, THREE, destroyWorlds,
} from '../motion-fix/runtime-harness.mjs'

const checks = [], measurements = []
test.after(async () => {
  await destroyWorlds()
  const source = await fs.readFile('outputs/upper-office/chair.js')
  await fs.writeFile('outputs/upper-office/desk-clearance/validation.json', JSON.stringify({
    valid: checks.length === 2, actualPhysXWasm: true,
    approximation: 'Rear-half rolling blocker; complete collision shell when unoccupied',
    checks, measurements,
    script: 'asset://' + createHash('sha256').update(source).digest('hex') + '.js',
  }, null, 2))
})
function roll(w, chair, token, count, x = 0, z = -1) {
  for (let i = 0; i < count; i++) {
    if (i % 5 === 0) chair.emit('chair-input', { token, x, z }, 'p1')
    chair.fixedUpdate(1 / 60)
    clean(w)
    assert.equal(chair.scriptError, null)
  }
}
test('front half tucks under the real U desk while rear half stops at the desktop', async () => {
  const w = await world()
  const player = w.addPlayer('p1')
  const desk = w.addFurniture('desk')
  const chair = w.addFurniture('chair', [0, .002, -.60], [0, 1, 0, 0])
  player.base.position.copy(chair.root.position)
  await flush(w)
  const token = claim(w, chair)
  await flush(w)
  roll(w, chair, token, 180)
  const desktopEdge = .45
  assert(chair.root.position.z > .39, `Chair stopped before its front half tucked under: ${chair.root.position.z}`)
  assert(chair.root.position.z < desktopEdge, 'Rear-half blocker must stop at the desktop edge')
  assert(Math.abs(chair.root.position.y) < .008)
  const overlap = chair.root.position.z + .285 - desktopEdge
  assert(overlap > .23 && overlap < .285, 'Approximately half of the seat should be under the tabletop')
  const stopped = chair.root.position.clone()
  const wheels = structuredClone(chair.data.state.casters)
  roll(w, chair, token, 120)
  assert(chair.root.position.distanceTo(stopped) < .00001, 'Held input must not push through the desktop')
  assert.deepEqual(chair.data.state.casters, wheels, 'Blocked movement must stop the wheels')
  const desktopTop = w.physics.raycast(new THREE.Vector3(0, 2, .70),
    new THREE.Vector3(0, -1, 0), 3, desk.getWorldProxy().createLayerMask('environment'))
  assert(desktopTop && Math.abs(desktopTop.point.y - desk.root.position.y - .779) < .00001,
    'Desktop collision must remain solid')
  chair.emit('chair-input', { token, x: 0, z: 0 }, 'p1')
  chair.fixedUpdate(1 / 60); clean(w)
  assert.equal(hotCallbacks(chair), 0)
  chair.emit('seat-release', { token }, 'p1')
  await flush(w)
  const exit = events(w, 'seat-ended', 'p1').at(-1).args[1][3].exit
  assert(exit && exit[2] < chair.root.position.z - .8, 'Standing exit must be behind the chair, outside the desktop')
  assert.equal(chair.worldNodes.size, 0)
  assert.equal(hotCallbacks(chair), 0)
  measurements.push({ scenario: 'real U desk', stoppedRoot: stopped.toArray(),
    seatOverlapUnderDesktop: overlap, desktopFrontEdge: desktopEdge, safeExit: exit })
  checks.push('Half-seat insertion, solid desktop stop, stationary wheels, grounded root and safe standing exit')
})
test('offset native controller stays aligned through scale and yaw changes', async () => {
  for (const [scale, yaw] of [
    [[1, 1, 1], 0], [[1.5, 1.5, 1.5], 0],
    [[2, 1, .5], 0], [[2, 1, .5], Math.PI * 75 / 180],
  ]) {
    const w = await world()
    w.addPlayer('p1')
    const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
    const chair = w.addFurniture('chair', [0, .002, 0], quaternion.toArray(), scale)
    await flush(w)
    const token = claim(w, chair)
    await flush(w)
    const controller = [...chair.worldNodes][0]
    const expectedOffset = new THREE.Vector3(0, 0, .2375).multiply(new THREE.Vector3(...scale))
      .applyQuaternion(quaternion)
    assert(controller.position.clone().sub(chair.root.position).distanceTo(expectedOffset) < .00001)
    assert.equal(controller.radius, .2375 * Math.max(scale[0], scale[2]))
    roll(w, chair, token, 45)
    assert(controller.position.clone().sub(chair.root.position).distanceTo(expectedOffset) < .00001)
    assert(Math.abs(chair.root.position.y) < .008, 'Controller offset must not lift the chair off the floor')
    const anchor = w.anchors.get('chair:executive-seat')
    const expectedSeat = new THREE.Vector3(0, .595, -.025).multiply(new THREE.Vector3(...scale))
      .applyQuaternion(quaternion).add(chair.root.position)
    assert(expectedSeat.distanceTo(new THREE.Vector3().setFromMatrixPosition(anchor)) < .00001)
    measurements.push({ scale, yaw, controllerRadius: controller.radius, worldOffset: expectedOffset.toArray() })
    chair.emit('seat-release', { token }, 'p1')
    await flush(w)
    assert.equal(chair.worldNodes.size, 0)
    assert.equal(hotCallbacks(chair), 0)
  }
  checks.push('Native controller offset, floor contact and seat anchor align at identity, uniform, nonuniform and rotated scale')
})
