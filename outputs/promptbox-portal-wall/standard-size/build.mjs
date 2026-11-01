import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'
import * as THREE from 'three'
import { OBB } from 'three/examples/jsm/math/OBB.js'
import { packHyp, parseHyp } from '../../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const save = (name, value) => fs.writeFile(new URL(name, directory), JSON.stringify(value, null, 2))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const before = JSON.parse(await read('before.json'))
let source = (await read('before.js')).toString()
source = source.replace(
  "registerDoor('billiards-portal-left', 5.01, 0.15, 1.208, 1, 1.58, 2.34, Math.PI / 2)",
  "registerDoor('billiards-portal-left', 5.32, 0.15, 1.208, 1, 0.96, 2.12, Math.PI / 2)")
source = source.replace(
  "registerDoor('billiards-portal-right', 8.39, 0.15, 1.208, -1, 1.58, 2.34, -Math.PI / 2)",
  "registerDoor('billiards-portal-right', 8.08, 0.15, 1.208, -1, 0.96, 2.12, -Math.PI / 2)")
const marker = '\n// Portal doorways: Y up, +X right, -Z faces the pool table.'
assert.equal(source.split(marker).length, 2)
source = source.slice(0, source.indexOf(marker)) + `
// Portal doorways: Y up, +X right, -Z faces the pool table.
// One continuous timber wall, with blind surface doorways on its pool side.
// The native portals sit ahead of the logs; no separate backing plane is needed.
section = 'billiards-portal-wall'
const portalWall = {
  left: 4.75, right: 8.83, bottom: D.floor, top: 3.08,
  z: 1.62, portalZ: 1.34, width: 0.98, height: 2.18,
  centres: [5.8, 7.6],
}
wallLogsWithOpening('x', portalWall.z, portalWall.left, portalWall.right,
  portalWall.bottom, portalWall.top, [],
  { radius: 0.115, pitch: 0.215, tone: 2 })
collisionBox([portalWall.right - portalWall.left, portalWall.top - portalWall.bottom, 0.23],
  [(portalWall.left + portalWall.right) / 2,
    (portalWall.bottom + portalWall.top) / 2, portalWall.z],
  [0, 0, 0], 'billiards-portal-wall')
for (const [index, u] of portalWall.centres.entries()) {
  for (const side of [-1, 1]) {
    wallBox('x', 1.46, u + side * (portalWall.width / 2 + 0.08),
      portalWall.bottom + portalWall.height / 2, 0.16, portalWall.height,
      0.32, C.timber, 'portal-door-' + index + '-jamb')
    wallBox('x', 1.292, u + side * (portalWall.width / 2 + 0.065),
      portalWall.bottom + portalWall.height / 2, 0.13, portalWall.height,
      0.036, C.trim, 'portal-door-' + index + '-casing')
  }
  wallBox('x', 1.46, u, portalWall.bottom + portalWall.height + 0.09,
    portalWall.width + 0.32, 0.18, 0.32, C.timber,
    'portal-door-' + index + '-lintel')
  wallBox('x', 1.292, u, portalWall.bottom + portalWall.height + 0.065,
    portalWall.width + 0.26, 0.13, 0.036, C.trim,
    'portal-door-' + index + '-head-casing')
}
`
const script = 'asset://' + hash(source) + '.js'
const desired = {
  ...before.blueprint, version: before.blueprint.version + 1, script,
  props: {
    ...before.blueprint.props,
    initialDoors: { ...before.blueprint.props.initialDoors, ...before.entity.state.doors },
    initialLighting: before.entity.state.lighting,
  },
}
const assets = [
  { type: 'model', url: desired.model, bytes: await read('model.glb'), mime: 'model/gltf-binary' },
  { type: 'script', url: script, bytes: Buffer.from(source), mime: 'text/javascript' },
]
const bytes = packHyp(desired, assets)
const parsed = parseHyp(bytes)
for (const asset of parsed.assets) assert.equal(hash(asset.bytes), asset.url.slice(8, 72))
assert.equal(parsed.assets.find(a => a.url === script).bytes.toString(), source)
await fs.writeFile(new URL('source.js', directory), source)
await fs.writeFile(new URL('house.hyp', directory), bytes)
await save('desired-blueprint.json', desired)

