import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, copyFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { build } from 'esbuild'

const temp = await mkdtemp(`${tmpdir()}/hyperfy-polyspoon-`)
await build({
  stdin: {
    contents: `export { createPolyspoonModel } from './src/core/extras/polyspoon.js';
      export * as fruitStall from './test/fixtures/polyspoon/market-stall.recipe.mjs';
      export * as bookcase from './test/fixtures/polyspoon/bookcase.recipe.mjs';
      export { Physics } from './src/core/systems/Physics.js';
      export { geometryToPxMesh } from './src/core/extras/geometryToPxMesh.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true, platform: 'node', format: 'esm', outfile: `${temp}/engine.mjs`,
})
await copyFile('src/core/physx-js-webidl.wasm', `${temp}/physx-js-webidl.wasm`)
const { createPolyspoonModel, fruitStall, bookcase, Physics, geometryToPxMesh } = await import(`${temp}/engine.mjs`)

test('default and resized fruit stall collision meshes cook with PhysX', async () => {
  const world = { network: { isServer: true } }
  world.physics = new Physics(world)
  await world.physics.init()
  for (const [type, props] of [[fruitStall, {}], [fruitStall, { width: 3.5, goods: 'none' }], [bookcase, {}]]) {
    const model = createPolyspoonModel(world, type, props)
    const geometry = model.root.children.find(node => node.name === 'rigidbody').children[0]._geometry
    const cooked = geometryToPxMesh(world, geometry, false)
    assert.ok(cooked?.value?.ptr, 'PhysX must cook the triangle collider')
    cooked.release()
    model.dispose()
  }
})
