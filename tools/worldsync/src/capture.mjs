import fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { compileProject, compileSingleObject, fingerprintCompiled, fingerprintSource } from './compiler.mjs'
import { assertKey, sha256, stableJson, validateTransform } from './canonical.mjs'
import { discoverObjects } from './object-source.mjs'
import { loadScene, validateSettings } from './scene-source.mjs'
import { packHyp } from './hyp-format.mjs'
import { importHyp } from './importer.mjs'
import { loadProfile, makeClient } from './deployment.mjs'
import { ensureSafeDirectory, readBoundedFile, resolveContainedPath } from './paths.mjs'
import { MIME } from './asset-resolver.mjs'

const SETTINGS_FIELDS = new Set([
  'title', 'desc', 'image', 'avatar', 'dayNightCycle', 'constellationLines', 'skyAppearance',
  'bortleClass', 'latitude', 'longitude', 'timeZone',
])
const ASSET_TYPES = new Set(['model', 'avatar', 'script', 'texture', 'audio', 'video', 'image', 'hdr', 'emote', 'splat', 'other'])
const ASSET_URL = /^asset:\/\/([a-f0-9]{64})\.([a-z0-9]+)$/
const MAX_POSE_FILE_SIZE = 32 * 1024 * 1024
const BLUEPRINT_DEFAULTS = {
  image: null,
  author: null,
  url: null,
  desc: '',
  model: null,
  script: null,
  props: {},
  preload: false,
  public: false,
  locked: false,
  unique: false,
  frozen: false,
  disabled: false,
}

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function objectValue(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function equal(left, right) {
  return stableJson(left) === stableJson(right)
}

function contentKey(type, id) {
  return type + '-' + sha256(type + '\0' + id).slice(0, 16)
}

function allocateKey(base, occupied) {
  let key = base
  let suffix = 2
  while (occupied.has(key)) key = base + '-' + suffix++
  occupied.add(key)
  return key
}

function inverseMapping(mapping, label) {
  const result = new Map()
  for (const [key, id] of Object.entries(mapping || {})) {
    assertKey(key, label + ' logical key')
    if (typeof id !== 'string' || !id) throw new Error(label + ' contains an invalid runtime ID')
    const previous = result.get(id)
    if (previous && previous !== key) throw new Error(label + ' maps one runtime ID to more than one logical key')
    result.set(id, key)
  }
  return result
}

function validateSnapshot(snapshot) {
  if (
    !objectValue(snapshot) || snapshot.schemaVersion !== 1 || !objectValue(snapshot.world) ||
    !objectValue(snapshot.world.settings) || !Array.isArray(snapshot.blueprints) ||
    !Array.isArray(snapshot.entities) || !/^[a-f0-9]{64}$/.test(snapshot.revision)
  ) {
    throw new Error('Agent API returned an invalid world snapshot')
  }
  const { revision, ...payload } = snapshot
  if (sha256(JSON.stringify(payload)) !== revision) {
    throw new Error('Agent API snapshot revision does not match its contents')
  }
  if (snapshot.seatPoseData !== undefined && !objectValue(snapshot.seatPoseData.entries)) {
    throw new Error('Agent API returned invalid seat-pose data')
  }
  return snapshot
}

async function readOptionalJson(root, relative, label, maxBytes = 4 * 1024 * 1024) {
  const file = resolveContainedPath(root, root, relative, label)
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
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(label + ' parent path is not a real directory')
  }
  try {
    return JSON.parse((await readBoundedFile(file, { maxBytes, label })).toString('utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return null
    if (error instanceof SyntaxError) throw new Error(label + ' is invalid JSON: ' + error.message)
    throw error
  }
}

function validateResourceMap(map, { profile, apiUrl, sceneKey, label }) {
  if (!map) return null
  if (
    map.schemaVersion !== 1 || map.profile !== profile || map.apiUrl !== apiUrl || map.sceneKey !== sceneKey ||
    !objectValue(map.blueprints) || !objectValue(map.entities) ||
    !Object.values(map.blueprints).every(id => typeof id === 'string' && id) ||
    !Object.values(map.entities).every(id => typeof id === 'string' && id)
  ) {
    throw new Error(label + ' is invalid or belongs to a different profile, URL, or scene')
  }
  inverseMapping(map.blueprints, label + ' blueprints')
  inverseMapping(map.entities, label + ' entities')
  return map
}

async function loadMappings(root, profile, apiUrl, sceneKey, bootstrap) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profile)) {
    throw new Error('profile name must use lowercase letters, numbers, and hyphens')
  }
  const captureRelative = '.worldsync/captures/' + profile + '.json'
  const destinationRelative = '.worldsync/destinations/' + profile + '.json'
  const capture = validateResourceMap(
    await readOptionalJson(root, captureRelative, captureRelative),
    { profile, apiUrl, sceneKey, label: captureRelative }
  )
  const destination = validateResourceMap(
    await readOptionalJson(root, destinationRelative, destinationRelative),
    { profile, apiUrl, sceneKey, label: destinationRelative }
  )
  const legacy = bootstrap || (!capture && !destination)
    ? await readOptionalJson(root, '.worldsync/bootstrap-map.json', '.worldsync/bootstrap-map.json')
    : null
  if (bootstrap && (capture || destination || legacy)) {
    throw new Error('--bootstrap requires a profile with no existing worldsync map')
  }
  if (legacy && !capture && !destination) {
    throw new Error('Legacy bootstrap map exists; migrate it to a profile-specific map before capture')
  }
  const seed = capture || destination
  const map = seed
    ? jsonClone(seed)
    : { schemaVersion: 1, profile, apiUrl, sceneKey, blueprints: {}, entities: {}, baseline: {} }
  map.blueprints ||= {}
  map.entities ||= {}
  map.baseline ||= {}
  if (!objectValue(map.baseline)) throw new Error(captureRelative + ' baseline must be an object')
  return { map, captureRelative, hadCapture: !!capture, bootstrapped: bootstrap }
}

