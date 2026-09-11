import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const source = await readFile(new URL('./snowman.js', import.meta.url), 'utf8')
const storageKey = 'snowman:snowman-prototype-instance:color'
const white = '#f4f4f4'
const red = '#ef4444'
const blue = '#3b82f6'

function createRuntime({ isServer, state = {}, storage = {} }) {
  const handlers = new Map()
  const sent = []
  const nodes = []

  const app = {
    instanceId: 'snowman-prototype-instance',
    state: structuredClone(state),
    create(type, data) {
      const node = { type, ...data }
      nodes.push(node)
      return node
    },
    add() {},
    on(name, callback) {
      const listeners = handlers.get(name) || []
      listeners.push(callback)
      handlers.set(name, listeners)
    },
    send(name, data) {
      sent.push({ name, data })
    },
  }

  const world = {
    isServer,
    isClient: !isServer,
    get(key) {
      return storage[key]
    },
    set(key, value) {
      storage[key] = value
    },
  }

  vm.runInNewContext(source, { app, console, world })

  return {
    app,
    nodes,
    sent,
    trigger(name, ...args) {
      for (const callback of handlers.get(name) || []) callback(...args)
    },
  }
}

function nodeColors(runtime) {
  return runtime.nodes.slice(0, 3).map(node => node.color)
}

test('a client initializes from the server persisted color after reload', () => {
  const storage = { [storageKey]: blue }
  const server = createRuntime({ isServer: true, storage })
  const client = createRuntime({ isServer: false, state: server.app.state })

  assert.equal(server.app.state.color, blue)
  assert.equal(server.app.state.ready, true)
  assert.deepEqual(nodeColors(client), [blue, blue, blue])
})

test('a click sends an intent and clients render the server update', () => {
  const storage = {}
  const server = createRuntime({ isServer: true, storage })
  const client = createRuntime({ isServer: false, state: server.app.state })

  client.nodes[0].onPointerDown()

  assert.equal(client.sent[0].name, 'cycleColor')
  assert.deepEqual(nodeColors(client), [white, white, white])

  server.trigger('cycleColor')
  const update = server.sent.find(event => event.name === 'colorChanged')

  assert.equal(server.app.state.color, red)
  assert.equal(storage[storageKey], red)
  assert.equal(update.data.color, red)

  client.trigger('colorChanged', update.data)
  assert.deepEqual(nodeColors(client), [red, red, red])
})
