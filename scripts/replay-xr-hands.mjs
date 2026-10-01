import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { XR_HAND_BONES, cloneHandTrackingPose } from '../src/core/extras/handTracking.js'

const [recordingPath, avatarPath = fileURLToPath(new URL('../src/world/assets/avatar.vrm', import.meta.url))] =
  process.argv.slice(2)
if (!recordingPath) throw new Error('Usage: npm run xr:hands:replay -- /path/to/xr-hands.json [/path/to/avatar.vrm]')
const recording = JSON.parse(fs.readFileSync(recordingPath, 'utf8'))
if (recording.version !== 1 || !recording.frames?.length)
  throw new Error('Expected a version 1 XR hand recording with frames')

// Headless skeleton replay; textures do not affect joint transforms.
globalThis.self = globalThis
globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() {} })
const loader = new GLTFLoader()
loader.register(parser => new VRMLoaderPlugin(parser))
const bytes = fs.readFileSync(avatarPath)
const glb = await new Promise((resolve, reject) =>
  loader.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '', resolve, reject)
)
glb.scene.traverse(node => {
  if (node.geometry && !node.geometry.computeBoundsTree) node.geometry.computeBoundsTree = () => node.geometry
})

const restDirections = {}
for (const side of ['left', 'right']) {
  for (const item of XR_HAND_BONES) {
    const bone = glb.userData.vrm.humanoid.getRawBoneNode(side + item.bone)
    if (!bone) continue
    const next = XR_HAND_BONES.find(child => child.joint === item.child)
    const child = next && glb.userData.vrm.humanoid.getRawBoneNode(side + next.bone)
    const direction = child
      ? child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3()))
      : bone.getWorldPosition(new THREE.Vector3()).sub(bone.parent.getWorldPosition(new THREE.Vector3()))
    restDirections[side + item.bone] = direction
      .normalize()
      .applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion()).invert())
  }
}

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('../src/core/extras/createVRMFactory.js', import.meta.url))],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
const { createVRMFactory } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)
const scene = new THREE.Scene()
const matrix = new THREE.Matrix4()
const clip = { toClip: () => new THREE.AnimationClip('replay', 0, []) }
const instance = createVRMFactory(glb, () => {}).create(
  matrix,
  { scene, camera: new THREE.Object3D(), loader: { load: () => Promise.resolve(clip) } },
  { ctx: { entity: null } }
)
instance.disableRateCheck()
const measurements = []
for (const frame of recording.frames) {
  matrix.fromArray(frame.avatar)
  instance.setHandTrackingPose(cloneHandTrackingPose(frame.pose))
  // Settle each frame independently so the report isolates mapping from network smoothing.
  for (let i = 0; i < 40; i++) instance.update(1 / 60)
  const xrRotation = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().extractRotation(new THREE.Matrix4().fromArray(frame.xrRig))
  )
  for (const side of ['left', 'right']) {
    if (frame.pose?.[side]?.kind !== 'hand') continue
    const joints = frame.hands[side]?.joints
    for (const item of XR_HAND_BONES) {
      const joint = joints?.[item.joint]
      const child = joints?.[item.child]
      const rest = restDirections[side + item.bone]
      const transform = instance.getBoneTransform(side + item.bone)
      if (!joint || !child || !rest || !transform) continue
      const expected = new THREE.Vector3()
        .fromArray(child.p)
        .sub(new THREE.Vector3().fromArray(joint.p))
        .normalize()
        .applyQuaternion(xrRotation)
      const actual = rest.clone().transformDirection(transform)
      measurements.push({
        time: frame.time,
        bone: side + item.bone,
        degrees: (actual.angleTo(expected) * 180) / Math.PI,
      })
    }
  }
}
if (!measurements.length) throw new Error('Recording contains no comparable finger segments')
measurements.sort((a, b) => b.degrees - a.degrees)
const mean = measurements.reduce((sum, item) => sum + item.degrees, 0) / measurements.length
console.log(
  `${recording.frames.length} frames; ${measurements.length} segment comparisons; mean direction error ${mean.toFixed(2)} degrees`
)
console.table(measurements.slice(0, 10))
// Large errors need inspection: runtime joint orientation may disagree with measured geometry.
if (measurements[0].degrees > 15) process.exitCode = 1
instance.destroy()
