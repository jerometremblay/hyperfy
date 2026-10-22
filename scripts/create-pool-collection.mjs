// Rebuild the four standard pool-room objects from their existing app sources.
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { compileSingleObject } from '../tools/worldsync/src/compiler.mjs'
import { parseHyp, packHyp } from '../tools/worldsync/src/hyp-format.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const destination = `${root}src/world/collections/default/`
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const read = file => fs.readFile(`${root}${file}`)
// Older native packages label scripts text/plain; normalize only their metadata
// for the stricter worldsync package validator. Asset bytes remain unchanged.
function unpack(bytes) {
  const length = bytes.readUInt32LE(0)
  const header = JSON.parse(bytes.subarray(4, 4 + length))
  for (const asset of header.assets)
    if (asset.type === 'script' && asset.mime === 'text/plain') asset.mime = 'text/javascript'
  const json = Buffer.from(JSON.stringify(header)), prefix = Buffer.alloc(4)
  prefix.writeUInt32LE(json.length)
  return parseHyp(Buffer.concat([prefix, json, bytes.subarray(4 + length)]))
}
const game = unpack(await read('hyperfy-billard/dist/hyperfy-billard.hyp'))
const table = unpack(await read('hyperfy-billard/upstream-table/table.hyp'))
const tableSource = table.assets.find(a => a.url === table.blueprint.script).bytes.toString()
const gameSource = game.assets.find(a => a.url === game.blueprint.script).bytes.toString()
// The furniture uses floor-level coordinates; the existing simulator uses cloth
// level. Keep both unchanged and attach game visuals at the table's cloth height.
const source = Buffer.from(`;(function(world, app, props) {\n${tableSource}\n})(world, app, { ...props, poolChannel: props.poolChannel || app.instanceId });
const gameRoot = world.isClient ? app.create('group', { position: [0, 0.708, 0] }) : null;
if (gameRoot) app.add(gameRoot);
const gameApp = new Proxy(app, {
  get(target, key) {
    if (key === 'position') return target.position.clone().add(
      new Vector3(0, 0.708, 0).multiply(target.scale).applyQuaternion(target.quaternion));
    if (key === 'add') return node => gameRoot.add(node);
    if (key === 'configure') return () => {};
    return target[key];
  }
});
(function(world, app, props) {\n${gameSource}\n})(world, gameApp, { ...props, tableSize: '8', showSurface: false,
  playChannel: props.poolChannel || app.instanceId });\n`)
const script = `asset://${hash(source)}.js`
const pool = { ...table.blueprint, id: 'default-pool-table', version: 0, name: 'Pool Table',
  desc: 'Playable 8-foot pool table with original Tailuge physics and sounds. Use a cue from any pool cue rack. Each table has its own game.',
  preload: true, props: { ...game.blueprint.props, ...table.blueprint.props, tableSize: '8', showSurface: false, poolChannel: '', playChannel: '' }, script }
const assets = [
  ...table.assets.filter(a => a.url !== table.blueprint.script),
  ...game.assets.filter(a => a.url !== game.blueprint.script && a.url !== game.blueprint.model),
  { type: 'script', url: script, bytes: source, mime: 'text/javascript' },
]
await fs.writeFile(`${destination}PoolTable.hyp`, packHyp(pool, assets))
const rack = unpack(await read('hyperfy-billard/cue-rack/rack.hyp'))
const rackSource = rack.assets.find(a => a.url === rack.blueprint.script).bytes
const rackScript = `asset://${hash(rackSource)}.js`
await fs.writeFile(`${destination}CueRack.hyp`, packHyp({ ...rack.blueprint,
  id: 'default-pool-cue-rack', name: 'Pool Cue Rack', version: 0, script: rackScript,
  props: {} }, [
  ...rack.assets.filter(a => a.url !== rack.blueprint.script),
  { type: 'script', url: rackScript, bytes: rackSource, mime: 'text/javascript' },
]))
for (const [key, file, name] of [
  ['billiards-triple-green-pendant-light', 'PoolLight.hyp', 'Pool Table Light'],
  ['billiards-wall-light-switch', 'WallLightSwitch.hyp', 'Wall Light Switch'],
]) {
  const object = await compileSingleObject(`${root}tools/worldsync/catalog`, `apps/${key}`)
  await fs.writeFile(`${destination}${file}`, packHyp({ ...object.blueprint, id: `default-${key}`, version: 0, name,
    props: { ...object.blueprint.props, channel: 'pool-room-lights' } }, object.assets))
}
console.log('Built PoolTable.hyp, CueRack.hyp, PoolLight.hyp and WallLightSwitch.hyp')
