import { build } from 'esbuild'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Script } from 'node:vm'

const dir = dirname(fileURLToPath(import.meta.url))
const template = await readFile(resolve(dir, 'preview.template.html'), 'utf8')
const result = await build({
  entryPoints: [resolve(dir, 'preview.mjs')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  minify: true,
  legalComments: 'inline',
  metafile: true,
  write: false,
})
if (Object.values(result.metafile.outputs).some(output => output.imports.length)) {
  throw new Error('The preview must not require external scripts')
}
const source = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')
const errorHandler = `<script>window.addEventListener('error',function(event){var status=document.getElementById('status');if(status)status.textContent='Preview could not load: '+event.message})</script>`
const marker = '<!-- PREVIEW_SCRIPT -->'
if (template.split(marker).length !== 2) throw new Error('Expected one preview script marker')
new Script(source)
const html = template.replace(marker, () => `${errorHandler}\n<script>${source}</script>`)
const output = resolve(dir, 'preview.html')
if (process.argv.includes('--check')) {
  if (await readFile(output, 'utf8') !== html) throw new Error('Preview is out of date; run build-preview.mjs')
  console.log('Preview is current and has no external script imports')
} else {
  await writeFile(output, html)
  console.log(`Built ${output}`)
}
