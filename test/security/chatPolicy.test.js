// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/chatPolicy.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { CHAT_BODY_MAX_LENGTH, cutText, sanitizeChatMessage } from '../../src/core/extras/chatPolicy.js'

const MAX = CHAT_BODY_MAX_LENGTH
const segmenter = new Intl.Segmenter()
// the longest prefix of whole graphemes that fits in `max`, from a segmentation of the whole string
const reference = (text, max) => {
  let end = 0
  for (const { index, segment } of segmenter.segment(text)) {
    if (index + segment.length > max) break
    end = index + segment.length
  }
  return text.slice(0, end)
}

test('sanitizeChatMessage: a text body passes as { body }; the id, sender and time are never copied', () => {
  assert.deepEqual(
    sanitizeChatMessage({ id: 'abc123', body: 'hello', from: 'spoof', fromId: 'spoof', createdAt: 'x', extra: 1 }),
    { body: 'hello' }
  )
  assert.equal('id' in sanitizeChatMessage({ id: 'abc123', body: 'hello' }), false)
  assert.equal(MAX, 500)
})

test('sanitizeChatMessage: the body is trimmed and capped', () => {
  assert.deepEqual(sanitizeChatMessage({ body: '  hi there \n' }), { body: 'hi there' })
  assert.equal(sanitizeChatMessage({ body: 'x'.repeat(500) }).body.length, 500)
  assert.equal(sanitizeChatMessage({ body: 'x'.repeat(501) }).body.length, 500)
  assert.equal(sanitizeChatMessage({ body: ' ' + 'x'.repeat(600) }).body, 'x'.repeat(500))
  // whitespace that ends up at the end of the window is trimmed off the cut
  assert.equal(sanitizeChatMessage({ body: 'a'.repeat(400) + ' '.repeat(200) + 'b' }).body, 'a'.repeat(400))
  const t0 = performance.now()
  const huge = sanitizeChatMessage({ body: 'y'.repeat(5_000_000) })
  assert.equal(huge.body.length, 500)
  assert.ok(performance.now() - t0 < 500, 'a 5 MB body is cut in O(max) after the trim')
})

test('cutText: never splits a surrogate pair at the cap', () => {
  assert.equal(sanitizeChatMessage({ body: 'a'.repeat(499) + '😀' }).body, 'a'.repeat(499))
  assert.equal(sanitizeChatMessage({ body: 'a'.repeat(500) + '😀' }).body, 'a'.repeat(500))
  assert.equal(sanitizeChatMessage({ body: 'a'.repeat(498) + '😀' + 'b' }).body, 'a'.repeat(498) + '😀')
})

test('cutText: keeps a ZWJ family, a flag and a modified emoji whole at every cut position', () => {
  const clusters = ['👨‍👩‍👧‍👦', '🇯🇵', '👍🏽', 'é', 'é', '🏳️‍🌈', 'a']
  for (const cluster of clusters) {
    for (let pad = 0; pad < 12; pad++) {
      const text = 'x'.repeat(MAX - pad) + cluster + 'tail'
      const cut = cutText(text, MAX)
      assert.equal(cut, reference(text, MAX), `${cluster} with ${pad} units of room`)
      assert.ok(cut.length <= MAX)
    }
  }
  // a run of clusters straddling the cap, at every cap around it
  const run = '👨‍👩‍👧‍👦🇯🇵👍🏽'.repeat(60)
  for (let max = 480; max <= 520; max++) assert.equal(cutText(run, max), reference(run, max), `max ${max}`)
})

test('cutText: a single cluster longer than the cap falls back to a unit cut that keeps pairs whole', () => {
  const accents = 'a' + '́'.repeat(700) // one grapheme of 701 units
  assert.equal(cutText(accents, MAX).length, MAX)
  assert.equal(sanitizeChatMessage({ body: accents }).body.length, MAX)
  const family = '👨' + '‍👩'.repeat(300) // one grapheme of 902 units
  assert.equal(cutText(family, 500).length, 500) // index 499 is a low surrogate: the pair is complete
  assert.equal(cutText(family, 499).length, 498) // index 498 is a high surrogate: step back off it
})

test('cutText: text within the cap is returned as is', () => {
  assert.equal(cutText('', 5), '')
  assert.equal(cutText('hello', 5), 'hello')
  assert.equal(cutText('😀😀', 4), '😀😀')
})

test('sanitizeChatMessage: an empty or blank body is refused', () => {
  for (const body of ['', ' ', '\n\t ', ' ']) {
    assert.equal(sanitizeChatMessage({ body }), null, JSON.stringify(body))
  }
})

test('sanitizeChatMessage: a body that is not a string is refused', () => {
  for (const body of [
    undefined,
    null,
    1,
    0,
    true,
    { bad: true },
    ['x'],
    new String('boxed'),
    new Map([['body', 'x']]),
    new Uint8Array(2),
    Symbol('s'),
    () => 'x',
  ]) {
    assert.equal(sanitizeChatMessage({ body }), null, typeof body === 'symbol' ? 'symbol' : String(body))
  }
  assert.equal(sanitizeChatMessage({}), null)
})

test('sanitizeChatMessage: the message itself must be a plain object', () => {
  for (const msg of [undefined, null, 'hello', 1, ['hello'], new Map([['body', 'hello']]), new (class M {})()]) {
    assert.equal(sanitizeChatMessage(msg), null, String(msg))
  }
  const bare = Object.create(null)
  bare.body = 'hello'
  assert.deepEqual(sanitizeChatMessage(bare), { body: 'hello' })
})

test('sanitizeChatMessage: the body is read once (getters and proxies cannot swap the value)', () => {
  let bodyReads = 0
  const msg = {}
  Object.defineProperty(msg, 'body', {
    enumerable: true,
    get() {
      return bodyReads++ === 0 ? 'first' : { bad: true }
    },
  })
  assert.deepEqual(sanitizeChatMessage(msg), { body: 'first' })
  assert.equal(bodyReads, 1)

  let traps = 0
  const proxied = new Proxy(
    { body: 'x' },
    {
      get(target, key) {
        traps++
        if (key === 'body') return traps % 2 ? 'odd' : { bad: true }
        return target[key]
      },
    }
  )
  const safe = sanitizeChatMessage(proxied)
  // whichever read happened, the output is the string that was checked
  assert.ok(safe === null || safe.body === 'odd')
})
