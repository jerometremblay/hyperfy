import * as THREE from '../extras/three'
import { cloneDeep, isBoolean, isEqual, isNumber, isObject, isString } from 'lodash-es'

import { Node } from './Node'
import { Group } from './Group'
import { LOD } from './LOD'
import { Mesh } from './Mesh'
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
const treeAssetsByWorld = new WeakMap()

function isOptions(value) {
  return isObject(value) && !Array.isArray(value)
}

function normalizeOptions(value) {
  if (Array.isArray(value)) return value.map(normalizeOptions)
  if (!isOptions(value)) return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map(key => [key, normalizeOptions(value[key])])
  )
}

function getTreeAssetKey(preset, seed, options) {
  return JSON.stringify({ preset, seed, options: normalizeOptions(options) })
}

function getWorldTreeAssets(world) {
  let assets = treeAssetsByWorld.get(world)
  if (!assets) {
    assets = new Map()
    treeAssetsByWorld.set(world, assets)
  }
  return assets
}

function disposeTree(tree) {
  if (!tree) return
  const geometries = new Set()
  const materials = new Set()
  tree.traverse(object => {
    if (object.geometry) geometries.add(object.geometry)
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of objectMaterials) {
      if (!material) continue
      materials.add(material)
    }
  })
  for (const geometry of geometries) geometry.dispose()
  for (const material of materials) material.dispose()
}

function createTreeAsset(Tree, preset, options, seed, key, applyTextureDefaults) {
  let tree
  let ownedTextures = []
  try {
    tree = new Tree()
    tree.options.copy(preset)
    tree.options.copy(options)
    if (seed !== null) tree.options.seed = seed
    ownedTextures = applyTextureDefaults(tree.options)
    tree.generateLODs()
    tree.updateMatrixWorld(true)

    const meshes = []
    tree.traverse(object => {
      if (object.isMesh && object.geometry && object.material) {
        meshes.push({ object, geometry: object.geometry, material: object.material })
      }
    })

    return {
      key,
      tree,
      meshes,
      ownedTextures,
      users: new Set(),
      updateOwner: null,
      elapsedTime: 0,
    }
  } catch (error) {
    disposeTree(tree)
    for (const texture of ownedTextures) texture.dispose()
    throw error
  }
}

function acquireTreeAsset(world, Tree, presetName, preset, options, seed, applyTextureDefaults, node) {
  const key = getTreeAssetKey(presetName, seed, options)
  const assets = getWorldTreeAssets(world)
  let asset = assets.get(key)
  if (!asset) {
    asset = createTreeAsset(Tree, preset, options, seed, key, applyTextureDefaults)
    assets.set(key, asset)
  }
  asset.users.add(node)
  asset.updateOwner ||= node
  return asset
}

function releaseTreeAsset(world, asset, node) {
  if (!asset?.users.delete(node)) return
  if (asset.updateOwner === node) {
    asset.updateOwner = asset.users.values().next().value || null
  }
  if (asset.users.size) return

  const assets = treeAssetsByWorld.get(world)
  if (assets?.get(asset.key) === asset) assets.delete(asset.key)
  for (const { geometry } of asset.meshes) {
    world.stage.releaseGeometry(geometry)
  }
  disposeTree(asset.tree)
  for (const texture of asset.ownedTextures) texture.dispose()
}

function makeTreeMeshNode(object, inverseTreeMatrix, options) {
  const meshNode = new Mesh({
    type: 'geometry',
    geometry: object.geometry,
    material: object.material,
    linked: true,
    castShadow: options.castShadow && object.castShadow,
    receiveShadow: options.receiveShadow && object.receiveShadow,
  })
  const localMatrix = new THREE.Matrix4().multiplyMatrices(inverseTreeMatrix, object.matrixWorld)
  localMatrix.decompose(meshNode.position, meshNode.quaternion, meshNode.scale)
  return meshNode
}

