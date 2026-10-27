// THROWAWAY PROTOTYPE: compare four views of one scene, with ?variant=.
import * as THREE from 'three'
import { createVillage } from './village.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const $ = selector => document.querySelector(selector)
const stage = $('#stage')
const views = {
  isometric: {
    title: 'Pixel isometric',
    description: 'A fixed orthographic camera, crisp pixels, and real depth. Existing 3D objects stay in the world.',
    pitch: Math.atan(1 / Math.sqrt(2)),
    yaw: Math.PI / 4,
    orthographic: true,
  },
  hd2d: {
    title: 'Cinematic pixel',
    description:
      'A lower perspective camera, warm light, atmospheric depth, and bloom. Try the optional sprite character.',
    pitch: 0.42,
    yaw: 0.2,
    orthographic: false,
  },
  retro: {
    title: 'Retro orthographic',
    description:
      'A steep, straight-on camera and flatter lighting. An approximation of a classic sprite-world composition.',
    pitch: 0.88,
    yaw: 0,
    orthographic: true,
  },
  standard: {
    title: 'Standard 3D',
    description:
      'The same geometry and character at display resolution. Use this baseline to judge what pixelation changes.',
    pitch: 0.65,
    yaw: Math.PI / 4,
    orthographic: false,
  },
}
const keys = Object.keys(views)
let variant = new URL(location.href).searchParams.get('variant') || 'isometric'
if (!views[variant]) variant = 'isometric'
let yaw = views[variant].yaw
let renderWidth = 480
let renderHeight = 270
let frameCount = 0
let fps = 0
let lastTelemetry = performance.now()
let lastTime = performance.now()
let imported = null
const pressed = new Set()
const cameraTarget = new THREE.Vector3(0, 0, 0)
const cameraRight = new THREE.Vector3()
const cameraUp = new THREE.Vector3()

const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false })
renderer.setPixelRatio(1)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
renderer.outputColorSpace = THREE.SRGBColorSpace
stage.append(renderer.domElement)
const scene = new THREE.Scene()
scene.background = new THREE.Color('#22372f')
const ortho = new THREE.OrthographicCamera(-16, 16, 9, -9, 0.1, 100)
const perspective = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 100)
let camera = ortho
const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
const bloom = new UnrealBloomPass(new THREE.Vector2(480, 270), 0.6, 0.45, 0.72)
composer.addPass(renderPass)
composer.addPass(bloom)
composer.addPass(new OutputPass())

const ambient = new THREE.HemisphereLight('#e5edc7', '#284439', 2.1)
scene.add(ambient)
const sun = new THREE.DirectionalLight('#fff1cf', 3.0)
sun.position.set(-8, 15, 7)
sun.castShadow = true
sun.shadow.mapSize.set(1024, 1024)
Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 0.5, far: 50 })
sun.shadow.bias = -0.0007
sun.shadow.normalBias = 0.03
scene.add(sun)

const { village, obstacles, water, lanterns, box } = createVillage()
scene.add(village)

const player = new THREE.Group()
player.position.set(0.3, 0.12, 4.8)
scene.add(player)
const meshAvatar = new THREE.Group()
player.add(meshAvatar)
box(meshAvatar, 0, 0.68, 0, 0.45, 0.66, 0.27, '#517888')
box(meshAvatar, 0, 1.18, 0, 0.4, 0.38, 0.34, '#ddb58b')
box(meshAvatar, 0, 1.4, -0.03, 0.45, 0.18, 0.38, '#634636')
box(meshAvatar, 0, 1.0, 0.18, 0.49, 0.12, 0.13, '#cf7053')
const legs = [-0.14, 0.14].map(x => box(meshAvatar, x, 0.24, 0, 0.18, 0.48, 0.21, '#374c49'))
const arms = [-0.33, 0.33].map(x => box(meshAvatar, x, 0.67, 0, 0.17, 0.56, 0.19, '#517888'))

