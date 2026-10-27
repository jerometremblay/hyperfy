import { createLogOnce } from '../extras/logOnce.js'
import { callForScript } from '../extras/scriptValues'
import * as THREE from '../extras/three'
import {
  readVec3,
  writeVec3,
  warnOnce,
  vec3ToPx,
  pxToVec3,
  scratchPxVec3,
  scratchPxExtVec3,
} from '../extras/physxConvert.js'
import { isNumber, isBoolean, isString, isFunction } from 'lodash-es'

import { DEG2RAD } from '../extras/general'
import { finiteNumber, lengthOk, positionOk } from '../extras/physicsValidate.js'

import { Node } from './Node'
import { Layers } from '../extras/Layers'

const stepOrigin = new THREE.Vector3()
const stepDirection = new THREE.Vector3()
const capsuleRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)

const warnController = createLogOnce()

const layers = ['environment', 'prop', 'player', 'tool']

const _v1 = new THREE.Vector3()
const _v2 = new THREE.Vector3()

const defaults = {
  radius: 0.4,
  height: 1,
  visible: false,
  layer: 'environment',
  tag: null,
  onContactStart: null,
  onContactEnd: null,
}

export class Controller extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'controller'

    this.radius = data.radius
    this.height = data.height
    this.visible = data.visible
    this.layer = data.layer
    this.tag = data.tag
    this.onContactStart = data.onContactStart
    this.onContactEnd = data.onContactEnd
  }

  mount() {
    if (this.ctx.world.isPreview) return
    this.needsRebuild = false
    if (this._visible) {
      const geometry = new THREE.CapsuleGeometry(this._radius, this._height, 2, 8)
      geometry.translate(0, this._height / 2 + this._radius, 0)
      geometry.computeBoundsTree()
      const material = new THREE.MeshBasicMaterial({ color: '#00ff88', wireframe: true, depthTest: false })
      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.receiveShadow = true
      this.mesh.castShadow = true
      this.mesh.matrixAutoUpdate = false
      this.mesh.matrixWorldAutoUpdate = false
      this.mesh.matrix.copy(this.matrix)
      this.mesh.matrixWorld.copy(this.matrixWorld)
      this.mesh.node = this
      this.ctx.world.stage.scene.add(this.mesh)
    }
    this.controller = null
    // a capsule or a foot position outside the physics range corrupts the shared scene (a controller placed at 1e30
    // turns unrelated bodies NaN without touching them), so it gets no controller; teleport still moves the node
    if (!lengthOk(this._radius) || !lengthOk(this._height) || !positionOk(this.getWorldPosition())) {
      warnController(this, 'range', '[controller] radius, height or position outside the physics range; no controller')
      return
    }
    const desc = new PHYSX.PxCapsuleControllerDesc()
    try {
      desc.height = this._height
      desc.radius = this._radius
      desc.climbingMode = PHYSX.PxCapsuleClimbingModeEnum.eCONSTRAINED
      desc.slopeLimit = Math.cos(60 * DEG2RAD) // 60 degrees
      // PhysX reports the contact before asking for its behavior. Let the
      // rounded foot slide off steep edges that are too high to step onto.
      // Reachable stair risers and walkable ramps retain the default grip.
      let hitShape = 0
      let slide = false
      this.hitReport = new PHYSX.PxUserControllerHitReportImpl()
      this.hitReport.onShapeHit = ptr => {
        const hit = PHYSX.wrapPointer(ptr, PHYSX.PxControllerShapeHit)
        hitShape = hit.shape.ptr
        slide =
          hit.worldNormal.y < Math.cos(60 * DEG2RAD) &&
          hit.worldPos.y > this.controller.getFootPosition().y + this.controller.getStepOffset()
      }
      this.hitReport.onControllerHit = () => {}
      this.hitReport.onObstacleHit = () => {}
      this.behavior = new PHYSX.PxControllerBehaviorCallbackImpl()
      this.behavior.getShapeBehaviorFlags = ptr => (ptr === hitShape && slide ? PHYSX.eCCT_SLIDE : 0)
      this.behavior.getControllerBehaviorFlags = () => 0
      this.behavior.getObstacleBehaviorFlags = () => 0
      desc.reportCallback = this.hitReport
      desc.behaviorCallback = this.behavior
      desc.material = this.ctx.world.physics.defaultMaterial
      desc.contactOffset = 0.02 // Keep the skin small relative to the 0.3m player radius.
      desc.stepOffset = 0.5 // PhysX default = 0.5m
      this.stepGeometry = new PHYSX.PxCapsuleGeometry(this._radius, Math.max(0, this._height - desc.stepOffset) / 2)
      if (desc.isValid()) {
        const controller = this.ctx.world.physics.controllerManager.createController(desc)
        if (controller?.ptr) this.controller = controller
      }
    } finally {
      PHYSX.destroy(desc)
    }
    if (!this.controller?.ptr) {
      this.controller = null
      warnController(this, 'controller', '[controller] invalid descriptor or failed controller creation')
      return
    }
    const worldPosition = this.getWorldPosition()
    const px = scratchPxExtVec3()
    vec3ToPx(worldPosition, px)
    this.controller.setFootPosition(px)

    const actor = this.controller.getActor()
    const nbShapes = actor.getNbShapes()
    // PhysX copies the shape flags and filter data, so these temporaries are destroyed right after use
    const shapeBuffer = new PHYSX.PxArray_PxShapePtr(nbShapes)
    try {
      const shapesCount = actor.getShapes(shapeBuffer.begin(), nbShapes, 0)
      for (let i = 0; i < shapesCount; i++) {
        const shape = shapeBuffer.get(i)
        const layer = Layers[this._layer]
        let pairFlags =
          PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND |
          PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST |
          PHYSX.PxPairFlagEnum.eNOTIFY_CONTACT_POINTS
        let filterData, shapeFlags
        try {
          filterData = new PHYSX.PxFilterData(layer.group, layer.mask, pairFlags, 0)
          shapeFlags = new PHYSX.PxShapeFlags()
          shapeFlags.raise(PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE)
          shape.setFlags(shapeFlags)
          shape.setQueryFilterData(filterData)
          shape.setSimulationFilterData(filterData)
        } finally {
          if (shapeFlags) PHYSX.destroy(shapeFlags)
          if (filterData) PHYSX.destroy(filterData)
        }
      }
    } finally {
      PHYSX.destroy(shapeBuffer)
    }
    const self = this
    const playerId = this.ctx.entity?.isPlayer ? this.ctx.entity.data.id : null
    this.actorHandle = this.ctx.world.physics.addActor(actor, {
      controller: true,
      node: self,
      get tag() {
        return self._tag
      },
      playerId,
      get onContactStart() {
        return self._onContactStart
      },
      get onContactEnd() {
        return self._onContactEnd
      },
      onTriggerEnter: null,
      onTriggerLeave: null,
    })
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      this.mesh?.matrix.copy(this.matrix)
      this.mesh?.matrixWorld.copy(this.matrixWorld)
    }
    // if (this.didMove) {
    //   console.log('character position change without move() ????')
    //   const worldPosition = this.getWorldPosition()
    //   const px = scratchPxExtVec3()
    //   vec3ToPx(worldPosition, px)
    //   this.controller.setFootPosition(px)
    //   this.didMove = false
    // }
  }

  unmount() {
    if (this.ctx.world.entities?.player?.controller === this) this.ctx.world.physics.portalCollisions?.clear()
    if (this.mesh) {
      this.ctx.world.stage.scene.remove(this.mesh)
      this.mesh.geometry.disposeBoundsTree?.()
      this.mesh.geometry.dispose()
      this.mesh.material.dispose()
      this.mesh = null
    }
    this.actorHandle?.destroy()
    this.actorHandle = null
    this.controller?.release()
    this.controller = null
    if (this.stepGeometry) PHYSX.destroy(this.stepGeometry)
    this.stepGeometry = null
    if (this.hitReport) PHYSX.destroy(this.hitReport)
    if (this.behavior) PHYSX.destroy(this.behavior)
    this.hitReport = null
    this.behavior = null
    this.moveFlags = null
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this._radius = source._radius
    this._height = source._height
    this._visible = source._visible
    this._layer = source._layer
    this._tag = source._tag
    this._onContactStart = source._onContactStart
    this._onContactEnd = source._onContactEnd
    return this
  }

  get radius() {
    return this._radius
  }

  set radius(value = defaults.radius) {
    if (!finiteNumber(value)) {
      throw new Error('[controller] radius not a finite number')
    }
    if (this._radius === value) return
    this._radius = value
    this.needsRebuild = true
    this.setDirty()
  }

  get height() {
    return this._height
  }

  set height(value = defaults.height) {
    if (!finiteNumber(value)) {
      throw new Error('[controller] height not a finite number')
    }
    if (this._height === value) return
    this._height = value
    this.needsRebuild = true
    this.setDirty()
  }

  get visible() {
    return this._visible
  }

  set visible(value = defaults.visible) {
    if (!isBoolean(value)) {
      throw new Error('[controller] visible not a boolean')
    }
    if (this._visible === value) return
    this._visible = value
    this.needsRebuild = true
    this.setDirty()
  }

  get layer() {
    return this._layer
  }

  set layer(value = defaults.layer) {
    if (!isLayer(value)) {
      throw new Error(`[controller] invalid layer: ${value}`)
    }
    if (this._layer === value) return
    this._layer = value
    if (this.controller) {
      // TODO: we could just update the PxFilterData tbh
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get tag() {
    return this._tag
  }

  set tag(value = defaults.tag) {
    if (isNumber(value)) {
      value = value + ''
    }
    if (value !== null && !isString(value)) {
      throw new Error('[controller] tag not a string')
    }
    this._tag = value
  }

  get onContactStart() {
    return this._onContactStart
  }

  set onContactStart(value = defaults.onContactStart) {
    if (value !== null && !isFunction(value)) {
      throw new Error('[controller] onContactStart not a function')
    }
    this._onContactStart = value
  }

  get onContactEnd() {
    return this._onContactEnd
  }

  set onContactEnd(value = defaults.onContactEnd) {
    if (value !== null && !isFunction(value)) {
      throw new Error('[controller] onContactEnd not a function')
    }
    this._onContactEnd = value
  }

  get isGrounded() {
    return this.moveFlags?.isSet(PHYSX.PxControllerCollisionFlagEnum.eCOLLISION_DOWN) || false
  }

  get isCeiling() {
    return this.moveFlags?.isSet(PHYSX.PxControllerCollisionFlagEnum.eCOLLISION_UP) || false
  }

  teleport(vec3) {
    if (!readVec3(vec3, _v1, '[controller] teleport expected Vector3')) {
      warnOnce('[controller] teleport ignored a non-finite vector')
      return
    }
    if (!positionOk(_v1)) {
      warnOnce('[controller] teleport ignored a position outside the physics range')
      return
    }
    writeVec3(this.position, _v1.x, _v1.y, _v1.z)
    if (!this.controller) return
    const px = scratchPxExtVec3()
    vec3ToPx(_v1, px)
    this.controller.setFootPosition(px)
    // A teleported CCT must not keep sweep contacts from its previous room.
    this.controller.invalidateCache()
    this.moveFlags = null
  }

  move(vec3, delta = 1 / 60) {
    if (!readVec3(vec3, _v1, '[controller] move expected Vector3')) {
      warnOnce('[controller] move ignored non-finite input')
      return
    }
    if (!this.controller) return
    const foot = this.controller.getFootPosition()
    if (!positionOk(_v2.set(foot.x + _v1.x, foot.y + _v1.y, foot.z + _v1.z))) {
      warnOnce('[controller] move ignored a displacement that leaves the physics range')
      return
    }
    if (!this.controller || !Number.isFinite(delta) || delta <= 0) return
    const player = this.ctx.world.entities?.player
    const local = player?.controller === this
    const portals = local ? [...(this.ctx.world.graphics?.portals || [])] : []
    if (local) {
      player.base.position.copy(this.position)
      for (const portal of portals) portal.updateTraversal(player)
      this.ctx.world.physics.portalCollisions?.update(this, _v1)
    }
    // Check forward clearance above the step band and below the current head.
    // PhysX still handles overhead clearance during its own upward sweep.
    const stepOffset = this.controller.getStepOffset()
    const horizontal = stepDirection.set(_v1.x, 0, _v1.z).length()
    let blockedStep = false
    if (horizontal > 0 && _v1.y <= 0) {
      stepDirection.multiplyScalar(1 / horizontal)
      stepOrigin.copy(this.position)
      stepOrigin.y +=
        stepOffset + this._radius + Math.max(0, this._height - stepOffset) / 2 + this.controller.getContactOffset()
      const hit = this.ctx.world.physics.sweep(
        this.stepGeometry,
        stepOrigin,
        stepDirection,
        this._radius + horizontal,
        Layers.environment.group | Layers.prop.group,
        capsuleRotation
      )
      blockedStep = !!hit && hit.normal.y < Math.cos(60 * DEG2RAD)
    }
    if (blockedStep) this.controller.setStepOffset(0)
    try {
      const px = scratchPxVec3()
      vec3ToPx(_v1, px)
      this.moveFlags = this.controller.move(px, 0, delta, this.ctx.world.physics.controllerFilters)
    } finally {
      if (blockedStep) this.controller.setStepOffset(stepOffset)
      this.ctx.world.physics.drainCallbackFailures()
    }
    // this.isGrounded = moveFlags.isSet(PHYSX.PxControllerCollisionFlagEnum.eCOLLISION_DOWN) // prettier-ignore
    const pos = this.controller.getFootPosition()
    pxToVec3(this.position, pos)
    if (local) {
      const previousTraversal = player.portalTraversal
      player.base.position.copy(this.position)
      for (const portal of portals) portal.updateTraversal(player)
      if (player.portalTraversal !== previousTraversal) {
        // The next ground probe must already see the destination's passage.
        this.ctx.world.physics.portalCollisions?.update(this, new THREE.Vector3())
      }
    }
    this.didMove = true
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      let proxy = {
        get radius() {
          return self.radius
        },
        set radius(value) {
          self.radius = value
        },
        get height() {
          return self.height
        },
        set height(value) {
          self.height = value
        },
        get visible() {
          return self.visible
        },
        set visible(value) {
          self.visible = value
        },
        get layer() {
          return self.layer
        },
        set layer(value) {
          if (value === 'player') {
            throw new Error('[controller] layer invalid: player')
          }
          self.layer = value
        },
        get tag() {
          return self.tag
        },
        set tag(value) {
          self.tag = value
        },
        get onContactStart() {
          return self.onContactStart
        },
        set onContactStart(value) {
          self.onContactStart = value
        },
        get onContactEnd() {
          return self.onContactEnd
        },
        set onContactEnd(value) {
          self.onContactEnd = value
        },
        get isGrounded() {
          return callForScript(() => self.isGrounded, self, [])
        },
        get isCeiling() {
          return callForScript(() => self.isCeiling, self, [])
        },
        teleport(vec3) {
          return callForScript(self.teleport, self, [vec3])
        },
        move(vec3) {
          return callForScript(self.move, self, [vec3])
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}

function isLayer(value) {
  return layers.includes(value)
}
