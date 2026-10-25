// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/escapeHtml.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { escapeHtml } from '../../src/server/escapeHtml.js'

test('escapeHtml: escapes the five html-significant characters', () => {
  assert.equal(
    escapeHtml(`<a href="x" title='y'>&</a>`),
    '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
  )
})

test('escapeHtml: leaves ordinary text unchanged', () => {
  assert.equal(escapeHtml('Hello World 123'), 'Hello World 123')
})

test('escapeHtml: coerces non-strings like String()', () => {
  assert.equal(escapeHtml(undefined), 'undefined')
  assert.equal(escapeHtml(null), 'null')
  assert.equal(escapeHtml(42), '42')
})

test('escapeHtml: `$` replacement patterns pass through literally with a function replacer', () => {
  const html = '<title>{title}</title>'
  const title = "$& $' $` $1"
  assert.equal(
    html.replaceAll('{title}', () => escapeHtml(title)),
    '<title>$&amp; $&#39; $` $1</title>'
  )
})
