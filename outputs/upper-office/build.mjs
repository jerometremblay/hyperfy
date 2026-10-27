import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { packHyp, parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'

const directory = new URL('./', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const before = JSON.parse(await read('before.json'))
const physicalBefore = JSON.parse(await read(process.argv.includes('--casters') ? 'casters/before.json' : 'physics/before.json'))
const client = makeClient(await loadProfile('../hyperfy-world-jerome', 'online-world'))
const model = (await client.requestBytes('/assets/' + before.blueprint.model.slice(8))).bytes
const common = await read('common.js')
const objects = []
for (const spec of [
  { key: 'desk', name: 'Walnut and Brass U-shaped Work Desk',
    desc: 'Large U-shaped walnut desk with brass edge, drawer pedestals and leather pad. Physical collision preserves the open bay; placement stays grounded.',
    position: [0, 3.302, 10.65], rotation: 0 },
  { key: 'chair', name: 'Luxury Leather Executive Chair — Five Caster Base',
    desc: 'Luxury leather chair with five offset swivelling twin casters and horizontal axles. Physical, grounded and sittable: WASD/arrows roll; Space/E stands. Wheels self-align and rotate with actual travel.',
    position: [0, 3.302, 10.53], rotation: Math.PI },
]) {
  const source = Buffer.concat([Buffer.from(`const OBJECT_NAME = '${spec.key}'\n`), common,
    Buffer.from('\n'), await read('floor-support.js'),
    Buffer.from('\n'), await read(spec.key + '-model.js'),
    ...(spec.key === 'chair' ? [Buffer.from('\n'), await read('chair-casters.js')] : []),
    Buffer.from('\n'), await read(spec.key + '-physics.js')])
  const script = 'asset://' + createHash('sha256').update(source).digest('hex') + '.js'
  const live = physicalBefore.furniture.find(f => f.key === spec.key)
  assert(live)
  const blueprint = {
    ...live.blueprint,
    id: live.blueprint.id, version: live.blueprint.version + Number(script !== live.blueprint.script), name: spec.name,
    image: null, author: 'Jerome', url: '', desc: spec.desc,
    model: before.blueprint.model, script,
    props: { ...live.blueprint.props, castShadows: true, receiveShadows: true },
    preload: true, public: false, locked: false, unique: false,
    frozen: false, scene: false, disabled: false,
  }
  const bytes = packHyp(blueprint, [
    { type: 'model', url: blueprint.model, bytes: model, mime: 'model/gltf-binary' },
    { type: 'script', url: script, bytes: source, mime: 'text/javascript' },
  ])
  const parsed = parseHyp(bytes)
  assert(Buffer.from(parsed.assets.find(a => a.url === script).bytes).equals(source))
  const houseQuaternion = new THREE.Quaternion(...before.house.quaternion)
  const entity = {
    id: live.entity.id, blueprint: blueprint.id,
    position: [...(live.entity.state?.pose?.position || live.entity.position)],
    quaternion: [...(live.entity.state?.pose?.quaternion || live.entity.quaternion)],
    scale: [...live.entity.scale], pinned: live.entity.pinned,
  }
  const localPosition = new THREE.Vector3(...entity.position)
    .sub(new THREE.Vector3(...before.house.position)).applyQuaternion(houseQuaternion.clone().invert())
    .divide(new THREE.Vector3(...before.house.scale))
  const localQuaternion = houseQuaternion.clone().invert().multiply(new THREE.Quaternion(...entity.quaternion))
  const localRotation = new THREE.Euler().setFromQuaternion(localQuaternion, 'YXZ').y
  const object = { ...spec, position: localPosition.toArray(), rotation: localRotation, blueprint, entity }
  objects.push(object)
  await fs.writeFile(new URL(spec.key + '.js', directory), source)
  await fs.writeFile(new URL(spec.key + '.hyp', directory), bytes)
}
const houseSource = await read('house.js')
const houseBytes = packHyp(before.blueprint, [
  { type: 'model', url: before.blueprint.model, bytes: model, mime: 'model/gltf-binary' },
  { type: 'script', url: before.blueprint.script, bytes: houseSource, mime: 'text/javascript' },
])
await fs.writeFile(new URL('house.hyp', directory), houseBytes)
await fs.writeFile(new URL('objects.json', directory), JSON.stringify(objects, null, 2))
console.log(JSON.stringify(objects.map(o => ({key:o.key, blueprintId:o.blueprint.id, entityId:o.entity.id, houseLocalPosition:o.position})), null, 2))
