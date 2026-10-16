import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'
import * as THREE from 'three'

const directory = path.dirname(new URL(import.meta.url).pathname)
const bundle = await build({ entryPoints: [path.join(directory, 'runtime_adapter.mjs')], bundle: true, format: 'esm', platform: 'node', write: false })
const { executeSource, parseHyp } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)
const source = await fs.readFile(path.join(directory, 'luxury_log_cabin.js'), 'utf8')
const suffix = '\nreturn {D, bedrooms, stair, yAxisRotationBetween, chimneyHalf, roofY, frontOpenings, rearOpenings, leftOpenings, rightOpenings, interiorFixtures, roofLights, physicsEntries, doorRegistry, syncStructuralPhysics}'
const { nodes, visuals, events, configs, lights, handlers, detached, app, audit } = await executeSource(source, suffix)
assert(events.includes('update') && events.includes('doorState') && events.includes('destroy'))
assert.equal(detached.length, audit.physicsEntries.length)
assert.equal(lights.length, audit.interiorFixtures.length * 2 + audit.roofLights.length)
assert.equal(configs.filter(c => c.id.includes('sconce-backplate')).length, audit.interiorFixtures.length)
assert.equal(audit.interiorFixtures.length, 4)
assert.equal(audit.roofLights.length, 10)
assert.equal(configs.filter(c => c.id.startsWith('exterior-lighting:') && c.type === 'cone').length, 0)
assert(configs.filter(c => (c.opacity ?? 1) > 0).every(c => c.receiveShadow === true))
const lightNodes = nodes.filter(node => node.name === 'light')
const interiorSconces = lightNodes.filter(node => node.id.startsWith('interior-lighting:'))
const roofSpots = lightNodes.filter(node => node.id.startsWith('exterior-lighting:'))
const upperFloorDownSconces = interiorSconces.filter(node => node.id.includes('sconce-down') && node.position.y > audit.D.upper)
assert.equal(interiorSconces.length, audit.interiorFixtures.length * 2)
assert.equal(upperFloorDownSconces.length, 2)
assert(upperFloorDownSconces.every(node => node.castShadow === true && node.shadowMode === 'static'),
  'Both upper-floor down sconces must cast cached shadows onto the mezzanine floor')
assert(interiorSconces.filter(node => !upperFloorDownSconces.includes(node)).every(node => node.castShadow === false))
assert.equal(roofSpots.length, audit.roofLights.length)
assert(roofSpots.every(node => node.castShadow === false))
assert.equal(lights.filter(light => light.castShadow).length, 2)
assert(lights.filter(light => light.castShadow).every(light => light.shadow.autoUpdate === false))
const fireplacePrims = nodes.filter(node => node.id.startsWith('fireplace:'))
const fireplaceCasters = fireplacePrims.filter(node => node.castShadow)
assert(fireplacePrims.some(node => node.id.includes('arched-surround') && node.castShadow))
assert(fireplacePrims.some(node => node.id.includes('recessed-fireback') && node.castShadow))
assert(fireplacePrims.some(node => node.id.includes('firebox-floor') && node.castShadow))
assert.equal(fireplaceCasters.filter(node => node.id.includes('arch-voussoir')).length, 13)
assert.equal(fireplaceCasters.length, 16, 'Only the inner firebox/arch stones should cast shadows')
assert(fireplacePrims.filter(node => !node.id.includes('arched-surround') && !node.id.includes('recessed-fireback') &&
  !node.id.includes('firebox-floor') && !node.id.includes('arch-voussoir')).every(node => !node.castShadow),
  'Other fireplace stones and trim must not cast shadows')
