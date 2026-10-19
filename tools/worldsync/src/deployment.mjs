import path from 'node:path'
import fs from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import dotenvFlow from 'dotenv-flow'
import { compileProject, compileSingleObject } from './compiler.mjs'
import { assertKey, stableJson } from './canonical.mjs'
import { ensureSafeDirectory, readBoundedFile, resolveContainedPath } from './paths.mjs'

const BLUEPRINT_FIELDS = [
  'name', 'desc', 'model', 'script', 'props', 'image', 'author', 'url',
  'preload', 'public', 'locked', 'unique', 'frozen', 'disabled',
]

async function readJson(file, label) {
  const bytes = await readBoundedFile(file, { maxBytes: 4 * 1024 * 1024, label })
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch (error) {
    throw new Error(label + ' is invalid JSON: ' + error.message)
  }
}

async function loadProfile(root, profileName) {
  if (!profileName) throw new Error('deployment requires --profile')
  assertKey(profileName, 'profile name')
  const configPath = path.join(root, 'worldsync.config.json')
  const config = await readJson(configPath, 'worldsync.config.json')
  const profile = config.profiles?.[profileName]
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    throw new Error('worldsync profile not found: ' + profileName)
  }
  if (typeof profile.apiUrl !== 'string' || typeof profile.writeTokenEnv !== 'string') {
    throw new Error('worldsync profile ' + profileName + ' requires apiUrl and writeTokenEnv')
  }
  if (!/^[A-Z_][A-Z0-9_]*$/.test(profile.writeTokenEnv)) {
    throw new Error('worldsync profile writeTokenEnv must be an environment variable name')
  }
  let apiUrl
  try {
    apiUrl = new URL(profile.apiUrl)
  } catch {
    throw new Error('worldsync profile apiUrl must be an absolute HTTP URL')
  }
  const localHttp = apiUrl.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(apiUrl.hostname)
  if (
    (apiUrl.protocol !== 'https:' && !localHttp) ||
    apiUrl.username ||
    apiUrl.password ||
    apiUrl.search ||
    apiUrl.hash
  ) {
    throw new Error('worldsync profile apiUrl must use HTTPS (HTTP is allowed only for localhost)')
  }
  if (!process.env[profile.writeTokenEnv]) dotenvFlow.config({ silent: true })
  const token = process.env[profile.writeTokenEnv]
  if (!token) {
    throw new Error('worldsync write token is unavailable in environment variable ' + profile.writeTokenEnv)
  }
  return {
    apiUrl: apiUrl.toString().replace(/\/$/, ''),
    token,
  }
}

function makeClient(profile) {
  return {
    async request(endpoint, { method = 'GET', json, file } = {}) {
      let response
      const headers = { authorization: 'Bearer ' + profile.token }
      let requestBody
      if (json !== undefined) {
        headers['content-type'] = 'application/json'
        requestBody = JSON.stringify(json)
      } else if (file) {
        const form = new FormData()
        const filename = file.sha256 + '.' + file.extension
        form.set('file', new File([file.bytes], filename, { type: file.mime || 'application/octet-stream' }))
        requestBody = form
      }
      try {
        response = await fetch(profile.apiUrl + endpoint, {
          method,
          headers,
          ...(requestBody === undefined ? {} : { body: requestBody }),
          signal: AbortSignal.timeout(file ? 300000 : 30000),
        })
      } catch (error) {
        throw new Error('Agent API request failed: ' + error.message)
      }
      const text = await response.text()
      let data = null
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          throw new Error('Agent API returned an invalid JSON response')
        }
      }
      if (!response.ok) {
        throw new Error(`Agent API request failed (${response.status}): ${data?.error || response.statusText}`)
      }
      return data
    },
    async uploadAsset(asset) {
      const uploaded = await this.request('/assets', { method: 'POST', file: asset })
      if (uploaded.url !== asset.url) throw new Error('Live asset hash did not match source for ' + asset.source)
    },
  }
}

function destinationMapPath(root, profileName) {
  if (!profileName || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profileName)) {
    throw new Error('profile name must use lowercase letters, numbers, and hyphens')
  }
  return resolveContainedPath(
    root,
    root,
    '.worldsync/destinations/' + profileName + '.json',
    'destination map path'
  )
}

