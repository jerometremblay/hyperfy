// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/blueprintPolicy.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { sanitizeBlueprintAdd, sanitizeBlueprintModify } from '../../src/core/extras/blueprintPolicy.js'
import { strictDecode } from '../../src/core/extras/strictDecode.js'
import { writeClientPacket } from '../../src/core/packets.js'

const base = { id: 'bp', version: 0 }
const sanitizers = [sanitizeBlueprintAdd, sanitizeBlueprintModify]
const textLimits = { name: 256, desc: 4096, author: 256, url: 2048, model: 2048, script: 2048 }
const flags = ['preload', 'public', 'locked', 'frozen', 'unique', 'scene', 'disabled']

test('blueprintPolicy: id and version limits, required only on add', () => {
  assert.deepEqual(sanitizeBlueprintAdd(base), { ok: true, value: base, changed: false })
  for (const input of [{}, { id: 'x' }, { version: 0 }, { id: null, version: 0 }, { id: 'x', version: undefined }]) {
    assert.equal(sanitizeBlueprintAdd(input).ok, false)
    assert.equal(sanitizeBlueprintModify(input).ok, true)
  }
  for (const sanitize of sanitizers) {
    for (const id of ['', 'x'.repeat(65), 1, {}, true]) assert.equal(sanitize({ ...base, id }).ok, false)
    for (const version of [-1, 1.2, Infinity, NaN, '0', Number.MAX_SAFE_INTEGER + 1]) {
      assert.equal(sanitize({ ...base, version }).ok, false)
    }
    assert.equal(sanitize({ id: 'x'.repeat(64), version: Number.MAX_SAFE_INTEGER }).ok, true)
  }
})

test('blueprintPolicy: every text cap, null and surrogate-safe truncation', () => {
  for (const sanitize of sanitizers) {
    for (const [key, max] of Object.entries(textLimits)) {
      for (const item of [null, '', 'x'.repeat(max)]) {
        assert.deepEqual(sanitize({ ...base, [key]: item }), {
          ok: true,
          value: { ...base, [key]: item },
          changed: false,
        })
      }
      const safe = sanitize({ ...base, [key]: 'x'.repeat(max - 1) + '😀tail' })
      assert.equal(safe.value[key], 'x'.repeat(max - 1))
      assert.equal(safe.changed, true)
      for (const item of [false, 1, [], {}]) assert.equal(sanitize({ ...base, [key]: item }).ok, false)
    }
  }
})

test('blueprintPolicy: flags are booleans; absent, undefined and non-nullable null never default', () => {
  for (const sanitize of sanitizers) {
    for (const key of flags) {
      for (const item of [true, false]) assert.equal(sanitize({ ...base, [key]: item }).value[key], item)
      for (const item of [0, 1, '', 'true', {}, []]) assert.equal(sanitize({ ...base, [key]: item }).ok, false)
      for (const item of [null, undefined]) assert.deepEqual(sanitize({ ...base, [key]: item }).value, base)
    }
    for (const key of [...Object.keys(textLimits), 'image', 'props']) {
      assert.deepEqual(sanitize({ ...base, [key]: undefined }).value, base)
      assert.equal(sanitize({ ...base, [key]: null }).value[key], null)
    }
    assert.deepEqual(sanitize(base).value, base)
  }
  assert.deepEqual(sanitizeBlueprintModify({ id: null, version: null }).value, {})
})

test('blueprintPolicy: image and props are plain objects or null; nested values are JSON only', () => {
  const bad = [undefined, new Date(), new Map(), new Set(), new Uint8Array(1), () => {}, Symbol('x'), 1n, NaN, Infinity]
  for (const key of ['props', 'image']) {
    for (const value of [[], true, 1, 'text', ...bad.slice(1)]) {
      assert.equal(sanitizeBlueprintAdd({ ...base, [key]: value }).ok, false)
    }
    for (const value of bad.slice(1)) assert.equal(sanitizeBlueprintAdd({ ...base, [key]: { value } }).ok, false)
    const input = { ...base, [key]: { all: [null, false, 2.5, 'text', {}] } }
    const safe = sanitizeBlueprintAdd(input)
    assert.deepEqual(safe.value, input)
    assert.notEqual(safe.value[key], input[key])
    assert.equal(safe.changed, false)
  }
})

test('blueprintPolicy: walk counts every key and value, with a shared 8192-item budget', () => {
  // root + key + array + 8189 values = 8192
  const props = { list: Array(8189).fill(null) }
  assert.equal(sanitizeBlueprintAdd({ ...base, props }).ok, true)
  assert.equal(sanitizeBlueprintAdd({ ...base, props, image: {} }).ok, false)
  props.list.push(null)
  assert.equal(sanitizeBlueprintAdd({ ...base, props }).ok, false)
  assert.equal(sanitizeBlueprintAdd({ ...base, props: { list: Array(8189) } }).ok, true)
  assert.equal(sanitizeBlueprintAdd({ ...base, props: { list: Array(8190) } }).ok, false)
  const pairs = Object.fromEntries(Array.from({ length: 4095 }, (_, i) => [`k${i}`, i]))
  assert.equal(sanitizeBlueprintAdd({ ...base, props: pairs }).ok, true)
  pairs.extra = 1
  assert.equal(sanitizeBlueprintAdd({ ...base, props: pairs }).ok, false)
})