async function loadSourceScene(root, sceneKey) {
  const manifest = resolveContainedPath(root, root, path.posix.join('scenes', ...sceneKey.split('/'), 'scene.json'), 'scene manifest')
  try {
    await fs.lstat(manifest)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
  return loadScene(root, sceneKey)
}

function portableSettings(snapshot) {
  const result = {}
  for (const [key, value] of Object.entries(snapshot.world.settings)) {
    if (SETTINGS_FIELDS.has(key)) result[key] = jsonClone(value)
  }
  if (snapshot.world.spawn) result.spawn = jsonClone(snapshot.world.spawn)
  validateSettings(result, 'live world')
  return result
}

function collectBlueprintAssetTypes(blueprint) {
  const refs = new Map()
  const add = (url, type, label) => {
    if (typeof url !== 'string' || !url.startsWith('asset://')) return
    if (!/^[a-z0-9_-]+\.[a-z0-9]+$/.test(url.slice('asset://'.length)) && !ASSET_URL.test(url)) {
      throw new Error(label + ' contains an invalid asset URL')
    }
    if (!ASSET_TYPES.has(type)) throw new Error(label + ' uses unsupported asset type ' + type)
    const types = refs.get(url) || new Set()
    types.add(type)
    refs.set(url, types)
  }
  if (blueprint.model && blueprint.model !== 'script-only') {
    add(blueprint.model, blueprint.model.toLowerCase().endsWith('.vrm') ? 'avatar' : 'model', 'blueprint.model')
  }
  add(blueprint.script, 'script', 'blueprint.script')
  add(blueprint.image?.url, 'texture', 'blueprint.image.url')
  const visit = (value, pointer) => {
    if (typeof value === 'string') {
      if (value.startsWith('asset://')) add(value, 'other', pointer)
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, pointer + '/' + index))
      return
    }
    if (!objectValue(value)) return
    if (typeof value.url === 'string' && value.url.startsWith('asset://')) {
      const type = value.type
      if (!ASSET_TYPES.has(type)) throw new Error(pointer + '/url has no supported asset type')
      add(value.url, type, pointer + '/url')
    }
    for (const [key, item] of Object.entries(value)) {
      if (key !== 'url') visit(item, pointer + '/' + key)
    }
  }
  visit(blueprint.props, 'blueprint.props')
  return refs
}

function assetMime(extension) {
  return MIME[extension] || 'application/octet-stream'
}

async function readAsset(client, url, cache) {
  if (cache.has(url)) return cache.get(url)
  const filename = url.slice('asset://'.length)
  const match = ASSET_URL.exec(url)
  if (!match && !/^[a-z0-9_-]+\.[a-z0-9]+$/.test(filename)) {
    throw new Error('Invalid asset URL: ' + url)
  }
  const { bytes } = await client.requestBytes('/assets/' + filename)
  if (!bytes.length) throw new Error('Live asset is empty: ' + url)
  const digest = sha256(bytes)
  if (match && digest !== match[1]) throw new Error('Live asset hash does not match its URL: ' + url)
  const extension = path.extname(filename).slice(1).toLowerCase()
  const result = {
    url: 'asset://' + digest + '.' + extension,
    sha256: digest,
    extension,
    bytes,
    mime: assetMime(extension),
  }
  cache.set(url, result)
  cache.set(result.url, result)
  return result
}

function replaceAssetUrls(value, replacements) {
  if (Array.isArray(value)) return value.map(item => replaceAssetUrls(item, replacements))
  if (typeof value === 'string') return replacements.get(value) || value
  if (!objectValue(value)) return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceAssetUrls(item, replacements)]))
}

