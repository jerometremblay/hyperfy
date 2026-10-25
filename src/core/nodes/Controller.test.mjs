import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'

const bundle = await build({
  stdin: {
    contents: `export { Controller } from './src/core/nodes/Controller.js'; export * as THREE from './src/core/extras/three.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { Controller, THREE } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

test('teleport moves the native capsule and clears contacts cached at the old position', () => {
  const position = new THREE.Vector3(4, 2, -3)
  const controller = new Controller()
  let footPosition
  let invalidations = 0
  controller.controller = {
    setFootPosition(value) {
      footPosition = value
    },
    invalidateCache() {
      invalidations++
    },
  }
  controller.moveFlags = { isSet: () => true }

  const original = globalThis.PHYSX
  globalThis.PHYSX = {
    PxExtendedVec3: class {
      constructor() {
        this.x = 0
        this.y = 0
        this.z = 0
      }
    },
  }
  controller.teleport(position)

  assert.deepEqual(controller.position.toArray(), [4, 2, -3])
  assert.deepEqual({ ...footPosition }, { x: 4, y: 2, z: -3 })
  globalThis.PHYSX = original
  assert.equal(invalidations, 1)
  assert.equal(controller.isGrounded, false)
  assert.equal(controller.isCeiling, false)
})
