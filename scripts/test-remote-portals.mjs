/** Launch two disposable worlds for real remote-portal acceptance checks. */
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { createHash, randomBytes } from 'node:crypto'
import Database from 'better-sqlite3'

const directory = await mkdtemp(join(tmpdir(), 'hyperfy-remote-portals-'))
const children = new Set()
const secret = randomBytes(24).toString('hex')
const sourcePort = Number(process.env.PORTAL_TEST_SOURCE_PORT || 3334)
const destinationPort = Number(process.env.PORTAL_TEST_DESTINATION_PORT || 3335)
function launch(port) {
  const child = spawn(process.execPath, ['build/index.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      WORLD: relative(process.cwd(), join(directory, String(port))),
      PORT: String(port),
      JWT_SECRET: secret,
      ADMIN_CODE: '',
      SAVE_INTERVAL: '0',
      PUBLIC_MAX_UPLOAD_SIZE: '0',
      PUBLIC_WS_URL: `ws://localhost:${port}/ws`,
      PUBLIC_API_URL: `http://localhost:${port}/api`,
      ASSETS: 'local',
      ASSETS_BASE_URL: `http://localhost:${port}/assets`,
      DB_URI: 'local',
      CLEAN: 'false',
      TLS_KEY_FILE: '',
      TLS_CERT_FILE: '',
      LIVEKIT_WS_URL: '',
      LIVEKIT_API_KEY: '',
      LIVEKIT_API_SECRET: '',
      AI_API_KEY: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  children.add(child)
  let output = ''
  child.stdout.on('data', chunk => {
    output += chunk
  })
  child.stderr.on('data', chunk => {
    output += chunk
  })
  child.on('exit', () => children.delete(child))
  child.output = () => output
  return child
}
async function ready(child, port) {
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(`World ${port} exited: ${child.output()}`)
    try {
      if (child.output().includes('server listening') && (await fetch(`http://localhost:${port}/health`)).ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  throw new Error(`World ${port} did not start: ${child.output()}`)
}
async function stop(child) {
  const exit = new Promise(resolve => child.once('exit', resolve))
  child.kill('SIGTERM')
  await exit
}
async function seed(port) {
  const worldDir = join(directory, String(port))
  const db = new Database(join(worldDir, 'db.sqlite'))
  db.prepare('DELETE FROM entities').run()
  const code =
    port === sourcePort
      ? `
    app.add(app.create('prim', { type: 'box', size: [30, 0.2, 30], position: [0, -0.1, 0], color: '#888888', physics: 'static' }));
    app.add(app.create('portal', { portalId: 'entrance', target: 'exit', url: 'http://localhost:${destinationPort}', position: [0, 1.2, 0], width: 3, height: 2.4, resolution: 512, updateRate: 30 }));
    for (const x of [-1.6, 1.6]) app.add(app.create('prim', { type: 'box', size: [0.15, 2.6, 0.2], position: [x, 1.3, 0], color: '#ffffff' }));
  `
      : `
    app.add(app.create('sky', { hdr: '/Clear_08_4pm_LDR.hdr', fogNear: 25, fogFar: 60, fogColor: '#9bbace', sunIntensity: 1.2 }));
    app.add(app.create('portal', { portalId: 'exit', position: [0, 1.2, 0], width: 3, height: 2.4 }));
    app.add(app.create('prim', { type: 'box', size: [30, 0.2, 30], position: [0, -0.1, 8], color: '#315d46', physics: 'static' }));
    const box = app.create('prim', { type: 'box', size: [2, 2, 2], position: [0, 1, 5], color: '#e83d83', physics: 'static' });
    app.add(box);
    app.add(app.create('light', { type: 'point', position: [0, 4, 4], intensity: 20, distance: 20 }));
    app.on('update', dt => { box.rotation.y += dt * 0.3 });
  `
  const name = `${createHash('sha256').update(code).digest('hex')}.js`
  await mkdir(join(worldDir, 'assets'), { recursive: true })
  await writeFile(join(worldDir, 'assets', name), code)
  const stamp = new Date().toISOString()
  const blueprint = {
    id: 'portal-fixture',
    version: 1,
    name: 'Portal acceptance fixture',
    model: 'script-only',
    script: `asset://${name}`,
    props: {},
  }
  db.prepare('INSERT OR REPLACE INTO blueprints (id,data,createdAt,updatedAt) VALUES (?,?,?,?)').run(
    blueprint.id,
    JSON.stringify(blueprint),
    stamp,
    stamp
  )
  const entity = {
    id: 'portal-fixture-app',
    type: 'app',
    blueprint: blueprint.id,
    position: [0, 0, 0],
    quaternion: [0, 0, 0, 1],
    scale: [1, 1, 1],
    state: {},
  }
  db.prepare('INSERT INTO entities (id,data,createdAt,updatedAt) VALUES (?,?,?,?)').run(
    entity.id,
    JSON.stringify(entity),
    stamp,
    stamp
  )
  for (const [key, value] of Object.entries({
    spawn: { position: [0, 0, port === sourcePort ? 6 : 8], quaternion: [0, 0, 0, 1] },
    settings: {
      title: `Portal test ${port}`,
      dayNightCycle: true,
      latitude: 45,
      longitude: port === sourcePort ? -74 : 105,
      timeZone: 'UTC',
    },
  }))
    db.prepare('INSERT OR REPLACE INTO config (key,value) VALUES (?,?)').run(key, JSON.stringify(value))
  db.close()
}
async function cleanup(exitCode = 0) {
  await Promise.all([...children].map(stop))
  process.exit(exitCode)
}
process.on('SIGINT', () => cleanup())
process.on('SIGTERM', () => cleanup())
try {
  for (const port of [sourcePort, destinationPort]) {
    const child = launch(port)
    await ready(child, port)
    await stop(child)
    await seed(port)
  }
  for (const port of [sourcePort, destinationPort]) await ready(launch(port), port)
  console.log(
    `Portal acceptance worlds ready: http://localhost:${sourcePort} and http://localhost:${destinationPort}\nDisposable data: ${directory}`
  )
  setInterval(() => {}, 60000)
} catch (error) {
  console.error(error.message)
  await cleanup(1)
}
