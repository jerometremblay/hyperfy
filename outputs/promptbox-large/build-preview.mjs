import fs from 'node:fs/promises'
import { build } from 'esbuild'

const directory = new URL('./', import.meta.url)
let preview = await fs.readFile(new URL('../luxury-log-cabin/preview.mjs', directory), 'utf8')
preview = preview.replace("'./runtime_adapter.mjs'", "'./runtime-adapter.mjs'")
preview = preview.replace('executeSource(parsed.source)', "executeSource(parsed.source, '', { props: parsed.header.blueprint.props })")
preview = preview.replace(
  "Exterior: { eye: [24, 17, -28], target: [0, 4.0, 0], fov: 44 },",
  `Exterior: { eye: [24, 17, 32], target: [0, 4.0, 3], fov: 44 },
  'Rear extension': { eye: [12, 10, 26], target: [0, 3.3, 9.8], fov: 44 },
  'Upper connection': { eye: [1.75, 4.95, 11.35], target: [-0.7, 4.7, 5.6], fov: 78 },
  'Lower connection': { eye: [1.7, 1.8, 11.25], target: [-0.2, 1.8, 4], fov: 78 },
  'Patio doors': { eye: [0, 1.75, 9.2], target: [0, 1.75, 13], fov: 78 },`,
)
preview = preview.replace(
  "['roof', 'roof-frame', 'gables', 'ceilings'].includes(mesh.userData.part)",
  "['roof', 'roof-frame', 'gables', 'ceilings', 'extension-roof'].includes(mesh.userData.part)",
)
preview = preview.replace('luxury_log_cabin.hyp', 'house-extension.hyp')
preview = preview.replace('5 hinged doors', '5 hinged doors · 1 sliding patio door')
await fs.writeFile(new URL('preview.mjs', directory), preview)
const bundled = await build({
  entryPoints: [new URL('preview.mjs', directory).pathname],
  bundle: true, format: 'esm', platform: 'browser', write: false,
  define: { process: '{"env":{"PUBLIC_PLAYER_COLLISION":"false"}}' },
})
const bytes = await fs.readFile(new URL('house-extension.hyp', directory))
const code = bundled.outputFiles[0].text.replaceAll('</script', '<\\/script')
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Larch House extension</title>
<style>html,body{margin:0;overflow:hidden;font-family:system-ui;color:#241d16}canvas{display:block}
header{position:absolute;top:15px;left:18px;max-width:950px;background:#fffaf0eb;padding:12px 16px;border-radius:12px}
h1{font-size:18px;margin:0 0 6px}nav{display:flex;gap:5px;flex-wrap:wrap}button{padding:6px;border:1px solid #ad9c88;border-radius:5px;background:#fffaf0}
button[aria-pressed=true]{background:#70543b;color:white}footer{position:absolute;bottom:15px;left:18px;background:#fffaf0eb;padding:9px 14px;border-radius:9px}
#caption{font-size:12px;margin:7px 0}#status{font-size:12px}</style></head><body>
<canvas></canvas><header><h1>Larch House · two-storey rear extension</h1><nav id="views"></nav>
<p id="caption"></p><label><input type="checkbox" id="roof" checked>Show roof</label>
<button id="download">Download .hyp</button></header><footer id="status">Loading exact package…</footer>
<script>window.EMBEDDED_HYP="${bytes.toString('base64')}"</script><script type="module">${code}</script></body></html>`
await fs.writeFile(new URL('preview.html', directory), html)
console.log('Created self-contained preview using actual runtime geometry and exact .hyp bytes')
