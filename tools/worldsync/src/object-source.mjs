import fs from 'node:fs/promises'
import path from 'node:path'
import { assertKey, compareText } from './canonical.mjs'
import { readBoundedFile, resolveLocalReference } from './paths.mjs'

const BLUEPRINT_FIELDS = new Set([
  'name',
  'desc',
  'model',
  'script',
  'props',
  'image',
  'author',
  'url',
  'preload',
  'public',
  'locked',
  'unique',
  'frozen',
  'disabled',
])
const MANIFEST_FIELDS = new Set([
  'schemaVersion',
  'key',
  'mode',
  'role',
  'blueprint',
  'source',
  'extraAssets',
  'extensions',
])
const ASSET_TYPES = new Set([
  'model',
  'avatar',
  'script',
  'texture',
  'audio',
  'video',
  'image',
  'hdr',
  'emote',
  'splat',
  'other',
])

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validateBlueprint(blueprint, key) {
  if (!plainObject(blueprint)) throw new Error('object ' + key + ' blueprint must be an object')
  for (const field of Object.keys(blueprint)) {
    if (!BLUEPRINT_FIELDS.has(field)) {
      throw new Error('object ' + key + ' blueprint field ' + field + ' is unsupported; use extensions or update the schema')
    }
  }
  if (typeof blueprint.name !== 'string' || !blueprint.name.trim() || blueprint.name.length > 256) {
    throw new Error('object ' + key + ' blueprint.name must be a non-empty string of at most 256 characters')
  }
  if (blueprint.desc !== undefined && blueprint.desc !== null && (typeof blueprint.desc !== 'string' || blueprint.desc.length > 4096)) {
    throw new Error('object ' + key + ' blueprint.desc must be null or a string of at most 4096 characters')
  }
  if (blueprint.model !== undefined && blueprint.model !== null && typeof blueprint.model !== 'string') {
    throw new Error('object ' + key + ' blueprint.model must be a string or null')
  }
  if (blueprint.script !== undefined && blueprint.script !== null && typeof blueprint.script !== 'string') {
    throw new Error('object ' + key + ' blueprint.script must be a string or null')
  }
  if (blueprint.props !== undefined && !plainObject(blueprint.props)) {
    throw new Error('object ' + key + ' blueprint.props must be an object')
  }
  for (const field of ['author', 'url']) {
    if (blueprint[field] !== undefined && blueprint[field] !== null && typeof blueprint[field] !== 'string') {
      throw new Error('object ' + key + ' blueprint.' + field + ' must be null or a string')
    }
  }
  if (blueprint.image !== undefined && blueprint.image !== null) {
    if (
      !plainObject(blueprint.image) ||
      Object.keys(blueprint.image).some(field => !['type', 'name', 'url'].includes(field)) ||
      typeof blueprint.image.type !== 'string' ||
      typeof blueprint.image.name !== 'string' ||
      typeof blueprint.image.url !== 'string'
    ) {
      throw new Error('object ' + key + ' blueprint.image must be null or a typed image descriptor')
    }
  }
  for (const field of ['preload', 'public', 'locked', 'unique', 'frozen', 'disabled']) {
    if (blueprint[field] !== undefined && typeof blueprint[field] !== 'boolean') {
      throw new Error('object ' + key + ' blueprint.' + field + ' must be a boolean')
    }
  }
  if (blueprint.id !== undefined || blueprint.version !== undefined || blueprint.scene !== undefined) {
    throw new Error('object ' + key + ' source must not contain runtime identity, version, or scene fields')
  }
}

