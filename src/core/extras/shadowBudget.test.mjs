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

test('camera movement chooses nearby sources in world space and excludes invisible branches', () => {
  const f = fixture()
  f.camera.position.x = 10
  f.camera.updateMatrixWorld(true)
  f.points[0].visible = false
  const disabled = limitLightShadows(f.scene, f.camera, f.maxTextures, f.cascades)
  assert.deepEqual(disabled, [f.points[1]])
  assert.ok(f.points[0].castShadow, 'invisible lights do not consume the budget or lose requested flags')
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
