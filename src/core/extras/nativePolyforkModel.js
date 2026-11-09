import * as THREE from 'three'
import { createNode } from './createNode.js'
import { NativeGeometry } from '../nodes/NativeGeometry.js'

export function createNativePolyforkModel(model, props = {}) {
  const params = model.params || {}
  const { __manualGeometry, ...modelProps } = props
  const object = model.createAsset(modelProps)
  if (!object?.isObject3D) throw new Error('Polyfork createAsset must return a Three.js object')
  const root = createNode('group')
  const attachment = new NativeGeometry({ object })
  let collision
  let collider
  let body
  const buildCollision = () => {
    attachment.container.updateMatrixWorld(true)
    const inverse = attachment.container.matrixWorld.clone().invert()
    const matrix = new THREE.Matrix4(), vertex = new THREE.Vector3(), positions = [], indices = []
    object.traverse(mesh => {
      if (!mesh.isMesh) return
      const attribute = mesh.geometry.getAttribute('position'), index = mesh.geometry.getIndex(), offset = positions.length / 3
      matrix.multiplyMatrices(inverse, mesh.matrixWorld)
      for (let i = 0; i < attribute.count; i++) {
        vertex.fromBufferAttribute(attribute, i).applyMatrix4(matrix)
        positions.push(vertex.x, vertex.y, vertex.z)
      }
      for (let i = 0; i < (index ? index.count : attribute.count); i++) indices.push(offset + (index ? index.getX(i) : i))
    })
    if (!positions.length) return null
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    return geometry
  }
  try {
    collision = buildCollision()
    if (collision) {
      body = createNode('rigidbody', { type: 'static' })
      collider = createNode('collider', { type: 'geometry', geometry: collision })
      body.add(collider)
    }
    const fields = Object.entries(params).flatMap(([key, p]) => {
      if (!p || !['choice', 'range', 'integer', 'color', 'toggle'].includes(p.type)) return []
      return [{ key, label: p.label || key, hint: p.describe || '', type: { choice: 'select', range: 'number', integer: 'number', color: 'color', toggle: 'toggle' }[p.type], initial: p.default, min: p.min, max: p.max, step: p.step, options: p.options?.map(value => ({ value, label: value })) }]
    })
    const attach = () => {
      if (attachment.parent !== root) root.add(attachment)
      if (body && body.parent !== root) root.add(body)
    }
    if (__manualGeometry !== true) attach()
    return { root, object, fields, attach, setPartRotation: (name, axis, value) => {
      if (typeof name !== 'string' || name.length > 160 || !['x', 'y', 'z'].includes(axis) || typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1000) throw new Error('Invalid model part rotation')
      const part = object.getObjectByName(name)
      if (!part) return false
      if (part.rotation[axis] === value) return true
      const previous = part.rotation[axis]
      part.rotation[axis] = value
      let next
      try { next = buildCollision() } catch (error) { part.rotation[axis] = previous; throw error }
      if (collider && next) {
        const old = collision
        collider.geometry = next
        collision = next
        old.dispose()
      }
      return true
    }, dispose: () => {
      collision?.dispose()
      const geometries = new Set(), materials = new Set(), textures = new Set()
      object.traverse(node => {
        if (node.geometry) geometries.add(node.geometry)
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) if (material) materials.add(material)
      })
      for (const material of materials) {
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value)
        material.dispose()
      }
      for (const texture of textures) texture.dispose()
      for (const geometry of geometries) geometry.dispose()
    } }
  } catch (error) { collision?.dispose(); throw error }
}
