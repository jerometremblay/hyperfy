import fs from 'node:fs/promises'
import { build } from 'esbuild'
const packageBytes = await fs.readFile(new URL('macbook-pro-16.hyp', import.meta.url))
const bundle = await build({
  entryPoints: ['outputs/macbook-pro-16/preview.mjs'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  write: false,
  define: { 'process.env.PUBLIC_PLAYER_COLLISION': '"false"' },
})
const html = `<!doctype html><html><head><meta charset="utf-8"><title>MacBook Pro 16 — Space Gray</title>
<style>html,body{margin:0;overflow:hidden;font:14px system-ui;background:#dedfe2;color:#25272b}
#view{position:absolute;inset:0}header{position:absolute;top:18px;left:18px;z-index:5;background:#ffffffee;padding:14px 18px;border-radius:12px;box-shadow:0 3px 20px #0001}
h1{font-size:18px;margin:0 0 8px}p{margin:8px 0}button,a{margin:2px;padding:6px 10px;border:1px solid #b4b6bd;border-radius:6px;background:#fafafa;color:#25272b;cursor:pointer}
</style></head><body><div id="view"></div><header><h1>MacBook Pro 16 · Space Gray</h1>
<div id="views"></div><p><button id="toggle">Close lid</button> <a href="macbook-pro-16.hyp" download>Download standalone .hyp</a></p>
<p>Orbit to inspect · Scroll to zoom · Static GitHub screenshot</p></header>
<script>window.PACKAGE=${JSON.stringify(packageBytes.toString('base64'))}</script>
<script type="module">${bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`
await fs.writeFile(new URL('preview.html', import.meta.url), html)
console.log('Created exact-package extrusion preview')
