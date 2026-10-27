import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { execute } from './runtime.mjs'

const bytes = Uint8Array.from(atob(window.PACKAGE), c => c.charCodeAt(0))
const headerSize = new DataView(bytes.buffer).getUint32(0, true)
const header = JSON.parse(new TextDecoder().decode(bytes.slice(4, 4 + headerSize)))
let offset = 4 + headerSize,
  source
const assets = new Map()
for (const asset of header.assets) {
  assets.set(asset.url, { ...asset, bytes: bytes.slice(offset, offset + asset.size) })
  if (asset.url === header.blueprint.script) source = new TextDecoder().decode(bytes.slice(offset, offset + asset.size))
  offset += asset.size
}
const query = new URLSearchParams(location.search)
const initialOpen = query.get('closed') !== '1'
const runtime = execute(source, { state: { open: initialOpen } })
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(38, 1, 0.001, 10)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setClearColor('#dedfe2', 1)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.25
document.querySelector('#view').append(renderer.domElement)
const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0.075, 0)
controls.minDistance = 0.2
controls.maxDistance = 2
scene.add(new THREE.HemisphereLight('#ffffff', '#90959f', 3.8))
for (const [position, color, intensity] of [
  [[-0.4, 0.9, -0.6], '#ffffff', 4],
  [[0.8, 0.4, 0.7], '#dce8ff', 2.4],
]) {
  const light = new THREE.DirectionalLight(color, intensity)
  light.position.fromArray(position)
  scene.add(light)
}
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(3, 3),
  new THREE.MeshStandardMaterial({ color: '#d0d2d6', roughness: 0.86 })
)
floor.rotation.x = -Math.PI / 2
floor.position.y = -0.0001
scene.add(floor)
const bindings = []
for (const visual of runtime.visuals) {
  const material = visual.material.clone()
  material.color.set(visual.color)
  const mesh = new THREE.Mesh(visual.geometry, material)
  mesh.matrixAutoUpdate = false
  mesh.matrix.copy(visual.node.matrixWorldOffset)
  scene.add(mesh)
  bindings.push({ mesh, node: visual.node })
}
// Build the actual native Image mesh from its embedded PNG bytes.
for (const image of runtime.nodes.filter(n => n.name === 'image')) {
  const asset = assets.get(image.src)
  const blobURL = URL.createObjectURL(new Blob([asset.bytes], { type: asset.mime }))
  const bitmap = document.createElement('img')
  bitmap.src = blobURL
  await bitmap.decode()
  URL.revokeObjectURL(blobURL)
  image.ctx.world.loader = { get: () => bitmap }
  image.ctx.world.graphics = { maxAnisotropy: renderer.capabilities.getMaxAnisotropy() }
  image.ctx.world.setupMaterial = () => {}
  image.ctx.world.stage.octree = { insert() {}, remove() {}, move() {} }
  await image.build()
  scene.add(image.mesh)
  bindings.push({ mesh: image.mesh, node: image })
}
// Render the exact source's native UI labels as flat textures for this preview.
for (const ui of runtime.nodes.filter(n => n.name === 'ui')) {
  const text = ui.children[0]
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(ui.width * 2)
  canvas.height = Math.ceil(ui.height * 2)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = text.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${text.fontSize * 2}px Arial`
  ctx.fillText(text.value, canvas.width / 2, canvas.height / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(ui.width * ui.size, ui.height * ui.size),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false })
  )
  mesh.matrixAutoUpdate = false
  mesh.matrix.copy(ui.matrixWorld)
  scene.add(mesh)
  bindings.push({ mesh, node: ui })
}
function sync() {
  runtime.updateTransforms()
  for (const { mesh, node } of bindings) {
    const matrix = node.matrixWorldOffset || node.matrixWorld
    mesh.matrix.copy(matrix)
    if (!mesh.matrixWorldAutoUpdate) mesh.matrixWorld.copy(matrix)
  }
}
const offsets = {
  Perspective: [-0.44, 0.37, -0.54],
  Front: [0, 0.17, -0.66],
  Back: [0, 0.2, 0.65],
  Left: [-0.65, 0.22, 0],
  Right: [0.65, 0.22, 0],
  Top: [0, 0.75, -0.001],
}
for (const [name, position] of Object.entries(offsets)) {
  const button = document.createElement('button')
  button.textContent = name
  button.onclick = () => {
    camera.position.fromArray(position)
    controls.target.set(0, 0.075, 0)
    controls.update()
    draw()
  }
  document.querySelector('#views').append(button)
}
camera.position.fromArray(offsets[query.get('view')] || offsets.Perspective)
controls.update()
let animation = null,
  last = null
function frame(now) {
  runtime.tick(last === null ? 0 : Math.min(0.05, (now - last) / 1000))
  last = now
  draw()
  if (runtime.handlers.get('update')?.size) animation = requestAnimationFrame(frame)
  else {
    animation = null
    last = null
  }
}
document.querySelector('#toggle').onclick = () => {
  runtime.event('macbook:state', { open: !runtime.app.state.open })
  document.querySelector('#toggle').textContent = runtime.app.state.open ? 'Close lid' : 'Open lid'
  if (animation === null) animation = requestAnimationFrame(frame)
}
document.querySelector('#toggle').textContent = initialOpen ? 'Close lid' : 'Open lid'
function draw() {
  sync()
  renderer.render(scene, camera)
}
function resize() {
  const width = innerWidth,
    height = innerHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
  draw()
}
controls.addEventListener('change', draw)
addEventListener('resize', resize)
resize()