async function packageBlueprint(client, liveBlueprint, assetCache) {
  const blueprint = { ...BLUEPRINT_DEFAULTS, ...jsonClone(liveBlueprint) }
  delete blueprint.id
  delete blueprint.version
  if (blueprint.scene === false) delete blueprint.scene
  const refs = collectBlueprintAssetTypes(blueprint)
  const assetsByUrl = new Map()
  const replacements = new Map()
  const pending = [...refs.keys()]
  const processed = new Set()
  while (pending.length) {
    const url = pending.shift()
    if (processed.has(url)) continue
    processed.add(url)
    const types = refs.get(url) || new Set(['other'])
    const record = await readAsset(client, url, assetCache)
    replacements.set(url, record.url)
    const assetTypes = assetsByUrl.get(record.url)?.types || new Set()
    for (const type of types) assetTypes.add(type)
    assetsByUrl.set(record.url, { ...record, types: assetTypes })
    if (types.has('script')) {
      const source = Buffer.from(record.bytes).toString('utf8')
      const pattern = /asset:\/\/(?:[a-f0-9]{64}\.[a-z0-9]+|[A-Za-z0-9_-]+\.[A-Za-z0-9]+)/g
      for (const match of source.matchAll(pattern)) {
        if (!refs.has(match[0])) refs.set(match[0], new Set(['other']))
        if (!processed.has(match[0])) pending.push(match[0])
      }
    }
  }
  const assets = [...assetsByUrl.values()].map(record => {
    const types = [...record.types].sort()
    return { ...record, type: types[0], types }
  })
  const normalizedBlueprint = replaceAssetUrls(blueprint, replacements)
  const hyp = packHyp(normalizedBlueprint, assets)
  return { blueprint: normalizedBlueprint, assets, hyp, semantic: fingerprintCompiled(normalizedBlueprint, assets) }
}

function createHypObjectFiles(key, packaged, role) {
  const manifest = {
    schemaVersion: 1,
    key,
    mode: 'hyp',
    ...(role ? { role } : {}),
    source: './original.hyp',
  }
  const manifestBytes = Buffer.from(stableJson(manifest))
  const relativeHyp = path.posix.join('objects', ...key.split('/'), 'original.hyp')
  const sourceFingerprint = fingerprintSource(manifestBytes, [{ source: relativeHyp, bytes: packaged.hyp }])
  return {
    manifest,
    mode: 'hyp',
    semantic: packaged.semantic,
    sourceFingerprint,
    files: new Map([
      [path.posix.join('objects', ...key.split('/'), 'object.json'), manifestBytes],
      [relativeHyp, packaged.hyp],
    ]),
  }
}

async function readObjectTree(root, directory, relative = '') {
  const files = new Map()
  const entries = await fs.readdir(path.join(directory, relative), { withFileTypes: true })
  entries.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0))
  for (const entry of entries) {
    const child = path.posix.join(relative, entry.name)
    const absolute = path.join(directory, ...child.split('/'))
    if (entry.isSymbolicLink()) throw new Error('Extracted capture source contains a symbolic link')
    if (entry.isDirectory()) {
      for (const [file, bytes] of await readObjectTree(root, directory, child)) files.set(file, bytes)
    } else if (entry.isFile()) {
      const objectRelative = path.relative(root, absolute).split(path.sep).join('/')
      files.set(objectRelative, await fs.readFile(absolute))
    } else {
      throw new Error('Extracted capture source contains a special file')
    }
  }
  return files
}

async function createObjectFiles(key, packaged, role) {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'worldsync-capture-'))
  const inputPath = path.join(temporaryRoot, 'capture.hyp')
  try {
    await fs.writeFile(inputPath, packaged.hyp, { flag: 'wx' })
    try {
      await importHyp(temporaryRoot, inputPath, key, { extract: true })
    } catch (error) {
      const fallback = createHypObjectFiles(key, packaged, role)
      fallback.fallbackReason = error.message
      return fallback
    }
    const compiled = await compileSingleObject(temporaryRoot, key)
    if (compiled.semanticFingerprint !== packaged.semantic) {
      const fallback = createHypObjectFiles(key, packaged, role)
      fallback.fallbackReason = 'editable extraction did not preserve the compiled blueprint and assets'
      return fallback
    }
    const source = (await discoverObjects(temporaryRoot)).find(item => item.manifest.key === key)
    const objectFiles = await readObjectTree(temporaryRoot, source.objectDir)
    return {
      manifest: source.manifest,
      semantic: compiled.semanticFingerprint,
      sourceFingerprint: compiled.sourceFingerprint,
      mode: 'files',
      files: objectFiles,
    }
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true })
  }
}