const rafterVisuals = visuals.filter(visual => visual.node.id.startsWith('roof-frame:rafter:'))
assert(rafterVisuals.length > 0)
assert(rafterVisuals.every(visual => visual.castShadow === true), 'Roof beams must cast shadows')
const mezzanineFloorVisuals = visuals.filter(visual => /^mezzanine:(?:rear|left-front|right-front)-(?:deck|board):/.test(visual.node.id))
assert(mezzanineFloorVisuals.length > 3)
assert(mezzanineFloorVisuals.every(visual => visual.castShadow === true), 'Mezzanine deck and boards must cast shadows')
for (const light of lights) {
  const direction = light.target.position.clone().sub(light.position).normalize()
  assert(Math.abs(direction.y - (light.position.y < light.target.position.y ? 1 : -1)) < 1e-6)
  assert(light.intensity > 0 && light.distance > 0)
}
assert(configs.every(c => !c.texture))
assert.equal(configs.filter(c => c.physics === 'kinematic').length, 5)
assert.equal(configs.filter(c => /physics:(left|right)-roof:/.test(c.id)).length, 2)
assert(configs.length < 2000)

const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
const meshes = visuals.map(v => {
  const m = new THREE.Mesh(v.geometry, material)
  m.matrix.copy(v.matrix); m.matrixWorld.copy(v.matrix); m.matrixAutoUpdate = false
  m.name = v.node.id
  assert(v.geometry.attributes.position.array.every(Number.isFinite), `Non-finite geometry: ${m.name}`)
  return m
})
const bounds = new THREE.Box3()
for (const m of meshes) bounds.union(new THREE.Box3().setFromObject(m))
assert(bounds.min.y >= -0.001, `Below ground: ${bounds.min.y}`)
assert(Math.abs(bounds.min.y) < 0.001)
assert.equal(audit.D.ridge, 9.8)
assert.equal(audit.bedrooms.length, 3)
assert.equal(configs.filter(c => c.id.includes('bedroom-ceiling')).length, 3)
assert.equal(Object.keys(audit.doorRegistry).length, 5)
assert(configs.filter(c => c.id.startsWith('mezzanine:')).every(c => c.position[2] - c.size[2] / 2 >= 1.399))

// Check the canonical endpoint helper against the target engine's actual YXZ convention.
const segments = [[[0, 0, 0], [0, 5, 0]], [[0, 0, 0], [0, -2, 0]], [[2, 1, -4], [-5, 9, 7]],
  ...audit.stair.flights.map(f => [f.a, f.b]), [[-9.45, 5.53, -4.25], [0, 9.51, -4.25]]]
for (const [a, b] of segments) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), len = av.distanceTo(bv)
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...audit.yAxisRotationBetween(a, b), 'YXZ'))
  const centre = av.clone().add(bv).multiplyScalar(0.5)
  assert(new THREE.Vector3(0, -len / 2, 0).applyQuaternion(q).add(centre).distanceTo(av) < 1e-6)
  assert(new THREE.Vector3(0, len / 2, 0).applyQuaternion(q).add(centre).distanceTo(bv) < 1e-6)
}
for (let i = 0; i < audit.stair.flights.length; i++) {
  const flight = audit.stair.flights[i], run = new THREE.Vector3(...flight.b).sub(new THREE.Vector3(...flight.a))
  const members = nodes.filter(n => n.id.includes(':stringer:') || n.id.includes(':handrail:')).slice(i * 4, (i + 1) * 4)
  for (const member of members) {
    const direction = new THREE.Vector3(0, 1, 0).applyQuaternion(member.quaternion)
    assert(direction.dot(run) > 0, `Reversed stair member ${member.id}`)
  }
}

