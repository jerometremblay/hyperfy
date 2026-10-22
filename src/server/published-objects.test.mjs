import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import Knex from 'knex'

const entry = fileURLToPath(new URL('./published-objects.js', import.meta.url))
const bundle = await build({
  stdin: {
    contents: `export * from './published-objects.js'; export * from './PublishedSourceResolver.js'; export * from '../core/extras/publishedObjects.js'; export * from '../core/extras/appTools.js'; export { App } from '../core/entities/App.js'; export { ServerNetwork } from '../core/systems/ServerNetwork.js';`,
    resolveDir: path.dirname(entry),
  },
  bundle: true,
  format: 'cjs',
  platform: 'node',
  write: false,
  plugins: [
    {
      name: 'unused-rendering',
      setup(build) {
        build.onResolve({ filter: /(^|\/)createNode$/ }, () => ({ path: 'createNode', namespace: 'test' }))
        build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({
          contents: 'export function createNode() { throw new Error("Rendering is outside this unit test") }',
        }))
      },
    },
  ],
})
const compiled = new Module(entry)
compiled.filename = entry
compiled.paths = Module._nodeModulePaths(path.dirname(entry))
compiled._compile(bundle.outputFiles[0].text, entry)
const {
  PublishedObjects,
  PublishedSourceResolver,
  validatePublishedPackage,
  sourceURL,
  publicAddress,
  downloadSource,
  digest,
  exportApp,
  canonical,
  implementationDescriptor,
  mergePublishedProps,
  publishedExpectation,
  publishedStatus,
  App,
  ServerNetwork,
} = compiled.exports
const url = 'https://objects.example/chair.hyp'
async function packageBytes(props = { color: 'blue', intensity: 1 }, extra = {}) {
  const script = Buffer.from(`app.add(app.create('group')); // ${JSON.stringify(props)}`)
  const scriptURL = `asset://${digest(script).slice(7)}.js`
  const file = await exportApp(
    { id: 'remote', version: 5, name: 'Chair', model: 'script-only', script: scriptURL, props, ...extra },
    async () => new File([script], `${digest(script).slice(7)}.js`)
  )
  return Buffer.from(await file.arrayBuffer())
}
async function fixture(t, props) {
  const db = Knex({ client: 'better-sqlite3', connection: { filename: ':memory:' }, useNullAsDefault: true })
  for (const table of ['entities', 'blueprints'])
    await db.schema.createTable(table, table => {
      table.string('id').primary()
      table.text('data')
      table.text('createdAt')
      table.text('updatedAt')
    })
  t.after(() => db.destroy())
  let remote = await packageBytes(props)
  let requests = 0
  const sent = []
  const blueprints = new Map()
  const entities = new Map()
  const assets = new Map()
  let failBuild = false
  const world = {
    blueprints: { get: id => blueprints.get(id), add: bp => blueprints.set(bp.id, structuredClone(bp)) },
    entities: {
      items: entities,
      get: id => entities.get(id),
      add(data) {
        const app = {
          data: structuredClone(data),
          isApp: true,
          builds: 0,
          async build() {
            this.builds++
            this.scriptError = failBuild ? { message: 'failed' } : null
          },
          async modify(change) {
            Object.assign(this.data, structuredClone(change))
            if ('published' in change && change.published == null) delete this.data.published
            if ('blueprint' in change || 'state' in change) await this.build()
          },
          get blueprint() {
            return blueprints.get(this.data.blueprint)
          },
          destroy() {
            this.destroyed = true
            entities.delete(this.data.id)
          },
        }
        entities.set(data.id, app)
        app.buildPromise = app.build()
        return app
      },
    },
    network: { db, sockets: new Map(), send: (...args) => sent.push(structuredClone(args)) },
  }
  const resolver = new PublishedSourceResolver({
    fetcher: async () => {
      requests++
      return { bytes: remote, etag: `"${digest(remote)}"` }
    },
  })
  const service = new PublishedObjects(
    world,
    {
      upload: async file => assets.set(file.name, Buffer.from(await file.arrayBuffer())),
      exists: async name => assets.has(name),
    },
    resolver
  )
  const socket = { id: 'builder', player: { isBuilder: () => true } }
  world.network.sockets.set(socket.id, socket)
  return {
    db,
    service,
    socket,
    resolver,
    world,
    sent,
    entities,
    blueprints,
    assets,
    requests: () => requests,
    remote: async (props, extra) => {
      remote = await packageBytes(props, extra)
      resolver.cache.get(url).nextCheck = 0
    },
    fail: value => {
      failBuild = value
    },
  }
}
async function importObject(f) {
  const prepared = await f.service.prepare(f.socket, { url, position: [1, 2, 3], quaternion: [0, 0, 0, 1] })
  const result = await f.service.commit(f.socket, { token: prepared.token })
  return { app: f.entities.get(result.change.id), prepared, result }
}
async function prepareUpdate(f, app, confirm = false) {
  return f.service.prepare(f.socket, {
    id: app.data.id,
    expected: publishedExpectation(app, f.world.blueprints),
    confirm,
  })
}

