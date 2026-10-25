import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { once } from 'node:events'
import { readPacket, writeClientPacket } from '../../src/core/packets.js'

test('built server protects sessions, uploads, assets and reconnects with the real database and PhysX', async t => {
  const root = path.resolve(import.meta.dirname, '../..')
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'hyperfy-security-server-'))
  await fs.writeFile(path.join(directory, '.env'), '')
  const listener = net.createServer()
  listener.listen(0, '127.0.0.1')
  await once(listener, 'listening')
  const port = listener.address().port
  await new Promise(resolve => listener.close(resolve))
  const base = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, [path.join(root, 'build/index.js')], {
    cwd: root,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      NODE_ENV: 'test',
      DOTENV_FLOW_PATH: directory,
      WORLD: path.relative(root, directory),
      PORT: String(port),
      JWT_SECRET: 'isolated-security-test',
      ADMIN_CODE: 'isolated-admin',
      AGENT_API_WRITE_TOKEN: 'isolated-agent-writer',
      SAVE_INTERVAL: '0',
      PUBLIC_MAX_UPLOAD_SIZE: '256',
      PUBLIC_WS_URL: `ws://127.0.0.1:${port}/ws`,
      PUBLIC_API_URL: `${base}/api`,
      ASSETS: 'local',
      ASSETS_BASE_URL: `${base}/assets`,
      CLEAN: 'false',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  const collect = data => {
    output = (output + data).slice(-12000)
  }
  child.stdout.on('data', collect)
  child.stderr.on('data', collect)
  const clients = []
  t.after(async () => {
    for (const client of clients) client.close()
    child.kill('SIGTERM')
    if (child.exitCode === null) await once(child, 'exit')
    await fs.rm(directory, { recursive: true, force: true })
  })
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) break
    try {
      if ((await fetch(base)).ok) {
        ready = true
        break
      }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(ready, `server did not start: ${output}`)
  assert.equal((await fetch(`${base}/api/upload-check?filename=${'a'.repeat(64)}.glb`)).status, 401)
  assert.equal((await fetch(`${base}/api/upload`, { method: 'POST', body: 'invalid body' })).status, 401)

  async function connect(token) {
    const endpoint = new URL(`ws://127.0.0.1:${port}/ws?v=2`)
    if (token) endpoint.searchParams.set('authToken', token)
    const ws = new WebSocket(endpoint)
    clients.push(ws)
    ws.binaryType = 'arraybuffer'
    const messages = []
    ws.addEventListener('message', event => messages.push(readPacket(event.data)))
    await once(ws, 'open')
    async function waitFor(method, predicate = () => true) {
      for (let attempt = 0; attempt < 100; attempt++) {
        const index = messages.findIndex(([name, data]) => name === method && predicate(data))
        if (index !== -1) return messages.splice(index, 1)[0][1]
        await new Promise(resolve => setTimeout(resolve, 20))
      }
      assert.fail(`missing ${method}; server output: ${output}`)
    }
    return { ws, waitFor, messages, snapshot: await waitFor('onSnapshot') }
  }
  const visitor = await connect()
  const peer = await connect()
  const token = visitor.snapshot.authToken
  visitor.ws.send(writeClientPacket('entityModified', { id: visitor.snapshot.id, rank: 2 }))
  visitor.ws.send(writeClientPacket('settingsModified', { key: 'title', value: 'forged-title' }))
  visitor.ws.send(writeClientPacket('chatAdded', { id: 'spoof', fromId: 'admin', from: 'Admin', body: 'test message' }))
  const chat = await peer.waitFor('onChatAdded', data => data.body === 'test message')
  assert.equal(chat.fromId, visitor.snapshot.id)
  assert.notEqual(chat.id, 'spoof')
  assert.equal(visitor.messages.some(([name]) => name === 'onChatAdded'), false, 'the sender keeps its local echo')
  assert.match(output, /\[fetch\] brotli guard installed/)
  const headless = spawn(
    process.execPath,
    [path.join(root, 'test/security/lib/nodeClientsSmoke.mjs'), `ws://127.0.0.1:${port}/ws`],
    { cwd: root, env: { PATH: process.env.PATH, HOME: process.env.HOME }, stdio: ['ignore', 'pipe', 'pipe'] }
  )
  let headlessOutput = ''
  for (const stream of [headless.stdout, headless.stderr]) {
    stream.on('data', data => {
      headlessOutput = (headlessOutput + data).slice(-12000)
    })
  }
  const headlessTimeout = setTimeout(() => headless.kill('SIGTERM'), 15000)
  t.after(() => {
    clearTimeout(headlessTimeout)
    headless.kill('SIGTERM')
  })
  const [headlessCode] = await once(headless, 'exit')
  clearTimeout(headlessTimeout)
  assert.equal(headlessCode, 0, `headless clients failed: ${headlessOutput}`)
  assert.match(headlessOutput, /HEADLESS_READY_TWO_SEPARATE_SESSIONS/)
  const headers = { Authorization: `Bearer ${token}` }
  assert.equal((await fetch(`${base}/api/upload-check?filename=${'a'.repeat(64)}.glb`, { headers })).status, 200)
  const unauthorized = new FormData()
  unauthorized.append('file', new Blob(['app.on("update", () => {})']), 'probe.js')
  assert.equal((await fetch(`${base}/api/upload`, { method: 'POST', headers, body: unauthorized })).status, 403)

  visitor.ws.send(writeClientPacket('command', { args: ['admin', 'isolated-admin'] }))
  await visitor.waitFor('onEntityModified', data => data.id === visitor.snapshot.id && data.rank === 2)
  const form = new FormData()
  form.append('file', new Blob(['app.on("update", () => {})']), 'probe.js')
  assert.equal((await fetch(`${base}/api/upload`, { method: 'POST', headers, body: form })).status, 200)
  const { createHash } = await import('node:crypto')
  const hash = createHash('sha256').update('app.on("update", () => {})').digest('hex')
  const agentForm = new FormData()
  agentForm.append('file', new Blob(['app.on("update", () => {})']), `${hash}.js`)
  const agentUpload = await fetch(`${base}/api/agent/assets`, {
    method: 'POST',
    headers: { Authorization: 'Bearer isolated-agent-writer' },
    body: agentForm,
  })
  assert.equal(agentUpload.status, 201, 'agent uploads retain their streaming multipart parser')
  const asset = await fetch(`${base}/assets/${hash}.js`)
  assert.equal(asset.status, 200)
  assert.equal(asset.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(asset.headers.get('content-disposition'), 'attachment')
  assert.match(asset.headers.get('content-security-policy'), /sandbox/)
  const cached = await fetch(`${base}/assets/${hash}.js`, {
    cache: 'force-cache',
    headers: { 'If-None-Match': asset.headers.get('etag') },
  })
  assert.equal(cached.status, 304)
  assert.equal(cached.headers.get('x-content-type-options'), 'nosniff')
  assert.match(cached.headers.get('content-security-policy'), /sandbox/)
  visitor.ws.send(writeClientPacket('settingsModified', { key: 'title', value: '<script>window.injected=1</script>' }))
  let html = ''
  for (let attempt = 0; attempt < 100; attempt++) {
    html = await (await fetch(base)).text()
    if (html.includes('&lt;script&gt;window.injected=1&lt;/script&gt;')) break
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  assert.ok(html.includes('&lt;script&gt;window.injected=1&lt;/script&gt;'))
  assert.ok(!html.includes('<script>window.injected=1</script>'))
  visitor.ws.close()
  await once(visitor.ws, 'close')
  const returning = await connect(token)
  assert.equal(returning.snapshot.id, visitor.snapshot.id)
  assert.ok(!output.includes(token), 'the session token must never reach server logs')
})
