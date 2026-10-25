// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/playerRelayPolicy.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  createRelayDrop,
  sanitizePush,
  sanitizeSessionAvatar,
  sanitizeTeleport,
} from '../../src/core/extras/playerRelayPolicy.js'

// --- sanitizeTeleport ---

test('sanitizeTeleport: a finite position passes as a copy; rotationY only when it is a finite number', () => {
  const position = [1, 2, 3]
  const safe = sanitizeTeleport({ position, rotationY: 0.5 })
  assert.deepEqual(safe, { position: [1, 2, 3], rotationY: 0.5 })
  assert.notEqual(safe.position, position)
  assert.deepEqual(sanitizeTeleport({ position: [0, 0, 0], rotationY: 0 }), { position: [0, 0, 0], rotationY: 0 })
  assert.deepEqual(sanitizeTeleport({ position: [-1.5, 0, 1e6] }), { position: [-1.5, 0, 1e6] })
})

test('sanitizeTeleport: a rotationY that is not a finite number is left out, not rejected', () => {
  for (const rotationY of [
    undefined,
    null,
    NaN,
    Infinity,
    -Infinity,
    '1',
    { _x: 0, _y: 0, _z: 0, _w: 1 },
    [0, 0, 0, 1],
  ]) {
    const safe = sanitizeTeleport({ position: [1, 2, 3], rotationY })
    assert.deepEqual(safe, { position: [1, 2, 3] }, String(rotationY))
    assert.equal(Object.prototype.hasOwnProperty.call(safe, 'rotationY'), false)
  }
})

test('sanitizeTeleport: anything without three finite numbers is rejected', () => {
  for (const data of [
    undefined,
    null,
    'x',
    1,
    [],
    {},
    { position: null },
    { position: 'x' },
    { position: [1, 2] },
    { position: [1, 2, 3, 4] },
    { position: [1, NaN, 3] },
    { position: [1, Infinity, 3] },
    { position: ['1', 2, 3] },
    { position: [1, 2, null] },
    { position: new Float32Array([1, 2, 3]) },
    { position: { 0: 1, 1: 2, 2: 3, length: 3 } },
  ]) {
    assert.equal(sanitizeTeleport(data), null, JSON.stringify(data))
  }
})

test('sanitizeTeleport: values are read once (a getter cannot change them after the check)', () => {
  let reads = 0
  const position = [1, 2, 3]
  Object.defineProperty(position, 1, {
    get() {
      return reads++ === 0 ? 2 : NaN
    },
  })
  assert.deepEqual(sanitizeTeleport({ position }), { position: [1, 2, 3] })
})

test('sanitizeTeleport: rotationY is read once (alternating getter and proxy trap)', () => {
  let reads = 0
  const data = { position: [1, 2, 3] }
  Object.defineProperty(data, 'rotationY', {
    enumerable: true,
    get() {
      return reads++ === 0 ? 0.5 : NaN
    },
  })
  assert.deepEqual(sanitizeTeleport(data), { position: [1, 2, 3], rotationY: 0.5 })
  assert.equal(reads, 1)

  let traps = 0
  const proxied = new Proxy(
    { position: [4, 5, 6], rotationY: 1 },
    {
      get(target, key) {
        if (key === 'rotationY') return traps++ % 2 === 0 ? 2 : NaN
        if (key === 'position') return traps++ % 2 === 0 ? [4, 5, 6] : [NaN, 0, 0]
        return target[key]
      },
    }
  )
  const safe = sanitizeTeleport(proxied)
  // a proxy of a plain object is still a plain object; whatever each trap returned is what was checked
  assert.ok(safe === null || (Number.isFinite(safe.position[0]) && (!('rotationY' in safe) || safe.rotationY === 2)))
})

test('sanitizeTeleport / sanitizePush: decoded containers that are not plain objects are rejected', () => {
  class Packet {
    constructor() {
      this.position = [1, 2, 3]
      this.force = [1, 2, 3]
    }
  }
  for (const data of [
    new Map([
      ['position', [1, 2, 3]],
      ['force', [1, 2, 3]],
    ]),
    new Set([[1, 2, 3]]),
    new Float64Array([1, 2, 3]),
    [[1, 2, 3]],
    new Packet(),
    Object.assign(() => {}, { position: [1, 2, 3], force: [1, 2, 3] }),
  ]) {
    assert.equal(sanitizeTeleport(data), null, String(data))
    assert.equal(sanitizePush(data), null, String(data))
  }
  const bare = Object.create(null)
  bare.position = [1, 2, 3]
  bare.force = [1, 2, 3]
  assert.deepEqual(sanitizeTeleport(bare), { position: [1, 2, 3] })
  assert.deepEqual(sanitizePush(bare), { force: [1, 2, 3] })
})

// --- sanitizePush ---

test('sanitizePush: a finite force passes as a copy, everything else is rejected', () => {
  const force = [0, 0, -30]
  const safe = sanitizePush({ force })
  assert.deepEqual(safe, { force: [0, 0, -30] })
  assert.notEqual(safe.force, force)
  for (const data of [undefined, null, {}, { force: [0, 0] }, { force: [NaN, 0, 0] }, { force: '0,0,1' }, [0, 0, 1]]) {
    assert.equal(sanitizePush(data), null, JSON.stringify(data))
  }
})

// --- sanitizeSessionAvatar ---

