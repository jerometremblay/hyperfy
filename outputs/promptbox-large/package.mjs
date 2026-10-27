import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { packHyp, parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'

const directory = new URL('./', import.meta.url)
const read = name => fs.readFile(new URL(name, directory))
const original = JSON.parse(await read('house-blueprint.json'))
const base = JSON.parse(await read('deployment-base-blueprint.json').catch(() => JSON.stringify(original)))
const initialState = JSON.parse(await read('initial-state.json'))
const manifest = JSON.parse(await read('manifest.json'))
const source = await read('source.js')
const client = makeClient(await loadProfile('/Users/jerome/metaverse/hyperfy-world-jerome', 'online-world'))
const model = (await client.requestBytes('/assets/' + original.model.slice(8))).bytes
const script = 'asset://' + createHash('sha256').update(source).digest('hex') + '.js'
const blueprint = {
  ...base,
  version: base.version + 1,
  desc: 'Original log house with existing floorboards continued into the two-storey center-room rear extension; large glazing on three exposed sides and a two-track sliding patio door. Original hinged doors, roof portals and lighting circuits retained.',
  script,
  props: {
    ...base.props,
    promptBoxRequestId: manifest.requestId,
    promptBoxTargetEntityId: manifest.intersections[0].entityId,
    initialDoors: initialState.doors,
    initialLighting: initialState.lighting,
  },
}
const bytes = packHyp(blueprint, [
  { type: 'model', url: original.model, bytes: model, mime: 'model/gltf-binary' },
  { type: 'script', url: script, bytes: source, mime: 'text/javascript' },
])
const checked = parseHyp(bytes)
if (!checked.assets.find(asset => asset.url === script).bytes.equals(source)) throw new Error('Source mismatch')
await fs.writeFile(new URL('house-extension.hyp', directory), bytes)
await fs.writeFile(new URL('desired-blueprint.json', directory), JSON.stringify(blueprint, null, 2))
console.log(JSON.stringify({ package: 'house-extension.hyp', bytes: bytes.length, script, assets: checked.assets.length }))
