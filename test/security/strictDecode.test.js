// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/strictDecode.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Packr, Unpackr } from 'msgpackr'
import { strictDecode } from '../../src/core/extras/strictDecode.js'
import { runSupervised } from './lib/supervised.mjs'

const packr = new Packr({ useRecords: false, structuredClone: false, moreTypes: false, bundleStrings: false })
const unpackr = new Unpackr({ useRecords: false, mapsAsObjects: true, int64AsType: 'number', copyBuffers: true })
const bytes = parts => Uint8Array.from(parts)
const u16 = n => [n >>> 8, n & 255]
const u32 = n => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
const normalize = value => {
  if (value instanceof Uint8Array) return new Uint8Array(value)
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]))
  }
  return value
}
const both = (packet, options = {}) => {
  const count = strictDecode(packet, { ...options, build: false })
  const built = strictDecode(packet, { ...options, build: true })
  const { value: _countValue, ...c } = count
  const { value: _builtValue, ...b } = built
  assert.deepEqual(c, b, Buffer.from(packet).toString('hex').slice(0, 100))
  assert.equal(count.value, undefined)
  return built
}

// Each token gets a complete minimal value, including every fixint, fixstr, fixarray and fixmap byte.
function minimal(token) {
  if (token <= 0x7f || token >= 0xe0 || [0xc0, 0xc2, 0xc3].includes(token)) return [token]
  if (token >= 0xa0 && token <= 0xbf) return [token, ...Array(token & 31).fill(0x61)]
  if (token >= 0x90 && token <= 0x9f) return [token, ...Array(token & 15).fill(0xc0)]
  if (token >= 0x80 && token <= 0x8f)
    return [
      token,
      ...Array(token & 15)
        .fill([0xa0, 0xc0])
        .flat(),
    ]
  const lengths = {
    0xc4: 1,
    0xc5: 2,
    0xc6: 4,
    0xca: 4,
    0xcb: 8,
    0xcc: 1,
    0xcd: 2,
    0xce: 4,
    0xcf: 8,
    0xd0: 1,
    0xd1: 2,
    0xd2: 4,
    0xd3: 8,
    0xd4: 2,
    0xd9: 1,
    0xda: 2,
    0xdb: 4,
    0xdc: 2,
    0xdd: 4,
    0xde: 2,
    0xdf: 4,
  }
  return lengths[token] ? [token, ...Array(lengths[token]).fill(0)] : null
}

test('strictDecode: all 256 token bytes are allowed or refused at their byte, and every truncation fails', () => {
  for (let token = 0; token < 256; token++) {
    const packet = minimal(token)
    if (!packet) {
      const result = both(bytes([0x91, token, ...Array(20).fill(0)]))
      assert.equal(result.ok, false, token.toString(16))
      assert.equal(result.pos, 1)
      assert.equal(result.reason, `byte 0x${token.toString(16)} refused`)
      continue
    }
    const result = both(bytes(packet))
    assert.equal(result.ok, true, token.toString(16))
    assert.equal(result.pos, packet.length)
    assert.deepEqual(normalize(result.value), normalize(unpackr.unpack(bytes(packet))))
    for (let end = 0; end < packet.length; end++) {
      assert.equal(both(bytes(packet.slice(0, end))).ok, false, `${token.toString(16)} truncated at ${end}`)
    }
    assert.equal(both(bytes([...packet, 0xc0])).reason, 'trailing bytes')
  }
})

test('strictDecode: fixext1 accepts only type 0, with any payload byte, as undefined', () => {
  for (let byte = 0; byte < 256; byte++) {
    const allowed = both(bytes([0xd4, 0, byte]))
    assert.equal(allowed.ok, true)
    assert.equal(allowed.value, undefined)
    assert.equal(allowed.nodes, 1)
    if (!byte) continue
    const refused = both(bytes([0xd4, byte, 0]))
    assert.equal(refused.ok, false)
    assert.equal(refused.pos, 1)
    assert.match(refused.reason, /ext type/)
  }
})

