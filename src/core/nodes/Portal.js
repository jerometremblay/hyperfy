import * as THREE from '../extras/three'
import { Node } from './Node'

function createView() {
  return {
    camera: new THREE.PerspectiveCamera(),
    textureMatrix: new THREE.Matrix4(),
    target: new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }),
    lastRender: -Infinity,
    disposed: false,
  }
}

/** A same-world doorway. The graphics system renders its destination per eye. */
export class Portal extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'portal'
    this.portalId = data.portalId || ''
    this.target = data.target || ''
    this.width = data.width ?? 1.6
    this.height = data.height ?? 2.4
    this.resolution = data.resolution ?? 256
    this.updateRate = data.updateRate ?? 15
  }

  mount() {
    this.needsRebuild = false
    const world = this.ctx.world
    if (!world.graphics) return
    const geometry = new THREE.PlaneGeometry(this.width, this.height)
    this.view = createView()
    this.views = new Map()
    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        preview: { value: this.view.target.texture },
        textureMatrix: { value: this.view.textureMatrix },
        linked: { value: false },
        fallback: { value: new THREE.Color('#46a9b8') },
      },
      vertexShader: `
        uniform mat4 textureMatrix;
        varying vec4 portalUV;
        void main() {
          portalUV = textureMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D preview;
        uniform bool linked;
        uniform vec3 fallback;
        varying vec4 portalUV;
        void main() {
          gl_FragColor = linked ? vec4(texture2DProj(preview, portalUV).rgb, 1.0)
                               : vec4(fallback, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.matrixAutoUpdate = false
    this.mesh.matrixWorldAutoUpdate = false
    this.mesh.matrixWorld.copy(this.matrixWorld)
    this.mesh.onBeforeRender = (_renderer, _scene, camera) => world.graphics.renderPortal(this, camera)
    world.stage.scene.add(this.mesh)
    world.graphics.portals.add(this)
    this.sItem = {
      matrix: this.matrixWorld,
      geometry,
      material,
      getEntity: () => this.ctx.entity,
      node: this,
    }
    world.stage.octree.insert(this.sItem)
  }

  getView(eye) {
    if (!this.views.has(eye)) this.views.set(eye, this.views.size ? createView() : this.view)
    return this.views.get(eye)
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
    } else if (didMove && this.mesh) {
      this.mesh.matrixWorld.copy(this.matrixWorld)
      this.ctx.world.stage.octree.move(this.sItem)
    }
  }

  unmount() {
    if (!this.mesh) return
    const world = this.ctx.world
    world.graphics.portals.delete(this)
    world.stage.scene.remove(this.mesh)
    world.stage.octree.remove(this.sItem)
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
    for (const view of new Set([this.view, ...this.views.values()])) {
      view.target.dispose()
      view.disposed = true
      if (!view.sparkUpdating) view.spark?.dispose()
    }
    this.views.clear()
    this.mesh = null
    this.view = null
    this.sItem = null
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this.portalId = source.portalId
    this.target = source.target
    this.width = source.width
    this.height = source.height
    this.resolution = source.resolution
    this.updateRate = source.updateRate
    return this
  }

  get portalId() {
    return this._portalId
  }
  set portalId(value) {
    if (typeof value !== 'string') throw new Error('[portal] portalId must be a string')
    this._portalId = value
  }

  get target() {
    return this._target
  }
  set target(value) {
    if (typeof value !== 'string') throw new Error('[portal] target must be a string')
    this._target = value
  }

  get width() {
    return this._width
  }
  set width(value) {
    if (!Number.isFinite(value) || value <= 0) throw new Error('[portal] width must be positive')
    if (this._width === value) return
    this._width = value
    this.needsRebuild = true
    this.setDirty()
  }

  get height() {
    return this._height
  }
  set height(value) {
    if (!Number.isFinite(value) || value <= 0) throw new Error('[portal] height must be positive')
    if (this._height === value) return
    this._height = value
    this.needsRebuild = true
    this.setDirty()
  }

  get resolution() {
    return this._resolution
  }
  set resolution(value) {
    if (![256, 512, 1024].includes(value)) throw new Error('[portal] resolution must be 256, 512, or 1024')
    this._resolution = value
  }

  get updateRate() {
    return this._updateRate
  }
  set updateRate(value) {
    if (![0, 15, 30].includes(value)) throw new Error('[portal] updateRate must be 0 (every frame), 15, or 30')
    this._updateRate = value
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      const proxy = {}
      for (const key of ['portalId', 'target', 'width', 'height', 'resolution', 'updateRate']) {
        Object.defineProperty(proxy, key, {
          enumerable: true,
          get: () => self[key],
          set: value => {
            self[key] = value
          },
        })
      }
      this.proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy()))
    }
    return this.proxy
  }
}
