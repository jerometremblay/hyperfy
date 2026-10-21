// Replace only the existing furniture; leave the running game and its rack alone.
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv-flow'
import { loadProfile, makeClient, deployObject } from '../../tools/worldsync/src/deployment.mjs'
const here = fileURLToPath(new URL('.', import.meta.url))
const engine = fileURLToPath(new URL('../../', import.meta.url))
Object.assign(process.env, dotenv.parse([`${engine}.env.agent`]))
const root = `${engine}../hyperfy-world-jerome`
const fit = JSON.parse(await fs.readFile(`${here}../overlay/fit.json`))
const before = JSON.parse(await fs.readFile(`${here}live-before.json`))
const previous = JSON.parse(await fs.readFile(`${here}live.json`))
const manifest = JSON.parse(await fs.readFile(`${here}manifest.json`))
const deployment = JSON.parse(await fs.readFile(`${here}../overlay/deployment.json`))
const profile = await loadProfile(root, 'online-world')
const client = makeClient(profile)
const current = await client.request(`/apps/${fit.tableBlueprintId}`)
const entity = await client.request(`/entities/${fit.tableEntityId}`)
if (current.script !== before.blueprint.script && current.script !== manifest.scriptUrl &&
    !(previous.target === profile.apiUrl && current.script === previous.blueprint.script))
  throw Error('Live table changed since the replacement was prepared')
for (const key of ['position', 'quaternion'])
  if (JSON.stringify(entity[key]) !== JSON.stringify(before.entity[key])) throw Error(`Table ${key} changed`)
if (entity.mover || entity.uploader) throw Error('The table is being edited')
console.log(`Target ${profile.apiUrl}: replace furniture ${fit.tableEntityId} with the upstream GLB, scale 1; preserve game ${deployment.entityId}`)
if (!process.argv.includes('--apply')) process.exit(0)
if (current.model !== manifest.modelUrl || current.script !== manifest.scriptUrl)
  console.log(await deployObject(root, fit.tableKey, 'online-world'))
if (JSON.stringify(entity.scale) !== '[1,1,1]')
  await client.request(`/entities/${fit.tableEntityId}`, { method: 'PATCH', json: { scale: [1, 1, 1] } })
const blueprint = await client.request(`/apps/${fit.tableBlueprintId}`)
const placed = await client.request(`/entities/${fit.tableEntityId}`)
const game = await client.request(`/apps/${deployment.blueprintId}`)
if (blueprint.model !== manifest.modelUrl || blueprint.script !== manifest.scriptUrl || JSON.stringify(placed.scale) !== '[1,1,1]')
  throw Error('Replacement table read-back failed')
if (game.props.showSurface !== false || game.props.tableSize !== '8') throw Error('Game overlay configuration changed')
const verification = { target: profile.apiUrl, blueprint, entity: { id: placed.id, blueprint: placed.blueprint, position: placed.position, quaternion: placed.quaternion, scale: placed.scale, pinned: placed.pinned }, game: { blueprintId: deployment.blueprintId, entityId: deployment.entityId, script: game.script, props: game.props }, checkedAt: new Date().toISOString() }
await fs.writeFile(`${here}live.json`, JSON.stringify(verification, null, 2) + '\n')
console.log('Verified upstream model, interaction script, placement and existing 8 ft game overlay.')
