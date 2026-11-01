import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { build } from 'esbuild'

// The bundled mock predates app.configure and the house lighting API. Keep
// its package/hash checks, but execute scripts through this fork's constructors.
const source = await fs.readFile(process.argv[2], 'utf8')
const props = JSON.parse(await fs.readFile(new URL('desired-blueprint.json', import.meta.url))).props
const bundled = await build({
  entryPoints: ['outputs/promptbox-large/runtime-adapter.mjs'],
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { executeSource } = await import('data:text/javascript;base64,' +
  Buffer.from(bundled.outputFiles[0].contents).toString('base64'))
const counts = []
for (const server of [false, true]) {
  const runtime = await executeSource(source, '', { props, server })
  for (const key of ['update', 'fixedUpdate', 'lateUpdate']) {
    assert.equal(runtime.handlers.get(key)?.size || 0, 0)
  }
  counts.push({ server, nodes: runtime.nodes.length, idleCallbacks: 0 })
}
console.log(JSON.stringify({ ok: true, actualNativeConstructors: true, counts }))
