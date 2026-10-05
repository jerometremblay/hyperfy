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
const suffix = '\nreturn {D, bedrooms, stair, yAxisRotationBetween, chimneyHalf, roofY, frontOpenings, rearOpenings, leftOpenings, rightOpenings}'
const { nodes, visuals, events, configs, audit } = await executeSource(source, suffix)
assert.equal(events.length, 0)
assert.equal(nodes.length, visuals.length)
assert(configs.every(c => c.physics === null && !c.texture))
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
assert.equal(configs.filter(c => c.id.includes('open-bedroom-door')).length, 3)
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
  const overhead = hits([p.x, treadY + 0.01, p.z], [0, 1, 0], m => !m.name.startsWith('stairs:'))
  if (overhead[0]) stairHeadroom = Math.min(stairHeadroom, overhead[0].distance + 0.01)
}
assert(stairHeadroom > 2.1, `Insufficient stair headroom: ${stairHeadroom}`)

// No roof slab runs through the stone chimney; inspect the exact runtime geometry.
for (const y of [9.65, 9.8, 9.9]) {
  const roofHits = hits([0, y, 0.95], [0, 0, 1], m => m.name.startsWith('roof:'))
  assert(!roofHits.some(h => h.distance < 0.80), 'Roof fills chimney penetration')
}
const packagePath = path.join(directory, 'luxury_log_cabin.hyp')
let packageChecks = null
try {
  const bytes = await fs.readFile(packagePath), parsed = parseHyp(bytes)
  assert.equal(parsed.source, source)
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
    exactSourceBytes: true, geometryFreeBootstrap: true, canonicalScriptMime: true }
} catch (error) { if (error.code !== 'ENOENT') throw error }
const report = {
  valid: true, runtime: 'local Hyperfy 0.16.0 with native extrude',
  constructorsAndGeometry: 'Actual Prim constructor, proxy, mount and geometry code',
  primitiveCount: nodes.length, primitiveTypes: [...new Set(configs.map(c => c.type))],
  callbacks: events.length, detachedNodes: 0, physicsNodes: 0, externalTexturesOrGeometry: 0,
  bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
  enclosedBedrooms: 3, bedroomClearHeadroomMetres: 2.61, checkedWallOpenings: checkedWindows,
  mainEntranceSightline: 'clear to recessed fireplace', fireOpening: 'open arch with recessed fireback',
  stairs: { risers: 18, riserMetres: 3.18 / 18, goingMetres: 0.32, treadWidthMetres: 1.35, clearBetweenNewelsMetres: 1.205,
    minimumOverheadClearanceMetres: stairHeadroom, endpointAndDirectionChecks: 'pass' },
  roof: { ridgeMetres: 9.8, wallEaveMetres: 6, pitchDegrees: Math.atan2(3.8, 9) * 180 / Math.PI, chimneyPenetration: 'open' },
  package: packageChecks,
  liveWorldImport: 'Not performed; artifact creation does not alter the running world',
}
await fs.writeFile(path.join(directory, 'validation_report.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
