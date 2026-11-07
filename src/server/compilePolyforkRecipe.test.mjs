import assert from 'node:assert/strict'
import test from 'node:test'
import { compilePolyforkRecipe } from './compilePolyforkRecipe.js'
import { runSandboxedRecipe } from '../core/extras/polyspoonSandbox.js'
import { recipeFromSandbox } from '../core/extras/polyspoonRecipe.js'

const source = `
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
export const params = { width: {type:'range', label:'Width', min:1, max:3, step:1, default:2}, shade: {type:'choice', options:['red','blue'], default:'red'} };
export function createAsset(p) {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(mergeVertices(new THREE.BoxGeometry(p.width,1,1)), new THREE.MeshPhysicalMaterial({color:p.shade === 'red' ? 0xff0000 : 0x0000ff})));
  return group;
}`

test('Polyfork models are adapted with controls and sandboxed geometry', async () => {
  const compiled = await compilePolyforkRecipe(source)
  const output = JSON.parse(runSandboxedRecipe(compiled, JSON.stringify({ width: 3, shade: 'blue' })))
  assert.equal(output.meshes.length, 1)
  assert.equal(output.meshes[0].material.type, 'MeshPhysicalMaterial')
  assert.equal(output.meshes[0].material.color, 0x0000ff)
  assert.equal(output.applied.width, 3)
  assert.deepEqual(
    output.controls.map(c => c.key),
    ['width', 'shade']
  )
})

test('Polyfork modules cannot import server dependencies', async () => {
  await assert.rejects(compilePolyforkRecipe("import fs from 'node:fs'; export const createAsset = () => fs"))
})

test('Polyfork geometry can call Three.js warning paths without leaving the sandbox', async () => {
  const model = `
    import * as THREE from 'three';
    export const params = {};
    export function createAsset() {
      const geometry = new THREE.BoxGeometry().toNonIndexed();
      const object = new THREE.Group();
      object.add(new THREE.Mesh(geometry.toNonIndexed(), new THREE.MeshStandardMaterial()));
      return object;
    }
  `
  const compiled = await compilePolyforkRecipe(model)
  const output = JSON.parse(runSandboxedRecipe(compiled, '{}'))
  assert.equal(output.meshes.length, 1)
  assert.equal(output.meshes[0].indices, null)
})

test('HD textures and grouped physical materials survive sandbox reconstruction', async () => {
  const model = `
    import * as THREE from 'three';
    export const params = {};
    export function createAsset() {
      const texture = new THREE.DataTexture(new Uint8Array([255, 0, 0, 255]), 1, 1, THREE.RGBAFormat);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.repeat.set(2, 3);
      const geometry = new THREE.BoxGeometry();
      geometry.clearGroups(); geometry.addGroup(0, 18, 0); geometry.addGroup(18, 18, 1);
      const materials = [new THREE.MeshPhysicalMaterial({map:texture, roughness:0.7, clearcoat:0.5}), new THREE.MeshStandardMaterial({normalMap:texture})];
      const group = new THREE.Group(); group.add(new THREE.Mesh(geometry, materials)); return group;
    }
  `
  const compiled = await compilePolyforkRecipe(model)
  const output = runSandboxedRecipe(compiled, '{}')
  const recipe = recipeFromSandbox(output)
  const object = recipe.createAsset()
  assert.equal(object.children.length, 2)
  assert.equal(object.children[0].material.type, 'MeshPhysicalMaterial')
  assert.equal(object.children[0].material.clearcoat, 0.5)
  assert.deepEqual([...object.children[0].material.map.image.data], [255, 0, 0, 255])
  assert.deepEqual(object.children[0].material.map.repeat.toArray(), [2, 3])
  assert.equal(object.children[0].material.map, object.children[1].material.normalMap)
  assert.equal(object.children[0].geometry.index.count, 18)
  assert.equal(object.children[1].geometry.index.count, 18)
  recipe.disposeAsset(object)
})

test('HD textures retain their original dimensions and pixels', async () => {
  const model = `
    import * as THREE from 'three';
    export const params = {};
    export function createAsset() {
      const pixels = new Uint8Array(512 * 2 * 4);
      for (let i = 0; i < pixels.length; i++) pixels[i] = i % 251;
      const texture = new THREE.DataTexture(pixels, 512, 2, THREE.RGBAFormat);
      const group = new THREE.Group();
      group.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({map:texture})));
      return group;
    }
  `
  const recipe = recipeFromSandbox(runSandboxedRecipe(await compilePolyforkRecipe(model), '{}'))
  const object = recipe.createAsset()
  const image = object.children[0].material.map.image
  assert.equal(image.width, 512)
  assert.equal(image.height, 2)
  assert.deepEqual(image.data, Uint8Array.from({ length: 512 * 2 * 4 }, (_, i) => i % 251))
  recipe.disposeAsset(object)
})