test('server import -> changed same URL -> merged isolated update -> atomic persisted Undo and availability', async t => {
  const f = await fixture(t)
  const { app } = await importObject(f)
  const originalBP = app.data.blueprint
  app.data.pinned = true
  app.data.scale = [2, 3, 4]
  app.data.state = { counter: 42 }
  f.blueprints.get(originalBP).props.color = 'red'
  const sibling = f.world.entities.add({ ...structuredClone(app.data), id: 'sibling' })
  const previous = structuredClone(app.data)
  await f.remote({ color: 'green', intensity: 0.8, radius: 5 })
  await f.service.check(f.socket, { url })
  assert.equal(publishedStatus(app.data.published, f.resolver.status(url)), 'update-available')
  assert.deepEqual(app.data, previous, 'checking never rebuilds or edits an entity')
  const prepared = await prepareUpdate(f, app)
  const result = await f.service.commit(f.socket, { token: prepared.token })
  assert.equal(f.service.session(f.socket).undo.size, 1)
  assert.deepEqual(app.blueprint.props, { color: 'red', intensity: 0.8, radius: 5 })
  assert.deepEqual(app.data.position, previous.position)
  assert.deepEqual(app.data.scale, previous.scale)
  assert.equal(app.data.pinned, true)
  assert.deepEqual(app.data.state, {})
  assert.equal(sibling.data.blueprint, originalBP)
  assert.equal(app.data.id, previous.id)
  assert.notEqual(app.data.blueprint, originalBP)
  assert.equal(publishedStatus(app.data.published, f.resolver.status(url)), 'current')
  const replay = await f.service.commit(f.socket, { token: prepared.token })
  assert.deepEqual(replay, result)
  assert.equal(f.service.session(f.socket).undo.size, 1)
  assert.deepEqual(
    f.sent.slice(-2).map(item => item[0]),
    ['blueprintAdded', 'entityModified']
  )
  const restored = await f.service.commit(f.socket, { token: result.undoToken, undo: true })
  assert.equal(app.data.blueprint, previous.blueprint)
  assert.deepEqual(app.data.state, previous.state)
  assert.deepEqual(app.data.published, previous.published)
  assert.equal(sibling.data.blueprint, originalBP)
  assert.equal(publishedStatus(app.data.published, f.resolver.status(url)), 'update-available')
  const row = await f.db('entities').where('id', app.data.id).first()
  const saved = JSON.parse(row.data)
  assert.deepEqual(saved, app.data, 'fresh clients/restart recover the complete committed metadata')
  const savedBP = JSON.parse((await f.db('blueprints').where('id', saved.blueprint).first()).data)
  assert.deepEqual(savedBP.props, { color: 'red', intensity: 1 })
  assert.deepEqual(restored.change.published, previous.published)
})