// Resize the native model's aperture, retaining unit instance scale and travel.
// Scaling only the source instance would disable seamless body traversal.
const originalPortal = await fs.readFile(new URL('../portal.glb', directory))
for (const portal of before.portals) assert.equal(
  hash(originalPortal), portal.blueprint.model.slice(8, 72))
const gltf = JSON.parse(originalPortal.toString('utf8', 20, 20 + originalPortal.readUInt32LE(12)))
gltf.nodes[0].translation = [0, 1.09, 0]
gltf.nodes[0].extras.width = 0.96
gltf.nodes[0].extras.height = 2.12
const json = Buffer.from(JSON.stringify(gltf))
const chunk = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20)
json.copy(chunk)
const portalBytes = Buffer.alloc(20 + chunk.length)
portalBytes.writeUInt32LE(0x46546c67, 0)
portalBytes.writeUInt32LE(2, 4)
portalBytes.writeUInt32LE(portalBytes.length, 8)
portalBytes.writeUInt32LE(chunk.length, 12)
portalBytes.writeUInt32LE(0x4e4f534a, 16)
chunk.copy(portalBytes, 20)
const portalModel = 'asset://' + hash(portalBytes) + '.glb'
await fs.writeFile(new URL('portal.glb', directory), portalBytes)
const portals = before.portals.map((portal, index) => ({
  ...portal,
  desiredBlueprint: { ...portal.blueprint, version: portal.blueprint.version + 1, model: portalModel },
  houseLocal: [5.8 + index * 1.8, 0.15, 1.34],
  aperture: { width: 0.96, height: 2.12 },
}))
for (const [index, portal] of portals.entries()) {
  const image = Object.entries(portal.blueprint.props)
    .find(([key]) => key.startsWith('arrivalImage_'))?.[1]
  const imageAsset = image?.url ? [{
    type: 'image', url: image.url, bytes: await read(image.url.slice(8)), mime: 'image/jpeg',
  }] : []
  const packageBytes = packHyp(portal.desiredBlueprint, [
      { type: 'model', url: portalModel, bytes: portalBytes, mime: 'model/gltf-binary' },
      ...imageAsset,
    ])
  for (const asset of parseHyp(packageBytes).assets) assert.equal(hash(asset.bytes), asset.url.slice(8, 72))
  await fs.writeFile(new URL('portal-' + index + '.hyp', directory), packageBytes)
}
await save('plan.json', { houseId: before.entity.id, portals })

