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
  node.deactivate()
})
