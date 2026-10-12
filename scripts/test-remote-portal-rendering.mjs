import { createServer } from 'node:http'
import { build } from 'esbuild'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'
import { readFile } from 'node:fs/promises'

const stars = await readFile(new URL('../src/client/public/stars.json', import.meta.url))

createServer(async (request, response) => {
  if (request.url === '/stars.json') {
    response.setHeader('Content-Type', 'application/json')
    response.end(stars)
  } else if (request.url === '/test.js') {
    const bundle = await build({
      entryPoints: ['src/core/systems/RemotePortal.browser-test.js'],
      bundle: true,
      format: 'esm',
      platform: 'browser',
      plugins: [polyfillNode({})],
      write: false,
    })
    response.setHeader('Content-Type', 'text/javascript')
    response.end(bundle.outputFiles[0].contents)
  } else {
    response.setHeader('Content-Type', 'text/html')
    response.end(
      '<!doctype html><meta charset="utf-8"><title>Remote portal stereo</title><style>body{background:#161a22;color:white;font:16px system-ui}main{display:flex}figure{margin:8px}img{width:480px}pre{white-space:pre-wrap}</style><h1>Remote portal · real destination connection · stereo cameras</h1><main></main><pre>Connecting…</pre><script type="module" src="/test.js"></script>'
    )
  }
}).listen(3336, '127.0.0.1', () =>
  console.log('Open http://127.0.0.1:3336 after launching scripts/test-remote-portals.mjs')
)
