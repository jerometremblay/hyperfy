import * as THREE from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { createVillage } from '../prototypes/isometric-renderer/village.js'
import { resolveWorldProfile } from './world-profile.mjs'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
Object.assign(process.env, resolveWorldProfile('world-2d', { root }))
globalThis.__dirname = path.join(root, 'build')
const worldDir = path.join(root, process.env.WORLD)
const markerPath = path.join(worldDir, 'world-2d.json')
let updating = false
try {
  await fs.access(path.join(worldDir, 'db.sqlite'))
  // Seeding only initializes a fresh world. Relaunches preserve the saved world.
  await fs.access(markerPath)
  if (!process.argv.includes('--update-village')) {
    console.log('[world-2d] already initialized; keeping the saved scene')
    process.exit(0)
  }
  updating = true
} catch (error) {
  if (error.code !== 'ENOENT') throw error
  try {
    await fs.access(path.join(worldDir, 'db.sqlite'))
    throw new Error('Refusing to seed a pre-existing world without a world-2d marker')
  } catch (existing) {
    if (existing.code !== 'ENOENT') throw existing
  }
}
await fs.mkdir(worldDir, { recursive: true })
const { assets } = await import('../src/server/assets.js')
await assets.init({ rootDir: root, worldDir })
const { getDB } = await import('../src/server/db.js')

// GLTFExporter uses this browser API even when exporting geometry in Node.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => {
      this.result = result
      this.onloadend?.()
    })
  }
}
const { village, obstacles } = createVillage()
village.name = 'The Crossing'
village.updateMatrixWorld(true)
const body = new THREE.Group()
body.name = 'Village collision'
body.userData = { node: 'rigidbody', type: 'static' }
function collider(x, y, z, width, height, depth) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshBasicMaterial())
  mesh.position.set(x, y, z)
  mesh.name = `Collision ${body.children.length + 1}`
  mesh.userData = { node: 'collider', convex: false, layer: 'environment' }
  body.add(mesh)
}
collider(0, -0.65, 0, 18, 1.25, 15)
collider(-1.9, 0, 0, 14.2, 0.12, 15)
collider(7.75, 0, 0, 2.5, 0.12, 15)
collider(5.3, 0.25, 2.75, 2.8, 0.35, 2.4)
// Match the prototype's movement bounds without adding visible walls.
for (const x of [-8.8, 8.8]) collider(x, 1.5, 0, 0.3, 4, 15)
for (const z of [-7.3, 7.3]) collider(0, 1.5, z, 18, 4, 0.3)
for (const z of [1.6, 3.9]) collider(5.3, 0.5, z, 2.8, 0.7, 0.16)
for (const obstacle of obstacles) {
  if (obstacle.radius > 2) collider(obstacle.x, 1.2, obstacle.z, 3.15, 2.1, 2.7)
  else collider(obstacle.x, 1.2, obstacle.z, 0.4, 2.4, 0.4)
}
village.add(body)
const glb = Buffer.from(await new GLTFExporter().parseAsync(village, { binary: true }))
async function asset(buffer, extension) {
  const name = `${createHash('sha256').update(buffer).digest('hex')}.${extension}`
  await fs.writeFile(path.join(worldDir, 'assets', name), buffer)
  return `asset://${name}`
}
const model = await asset(glb, 'glb')

// A one-pixel background uses the existing Sky node's normal texture loader.
function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, bytes) {
  const tag = Buffer.from(type)
  const size = Buffer.alloc(4)
  size.writeUInt32BE(bytes.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([tag, bytes])))
  return Buffer.concat([size, tag, bytes, checksum])
}
const header = Buffer.alloc(13)
header.writeUInt32BE(1, 0)
header.writeUInt32BE(1, 4)
header[8] = 8
header[9] = 2
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', header),
  chunk('IDAT', deflateSync(Buffer.from([0, 34, 55, 47]))),
  chunk('IEND', Buffer.alloc(0)),
])
const background = await asset(png, 'png')
const script = await asset(
  Buffer.from(
    (await fs.readFile(path.join(root, 'scripts/world-2d-scene.js'), 'utf8')).replace('__BACKGROUND__', background)
  ),
  'js'
)
const db = await getDB({ worldDir })
try {
  await db.transaction(async tx => {
    if (!updating) {
      const row = await tx('config').where('key', 'settings').first()
      const settings = {
        ...JSON.parse(row?.value || '{}'),
        title: 'world-2d',
        desc: 'The Crossing — a retro orthographic village',
        renderStyle: 'pixel-retro',
        dayNightCycle: false,
        ao: false,
      }
      await tx('config')
        .insert({ key: 'settings', value: JSON.stringify(settings) })
        .onConflict('key')
        .merge()
      await tx('config')
        .insert({
          key: 'spawn',
          value: JSON.stringify({ position: [0.3, 0.6, 4.8], quaternion: [0, 0, 0, 1] }),
        })
        .onConflict('key')
        .merge()
    }
    const now = new Date().toISOString()
    const previous = await tx('blueprints').where('id', '$scene').first()
    const saved = previous && JSON.parse(previous.data)
    const blueprint = saved
      ? { ...saved, version: saved.version + 1, model, script }
      : {
          id: '$scene',
          version: 0,
          name: 'The Crossing',
          author: 'Hyperfy',
          desc: 'The shared rendering-study village with static collision.',
          model,
          script,
          image: null,
          url: null,
          props: {},
          preload: true,
          public: false,
          locked: true,
          frozen: false,
          unique: true,
          scene: true,
          disabled: false,
        }
    await tx('blueprints')
      .insert({
        id: '$scene',
        data: JSON.stringify(blueprint),
        createdAt: now,
        updatedAt: now,
      })
      .onConflict('id')
      .merge({ data: JSON.stringify(blueprint), updatedAt: now })
  })
  const savedSettings = JSON.parse((await db('config').where('key', 'settings').first()).value)
  await fs.writeFile(
    markerPath,
    JSON.stringify(
      {
        title: 'world-2d',
        renderStyle: savedSettings.renderStyle,
        model,
        script,
        renderResolution: { width: 1024, height: 768 },
        collisionShapes: body.children.length + 2,
        respawnBelowY: -5,
      },
      null,
      2
    ) + '\n'
  )
  console.log(`[world-2d] created The Crossing with ${body.children.length + 2} collision shapes`)
} finally {
  await db.destroy()
}
