import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'
import EventEmitter from 'eventemitter3'

const bundle = await build({
  stdin: {
    contents: `export { loadStarCatalog, createStarField } from './src/core/extras/createStarField.js';
      export { ClientEnvironment } from './src/core/systems/ClientEnvironment.js';
      export { Settings } from './src/core/systems/Settings.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const moduleURL = `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
const catalog = {
  version: 1,
  stars: [
    [6.752481, -16.716116, -1.44, 0.009],
    [2.530301, 89.264109, 1.97, null],
  ],
}

test('worlds share catalog loads but own their GPU resources', async t => {
  const { loadStarCatalog, createStarField } = await import(moduleURL + '#cache')
  const fetch = t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => catalog }))
  const [first, second] = await Promise.all([loadStarCatalog(), loadStarCatalog()])
  assert.equal(fetch.mock.callCount(), 1)
  assert.equal(first, second)
  const a = createStarField(first),
    b = createStarField(second)
  assert.notEqual(a.geometry, b.geometry)
  assert.notEqual(a.material, b.material)
  assert.ok(a.geometry.getAttribute('color').array.every(Number.isFinite))
  const lines = a.getObjectByName('constellations')
  assert.equal(lines.visible, false)
  assert.equal(lines.material.uniforms.celestialRotation, a.material.uniforms.celestialRotation)
  const directions = lines.geometry.getAttribute('position')
  assert.ok(directions.count > 1000)
  for (let i = 0; i < directions.count; i++) {
    assert.ok(Math.abs(Math.hypot(directions.getX(i), directions.getY(i), directions.getZ(i)) - 1) < 1e-6)
  }
  for (const field of [a, b]) {
    const connections = field.getObjectByName('constellations')
    connections.geometry.dispose()
    connections.material.dispose()
    field.geometry.dispose()
    field.material.dispose()
  }
})

test('failed and invalid loads can be retried without poisoning the shared cache', async t => {
  const { loadStarCatalog } = await import(moduleURL + '#retry')
  let response = { ok: false, status: 503 }
  t.mock.method(globalThis, 'fetch', async () => response)
  await assert.rejects(loadStarCatalog(), /HTTP 503/)
  response = { ok: true, json: async () => ({ version: 1, stars: [[25, 0, 1, 0]] }) }
  await assert.rejects(loadStarCatalog(), /Invalid star catalog entry/)
  response = { ok: true, json: async () => catalog }
  assert.deepEqual(await loadStarCatalog(), catalog.stars)
})

test('disposing a world while the catalog loads never attaches late GPU resources', async t => {
  const { ClientEnvironment, Settings } = await import(moduleURL + '#dispose')
  let release
  t.mock.method(
    globalThis,
    'fetch',
    () =>
      new Promise(resolve => {
        release = resolve
      })
  )
  const world = {
    stage: { scene: new THREE.Scene() },
    camera: new THREE.PerspectiveCamera(70, 1, 0.2, 1200),
    rig: new THREE.Object3D(),
    prefs: Object.assign(new EventEmitter(), { shadows: 'none' }),
    graphics: new EventEmitter(),
    network: { getServerTime: () => Date.now() },
    loader: { load: async () => new THREE.Texture() },
  }
  world.settings = new Settings(world)
  const environment = new ClientEnvironment(world)
  environment.init({
    baseEnvironment: {
      sunDirection: new THREE.Vector3(0, -1, 0),
      sunIntensity: 1,
      sunColor: '#ffffff',
      rotationY: 0,
    },
  })
  environment.buildCSM()
  await environment.updateSky()
  const loading = environment.starsLoading
  environment.destroy()
  const childrenAfterDisposal = [...world.stage.scene.children]
  release({ ok: true, json: async () => catalog })
  await loading
  assert.equal(environment.stars, null)
  assert.deepEqual(world.stage.scene.children, childrenAfterDisposal)
})
