// Run node scripts/test-light-shadows.mjs --budget, then open its URL in Chrome.
import * as THREE from 'three'
import { ClientGraphics } from './ClientGraphics'
import { CSM } from '../libs/csm/CSM'
import { EffectComposer, RenderPass } from 'postprocessing'

const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true })
renderer.setSize(256, 256)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
const scene = new THREE.Scene()
scene.background = new THREE.Color('#111111')
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 30)
camera.position.set(0, 1, 5)
camera.lookAt(0, 1, 0)
camera.updateMatrixWorld(true)
const csm = new CSM({ parent: scene, camera, cascades: 3, maxCascades: 3, maxFar: 30, shadowMapSize: 128 })
const environment = new THREE.CubeTexture(
  Array(6).fill(Object.assign(document.createElement('canvas'), { width: 1, height: 1 }))
)
environment.needsUpdate = true
scene.environment = environment
function texture(r, g, b) {
  const map = new THREE.DataTexture(new Uint8Array([r, g, b, 255]), 1, 1)
  map.needsUpdate = true
  return map
}
const material = new THREE.MeshStandardMaterial({
  map: texture(255, 64, 64),
  aoMap: texture(255, 255, 255),
  normalMap: texture(128, 128, 255),
  roughnessMap: texture(128, 128, 128),
  metalnessMap: texture(0, 0, 0),
  roughness: 1,
})
csm.setupMaterial(material)
const geometry = new THREE.BoxGeometry(1, 2, 1)
geometry.setAttribute(
  'skinIndex',
  new THREE.Uint16BufferAttribute(new Uint16Array(geometry.attributes.position.count * 4), 4)
)
const weights = new Float32Array(geometry.attributes.position.count * 4)
for (let i = 0; i < weights.length; i += 4) weights[i] = 1
geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4))
const mesh = new THREE.SkinnedMesh(geometry, material)
const bone = new THREE.Bone()
mesh.add(bone)
mesh.bind(new THREE.Skeleton([bone]))
mesh.position.y = 1
mesh.receiveShadow = true
mesh.castShadow = true
scene.add(mesh, new THREE.AmbientLight(0xffffff, 2))
const points = Array.from({ length: 8 }, (_, i) => {
  const light = new THREE.PointLight(0xffffff, 1, 20)
  light.position.set(i - 4, 3, 3)
  light.castShadow = true
  light.shadow.mapSize.set(64, 64)
  scene.add(light)
  return light
})
const errors = []
renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
  errors.push(gl.getProgramInfoLog(program) + gl.getShaderInfoLog(vertex) + gl.getShaderInfoLog(fragment))
}
const graphics = new ClientGraphics({ stage: { scene }, camera, environment: { csm } })
graphics.renderer = renderer
graphics.usePostprocessing = false
const results = []
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
for (const [label, render] of [
  ['Direct render', () => graphics.render()],
  [
    'Composer path',
    () => {
      graphics.usePostprocessing = true
      graphics.composer = composer
      graphics.render()
    },
  ],
]) {
  csm.update()
  render()
  const gl = renderer.getContext()
  const pixels = new Uint8Array(256 * 256 * 4)
  gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  let bodyPixels = 0
  for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > pixels[i + 1] * 1.5 && pixels[i] > 50) bodyPixels++
  const restored = [...points, ...csm.lights].every(light => light.castShadow)
  results.push({ label, bodyPixels, restored, pass: bodyPixels > 2000 && restored && errors.length === 0 })
  const image = new Image()
  image.src = renderer.domElement.toDataURL()
  const caption = document.createElement('div')
  caption.textContent = label
  caption.append(image)
  document.body.append(caption)
}
const pass = results.every(result => result.pass)
const output = document.createElement('pre')
output.textContent = JSON.stringify({ pass, maxTextures: renderer.capabilities.maxTextures, results, errors }, null, 2)
document.body.append(output)
document.title = `${pass ? 'PASS' : 'FAIL'}: shadow sampler budget`
renderer.dispose()
composer.dispose()
csm.dispose()
geometry.dispose()
material.dispose()
environment.dispose()
