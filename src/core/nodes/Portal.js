import * as THREE from '../extras/three'
import { Node } from './Node'
import { portalFields } from '../extras/portalFields'

function createView() {
  return {
    camera: new THREE.PerspectiveCamera(),
    textureMatrix: new THREE.Matrix4(),
    target: new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }),
    lastRender: -Infinity,
    disposed: false,
  }
}

/** A doorway with native travel and per-eye destination previews. */
export class Portal extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'portal'
    this.portalId = data.portalId || ''
    this.target = data.target || ''
    this.url = data.url || ''
    this.appConfig = data.appConfig ?? false
    this.previousPosition = new THREE.Vector3()
    this.hasPreviousPosition = false
    this.inside = false
    this.width = data.width ?? 1.6
    this.height = data.height ?? 2.4
    this.resolution = data.resolution ?? 256
    this.updateRate = data.updateRate ?? 15
    this.doubleside = data.doubleside ?? false
  }

  mount() {
    this.needsRebuild = false
    const world = this.ctx.world
    if (!world.graphics) return
    if (!this.portalId) this.portalId = this.ctx.entity?.data.id || this.id
    if (this.appConfig && this.ctx.entity) {
      const entity = this.ctx.entity
      const props = entity.blueprint.props
      this.url = props.destination || ''
      this.target = props.destinationPortalId || ''
      this.doubleside = props.doubleside === true || props.doubleside === 'true'
      this.resolution = props.resolution === 'max' ? 'max' : Number(props.resolution ?? 256)
      this.updateRate = Number(props.updateRate ?? 15)
      entity.fields = portalFields(this.portalId)
      entity.onFields?.(entity.fields)
    }
    world.setHot(this, true)
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
        doubleside: { value: this.doubleside },
        inactive: { value: new THREE.Color('#d3d3d3') },
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
        uniform bool doubleside;
        uniform vec3 inactive;
        varying vec4 portalUV;
        void main() {
          if (!doubleside && !gl_FrontFacing) {
            gl_FragColor = vec4(inactive, 1.0);
          } else {
            gl_FragColor = linked ? vec4(texture2DProj(preview, portalUV).rgb, 1.0)
                                 : vec4(fallback, 1.0);
          }
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
    if (didMove) {
      this.hasPreviousPosition = false
      this.inside = true
    }
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
    world.setHot(this, false)
    this.hasPreviousPosition = false
    this.inside = false
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
    this.url = source.url
    this.appConfig = source.appConfig
    this.width = source.width
    this.height = source.height
    this.resolution = source.resolution
    this.updateRate = source.updateRate
    this.doubleside = source.doubleside
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

  get url() {
    return this._url
  }
  set url(value) {
    if (typeof value !== 'string') throw new Error('[portal] url must be a string')
    const url = value.trim()
    if (url && !['http:', 'https:'].includes(new URL(url).protocol))
      throw new Error('[portal] url must be an HTTP(S) URL')
    this._url = url
  }

  update() {
    const world = this.ctx.world
    const player = world.entities.player
    const moving = this.ctx.entity ? !!this.ctx.entity.data.mover : this.ctx.moving
    if (moving) {
      this.hasPreviousPosition = false
      this.inside = true
      return
    }
    if (!player?.controller?.controller) return
    const methods = world.apps.worldMethods
    if (methods.getQueryParam(this.ctx.entity, 'portalId') === this.portalId) {
      this.arrive(player)
      methods.setQueryParam(this.ctx.entity, 'portalId', null)
      return
    }
    const inverse = new THREE.Matrix4().copy(this.matrixWorld).invert()
    const position = player.base.position.clone().applyMatrix4(inverse)
    let entryPosition = position
    const inVolume =
      Math.abs(position.x) <= this.width / 2 &&
      Math.abs(position.y) <= this.height / 2 + 0.1 &&
      Math.abs(position.z) <= 0.3
    let entered = inVolume
    // Catch a fast step crossing the aperture even if both samples miss its volume.
    if (this.hasPreviousPosition && this.previousPosition.z * position.z < 0) {
      const fraction = this.previousPosition.z / (this.previousPosition.z - position.z)
      const crossing = this.previousPosition.clone().lerp(position, fraction)
      if (Math.abs(crossing.x) <= this.width / 2 && Math.abs(crossing.y) <= this.height / 2 + 0.1) {
        entered = true
        entryPosition = crossing
        entryPosition.z = this.previousPosition.z
      }
    }
    if (entered && !this.inside && (this.doubleside || entryPosition.z >= 0)) {
      this.travel(player, entryPosition, inverse)
    }
    this.inside = inVolume
    this.previousPosition.copy(position)
    this.hasPreviousPosition = true
  }

  travel(player, position, inverse) {
    if (!this.doubleside && position.z < 0) return
    const world = this.ctx.world
    if (this.url) {
      const destination = new URL(this.url)
      if (this.target) destination.searchParams.set('portalId', this.target)
      world.apps.worldMethods.open(this.ctx.entity, destination.href, false)
      return
    }
    if (!this.target || this.target === this.portalId) return
    const destination = [...world.graphics.portals].find(portal => portal !== this && portal.portalId === this.target)
    if (!destination) {
      world.emit('toast', 'Destination portal not found')
      return
    }
    const direction = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(world.camera.getWorldQuaternion(new THREE.Quaternion()))
      .transformDirection(inverse)
    destination.arrive(player, position, direction)
  }

  arrive(player, sourcePosition, sourceDirection) {
    const position = sourcePosition?.clone() || new THREE.Vector3(0, -this.height / 2, 1)
    const direction = sourceDirection?.clone() || new THREE.Vector3(0, 0, -1)
    const entrySide = position.z >= 0 ? 1 : -1
    const side = this.doubleside ? entrySide : 1
    const scale = new THREE.Vector3().setFromMatrixScale(this.matrixWorld)
    position.x = -position.x
    position.z = side * Math.max(1, 0.6 / Math.abs(scale.z))
    position.applyMatrix4(this.matrixWorld)
    direction.x = -direction.x
    direction.z = !this.doubleside && entrySide < 0 ? direction.z : -direction.z
    direction.transformDirection(this.matrixWorld)
    player.teleport({ position, rotationY: Math.atan2(-direction.x, -direction.z) })
    this.inside = true
    this.hasPreviousPosition = false
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

  get doubleside() {
    return this._doubleside
  }
  set doubleside(value) {
    if (typeof value !== 'boolean') throw new Error('[portal] doubleside must be a boolean')
    if (this._doubleside === value) return
    this._doubleside = value
    if (this.mesh) {
      this.mesh.material.uniforms.doubleside.value = value
    }
  }

  get resolution() {
    return this._resolution
  }
  set resolution(value) {
    if (![256, 512, 1024, 'max'].includes(value)) throw new Error('[portal] resolution must be 256, 512, 1024, or max')
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
      for (const key of ['portalId', 'target', 'url', 'width', 'height', 'resolution', 'updateRate', 'doubleside']) {
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
