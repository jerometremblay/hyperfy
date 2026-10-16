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
const graphics = new ClientGraphics({ stage: { scene }, camera, environment: { csm, renderExposure: 1.1 } })
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
  const exposureApplied = renderer.toneMappingExposure === 1.1
  results.push({
    label,
    bodyPixels,
    restored,
    exposureApplied,
    pass: bodyPixels > 2000 && restored && exposureApplied && errors.length === 0,
  })
  const image = new Image()
  image.src = renderer.domElement.toDataURL()
  const caption = document.createElement('div')
  caption.textContent = label
  caption.append(image)
  document.body.append(caption)
}
function testStaticShadowCache() {
  const cacheScene = new THREE.Scene()
  const cacheCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 30)
  cacheCamera.position.set(0, 2, 5)
  cacheCamera.lookAt(0, 1, 0)
  cacheCamera.updateMatrixWorld(true)

  const floorGeometry = new THREE.PlaneGeometry(12, 12)
  const floorMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff' })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  cacheScene.add(floor)

  const boxGeometry = new THREE.BoxGeometry(1, 2, 1)
  const boxMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff' })
  const box = new THREE.Mesh(boxGeometry, boxMaterial)
  box.position.y = 1
  box.castShadow = true
  cacheScene.add(box)

  const makeLight = x => {
    const light = new THREE.PointLight(0xffffff, 1, 20)
    light.position.set(x, 3, 3)
    light.castShadow = true
    light.shadow.mapSize.set(64, 64)
    cacheScene.add(light)
    return light
  }
  const staticLight = makeLight(-2)
  const dynamicLight = makeLight(2)
  staticLight.shadow.autoUpdate = false
  staticLight.shadow.needsUpdate = true

  let staticFaces = 0
  let dynamicFaces = 0
  const staticGetCamera = staticLight.shadow.getCamera
  const dynamicGetCamera = dynamicLight.shadow.getCamera
  staticLight.shadow.getCamera = function (...args) {
    staticFaces++
    return staticGetCamera.apply(this, args)
  }
  dynamicLight.shadow.getCamera = function (...args) {
    dynamicFaces++
    return dynamicGetCamera.apply(this, args)
  }

  const scene = graphics.world.stage.scene
  const camera = graphics.world.camera
  const usePostprocessing = graphics.usePostprocessing
  graphics.world.stage.scene = cacheScene
  graphics.world.camera = cacheCamera
  graphics.usePostprocessing = false
  try {
    graphics.render()
    const firstRender = {
      staticFaces: staticFaces === 6,
      dynamicFaces: dynamicFaces === 6,
      staticRequestConsumed: staticLight.shadow.needsUpdate === false,
    }
    graphics.render()
    graphics.render()
    const pass =
      firstRender.staticFaces &&
      firstRender.dynamicFaces &&
      firstRender.staticRequestConsumed &&
      staticFaces === 6 &&
      dynamicFaces === 18
    return { pass, firstRender, staticFaces, dynamicFaces }
  } finally {
    graphics.world.stage.scene = scene
    graphics.world.camera = camera
    graphics.usePostprocessing = usePostprocessing
    staticLight.dispose()
    dynamicLight.dispose()
    floorGeometry.dispose()
    floorMaterial.dispose()
    boxGeometry.dispose()
    boxMaterial.dispose()
  }
}

