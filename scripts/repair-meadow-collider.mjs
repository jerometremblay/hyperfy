import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { BufferAttribute, BufferGeometry } from 'three'
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js'

export const ORIGINAL_SHA256 = '1aa2381f0fb25ba2fe9941b62eb2cad1fe2c77afa0316df8828ba5eba5d3d374'
export const MAX_EDGE_LENGTH = 250

export function readGLB(bytes) {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, 'Expected a GLB')
  assert.equal(bytes.readUInt32LE(4), 2)
  assert.equal(bytes.readUInt32LE(8), bytes.length)
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a)
  const binaryHeader = 20 + bytes.readUInt32LE(12)
  assert.equal(bytes.readUInt32LE(binaryHeader + 4), 0x004e4942)
  assert.equal(binaryHeader + 8 + bytes.readUInt32LE(binaryHeader), bytes.length)
  return {
    json: JSON.parse(bytes.subarray(20, binaryHeader)),
    binary: bytes.subarray(binaryHeader + 8),
  }
}

export function colliderGeometry(json, binary) {
  const node = json.nodes.find(node => node.name === 'Ground_Collider')
  assert.equal(node?.extras?.node, 'collider')
  assert.equal(json.nodes.filter(item => item.mesh === node.mesh).length, 1, 'Collider mesh must not be shared')
  const mesh = json.meshes[node.mesh]
  assert.equal(mesh.primitives.length, 1)
  const primitive = mesh.primitives[0]
  assert.ok(!primitive.targets && !primitive.extensions, 'Unsupported collider deformation/compression')
  assert.equal(primitive.mode ?? 4, 4)
  assert.deepEqual(Object.keys(primitive.attributes).sort(), ['NORMAL', 'POSITION', 'TEXCOORD_0'])
  const array = index => {
    const accessor = json.accessors[index]
    const view = json.bufferViews[accessor.bufferView]
    assert.equal(view.buffer, 0)
    assert.ok(!view.byteStride && !accessor.sparse && !accessor.normalized)
    const Type = { 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }[accessor.componentType]
    assert.ok(Type, 'Unsupported accessor component type')
    const size = { SCALAR: 1, VEC2: 2, VEC3: 3 }[accessor.type]
    assert.ok(size)
    const offset = (view.byteOffset || 0) + (accessor.byteOffset || 0)
    const length = accessor.count * size
    assert.ok(offset + length * Type.BYTES_PER_ELEMENT <= binary.length)
    // Copy into aligned storage; GLB JSON padding does not guarantee 8-byte alignment.
    const bytes = Uint8Array.from(binary.subarray(offset, offset + length * Type.BYTES_PER_ELEMENT))
    return { values: new Type(bytes.buffer), size }
  }
  const geometry = new BufferGeometry()
  for (const [semantic, name] of Object.entries({ POSITION: 'position', NORMAL: 'normal', TEXCOORD_0: 'uv' })) {
    const { values, size } = array(primitive.attributes[semantic])
    geometry.setAttribute(name, new BufferAttribute(values, size))
  }
  const { values, size } = array(primitive.indices)
  assert.equal(size, 1)
  geometry.setIndex(new BufferAttribute(values, 1))
  return { geometry, primitive }
}

export function maxEdgeLength(geometry) {
  const positions = geometry.attributes.position
  const index = geometry.index
  const count = index ? index.count : positions.count
  let max = 0
  for (let i = 0; i < count; i += 3) {
    const vertices = [0, 1, 2].map(j => (index ? index.getX(i + j) : i + j))
    for (let j = 0; j < 3; j++) {
      const a = vertices[j],
        b = vertices[(j + 1) % 3]
      max = Math.max(
        max,
        Math.hypot(
          positions.getX(a) - positions.getX(b),
          positions.getY(a) - positions.getY(b),
          positions.getZ(a) - positions.getZ(b)
        )
      )
    }
  }
  return max
}

export function repairMeadowCollider(bytes) {
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    ORIGINAL_SHA256,
    'Meadow source changed; inspect before repairing'
  )
  const { json, binary } = readGLB(bytes)
  assert.equal(json.buffers.length, 1)
  assert.ok(!json.buffers[0].uri)
  const { geometry, primitive } = colliderGeometry(json, binary)
  const repaired = new TessellateModifier(MAX_EDGE_LENGTH, 16).modify(geometry)
  assert.ok(maxEdgeLength(repaired) <= MAX_EDGE_LENGTH + 0.001, 'Tessellation did not converge')
  repaired.normalizeNormals()
  const count = repaired.attributes.position.count
  const indices = Uint32Array.from({ length: count }, (_, i) => i)
  repaired.setIndex(new BufferAttribute(indices, 1))
  repaired.computeBoundingBox()
  const parts = [binary]
  let byteOffset = binary.length
  const append = (attribute, target, componentType) => {
    const values = attribute.array
    const data = Buffer.from(values.buffer, values.byteOffset, values.byteLength)
    assert.equal(byteOffset % 4, 0)
    const bufferView = json.bufferViews.length
    json.bufferViews.push({ buffer: 0, byteOffset, byteLength: data.length, target })
    const accessor = {
      bufferView,
      componentType,
      count: attribute.count,
      type: { 1: 'SCALAR', 2: 'VEC2', 3: 'VEC3' }[attribute.itemSize],
    }
    if (attribute === repaired.attributes.position) {
      accessor.min = repaired.boundingBox.min.toArray()
      accessor.max = repaired.boundingBox.max.toArray()
    }
    parts.push(data)
    byteOffset += data.length
    return json.accessors.push(accessor) - 1
  }
  primitive.attributes = {
    POSITION: append(repaired.attributes.position, 34962, 5126),
    NORMAL: append(repaired.attributes.normal, 34962, 5126),
    TEXCOORD_0: append(repaired.attributes.uv, 34962, 5126),
  }
  primitive.indices = append(repaired.index, 34963, 5125)
  json.buffers[0].byteLength = byteOffset
  const rawJSON = Buffer.from(JSON.stringify(json))
  const jsonBytes = Buffer.concat([rawJSON, Buffer.alloc((4 - (rawJSON.length % 4)) % 4, 32)])
  const header = Buffer.alloc(20)
  header.writeUInt32LE(0x46546c67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(20 + jsonBytes.length + 8 + byteOffset, 8)
  header.writeUInt32LE(jsonBytes.length, 12)
  header.writeUInt32LE(0x4e4f534a, 16)
  const binaryHeader = Buffer.alloc(8)
  binaryHeader.writeUInt32LE(byteOffset, 0)
  binaryHeader.writeUInt32LE(0x004e4942, 4)
  geometry.dispose()
  repaired.dispose()
  return Buffer.concat([header, jsonBytes, binaryHeader, ...parts])
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [input, output] = process.argv.slice(2)
  assert.ok(input && output, 'Usage: node scripts/repair-meadow-collider.mjs <original.glb> <repaired.glb>')
  assert.notEqual(path.resolve(input), path.resolve(output), 'Preserve the original model')
  const repaired = repairMeadowCollider(await fs.readFile(input))
  await fs.writeFile(output, repaired, { flag: 'wx' })
  console.log(
    JSON.stringify({
      sha256: createHash('sha256').update(repaired).digest('hex'),
      bytes: repaired.length,
      maxEdgeLength: MAX_EDGE_LENGTH,
    })
  )
}
