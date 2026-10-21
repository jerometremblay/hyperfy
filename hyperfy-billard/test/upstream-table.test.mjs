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
test('whole table exposes Play only with a held cue, including late player startup', async () => {
  const source = await fs.readFile(`${root}upstream-table/table.js`, 'utf8')
  const players = []
  const h = harness({ source, players, cueHolders: ['alice'] })
  const actions = h.created.filter(n => n.name === 'action')
  assert.equal(actions.length, 3)
  let plays = 0
  h.world.on('billard:play:classic-8-ft-pool-table', () => plays++)
  h.app.onPointerDown()
  assert.equal(plays, 0)
  assert.ok(actions.every(a => a.distance === 0 && a.label === 'Play'))
  players.push(player('alice'))
  h.emit('update', 1 / 60)
  assert.ok(actions.every(a => a.distance === 3))
  // All points on cloth/rails fall within the native one metre action radius.
  for (let x = -1.35; x <= 1.35; x += 0.05)
    for (let z = -0.76; z <= 0.76; z += 0.05)
      assert.ok(actions.some(a => a.position.distanceTo(new THREE.Vector3(x, 0.72, z)) < 1))
  h.app.onPointerDown()
  assert.equal(plays, 1)
  h.world.emit('billard:cues:classic-8-ft-pool-table', [])
  assert.ok(actions.every(a => a.distance === 0))
  actions[0].onTrigger()
  h.app.onPointerDown()
  assert.equal(plays, 1)
  assert.equal(h.created.filter(n => n.name === 'prim' && n.physics === 'static').length, 1)
})
