import * as THREE from 'three'
import EventEmitter from 'eventemitter3'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { EffectComposer, RenderPass, EffectPass, BloomEffect, ToneMappingEffect, ToneMappingMode } from 'postprocessing'
import { ClientEnvironment } from './ClientEnvironment'
import { Settings } from './Settings'
import { createStarField } from '../extras/createStarField'
import { ClientGraphics } from './ClientGraphics'
import { Portal } from '../nodes/Portal'

const width = 800,
  height = 500
const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true })
renderer.setSize(width, height)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
const errors = []
renderer.debug.onShaderError = (gl, p, v, f) => errors.push(gl.getShaderInfoLog(v) + gl.getShaderInfoLog(f))
const now = Date.parse('2026-10-12T05:00:00Z')
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(60, width / height, 0.2, 1200)
const world = {
  network: { getServerTime: () => now },
  stage: { scene },
  camera,
  rig: new THREE.Object3D(),
  prefs: Object.assign(new EventEmitter(), { shadows: 'none' }),
  graphics: new EventEmitter(),
  loader: { load: () => new HDRLoader().loadAsync('/ambient.hdr') },
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
env.updateDayNight(now)
const values = []
function photo(label) {
  const div = document.createElement('div'),
    title = document.createElement('p'),
    image = new Image()
  title.textContent = label
  image.src = renderer.domElement.toDataURL()
  div.append(title, image)
  document.querySelector('main').append(div)
}
function read(render = () => renderer.render(scene, camera)) {
  render()
  const gl = renderer.getContext(),
    data = new Uint8Array(width * height * 4)
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data)
  return data
}
function difference(a, b, threshold = 3) {
  let pixels = 0
  for (let i = 0; i < a.length; i += 4) {
    if (Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])) > threshold)
      pixels++
  }
  return pixels
}
function check(label, pass, details = {}) {
  values.push({ label, pass, ...details })
}
function aim(direction) {
  camera.position.copy(world.rig.position)
  camera.lookAt(camera.position.clone().add(direction))
  camera.updateMatrixWorld()
  env.lateUpdate()
}
aim(new THREE.Vector3(0, 0.55, -1))
const night = read()
photo('Shipped catalog · looking north · direct/XR tone mapping')
env.stars.visible = false
const without = read()
const catalogPixels = difference(night, without)
check('Shipped catalog renders above the real sky', catalogPixels > 150, { catalogPixels })
env.stars.visible = true
world.settings.set('constellationLines', true)
env.onSettingsChange({ constellationLines: { value: true } })
const withLines = read()
const linePixels = difference(withLines, night)
check('Constellation toggle renders faint lines', linePixels > 500, { linePixels })
photo('Constellation lines enabled · same north view')
world.settings.set('constellationLines', false)
env.onSettingsChange({ constellationLines: { value: false } })
check('Constellation toggle removes lines', difference(read(), night) === 0)

// Isolate stars to test infinity independently of the finite existing Moon/sky.
env.solarSky.visible = false
env.moon.visible = false
const fixed = read()
check('Catalog uses one draw call', renderer.info.render.calls === 1, { calls: renderer.info.render.calls })
world.rig.position.set(10000, 200, -8000)
aim(new THREE.Vector3(0, 0.55, -1))
check('Walking does not change star bearings', difference(fixed, read()) === 0)
camera.position.x -= 0.032
camera.updateMatrixWorld()
const left = read()
camera.position.x += 0.064
camera.updateMatrixWorld()
check('Parallel stereo eyes have no star parallax', difference(left, read()) === 0)
world.rig.position.set(0, 0, 0)
aim(new THREE.Vector3(0, -1, -0.1))
check('Below-horizon stars are masked', difference(read(), new Uint8Array(width * height * 4)) === 0)
world.settings.set('constellationLines', true)
env.updateDayNight(now)
env.solarSky.visible = false
env.moon.visible = false
check('Below-horizon constellation lines are masked', difference(read(), new Uint8Array(width * height * 4)) === 0)
world.settings.set('constellationLines', false)
env.updateDayNight(now)
env.solarSky.visible = false
env.moon.visible = false

// Place a known bright point at screen center for occlusion and portal projection.
env.stars.visible = false
const probe = createStarField([[0, 0, -1, 0.65]])
probe.visible = true
probe.material.uniforms.opacity.value = 1
probe.material.uniforms.celestialRotation.value.set(0, 0, -1, 1, 0, 0, 0, -1, 0)
scene.add(probe)
aim(new THREE.Vector3(0, 1, 0))
const point = read()
check('Reference star renders', difference(point, new Uint8Array(width * height * 4)) > 0)
const blocker = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial({ color: 'black' }))
blocker.position.set(0, 5, 0)
scene.add(blocker)
check('Opaque world geometry covers stars', difference(read(), new Uint8Array(width * height * 4)) === 0)
blocker.removeFromParent()
env.moon.visible = true
env.moon.position.set(0, 900, 0)
env.moon.lookAt(0, 0, 0)
env.moon.scale.setScalar(20)
env.moon.material.uniforms.lightDirection.value.set(0, 0, 1)
env.moon.material.uniforms.opacity.value = 1
const moonAndStar = read()
probe.visible = false
check('Moon covers stars', difference(moonAndStar, read()) === 0)
env.moon.visible = false
probe.visible = true