function hits(origin, direction, filter = () => true) {
  const ray = new THREE.Raycaster(new THREE.Vector3(...origin), new THREE.Vector3(...direction), 0.002, 50)
  return ray.intersectObjects(meshes.filter(filter), false)
}
for (const light of upperFloorDownSconces) {
  const floorHit = hits(light.position.toArray(), [0, -1, 0], mesh => mesh.name.startsWith('mezzanine:'))[0]
  assert(floorHit, 'An upper-floor down sconce has no mezzanine floor beneath it')
  assert(mezzanineFloorVisuals.some(visual => visual.node.id === floorHit.object.name && visual.castShadow),
    'The upper-floor light beam must intersect a shadow-casting mezzanine primitive')
}
const logs = m => m.name.startsWith('logs:')
let checkedWindows = 0
for (const [axis, fixed, openings] of [['x', -7.5, audit.frontOpenings], ['x', 7.5, audit.rearOpenings],
  ['z', -9, audit.leftOpenings], ['z', 9, audit.rightOpenings]]) {
  for (const o of openings) {
    const y = (o.bottom + o.top) / 2
    const origin = axis === 'x' ? [o.u, y, fixed - 0.4] : [fixed - 0.4, y, o.u]
    const rayHits = hits(origin, axis === 'x' ? [0, 0, 1] : [1, 0, 0], logs)
    assert(!rayHits.some(hit => hit.distance < 0.8), 'A log crosses a window/entrance aperture')
    checkedWindows++
  }
}
for (const r of audit.bedrooms) {
  const h = hits([r.door, 4.35, 3.8], [0, 0, 1], m => m.name.startsWith('rooms:'))
  assert(!h.some(hit => hit.distance < 1.1), 'Bedroom door passage obstructed')
  assert(r.right - r.left > 5.5)
}
const openingHits = hits([0, 1.3, -1], [0, 0, 1], m => m.name.startsWith('fireplace:'))
assert(openingHits[0]?.object.name.includes('recessed-fireback'), 'Fire opening is not recessed open space')
assert(openingHits[0].distance > 2.5)
const entryHits = hits([0, 1.6, -8], [0, 0, 1])
assert(entryHits[0]?.object.name.includes('recessed-fireback'), 'Entrance sightline obstructed')
let stairHeadroom = Infinity
for (const flight of audit.stair.flights) for (let step = 0; step < 9; step++) {
  const p = new THREE.Vector3(...flight.a).lerp(new THREE.Vector3(...flight.b), (step + 0.5) / 9)
  const treadY = flight.a[1] + (step + 1) * (flight.b[1] - flight.a[1]) / 9
  const overhead = hits([p.x, treadY + 0.01, p.z], [0, 1, 0], m => !m.name.startsWith('stairs:') && !m.name.startsWith('interior-lighting:'))
  if (overhead[0]) stairHeadroom = Math.min(stairHeadroom, overhead[0].distance + 0.01)
}
assert(stairHeadroom > 2.1, `Insufficient stair headroom: ${stairHeadroom}`)

// No roof slab runs through the stone chimney; inspect the exact runtime geometry.
for (const y of [9.65, 9.8, 9.9]) {
  const roofHits = hits([0, y, 0.95], [0, 0, 1], m => m.name.startsWith('roof:'))
  assert(!roofHits.some(h => h.distance < 0.80), 'Roof fills chimney penetration')
}
// Check every leaf reaches its target and its kinematic anchor follows the hinge.
for (const door of Object.values(audit.doorRegistry)) {
  handlers.get('doorState').forEach(fn => fn({ id: door.id, open: true }))
  for (let i = 0; i < 30; i++) handlers.get('update').forEach(fn => fn(0.08))
  assert(Math.abs(door.angle - door.openAngle) < 1e-6)
  assert(Math.abs(door.physicsEntry.anchor.rotation.y - door.angle) < 1e-6)
  assert(door.physicsEntry.collider.position.distanceTo(door.physicsEntry.anchor.position) < 1e-6)
  handlers.get('doorState').forEach(fn => fn({ id: door.id, open: false }))
  for (let i = 0; i < 30; i++) handlers.get('update').forEach(fn => fn(0.08))
  assert.equal(door.angle, 0)
}
const messages = []
const server = await executeSource(source, suffix, { server: true, onSend: (name, data) => messages.push({name, data}) })
server.handlers.get('toggleDoor').forEach(fn => fn({ id: 'entrance-left' }))
assert.equal(server.app.state.doors['entrance-left'], true)
assert.deepEqual(messages[0], {name: 'doorState', data: {id: 'entrance-left', open: true}})
server.handlers.get('toggleDoor').forEach(fn => fn({ id: 'invalid' }))
assert.equal(messages.length, 1)
app.position.set(3, 2, -4)
audit.syncStructuralPhysics(true)
for (const entry of audit.physicsEntries) assert(entry.collider.position.distanceTo(entry.anchor.position.clone().add(app.position)) < 1e-6)
app.position.set(0, 0, 0)
audit.syncStructuralPhysics(true)

