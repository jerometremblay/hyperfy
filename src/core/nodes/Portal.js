import * as THREE from '../extras/three'
import { Node } from './Node'
import { portalFields } from '../extras/portalFields'
import { checkPortalDestination } from '../extras/portalDestination'

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
    this.destinationError = ''
    this.nextDestinationCheck = 0
    this.width = data.width ?? 1.6
    this.height = data.height ?? 2.4
    this.resolution = data.resolution ?? 256
    this.updateRate = data.updateRate ?? 15
    this.doubleside = data.doubleside ?? false
  }

  mount() {
    this.needsRebuild = false
    const world = this.ctx.world
    if (!world.graphics || world.isPreview) return
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
        status: { value: null },
        showStatus: { value: false },
        inactive: { value: new THREE.Color('#d3d3d3') },
      },
      vertexShader: `
        uniform mat4 textureMatrix;
        varying vec4 portalUV;
        varying vec2 surfaceUV;
        void main() {
          surfaceUV = uv;
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
        uniform sampler2D status;
        uniform bool showStatus;
        varying vec2 surfaceUV;
        varying vec4 portalUV;
        void main() {
          if (!doubleside && !gl_FrontFacing) {
            gl_FragColor = vec4(inactive, 1.0);
          } else if (showStatus) {
            vec2 statusUV = vec2(gl_FrontFacing ? surfaceUV.x : 1.0 - surfaceUV.x, surfaceUV.y);
            gl_FragColor = texture2D(status, statusUV);
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
    this.cancelDestinationCheck()
    this.statusTexture?.dispose()
    this.statusTexture = null
    this.statusMessage = null
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
    if (this._target === value) return
    this._target = value
    this.cancelDestinationCheck()
  }

  get url() {
    return this._url
  }
  set url(value) {
    if (typeof value !== 'string') throw new Error('[portal] url must be a string')
    const url = value.trim()
    if (url && !['http:', 'https:'].includes(new URL(url).protocol))
      throw new Error('[portal] url must be an HTTP(S) URL')
    if (this._url === url) return
    this._url = url
    this.cancelDestinationCheck()
  }

  cancelDestinationCheck() {
    this.destinationController?.abort()
    this.destinationController = null
    this.destinationCheck = null
    this.nextDestinationCheck = 0
    this.destinationError = ''
  }

  setStatus(message) {
    if (!this.mesh || this.statusMessage === message) return
    this.statusMessage = message
    this.mesh.material.uniforms.showStatus.value = !!message
    if (!message || typeof document === 'undefined') return
    if (!this.statusTexture) {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 768
      this.statusTexture = new THREE.CanvasTexture(canvas)
      this.statusTexture.colorSpace = THREE.SRGBColorSpace
      this.mesh.material.uniforms.status.value = this.statusTexture
    }
    const canvas = this.statusTexture.image
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#332329'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px sans-serif'
    ctx.fillText(message === 'Checking destination…' ? 'Please wait' : 'Destination unavailable', 256, 320)
    ctx.font = '26px sans-serif'
    const words = message.split(' ')
    let line = ''
    let y = 380
    for (const word of words) {
      const next = line ? `${line} ${word}` : word
      if (ctx.measureText(next).width > 440 && line) {
        ctx.fillText(line, 256, y)
        y += 36
        line = word
      } else line = next
    }
    ctx.fillText(line, 256, y)
    this.statusTexture.needsUpdate = true
  }

  checkRemoteDestination() {
    if (this.destinationCheck) return this.destinationCheck
    const controller = new AbortController()
    this.destinationController = controller
    this.setStatus('Checking destination…')
    const timeout = setTimeout(() => controller.abort(), 5000)
    this.destinationCheck = checkPortalDestination(this.url, this.target, globalThis.fetch, controller.signal)
      .then(error => {
        if (this.destinationController !== controller || !this.mesh) return false
        this.destinationError = error
        this.nextDestinationCheck = performance.now() + 30000
        this.setStatus(error)
        return !error
      })
      .finally(() => {
        clearTimeout(timeout)
        if (this.destinationController === controller) {
          this.destinationController = null
          this.destinationCheck = null
        }
      })
    return this.destinationCheck
  }

  refreshDestinationStatus() {
    if (this.url) {
      if (performance.now() >= this.nextDestinationCheck) this.checkRemoteDestination()
    } else {
      const destination = [...this.ctx.world.graphics.portals].find(
        portal => portal !== this && portal.portalId === this.target && !portal.ctx.entity?.data.mover
      )
      this.setStatus(this.target ? (destination ? '' : 'Destination portal not found') : 'No destination configured')
    }
  }

  update() {
    const world = this.ctx.world
    this.refreshDestinationStatus()
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
      if (this.pendingTravel) return
      const url = this.url
      const target = this.target
      this.pendingTravel = this.checkRemoteDestination()
        .then(available => {
          if (!available || !this.mesh || this.url !== url || this.target !== target || this.ctx.entity?.data.mover)
            return
          const destination = new URL(url)
          if (target) destination.searchParams.set('portalId', target)
          world.apps.worldMethods.open(this.ctx.entity, destination.href, false)
        })
        .finally(() => {
          this.pendingTravel = null
        })
      return this.pendingTravel
    }
    if (!this.target || this.target === this.portalId) return
    const destination = [...world.graphics.portals].find(
      portal => portal !== this && portal.portalId === this.target && !portal.ctx.entity?.data.mover
    )
    if (!destination) {
      this.setStatus('Destination portal not found')
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
