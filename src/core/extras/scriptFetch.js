// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/scriptFetch.js
// The fetch() handed to app scripts: a whitelisted request init and a response object that exposes
// plain values only. Body reads resolve to intrinsics or a script-safe blob, and any failure reaches
// the script as an intrinsic error.

import { createScriptBlob, isScriptBlob, toHostBlob } from './scriptBlob.js'
import { toScriptError } from './scriptValues.js'

const STRING_OPTIONS = ['method', 'mode', 'credentials', 'cache', 'redirect']

// every script property is read exactly once (a getter may answer differently on a second read)
function read(object, key) {
  try {
    return object[key]
  } catch {
    return undefined
  }
}

// only these keys of a script's options reach the host fetch; headers are copied as a string map and
// a body may be a string, an ArrayBuffer, a typed array/DataView, or a blob returned by fetch()
export function toHostFetchOptions(options) {
  const init = {}
  if (!options || typeof options !== 'object') return init
  for (const key of STRING_OPTIONS) {
    const value = read(options, key)
    if (typeof value === 'string') init[key] = value
  }
  const headers = read(options, 'headers')
  if (headers && typeof headers === 'object') {
    init.headers = {}
    let names = []
    try {
      names = Object.keys(headers)
    } catch {
      // a Proxy whose ownKeys trap throws contributes no headers
    }
    for (const name of names) {
      const value = read(headers, name)
      if (typeof value === 'string') init.headers[name] = value
    }
  }
  const body = read(options, 'body')
  if (typeof body === 'string') {
    init.body = body
  } else if (isScriptBlob(body)) {
    init.body = toHostBlob(body)
  } else {
    const bytes = copyBytes(body)
    if (bytes) init.body = bytes
  }
  return init
}

const TypedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype)
const viewGetters = [TypedArrayPrototype, DataView.prototype].map(proto => ({
  buffer: Object.getOwnPropertyDescriptor(proto, 'buffer').get,
  byteOffset: Object.getOwnPropertyDescriptor(proto, 'byteOffset').get,
  byteLength: Object.getOwnPropertyDescriptor(proto, 'byteLength').get,
}))

// a brand-checked copy of a script's ArrayBuffer or view: the intrinsic slice/getters throw for anything
// that merely inherits from the prototypes, and own properties a script added to a view are never read
function copyBytes(value) {
  if (value === null || typeof value !== 'object') return null
  try {
    return ArrayBuffer.prototype.slice.call(value, 0)
  } catch {
    // not an ArrayBuffer
  }
  if (!ArrayBuffer.isView(value)) return null
  for (const getters of viewGetters) {
    try {
      const offset = getters.byteOffset.call(value)
      const length = getters.byteLength.call(value)
      return ArrayBuffer.prototype.slice.call(getters.buffer.call(value), offset, offset + length)
    } catch {
      // the other kind of view, or a detached/shared buffer
    }
  }
  return null
}

async function guarded(fn) {
  try {
    return await fn()
  } catch (err) {
    throw toScriptError(err)
  }
}

export function createScriptResponse(resp) {
  return {
    ok: resp.ok,
    status: resp.status,
    statusText: resp.statusText,
    headers: Object.fromEntries(resp.headers.entries()),
    json: () => guarded(() => resp.json()),
    text: () => guarded(() => resp.text()),
    blob: () => guarded(async () => createScriptBlob(await resp.blob())),
    arrayBuffer: () => guarded(() => resp.arrayBuffer()),
  }
}
