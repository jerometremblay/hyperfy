import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'

const bundle = await build({
  stdin: {
    contents: `export { UI } from './src/core/nodes/UI.js'; export * as THREE from './src/core/extras/three.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { UI, THREE } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function projectedWidth(camera, distance) {
  camera.position.set(0, 0, 32)
  camera.updateMatrixWorld(true)
  const world = {
    camera,
    rig: { quaternion: camera.quaternion },
    xr: { session: null },
    graphics: {
      worldToScreenFactor: camera.isOrthographicCamera
        ? (camera.top - camera.bottom) / camera.zoom / 768
        : (2 * Math.tan((camera.fov * Math.PI) / 360)) / 768,
    },
  }
  const ui = Object.assign(Object.create(UI.prototype), {
    ctx: { world },
    _space: 'world',
    _billboard: 'full',
    _scaler: [3, 30],
    _size: 0.01,
    matrixWorld: new THREE.Matrix4().makeTranslation(0, 0, 32 - distance),
    mesh: { matrixWorld: new THREE.Matrix4() },
  })
  ui.lateUpdate(1 / 60)
  const left = new THREE.Vector3(-1, 0, 0).applyMatrix4(ui.mesh.matrixWorld).project(camera)
  const right = new THREE.Vector3(1, 0, 0).applyMatrix4(ui.mesh.matrixWorld).project(camera)
  return ((right.x - left.x) * 1024) / 2
}

test('a 200-pixel orthographic bubble stays 200 pixels wide at any camera distance', () => {
  const camera = new THREE.OrthographicCamera(-12, 12, 9, -9, 0.1, 100)
  for (const distance of [5, 20, 32, 60]) {
    assert.ok(Math.abs(projectedWidth(camera, distance) - 200) < 1e-8)
  }
})

test('perspective UI retains its existing distance compensation', () => {
  const camera = new THREE.PerspectiveCamera(60, 4 / 3, 0.1, 100)
  for (const distance of [5, 20]) {
    assert.ok(Math.abs(projectedWidth(camera, distance) - 200) < 1e-8)
  }
})
