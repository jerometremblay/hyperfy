import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

globalThis.window = {}
const queued = []
const channels = []
globalThis.MessageChannel = class {
  constructor() {
    this.port1 = {
      onmessage: null,
      close() {
        this.closed = true
      },
    }
    this.port2 = {
      close() {
        this.closed = true
      },
      postMessage: () =>
        queued.push(() => {
          if (!this.port1.closed) this.port1.onmessage?.()
        }),
    }
    channels.push(this)
  }
}
const workers = []
globalThis.Worker = class {
  constructor() {
    this.messages = []
    workers.push(this)
  }
  postMessage(value) {
    this.messages.push(value)
  }
  terminate() {
    this.terminated = true
  }
}
const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./Client.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { Client } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function setup() {
  queued.length = 0
  channels.length = 0
  workers.length = 0
  globalThis.document = Object.assign(new EventTarget(), { hidden: false })
  const ticks = []
  let loop
  const renderer = {
    xr: { isPresenting: false },
    setAnimationLoop(value) {
      loop = value
    },
  }
  const world = {
    graphics: { renderer },
    settings: { on() {} },
    tick(time) {
      ticks.push(time)
    },
  }
  const client = new Client(world)
  client.start()
  return {
    client,
    renderer,
    world,
    ticks,
    frame(time) {
      loop?.(time)
    },
    get loop() {
      return loop
    },
  }
}

test('desktop rendering leaves the animation callback so queued updates can run during held keys', () => {
  const s = setup()
  const events = []
  s.world.tick = time => {
    events.push('tick')
    s.ticks.push(time)
  }
  queued.push(() => events.push('incoming shot snapshot'))
  s.frame(100)
  assert.deepEqual(s.ticks, [], 'the expensive tick must not run inside requestAnimationFrame')
  s.frame(116)
  s.frame(133)
  assert.equal(queued.length, 2, 'desktop frames must coalesce instead of accumulating work')
  queued.shift()()
  queued.shift()()
  assert.deepEqual(events, ['incoming shot snapshot', 'tick'])
  assert.deepEqual(s.ticks, [133], 'the queued tick uses the latest frame time')
  s.frame(150)
  queued.shift()()
  assert.deepEqual(s.ticks, [133, 150])
  s.client.destroy()
})

test('XR frames remain synchronous and discard a pending desktop tick', () => {
  const s = setup()
  s.frame(100)
  assert.equal(queued.length, 1)
  s.renderer.xr.isPresenting = true
  s.frame(116)
  assert.deepEqual(s.ticks, [116])
  queued.shift()()
  assert.deepEqual(s.ticks, [116], 'a queued desktop tick cannot run outside the XR frame')
  s.renderer.xr.isPresenting = false
  s.frame(133)
  queued.shift()()
  assert.deepEqual(s.ticks, [116, 133])
  s.client.destroy()
})

test('hidden tabs retain worker ticking and resume the queued desktop loop', () => {
  const s = setup()
  s.frame(100)
  document.hidden = true
  s.client.onVisibilityChange()
  assert.equal(s.loop, null)
  assert.equal(workers.length, 1)
  assert.equal(workers[0].messages.at(-1), 'start')
  queued.shift()()
  assert.deepEqual(s.ticks, [])
  workers[0].onmessage()
  assert.equal(s.ticks.length, 1)
  document.hidden = false
  s.client.onVisibilityChange()
  assert.equal(workers[0].messages.at(-1), 'stop')
  s.frame(150)
  assert.equal(s.ticks.length, 1)
  queued.shift()()
  assert.equal(s.ticks.at(-1), 150)
  s.client.destroy()
})

for (const method of ['destroy', 'stopForFatal']) {
  test(`${method} cancels queued frame work and closes its ports`, () => {
    const s = setup()
    s.frame(100)
    s.client[method]()
    assert.equal(s.loop, null)
    queued.shift()()
    assert.deepEqual(s.ticks, [])
    assert.equal(channels[0].port1.closed, true)
    assert.equal(channels[0].port2.closed, true)
  })
}