const bundle = await build({
  stdin: {
    contents: `export { executeSource } from './outputs/promptbox-large/runtime-adapter.mjs';
      export { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
      export { glbToNodes } from './src/core/extras/glbToNodes.js';
      export { supportsPortalTraversal } from './src/core/extras/portalTraversal.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { executeSource, GLTFLoader, glbToNodes, supportsPortalTraversal } =
  await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].contents).toString('base64'))
const loaded = await new GLTFLoader().parseAsync(
  portalBytes.buffer.slice(portalBytes.byteOffset, portalBytes.byteOffset + portalBytes.byteLength), '')
const portalRoot = glbToNodes(loaded, {})
portalRoot.updateTransform()
const native = portalRoot.children.find(n => n.name === 'portal')
native.updateTransform()
assert.equal(native.width, .96)
assert.equal(native.height, 2.12)
assert.equal(native.appConfig, true)
assert.deepEqual(native.scale.toArray(), [1, 1, 1])
assert(Math.abs(native.position.y - native.height / 2 - .03) < 1e-10)
assert(supportsPortalTraversal(native, { matrixWorld: new THREE.Matrix4().makeTranslation(10, 1.2, 0) }))
const normalize = configs => JSON.parse(JSON.stringify(configs))
  .filter(c => c.kind !== 'group' && !c.id?.includes('billiards-portal-'))
  .map(c => ({ ...c, ...(c.id ? { id: c.id.replace(/:\d+$/, '') } : {}) }))
const suffix = '\nreturn { doorRegistry, setDoorGeometry, applyAuthoritativeDoorState, updateDoors }'
const checks = []
for (const server of [false, true]) {
  const options = { server, props: desired.props, state: before.entity.state }
  const old = await executeSource((await read('before.js')).toString(), '', options)
  const runtime = await executeSource(source, suffix, options)
  assert.deepEqual(normalize(runtime.configs), normalize(old.configs))
  assert.deepEqual(runtime.app.state, old.app.state)
  assert(!runtime.configs.some(c => c.id?.includes('solid-back')))
  const wallVisuals = runtime.configs.filter(c => c.kind === 'prim' &&
    c.id?.startsWith('billiards-portal-wall:') && c.opacity !== 0)
  assert(wallVisuals.length > 15)
  assert(wallVisuals.filter(c => c.id.includes(':course:')).every(c =>
    c.type === 'cylinder' && c.size[2] > 4))
  assert.equal(runtime.configs.filter(c => c.physics === 'static' &&
    c.id?.includes('billiards-portal-wall')).length, 1)
  const upstairs = runtime.audit.doorRegistry['bedroom-1']
  for (const id of ['billiards-portal-left', 'billiards-portal-right']) {
    const door = runtime.audit.doorRegistry[id]
    assert.equal(door.width, upstairs.width)
    assert.equal(door.height, upstairs.height)
    assert.equal(door.face, upstairs.face)
    const obstacles = runtime.nodes.filter(n => n.name === 'prim' &&
      n.type === 'box' && n.physics === 'static')
    assert(obstacles.length > 30)
    const moving = runtime.nodes.find(n => n.id?.includes(id + '-leaf:'))
    const obb = node => {
      node.updateTransform()
      return new OBB(new THREE.Vector3(), new THREE.Vector3().fromArray(node.size).multiplyScalar(.5))
        .applyMatrix4(node.matrixWorld)
    }
    for (let degree = 0; degree <= 90; degree++) {
      runtime.audit.setDoorGeometry(door, Math.sign(door.openAngle) * degree * Math.PI / 180)
      for (const obstacle of obstacles) assert(!obb(moving).intersectsOBB(obb(obstacle), 1e-8),
        `${id} intersects ${obstacle.id} at ${degree} degrees`)
    }
    runtime.audit.setDoorGeometry(door, 0)
  }
  for (const [left, right] of [[true, false], [true, true], [false, true], [false, false]]) {
    for (const [id, open] of [['billiards-portal-left', left], ['billiards-portal-right', right]]) {
      runtime.audit.applyAuthoritativeDoorState({ id, open })
    }
    for (let frame = 0; frame < 40; frame++) runtime.audit.updateDoors(.02)
    assert.equal(runtime.audit.doorRegistry['billiards-portal-left'].angle, left ? Math.PI / 2 : 0)
    assert.equal(runtime.audit.doorRegistry['billiards-portal-right'].angle, right ? -Math.PI / 2 : 0)
    assert.equal(runtime.handlers.get('update')?.size || 0, 0)
  }
  checks.push({ server, sameDoorSizeAsUpstairs: [.96, 2.12], oneContinuousLogWall: true,
    existingGeometryAndStatePreserved: true, clearSweepDegreesPerDoor: 91,
    independentDoorStates: 4, idleCallbacks: 0 })
}
await save('validation.json', {
  valid: true, source: script, exactPackageSource: true, assetHashesVerified: true,
  actualNativeConstructors: true, checks,
  nativeGLTFLoaderAndPortalNodes: true, nativeAperture: [.96, 2.12],
  unitPortalScaleAndTraversalPreserved: true, portalModel,
  visibleTimberBetweenFrames: .5,
})
console.log(JSON.stringify({ valid: true, version: desired.version, script, portalModel, checks }))
