import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const directory = path.dirname(fileURLToPath(import.meta.url))
const outputRoot = path.resolve(directory, '..')
const modelName = '1c26353779208e271fecb62e605d85382f61aee190ce7d448c2e43252420b2bd.glb'
const modelUrl = `asset://${modelName}`
const modelBytes = await fs.readFile(path.join(directory, 'assets', modelName))

const apps = [
  {
    file: 'cognac_leather_beveled_sofa_3_seat',
    source: 'cognac_leather_beveled_sofa_3_seat.js',
    name: 'Cognac Leather Beveled Sofa - 3 Seat (Correct Sit) (Sit Markers Fixed)',
    version: 5,
    description:
      'Beveled three-seat couch with raised seat anchors and per-couch Sit prompt management that restores on effect end or replacement.',
  },
  {
    file: 'cognac_leather_beveled_armchair_1_seat',
    source: 'cognac_leather_beveled_armchair_1_seat.js',
    name: 'Cognac Leather Beveled Armchair - 1 Seat (Correct Sit) (Sit Markers Fixed)',
    version: 1,
    description:
      'Beveled armchair with a raised seat anchor and per-chair Sit prompt management that restores on effect end or replacement.',
  },
]

for (const app of apps) {
  const scriptBytes = await fs.readFile(path.join(directory, 'source', app.source))
  const scriptText = scriptBytes.toString('utf8')
  if (scriptText.includes('2fe7da6a0d93cf0c4a1cb0f97d86fe107b7c81ab2e5e48712cc4342454d45ee1')) {
    throw new Error(`Missing emote asset reference remains in ${app.source}`)
  }
  const scriptHash = crypto.createHash('sha256').update(scriptBytes).digest('hex')
  const scriptUrl = `asset://${scriptHash}.js`
  const blueprint = {
    version: app.version,
    name: app.name,
    image: null,
    author: 'OpenAI',
    url: null,
    desc: app.description,
    model: modelUrl,
    script: scriptUrl,
    props: { castShadows: true, receiveShadows: true },
    preload: false,
    public: false,
    locked: false,
    unique: true,
    disabled: false,
    scene: false,
  }
  const assets = [
    { type: 'model', url: modelUrl, size: modelBytes.length, mime: 'model/gltf-binary' },
    { type: 'script', url: scriptUrl, size: scriptBytes.length, mime: 'text/javascript' },
  ]
  const header = Buffer.from(JSON.stringify({ blueprint, assets }))
  const prefix = Buffer.alloc(4)
  prefix.writeUInt32LE(header.length)
  const fileBytes = Buffer.concat([prefix, header, modelBytes, scriptBytes])
  await fs.writeFile(path.join(directory, `${app.file}.hyp`), fileBytes)
}

const archive = path.join(outputRoot, 'cognac-leather-furniture.zip')
await fs.rm(archive, { force: true })
execFileSync('zip', ['-rq', archive, '.'], { cwd: directory })
console.log(`Wrote ${apps.length} app packages and ${archive}`)
