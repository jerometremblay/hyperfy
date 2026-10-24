import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { root, physics, harness, player } from './helpers.mjs'
const manifest = JSON.parse(await fs.readFile(`${root}upstream-table/manifest.json`))
const bytes = await fs.readFile(`${root}upstream-table/table.hyp`)
const length = bytes.readUInt32LE(0)
const header = JSON.parse(bytes.subarray(4, 4 + length))
test('upstream table preserves its pinned source and self-contained model assets', async () => {
  for (const [file, hash] of Object.entries(manifest.sourceHashes))
    assert.equal(createHash('sha256').update(await fs.readFile(`${root}upstream-table/${file}`)).digest('hex'), hash)
  let offset = 4 + length
  for (const asset of header.assets) {
    const raw = bytes.subarray(offset, offset + asset.size)
    assert.ok(asset.url.includes(createHash('sha256').update(raw).digest('hex')))
    offset += asset.size
  }
  assert.equal(offset, bytes.length)
  assert.equal(manifest.length, physics.dimensions('8').length)
  assert.equal(manifest.width, physics.dimensions('8').width)
})
test('converted GLB loads with all original materials, level cloth and grounded supports', async () => {
  const raw = await fs.readFile(`${root}upstream-table/model.glb`)
  const gltf = await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength), '')
  const meshes = []
  gltf.scene.traverse(n => { if (n.isMesh) meshes.push(n) })
  assert.equal(meshes.length, 11)
  assert.equal(meshes.filter(n => n.name.startsWith('upstream-')).length, 7)
  assert.equal(meshes.filter(n => n.name.startsWith('support-leg')).length, 4)
  const bounds = new THREE.Box3().setFromObject(gltf.scene)
  assert.ok(Math.abs(bounds.min.y) < 1e-6)
  assert.ok(bounds.max.x < 1.4 && bounds.min.x > -1.4)
  assert.ok(bounds.max.z < 0.8 && bounds.min.z > -0.8)
  const cloth = meshes.find(n => n.material.name === 'cloth')
  cloth.geometry.computeBoundingBox()
  assert.ok(Math.abs(cloth.geometry.boundingBox.max.y - manifest.clothHeight) < 1e-6)
  assert.ok(bounds.max.y < 0.76)
  assert.equal(gltf.scene.children.some(n => n.isLight), false)
  // Pocket widths are preserved by translations of the end sections, not scale.
  assert.ok(Math.abs(22 * manifest.metresPerSourceUnit + manifest.endTranslations[0] - manifest.length / 2) < 1e-12)
  assert.ok(Math.abs(11 * manifest.metresPerSourceUnit + manifest.endTranslations[1] - manifest.width / 2) < 1e-12)
})
test('table furniture has no Play action or idle collider sync callback', async () => {
  const source = await fs.readFile(`${root}upstream-table/table.js`, 'utf8')
  const h = harness({ source, players: [player('alice')] })
  const actions = h.created.filter(n => n.name === 'action')
  assert.equal(actions.length, 0)
  assert.equal(h.app.onPointerDown, undefined)
  assert.equal(h.created.filter(n => n.name === 'prim').length, 0)
  const body = h.created.find(n => n.name === 'rigidbody' && n.type === 'static')
  const collider = h.created.find(n => n.name === 'collider' && n.type === 'box')
  assert.ok(body)
  assert.ok(collider)
  assert.equal(collider.parent, body)
  assert.ok(h.appChildren.includes(body.getProxy()), 'the static collider follows the app root transform')
  assert.equal(h.handlers.update?.length || 0, 0)
})
