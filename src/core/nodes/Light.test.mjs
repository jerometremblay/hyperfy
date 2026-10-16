import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { Scene } from 'three'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./Light.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { Light } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function context(isServer = false) {
  return { world: { network: { isServer }, stage: { scene: new Scene(), dirtyNodes: new Set() } } }
}

for (const type of ['point', 'spot', 'directional']) {
  test(`${type} light can enable shadows, move, and unmount without leaving scene objects`, () => {
    const ctx = context()
    const node = new Light({ type, position: [2, 3, 4] })
    node.activate(ctx)
    const original = node.light
    const originalTarget = original.target
    assert.deepEqual(original.position.toArray(), [2, 3, 4])
    assert.equal(node.children.length, 0)
    if (originalTarget) {
      assert.equal(originalTarget.parent, ctx.world.stage.scene)
      assert.deepEqual(originalTarget.position.toArray(), [2, 2, 4])
    }

    node.castShadow = true
    node.commit(false)
    assert.equal(node.light.castShadow, true)
    assert.equal(original.parent, null)
    if (originalTarget) assert.equal(originalTarget.parent, null)

    node.matrixWorld.makeTranslation(5, 6, 7)
    node.commit(true)
    assert.deepEqual(node.light.position.toArray(), [5, 6, 7])
    if (node.light.target) assert.deepEqual(node.light.target.position.toArray(), [5, 5, 7])
    node.deactivate()
    assert.equal(ctx.world.stage.scene.children.length, 0)
  })
}

test('server light nodes do not create rendering objects', () => {
  const ctx = context(true)
  const node = new Light({ type: 'spot', castShadow: true })
  node.activate(ctx)
  assert.equal(node.light, undefined)
  assert.equal(ctx.world.stage.scene.children.length, 0)
  assert.equal(node.refreshShadow(), false)
  node.deactivate()
})

for (const [type, configuredNear, expectedNear] of [['point', undefined, 0.25], ['spot', 0.05, 0.05]]) {
  test(`${type}-light shadow camera uses its configured near plane`, () => {
    const ctx = context()
    const node = new Light({ type, castShadow: true, shadowNear: configuredNear })
    node.activate(ctx)

    const camera = node.light.shadow.camera
    assert.equal(camera.near, expectedNear)
    const expectedProjectionZ = (2 * camera.far * expectedNear) / (expectedNear - camera.far)
    assert.ok(Math.abs(camera.projectionMatrix.elements[14] - expectedProjectionZ) < 1e-12)
    node.deactivate()
  })
}

test('shadow caching is opt-in and static lights refresh after moving', () => {
  const ctx = context()
  const node = new Light({ castShadow: true })
  node.activate(ctx)

  assert.equal(node.shadowMode, 'dynamic')
  assert.equal(node.light.shadow.autoUpdate, true)

  node.shadowMode = 'static'
  assert.equal(node.light.shadow.autoUpdate, false)
  assert.equal(node.light.shadow.needsUpdate, true)

  node.light.shadow.needsUpdate = false
  node.intensity = 2
  node.color = '#ff8800'
  assert.equal(node.light.shadow.needsUpdate, false)

  node.matrixWorld.makeTranslation(1, 2, 3)
  node.commit(true)
  assert.equal(node.light.shadow.needsUpdate, true)
  assert.equal(node.light.position.x, 1)
  node.deactivate()
})

test('static shadows can be explicitly refreshed through the script proxy', () => {
  const ctx = context()
  const node = new Light({ castShadow: true, shadowMode: 'static' })
  node.activate(ctx)
  node.light.shadow.needsUpdate = false

  const proxy = node.getProxy()
  assert.equal(proxy.shadowMode, 'static')
  assert.equal(proxy.refreshShadow(), true)
  assert.equal(node.light.shadow.needsUpdate, true)

  node.light.shadow.needsUpdate = false
  proxy.shadowNear = 0.05
  assert.equal(node.light.shadow.camera.near, 0.05)
  assert.equal(node.light.shadow.needsUpdate, true)

  proxy.shadowMode = 'dynamic'
  assert.equal(node.light.shadow.autoUpdate, true)
  node.deactivate()
})

test('static shadow mode survives light rebuilds and node copies', () => {
  const node = new Light({ castShadow: true, shadowMode: 'static', shadowNear: 0.05 })
  const clone = new Light().copy(node)
  assert.equal(clone.shadowMode, 'static')
  assert.equal(clone.shadowNear, 0.05)

  const ctx = context()
  node.activate(ctx)
  node.light.shadow.needsUpdate = false
  node.type = 'spot'
  node.commit(false)
  assert.equal(node.light.shadow.autoUpdate, false)
  assert.equal(node.light.shadow.camera.near, 0.05)
  assert.equal(node.light.shadow.needsUpdate, true)
  node.deactivate()
})

test('invalid shadow modes are rejected', () => {
  assert.throws(() => new Light({ shadowMode: 'manual' }), /shadowMode invalid/)
})
