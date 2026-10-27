import * as THREE from './three'
import { Stage } from '../systems/Stage'
import { ClientGraphics } from '../systems/ClientGraphics'
import { ClientCSS } from '../systems/ClientCSS'
import { Mesh } from '../nodes/Mesh'
import { Group } from '../nodes/Group'
import { Prim } from '../nodes/Prim'
import { Portal } from '../nodes/Portal'
import { CSM } from '../libs/csm/CSM'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js'

const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: false })
renderer.localClippingEnabled = true
renderer.setSize(320, 240)
const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.2, 100)
camera.position.set(12, 13, 12)
camera.lookAt(0, 1, 0)
camera.updateMatrixWorld(true)
const world = {
  time: 0,
  camera,
  rig: new THREE.Group(),
  setupMaterial() {},
  setHot() {},
  network: { isServer: false },
  builder: { enabled: false },
  entities: { player: { base: { position: new THREE.Vector3() }, capsuleHeight: 1.6, capsuleRadius: 0.3 } },
}
world.stage = new Stage(world)
world.stage.init({ viewport: {} })
world.stage.scene.background = new THREE.Color('#182434')
const root = new Group()
const house = { isApp: true, root, worldNodes: new Set(), data: { id: 'house' } }
root.activate({ world, entity: house })
const outside = { isApp: true, root: new Group(), worldNodes: new Set(), data: { id: 'outside' } }
outside.root.activate({ world, entity: outside })
const interior = { isApp: true, root: new Group(), worldNodes: new Set(), data: { id: 'furniture' } }
interior.root.activate({ world, entity: interior })
world.entities.items = new Map([
  ['house', house],
  ['outside', outside],
  ['furniture', interior],
])
const roof = new Mesh({
  type: 'geometry',
  geometry: mergeGeometries([
    new THREE.BoxGeometry(6, 0.2, 6).translate(0, 3, 0),
    new THREE.BoxGeometry(6, 3, 0.2).translate(0, 1.5, 2.5),
  ]),
  material: new THREE.MeshBasicMaterial({ color: '#ff2222' }),
})
root.add(roof)
const unrelated = roof.clone()
unrelated.position.x = 8
outside.root.add(unrelated)
const floor = new Mesh({
  type: 'geometry',
  geometry: new THREE.BoxGeometry(16, 0.2, 16),
  material: new THREE.MeshBasicMaterial({ color: '#344455' }),
  position: [0, -0.2, 0],
})
root.add(floor)
const room = new Mesh({
  type: 'geometry',
  geometry: new THREE.BoxGeometry(1.5, 2, 1.5),
  material: new THREE.MeshBasicMaterial({ color: '#ffdd22' }),
  position: [-2, 4.2, -1.5],
})
root.add(room)
const furniture = new Mesh({
  type: 'geometry',
  geometry: new THREE.BoxGeometry(0.7, 0.7, 0.7),
  material: new THREE.MeshBasicMaterial({ color: '#2266ff' }),
  position: [1.5, 4.5, -1.5],
})
interior.root.add(furniture)
const outsideFurniture = furniture.clone()
outsideFurniture.position.x = 8.5
outside.root.add(outsideFurniture)
world.stage.update()
const avatar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.6), new THREE.MeshBasicMaterial({ color: '#22ff44' }))
avatar.position.y = 0.8
world.stage.scene.add(avatar)
const graphics = new ClientGraphics(world)
world.graphics = graphics
graphics.renderer = renderer
graphics.renderStyle = 'pixel-isometric'
graphics.usePostprocessing = false
const errors = []
renderer.debug.onShaderError = (gl, program) => errors.push(gl.getProgramInfoLog(program))
const results = []
const avatarPoint = [0, 1, 0]
const pixelPosition = position => {
  const point = new THREE.Vector3(...position).project(camera)
  return [Math.round((point.x * 0.5 + 0.5) * 320), Math.round((point.y * 0.5 + 0.5) * 240)]
}
const pixel = new Uint8Array(4)
const read = (position = avatarPoint) => {
  const [x, y] = pixelPosition(position)
  renderer.getContext().readPixels(x, y, 1, 1, renderer.getContext().RGBA, renderer.getContext().UNSIGNED_BYTE, pixel)
  return [...pixel]
}
const check = (label, color, expected) => {
  const red = color[0] > color[1] + 40 && color[0] > color[2] + 40
  const pass =
    expected === 'avatar' ? color[1] > color[0] + 40 && color[1] > color[2] + 40 : expected === 'clipped' ? !red : red
  results.push({ label, pass, color })
}
const yellow = color => color[0] > color[2] + 40 && color[1] > color[2] + 40
const blue = color => color[2] > color[0] + 40 && color[2] > color[1] + 40
const roomPoint = [-2, 4.2, -1.1]
const furniturePoint = [1.5, 4.5, -1.1]
const snapshot = label => {
  const card = document.createElement('div')
  const image = new Image()
  image.src = renderer.domElement.toDataURL()
  const caption = document.createElement('p')
  caption.textContent = label
  card.append(image, caption)
  examples.append(card)
}
const examples = document.createElement('section')
examples.className = 'examples'
document.body.append(examples)