test('blueprintPolicy: depth counts the JSON root, rejects cycles, and never truncates JSON strings', () => {
  let props = { text: '😀'.repeat(70 * 1024) }
  const safe = sanitizeBlueprintAdd({ ...base, props })
  assert.equal(safe.value.props.text, props.text)
  assert.equal(safe.changed, false)
  props = { leaf: null }
  for (let i = 0; i < 14; i++) props = { next: props }
  assert.equal(sanitizeBlueprintAdd({ ...base, props }).ok, true)
  assert.equal(sanitizeBlueprintAdd({ ...base, props: { next: props } }).ok, false)
  const cycle = {}
  cycle.self = cycle
  assert.equal(sanitizeBlueprintAdd({ ...base, props: cycle }).ok, false)
})

test('blueprintPolicy: undefined is absent and special keys cannot pollute prototypes', () => {
  const props = JSON.parse('{"__proto__":{"polluted":true},"constructor":"value"}')
  props.absent = undefined
  props.array = [1, undefined, 2]
  const safe = sanitizeBlueprintAdd({ ...base, props })
  assert.equal(safe.ok, true)
  assert.equal(safe.changed, true)
  assert.equal(Object.hasOwn(safe.value.props, 'absent'), false)
  assert.deepEqual(safe.value.props.array, [1, null, 2])
  assert.equal(Object.getPrototypeOf(safe.value.props), Object.prototype)
  assert.equal(Object.hasOwn(safe.value.props, '__proto__'), true)
  assert.equal({}.polluted, undefined)
  assert.equal(sanitizeBlueprintAdd({ ...base, props: { [Symbol('bad')]: 1 } }).ok, false)
})

test('blueprintPolicy: unknown-key hook is escaped and bounded without inspecting its value', () => {
  const names = []
  const key = '\n"' + 'x'.repeat(40)
  const data = { ...base }
  Object.defineProperty(data, key, {
    enumerable: true,
    get: () => {
      throw Error('must not read')
    },
  })
  const safe = sanitizeBlueprintAdd(data, { onUnknownKey: name => names.push(name) })
  assert.equal(safe.ok, true)
  assert.deepEqual(safe.value, base)
  assert.equal(safe.changed, true)
  assert.equal(names.length, 1)
  assert.equal(JSON.parse(names[0]).length, 32)
  assert.ok(!names[0].includes('\n'))
})

// the shapes of the five production blueprints (keys, nulls, nesting, prop records) with ids, names and asset hashes replaced
const production = JSON.parse(fs.readFileSync(new URL('./fixtures/blueprint-shapes.json', import.meta.url)))
const collectionDirectory = new URL('../../src/world/collections/default/', import.meta.url)
const collectionManifest = JSON.parse(fs.readFileSync(new URL('manifest.json', collectionDirectory)))
const collectionFiles = fs.readdirSync(collectionDirectory).filter(name => name.endsWith('.hyp'))
const collection = collectionFiles.map(name => {
  const bytes = fs.readFileSync(new URL(name, collectionDirectory))
  const blueprint = JSON.parse(bytes.subarray(4, 4 + bytes.readUInt32LE(0))).blueprint
  return { ...blueprint, id: blueprint.id || name, version: blueprint.version ?? 0 }
})

test('blueprintPolicy: production shapes and every manifest-listed collection blueprint pass unchanged', () => {
  assert.equal(production.length, 5)
  assert.ok(collectionManifest.apps.length > 0, 'the default catalog must not be empty')
  assert.deepEqual([...collectionFiles].sort(), [...collectionManifest.apps].sort())
  for (const blueprint of [...production, ...collection]) {
    assert.deepEqual(sanitizeBlueprintAdd(blueprint), { ok: true, value: blueprint, changed: false }, blueprint.name)
  }
})

test('blueprintPolicy: client normalization and the server policy on strict-decoded wire values agree', () => {
  const inputs = [
    ...production,
    ...collection,
    { ...base, name: '😀'.repeat(1000), props: { text: 'x'.repeat(20000) } },
    { ...base, author: null },
    { ...base, props: { list: [1, undefined, ...Array(1), 2], absent: undefined } },
    { ...base, disabled: 'bad' },
  ]
  for (const data of inputs) {
    for (const [name, sanitize] of [
      ['blueprintAdded', sanitizeBlueprintAdd],
      ['blueprintModified', sanitizeBlueprintModify],
    ]) {
      const decoded = strictDecode(writeClientPacket(name, data), { maxNodes: 8192, build: true })
      assert.equal(decoded.ok, true)
      assert.deepEqual(sanitize(decoded.value[1]), sanitize(data))
    }
  }
})

test('blueprintPolicy: a fork script-only app and splat blueprint pass unchanged', () => {
  for (const blueprint of [
    {
      id: 'script-only',
      version: 0,
      model: 'script-only',
      script: 'asset://event-probe.js',
      props: { text: 'kept', file: null },
    },
    { id: 'splat', version: 1, model: 'asset://capture.spz', props: {} },
  ])
    assert.deepEqual(sanitizeBlueprintAdd(blueprint), { ok: true, value: blueprint, changed: false })
})