const packagePath = path.join(directory, 'luxury_log_cabin.hyp')
let packageChecks = null
try {
  const bytes = await fs.readFile(packagePath), parsed = parseHyp(bytes)
  assert.equal(parsed.source, source)
  assert.equal(parsed.header.blueprint.version, 1)
  for (const asset of parsed.assets) {
    const hash = createHash('sha256').update(asset.data).digest('hex')
    assert(asset.url.startsWith(`asset://${hash}.`))
    if (asset.type === 'script') assert.equal(asset.mime, 'text/plain')
    if (asset.type === 'model') {
      const header = new DataView(asset.data.buffer, asset.data.byteOffset, asset.data.byteLength)
      const doc = JSON.parse(new TextDecoder().decode(asset.data.slice(20, 20 + header.getUint32(12, true))))
      assert(!doc.meshes && !doc.materials && !doc.textures)
    }
  }
  await executeSource(parsed.source)
  packageChecks = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), assets: parsed.assets.length,
    blueprintVersion: parsed.header.blueprint.version,
    exactSourceBytes: true, geometryFreeBootstrap: true, canonicalScriptMime: true }
} catch (error) { if (error.code !== 'ENOENT') throw error }
const report = {
  valid: true, runtime: 'local Hyperfy 0.16.0 with native extrude',
  constructorsAndGeometry: 'Actual Prim, Group, Action and Light constructors; visible geometry mounted; PhysX simulation not performed',
  doors: { count: 5, animationAndColliderAnchorChecks: 'pass', serverAuthorityChecks: 'pass', liveInteraction: 'not tested' },
  collision: { roofPanels: 2, appTranslationSync: 'pass', physXSimulation: 'not performed' },
  lighting: {
    interiorFixtures: audit.interiorFixtures.length, exteriorFixtures: audit.roofLights.length,
    spotlights: lights.length, shadowCastingLights: 2, upperFloorDownSconces: 'static; refresh on upper-door movement',
  },
  primitiveCount: visuals.length, primitiveTypes: [...new Set(configs.map(c => c.type))],
  callbacks: events.length, detachedNodes: detached.length, physicsNodes: audit.physicsEntries.length, externalTexturesOrGeometry: 0,
  bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
  enclosedBedrooms: 3, bedroomClearHeadroomMetres: 2.61, checkedWallOpenings: checkedWindows,
  mainEntranceSightline: 'clear to recessed fireplace', fireOpening: 'open arch with recessed fireback',
  stairs: { risers: 18, riserMetres: 3.18 / 18, goingMetres: 0.32, treadWidthMetres: 1.35, clearBetweenNewelsMetres: 1.205,
    minimumOverheadClearanceMetres: stairHeadroom, endpointAndDirectionChecks: 'pass' },
  roof: { ridgeMetres: 9.8, wallEaveMetres: 6, pitchDegrees: Math.atan2(3.8, 9) * 180 / Math.PI, chimneyPenetration: 'open' },
  package: packageChecks,
  fireplaceArch: {
    shadowCasters: fireplaceCasters.length,
    innerLayerCasters: fireplaceCasters.length - 13,
    archVoussoirs: 13,
    casting: 'selective pass',
  },
  mezzanineFloor: { shadowCasters: mezzanineFloorVisuals.length, upperLightOcclusion: 'pass' },
  roofBeams: { shadowCasters: rafterVisuals.length, casting: 'pass' },
  liveWorldImport: 'Not part of this validator; live replacement is documented in README',
}
await fs.writeFile(path.join(directory, 'validation_report.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