renderer.render(world.stage.scene, camera)
check('Merged building obstructs the avatar before clipping', read(), 'roof')
results.push({ label: 'Separate upstairs room is visible before the cut', pass: yellow(read(roomPoint)) })
results.push({ label: 'Independent upstairs furniture is visible before the cut', pass: blue(read(furniturePoint)) })
snapshot('Before: house, upstairs room and furniture')
graphics.render()
check('Isometric cut reveals the avatar', read(), 'avatar')
check('Lower wall remains visible below the plane', read([0, 0.5, 2.6]), 'roof')
check('Upper wall is removed above the plane', read([0, 2.7, 2.6]), 'clipped')
check('Other instance of the same building remains complete', read([8, 2.5, 2.6]), 'roof')
results.push({ label: 'Entire upstairs room is removed, including unhit geometry', pass: !yellow(read(roomPoint)) })
results.push({ label: 'Independent upstairs furniture is included in the cut', pass: !blue(read(furniturePoint)) })
results.push({ label: 'Same furniture outside the house remains visible', pass: blue(read([8.5, 4.5, -1.1])) })
snapshot('After: whole app and interior objects cut')
for (let i = 1; i <= 10; i++) {
  world.time = i * 0.11
  graphics.render()
  check(`Frame ${i}: clipped model stays detectable`, read(), 'avatar')
}

// Render a second camera recursively, as a native portal does. Separate GPU
// buffers and clipped replacement draws must survive returning to the main view.
const portalTarget = new THREE.WebGLRenderTarget(320, 240)
let nested = false
avatar.renderOrder = -1
avatar.onBeforeRender = () => {
  if (nested) return
  nested = true
  const resume = graphics.cameraOcclusion.suspend()
  const target = renderer.getRenderTarget()
  renderer.setRenderTarget(portalTarget)
  renderer.render(world.stage.scene, camera)
  const [x, y] = pixelPosition(avatarPoint)
  renderer.readRenderTargetPixels(portalTarget, x, y, 1, 1, pixel)
  check('Portal camera sees the original roof', [...pixel], 'roof')
  renderer.setRenderTarget(target)
  resume?.()
  nested = false
}
graphics.render()
check('Main view remains unobstructed after the nested portal draw', read(), 'avatar')
snapshot('After portal draw: avatar still visible')
avatar.onBeforeRender = () => {}

graphics.renderStyle = 'pixel-retro'
camera.position.set(0, 18, 15)
camera.lookAt(0, 1, 0)
camera.updateMatrixWorld(true)
world.time += 0.11
graphics.render()
check('Retro cut reveals the avatar', read(), 'avatar')
check('Retro keeps the lower wall', read([0, 0.5, 2.6]), 'roof')

graphics.cameraOcclusion.clear()
renderer.render(world.stage.scene, camera)
check('Clearing restores roof rendering', read(), 'roof')
snapshot('Restored ceiling')
roof.cameraOcclusion = false
world.time = 2
graphics.render()
check('Opted-out roofs remain visible', read(), 'roof')

