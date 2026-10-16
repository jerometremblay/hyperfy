import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { limitLightShadows } from './shadowBudget.js'

function fixture(maxTextures = 16) {
  const scene = new THREE.Scene()
  scene.environment = new THREE.Texture()
  const camera = new THREE.PerspectiveCamera()
  const texture = new THREE.Texture()
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    aoMap: texture,
    normalMap: texture,
    roughnessMap: texture,
    metalnessMap: texture,
  })
  const avatar = new THREE.SkinnedMesh(new THREE.BoxGeometry(), material)
  scene.add(avatar)
  const cascades = Array.from({ length: 3 }, () => new THREE.DirectionalLight())
  const points = Array.from({ length: 8 }, (_, i) => {
    const light = new THREE.PointLight()
    light.position.x = i + 1
    return light
  })
  for (const light of [...cascades, ...points]) {
    light.castShadow = true
    scene.add(light)
  }
  scene.updateMatrixWorld(true)
  return { scene, camera, cascades, points, avatar, maxTextures }
}

test('textured skinned avatar reserves maps, environment and bones before shadow samplers', () => {
  const f = fixture()
  const disabled = limitLightShadows(f.scene, f.camera, f.maxTextures, f.cascades)
  assert.equal(disabled.length, 2)
  assert.ok(f.cascades.every(light => light.castShadow))
  assert.ok(f.points.slice(0, 6).every(light => light.castShadow))
  assert.ok(f.points.slice(6).every(light => !light.castShadow))
  for (const light of disabled) light.castShadow = true
  assert.ok(
    f.points.every(light => light.castShadow),
    'requested shadow flags can be restored after rendering'
  )
})

test('larger GPU texture budget preserves all requested shadows', () => {
  const f = fixture(32)
  assert.deepEqual(limitLightShadows(f.scene, f.camera, f.maxTextures, f.cascades), [])
})

test('camera movement keeps the same shadow sources and excludes invisible branches', () => {
  const f = fixture()
  const first = limitLightShadows(f.scene, f.camera, f.maxTextures, f.cascades)
  assert.deepEqual(first, f.points.slice(6))
  for (const light of first) light.castShadow = true

  f.camera.position.x = 10
  f.camera.updateMatrixWorld(true)
  const afterMoving = limitLightShadows(f.scene, f.camera, f.maxTextures, f.cascades)
  assert.deepEqual(afterMoving, first)
  for (const light of afterMoving) light.castShadow = true

  f.points[0].visible = false
  const afterHiding = limitLightShadows(f.scene, f.camera, f.maxTextures, f.cascades)
  assert.deepEqual(afterHiding, [f.points[7]])
  assert.ok(f.points[0].castShadow, 'invisible lights do not consume the budget or lose requested flags')
})

test('dynamic lights keep budget slots ahead of stable cached lights', () => {
  const f = fixture()
  for (const light of f.points) light.shadow.autoUpdate = false
  const fireplace = new THREE.PointLight()
  fireplace.castShadow = true
  f.scene.add(fireplace)
  f.scene.updateMatrixWorld(true)

  const disabled = limitLightShadows(f.scene, f.camera, f.maxTextures, f.cascades)

  assert.ok(!disabled.includes(fireplace), 'dynamic fireplace shadow keeps a slot')
  assert.deepEqual(disabled, f.points.slice(5))
})

test('high-priority static sconces keep shadow slots ahead of lower-intensity spots', () => {
  const f = fixture()
  for (const light of f.points) light.castShadow = false

  const dynamicLights = Array.from({ length: 2 }, () => {
    const light = new THREE.PointLight()
    light.castShadow = true
    f.scene.add(light)
    return light
  })
  const lowerPriority = Array.from({ length: 14 }, (_, i) => {
    const light = new THREE.SpotLight(0xffffff, i < 10 ? 15 : 5)
    light.shadow.autoUpdate = false
    light.castShadow = true
    f.scene.add(light)
    return light
  })
  const upwardSconces = Array.from({ length: 4 }, (_, i) => {
    const light = new THREE.SpotLight(0xffffff, 25)
    light.name = `upward-sconce-${i}`
    light.shadow.autoUpdate = false
    light.castShadow = true
    f.scene.add(light)
    return light
  })

  const disabled = limitLightShadows(f.scene, f.camera, f.maxTextures, f.cascades)

  assert.equal(disabled.length, 14)
  assert.ok(dynamicLights.every(light => !disabled.includes(light)))
  assert.ok(upwardSconces.every(light => !disabled.includes(light)))
  assert.ok(lowerPriority.every(light => disabled.includes(light)))
})

test('spotlight projection maps and morph targets also consume texture slots', () => {
  const f = fixture()
  f.avatar.geometry.morphAttributes.position = [f.avatar.geometry.attributes.position.clone()]
  const spot = new THREE.SpotLight()
  spot.map = new THREE.Texture()
  f.scene.add(spot)
  f.scene.updateMatrixWorld(true)
  const disabled = limitLightShadows(f.scene, f.camera, f.maxTextures, f.cascades)
  assert.equal(disabled.length, 4)
})

test('custom material texture arrays are counted without deduplicating sampler bindings', () => {
  const f = fixture()
  f.avatar.material = new THREE.ShaderMaterial({
    lights: true,
    uniforms: { maps: { value: Array(7).fill(new THREE.Texture()) } },
  })
  const disabled = limitLightShadows(f.scene, f.camera, f.maxTextures, f.cascades)
  assert.equal(disabled.length, 3)
})
