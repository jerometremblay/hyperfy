import path from 'node:path'
import { sha256 } from './canonical.mjs'
import { readObjectFile, ASSET_TYPES } from './object-source.mjs'

const EXTENSIONS = {
  model: new Set(['glb', 'gltf', 'obj', 'spz', 'vrm']),
  avatar: new Set(['vrm']),
  emote: new Set(['glb', 'gltf']),
  script: new Set(['js', 'mjs']),
  texture: new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'hdr', 'exr']),
  image: new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']),
  hdr: new Set(['hdr', 'exr']),
  splat: new Set(['spz']),
  audio: new Set(['mp3', 'wav', 'ogg']),
  video: new Set(['mp4', 'webm']),
}

const MIME = {
  glb: 'model/gltf-binary',
  gltf: 'model/gltf+json',
  obj: 'model/obj',
  spz: 'application/octet-stream',
  vrm: 'model/gltf-binary',
  js: 'text/javascript',
  mjs: 'text/javascript',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  hdr: 'image/vnd.radiance',
  exr: 'image/x-exr',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  webm: 'video/webm',
}

function validateAssetMetadata(type, extension, mime, label = 'asset') {
  if (!ASSET_TYPES.has(type)) throw new Error(label + ' has unsupported asset type ' + type)
  if (type !== 'other' && !EXTENSIONS[type]?.has(extension)) {
    throw new Error(label + ' extension .' + extension + ' is not supported for type ' + type)
  }
  const expected = MIME[extension]
  const compatible =
    !expected ||
    mime === expected ||
    mime === 'application/octet-stream' ||
    (['js', 'mjs'].includes(extension) && mime === 'application/javascript')
  if (!compatible) throw new Error(label + ' MIME type ' + mime + ' is incompatible with .' + extension)
  return true
}

function extensionOf(sourcePath, type) {
  const extension = path.extname(sourcePath).slice(1).toLowerCase()
  if (!/^[a-z0-9]+$/.test(extension)) throw new Error('Asset requires a supported file extension: ' + sourcePath)
  if (type !== 'other' && !EXTENSIONS[type]?.has(extension)) {
    throw new Error('Asset extension .' + extension + ' is not supported for type ' + type)
  }
  return extension
}

function isExternal(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url)
}

export async function createObjectAssetResolver(root, object) {
  const assets = new Map()
  const warnings = []

  const addFile = async (reference, type, label) => {
    if (!ASSET_TYPES.has(type)) throw new Error(label + ' has unsupported asset type ' + type)
    const resolved = await readObjectFile(root, object, reference, label)
    const extension = extensionOf(resolved.relativePath, type)
    const digest = sha256(resolved.bytes)
    const url = 'asset://' + digest + '.' + extension
    let record = assets.get(url)
    if (!record) {
      record = {
        url,
        sha256: digest,
        extension,
        type,
        types: [type],
        mime: MIME[extension] || 'application/octet-stream',
        source: resolved.relativePath,
        bytes: resolved.bytes,
        size: resolved.bytes.byteLength,
      }
      assets.set(url, record)
    } else if (!record.types.includes(type)) {
      record.types.push(type)
    }
    if (!record.types) record.types = [record.type]
    return url
  }

  const addExtraAssets = async entries => {
    for (const [index, entry] of entries.entries()) {
      await addFile(entry.file, entry.type, 'extraAssets[' + index + ']')
    }
  }

  const resolveUrl = async (url, type, label) => {
    if (typeof url !== 'string') throw new Error(label + ' must be a string')
    if (url.startsWith('file:')) return addFile(url, type, label)
    if (url.startsWith('asset://')) {
      const asset = assets.get(url)
      if (!asset) {
        throw new Error(label + ' references ' + url + ' without a matching local extraAssets entry')
      }
      if (!asset.types.includes(type)) {
        throw new Error(label + ' expects asset type ' + type + ' but extraAssets declares ' + asset.types.join(', '))
      }
      return url
    }
    if (isExternal(url)) {
      warnings.push({ code: 'external-asset', path: label })
      return url
    }
    throw new Error(label + ' must use file:./, asset:// with a declared local dependency, or an http(s) URL')
  }

  const resolveProps = async (value, pointer) => {
    if (Array.isArray(value)) {
      return Promise.all(value.map((item, index) => resolveProps(item, pointer + '/' + index)))
    }
    if (!value || typeof value !== 'object') return value
    const result = { ...value }
    if (Object.hasOwn(result, 'url') && typeof result.url === 'string') {
      if (result.url.startsWith('file:') || result.url.startsWith('asset://')) {
        if (typeof result.type !== 'string' || !ASSET_TYPES.has(result.type)) {
          throw new Error(pointer + '/url uses a local asset reference without a recognized asset type')
        }
        result.url = await resolveUrl(result.url, result.type, pointer + '/url')
      } else if (isExternal(result.url)) {
        warnings.push({ code: 'external-asset', path: pointer + '/url' })
      }
    }
    for (const [key, item] of Object.entries(result)) {
      if (key !== 'url') result[key] = await resolveProps(item, pointer + '/' + key)
    }
    return result
  }

  const resolveBlueprint = async (blueprint, extraAssets = []) => {
    await addExtraAssets(extraAssets)
    const compiled = structuredClone(blueprint)
    if (compiled.model && compiled.model !== 'script-only') {
      compiled.model = await resolveUrl(
        compiled.model,
        compiled.model.toLowerCase().endsWith('.vrm') ? 'avatar' : 'model',
        'blueprint.model'
      )
    }
    if (compiled.script) compiled.script = await resolveUrl(compiled.script, 'script', 'blueprint.script')
    if (compiled.image?.url) compiled.image.url = await resolveUrl(compiled.image.url, 'texture', 'blueprint.image.url')
    if (compiled.props) compiled.props = await resolveProps(compiled.props, 'blueprint.props')
    return {
      blueprint: compiled,
      assets: [...assets.values()].map(asset => ({ ...asset, types: asset.types || [asset.type] })),
      warnings,
    }
  }

  return { resolveBlueprint, assets, warnings, addFile, resolveUrl }
}

export async function resolveSettingsAssets(settings, resolver) {
  const compiled = structuredClone(settings)
  for (const field of ['image', 'avatar']) {
    if (compiled[field]?.url) {
      compiled[field].url = await resolver.resolveUrl(
        compiled[field].url,
        field === 'avatar' ? 'avatar' : 'texture',
        'settings.' + field + '.url'
      )
    }
  }
  return compiled
}

export { EXTENSIONS, MIME, validateAssetMetadata }
