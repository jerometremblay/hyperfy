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
  network: { getServerTime: () => Date.now() },
  stage: { scene: new THREE.Scene() },
  camera: new THREE.PerspectiveCamera(55, 440 / 270, 0.2, 1200),
  rig: new THREE.Object3D(),
  prefs: Object.assign(new EventEmitter(), { shadows: 'high' }),
  graphics: new EventEmitter(),
  loader: {
    load: (type, url) =>
      type === 'hdr' ? new HDRLoader().loadAsync('/ambient.hdr') : new THREE.TextureLoader().loadAsync(url),
  },
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
await env.starsLoading
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
  renderer.toneMappingExposure = env.renderExposure
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
      : moonPixels > 10000 && maxMoonDifference > 15
  values.push({ label, pass, average: Math.round(average), glare, moonPixels, maxMoonDifference })
}
// Aim at the real, life-size moon rather than testing only the light it casts.
world.settings.set('constellationLines', true)
env.updateDayNight(Date.parse('2026-10-26T01:00:00Z'))
env.constellationLines.visible = false
world.camera.lookAt(world.camera.position.clone().add(env.moonDirection))
world.camera.updateMatrixWorld()
env.lateUpdate()
env.csm.update()
const withMoonAndMarker = read()
photo('Full moon · circle and name on the celestial sphere')
env.moonMarker.visible = false
const withoutMarker = read()
let markerPixels = 0
for (let i = 0; i < withMoonAndMarker.length; i += 4) {
  if (
    Math.max(
      Math.abs(withMoonAndMarker[i] - withoutMarker[i]),
      Math.abs(withMoonAndMarker[i + 1] - withoutMarker[i + 1]),
      Math.abs(withMoonAndMarker[i + 2] - withoutMarker[i + 2])
    ) > 30
  ) markerPixels++
}
values.push({
  label: 'Moon marker renders its circle and name at the computed bearing',
  pass: markerPixels > 10,
  markerPixels,
})
const withMoonDisc = read()
env.moon.visible = false
const withoutMoonDisc = read()
let moonDiscPixels = 0
for (let i = 0; i < withMoonDisc.length; i += 4) {
  const pixel = i / 4
  const dx = (pixel % 440) - 220
  const dy = Math.floor(pixel / 440) - 135
  const diff = Math.max(
    Math.abs(withMoonDisc[i] - withoutMoonDisc[i]),
    Math.abs(withMoonDisc[i + 1] - withoutMoonDisc[i + 1]),
    Math.abs(withMoonDisc[i + 2] - withoutMoonDisc[i + 2])
  )
  if (dx * dx + dy * dy <= 9 && diff > 5) moonDiscPixels++
}
values.push({
  label: 'Moon disc remains rendered at its actual angular size',
  pass: moonDiscPixels > 0,
  moonDiscPixels,
})

// A waxing Moon above the horizon remains visible while the planet marker fades out.
const daytime = Date.parse('2026-10-15T19:00:00Z')
env.updateDayNight(daytime)
world.camera.lookAt(world.camera.position.clone().add(env.moonDirection))
world.camera.updateMatrixWorld()
env.lateUpdate()
env.csm.update()
const daytimeOpacity = env.moon.material.uniforms.opacity.value
const daytimeVisible = env.moon.visible
const daytimeMarkerOpacity = env.moonMarker.material.uniforms.opacity.value
const withDaytimeMoon = read()
photo('Daytime Moon · actual angular size')
env.moon.visible = false
const withoutDaytimeMoon = read()
let daytimeMoonPixels = 0
let daytimeDiscPixels = 0
for (let i = 0; i < withDaytimeMoon.length; i += 4) {
  const diff = Math.max(
    Math.abs(withDaytimeMoon[i] - withoutDaytimeMoon[i]),
    Math.abs(withDaytimeMoon[i + 1] - withoutDaytimeMoon[i + 1]),
    Math.abs(withDaytimeMoon[i + 2] - withoutDaytimeMoon[i + 2])
  )
  if (diff > 20) daytimeMoonPixels++
  const pixel = i / 4
  const dx = (pixel % 440) - 220
  const dy = Math.floor(pixel / 440) - 135
  if (dx * dx + dy * dy <= 9 && diff > 5) daytimeDiscPixels++
}
values.push({
  label: 'Daytime Moon remains visible while its marker fades like the planets',
  pass:
    daytimeOpacity >= 0.65 &&
    daytimeVisible &&
    daytimeMarkerOpacity === 0 &&
    daytimeMoonPixels > 0 &&
    daytimeDiscPixels > 0,
  opacity: daytimeOpacity,
  markerOpacity: daytimeMarkerOpacity,
  visible: daytimeVisible,
  pixels: daytimeMoonPixels,
  discPixels: daytimeDiscPixels,
})
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
