// Adapted from https://github.com/dwebxr/coo-world/blob/66d5ff94742886ae8034661e870af681dbf57749/test/fetchGuardControl.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import zlib from 'node:zlib'

// Control for fetchGuard.test.js, in its own process without the guard: the same Brotli response is decoded
// and the same spy counts it, so the guard test's zero is meaningful.
test('fetch guard control: without the guard, a Brotli response is decoded', async t => {
  let decoders = 0
  const original = zlib.createBrotliDecompress
  Object.defineProperty(zlib, 'createBrotliDecompress', {
    configurable: true,
    value: (...args) => {
      decoders++
      return original(...args)
    },
  })
  t.after(() => Object.defineProperty(zlib, 'createBrotliDecompress', { configurable: true, value: original }))
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-encoding': 'br' })
    res.end(zlib.brotliCompressSync('hello-br'))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const text = await (await fetch(`http://127.0.0.1:${server.address().port}/`)).text()
  assert.equal(text, 'hello-br')
  assert.equal(decoders, 1)
})
