// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/packets.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Packr, Unpackr } from 'msgpackr'

import {
  packetMethodById,
  packetNameById,
  peekPacketId,
  readPacket,
  writeClientPacket,
  writePacket,
} from '../../src/core/packets.js'

// Mirrors the `names` array in src/core/packets.js (lines 6-31). This is a
// frozen snapshot of the wire protocol's name -> id ordering. It is
// intentionally duplicated here (not imported) so that reordering, inserting,
// or removing an entry in packets.js changes the runtime id assigned to a
// name and is caught below, even though writePacket/readPacket stay
// internally self-consistent with each other.
const names = [
  'snapshot',
  'command',
  'chatAdded',
  'chatCleared',
  'blueprintAdded',
  'blueprintModified',
  'entityAdded',
  'entityModified',
  'entityEvent',
  'entityRemoved',
  'playerTeleport',
  'playerPush',
  'playerSessionAvatar',
  'liveKitLevel',
  'mute',
  'settingsModified',
  'spawnModified',
  'modifyRank',
  'kick',
  'ai',
  'ping',
  'pong',
  'browserInput',
  'playerSeatPose',
  'playerSeatPoseResult',
  'playerSeatPoseStyles',
  'playerSeatPoseStylesResult',
  'playerExpression',
  'profilerReport',
  'profilerControl',
  'playerSession',
]

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// used only to inspect the raw [id, data] tuple packed by writePacket,
// independently of packets.js's own byId/byName maps.
const packr = new Packr({ structuredClone: true })
const plainUnpackr = new Unpackr({ useRecords: false, mapsAsObjects: true, structuredClone: false })

test('writePacket/readPacket: round-trips every known packet name at its expected wire id', () => {
  for (let expectedId = 0; expectedId < names.length; expectedId++) {
    const name = names[expectedId]
    const payload = { name, n: expectedId }

    const packet = writePacket(name, payload)

    const [rawId, rawData] = packr.unpack(packet)
    assert.equal(rawId, expectedId, `expected "${name}" to be wire id ${expectedId}`)
    assert.deepEqual(rawData, payload)

    const [method, data] = readPacket(packet)
    assert.equal(method, `on${capitalize(name)}`)
    assert.deepEqual(data, payload)
  }
})

test('writePacket: throws when the packet name is not registered', () => {
  assert.throws(() => writePacket('notARealPacketName', {}), /name not found/)
})

test('writeClientPacket: preserves every wire id and round-trips plain payloads', () => {
  for (let id = 0; id < names.length; id++) {
    const data = { name: names[id], props: { list: [null, true, -1, 1.5, 'héllo 😀'], absent: undefined } }
    const packet = writeClientPacket(names[id], data)
    assert.equal(peekPacketId(packet), id)
    assert.deepEqual(plainUnpackr.unpack(packet), [id, data])
  }
  assert.throws(() => writeClientPacket('notARealPacketName', {}), /name not found/)
})

test('writeClientPacket: writes maps and undefined without record extensions', () => {
  const packet = writeClientPacket('entityEvent', { a: { b: undefined } })
  assert.deepEqual([...packet], [0x92, 8, 0xde, 0, 1, 0xa1, 0x61, 0xde, 0, 1, 0xa1, 0x62, 0xd4, 0, 0])
})

test('writeClientPacket: duplicates shared values while server packets retain references and cycles', () => {
  const shared = { n: 1 }
  const [, decoded] = plainUnpackr.unpack(writeClientPacket('entityEvent', [shared, shared]))
  assert.deepEqual(decoded, [shared, shared])
  assert.notEqual(decoded[0], decoded[1])

  const cyclic = { shared: [shared, shared] }
  cyclic.self = cyclic
  const [, serverData] = readPacket(writePacket('entityEvent', cyclic))
  assert.equal(serverData.self, serverData)
  assert.equal(serverData.shared[0], serverData.shared[1])
})

test('writeClientPacket: uses plain representations for maps, sets, errors and regular expressions', () => {
  const error = new Error('message', { cause: 'reason' })
  const data = [new Map([['key', 1]]), new Set([1, 2]), error, /hello/gi, new Uint8Array([1, 2, 3])]
  const [, decoded] = plainUnpackr.unpack(writeClientPacket('entityEvent', data))
  assert.deepEqual(decoded.slice(0, 4), [{ key: 1 }, [1, 2], [error.name, error.message, error.cause], ['hello', 'gi']])
  assert.ok(decoded[4] instanceof Uint8Array)
  assert.deepEqual([...decoded[4]], [1, 2, 3])
})

test('writeClientPacket: long strings remain ordinary unbundled strings', () => {
  const data = ['a'.repeat(2000), 'あ'.repeat(2000)]
  const packet = writeClientPacket('entityEvent', data)
  const utf8 = new TextEncoder().encode(data[1])
  assert.deepEqual([...packet], [0x92, 8, 0x92, 0xda, 7, 0xd0, ...Array(2000).fill(0x61), 0xda, 0x17, 0x70, ...utf8])
  assert.deepEqual(plainUnpackr.unpack(packet), [8, data])
})

test('readPacket: returns an empty array when the wire id is not registered', () => {
  const packet = packr.pack([names.length + 1000, { foo: 'bar' }])
  const result = readPacket(packet)
  assert.deepEqual(result, [])
})

test('peekPacketId: reads the id of every known packet from its header without decoding', () => {
  for (let expectedId = 0; expectedId < names.length; expectedId++) {
    const name = names[expectedId]
    for (const payload of [undefined, null, 1, 'x', [1, 2], { a: { b: [1] } }, 'y'.repeat(70000)]) {
      const packet = writePacket(name, payload)
      assert.equal(peekPacketId(packet), expectedId, `${name} with ${typeof payload}`)
    }
    assert.equal(packetNameById(expectedId), name)
    assert.equal(packetMethodById(expectedId), `on${capitalize(name)}`)
  }
  // the peek relies on the ids being positive fixints; the module refuses to load past that
  assert.ok(names.length < 128)
})

test('peekPacketId: anything that is not a 2-element fixarray with a known fixint id is -1', () => {
  assert.equal(peekPacketId(new Uint8Array([])), -1)
  assert.equal(peekPacketId(new Uint8Array([0x92])), -1)
  assert.equal(peekPacketId(new Uint8Array([0x93, 0x00, 0x00, 0x00])), -1) // 3-element array
  assert.equal(peekPacketId(new Uint8Array([0x92, 0x80, 0x00])), -1) // not a positive fixint
  assert.equal(peekPacketId(new Uint8Array([0x92, 0x7f, 0x00])), -1) // unknown id
  assert.equal(peekPacketId(new Uint8Array([0x92, names.length + 50, 0x00])), -1)
  assert.equal(peekPacketId(packr.pack([names.length + 1000, {}])), -1)
  assert.equal(peekPacketId(packr.pack({ id: 0 })), -1)
  assert.equal(peekPacketId(packr.pack('snapshot')), -1)
  assert.equal(peekPacketId(null), -1)
  assert.equal(peekPacketId(undefined), -1)
  assert.equal(packetNameById(-1), undefined)
  assert.equal(packetMethodById(999), undefined)
})
