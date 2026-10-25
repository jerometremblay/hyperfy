import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { GLTFLoader } from '../../src/core/libs/gltfloader/GLTFLoader.js'
import { loadClient } from './lib/clientHarness.mjs'

const globals = new Map(
  ['self', 'window', 'document'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
)
const ServerLoader = loadClient('core/systems/ServerLoader.js', 'ServerLoader', {
  fs,
  path,
  HDRLoader,
  GLTFLoader,
  glbToNodes: glb => ({ clone: () => glb.scene.clone(true) }),
})
after(() => {
  for (const [name, descriptor] of globals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor)
    else delete globalThis[name]
  }
})

function texturedGLB(extension) {
  const positions = Buffer.from(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer)
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1cAAAAASUVORK5CYII=',
    'base64'
  )
  const binary = Buffer.concat([positions, png])
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, translation: [2, 3, 4] }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] }],
    bufferViews: [
      { buffer: 0, byteLength: positions.length },
      { buffer: 0, byteOffset: positions.length, byteLength: png.length },
    ],
    buffers: [{ byteLength: binary.length }],
    images: [{ bufferView: 1, mimeType: 'image/png' }],
    textures: [extension ? { extensions: { [extension]: { source: 0 } } } : { source: 0 }],
    materials: [
      {
        alphaMode: 'BLEND',
        pbrMetallicRoughness: { baseColorFactor: [1, 0.5, 0.25, 0.5], baseColorTexture: { index: 0 } },
      },
    ],
    ...(extension ? { extensionsUsed: [extension], extensionsRequired: [extension] } : {}),
  }
  const raw = Buffer.from(JSON.stringify(json))
  const jsonChunk = Buffer.concat([raw, Buffer.alloc((4 - (raw.length % 4)) % 4, 32)])
  const binChunk = Buffer.concat([binary, Buffer.alloc((4 - (binary.length % 4)) % 4)])
  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546c67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8)
  const jsonHeader = Buffer.alloc(8)
  jsonHeader.writeUInt32LE(jsonChunk.length, 0)
  jsonHeader.writeUInt32LE(0x4e4f534a, 4)
  const binHeader = Buffer.alloc(8)
  binHeader.writeUInt32LE(binChunk.length, 0)
  binHeader.writeUInt32LE(0x004e4942, 4)
  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk])
}

for (const extension of [null, 'EXT_texture_webp', 'EXT_texture_avif', 'KHR_texture_basisu']) {
  test(`server loader preserves geometry/materials without decoding ${extension || 'PNG'} textures`, async t => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'server-textures-'))
    t.after(() => fs.remove(directory))
    const file = path.join(directory, 'textured.glb')
    await fs.writeFile(file, texturedGLB(extension))
    const loader = new ServerLoader({ resolveURL: value => value })
    const createObjectURL = URL.createObjectURL
    const errors = []
    const error = console.error
    let blobs = 0
    URL.createObjectURL = (...args) => {
      blobs++
      return createObjectURL(...args)
    }
    console.error = (...args) => errors.push(args)
    t.after(() => {
      URL.createObjectURL = createObjectURL
      console.error = error
    })
    const model = await loader.load('model', file)
    const mesh = model.toNodes().children[0]
    assert.equal(mesh.geometry.attributes.position.count, 3)
    assert.deepEqual(mesh.position.toArray(), [2, 3, 4])
    assert.equal(mesh.material.opacity, 0.5)
    assert.equal(mesh.material.transparent, true)
    assert.equal(mesh.material.map, null)
    assert.equal(blobs, 0, 'server textures must not allocate object URLs')
    assert.deepEqual(errors, [])
    const second = model.toNodes()
    assert.notEqual(second, model.toNodes())
  })
}