test('link/change/unlink are metadata-only; unverified installation conservatively merges and Undo restores unknown provenance', async t => {
  const f = await fixture(t)
  const bp = { id: 'local', version: 0, model: 'script-only', props: { color: 'red', intensity: 2 } }
  f.world.blueprints.add(bp)
  const app = f.world.entities.add({
    id: 'local-instance',
    type: 'app',
    blueprint: bp.id,
    position: [0, 0, 0],
    quaternion: [0, 0, 0, 1],
    scale: [1, 1, 1],
    pinned: true,
    state: { n: 9 },
  })
  const before = structuredClone(app.data)
  const builds = app.builds
  await f.service.link(f.socket, { id: app.data.id, url, expected: publishedExpectation(app, f.world.blueprints) })
  assert.equal(app.builds, builds)
  assert.equal(app.data.published.verified, false)
  await f.service.check(f.socket, { url })
  assert.equal(publishedStatus(app.data.published, f.resolver.status(url)), 'unverified')
  assert.ok((await prepareUpdate(f, app)).confirmation)
  const previous = structuredClone(app.data)
  const install = await f.service.commit(f.socket, { token: (await prepareUpdate(f, app, true)).token })
  assert.deepEqual(app.blueprint.props, bp.props)
  await f.service.commit(f.socket, { token: install.undoToken, undo: true })
  assert.deepEqual(app.data.published, previous.published)
  assert.deepEqual(app.data.state, previous.state)
  await f.service.link(f.socket, {
    id: app.data.id,
    url: null,
    expected: publishedExpectation(app, f.world.blueprints),
  })
  assert.equal(app.data.published, undefined)
  assert.deepEqual(app.data.position, before.position)
})

test('fingerprint excludes configuration and placement but requires confirmation for script/model/flags edits', async t => {
  const f = await fixture(t)
  const { app } = await importObject(f)
  const baseline = app.data.published.baselineImplementationFingerprint
  app.blueprint.props.color = 'red'
  app.data.position[0] = 99
  assert.equal(digest(canonical(implementationDescriptor(app.blueprint))), baseline)
  await f.remote({ color: 'green' })
  app.blueprint.disabled = true
  assert.ok((await prepareUpdate(f, app)).confirmation)
})

test('failed build, conflict, permission loss and stale candidates leave installation and history intact', async t => {
  const f = await fixture(t)
  const { app } = await importObject(f)
  await f.remote({ color: 'green' })
  const before = structuredClone(app.data)
  let prepared = await prepareUpdate(f, app)
  f.fail(true)
  await assert.rejects(f.service.commit(f.socket, { token: prepared.token }), /failed to load/)
  f.fail(false)
  assert.deepEqual(app.data, before)
  assert.equal(f.service.session(f.socket).undo.size, 0)
  prepared = await prepareUpdate(f, app)
  app.blueprint.version++
  await assert.rejects(f.service.commit(f.socket, { token: prepared.token }), /changed/)
  assert.deepEqual(app.data, before)
  prepared = await prepareUpdate(f, app)
  await f.remote({ color: 'purple' })
  await f.service.check(f.socket, { url })
  await assert.rejects(f.service.commit(f.socket, { token: prepared.token }), /candidate changed/)
  prepared = await prepareUpdate(f, app)
  f.socket.player.isBuilder = () => false
  await assert.rejects(f.service.commit(f.socket, { token: prepared.token }), /Builder/)
})

test('Undo conflicts keep the server record; consecutive published updates can be undone in LIFO order', async t => {
  const f = await fixture(t)
  const { app } = await importObject(f)
  const firstHash = app.data.published.installedHash
  await f.remote({ color: 'green' })
  const first = await f.service.commit(f.socket, { token: (await prepareUpdate(f, app)).token })
  await f.remote({ color: 'purple' })
  const second = await f.service.commit(f.socket, { token: (await prepareUpdate(f, app)).token })
  await assert.rejects(f.service.commit(f.socket, { token: first.undoToken, undo: true }), /changed/)
  assert.equal(f.service.session(f.socket).undo.size, 2)
  await f.service.commit(f.socket, { token: second.undoToken, undo: true })
  await f.service.commit(f.socket, { token: first.undoToken, undo: true })
  assert.equal(app.data.published.installedHash, firstHash)
})

test('property merge uses deep semantic equality, drops removed fields, validates types and handles unknown defaults', () => {
  const result = mergePublishedProps(
    { a: { x: 1, y: 2 }, b: 2, c: 'bad', gone: 5 },
    { a: { y: 2, x: 1 }, b: 1, c: 1, gone: 5 },
    { a: { x: 3, y: 4 }, b: 3, c: 7, new: 9 }
  )
  assert.deepEqual(result.props, { a: { x: 3, y: 4 }, b: 2, c: 7, new: 9 })
  assert.deepEqual(result.reset, ['c', 'gone'])
  assert.deepEqual(mergePublishedProps({ x: 4 }, null, { x: 1 }).props, { x: 4 })
})

