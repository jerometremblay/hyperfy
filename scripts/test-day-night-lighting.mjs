import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: [new URL('../src/core/systems/ClientEnvironment.browser-test.js', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  write: false,
})
const html = `<!doctype html><meta charset="utf-8"><title>Day/night lighting regression</title>
<style>body{background:#1b1e24;color:#eee;font:15px system-ui;margin:24px}
main{display:grid;grid-template-columns:440px 440px;gap:14px}p{margin:5px 0}pre{font-size:12px}</style>
<h1>Day/night lighting · bloom enabled</h1><main></main><pre>Rendering…</pre>
<script type="module" src="/test.js"></script>`
const hdr = await readFile(new URL('../src/client/public/Clear_08_4pm_LDR.hdr', import.meta.url))
createServer((request, response) => {
  if (request.url === '/test.js') {
    response.setHeader('Content-Type', 'text/javascript')
    response.end(bundle.outputFiles[0].contents)
  } else if (request.url === '/ambient.hdr') {
    response.end(hdr)
  } else if (request.url === '/') {
    response.setHeader('Content-Type', 'text/html')
    response.end(html)
  } else {
    response.writeHead(404).end()
  }
}).listen(3099, '127.0.0.1', () => console.log('Open http://127.0.0.1:3099/ for the WebGL lighting checks.'))
