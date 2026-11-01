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
const before = JSON.parse(await read('before.json'))
const original = (await read('before.js')).toString()
const marker = '\nfor (const door of Object.values(doorRegistry)) {\n  const centreX'
assert.equal(original.split(marker).length, 2)
const source = original.replace(marker, `
// Match the bedroom doors, with separate leaves in front of the native portals.
// Outer hinges swing toward the pool; 90 degrees clears the adjacent house wall.
registerDoor('billiards-portal-left', 5.01, 0.15, 1.208, 1, 1.58, 2.34, Math.PI / 2)
registerDoor('billiards-portal-right', 8.39, 0.15, 1.208, -1, 1.58, 2.34, -Math.PI / 2)
${marker}`)
const script = 'asset://' + createHash('sha256').update(source).digest('hex') + '.js'
const desired = {
  ...before.blueprint, version: before.blueprint.version + 1, script,
  props: {
    ...before.blueprint.props,
    initialDoors: {
      ...before.blueprint.props.initialDoors, ...before.entity.state?.doors,
      'billiards-portal-left': false, 'billiards-portal-right': false,
    },
    initialLighting: before.entity.state?.lighting || before.blueprint.props.initialLighting,
  },
}
const bytes = packHyp(desired, [
  { type: 'model', url: desired.model, bytes: await read('model.glb'), mime: 'model/gltf-binary' },
  { type: 'script', url: script, bytes: Buffer.from(source), mime: 'text/javascript' },
])
const parsed = parseHyp(bytes)
assert.equal(parsed.assets.find(a => a.url === script).bytes.toString(), source)
for (const asset of parsed.assets) assert.equal(
  createHash('sha256').update(asset.bytes).digest('hex'), asset.url.slice(8, 72))
await fs.writeFile(new URL('source.js', directory), source)
await fs.writeFile(new URL('house.hyp', directory), bytes)
await save('desired-blueprint.json', desired)

const bundle = await build({
  entryPoints: ['outputs/promptbox-large/runtime-adapter.mjs'],
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { executeSource } = await import('data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].contents).toString('base64'))
const ids = ['billiards-portal-left', 'billiards-portal-right']
const normalize = configs => JSON.parse(JSON.stringify(configs))
  .filter(c => c.kind !== 'group' && !ids.some(id => c.id?.includes(id)))
  .map(c => ({ ...c, ...(c.id ? { id: c.id.replace(/:\d+$/, '') } : {}) }))
const suffix = '\nreturn { doorRegistry, setDoorGeometry, applyAuthoritativeDoorState, updateDoors }'
const checks = []
for (const server of [false, true]) {
  const options = { server, props: desired.props, state: before.entity.state }
  const old = await executeSource(original, '', options)
  const runtime = await executeSource(source, suffix, options)
  assert.deepEqual(normalize(runtime.configs), normalize(old.configs))
  assert.equal(runtime.configs.filter(c => c.kind === 'group').length,
    old.configs.filter(c => c.kind === 'group').length + 4)
  assert.deepEqual(runtime.app.state, old.app.state)
  for (const name of ['update', 'fixedUpdate', 'lateUpdate']) {
    assert.equal(runtime.handlers.get(name)?.size || 0, 0)
  }
  for (const id of ids) {
    const door = runtime.audit.doorRegistry[id]
    assert.equal(door.face, 'room')
    assert.equal(door.angle, 0)
    assert.equal(door.collider.physics, 'kinematic')
    if (!server) assert.equal(door.actions.length, 2)
  }
  // Sweep actual moving collider boxes against every fixed house box.
  const obstacles = runtime.nodes.filter(n => n.name === 'prim' &&
    n.type === 'box' && n.physics === 'static')
  assert(obstacles.length > 30, 'Audit must include the existing fixed house structure')
  function obb(node) {
    node.updateTransform()
    const half = new THREE.Vector3().fromArray(node.size).multiplyScalar(.5)
    return new OBB(new THREE.Vector3(), half).applyMatrix4(node.matrixWorld)
  }
  for (const id of ids) {
    const door = runtime.audit.doorRegistry[id]
    for (let degree = 0; degree <= 90; degree++) {
      runtime.audit.setDoorGeometry(door, Math.sign(door.openAngle) * degree * Math.PI / 180)
      const moving = runtime.nodes.find(n => n.id?.includes(id + '-leaf:'))
      for (const obstacle of obstacles) assert(!obb(moving).intersectsOBB(obb(obstacle), 1e-8),
        `${id} intersects ${obstacle.id} at ${degree} degrees`)
    }
    runtime.audit.setDoorGeometry(door, 0)
  }
  for (const [left, right] of [[true, false], [true, true], [false, true], [false, false]]) {
    for (const [i, open] of [left, right].entries()) {
      runtime.audit.applyAuthoritativeDoorState({ id: ids[i], open })
    }
    for (let i = 0; i < 40; i++) runtime.audit.updateDoors(.02)
    assert.equal(runtime.audit.doorRegistry[ids[0]].angle,
      left ? runtime.audit.doorRegistry[ids[0]].openAngle : 0)
    assert.equal(runtime.audit.doorRegistry[ids[1]].angle,
      right ? runtime.audit.doorRegistry[ids[1]].openAngle : 0)
    assert.equal(runtime.handlers.get('update')?.size || 0, 0)
  }
  checks.push({ server, existingGeometryAndStatePreserved: true,
    independentDoorStates: 4, clearSweepDegreesPerDoor: 91, idleCallbacks: 0 })
}
await save('validation.json', {
  valid: true, source: script, exactPackageSource: true, assetHashesVerified: true,
  actualNativeConstructors: true, existingInteriorDoorPattern: true, checks,
})
console.log(JSON.stringify({ valid: true, version: desired.version, script, checks }))
