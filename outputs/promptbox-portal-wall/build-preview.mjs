import fs from 'node:fs/promises'
import { build } from 'esbuild'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'

const directory = new URL('./', import.meta.url)
const plan = JSON.parse(await fs.readFile(new URL('plan.json', directory)))
const client = makeClient(await loadProfile('../hyperfy-world-jerome', 'online-world'))
const portalImages = await Promise.all(plan.portals.map(async portal => {
  const image = Object.entries(portal.blueprint.props).find(([key]) => key.startsWith('arrivalImage_'))?.[1]
  if (!image?.url) return null
  const result = await client.requestBytes('/assets/' + image.url.slice(8))
  return 'data:image/jpeg;base64,' + result.bytes.toString('base64')
}))
let preview = await fs.readFile('outputs/promptbox-large/preview.mjs', 'utf8')
preview = preview.replace("'./runtime-adapter.mjs'", "'../promptbox-large/runtime-adapter.mjs'")
preview = preview.replace('const shots = {', `
// Offline aperture illustrations use the existing saved arrival images.
// Travel and live previews remain native World Portal entities in the world.
for (const [i, portal] of window.PORTAL_PLAN.portals.entries()) {
  const texture = window.PORTAL_IMAGES[i]
    ? new THREE.TextureLoader().load(window.PORTAL_IMAGES[i], () => draw()) : null
  if (texture) texture.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4),
    new THREE.MeshBasicMaterial({ map: texture, color: texture ? '#ffffff' : '#242a29', side: THREE.FrontSide }))
  mesh.position.set(portal.houseLocal[0], portal.houseLocal[1] + 1.2, portal.houseLocal[2])
  mesh.rotation.y = Math.PI
  scene.add(mesh)
  rendered.push(mesh)
  mesh.userData.part = 'billiards-portal-wall'
}
const shots = {`)
preview = preview.replace("  Exterior: {", `
  'Pool side': { eye: [6.70, 1.70, -3.10], target: [6.70, 1.48, 1.50], fov: 66 },
  'Left recess': { eye: [4.10, 1.65, -0.30], target: [6.35, 1.48, 1.60], fov: 72 },
  'Right recess': { eye: [8.44, 1.65, -0.25], target: [6.50, 1.48, 1.60], fov: 72 },
  'Solid back': { eye: [6.70, 1.70, 5.20], target: [6.70, 1.50, 1.90], fov: 72 },
  'Wall front': { eye: [6.79, 1.60, -3.8], target: [6.79, 1.60, 1.60], fov: 45, wallOnly: true },
  'Wall back': { eye: [6.79, 1.60, 7.0], target: [6.79, 1.60, 1.60], fov: 45, wallOnly: true },
  'Wall left': { eye: [1.25, 1.60, 1.62], target: [6.79, 1.60, 1.62], fov: 45, wallOnly: true },
  'Wall right': { eye: [12.25, 1.60, 1.62], target: [6.79, 1.60, 1.62], fov: 45, wallOnly: true },
  'Wall top': { eye: [6.79, 8.00, 1.62], target: [6.79, 1.60, 1.62], fov: 45, wallOnly: true },
  'Wall isometric': { eye: [10.90, 4.70, -3.90], target: [6.79, 1.60, 1.62], fov: 42, wallOnly: true },
  Exterior: {`)
preview = preview.replace("let selected = 'Exterior'", "let selected = 'Pool side'")
preview = preview.replace("  for (const mesh of rendered) mesh.visible = roofToggle.checked || !['roof', 'roof-frame', 'gables', 'ceilings', 'extension-roof'].includes(mesh.userData.part)", `
  for (const mesh of rendered) mesh.visible = shots[selected].wallOnly
    ? mesh.userData.part === 'billiards-portal-wall'
    : roofToggle.checked || !['roof', 'roof-frame', 'gables', 'ceilings', 'extension-roof'].includes(mesh.userData.part)`)
preview = preview.replace("document.getElementById('status').textContent = \`\${runtime.visuals.length.toLocaleString()} primitives · \${runtime.lights.length} lights · 3 bedrooms · 5 hinged doors · 1 sliding patio door\`",
  "document.getElementById('status').textContent = 'Exact house package · 2 blind portal doorways · saved arrival images in this offline preview'")
await fs.writeFile(new URL('preview.mjs', directory), preview)
const bundle = await build({
  entryPoints: [new URL('preview.mjs', directory).pathname],
  bundle: true, format: 'esm', platform: 'browser', write: false,
  define: { process: '{"env":{"PUBLIC_PLAYER_COLLISION":"false"}}' },
})
const house = await fs.readFile(new URL('house.hyp', directory))
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Portal doorway wall</title>
<style>html,body{margin:0;overflow:hidden;font:13px system-ui;color:#302419}canvas{display:block}
header{position:absolute;top:10px;left:12px;max-width:1120px;background:#fff9eee6;padding:10px 14px;border-radius:8px}
h1{font-size:17px;margin:0 0 8px}nav{display:flex;gap:4px;flex-wrap:wrap}button{padding:5px;border:1px solid #b9a388;border-radius:4px;background:#fff9ed}
button[aria-pressed=true]{background:#70543b;color:white}#caption{display:none}
footer{position:absolute;bottom:12px;left:12px;background:#fff9eee6;padding:8px;border-radius:8px}</style></head><body>
<canvas></canvas><header><h1>Two recessed portal doorways facing the pool table</h1><nav id="views"></nav>
<label><input type="checkbox" id="roof" checked>Show roof</label> <button id="download">Download house .hyp</button></header>
<footer id="status">Loading…</footer>
<script>window.EMBEDDED_HYP=${JSON.stringify(house.toString('base64'))};window.PORTAL_PLAN=${JSON.stringify(plan)};window.PORTAL_IMAGES=${JSON.stringify(portalImages)}</script>
<script type="module">${bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`
await fs.writeFile(new URL('preview.html', directory), html)
console.log('Built exact-package doorway preview')
