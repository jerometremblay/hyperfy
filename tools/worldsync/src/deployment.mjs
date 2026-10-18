import path from 'node:path'
import dotenvFlow from 'dotenv-flow'
import { compileSingleObject } from './compiler.mjs'
import { assertKey, stableJson } from './canonical.mjs'
import { readBoundedFile } from './paths.mjs'

const BLUEPRINT_FIELDS = ['name', 'desc', 'model', 'script', 'props', 'disabled']
const MAX_SCRIPT_BYTES = 262144

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
    async request(endpoint, { method = 'GET', json } = {}) {
      let response
      try {
        response = await fetch(profile.apiUrl + endpoint, {
          method,
          headers: {
            authorization: 'Bearer ' + profile.token,
            ...(json === undefined ? {} : { 'content-type': 'application/json' }),
          },
          ...(json === undefined ? {} : { body: JSON.stringify(json) }),
          signal: AbortSignal.timeout(30000),
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
  }
}

function findChanges(current, desired) {
  const changes = {}
  for (const field of BLUEPRINT_FIELDS) {
    if (stableJson(current[field]) !== stableJson(desired[field])) {
      changes[field] = desired[field]
    }
  }
  return changes
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
  const mapPath = path.join(root, '.worldsync', 'bootstrap-map.json')
  const bootstrapMap = await readJson(mapPath, '.worldsync/bootstrap-map.json')
  const id = bootstrapMap.blueprints?.[key]
  if (typeof id !== 'string' || !id || id === '$scene') {
    throw new Error('No live blueprint mapping exists for ' + key + ' in .worldsync/bootstrap-map.json')
  }
  const profile = await loadProfile(root, profileName)
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

async function uploadChangedScripts(plan) {
  const references = collectAssetUrls(plan.changes)
  const assets = new Map(plan.compiled.assets.map(asset => [asset.url, asset]))
  const scripts = []
  for (const url of references) {
    const asset = assets.get(url)
    if (!asset) throw new Error('Changed blueprint field references an asset absent from source: ' + url)
    if (!(asset.types || [asset.type]).includes('script') || asset.extension !== 'js') {
      throw new Error('The live Agent API can currently upload changed JavaScript assets only: ' + url)
    }
    if (asset.bytes.byteLength > MAX_SCRIPT_BYTES) {
      throw new Error('Script exceeds the live Agent API upload limit of ' + MAX_SCRIPT_BYTES + ' bytes: ' + asset.source)
    }
    scripts.push({ asset, source: new TextDecoder('utf-8', { fatal: true }).decode(asset.bytes) })
  }
  for (const { asset, source } of scripts) {
    const uploaded = await plan.client.request('/scripts', { method: 'POST', json: { source } })
    if (uploaded.url !== asset.url) {
      throw new Error('Live script asset hash did not match source for ' + asset.source)
    }
  }
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

  await uploadChangedScripts(plan)
  await plan.client.request('/apps/' + encodeURIComponent(plan.id), {
    method: 'PATCH',
    json: { version: plan.current.version, ...plan.changes },
  })
  const verified = await plan.client.request('/apps/' + encodeURIComponent(plan.id))
  const mismatches = fields.filter(field => stableJson(verified[field]) !== stableJson(plan.changes[field]))
  if (mismatches.length || verified.version <= plan.current.version) {
    throw new Error('Live verification failed for ' + plan.key + ': ' + (mismatches.join(', ') || 'version did not advance'))
  }
  return { key: plan.key, version: verified.version, fields, updated: true }
}