function mergeValue({ key, label, base, liveBase = base, local, live, localToken, baseToken, conflicts, resolve }) {
  const hasBase = base !== undefined
  if (live === null || live === undefined) return local
  if (local === null || local === undefined) return live
  if (equal(local, live)) return local
  if (!hasBase) {
    conflicts.push({ key, resource: label, reason: 'source and live values differ without a capture baseline' })
    return resolve === 'live' ? live : local
  }
  const localChanged = localToken !== undefined && baseToken !== undefined
    ? localToken !== baseToken
    : !equal(local, base)
  const liveChanged = !equal(live, liveBase)
  if (localChanged && liveChanged) {
    conflicts.push({ key, resource: label, reason: 'source and live values both changed from the last capture' })
    return resolve === 'live' ? live : local
  }
  return liveChanged ? live : local
}

function parseCaptureRecords(snapshot) {
  const entries = snapshot.seatPoseData?.entries || {}
  const records = []
  const unresolvedAnchors = new Set()
  const entityToInstance = inverseMapping(snapshot.captureEntityMap, 'capture entity map')
  for (const [storageKey, value] of Object.entries(entries).sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))) {
    const parts = storageKey.split(':')
    const kind = parts[0]
    if (!['seatPose', 'seatPoseProfile', 'seatPoseStyles'].includes(kind)) continue
    let record = { storageKey, kind, value: jsonClone(value) }
    try {
      if (kind === 'seatPose') {
        const [, encodedUser, encodedAvatar, ...encodedAnchor] = parts
        const userId = decodeURIComponent(encodedUser)
        const avatarUrl = decodeURIComponent(encodedAvatar)
        const anchorId = decodeURIComponent(encodedAnchor.join(':'))
        record = { ...record, sourceUserId: userId, avatarUrl, sourceAnchorId: anchorId }
        const colon = anchorId.indexOf(':')
        const runtimeId = colon < 0 ? '' : anchorId.slice(0, colon)
        const localName = colon < 0 ? '' : anchorId.slice(colon + 1)
        const instanceKey = entityToInstance.get(runtimeId)
        if (instanceKey) record.anchor = { instanceKey, localName }
        else unresolvedAnchors.add(anchorId)
      } else if (kind === 'seatPoseProfile') {
        const [, encodedUser, encodedAvatar, ...encodedProfile] = parts
        record = {
          ...record,
          sourceUserId: decodeURIComponent(encodedUser),
          avatarUrl: decodeURIComponent(encodedAvatar),
          profileId: decodeURIComponent(encodedProfile.join(':')),
        }
      } else {
        const [, ...encodedUser] = parts
        record = { ...record, sourceUserId: decodeURIComponent(encodedUser.join(':')) }
      }
    } catch {
      throw new Error('Agent API returned a malformed seat-pose storage key')
    }
    records.push(record)
  }
  return {
    data: { schemaVersion: 1, records },
    entries,
    unresolvedAnchors: [...unresolvedAnchors].sort(),
  }
}

async function loadExistingPoses(root, sceneKey) {
  const relative = path.posix.join('scenes', ...sceneKey.split('/'), 'seat-poses.json')
  const value = await readOptionalJson(root, relative, relative, MAX_POSE_FILE_SIZE)
  if (!value) return { relative, value: null, entries: {} }
  if (value.schemaVersion !== 1 || !Array.isArray(value.records)) {
    throw new Error(relative + ' is invalid')
  }
  const entries = {}
  for (const record of value.records) {
    if (
      !objectValue(record) ||
      typeof record.storageKey !== 'string' ||
      !['seatPose:', 'seatPoseProfile:', 'seatPoseStyles:'].some(prefix => record.storageKey.startsWith(prefix))
    ) {
      throw new Error(relative + ' contains an invalid record')
    }
    if (Object.hasOwn(entries, record.storageKey)) throw new Error(relative + ' contains a duplicate storage key')
    entries[record.storageKey] = record.value
  }
  return { relative, value, entries }
}

function sourceSettingValue(compiled, sourceScene) {
  if (!compiled) return null
  const settings = jsonClone(compiled.settings)
  if (!Object.hasOwn(settings, 'title') && sourceScene?.scene.title !== undefined) settings.title = sourceScene.scene.title
  return settings
}

async function settingsSourceFiles(root, sceneKey, settings, client, assetCache, settingsFile) {
  const output = jsonClone(settings)
  const dir = path.posix.join('scenes', ...sceneKey.split('/'))
  const files = new Map()
  for (const field of ['image', 'avatar']) {
    const descriptor = output[field]
    if (!descriptor?.url?.startsWith('asset://')) continue
    const asset = await readAsset(client, descriptor.url, assetCache)
    const filename = asset.sha256 + '.' + asset.extension
    const assetPath = path.posix.join(dir, 'assets', filename)
    descriptor.url = 'file:./assets/' + filename
    files.set(assetPath, asset.bytes)
  }
  validateSettings(output, sceneKey)
  files.set(path.posix.join(dir, settingsFile), Buffer.from(stableJson({ schemaVersion: 1, ...output })))
  return files
}

