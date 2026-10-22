// Update only the mapped rack and existing game through the supported Agent API.
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import dotenv from 'dotenv-flow'
import { makeClient, loadProfile } from '../../tools/worldsync/src/deployment.mjs'
const here = fileURLToPath(new URL('.', import.meta.url))
const engine = fileURLToPath(new URL('../../', import.meta.url))
Object.assign(process.env, dotenv.parse([`${engine}.env.agent`]))
const profile = await loadProfile(`${engine}../hyperfy-world-jerome`, 'online-world')
const client = makeClient(profile)
const before = JSON.parse(await fs.readFile(`${here}live-before.json`))
const last = await fs.readFile(`${here}live.json`).then(JSON.parse, () => null)
const rackSource = await fs.readFile(`${here}rack.js`)
const gameSource = await fs.readFile(`${here}../dist/hyperfy-billard.js`)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const expected = { rack: `asset://${hash(rackSource)}.js`, game: `asset://${hash(gameSource)}.js` }
const current = {}
for (const key of ['rack', 'game']) {
  current[key] = await client.request(`/apps/${before[key].id}`)
  if (![before[key].script, last?.target === profile.apiUrl ? last[key]?.script : null, expected[key]].includes(current[key].script))
    throw Error(`Live ${key} changed since preparation; refusing to overwrite it`)
}
if (!(await fs.readFile(`${engine}../hyperfy-world-jerome/objects/app-ad9a35e5852a2887/script.js`)).equals(rackSource))
  throw Error('World source and prepared rack differ')
console.log(`Target ${profile.apiUrl}: cursor-following play hint, hourglass while shots run, and no play input while balls move`)
if (!process.argv.includes('--apply')) process.exit(0)
for (const [key, bytes] of [['rack', rackSource], ['game', gameSource]]) {
  const app = current[key]
  const props = { ...app.props, ...(key === 'rack' ? { poolChannel: 'classic-8-ft-pool-table' } : {}) }
  if (key === 'game') for (const field of ['cameraHeight', 'cameraDistance', 'cameraOffset']) delete props[field]
  if (app.script !== expected[key] || JSON.stringify(app.props) !== JSON.stringify(props)) {
    await client.uploadAsset({ bytes, sha256: hash(bytes), extension: 'js', url: expected[key], mime: 'text/plain', source: `${key} script` })
    await client.request(`/apps/${app.id}`, { method: 'PATCH', json: { version: app.version, script: expected[key], props } })
  }
}
const verified = { target: profile.apiUrl, checkedAt: new Date().toISOString() }
for (const key of ['rack', 'game']) {
  const app = await client.request(`/apps/${before[key].id}`)
  if (app.script !== expected[key]) throw Error(`${key} script read-back failed`)
  const bytes = await client.requestBytes(`/assets/${app.script.slice(8)}`)
  if (`asset://${hash(bytes.bytes)}.js` !== expected[key]) throw Error(`${key} asset bytes differ`)
  verified[key] = app
}
await fs.writeFile(`${here}live.json`, JSON.stringify(verified, null, 2) + '\n')
console.log(`Verified rack v${verified.rack.version} and game v${verified.game.version}, including exact script bytes.`)