// Original 16 × 24 character, drawn as pixel data. No game artwork is copied.
const spriteFrames = []
const spritePalette = { h: '#634636', s: '#edc49a', c: '#63899b', r: '#d57354', b: '#344a4b', e: '#26392f' }
const spriteRows = [
  '      hhhhh     ',
  '     hhhhhhh    ',
  '     hhssshh    ',
  '     ssssssh    ',
  '     sesesss    ',
  '      sssss     ',
  '      rrrrr     ',
  '    cccccccc    ',
  '   cccccccccc   ',
  '   sccccccccs   ',
  '   sccccccccs   ',
  '   sccccccccs   ',
  '    cccccccc    ',
  '    cccccccc    ',
  '     bbbbbb     ',
  '     bbbbbb     ',
  '     bb  bb     ',
  '     bb  bb     ',
  '     ee  ee     ',
  '    eee  eee    ',
]
for (let frame = 0; frame < 3; frame++) {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 24
  const context = canvas.getContext('2d')
  spriteRows.forEach((row, y) =>
    [...row].forEach((pixel, x) => {
      if (!spritePalette[pixel]) return
      context.fillStyle = spritePalette[pixel]
      const step = y > 15 ? (x < 8 ? frame - 1 : 1 - frame) : 0
      context.fillRect(x, y + step + 2, 1, 1)
    })
  )
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.colorSpace = THREE.SRGBColorSpace
  spriteFrames.push(texture)
}
const spriteMaterial = new THREE.MeshBasicMaterial({ map: spriteFrames[1], alphaTest: 0.5, side: THREE.DoubleSide })
const spriteAvatar = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.5), spriteMaterial)
spriteAvatar.position.y = 0.75
spriteAvatar.visible = false
player.add(spriteAvatar)
const contactShadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.32, 16),
  new THREE.MeshBasicMaterial({ color: '#263b2d', transparent: true, opacity: 0.35, depthWrite: false })
)
contactShadow.rotation.x = -Math.PI / 2
contactShadow.position.y = 0.005
player.add(contactShadow)

function updateLighting() {
  const night = $('#night').checked
  const retro = variant === 'retro'
  ambient.intensity = night ? 0.7 : retro ? 3.0 : 2.1
  ambient.color.set(night ? '#8098ce' : '#e5edc7')
  sun.color.set(night ? '#cfa480' : '#fff1cf')
  sun.intensity = night ? 0.65 : retro ? 0.55 : 3.0
  scene.background.set(night ? '#1b2936' : '#22372f')
  stage.parentElement.style.backgroundColor = `#${scene.background.getHexString()}`
  scene.fog = variant === 'hd2d' ? new THREE.Fog(night ? '#1b2936' : '#54705b', 26, 58) : null
  for (const lamp of lanterns) lamp.emissiveIntensity = night ? 3.5 : 0.5
  bloom.enabled = variant === 'hd2d'
}
function resize() {
  const rect = stage.getBoundingClientRect()
  const maxWidth = Math.max(1, rect.width - 24)
  const maxHeight = Math.max(1, rect.height - 150)
  const baseWidth = Number($('#resolution').value)
  const baseHeight = Math.round((baseWidth * 9) / 16)
  const scale = Math.min(maxWidth / baseWidth, maxHeight / baseHeight)
  const integerScale = scale >= 1 ? Math.floor(scale) : scale
  const displayWidth = Math.round(baseWidth * integerScale)
  const displayHeight = Math.round(baseHeight * integerScale)
  const standard = variant === 'standard'
  renderWidth = standard ? Math.round(displayWidth * Math.min(devicePixelRatio, 2)) : baseWidth
  renderHeight = standard ? Math.round(displayHeight * Math.min(devicePixelRatio, 2)) : baseHeight
  renderer.setSize(renderWidth, renderHeight, false)
  composer.setSize(renderWidth, renderHeight)
  renderer.domElement.style.width = `${displayWidth}px`
  renderer.domElement.style.height = `${displayHeight}px`
  renderer.domElement.classList.toggle('smooth', standard)
  const aspect = renderWidth / renderHeight
  const halfHeight = 9.0
  ortho.left = -halfHeight * aspect
  ortho.right = halfHeight * aspect
  ortho.top = halfHeight
  ortho.bottom = -halfHeight
  ortho.updateProjectionMatrix()
  perspective.aspect = aspect
  perspective.updateProjectionMatrix()
}
function setVariant(next) {
  if (!views[next]) return
  variant = next
  yaw = views[next].yaw
  camera = views[next].orthographic ? ortho : perspective
  renderPass.camera = camera
  $('#view-title').textContent = views[next].title
  $('#view-description').textContent = views[next].description
  for (const button of document.querySelectorAll('[data-variant]')) {
    button.classList.toggle('active', button.dataset.variant === next)
    button.setAttribute('aria-pressed', String(button.dataset.variant === next))
  }
  const url = new URL(location.href)
  url.searchParams.set('variant', next)
  history.replaceState(null, '', url)
  $('#snap').disabled = !views[next].orthographic
  updateLighting()
  resize()
}
function cycle(direction) {
  setVariant(keys[(keys.indexOf(variant) + direction + keys.length) % keys.length])
}
$('#previous').onclick = () => cycle(-1)
$('#next').onclick = () => cycle(1)
for (const button of document.querySelectorAll('[data-variant]'))
  button.onclick = () => setVariant(button.dataset.variant)
