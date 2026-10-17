import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'

const bundle = await build({
  stdin: {
    contents: `export * from './src/core/extras/portalCollisionGeometry.js';
      export * from './src/core/extras/portalTraversal.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { cutPortalCollision, clipPortalCollision, getPortalTransform } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)
const portal = {
  width: 3,
  height: 3,
  matrixWorld: new THREE.Matrix4().compose(
    new THREE.Vector3(0, 3, 0),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
    new THREE.Vector3(1, 1, 1)
  ),
}
function hit(geometry, origin, direction = new THREE.Vector3(0, -1, 0)) {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))
  return new THREE.Raycaster(origin, direction, 0, 10).intersectObject(mesh)[0]
}

test('cuts an aperture through a solid floor without disabling collision outside its rectangle', () => {
  const box = new THREE.BoxGeometry(8, 0.2, 8)
  const cut = cutPortalCollision(box, new THREE.Matrix4().makeTranslation(0, 2.9, 0), [{ portal }])
  assert.ok(cut.index, 'native triangle mesh cooking requires an index')
  assert.equal(hit(cut, new THREE.Vector3(0, 4, 0)), undefined)
  assert.ok(Math.abs(hit(cut, new THREE.Vector3(2.5, 4, 0)).point.y - 3) < 1e-6)
  assert.ok(Math.abs(hit(cut, new THREE.Vector3(0, 4, 2.5)).point.y - 3) < 1e-6)
  assert.equal(hit(cut, new THREE.Vector3(1.4, 4, 1.4)), undefined)
  cut.dispose()
})

test('does not cut a stair surface in front of the opening or a distant floor behind it', () => {
  const box = new THREE.BoxGeometry(2, 0.1, 2)
  assert.equal(cutPortalCollision(box, new THREE.Matrix4().makeTranslation(0, 3.3, 0), [{ portal }]), null)
  assert.equal(cutPortalCollision(box, new THREE.Matrix4().makeTranslation(0, 0, 0), [{ portal }]), null)
  assert.equal(cutPortalCollision(box, new THREE.Matrix4().makeTranslation(8, 3, 0), [{ portal }]), null)
})

test('mapped stairs beyond the portal support the crossed body, while the other room ceiling is excluded', () => {
  const exit = {
    ...portal,
    matrixWorld: new THREE.Matrix4().compose(
      new THREE.Vector3(10, 3, 0),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
      new THREE.Vector3(1, 1, 1)
    ),
  }
  const step = new THREE.BoxGeometry(2, 0.2, 2)
  const transform = getPortalTransform(exit, portal)
  const mapped = clipPortalCollision(
    step,
    transform.clone().multiply(new THREE.Matrix4().makeTranslation(10, 2, 0)),
    portal
  )
  assert.ok(mapped)
  assert.ok(Math.abs(hit(mapped, new THREE.Vector3(0, 2.5, 0)).point.y - 2.1) < 1e-6)
  assert.equal(hit(mapped, new THREE.Vector3(2, 2.5, 0)), undefined)
  const ceiling = clipPortalCollision(
    step,
    transform.clone().multiply(new THREE.Matrix4().makeTranslation(10, 3.1, 0)),
    portal
  )
  assert.equal(ceiling, null)
})

test('a rotated vertical doorway cuts only its aperture, retaining the wall around it', () => {
  const doorway = { width: 2, height: 3, matrixWorld: new THREE.Matrix4().makeTranslation(4, 1.5, 0) }
  const wall = new THREE.BoxGeometry(8, 6, 0.2)
  const cut = cutPortalCollision(wall, new THREE.Matrix4().makeTranslation(4, 1.5, -0.1), [{ portal: doorway }])
  assert.equal(hit(cut, new THREE.Vector3(4, 1.5, 2), new THREE.Vector3(0, 0, -1)), undefined)
  assert.ok(hit(cut, new THREE.Vector3(6, 1.5, 2), new THREE.Vector3(0, 0, -1)))
})
