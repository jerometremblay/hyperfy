import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./Anchor.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { Anchor } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

test('registers a furniture profile with the mounted anchor and exposes it to apps', () => {
  const additions = []
  const removals = []
  const world = {
    anchors: {
      add: (...args) => additions.push(args),
      remove: id => removals.push(id),
    },
  }
  const anchor = new Anchor({ id: 'middle-seat', profileId: ' modular-couch-v1:middle ' })
  anchor.ctx = { entity: { data: { id: 'couch-1' } }, world }

  anchor.mount()

  assert.deepEqual(additions, [['couch-1:middle-seat', anchor.matrixWorld, 'modular-couch-v1:middle']])
  assert.equal(anchor.getProxy().profileId, 'modular-couch-v1:middle')

  anchor.unmount()
  assert.deepEqual(removals, ['couch-1:middle-seat'])
})