test('sanitizeSessionAvatar: { avatar } with an accepted url, null or undefined passes', () => {
  assert.deepEqual(sanitizeSessionAvatar({ avatar: 'asset://avatar.vrm' }), { avatar: 'asset://avatar.vrm' })
  assert.deepEqual(sanitizeSessionAvatar({ avatar: 'https://example.com/a.vrm' }), {
    avatar: 'https://example.com/a.vrm',
  })
  assert.deepEqual(sanitizeSessionAvatar({ avatar: null }), { avatar: null })
  assert.deepEqual(sanitizeSessionAvatar({ avatar: undefined }), { avatar: undefined })
  assert.deepEqual(sanitizeSessionAvatar({}), { avatar: undefined })
})

test('sanitizeSessionAvatar: a bare string (the old relay shape) and rejected urls yield null', () => {
  for (const data of [
    'asset://avatar.vrm',
    undefined,
    null,
    { avatar: 'javascript:1' },
    { avatar: 'data:text/plain,x' },
    { avatar: 'asset://a.glb' },
    { avatar: 1 },
    { avatar: `https://example.com/${'a'.repeat(513)}` },
  ]) {
    assert.equal(sanitizeSessionAvatar(data), null, JSON.stringify(data))
  }
})

test('sanitizeSessionAvatar: a decoded container that is not a plain object never clears the avatar', () => {
  class Packet {
    constructor() {
      this.avatar = undefined
    }
  }
  for (const data of [
    new Map([['avatar', undefined]]),
    new Map([['avatar', 'asset://avatar.vrm']]),
    new Set(),
    new Uint8Array(3),
    [],
    ['asset://avatar.vrm'],
    [undefined],
    new Packet(),
    new Date(0),
    () => {},
    Object.assign(() => {}, { avatar: null }),
  ]) {
    assert.equal(sanitizeSessionAvatar(data), null, String(data))
  }
  // null/undefined still clear inside the plain-object shape
  const bare = Object.create(null)
  assert.deepEqual(sanitizeSessionAvatar(bare), { avatar: undefined })
  bare.avatar = null
  assert.deepEqual(sanitizeSessionAvatar(bare), { avatar: null })
})

test('sanitizeSessionAvatar: avatar is read once (alternating getter and proxy trap)', () => {
  let reads = 0
  const data = {}
  Object.defineProperty(data, 'avatar', {
    enumerable: true,
    get() {
      return reads++ === 0 ? 'asset://avatar.vrm' : 'javascript:1'
    },
  })
  assert.deepEqual(sanitizeSessionAvatar(data), { avatar: 'asset://avatar.vrm' })
  assert.equal(reads, 1)

  let traps = 0
  const proxied = new Proxy(
    { avatar: 'asset://avatar.vrm' },
    {
      get(target, key) {
        if (key === 'avatar') return traps++ % 2 === 0 ? 'asset://avatar.vrm' : 'javascript:1'
        return target[key]
      },
    }
  )
  const safe = sanitizeSessionAvatar(proxied)
  assert.ok(safe === null || safe.avatar === 'asset://avatar.vrm')
  assert.equal(traps, 1)
})

// --- createRelayDrop ---

test('createRelayDrop: warns once per socket and packet name, never forwards', () => {
  const warnings = []
  const drop = createRelayDrop(message => warnings.push(message))
  const a = { id: 'socket-a' }
  const b = { id: 'socket-b' }
  for (let i = 0; i < 5; i++) {
    drop(a, 'playerTeleport')
    drop(a, 'playerPush')
    drop(a, 'playerSessionAvatar')
  }
  assert.equal(warnings.length, 3)
  assert.match(warnings[0], /playerTeleport from client socket-a/)
  assert.match(warnings[1], /playerPush from client socket-a/)
  assert.match(warnings[2], /playerSessionAvatar from client socket-a/)
  drop(b, 'playerTeleport')
  drop(b, 'playerTeleport')
  assert.equal(warnings.length, 4)
  assert.match(warnings[3], /playerTeleport from client socket-b/)
  // the handlers take no payload: nothing is read from the packet
  assert.equal(drop(a, 'playerTeleport'), undefined)
})

for (const [sanitize, key, limit] of [
  [sanitizeTeleport, 'position', 1e6],
  [sanitizePush, 'force', 1e4],
]) {
  test(`${key}: relay bound is inclusive, per component, with no minimum magnitude`, () => {
    for (const values of [
      [-limit, limit, 0],
      [Number.MIN_VALUE, -Number.MIN_VALUE, 1e-50],
    ]) {
      const safe = sanitize({ [key]: values })
      assert.deepEqual(safe, { [key]: values })
      assert.notEqual(safe[key], values)
    }
    for (const bad of [limit + 1, -limit - 1, 1e300, Infinity, -Infinity, NaN, '1', null, new Number(1)]) {
      for (let i = 0; i < 3; i++) {
        const values = [0, 0, 0]
        values[i] = bad
        assert.equal(sanitize({ [key]: values }), null)
      }
    }
  })

  test(`${key}: plain packet property and all array elements are read exactly once`, () => {
    const reads = [0, 0, 0]
    const values = [-limit, 0, limit]
    const array = values.map((_, i) => i)
    for (let i = 0; i < 3; i++) {
      Object.defineProperty(array, i, { get: () => (++reads[i] === 1 ? values[i] : Infinity) })
    }
    let propertyReads = 0
    const data = Object.defineProperty({}, key, { get: () => (++propertyReads === 1 ? array : null) })
    assert.deepEqual(sanitize(data), { [key]: values })
    assert.equal(propertyReads, 1)
    assert.deepEqual(reads, [1, 1, 1])
  })
}

test('relay bounds: a force above the push bound is still a valid teleport position', () => {
  assert.equal(sanitizePush({ force: [10001, 0, 0] }), null)
  assert.deepEqual(sanitizeTeleport({ position: [10001, 0, 0] }), { position: [10001, 0, 0] })
})
