import { isBoolean, isNumber, isString } from 'lodash-es'
import * as THREE from '../extras/three'

import { Node } from './Node'

const defaults = {
  src: null,
  width: 2.4,
  height: 1.35,
  interval: 1000,
  doubleside: false,
}

export class Browser extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'browser'
    this.src = data.src
    this.width = data.width
    this.height = data.height
    this.interval = data.interval
    this.doubleside = data.doubleside
  }

  mount() {
    this.build()
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.build()
      return
    }
    if (didMove) {
      if (this.mesh) this.mesh.matrixWorld.copy(this.matrixWorld)
      if (this.sItem) this.ctx.world.stage.octree.move(this.sItem)
    }
  }

  unmount() {
    this.unbuild()
  }

  build() {
    this.needsRebuild = false
    if (this.ctx.world.network.isServer) return
    this.unbuild()

    const geometry = new THREE.PlaneGeometry(this._width, this._height)
    const material = new THREE.MeshBasicMaterial({
      color: 'black',
      side: this._doubleside ? THREE.DoubleSide : THREE.FrontSide,
    })
    this.ctx.world.setupMaterial(material)
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.matrixWorld.copy(this.matrixWorld)
    this.mesh.matrixAutoUpdate = false
    this.mesh.matrixWorldAutoUpdate = false
    this.ctx.world.stage.scene.add(this.mesh)
    this.sItem = {
      matrix: this.matrixWorld,
      geometry,
      material,
      getEntity: () => this.ctx.entity,
      node: this,
    }
    this.ctx.world.stage.octree.insert(this.sItem)

    if (!this._src) return
    const apiUrl = this.ctx.world.network.apiUrl
    if (!apiUrl) return

    const image = document.createElement('img')
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => {
      if (this.image !== image) return
      if (!this.texture) {
        this.texture = new THREE.Texture(image)
        this.texture.colorSpace = THREE.SRGBColorSpace
        this.texture.anisotropy = this.ctx.world.graphics.maxAnisotropy
        this.mesh.material.map = this.texture
        this.mesh.material.needsUpdate = true
      }
      this.texture.needsUpdate = true
    }
    image.onerror = () => {
      if (this.image === image) this.loadError = true
    }
    this.image = image
    this.loadImage = () => {
      const entityId = this.ctx.entity.data.id
      const url = `${apiUrl}/browser/screenshot?entityId=${encodeURIComponent(entityId)}&url=${encodeURIComponent(this._src)}&t=${Date.now()}`
      image.src = url
    }
    this.loadImage()
    this.poller = setInterval(this.loadImage, this._interval)
  }

  unbuild() {
    if (this.poller) {
      clearInterval(this.poller)
      this.poller = null
    }
    if (this.image) {
      this.image.onload = null
      this.image.onerror = null
      this.image = null
    }
    this.loadImage = null
    this.loadError = false
    if (this.mesh) {
      this.ctx.world.stage.scene.remove(this.mesh)
      this.mesh.material.dispose()
      this.mesh.geometry.dispose()
      this.mesh = null
    }
    if (this.texture) {
      this.texture.dispose()
      this.texture = null
    }
    if (this.sItem) {
      this.ctx.world.stage.octree.remove(this.sItem)
      this.sItem = null
    }
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this._src = source._src
    this._width = source._width
    this._height = source._height
    this._interval = source._interval
    this._doubleside = source._doubleside
    return this
  }

  get src() {
    return this._src
  }

  set src(value = defaults.src) {
    if (value !== null && !isString(value)) {
      throw new Error('[browser] src not null or string')
    }
    if (this._src === value) return
    this._src = value
    this.needsRebuild = true
    this.setDirty()
  }

  get width() {
    return this._width
  }

  set width(value = defaults.width) {
    if (!isNumber(value) || value <= 0) {
      throw new Error('[browser] width must be a positive number')
    }
    if (this._width === value) return
    this._width = value
    this.needsRebuild = true
    this.setDirty()
  }

  get height() {
    return this._height
  }

  set height(value = defaults.height) {
    if (!isNumber(value) || value <= 0) {
      throw new Error('[browser] height must be a positive number')
    }
    if (this._height === value) return
    this._height = value
    this.needsRebuild = true
    this.setDirty()
  }

  get interval() {
    return this._interval
  }

  set interval(value = defaults.interval) {
    if (!Number.isInteger(value) || value < 100) {
      throw new Error('[browser] interval must be an integer of at least 100ms')
    }
    if (this._interval === value) return
    this._interval = value
    this.needsRebuild = true
    this.setDirty()
  }

  get doubleside() {
    return this._doubleside
  }

  set doubleside(value = defaults.doubleside) {
    if (!isBoolean(value)) {
      throw new Error('[browser] doubleside not a boolean')
    }
    if (this._doubleside === value) return
    this._doubleside = value
    this.needsRebuild = true
    this.setDirty()
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      let proxy = {
        get src() {
          return self.src
        },
        set src(value) {
          self.src = value
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
        get interval() {
          return self.interval
        },
        set interval(value) {
          self.interval = value
        },
        get doubleside() {
          return self.doubleside
        },
        set doubleside(value) {
          self.doubleside = value
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy()))
      this.proxy = proxy
    }
    return this.proxy
  }
}
