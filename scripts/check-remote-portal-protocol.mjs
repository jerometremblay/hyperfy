import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: ['src/core/packets.js'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
const { readPacket, writePacket } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)
const status = await (await fetch('http://localhost:3335/api/portal-status?portalId=exit')).json()
assert.equal(status.available, true)
assert.equal(status.preview.version, 1)
const before = await (await fetch('http://localhost:3335/status')).json()
const preview = new WebSocket(status.preview.wsUrl)
const updates = []
preview.addEventListener('message', event => updates.push(JSON.parse(event.data)))
await new Promise(resolve => preview.addEventListener('open', resolve, { once: true }))
preview.send(JSON.stringify({ type: 'subscribe', version: 1, portalIds: ['exit'] }))
async function waitFor(predicate) {
  for (let i = 0; i < 100; i++) {
    const value = predicate()
    if (value) return value
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  throw new Error('Expected preview update did not arrive')
}
const snapshot = await waitFor(() => updates.find(update => update.type === 'snapshot'))
assert.ok(snapshot.endpoints.exit)
assert.ok(snapshot.added.some(entity => entity.type === 'app'))
assert.equal(snapshot.authToken, undefined)
assert.equal(
  (await (await fetch('http://localhost:3335/status')).json()).connectedUsers.length,
  before.connectedUsers.length
)
const player = new WebSocket('ws://localhost:3335/ws?name=PreviewAcceptanceAvatar')
player.binaryType = 'arraybuffer'
let playerSnapshot
player.addEventListener('message', event => {
  const [method, data] = readPacket(event.data)
  if (method === 'onSnapshot') playerSnapshot = data
})
await waitFor(() => playerSnapshot)
player.send(writePacket('entityModified', { id: playerSnapshot.id, p: [-2, 0, 4], q: [0, 0, 0, 1] }))
await waitFor(() => updates.some(update => update.added?.some(entity => entity.id === playerSnapshot.id)))
player.send(writePacket('entityModified', { id: playerSnapshot.id, p: [-2.5, 0, 4] }))
await waitFor(() =>
  updates.some(
    update => update.type === 'entityModified' && update.data.id === playerSnapshot.id && update.data.p?.[0] === -2.5
  )
)
player.send(writePacket('entityModified', { id: playerSnapshot.id, p: [150, 0, 4] }))
await waitFor(() => updates.some(update => update.removed?.includes(playerSnapshot.id)))
player.send(writePacket('entityModified', { id: playerSnapshot.id, p: [-2, 0, 4] }))
await waitFor(() => updates.filter(update => update.added?.some(entity => entity.id === playerSnapshot.id)).length >= 2)
console.log(
  'PASS: regional live avatar add, movement, removal, re-entry; endpoint discovery; no ghost player or credentials'
)
player.send(writePacket('settingsModified', { key: 'dayNightCycle', value: false }))
await waitFor(() => updates.some(update => update.type === 'update' && update.settings?.dayNightCycle === false))
player.send(writePacket('settingsModified', { key: 'timeOffset', value: 3600000 }))
await waitFor(() => updates.some(update => update.type === 'update' && update.settings?.timeOffset === 3600000))
player.send(writePacket('settingsModified', { key: 'timeOffset', value: snapshot.settings.timeOffset || 0 }))
player.send(writePacket('settingsModified', { key: 'dayNightCycle', value: snapshot.settings.dayNightCycle }))
await waitFor(
  () =>
    updates.at(-1)?.settings?.dayNightCycle === snapshot.settings.dayNightCycle &&
    updates.at(-1)?.settings?.timeOffset === (snapshot.settings.timeOffset || 0)
)
console.log('PASS: remote lighting mode and world-clock offset changes arrive live')
preview.send(JSON.stringify({ type: 'entityModified', id: playerSnapshot.id, position: [0, 0, 0] }))
await new Promise(resolve =>
  preview.addEventListener(
    'close',
    event => {
      assert.equal(event.code, 1008)
      resolve()
    },
    { once: true }
  )
)
console.log('PASS: destination rejects preview mutations')
if (process.argv.includes('--hold-avatar')) {
  console.log(`Avatar retained for visual inspection; send any input to stop (PID ${process.pid})`)
  process.stdin.resume()
  process.stdin.once('data', () => {
    player.close()
    process.exit(0)
  })
} else player.close()
