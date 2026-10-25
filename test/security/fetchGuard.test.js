// Adapted from https://github.com/dwebxr/coo-world/blob/66d5ff94742886ae8034661e870af681dbf57749/test/fetchGuard.test.js
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import zlib from 'node:zlib'
import { BrotliRefusedError, encodingsOf, installFetchBrotliGuard, withoutBrotli } from '../../src/server/fetchGuard.js'

// node --test runs each file in its own process, so installing the guard here affects only this file
const LEGACY_DISPATCHER = Symbol.for('undici.globalDispatcher.1')
const DISPATCHER = Symbol.for('undici.globalDispatcher.2')
const decoders = { br: 0 }
const original = zlib.createBrotliDecompress
let server
let base
const seen = []

before(async () => {
  // a spy that undici calls at decode time (the export is read-only, so redefine it), set before any fetch
  Object.defineProperty(zlib, 'createBrotliDecompress', {
    configurable: true,
    value: (...args) => {
      decoders.br++
      return original(...args)
    },
  })
  installFetchBrotliGuard()
  server = http.createServer((req, res) => {
    seen.push({ url: req.url, acceptEncoding: req.headers['accept-encoding'] })
    const send = (headers, body) => {
      res.writeHead(200, headers)
      res.end(body)
    }
    switch (req.url) {
      case '/br':
        return send({ 'content-encoding': 'br' }, zlib.brotliCompressSync('hello-br'))
      case '/BR':
        return send({ 'content-encoding': 'BR' }, zlib.brotliCompressSync('hello-br'))
      case '/gzip-br':
        return send({ 'content-encoding': 'gzip, br' }, zlib.brotliCompressSync(zlib.gzipSync('x')))
      case '/two-lines':
        res.writeHead(200, [
          ['content-encoding', 'gzip'],
          ['content-encoding', 'br'],
        ])
        return res.end(zlib.brotliCompressSync(zlib.gzipSync('x')))
      case '/gzip':
        return send({ 'content-encoding': 'gzip' }, zlib.gzipSync('hello-gzip'))
      case '/deflate':
        return send({ 'content-encoding': 'deflate' }, zlib.deflateSync('hello-deflate'))
      case '/plain':
        return send({}, 'hello-plain')
      case '/big-gzip':
        return send({ 'content-encoding': 'gzip' }, zlib.gzipSync(Buffer.alloc(4 * 1024 * 1024, 7)))
      case '/to-br':
        res.writeHead(302, { location: '/br' })
        return res.end()
      case '/to-gzip':
        res.writeHead(302, { location: '/gzip' })
        return res.end()
      default:
        res.writeHead(404)
        return res.end()
    }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  Object.defineProperty(zlib, 'createBrotliDecompress', { configurable: true, value: original })
  await new Promise(resolve => server.close(resolve))
})

const refused = async path => {
  const before = decoders.br
  const err = await fetch(base + path).then(
    () => null,
    e => e
  )
  assert.ok(err instanceof TypeError, `${path}: fetch rejects`)
  assert.ok(err.cause instanceof BrotliRefusedError, `${path}: cause is BrotliRefusedError (${err.cause})`)
  assert.equal(decoders.br, before, `${path}: no Brotli decoder was created`)
}

test('fetch guard: pure helpers', () => {
  assert.equal(withoutBrotli(undefined), 'gzip, deflate')
  assert.equal(withoutBrotli('br, gzip, deflate'), 'gzip, deflate')
  assert.equal(withoutBrotli('BR;q=1, gzip'), 'gzip')
  assert.equal(withoutBrotli('br'), 'identity')
  assert.equal(withoutBrotli('*'), 'identity')
  assert.equal(withoutBrotli('identity'), 'identity')
  assert.equal(withoutBrotli('gzip;q=0.5, br;q=1, *;q=0.1'), 'gzip;q=0.5')
  assert.deepEqual(encodingsOf([Buffer.from('Content-Encoding'), Buffer.from('gzip, BR')]), ['gzip', 'br'])
  assert.deepEqual(encodingsOf(['content-encoding', 'gzip', 'x-other', 'br', 'CONTENT-ENCODING', 'br']), ['gzip', 'br'])
  assert.deepEqual(encodingsOf({ 'Content-Encoding': ['gzip', 'BR'], 'x-other': 'br' }), ['gzip', 'br'])
  assert.deepEqual(encodingsOf(null), [])
})

test('fetch guard: Brotli responses are refused before any decoder exists', async () => {
  for (const path of ['/br', '/BR', '/gzip-br', '/two-lines', '/to-br']) await refused(path)
})

test('fetch guard: the legacy dispatcher also refuses Brotli on newer Node releases', async () => {
  const before = decoders.br
  const error = await new Promise((resolve, reject) => {
    globalThis[LEGACY_DISPATCHER].dispatch(
      { origin: base, path: '/br', method: 'GET' },
      {
        onConnect() {},
        onHeaders() {
          reject(new Error('legacy dispatcher forwarded Brotli headers'))
        },
        onData() {},
        onComplete() {
          reject(new Error('legacy dispatcher completed a Brotli response'))
        },
        onError: resolve,
      }
    )
  })
  assert.ok(error instanceof BrotliRefusedError)
  assert.equal(decoders.br, before)
})

test('fetch guard: gzip, deflate, plain and redirected responses still decode', async () => {
  assert.equal(await (await fetch(base + '/gzip')).text(), 'hello-gzip')
  assert.equal(await (await fetch(base + '/deflate')).text(), 'hello-deflate')
  assert.equal(await (await fetch(base + '/plain')).text(), 'hello-plain')
  assert.equal(await (await fetch(base + '/to-gzip')).text(), 'hello-gzip')
  // a large streamed body arrives intact (onData / onComplete forwarding)
  const big = Buffer.from(await (await fetch(base + '/big-gzip')).arrayBuffer())
  assert.equal(big.length, 4 * 1024 * 1024)
  assert.ok(big.every(b => b === 7))
  assert.equal(decoders.br, 0)
})

test('fetch guard: requests never advertise Brotli; Range keeps identity', async () => {
  seen.length = 0
  await (await fetch(base + '/plain')).text()
  await (await fetch(base + '/plain', { headers: { 'Accept-Encoding': 'br' } })).text()
  await (await fetch(base + '/plain', { headers: { 'ACCEPT-ENCODING': 'br, gzip' } })).text()
  await (await fetch(base + '/plain', { headers: { range: 'bytes=0-3' } })).text()
  assert.deepEqual(
    seen.map(s => s.acceptEncoding),
    ['gzip, deflate', 'identity', 'gzip', 'identity']
  )
})

test('fetch guard: installing twice keeps a single wrapper', () => {
  const first = globalThis[DISPATCHER] ?? globalThis[LEGACY_DISPATCHER]
  const legacy = globalThis[LEGACY_DISPATCHER]
  assert.equal(installFetchBrotliGuard(), first)
  assert.equal(globalThis[DISPATCHER] ?? globalThis[LEGACY_DISPATCHER], first)
  assert.equal(globalThis[LEGACY_DISPATCHER], legacy)
  assert.ok(Object.isFrozen(first))
})

test('fetch guard: handler callbacks are forwarded with their receiver, arguments and return value', () => {
  const calls = []
  const fakeInner = {
    dispatch(opts, handler) {
      fakeInner.last = { opts, handler }
      return true
    },
    close() {},
    destroy() {},
  }
  const fake = { Headers: class {}, [LEGACY_DISPATCHER]: fakeInner }
  const wrapper = installFetchBrotliGuard(fake)
  const handler = {
    onConnect(...a) {
      calls.push(['onConnect', this === handler, a])
    },
    onRequestSent(...a) {
      calls.push(['onRequestSent', this === handler, a])
      return 'sent'
    },
    onBodySent(...a) {
      calls.push(['onBodySent', this === handler, a])
    },
    onHeaders() {
      return 'headers'
    },
  }
  assert.equal(wrapper.dispatch({ headers: { Accept: '*/*' } }, handler), true)
  const guarded = fakeInner.last.handler
  assert.deepEqual(fakeInner.last.opts.headers, { Accept: '*/*', 'accept-encoding': 'gzip, deflate' })
  guarded.onConnect('abort')
  assert.equal(guarded.onRequestSent(1, 2), 'sent')
  guarded.onBodySent('chunk')
  assert.equal(guarded.onHeaders(200, ['content-type', 'text/plain'], null, 'OK'), 'headers')
  assert.throws(() => guarded.onHeaders(200, ['content-encoding', 'br'], null, 'OK'), BrotliRefusedError)
  assert.deepEqual(calls, [
    ['onConnect', true, ['abort']],
    ['onRequestSent', true, [1, 2]],
    ['onBodySent', true, ['chunk']],
  ])
  // methods the handler lacks stay absent (undici validates optional callbacks when present)
  assert.equal('onUpgrade' in guarded, false)
  assert.equal('onData' in guarded, false)
})

test('fetch guard: modern response callbacks refuse Brotli before forwarding and retain their receiver', () => {
  let guarded
  const inner = {
    dispatch(opts, handler) {
      guarded = handler
      return true
    },
  }
  const fake = { Headers: class {}, [DISPATCHER]: inner }
  const wrapper = installFetchBrotliGuard(fake)
  const controller = {}
  const calls = []
  const handler = {
    onRequestStart(...args) {
      calls.push(['start', this === handler, args])
    },
    onResponseStart(...args) {
      calls.push(['headers', this === handler, args])
      return 'headers'
    },
    onResponseData(...args) {
      calls.push(['data', this === handler, args])
    },
    onResponseEnd(...args) {
      calls.push(['end', this === handler, args])
    },
    onResponseError(...args) {
      calls.push(['error', this === handler, args])
    },
  }
  assert.equal(wrapper.dispatch({}, handler), true)
  guarded.onRequestStart(controller, 'context')
  const headers = { 'content-type': 'text/plain' }
  assert.equal(guarded.onResponseStart(controller, 200, headers, 'OK'), 'headers')
  assert.throws(
    () => guarded.onResponseStart(controller, 200, { 'content-encoding': ['gzip', 'br'] }, 'OK'),
    BrotliRefusedError
  )
  guarded.onResponseData(controller, 'chunk')
  guarded.onResponseEnd(controller, {})
  guarded.onResponseError(controller, 'error')
  assert.deepEqual(calls, [
    ['start', true, [controller, 'context']],
    ['headers', true, [controller, 200, headers, 'OK']],
    ['data', true, [controller, 'chunk']],
    ['end', true, [controller, {}]],
    ['error', true, [controller, 'error']],
  ])
})
