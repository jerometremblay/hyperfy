import { build } from 'esbuild'
import { zipSync } from 'fflate'
import { ballTexture } from './ball-textures.mjs'
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('.', import.meta.url))
const dist = `${root}dist`
await mkdir(dist, { recursive: true })
const url = (bytes, ext) => `asset://${createHash('sha256').update(bytes).digest('hex')}.${ext}`
const textures = Array.from({ length: 15 }, (_, i) => ballTexture(i + 1))
const textureUrls = [null, ...textures.map(bytes => url(bytes, 'png'))]
await build({
  define: { BILLARD_TEXTURES: JSON.stringify(textureUrls) },
  entryPoints: [`${root}src/app.js`],
  bundle: true,
  format: 'iife',
  target: 'es2022',
  outfile: `${dist}/hyperfy-billard.js`,
  legalComments: 'inline',
  banner: { js: '; // Safe after Hyperfy’s semicolon-free script wrapper.' },
  plugins: [
    {
      name: 'hyperfy-math',
      setup(b) {
        b.onResolve({ filter: /^three$/ }, () => ({ path: 'three', namespace: 'hyperfy' }))
        b.onLoad({ filter: /.*/, namespace: 'hyperfy' }, () => ({
          contents:
            'const V = Vector3, Q = Quaternion, E = Euler; export { V as Vector3, Q as Quaternion, E as Euler }',
        }))
      },
    },
  ],
})
// Geometry-free GLB bootstrap required by the target Hyperfy 0.16 loader.
let json = JSON.stringify({ asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [] }] })
json += ' '.repeat((4 - (Buffer.byteLength(json) % 4)) % 4)
const model = Buffer.alloc(20 + Buffer.byteLength(json))
model.write('glTF')
model.writeUInt32LE(2, 4)
model.writeUInt32LE(model.length, 8)
model.writeUInt32LE(Buffer.byteLength(json), 12)
model.write('JSON', 16)
model.write(json, 20)
const script = await readFile(`${dist}/hyperfy-billard.js`)
const blueprint = {
  id: 'hyperfy-billard',
  version: 0,
  name: 'Hyperfy Billard',
  author: 'jerometremblay-bot',
  desc: 'Server-owned pool practice, Tailuge physics, WPA 8/9-foot surface. GPL-3.0-only.',
  model: url(model, 'glb'),
  script: url(script, 'js'),
  props: {
    tableSize: '9',
    showSurface: true,
    playChannel: 'classic-8-ft-pool-table',
    ...Object.fromEntries(textureUrls.slice(1).map((url, i) => [`ball${i + 1}`, { type: 'texture', url }])),
  },
  preload: false,
  public: false,
  locked: false,
  unique: false,
  disabled: false,
}
const assets = [
  ...textures.map((bytes, i) => ({ type: 'texture', url: textureUrls[i + 1], size: bytes.length, mime: 'image/png' })),
  { type: 'model', url: blueprint.model, size: model.length, mime: 'model/gltf-binary' },
  { type: 'script', url: blueprint.script, size: script.length, mime: 'text/plain' },
]
const header = Buffer.from(JSON.stringify({ blueprint, assets }))
const prefix = Buffer.alloc(4)
prefix.writeUInt32LE(header.length)
await writeFile(`${dist}/hyperfy-billard.hyp`, Buffer.concat([prefix, header, ...textures, model, script]))
const viewer = await build({
  entryPoints: [`${root}preview-viewer.js`],
  bundle: true,
  format: 'iife',
  minify: true,
  write: false,
  legalComments: 'inline',
})
const hyp = await readFile(`${dist}/hyperfy-billard.hyp`)
await writeFile(
  `${dist}/preview.html`,
  `<!doctype html><html lang="en"><meta charset="utf-8"><title>Hyperfy Billard — exact package preview</title><style>body{margin:0;overflow:hidden;font:14px system-ui}aside{position:absolute;top:14px;left:14px;padding:14px;background:#ffffffdd;border-radius:8px}button{margin:10px 5px 0 0;padding:6px 12px;cursor:pointer}</style><aside><b>Hyperfy Billard</b><br>Exact .hyp geometry and textures · drag to orbit · wheel to zoom<br>For multiplayer play: npm run preview<nav></nav></aside><script>window.HYP_BASE64='${hyp.toString('base64')}'</script><script>${viewer.outputFiles[0].text}</script></html>`
)
await writeFile(`${dist}/manifest.json`, JSON.stringify({ blueprint, assets }, null, 2) + '\n')
const rackSource = await readFile(`${root}cue-rack/rack.js`)
const rackBlueprint = { id: 'billard-cue-rack', version: 0, name: 'Wall Pool Cue Rack — Four Returning Cues',
  model: blueprint.model, script: url(rackSource, 'js'), props: { poolChannel: 'classic-8-ft-pool-table' }, unique: false }
const rackAssets = [assets.find(asset => asset.type === 'model'),
  { type: 'script', url: rackBlueprint.script, size: rackSource.length, mime: 'text/plain' }]
const rackHeader = Buffer.from(JSON.stringify({ blueprint: rackBlueprint, assets: rackAssets }))
const rackPrefix = Buffer.alloc(4); rackPrefix.writeUInt32LE(rackHeader.length)
await writeFile(`${root}cue-rack/rack.hyp`, Buffer.concat([rackPrefix, rackHeader, model, rackSource]))
const tableHyp = await readFile(`${root}upstream-table/table.hyp`).catch(() => null)
if (tableHyp) {
  const fit = JSON.parse(await readFile(`${root}overlay/fit.json`, 'utf8'))
  await writeFile(`${root}upstream-table/preview.html`, `<!doctype html><html><meta charset="utf-8"><title>Original Tailuge table in Hyperfy</title><style>body{margin:0;overflow:hidden;font:14px system-ui}aside{position:absolute;top:14px;left:14px;padding:14px;background:#ffffffdd;border-radius:8px}button{margin:8px;padding:6px}</style><aside><b>Original Tailuge table</b><br>Exact GLB and game package assets · 8 ft fitting · four added support legs<nav></nav></aside><script>window.HYP_BASE64='${hyp.toString('base64')}';window.TABLE_HYP_BASE64='${tableHyp.toString('base64')}';window.TABLE_GAME_PROPS=${JSON.stringify(fit.gameProps)}</script><script>${viewer.outputFiles[0].text}</script></html>`)
}
console.log(`Built ${script.length} bytes of self-contained script and one .hyp package`)

const archive = {}
async function collect(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.local-world' || entry.name === 'hyperfy-billard-source.zip') continue
    const path = `${directory}/${entry.name}`,
      name = `${prefix}${entry.name}`
    if (entry.isDirectory()) await collect(path, `${name}/`)
    else archive[`hyperfy-billard/${name}`] = await readFile(path)
  }
}
await collect(root)
await writeFile(`${dist}/hyperfy-billard-source.zip`, zipSync(archive, { mtime: new Date('1980-01-02T00:00:00Z') }))
