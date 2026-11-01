import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'
import * as THREE from 'three'
import { packHyp, parseHyp } from '../../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const save = (name, value) => fs.writeFile(new URL(name, directory), JSON.stringify(value, null, 2))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const before = JSON.parse(await read('before.json'))
const original = (await read('before.js')).toString()
const call = "beamBetween([x, 2.16, 1.62], [x + direction * 0.8, 2.92, 1.62], 0.20, C.trim, 'mezzanine-knee')"
assert.equal(original.split(call).length, 2)
const source = original.replace(call,
  "// Keep brace faces 2 mm ahead of the posts to avoid coplanar join flicker.\n    " +
  call.replaceAll('1.62', '1.618').replace('0.20', '0.38'))
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

const bundled = await build({
  stdin: { contents: "export { executeSource } from './outputs/promptbox-large/runtime-adapter.mjs';", resolveDir: process.cwd() },
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { executeSource } = await import('data:text/javascript;base64,' +
  Buffer.from(bundled.outputFiles[0].contents).toString('base64'))
const checks = []
const expected = []
for (const x of [-8.65, -4.75, 4.75, 8.65]) for (const direction of [-1, 1]) {
  if (Math.abs(x + direction * .8) < 8.8)
    expected.push({ a: [x, 2.16, 1.618], b: [x + direction * .8, 2.92, 1.618] })
}
const normalize = configs => JSON.parse(JSON.stringify(configs.filter(c =>
  !c.id?.includes('mezzanine-knee'))))
for (const server of [false, true]) {
  const options = { server, props: desired.props, state: before.entity.state }
  const old = await executeSource(original, '', options)
  const runtime = await executeSource(source, '', options)
  assert.deepEqual(normalize(runtime.configs), normalize(old.configs),
    'Every other house primitive, door, frame, collider, and light must remain identical')
  assert.deepEqual(runtime.app.state, old.app.state)
  const knees = runtime.nodes.filter(n => n.id?.includes('mezzanine-knee'))
  assert.equal(knees.length, expected.length)
  const post = runtime.nodes.find(n => n.id?.includes('mezzanine-post'))
  const beam = runtime.nodes.find(n => n.id?.includes('balcony-edge-beam'))
  for (const [index, node] of knees.entries()) {
    node.updateTransform()
    assert.equal(node.size[0], post.size[0])
    assert.equal(node.size[2], post.size[2])
    assert.equal(node.size[0], beam.size[1])
    assert.equal(node.physics, null)
    for (const [sign, endpoint] of [[-1, expected[index].a], [1, expected[index].b]]) {
      const actual = new THREE.Vector3(0, sign * node.size[1] / 2, 0).applyMatrix4(node.matrixWorld)
      assert(actual.distanceTo(new THREE.Vector3().fromArray(endpoint)) < 1e-9)
    }
    const visual = runtime.visuals.find(v => v.node === node)
    const bounds = new THREE.Box3().setFromBufferAttribute(visual.geometry.getAttribute('position'))
      .applyMatrix4(visual.matrix)
    assert(Math.abs(bounds.min.z - 1.428) < 1e-7)
    assert(Math.abs(bounds.max.z - 1.808) < 1e-7)
    assert(bounds.min.z < 1.505 && bounds.max.z > 1.735,
      'Brace must emerge from both faces of the continuous log wall')
  }
  // Actual native geometries: the right-hand brace is visible from the pool side.
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
  const meshes = runtime.visuals.filter(v => v.node.id?.includes('mezzanine-knee') ||
    v.node.id?.includes('mezzanine-post') || v.node.id?.includes('balcony-edge-beam') ||
    v.node.id?.startsWith('billiards-portal-wall:')).map(v => {
    const mesh = new THREE.Mesh(v.geometry, material)
    mesh.matrixAutoUpdate = false
    mesh.matrixWorld.copy(v.matrix)
    mesh.userData.id = v.node.id
    return mesh
  })
  const ray = new THREE.Raycaster(new THREE.Vector3(8.15, 2.635, .5), new THREE.Vector3(0, 0, 1))
  assert(ray.intersectObjects(meshes, false)[0]?.object.userData.id.includes('mezzanine-knee'),
    'Timber logs must not hide the enlarged brace')
  for (const key of ['update', 'fixedUpdate', 'lateUpdate'])
    assert.equal(runtime.handlers.get(key)?.size || 0, 0)
  checks.push({ server, braces: knees.length, crossSectionMetres: [.38, .38],
    matchesAttachedPostsAndBeams: true, endpointOrientationPreserved: true,
    projectsBeyondLogFacesMetres: { front: .077, back: .073 },
    coplanarPostFacesAvoided: true, actualNativeGeometryVisible: true,
    allOtherGeometryPhysicsAndStatePreserved: true, idleCallbacks: 0 })
}
await save('validation.json', { valid: true, source: script, exactPackageSource: true,
  assetHashesVerified: true, actualNativeConstructors: true, checks })
console.log(JSON.stringify({ valid: true, version: desired.version, script, checks }))
