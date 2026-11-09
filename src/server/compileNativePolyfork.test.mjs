import 'ses'
import '../core/lockdown.js'
import assert from 'node:assert/strict'
import test from 'node:test'
import { compileNativePolyfork } from './compileNativePolyfork.js'
import { loadNativePolyfork } from '../core/extras/nativePolyfork.js'

test('native Polyfork retains its Three.js groups and pivot', async () => {
  const source = `import * as THREE from 'three';
    export function createAsset() {
      const root = new THREE.Group();
      const door = new THREE.Group();
      door.name = 'door'; door.position.x = 0.75;
      door.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), new THREE.MeshBasicMaterial()));
      root.add(door); return root;
    }`
  const model = loadNativePolyfork(await compileNativePolyfork(source))
  const root = model.createAsset()
  const door = root.getObjectByName('door')
  assert.equal(door.position.x, 0.75)
  assert.equal(door.parent, root)
  door.rotation.y = -1
  assert.equal(root.children[0].rotation.y, -1)
})

test('native Polyfork compilation rejects other imports', async () => {
  await assert.rejects(compileNativePolyfork("import 'node:fs'; export const createAsset = () => null"), /Unsupported Polyfork dependency/)
})

test('native Polyfork compartment does not provide browser or Node globals', async () => {
  const compiled = await compileNativePolyfork(`export function createAsset() {
    return [typeof window, typeof document, typeof fetch, typeof process];
  }`)
  assert.deepEqual(Array.from(loadNativePolyfork(compiled).createAsset()), ['undefined', 'undefined', 'undefined', 'undefined'])
})

test('native procedural math remains fast inside the compartment', { timeout: 5000 }, async () => {
  const compiled = await compileNativePolyfork(`export function createAsset() {
    let value = 0;
    for (let i = 0; i < 2000000; i++) value = Math.imul(value ^ i, 16777619);
    return value;
  }`)
  assert.equal(typeof loadNativePolyfork(compiled).createAsset(), 'number')
})
