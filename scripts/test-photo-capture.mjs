import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: ['src/core/extras/PhotoCapture.browser-test.js'],
  bundle: true,
  format: 'esm',
  write: false,
  define: { 'process.env': '{}' },
})
const avatar = await readFile(new URL('../src/world/assets/avatar.vrm', import.meta.url))
const html = `<!doctype html><html><head><title>Photo capture regression</title>
<style>body{background:#181820;color:#eee;font:14px monospace}pre{white-space:pre-wrap}
figure{display:inline-flex;flex-direction:column;margin:12px}img{width:256px}</style></head>
<body><h1>Photo capture regression</h1><script type="module" src="/test.js"></script></body></html>`
const server = createServer((request, response) => {
  if (request.url === '/test.js') {
    response.setHeader('Content-Type', 'text/javascript')
    response.end(bundle.outputFiles[0].contents)
  } else if (request.url === '/avatar.vrm') {
    response.setHeader('Content-Type', 'application/octet-stream')
    response.end(avatar)
  } else if (request.url === '/') {
    response.setHeader('Content-Type', 'text/html')
    response.end(html)
  } else response.writeHead(404).end()
})
server.listen(3099, '127.0.0.1', () => console.log('Photo capture checks: http://127.0.0.1:3099/'))
