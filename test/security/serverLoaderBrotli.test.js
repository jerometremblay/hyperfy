// Adapted from https://github.com/dwebxr/coo-world/blob/66d5ff94742886ae8034661e870af681dbf57749/test/serverLoaderBrotli.test.js
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import zlib from 'node:zlib'
import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'
import { loadClient } from './lib/clientHarness.mjs'
import { GLTFLoader } from '../../src/core/libs/gltfloader/GLTFLoader.js'
import { installFetchBrotliGuard } from '../../src/server/fetchGuard.js'

// A model whose external buffer comes back Brotli-encoded must fail its load (not hang): the guard refuses the
// buffer and ServerLoader passes parse errors to reject. Runs in its own process with the guard installed.
// (Pre-existing and out of scope: an external buffer that is not refused cannot load on the server either,
// because three's FileLoader reports progress with ProgressEvent, which Node lacks, and throws outside parse.)
const unhandled = []
const requested = []
const decoders = { br: 0 }
const original = zlib.createBrotliDecompress
let server
let base
let dir

// one triangle: 3 float32 vec3 positions
const triangle = Buffer.from(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer)
const gltf = uri =>
  JSON.stringify({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] }],
    bufferViews: [{ buffer: 0, byteLength: 36 }],
    buffers: [{ uri, byteLength: 36 }],
  })

function loader() {
  const ServerLoader = loadClient('core/systems/ServerLoader.js', 'ServerLoader', {
    fs,
    path,
    HDRLoader: class {},
    GLTFLoader,
    System: class {
      constructor(world) {
        this.world = world
      }
    },
    createVRMFactory: () => ({}),
    glbToNodes: () => ({ clone: () => ({ cloned: true }) }),
    createNode: () => ({}),
    createEmoteFactory: () => ({ toClip: () => null }),
  })
  return new ServerLoader({ resolveURL: url => url })
}

const settle = (promise, ms) =>
  Promise.race([
    promise.then(
      value => ({ status: 'resolved', value }),
      error => ({ status: 'rejected', error })
    ),
    new Promise(resolve => setTimeout(() => resolve({ status: 'pending' }), ms)),
  ])

before(async () => {
  process.on('unhandledRejection', err => unhandled.push(err))
  Object.defineProperty(zlib, 'createBrotliDecompress', {
    configurable: true,
    value: (...args) => {
      decoders.br++
      return original(...args)
    },
  })
  installFetchBrotliGuard()
  server = http.createServer((req, res) => {
    requested.push(req.url)
    if (req.url === '/buffer-br.bin') {
      res.writeHead(200, { 'content-encoding': 'br' })
      return res.end(zlib.brotliCompressSync(triangle))
    }
    res.writeHead(404)
    res.end()
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'loader-br-'))
  await fs.writeFile(path.join(dir, 'br.gltf'), gltf(`${base}/buffer-br.bin`))
})

after(async () => {
  Object.defineProperty(zlib, 'createBrotliDecompress', { configurable: true, value: original })
  await new Promise(resolve => server.close(resolve))
  await fs.remove(dir)
})

test('server loader: a model whose external buffer is Brotli-encoded fails its load', async () => {
  const result = await settle(loader().load('model', path.join(dir, 'br.gltf')), 5000)
  assert.equal(result.status, 'rejected', 'the load settles instead of hanging')
  assert.deepEqual(requested, ['/buffer-br.bin'], 'the external buffer was requested')
  // the rejection is the refused buffer, not some earlier failure (GLTFLoader replaces the fetch error, so the
  // Brotli cause itself is asserted in fetchGuard.test.js)
  assert.match(String(result.error), /Failed to load buffer ".*\/buffer-br\.bin"/)
  assert.equal(decoders.br, 0)
  await new Promise(resolve => setTimeout(resolve, 50))
  assert.deepEqual(unhandled, [])
})
