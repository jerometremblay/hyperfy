// Run node scripts/test-day-night-lighting.mjs and open its URL in a WebGL browser.
import * as THREE from 'three'
import EventEmitter from 'eventemitter3'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  BlendFunction,
  ToneMappingEffect,
  ToneMappingMode,
} from 'postprocessing'
import { ClientEnvironment } from './ClientEnvironment'
import { Settings } from './Settings'

const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true })
renderer.setSize(440, 270)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.toneMapping = THREE.NoToneMapping
renderer.outputColorSpace = THREE.SRGBColorSpace
const errors = []
renderer.debug.onShaderError = (gl, p, v, f) => errors.push(gl.getShaderInfoLog(v) + gl.getShaderInfoLog(f))
const world = {
  stage: { scene: new THREE.Scene() },
  camera: new THREE.PerspectiveCamera(55, 440 / 270, 0.2, 1200),
  rig: new THREE.Object3D(),
  prefs: Object.assign(new EventEmitter(), { shadows: 'high' }),
  graphics: new EventEmitter(),
  loader: { load: async () => new HDRLoader().loadAsync('/ambient.hdr') },
}
world.settings = new Settings(world)
const env = new ClientEnvironment(world)
env.init({
  baseEnvironment: {
    hdr: '/ambient.hdr',
    sunDirection: new THREE.Vector3(0, -1, 0),
    sunIntensity: 1,
    sunColor: '#ffffff',
    rotationY: 0,
  },
})
env.buildCSM()
await env.updateSky()
const scene = world.stage.scene
const floorMat = new THREE.MeshStandardMaterial({ color: '#718467', roughness: 1 })
const boxMat = new THREE.MeshStandardMaterial({ color: '#b8b8b8', roughness: 1 })
env.csm.setupMaterial(floorMat)
env.csm.setupMaterial(boxMat)
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorMat)
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
const box = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), boxMat)
box.position.y = 1
box.castShadow = true
box.receiveShadow = true
scene.add(floor, box)
const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType })
composer.addPass(new RenderPass(scene, world.camera))
const bloom = new BloomEffect({
  blendFunction: BlendFunction.ADD,
  mipmapBlur: true,
  luminanceThreshold: 1,
  luminanceSmoothing: 0.3,
  intensity: 0.5,
  radius: 0.8,
})
composer.addPass(new EffectPass(world.camera, bloom, new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })))
const result = document.querySelector('pre')
const read = () => {
  composer.render()
  const gl = renderer.getContext()
  const data = new Uint8Array(440 * 270 * 4)
  gl.readPixels(0, 0, 440, 270, gl.RGBA, gl.UNSIGNED_BYTE, data)
  return data
}
function photo(label) {
  const div = document.createElement('div')
  const heading = document.createElement('p')
  heading.textContent = label
  const image = new Image()
  image.src = renderer.domElement.toDataURL()
  div.append(heading, image)
  document.querySelector('main').append(div)
}
// Fixed astronomical dates exercise the complete sky + CSM + bloom pipeline.
const values = []
for (const [label, date, isSun, shadows] of [
  ['Sun · bloom enabled', '2026-06-21T17:00:00Z', true, 'high'],
  ['Daytime sky · away from sun', '2026-06-21T17:00:00Z', true, 'high'],
  ['Moonless night', '2026-10-10T01:00:00Z', false, 'high'],
  ['Full moon · high shadows', '2026-10-26T01:00:00Z', false, 'high'],
  ['Full moon · shadows off', '2026-10-26T01:00:00Z', false, 'none'],
]) {
  if (world.prefs.shadows !== shadows) {
    world.prefs.shadows = shadows
    env.buildCSM()
  }
  env.updateDayNight(Date.parse(date))
  world.camera.position.set(5, 3, 7)
  if (isSun) world.camera.lookAt(world.camera.position.clone().add(env.solarDirection))
  else world.camera.lookAt(0, 1, 0)
  if (label.includes('away from sun'))
    world.camera.lookAt(world.camera.position.clone().add(new THREE.Vector3(0, 1, -1)))
  world.rig.position.copy(world.camera.position)
  world.camera.updateMatrixWorld()
  env.lateUpdate()
  env.csm.update()
  const lit = read()
  photo(label)
  let brightness = 0,
    glare = 0
  for (let i = 0; i < lit.length; i += 4) {
    brightness += (lit[i] + lit[i + 1] + lit[i + 2]) / 3
    if (lit[i] > 240 && lit[i + 1] > 240 && lit[i + 2] > 240) glare++
  }
  const lightIntensity = env.moonLight.intensity
  env.moonLight.intensity = 0
  const dark = read()
  let moonPixels = 0,
    maxMoonDifference = 0
  for (let i = 0; i < lit.length; i += 4) {
    const diff = Math.max(lit[i] - dark[i], lit[i + 1] - dark[i + 1], lit[i + 2] - dark[i + 2])
    if (diff > 5) moonPixels++
    maxMoonDifference = Math.max(maxMoonDifference, diff)
  }
  env.moonLight.intensity = lightIntensity
  const average = brightness / (440 * 270)
  const pass = isSun
    ? glare < 200 && average > 180
    : lightIntensity === 0
      ? average > 5
      : moonPixels > 10000 && maxMoonDifference > 25
  values.push({ label, pass, average: Math.round(average), glare, moonPixels, maxMoonDifference })
}
// Aim at the real, life-size moon rather than testing only the light it casts.
env.updateDayNight(Date.parse('2026-10-26T01:00:00Z'))
world.camera.lookAt(world.camera.position.clone().add(env.moonDirection))
world.camera.updateMatrixWorld()
env.lateUpdate()
env.csm.update()
const withMoon = read()
photo('Full moon · actual angular size')
env.moon.visible = false
const withoutMoon = read()
let discPixels = 0
for (let i = 0; i < withMoon.length; i += 4) {
  if (withMoon[i] - withoutMoon[i] > 30) discPixels++
}
values.push({ label: 'Moon disc renders in the sky', pass: discPixels > 0, discPixels })
const pass = errors.length === 0 && values.every(value => value.pass)
result.textContent = JSON.stringify({ pass, values, errors }, null, 2)
document.title = `${pass ? 'PASS' : 'FAIL'}: day/night lighting`
composer.dispose()
env.destroy()
floor.geometry.dispose()
box.geometry.dispose()
floorMat.dispose()
boxMat.dispose()
scene.environment.dispose()
renderer.dispose()
