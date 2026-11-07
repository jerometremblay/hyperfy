import { build } from 'esbuild'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const dir = dirname(fileURLToPath(import.meta.url))
await build({
  entryPoints: [resolve(dir, 'sofa.source.mjs')],
  outfile: resolve(dir, 'sofa.recipe.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  external: ['three'],
  alias: { 'three/addons/utils/BufferGeometryUtils.js': resolve('node_modules/three/examples/jsm/utils/BufferGeometryUtils.js') },
  legalComments: 'inline',
})
await import('./build-preview.mjs')
