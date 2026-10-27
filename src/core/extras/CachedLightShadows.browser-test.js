// node scripts/test-light-shadows.mjs --cached; open the printed localhost URL.
import * as THREE from 'three'
import { EffectComposer, RenderPass } from 'postprocessing'
import { ClientGraphics } from '../systems/ClientGraphics'
import { CSM } from '../libs/csm/CSM'

const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true })
renderer.setSize(384, 384)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.info.autoReset = false
const errors = []
renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
  errors.push(gl.getProgramInfoLog(program) + gl.getShaderInfoLog(vertex) + gl.getShaderInfoLog(fragment))
}
const scene = new THREE.Scene()
scene.background = new THREE.Color('#202030')
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50)
camera.position.set(5, 5, 7)
camera.lookAt(0, 0, 0)
camera.updateMatrixWorld()
const material = new THREE.MeshStandardMaterial({ color: '#dddddd', roughness: 1 })
const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), material)
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
const box = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), material)
box.position.y = 1
box.castShadow = true
box.receiveShadow = true
const avatar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 0.4), material)
avatar.position.set(2, 0.8, 0)
avatar.getEntity = () => ({ isPlayer: true })
const point = new THREE.PointLight(0xffddbb, 100, 20)
point.position.set(-3, 5, 2)
const spot = new THREE.SpotLight(0xbbddff, 70, 20, Math.PI / 3)
spot.position.set(3, 5, 2)
const sun = new THREE.DirectionalLight(0xffffff, 0)
sun.position.set(-4, 6, -3)
for (const light of [point, spot, sun]) {
  light.castShadow = true
  light.shadow.mapSize.set(256, 256)
}
scene.add(floor, box, avatar, point, spot, spot.target, sun, sun.target, new THREE.AmbientLight(0xffffff, 0.1))
const prefs = { cacheFixtureShadows: false }
const graphics = new ClientGraphics({ stage: { scene }, camera, prefs, environment: { renderExposure: 1 } })
graphics.renderer = renderer
graphics.usePostprocessing = false
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
graphics.composer = composer
let clock = 0
const cacheRender = graphics.cachedLightShadows.render.bind(graphics.cachedLightShadows)
graphics.cachedLightShadows.render = (renderer, scene, camera, enabled) =>
  cacheRender(renderer, scene, camera, enabled, clock)

const faces = { point: 0, spot: 0, sun: 0 }
for (const [name, light] of Object.entries({ point, spot, sun })) {
  const getCamera = light.shadow.getCamera
  light.shadow.getCamera = function (...args) {
    faces[name]++
    return getCamera.apply(this, args)
  }
}
let avatarFixtureDraws = 0
let avatarSunDraws = 0
avatar.onBeforeShadow = (renderer, object, camera, shadowCamera) => {
  if (shadowCamera === sun.shadow.camera) avatarSunDraws++
  else avatarFixtureDraws++
}
const checks = []
function check(label, pass, details = {}) {
  checks.push({ label, pass, ...details })
  if (!pass) throw new Error(label)
}
function frame() {
  renderer.info.reset()
  graphics.render()
  return renderer.info.render.calls
}
function pixels() {
  const gl = renderer.getContext()
  const data = new Uint8Array(384 * 384 * 4)
  gl.readPixels(0, 0, 384, 384, gl.RGBA, gl.UNSIGNED_BYTE, data)
  return data
}
function difference(a, b) {
  let changedPixels = 0
  let max = 0
  for (let i = 0; i < a.length; i += 4) {
    let delta = 0
    for (let c = 0; c < 3; c++) delta = Math.max(delta, Math.abs(a[i + c] - b[i + c]))
    if (delta > 2) changedPixels++
    max = Math.max(max, delta)
  }
  return { changedPixels, max }
}
function image(label) {
  const panel = document.createElement('div')
  panel.textContent = label
  const img = new Image()
  img.src = renderer.domElement.toDataURL()
  panel.append(img)
  document.body.append(panel)
}
const output = document.createElement('pre')
document.body.append(output)

