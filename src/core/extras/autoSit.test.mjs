import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./autoSit.js', import.meta.url))],
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { findFreeSittingSurface, getFreeSittingPose } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

test('finds nearby horizontal support, checks its width and chooses the floor pose', () => {
  const camera = new THREE.PerspectiveCamera()
  camera.position.set(0, 1, 1)
  camera.lookAt(0, 0, 0)
  const base = new THREE.Object3D()
  const physics = { raycast(origin, direction) {
    const distance = -origin.y / direction.y
    if (!Number.isFinite(distance) || distance < 0) return null
    return { point: origin.clone().addScaledVector(direction, distance), normal: new THREE.Vector3(0, 1, 0) }
  } }
  camera.updateMatrixWorld(true)
  const ray = new THREE.Raycaster()
  ray.setFromCamera(new THREE.Vector2(), camera)
  const seat = findFreeSittingSurface(physics, ray.ray.origin, ray.ray.direction, base)
  assert.equal(seat.kind, 'floor')
  assert.ok(Math.hypot(...seat.offset) < 0.001)
  assert.ok(getFreeSittingPose({ freeSit: seat }).pose)
})

test('leans on a narrow point and rejects malformed remote offsets', () => {
  const camera = new THREE.PerspectiveCamera()
  camera.position.set(0, 1, 1)
  camera.lookAt(0, 0, 0)
  const base = new THREE.Object3D()
  let calls = 0
  const physics = { raycast() {
    if (calls++) return null
    return { point: new THREE.Vector3(), normal: new THREE.Vector3(0, 1, 0) }
  } }
  const ray = new THREE.Raycaster()
  camera.updateMatrixWorld(true)
  ray.setFromCamera(new THREE.Vector2(), camera)
  const seat = findFreeSittingSurface(physics, ray.ray.origin, ray.ray.direction, base)
  assert.equal(seat.kind, 'leanFloor')
  assert.ok(getFreeSittingPose({ freeSit: seat }).pose)
  assert.equal(getFreeSittingPose({ freeSit: { kind: 'seat', offset: [1e6, 0, 0] } }), null)
})

test('leans toward a narrow raised support and synchronizes its orientation', () => {
  const base = new THREE.Object3D()
  const physics = { raycast(_origin, direction) {
    if (direction.y === -1) return null
    return { point: new THREE.Vector3(0.7, 0.8, 0), normal: new THREE.Vector3(0, 1, 0) }
  } }
  const seat = findFreeSittingSurface(physics, new THREE.Vector3(), new THREE.Vector3(1, 0, 0), base)
  assert.equal(seat.kind, 'lean')
  assert.equal(seat.offset[1], 0)
  const pose = getFreeSittingPose({ freeSit: seat })
  assert.deepEqual(pose.pose.hips.position, [0, 0, 0])
  const back = new THREE.Vector3(0, 0, 1).applyQuaternion(new THREE.Quaternion(...pose.rotation))
  assert.ok(back.x > 0.99)
  assert.equal(getFreeSittingPose({ freeSit: { ...seat, rotation: [0, 0, 0, 99] } }), null)
})

test('allows leaning against a vertical surface', () => {
  const physics = { raycast: () => ({ point: new THREE.Vector3(0, 1, -1), normal: new THREE.Vector3(0, 0, 1) }) }
  const seat = findFreeSittingSurface(physics, new THREE.Vector3(), new THREE.Vector3(0, 0, -1), new THREE.Object3D())
  assert.equal(seat.kind, 'lean')
})

test('uses the selected ray and never falls back to the floor after a missed click', () => {
  const base = new THREE.Object3D()
  const origin = new THREE.Vector3(0, 1, 0)
  const direction = new THREE.Vector3(0.4, -1, 0).normalize()
  let calls = 0
  const physics = { raycast(from, ray) {
    calls++
    const distance = -from.y / ray.y
    return { point: from.clone().addScaledVector(ray, distance), normal: new THREE.Vector3(0, 1, 0) }
  } }
  const seat = findFreeSittingSurface(physics, origin, direction, base)
  assert.ok(Math.abs(seat.offset[0] - 0.4) < 1e-6)
  assert.equal(calls, 5)
  calls = 0
  physics.raycast = () => { calls++; return null }
  assert.equal(findFreeSittingSurface(physics, origin, direction, base), null)
  assert.equal(calls, 1)
})
