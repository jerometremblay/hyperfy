// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/uploadPolicy.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ALLOWED_EXTENSIONS,
  INLINE_EXTENSIONS,
  assetHeaders,
  authorizeUpload,
  extensionOf,
  isAllowedExtension,
  isUploadCheckFilename,
  matchesSignature,
  parseBearer,
} from '../../src/server/uploadPolicy.js'

const hash = 'a'.repeat(64)
const buf = (...parts) =>
  Buffer.concat(parts.map(p => (typeof p === 'string' ? Buffer.from(p, 'latin1') : Buffer.from(p))))

test('parseBearer: extracts the token (scheme case-insensitive), null for anything else', () => {
  assert.equal(parseBearer('Bearer abc.def'), 'abc.def')
  assert.equal(parseBearer('bearer abc'), 'abc')
  assert.equal(parseBearer('  Bearer   abc  '), 'abc')
  for (const h of ['Basic abc', 'Bearer', 'Bearer ', 'Bearer a b', 'abc', '', undefined, null, 1, ['Bearer abc']]) {
    assert.equal(parseBearer(h), null, String(h))
  }
})

test('extensionOf: text after the last dot, lowercased; no dot means no extension', () => {
  assert.equal(extensionOf('model.GLB'), 'glb')
  assert.equal(extensionOf('a.b.c.png'), 'png')
  assert.equal(extensionOf('.glb'), 'glb')
  assert.equal(extensionOf('noext'), '')
  assert.equal(extensionOf('js'), '')
  assert.equal(extensionOf('trailing.'), '')
  assert.equal(extensionOf(''), '')
  assert.equal(extensionOf(undefined), '')
  assert.equal(extensionOf(null), '')
  // an extensionless file named like an allowed type is not that type
  assert.equal(isAllowedExtension(extensionOf('js')), false)
  assert.equal(isAllowedExtension(extensionOf('glb')), false)
})

test('isAllowedExtension: the fork picker/loader types, exact match', () => {
  assert.equal(ALLOWED_EXTENSIONS.length, 19)
  for (const ext of ALLOWED_EXTENSIONS) assert.equal(isAllowedExtension(ext), true, ext)
  const rejected = [
    'html',
    'htm',
    'svg',
    'json',
    'txt',
    'gif',
    'hyp',
    'xml',
    'wasm',
    '',
    'GLB',
    'glb ',
    ' glb',
    undefined,
    null,
    1,
  ]
  for (const ext of rejected) assert.equal(isAllowedExtension(ext), false, String(ext))
})

test('isAllowedExtension: separators and dot segments never pass', () => {
  const hostile = [
    'glb/',
    '/glb',
    'gl/b',
    'glb\\',
    '\\glb',
    '..',
    '../glb',
    'glb/..',
    '..\\glb',
    'glb..',
    '.glb',
    'js/../../x',
  ]
  for (const ext of hostile) assert.equal(isAllowedExtension(ext), false, ext)
  // the exact strings computeAssetFilename would derive from hostile upload names
  for (const name of ['x.glb/../../y', 'x.js\\..\\y', 'x./', 'x.', '..', '/etc/passwd']) {
    assert.equal(isAllowedExtension(extensionOf(name)), false, name)
  }
})

test('isUploadCheckFilename: 64 hex chars + allowed extension only', () => {
  for (const ext of ALLOWED_EXTENSIONS) assert.equal(isUploadCheckFilename(`${hash}.${ext}`), true, ext)
  const rejected = [
    `${hash}.html`,
    `${hash}.svg`,
    `${hash}.js.html`,
    hash,
    `${hash}.`,
    `${'A'.repeat(64)}.glb`,
    `${'a'.repeat(63)}.glb`,
    `${'a'.repeat(65)}.glb`,
    `../${hash}.glb`,
    `${hash}.glb/..`,
    `${hash}.glb/../x`,
    `..\\${hash}.glb`,
    `/${hash}.glb`,
    `${hash}.glb?x`,
    `${hash}.glb\n`,
    'crash-block.glb',
    '',
    undefined,
    null,
    5,
    [`${hash}.glb`],
  ]
  for (const name of rejected) assert.equal(isUploadCheckFilename(name), false, String(name))
})

test('authorizeUpload: builders upload anything, visitors only vrm while customAvatars is on', () => {
  const builder = { isBuilder: () => true }
  const visitor = { isBuilder: () => false }
  for (const ext of ALLOWED_EXTENSIONS) {
    assert.equal(authorizeUpload({ player: builder, settings: { customAvatars: false }, ext }).ok, true, ext)
    assert.equal(authorizeUpload({ player: visitor, settings: { customAvatars: false }, ext }).ok, false, ext)
  }
  assert.equal(authorizeUpload({ player: visitor, settings: { customAvatars: true }, ext: 'vrm' }).ok, true)
  assert.equal(authorizeUpload({ player: visitor, settings: { customAvatars: true }, ext: 'glb' }).ok, false)
  assert.equal(authorizeUpload({ player: visitor, settings: { customAvatars: true }, ext: 'js' }).ok, false)
  assert.equal(authorizeUpload({ player: visitor, settings: {}, ext: 'vrm' }).ok, false)
  assert.deepEqual(authorizeUpload({ player: visitor, settings: { customAvatars: false }, ext: 'js' }), {
    ok: false,
    reason: 'builder rank required',
  })
})

