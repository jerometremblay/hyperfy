import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Vector3, Quaternion } from 'three'
import { packHyp, parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'

const dir = new URL('./', import.meta.url)
const before = JSON.parse(await fs.readFile(new URL('deployment-baseline.json', dir)))
const desk = before.entities.find(e => e.id === 'd16ab219-9538-445c-a9c1-02a9cbf2ae2e')
assert(desk)
const source = await fs.readFile(new URL('macbook.js', dir))
const logo = await fs.readFile(new URL('apple-logo.png', dir))
const screenshot = await fs.readFile(new URL('github-page.png', dir))
const model = {
  asset: { version: '2.0', generator: 'Hyperfy app authoring' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: 'HyperfyRoot' }],
}
let json = Buffer.from(JSON.stringify(model))
json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 32)])
const glb = Buffer.alloc(20 + json.length)
glb.write('glTF')
glb.writeUInt32LE(2, 4)
glb.writeUInt32LE(glb.length, 8)
glb.writeUInt32LE(json.length, 12)
glb.write('JSON', 16)
json.copy(glb, 20)
const url = (bytes, ext) => 'asset://' + createHash('sha256').update(bytes).digest('hex') + '.' + ext
const blueprint = {
  id: '581e2f47-58b5-4a24-ac05-03319dbc217b',
  version: 0,
  name: 'MacBook Pro 16 — Space Gray',
  image: null,
  author: 'Jerome',
  url: 'https://github.com/jerometremblay/hyperfy',
  desc: 'Standalone rounded, beveled extrusion laptop. E opens/closes the shared lid; its screen displays a packaged GitHub screenshot.',
  model: url(glb, 'glb'),
  script: url(source, 'js'),
  props: {},
  preload: true,
  public: false,
  locked: false,
  unique: false,
  frozen: false,
  scene: false,
  disabled: false,
}
const previous = before.blueprints.find(b => b.id === blueprint.id)
assert(previous, 'Laptop must exist in the preparation snapshot')
blueprint.version = previous.version + Number(previous.script !== blueprint.script)
const bytes = packHyp(blueprint, [
  { type: 'model', url: blueprint.model, bytes: glb, mime: 'model/gltf-binary' },
  { type: 'script', url: blueprint.script, bytes: source, mime: 'text/javascript' },
  { type: 'image', url: url(logo, 'png'), bytes: logo, mime: 'image/png' },
  { type: 'image', url: url(screenshot, 'png'), bytes: screenshot, mime: 'image/png' },
])
assert(source.toString().includes(url(logo, 'png')), 'Script must reference the packaged logo')
assert(source.toString().includes(url(screenshot, 'png')), 'Script must reference the packaged screenshot')
const parsed = parseHyp(bytes)
assert.deepEqual(parsed.blueprint, blueprint)
for (const asset of parsed.assets) {
  assert.equal(url(asset.bytes, asset.url.split('.').at(-1)), asset.url)
}
assert(Buffer.from(parsed.assets.find(a => a.type === 'script').bytes).equals(source))
// Leather-pad top is 0.786 m, including its extrusion bevel.
const deskLocal = [0, 0.7862, 0.755]
const position = new Vector3(...deskLocal)
  .multiply(new Vector3(...desk.scale))
  .applyQuaternion(new Quaternion(...desk.quaternion))
  .add(new Vector3(...desk.position))
const entity = {
  id: '5030e342-8a9e-4950-9f41-46d5cf46f7e4',
  blueprint: blueprint.id,
  position: position.toArray(),
  quaternion: desk.quaternion,
  scale: desk.scale,
  pinned: false,
}
await fs.writeFile(new URL('macbook-pro-16.hyp', dir), bytes)
await fs.writeFile(new URL('object.json', dir), JSON.stringify({ blueprint, entity, deskLocal, desk }, null, 2))
console.log(JSON.stringify({ package: 'macbook-pro-16.hyp', script: blueprint.script, position: entity.position }))
