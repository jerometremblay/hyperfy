// Runs the real Hyperfy server in a separate local world. Never uses house data.
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import Database from 'better-sqlite3'
import { createInterface } from 'node:readline'
const root = fileURLToPath(new URL('.', import.meta.url))
const overlay = process.argv.includes('--overlay')
const port = Number(process.env.BILLARD_PORT || 3340)
const origin = `http://localhost:${port}`
const worldDir = `${root}.local-world`
await mkdir(`${worldDir}/assets`, { recursive: true })
const env = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  NODE_ENV: 'production',
  DOTENV_FLOW_SILENT: 'true',
  WORLD: 'hyperfy-billard/.local-world',
  PORT: String(port),
  JWT_SECRET: randomBytes(32).toString('hex'),
  ADMIN_CODE: randomBytes(24).toString('hex'),
  SAVE_INTERVAL: '10',
  PUBLIC_MAX_UPLOAD_SIZE: '100',
  PUBLIC_WS_URL: `ws://localhost:${port}/ws`,
  PUBLIC_API_URL: `${origin}/api`,
  ASSETS: 'local',
  ASSETS_BASE_URL: `${origin}/assets`,
}
const boot = () =>
  spawn(process.execPath, [`${root}../build/index.js`], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] })
let server
const ready = async () => {
  for (let i = 0; i < 200; i++) {
    if (server.exitCode !== null) throw Error(`Hyperfy exited with ${server.exitCode}`)
    try {
      const response = await fetch(origin)
      if (response.ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw Error('Hyperfy startup timed out')
}
const log = child => {
  for (const stream of [child.stdout, child.stderr])
    createInterface({ input: stream }).on('line', line => {
      if (!line.includes('authToken')) console.log(line)
    })
}
// First boot runs the engine's own migrations. Do not invent a schema.
try {
  try {
    await fetch(origin)
    throw Error(`Port ${port} is already occupied; use BILLARD_PORT`)
  } catch (error) {
    if (error.message.includes('already occupied')) throw error
  }
  const exists = await stat(`${worldDir}/db.sqlite`).then(
    () => true,
    () => false
  )
  if (!exists) {
    server = boot()
    log(server)
    await ready()
    const closed = once(server, 'exit')
    server.kill('SIGTERM')
    await closed
  }
  const bytes = await readFile(`${root}dist/hyperfy-billard.hyp`)
  const headerLength = bytes.readUInt32LE(0)
  const { blueprint, assets } = JSON.parse(bytes.subarray(4, 4 + headerLength))
  let offset = 4 + headerLength
  for (const asset of assets) {
    await writeFile(`${worldDir}/assets/${asset.url.slice(8)}`, bytes.subarray(offset, offset + asset.size))
    offset += asset.size
  }
  const fit = overlay ? JSON.parse(await readFile(`${root}overlay/fit.json`, 'utf8')) : null
  if (fit) Object.assign(blueprint.props, fit.gameProps)
  const db = new Database(`${worldDir}/db.sqlite`)
  const now = new Date().toISOString()
  const entity = {
    id: 'billard-practice',
    type: 'app',
    blueprint: blueprint.id,
    position: [0, fit ? fit.clothHeight : 0.762, 0],
    quaternion: [0, 0, 0, 1],
    scale: [1, 1, 1],
    mover: null,
    uploader: null,
    pinned: false,
    state: {},
  }
  db.prepare('INSERT OR REPLACE INTO blueprints (id,data,createdAt,updatedAt) VALUES (?,?,?,?)').run(
    blueprint.id,
    JSON.stringify(blueprint),
    now,
    now
  )
  db.prepare('INSERT OR REPLACE INTO entities (id,data,createdAt,updatedAt) VALUES (?,?,?,?)').run(
    entity.id,
    JSON.stringify(entity),
    now,
    now
  )
  if (fit) {
    const source = await readFile(`${root}upstream-table/table.js`)
    const model = await readFile(`${root}upstream-table/model.glb`)
    const { createHash } = await import('node:crypto')
    const hash = createHash('sha256').update(source).digest('hex')
    const modelHash = createHash('sha256').update(model).digest('hex')
    await writeFile(`${worldDir}/assets/${hash}.js`, source)
    await writeFile(`${worldDir}/assets/${modelHash}.glb`, model)
    const furniture = {
      id: 'billard-furniture',
      version: 0,
      name: 'Tailuge original table',
      model: `asset://${modelHash}.glb`,
      script: `asset://${hash}.js`,
      props: { poolChannel: fit.channel },
      unique: false,
    }
    const placed = { ...entity, id: furniture.id, blueprint: furniture.id, position: [0, 0, 0], scale: [1, 1, 1] }
    db.prepare('INSERT OR REPLACE INTO blueprints (id,data,createdAt,updatedAt) VALUES (?,?,?,?)').run(
      furniture.id,
      JSON.stringify(furniture),
      now,
      now
    )
    db.prepare('INSERT OR REPLACE INTO entities (id,data,createdAt,updatedAt) VALUES (?,?,?,?)').run(
      placed.id,
      JSON.stringify(placed),
      now,
      now
    )
  } else {
    db.prepare('DELETE FROM entities WHERE id = ?').run('billard-furniture')
    db.prepare('DELETE FROM blueprints WHERE id = ?').run('billard-furniture')
  }
  const rackSource = await readFile(`${root}cue-rack/rack.js`)
  const { createHash } = await import('node:crypto')
  const rackHash = createHash('sha256').update(rackSource).digest('hex')
  await writeFile(`${worldDir}/assets/${rackHash}.js`, rackSource)
  const rack = { id: 'billard-cue-rack', version: 0, name: 'Pool cue rack', model: 'script-only',
    script: `asset://${rackHash}.js`, props: { poolChannel: 'classic-8-ft-pool-table' }, unique: false }
  db.prepare('INSERT OR REPLACE INTO blueprints (id,data,createdAt,updatedAt) VALUES (?,?,?,?)').run(
    rack.id, JSON.stringify(rack), now, now)
  const placedRack = { ...entity, id: rack.id, blueprint: rack.id, position: [1.8, 1.1, 0.5], state: {} }
  db.prepare('INSERT OR REPLACE INTO entities (id,data,createdAt,updatedAt) VALUES (?,?,?,?)').run(
    rack.id, JSON.stringify(placedRack), now, now)
  db.prepare('INSERT OR REPLACE INTO config (key,value) VALUES (?,?)').run(
    'spawn',
    JSON.stringify({ position: [0, 0, 2], quaternion: [0, 0, 0, 1] })
  )
  db.close()
  server = boot()
  log(server)
  const stop = () => server.kill('SIGTERM')
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  await ready()
  console.log(
    `\nBillard practice world: ${origin}\nTake a cue from the rack (E), point at the table (E), Space strikes and restores movement. X returns the cue. Ctrl-C stops it.`
  )
  await once(server, 'exit')
} catch (error) {
  server?.kill('SIGTERM')
  console.error(error.message)
  process.exitCode = 1
}