test('shared resolver deduplicates checks, handles known-body 304, retains offline installed copies, and rejects unsolicited 304', async () => {
  let calls = 0
  let headers
  let fail = false
  const bytes = await packageBytes()
  const resolver = new PublishedSourceResolver({
    fetcher: async (_url, h) => {
      calls++
      headers = h
      if (fail) throw new Error('offline')
      await Promise.resolve()
      return calls === 1 ? { bytes, etag: 'v1' } : { notModified: true }
    },
  })
  await Promise.all([resolver.check(url), resolver.check(url), resolver.check(url)])
  assert.equal(calls, 1)
  resolver.cache.get(url).nextCheck = 0
  await resolver.check(url)
  assert.equal(headers['if-none-match'], 'v1')
  assert.equal(resolver.status(url).error, null)
  fail = true
  resolver.cache.get(url).nextCheck = 0
  await resolver.check(url)
  assert.equal(resolver.status(url).error, 'offline')
  assert.equal(resolver.cache.get(url).hash, digest(bytes))
  const bad = new PublishedSourceResolver({ fetcher: async () => ({ notModified: true }) })
  await bad.check(url)
  assert.match(bad.status(url).error, /304/)
})

test('URL and IP policies reject SSRF destinations including mapped/alternate literals and private DNS', async () => {
  for (const value of [
    'http://example.com/a.hyp',
    'https://user:pass@example.com/a.hyp',
    'https://127.1/a.hyp',
    'https://0x7f000001/a.hyp',
    'https://[::1]/x',
    'https://example.com:444/x',
  ])
    assert.throws(() => sourceURL(value))
  for (const address of [
    '127.0.0.1',
    '10.0.0.2',
    '169.254.169.254',
    '172.16.0.2',
    '192.168.2.1',
    '100.64.0.1',
    '198.18.0.1',
    '224.0.0.1',
    '::1',
    '::ffff:127.0.0.1',
    'fc00::1',
    'fe80::1',
    '2001:db8::1',
    '2002:7f00:1::',
  ])
    assert.equal(publicAddress(address), false, address)
  for (const address of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])
    assert.equal(publicAddress(address), true, address)
  await assert.rejects(
    downloadSource(url, {}, { maxBytes: 1000, resolve: async () => [{ address: '127.0.0.1', family: 4 }] }),
    /non-public/
  )
})

test('package validation rejects scene, HTML, corrupt/truncated/oversized/trailing data, hash tampering and missing assets', async () => {
  const bytes = await packageBytes()
  await validatePublishedPackage(bytes, bytes.length)
  for (const value of [
    Buffer.from('<html>'),
    bytes.subarray(0, bytes.length - 1),
    Buffer.concat([bytes, Buffer.from('x')]),
    await packageBytes({}, { scene: true }),
  ])
    await assert.rejects(validatePublishedPackage(value, 1024 * 1024))
  await assert.rejects(validatePublishedPackage(bytes, 10), /limit/)
  const bad = Buffer.from(bytes)
  bad[bad.length - 1] ^= 1
  await assert.rejects(validatePublishedPackage(bad, bad.length), /hash/)
})

test('actual App.modify changes tracking without build and deep-copies metadata', () => {
  let builds = 0
  const app = Object.create(App.prototype)
  app.data = { blueprint: 'old', state: { x: 1 } }
  app.world = { emit() {} }
  app.build = () => {
    builds++
  }
  const published = { sourceUrl: url, verified: false, baselineProps: { x: 1 } }
  app.modify({ published, publishedRevision: 1 })
  published.baselineProps.x = 9
  assert.equal(builds, 0)
  assert.equal(app.data.published.baselineProps.x, 1)
  app.modify({ published: null, publishedRevision: 2 })
  assert.equal(app.data.published, undefined)
  assert.equal(builds, 0)
})

