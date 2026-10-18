import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { assertKey, sha256, stableJson } from './canonical.mjs'
import { compileSingleObject } from './compiler.mjs'
import { parseHyp } from './hyp-format.mjs'
import { ASSET_TYPES, validateObjectManifest } from './object-source.mjs'
import { ensureSafeDirectory, readBoundedFile, resolveLocalReference } from './paths.mjs'

function assetExtension(url) {
  const match = /^asset:\/\/[a-f0-9]{64}\.([a-z0-9]+)$/.exec(url)
  if (!match) throw new Error('Invalid HYP asset URL: ' + url)
  return match[1]
}

function extractManifest(key, imported) {
  const assetByUrl = new Map()
  const files = new Map()
  for (const asset of imported.assets) {
    const type = ASSET_TYPES.has(asset.type) ? asset.type : 'other'
    assetByUrl.set(asset.url, {
      ...asset,
      type,
      types: [...(asset.types || [type])],
      extension: assetExtension(asset.url),
    })
  }
  const claimFile = (url, preferredPath, label) => {
    const asset = assetByUrl.get(url)
    if (!asset) throw new Error(label + ' references missing HYP asset ' + url)
    if (!asset.name) {
      let name = preferredPath
      if (files.has(name) && !Buffer.from(files.get(name)).equals(Buffer.from(asset.bytes))) {
        name = 'assets/' + asset.type + '/' + asset.sha256 + '.' + asset.extension
      }
      asset.name = name
      asset.reference = 'file:./' + name
      files.set(name, Buffer.from(asset.bytes))
    }
    return asset
  }
  const used = new Map()
  const markUsed = (asset, type) => {
    const types = used.get(asset.url) || new Set()
    types.add(type)
    used.set(asset.url, types)
  }
  const blueprint = structuredClone(imported.blueprint)
  delete blueprint.id
  delete blueprint.version
  const role = blueprint.scene === true ? 'environment' : undefined
  delete blueprint.scene
  if (blueprint.model && blueprint.model !== 'script-only' && blueprint.model.startsWith('asset://')) {
    const asset = claimFile(blueprint.model, 'model.' + assetExtension(blueprint.model), 'Blueprint model')
    markUsed(asset, blueprint.model.toLowerCase().endsWith('.vrm') ? 'avatar' : 'model')
    blueprint.model = asset.reference
  }
  if (blueprint.script && blueprint.script.startsWith('asset://')) {
    const asset = claimFile(blueprint.script, 'script.' + assetExtension(blueprint.script), 'Blueprint script')
    markUsed(asset, 'script')
    blueprint.script = asset.reference
  }
  if (blueprint.image?.url?.startsWith('asset://')) {
    const asset = claimFile(
      blueprint.image.url,
      'textures/image.' + assetExtension(blueprint.image.url),
      'Blueprint image'
    )
    markUsed(asset, 'texture')
    blueprint.image.url = asset.reference
  }
  if (blueprint.props) {
    const replaceWithSourceFile = (value, pointer) => {
      if (Array.isArray(value)) {
        return value.map((item, index) => replaceWithSourceFile(item, pointer + '/' + index))
      }
      if (!value || typeof value !== 'object') return value
      const result = { ...value }
      if (typeof result.url === 'string' && result.url.startsWith('asset://')) {
        if (typeof result.type !== 'string' || !ASSET_TYPES.has(result.type)) {
          throw new Error(pointer + '/url is an asset reference without a supported type')
        }
        const extension = assetExtension(result.url)
        const folder = result.type === 'texture' ? 'textures' : result.type + 's'
        const asset = claimFile(
          result.url,
          folder + '/' + sha256(result.url) + '.' + extension,
          pointer + '/url'
        )
        if (!asset.types.includes(result.type)) {
          throw new Error(pointer + '/url expects asset type ' + result.type + ' but HYP declares ' + asset.types.join(', '))
        }
        markUsed(asset, result.type)
        result.url = asset.reference
      }
      for (const [field, child] of Object.entries(result)) {
        if (field !== 'url') result[field] = replaceWithSourceFile(child, pointer + '/' + field)
      }
      return result
    }
    blueprint.props = replaceWithSourceFile(blueprint.props, 'blueprint.props')
  }
  const extraAssets = []
  for (const asset of assetByUrl.values()) {
    if (!asset.name) {
      const folder = asset.type === 'texture' ? 'textures' : asset.type + 's'
      claimFile(asset.url, folder + '/' + asset.sha256 + '.' + asset.extension, 'HYP asset')
    }
    const referencedTypes = used.get(asset.url) || new Set()
    for (const type of asset.types) {
      if (!referencedTypes.has(type)) extraAssets.push({ file: asset.reference, type })
    }
  }
  const manifest = {
    schemaVersion: 1,
    key,
    mode: 'files',
    ...(role ? { role } : {}),
    blueprint,
    ...(extraAssets.length ? { extraAssets } : {}),
  }
  validateObjectManifest(manifest, 'object.json')
  return { manifest, files, imported }
}