function testCloseBlocker(type) {
  const closeScene = new THREE.Scene()
  closeScene.background = new THREE.Color('#111111')
  closeScene.add(new THREE.AmbientLight(0xffffff, 0.4))

  const receiverGeometry = new THREE.PlaneGeometry(6, 6)
  const receiverMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    side: THREE.DoubleSide,
    roughness: 1,
  })
  const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial)
  receiver.position.x = -2.5
  receiver.rotation.y = Math.PI / 2
  receiver.receiveShadow = true
  closeScene.add(receiver)

  const blockerGeometry = new THREE.BoxGeometry(0.04, 0.7, 0.7)
  const blockerMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff' })
  const blocker = new THREE.Mesh(blockerGeometry, blockerMaterial)
  blocker.castShadow = true
  closeScene.add(blocker)

  const light = type === 'spot'
    ? new THREE.SpotLight(0xffffff, 120, 8, Math.PI / 4, 0, 2)
    : new THREE.PointLight(0xffffff, 120, 8, 2)
  light.position.set(0.22, 0, 0)
  if (light.isSpotLight) light.target.position.set(-2, 0, 0)
  light.castShadow = true
  light.shadow.mapSize.set(512, 512)
  light.shadow.bias = -0.0005
  closeScene.add(light)
  if (light.target) closeScene.add(light.target)

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20)
  camera.position.set(5, 3, 3)
  camera.lookAt(-2.5, 0, 0)
  camera.updateMatrixWorld(true)

  const originalToneMapping = renderer.toneMapping
  const originalSize = renderer.getSize(new THREE.Vector2())
  const originalAutoUpdate = renderer.shadowMap.autoUpdate
  const originalNeedsUpdate = renderer.shadowMap.needsUpdate
  renderer.toneMapping = THREE.NoToneMapping
  renderer.shadowMap.autoUpdate = true
  renderer.setSize(256, 256)

  const sampleReceiver = near => {
    light.shadow.camera.near = near
    light.shadow.camera.updateProjectionMatrix()
    light.shadow.needsUpdate = true
    renderer.shadowMap.needsUpdate = true
    renderer.render(closeScene, camera)

    const pixel = new THREE.Vector3(-2.5, 0, 0).project(camera)
    const x = Math.round((pixel.x * 0.5 + 0.5) * 255)
    const y = Math.round((pixel.y * 0.5 + 0.5) * 255)
    const pixels = new Uint8Array(256 * 256 * 4)
    const gl = renderer.getContext()
    gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    let luminance = 0
    let count = 0
    for (let py = Math.max(0, y - 4); py <= Math.min(255, y + 4); py++) {
      for (let px = Math.max(0, x - 4); px <= Math.min(255, x + 4); px++) {
        const index = (py * 256 + px) * 4
        luminance += pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722
        count++
      }
    }
    return luminance / count
  }

  try {
    const defaultNear = sampleReceiver(0.25)
    blocker.visible = false
    const unblocked = sampleReceiver(0.05)
    blocker.visible = true
    const closeNear = sampleReceiver(0.05)
    return {
      defaultNear,
      unblocked,
      closeNear,
      cameraNear: light.shadow.camera.near,
      type,
      pass: closeNear < defaultNear * 0.8,
    }
  } finally {
    renderer.toneMapping = originalToneMapping
    renderer.shadowMap.autoUpdate = originalAutoUpdate
    renderer.shadowMap.needsUpdate = originalNeedsUpdate
    renderer.setSize(originalSize.x, originalSize.y)
    light.dispose()
    receiverGeometry.dispose()
    receiverMaterial.dispose()
    blockerGeometry.dispose()
    blockerMaterial.dispose()
  }
}

const shadowCache = testStaticShadowCache()
const closeBlockers = Object.fromEntries(['spot', 'point'].map(type => [type, testCloseBlocker(type)]))
const pass = results.every(result => result.pass) && shadowCache.pass && Object.values(closeBlockers).every(result => result.pass)
const output = document.createElement('pre')
output.textContent = JSON.stringify({ pass, maxTextures: renderer.capabilities.maxTextures, results, shadowCache, closeBlockers, errors }, null, 2)
document.body.append(output)
document.title = `${pass ? 'PASS' : 'FAIL'}: shadow sampler, cache, and near-plane checks`
renderer.dispose()
composer.dispose()
csm.dispose()
geometry.dispose()
material.dispose()
environment.dispose()
