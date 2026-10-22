import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { harness, player, physics, root } from './helpers.mjs'
const fit = JSON.parse(await readFile(`${root}overlay/fit.json`, 'utf8'))
const source = await readFile(`${root}overlay/table.js`, 'utf8')
test('artwork fits the standard surface and balls rest on its existing cloth', () => {
  const size = physics.dimensions('8')
  assert.ok(Math.abs((1.145 - 0.018) * fit.modelScale[0] * 2 - size.length) < 1e-10)
  assert.ok(Math.abs((0.574 - 0.018) * fit.modelScale[2] * 2 - size.width) < 1e-10)
  assert.ok(Math.abs(fit.clothHeight - (0.5 + 0.207)) <= 0.00101)
  const q = new THREE.Quaternion(...fit.overlayQuaternion)
  assert.ok(new THREE.Vector3(0, 1, 0).applyQuaternion(q).distanceTo(new THREE.Vector3(0, 1, 0)) < 1e-10)
  assert.equal(fit.gameProps.showSurface, false)
})
test('table toggle removes all 16 static balls and preserves furniture primitives', () => {
  const original = harness({ source, props: { decorativeBalls: true } })
  const fitted = harness({ source, props: { decorativeBalls: false, poolChannel: fit.channel } })
  const ballCount = h =>
    h.created.filter(n => n.name === 'prim' && n.type === 'sphere' && Math.abs(n.size[0] - 0.0286) < 1e-10).length
  assert.equal(ballCount(original), 16)
  assert.equal(ballCount(fitted), 0)
  assert.equal(
    original.created.filter(n => n.name === 'prim').length - fitted.created.filter(n => n.name === 'prim').length,
    16
  )
  assert.equal(fitted.created.some(n => n.name === 'action'), false)
  assert.equal(fitted.app.onPointerDown, undefined)
  // Full-width opaque supports must stay below the cloth plane.
  for (const n of fitted.created.filter(
    n => n.name === 'prim' && n.opacity > 0 && n.type === 'box' && n.size[0] > 1 && n.size[2] > 0.8
  )) {
    assert.ok(n.position.y + n.size[1] / 2 <= 0.70701)
  }
})
test('playing-surface click with a held cue uses a transformed low view behind the cue ball', () => {
  const players = [player('alice')]
  const server = harness({ server: true, players, props: fit.gameProps, cueHolders: ['alice'] })
  const client = harness({ players, props: fit.gameProps, state: structuredClone(server.app.state) })
  const furniture = harness({ source, players, props: { decorativeBalls: false, poolChannel: fit.channel } })
  server.app.deliver = (event, value) => client.emit(event, value)
  client.app.deliver = (event, value) => server.emit(event, value, 'alice')
  client.app.quaternion.fromArray(fit.overlayQuaternion)
  const surface = client.created.find(n => n.name === 'prim' && n.opacity === 0)
  surface.onPointerEnter()
  assert.ok(client.actionPrompts.some(action => action.type === 'mouseLeft' && action.label === 'Play'))
  surface.onPointerDown({ button: 'left' })
  client.emit('update', 1 / 60)
  assert.equal(server.app.state.pool.owner, 'alice')
  assert.equal(client.control.camera.write, true)
  const local = client.control.camera.position.clone().sub(client.app.position).applyQuaternion(client.app.quaternion.clone().invert())
  const ball = server.app.state.pool.balls[0].p
  assert.ok(Math.abs(local.y - (physics.BALL_RADIUS + 0.14)) < 1e-10)
  assert.ok(Math.abs(Math.hypot(local.x - ball[0], local.z + ball[1]) - 0.68) < 1e-10)
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(client.control.camera.quaternion)
  const ballWorld = new THREE.Vector3(ball[0], physics.BALL_RADIUS, -ball[1]).applyQuaternion(client.app.quaternion).add(client.app.position)
  assert.ok(forward.dot(ballWorld.sub(client.control.camera.position).normalize()) > 0.98)
  assert.ok(client.created.filter(n => n.name === 'prim').every(n => n.opacity === 0 || n.type === 'sphere' || n.size[0] < 1))
})
