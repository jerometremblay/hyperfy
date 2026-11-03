import { glbToNodes } from './glbToNodes'
import { createNode } from './createNode'
import * as THREE from '../extras/three'
export { recipeFromSandbox, runtimePolyspoonHash } from './polyspoonRecipe'

export function createPolyspoonModel(world, recipe, props = {}) {
  const { createAsset, disposeAsset, metadata } = recipe
  const parameters = Object.fromEntries(metadata.controls.filter(control => props[control.key] !== undefined).map(control => [control.key, props[control.key]]))
  const object = createAsset(parameters)
  let collision
  try {
    // Merge the generated meshes into one static triangle collider in recipe-local coordinates.
    object.updateMatrixWorld(true)
    const inverse = object.matrixWorld.clone().invert()
    const matrix = new THREE.Matrix4()
    const vertex = new THREE.Vector3()
    const positions = []
    const indices = []
    object.traverse(mesh => {
      if (!mesh.isMesh) return
      const attribute = mesh.geometry.getAttribute('position')
      const index = mesh.geometry.getIndex()
      const offset = positions.length / 3
      matrix.multiplyMatrices(inverse, mesh.matrixWorld)
      for (let i = 0; i < attribute.count; i++) {
        vertex.fromBufferAttribute(attribute, i).applyMatrix4(matrix)
        positions.push(vertex.x, vertex.y, vertex.z)
      }
      for (let i = 0; i < (index ? index.count : attribute.count); i++) indices.push(offset + (index ? index.getX(i) : i))
    })
    collision = new THREE.BufferGeometry()
    collision.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    collision.setIndex(indices)
    const root = glbToNodes({ scene: object, animations: [] }, world)
    const body = createNode('rigidbody', { type: 'static' })
    body.add(createNode('collider', { type: 'geometry', geometry: collision }))
    root.add(body)
    const fields = metadata.controls.map(control => ({
      key: control.key,
      label: control.label,
      hint: control.hint,
      type: { choice: 'select', range: 'number', integer: 'number', color: 'color', toggle: 'toggle' }[control.kind],
      initial: object.userData.design.applied[control.key],
      min: control.min,
      max: control.max,
      step: control.step,
      dp: control.kind === 'range' ? 2 : 0,
      options: control.options,
    }))
    return { root, fields, dispose: () => { collision.dispose(); disposeAsset(object) } }
  } catch (error) {
    collision?.dispose()
    disposeAsset(object)
    throw error
  }
}
