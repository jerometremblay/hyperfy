import fs from 'node:fs/promises'
import { unzipSync, zipSync } from 'fflate'
import { compareText, sha256, stableJson } from './canonical.mjs'
import { packHyp } from './hyp-format.mjs'

const FORMAT = 'hyperfy-world'
const TOOL_VERSION = '0.1.0'
const MAX_BUNDLE_BYTES = 1024 * 1024 * 1024
const MAX_ENTRY_BYTES = 256 * 1024 * 1024
const MAX_TOTAL_BYTES = 1024 * 1024 * 1024
const MAX_ENTRIES = 10000
const ZIP_EOCD = 0x06054b50
const ZIP_CENTRAL = 0x02014b50

function safeEntryName(name) {
  if (
    typeof name !== 'string' ||
    !name ||
    name.startsWith('/') ||
    name.includes('\\') ||
    name.includes('\0') ||
    name.length > 4096
  ) {
    throw new Error('Unsafe bundle entry name')
  }
  const parts = name.split('/')
  if (parts.some(part => !part || part === '.' || part === '..')) {
    throw new Error('Unsafe bundle entry path: ' + name)
  }
  return name
}

function findEndOfCentralDirectory(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const min = Math.max(0, bytes.byteLength - 65557)
  for (let offset = bytes.byteLength - 22; offset >= min; offset--) {
    if (view.getUint32(offset, true) !== ZIP_EOCD) continue
    const commentLength = view.getUint16(offset + 20, true)
    if (offset + 22 + commentLength === bytes.byteLength) return { offset, view }
  }
  throw new Error('Invalid ZIP: end of central directory not found')
}

export function inspectZip(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value)
  if (bytes.byteLength < 22 || bytes.byteLength > MAX_BUNDLE_BYTES) {
    throw new Error('Bundle size is outside the allowed range')
  }
  const { offset: eocd, view } = findEndOfCentralDirectory(bytes)
  const diskNumber = view.getUint16(eocd + 4, true)
  const centralDisk = view.getUint16(eocd + 6, true)
  const diskEntries = view.getUint16(eocd + 8, true)
  const entryCount = view.getUint16(eocd + 10, true)
  const centralSize = view.getUint32(eocd + 12, true)
  const centralOffset = view.getUint32(eocd + 16, true)
  if (
    diskNumber !== 0 ||
    centralDisk !== 0 ||
    diskEntries !== entryCount ||
    entryCount === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff ||
    entryCount > MAX_ENTRIES ||
    centralOffset + centralSize > eocd
  ) {
    throw new Error('Unsupported or invalid ZIP directory')
  }
  const files = new Map()
  const localRanges = []
  let offset = centralOffset
  let totalSize = 0
  const decoder = new TextDecoder('utf-8', { fatal: true })
  for (let index = 0; index < entryCount; index++) {
    if (offset + 46 > bytes.byteLength || view.getUint32(offset, true) !== ZIP_CENTRAL) {
      throw new Error('Invalid ZIP central directory entry')
    }
    const creator = view.getUint16(offset + 4, true) >>> 8
    const flags = view.getUint16(offset + 8, true)
    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const uncompressedSize = view.getUint32(offset + 24, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const start = offset + 46
    const end = start + nameLength
    if (end + extraLength + commentLength > bytes.byteLength) throw new Error('Invalid ZIP filename bounds')
    if (flags & ~0x0800) throw new Error('Unsupported ZIP entry flags')
    if (![0, 8].includes(method)) throw new Error('Unsupported ZIP compression method')
    let name
    try {
      name = decoder.decode(bytes.subarray(start, end))
    } catch {
      throw new Error('ZIP entry names must be valid UTF-8')
    }
    safeEntryName(name)
    if (name.endsWith('/')) throw new Error('Directory entries are not allowed in a world bundle')
    if (files.has(name)) throw new Error('Duplicate ZIP entry: ' + name)
    const externalAttributes = view.getUint32(offset + 38, true)
    const localOffset = view.getUint32(offset + 42, true)
    const unixMode = externalAttributes >>> 16
    if (creator === 3 && (unixMode & 0xf000) === 0xa000) {
      throw new Error('Symbolic links are not allowed in a world bundle')
    }
    if (uncompressedSize > MAX_ENTRY_BYTES) throw new Error('Bundle entry exceeds the size limit: ' + name)
    totalSize += uncompressedSize
    if (totalSize > MAX_TOTAL_BYTES) throw new Error('Bundle expands beyond the total size limit')
    if (uncompressedSize > 0 && compressedSize === 0) throw new Error('Invalid ZIP compression size')
    if (compressedSize > 0 && uncompressedSize / compressedSize > 1000) {
      throw new Error('Bundle entry compression ratio is too high: ' + name)
    }
    if (localOffset + 30 > centralOffset || view.getUint32(localOffset, true) !== 0x04034b50) {
      throw new Error('Invalid ZIP local file header: ' + name)
    }
    const localFlags = view.getUint16(localOffset + 6, true)
    const localMethod = view.getUint16(localOffset + 8, true)
    const localCompressedSize = view.getUint32(localOffset + 18, true)
    const localUncompressedSize = view.getUint32(localOffset + 22, true)
    const localNameLength = view.getUint16(localOffset + 26, true)
    const localExtraLength = view.getUint16(localOffset + 28, true)
    const localNameStart = localOffset + 30
    const localNameEnd = localNameStart + localNameLength
    const dataStart = localNameEnd + localExtraLength
    const dataEnd = dataStart + compressedSize
    if (
      localFlags !== flags ||
      localMethod !== method ||
      localNameEnd > centralOffset ||
      dataEnd > centralOffset ||
      localCompressedSize !== compressedSize ||
      localUncompressedSize !== uncompressedSize ||
      decoder.decode(bytes.subarray(localNameStart, localNameEnd)) !== name
    ) {
      throw new Error('ZIP local and central headers disagree: ' + name)
    }
    localRanges.push([localOffset, dataEnd, name])
    files.set(name, { size: uncompressedSize, compressedSize, method })
    offset = end + extraLength + commentLength
  }
  if (offset !== centralOffset + centralSize) throw new Error('Invalid ZIP central directory size')
  localRanges.sort((left, right) => left[0] - right[0])
  for (let index = 1; index < localRanges.length; index++) {
    if (localRanges[index][0] < localRanges[index - 1][1]) {
      throw new Error('Overlapping ZIP local entries: ' + localRanges[index - 1][2] + ' and ' + localRanges[index][2])
    }
  }
  return files
}

