import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'

const require = createRequire('/Users/jerome/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')
const { chromium } = require('playwright')
const directory = new URL('./', import.meta.url)
const bundle = await build({
  entryPoints: [new URL('browser.js', directory).pathname],
  bundle: true, platform: 'browser', format: 'esm', write: false,
  plugins: [polyfillNode({})],
})
const server = createServer((request, response) => {
  if (request.url === '/test.js') {
    response.setHeader('Content-Type', 'text/javascript')
    response.end(bundle.outputFiles[0].contents)
  } else {
    response.setHeader('Content-Type', 'text/html')
    response.end('<!doctype html><meta charset="utf-8"><title>Portal preview visibility</title>' +
      '<style>body{background:#161a22;color:white;font:16px system-ui}pre{white-space:pre-wrap}</style>' +
      '<h1>Explicit portal preview visibility</h1><pre>Running…</pre><script type="module" src="/test.js"></script>')
  }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--use-angle=metal', '--enable-webgl'],
  })
  const page = await browser.newPage({ viewport: { width: 900, height: 1050 } })
  await page.goto('http://127.0.0.1:' + server.address().port)
  await page.waitForFunction(() => window.result)
  const result = await page.evaluate(() => window.result)
  await page.screenshot({ path: new URL('webgl.png', directory).pathname })
  await fs.writeFile(new URL('webgl-validation.json', directory), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result))
  assert.equal(result.valid, true, result.error)
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
}
