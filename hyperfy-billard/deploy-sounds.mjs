// Update only the existing pool game through the configured world Agent API.
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import dotenv from 'dotenv-flow'
import { makeClient, loadProfile } from '../tools/worldsync/src/deployment.mjs'
const here = fileURLToPath(new URL('.', import.meta.url))
const engine = fileURLToPath(new URL('../', import.meta.url))
Object.assign(process.env, dotenv.parse([`${engine}.env.agent`]))
const profile = await loadProfile(`${engine}../hyperfy-world-jerome`, 'online-world')
if (profile.apiUrl !== 'https://monstre.duckdns.org:3333/api/agent') throw Error('Unexpected deployment target')
const client = makeClient(profile)
const last = JSON.parse(await fs.readFile(`${here}cue-rack/live.json`))
if (last.target !== profile.apiUrl) throw Error('Previous deployment targets another world')
const current = await client.request(`/apps/${last.game.id}`)
const bytes = await fs.readFile(`${here}dist/hyperfy-billard.hyp`)
const headerLength = bytes.readUInt32LE(0)
const { blueprint, assets } = JSON.parse(bytes.subarray(4, 4 + headerLength))
if (![last.game.script, blueprint.script].includes(current.script)) throw Error('Live game changed since last verified deployment')
const hash = data => createHash('sha256').update(data).digest('hex')
let offset = 4 + headerLength
const uploads = []
for (const asset of assets) {
  const raw = bytes.subarray(offset, offset + asset.size)
  offset += asset.size
  if (asset.type !== 'audio' && asset.type !== 'script') continue
  const extension = asset.url.split('.').at(-1)
  if (`asset://${hash(raw)}.${extension}` !== asset.url) throw Error('Package asset hash mismatch')
  uploads.push({ ...asset, bytes: raw, sha256: hash(raw), extension, source: asset.type })
}
if (uploads.filter(a => a.type === 'audio').length !== 4) throw Error('Expected four sound assets')
const props = { ...current.props }
for (const type of ['Hit', 'Collision', 'Cushion', 'Pot']) props[`sound${type}`] = blueprint.props[`sound${type}`]
console.log(JSON.stringify({ target: profile.apiUrl, game: current.id, beforeVersion: current.version,
  script: blueprint.script, uploads: uploads.length, preload: true, apply: process.argv.includes('--apply') }))
if (!process.argv.includes('--apply')) process.exit(0)
await fs.writeFile(`${here}sounds/deployment-before.json`, JSON.stringify({ target: profile.apiUrl, game: current }, null, 2) + '\n')
for (const asset of uploads) await client.uploadAsset(asset)
await client.request(`/apps/${current.id}`, { method: 'PATCH', json: {
  version: current.version, script: blueprint.script, props, preload: true,
} })
const verified = await client.request(`/apps/${current.id}`)
if (verified.script !== blueprint.script || !verified.preload || JSON.stringify(verified.props) !== JSON.stringify(props))
  throw Error('Game read-back mismatch')
for (const asset of uploads) {
  const live = await client.requestBytes(`/assets/${asset.url.slice(8)}`)
  if (!live.bytes.equals(asset.bytes)) throw Error(`Live ${asset.type} bytes differ`)
}
await fs.writeFile(`${here}cue-rack/live.json`, JSON.stringify({ ...last, checkedAt: new Date().toISOString(), game: verified }, null, 2) + '\n')
await fs.writeFile(`${here}sounds/deployment.json`, JSON.stringify({ target: profile.apiUrl, checkedAt: new Date().toISOString(),
  game: verified.id, version: verified.version, script: verified.script,
  assets: uploads.map(({ url, type, size }) => ({ url, type, size })), verifiedBytes: true }, null, 2) + '\n')
console.log(`Verified pool game v${verified.version}, preload, preserved props and all five asset byte streams.`)