function compareExtracted(original, compiled, role) {
  const expected = structuredClone(original)
  delete expected.id
  delete expected.version
  if (role) expected.scene = true
  else delete expected.scene
  for (const [field, value] of Object.entries(expected)) {
    if (stableJson(compiled.blueprint[field]) !== stableJson(value)) {
      throw new Error('HYP extraction changed blueprint field ' + field)
    }
  }
  const expectedAssets = new Set(compiled.assets.map(asset => asset.url))
  for (const asset of compiled.assets) {
    if (sha256(asset.bytes) !== asset.sha256) throw new Error('Extracted asset digest mismatch: ' + asset.url)
  }
  if (expectedAssets.size !== compiled.assets.length) throw new Error('Extracted source has duplicate asset bindings')
}

async function writeExtractedToStage(key, extracted) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'hyperfy-worldsync-'))
  const objectDir = path.join(root, 'objects', ...key.split('/'))
  await fs.mkdir(objectDir, { recursive: true })
  await fs.mkdir(path.join(objectDir, 'assets'), { recursive: true })
  for (const [relative, bytes] of extracted.files) {
    const destination = path.join(objectDir, ...relative.split('/'))
    await fs.mkdir(path.dirname(destination), { recursive: true })
    await fs.writeFile(destination, bytes, { flag: 'wx' })
  }
  await fs.writeFile(path.join(objectDir, 'object.json'), stableJson(extracted.manifest), { flag: 'wx' })
  return { root, objectDir }
}

