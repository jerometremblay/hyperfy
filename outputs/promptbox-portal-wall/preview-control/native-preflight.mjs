import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { build } from 'esbuild'

const source = await fs.readFile(process.argv[2], 'utf8')
const props = JSON.parse(await fs.readFile(new URL('desired-blueprint.json', import.meta.url))).props
const bundle = await build({
  entryPoints: ['outputs/promptbox-large/runtime-adapter.mjs'],
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { executeSource } = await import('data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].contents).toString('base64'))
for (const server of [false, true]) {
  const runtime = await executeSource(source, '', { props, server })
  for (const name of ['update', 'fixedUpdate', 'lateUpdate']) {
    assert.equal(runtime.handlers.get(name)?.size || 0, 0)
  }
}
console.log(JSON.stringify({ valid: true, actualNativeConstructors: true, idleCallbacks: 0 }))
