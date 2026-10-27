import * as THREE from '../extras/three'
import { isBoolean } from 'lodash-es'

import { Node, resolveValueRef, secureRef } from './Node'
import { getTrianglesFromGeometry } from '../extras/getTrianglesFromGeometry'
import { getTextureBytesFromMaterial } from '../extras/getTextureBytesFromMaterial'

const _v1 = new THREE.Vector3()
const _v2 = new THREE.Vector3()

const defaults = {
  type: 'box',
  width: 1,
  height: 1,
  depth: 1,
  radius: 0.5,
  geometry: null,
  material: null,
  linked: true,
  castShadow: true,
  receiveShadow: true,
  visible: true, // DEPRECATED: use Node.active
}

const types = ['box', 'sphere', 'geometry']

// Box and sphere geometries are shared by size. A mounted mesh holds its geometry, so nothing renders an evicted one;
// at most GEOMETRY_IDLE_LIMIT unused ones stay cached, least recently released first out and disposed then, so a script
// that keeps changing a size cannot grow the cache without bound. A geometry's uuid is its shape and size, so one made
// again after eviction keeps the linked Model and the material edits kept under that id.
const GEOMETRY_IDLE_LIMIT = 1024
class SharedGeometries {
  constructor(shape, create) {
    this.shape = shape
    this.create = create
    this.used = new Map()
    this.idle = new Map()
  }

  acquire(key) {
    let entry = this.used.get(key)
    if (!entry) {
      entry = this.idle.get(key)
      if (entry) {
        this.idle.delete(key)
      } else {
        entry = { key, geometry: this.create(key), users: 0 }
        entry.geometry.uuid = `mesh-${this.shape}:${key}`
      }
      this.used.set(key, entry)
    }
    entry.users++
    return entry
  }

  release(entry) {
    if (--entry.users > 0) return
    this.used.delete(entry.key)
    this.idle.set(entry.key, entry)
    if (this.idle.size > GEOMETRY_IDLE_LIMIT) {
      const [oldest, evicted] = this.idle.entries().next().value
      this.idle.delete(oldest)
      evicted.geometry.dispose()
    }
  }
}

const boxes = new SharedGeometries('box', key => new THREE.BoxGeometry(...key.split(',').map(Number)))
const spheres = new SharedGeometries('sphere', key => new THREE.SphereGeometry(Number(key), 16, 12))

// a primitive finite number: a Number object could mint cache keys through its own toString
const finiteNumber = value => typeof value === 'number' && Number.isFinite(value)

