import * as THREE from './three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

// Export a snapshot: editing or closing the preview must not affect an in-flight export.
export async function exportPose(factory, previewScene) {
  const { scene, detachedRoots = [] } = factory.cloneScene(previewScene)
  for (const root of detachedRoots) scene.add(root)
  scene.matrix.identity()
  scene.matrix.decompose(scene.position, scene.quaternion, scene.scale)
  scene.matrixWorldAutoUpdate = true

  const tracks = []
  const materials = []
  scene.traverse(node => {
    // GLTFExporter uses TRS when exporting animations, even for manually updated nodes.
    if (!node.matrixAutoUpdate) node.matrix.decompose(node.position, node.quaternion, node.scale)
    node.userData = {}
    if (node.isBone) {
      tracks.push(
        new THREE.QuaternionKeyframeTrack(
          `${node.uuid}.quaternion`,
          [0, 1],
          [...node.quaternion.toArray(), ...node.quaternion.toArray()]
        )
      )
      tracks.push(
        new THREE.VectorKeyframeTrack(
          `${node.uuid}.position`,
          [0, 1],
          [...node.position.toArray(), ...node.position.toArray()]
        )
      )
    }
    if (node.isSkinnedMesh) node.bindMode = THREE.AttachedBindMode
    if (node.material) {
      const convert = material => {
        if (!material.isShaderMaterial) return material
        // VRM toon shaders are not glTF materials; preserve their base color and texture.
        const converted = new THREE.MeshStandardMaterial({
          color: material.color || 0xffffff,
          map: material.map || null,
          transparent: material.transparent,
          opacity: material.opacity,
          alphaTest: material.alphaTest,
          side: material.side,
          roughness: 1,
          metalness: 0,
        })
        materials.push(converted)
        return converted
      }
      node.material = Array.isArray(node.material) ? node.material.map(convert) : convert(node.material)
    }
  })
  try {
    if (!tracks.length) throw new Error('The avatar does not contain an exportable skeleton')
    scene.updateMatrixWorld(true)
    const data = await new GLTFExporter().parseAsync(scene, {
      binary: true,
      onlyVisible: false,
      animations: [new THREE.AnimationClip('SittingPose', 1, tracks)],
    })
    return new File([data], 'sitting-pose.glb', { type: 'model/gltf-binary' })
  } finally {
    for (const material of materials) material.dispose()
  }
}
