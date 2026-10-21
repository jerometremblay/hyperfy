import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import 'ses'
import * as THREE from 'three'
import { code, root, harness, player, nodes } from './helpers.mjs'

test('all content-addressed assets match exact package bytes, source and preview', async () => {
  const bytes = await readFile(`${root}dist/hyperfy-billard.hyp`)
  const headerLength = bytes.readUInt32LE(0)
  const header = JSON.parse(bytes.subarray(4, 4 + headerLength))
  let offset = 4 + headerLength
  const urls = new Set()
  for (const asset of header.assets) {
    const raw = bytes.subarray(offset, offset + asset.size)
    assert.equal(raw.length, asset.size)
    assert.ok(asset.url.startsWith(`asset://${createHash('sha256').update(raw).digest('hex')}.`))
    urls.add(asset.url)
    if (asset.type === 'script') {
      assert.equal(raw.toString(), code)
      assert.equal(asset.mime, 'text/plain')
    }
    offset += asset.size
  }
  assert.equal(offset, bytes.length)
  assert.ok(urls.has(header.blueprint.model))
  assert.ok(urls.has(header.blueprint.script))
  const preview = await readFile(`${root}dist/preview.html`, 'utf8')
  assert.ok(preview.includes(bytes.toString('base64')))
})
test('bundle runs in a real SES compartment with only Hyperfy math endowments', () => {
  const listeners = {}
  const app = {
    state: {},
    position: new THREE.Vector3(),
    scale: new THREE.Vector3(1, 1, 1),
    configure() {},
    on(name, fn) {
      listeners[name] = fn
    },
    send() {},
    emit() {},
  }
  const world = { isServer: true, getPlayers: () => [], getPlayer: () => null, on() {} }
  new Compartment({
    app,
    world,
    props: {},
    console,
    Vector3: THREE.Vector3,
    Quaternion: THREE.Quaternion,
    Euler: THREE.Euler,
    Math,
  }).evaluate(`(function() { const config = props\n${code}\n})()`)
  assert.equal(app.state.pool.balls.length, 16)
  listeners.update(1 / 60)
})
test('different app instances keep physics dimensions and ownership isolated', () => {
  const players = [player('alice')]
  const a = harness({ server: true, players })
  const b = harness({ server: true, players, props: { tableSize: '8' } })
  assert.notEqual(a.app.state.pool.balls[0].p[0], b.app.state.pool.balls[0].p[0])
  a.emit('pool:claim', {}, 'alice')
  assert.equal(b.app.state.pool.owner, null)
})

test('native import/export retains every texture for later re-export and cleanup', async () => {
  const bytes = await readFile(`${root}dist/hyperfy-billard.hyp`)
  const imported = await nodes.importApp(new File([bytes], 'billard.hyp'))
  const files = new Map(imported.assets.map(a => [a.url, a.file]))
  const exported = await nodes.exportApp(imported.blueprint, url => files.get(url))
  const again = await nodes.importApp(exported)
  assert.equal(again.assets.length, 17)
  for (const asset of again.assets) {
    const original = files.get(asset.url)
    assert.ok(original, asset.url)
    assert.deepEqual(Buffer.from(await asset.file.arrayBuffer()), Buffer.from(await original.arrayBuffer()))
  }
})
