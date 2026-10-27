import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { build } from 'esbuild'
import * as THREE from 'three'
import { parseHyp } from '../../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const before = JSON.parse(await fs.readFile(new URL('before.json', directory), 'utf8'))
const house = await fs.readFile(new URL('house.hyp', directory))
const packages = {}
const placements = {}
const inverse = new THREE.Quaternion().fromArray(before.entity.quaternion).invert()
for (const [name, id] of [
  ['desk', 'd16ab219-9538-445c-a9c1-02a9cbf2ae2e'],
  ['chair', '39fc1d1e-9bd0-42f6-b3f2-2022c70d4f26'],
]) {
  const entity = before.snapshot.entities.find(e => e.id === id)
  const blueprint = before.snapshot.blueprints.find(b => b.id === entity.blueprint)
  const bytes = await fs.readFile(new URL('../../upper-office/' + name + '.hyp', directory))
  assert.equal(parseHyp(bytes).blueprint.script, blueprint.script)
  packages[name] = bytes.toString('base64')
  placements[name] = {
    position: new THREE.Vector3().fromArray(entity.position)
      .sub(new THREE.Vector3().fromArray(before.entity.position)).applyQuaternion(inverse).toArray(),
    quaternion: inverse.clone().multiply(new THREE.Quaternion().fromArray(entity.quaternion)).toArray(),
  }
}
let preview = await fs.readFile(new URL('../preview.mjs', directory), 'utf8')
preview = preview.replace("const runtime = await executeSource(parsed.source, '', { props: parsed.header.blueprint.props })",
  "const previewDoors = Object.fromEntries(['bedroom-1', 'bedroom-2', 'bedroom-3', 'entrance-left', 'entrance-right'].map(id => [id, location.hash !== '#closed']))\nconst runtime = await executeSource(parsed.source, '', { props: parsed.header.blueprint.props, state: { doors: previewDoors } })")
preview = preview.replace("'./runtime-adapter.mjs'", "'../runtime-adapter.mjs'")
preview = preview.replace("  Exterior: {", `  'Entrance open': { eye: [0, 1.75, -11.5], target: [0, 1.45, -7.5], fov: 70 },
  'Room doors open': { eye: [0, 4.85, 6.2], target: [0, 4.4, 4.2], fov: 88 },
  'Left door open': { eye: [-5.5, 4.7, 6.2], target: [-6.3, 4.45, 4.35], fov: 80 },
  'Right door open': { eye: [6.2, 4.7, 6.2], target: [5.4, 4.45, 4.35], fov: 80 },
  'Office roof': { eye: [1.85, 4.85, 8.85], target: [-0.15, 6.15, 11.4], fov: 83 },
  'Original office roof': { eye: [1.8, 4.85, 6.95], target: [-0.4, 7.6, 5.4], fov: 86 },
  'Left room': { eye: [-5.8, 4.85, 4.8], target: [-6, 5.91, 6.2], fov: 82 },
  'Center room': { eye: [1.8, 4.85, 4.8], target: [-.3, 5.91, 6.2], fov: 82 },
  'Right room': { eye: [5.8, 4.85, 4.8], target: [6, 5.91, 6.2], fov: 82 },
  'Extension front': { eye: [1.85, 4.85, 8], target: [-.15, 5.91, 9.4], fov: 82 },
  'Extension rear': { eye: [1.75, 4.85, 11.6], target: [-.25, 5.91, 11.3], fov: 88 },
  Exterior: {`)
preview = preview.replace("let selected = 'Exterior'", "let selected = 'Entrance open'")
preview = preview.replace("const shots = {", `
// Render the two existing individual furniture packages at their saved placements.
for (const name of ['desk', 'chair']) {
  const data = Uint8Array.from(atob(window.FURNITURE_PACKAGES[name]), c => c.charCodeAt(0))
  const parsedFurniture = parseHyp(data)
  const furnitureRuntime = await executeSource('world.isPreview = true\\n' + parsedFurniture.source,
    '', { props: parsedFurniture.header.blueprint.props })
  const group = new THREE.Group()
  for (const visual of furnitureRuntime.visuals) {
    const material = visual.material.clone()
    material.color.set(visual.color)
    const mesh = new THREE.Mesh(visual.geometry, material)
    mesh.matrix.copy(visual.matrix)
    mesh.matrixAutoUpdate = false
    mesh.castShadow = visual.castShadow
    mesh.receiveShadow = visual.receiveShadow
    group.add(mesh)
  }
  group.position.fromArray(window.FURNITURE_PLACEMENTS[name].position)
  group.quaternion.fromArray(window.FURNITURE_PLACEMENTS[name].quaternion)
  scene.add(group)
}
const shots = {`)
await fs.writeFile(new URL('preview.mjs', directory), preview)
const bundle = await build({
  entryPoints: [new URL('preview.mjs', directory).pathname],
  bundle: true, format: 'esm', platform: 'browser', write: false,
  define: { process: '{"env":{"PUBLIC_PLAYER_COLLISION":"false"}}' },
})
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Room ceilings</title>
<style>html,body{margin:0;overflow:hidden;font:14px system-ui;color:#302419}canvas{display:block}
header{position:absolute;top:14px;left:18px;max-width:960px;background:#fff9eee6;padding:12px 16px;border-radius:10px}
h1{font-size:18px;margin:0 0 8px}nav{display:flex;gap:5px;flex-wrap:wrap}button{padding:6px;border:1px solid #b9a388;border-radius:5px;background:#fff9ed}
button[aria-pressed=true]{background:#70543b;color:white}#caption{display:none}footer{position:absolute;bottom:15px;left:18px;background:#fff9eee6;padding:8px;border-radius:8px}</style></head><body>
<canvas></canvas><header><h1>Door hinges and moving action targets</h1><nav id="views"></nav><p id="caption"></p><p>Hinge pins touch the leaf edges. Action targets follow each door through its 175° swing.</p>
<label><input type="checkbox" id="roof" checked>Show roof</label> <button id="download">Download house .hyp</button></header><footer id="status">Loading…</footer>
<script>window.EMBEDDED_HYP=${JSON.stringify(house.toString('base64'))};window.FURNITURE_PACKAGES=${JSON.stringify(packages)};window.FURNITURE_PLACEMENTS=${JSON.stringify(placements)}</script>
<script type="module">${bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`
await fs.writeFile(new URL('preview.html', directory), html)
console.log('Built exact-package office roof preview')
