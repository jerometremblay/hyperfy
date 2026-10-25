// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/settingsPolicy.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ADMIN_SETTING_KEYS,
  BUILDER_SETTING_KEYS,
  isAdminOnlySettingKey,
  isKnownSettingKey,
  normalizeSettingValue,
} from '../../src/core/extras/settingsPolicy.js'

const serializedKeys = ['title', 'desc', 'image', 'avatar', 'customAvatars', 'voice', 'rank', 'playerLimit', 'ao']
const ok = (key, value) => normalizeSettingValue(key, value).ok
const file = { type: 'image', name: 'x.png', url: 'asset://x.png' }

test('isKnownSettingKey: true for the nine serialized keys only', () => {
  for (const key of serializedKeys) assert.equal(isKnownSettingKey(key), true, key)
  assert.equal(BUILDER_SETTING_KEYS.size + ADMIN_SETTING_KEYS.size, serializedKeys.length)
  const unknown = ['hasAdminCode', 'effectiveRank', 'world', 'deserialize', 'serialize', 'set', 'modify', 'emit']
  for (const key of [...unknown, '__proto__', 'constructor', '', undefined, null, 1]) {
    assert.equal(isKnownSettingKey(key), false, String(key))
  }
})

test('isAdminOnlySettingKey: rank and customAvatars only', () => {
  assert.equal(isAdminOnlySettingKey('rank'), true)
  assert.equal(isAdminOnlySettingKey('customAvatars'), true)
  for (const key of ['title', 'desc', 'image', 'avatar', 'voice', 'playerLimit', 'ao']) {
    assert.equal(isAdminOnlySettingKey(key), false, key)
  }
})

test('normalizeSettingValue: voice is one of the three modes', () => {
  for (const v of ['disabled', 'spatial', 'global'])
    assert.deepEqual(normalizeSettingValue('voice', v), { ok: true, value: v, changed: false })
  for (const v of ['loud', '', null, undefined, 1, {}]) assert.equal(ok('voice', v), false, String(v))
})

test('normalizeSettingValue: playerLimit is null or an integer of any sign', () => {
  for (const v of [null, 0, 5, -1, 100])
    assert.deepEqual(normalizeSettingValue('playerLimit', v), { ok: true, value: v, changed: false })
  for (const v of [1.5, NaN, Infinity, '5', undefined, true, {}]) assert.equal(ok('playerLimit', v), false, String(v))
})

test('normalizeSettingValue: ao and customAvatars are booleans', () => {
  for (const key of ['ao', 'customAvatars']) {
    assert.deepEqual(normalizeSettingValue(key, true), { ok: true, value: true, changed: false })
    assert.deepEqual(normalizeSettingValue(key, false), { ok: true, value: false, changed: false })
    for (const v of [1, 0, 'true', null, undefined, {}]) assert.equal(ok(key, v), false, `${key} ${v}`)
  }
})

test('normalizeSettingValue: rank is visitor or builder, never admin', () => {
  assert.equal(ok('rank', 0), true)
  assert.equal(ok('rank', 1), true)
  for (const v of [2, 3, -1, '1', null, undefined, true]) assert.equal(ok('rank', v), false, String(v))
})

test('normalizeSettingValue: title and desc are null or strings, truncated (not rejected) past the cap', () => {
  assert.deepEqual(normalizeSettingValue('title', null), { ok: true, value: null, changed: false })
  assert.deepEqual(normalizeSettingValue('title', ''), { ok: true, value: '', changed: false })
  assert.deepEqual(normalizeSettingValue('title', 'a'.repeat(256)), {
    ok: true,
    value: 'a'.repeat(256),
    changed: false,
  })
  assert.deepEqual(normalizeSettingValue('title', 'a'.repeat(257)), { ok: true, value: 'a'.repeat(256), changed: true })
  assert.deepEqual(normalizeSettingValue('desc', 'a'.repeat(2048)), {
    ok: true,
    value: 'a'.repeat(2048),
    changed: false,
  })
  assert.deepEqual(normalizeSettingValue('desc', 'a'.repeat(2049)), {
    ok: true,
    value: 'a'.repeat(2048),
    changed: true,
  })
  for (const v of [undefined, 1, {}, []]) {
    assert.equal(ok('title', v), false, String(v))
    assert.equal(ok('desc', v), false, String(v))
  }
})

test('normalizeSettingValue: image and avatar become a fresh { type, name, url } record', () => {
  for (const key of ['image', 'avatar']) {
    assert.deepEqual(normalizeSettingValue(key, null), { ok: true, value: null, changed: false })
    const result = normalizeSettingValue(key, file)
    assert.deepEqual(result, { ok: true, value: file, changed: false })
    assert.notEqual(result.value, file) // a copy, not the client object
    for (const v of [undefined, 'asset://x.png', {}, { url: 1 }, [], 1, new Map()]) {
      assert.equal(ok(key, v), false, `${key} ${JSON.stringify(v)}`)
    }
  }
})

test('normalizeSettingValue: a cyclic or oversized file value is stored as a bounded record and flagged as changed', () => {
  const cyclic = { ...file, extra: 1 }
  cyclic.self = cyclic
  let result = normalizeSettingValue('image', cyclic)
  assert.deepEqual(result, { ok: true, value: file, changed: true })
  assert.doesNotThrow(() => JSON.stringify(result.value))
  result = normalizeSettingValue('avatar', { type: 'avatar', name: 'n'.repeat(300), url: 'u'.repeat(3000) })
  assert.equal(result.ok, true)
  assert.equal(result.changed, true)
  assert.equal(result.value.name.length, 256)
  assert.equal(result.value.url.length, 2048)
  result = normalizeSettingValue('image', { type: 1, name: null, url: 'asset://x.png' })
  assert.deepEqual(result, { ok: true, value: { type: null, name: null, url: 'asset://x.png' }, changed: true })
})

test('normalizeSettingValue: unknown keys are never valid', () => {
  assert.equal(ok('hasAdminCode', false), false)
  assert.equal(ok('__proto__', {}), false)
})
