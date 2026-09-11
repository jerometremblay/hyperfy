import crypto from 'node:crypto'
import fs from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { readPacket, writePacket } from '../src/core/packets.js'

const prototypesDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(prototypesDir, '..')
const sourcePath = path.join(prototypesDir, 'snowman.js')
const envPath = path.join(rootDir, '.env')
const entityId = 'snowman-prototype-instance'
const prototypeName = 'Snowman Prototype'

function readEnv(text) {
  const values = {}
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    values[match[1]] = value
  }
  return values
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const env = readEnv(await readFile(envPath, 'utf8'))
const wsUrl = process.env.PROTOTYPE_WS_URL || env.PUBLIC_WS_URL
const apiUrl = process.env.PROTOTYPE_API_URL || env.PUBLIC_API_URL
const adminCode = process.env.PROTOTYPE_ADMIN_CODE || env.ADMIN_CODE

if (!wsUrl || !apiUrl || !adminCode) {
  throw new Error('The prototype watcher needs PUBLIC_WS_URL, PUBLIC_API_URL, and ADMIN_CODE in .env')
}

let socket
let snapshot
let deploying = Promise.resolve()
let pendingChange = false

function send(name, data) {
  socket.send(writePacket(name, data))
}

async function uploadScript(source) {
  const hash = crypto.createHash('sha256').update(source).digest('hex')
  const fileName = `${hash}.js`
  const form = new FormData()
  form.append('file', new File([source], fileName, { type: 'text/javascript' }))

  const response = await fetch(`${apiUrl}/upload`, {
    method: 'POST',
    body: form,
  })
  if (!response.ok) {
    throw new Error(`Script upload failed: ${response.status} ${response.statusText}`)
  }

  return `asset://${fileName}`
}

function createBlueprint(script) {
  return {
    id: 'snowman-prototype',
    version: 0,
    name: prototypeName,
    image: null,
    author: 'Hyperfy prototype',
    url: null,
    desc: 'A tiny clickable snowman prototype. Edit prototypes/snowman.js to iterate live.',
    model: 'script-only',
    script,
    props: {},
    preload: false,
    public: false,
    locked: false,
    frozen: false,
    unique: false,
    scene: false,
    disabled: false,
  }
}

function createEntity(blueprintId) {
  return {
    id: entityId,
    type: 'app',
    blueprint: blueprintId,
    position: [0, 0, -2],
    quaternion: [0, 0, 0, 1],
    scale: [1, 1, 1],
    mover: null,
    uploader: null,
    pinned: false,
    state: {},
  }
}

async function deploy() {
  const source = await readFile(sourcePath, 'utf8')
  const script = await uploadScript(source)
  const current = snapshot.blueprints.find(item => item.name === prototypeName)
  const existingEntity = snapshot.entities.some(item => item.id === entityId)

  if (!current) {
    const blueprint = createBlueprint(script)
    send('blueprintAdded', blueprint)
    snapshot.blueprints.push(blueprint)

    if (!existingEntity) {
      const entity = createEntity(blueprint.id)
      send('entityAdded', entity)
      snapshot.entities.push(entity)
    }
    console.log('[snowman] created and placed at world position [0, 0, -2]')
    return
  }

  const change = {
    id: current.id,
    version: current.version + 1,
    script,
  }
  send('blueprintModified', change)
  Object.assign(current, change)
  console.log(`[snowman] updated in-world to script version ${change.version}`)
}

function scheduleDeploy() {
  pendingChange = true
  deploying = deploying.then(async () => {
    await sleep(150)
    if (!pendingChange) return
    pendingChange = false
    await deploy()
  }).catch(err => {
    console.error(`[snowman] ${err.message}`)
  })
}

function connect() {
  return new Promise((resolve, reject) => {
    socket = new WebSocket(`${wsUrl}?authToken=null`)
    socket.binaryType = 'arraybuffer'

    socket.onerror = () => reject(new Error('Could not connect to Hyperfy WebSocket'))
    socket.onclose = () => {
      console.error('[snowman] WebSocket closed; stop the watcher and restart it if the server was restarted')
    }
    socket.onmessage = event => {
      const [method, data] = readPacket(event.data)
      if (method === 'onSnapshot') {
        snapshot = data
        resolve()
      }
    }
  })
}

await connect()
send('command', { args: ['admin', adminCode] })
await sleep(250)
scheduleDeploy()
await deploying

console.log(`[snowman] watching ${path.relative(rootDir, sourcePath)}`)
console.log('[snowman] edit snowman.js; the placed app will rebuild automatically')

fs.watch(sourcePath, { persistent: true }, () => scheduleDeploy())
await new Promise(() => {})
