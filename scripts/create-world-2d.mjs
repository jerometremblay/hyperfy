import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
await build({
  entryPoints: [path.join(root, 'scripts/seed-world-2d.mjs')],
  outfile: path.join(root, 'build/seed-world-2d.mjs'),
  platform: 'node',
  format: 'esm',
  packages: 'external',
  bundle: true,
  logLevel: 'warning',
})
await import('../build/seed-world-2d.mjs')
