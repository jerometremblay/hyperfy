import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: [new URL('../src/core/systems/NightSky.browser-test.js', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  write: false,
})
const catalog = await readFile(new URL('../src/client/public/stars.json', import.meta.url))
const hdr = await readFile(new URL('../src/client/public/Clear_08_4pm_LDR.hdr', import.meta.url))
const html = `<!doctype html><meta charset="utf-8"><title>Night sky regression</title>
<style>body{background:#151922;color:#eee;font:15px system-ui;margin:24px}
main{display:grid;grid-template-columns:800px;gap:14px}p{margin:5px 0}pre{font-size:12px;white-space:pre-wrap}</style>
<h1>Catalog night sky · WebGL checks</h1><pre>Rendering…</pre><main></main>
<script type="module" src="/test.js"></script>`
createServer((request, response) => {
  if (request.url === '/test.js') {
    response.setHeader('Content-Type', 'text/javascript')
    response.end(bundle.outputFiles[0].contents)
  } else if (request.url === '/stars.json') {
    response.setHeader('Content-Type', 'application/json')
    response.end(catalog)
  } else if (request.url === '/ambient.hdr') {
    response.end(hdr)
  } else if (request.url === '/') {
    response.setHeader('Content-Type', 'text/html')
    response.end(html)
  } else response.writeHead(404).end()
}).listen(3100, '127.0.0.1', () => console.log('Open http://127.0.0.1:3100/ for the night sky checks.'))
