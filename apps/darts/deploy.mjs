// Additive deployment through the documented Agent API. Existing mapped darts
// updates use worldsync's version-checked deployObject. No other app is touched.
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID, createHash } from 'node:crypto'
import { loadProfile, makeClient, deployObject } from '../../tools/worldsync/src/deployment.mjs'
import { parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'

const root = '/Users/jerome/metaverse/hyperfy-world-jerome'
const key = 'apps/darts'
const instanceKey = 'instances/darts/001'
const profileName = 'online-world'
const artifacts = path.resolve('outputs/darts')
const mapPath = path.join(root, '.worldsync/destinations/online-world.json')
const scenePath = path.join(root, 'scenes/local-world/scene.json')
const mapBytes = await fs.readFile(mapPath)
const sceneBytes = await fs.readFile(scenePath)
const map = JSON.parse(mapBytes)
const scene = JSON.parse(sceneBytes)
const profile = await loadProfile(root, profileName)
if (
  profile.apiUrl !== 'https://monstre.duckdns.org:3333/api/agent' ||
  map.apiUrl !== profile.apiUrl ||
  map.sceneKey !== 'local-world' ||
  scene.sceneKey !== 'local-world'
)
  throw new Error('Unexpected destination')
const client = makeClient(profile)
const [apps, entities, world] = await Promise.all([
  client.request('/apps'),
  client.request('/entities'),
  client.request('/world'),
])
const parsed = parseHyp(await fs.readFile(path.join(artifacts, 'darts.hyp')))
const objectDir = path.join(root, 'objects/apps/darts')
const hasObject = await fs.stat(objectDir).then(
  () => true,
  () => false
)
if (hasObject && !map.blueprints[key])
  throw new Error('Source darts object exists without a live mapping; inspect before replacing')
let record
try {
  record = JSON.parse(await fs.readFile(path.join(artifacts, 'deployment.json')))
} catch (e) {
  if (e.code !== 'ENOENT') throw e
}
const blueprintId = map.blueprints[key] || record?.blueprintId || randomUUID()
const entityId = map.entities[instanceKey] || record?.entityId || randomUUID()
const currentApp = apps.find(a => a.id === blueprintId)
const currentEntity = entities.find(e => e.id === entityId)
if (!map.blueprints[key] && apps.some(a => a.name === parsed.blueprint.name && a.id !== blueprintId))
  throw new Error('Another live darts blueprint exists; inspect before creating a duplicate')
if (currentApp && currentApp.name !== parsed.blueprint.name) throw new Error('Recorded ID belongs to another blueprint')
if (currentEntity && currentEntity.blueprint !== blueprintId)
  throw new Error('Recorded instance belongs to another blueprint')
const placement = {
  key: instanceKey,
  object: key,
  pinned: true,
  position: [29.4, 0.12096717663691105, 4.55],
  quaternion: [0, -0.1305261922200516, 0, 0.9914448613738105],
  scale: [1, 1, 1],
}
const plan = {
  profile: profileName,
  scene: 'local-world',
  blueprintId,
  entityId,
  createBlueprint: !currentApp,
  createInstance: !currentEntity,
  placement,
  assets: parsed.assets.length,
  unrelatedMutations: 0,
}
console.log(JSON.stringify(plan, null, 2))
if (!process.argv.includes('--write')) process.exit(0)

await fs.writeFile(path.join(artifacts, 'deployment.json'), JSON.stringify(plan, null, 2) + '\n')
if (!hasObject) {
  await fs.cp('tools/worldsync/catalog/objects/apps/darts', objectDir, { recursive: true, errorOnExist: true })
} else {
  // Only generated darts files, never another object.
  for (const file of ['script.js', 'model.glb', 'board.png', 'throw.glb', 'object.json'])
    await fs.copyFile(path.join('tools/worldsync/catalog/objects/apps/darts', file), path.join(objectDir, file))
}
for (const asset of parsed.assets) await client.uploadAsset(asset)
if (!currentApp) {
  const { id, version, ...fields } = parsed.blueprint
  await client.request('/apps', { method: 'POST', json: { id: blueprintId, ...fields } })
} else if (map.blueprints[key]) {
  await deployObject(root, key, profileName)
} else throw new Error('Partial blueprint deployment needs mapping reconciliation')
if (!currentEntity) {
  await client.request('/entities', {
    method: 'POST',
    json: {
      id: entityId,
      blueprint: blueprintId,
      position: placement.position,
      quaternion: placement.quaternion,
      scale: placement.scale,
      pinned: true,
    },
  })
}
const verifiedApp = await client.request('/apps/' + blueprintId)
const verifiedEntity = await client.request('/entities/' + entityId)
if (verifiedApp.script !== parsed.blueprint.script || verifiedEntity.blueprint !== blueprintId)
  throw new Error('Live darts source or instance did not match deployment')
for (const asset of parsed.assets) {
  const bytes = (await client.requestBytes('/assets/' + asset.url.slice(8))).bytes
  if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw new Error('Live asset digest mismatch')
}
// Re-read metadata immediately before registering, preserving any concurrent edits.
const latestMap = JSON.parse(await fs.readFile(mapPath))
const latestScene = JSON.parse(await fs.readFile(scenePath))
if (latestMap.blueprints[key] && latestMap.blueprints[key] !== blueprintId)
  throw new Error('Darts mapping changed during deployment')
if (latestMap.entities[instanceKey] && latestMap.entities[instanceKey] !== entityId)
  throw new Error('Darts instance mapping changed during deployment')
latestMap.blueprints[key] = blueprintId
latestMap.entities[instanceKey] = entityId
if (!latestScene.instances.some(i => i.key === instanceKey)) latestScene.instances.push(placement)
await fs.writeFile(mapPath, JSON.stringify(latestMap, null, 2) + '\n')
await fs.writeFile(scenePath, JSON.stringify(latestScene, null, 2) + '\n')
const [afterApps, afterEntities, afterWorld] = await Promise.all([
  client.request('/apps'),
  client.request('/entities'),
  client.request('/world'),
])
const digest = value => JSON.stringify(value)
const sameApps = apps
  .filter(a => a.id !== blueprintId)
  .every(a => digest(afterApps.find(b => b.id === a.id)) === digest(a))
const sameEntities = entities
  .filter(e => e.id !== entityId)
  .every(e => {
    const after = afterEntities.find(b => b.id === e.id)
    // Runtime game/occupancy state is transient, not source.
    return ['blueprint', 'position', 'quaternion', 'scale', 'pinned'].every(k => digest(after?.[k]) === digest(e[k]))
  })
const sameWorld =
  digest(world.settings) === digest(afterWorld.settings) && digest(world.spawn) === digest(afterWorld.spawn)
await fs.writeFile(
  path.join(artifacts, 'deployment.json'),
  JSON.stringify(
    {
      ...plan,
      verified: true,
      script: verifiedApp.script,
      version: verifiedApp.version,
      sourceRegistered: true,
      unrelatedAppsUnchanged: sameApps,
      unrelatedPlacementsUnchanged: sameEntities,
      settingsAndSpawnUnchanged: sameWorld,
    },
    null,
    2
  ) + '\n'
)
if (!sameApps || !sameEntities || !sameWorld)
  throw new Error('Concurrent unrelated world changes observed; inspect deployment report')
console.log('Darts deployed and read back; all live asset hashes verified; unrelated resources unchanged')