test('outbound transport pins public DNS, validates every redirect, and bounds slow/oversized/HTML responses', async () => {
  const { EventEmitter } = await import('node:events')
  const { PassThrough } = await import('node:stream')
  const seen = []
  function transport(responses) {
    return (address, options, callback) => {
      const req = new EventEmitter()
      req.setTimeout = () => req
      req.destroy = error => {
        if (error) req.emit('error', error)
        req.emit('close')
      }
      queueMicrotask(() => {
        options.lookup(address.hostname, { all: true }, (error, addresses) => {
          assert.equal(error, null)
          assert.deepEqual(addresses, [{ address: '8.8.8.8', family: 4 }])
          seen.push(address.hostname)
          const next = responses.shift()
          if (next?.hang) return
          const res = new PassThrough()
          res.statusCode = next?.status || 200
          res.headers = next?.headers || {}
          res.on('close', () => req.emit('close'))
          callback(res)
          if (!res.destroyed) res.end(next?.bytes || Buffer.from('body'))
        })
      })
      return req
    }
  }
  const resolve = async () => [{ address: '8.8.8.8', family: 4 }]
  const options = { maxBytes: 32, timeout: 100, resolve }
  const result = await downloadSource(
    url,
    {},
    {
      ...options,
      requestSource: transport([
        { status: 302, headers: { location: 'https://cdn.example/file?download=1' } },
        { bytes: Buffer.from('hyp') },
      ]),
    }
  )
  assert.equal(result.bytes.toString(), 'hyp')
  assert.deepEqual(seen, ['objects.example', 'cdn.example'])
  await assert.rejects(
    downloadSource(
      url,
      {},
      { ...options, requestSource: transport([{ status: 302, headers: { location: 'https://127.0.0.1/secret' } }]) }
    ),
    /public HTTPS/
  )
  await assert.rejects(
    downloadSource(url, {}, { ...options, requestSource: transport([{ headers: { 'content-type': 'text/html' } }]) }),
    /download/
  )
  await assert.rejects(
    downloadSource(url, {}, { ...options, requestSource: transport([{ headers: { 'content-encoding': 'gzip' } }]) }),
    /uncompressed/
  )
  await assert.rejects(
    downloadSource(url, {}, { ...options, requestSource: transport([{ bytes: Buffer.alloc(33) }]) }),
    /limit/
  )
  await assert.rejects(
    downloadSource(url, {}, { ...options, timeout: 10, requestSource: transport([{ hang: true }]) }),
    /timed out/
  )
  await assert.rejects(
    downloadSource(url, {}, { ...options, timeout: 10, resolve: () => new Promise(() => {}) }),
    /DNS lookup timed out/
  )
})

test('generic entity packets cannot forge provenance or bypass builder permission', async t => {
  const f = await fixture(t)
  const { app } = await importObject(f)
  const network = new ServerNetwork(f.world)
  clearInterval(network.socketIntervalId)
  network.send = () => {}
  network.publishedObjects = f.service
  const before = structuredClone(app.data)
  await network.onEntityModified(f.socket, {
    id: app.data.id,
    published: { ...app.data.published, installedHash: 'forged' },
    publishedRevision: 999,
  })
  assert.deepEqual(app.data, before)
  f.socket.player.isBuilder = () => false
  await network.onEntityModified(f.socket, { id: app.data.id, blueprint: 'forged' })
  assert.deepEqual(app.data, before)
})

test('database rejection rolls back the installation and creates no history or observer events', async t => {
  const f = await fixture(t)
  const { app } = await importObject(f)
  await f.remote({ color: 'green' })
  const prepared = await prepareUpdate(f, app)
  const previous = structuredClone(app.data)
  const messages = f.sent.length
  f.service.persist = async () => {
    throw new Error('database unavailable')
  }
  await assert.rejects(f.service.commit(f.socket, { token: prepared.token }), /database/)
  assert.deepEqual(app.data, previous)
  assert.equal(f.sent.length, messages)
  assert.equal(f.service.session(f.socket).undo.size, 0)
})

test('asset-valued overrides must remain compatible and locally available', async t => {
  const f = await fixture(t)
  const bytesFor = async label => {
    const image = Buffer.from(label)
    const asset = `asset://${digest(image).slice(7)}.png`
    return {
      asset,
      bytes: Buffer.from(
        await (
          await exportApp(
            { id: 'remote', version: 0, model: 'script-only', props: { icon: { type: 'image', url: asset } } },
            async () => new File([image], asset.slice(8))
          )
        ).arrayBuffer()
      ),
    }
  }
  const v1 = await bytesFor('image-v1')
  const v2 = await bytesFor('image-v2')
  let bytes = v1.bytes
  f.resolver.fetcher = async () => ({ bytes })
  const { app } = await importObject(f)
  const local = Buffer.from('custom-image')
  const localURL = `asset://${digest(local).slice(7)}.png`
  f.assets.set(localURL.slice(8), local)
  app.blueprint.props.icon = { type: 'image', url: localURL }
  bytes = v2.bytes
  f.resolver.cache.get(url).nextCheck = 0
  let prepared = await prepareUpdate(f, app)
  assert.deepEqual(prepared.blueprint.props.icon, { type: 'image', url: localURL })
  f.assets.delete(localURL.slice(8))
  await assert.rejects(prepareUpdate(f, app), /asset is missing/)
  assert.equal(f.service.session(f.socket).undo.size, 0)
})