// A native primitive uses per-instance color/emissive attributes in its normal
// batch. Its individual cut draw must retain those properties and compile.
const column = new Prim({
  type: 'box',
  position: [-4, 2, 0],
  scale: [1, 4, 1],
  color: '#00ff00',
  emissive: '#00ff00',
  emissiveIntensity: 1,
})
root.add(column)
world.stage.update()
const restoreColumn = column.handle.clipForCamera(new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.85))
renderer.render(world.stage.scene, camera)
check('Clipped primitive retains green color and emissive below the plane', read([-4, 1, 0.5]), 'avatar')
const upperColumn = read([-4, 3, 0.5])
results.push({
  label: 'Primitive geometry above the plane is removed',
  pass: !(upperColumn[1] > upperColumn[0] + 40 && upperColumn[1] > upperColumn[2] + 40),
  color: upperColumn,
})
restoreColumn()

// The live world adds CSM hooks to materials. Reusing a cut draw must preserve
// those hooks and settle on cached programs rather than compile every frame.
column.deactivate()
const csm = new CSM({
  parent: world.stage.scene,
  camera,
  cascades: 1,
  maxCascades: 3,
  shadowMapSize: 128,
  maxFar: 50,
  lightDirection: new THREE.Vector3(0, -1, 0),
})
world.setupMaterial = material => csm.setupMaterial(material)
renderer.shadowMap.enabled = true
const shadedColumn = column.clone()
shadedColumn.roughness = 0.8 // Use a new linked material so both draws receive the live-world hooks.
root.add(shadedColumn)
world.stage.update()
csm.update()
let programCount
for (let frame = 0; frame < 6; frame++) {
  const restore = shadedColumn.handle.clipForCamera(new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.85))
  renderer.render(world.stage.scene, camera)
  check(`Shadow frame ${frame + 1}: clipped primitive retains its material`, read([-4, 1, 0.5]), 'avatar')
  restore()
  if (frame === 2) programCount = renderer.info.programs.length
}
results.push({
  label: 'Clipped shadow materials reuse compiled programs',
  pass: programCount === renderer.info.programs.length,
})
csm.dispose()

shadedColumn.deactivate()
world.stage.update()
const portal = new Portal({
  portalId: 'test-portal',
  width: 1,
  height: 4,
  doubleside: true,
  position: [-4, 2, 0],
})
root.add(portal)
portal.mesh.material.uniforms.fallback.value.set('#00ff00')
graphics.cameraOcclusion.obstructions.set(house, world.time)
graphics.cameraOcclusion.apply()
renderer.render(world.stage.scene, camera)
check('Portal surface below the plane remains visible', read([-4, 1, 0]), 'avatar')
const upperPortal = read([-4, 3, 0])
results.push({
  label: 'Native portal surface above the plane is clipped',
  pass: !(upperPortal[1] > upperPortal[0] + 40 && upperPortal[1] > upperPortal[2] + 40),
})
graphics.cameraOcclusion.restore()
portal.deactivate()

world.setupMaterial = () => {}
const cssLayer = document.createElement('div')
cssLayer.style.position = 'absolute'
cssLayer.style.left = '-10000px'
document.body.append(cssLayer)
const css = new ClientCSS(world)
await css.init({ cssLayer })
css.resize(320, 240)
const htmlSurface = new Group()
const html = document.createElement('div')
html.style.width = '200px'
html.style.height = '400px'
html.textContent = 'World-space HTML surface'
htmlSurface.objectCSS = new CSS3DObject(html)
htmlSurface.objectCSS.position.set(-4, 2, 0)
htmlSurface.objectCSS.scale.setScalar(0.01)
root.add(htmlSurface)
css.add(htmlSurface.objectCSS)
graphics.on('render', css.onRender)
graphics.render()
const cssYs = [...html.style.clipPath.matchAll(/[-\d.]+px ([-\d.]+)px/g)].map(match => Number(match[1]))
results.push({
  label: 'Main CSS renderer cuts HTML content at the same height',
  pass: Math.abs(Math.min(...cssYs) - 215) < 1e-6 && html.style.transform.includes('matrix3d'),
})
graphics.cameraOcclusion.clear()
results.push({ label: 'Clearing the cut restores HTML rendering', pass: html.style.clipPath === '' })
graphics.off('render', css.onRender)
css.remove(htmlSurface.objectCSS)
cssLayer.remove()

