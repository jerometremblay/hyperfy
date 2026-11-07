// Compare the original trusted Hyperfy script with the converted recipe.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import * as THREE from 'three'
import { mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'
import { createAsset, disposeAsset, metadata } from './sofa.recipe.mjs'

const original = await readFile('outputs/cognac-leather-furniture/source/cognac_leather_beveled_sofa_3_seat.js', 'utf8')
const old = new THREE.Group()
const app = {
  configure() {}, on() {}, add: node => old.add(node),
  create(type, options = {}) {
    if (type !== 'prim' || options.opacity === 0) {
      const node = new THREE.Group()
      node.position.fromArray(options.position || [0, 0, 0])
      node.rotation.fromArray(options.rotation || [0, 0, 0])
      return node
    }
    let geometry
    if (options.type === 'box') geometry = new THREE.BoxGeometry(...options.size)
    else if (options.type === 'cylinder') geometry = new THREE.CylinderGeometry(...options.size, 20)
    else if (options.type === 'extrude') {
      const shape = new THREE.Shape()
      shape.moveTo(...options.profile[0])
      for (const point of options.profile.slice(1)) shape.lineTo(...point)
      shape.closePath()
      geometry = new THREE.ExtrudeGeometry(shape, {
        depth: options.depth, bevelEnabled: options.bevelEnabled, bevelThickness: options.bevelThickness,
        bevelSize: options.bevelSize, bevelSegments: options.bevelSegments, curveSegments: options.curveSegments,
      })
      if (options.smooth) geometry = toCreasedNormals(mergeVertices(geometry), options.creaseAngle ?? Math.PI / 3)
      geometry.center()
    } else throw new Error(`Unsupported primitive ${options.type}`)
    const node = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color: options.color, roughness: options.roughness ?? 0.5, metalness: options.metalness ?? 0.02,
    }))
    node.position.fromArray(options.position || [0, 0, 0])
    node.rotation.fromArray(options.rotation || [0, 0, 0])
    return node
  },
}
vm.runInNewContext(original, { app, world: {}, props: {}, Math }, { timeout: 3000 })
old.updateMatrixWorld(true)
const converted = createAsset()
const meshes = root => { const result = []; root.traverse(node => { if (node.isMesh) result.push(node) }); return result }
const before = meshes(old), after = meshes(converted)
assert.equal(after.length, before.length)
for (let i = 0; i < before.length; i++) {
  const a = before[i], b = after[i]
  assert.deepEqual(b.matrixWorld.toArray(), a.matrixWorld.toArray(), `transform ${i}`)
  const expectedColor = a.material.color.getHex() === 0xa55f35 ? 0x8a4f2b : a.material.color.getHex()
  assert.equal(b.material.color.getHex(), expectedColor, `color ${i}`)
  assert.equal(b.material.roughness, a.material.roughness, `roughness ${i}`)
  assert.equal(b.material.metalness, a.material.metalness, `metalness ${i}`)
  assert.deepEqual(b.geometry.getIndex()?.array, a.geometry.getIndex()?.array, `index data ${i}`)
  for (const name of ['position', 'normal', 'uv']) {
    const aa = a.geometry.getAttribute(name), bb = b.geometry.getAttribute(name)
    assert.equal(bb?.count, aa?.count, `${name} count ${i}`)
    if (aa && bb) assert.deepEqual(bb.array, aa.array, `${name} data ${i}`)
  }
}
const alternate = createAsset({ seatCount: 2, seatWidth: 0.9, 'color.leather': '#123456' })
assert.equal(alternate.userData.design.applied.seatCount, 2)
assert.equal(alternate.userData.design.applied.seatWidth, 0.9)
assert.equal(alternate.userData.design.applied['color.leather'], '#123456')
assert.notEqual(meshes(alternate).length, after.length)
assert.throws(() => createAsset({ seatCount: 6 }), /Invalid sofa parameter/)
disposeAsset(alternate)
for (const count of [1, 3, 5]) {
  const asset = createAsset({ seatCount: count, 'color.leather': '#123456' })
  for (const kind of ['seat', 'back']) {
    for (let i = 1; i <= count; i++) {
      const cushion = asset.getObjectByName(`${kind}-cushion-${i}`)
      assert.ok(cushion, `${kind} cushion ${i} exists`)
      assert.equal(cushion.children[0].material.color.getHex(), 0x123456, `${kind} cushion ${i} uses leather`)
    }
  }
  disposeAsset(asset)
}
for (const key of ['seatDepth', 'backDepth', 'armDepth', 'seatRadius', 'backRadius', 'armRadius', 'bevelSize', 'bevelThickness']) {
  const control = metadata.controls.find(control => control.key === key)
  for (const value of [control.min, control.max]) {
    const asset = createAsset({ [key]: value })
    const changed = meshes(asset)
    assert.equal(changed.length, after.length)
    assert.ok(changed.some((mesh, i) => {
      const actual = mesh.geometry.getAttribute('position').array
      const original = after[i].geometry.getAttribute('position').array
      return actual.length !== original.length || actual.some((v, j) => v !== original[j])
    }), `${key}=${value} changes geometry`)
    disposeAsset(asset)
  }
}
assert.throws(() => createAsset({ bevelThickness: 26 }), /Invalid sofa parameter/)
const bounds = new THREE.Box3().setFromObject(converted)
console.log(JSON.stringify({ meshes: after.length, dimensions: bounds.getSize(new THREE.Vector3()).toArray(), matchingOriginalGeometry: true, leatherChecks: true, extrusionControls: 8 }))
disposeAsset(old)
disposeAsset(converted)
