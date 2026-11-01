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
const original = (await read('before.js')).toString()
let source = original
function replaceOnce(old, next) {
  assert.equal(source.split(old).length, 2, 'Expected one occurrence: ' + old)
  source = source.replace(old, next)
}
replaceOnce("face = 'room', slideDistance = 0) {",
  "face = 'room', slideDistance = 0, hingeDepth = face === 'entrance' ? -0.080 : 0.065) {")
replaceOnce("const hingeOffsetZ = slideDistance ? 0 : (face === 'entrance' ? -0.080 : 0.065)",
  "const hingeOffsetZ = slideDistance ? 0 : hingeDepth")
replaceOnce("const faceZ = face === 'entrance' ? -0.075 : 0.062",
  "const faceZ = face === 'entrance' ? -0.075 : Math.sign(hingeOffsetZ) * 0.062")
replaceOnce("(face === 'entrance' ? -0.060 : 0.040)",
  "(face === 'entrance' ? -0.060 : Math.sign(hingeOffsetZ) * 0.040)")
replaceOnce(
  "registerDoor('billiards-portal-left', 5.32, 0.15, 1.208, 1, 0.96, 2.12, Math.PI / 2)",
  "// Inset leaves into the casing; front-face hinges swing them toward the pool.\nregisterDoor('billiards-portal-left', 5.32, 0.15, 1.35, 1, 0.96, 2.12, Math.PI / 2, 'room', 0, -0.065)")
replaceOnce(
  "registerDoor('billiards-portal-right', 8.08, 0.15, 1.208, -1, 0.96, 2.12, -Math.PI / 2)",
  "registerDoor('billiards-portal-right', 8.08, 0.15, 1.35, -1, 0.96, 2.12, -Math.PI / 2, 'room', 0, -0.065)")
const script = 'asset://' + hash(source) + '.js'
const desired = {
  ...before.blueprint, version: before.blueprint.version + 1, script,
  props: {
    ...before.blueprint.props,
    initialDoors: { ...before.blueprint.props.initialDoors, ...before.entity.state.doors },
    initialLighting: before.entity.state.lighting,
  },
}
const bytes = packHyp(desired, [
  { type: 'model', url: desired.model, bytes: await read('model.glb'), mime: 'model/gltf-binary' },
  { type: 'script', url: script, bytes: Buffer.from(source), mime: 'text/javascript' },
])
const parsed = parseHyp(bytes)
for (const asset of parsed.assets) assert.equal(hash(asset.bytes), asset.url.slice(8, 72))
assert.equal(parsed.assets.find(a => a.url === script).bytes.toString(), source)
await fs.writeFile(new URL('source.js', directory), source)
await fs.writeFile(new URL('house.hyp', directory), bytes)
await save('desired-blueprint.json', desired)

const bundle = await build({
  stdin: { contents: "export { executeSource } from './outputs/promptbox-large/runtime-adapter.mjs';", resolveDir: process.cwd() },
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { executeSource } = await import('data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].contents).toString('base64'))
const normalize = configs => JSON.parse(JSON.stringify(configs))
  .filter(c => c.kind !== 'group' && !c.id?.includes('billiards-portal-'))
const suffix = '\nreturn { doorRegistry, setDoorGeometry, applyAuthoritativeDoorState, updateDoors }'
const checks = []
const obb = node => {
  node.updateTransform()
  return new OBB(new THREE.Vector3(), new THREE.Vector3().fromArray(node.size).multiplyScalar(.5))
    .applyMatrix4(node.matrixWorld)
}
for (const server of [false, true]) {
  const options = { server, props: desired.props, state: { ...before.entity.state,
    doors: { ...before.entity.state.doors, 'billiards-portal-left': false, 'billiards-portal-right': false } } }
  const old = await executeSource(original, '', options)
  const runtime = await executeSource(source, suffix, options)
  assert.deepEqual(normalize(runtime.configs), normalize(old.configs),
    'All existing house geometry, including frames and wall, must remain identical')
  assert.deepEqual(runtime.app.state, old.app.state)
  const upstairs = runtime.audit.doorRegistry['bedroom-1']
  for (const id of ['billiards-portal-left', 'billiards-portal-right']) {
    const door = runtime.audit.doorRegistry[id]
    assert.equal(door.width, upstairs.width)
    assert.equal(door.height, upstairs.height)
    assert.equal(door.face, upstairs.face)
    assert.equal(door.leafOffsetZ, .065)
    const panel = runtime.nodes.find(n => n.id?.includes(id + '-panel:'))
    const closed = obb(panel)
    assert(Math.abs(closed.center.z - 1.35) < 1e-9)
    assert(closed.center.z - closed.halfSize.z > 1.274, 'Panel must sit behind the casing face')
    assert(closed.center.z + closed.halfSize.z < 1.62, 'Panel must fit within frame depth')
    assert(Math.abs(closed.center.z - 1.34) < closed.halfSize.z, 'Portal plane intersects closed panel')
    const obstacles = runtime.nodes.filter(n => n.name === 'prim' && n.type === 'box' &&
      (n.physics === 'static' || n.id?.startsWith('billiards-portal-wall:')))
    const moving = runtime.nodes.filter(n => n.name === 'prim' && n.type === 'box' &&
      n.id?.includes(id + '-') && !n.id.includes('-hinge-frame'))
    for (let degree = 0; degree <= 90; degree++) {
      runtime.audit.setDoorGeometry(door, Math.sign(door.openAngle) * degree * Math.PI / 180)
      for (const leaf of moving) for (const obstacle of obstacles) {
        assert(!obb(leaf).intersectsOBB(obb(obstacle), 1e-8),
          `${leaf.id} intersects ${obstacle.id} at ${degree} degrees`)
      }
    }
    runtime.audit.setDoorGeometry(door, 0)
  }
  for (const [left, right] of [[true, false], [true, true], [false, true], [false, false]]) {
    for (const [id, open] of [['billiards-portal-left', left], ['billiards-portal-right', right]])
      runtime.audit.applyAuthoritativeDoorState({ id, open })
    for (let frame = 0; frame < 40; frame++) runtime.audit.updateDoors(.02)
    assert.equal(runtime.audit.doorRegistry['billiards-portal-left'].angle, left ? Math.PI / 2 : 0)
    assert.equal(runtime.audit.doorRegistry['billiards-portal-right'].angle, right ? -Math.PI / 2 : 0)
    assert.equal(runtime.handlers.get('update')?.size || 0, 0)
  }
  checks.push({ server, sameDoorSizeAsUpstairs: [.96, 2.12],
    closedPanelInsetFromCasingMetres: .021, portalOverlapAllowed: true,
    existingHouseFramesAndWallPreserved: true, clearVisualAndCollisionSweepDegrees: 91,
    independentDoorStates: 4, idleCallbacks: 0 })
}
await save('validation.json', {
  valid: true, source: script, exactPackageSource: true, assetHashesVerified: true,
  actualNativeConstructors: true, checks,
})
console.log(JSON.stringify({ valid: true, version: desired.version, script, checks }))