// Compare the actual shadow textures, including a window opening, a clipped
// standalone frame and an entire roof masked out of its instance batch.
const shadowWorld = {
  ...world,
  setupMaterial() {},
  entities: { player: world.entities.player },
  camera: camera.clone(),
}
shadowWorld.stage = new Stage(shadowWorld)
shadowWorld.stage.init({ viewport: {} })
shadowWorld.stage.scene.background = new THREE.Color('#182434')
const shadowHouse = { isApp: true, root: new Group(), worldNodes: new Set() }
shadowHouse.root.activate({ world: shadowWorld, entity: shadowHouse })
const shadowNeighbor = { isApp: true, root: new Group(), worldNodes: new Set() }
shadowNeighbor.root.activate({ world: shadowWorld, entity: shadowNeighbor })
const wall = new Mesh({
  type: 'geometry',
  geometry: mergeGeometries([
    new THREE.BoxGeometry(1, 4, 0.3).translate(-1.5, 2, 0),
    new THREE.BoxGeometry(1, 4, 0.3).translate(1.5, 2, 0),
    new THREE.BoxGeometry(2, 1, 0.3).translate(0, 0.5, 0),
    new THREE.BoxGeometry(2, 1, 0.3).translate(0, 3.5, 0),
  ]),
  material: new THREE.MeshLambertMaterial({ color: '#cc5533' }),
})
shadowHouse.root.add(wall)
const exteriorWall = wall.clone()
exteriorWall.position.x = 7
shadowNeighbor.root.add(exteriorWall)
const windowFrame = new Mesh({
  type: 'geometry',
  geometry: new THREE.BoxGeometry(0.15, 2, 0.4),
  material: new THREE.MeshLambertMaterial({ color: '#aa8855' }),
  linked: false,
  position: [0, 2, 0],
})
shadowHouse.root.add(windowFrame)
shadowHouse.root.add(
  new Mesh({
    type: 'geometry',
    geometry: new THREE.BoxGeometry(3, 0.2, 3),
    material: new THREE.MeshLambertMaterial({ color: '#cc5533' }),
    position: [-3, 4, -3],
  })
)
const ground = new THREE.Mesh(new THREE.BoxGeometry(18, 0.2, 18), new THREE.MeshLambertMaterial({ color: '#eeeeee' }))
ground.position.y = -0.2
ground.receiveShadow = true
shadowWorld.stage.scene.add(ground, new THREE.AmbientLight(0xffffff, 0.4))
const sun = new THREE.DirectionalLight(0xffffff, 3)
sun.position.set(-6, 10, -10)
sun.castShadow = true
sun.shadow.mapSize.set(128, 128)
Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 0.1, far: 40 })
shadowWorld.stage.scene.add(sun)
shadowWorld.stage.update()
const shadowGraphics = new ClientGraphics(shadowWorld)
shadowGraphics.renderer = renderer
shadowGraphics.renderStyle = 'pixel-isometric'
shadowGraphics.usePostprocessing = false
shadowGraphics.cameraOcclusion.obstructions.set(shadowHouse, shadowWorld.time)
shadowGraphics.cameraOcclusion.nextCheck = Infinity

// Start with a normally rendered house, then enter it without another renderer
// draw between frames. A depth-texture probe would accidentally advance Three's
// frame cache and hide a missed instance-buffer upload.
renderer.shadowMap.type = THREE.PCFShadowMap
shadowGraphics.cameraOcclusion.update()
shadowGraphics.cameraOcclusion.apply()
const cameraBuffers = [...shadowWorld.stage.models.values()]
  .filter(model => model.cameraHiddenCount)
  .map(model => model.cameraMatrix)
