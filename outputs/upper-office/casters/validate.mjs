import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'
import * as THREE from 'three'
import { parseHyp } from '../../../tools/worldsync/src/hyp-format.mjs'

const source = await fs.readFile('outputs/upper-office/chair.js', 'utf8')
const packageBytes = await fs.readFile('outputs/upper-office/chair.hyp')
const parsed = parseHyp(packageBytes)
assert.equal(Buffer.from(parsed.assets.find(a => a.url === parsed.blueprint.script).bytes).toString('utf8'), source)
const bundle = await build({ entryPoints: ['outputs/upper-office/runtime-adapter.mjs'],
  bundle: true, platform: 'node', format: 'esm', write: false })
const { executeSource } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].contents).toString('base64'))
const runtime = await executeSource(source, '\nreturn { casters, casterRadius, casterTrail, casterHalfSpacing, getCasterState, setCasterState, advanceCasters, drawCasters }')
const a = runtime.audit
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle))
const zero = () => {
  a.setCasterState(a.casters.map(() => [0, 0, 0]))
  a.casters.forEach((caster, i) => { caster.turnSign = i % 2 ? -1 : 1 })
}
for (const caster of a.casters) {
  assert.equal(caster.swivel.parent.id, runtime.root.id)
  assert.equal(caster.wheels.length, 2)
  for (const [index, wheel] of caster.wheels.entries()) {
    assert.equal(wheel.parent.id, caster.swivel.id)
    assert.equal(wheel.position.y, 0)
    assert.equal(wheel.position.z, a.casterTrail)
    assert.equal(wheel.position.x, (index ? 1 : -1) * a.casterHalfSpacing)
  }
}
zero()
a.advanceCasters(0, -.12)
assert(a.getCasterState().every(state => Math.abs(state[0]) < 1e-12 &&
  Math.abs(state[1] + 2) < 1e-12 && Math.abs(state[2] + 2) < 1e-12), 'Straight travel must rotate each tire by distance/radius')
zero()
a.setCasterState(a.casters.map(() => [.8, 0, 0]))
const old = a.getCasterState()[0]
const dx = 0, dz = -.00002
a.advanceCasters(dx, dz)
const next = a.getCasterState()[0]
const averageYaw = (old[0] + next[0]) / 2
const axleX = dx + a.casterTrail * (Math.sin(next[0]) - Math.sin(old[0]))
const axleZ = dz + a.casterTrail * (Math.cos(next[0]) - Math.cos(old[0]))
const lateralSlip = axleX * Math.cos(averageYaw) - axleZ * Math.sin(averageYaw)
assert(Math.abs(lateralSlip) < 1e-10, 'The trailing axle must move along its rolling direction')
const leftTravel = (old[1] - next[1]) * a.casterRadius
const rightTravel = (old[2] - next[2]) * a.casterRadius
assert(Math.abs(rightTravel - leftTravel - 2 * a.casterHalfSpacing * (next[0] - old[0])) < 1e-12,
  'Inner and outer tires must roll different distances while swivelling')
assert.notEqual(next[1], next[2])
zero()
a.advanceCasters(0, .02)
assert(a.getCasterState().every(state => Math.abs(wrap(state[0])) > .02 &&
  (state[1] + state[2]) / 2 > 0), 'A reversal must first roll backward and begin swivelling')
a.advanceCasters(0, .30)
assert(a.getCasterState().every(state => Math.PI - Math.abs(wrap(state[0])) < .001), 'Reversed wheels must settle behind the pivot')
zero()
a.setCasterState(a.casters.map(() => [.7, 0, 0]))
a.advanceCasters(.09, -.12)
const coarse = a.getCasterState()
zero()
a.setCasterState(a.casters.map(() => [.7, 0, 0]))
for (let i = 0; i < 100; i++) a.advanceCasters(.0009, -.0012)
const fine = a.getCasterState()
for (let i = 0; i < 5; i++) for (let axis = 0; axis < 3; axis++)
  assert(Math.abs(coarse[i][axis] - fine[i][axis]) < 1e-10, 'Caster motion must not depend on frame rate')
const paused = a.getCasterState()
for (let i = 0; i < 100; i++) a.advanceCasters(0, 0)
assert.deepEqual(a.getCasterState(), paused)

// Inspect actual engine geometry at many swivel angles and tire phases.
let largestExtent = 0
for (const yaw of [0, .4, Math.PI / 2, 2, Math.PI, -Math.PI / 2]) {
  a.setCasterState(a.casters.map((_, i) => [yaw + i * .13, i * .27, i * .41]))
  a.drawCasters()
  runtime.root.updateTransform()
  for (const node of runtime.nodes) {
    node.updateTransform()
    node.updateMatrixWorldOffset?.()
  }
  for (const v of runtime.visuals.filter(v => v.node.id.includes(':caster-'))) {
    const mesh = new THREE.Mesh(v.geometry, new THREE.MeshBasicMaterial())
    mesh.matrixAutoUpdate = false
    mesh.matrix.copy(v.node.matrixWorldOffset)
    mesh.matrixWorld.copy(v.node.matrixWorldOffset)
    const bounds = new THREE.Box3().setFromObject(mesh, true)
    assert(bounds.min.y >= -.000001, 'A swivel must not push caster geometry below the floor')
    largestExtent = Math.max(largestExtent, Math.abs(bounds.min.x), Math.abs(bounds.max.x),
      Math.abs(bounds.min.z), Math.abs(bounds.max.z))
    if (v.node.id.includes(':caster-wheel:')) assert(bounds.min.y < .002, 'Each rolling tire must remain in floor contact')
  }
}
assert(largestExtent < .475, 'The collision shell must contain every caster orientation')
assert.equal(runtime.handlers.size, 0)
const report = {
  valid: true, exactPackageSource: true, actualEngineNodes: true,
  horizontalSharedAxles: 5, verticalOffsetSwivels: 5, independentlyRollingTires: 10,
  trailMetres: a.casterTrail, wheelRadiusMetres: a.casterRadius,
  differentialRotation: 'pass', noLateralSlip: 'pass', reversal: 'pass',
  frameRateInvariance: 'pass', floorContactThroughoutAnimation: 'pass',
  collisionEnvelope: { maximumExtent: largestExtent, halfWidth: .475 },
  idleAnimationCallbacks: 0,
  script: 'asset://' + createHash('sha256').update(source).digest('hex') + '.js',
}
await fs.writeFile('outputs/upper-office/casters/validation.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