async function readOptionalJson(file, label) {
  try {
    return await readJson(file, label)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

async function readMapJson(root, file, label) {
  const relativeDirectory = path.relative(path.resolve(root), path.dirname(file))
  let current = path.resolve(root)
  for (const segment of relativeDirectory ? relativeDirectory.split(path.sep) : []) {
    current = path.join(current, segment)
    let stat
    try {
      stat = await fs.lstat(current)
    } catch (error) {
      if (error.code === 'ENOENT') return null
      throw error
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(label + ' parent path contains a non-directory or symbolic link')
    }
  }
  return readOptionalJson(file, label)
}

async function loadBlueprintMap(root, profileName, apiUrl) {
  const destinationPath = destinationMapPath(root, profileName)
  const destinationMap = await readMapJson(root, destinationPath, path.relative(root, destinationPath))
  if (destinationMap) {
    if (destinationMap.schemaVersion !== 1 || destinationMap.profile !== profileName) {
      throw new Error('Destination map is invalid: ' + path.relative(root, destinationPath))
    }
    if (destinationMap.apiUrl !== apiUrl) {
      throw new Error('worldsync profile URL changed; use a new profile or remove its destination map')
    }
    return destinationMap
  }
  const legacyPath = path.join(root, '.worldsync', 'bootstrap-map.json')
  return (await readMapJson(root, legacyPath, '.worldsync/bootstrap-map.json')) || null
}

async function loadDestinationMap(root, profileName, apiUrl, sceneKey) {
  const mapPath = destinationMapPath(root, profileName)
  const map = await readMapJson(root, mapPath, path.relative(root, mapPath))
  if (!map) return null
  if (
    map.schemaVersion !== 1 ||
    map.profile !== profileName ||
    !map.blueprints || typeof map.blueprints !== 'object' || Array.isArray(map.blueprints) ||
    !map.entities || typeof map.entities !== 'object' || Array.isArray(map.entities) ||
    !Object.values(map.blueprints).every(id => typeof id === 'string' && id) ||
    !Object.values(map.entities).every(id => typeof id === 'string' && id)
  ) {
    throw new Error('Destination map is invalid: ' + path.relative(root, mapPath))
  }
  const appIds = Object.values(map.blueprints).filter(id => id !== '$scene')
  if (new Set(appIds).size !== appIds.length || new Set(Object.values(map.entities)).size !== Object.values(map.entities).length) {
    throw new Error('Destination map contains duplicate live IDs')
  }
  if (map.apiUrl !== apiUrl) {
    throw new Error('worldsync profile URL changed; use a new profile or remove its destination map')
  }
  if (map.sceneKey !== sceneKey) {
    throw new Error('Destination profile is already mapped to scene ' + map.sceneKey + '; use a separate profile for another scene')
  }
  return map
}

function findChanges(current, desired) {
  const changes = {}
  for (const field of BLUEPRINT_FIELDS) {
    if (!sameBlueprintField(field, current[field], desired[field])) {
      changes[field] = desired[field]
    }
  }
  return changes
}

function sameBlueprintField(field, left, right) {
  // Older worlds serialize unset optional strings as empty strings.
  const normalize = value => {
    if (['desc', 'author', 'url'].includes(field) && (value == null || value === '')) return null
    return value
  }
  return stableJson(normalize(left)) === stableJson(normalize(right))
}

function collectAssetUrls(value, result = new Set()) {
  if (typeof value === 'string' && value.startsWith('asset://')) result.add(value)
  else if (Array.isArray(value)) value.forEach(item => collectAssetUrls(item, result))
  else if (value && typeof value === 'object') {
    Object.values(value).forEach(item => collectAssetUrls(item, result))
  }
  return result
}

async function loadPlan(root, objectKey, profileName) {
  const key = assertKey(objectKey, 'object key')
  const compiled = await compileSingleObject(root, key)
  if (compiled.role === 'environment' || compiled.blueprint.scene) {
    throw new Error('The live Agent API does not allow deploying the protected scene blueprint')
  }
  const profile = await loadProfile(root, profileName)
  const bootstrapMap = await loadBlueprintMap(root, profileName, profile.apiUrl)
  if (!bootstrapMap) {
    throw new Error('No live blueprint mapping exists for profile ' + profileName)
  }
  const id = bootstrapMap.blueprints?.[key]
  if (typeof id !== 'string' || !id || id === '$scene') {
    throw new Error('No live blueprint mapping exists for ' + key + ' in profile ' + profileName)
  }
  const client = makeClient(profile)
  const current = await client.request('/apps/' + encodeURIComponent(id))
  if (current.id !== id || current.scene) {
    throw new Error('The mapped live blueprint is not a deployable app')
  }
  if (!Number.isInteger(current.version) || current.version < 0) {
    throw new Error('The mapped live blueprint has no valid version for conflict checking')
  }
  const changes = findChanges(current, compiled.blueprint)
  return { key, id, compiled, current, changes, client }
}

async function uploadChangedAssets(plan) {
  const references = collectAssetUrls(plan.changes)
  const assets = new Map(plan.compiled.assets.map(asset => [asset.url, asset]))
  const uploads = []
  for (const url of references) {
    const asset = assets.get(url)
    if (!asset) throw new Error('Changed blueprint field references an asset absent from source: ' + url)
    uploads.push(asset)
  }
  for (const asset of uploads) await plan.client.uploadAsset(asset)
}

export async function diffObjectDeployment(root, objectKey, profileName) {
  const plan = await loadPlan(root, objectKey, profileName)
  return {
    key: plan.key,
    version: plan.current.version,
    fields: Object.keys(plan.changes),
  }
}

export async function deployObject(root, objectKey, profileName) {
  const plan = await loadPlan(root, objectKey, profileName)
  const fields = Object.keys(plan.changes)
  if (!fields.length) return { key: plan.key, version: plan.current.version, fields, updated: false }

  await uploadChangedAssets(plan)
  await plan.client.request('/apps/' + encodeURIComponent(plan.id), {
    method: 'PATCH',
    json: { version: plan.current.version, ...plan.changes },
  })
  const verified = await plan.client.request('/apps/' + encodeURIComponent(plan.id))
  const mismatches = fields.filter(field => !sameBlueprintField(field, verified[field], plan.changes[field]))
  if (mismatches.length || verified.version <= plan.current.version) {
    throw new Error('Live verification failed for ' + plan.key + ': ' + (mismatches.join(', ') || 'version did not advance'))
  }
  return { key: plan.key, version: verified.version, fields, updated: true }
}

function stableId(profileName, sceneKey, type, key) {
  const bytes = createHash('sha256')
    .update(['worldsync-v1', profileName, sceneKey, type, key].join('\0'))
    .digest()
    .subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

async function writeDestinationMap(root, profileName, map) {
  const mapPath = destinationMapPath(root, profileName)
  await ensureSafeDirectory(root, path.dirname(mapPath), 'destination map directory')
  try {
    const stat = await fs.lstat(mapPath)
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error('destination map must be a regular file')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const temporaryPath = mapPath + '.tmp-' + randomUUID()
  try {
    await fs.writeFile(temporaryPath, JSON.stringify(map, null, 2) + '\n', { flag: 'wx' })
    await fs.rename(temporaryPath, mapPath)
  } finally {
    await fs.rm(temporaryPath, { force: true })
  }
}

function sameFields(current, desired, fields) {
  return fields.every(field => sameBlueprintField(field, current[field], desired[field]))
}

async function verifyBlueprint(client, id, desired) {
  const current = await client.request('/apps/' + encodeURIComponent(id))
  if (current.id !== id || !!current.scene !== !!desired.scene || !sameFields(current, desired, BLUEPRINT_FIELDS)) {
    throw new Error('Live blueprint verification failed for ' + (desired.name || id))
  }
  return current
}

async function reconcileBlueprint(client, id, desired, current) {
  if (!current) {
    await client.request('/apps', { method: 'POST', json: { id, ...desired } })
    return verifyBlueprint(client, id, desired)
  }
  if (current.id !== id || (id !== '$scene' && current.scene)) {
    throw new Error('Mapped live blueprint is not the expected blueprint: ' + id)
  }
  const changes = findChanges(current, desired)
  if (id === '$scene') {
    if (current.scene !== true) throw new Error('Protected scene blueprint is invalid')
    if (Object.keys(changes).length) {
      const version = Number.isInteger(current.version) && current.version >= 0 ? current.version : 0
      await client.request('/world/scene', {
        method: 'PATCH',
        json: { version, ...changes },
      })
    }
  } else if (Object.keys(changes).length) {
    await client.request('/apps/' + encodeURIComponent(id), {
      method: 'PATCH',
      json: { version: current.version, ...changes },
    })
  }
  return verifyBlueprint(client, id, desired)
}

async function reconcileEntity(client, id, desired, current) {
  if (!current) {
    await client.request('/entities', { method: 'POST', json: { id, ...desired } })
  } else {
    if (current.id !== id) throw new Error('Mapped live instance id changed: ' + id)
    const changes = {}
    for (const field of ['blueprint', 'position', 'quaternion', 'scale', 'pinned']) {
      if (stableJson(current[field]) !== stableJson(desired[field])) changes[field] = desired[field]
    }
    if (Object.keys(changes).length) {
      await client.request('/entities/' + encodeURIComponent(id), { method: 'PATCH', json: changes })
    }
  }
  const verified = await client.request('/entities/' + encodeURIComponent(id))
  if (
    verified.id !== id ||
    !['blueprint', 'position', 'quaternion', 'scale', 'pinned'].every(
      field => stableJson(verified[field]) === stableJson(desired[field])
    )
  ) {
    throw new Error('Live instance verification failed for ' + id)
  }
}

export async function bootstrapWorld(root, sceneKey, profileName, { allowExternal = false, dryRun = false } = {}) {
  const compiled = await compileProject(root, assertKey(sceneKey, 'scene key'))
  const externalWarnings = compiled.warnings.filter(warning => warning.code === 'external-asset')
  if (externalWarnings.length && !allowExternal) {
    throw new Error(
      'Source contains ' + externalWarnings.length + ' external asset reference(s); rerun with --allow-external to keep them'
    )
  }
  const profile = await loadProfile(root, profileName)
  const client = makeClient(profile)
  const existingMap = await loadDestinationMap(root, profileName, profile.apiUrl, compiled.scene.sceneKey)
  const map = existingMap
    ? { ...existingMap, blueprints: { ...existingMap.blueprints }, entities: { ...existingMap.entities } }
    : { schemaVersion: 1, profile: profileName, apiUrl: profile.apiUrl, sceneKey: compiled.scene.sceneKey, blueprints: {}, entities: {} }

  const desiredBlueprints = new Map()
  for (const object of compiled.objects) {
    if (object.role === 'environment') continue
    const id = map.blueprints[object.key] || stableId(profileName, compiled.scene.sceneKey, 'blueprint', object.key)
    if (id === '$scene' || typeof id !== 'string' || !id) {
      throw new Error('Invalid blueprint mapping for ' + object.key)
    }
    map.blueprints[object.key] = id
    desiredBlueprints.set(object.key, { id, blueprint: object.blueprint })
  }
  let desiredEnvironment = null
  if (compiled.scene.environment) {
    const object = compiled.objects.find(item => item.key === compiled.scene.environment)
    if (!object || object.role !== 'environment') throw new Error('Active scene environment is missing')
    const mapped = map.blueprints[object.key]
    if (mapped && mapped !== '$scene') throw new Error('Environment mapping must use the protected $scene blueprint')
    map.blueprints[object.key] = '$scene'
    desiredEnvironment = { id: '$scene', blueprint: object.blueprint }
  }

  const placementCounts = new Map()
  for (const instance of compiled.scene.instances) {
    placementCounts.set(instance.object, (placementCounts.get(instance.object) || 0) + 1)
  }
  for (const object of compiled.objects) {
    if (object.role !== 'environment' && object.blueprint.unique && placementCounts.get(object.key) > 1) {
      throw new Error(
        'Source scene places unique blueprint ' + object.key + ' more than once; split each unique placement into its own source object'
      )
    }
  }

  for (const instance of compiled.scene.instances) {
    const id = map.entities[instance.key] || stableId(profileName, compiled.scene.sceneKey, 'instance', instance.key)
    if (typeof id !== 'string' || !id) throw new Error('Invalid instance mapping for ' + instance.key)
    map.entities[instance.key] = id
  }

  const [world, apps, entities] = await Promise.all([
    client.request('/world'),
    client.request('/apps'),
    client.request('/entities'),
  ])
  const appsById = new Map(apps.map(app => [app.id, app]))
  const entitiesById = new Map(entities.map(entity => [entity.id, entity]))
  if (!appsById.get('$scene')?.scene) {
    throw new Error('Destination world is missing its protected $scene blueprint')
  }

  const mappedEntityIds = new Set(Object.values(map.entities))
  for (const entity of entities) {
    if (entity.blueprint === '$scene') continue
    if (!existingMap || !mappedEntityIds.has(entity.id)) {
      throw new Error('Destination contains an unmapped app instance (' + entity.id + '); bootstrap requires a new or previously mapped world')
    }
  }

  const planned = {
    sceneKey: compiled.scene.sceneKey,
    profile: profileName,
    assets: compiled.assets.length,
    createBlueprints: 0,
    updateBlueprints: 0,
    createInstances: 0,
    updateInstances: 0,
    updateSettings: 0,
    updateSpawn: false,
    warnings: externalWarnings.length,
  }
  for (const desired of desiredBlueprints.values()) {
    const current = appsById.get(desired.id)
    if (!current) planned.createBlueprints++
    else if (Object.keys(findChanges(current, desired.blueprint)).length) planned.updateBlueprints++
  }
  if (desiredEnvironment) {
    const current = appsById.get('$scene')
    if (Object.keys(findChanges(current, desiredEnvironment.blueprint)).length) planned.updateBlueprints++
  }
  const settings = { ...compiled.settings }
  if (!Object.hasOwn(settings, 'title') && compiled.scene.title !== undefined) settings.title = compiled.scene.title
  const desiredSpawn = settings.spawn
  delete settings.spawn
  planned.updateSettings = Object.keys(settings).filter(key => stableJson(world.settings?.[key]) !== stableJson(settings[key])).length
  planned.updateSpawn = !!desiredSpawn && stableJson(world.spawn) !== stableJson(desiredSpawn)
  for (const instance of compiled.scene.instances) {
    const current = entitiesById.get(map.entities[instance.key])
    const desired = {
      blueprint: map.blueprints[instance.object],
      position: instance.position,
      quaternion: instance.quaternion,
      scale: instance.scale,
      pinned: instance.pinned,
    }
    if (!current) planned.createInstances++
    else if (!['blueprint', 'position', 'quaternion', 'scale', 'pinned'].every(
      field => stableJson(current[field]) === stableJson(desired[field])
    )) planned.updateInstances++
  }

  if (dryRun) return planned
  await writeDestinationMap(root, profileName, map)
  for (const asset of compiled.assets) await client.uploadAsset(asset)

  for (const desired of desiredBlueprints.values()) {
    await reconcileBlueprint(client, desired.id, desired.blueprint, appsById.get(desired.id))
  }
  if (desiredEnvironment) {
    await reconcileBlueprint(client, '$scene', desiredEnvironment.blueprint, appsById.get('$scene'))
  }

  const settingsChanges = Object.fromEntries(
    Object.entries(settings).filter(([key, value]) => stableJson(world.settings?.[key]) !== stableJson(value))
  )
  const spawnChanged = !!desiredSpawn && stableJson(world.spawn) !== stableJson(desiredSpawn)
  if (Object.keys(settingsChanges).length || spawnChanged) {
    await client.request('/world', {
      method: 'PATCH',
      json: {
        ...(Object.keys(settingsChanges).length ? { settings: settingsChanges } : {}),
        ...(spawnChanged ? { spawn: desiredSpawn } : {}),
      },
    })
    const verified = await client.request('/world')
    const mismatches = Object.keys(settingsChanges).filter(
      key => stableJson(verified.settings?.[key]) !== stableJson(settingsChanges[key])
    )
    if (mismatches.length || (spawnChanged && stableJson(verified.spawn) !== stableJson(desiredSpawn))) {
      throw new Error('Live world settings verification failed: ' + (mismatches.join(', ') || 'spawn'))
    }
  }

  for (const instance of compiled.scene.instances) {
    const id = map.entities[instance.key]
    const desired = {
      blueprint: map.blueprints[instance.object],
      position: instance.position,
      quaternion: instance.quaternion,
      scale: instance.scale,
      pinned: instance.pinned,
    }
    await reconcileEntity(client, id, desired, entitiesById.get(id))
  }
  return planned
}
