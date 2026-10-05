import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { executeSource, parseHyp } from './runtime_adapter.mjs'

const canvas = document.querySelector('canvas')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.1
const scene = new THREE.Scene()
scene.background = new THREE.Color('#d8d6cf')
const camera = new THREE.PerspectiveCamera(44, 1, 0.06, 250)
const controls = new OrbitControls(camera, canvas)
controls.maxDistance = 110
controls.minDistance = 0.08
controls.maxPolarAngle = Math.PI * 0.98
controls.enableDamping = false
scene.add(new THREE.HemisphereLight('#e6efff', '#ac9574', 2.3))
scene.add(new THREE.AmbientLight('#fff6e6', 0.9))
const sun = new THREE.DirectionalLight('#fff0d9', 3.4)
sun.position.set(-13, 24, -16)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 65 })
sun.shadow.normalBias = 0.035
sun.shadow.bias = -0.00015
scene.add(sun)
const fill = new THREE.DirectionalLight('#ecf3ff', 1.2)
fill.position.set(15, 14, 12)
scene.add(fill)
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#cfcdc4', roughness: 1 }))
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.014
ground.receiveShadow = true
scene.add(ground)

const binary = atob(window.EMBEDDED_HYP)
const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
const parsed = parseHyp(bytes)
const runtime = await executeSource(parsed.source)
// Use the actual Prim.mount() geometry and transforms, grouped for fast rendering.
const batches = new Map()
for (const visual of runtime.visuals) {
  let part = visual.node.id.split(':')[0]
  if (visual.node.id.includes('bedroom-ceiling')) part = 'ceilings'
  if (visual.node.id.includes('truss-plate') || visual.node.id.includes('joint-peg')) part = 'roof-frame'
  const key = [part, visual.geometry.uuid, visual.material.uuid, visual.castShadow, visual.receiveShadow].join('/')
  if (!batches.has(key)) batches.set(key, { part, visual, members: [] })
  batches.get(key).members.push(visual)
}
const rendered = []
for (const { part, visual, members } of batches.values()) {
  const material = visual.material.clone()
  material.color.set('#ffffff')
  material.polygonOffset = false
  if (material.transparent) material.depthWrite = false
  const mesh = new THREE.InstancedMesh(visual.geometry, material, members.length)
  mesh.userData.part = part
  mesh.castShadow = visual.castShadow
  mesh.receiveShadow = visual.receiveShadow
  for (let i = 0; i < members.length; i++) {
    mesh.setMatrixAt(i, members[i].matrix)
    mesh.setColorAt(i, new THREE.Color(members[i].color))
  }
  mesh.instanceMatrix.needsUpdate = true
  mesh.instanceColor.needsUpdate = true
  mesh.computeBoundingSphere()
  scene.add(mesh)
  rendered.push(mesh)
}
const shots = {
  Exterior: { eye: [24, 17, -28], target: [0, 4.0, 0], fov: 44 },
  'Great room': { eye: [0, 1.80, -6.72], target: [0, 4.25, 1.0], fov: 78 },
  Mezzanine: { eye: [6.65, 4.95, 3.15], target: [-1.7, 4.2, -3.2], fov: 77 },
  Stairs: { eye: [-2.0, 2.1, -5.6], target: [-7.0, 2.4, -0.7], fov: 67 },
  Front: { eye: [0, 6.3, -40], target: [0, 5.05, 0], fov: 40 },
  Rear: { eye: [0, 6.3, 40], target: [0, 5.05, 0], fov: 40 },
  Left: { eye: [-40, 6.3, 0], target: [0, 5.05, 0], fov: 40 },
  Right: { eye: [40, 6.3, 0], target: [0, 5.05, 0], fov: 40 },
  Plan: { eye: [0, 42, -0.01], target: [0, 0, 0], fov: 40, cutaway: true },
}
let selected = 'Exterior'
const roofToggle = document.getElementById('roof')
function applyRoof() {
  for (const mesh of rendered) mesh.visible = roofToggle.checked || !['roof', 'roof-frame', 'gables', 'ceilings'].includes(mesh.userData.part)
  draw()
}
function view(name) {
  selected = name
  const shot = shots[name]
  camera.position.set(...shot.eye)
  controls.target.set(...shot.target)
  camera.fov = shot.fov
  camera.updateProjectionMatrix()
  roofToggle.checked = !shot.cutaway
  controls.update()
  applyRoof()
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === name)))
  document.getElementById('caption').textContent = name === 'Plan'
    ? 'Rear bedrooms · balcony corridor · open great room. Roof and bedroom ceilings hidden for this view.'
    : name === 'Great room' ? 'From the entrance: full-height stone fireplace, open balcony and exposed king-post trusses.'
    : name === 'Mezzanine' ? 'The balcony overlooks the great room. All three bedrooms open onto the corridor behind the chimney.'
    : name === 'Stairs' ? 'Eighteen risers · 1.35 m stair width · L-shaped landing · 3.30 m mezzanine.'
    : 'Hand-stacked logs, deep eaves and timber glazing. All cabin geometry comes from the embedded .hyp.'
}
for (const name of Object.keys(shots)) {
  const button = document.createElement('button')
  button.textContent = name
  button.dataset.view = name
  button.addEventListener('click', () => view(name))
  document.getElementById('views').append(button)
}
roofToggle.addEventListener('change', applyRoof)
document.getElementById('download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }))
  const a = document.createElement('a')
  a.href = url; a.download = 'luxury_log_cabin.hyp'; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
})
document.getElementById('status').textContent = `${runtime.nodes.length.toLocaleString()} primitives · 3 bedrooms · 0 update callbacks`
function draw() { renderer.render(scene, camera) }
function resize() {
  renderer.setSize(innerWidth, innerHeight)
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  draw()
}
controls.addEventListener('change', draw)
addEventListener('resize', resize)
const keys = new Set()
addEventListener('keydown', event => {
  if (event.target.matches('input, button')) return
  if (['w', 'a', 's', 'd', 'q', 'e', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    keys.add(event.key); event.preventDefault()
  }
})
addEventListener('keyup', event => keys.delete(event.key))
addEventListener('blur', () => keys.clear())
let lastTime = performance.now()
function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05); lastTime = now
  if (keys.size) {
    const forward = new THREE.Vector3().subVectors(controls.target, camera.position).setY(0).normalize()
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()
    const movement = new THREE.Vector3()
    if (keys.has('w') || keys.has('ArrowUp')) movement.add(forward)
    if (keys.has('s') || keys.has('ArrowDown')) movement.sub(forward)
    if (keys.has('d') || keys.has('ArrowRight')) movement.add(right)
    if (keys.has('a') || keys.has('ArrowLeft')) movement.sub(right)
    if (keys.has('e')) movement.y += 1
    if (keys.has('q')) movement.y -= 1
    movement.normalize().multiplyScalar(dt * 3.2)
    camera.position.add(movement); controls.target.add(movement); controls.update(); draw()
  }
  requestAnimationFrame(tick)
}
resize()
view(selected)
requestAnimationFrame(tick)
document.body.dataset.ready = 'true'
