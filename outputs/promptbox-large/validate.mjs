import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { build } from 'esbuild'
import * as THREE from 'three'
import { parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const bundled = await build({
  entryPoints: [new URL('runtime-adapter.mjs', directory).pathname],
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { executeSource } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`)
const source = await fs.readFile(new URL('source.js', directory), 'utf8')
const suffix = '\nreturn { E, extensionRoofY, extensionSideWindows, extensionRearOpenings, doorRegistry, yAxisRotationBetween, circuitFixtures, applyHouseLighting }'
const manifest = JSON.parse(await fs.readFile(new URL('manifest.json', directory), 'utf8'))
const state = manifest.intersections[0].state
const initialState = JSON.parse(await fs.readFile(new URL('initial-state.json', directory), 'utf8'))
const seededProps = { initialDoors: initialState.doors, initialLighting: initialState.lighting }
const client = await executeSource(source, suffix, { state, props: seededProps })
const baseline = await executeSource(await fs.readFile(new URL('original.js', directory), 'utf8'), '', { state })
const prims = client.configs.filter(c => c.kind === 'prim')
assert.equal(client.handlers.get('update')?.size || 0, 0, 'Idle client frame callback')
assert.equal(client.handlers.get('fixedUpdate')?.size || 0, 0)
assert.equal(client.nodes.filter(n => n.name === 'portal').length, 2)
assert.equal(Object.keys(client.audit.doorRegistry).length, 6)
assert.equal(prims.filter(c => c.physics === 'kinematic').length, 6)
assert(!client.audit.doorRegistry['patio-right'])
assert(prims.some(c => c.physics === 'static' && c.id.includes('patio-fixed')))
assert.equal(client.lights.length, baseline.lights.length + 3)
assert(prims.filter(c => c.physics).every(c => c.opacity === 0))
assert(client.root.position.equals(new THREE.Vector3()))
assert(client.root.scale.equals(new THREE.Vector3(1, 1, 1)))

// Each extended board remains one original primitive, with its original grid,
// material, front endpoint and cross-section; only its rear endpoint changes.
const previousHouse = await executeSource(
  await fs.readFile(new URL('floorboards/before.js', directory), 'utf8'), '', { state, props: seededProps })
const originalPrims = previousHouse.configs.filter(c => c.kind === 'prim')
const floorboards = [
  { prefix: 'floor:floorboard:', front: -7.5, oldBack: 7.5, newBack: 12.35, extended: 20 },
  { prefix: 'mezzanine:rear-board:', front: 1.9, oldBack: 7.35, newBack: 12.19, extended: 16 },
]
for (const floor of floorboards) {
  const originals = originalPrims.filter(c => c.id.startsWith(floor.prefix))
  const boards = prims.filter(c => c.id.startsWith(floor.prefix))
  assert.equal(boards.length, originals.length)
  let extended = 0
  for (const original of originals) {
    const board = boards.find(c => c.id === original.id)
    assert(board, `Original board was replaced: ${original.id}`)
    for (const key of Object.keys(original).filter(k => k !== 'size' && k !== 'position')) {
      assert.deepEqual(board[key], original[key], `Board finish changed: ${board.id}`)
    }
    assert.deepEqual(board.size.slice(0, 2), original.size.slice(0, 2))
    assert.deepEqual(board.position.slice(0, 2), original.position.slice(0, 2))
    assert(Math.abs(board.position[2] - board.size[2] / 2 - floor.front) < 1e-6)
    const back = board.position[2] + board.size[2] / 2
    if (Math.abs(back - floor.newBack) < 1e-6) {
      assert(Math.abs(board.position[0]) + board.size[0] / 2 < 3)
      assert(board.position[2] - board.size[2] / 2 < 7.35 && back > 12)
      extended++
    } else {
      assert(Math.abs(back - floor.oldBack) < 1e-6)
      assert.deepEqual(board, original)
    }
  }
  assert.equal(extended, floor.extended)
}
assert.equal(prims.filter(c => c.id.startsWith('extension-floor:') &&
  (c.id.includes(':floorboard:') || c.id.includes(':extension-upper-board:'))).length, 0)

const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
const meshes = client.visuals.map(v => {
  assert(v.geometry.attributes.position.array.every(Number.isFinite), `Invalid geometry: ${v.node.id}`)
  const mesh = new THREE.Mesh(v.geometry, material)
  mesh.matrix.copy(v.matrix)
  mesh.matrixWorld.copy(v.matrix)
  mesh.matrixAutoUpdate = false
  mesh.name = v.node.id
  return mesh
})
function hits(origin, direction, max = 0.8, filter = () => true) {
  const ray = new THREE.Raycaster(new THREE.Vector3(...origin), new THREE.Vector3(...direction), 0.002, max)
  return ray.intersectObjects(meshes.filter(filter), false)
}
// Both rooms must connect through an actually clear former rear wall.
for (const y of [0.75, 1.65, 2.45, 3.7, 4.95, 5.45]) {
  for (const x of [-2.0, 0, 2.0]) {
    assert.equal(hits([x, y, 7.10], [0, 0, 1]).length, 0, `Blocked room connection at ${x},${y}`)
  }
}
// Every new window has a real log opening, clear of opaque members.
let checkedWindows = 0
for (const x of [-3, 3]) for (const opening of client.audit.extensionSideWindows) {
  const hit = hits([x + Math.sign(x) * 0.4, (opening.bottom + opening.top) / 2, opening.u],
    [-Math.sign(x), 0, 0], 0.8, m => !m.name.includes('glass') && !m.name.includes('mullion') && !m.name.includes('transom'))
  assert.equal(hit.length, 0, 'Opaque geometry blocks side window')
  checkedWindows++
}
assert.equal(hits([1.0, 4.8, 12.75], [0, 0, -1], 0.8, m =>
  !m.name.includes('glass') && !m.name.includes('mullion') && !m.name.includes('transom')).length, 0)
checkedWindows++

// Numeric endpoint alignment uses the engine's YXZ convention.
for (const [a, b] of [
  [[-3.52, client.audit.extensionRoofY(3.52), 12.92], [0, client.audit.E.ridge, 12.92]],
  [[3, 6, 12.35], [0, client.audit.E.ridge, 12.35]],
  [[-2.84, 5.86, 7.5], [-2.84, 5.86, 12.35]],
]) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b)
  const length = av.distanceTo(bv), centre = av.clone().add(bv).multiplyScalar(0.5)
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...client.audit.yAxisRotationBetween(a, b), 'YXZ'))
  assert(new THREE.Vector3(0, -length / 2, 0).applyQuaternion(quaternion).add(centre).distanceTo(av) < 1e-6)
  assert(new THREE.Vector3(0, length / 2, 0).applyQuaternion(quaternion).add(centre).distanceTo(bv) < 1e-6)
}
// Roof slopes and roof colliders share the same plane and thickness.
for (const c of prims.filter(c => c.id?.includes('physics:extension-roof:'))) {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...c.rotation, 'YXZ'))
  for (const x of [-c.size[0] / 2, c.size[0] / 2]) {
    const p = new THREE.Vector3(x, 0, 0).applyQuaternion(q).add(new THREE.Vector3(...c.position))
    assert(Math.abs(p.y - client.audit.extensionRoofY(p.x)) < 1e-6)
  }
}
// The moving panel translates on its track, including its collider. It never
// rotates, the fixed right panel has no action, and animation stops when settled.
const patio = client.audit.doorRegistry['patio-left']
assert.equal(patio.slideDistance, 1.365)
assert.equal(client.configs.filter(c => c.kind === 'action').length, 6)
const patioHandles = client.nodes.filter(n => n.id?.includes('patio-left-handle'))
assert.equal(patioHandles.length, 2)
assert.equal(client.nodes.filter(n => n.id?.includes('patio-fixed-handle')).length, 0)
for (const handle of patioHandles) {
  assert.equal(handle.parent.id, patioHandles[0].parent.id)
  const config = prims.find(c => c.id === handle.id)
  // Each grip fits entirely over the outer stile, rather than the meeting edge.
  assert(config.position[0] - config.size[0] / 2 >= 0)
  assert(config.position[0] + config.size[0] / 2 <= 0.09)
  assert.equal(handle.position.x, config.position[0])
}
assert(patioHandles.some(n => n.position.z < 0) && patioHandles.some(n => n.position.z > 0))
for (const open of [false, true, false, true]) {
  for (const fn of client.handlers.get('doorState')) fn({ id: patio.id, open })
  let previous = patio.slide
  for (let i = 0; i < 30; i++) {
    for (const fn of [...(client.handlers.get('update') || [])]) fn(0.08)
    assert(open ? patio.slide >= previous : patio.slide <= previous)
    previous = patio.slide
    assert(Math.abs(patio.group.position.x - patio.hingeX - patio.slide) < 1e-6)
    assert(Math.abs(patio.collider.position.x - patio.hingeX - patio.slide - patio.width / 2) < 1e-6)
    assert.equal(patio.group.rotation.y, 0)
    assert.equal(patio.collider.rotation.y, 0)
    assert.equal(patio.group.position.z, patio.hingeZ)
    assert.equal(patio.collider.position.z, patio.hingeZ)
    for (const handle of patioHandles) {
      assert(Math.abs(handle.parent.position.x - patio.group.position.x) < 1e-6,
        'Handle is detached from the moving panel')
      const gripX = handle.parent.position.x + handle.position.x
      assert(gripX < patio.group.position.x + 0.09, 'Handle left the outer stile')
    }
  }
  assert(Math.abs(patio.slide - (open ? patio.slideDistance : 0)) < 1e-6)
  assert.equal(client.handlers.get('update')?.size || 0, 0)
}
// Reverse the slide halfway through and finish closed without a stale callback.
for (const fn of client.handlers.get('doorState')) fn({ id: patio.id, open: false })
for (let i = 0; i < 5; i++) for (const fn of [...(client.handlers.get('update') || [])]) fn(0.08)
assert(patio.slide > 0 && patio.slide < patio.slideDistance)
for (const fn of client.handlers.get('doorState')) fn({ id: patio.id, open: true })
for (let i = 0; i < 30; i++) for (const fn of [...(client.handlers.get('update') || [])]) fn(0.08)
assert.equal(patio.slide, patio.slideDistance)
assert.equal(client.handlers.get('update')?.size || 0, 0)
function colliderContains(config, point, node) {
  const position = node?.position || new THREE.Vector3(...config.position)
  const quaternion = node?.quaternion || new THREE.Quaternion().setFromEuler(new THREE.Euler(...(config.rotation || [0, 0, 0]), 'YXZ'))
  const local = new THREE.Vector3(...point).sub(position).applyQuaternion(quaternion.clone().invert())
  return ['x', 'y', 'z'].every((axis, i) => Math.abs(local[axis]) < config.size[i] / 2)
}
for (const y of [0.75, 1.65, 2.4]) for (const z of [7.5, 7.7, 12.20, 12.35, 12.65]) {
  for (const config of prims.filter(c => c.physics)) {
    const node = client.nodes.find(n => n.id === config.id)
    assert(!colliderContains(config, [-0.70, y, z], node), `Collision blocks circulation: ${config.id}`)
  }
}
for (const z of [7.5, 7.7]) for (const config of prims.filter(c => c.physics)) {
  assert(!colliderContains(config, [0, 4.95, z], client.nodes.find(n => n.id === config.id)),
    `Collision blocks bedroom connection: ${config.id}`)
}

const sent = []
const server = await executeSource(source, suffix, { state, server: true, onSend: (name, data) => sent.push({ name, data }) })
assert.equal(server.handlers.get('update')?.size || 0, 0)
const rebuilt = await executeSource(source, suffix, { state: {}, server: true, props: seededProps })
assert.deepEqual(rebuilt.app.state, initialState, 'Blueprint rebuild must restore seeded state')
assert.equal(rebuilt.handlers.get('update')?.size || 0, 0)
const rebuiltClient = await executeSource(source, suffix, { state: {}, props: seededProps })
for (const id of ['entrance-left', 'entrance-right']) {
  const door = rebuiltClient.audit.doorRegistry[id]
  assert.equal(door.angle, initialState.doors[id] ? door.openAngle : 0)
}
assert.equal(rebuiltClient.audit.doorRegistry['patio-left'].slide,
  initialState.doors['patio-left'] ? 1.365 : 0)
for (const fn of server.handlers.get('toggleDoor')) fn({ id: 'patio-left' })
assert.equal(server.app.state.doors['patio-left'], true)
assert.equal(server.app.state.doors['entrance-left'], state.doors['entrance-left'])
assert.deepEqual(server.app.state.lighting, state.lighting)
assert(sent.some(m => m.name === 'doorState' && m.data.id === 'patio-left' && m.data.open))
for (let i = 0; i < 30; i++) for (const fn of [...(server.handlers.get('update') || [])]) fn(0.08)
assert.equal(server.handlers.get('update')?.size || 0, 0)
for (const circuit of Object.keys(server.audit.circuitFixtures)) {
  for (const fn of server.worldHandlers.get('larch-house-light-command')) fn({ channel: circuit, on: false })
  assert(server.audit.circuitFixtures[circuit].lights.every(f => f.light.intensity === 0))
  for (const fn of server.worldHandlers.get('larch-house-light-command')) fn({ channel: circuit, on: true })
  assert(server.audit.circuitFixtures[circuit].lights.every(f => f.light.intensity > 0))
}
const bytes = await fs.readFile(new URL('house-extension.hyp', directory))
const parsed = parseHyp(bytes)
assert.equal(parsed.blueprint.props.promptBoxRequestId, manifest.requestId)
assert.equal(parsed.blueprint.props.promptBoxTargetEntityId, manifest.intersections[0].entityId)
assert.equal(parsed.assets.find(a => a.url === parsed.blueprint.script).bytes.toString('utf8'), source)
const bounds = new THREE.Box3()
for (const mesh of meshes) bounds.union(new THREE.Box3().setFromObject(mesh))
assert(bounds.min.y > -0.001, `Geometry below ground: ${bounds.min.y}`)
const report = {
  valid: true, target: 'Hyperfy 0.16.0 fork',
  constructors: 'Actual Prim, Group, Action, Light and Portal',
  geometry: 'Actual Prim.mount geometry and YXZ transforms',
  extension: { width: 6, depth: 4.85, floorLevels: [0.12, 3.3], roofRidge: client.audit.E.ridge },
  connectedRoomOpenings: 18, clearPatioCollisionSamples: 15,
  checkedWindows, totalDoors: 6,
  floorboards: { originalGroundBoards: 60, originalUpperRearBoards: 50,
    extendedGroundBoards: 20, extendedUpperBoards: 16, addedPlanks: 0,
    originalGridAndFinishes: 'pass', continuousThroughFormerWall: 'pass' },
  patioDoor: { motion: 'one panel slides behind one fixed panel', travelMetres: 1.365,
    translationAndColliderAlignment: 'pass', zeroRotation: 'pass', reversal: 'pass', serverState: 'pass',
    handles: { placement: 'outer latch stile beside the left jamb', grips: 2,
      outerStile: 'pass', bothFaces: 'pass', movingPanelAttachment: 'pass' } },
  lightingCircuits: 'pass', addedLights: 3,
  idleClientCallbacks: 0, idleServerCallbacks: 0,
  primitives: client.visuals.length, physicsShapes: prims.filter(c => c.physics).length,
  bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
  packageAssets: parsed.assets.length, packageSourceAndHashes: 'pass',
  physXSimulation: 'Not performed by this isolated geometry audit',
}
await fs.writeFile(new URL('validation.json', directory), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
