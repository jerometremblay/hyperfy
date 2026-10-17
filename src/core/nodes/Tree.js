import * as THREE from '../extras/three'
import { cloneDeep, isBoolean, isEqual, isNumber, isObject, isString } from 'lodash-es'

import { Node } from './Node'
import { getTextureBytesFromMaterial } from '../extras/getTextureBytesFromMaterial'
import { getTrianglesFromGeometry } from '../extras/getTrianglesFromGeometry'

const defaults = {
  preset: 'Oak Small',
  seed: null,
  options: {},
  castShadow: true,
  receiveShadow: true,
}

const TREE_SCALE = 0.1

function isOptions(value) {
  return isObject(value) && !Array.isArray(value)
}

function disposeTree(tree) {
  if (!tree) return
  const geometries = new Set()
  const materials = new Set()
  tree.traverse(object => {
    if (object.geometry) geometries.add(object.geometry)
    if (Array.isArray(object.material)) {
      object.material.forEach(material => materials.add(material))
    } else if (object.material) {
      materials.add(object.material)
    }
  })
  for (const geometry of geometries) geometry.dispose()
  for (const material of materials) material.dispose()
}

export class TreeNode extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'tree'

    this._preset = data.preset ?? defaults.preset
    if (!isString(this._preset) || !this._preset) {
      throw new Error('[tree] preset must be a non-empty string')
    }

    this._seed = data.seed ?? defaults.seed
    if (this._seed !== null && (!isNumber(this._seed) || !Number.isFinite(this._seed))) {
      throw new Error('[tree] seed must be a finite number or null')
    }

    const options = data.options ?? defaults.options
    if (!isOptions(options)) throw new Error('[tree] options must be an object')
    this._options = cloneDeep(options)

    this._castShadow = data.castShadow ?? defaults.castShadow
    if (!isBoolean(this._castShadow)) throw new Error('[tree] castShadow must be a boolean')

    this._receiveShadow = data.receiveShadow ?? defaults.receiveShadow
    if (!isBoolean(this._receiveShadow)) throw new Error('[tree] receiveShadow must be a boolean')

    this.tree = null
    this.meshes = []
    this.generation = 0
    this.elapsedTime = 0
    this.updateRegistered = false
    this.onUpdate = delta => {
      this.elapsedTime += delta
      this.tree?.update(this.elapsedTime)
    }
  }

  mount() {
    this.needsRebuild = false
    if (!this.ctx.world.network.isClient) return
    const generation = ++this.generation
    this.loadTree(generation)
  }

  async loadTree(generation) {
    let tree
    try {
      const { Tree, TreePreset } = await import('@dgreenheck/ez-tree')
      if (!this.mounted || generation !== this.generation) return

      const preset = TreePreset[this._preset]
      if (!preset) {
        throw new Error(`unknown preset "${this._preset}" (available: ${Object.keys(TreePreset).join(', ')})`)
      }

      tree = new Tree()
      tree.options.copy(preset)
      tree.options.copy(this._options)
      if (this._seed !== null) tree.options.seed = this._seed
      tree.generate()
      tree.updateMatrixWorld(true)

      if (!this.mounted || generation !== this.generation) {
        disposeTree(tree)
        return
      }

      this.tree = tree
      const inverseTreeMatrix = tree.matrixWorld.clone().invert()
      const treeScaleMatrix = new THREE.Matrix4().makeScale(TREE_SCALE, TREE_SCALE, TREE_SCALE)
      tree.traverse(object => {
        if (!object.isMesh || !object.geometry || !object.material) return

        const localMatrix = new THREE.Matrix4()
          .multiplyMatrices(inverseTreeMatrix, object.matrixWorld)
          .premultiply(treeScaleMatrix)
        const matrix = new THREE.Matrix4().multiplyMatrices(this.matrixWorld, localMatrix)
        const handle = this.ctx.world.stage.insert({
          geometry: object.geometry,
          material: object.material,
          linked: false,
          castShadow: this._castShadow && object.castShadow,
          receiveShadow: this._receiveShadow && object.receiveShadow,
          node: this,
          matrix,
        })
        this.meshes.push({ geometry: object.geometry, material: object.material, localMatrix, matrix, handle })
      })

      if (!this.updateRegistered) {
        this.ctx.entity.on('update', this.onUpdate)
        this.updateRegistered = true
      }
    } catch (error) {
      for (const mesh of this.meshes) mesh.handle.destroy()
      this.meshes = []
      disposeTree(tree)
      this.tree = null
      if (this.mounted && generation === this.generation) {
        console.error('[tree] failed to generate tree', error)
      }
    }
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (!didMove) return
    for (const mesh of this.meshes) {
      mesh.matrix.multiplyMatrices(this.matrixWorld, mesh.localMatrix)
      mesh.handle.move(mesh.matrix)
    }
  }

  unmount() {
    this.generation++
    if (this.updateRegistered) {
      this.ctx?.entity?.off('update', this.onUpdate)
      this.updateRegistered = false
    }
    for (const mesh of this.meshes) mesh.handle.destroy()
    this.meshes = []
    disposeTree(this.tree)
    this.tree = null
    this.elapsedTime = 0
  }

  applyStats(stats) {
    for (const { geometry, material } of this.meshes) {
      if (!stats.geometries.has(geometry.uuid)) {
        stats.geometries.add(geometry.uuid)
        stats.triangles += getTrianglesFromGeometry(geometry)
      }
      if (!stats.materials.has(material.uuid)) {
        stats.materials.add(material.uuid)
        stats.textureBytes += getTextureBytesFromMaterial(material)
      }
    }
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this._preset = source._preset
    this._seed = source._seed
    this._options = cloneDeep(source._options)
    this._castShadow = source._castShadow
    this._receiveShadow = source._receiveShadow
    return this
  }

  generate() {
    this.needsRebuild = true
    this.setDirty()
    return this
  }

  get preset() {
    return this._preset
  }

  set preset(value = defaults.preset) {
    if (!isString(value) || !value) throw new Error('[tree] preset must be a non-empty string')
    if (this._preset === value) return
    this._preset = value
    this.generate()
  }

  get seed() {
    return this._seed
  }

  set seed(value = defaults.seed) {
    if (value !== null && (!isNumber(value) || !Number.isFinite(value))) {
      throw new Error('[tree] seed must be a finite number or null')
    }
    if (this._seed === value) return
    this._seed = value
    this.generate()
  }

  get options() {
    return this._options
  }

  set options(value = defaults.options) {
    if (!isOptions(value)) throw new Error('[tree] options must be an object')
    if (isEqual(this._options, value)) return
    this._options = cloneDeep(value)
    this.generate()
  }

  get castShadow() {
    return this._castShadow
  }

  set castShadow(value = defaults.castShadow) {
    if (!isBoolean(value)) throw new Error('[tree] castShadow must be a boolean')
    if (this._castShadow === value) return
    this._castShadow = value
    this.generate()
  }

  get receiveShadow() {
    return this._receiveShadow
  }

  set receiveShadow(value = defaults.receiveShadow) {
    if (!isBoolean(value)) throw new Error('[tree] receiveShadow must be a boolean')
    if (this._receiveShadow === value) return
    this._receiveShadow = value
    this.generate()
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      let proxy = {
        get preset() {
          return self.preset
        },
        set preset(value) {
          self.preset = value
        },
        get seed() {
          return self.seed
        },
        set seed(value) {
          self.seed = value
        },
        get options() {
          return self.options
        },
        set options(value) {
          self.options = value
        },
        get castShadow() {
          return self.castShadow
        },
        set castShadow(value) {
          self.castShadow = value
        },
        get receiveShadow() {
          return self.receiveShadow
        },
        set receiveShadow(value) {
          self.receiveShadow = value
        },
        generate() {
          self.generate()
          return self.proxy
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy()))
      this.proxy = proxy
    }
    return this.proxy
  }
}