export function validateObjectManifest(manifest, sourcePath = 'object.json') {
  if (!plainObject(manifest)) throw new Error(sourcePath + ' must contain a JSON object')
  for (const field of Object.keys(manifest)) {
    if (!MANIFEST_FIELDS.has(field)) throw new Error(sourcePath + ' has unsupported field ' + field)
  }
  if (manifest.schemaVersion !== 1) throw new Error(sourcePath + ' schemaVersion must be 1')
  assertKey(manifest.key, sourcePath + ' key')
  if (!['files', 'hyp'].includes(manifest.mode)) throw new Error(sourcePath + ' mode must be files or hyp')
  if (manifest.role !== undefined && manifest.role !== 'environment') {
    throw new Error(sourcePath + ' role must be environment when present')
  }
  if (manifest.mode === 'files') {
    if (manifest.source !== undefined) throw new Error(sourcePath + ' files mode must not declare source')
    validateBlueprint(manifest.blueprint, manifest.key)
  } else {
    if (manifest.blueprint !== undefined) throw new Error(sourcePath + ' hyp mode must not duplicate a blueprint')
    if (typeof manifest.source !== 'string' || !manifest.source.startsWith('./')) {
      throw new Error(sourcePath + ' hyp mode source must be a relative path such as ./original.hyp')
    }
    if (manifest.extraAssets !== undefined) {
      throw new Error(sourcePath + ' hyp mode dependencies are read from the native package')
    }
  }
  if (manifest.extraAssets !== undefined) {
    if (!Array.isArray(manifest.extraAssets)) throw new Error(sourcePath + ' extraAssets must be an array')
    for (const [index, entry] of manifest.extraAssets.entries()) {
      if (!plainObject(entry) || Object.keys(entry).some(field => !['file', 'type'].includes(field))) {
        throw new Error(sourcePath + ' extraAssets[' + index + '] must contain only file and type')
      }
      if (typeof entry.file !== 'string' || !entry.file.startsWith('file:./')) {
        throw new Error(sourcePath + ' extraAssets[' + index + '].file must use file:./')
      }
      if (typeof entry.type !== 'string' || !ASSET_TYPES.has(entry.type)) {
        throw new Error(sourcePath + ' extraAssets[' + index + '].type is unsupported')
      }
    }
  }
  if (manifest.extensions !== undefined && !plainObject(manifest.extensions)) {
    throw new Error(sourcePath + ' extensions must be an object')
  }
  if (manifest.extensions && Object.keys(manifest.extensions).length > 0) {
    throw new Error(sourcePath + ' has extensions that this compiler version does not support; update the worldsync schema before compiling')
  }
  return manifest
}

async function walkObjectFiles(directory, found, foldedPaths) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  entries.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0))
  for (const entry of entries) {
    const itemPath = path.join(directory, entry.name)
    if (entry.isSymbolicLink()) throw new Error('Symbolic links are not allowed under objects/: ' + itemPath)
    if (entry.isDirectory()) {
      await recordCasePath(itemPath, foldedPaths)
      await walkObjectFiles(itemPath, found, foldedPaths)
      continue
    }
    if (!entry.isFile()) throw new Error('Special files are not allowed under objects/: ' + itemPath)
    await recordCasePath(itemPath, foldedPaths)
    if (entry.name === 'object.json') found.push(itemPath)
  }
}

async function recordCasePath(itemPath, foldedPaths) {
  const folded = itemPath.toLowerCase()
  const previous = foldedPaths.get(folded)
  if (previous && previous !== itemPath) {
    throw new Error('Case-conflicting object paths are not allowed: ' + previous + ' and ' + itemPath)
  }
  foldedPaths.set(folded, itemPath)
}

export async function discoverObjects(root) {
  const objectsRoot = path.join(root, 'objects')
  let entries
  try {
    const rootStat = await fs.lstat(objectsRoot)
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
      throw new Error('objects/ must be a real directory inside the repository')
    }
    entries = await fs.readdir(objectsRoot, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
  const found = []
  const foldedPaths = new Map()
  entries.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0))
  for (const entry of entries) {
    if (entry.isSymbolicLink()) throw new Error('Symbolic links are not allowed under objects/: ' + entry.name)
    const entryPath = path.join(objectsRoot, entry.name)
    await recordCasePath(entryPath, foldedPaths)
    if (entry.isDirectory()) await walkObjectFiles(entryPath, found, foldedPaths)
    else if (!entry.isFile()) throw new Error('Special files are not allowed under objects/: ' + entryPath)
  }
  const result = []
  const keys = new Set()
  for (const manifestPath of found) {
    const bytes = await readBoundedFile(manifestPath, { maxBytes: 4 * 1024 * 1024, label: manifestPath })
    let manifest
    try {
      manifest = JSON.parse(bytes.toString('utf8'))
    } catch (error) {
      throw new Error('Invalid JSON in ' + manifestPath + ': ' + error.message)
    }
    validateObjectManifest(manifest, manifestPath)
    const expectedPath = path.resolve(root, 'objects', ...manifest.key.split('/'), 'object.json')
    if (path.resolve(manifestPath) !== expectedPath) {
      throw new Error(manifestPath + ' path must match its declared key objects/' + manifest.key)
    }
    if (keys.has(manifest.key)) throw new Error('Duplicate object key: ' + manifest.key)
    keys.add(manifest.key)
    result.push({
      manifest,
      manifestPath,
      objectDir: path.dirname(manifestPath),
      sourceBytes: bytes,
    })
  }
  return result.sort((left, right) => compareText(left.manifest.key, right.manifest.key))
}

export async function loadObject(root, key) {
  const matches = (await discoverObjects(root)).filter(item => item.manifest.key === key)
  if (matches.length !== 1) throw new Error(matches.length ? 'Duplicate object key: ' + key : 'Object not found: ' + key)
  return matches[0]
}

export async function readObjectFile(root, object, reference, label) {
  const resolved = await resolveLocalReference(root, object.objectDir, reference, label)
  const bytes = await readBoundedFile(resolved.absolutePath, { label })
  return { ...resolved, bytes }
}

export { ASSET_TYPES }
