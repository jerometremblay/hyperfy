// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/inboundDecode.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Packr } from 'msgpackr'
import { decodeInbound, readInboundPacket } from '../../src/server/inboundDecode.js'
import { readPacket, writeClientPacket, writePacket } from '../../src/core/packets.js'

const oldPackr = new Packr({ structuredClone: true })
const plainPackr = new Packr({ useRecords: false, structuredClone: false })
const bytes = (...parts) => Buffer.concat(parts.map(p => Buffer.from(p)))
const u32 = n => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
const tuple = body => bytes([0x92, 8], body)

test('readInboundPacket: plain client packets decode with objects, undefined, numbers and fresh bins', () => {
  const payloads = [
    ['entityModified', { id: 'p1', p: [1.5, -2, 3], q: [0, 0, 0, 1], m: 2, e: undefined }],
    ['entityEvent', ['app-1', 3, 'ping', { n: 1, s: 'x'.repeat(5000), list: [{ a: 1 }, { a: 2 }] }]],
    ['chatAdded', { body: 'héllo 😀' }],
    ['command', { args: ['server', 'stats'] }],
    ['ping', 123456.789],
    ['entityRemoved', 'id-1'],
    ['blueprintModified', { id: 'bp', version: 2 ** 40, props: { a: null, b: true, c: 2 ** 53 - 1, d: -1 } }],
    ['ai', { name: 'create', prompt: 'x'.repeat(60_000) }],
    ['playerSession', { walletAddress: 'w', signature: 's', nonce: 'n' }],
  ]
  for (const [name, data] of payloads) {
    assert.deepEqual(readInboundPacket(writeClientPacket(name, data)), [
      `on${name.charAt(0).toUpperCase()}${name.slice(1)}`,
      data,
    ])
  }
  const [, bin] = readInboundPacket(writeClientPacket('entityEvent', Buffer.from([1, 2, 3])))
  assert.equal(bin.constructor, Uint8Array)
  assert.deepEqual([...bin], [1, 2, 3])
})

test('readInboundPacket: old records are refused, and a subsequent plain packet still decodes', () => {
  const data = ['app', 0, 'probe', { n: 1 }]
  assert.throws(() => readInboundPacket(oldPackr.pack([8, data])), /refused/)
  assert.deepEqual(readInboundPacket(writeClientPacket('entityEvent', data)), ['onEntityEvent', data])
})

test('regression: pointer DAGs, cycles and shared references are refused without expansion or rendering', () => {
  let dag = { x: 1 }
  for (let i = 0; i < 16; i++) dag = { a: dag, b: dag, c: dag, d: dag }
  const shared = { n: 1 }
  const cyclic = { a: 1 }
  cyclic.self = cyclic
  for (const value of [dag, cyclic, [shared, shared]]) {
    const packet = oldPackr.pack([8, value])
    assert.ok(packet.length < 500)
    assert.throws(() => decodeInbound(packet), /refused/)
    assert.throws(() => decodeInbound(bytes(packet, [0xc0])), /refused/)
  }
})

test('regression: BigInt and Error bombs are refused at their first extension byte', () => {
  const bigint = tuple(bytes([0xc9, ...u32(60_000), 0x42], Buffer.alloc(60_000, 0x7f)))
  assert.throws(
    () => decodeInbound(bigint),
    err => err.pos === 2 && /refused/.test(err.message)
  )
  const item = [0xd4, 0x65, 0, 0x93, 0xa5, ...Buffer.from('Error'), 0xa1, 0x78, 0xc0]
  const error = tuple(bytes([0xdd, ...u32(4000)], ...Array(4000).fill(item)))
  assert.throws(
    () => decodeInbound(error),
    err => err.pos === 8 && err.nodes === 4003
  )
})

test('refused extensions do not install global stubs or change server-to-client encoding/decoding', () => {
  for (const value of [new Set([1, 2]), new Float32Array([1.5]), /a/g, new Date(0), new Error('x')]) {
    assert.throws(() => decodeInbound(oldPackr.pack([8, value])), /refused/)
    const [method, decoded] = readPacket(writePacket('entityEvent', value))
    assert.equal(method, 'onEntityEvent')
    assert.equal(decoded.constructor, value.constructor)
  }
  for (const ts of [
    [0xd6, 0xff, 0, 0, 0, 1],
    [0xd7, 0xff, ...Array(8).fill(0)],
    [0xc7, 12, 0xff, ...Array(12).fill(0)],
  ]) {
    assert.throws(() => decodeInbound(tuple(ts)), /refused/)
  }
})

test('64-bit integers become numbers, matching hi * 2^32 + lo', () => {
  for (const value of [2n ** 60n, -(2n ** 60n), 2n ** 53n + 1n, -(2n ** 63n), 2n ** 64n - 1n]) {
    assert.equal(decodeInbound(plainPackr.pack(value)), Number(value))
  }
})

test('malformed tuples, trailing bytes, over-declarations, depth and node limits are refused', () => {
  assert.throws(() => decodeInbound(bytes(writeClientPacket('entityEvent', { a: 1 }), [0xc0])), /trailing bytes/)
  for (const value of [[1, 2, 3], { id: 8 }, 'entityEvent']) {
    assert.throws(() => readInboundPacket(plainPackr.pack(value)), /not a packet tuple/)
  }
  for (const value of [
    [999, {}],
    ['entityEvent', {}],
  ]) {
    assert.throws(() => readInboundPacket(plainPackr.pack(value)), /unknown packet id/)
  }
  for (const header of [
    [0xdd, 255, 255, 255, 255],
    [0xdb, 127, 255, 255, 255],
    [0xde, 255, 255],
    [0xc6, 127, 255, 255, 255],
    [0xc1],
  ]) {
    assert.throws(() => decodeInbound(tuple(header)))
  }
  assert.throws(() => decodeInbound(bytes(Array(33).fill(0x91), [0])), /too deep/)
  assert.throws(() => decodeInbound(tuple(bytes([0xdc, 0x20, 0], Buffer.alloc(8192)))), /node budget exceeded/)
})