export class Mesh extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'mesh'

    this.type = data.type
    this.width = data.width
    this.height = data.height
    this.depth = data.depth
    this.radius = data.radius
    this.geometry = data.geometry
    this.material = data.material
    this.linked = data.linked
    this.castShadow = data.castShadow
    this.receiveShadow = data.receiveShadow
    this.visible = data.visible
  }

  mount() {
    // a second mount replaces the first, so neither its insertion nor its geometry user is left behind
    if (this.handle || this.sItem || this.shared) this.unmount()
    this.needsRebuild = false
    if (!this._geometry) return
    let geometry
    if (this._type === 'box') {
      this.shared = { cache: boxes, entry: boxes.acquire(`${this._width},${this._height},${this._depth}`) }
      geometry = this.shared.entry.geometry
    } else if (this._type === 'sphere') {
      this.shared = { cache: spheres, entry: spheres.acquire(`${this._radius}`) }
      geometry = this.shared.entry.geometry
    } else if (this._type === 'geometry') {
      geometry = this._geometry
    }
    try {
      this.insertGeometry(geometry)
    } catch (err) {
      this.releaseShared()
      throw err
    }
  }

  insertGeometry(geometry) {
    if (this._visible) {
      this.handle = this.ctx.world.stage.insert({
        geometry,
        material: this._material,
        linked: this._linked,
        castShadow: this._castShadow,
        receiveShadow: this._receiveShadow,
        matrix: this.matrixWorld,
        node: this,
      })
    } else {
      const sItem = {
        matrix: this.matrixWorld,
        geometry,
        material: this._material,
        getEntity: () => this.ctx.entity,
        node: this,
      }
      try {
        this.ctx.world.stage.octree.insert(sItem)
      } catch (err) {
        this.ctx.world.stage.octree.remove(sItem)
        throw err
      }
      this.sItem = sItem
    }
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      if (this.handle) {
        this.handle.move(this.matrixWorld)
      }
      if (this.sItem) {
        this.ctx.world.stage.octree.move(this.sItem)
      }
    }
  }

  unmount() {
    this.handle?.destroy()
    if (this.sItem) {
      this.ctx.world.stage.octree.remove(this.sItem)
      this.sItem = null
    }
    this.handle = null
    this.releaseShared()
  }

  releaseShared() {
    if (!this.shared) return
    this.shared.cache.release(this.shared.entry)
    this.shared = null
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this._type = source._type
    this._width = source._width
    this._height = source._height
    this._depth = source._depth
    this._radius = source._radius
    this._geometry = source._geometry
    this._material = source._material
    this._linked = source._linked
    this._castShadow = source._castShadow
    this._receiveShadow = source._receiveShadow
    this._visible = source._visible
    return this
  }

  applyStats(stats) {
    if (this._geometry && !stats.geometries.has(this._geometry.uuid)) {
      stats.geometries.add(this._geometry.uuid)
      stats.triangles += getTrianglesFromGeometry(this._geometry)
    }
    if (this._material && !stats.materials.has(this._material.uuid)) {
      stats.materials.add(this._material.uuid)
      stats.textureBytes += getTextureBytesFromMaterial(this._material)
    }
  }

  get type() {
    return this._type
  }

  set type(value = defaults.type) {
    if (!isType(value)) {
      throw new Error('[mesh] type invalid')
    }
    if (this._type === value) return
    this._type = value
    if (this.handle) {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get width() {
    return this._width
  }

  set width(value = defaults.width) {
    if (!finiteNumber(value)) {
      throw new Error('[mesh] width not a number')
    }
    if (this._width === value) return
    this._width = value
    if (this.handle && this._type === 'box') {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get height() {
    return this._height
  }

  set height(value = defaults.height) {
    if (!finiteNumber(value)) {
      throw new Error('[mesh] height not a number')
    }
    if (this._height === value) return
    this._height = value
    if (this.handle && this._type === 'box') {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get depth() {
    return this._depth
  }

  set depth(value = defaults.depth) {
    if (!finiteNumber(value)) {
      throw new Error('[mesh] depth not a number')
    }
    if (this._depth === value) return
    this._depth = value
    if (this.handle && this._type === 'box') {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  setSize(width, height, depth) {
    this.width = width
    this.height = height
    this.depth = depth
  }

  get radius() {
    return this._radius
  }

  set radius(value = defaults.radius) {
    if (!finiteNumber(value)) {
      throw new Error('[mesh] radius not a number')
    }
    if (this._radius === value) return
    this._radius = value
    if (this.handle && this._type === 'sphere') {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get geometry() {
    return secureRef({}, () => this._geometry)
  }

  set geometry(value = defaults.geometry) {
    if (value && !value.isBufferGeometry) {
      throw new Error('[mesh] geometry invalid')
    }
    if (this._geometry === value) return
    this._geometry = value
    this.needsRebuild = true
    this.setDirty()
  }

  get material() {
    return this.handle?.material
  }

  set material(value = defaults.material) {
    if (value && !value.isMaterial) {
      throw new Error('[mesh] material invalid')
    }
    if (this._material === value) return
    this._material = value
    this.needsRebuild = true
    this.setDirty()
  }

  get linked() {
    return this._linked
  }

  set linked(value = defaults.linked) {
    if (!isBoolean(value)) {
      throw new Error('[mesh] linked not a boolean')
    }
    if (this._linked === value) return
    this._linked = value
    this.needsRebuild = true
    this.setDirty()
  }

  get castShadow() {
    return this._castShadow
  }

  set castShadow(value = defaults.castShadow) {
    if (!isBoolean(value)) {
      throw new Error('[mesh] castShadow not a boolean')
    }
    if (this._castShadow === value) return
    this._castShadow = value
    if (this.handle) {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get receiveShadow() {
    return this._receiveShadow
  }

  set receiveShadow(value = defaults.receiveShadow) {
    if (!isBoolean(value)) {
      throw new Error('[mesh] receiveShadow not a boolean')
    }
    if (this._receiveShadow === value) return
    this._receiveShadow = value
    if (this.handle) {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get visible() {
    return this._visible
  }

  set visible(value = defaults.visible) {
    if (!isBoolean(value)) {
      throw new Error('[mesh] visible not a boolean')
    }
    if (this._visible === value) return
    this._visible = value
    this.needsRebuild = true
    this.setDirty()
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      let proxy = {
        get type() {
          return self.type
        },
        set type(value) {
          self.type = value
        },
        get width() {
          return self.width
        },
        set width(value) {
          self.width = value
        },
        get height() {
          return self.height
        },
        set height(value) {
          self.height = value
        },
        get depth() {
          return self.depth
        },
        set depth(value) {
          self.depth = value
        },
        setSize(width, height, depth) {
          self.setSize(width, height, depth)
        },
        get radius() {
          return self.radius
        },
        set radius(value) {
          self.radius = value
        },
        get geometry() {
          return self.geometry
        },
        set geometry(value) {
          // scripts may pass null, a geometry ref from another node, or a real geometry.
          // a ref is resolved here, once, so the node only ever stores the resolved geometry
          if (value != null && !(value instanceof THREE.BufferGeometry)) {
            const ref = resolveValueRef(value)
            if (!ref) {
              console.error('[mesh] geometry invalid')
              return
            }
            value = ref.value
          }
          self.geometry = value
        },
        get material() {
          return self.material
        },
        set material(value) {
          throw new Error('[mesh] set material not supported')
          // if (!value) throw new Error('[mesh] material cannot be unset')
          // self.ctx.world._allowMaterial = true
          // self.material = value._ref
          // self.ctx.world._allowMaterial = false
          // self.needsRebuild = true
          // self.setDirty()
        },
        get linked() {
          return self.linked
        },
        set linked(value) {
          self.linked = value
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
        get visible() {
          return self.visible
        },
        set visible(value) {
          self.visible = value
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}

function isType(value) {
  return types.includes(value)
}
