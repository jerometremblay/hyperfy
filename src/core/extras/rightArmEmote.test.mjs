import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { build } from 'esbuild'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { createEmoteFactory } from './createEmoteFactory.js'

globalThis.self = globalThis
globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() {} })
const bundled = await build({
  stdin: {
    contents: "export { createVRMFactory } from './src/core/extras/createVRMFactory.js'",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
const { createVRMFactory } = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`
)
const cache = new Map()
async function loadEmote(url) {
  const name = url.split('?')[0].slice(8)
  if (!cache.has(name))
    cache.set(
      name,
      (async () => {
        const file = name === 'throw.glb' ? 'apps/darts/throw.glb' : `src/world/assets/${name}`
        const bytes = await fs.readFile(file)
        const glb = await new GLTFLoader().parseAsync(
          bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
          ''
        )
        return createEmoteFactory(glb, url)
      })()
    )
  return cache.get(name)
}
async function avatar() {
  const loader = new GLTFLoader()
  loader.register(parser => new VRMLoaderPlugin(parser))
  const bytes = await fs.readFile('src/world/assets/avatar.vrm')
  const glb = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  glb.scene.traverse(node => {
    if (node.geometry && !node.geometry.computeBoundsTree) node.geometry.computeBoundsTree = () => node.geometry
  })
  const camera = new THREE.Object3D()
  camera.updateMatrixWorld(true)
  const instance = createVRMFactory(glb, () => {}).create(
    new THREE.Matrix4(),
    {
      camera,
      scene: new THREE.Scene(),
      loader: { load: (_, url) => loadEmote(url) },
    },
    { ctx: { entity: null } }
  )
  instance.disableRateCheck()
  instance.updateRate()
  await Promise.all([...cache.values()])
  await new Promise(resolve => setImmediate(resolve))
  instance.setLocomotion(1, new THREE.Vector3(0, 0, -1), new THREE.Vector3(0.05, 0.05, -1))
  return instance
}
const position = (instance, bone) => new THREE.Vector3().setFromMatrixPosition(instance.getBoneTransform(bone))
test('real VRM right-arm throw preserves walking and restores the arm after cancellation', async () => {
  const baseline = await avatar()
  const throwing = await avatar()
  await loadEmote('asset://throw.glb')
  for (let i = 0; i < 25; i++) {
    baseline.update(1 / 60)
    throwing.update(1 / 60)
  }
  throwing.setEmote('asset://throw.glb?m=rightArm&l=0')
  await new Promise(resolve => setImmediate(resolve))
  let maximum = 0
  for (let i = 0; i < 36; i++) {
    baseline.update(1 / 60)
    throwing.update(1 / 60)
    for (const bone of ['hips', 'leftHand', 'leftFoot', 'rightFoot', 'head']) {
      assert.ok(
        position(baseline, bone).distanceTo(position(throwing, bone)) < 1e-6,
        `${bone} was changed by the arm clip`
      )
    }
    maximum = Math.max(maximum, position(baseline, 'rightHand').distanceTo(position(throwing, 'rightHand')))
  }
  assert.ok(maximum > 0.2, 'throw must visibly move the right hand')
  throwing.setEmote(null)
  for (let i = 0; i < 15; i++) {
    baseline.update(1 / 60)
    throwing.update(1 / 60)
  }
  assert.ok(position(baseline, 'rightHand').distanceTo(position(throwing, 'rightHand')) < 1e-6)
  throwing.setEmote('asset://throw.glb?m=rightArm&l=0')
  await new Promise(resolve => setImmediate(resolve))
  for (let i = 0; i < 85; i++) {
    baseline.update(1 / 60)
    throwing.update(1 / 60)
  }
  assert.ok(
    position(baseline, 'rightHand').distanceTo(position(throwing, 'rightHand')) < 1e-6,
    'one-shot ends even without another state packet'
  )
  baseline.destroy()
  throwing.destroy()
})