$('#resolution').onchange = resize
$('#night').onchange = updateLighting
$('#avatar').onchange = () => {
  spriteAvatar.visible = $('#avatar').value === 'sprite'
  meshAvatar.visible = !spriteAvatar.visible
}
$('#apply-default').onclick = () => setVariant($('#world-default').value)
function resetPosition() {
  player.position.set(0.3, 0.12, 4.8)
  cameraTarget.set(0, 0, 0)
  yaw = views[variant].yaw
}
addEventListener('keydown', event => {
  if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return
  const key = event.key.toLowerCase()
  if (['arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'q', 'e', 'r'].includes(key)) event.preventDefault()
  pressed.add(key)
  if (event.repeat) return
  if (key === 'arrowleft') cycle(-1)
  if (key === 'arrowright') cycle(1)
  if (key === 'q') yaw -= Math.PI / 4
  if (key === 'e') yaw += Math.PI / 4
  if (key === 'r') resetPosition()
})
addEventListener('keyup', event => pressed.delete(event.key.toLowerCase()))
addEventListener('blur', () => pressed.clear())
new ResizeObserver(resize).observe(stage)

function disposeImported() {
  if (!imported) return
  scene.remove(imported)
  const textures = new Set()
  const materials = new Set()
  const geometries = new Set()
  imported.traverse(object => {
    if (object.geometry) geometries.add(object.geometry)
    for (const mat of object.material ? [object.material].flat() : []) {
      materials.add(mat)
      for (const value of Object.values(mat)) if (value?.isTexture) textures.add(value)
    }
  })
  textures.forEach(texture => texture.dispose())
  materials.forEach(mat => mat.dispose())
  geometries.forEach(geometry => geometry.dispose())
  imported = null
}
$('#model-file').onchange = async event => {
  const file = event.target.files[0]
  if (!file) return
  $('#asset-status').textContent = 'Reading local scene…'
  try {
    // Reject external resources: the scene must be a self-contained GLB.
    const manager = new THREE.LoadingManager()
    manager.setURLModifier(url => {
      if (url.startsWith('blob:') || url.startsWith('data:')) return url
      throw new Error('This preview requires a self-contained GLB without external resources.')
    })
    const gltf = await new GLTFLoader(manager).parseAsync(await file.arrayBuffer(), '')
    const bounds = new THREE.Box3().setFromObject(gltf.scene)
    if (bounds.isEmpty()) throw new Error('The GLB contains no visible geometry.')
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const scale = 16 / Math.max(size.x, size.z, size.y, 0.001)
    const group = new THREE.Group()
    group.add(gltf.scene)
    gltf.scene.position.sub(center)
    gltf.scene.position.y += size.y / 2
    group.scale.setScalar(scale)
    group.traverse(object => {
      if (object.isMesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    disposeImported()
    imported = group
    scene.add(imported)
    village.visible = false
    $('#scene-name').textContent = file.name.toUpperCase()
    $('#asset-status').textContent =
      'Local GLB preview. Movement is on a flat plane; imported collision and animation are not loaded.'
    $('#restore-demo').hidden = false
    resetPosition()
  } catch (error) {
    $('#asset-status').textContent = `Could not load scene: ${error.message}`
  }
}
$('#restore-demo').onclick = () => {
  disposeImported()
  village.visible = true
  $('#scene-name').textContent = 'PROCEDURAL VILLAGE'
  $('#model-file').value = ''
  $('#asset-status').textContent = 'Load a local, self-contained .glb. No upload.'
  $('#restore-demo').hidden = true
  resetPosition()
}

const movement = new THREE.Vector3()
const nextPosition = new THREE.Vector3()
const focus = new THREE.Vector3()
function animate(time) {
  const delta = Math.min((time - lastTime) / 1000, 0.05)
  lastTime = time
  movement.set(
    Number(pressed.has('d')) - Number(pressed.has('a')),
    0,
    Number(pressed.has('s')) - Number(pressed.has('w'))
  )
  const walking = movement.lengthSq() > 0
  if (walking) {
    movement.normalize().applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw)
    nextPosition.copy(player.position).addScaledVector(movement, delta * 3)
    const blocked =
      !imported &&
      (obstacles.some(
        obstacle => Math.hypot(nextPosition.x - obstacle.x, nextPosition.z - obstacle.z) < obstacle.radius + 0.25
      ) ||
        (nextPosition.x > 4.15 && nextPosition.x < 6.5 && (nextPosition.z < 1.85 || nextPosition.z > 3.65)))
    if (!blocked) {
      player.position.x = THREE.MathUtils.clamp(nextPosition.x, -8.3, 8.3)
      player.position.z = THREE.MathUtils.clamp(nextPosition.z, -6.9, 6.9)
    }
    meshAvatar.rotation.y = Math.atan2(movement.x, movement.z)
  }
  const stride = walking ? Math.sin(time * 0.012) * 0.6 : 0
  legs.forEach((leg, i) => {
    leg.rotation.x = i ? stride : -stride
  })
  arms.forEach((arm, i) => {
    arm.rotation.x = i ? -stride : stride
  })
  spriteMaterial.map = spriteFrames[walking ? Math.floor(time / 150) % 3 : 1]
  // Preserve the simulated position. Snap only the visual camera in its screen-space basis.
  focus.set($('#follow').checked ? player.position.x : 0, 0.3, $('#follow').checked ? player.position.z : 0)
  cameraTarget.lerp(focus, 1 - Math.exp(-delta * 5))
  const view = views[variant]
  const radius = view.orthographic ? 32 : variant === 'hd2d' ? 36 : 33
  camera.position
    .set(
      Math.sin(yaw) * Math.cos(view.pitch) * radius,
      Math.sin(view.pitch) * radius,
      Math.cos(yaw) * Math.cos(view.pitch) * radius
    )
    .add(cameraTarget)
  camera.lookAt(cameraTarget)
  camera.updateMatrixWorld()
  if (view.orthographic && $('#snap').checked) {
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0)
    cameraUp.setFromMatrixColumn(camera.matrixWorld, 1)
    const unitsPerPixel = (ortho.top - ortho.bottom) / renderHeight
    for (const axis of [cameraRight, cameraUp]) {
      const coordinate = camera.position.dot(axis)
      camera.position.addScaledVector(axis, Math.round(coordinate / unitsPerPixel) * unitsPerPixel - coordinate)
    }
    camera.updateMatrixWorld()
  }
  spriteAvatar.quaternion.copy(camera.quaternion)
  for (let i = 0; i < water.length; i++) water[i].position.y = 0.015 + Math.sin(time * 0.0017 + i) * 0.009
  if (variant === 'hd2d') composer.render(delta)
  else renderer.render(scene, camera)
  frameCount++
  if (time - lastTelemetry > 600) {
    fps = Math.round((frameCount * 1000) / (time - lastTelemetry))
    frameCount = 0
    lastTelemetry = time
    $('#telemetry').textContent =
      `${renderWidth} × ${renderHeight} · ${fps} FPS · PLAYER ${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)}`
  }
}
setVariant(variant)
renderer.setAnimationLoop(animate)
