import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'

const bundle = await build({
  stdin: {
    contents: `export { Controller } from './src/core/nodes/Controller.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { Controller } = await import(
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

  position.toPxExtVec3 = () => ({ x: position.x, y: position.y, z: position.z })
  controller.teleport(position)

  assert.deepEqual(controller.position.toArray(), [4, 2, -3])
  assert.deepEqual(footPosition, { x: 4, y: 2, z: -3 })
  assert.equal(invalidations, 1)
  assert.equal(controller.isGrounded, false)
  assert.equal(controller.isCeiling, false)
})