function createTreeRuntime(asset, options) {
  const tree = asset.tree
  const levels = tree.lod?.levels || []
  if (!levels.length) throw new Error('EZ-Tree did not generate LOD levels')

  const runtime = new Group()
  runtime.name = 'tree-runtime'
  runtime.isTreeRuntime = true
  runtime.scale.setScalar(TREE_SCALE)

  const inverseTreeMatrix = tree.matrixWorld.clone().invert()
  const lod = new LOD({ scaleAware: true })
  for (let index = 0; index < levels.length; index++) {
    const level = levels[index]
    const nextLevel = levels[index + 1]
    const group = new Group()
    const isFarLevel = index === levels.length - 1 && levels.length > 1

    for (const object of level.object.children) {
      if (!object.isMesh || !object.geometry || !object.material) continue
      group.add(
        makeTreeMeshNode(object, inverseTreeMatrix, {
          castShadow: options.castShadow && !isFarLevel,
          receiveShadow: options.receiveShadow,
        })
      )
    }

    lod.insert(group, nextLevel?.distance ?? Infinity, nextLevel?.hysteresis ?? 0)
  }
  runtime.add(lod)

  const levelObjects = new Set(levels.map(level => level.object))
  for (const { object } of asset.meshes) {
    if (levelObjects.has(object.parent)) continue
    runtime.add(
      makeTreeMeshNode(object, inverseTreeMatrix, {
        castShadow: options.castShadow,
        receiveShadow: options.receiveShadow,
      })
    )
  }

  return runtime
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
    this.asset = null
    this.runtime = null
    this.meshes = []
    this.generation = 0
    this.updateRegistered = false
    this.onUpdate = delta => {
      if (!this.asset || this.asset.updateOwner !== this) return
      this.asset.elapsedTime += delta
      this.asset.tree.update(this.asset.elapsedTime)
    }
  }

  mount() {
    this.needsRebuild = false
    if (!this.ctx.world.network.isClient) return
    const generation = ++this.generation
    this.loadTree(generation)
  }

  async loadTree(generation) {
    let asset
    try {
      const [{ Tree, TreePreset }, { applyTreeTextureDefaults }] = await Promise.all([
        import('../libs/ez-tree/index.js'),
        import('../libs/ez-tree/textures.js'),
      ])
      if (!this.mounted || generation !== this.generation) return

      const preset = TreePreset[this._preset]
      if (!preset) {
        throw new Error(`unknown preset "${this._preset}" (available: ${Object.keys(TreePreset).join(', ')})`)
      }

      asset = acquireTreeAsset(
        this.ctx.world,
        Tree,
        this._preset,
        preset,
        this._options,
        this._seed,
        applyTreeTextureDefaults,
        this
      )
      if (!this.mounted || generation !== this.generation) {
        releaseTreeAsset(this.ctx.world, asset, this)
        return
      }

      const runtime = createTreeRuntime(asset, {
        castShadow: this._castShadow,
        receiveShadow: this._receiveShadow,
      })
      this.asset = asset
      this.tree = asset.tree
      this.meshes = asset.meshes
      this.runtime = runtime
      this.add(runtime)

      if (!this.updateRegistered) {
        this.ctx.entity.on('update', this.onUpdate)
        this.updateRegistered = true
      }
    } catch (error) {
      if (this.runtime?.parent === this) this.remove(this.runtime)
      if (this.asset === asset) {
        this.asset = null
        this.tree = null
        this.runtime = null
        this.meshes = []
      }
      if (this.updateRegistered) {
        this.ctx?.entity?.off('update', this.onUpdate)
        this.updateRegistered = false
      }
      if (asset) releaseTreeAsset(this.ctx.world, asset, this)
      if (this.mounted && generation === this.generation) {
        console.error('[tree] failed to generate tree', error)
      }
    }
  }

  commit() {
    if (!this.needsRebuild) return
    this.unmount()
    this.mount()
  }

  unmount() {
    this.generation++
    if (this.updateRegistered) {
      this.ctx?.entity?.off('update', this.onUpdate)
      this.updateRegistered = false
    }
    if (this.runtime) this.remove(this.runtime)
    if (this.asset) releaseTreeAsset(this.ctx.world, this.asset, this)
    this.runtime = null
    this.asset = null
    this.tree = null
    this.meshes = []
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
    const sourceChildren = source.children
    source.children = sourceChildren.filter(child => !child.isTreeRuntime)
    try {
      super.copy(source, recursive)
    } finally {
      source.children = sourceChildren
    }
    this._preset = source._preset
    this._seed = source._seed
    this._options = cloneDeep(source._options)
    this._castShadow = source._castShadow
    this._receiveShadow = source._receiveShadow
    this.tree = null
    this.asset = null
    this.runtime = null
    this.meshes = []
    this.generation = 0
    this.updateRegistered = false
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
      Object.defineProperty(proxy, 'children', {
        get() {
          return self.children.filter(child => !child.isTreeRuntime).map(child => child.getProxy())
        },
      })
      this.proxy = proxy
    }
    return this.proxy
  }
}