// Portal cameras use an oblique near plane. Sky directions must ignore it and
// still render into the target; the aperture itself supplies the portal mask.
const target = new THREE.WebGLRenderTarget(width, height)
const projection = camera.projectionMatrix.clone()
camera.projectionMatrix.elements[2] = 0.2
camera.projectionMatrix.elements[6] = 0.3
renderer.setRenderTarget(target)
renderer.render(scene, camera)
const portalPixels = new Uint8Array(width * height * 4)
renderer.readRenderTargetPixels(target, 0, 0, width, height, portalPixels)
check('Oblique portal projection renders sky', difference(portalPixels, new Uint8Array(width * height * 4)) > 0)
renderer.setRenderTarget(null)
camera.projectionMatrix.copy(projection)
probe.removeFromParent()

env.updateDayNight(now)
aim(new THREE.Vector3(0, 0.55, -1))
renderer.toneMapping = THREE.NoToneMapping
const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType })
composer.addPass(new RenderPass(scene, camera))
composer.addPass(
  new EffectPass(
    camera,
    new BloomEffect({ luminanceThreshold: 1, intensity: 0.5 }),
    new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })
  )
)
const desktop = read(() => composer.render())
photo('Shipped catalog · desktop bloom and ACES')
env.stars.visible = false
const desktopPixels = difference(
  desktop,
  read(() => composer.render())
)
check('Desktop bloom pipeline shows catalog', desktopPixels > 150, { desktopPixels })
env.updateDayNight(Date.parse('2026-06-21T17:00:00Z'))
const day = read(() => composer.render())
env.stars.visible = true
check(
  'Daylight opacity hides stars',
  difference(
    day,
    read(() => composer.render())
  ) === 0
)
env.updateDayNight(now)
world.settings.dayNightCycle = false
env.updateDayNight(now)
check('Custom sky mode hides stars', !env.stars.visible)

// Exercise the actual same-world portal renderer, not just a projected camera.
world.settings.dayNightCycle = true
world.settings.constellationLines = true
env.updateDayNight(now)
world.environment = env
world.stage.octree = { insert() {}, move() {}, remove() {} }
world.setHot = () => {}
const graphics = new ClientGraphics(world)
graphics.renderer = renderer
world.graphics = graphics
const entrance = new Portal({
  portalId: 'entrance',
  target: 'exit',
  position: [0, 1.2, 0],
  resolution: 'max',
  updateRate: 0,
})
const exit = new Portal({ portalId: 'exit', position: [50, 1.2, -30], rotation: [0, Math.PI, 0] })
entrance.activate({ world })
exit.activate({ world })
for (const x of [-0.032, 0.032]) {
  const eye = new THREE.PerspectiveCamera(60, width / height, 0.2, 1200)
  eye.position.set(x, 1.2, 4)
  eye.lookAt(0, 2.6, 0)
  eye.updateMatrixWorld()
  const view = entrance.getView(eye)
  view.target.dispose()
  view.target = new THREE.WebGLRenderTarget(1, 1)
  env.stars.visible = true
  graphics.renderPortal(entrance, eye)
  const withStars = new Uint8Array(width * height * 4)
  renderer.readRenderTargetPixels(view.target, 0, 0, width, height, withStars)
  env.stars.visible = false
  graphics.renderPortal(entrance, eye)
  const withoutStars = new Uint8Array(withStars.length)
  renderer.readRenderTargetPixels(view.target, 0, 0, width, height, withoutStars)
  const portalPixels = difference(withStars, withoutStars)
  check(`Same-world portal renders stars and constellation lines for eye ${x}`, portalPixels > 150, { portalPixels })
}
entrance.deactivate()
exit.deactivate()
const pass = errors.length === 0 && values.every(value => value.pass)
document.querySelector('pre').textContent = JSON.stringify({ pass, values, errors }, null, 2)
document.title = `${pass ? 'PASS' : 'FAIL'}: catalog night sky`
composer.dispose()
target.dispose()
probe.geometry.dispose()
probe.material.dispose()
blocker.geometry.dispose()
blocker.material.dispose()
scene.environment.dispose()
env.destroy()
renderer.dispose()