const uploadedMatrices = new Map()
for (const buffer of cameraBuffers) {
  buffer.onUpload(() => uploadedMatrices.set(buffer, buffer.array.slice()))
}
shadowGraphics.cameraOcclusion.restore()
renderer.render(shadowWorld.stage.scene, shadowWorld.camera)
for (let frame = 0; frame < 6; frame++) {
  shadowWorld.camera.position.x += 0.05
  wall.position.x += 0.025
  exteriorWall.position.x += 0.025
  shadowWorld.stage.clean()
  shadowWorld.stage.update()
  shadowGraphics.render()
  results.push({
    label: `Walking frame ${frame + 1}: the GPU sees the current camera instance matrices`,
    pass: cameraBuffers.every(buffer => {
      const uploaded = uploadedMatrices.get(buffer)
      return uploaded && buffer.array.every((value, index) => value === uploaded[index])
    }),
  })
}
snapshot(
  results.filter(result => result.label.startsWith('Walking frame')).every(result => result.pass)
    ? 'Walking: all 6 GPU upload checks pass; camera geometry stays current'
    : 'Walking: failed GPU uploads can leave stray geometry on screen'
)

for (const [name, type] of [
  ['PCF', THREE.PCFShadowMap],
  ['Basic', THREE.BasicShadowMap],
  ['VSM', THREE.VSMShadowMap],
]) {
  renderer.shadowMap.type = type
  const probeScene = new THREE.Scene()
  const probeMaterial = new THREE.ShaderMaterial({
    uniforms: { depth: { value: null } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader:
      type === THREE.PCFShadowMap
        ? `uniform highp sampler2DShadow depth; varying vec2 vUv;
           void main() { gl_FragColor = vec4(texture(depth, vec3(vUv, 0.3)),
             texture(depth, vec3(vUv, 0.5)), texture(depth, vec3(vUv, 0.7)), 1.0); }`
        : `uniform sampler2D depth; varying vec2 vUv;
           void main() { gl_FragColor = vec4(vec3(texture2D(depth, vUv).r), 1.0); }`,
  })
  probeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), probeMaterial))
  const probeTarget = new THREE.WebGLRenderTarget(128, 128)
  const readShadow = () => {
    probeMaterial.uniforms.depth.value =
      type === THREE.VSMShadowMap ? sun.shadow.map.texture : sun.shadow.map.depthTexture
    renderer.setRenderTarget(probeTarget)
    renderer.render(probeScene, new THREE.Camera())
    const pixels = new Uint8Array(128 * 128 * 4)
    renderer.readRenderTargetPixels(probeTarget, 0, 0, 128, 128, pixels)
    renderer.setRenderTarget(null)
    return pixels
  }
  renderer.render(shadowWorld.stage.scene, shadowWorld.camera)
  const originalShadow = readShadow()
  shadowGraphics.cameraOcclusion.update()
  shadowGraphics.cameraOcclusion.apply()
  renderer.render(shadowWorld.stage.scene, shadowWorld.camera)
  if (name === 'PCF') snapshot('Old: clipped window and roof cast incomplete shadows')
  const cutShadow = readShadow()
  shadowGraphics.cameraOcclusion.restore()
  results.push({
    label: `${name}: regression fixture detects incomplete clipped shadows`,
    pass: originalShadow.some((value, index) => value !== cutShadow[index]),
  })
  for (let frame = 0; frame < 3; frame++) {
    shadowGraphics.render()
    if (name === 'PCF' && frame === 0) snapshot('Fixed: cut view retains full window and roof shadows')
    const preservedShadow = readShadow()
    results.push({
      label: `${name} frame ${frame + 1}: original window and roof shadows are preserved`,
      pass: originalShadow.every((value, index) => value === preservedShadow[index]),
    })
  }
  probeTarget.dispose()
  probeMaterial.dispose()
  probeScene.children[0].geometry.dispose()
}
shadowGraphics.cameraOcclusion.clear()

const report = document.createElement('pre')
report.id = 'results'
report.textContent = JSON.stringify(
  { pass: results.every(result => result.pass) && !errors.length, results, errors },
  null,
  2
)
document.body.prepend(report)
document.title =
  results.every(result => result.pass) && !errors.length ? 'PASS — Camera clipping' : 'FAIL — Camera clipping'
