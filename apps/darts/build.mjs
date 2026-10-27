import { build } from 'esbuild'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { packHyp, parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'

const root = fileURLToPath(new URL('../..', import.meta.url))
const source = `${root}/apps/darts`
const dist = `${root}/outputs/darts`
const catalog = `${root}/tools/worldsync/catalog/objects/apps/darts`
await mkdir(dist, { recursive: true })
await mkdir(catalog, { recursive: true })
const asset = (type, bytes, extension, mime) => ({
  type,
  bytes,
  mime,
  url: `asset://${createHash('sha256').update(bytes).digest('hex')}.${extension}`,
})
const texture = asset('texture', await readFile(`${source}/board.png`), 'png', 'image/png')
const throwAnimation = asset('emote', await readFile(`${source}/throw.glb`), 'glb', 'model/gltf-binary')
const licenses = await Promise.all(
  ['bananadarts', 'dart-room'].map(name => readFile(`${source}/vendor/${name}/LICENSE`, 'utf8'))
)
await build({
  entryPoints: [`${source}/app.js`],
  bundle: true,
  format: 'iife',
  target: 'es2022',
  legalComments: 'inline',
  define: { DARTS_TEXTURE: JSON.stringify(texture.url), DARTS_THROW: JSON.stringify(throwAnimation.url) },
  outfile: `${dist}/darts.js`,
  banner: { js: '; // Safe after Hyperfy’s semicolon-free script wrapper.\n/*\n' + licenses.join('\n\n') + '\n*/' },
})
await build({
  entryPoints: [`${source}/library.js`],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: `${dist}/game.mjs`,
  legalComments: 'inline',
})
let json = JSON.stringify({ asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [] }] })
json += ' '.repeat((4 - (Buffer.byteLength(json) % 4)) % 4)
const glb = Buffer.alloc(20 + Buffer.byteLength(json))
glb.write('glTF')
glb.writeUInt32LE(2, 4)
glb.writeUInt32LE(glb.length, 8)
glb.writeUInt32LE(Buffer.byteLength(json), 12)
glb.write('JSON', 16)
glb.write(json, 20)
const model = asset('model', glb, 'glb', 'model/gltf-binary')
const script = asset('script', await readFile(`${dist}/darts.js`), 'js', 'text/javascript')
const blueprint = {
  id: 'hyperfy-darts',
  version: 0,
  name: 'Darts — BananaDarts / Dart Room',
  author: 'jerometremblay-bot',
  desc: 'Game-owned ballistic flight and scoring from your actual position; free movement and camera, including third person. Count Up, 301, 501 and Cricket; 1–4 players. E: play, Space: start/throw/next, Q/Z: power, M: mode, R: reset, Esc: exit, X: leave.',
  model: model.url,
  script: script.url,
  props: {
    boardTexture: { type: 'texture', url: texture.url },
    throwAnimation: { type: 'emote', url: throwAnimation.url },
  },
  public: false,
  preload: true,
  locked: false,
  unique: false,
  frozen: false,
  disabled: false,
}
const hyp = packHyp(blueprint, [texture, model, script, throwAnimation])
const parsed = parseHyp(hyp)
for (const item of [texture, model, script, throwAnimation]) {
  if (!Buffer.from(parsed.assets.find(a => a.url === item.url).bytes).equals(item.bytes))
    throw new Error('Packaged bytes mismatch: ' + item.url)
}
await writeFile(`${dist}/darts.hyp`, hyp)
await writeFile(
  `${dist}/manifest.json`,
  JSON.stringify({ blueprint, assets: parsed.assets.map(({ bytes, ...a }) => a) }, null, 2) + '\n'
)
await writeFile(`${catalog}/script.js`, script.bytes)
await writeFile(`${catalog}/model.glb`, model.bytes)
await writeFile(`${catalog}/board.png`, texture.bytes)
await writeFile(`${catalog}/throw.glb`, throwAnimation.bytes)
await writeFile(
  `${catalog}/object.json`,
  JSON.stringify(
    {
      schemaVersion: 1,
      key: 'apps/darts',
      mode: 'files',
      blueprint: {
        ...Object.fromEntries(Object.entries(blueprint).filter(([key]) => !['id', 'version'].includes(key))),
        model: 'file:./model.glb',
        script: 'file:./script.js',
        props: {
          boardTexture: { type: 'texture', url: 'file:./board.png' },
          throwAnimation: { type: 'emote', url: 'file:./throw.glb' },
        },
      },
    },
    null,
    2
  ) + '\n'
)
const viewer = await build({
  entryPoints: [`${source}/preview.js`],
  bundle: true,
  format: 'iife',
  write: false,
  minify: true,
  legalComments: 'inline',
})
await writeFile(
  `${dist}/preview.html`,
  `<!doctype html><html lang="en"><meta charset="utf-8"><title>Darts — exact package preview</title>
<style>body{margin:0;font:14px system-ui;color:#f5e8d3;background:#16201e}aside{position:absolute;left:12px;top:12px;padding:12px;background:#17201ee8;border-radius:6px}button{margin:3px;padding:6px;cursor:pointer}canvas{display:block}</style>
<aside><b>Darts · exact packaged artwork and geometry</b><br>Drag to orbit · wheel to zoom<nav></nav></aside>
<script>window.DARTS_HYP='${hyp.toString('base64')}'</script><script>${viewer.outputFiles[0].text}</script></html>`
)
console.log(
  `Built darts: ${script.bytes.length} script bytes, ${hyp.length} package bytes; ${parsed.assets.length} hashes verified`
)
