// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/scriptBlob.js
// Script-safe blobs.
//
// fetch().blob() hands scripts a frozen facade over the bytes instead of a host Blob, so no Web API
// prototype (Blob, ReadableStream, ...) is reachable from a script. The host side of a facade (bytes and
// the type the host saw on the response) lives in a module-private WeakMap, which is also how
// URL.createObjectURL tells a facade from any other object a script may pass.

import { toScriptError } from './scriptValues.js'

// object URLs minted for scripts only ever carry one of these types; anything else is served as opaque bytes
const SAFE_BLOB_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/ktx2',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/mp4',
  'audio/aac',
  'audio/flac',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'model/gltf-binary',
  'model/gltf+json',
])
const OPAQUE_TYPE = 'application/octet-stream'

const facades = new WeakMap() // facade -> { buffer, type }

export function safeBlobType(type) {
  const essence = String(type ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase()
  return SAFE_BLOB_TYPES.has(essence) ? essence : OPAQUE_TYPE
}

// the whole body is read once, up front; the facade keeps that copy for its lifetime
export async function createScriptBlob(hostBlob) {
  let buffer
  try {
    buffer = await hostBlob.arrayBuffer()
  } catch (err) {
    throw toScriptError(err)
  }
  const type = typeof hostBlob.type === 'string' ? hostBlob.type : ''
  return createFacade(buffer, type)
}

// Blob.slice() index rules: negative values count from the end, everything is clamped to the size
function clampIndex(value, size, fallback) {
  if (value === undefined) return fallback
  const n = Math.trunc(Number(value)) || 0
  return n < 0 ? Math.max(size + n, 0) : Math.min(n, size)
}

function createFacade(buffer, type) {
  const size = buffer.byteLength
  const facade = {
    size,
    type,
    arrayBuffer: async () => buffer.slice(0),
    text: async () => new TextDecoder().decode(buffer),
    // a script cannot choose the type of a slice; it keeps the type the host saw
    slice: (start, end) => {
      const from = clampIndex(start, size, 0)
      const to = Math.max(clampIndex(end, size, size), from)
      return createFacade(buffer.slice(from, to), type)
    },
  }
  facades.set(facade, { buffer, type })
  return Object.freeze(facade)
}

export function isScriptBlob(value) {
  return facades.has(value)
}

// a fresh host Blob with the facade's bytes and host type (request bodies)
export function toHostBlob(value) {
  const entry = facades.get(value)
  if (!entry) throw new TypeError('expected a blob returned by fetch()')
  return new Blob([entry.buffer], { type: entry.type })
}

// the URL.createObjectURL endowment: facades only, with the type forced through the allowlist
export function createScriptObjectURL(value) {
  const entry = facades.get(value)
  if (!entry) throw new TypeError('URL.createObjectURL expects a blob returned by fetch()')
  return URL.createObjectURL(new Blob([entry.buffer], { type: safeBlobType(entry.type) }))
}
