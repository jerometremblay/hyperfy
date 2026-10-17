import fs from 'fs-extra'
import path from 'path'
import { createHash } from 'crypto'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(dirname, '..')

function hash(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

async function createTreeHyp() {
  const scriptBuffer = await fs.readFile(path.join(rootDir, 'apps/Tree.js'))
  const iconBuffer = await fs.readFile(path.join(rootDir, 'apps/tree-icon.svg'))
  const scriptUrl = `asset://${hash(scriptBuffer)}.js`
  const iconUrl = `asset://${hash(iconBuffer)}.svg`

  const blueprint = {
    id: 'procedural-tree-v1',
    version: 0,
    name: 'Tree',
    image: { type: 'texture', name: 'tree-icon.svg', url: iconUrl },
    author: 'Hyperfy',
    url: null,
    desc: 'A procedural oak tree with wind-swaying leaves.',
    model: 'script-only',
    script: scriptUrl,
    props: {},
    preload: false,
    public: false,
    locked: false,
    unique: false,
    scene: false,
    disabled: false,
    frozen: false,
  }
  const assets = [
    { type: 'script', url: scriptUrl, buffer: scriptBuffer, mime: 'text/javascript' },
    { type: 'texture', url: iconUrl, buffer: iconBuffer, mime: 'image/svg+xml' },
  ]
  const header = {
    blueprint,
    assets: assets.map(({ type, url, buffer, mime }) => ({ type, url, size: buffer.length, mime })),
  }
  const headerBuffer = Buffer.from(JSON.stringify(header))
  const sizeBuffer = Buffer.alloc(4)
  sizeBuffer.writeUInt32LE(headerBuffer.length)
  const outputPath = path.join(rootDir, 'src/world/collections/default/Tree.hyp')
  await fs.writeFile(outputPath, Buffer.concat([sizeBuffer, headerBuffer, ...assets.map(asset => asset.buffer)]))
  console.log(`Created ${outputPath}`)
}

createTreeHyp().catch(error => {
  console.error(error)
  process.exitCode = 1
})
