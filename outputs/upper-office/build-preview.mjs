import fs from 'node:fs/promises'
import { build } from 'esbuild'
const directory = new URL('./', import.meta.url)
const packages = {}
const placements = Object.fromEntries(JSON.parse(await fs.readFile(new URL('objects.json', directory), 'utf8'))
  .map(o => [o.key, { position: o.position, rotation: o.rotation }]))
for (const name of ['desk', 'chair', 'house']) {
  packages[name] = (await fs.readFile(new URL(name + '.hyp', directory))).toString('base64')
}
const bundle = await build({
  entryPoints: ['outputs/upper-office/preview.mjs'], bundle: true, format: 'esm', platform: 'browser', write: false,
  define: { process: '{"env":{"PUBLIC_PLAYER_COLLISION":"false"}}' },
})
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Upstairs office furniture</title>
<style>html,body{margin:0;overflow:hidden;font:14px system-ui;color:#2d2219}canvas{display:block}header{position:absolute;left:18px;top:18px;max-width:710px;background:#fff8eae8;padding:12px 16px;border-radius:10px}h1{font-size:18px;margin:0 0 8px}nav{display:flex;gap:6px;margin-bottom:6px}button{padding:6px 9px;background:#fffaf0;border:1px solid #bca98c;border-radius:5px}button[aria-pressed=true]{color:#fff;background:#705037}p{margin:9px 0}footer{position:absolute;bottom:18px;left:18px;background:#fff8eae8;padding:9px 14px;border-radius:9px}</style></head>
<body><canvas></canvas><header><h1>Upstairs office · two individual objects</h1><nav id="scopes"></nav><nav id="views"></nav><p id="caption"></p><p>Caster motion demo:</p><nav id="motions"></nav><p>In-world chair: E to sit · WASD / arrows to roll · Q / E to turn · Space to stand. Release controls to coast.</p></header><footer><button id="download-desk">Download desk .hyp</button> <button id="download-chair">Download chair .hyp</button></footer>
<script>window.PACKAGES=${JSON.stringify(packages)};window.OBJECT_PLACEMENTS=${JSON.stringify(placements)}</script><script type="module">${bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`
await fs.writeFile(new URL('preview.html', directory), html)
console.log('Built exact-package desk, chair and room preview')
