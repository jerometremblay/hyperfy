import * as THREE from 'three'

export const runtimePolyspoonHash = model => /^polyspoon:\/\/([a-f0-9]{64})$/.exec(model || '')?.[1]

// The worker returns only JSON. Validate it before allocating engine objects.
export function recipeFromSandbox(output) {
  if (typeof output !== 'string' || output.length > 32000000) throw new Error('Invalid recipe output')
  const data = JSON.parse(output)
  if (
    !data ||
    !Array.isArray(data.meshes) ||
    data.meshes.length > 512 ||
    !Array.isArray(data.controls) ||
    data.controls.length > 256 ||
    !data.applied ||
    typeof data.applied !== 'object' ||
    Array.isArray(data.applied)
  ) {
    throw new Error('Invalid recipe output')
  }
  const appliedValues = Object.create(null)
  const controlKeys = new Set()
  const controls = data.controls.map(control => {
    if (
      !control ||
      typeof control.key !== 'string' ||
      !/^[a-zA-Z0-9_.-]{1,160}$/.test(control.key) ||
      ['__proto__', 'constructor', 'prototype'].includes(control.key) ||
      !['choice', 'range', 'integer', 'color', 'toggle'].includes(control.kind)
    )
      throw new Error('Invalid recipe control')
    if (controlKeys.has(control.key)) throw new Error('Duplicate recipe control')
    controlKeys.add(control.key)
    const entry = {
      key: control.key,
      kind: control.kind,
      label: String(control.label || '').slice(0, 160),
      hint: String(control.hint || '').slice(0, 1024),
    }
    for (const key of ['min', 'max', 'step'])
      if (control[key] !== undefined) {
        if (!Number.isFinite(control[key])) throw new Error('Invalid recipe control bounds')
        entry[key] = control[key]
      }
    if (control.kind === 'choice') {
      if (!Array.isArray(control.options) || control.options.length > 128) throw new Error('Invalid recipe choices')
      entry.options = control.options.map(option => {
        if (
          !option ||
          typeof option.value !== 'string' ||
          option.value.length > 160 ||
          typeof option.label !== 'string' ||
          option.label.length > 160
        )
          throw new Error('Invalid recipe choice')
        return { value: option.value, label: option.label }
      })
    }
    const applied = data.applied[control.key]
    if (typeof applied !== 'string' && typeof applied !== 'number' && typeof applied !== 'boolean')
      throw new Error('Invalid applied recipe value')
    if (
      (typeof applied === 'number' && !Number.isFinite(applied)) ||
      (typeof applied === 'string' && applied.length > 1024)
    )
      throw new Error('Invalid applied recipe value')
    if (control.kind === 'range' || control.kind === 'integer') {
      if (
        !Number.isFinite(entry.min) ||
        !Number.isFinite(entry.max) ||
        !Number.isFinite(entry.step) ||
        entry.min > entry.max ||
        entry.step <= 0 ||
        typeof applied !== 'number' ||
        applied < entry.min ||
        applied > entry.max ||
        (control.kind === 'integer' && !Number.isInteger(applied))
      )
        throw new Error('Invalid applied recipe value')
    } else if (
      (control.kind === 'toggle' && typeof applied !== 'boolean') ||
      (control.kind === 'color' && (typeof applied !== 'string' || !/^#[0-9a-f]{6}$/i.test(applied))) ||
      (control.kind === 'choice' && !entry.options.some(option => option.value === applied))
    )
      throw new Error('Invalid applied recipe value')
    appliedValues[control.key] = applied
    return entry
  })
  const validArray = (value, expected, limit = 1e6) =>
    Array.isArray(value) &&
    value.length === expected &&
    value.every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= limit)
  let vertices = 0
  let indices = 0
  for (const mesh of data.meshes) {
    if (
      !mesh ||
      !validArray(mesh.matrix, 16) ||
      !Array.isArray(mesh.positions) ||
      !mesh.positions.length ||
      mesh.positions.length % 3 ||
      !validArray(mesh.positions, mesh.positions.length)
    )
      throw new Error('Invalid recipe mesh')
    const count = mesh.positions.length / 3
    if (mesh.matrix[3] !== 0 || mesh.matrix[7] !== 0 || mesh.matrix[11] !== 0 || mesh.matrix[15] !== 1)
      throw new Error('Invalid recipe transform')
    const position = new THREE.Vector3()
    const rotation = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    new THREE.Matrix4().fromArray(mesh.matrix).decompose(position, rotation, scale)
    if (
      ![...position.toArray(), ...rotation.toArray(), ...scale.toArray()].every(Number.isFinite) ||
      rotation.lengthSq() < 1e-9 ||
      [scale.x, scale.y, scale.z].some(value => Math.abs(value) < 1e-9 || Math.abs(value) > 1e6) ||
      [position.x, position.y, position.z].some(value => Math.abs(value) > 1e6)
    )
      throw new Error('Invalid recipe transform')
    vertices += count
    for (const [key, size] of [
      ['normals', 3],
      ['uvs', 2],
      ['colors', 3],
    ])
      if (mesh[key] !== null && !validArray(mesh[key], count * size)) throw new Error('Invalid recipe attribute')
    if (
      mesh.indices !== null &&
      (!Array.isArray(mesh.indices) ||
        mesh.indices.length % 3 ||
        !mesh.indices.every(n => Number.isInteger(n) && n >= 0 && n < count))
    )
      throw new Error('Invalid recipe indices')
    if (mesh.indices === null && count % 3) throw new Error('Invalid recipe triangles')
    indices += mesh.indices?.length ?? count
    const mat = mesh.material
    if (
      !mat ||
      !['MeshBasicMaterial', 'MeshStandardMaterial'].includes(mat.type) ||
      !Number.isInteger(mat.color) ||
      mat.color < 0 ||
      mat.color > 0xffffff ||
      !Number.isFinite(mat.opacity) ||
      mat.opacity < 0 ||
      mat.opacity > 1 ||
      ![0, 1, 2].includes(mat.side)
    )
      throw new Error('Invalid recipe material')
    for (const key of ['roughness', 'metalness', 'emissiveIntensity'])
      if (mat[key] !== undefined && (!Number.isFinite(mat[key]) || Math.abs(mat[key]) > 1000))
        throw new Error('Invalid recipe material')
    if (mat.emissive !== undefined && (!Number.isInteger(mat.emissive) || mat.emissive < 0 || mat.emissive > 0xffffff))
      throw new Error('Invalid recipe material')
  }
  if (vertices > 250000 || indices > 1000000) throw new Error('Recipe geometry exceeds limits')
  const object = new THREE.Group()
  try {
    for (const mesh of data.meshes) {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(mesh.positions, 3))
      if (mesh.indices) geometry.setIndex(mesh.indices)
      if (mesh.normals) geometry.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.normals, 3))
      else geometry.computeVertexNormals()
      if (mesh.uvs) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(mesh.uvs, 2))
      if (mesh.colors) geometry.setAttribute('color', new THREE.Float32BufferAttribute(mesh.colors, 3))
      const mat = mesh.material
      const options = {
        color: mat.color,
        opacity: mat.opacity,
        transparent: mat.transparent === true,
        side: mat.side,
        wireframe: mat.wireframe === true,
        vertexColors: mat.vertexColors === true,
      }
      let material
      if (mat.type === 'MeshBasicMaterial') material = new THREE.MeshBasicMaterial(options)
      else
        material = new THREE.MeshStandardMaterial({
          ...options,
          roughness: mat.roughness,
          metalness: mat.metalness,
          emissive: mat.emissive,
          emissiveIntensity: mat.emissiveIntensity,
          flatShading: mat.flatShading === true,
        })
      const node = new THREE.Mesh(geometry, material)
      node.name = typeof mesh.name === 'string' ? mesh.name.slice(0, 160) : ''
      new THREE.Matrix4().fromArray(mesh.matrix).decompose(node.position, node.quaternion, node.scale)
      node.quaternion.normalize()
      object.add(node)
    }
    object.userData.design = { applied: appliedValues }
    return {
      metadata: { controls },
      createAsset: () => object,
      disposeAsset: () =>
        object.traverse(node => {
          if (node.isMesh) {
            node.geometry.dispose()
            node.material.dispose()
          }
        }),
    }
  } catch (error) {
    object.traverse(node => {
      if (node.isMesh) {
        node.geometry.dispose()
        node.material.dispose()
      }
    })
    throw error
  }
}