test('authorizeUpload: the rank comes from the player (effective rank), nothing else', () => {
  let asked = 0
  const player = {
    isBuilder: () => {
      asked++
      return true
    },
  }
  assert.equal(authorizeUpload({ player, settings: {}, ext: 'png' }).ok, true)
  assert.equal(asked, 1)
})

test('matchesSignature: glb/vrm need the glTF magic', () => {
  const glb = buf('glTF', [2, 0, 0, 0])
  assert.equal(matchesSignature('glb', glb).ok, true)
  assert.equal(matchesSignature('vrm', glb).ok, true)
  for (const bad of [buf('<html>'), buf('gltf'), buf(''), buf('glT'), buf(' glTF')]) {
    assert.equal(matchesSignature('glb', bad).ok, false)
    assert.equal(matchesSignature('vrm', bad).ok, false)
  }
})

test('matchesSignature: any image signature satisfies any image extension', () => {
  const png = buf([0x89], 'PNG\r\n\x1a\n')
  const jpg = buf([0xff, 0xd8, 0xff, 0xe0])
  const webp = buf('RIFF', [0, 0, 0, 0], 'WEBPVP8 ')
  const bad = [buf('<html><script>'), buf('<svg xmlns'), buf('RIFF', [0, 0, 0, 0], 'WAVE'), buf([0xff, 0xd8]), buf('')]
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    for (const img of [png, jpg, webp]) assert.equal(matchesSignature(ext, img).ok, true, ext)
    for (const b of bad) assert.equal(matchesSignature(ext, b).ok, false, ext)
  }
})

test('matchesSignature: hdr starts with #?', () => {
  assert.equal(matchesSignature('hdr', buf('#?RADIANCE\n')).ok, true)
  assert.equal(matchesSignature('hdr', buf('#?RGBE\n')).ok, true)
  assert.equal(matchesSignature('hdr', buf('<html>')).ok, false)
  assert.equal(matchesSignature('hdr', buf('#')).ok, false)
})

test('matchesSignature: mp4 accepts the common first box types at offset 4', () => {
  for (const box of ['ftyp', 'moov', 'mdat', 'free', 'wide', 'skip']) {
    assert.equal(matchesSignature('mp4', buf([0, 0, 0, 24], box, 'isom')).ok, true, box)
  }
  assert.equal(matchesSignature('mp4', buf([0, 0, 0, 24], 'junk')).ok, false)
  assert.equal(matchesSignature('mp4', buf('ftyp')).ok, false)
  assert.equal(matchesSignature('mp4', buf('<html>')).ok, false)
  assert.equal(matchesSignature('mp4', buf('')).ok, false)
})

test('matchesSignature: mp3 finds ID3 or a frame sync within the first 4 KB', () => {
  assert.equal(matchesSignature('mp3', buf('ID3', [4, 0, 0])).ok, true)
  assert.equal(matchesSignature('mp3', buf([0xff, 0xfb, 0x90, 0x00])).ok, true)
  assert.equal(matchesSignature('mp3', buf([0xff, 0xe3])).ok, true)
  // leading padding before the first frame or tag
  assert.equal(matchesSignature('mp3', buf(Buffer.alloc(3000), [0xff, 0xfb])).ok, true)
  assert.equal(matchesSignature('mp3', buf(Buffer.alloc(3000), 'ID3')).ok, true)
  // beyond the scan window, no sync at all, a non-sync second byte, empty
  assert.equal(matchesSignature('mp3', buf(Buffer.alloc(5000), [0xff, 0xfb])).ok, false)
  assert.equal(matchesSignature('mp3', buf('<html><script>')).ok, false)
  assert.equal(matchesSignature('mp3', buf([0xff, 0x1f])).ok, false)
  assert.equal(matchesSignature('mp3', buf('')).ok, false)
})

test('matchesSignature: js has no signature; a mismatch carries a reason naming the type', () => {
  assert.equal(matchesSignature('js', buf('<html>')).ok, true)
  assert.equal(matchesSignature('js', buf('')).ok, true)
  const r = matchesSignature('png', buf('<html>'))
  assert.equal(r.ok, false)
  assert.match(r.reason, /png/)
})

test('assetHeaders: nosniff + explicit type everywhere; sandbox + attachment outside the inline set', () => {
  const inline = new Set(INLINE_EXTENSIONS)
  for (const ext of [...ALLOWED_EXTENSIONS, 'html', 'svg', 'json', '', 'unknown']) {
    const h = assetHeaders(ext)
    assert.equal(h['X-Content-Type-Options'], 'nosniff', ext)
    assert.equal(typeof h['Content-Type'], 'string', ext)
    if (inline.has(ext)) {
      assert.equal(h['Content-Security-Policy'], undefined, ext)
      assert.equal(h['Content-Disposition'], undefined, ext)
    } else {
      assert.equal(h['Content-Security-Policy'], "sandbox; default-src 'none'", ext)
      assert.equal(h['Content-Disposition'], 'attachment', ext)
    }
  }
  assert.equal(assetHeaders('glb')['Content-Type'], 'model/gltf-binary')
  assert.equal(assetHeaders('vrm')['Content-Type'], 'model/gltf-binary')
  assert.equal(assetHeaders('js')['Content-Type'], 'text/javascript')
  assert.equal(assetHeaders('hdr')['Content-Type'], 'image/vnd.radiance')
  assert.equal(assetHeaders('png')['Content-Type'], 'image/png')
  assert.equal(assetHeaders('html')['Content-Type'], 'application/octet-stream')
  assert.equal(assetHeaders('svg')['Content-Type'], 'application/octet-stream')
})