function addFile(entries, name, bytes) {
  safeEntryName(name)
  if (entries.has(name)) throw new Error('Duplicate generated bundle path: ' + name)
  const data = Buffer.from(bytes)
  if (!data.byteLength || data.byteLength > MAX_ENTRY_BYTES) {
    throw new Error('Invalid bundle file size: ' + name)
  }
  entries.set(name, data)
}

export function buildWorldBundle(compiled, { includeHyp = false, allowExternal = false } = {}) {
  const externalDependencies = (compiled.warnings || []).filter(warning => warning.code === 'external-asset')
  if (externalDependencies.length && !allowExternal) {
    throw new Error(
      'External asset references prevent a portable bundle; use --allow-external to mark the bundle nonportable'
    )
  }
  const entries = new Map()
  addFile(entries, 'scene.json', stableJson(compiled.scene))
  addFile(entries, 'settings.json', stableJson(compiled.settings))
  const index = {}
  for (const object of compiled.objects) {
    const blueprintPath = 'objects/' + object.key + '/blueprint.json'
    addFile(entries, blueprintPath, stableJson(object.blueprint))
    index[object.key] = {
      role: object.role,
      mode: object.mode,
      blueprint: blueprintPath,
      assets: object.assets
        .map(asset => ({ url: asset.url, types: [...(asset.types || [asset.type])].sort(compareText) }))
        .sort((left, right) => compareText(left.url, right.url)),
      semanticFingerprint: object.semanticFingerprint,
      sourceFingerprint: object.sourceFingerprint,
    }
    if (includeHyp) {
      const packageBytes = packHyp(object.blueprint, object.assets)
      addFile(entries, 'packages/' + object.key + '.hyp', packageBytes)
    }
  }
  for (const asset of compiled.assets) {
    addFile(entries, 'assets/' + asset.sha256 + '.' + asset.extension, asset.bytes)
  }
  addFile(entries, 'objects/index.json', stableJson(index))
  const payloads = [...entries.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .map(([name, bytes]) => ({ path: name, sha256: sha256(bytes), size: bytes.byteLength }))
  const manifest = {
    format: FORMAT,
    schemaVersion: 1,
    toolVersion: TOOL_VERSION,
    engineCompatibility: { engine: 'Hyperfy', version: '0.16.0' },
    sceneKey: compiled.scene.sceneKey,
    portability: {
      isPortable: externalDependencies.length === 0,
      externalDependencies: externalDependencies.map(({ path }) => ({ path })),
    },
    payloads,
  }
  entries.set('bundle.json', Buffer.from(stableJson(manifest)))
  const archiveInput = {}
  const timestamp = new Date(1980, 0, 1, 0, 0, 0)
  for (const [name, bytes] of [...entries.entries()].sort(([left], [right]) => compareText(left, right))) {
    archiveInput[name] = [new Uint8Array(bytes), { mtime: timestamp }]
  }
  const bundle = zipSync(archiveInput, { level: 9 })
  if (bundle.byteLength > MAX_BUNDLE_BYTES) throw new Error('Generated bundle exceeds the size limit')
  return Buffer.from(bundle)
}

export function verifyWorldBundle(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value)
  const directory = inspectZip(bytes)
  const unpacked = unzipSync(bytes)
  for (const [name, expected] of directory) {
    const actual = unpacked[name]
    if (!actual || actual.byteLength !== expected.size) throw new Error('ZIP entry size mismatch: ' + name)
  }
  for (const name of Object.keys(unpacked)) {
    if (!directory.has(name)) throw new Error('Unexpected ZIP entry: ' + name)
  }
  const manifestBytes = unpacked['bundle.json']
  if (!manifestBytes) throw new Error('Bundle is missing bundle.json')
  if (manifestBytes.byteLength > 4 * 1024 * 1024) throw new Error('bundle.json exceeds the size limit')
  let manifest
  try {
    manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(manifestBytes))
  } catch (error) {
    throw new Error('Invalid bundle.json: ' + error.message)
  }
  if (
    manifest?.format !== FORMAT ||
    manifest.schemaVersion !== 1 ||
    typeof manifest.toolVersion !== 'string' ||
    typeof manifest.sceneKey !== 'string' ||
    manifest.engineCompatibility?.engine !== 'Hyperfy' ||
    typeof manifest.engineCompatibility.version !== 'string' ||
    typeof manifest.portability?.isPortable !== 'boolean' ||
    !Array.isArray(manifest.portability.externalDependencies) ||
    !Array.isArray(manifest.payloads)
  ) {
    throw new Error('Unsupported world bundle manifest')
  }
  if (
    manifest.portability.externalDependencies.some(
      dependency => !dependency || typeof dependency.path !== 'string'
    ) ||
    manifest.portability.isPortable !== (manifest.portability.externalDependencies.length === 0)
  ) {
    throw new Error('Invalid world bundle portability metadata')
  }
  const listed = new Set(['bundle.json'])
  for (const item of manifest.payloads) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.path !== 'string' ||
      !/^[a-f0-9]{64}$/.test(item.sha256) ||
      !Number.isSafeInteger(item.size) ||
      item.size <= 0
    ) {
      throw new Error('Invalid bundle payload entry')
    }
    const name = safeEntryName(item.path)
    if (listed.has(name)) throw new Error('Duplicate bundle manifest path: ' + name)
    listed.add(name)
    const payload = unpacked[name]
    if (!payload) throw new Error('Bundle payload is missing: ' + name)
    if (payload.byteLength !== item.size || sha256(payload) !== item.sha256) {
      throw new Error('Bundle payload integrity check failed: ' + name)
    }
  }
  for (const name of Object.keys(unpacked)) {
    if (!listed.has(name)) throw new Error('Unlisted bundle payload: ' + name)
  }
  for (const required of ['scene.json', 'settings.json', 'objects/index.json']) {
    if (!unpacked[required]) throw new Error('Bundle is missing ' + required)
  }
  return {
    manifest,
    fileCount: directory.size,
    totalBytes: [...directory.values()].reduce((sum, entry) => sum + entry.size, 0),
  }
}

export async function verifyWorldBundleFile(filePath) {
  const bytes = await fs.readFile(filePath)
  return verifyWorldBundle(bytes)
}
