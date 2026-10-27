import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { packHyp, parseHyp } from '../../../tools/worldsync/src/hyp-format.mjs'
import { loadProfile, makeClient } from '../../../tools/worldsync/src/deployment.mjs'

const directory = new URL('../', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const before = JSON.parse(await read('momentum/before.json'))
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const source = Buffer.concat([
  Buffer.from("const OBJECT_NAME = 'chair'\n"), await read('common.js'),
  Buffer.from('\n'), await read('floor-support.js'),
  Buffer.from('\n'), await read('chair-model.js'),
  Buffer.from('\n'), await read('chair-casters.js'),
  Buffer.from('\n'), await read('chair-physics.js'),
])
const script = 'asset://' + createHash('sha256').update(source).digest('hex') + '.js'
const blueprint = { ...before.blueprint, script, version: before.blueprint.version + 1 }
const model = (await client.requestBytes('/assets/' + blueprint.model.slice(8))).bytes
const bytes = packHyp(blueprint, [
  { type: 'model', url: blueprint.model, bytes: model, mime: 'model/gltf-binary' },
  { type: 'script', url: script, bytes: source, mime: 'text/javascript' },
])
assert(parseHyp(bytes).assets.find(a => a.url === script).bytes.equals(source))
await fs.writeFile(new URL('chair.js', directory), source)
await fs.writeFile(new URL('chair.hyp', directory), bytes)
await fs.writeFile(new URL('momentum/desired-blueprint.json', directory), JSON.stringify(blueprint, null, 2))
const objects = JSON.parse(await read('objects.json'))
const object = objects.find(o => o.key === 'chair')
object.blueprint = blueprint
object.entity.position = before.entity.state?.pose?.position || before.entity.position
object.entity.quaternion = before.entity.state?.pose?.quaternion || before.entity.quaternion
const house = before.snapshot.entities.find(e => e.id === 'HCzjtaVZFI')
const inverse = new THREE.Quaternion().fromArray(house.quaternion).invert()
object.position = new THREE.Vector3().fromArray(object.entity.position)
  .sub(new THREE.Vector3().fromArray(house.position)).applyQuaternion(inverse).toArray()
object.rotation = new THREE.Euler().setFromQuaternion(inverse
  .multiply(new THREE.Quaternion().fromArray(object.entity.quaternion)), 'YXZ').y
await fs.writeFile(new URL('objects.json', directory), JSON.stringify(objects, null, 2))
console.log(JSON.stringify({ version: blueprint.version, script, sourceBytes: source.length }))
