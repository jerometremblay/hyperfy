// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/createOptions.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { applyCreateOptions, splitCreateOptions } from '../../src/core/extras/createOptions.js'

// a stand-in for a node proxy: validating setters, a getter-only prop, a method, and the
// throwing host-only setters the real proxies have
function makeProxy() {
  const state = { layer: 'environment', src: null, onLoad: null, radius: 0.5 }
  const proxy = {
    get layer() {
      return state.layer
    },
    set layer(value) {
      if (value === 'player') throw new Error('[collider] layer invalid: player')
      state.layer = value
    },
    get src() {
      return state.src
    },
    set src(value) {
      state.src = value
    },
    set onLoad(value) {
      state.onLoad = value
    },
    set radius(value) {
      if (typeof value !== 'number') throw new Error('[collider] radius not a number')
      state.radius = value
    },
    get name() {
      return 'collider'
    },
    set material(value) {
      throw new Error('not supported')
    },
    set parent(value) {
      throw new Error('not supported')
    },
    getHeight() {},
  }
  return { proxy, state }
}

test('splitCreateOptions: constructor-only keys go to the constructor, the rest to the proxy, host-only keys are dropped', () => {
  const errors = []
  const original = console.error
  console.error = (...args) => errors.push(args.join(' '))
  let split
  try {
    split = splitCreateOptions({
      id: 'x',
      position: [1, 2, 3],
      rotation: [0, 1, 0],
      quaternion: [0, 0, 0, 1],
      scale: [2, 2, 2],
      src: 'asset://a.vrm',
      factory: { create() {} },
      hooks: {},
      material: {},
      parent: {},
      object3d: {},
      animations: [],
      junk: 1,
    })
  } finally {
    console.error = original
  }
  assert.deepEqual(split.ctorData, {
    id: 'x',
    position: [1, 2, 3],
    rotation: [0, 1, 0],
    quaternion: [0, 0, 0, 1],
    scale: [2, 2, 2],
  })
  assert.deepEqual(split.options, { src: 'asset://a.vrm', junk: 1 })
  assert.equal(errors.length, 6)
  assert.ok(errors.every(e => e.startsWith('[app.create] ignoring host-only option: ')))
})

test('splitCreateOptions: an array offset is constructor data, anything else goes through the setter', () => {
  assert.deepEqual(splitCreateOptions({ offset: [1, 2, 3] }), { ctorData: { offset: [1, 2, 3] }, options: {} })
  const vec = { isVector3: true }
  assert.deepEqual(splitCreateOptions({ offset: vec }), { ctorData: {}, options: { offset: vec } })
})

test('splitCreateOptions: type reaches the constructor (dependent defaults) and the setter (validation)', () => {
  assert.deepEqual(splitCreateOptions({ type: 'sphere' }), {
    ctorData: { type: 'sphere' },
    options: { type: 'sphere' },
  })
  assert.deepEqual(splitCreateOptions({ type: 'sphere', radius: 2 }), {
    ctorData: { type: 'sphere' },
    options: { type: 'sphere', radius: 2 },
  })
})

test('splitCreateOptions: joint bodies are not creation options and are ignored silently', () => {
  const errors = []
  const original = console.error
  console.error = (...args) => errors.push(args)
  let split
  try {
    split = splitCreateOptions({ type: 'hinge', body0: {}, body1: {} })
  } finally {
    console.error = original
  }
  assert.deepEqual(split, { ctorData: { type: 'hinge' }, options: { type: 'hinge' } })
  assert.equal(errors.length, 0)
})

test('splitCreateOptions: id must be a string or number; non-object data yields nothing', () => {
  assert.deepEqual(splitCreateOptions({ id: 7 }).ctorData, { id: 7 })
  assert.deepEqual(splitCreateOptions({ id: {} }).ctorData, {})
  assert.deepEqual(splitCreateOptions({ id: null }).ctorData, {})
  for (const data of [undefined, null, 'x', 1]) {
    assert.deepEqual(splitCreateOptions(data), { ctorData: {}, options: {} })
  }
})

test('applyCreateOptions: assigns through the proxy setters so creation validates like assignment', () => {
  const { proxy, state } = makeProxy()
  const onLoad = () => {}
  applyCreateOptions(proxy, {
    layer: 'prop',
    src: 'asset://a.vrm',
    onLoad,
    radius: 2,
    name: 'x',
    getHeight: 1,
    junk: 1,
  })
  assert.equal(state.layer, 'prop')
  assert.equal(state.src, 'asset://a.vrm')
  assert.equal(state.onLoad, onLoad)
  assert.equal(state.radius, 2)
  assert.equal(proxy.name, 'collider')
  assert.equal(typeof proxy.getHeight, 'function')
  assert.equal(Object.prototype.hasOwnProperty.call(proxy, 'junk'), false)
  // the setter's own rejection applies at creation too
  assert.throws(() => applyCreateOptions(proxy, { layer: 'player' }), /layer invalid: player/)
  assert.equal(state.layer, 'prop')
  assert.throws(() => applyCreateOptions(proxy, { radius: 'big' }), /radius not a number/)
})

test('applyCreateOptions: the resolver can replace or drop a value', () => {
  const { proxy, state } = makeProxy()
  const resolve = (key, value) => (key === 'src' ? (typeof value === 'string' ? value.trim() : undefined) : value)
  applyCreateOptions(proxy, { src: ' a ', radius: 3 }, resolve)
  assert.equal(state.src, 'a')
  assert.equal(state.radius, 3)
  applyCreateOptions(proxy, { src: 1, onLoad: undefined }, resolve)
  assert.equal(state.src, 'a')
  assert.equal(state.onLoad, null)
})
