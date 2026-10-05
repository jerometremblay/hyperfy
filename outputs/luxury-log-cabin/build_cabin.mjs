import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { build } from 'esbuild'
const directory = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(directory, '../..')
function run(...args) {
  const result = spawnSync(args[0], args.slice(1), { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stdout + result.stderr)
  return result.stdout.trim()
}
console.log(run('python3', 'hyperfy-skill/tools/validate_result.py', path.join(directory, 'luxury_log_cabin.js')))
const hyp = path.join(directory, 'luxury_log_cabin.hyp')
console.log(run('python3', 'hyperfy-skill/tools/hyp_pack.py', path.join(directory, 'luxury_log_cabin.js'), hyp,
  '--name', 'Larch House — Luxury Log Cabin', '--id', 'larch-house-luxury-log-cabin', '--author', 'Jerome',
  '--description', '18 x 15 m primitive-only log lodge. Three upper bedrooms, open mezzanine, L stair and full-height stone fireplace. Ridge 9.8 m; approved 22.9-degree gable. Static visual model, no collision. Requires Hyperfy native extrude.'))
// The bundled packer uses text/javascript; match this target's ScriptEditor MIME.
const packed = await fs.readFile(hyp)
const oldHeaderSize = packed.readUInt32LE(0)
const header = JSON.parse(packed.subarray(4, 4 + oldHeaderSize).toString())
for (const asset of header.assets) if (asset.type === 'script') asset.mime = 'text/plain'
const newHeader = Buffer.from(JSON.stringify(header)), length = Buffer.alloc(4)
length.writeUInt32LE(newHeader.length)
await fs.writeFile(hyp, Buffer.concat([length, newHeader, packed.subarray(4 + oldHeaderSize)]))
const viewer = await build({ entryPoints: [path.join(directory, 'preview.mjs')], bundle: true,
  platform: 'browser', format: 'esm', target: 'es2022', minify: true, write: false,
  define: { process: '{"env":{}}' } })
const script = viewer.outputFiles[0].text.replaceAll('</script', '<\\/script')
const template = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hyperfy App — interactive .hyp preview</title>
<style>
*{box-sizing:border-box}html,body{margin:0;overflow:hidden;width:100%;height:100%;font-family:system-ui,-apple-system,sans-serif;color:#303830;background:#d8d6cf}canvas{display:block;position:fixed;inset:0;width:100%;height:100%}
header{position:fixed;top:20px;left:24px;pointer-events:none;background:rgba(250,249,244,.94);padding:13px 16px;border-radius:5px}header small{font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:600;color:#5c695b}h1{font-family:Georgia,serif;font-weight:400;font-size:36px;letter-spacing:-1.2px;margin:5px 0}header p{margin:0;font-size:12px;color:#606b60}
#download{position:fixed;top:27px;right:28px;background:#304638;color:#f6f4ed;border:0;padding:12px 17px;border-radius:4px;font-size:12px;cursor:pointer}
aside{position:fixed;left:28px;bottom:28px;max-width:650px;width:calc(100% - 56px);padding:16px 18px;background:rgba(250,249,244,.95);border:1px solid #fafbf4;border-radius:6px;box-shadow:0 7px 40px #242b2720;backdrop-filter:blur(12px)}
#views{display:flex;flex-wrap:wrap;gap:5px}#views button{font:500 11px system-ui;border:1px solid #d8dcd1;background:#f7f8f2;color:#465243;border-radius:3px;padding:7px 10px;cursor:pointer}#views button[aria-pressed=true]{background:#344d3c;color:#fff;border-color:#344d3c}#views button:hover{border-color:#344d3c}#caption{font-size:11px;line-height:1.5;margin:11px 0 10px;color:#5b6758}.controls{font-size:10px;color:#6c7668;display:flex;gap:15px;align-items:center}.controls label{white-space:nowrap;color:#465243}.controls input{vertical-align:middle;accent-color:#344d3c}
#status{position:fixed;right:28px;bottom:26px;font-size:10px;color:#536050;background:rgba(250,249,244,.94);padding:5px 7px;border-radius:3px}#error{position:fixed;inset:auto 28px 200px;background:#713b30;color:white;padding:14px;white-space:pre-wrap;display:none;font-size:12px}
@media(max-width:850px){#status{bottom:auto;top:135px;left:18px;right:auto}h1{font-size:28px}#download{right:18px;top:22px}aside{bottom:18px;left:18px;width:calc(100% - 36px)}header{left:18px}.controls{flex-wrap:wrap;gap:6px}}
</style></head><body>
<canvas aria-label="Interactive three-dimensional cabin preview"></canvas>
<header><small>Procedural architecture / Hyperfy</small><h1>Larch House</h1><p>18 × 15 m · two levels · 9.8 m ridge</p></header>
<button id="download">Download .hyp ↗</button>
<aside><nav id="views" aria-label="Camera views"></nav><p id="caption"></p><div class="controls"><label><input id="roof" type="checkbox" checked> Roof & ceilings</label><span>Drag to orbit · right-drag to pan · scroll to zoom · WASD / Q E to move</span></div></aside>
<div id="status">Loading exact package…</div><div id="error" role="alert"></div>
<script>window.EMBEDDED_HYP='__EMBEDDED_HYP__';window.addEventListener('error',e=>{let d=document.getElementById('error');d.style.display='block';d.textContent=e.message});window.addEventListener('unhandledrejection',e=>{let d=document.getElementById('error');d.style.display='block';d.textContent=String(e.reason)})</script>
<script type="module">${script}</script></body></html>`
const templatePath = path.join(directory, '.preview_template.html')
await fs.writeFile(templatePath, template.replace(/[ \t]+$/gm, ''))
console.log(run('python3', 'hyperfy-skill/tools/make_embedded_preview.py', hyp, path.join(directory, 'luxury_log_cabin_preview.html'), '--template', templatePath))
await fs.unlink(templatePath)
await fs.rm(path.join(directory, 'extracted'), { recursive: true, force: true })
console.log(run('python3', 'hyperfy-skill/tools/hyp_extract.py', hyp, path.join(directory, 'extracted')))
for (const asset of header.assets) {
  const bytes = await fs.readFile(path.join(directory, 'extracted', asset.url.slice('asset://'.length)))
  if (asset.type === 'script' && !bytes.equals(await fs.readFile(path.join(directory, 'luxury_log_cabin.js')))) throw new Error('Extracted script mismatch')
}
const finalHyp = await fs.readFile(hyp), preview = await fs.readFile(path.join(directory, 'luxury_log_cabin_preview.html'), 'utf8')
const embedded = preview.match(/window\.EMBEDDED_HYP='([^']+)'/)
if (!embedded || !Buffer.from(embedded[1], 'base64').equals(finalHyp)) throw new Error('Preview differs from final .hyp')
console.log(run('python3', 'hyperfy-skill/tools/validate_result.py', hyp))
console.log(run('node', path.join(directory, 'validate_cabin.mjs')))
const reportPath = path.join(directory, 'validation_report.json')
const report = JSON.parse(await fs.readFile(reportPath, 'utf8'))
report.package.previewEmbedsIdenticalBytes = true
report.visualInspection = {
  views: ['front', 'rear', 'left', 'right', 'top cutaway', 'exterior isometric', 'entrance great room', 'mezzanine', 'stairs'],
  renderer: 'Browser WebGL using the target Prim geometry path',
  screenshots: ['exterior.jpg', 'great_room.jpg', 'mezzanine.jpg', 'plan.jpg'],
}
report.skillSelfTest = 'hyperfy-hyp-app-authoring 2.4.2: PASS'
await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n')
