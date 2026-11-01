import fs from 'node:fs/promises'
import { build } from 'esbuild'

const directory = new URL('./', import.meta.url)
let preview = await fs.readFile(new URL('../preview.mjs', directory), 'utf8')
preview = preview.replace("'../promptbox-large/runtime-adapter.mjs'", "'../../promptbox-large/runtime-adapter.mjs'")
preview = preview.replace(
  "const runtime = await executeSource(parsed.source, '', { props: parsed.header.blueprint.props })",
  `const doorView = new URLSearchParams(location.hash.slice(1)).get('doors') || 'closed'
const doorStates = { closed: [false, false], left: [false, true], right: [true, false], both: [true, true] }
const [leftOpen, rightOpen] = doorStates[doorView] || doorStates.closed
const runtime = await executeSource(parsed.source, '', {
  props: parsed.header.blueprint.props,
  state: { doors: { ...parsed.header.blueprint.props.initialDoors,
    'billiards-portal-left': leftOpen, 'billiards-portal-right': rightOpen } },
})
for (const [value, label] of Object.entries({
  closed: 'Both closed', left: 'Left open', right: 'Right open', both: 'Both open',
})) {
  const button = document.createElement('button')
  button.textContent = label
  button.setAttribute('aria-pressed', String(doorView === value))
  button.addEventListener('click', () => {
    location.hash = 'doors=' + value
    location.reload()
  })
  document.getElementById('door-states').append(button)
}`)
preview = preview.replace('new THREE.PlaneGeometry(1.6, 2.4)', 'new THREE.PlaneGeometry(portal.aperture.width, portal.aperture.height)')
preview = preview.replace('portal.houseLocal[1] + 1.2', 'portal.houseLocal[1] + portal.aperture.height / 2')
preview = preview.replace("'Solid back':", "'Timber back':")
preview = preview.replace("mesh.userData.part = part",
  "mesh.userData.part = part\n  mesh.userData.portalDoor = members.some(v => v.node.id.includes('billiards-portal-'))")
preview = preview.replace("let part = visual.node.id.split(':')[0]",
  "let part = visual.node.id.includes('billiards-portal-') ? 'billiards-portal-wall' : visual.node.id.split(':')[0]")
preview = preview.replace("mesh.userData.part === 'billiards-portal-wall'",
  "(mesh.userData.part === 'billiards-portal-wall' || mesh.userData.portalDoor)")
preview = preview.replace(
  "'Exact house package · 2 blind portal doorways · saved arrival images in this offline preview'",
  "'Exact house package · 0.96 × 2.12 m upstairs-size doors · one timber log wall · portal images are offline illustrations'")
await fs.writeFile(new URL('preview.mjs', directory), preview)
const bundle = await build({
  entryPoints: [new URL('preview.mjs', directory).pathname],
  bundle: true, format: 'esm', platform: 'browser', write: false,
  define: { process: '{"env":{"PUBLIC_PLAYER_COLLISION":"false"}}' },
})
const previousHTML = await fs.readFile(new URL('../preview.html', directory), 'utf8')
const images = previousHTML.match(/window.PORTAL_IMAGES=(.*?)<\/script>/s)[1]
const plan = JSON.parse(await fs.readFile(new URL('plan.json', directory)))
const house = await fs.readFile(new URL('house.hyp', directory))
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Two separate upstairs-size doors</title>
<style>html,body{margin:0;overflow:hidden;font:13px system-ui;color:#302419}canvas{display:block}
header{position:absolute;top:10px;left:12px;max-width:1120px;background:#fff9eee6;padding:10px 14px;border-radius:8px}
h1{font-size:17px;margin:0 0 8px}nav{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px}button{padding:5px;border:1px solid #b9a388;border-radius:4px;background:#fff9ed}
button[aria-pressed=true]{background:#70543b;color:white}#caption{display:none}
footer{position:absolute;bottom:12px;left:12px;background:#fff9eee6;padding:8px;border-radius:8px}</style></head><body>
<canvas></canvas><header><h1>Two separate doors, the same size as upstairs</h1>
<nav id="door-states"></nav><nav id="views"></nav>
<label><input type="checkbox" id="roof" checked>Show roof</label> <button id="download">Download house .hyp</button></header>
<footer id="status">Loading…</footer>
<script>window.EMBEDDED_HYP=${JSON.stringify(house.toString('base64'))};window.PORTAL_PLAN=${JSON.stringify(plan)};window.PORTAL_IMAGES=${images}</script>
<script type="module">${bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`
await fs.writeFile(new URL('preview.html', directory), html)
console.log('Built exact-package matching-door preview')
