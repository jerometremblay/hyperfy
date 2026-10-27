import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'

const bundle = await build({
  stdin: {
    contents: `export { updatePortalCamera } from './src/core/extras/portalCamera.js';
      export * as THREE from './src/core/extras/three.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { updatePortalCamera, THREE } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

for (const orthographic of [false, true]) {
  test(`${orthographic ? 'orthographic' : 'perspective'} portals show geometry past the exit and clip its near side`, () => {
    const eye = orthographic
      ? new THREE.OrthographicCamera(-6, 6, 4.5, -4.5, 0.1, 100)
      : new THREE.PerspectiveCamera(60, 4 / 3, 0.1, 100)
    eye.position.set(0, 2, 5)
    eye.lookAt(0, 1, 0)
    eye.updateMatrixWorld()
    const view = { camera: new THREE.PerspectiveCamera(), textureMatrix: new THREE.Matrix4() }
    const source = new THREE.Matrix4().makeTranslation(0, 1.2, 0)
    const destination = new THREE.Matrix4().makeTranslation(0, 1.2, 10)
    updatePortalCamera(view, source, destination, eye)
    assert.equal(!!view.camera.isOrthographicCamera, orthographic)
    const far = new THREE.Vector3(0, 1, 12).project(view.camera)
    const near = new THREE.Vector3(0, 1, 8).project(view.camera)
    assert.ok(
      Math.abs(far.x) < 1 && Math.abs(far.y) < 1 && Math.abs(far.z) < 1,
      `Destination was clipped: ${far.toArray()}`
    )
    assert.ok(near.z < -1, `Near-side geometry was not clipped: ${near.toArray()}`)
    assert.ok(view.camera.projectionMatrix.elements.every(Number.isFinite))

    // Switching the world view also switches the cached portal camera type.
    const next = orthographic ? new THREE.PerspectiveCamera() : new THREE.OrthographicCamera()
    next.position.copy(eye.position)
    next.quaternion.copy(eye.quaternion)
    next.updateMatrixWorld()
    updatePortalCamera(view, source, destination, next)
    assert.equal(!!view.camera.isOrthographicCamera, !orthographic)
  })
}
