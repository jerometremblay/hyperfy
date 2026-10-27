import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

// FileReader is browser-only; GLTFExporter needs it for its binary Blob.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => {
      this.result = result
      this.onloadend?.()
    })
  }
}
const bytes = await fs.readFile(new URL('./vendor/mixamo/throw.fbx', import.meta.url))
if (
  createHash('sha256').update(bytes).digest('hex') !==
  '5e3ab8ffcc10d4a6382c2aca4589ca8ed28050222241152051e22cac41e58479'
)
  throw new Error('Unexpected upstream throw animation')
const scene = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
const clip = scene.animations[0]
clip.tracks = clip.tracks.filter(track =>
  ['RightShoulder', 'RightArm', 'RightForeArm', 'RightHand'].some(name => track.name === `${name}.quaternion`)
)
for (const track of clip.tracks) track.times = track.times.map(time => time * 0.5)
clip.duration *= 0.5
clip.name = 'DartThrowRightArm'
scene.traverse(node => {
  node.userData = {}
})
scene.updateMatrixWorld(true)
const glb = await new GLTFExporter().parseAsync(scene, { binary: true, animations: [clip] })
await fs.writeFile(new URL('./throw.glb', import.meta.url), Buffer.from(glb))
console.log(
  `Prepared ${clip.tracks.length} right-arm tracks, ${clip.duration.toFixed(2)} seconds; no body/root animation`
)
