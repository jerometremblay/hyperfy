import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { makeClient } from '../../tools/worldsync/src/deployment.mjs'
import { parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'

const root = path.resolve(import.meta.dirname, '../..')
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'hyperfy-darts-playtest-'))
await fs.writeFile(path.join(directory, '.env'), '')
const port = 8766
const url = `http://127.0.0.1:${port}`
const child = spawn(process.execPath, [path.join(root, 'build/index.js')], {
  cwd: root,
  env: {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    NODE_ENV: 'test',
    DOTENV_FLOW_PATH: directory,
    WORLD: path.relative(root, directory),
    PORT: String(port),
    JWT_SECRET: 'isolated-darts-test',
    ADMIN_CODE: 'darts-local-test',
    AGENT_API_WRITE_TOKEN: 'isolated-darts-writer',
    SAVE_INTERVAL: '0',
    PUBLIC_MAX_UPLOAD_SIZE: '256',
    PUBLIC_WS_URL: `ws://127.0.0.1:${port}/ws`,
    PUBLIC_API_URL: `${url}/api`,
    ASSETS: 'local',
    ASSETS_BASE_URL: `${url}/assets`,
    CLEAN: 'false',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let log = ''
const collect = data => {
  log = (log + data).slice(-12000)
}
child.stdout.on('data', collect)
child.stderr.on('data', collect)
let ready = false
for (let attempt = 0; attempt < 100; attempt++) {
  if (child.exitCode !== null) break
  try {
    if ((await fetch(url)).ok) {
      ready = true
      break
    }
  } catch {}
  await new Promise(resolve => setTimeout(resolve, 100))
}
if (!ready) {
  child.kill()
  throw new Error('Local server did not start: ' + log)
}
const client = makeClient({ apiUrl: `${url}/api/agent`, token: 'isolated-darts-writer' })
const hyp = parseHyp(await fs.readFile(path.join(root, 'outputs/darts/darts.hyp')))
for (const asset of hyp.assets) await client.uploadAsset(asset)
const { id, version, ...fields } = hyp.blueprint
const app = await client.request('/apps', { method: 'POST', json: fields })
const entity = await client.request('/entities', {
  method: 'POST',
  json: { blueprint: app.id, position: [0, 0, 0], pinned: true },
})
await fs.writeFile(
  path.join(root, 'outputs/darts/local-playtest.json'),
  JSON.stringify({ url, blueprintId: app.id, entityId: entity.id, pid: child.pid }, null, 2)
)
console.log('Isolated darts playtest: ' + url + ' · instance ' + entity.id)
const cleanup = async () => {
  child.kill('SIGTERM')
  if (child.exitCode === null) await once(child, 'exit')
  await fs.rm(directory, { recursive: true, force: true })
  process.exit(0)
}
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
await once(child, 'exit')