test('strictDecode: declared children and bins are charged at headers, even on failure', () => {
  for (const [header, children] of [
    [[0x92], 2],
    [[0xdc, 0, 2], 2],
    [[0xdd, 0, 0, 0, 2], 2],
    [[0x82], 4],
    [[0xde, 0, 2], 4],
    [[0xdf, 0, 0, 0, 2], 4],
  ]) {
    const result = both(bytes(header))
    assert.equal(result.ok, false)
    assert.equal(result.nodes, 1 + children)
    assert.equal(result.pos, header.length)
    assert.equal(result.reason, 'declared length exceeds remaining bytes')
  }
  for (const header of [
    [0xc4, 1],
    [0xc5, 0, 1],
    [0xc6, 0, 0, 0, 1],
  ]) {
    assert.equal(both(bytes(header)).nodes, 4)
    assert.equal(both(bytes([...header, 9]), { maxNodes: 3 }).reason, 'node budget exceeded')
    assert.equal(both(bytes([...header, 9]), { maxNodes: 4 }).ok, true)
  }
  assert.equal(both(bytes([0]), { maxNodes: 0 }).ok, false)
})

test('strictDecode: the seven-byte array32 bomb refuses at pos 7 before any array allocation', async () => {
  const result = both(bytes([0x92, 0x08, 0xdd, 0x01, 0, 0, 0]), { maxNodes: 8192 })
  assert.deepEqual(result, { ok: false, nodes: 16777219, pos: 7, reason: 'node budget exceeded' })
  // A 16M-slot allocation cannot survive the child's 16 MiB heap. Both modes must refuse before it.
  await runSupervised(new URL('./lib/strictDecode-heap.mjs', import.meta.url), { heapMb: 16, args: ['bomb'] })
})

test('strictDecode: the 23-byte smuggle packet is exactly eight nodes, with all bomb bytes inside the bin', () => {
  const data = [0, ...Array(3).fill([0xdd, 0, 0xff, 0xff, 0xff]).flat()]
  const packet = bytes([0x92, 8, 0x92, 0xa1, 0xf0, 0xc4, 16, ...data])
  assert.equal(packet.length, 23)
  const result = both(packet, { maxNodes: 8 })
  assert.equal(result.ok, true)
  assert.equal(result.nodes, 8)
  assert.equal(result.pos, 23)
  assert.deepEqual(result.value, [8, ['\ufffd', bytes(data)]])
  assert.equal(both(packet, { maxNodes: 7 }).ok, false)
})

test('strictDecode: depth counts the root, keys must be strings, and lengths never exceed remaining bytes', () => {
  assert.equal(both(bytes([...Array(31).fill(0x91), 0]), { maxDepth: 32 }).ok, true)
  assert.equal(both(bytes([...Array(32).fill(0x91), 0])).reason, 'too deep')
  assert.equal(both(bytes([0x80]), { maxDepth: 1 }).ok, true)
  assert.equal(both(bytes([0x81, 0xa0, 0]), { maxDepth: 1 }).reason, 'too deep')
  for (let token = 0; token < 256; token++) {
    if ((token >= 0xa0 && token <= 0xbf) || [0xd9, 0xda, 0xdb].includes(token)) continue
    const result = both(bytes([0x81, token, 0]))
    assert.equal(result.reason, 'map key is not a string')
    assert.equal(result.pos, 1)
  }
  for (const token of [0xc6, 0xdb, 0xdd, 0xdf]) {
    assert.equal(both(bytes([token, 255, 255, 255, 255])).ok, false)
  }
})

test('strictDecode: BOMs survive in values and distinct keys, and invalid UTF-8 uses replacement characters', () => {
  for (const value of ['\ufeffvalue', '\ufeff' + 'v'.repeat(40), { '\ufeffkey': 1 }, { '\ufeffid': 1, id: 2 }]) {
    const result = both(packr.pack(value))
    assert.equal(result.ok, true)
    assert.deepEqual(result.value, value)
  }
  assert.equal(both(bytes([0xa3, 0xed, 0xa0, 0x80])).value, '\ufffd\ufffd\ufffd')
  for (const n of [0, 1, 12, 13, 23, 32, 256]) {
    for (const value of ['a'.repeat(n), 'あ'.repeat(n)]) assert.equal(both(packr.pack(value)).value, value)
  }
})

test('strictDecode: bins have fresh exact-size Uint8Array storage, including Buffer input', () => {
  for (const packet of [bytes([0xc4, 3, 1, 2, 3]), Buffer.from([0xc4, 3, 1, 2, 3])]) {
    const { value } = both(packet)
    assert.equal(value.constructor, Uint8Array)
    assert.notEqual(value.buffer, packet.buffer)
    assert.equal(value.buffer.byteLength, 3)
    packet[2] = 99
    assert.deepEqual([...value], [1, 2, 3])
  }
})