async function ensureFreshObjectDirectory(root, key) {
  const objectDir = path.join(root, 'objects', ...key.split('/'))
  await ensureSafeDirectory(root, path.dirname(objectDir), 'object parent directory')
  try {
    await fs.lstat(objectDir)
    throw new Error('Object already exists at objects/' + key)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  await fs.mkdir(objectDir)
  return objectDir
}

async function installFreshFiles(root, key, files, manifest) {
  const objectDir = await ensureFreshObjectDirectory(root, key)
  try {
    for (const [relative, bytes] of files) {
      const destination = path.join(objectDir, ...relative.split('/'))
      await ensureSafeDirectory(root, path.dirname(destination), 'object import directory')
      await fs.writeFile(destination, bytes, { flag: 'wx' })
    }
    await fs.writeFile(path.join(objectDir, 'object.json'), stableJson(manifest), { flag: 'wx' })
    return objectDir
  } catch (error) {
    await fs.rm(objectDir, { recursive: true, force: true })
    throw error
  }
}

export async function importHyp(root, inputPath, key, { extract = false, keepOriginal = false } = {}) {
  assertKey(key, 'object key')
  const absoluteInput = path.resolve(root, inputPath)
  const bytes = await readBoundedFile(absoluteInput, { label: inputPath })
  const imported = parseHyp(bytes)
  if (!extract) {
    const role = imported.blueprint.scene === true ? 'environment' : undefined
    const manifest = {
      schemaVersion: 1,
      key,
      mode: 'hyp',
      ...(role ? { role } : {}),
      source: './original.hyp',
    }
    const files = new Map([['original.hyp', bytes]])
    await installFreshFiles(root, key, files, manifest)
    return { key, mode: 'hyp', objectDir: path.join(root, 'objects', ...key.split('/')) }
  }
  const extracted = extractManifest(key, imported)
  const stage = await writeExtractedToStage(key, extracted)
  try {
    const compiled = await compileSingleObject(stage.root, key)
    compareExtracted(imported.blueprint, compiled, extracted.manifest.role)
    const expected = new Set(imported.assets.map(asset => asset.url))
    const actual = new Set(compiled.assets.map(asset => asset.url))
    if (expected.size !== actual.size || [...expected].some(url => !actual.has(url))) {
      throw new Error('HYP extraction changed the embedded asset set')
    }
    if (keepOriginal) {
      extracted.files.set('provenance/original.hyp', Buffer.from(bytes))
      extracted.files.set(
        'provenance/provenance.json',
        Buffer.from(
          stableJson({
            sourceSha256: sha256(bytes),
            toolVersion: '0.1.0',
          })
        )
      )
    }
    const objectDir = await installFreshFiles(root, key, extracted.files, extracted.manifest)
    return { key, mode: 'files', objectDir }
  } finally {
    await fs.rm(stage.root, { recursive: true, force: true })
  }
}

export async function unpackObject(root, key, { keepOriginal = false } = {}) {
  assertKey(key, 'object key')
  const objectDir = path.join(root, 'objects', ...key.split('/'))
  const manifestPath = path.join(objectDir, 'object.json')
  const manifestBytes = await readBoundedFile(manifestPath, { maxBytes: 4 * 1024 * 1024, label: manifestPath })
  const manifest = JSON.parse(manifestBytes.toString('utf8'))
  validateObjectManifest(manifest, manifestPath)
  if (manifest.mode !== 'hyp') throw new Error('Object ' + key + ' is not in hyp mode')
  const source = await resolveLocalReference(root, objectDir, 'file:' + manifest.source, 'legacy .hyp source')
  const bytes = await readBoundedFile(source.absolutePath, { label: source.relativePath })
  const imported = parseHyp(bytes)
  const extracted = extractManifest(key, imported)
  const stage = await writeExtractedToStage(key, extracted)
  try {
    const compiled = await compileSingleObject(stage.root, key)
    compareExtracted(imported.blueprint, compiled, extracted.manifest.role)
    const pending = []
    for (const [relative, fileBytes] of extracted.files) {
      const destination = path.join(objectDir, ...relative.split('/'))
      try {
        await fs.lstat(destination)
        throw new Error('Extraction would overwrite existing file: ' + destination)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      pending.push([destination, fileBytes])
    }
    const provenancePath = path.join(objectDir, 'provenance', 'original.hyp')
    if (keepOriginal) {
      try {
        await fs.lstat(provenancePath)
        throw new Error('Provenance file already exists: ' + provenancePath)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
    }
    const created = []
    try {
      for (const [destination, fileBytes] of pending) {
        await ensureSafeDirectory(root, path.dirname(destination), 'object extraction directory')
        await fs.writeFile(destination, fileBytes, { flag: 'wx' })
        created.push(destination)
      }
      if (keepOriginal) {
        await ensureSafeDirectory(root, path.dirname(provenancePath), 'provenance directory')
        await fs.writeFile(provenancePath, bytes, { flag: 'wx' })
        created.push(provenancePath)
      }
      const activeHypPath = path.resolve(objectDir, manifest.source.slice(2))
      const nextManifestPath = path.join(objectDir, 'object.json')
      const nextManifestTmp = nextManifestPath + '.worldsync.tmp'
      const backupManifestPath = nextManifestPath + '.worldsync.bak'
      await fs.writeFile(nextManifestTmp, stableJson(extracted.manifest), { flag: 'wx' })
      created.push(nextManifestTmp)
      try {
        await fs.lstat(backupManifestPath)
        throw new Error('Extraction found an existing manifest backup: ' + backupManifestPath)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      await fs.rename(nextManifestPath, backupManifestPath)
      try {
        await fs.rename(nextManifestTmp, nextManifestPath)
        await fs.unlink(activeHypPath)
      } catch (error) {
        await fs.rm(nextManifestPath, { force: true }).catch(() => {})
        await fs.rename(backupManifestPath, nextManifestPath).catch(() => {})
        throw error
      }
      await fs.rm(backupManifestPath, { force: true }).catch(() => {})
    } catch (error) {
      for (const filePath of created.reverse()) await fs.rm(filePath, { force: true }).catch(() => {})
      throw error
    }
    return { key, mode: 'files', objectDir }
  } finally {
    await fs.rm(stage.root, { recursive: true, force: true })
  }
}
