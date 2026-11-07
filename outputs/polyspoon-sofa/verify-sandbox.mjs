// Exercise the actual recipe compiler, SES worker, in-world adapter and PhysX.
import assert from 'node:assert/strict'
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Worker } from 'node:worker_threads'
import { build } from 'esbuild'
import { compilePolyspoonRecipe } from '../../src/server/compilePolyspoonRecipe.js'

const temp = await mkdtemp(path.join(tmpdir(), 'sofa-verification-'))
const workerPath = path.resolve(`outputs/polyspoon-sofa/.verify-worker-${process.pid}.mjs`)
try {
  const workerBundle = await build({
    entryPoints: ['src/server/polyspoonNodeWorker.js'],
    bundle: true, platform: 'node', format: 'esm', packages: 'external', write: false,
  })
  await writeFile(workerPath, workerBundle.outputFiles[0].contents)
  await build({
    stdin: {
      contents: `export { createPolyspoonModel, recipeFromSandbox } from './src/core/extras/polyspoon.js';
        export { Physics } from './src/core/systems/Physics.js';
        export { geometryToPxMesh } from './src/core/extras/geometryToPxMesh.js';`,
      resolveDir: process.cwd(),
    },
    bundle: true, platform: 'node', format: 'esm', outfile: `${temp}/engine.mjs`,
  })
  await copyFile('src/core/physx-js-webidl.wasm', `${temp}/physx-js-webidl.wasm`)
  const { createPolyspoonModel, recipeFromSandbox, Physics, geometryToPxMesh } = await import(`${temp}/engine.mjs`)
  const recipePath = process.argv[2] ?? 'outputs/polyspoon-sofa/sofa.recipe.mjs'
  const source = await compilePolyspoonRecipe(await readFile(recipePath, 'utf8'))
  const world = { network: { isServer: true } }
  world.physics = new Physics(world)
  await world.physics.init()
  const variants = [
    {},
    { seatCount: 1, seatDepth: 0.55, backDepth: 0.16, armDepth: 0.75, seatRadius: 0.05, backRadius: 0.05, armRadius: 0.05, bevelSize: 2, bevelThickness: 2, 'color.leather': '#123456' },
    { seatCount: 5, seatWidth: 0.95, seatDepth: 0.75, backDepth: 0.28, armDepth: 0.95, seatRadius: 0.10, backRadius: 0.12, armRadius: 0.11, bevelSize: 22, bevelThickness: 25, 'color.leather': '#abcdef' },
  ]
  for (const parameters of variants) {
    const worker = new Worker(workerPath, { resourceLimits: { maxOldGenerationSizeMb: 128 } })
    const output = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('sandbox timed out')), 10000)
      worker.once('error', error => { clearTimeout(timer); reject(error) })
      worker.once('message', message => {
        clearTimeout(timer)
        if (message.error) reject(new Error(message.error))
        else resolve(message.result)
      })
      worker.postMessage({ source, parameters: JSON.stringify(parameters) })
    }).finally(() => worker.terminate())
    const model = createPolyspoonModel(world, recipeFromSandbox(output))
    for (const [key, value] of Object.entries(parameters)) {
      assert.equal(model.fields.find(field => field.key === key)?.initial, value, key)
    }
    const geometry = model.root.children.find(node => node.name === 'rigidbody').children[0]._geometry
    const cooked = geometryToPxMesh(world, geometry, false)
    assert.ok(cooked?.value?.ptr, 'PhysX must cook the collider')
    cooked.release()
    model.dispose()
  }
  console.log(`Sandbox, controls and PhysX collider passed for ${variants.length} sofa variants`)
} finally {
  await rm(workerPath, { force: true })
  await rm(temp, { recursive: true, force: true })
}