test('strictDecode: plain objects rename __proto__ to __proto_ without polluting prototypes', () => {
  const original = { ['__proto__']: { polluted: true }, constructor: { prototype: { polluted: true } }, x: 1 }
  const result = both(packr.pack(original))
  assert.equal(result.ok, true)
  assert.equal(Object.getPrototypeOf(result.value), Object.prototype)
  assert.equal(Object.hasOwn(result.value, '__proto__'), false)
  assert.equal(Object.hasOwn(result.value, '__proto_'), true)
  assert.deepEqual(result.value.__proto_, { polluted: true })
  assert.equal({}.polluted, undefined)
  assert.deepEqual(result.value, unpackr.unpack(packr.pack(original)))
})

test('strictDecode: differential valid UTF-8 fuzz and separately labelled arbitrary byte mutations', () => {
  let seed = 0x9e3779b9
  const int = n => {
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    return (seed >>> 0) % n
  }
  const str = () => {
    const length = [0, 1, 12, 13, 23, 31, 32, 63, 255, 256, 300][int(11)]
    const out = []
    const sequences = [[0x61], [0xc4, 0x80], [0xe3, 0x81, 0x82], [0xf0, 0x9f, 0x98, 0x80]]
    while (out.length < length) {
      const seq = sequences[int(sequences.length)]
      out.push(...(out.length + seq.length <= length ? seq : [0x61]))
    }
    // Validate only string payloads, never MessagePack headers or arbitrary bin bytes.
    assert.doesNotThrow(() => new TextDecoder('utf-8', { fatal: true }).decode(bytes(out)))
    const form = int(4)
    if (form === 0 && length < 32) return [0xa0 + length, ...out]
    if (form <= 1 && length < 256) return [0xd9, length, ...out]
    return form === 2 ? [0xda, ...u16(length), ...out] : [0xdb, ...u32(length), ...out]
  }
  const value = depth => {
    const type = int(depth < 5 ? 12 : 8)
    if (type === 0) return [int(128)]
    if (type === 1) return [0xe0 + int(32)]
    if (type === 2) return [[0xc0, 0xc2, 0xc3][int(3)]]
    if (type === 3) {
      const [token, size] = [
        [0xca, 4],
        [0xcb, 8],
        [0xcc, 1],
        [0xcd, 2],
        [0xce, 4],
        [0xcf, 8],
        [0xd0, 1],
        [0xd1, 2],
        [0xd2, 4],
        [0xd3, 8],
      ][int(10)]
      return [token, ...Array.from({ length: size }, () => int(256))]
    }
    if (type === 4) return [0xd4, 0, int(256)]
    if (type <= 6) return str()
    const n = int(6)
    const form = int(3)
    if (type === 7) {
      const header = [
        [0xc4, n],
        [0xc5, ...u16(n)],
        [0xc6, ...u32(n)],
      ][form]
      return [...header, ...Array.from({ length: n }, () => int(256))]
    }
    if (type < 10) {
      const header = [[0x90 + n], [0xdc, ...u16(n)], [0xdd, ...u32(n)]][form]
      return [...header, ...Array.from({ length: n }, () => value(depth + 1)).flat()]
    }
    const header = [[0x80 + n], [0xde, ...u16(n)], [0xdf, ...u32(n)]][form]
    return [...header, ...Array.from({ length: n }, () => [...str(), ...value(depth + 1)]).flat()]
  }
  for (let i = 0; i < 2000; i++) {
    const packet = bytes([0x92, 8, ...value(0)])
    const result = both(packet, { maxNodes: 8192 })
    assert.equal(result.ok, true, `valid UTF-8 packet ${i}`)
    assert.deepEqual(normalize(result.value), normalize(unpackr.unpack(packet)), `valid UTF-8 packet ${i}`)
    for (let mutation = 0; mutation < 3; mutation++) {
      const changed = packet.slice()
      changed[int(changed.length)] = int(256)
      both(changed, { maxNodes: 8192 })
    }
  }
})

const heapShapes = [
  'emptyMaps',
  'emptyArrays',
  'emptyBins',
  'oneByteBins',
  'sixtyByteBins',
  'hiddenClass',
  'twoByteString',
  'invalidUtf8',
  'asciiString',
  'shortTwoByte',
  'shortAscii',
  'wideMap',
  'longKeys',
  ...Array.from({ length: 11 }, (_, i) => `keys${i + 13}`),
]
for (const shape of heapShapes) {
  test(`strictDecode: supervised heap bound for ${shape}`, async () => {
    await runSupervised(new URL('./lib/strictDecode-heap.mjs', import.meta.url), { heapMb: 128, args: [shape] })
  })
}
