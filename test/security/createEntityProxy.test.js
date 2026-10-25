// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/createEntityProxy.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createEntityProxy } from '../../src/core/extras/createEntityProxy.js'

// keys every plain object inherits from Object.prototype
const inheritedKeys = ['constructor', '__proto__', 'hasOwnProperty', 'toString', 'valueOf']

function makeTables(entity) {
  const log = []
  const getters = { foo: e => (e === entity ? 'foo-value' : 'wrong-entity') }
  const methods = {
    bar: (e, ...args) => {
      log.push([e, ...args])
      return 'bar-result'
    },
  }
  const setters = { baz: (e, value) => log.push(['baz', e, value]) }
  return { getters, methods, setters, log }
}

test('createEntityProxy: own getters, methods and setters dispatch with the entity', () => {
  const entity = { host: true }
  const { getters, methods, setters, log } = makeTables(entity)
  const proxy = createEntityProxy(entity, { getters, setters, methods })
  assert.equal(proxy.foo, 'foo-value')
  assert.equal(proxy.bar(1, 2), 'bar-result')
  assert.deepEqual(log[0], [entity, 1, 2])
  proxy.baz = 'x'
  assert.deepEqual(log[1], ['baz', entity, 'x'])
  assert.equal(proxy.unknown, undefined)
})

test('createEntityProxy: inherited keys do not resolve to the host entity (no fallback)', () => {
  const entity = { host: true }
  const { getters, methods, setters } = makeTables(entity)
  const proxy = createEntityProxy(entity, { getters, setters, methods })
  for (const key of inheritedKeys) {
    assert.equal(proxy[key], undefined, key)
    assert.notEqual(proxy[key], entity, key)
  }
})

test('createEntityProxy: inherited keys route to the fallback and never to the host entity', () => {
  const entity = { host: true }
  const { getters, methods, setters } = makeTables(entity)
  const root = { own: 'own-value' }
  const fallbackSets = []
  const proxy = createEntityProxy(entity, {
    getters,
    setters,
    methods,
    fallbackGet: prop => root[prop],
    fallbackSet: (prop, value) => {
      fallbackSets.push([prop, value])
      return true
    },
  })
  assert.equal(proxy.foo, 'foo-value') // an own getter wins over the fallback
  assert.equal(proxy.own, 'own-value')
  for (const key of inheritedKeys) {
    assert.notEqual(proxy[key], entity, key)
  }
  assert.equal(proxy.constructor, Object)
  assert.equal(proxy.missing, undefined)
})

test('createEntityProxy: setting an inherited-named prop goes to the fallback, not a setter entry', () => {
  const entity = { host: true }
  const { getters, methods, setters, log } = makeTables(entity)
  const fallbackSets = []
  const proxy = createEntityProxy(entity, {
    getters,
    setters,
    methods,
    fallbackSet: (prop, value) => {
      fallbackSets.push([prop, value])
      return true
    },
  })
  proxy.toString = 'x'
  proxy.constructor = 'y'
  assert.deepEqual(fallbackSets, [
    ['toString', 'x'],
    ['constructor', 'y'],
  ])
  assert.deepEqual(log, [])
})
