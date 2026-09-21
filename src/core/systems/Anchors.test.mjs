import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./Anchors.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { Anchors } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

test('tracks reusable profile identity with each mounted anchor', () => {
  const anchors = new Anchors({})
  const matrix = {}

  anchors.add('couch:middle', matrix, 'modular-couch-v1:middle')
  assert.equal(anchors.get('couch:middle'), matrix)
  assert.equal(anchors.getProfileId('couch:middle'), 'modular-couch-v1:middle')

  anchors.add('couch:middle', matrix)
  assert.equal(anchors.getProfileId('couch:middle'), null)

  anchors.add('couch:middle', matrix, 'modular-couch-v1:middle')
  anchors.remove('couch:middle')
  assert.equal(anchors.getProfileId('couch:middle'), null)

  anchors.add('other-chair:seat', matrix, 'chair-v2:seat')
  anchors.destroy()
  assert.equal(anchors.get('other-chair:seat'), undefined)
  assert.equal(anchors.getProfileId('other-chair:seat'), null)
})