function dirtyRepositoryPaths(root) {
  const result = spawnSync('git', ['-C', root, 'status', '--porcelain=v1', '-z', '--untracked-files=all'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.error) throw new Error('Could not inspect source repository changes')
  if (result.status !== 0) {
    if ((result.stderr || '').includes('not a git repository')) return null
    throw new Error('Could not inspect source repository changes')
  }
  const top = spawnSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  if (top.error || top.status !== 0) throw new Error('Could not inspect source repository changes')
  const rootPrefix = path.relative(path.resolve(top.stdout.trim()), path.resolve(root)).split(path.sep).join('/')
  if (rootPrefix.startsWith('../') || rootPrefix === '..') {
    throw new Error('Capture root is outside its Git repository')
  }
  const records = result.stdout.split('\0')
  const paths = []
  for (let index = 0; index < records.length; index++) {
    const record = records[index]
    if (!record) continue
    const status = record.slice(0, 2)
    paths.push(record.slice(3).replaceAll('\\', '/'))
    if (status.includes('R') || status.includes('C')) {
      if (records[index + 1]) paths.push(records[++index].replaceAll('\\', '/'))
    }
  }
  return { rootPrefix, paths }
}

function checkDirtyTargets(root, files) {
  const repository = dirtyRepositoryPaths(root)
  if (!repository) return
  const targets = [...files.keys()]
  const ignored = targets.filter(target => {
    const result = spawnSync('git', ['-C', root, 'check-ignore', '--quiet', '--', target], {
      encoding: 'utf8',
      stdio: ['ignore', 'ignore', 'ignore'],
    })
    if (result.error || ![0, 1].includes(result.status)) {
      throw new Error('Could not check whether capture outputs are ignored by Git')
    }
    return result.status === 0
  })
  const conflicts = targets.filter(target =>
    ignored.includes(target) ||
    repository.paths.some(item => {
      const repositoryTarget = path.posix.join(repository.rootPrefix, target)
      return item === repositoryTarget || item.startsWith(repositoryTarget + '/') || repositoryTarget.startsWith(item + '/')
    })
  )
  if (conflicts.length) {
    throw new Error('Capture would overwrite dirty source files: ' + conflicts.sort().join(', '))
  }
}

async function writeFiles(root, files) {
  const pending = []
  for (const [relative, bytes] of files) {
    const destination = resolveContainedPath(root, root, relative, 'capture output path')
    await ensureSafeDirectory(root, path.dirname(destination), 'capture output directory')
    try {
      const stat = await fs.lstat(destination)
      if (stat.isSymbolicLink() || !stat.isFile()) throw new Error('capture output must be a regular file: ' + relative)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    const temporary = destination + '.tmp-' + process.pid + '-' + Math.random().toString(16).slice(2)
    pending.push({ destination, temporary, bytes })
  }
  try {
    for (const item of pending) await fs.writeFile(item.temporary, item.bytes, { flag: 'wx' })
    for (const item of pending) await fs.rename(item.temporary, item.destination)
  } finally {
    await Promise.all(pending.map(item => fs.rm(item.temporary, { force: true })))
  }
}

async function removeUnchangedWrites(root, files) {
  for (const [relative, bytes] of files) {
    const destination = resolveContainedPath(root, root, relative, 'capture output path')
    let current = path.resolve(root)
    let parentExists = true
    for (const segment of path.posix.dirname(relative).split('/').filter(item => item !== '.')) {
      current = path.join(current, segment)
      let stat
      try {
        stat = await fs.lstat(current)
      } catch (error) {
        if (error.code === 'ENOENT') {
          parentExists = false
          break
        }
        throw error
      }
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        throw new Error('capture output directory contains a non-directory or symbolic link: ' + current)
      }
    }
    if (!parentExists) continue
    let stat
    try {
      stat = await fs.lstat(destination)
    } catch (error) {
      if (error.code === 'ENOENT') continue
      throw error
    }
    if (stat.isSymbolicLink() || !stat.isFile()) {
      throw new Error('capture output must be a regular file and not a symbolic link: ' + relative)
    }
    if (stat.size !== bytes.byteLength) continue
    const digest = createHash('sha256')
    for await (const chunk of createReadStream(destination)) digest.update(chunk)
    if (digest.digest('hex') === sha256(bytes)) files.delete(relative)
  }
}

export async function captureWorld(root, sceneKey, profileName, {
  write = false,
  dryRun = false,
  excludeSeatPoses = false,
  resolve = null,
  bootstrap = false,
  profileOverride = null,
} = {}) {
  assertKey(sceneKey, 'scene key')
  assertKey(profileName, 'profile name')
  if (write && dryRun) throw new Error('capture accepts either --write or --dry-run, not both')
  if (resolve && resolve !== 'live') throw new Error('capture --resolve supports only live')
  if (resolve && !write && !dryRun) throw new Error('capture conflict resolution requires --write or --dry-run')
  const conflictResolution = bootstrap ? 'live' : resolve
  const effectiveDryRun = dryRun || !write
  const profile = profileOverride || await loadProfile(root, profileName)
  const client = makeClient(profile)
  const query = excludeSeatPoses ? '?excludeSeatPoses=true' : ''
  const snapshot = validateSnapshot(await client.request('/snapshot' + query))
  if (excludeSeatPoses && snapshot.seatPoseData) throw new Error('Agent API did not exclude seat-pose data')
  if (!excludeSeatPoses && !snapshot.seatPoseData) throw new Error('Agent API snapshot omitted seat-pose data')

  const { map, captureRelative } = await loadMappings(root, profileName, profile.apiUrl, sceneKey, bootstrap)
  const sourceScene = await loadSourceScene(root, sceneKey)
  const initialEntityKeys = new Set(Object.keys(map.entities))
  const sourceObjects = await discoverObjects(root)
  const sourceObjectsByKey = new Map(sourceObjects.map(item => [item.manifest.key, item]))
  const compiled = sourceScene ? await compileProject(root, sceneKey) : null
  const compiledObjects = new Map((compiled?.objects || []).map(item => [item.key, item]))
  const assetCache = new Map()
  const conflicts = []
  const writes = new Map()
  const liveBlueprints = new Map(snapshot.blueprints.map(blueprint => [blueprint.id, blueprint]))
  if (!liveBlueprints.has('$scene')) throw new Error('Live world snapshot has no protected $scene blueprint')

  const blueprintKeys = inverseMapping(map.blueprints, 'capture blueprint map')
  const occupiedBlueprintKeys = new Set([
    ...Object.keys(map.blueprints),
    ...Object.keys(map.baseline.objects || {}),
    ...sourceObjectsByKey.keys(),
  ])
  const blueprintKeyById = new Map()
  for (const blueprint of snapshot.blueprints) {
    if (typeof blueprint.id !== 'string' || !blueprint.id || typeof blueprint.name !== 'string') {
      throw new Error('Live world snapshot contains an invalid blueprint')
    }
    let key = blueprintKeys.get(blueprint.id)
    if (!key && blueprint.id === '$scene') {
      const declaredEnvironment = sourceScene?.scene.environment
      const declaredObject = declaredEnvironment && sourceObjectsByKey.get(declaredEnvironment)
      const candidate = declaredObject?.manifest.role === 'environment' ? declaredEnvironment : 'environment'
      const candidateObject = sourceObjectsByKey.get(candidate)
      key = candidateObject?.manifest.role === 'environment' && !map.blueprints[candidate]
        ? candidate
        : allocateKey(contentKey('environment', '$scene'), occupiedBlueprintKeys)
      occupiedBlueprintKeys.add(key)
    } else if (!key) {
      key = allocateKey(contentKey('app', blueprint.id), occupiedBlueprintKeys)
    }
    assertKey(key, 'captured object key')
    if (map.blueprints[key] && map.blueprints[key] !== blueprint.id) {
      throw new Error('Capture mapping changed for object ' + key)
    }
    map.blueprints[key] = blueprint.id
    blueprintKeyById.set(blueprint.id, key)
  }
  for (const key of blueprintKeyById.values()) {
    if (sourceObjectsByKey.has(key) && !compiledObjects.has(key)) {
      compiledObjects.set(key, await compileSingleObject(root, key))
    }
  }

  const entityKeys = inverseMapping(map.entities, 'capture entity map')
  const occupiedEntityKeys = new Set([
    ...Object.keys(map.entities),
    ...Object.keys(map.baseline.instances || {}),
    ...(sourceScene?.scene.instances || []).map(instance => instance.key),
  ])
  const liveInstances = new Map()
  const captureEntityMap = {}
  for (const entity of snapshot.entities) {
    if (
      typeof entity.id !== 'string' || !entity.id || !blueprintKeyById.has(entity.blueprint) ||
      !Array.isArray(entity.position) || !Array.isArray(entity.quaternion) || !Array.isArray(entity.scale) ||
      typeof entity.pinned !== 'boolean'
    ) {
      throw new Error('Live world snapshot contains an invalid app instance')
    }
    const key = entityKeys.get(entity.id) || allocateKey(contentKey('instance', entity.id), occupiedEntityKeys)
    occupiedEntityKeys.add(key)
    assertKey(key, 'captured instance key')
    if (map.entities[key] && map.entities[key] !== entity.id) throw new Error('Capture mapping changed for instance ' + key)
    map.entities[key] = entity.id
    captureEntityMap[key] = entity.id
    const record = {
      key,
      object: blueprintKeyById.get(entity.blueprint),
      position: entity.position,
      quaternion: entity.quaternion,
      scale: entity.scale,
      pinned: entity.pinned,
    }
    validateTransform(record)
    liveInstances.set(key, record)
  }
  const poseCapture = excludeSeatPoses
    ? null
    : parseCaptureRecords({ seatPoseData: snapshot.seatPoseData, captureEntityMap })

  const objectBaselines = { ...(map.baseline.objects || {}) }
  let capturedObjects = 0
  let preservedObjects = 0
  let assetCount = 0
  const objectModes = []
  for (const blueprint of snapshot.blueprints) {
    const key = blueprintKeyById.get(blueprint.id)
    const source = sourceObjectsByKey.get(key)
    const localCompiled = compiledObjects.get(key)
    const packaged = await packageBlueprint(client, blueprint, assetCache)
    assetCount += packaged.assets.length
    const role = blueprint.id === '$scene' || blueprint.scene === true ? 'environment' : null
    const baseline = objectBaselines[key]
    const localSemantic = localCompiled?.semanticFingerprint ?? null
    const localSourceFingerprint = localCompiled?.sourceFingerprint ?? null
    const choice = mergeValue({
      key,
      label: 'blueprint',
      base: baseline?.source,
      liveBase: baseline?.live,
      local: localSemantic,
      live: packaged.semantic,
      localToken: localSourceFingerprint,
      baseToken: baseline?.sourceFingerprint,
      conflicts,
      resolve: conflictResolution,
    })
    const shouldCaptureLive = !source || choice === packaged.semantic
    if (shouldCaptureLive && (!localCompiled || localSemantic !== packaged.semantic)) {
      const generated = await createObjectFiles(key, packaged, role)
      for (const [file, bytes] of generated.files) writes.set(file, bytes)
      objectBaselines[key] = {
        live: packaged.semantic,
        source: generated.semantic,
        sourceFingerprint: generated.sourceFingerprint,
      }
      capturedObjects++
      objectModes.push({ key, mode: generated.mode, ...(generated.fallbackReason ? { fallbackReason: generated.fallbackReason } : {}) })
    } else if (localCompiled) {
      objectBaselines[key] = {
        live: packaged.semantic,
        source: localSemantic,
        sourceFingerprint: localSourceFingerprint,
      }
      preservedObjects++
    }
  }
  // Resources absent from the current snapshot have no deletion tombstone. Keep their mappings and source.
  for (const source of sourceObjects) {
    if (!blueprintKeyById.has(source.manifest.key)) preservedObjects++
  }

  const localInstances = new Map((sourceScene?.scene.instances || []).map(instance => [instance.key, instance]))
  const unmappedSourceInstances = [...localInstances.keys()].filter(key => !initialEntityKeys.has(key))
  const instanceBaselines = { ...(map.baseline.instances || {}) }
  const mergedInstances = new Map()
  for (const key of new Set([...localInstances.keys(), ...liveInstances.keys(), ...Object.keys(instanceBaselines)])) {
    const local = localInstances.get(key) || null
    const live = liveInstances.get(key) || null
    const baseline = instanceBaselines[key]
    const merged = mergeValue({
      key,
      label: 'instance',
      base: baseline?.source,
      liveBase: baseline?.live,
      local,
      live,
      conflicts,
      resolve: conflictResolution,
    })
    if (merged) mergedInstances.set(key, { ...merged, key })
    if (live) instanceBaselines[key] = { live, source: merged || live }
    else if (local && !baseline) instanceBaselines[key] = { live: null, source: local }
  }

  const livePortableSettings = portableSettings(snapshot)
  const sourceSettings = sourceSettingValue(compiled, sourceScene)
  const settingsBaseline = map.baseline.settings
  const mergedSettings = mergeValue({
    key: 'world settings',
    label: 'settings',
    base: settingsBaseline?.source,
    liveBase: settingsBaseline?.live,
    local: sourceSettings,
    live: livePortableSettings,
    conflicts,
    resolve: conflictResolution,
  })
  const environmentKey = blueprintKeyById.get('$scene') || null
  const localMetadata = {
    title: sourceScene?.scene.title ?? sourceSettings?.title ?? null,
    environment: sourceScene?.scene.environment ?? null,
  }
  const liveMetadata = {
    title: livePortableSettings.title ?? null,
    environment: environmentKey,
  }
  const metadataBaseline = map.baseline.scene || {}
  const mergedMetadata = mergeValue({
    key: 'scene metadata',
    label: 'scene metadata',
    base: metadataBaseline.source,
    liveBase: metadataBaseline.live,
    local: sourceScene ? localMetadata : null,
    live: liveMetadata,
    conflicts,
    resolve: conflictResolution,
  })

  let poseWrite = false
  let capturedPoseCount = 0
  let unresolvedAnchors = []
  if (!excludeSeatPoses) {
    const existingPoses = await loadExistingPoses(root, sceneKey)
    const liveHash = sha256(stableJson(poseCapture.entries))
    const localHash = sha256(stableJson(existingPoses.entries))
    const poseBaseline = map.baseline.seatPoses
    const hasLive = Object.keys(poseCapture.entries).length > 0
    const shouldCapture = !existingPoses.value || mergeValue({
      key: 'seat poses',
      label: 'seat poses',
      base: poseBaseline?.source,
      liveBase: poseBaseline?.live,
      local: localHash,
      live: liveHash,
      localToken: localHash,
      baseToken: poseBaseline?.source,
      conflicts,
      resolve: conflictResolution,
    }) === liveHash
    poseWrite = shouldCapture && (!existingPoses.value || localHash !== liveHash)
    if (poseWrite) {
      writes.set(existingPoses.relative, Buffer.from(stableJson(poseCapture.data)))
      capturedPoseCount = poseCapture.data.records.length
    }
    if (shouldCapture) {
      map.baseline.seatPoses = { live: liveHash, source: liveHash }
    } else {
      map.baseline.seatPoses = { live: poseBaseline?.live ?? liveHash, source: localHash }
    }
    unresolvedAnchors = poseCapture.unresolvedAnchors
    if (!hasLive && !existingPoses.value) capturedPoseCount = 0
  }

  const sceneDir = path.posix.join('scenes', ...sceneKey.split('/'))
  const settingsFile = sourceScene?.scene.settingsFile || 'settings.json'
  const settingsEffectiveSame = sourceSettings && equal(mergedSettings, sourceSettings)
  let settingsAssetCount = 0
  if (!settingsEffectiveSame || !sourceScene) {
    const settingsFiles = await settingsSourceFiles(root, sceneKey, mergedSettings, client, assetCache, settingsFile)
    for (const [file, bytes] of settingsFiles) writes.set(file, bytes)
    settingsAssetCount = [...settingsFiles.keys()].filter(file => file.includes('/assets/')).length
  }
  const sceneValue = {
    schemaVersion: 1,
    sceneKey,
    ...(mergedMetadata?.title !== null && mergedMetadata?.title !== undefined ? { title: mergedMetadata.title } : {}),
    ...(mergedMetadata?.environment ? { environment: mergedMetadata.environment } : {}),
    settingsFile,
    instances: [...mergedInstances.values()].sort((left, right) => (left.key < right.key ? -1 : left.key > right.key ? 1 : 0)),
  }
  validateSettings(mergedSettings, sceneKey)
  const knownObjectKeys = new Set([
    ...sourceObjects.map(source => source.manifest.key),
    ...blueprintKeyById.values(),
  ])
  if (sceneValue.environment && !knownObjectKeys.has(sceneValue.environment)) {
    throw new Error('Captured scene environment is missing: ' + sceneValue.environment)
  }
  for (const instance of sceneValue.instances) {
    if (!knownObjectKeys.has(instance.object)) throw new Error('Captured placement refers to a missing object: ' + instance.object)
    validateTransform(instance)
  }
  const sceneRelative = path.posix.join(sceneDir, 'scene.json')
  if (!sourceScene || !equal(sourceScene.scene, sceneValue)) {
    writes.set(sceneRelative, Buffer.from(stableJson(sceneValue)))
  }
  for (const [key, live] of liveInstances) {
    const merged = mergedInstances.get(key)
    if (merged) instanceBaselines[key] = { live, source: merged }
  }
  map.baseline = {
    ...map.baseline,
    objects: objectBaselines,
    instances: instanceBaselines,
    settings: {
      live: livePortableSettings,
      source: mergedSettings,
    },
    scene: {
      live: liveMetadata,
      source: mergedMetadata,
    },
  }
  map.revision = snapshot.revision
  writes.set(captureRelative, Buffer.from(stableJson(map)))
  await removeUnchangedWrites(root, writes)

  const plan = {
    profile: profileName,
    sceneKey,
    revision: snapshot.revision,
    bootstrapped: bootstrap,
    blueprints: snapshot.blueprints.length,
    objectsCaptured: capturedObjects,
    objectsPreserved: preservedObjects,
    objectModes,
    instances: mergedInstances.size,
    assets: assetCount + settingsAssetCount,
    seatPoseRecords: excludeSeatPoses ? null : capturedPoseCount,
    seatPosesExcluded: excludeSeatPoses,
    unresolvedAnchors,
    unmappedSourceInstances,
    conflicts,
    files: [...writes.keys()].sort(),
    dryRun: effectiveDryRun,
    written: false,
  }

  if (conflicts.length && conflictResolution !== 'live') return plan
  checkDirtyTargets(root, writes)
  if (!effectiveDryRun) {
    await writeFiles(root, writes)
    plan.written = true
  }
  return plan
}
