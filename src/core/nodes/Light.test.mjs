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
  test(`${type} light at zero intensity skips rendering and shadows, then restores without rebuilding`, () => {
    const ctx = context()
    const node = new Light({ type, intensity: 0, castShadow: true })
    node.activate(ctx)
    const light = node.light
    const renderedLights = () => {
      const lights = []
      ctx.world.stage.scene.traverseVisible(object => {
        if (object.isLight) lights.push(object)
      })
      return lights
    }
    assert.equal(light.visible, false)
    assert.deepEqual(renderedLights(), [])

    const proxy = node.getProxy()
    proxy.intensity = 4
    assert.equal(node.light, light)
    assert.equal(light.visible, true)
    assert.equal(light.intensity, 4)
    assert.equal(light.castShadow, true)
    assert.deepEqual(renderedLights(), [light])

    proxy.intensity = 0
    assert.equal(light.visible, false)
    assert.deepEqual(renderedLights(), [])
    node.matrixWorld.makeTranslation(5, 6, 7)
    node.commit(true)
    proxy.intensity = 0.01
    assert.equal(node.light, light)
    assert.equal(light.visible, true)
    assert.deepEqual(light.position.toArray(), [5, 6, 7])
    assert.equal(light.castShadow, true)
    node.deactivate()
    assert.equal(ctx.world.stage.scene.children.length, 0)
  })

  test(`${type} light remains off after rebuilding and preserves explicit node activation`, () => {
    const ctx = context()
    const node = new Light({ type, intensity: 0, castShadow: true })
    node.activate(ctx)
    node.distance = 12
    node.commit(false)
    assert.equal(node.light.visible, false)

    node.active = false
    node.intensity = 3
    assert.equal(node.active, false)
    assert.equal(node.mounted, false)
    assert.equal(node.light, null)
    assert.equal(ctx.world.stage.scene.children.length, 0)
    node.active = true
    assert.equal(node.light.visible, true)
    assert.equal(node.light.intensity, 3)
    node.deactivate()
  })

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
  node.deactivate()
})
