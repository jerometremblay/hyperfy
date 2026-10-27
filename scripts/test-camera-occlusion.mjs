import { createServer } from 'node:http'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: [new URL('../src/core/extras/CameraOcclusion.browser-test.js', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  define: { process: '{"env":{}}' },
  write: false,
})
const html = `<!doctype html><html><head><title>Camera clipping regression</title>
<style>body{background:#181820;color:#eee;font:14px monospace}pre{white-space:pre-wrap;max-height:180px;overflow:auto}
div{display:inline-flex;flex-direction:column;margin:12px}img{image-rendering:pixelated}
.examples{display:flex;flex-wrap:wrap;align-items:flex-start}.examples>div{margin:8px}
.examples img,.examples p{width:280px}</style></head>
<body><h1>Whole-app plane clipping</h1><script type="module" src="/test.js"></script></body></html>`
const server = createServer((request, response) => {
  if (request.url === '/test.js') {
    response.setHeader('Content-Type', 'text/javascript')
    response.end(bundle.outputFiles[0].contents)
  } else if (request.url === '/') {
    response.setHeader('Content-Type', 'text/html')
    response.end(html)
  } else {
    response.writeHead(404).end()
  }
})
server.listen(3099, '127.0.0.1', () => console.log('Open http://127.0.0.1:3099/ to run the WebGL clipping checks.'))
