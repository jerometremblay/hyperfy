import { compareText, sha256, stableJson } from './canonical.mjs'
import { validateAssetMetadata } from './asset-resolver.mjs'
import { ASSET_TYPES } from './object-source.mjs'

const MAX_HEADER_BYTES = 8 * 1024 * 1024
const MAX_ASSETS = 10000
const MAX_HYP_BYTES = 1024 * 1024 * 1024
const ASSET_URL = /^asset:\/\/([a-f0-9]{64})\.([a-z0-9]+)$/

function asBytes(value) {
  if (value instanceof Uint8Array) return value
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  throw new Error('Asset payload must be bytes')
}

function verifyAsset(asset, index) {
  if (!asset || typeof asset.url !== 'string' || typeof asset.type !== 'string') {
    throw new Error('Invalid .hyp asset entry at index ' + index)
  }
  const match = asset.url.match(ASSET_URL)
  if (!match) throw new Error('Invalid content-addressed asset URL: ' + asset.url)
  const bytes = asBytes(asset.bytes ?? asset.file)
  if (!bytes.byteLength) throw new Error('Empty .hyp asset: ' + asset.url)
  if (sha256(bytes) !== match[1]) throw new Error('Asset digest does not match URL: ' + asset.url)
  const mime = asset.mime || 'application/octet-stream'
  validateAssetMetadata(asset.type, match[2], mime, '.hyp asset ' + asset.url)
  return { ...asset, bytes, mime, sha256: match[1], extension: match[2] }
}

function validateBlueprintDependencies(blueprint, assets) {
  const byUrl = new Map(assets.map(asset => [asset.url, asset]))
  const check = (url, type, label) => {
    if (typeof url !== 'string') return
    if (url.startsWith('file:')) throw new Error(label + ' cannot use file: references inside a native .hyp file')
    if (!url.startsWith('asset://')) return
    const asset = byUrl.get(url)
    if (!asset) throw new Error(label + ' references missing .hyp payload ' + url)
    if (!(asset.types || [asset.type]).includes(type)) {
      throw new Error(label + ' expects asset type ' + type + ' but .hyp declares ' + (asset.types || [asset.type]).join(', '))
    }
  }
  if (blueprint.model && blueprint.model !== 'script-only') {
    check(blueprint.model, blueprint.model.toLowerCase().endsWith('.vrm') ? 'avatar' : 'model', 'blueprint.model')
  }
  if (blueprint.script) check(blueprint.script, 'script', 'blueprint.script')
  if (blueprint.image?.url) check(blueprint.image.url, 'texture', 'blueprint.image.url')
  const visit = (value, pointer) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, pointer + '/' + index))
      return
    }
    if (!value || typeof value !== 'object') return
    if (typeof value.url === 'string' && (value.url.startsWith('asset://') || value.url.startsWith('file:'))) {
      if (typeof value.type !== 'string' || !ASSET_TYPES.has(value.type)) {
        throw new Error(pointer + '/url uses an asset reference without a supported type')
      }
      check(value.url, value.type, pointer + '/url')
    }
    for (const [key, child] of Object.entries(value)) {
      if (key !== 'url') visit(child, pointer + '/' + key)
    }
  }
  if (blueprint.props) visit(blueprint.props, 'blueprint.props')
}

export function parseHyp(value, { maxBytes = MAX_HYP_BYTES } = {}) {
  const bytes = asBytes(value)
  if (bytes.byteLength < 4) throw new Error('Invalid .hyp file header')
  if (bytes.byteLength > maxBytes) throw new Error('.hyp file exceeds the ' + maxBytes + ' byte limit')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const headerSize = view.getUint32(0, true)
  if (!headerSize || headerSize > MAX_HEADER_BYTES || headerSize > bytes.byteLength - 4) {
    throw new Error('Invalid or incomplete .hyp file header')
  }
  let header
  try {
    header = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(4, 4 + headerSize)))
  } catch (error) {
    throw new Error('Invalid .hyp JSON header: ' + error.message)
  }
  if (
    !header ||
    typeof header !== 'object' ||
    !header.blueprint ||
    typeof header.blueprint !== 'object' ||
    Array.isArray(header.blueprint) ||
    !Array.isArray(header.assets) ||
    header.assets.length > MAX_ASSETS
  ) {
    throw new Error('Invalid .hyp file contents')
  }
  let offset = 4 + headerSize
  const assets = []
  const seen = new Map()
  for (const [index, info] of header.assets.entries()) {
    if (
      !info ||
      typeof info.url !== 'string' ||
      typeof info.type !== 'string' ||
      typeof info.mime !== 'string' ||
      info.mime.length > 256 ||
      !Number.isSafeInteger(info.size) ||
      info.size <= 0 ||
      info.size > bytes.byteLength - offset
    ) {
      throw new Error('Invalid or incomplete .hyp asset at index ' + index)
    }
    const payload = bytes.slice(offset, offset + info.size)
    const asset = verifyAsset({ ...info, bytes: payload }, index)
    const existing = seen.get(info.url)
    if (existing) {
      if (!Buffer.from(existing.bytes).equals(Buffer.from(asset.bytes))) {
        throw new Error('Conflicting .hyp payloads for duplicate asset URL: ' + info.url)
      }
      if (!existing.types.includes(asset.type)) existing.types.push(asset.type)
    } else {
      asset.types = [asset.type]
      seen.set(info.url, asset)
      assets.push(asset)
    }
    offset += info.size
  }
  if (offset !== bytes.byteLength) throw new Error('Unexpected trailing bytes in .hyp file')
  validateBlueprintDependencies(header.blueprint, assets)
  return { blueprint: header.blueprint, assets }
}

export function packHyp(blueprint, assets) {
  if (!blueprint || typeof blueprint !== 'object' || Array.isArray(blueprint)) {
    throw new Error('A blueprint object is required to export .hyp')
  }
  if (!Array.isArray(assets) || assets.length > MAX_ASSETS) throw new Error('Invalid .hyp asset list')
  const unique = new Map()
  for (const [index, rawAsset] of assets.entries()) {
    const types = [...new Set(rawAsset.types || [rawAsset.type])]
    for (const type of types) {
      const asset = verifyAsset({ ...rawAsset, type }, index)
      const key = asset.url + '\0' + type
      const current = unique.get(key)
      if (current && !Buffer.from(current.bytes).equals(Buffer.from(asset.bytes))) {
        throw new Error('Conflicting payloads for ' + asset.url + ' as type ' + type)
      }
      if (!current) unique.set(key, asset)
    }
  }
  const ordered = [...unique.values()].sort((left, right) => compareText(left.url, right.url) || compareText(left.type, right.type))
  validateBlueprintDependencies(blueprint, ordered)
  const header = {
    blueprint,
    assets: ordered.map(asset => ({
      type: asset.type,
      url: asset.url,
      size: asset.bytes.byteLength,
      mime: asset.mime || 'application/octet-stream',
    })),
  }
  const headerBytes = Buffer.from(stableJson(header), 'utf8')
  if (headerBytes.byteLength > MAX_HEADER_BYTES) throw new Error('.hyp header exceeds the size limit')
  const prefix = Buffer.alloc(4)
  prefix.writeUInt32LE(headerBytes.byteLength, 0)
  const output = Buffer.concat([prefix, headerBytes, ...ordered.map(asset => Buffer.from(asset.bytes))])
  if (output.byteLength > MAX_HYP_BYTES) throw new Error('.hyp file exceeds the size limit')
  return output
}
