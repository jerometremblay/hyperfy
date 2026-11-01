import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'
import * as THREE from 'three'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'
import { packHyp, parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const save = (name, value) => fs.writeFile(new URL(name, directory), JSON.stringify(value, null, 2))
const snapshot = JSON.parse(await read('before.json'))
const client = makeClient(await loadProfile('../hyperfy-world-jerome', 'online-world'))
const house = await client.request('/entities/HCzjtaVZFI')
const blueprint = snapshot.blueprints.find(b => b.id === house.blueprint)
assert.deepEqual(await client.request('/apps/' + blueprint.id), blueprint)
const box = snapshot.entities.find(e => e.id === '2SkFwFGkgq')
const liveBox = await client.request('/entities/' + box.id)
for (const key of Object.keys(box)) assert.deepEqual(liveBox[key], box[key])
assert(!liveBox.mover && !liveBox.uploader)
const model = (await client.requestBytes('/assets/' + blueprint.model.slice(8))).bytes
await fs.writeFile(new URL('model.glb', directory), model)
await save('targets.json', { house, blueprint, box })

// A blind timber wall under the existing right mezzanine. Its native portal
// apertures face the pool table; the continuous back remains a physical wall.
const addition = `

// Portal doorways: Y up, +X right, -Z faces the pool table.
// Align to the existing mezzanine posts and floor, using the box as a hint.
// These are blind door recesses, with a solid back rather than a passage.
section = 'billiards-portal-wall'
const portalWall = {
  left: 4.75, right: 8.83, bottom: D.floor, top: 3.08,
  z: 1.62, portalZ: 1.34, backZ: 1.96,
  width: 1.6, height: 2.4, centres: [5.8, 7.6],
}
const portalWallOpenings = portalWall.centres.map(u => ({
  u, width: portalWall.width, bottom: portalWall.bottom,
  top: portalWall.bottom + portalWall.height,
}))
wallLogsWithOpening('x', portalWall.z, portalWall.left, portalWall.right,
  portalWall.bottom, portalWall.top, portalWallOpenings,
  { radius: 0.115, pitch: 0.215, tone: 2 })
// Flat backing closes the grooves between log courses and both blind recesses.
box([portalWall.right - portalWall.left, portalWall.top - portalWall.bottom, 0.12],
  [(portalWall.left + portalWall.right) / 2,
    (portalWall.bottom + portalWall.top) / 2, portalWall.backZ],
  C.trim, [0, 0, 0], {}, 'solid-back')
collisionBox([portalWall.right - portalWall.left, portalWall.top - portalWall.bottom, 0.12],
  [(portalWall.left + portalWall.right) / 2,
    (portalWall.bottom + portalWall.top) / 2, portalWall.backZ],
  [0, 0, 0], 'billiards-portal-wall-back')
wallCollisionWithOpenings('x', portalWall.z, portalWall.left, portalWall.right,
  portalWall.bottom, portalWall.top, portalWallOpenings, 0.46,
  'billiards-portal-wall-front')
for (const [index, u] of portalWall.centres.entries()) {
  // Jambs and lintel sit outside the full 1.6 x 2.4 m native aperture.
  for (const side of [-1, 1]) {
    wallBox('x', 1.56, u + side * (portalWall.width / 2 + 0.08),
      portalWall.bottom + portalWall.height / 2, 0.16, portalWall.height,
      0.50, C.timber, 'portal-door-' + index + '-jamb')
    wallBox('x', 1.292, u + side * (portalWall.width / 2 + 0.065),
      portalWall.bottom + portalWall.height / 2, 0.13, portalWall.height,
      0.036, C.trim, 'portal-door-' + index + '-casing')
  }
  wallBox('x', 1.56, u, portalWall.bottom + portalWall.height + 0.09,
    portalWall.width + 0.32, 0.18, 0.50, C.timber,
    'portal-door-' + index + '-lintel')
  wallBox('x', 1.292, u, portalWall.bottom + portalWall.height + 0.065,
    portalWall.width + 0.26, 0.13, 0.036, C.trim,
    'portal-door-' + index + '-head-casing')
}
`
const original = (await read('before.js')).toString()
const source = original + addition
await fs.writeFile(new URL('source.js', directory), source)
const script = 'asset://' + createHash('sha256').update(source).digest('hex') + '.js'
const desired = {
  ...blueprint, version: blueprint.version + 1, script,
  props: {
    ...blueprint.props,
    initialDoors: house.state?.doors || blueprint.props.initialDoors,
    initialLighting: house.state?.lighting || blueprint.props.initialLighting,
  },
}
const bytes = packHyp(desired, [
  { type: 'model', url: blueprint.model, bytes: model, mime: 'model/gltf-binary' },
  { type: 'script', url: script, bytes: Buffer.from(source), mime: 'text/javascript' },
])
const parsed = parseHyp(bytes)
assert(parsed.assets.find(a => a.url === script).bytes.equals(Buffer.from(source)))
for (const asset of parsed.assets) {
  assert.equal(createHash('sha256').update(asset.bytes).digest('hex'), asset.url.slice(8, 72))
}
await fs.writeFile(new URL('house.hyp', directory), bytes)
await save('desired-blueprint.json', desired)

const bundled = await build({
  entryPoints: ['outputs/promptbox-large/runtime-adapter.mjs'],
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { executeSource } = await import('data:text/javascript;base64,' +
  Buffer.from(bundled.outputFiles[0].contents).toString('base64'))
const suffix = '\nreturn { portalWall, portalWallOpenings }'
let geometry
for (const server of [false, true]) {
  const options = { server, state: house.state || {}, props: desired.props }
  const previous = await executeSource(original, '', options)
  const current = await executeSource(source, suffix, options)
  assert.equal(JSON.stringify(current.configs.slice(0, previous.configs.length)), JSON.stringify(previous.configs),
    'All existing geometry, physics and actions must remain unchanged')
  assert.deepEqual(current.app.state, previous.app.state)
  for (const key of ['update', 'fixedUpdate', 'lateUpdate']) {
    assert.equal(current.handlers.get(key)?.size || 0, previous.handlers.get(key)?.size || 0)
    assert.equal(current.handlers.get(key)?.size || 0, 0)
  }
  geometry = current.audit.portalWall
}

const matrix = new THREE.Matrix4().compose(
  new THREE.Vector3().fromArray(house.position),
  new THREE.Quaternion().fromArray(house.quaternion),
  new THREE.Vector3().fromArray(house.scale),
)
const facing = new THREE.Quaternion().fromArray(house.quaternion)
  .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI))
const pool = snapshot.entities.find(e => e.id === 'PMPL83pUPI')
const portals = geometry.centres.map((u, index) => {
  const entity = snapshot.entities.find(e => e.id === ['PBETNgBqKt', 'OL3wuJiVCk'][index])
  const bp = snapshot.blueprints.find(b => b.id === entity.blueprint)
  assert.equal(bp.props.doubleside, 'false')
  const position = new THREE.Vector3(u, geometry.bottom, geometry.portalZ).applyMatrix4(matrix)
  const towardPool = new THREE.Vector3().fromArray(pool.position).sub(position)
  const front = new THREE.Vector3(0, 0, 1).applyQuaternion(facing)
  assert(front.dot(towardPool) > 0, 'The active portal face must point toward the pool table')
  return {
    entity, blueprint: bp,
    transform: { position: position.toArray(), quaternion: facing.toArray(), scale: [1, 1, 1] },
    houseLocal: [u, geometry.bottom, geometry.portalZ],
    aperture: { width: geometry.width, height: geometry.height },
  }
})
await save('plan.json', { geometry, portals, houseId: house.id, boxId: box.id })
await save('validation.json', {
  valid: true, source: script, exactPackageSource: true, assetHashesVerified: true,
  actualNativeConstructors: true, originalGeometryAndStatePreserved: true,
  idleServerCallbacks: 0, idleClientCallbacks: 0,
  solidBack: true, portalFacesTowardPool: true,
  portals: portals.map(p => ({ id: p.entity.id, houseLocal: p.houseLocal, aperture: p.aperture })),
})
console.log(JSON.stringify({ valid: true, source: script, geometry, portalIds: portals.map(p => p.entity.id) }, null, 2))
