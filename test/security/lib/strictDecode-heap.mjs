// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/lib/strictDecode-heap.mjs
import assert from 'node:assert/strict'
import { strictDecode } from '../../../src/core/extras/strictDecode.js'

const shape = process.argv[2]
const copies = 64
const u16 = n => [n >>> 8, n & 255]
const join = (...parts) => Buffer.concat(parts.map(p => Buffer.from(p)))
const array = (n, item) => join([0x92, 8, 0xdc, ...u16(n)], ...Array(n).fill(item))
const key = s => [0xd9, s.length, ...Buffer.from(s)]
function packet(seed) {
  switch (shape) {
    case 'emptyMaps':
      return array(8180, [0x80])
    case 'emptyArrays':
      return array(8180, [0x90])
    case 'emptyBins':
      return array(2045, [0xc4, 0])
    case 'oneByteBins':
      return array(2045, [0xc4, 1, 7])
    case 'sixtyByteBins':
      return array(1000, [0xc4, 60, ...Array(60).fill(7)])
    case 'shortTwoByte':
      return array(8180, [0xa2, 0xc4, 0x80])
    case 'shortAscii':
      return array(8180, [0xa2, 0x61, 0x62])
    case 'twoByteString':
      return join([0x92, 8, 0xda, ...u16(65000)], Buffer.alloc(64998, 0x61), [0xc4, 0x80])
    case 'invalidUtf8':
      return join([0x92, 8, 0xda, ...u16(65000)], Buffer.alloc(65000, 0xff))
    case 'asciiString':
      return join([0x92, 8, 0xda, ...u16(65000)], Buffer.alloc(65000, 0x61))
    case 'hiddenClass': {
      const n = 320
      return join(
        [0x92, 8, 0xdc, ...u16(n)],
        ...Array.from({ length: n }, (_, i) => [
          0x8c,
          ...key((seed * 100000 + i).toString(36)),
          0,
          ...Array.from({ length: 11 }, (_, j) => [0xa1, 0x61 + j, 0]).flat(),
        ])
      )
    }
    default: {
      const length = shape === 'wideMap' ? 6 : shape === 'longKeys' ? 66 : Number(shape.slice(4))
      assert.ok(Number.isInteger(length))
      const n = Math.min(4000, Math.floor(65000 / (length + 3)))
      return join(
        [0x92, 8, 0xde, ...u16(n)],
        ...Array.from({ length: n }, (_, i) => [...key((seed * 100000 + i).toString(36).padStart(length, 'k')), 0])
      )
    }
  }
}
const settle = () => {
  for (let i = 0; i < 4; i++) global.gc()
}
if (shape === 'bomb') {
  const bytes = Uint8Array.from([0x92, 8, 0xdd, 1, 0, 0, 0])
  for (const build of [false, true]) {
    for (const maxNodes of [8192, Infinity]) {
      const result = strictDecode(bytes, { maxNodes, build })
      assert.equal(result.ok, false)
      assert.equal(result.pos, 7)
      assert.equal(result.nodes, 16777219)
    }
  }
} else {
  const packets = Array.from({ length: copies }, (_, i) => packet(i))
  const counts = packets.map(bytes => {
    assert.ok(bytes.length <= 65536)
    const result = strictDecode(bytes, { maxNodes: 8192, build: false })
    assert.equal(result.ok, true)
    return result.nodes
  })
  // Warm up code without retaining built values or interning the measured distinct keys.
  for (let i = 0; i < 20; i++) strictDecode(packet(copies + i), { maxNodes: 8192, build: true })
  settle()
  const before = process.memoryUsage()
  const held = packets.map(bytes => strictDecode(bytes, { maxNodes: 8192, build: true }).value)
  settle()
  const after = process.memoryUsage()
  const growth = after.heapUsed - before.heapUsed + after.arrayBuffers - before.arrayBuffers
  const bound = counts.reduce((sum, nodes, i) => sum + 64 * nodes + 2 * packets[i].length, 0)
  assert.ok(growth <= bound, `${shape}: ${growth / copies} bytes/packet exceeds ${bound / copies}`)
  assert.equal(held.length, copies)
  assert.ok(held.every(value => Array.isArray(value)))
}
