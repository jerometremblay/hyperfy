// The bundled primitive mock lacks app.configure and the current seat APIs.
// Use the existing preview adapter's actual fork constructors for preflight.
// Gameplay and collision motion are tested separately through PhysX + SES.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { build } from 'esbuild'
const compiled = await build({
  entryPoints: ['outputs/upper-office/runtime-adapter.mjs'],
  bundle: true, platform: 'node', format: 'esm', write: false,
})
const { executeSource } = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].contents).toString('base64'))
const source = await fs.readFile(process.argv[2], 'utf8')
const runtime = await executeSource(source)
assert(runtime.nodes.length > 0)
assert.equal(runtime.handlers.size, 0)
for (const visual of runtime.visuals) {
  assert(visual.geometry.attributes.position.array.every(Number.isFinite))
}
console.log(JSON.stringify({
  ok: true, actualForkConstructors: true, nodes: runtime.nodes.length,
  visualMeshes: runtime.visuals.length, idleCallbacks: runtime.handlers.size,
}))
