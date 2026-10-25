// Backported from https://github.com/dwebxr/coo-world/blob/66d5ff94742886ae8034661e870af681dbf57749/src/server/fetchGuard.js
// Server-side fetch never decodes Brotli (defence in depth for Brotli decoder flaws such as CVE-2026-111497).
//
// Builders' scripts and remote models make the server fetch URLs an attacker can choose, and Node's fetch
// (its bundled undici) decodes a `Content-Encoding: br` response whatever the request asked for. This wraps
// undici's global dispatcher so every request advertises no Brotli and any response that carries it is refused
// in the response-header callback, before fetch creates a decoder. Redirect hops dispatch again, so they are covered too.
//
// Only the global fetch is covered: a dependency with its own HTTP client would bypass this. This module has
// no side effects; fetchGuardInstall.js installs it.

// Node 26 uses dispatcher API 2; API 1 remains available for older Node/dependencies.
// https://github.com/nodejs/node/blob/v26.12.1/deps/undici/src/lib/global.js
const DISPATCHERS = [Symbol.for('undici.globalDispatcher.1'), Symbol.for('undici.globalDispatcher.2')]
const GUARDED = Symbol.for('coo-world.fetchBrotliGuard')

export class BrotliRefusedError extends Error {
  constructor() {
    super('Brotli-encoded responses are refused')
    this.name = 'BrotliRefusedError'
  }
}

const tokens = value =>
  String(value)
    .split(',')
    .map(part => part.split(';')[0].trim().toLowerCase())
    .filter(Boolean)

// an accept-encoding value without br (or the * wildcard, which lets a server choose br)
export function withoutBrotli(acceptEncoding) {
  if (acceptEncoding == null) return 'gzip, deflate'
  const kept = String(acceptEncoding)
    .split(',')
    .map(part => part.trim())
    .filter(part => {
      const token = part.split(';')[0].trim().toLowerCase()
      return token && token !== 'br' && token !== '*'
    })
  return kept.length ? kept.join(', ') : 'identity'
}

// Undici API 1 uses raw headers; API 2 also passes a parsed header object.
export function encodingsOf(rawHeaders) {
  const found = []
  if (!Array.isArray(rawHeaders)) {
    for (const [name, value] of Object.entries(rawHeaders ?? {})) {
      if (name.toLowerCase() === 'content-encoding') found.push(...tokens(value))
    }
    return found
  }
  for (let i = 0; i + 1 < rawHeaders.length; i += 2) {
    const name = rawHeaders[i]
    const text = typeof name === 'string' ? name : Buffer.isBuffer(name) ? name.toString('latin1') : ''
    if (text.toLowerCase() !== 'content-encoding') continue
    const value = rawHeaders[i + 1]
    found.push(...tokens(Buffer.isBuffer(value) ? value.toString('latin1') : value))
  }
  return found
}

function guardHeaders(headers) {
  if (Array.isArray(headers)) {
    const out = []
    let seen = false
    for (let i = 0; i + 1 < headers.length; i += 2) {
      if (String(headers[i]).toLowerCase() === 'accept-encoding') {
        if (!seen) out.push('accept-encoding', withoutBrotli(headers[i + 1]))
        seen = true
      } else {
        out.push(headers[i], headers[i + 1])
      }
    }
    if (!seen) out.push('accept-encoding', withoutBrotli(undefined))
    return out
  }
  if (headers && typeof headers === 'object') {
    const out = {}
    let current
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === 'accept-encoding') current = value
      else out[key] = value
    }
    out['accept-encoding'] = withoutBrotli(current)
    return out
  }
  if (headers == null) return { 'accept-encoding': withoutBrotli(undefined) }
  // an unknown shape is passed through; the response check still applies
  return headers
}

const FORWARDED = [
  'onConnect',
  'onError',
  'onUpgrade',
  'onResponseStarted',
  'onData',
  'onComplete',
  'onBodySent',
  'onRequestSent',
  'onRequestStart',
  'onRequestUpgrade',
  'onResponseData',
  'onResponseEnd',
  'onResponseError',
]

function guardHandler(handler) {
  const guarded = {}
  if (typeof handler.onHeaders === 'function') {
    guarded.onHeaders = (statusCode, rawHeaders, resume, statusText) => {
      // Request.onHeaders catches this and aborts the request; fetch then rejects with it as the cause
      if (encodingsOf(rawHeaders).includes('br')) throw new BrotliRefusedError()
      return handler.onHeaders(statusCode, rawHeaders, resume, statusText)
    }
  }
  if (typeof handler.onResponseStart === 'function') {
    guarded.onResponseStart = (controller, statusCode, headers, statusText) => {
      if (encodingsOf(controller?.rawHeaders ?? headers).includes('br')) throw new BrotliRefusedError()
      return handler.onResponseStart(controller, statusCode, headers, statusText)
    }
  }
  for (const name of FORWARDED) {
    if (typeof handler[name] === 'function') guarded[name] = (...args) => handler[name](...args)
  }
  return guarded
}

export function installFetchBrotliGuard(global = globalThis) {
  // touching Headers loads Node's bundled undici, which creates the global dispatcher
  void global.Headers
  let installed
  for (const key of DISPATCHERS) {
    const inner = global[key]
    if (!inner) continue
    if (typeof inner.dispatch !== 'function') {
      throw new Error('[fetch] cannot install the Brotli guard: invalid undici global dispatcher')
    }
    if (inner[GUARDED]) {
      installed = inner
      continue
    }
    const wrapper = Object.freeze({
      [GUARDED]: true,
      dispatch(opts, handler) {
        return inner.dispatch({ ...opts, headers: guardHeaders(opts?.headers) }, guardHandler(handler))
      },
      close(...args) {
        return inner.close(...args)
      },
      destroy(...args) {
        return inner.destroy(...args)
      },
    })
    global[key] = installed = wrapper
  }
  if (!installed) throw new Error('[fetch] cannot install the Brotli guard: no undici global dispatcher')
  return installed
}