async function run() {
  // Reference image: fixture shadows from only the room. The player is still visible.
  frame()
  const reference = pixels()
  prefs.cacheFixtureShadows = true
  avatar.castShadow = true
  frame()
  clock = 500
  const beforeCapture = { ...faces }
  frame()
  const captureFaces = Object.fromEntries(Object.keys(faces).map(key => [key, faces[key] - beforeCapture[key]]))
  check('Native capture renders six point faces and one spot face', captureFaces.point === 6 && captureFaces.spot === 1)
  const comparison = difference(reference, pixels())
  check('Cached static shadows match the normal static-only image', comparison.changedPixels === 0, comparison)
  image('Cached point and spot shadows')
  floor.receiveShadow = false
  frame()
  const visibleShadows = difference(reference, pixels())
  check('The cached image still contains visible fixture shadows', visibleShadows.changedPixels > 100, visibleShadows)
  floor.receiveShadow = true
  const beforeReuse = { ...faces }
  for (let i = 0; i < 10; i++) {
    clock++
    camera.position.x += 0.01
    avatar.position.x -= 0.01
    camera.updateMatrixWorld()
    frame()
  }
  check(
    'Camera/player movement produces zero new fixture faces',
    faces.point === beforeReuse.point && faces.spot === beforeReuse.spot
  )
  check(
    'Sun maps remain dynamic and still include the avatar',
    faces.sun - beforeReuse.sun === 10 && avatarSunDraws > 0
  )
  // Avatar fixture draws from the uncached warmup must not increase after capture.
  const previousAvatarDraws = avatarFixtureDraws
  clock++
  frame()
  check(
    'The avatar is excluded from cached maps and its normal flags are restored',
    avatarFixtureDraws === previousAvatarDraws && avatar.castShadow
  )
  const beforeEdit = faces.point
  box.position.x = 1
  clock++
  frame()
  const afterMoving = faces.point
  for (let i = 0; i < 10; i++) {
    box.position.x += 0.02
    clock += 10
    frame()
  }
  check(
    'Moving props are removed once rather than rebaked every frame',
    afterMoving === beforeEdit + 6 && faces.point === afterMoving
  )
  clock += 500
  frame()
  check('Settled geometry joins the cache again', faces.point === afterMoving + 6)
  const instances = new THREE.InstancedMesh(box.geometry, material, 2)
  instances.castShadow = true
  instances.receiveShadow = true
  instances.setMatrixAt(0, new THREE.Matrix4().makeTranslation(-2, 1, -1))
  instances.setMatrixAt(1, new THREE.Matrix4().makeTranslation(2, 1, -1))
  instances.instanceMatrix.needsUpdate = true
  scene.add(instances)
  frame()
  clock += 500
  frame()
  let mixedCapture = false
  instances.onBeforeShadow = (renderer, object, camera, shadowCamera) => {
    if (shadowCamera === sun.shadow.camera) return
    const matrices = object.instanceMatrix.array
    mixedCapture ||= matrices[0] === 0 && matrices[16] === 1
  }
  instances.setMatrixAt(0, new THREE.Matrix4().makeTranslation(-3, 1, -1))
  instances.instanceMatrix.needsUpdate = true
  instances.boundingSphere = null // Match Stage.move()'s invalidation.
  const realMatrices = instances.instanceMatrix.array.slice()
  clock++
  frame()
  check(
    'A moving instance is hidden during capture while its stationary neighbor still casts',
    mixedCapture && realMatrices.every((value, i) => value === instances.instanceMatrix.array[i])
  )
  const expectedBounds = new THREE.Sphere()
  const matrix = new THREE.Matrix4()
  const sphere = new THREE.Sphere()
  instances.geometry.computeBoundingSphere()
  expectedBounds.makeEmpty()
  for (let i = 0; i < 2; i++) {
    instances.getMatrixAt(i, matrix)
    sphere.copy(instances.geometry.boundingSphere).applyMatrix4(matrix)
    expectedBounds.union(sphere)
  }
  check(
    'Normal instance bounds include the restored moving object',
    instances.boundingSphere.center.distanceTo(expectedBounds.center) < 1e-6 &&
      Math.abs(instances.boundingSphere.radius - expectedBounds.radius) < 1e-6
  )
  graphics.usePostprocessing = true
  const beforeComposer = { ...faces }
  for (let i = 0; i < 5; i++) frame()
  check(
    'The composer also reuses fixture maps while updating sun shadows',
    faces.point === beforeComposer.point && faces.spot === beforeComposer.spot && faces.sun === beforeComposer.sun + 5
  )
  prefs.cacheFixtureShadows = false
  const beforeOff = { ...faces }
  frame()
  check(
    'Switching off restores normal fixture rendering',
    faces.point === beforeOff.point + 6 &&
      faces.spot === beforeOff.spot + 1 &&
      point.shadow.autoUpdate &&
      spot.shadow.autoUpdate
  )
  prefs.cacheFixtureShadows = true
  frame()
  clock += 500
  frame()
  graphics.world.builder = { enabled: true }
  const beforeBuildMode = faces.point
  frame()
  check(
    'Build mode restores dynamic shadows for editing',
    point.shadow.autoUpdate && faces.point === beforeBuildMode + 6
  )
  graphics.world.builder.enabled = false
  check('No shader or WebGL errors', !errors.length && renderer.getContext().getError() === 0, { errors })

  // Synthetic performance workload, independent of the live world.
  graphics.usePostprocessing = false
  scene.remove(box, avatar, instances)
  point.intensity = 30
  spot.intensity = 30
  sun.intensity = 0.3
  const geometry = new THREE.BoxGeometry(0.3, 0.8, 0.3)
  for (let x = -10; x < 10; x++) {
    for (let z = -10; z < 10; z++) {
      const object = new THREE.Mesh(geometry, material)
      object.position.set(x * 0.45, 0.4, z * 0.45)
      object.castShadow = true
      object.receiveShadow = true
      scene.add(object)
    }
  }
  for (let i = 0; i < 4; i++) {
    const light = new THREE.PointLight(0xffddbb, 15, 14)
    light.position.set(i - 2, 3, i % 2 ? -2 : 2)
    light.castShadow = true
    light.shadow.mapSize.set(128, 128)
    scene.add(light)
  }
  async function sample(label, cached) {
    prefs.cacheFixtureShadows = cached
    graphics.cachedLightShadows.reset()
    clock = 0
    frame()
    clock = 500
    frame()
    for (let i = 0; i < 20; i++) frame()
    const intervals = []
    const calls = []
    const cpu = []
    let previous
    const start = performance.now()
    output.textContent = `Running ${label}…`
    while (performance.now() - start < 4000) {
      await new Promise(requestAnimationFrame)
      const now = performance.now()
      if (previous !== undefined) intervals.push(now - previous)
      previous = now
      const begin = performance.now()
      calls.push(frame())
      cpu.push(performance.now() - begin)
    }
    const mean = values => values.reduce((a, b) => a + b, 0) / values.length
    const p95 = values => [...values].sort((a, b) => a - b)[Math.ceil(values.length * 0.95) - 1]
    return {
      label,
      seconds: (performance.now() - start) / 1000,
      frames: calls.length,
      fps: 1000 / mean(intervals),
      frameMeanMs: mean(intervals),
      frameP95Ms: p95(intervals),
      cpuMeanMs: mean(cpu),
      drawsPerFrame: mean(calls),
    }
  }
  const samples = []
  for (const [label, cached] of [
    ['normal-before', false],
    ['cached', true],
    ['normal-after', false],
  ]) {
    samples.push(await sample(label, cached))
  }
  check('Cached workload eliminates most shadow draw calls', samples[1].drawsPerFrame < samples[0].drawsPerFrame * 0.5)
  const csm = new CSM({
    parent: scene,
    camera,
    cascades: 3,
    maxCascades: 3,
    maxFar: 30,
    shadowMapSize: 128,
    lightIntensity: 0.2,
  })
  csm.setupMaterial(material)
  let cascadeFaces = 0
  for (const light of csm.lights) {
    const getCamera = light.shadow.getCamera
    light.shadow.getCamera = function (...args) {
      cascadeFaces++
      return getCamera.apply(this, args)
    }
  }
  prefs.cacheFixtureShadows = true
  graphics.cachedLightShadows.reset()
  clock = 0
  csm.update()
  frame()
  clock = 500
  frame()
  const beforeCascades = cascadeFaces
  const beforeCsmPoint = faces.point
  for (let i = 0; i < 5; i++) {
    csm.update()
    frame()
  }
  check(
    'All three CSM sun cascades refresh every frame while fixture maps stay cached',
    cascadeFaces - beforeCascades === 15 && faces.point === beforeCsmPoint
  )
  check(
    'Cached maps work with the CSM shaders without WebGL errors',
    !errors.length && renderer.getContext().getError() === 0
  )
  prefs.cacheFixtureShadows = false
  frame()
  const baselineDrift = Math.abs(samples[2].frameMeanMs / samples[0].frameMeanMs - 1)
  window.cachedShadowResults = {
    pass: checks.every(check => check.pass),
    checks,
    samples,
    userAgent: navigator.userAgent,
    viewport: [384, 384],
    camera: camera.matrixWorld.toArray(),
    renderer: renderer.getContext().getParameter(renderer.getContext().RENDERER),
    errors,
    baselineDrift,
    timingComparisonValid: baselineDrift < 0.1,
  }
  output.textContent = JSON.stringify(window.cachedShadowResults, null, 2)
  const summary = document.createElement('p')
  summary.textContent = `PASS: ${checks.length} browser checks. Fixture shadows retain the static image. Draw calls fall from ${samples[0].drawsPerFrame} to ${samples[1].drawsPerFrame} per frame.`
  document.body.insertBefore(summary, output)
  const timing = document.createElement('p')
  timing.textContent = window.cachedShadowResults.timingComparisonValid
    ? 'Timing samples and complete checks are available below. This is a synthetic workload, not the live world.'
    : 'Timing varied between the surrounding baselines; use the draw-call result, not an FPS estimate. This is a synthetic workload.'
  document.body.insertBefore(timing, output)
  const details = document.createElement('details')
  const label = document.createElement('summary')
  label.textContent = 'All checks and timing samples'
  details.append(label)
  document.body.insertBefore(details, output)
  details.append(output)
  document.title = 'PASS: cached fixture shadows'
  image('Synthetic workload — normal shadows restored after measurement')
  csm.dispose()
}
run().catch(error => {
  window.cachedShadowResults = { pass: false, checks, error: error.stack, errors }
  output.textContent = JSON.stringify(window.cachedShadowResults, null, 2)
  document.title = 'FAIL: cached fixture shadows'
})
