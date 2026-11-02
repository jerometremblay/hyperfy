import * as THREE from '../../../src/core/extras/three'
import { Portal } from '../../../src/core/nodes/Portal'
import { ClientGraphics } from '../../../src/core/systems/ClientGraphics'

const errors = []
window.addEventListener('error', event => errors.push(event.message))
const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true })
renderer.setSize(640, 480)
renderer.toneMapping = THREE.NoToneMapping
renderer.debug.onShaderError = (gl, program) => errors.push(gl.getProgramInfoLog(program))
document.body.appendChild(renderer.domElement)
const world = {
  stage: {
    scene: new THREE.Scene(),
    dirtyNodes: new Set(),
    octree: { insert() {}, move() {}, remove() {} },
  },
  setHot() {},
}
world.stage.scene.background = new THREE.Color('#28436c')
const remote = {
  stage: { scene: new THREE.Scene() },
  graphics: { portals: new Set() },
  rig: new THREE.Object3D(),
  camera: new THREE.PerspectiveCamera(),
  environment: { lateUpdate() {}, csm: { update() {} } },
}
remote.stage.scene.background = new THREE.Color('#22cc66')
const graphics = world.graphics = new ClientGraphics(world)
graphics.renderer = renderer
world.portalPreviews = { get: () => ({ matrixWorld: new THREE.Matrix4(), world: remote }) }
const portal = new Portal({
  portalId: 'covered-door', url: 'https://destination.example', target: 'exit',
  width: 2, height: 2.4, doubleside: true, resolution: 256, updateRate: 15,
  position: [4, 1.2, 6], rotation: [0, Math.PI / 3, 0], scale: [1.5, 1, .5],
})
portal.activate({ world })
let passes = 0
const render = renderer.render.bind(renderer)
renderer.render = (scene, camera) => {
  if (scene === remote.stage.scene) passes++
  return render(scene, camera)
}
const checks = []
const check = (condition, message) => { if (!condition) throw new Error(message) }
function draw(side, x = 0) {
  const eye = new THREE.PerspectiveCamera(50, 640 / 480, .05, 100)
  eye.position.set(x, 0, side * 6).applyMatrix4(portal.matrixWorld)
  eye.lookAt(new THREE.Vector3().setFromMatrixPosition(portal.matrixWorld))
  eye.updateMatrixWorld()
  const before = passes
  renderer.render(world.stage.scene, eye)
  const pixel = new Uint8Array(4)
  const gl = renderer.getContext()
  gl.readPixels(320, 240, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
  return { passes: passes - before, pixel: [...pixel], eye }
}
function verify(label, side, enabled, x = 0) {
  const result = draw(side, x)
  check(result.passes === (enabled ? 1 : 0), label + ': unexpected destination scene pass count')
  check(enabled ? result.pixel[1] > 150 && result.pixel[1] > result.pixel[0] * 2
    : result.pixel.slice(0, 3).every(value => value === 0), label + ': wrong surface color')
  checks.push({ label, passes: result.passes, pixel: result.pixel })
  return result
}
try {
  verify('front enabled', 1, true)
  portal.previewFront = false
  portal.setStatus('Destination portal not found')
  for (const x of [-.032, .032]) verify('covered front stereo eye ' + x, 1, false, x)
  portal.setStatus('')
  verify('opposite side remains enabled', -1, true)
  portal.previewBack = false
  verify('covered back', -1, false)
  portal.previewFront = true
  const { eye } = verify('front resumes immediately', 1, true)
  const before = passes
  portal.previewFront = false
  renderer.render(world.stage.scene, eye)
  check(passes === before, 'covered cached view must skip rendering')
  portal.previewFront = true
  renderer.render(world.stage.scene, eye)
  check(passes === before + 1, 'reopening must invalidate the same eye cache')
  verify('back remains disabled', -1, false)
  check(errors.length === 0, errors.join('\n'))
  window.result = { valid: true, actualWebGL: true, transformedStereo: true,
    shaderErrors: errors, cachedEyeResumesImmediately: true, checks }
  document.querySelector('pre').textContent = JSON.stringify(window.result, null, 2)
  document.title = 'PASS: explicit portal preview visibility'
} catch (error) {
  window.result = { valid: false, error: error.message, errors, checks }
  document.querySelector('pre').textContent = JSON.stringify(window.result, null, 2)
  document.title = 'FAIL: explicit portal preview visibility'
}