test('automatic startup and periodic checks share URL results and never install', async t => {
  let scheduled
  const timer = { unref() {} }
  t.mock.method(globalThis, 'setInterval', callback => {
    scheduled = callback
    return timer
  })
  t.mock.method(globalThis, 'clearInterval', () => {})
  let bytes = await packageBytes()
  let calls = 0
  const resolver = new PublishedSourceResolver({
    fetcher: async () => {
      calls++
      return { bytes }
    },
  })
  resolver.start(() => [url, url])
  await resolver.check(url)
  assert.equal(calls, 1)
  const first = resolver.status(url).hash
  bytes = await packageBytes({ color: 'green' })
  resolver.cache.get(url).nextCheck = 0
  await scheduled()
  assert.equal(calls, 2)
  assert.notEqual(resolver.status(url).hash, first)
  resolver.destroy()
})

test('observer notification failure never rolls back a durable installation or discards Undo', async t => {
  const f = await fixture(t)
  const { app } = await importObject(f)
  await f.remote({ color: 'green' })
  const prepared = await prepareUpdate(f, app)
  f.world.network.send = () => {
    throw new Error('observer lost')
  }
  const result = await f.service.commit(f.socket, { token: prepared.token })
  assert.match(result.warning, /observer/)
  assert.ok(result.undoToken)
  assert.equal(app.data.blueprint, prepared.blueprint.id)
  assert.equal(JSON.parse((await f.db('entities').where('id', app.data.id).first()).data).blueprint, app.data.blueprint)
})

test('concurrent acknowledgement retries create one instance and one committed revision', async t => {
  const f = await fixture(t)
  const prepared = await f.service.prepare(f.socket, { url, position: [0, 0, 0], quaternion: [0, 0, 0, 1] })
  const [a, b] = await Promise.all([
    f.service.commit(f.socket, { token: prepared.token }),
    f.service.commit(f.socket, { token: prepared.token }),
  ])
  assert.deepEqual(a, b)
  assert.equal(f.entities.size, 1)
  assert.equal(f.sent.filter(item => item[0] === 'entityAdded').length, 1)
})

test('evicting a package body keeps its check schedule, while installation can reacquire bytes', async () => {
  const bytes = await packageBytes()
  let calls = 0
  const resolver = new PublishedSourceResolver({
    maxEntries: 1,
    fetcher: async () => {
      calls++
      return { bytes }
    },
  })
  await resolver.check(url)
  await resolver.check('https://objects.example/other.hyp')
  await resolver.check(url)
  assert.equal(calls, 2)
  assert.equal(resolver.status(url).hash, digest(bytes))
  await resolver.check(url, false, true)
  assert.equal(calls, 3)
  assert.ok(resolver.cache.get(url).bytes)
})

test('tracked duplication copies trusted metadata for shared and unique blueprints without sharing mutable data', async t => {
  const f = await fixture(t)
  const { app } = await importObject(f)
  const network = new ServerNetwork(f.world)
  clearInterval(network.socketIntervalId)
  network.send = () => {}
  f.socket.send = () => {}
  for (const unique of [false, true]) {
    const blueprint = unique ? { ...structuredClone(app.blueprint), id: 'unique-copy', version: 0 } : app.blueprint
    if (unique) f.world.blueprints.add(blueprint)
    const data = { ...structuredClone(app.data), id: `copy-${unique}`, blueprint: blueprint.id }
    network.onEntityAdded(f.socket, data)
    const copy = f.entities.get(data.id)
    assert.deepEqual(copy.data.published, app.data.published)
    copy.data.published.baselineProps.color = 'custom-copy'
    assert.equal(app.data.published.baselineProps.color, 'blue')
  }
})
