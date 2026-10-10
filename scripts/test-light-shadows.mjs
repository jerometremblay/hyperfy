import { createServer } from 'node:http'
import { build } from 'esbuild'

// Serve the regression fixture without rebuilding or starting a Hyperfy world.
const bundle = await build({
  entryPoints: [new URL('../src/core/libs/csm/CSM.browser-test.js', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  write: false,
})
const html = `<!doctype html><html><head><title>Light shadow regression</title>
<style>body{background:#181820;color:#eee;font:14px monospace}pre{white-space:pre-wrap}
div{display:inline-flex;flex-direction:column;margin:12px}</style></head>
<body><h1>Light shadow regression</h1><script type="module" src="/test.js"></script></body></html>`
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
server.listen(3098, '127.0.0.1', () => console.log('Open http://127.0.0.1:3098/ to run the WebGL shadow checks.'))
