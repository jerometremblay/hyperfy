import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import { VRMExpression, VRMExpressionManager, VRMExpressionMorphTargetBind } from '@pixiv/three-vrm'
import { cloneExpressionManager, createAvatarExpressions } from './avatarExpressions.js'
import { normalizeExpression, validateExpressionRequest, applyPlayerExpression } from './playerExpressions.js'

function fixture() {
  const scene = new THREE.Scene()
  const mesh = new THREE.Mesh()
  mesh.morphTargetInfluences = [0, 0, 0]
  scene.add(mesh)
  const manager = new VRMExpressionManager()
  for (const [i, name] of ['happy', 'blink', 'aa'].entries()) {
    const expression = new VRMExpression(name)
    expression.addBind(new VRMExpressionMorphTargetBind({ primitives: [mesh], index: i, weight: 1 }))
    if (name === 'happy') expression.overrideBlink = 'block'
    manager.registerExpression(expression)
  }
  return { scene, mesh, manager }
}
test('cloned expression binds affect only the intended avatar, with standard blink override', () => {
  const source = fixture()
  const a = SkeletonUtils.clone(source.scene)
  const b = SkeletonUtils.clone(source.scene)
  const ma = cloneExpressionManager(source.manager, source.scene, a)
  const mb = cloneExpressionManager(source.manager, source.scene, b)
  const face = createAvatarExpressions(ma, () => 0)
  face.setExpression('joy', 1)
  face.update(2, false)
  face.update(0.075, false)
  mb.update()
  assert.deepEqual(a.children[0].morphTargetInfluences, [1, 0, 0])
  assert.deepEqual(b.children[0].morphTargetInfluences, [0, 0, 0])
  assert.deepEqual(source.mesh.morphTargetInfluences, [0, 0, 0])
})
test('blink and voice animate and mouth closes in 0.1 seconds; absent manager is safe', () => {
  const { manager, mesh } = fixture()
  const face = createAvatarExpressions(manager, () => 0)
  face.update(1.99, true)
  assert.equal(mesh.morphTargetInfluences[2], 0.3)
  face.update(0.075, false)
  assert.equal(mesh.morphTargetInfluences[1], 1)
  assert.equal(mesh.morphTargetInfluences[2], 0)
  face.update(0.075, false)
  assert.equal(mesh.morphTargetInfluences[1], 0)
  createAvatarExpressions(null).update(1, true)
})
test('VRM aliases and hostile network requests', () => {
  for (const [from, to] of [
    ['A', 'aa'],
    ['Blink_L', 'blinkLeft'],
    ['Fun', 'relaxed'],
    ['Sorrow', 'sad'],
  ])
    assert.equal(normalizeExpression(from), to)
  for (const weight of [-1, 2, NaN, Infinity, '1'])
    assert.equal(validateExpressionRequest({ name: 'happy', weight }), null)
  assert.equal(validateExpressionRequest({ name: 'unknown', weight: 1 }), null)
})
test('authoritative durations, snapshots, replacement and rate limiting', async () => {
  const sent = []
  const player = {
    data: { id: 'p' },
    modify(value) {
      Object.assign(this.data, value)
    },
    world: {
      network: {
        send(...args) {
          sent.push(args)
        },
      },
    },
  }
  assert.equal(applyPlayerExpression(player, { name: 'joy', weight: 1, duration: 0.01 }), true)
  assert.deepEqual(player.data.x, { happy: 1 })
  await new Promise(resolve => setTimeout(resolve, 25))
  assert.deepEqual(player.data.x, {})
  applyPlayerExpression(player, { name: 'happy', weight: 1, duration: 0.01 })
  applyPlayerExpression(player, { name: 'happy', weight: 0.5 })
  await new Promise(resolve => setTimeout(resolve, 25))
  assert.deepEqual(player.data.x, { happy: 0.5 })
  for (let i = 0; i < 17; i++) applyPlayerExpression(player, { name: 'angry', weight: 1 })
  assert.equal(applyPlayerExpression(player, { clear: true }), false)
  assert.ok(sent.length >= 3)
})
