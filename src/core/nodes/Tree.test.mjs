import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { EventEmitter } from 'node:events'
import { Matrix4 } from 'three'

const bundle = await build({
  entryPoints: [new URL('./Tree.js', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  plugins: [
    {
      name: 'tree-render-fixture',
      setup(build) {
        build.onLoad({ filter: /libs\/ez-tree\/index\.js$/ }, () => ({
          contents: `
      import { Group } from 'three'
      export const TreePreset = { 'Oak Small': {} }
      export class Tree extends Group {
        constructor() { super(); this.options = { copy() {} }; this.times = [] }
        generateLODs() { this.lod = { levels: [{ object: new Group() }] } }
        update(time) { this.times.push(time) }
      }
    `,
          resolveDir: process.cwd(),
        }))
        build.onLoad({ filter: /libs\/ez-tree\/textures\.js$/ }, () => ({
          contents: 'export const applyTreeTextureDefaults = () => []',
        }))
      },
    },
  ],
})
const { TreeNode } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function fixture() {
  const world = {
    network: { isClient: true },
    stage: { dirtyNodes: new Set(), releaseGeometry() {} },
    camera: { matrixWorld: new Matrix4() },
  }
  async function mount(seed = null) {
    const entity = new EventEmitter()
    const node = new TreeNode({ seed })
    node.ctx = { world, entity }
    node.mounted = true
    await node.loadTree(++node.generation)
    assert.ok(node.asset)
    return { node, entity }
  }
  return { mount }
}

test('shared trees run one wind callback and transfer it without resetting animation time', async () => {
  const { mount } = fixture()
  const a = await mount(),
    b = await mount(),
    c = await mount()
  assert.equal(a.node.asset, b.node.asset)
  assert.deepEqual(
    [a, b, c].map(x => x.entity.listenerCount('update')),
    [1, 0, 0]
  )
  const tree = a.node.tree
  for (const x of [a, b, c]) x.entity.emit('update', 0.5)
  assert.deepEqual(tree.times, [0.5])
  c.node.unmount()
  assert.equal(a.entity.listenerCount('update'), 1, 'removing a non-owner leaves the owner subscribed')
  a.node.unmount()
  assert.deepEqual(
    [a, b].map(x => x.entity.listenerCount('update')),
    [0, 1]
  )
  b.entity.emit('update', 0.25)
  assert.deepEqual(tree.times, [0.5, 0.75])
  b.node.unmount()
  assert.equal(b.entity.listenerCount('update'), 0)
})

test('distinct assets animate independently and rebuilding transfers the old asset subscription', async () => {
  const { mount } = fixture()
  const a = await mount(),
    b = await mount(),
    different = await mount(42)
  assert.notEqual(a.node.asset, different.node.asset)
  assert.equal(different.entity.listenerCount('update'), 1)
  a.node.unmount()
  await a.node.loadTree(++a.node.generation)
  assert.equal(a.node.asset, b.node.asset)
  assert.deepEqual(
    [a, b, different].map(x => x.entity.listenerCount('update')),
    [0, 1, 1]
  )
  for (const x of [a, b, different]) x.node.unmount()
})
