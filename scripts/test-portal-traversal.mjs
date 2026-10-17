import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'

const bundle = await build({
  entryPoints: ['src/core/extras/portalTraversal.browser-test.js'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  write: false,
  plugins: [polyfillNode({})],
})
const assets = {
  '/avatar.vrm': ['src/world/assets/avatar.vrm', 'model/gltf-binary'],
  '/physx-js-webidl.wasm': ['src/core/physx-js-webidl.wasm', 'application/wasm'],
}
createServer(async (request, response) => {
  if (request.url === '/test.js') {
    response.setHeader('Content-Type', 'text/javascript')
    response.end(bundle.outputFiles[0].contents)
  } else if (assets[request.url]) {
    const [path, type] = assets[request.url]
    response.setHeader('Content-Type', type)
    response.end(await readFile(path))
  } else if (request.url === '/') {
    response.setHeader('Content-Type', 'text/html')
    response.end(
      '<!doctype html><meta charset="utf-8"><title>Same-world portal traversal</title><style>body{background:#182232;color:white;font:16px system-ui}main{display:flex;flex-wrap:wrap}figure{margin:8px}img{width:560px}pre{white-space:pre-wrap}</style><h1>Same-world portal · split avatar and stair support</h1><main></main><pre>Loading real avatar and PhysX…</pre><script type="module" src="/test.js"></script>'
    )
  } else response.writeHead(404).end()
}).listen(3099, '127.0.0.1', () =>
  console.log('Open http://127.0.0.1:3099/ to check same-world avatar splitting and stair support.')
)
