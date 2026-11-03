import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'
import { packHyp, parseHyp } from '../../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const save = (name, value) => fs.writeFile(new URL(name, directory), JSON.stringify(value, null, 2))
const before = JSON.parse(await read('before.json'))
const original = (await read('before.js')).toString()
let source = original
for (const [old, next] of [
  ['// Outer hinges swing toward the pool; 90 degrees clears the adjacent house wall.',
    '// Outer hinges swing toward the pool; the right leaf stops short of the wall and window sill.'],
  ["2.12, Math.PI / 2, 'room', 0, -0.065)", "2.12, hingedDoorOpenAngle, 'room', 0, -0.065)"],
  ["2.12, -Math.PI / 2, 'room', 0, -0.065)", "2.12, -137.3 * Math.PI / 180, 'room', 0, -0.065)"],
]) {
  assert.equal(source.split(old).length, 2)
  source = source.replace(old, next)
}
const script = 'asset://' + createHash('sha256').update(source).digest('hex') + '.js'
const desired = { ...before.blueprint, version: before.blueprint.version + 1, script,
  props: { ...before.blueprint.props,
    initialDoors: { ...before.blueprint.props.initialDoors, ...before.entity.state.doors },
    initialLighting: before.entity.state.lighting } }
const bytes = packHyp(desired, [
  { type: 'model', url: desired.model, bytes: await read('model.glb'), mime: 'model/gltf-binary' },
  { type: 'script', url: script, bytes: Buffer.from(source), mime: 'text/javascript' },
])
const parsed = parseHyp(bytes)
for (const asset of parsed.assets) assert.equal(createHash('sha256').update(asset.bytes).digest('hex'), asset.url.slice(8, 72))
assert.equal(parsed.assets.find(a => a.url === script).bytes.toString(), source)
await fs.writeFile(new URL('source.js', directory), source)
await fs.writeFile(new URL('house.hyp', directory), bytes)
await save('desired-blueprint.json', desired)

const bundle = await build({ entryPoints: ['outputs/promptbox-large/runtime-adapter.mjs'],
  bundle: true, format: 'esm', platform: 'node', write: false })
const { executeSource } = await import('data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].contents).toString('base64'))
const suffix = '\nreturn { doorRegistry, setDoorGeometry, applyAuthoritativeDoorState, updateDoors }'
const measurements = JSON.parse(await read('clearance-measurement.json'))
const angles = { 'billiards-portal-left': 175, 'billiards-portal-right': -137.3 }
const checks = []
for (const server of [false, true]) {
  const options = { server, props: desired.props, state: { ...before.entity.state,
    doors: { ...before.entity.state.doors, 'billiards-portal-left': false, 'billiards-portal-right': false } } }
  const old = await executeSource(original, suffix, options)
  const runtime = await executeSource(source, suffix, options)
  assert.deepEqual(JSON.parse(JSON.stringify(runtime.configs)), JSON.parse(JSON.stringify(old.configs)),
    'Closed geometry and every node config must stay identical')
  assert.deepEqual(runtime.app.state, old.app.state)
  for (const [id, door] of Object.entries(runtime.audit.doorRegistry)) {
    if (!Object.hasOwn(angles, id)) {
      assert.equal(door.openAngle, old.audit.doorRegistry[id].openAngle)
      continue
    }
    assert(Math.abs(door.openAngle * 180 / Math.PI - angles[id]) < 1e-8)
    const clearance = id === 'billiards-portal-right' ? .005 : 0
    const limit = measurements.find(m => m.id === id).limits.find(l => l.clearanceMetres === clearance)
    assert(!limit.firstIntersection || Math.abs(angles[id]) < limit.firstIntersection.degrees,
      id + ' must clear the frame and wall through its full sweep')
  }
  for (const [left, right] of [[true, false], [true, true], [false, true], [false, false]]) {
    for (const [id, open] of [['billiards-portal-left', left], ['billiards-portal-right', right]])
      runtime.audit.applyAuthoritativeDoorState({ id, open })
    for (let frame = 0; frame < 60; frame++) runtime.audit.updateDoors(.02)
    assert.equal(runtime.audit.doorRegistry['billiards-portal-left'].angle,
      left ? runtime.audit.doorRegistry['billiards-portal-left'].openAngle : 0)
    assert.equal(runtime.audit.doorRegistry['billiards-portal-right'].angle,
      right ? runtime.audit.doorRegistry['billiards-portal-right'].openAngle : 0)
    assert.equal(runtime.handlers.get('update')?.size || 0, 0)
  }
  checks.push({ server, existingGeometryAndOtherDoorAnglesPreserved: true,
    independentDoorStates: 4, idleCallbacks: 0 })
}
await save('validation.json', { valid: true, source: script, exactPackageSource: true,
  assetHashesVerified: true, actualNativeConstructors: true,
  angles, wallSideClearanceMetres: .005, clearanceSweepStepDegrees: .01, measurements, checks })
console.log(JSON.stringify({ valid: true, version: desired.version, angles, checks }))
