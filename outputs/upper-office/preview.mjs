import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { executeSource, parseHyp } from './runtime-adapter.mjs'

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('canvas'), antialias: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.15
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
const scene = new THREE.Scene()
scene.background = new THREE.Color('#ded8cc')
const camera = new THREE.PerspectiveCamera(42, 1, 0.025, 120)
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = false
controls.minDistance = 0.12
controls.maxDistance = 50
scene.add(new THREE.HemisphereLight('#f6f4ed', '#978066', 2.3))
const key = new THREE.DirectionalLight('#fff0d5', 3.3)
key.position.set(-4, 8, -6)
key.castShadow = true
key.shadow.mapSize.set(2048, 2048)
Object.assign(key.shadow.camera, { left: -12, right: 12, top: 16, bottom: -8, near: 0.1, far: 40 })
key.shadow.normalBias = 0.012
scene.add(key)
const fill = new THREE.DirectionalLight('#e0eaff', 1.6)
fill.position.set(6, 5, 6)
scene.add(fill)
const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: '#d6cdbd', roughness: 0.9 }))
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.002
ground.receiveShadow = true
scene.add(ground)
const grid = new THREE.GridHelper(100, 400, '#c6beb2', '#c6beb2')
grid.position.y = .0001
grid.visible = false
scene.add(grid)
const furniture = new Map()
const houseGroup = new THREE.Group()
let count = 0
function decode(text) {
  return Uint8Array.from(atob(text), c => c.charCodeAt(0))
}
async function makeGroup(encoded, name = '') {
  const parsed = parseHyp(decode(encoded))
  const runtime = await executeSource(parsed.source, name === 'chair'
    ? '\nreturn { advanceCasters, drawCasters, getCasterState }' : '', { props: parsed.header.blueprint.props })
  const group = new THREE.Group()
  const batches = new Map()
  const bindings = []
  for (const visual of runtime.visuals) {
    const name = visual.node.id
    let part = name.split(':')[0]
    if (name.includes('bedroom-ceiling')) part = 'ceilings'
    if (name.includes('truss-plate') || name.includes('joint-peg')) part = 'roof-frame'
    const batchKey = [part, visual.geometry.uuid, visual.material.uuid, visual.castShadow, visual.receiveShadow].join('/')
    if (!batches.has(batchKey)) batches.set(batchKey, { part, visual, members: [] })
    batches.get(batchKey).members.push(visual)
  }
  for (const { part, visual, members } of batches.values()) {
    const material = visual.material.clone()
    material.color.set('#ffffff')
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
    group.add(mesh)
    bindings.push({ mesh, members })
  }
  if (name === 'chair') group.userData.rollCasters = (dx, dz) => {
    runtime.audit.advanceCasters(dx, dz)
    runtime.audit.drawCasters()
    runtime.root.updateTransform()
    for (const node of runtime.nodes) {
      node.updateTransform()
      node.updateMatrixWorldOffset?.()
    }
    for (const { mesh, members } of bindings) {
      members.forEach((visual, index) => mesh.setMatrixAt(index, visual.node.matrixWorldOffset))
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    }
    document.body.dataset.casterState = JSON.stringify(runtime.audit.getCasterState())
  }
  count += runtime.visuals.length
  return group
}
for (const name of ['desk', 'chair']) {
  const group = await makeGroup(window.PACKAGES[name], name)
  furniture.set(name, group)
  scene.add(group)
}
houseGroup.add(await makeGroup(window.PACKAGES.house))
scene.add(houseGroup)
let scope = 'Together', view = 'Perspective'
const scopeNames = ['Together', 'Desk', 'Chair', 'Room']
const viewNames = ['Perspective', 'Front', 'Back', 'Left', 'Right', 'Top', 'Casters']
let demoDirection = null, demoTime = null, demoFrameId = null
function stopDemo() {
  demoDirection = null; demoTime = null
  if (demoFrameId !== null) cancelAnimationFrame(demoFrameId)
  demoFrameId = null
}
function demoFrame(now) {
  if (!demoDirection) return
  const delta = demoTime === null ? 0 : Math.min(.04, (now - demoTime) / 1000)
  demoTime = now
  const dx = demoDirection[0] * .40 * delta, dz = demoDirection[1] * .40 * delta
  const group = furniture.get('chair')
  group.userData.rollCasters(dx, dz)
  const movement = new THREE.Vector3(dx, 0, dz)
  group.position.add(movement)
  camera.position.add(movement)
  controls.target.add(movement)
  draw()
  demoFrameId = requestAnimationFrame(demoFrame)
}
function draw() { renderer.render(scene, camera) }
function select() {
  stopDemo()
  const room = scope === 'Room'
  houseGroup.visible = room
  ground.visible = !room
  grid.visible = scope === 'Chair' && view === 'Casters'
  for (const [name, group] of furniture) {
    group.visible = scope !== 'Desk' && scope !== 'Chair' || scope.toLowerCase() === name
    if (room) {
      group.position.fromArray(window.OBJECT_PLACEMENTS[name].position)
      group.rotation.y = window.OBJECT_PLACEMENTS[name].rotation
    } else {
      group.position.set(0, 0, name === 'chair' && scope === 'Together' ? -0.12 : 0)
      group.rotation.y = name === 'chair' && scope === 'Together' ? Math.PI : 0
    }
  }
  const target = room ? [0, 4.0, 10.65] : [0, scope === 'Chair' ? 0.68 : 0.55, 0]
  const d = room ? 4.4 : scope === 'Chair' ? 2.7 : 6.2
  const offsets = {
    Perspective: [0.73 * d, 0.58 * d, -0.84 * d],
    Front: [0, 0.16 * d, -d], Back: [0, 0.16 * d, d],
    Left: [-d, 0.20 * d, 0], Right: [d, 0.20 * d, 0],
    Top: [0, d, 0.001],
    Casters: [.68, -.36, -.88],
  }
  camera.position.set(...target.map((v, i) => v + offsets[view][i]))
  if (view === 'Casters') {
    camera.position.set(.72, .32, -.92)
    target[1] = .105
  }
  if (room && view === 'Perspective') camera.position.set(2.4, 5.45, 7.8)
  controls.target.set(...target)
  camera.fov = room ? 70 : 42
  camera.updateProjectionMatrix()
  for (const child of houseGroup.children[0].children) {
    child.visible = !['roof', 'roof-frame', 'gables', 'ceilings', 'extension-roof'].includes(child.userData.part)
  }
  controls.update()
  document.querySelectorAll('[data-scope]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scope === scope)))
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)))
  document.getElementById('caption').textContent = room
    ? 'Your current placements on the upstairs floorboards. Desk and chair are separate physical objects.'
    : 'Walnut · brass · leather. Both objects are rendered from their exact .hyp packages.'
  draw()
}
for (const name of scopeNames) {
  const button = document.createElement('button')
  button.textContent = name; button.dataset.scope = name
  button.onclick = () => { scope = name; view = 'Perspective'; select() }
  document.getElementById('scopes').append(button)
}
for (const name of viewNames) {
  const button = document.createElement('button')
  button.textContent = name; button.dataset.view = name
  button.onclick = () => { view = name; if (name === 'Casters') scope = 'Chair'; select() }
  document.getElementById('views').append(button)
}
for (const [label, direction] of [
  ['W forward', [0, -1]], ['D right', [1, 0]], ['S backward', [0, 1]],
  ['A left', [-1, 0]], ['Stop', null],
]) {
  const button = document.createElement('button')
  button.textContent = label
  button.onclick = () => {
    if (!direction) { stopDemo(); return }
    if (scope !== 'Chair' || view !== 'Casters') { scope = 'Chair'; view = 'Casters'; select() }
    const wasPlaying = !!demoDirection
    demoDirection = direction
    if (!wasPlaying) { demoTime = null; demoFrameId = requestAnimationFrame(demoFrame) }
  }
  document.getElementById('motions').append(button)
}
for (const name of ['desk', 'chair']) {
  document.getElementById('download-' + name).onclick = () => {
    const url = URL.createObjectURL(new Blob([decode(window.PACKAGES[name])], { type: 'application/octet-stream' }))
    const a = document.createElement('a'); a.href = url; a.download = name + '.hyp'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
function resize() {
  renderer.setSize(innerWidth, innerHeight)
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  draw()
}
controls.addEventListener('change', draw)
addEventListener('resize', resize)
resize(); select()
document.body.dataset.ready = 'true'
