// Adapted from https://github.com/dwebxr/coo-world/blob/f40fb416e19909b1a22e5807d18be587b6d8b871/test/errorHandler.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import Fastify from 'fastify'
import compress from '@fastify/compress'
import statics from '@fastify/static'
import { compressOptions } from '../../src/server/compressOptions.js'
import { errorHandler, loggedPath } from '../../src/server/errorHandler.js'

// the same wiring as src/server/index.js: compress, a public static tree at '/', the root error handler
async function server(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'error-handler-'))
  fs.writeFileSync(path.join(root, 'index.css'), 'body{}')
  // a directory that can be traversed but not listed: static 10's spelling check cannot read it
  fs.mkdirSync(path.join(root, 'locked'))
  fs.writeFileSync(path.join(root, 'locked', 'a.css'), 'a{}')
  fs.chmodSync(path.join(root, 'locked'), 0o311)
  const fastify = Fastify()
  await fastify.register(compress, compressOptions())
  fastify.register(statics, { root, prefix: '/', decorateReply: false })
  fastify.post('/echo', async request => ({ body: request.body }))
  fastify.get('/boom', async () => {
    throw new Error('boom')
  })
  fastify.get('/teapot', async () => {
    throw Object.assign(new Error('server-side 503'), { statusCode: 503 })
  })
  fastify.setErrorHandler(errorHandler)
  await fastify.listen({ port: 0, host: '127.0.0.1' })
  const logged = []
  const original = console.error
  console.error = (...args) => logged.push(args)
  t.after(async () => {
    console.error = original
    await fastify.close()
    fs.chmodSync(path.join(root, 'locked'), 0o755)
    fs.rmSync(root, { recursive: true, force: true })
  })
  return { fastify, logged, port: fastify.server.address().port }
}

// a raw request: inject() parses the URL first, which collapses `/./` and `/../` before the server sees them
const raw = (port, rawPath, headers = {}) =>
  new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: rawPath, headers }, res => {
      let body = ''
      res.on('data', chunk => (body += chunk))
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }))
    })
    req.on('error', reject)
    req.end()
  })

test('errorHandler: client errors keep their 4xx status and log one line without a stack', async t => {
  const { fastify, logged, port } = await server(t)
  assert.equal((await raw(port, '/index.css')).statusCode, 200)
  // @fastify/static 10 refuses non-canonical paths with 403
  for (const url of ['//index.css', '/./index.css', '/x/../index.css?authToken=secret-token']) {
    const r = await raw(port, url)
    assert.equal(r.statusCode, 403, url)
    assert.equal(typeof JSON.parse(r.body).error, 'string', url)
  }
  const json = { method: 'POST', url: '/echo', headers: { 'content-type': 'application/json' } }
  assert.equal((await fastify.inject({ ...json, payload: '{"broken"' })).statusCode, 400)
  const br = { ...json, headers: { ...json.headers, 'content-encoding': 'br' }, payload: '{}' }
  assert.equal((await fastify.inject(br)).statusCode, 415)
  // the query string never reaches the log
  assert.deepEqual(
    logged.map(args => args.join(' ')),
    [
      '[http] 403 GET //index.css',
      '[http] 403 GET /./index.css',
      '[http] 403 GET /x/../index.css',
      '[http] 400 POST /echo',
      '[http] 415 POST /echo',
    ]
  )
})

test('errorHandler: an absolute-form target logs its path only, never its credentials or query', async t => {
  const { logged, port } = await server(t)
  const r = await raw(port, 'http://alice:secret@127.0.0.1/x/../index.css?authToken=hidden')
  assert.equal(r.statusCode, 403)
  assert.deepEqual(
    logged.map(args => args.join(' ')),
    ['[http] 403 GET /x/../index.css']
  )
})

test('loggedPath: keeps the spelling of the path and drops everything else', () => {
  assert.equal(loggedPath('//index.css?authToken=t'), '//index.css')
  assert.equal(loggedPath('/./a#frag'), '/./a')
  assert.equal(loggedPath('HTTPS://u:p@host:8080//a/./b?q'), '//a/./b')
  assert.equal(loggedPath('http://u:p@host?authToken=t'), '/')
  assert.equal(loggedPath('http://u:p@host'), '/')
  assert.equal(loggedPath('*'), '-')
  assert.equal(loggedPath('host:443'), '-')
  assert.equal(loggedPath(undefined), '-')
  assert.equal(loggedPath('/' + 'a'.repeat(500)).length, 200)
})

test('errorHandler: a 416 keeps the Content-Range header the error carries', async t => {
  const { port } = await server(t)
  const r = await raw(port, '/index.css', { range: 'bytes=999999-' })
  assert.equal(r.statusCode, 416)
  assert.equal(r.headers['content-range'], 'bytes */6')
})

test(
  'errorHandler: an unreadable static directory surfaces as a logged 403',
  { skip: process.getuid?.() === 0 },
  async t => {
    // static 10 answers 403 with the cause discarded when its spelling check cannot list a directory, so the
    // one-line log is what shows a storage fault (EIO, EMFILE or, here, EACCES) on an ordinary path
    const { logged, port } = await server(t)
    assert.equal((await raw(port, '/locked/a.css')).statusCode, 403)
    assert.deepEqual(
      logged.map(args => args.join(' ')),
      ['[http] 403 GET /locked/a.css']
    )
  }
)

test('errorHandler: server errors keep the generic JSON response and log their stack', async t => {
  const { fastify, logged } = await server(t)
  for (const url of ['/boom', '/teapot']) {
    const r = await fastify.inject(url)
    assert.equal(r.statusCode, 500, url)
    assert.equal(typeof JSON.parse(r.body).error, 'string', url)
  }
  assert.deepEqual(
    logged.map(([err]) => err.message),
    ['boom', 'server-side 503']
  )
})
