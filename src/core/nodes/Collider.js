import { handlePhysicsFailure } from '../extras/physicsFailure.js'
import * as THREE from '../extras/three'
import { vec3ToPxPos, quatToPxRot, warnOnce } from '../extras/physxConvert.js'
import { isBoolean } from 'lodash-es'

import { getRef, Node, resolveValueRef, secureRef } from './Node'

import { Layers } from '../extras/Layers'
import { geometryToPxMesh } from '../extras/geometryToPxMesh'
import {
  extentOk,
  finiteNumber,
  geometryOk,
  lengthOk,
  normalizeQuat,
  positionOk,
  scaleOk,
  warnPhysicsOnce,
} from '../extras/physicsValidate.js'

const defaults = {
  type: 'box',
  width: 1,
  height: 1,
  depth: 1,
  radius: 0.5,
  geometry: null,
  convex: false,
  trigger: false,
  layer: 'environment',
  staticFriction: 0.6,
  dynamicFriction: 0.6,
  restitution: 0,
}

const _v1 = new THREE.Vector3()
const _v2 = new THREE.Vector3()
const _v3 = new THREE.Vector3()
const _v4 = new THREE.Vector3()
const _q1 = new THREE.Quaternion()
const _q2 = new THREE.Quaternion()

const types = ['box', 'sphere', 'geometry']
// skips that depend on the collider's transform, retried when it moves
const TRANSFORM_SKIPS = new Set(['scale', 'extent', 'pose'])
const layers = ['environment', 'prop', 'player', 'tool']

export class Collider extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'collider'

    this.type = data.type
    this.width = data.width
    this.height = data.height
    this.depth = data.depth
    this.radius = data.radius
    this.geometry = data.geometry
    this.convex = data.convex
    this.trigger = data.trigger
    this.layer = data.layer
    this.staticFriction = data.staticFriction
    this.dynamicFriction = data.dynamicFriction
    this.restitution = data.restitution
  }

  mount() {
    this.needsRebuild = false
    if (this.ctx.world.isPreview) return
    this.physicsSkipped = null
    // every length, scale, extent and the local pose are checked before PhysX sees them (physicsValidate.js)
    if (!this.parent) return this.skipPhysics('parent', 'has no parent')
    const localPosition = _v4.copy(this.position).multiply(this.parent.scale)
    const localRotation = _q2.copy(this.quaternion)
    if (!positionOk(localPosition) || !normalizeQuat(localRotation)) {
      return this.skipPhysics('pose', 'local pose is outside the physics range')
    }
    // what this call owns until it hands it to the node: the cooked mesh handle and the geometry are released on every
    // exit, a throw included (the shape and the mesh handle belong to the node once assigned; unmount releases them).
    // A mesh held by an earlier extent skip is released after this attempt has taken its own handle.
    const owned = { pmesh: null, geometry: null }
    const held = this.heldPmesh
    this.heldPmesh = null
    try {
      const skip = this.buildGeometry(owned)
      if (skip) {
        // an extent skip keeps its cooked mesh, so a retry at another scale does not cook it again
        if (skip[0] === 'extent') {
          this.heldPmesh = owned.pmesh
          owned.pmesh = null
        }
        return this.skipPhysics(...skip)
      }
      this.createShapeFrom(owned, localPosition, localRotation)
    } finally {
      owned.pmesh?.release()
      if (owned.geometry) PHYSX.destroy(owned.geometry)
      held?.release()
    }
  }

  // fills owned.geometry (and owned.pmesh for meshes); returns [reason, message] when the node must skip its physics
  buildGeometry(owned) {
    if (this._type === 'box') {
      const hx = this._width / 2
      const hy = this._height / 2
      const hz = this._depth / 2
      if (!lengthOk(hx) || !lengthOk(hy) || !lengthOk(hz)) return ['size', 'box size is outside the physics range']
      owned.geometry = new PHYSX.PxBoxGeometry(hx, hy, hz)
    } else if (this._type === 'sphere') {
      if (!lengthOk(this._radius)) return ['size', 'sphere radius is outside the physics range']
      owned.geometry = new PHYSX.PxSphereGeometry(this._radius)
    } else if (this._type === 'geometry') {
      // note: triggers MUST be convex according to PhysX/Unity
      const isConvex = this._trigger || this._convex
      if (!this._geometry?.attributes?.position) return ['geometry', 'has no geometry']
      this.matrixWorld.decompose(_v1, _q1, _v2)
      // a triangle mesh may be mirrored; a mirrored convex mesh is invalid
      if (!scaleOk(_v2, !isConvex)) return ['scale', 'scale is outside the physics range']
      owned.pmesh = geometryToPxMesh(this.ctx.world, this._geometry, isConvex, this.ctx.entity)
      if (!owned.pmesh) return ['cook', 'failed to generate collider pmesh']
      if (!extentOk(owned.pmesh.maxAbs, _v3.set(Math.abs(_v2.x), Math.abs(_v2.y), Math.abs(_v2.z)))) {
        return ['extent', 'mesh is larger than the physics range']
      }
      // each temporary is destroyed if it was created, whichever constructor throws
      let scaleVec, scaleQuat, scale
      try {
        scaleVec = new PHYSX.PxVec3(_v2.x, _v2.y, _v2.z)
        scaleQuat = new PHYSX.PxQuat(0, 0, 0, 1)
        scale = new PHYSX.PxMeshScale(scaleVec, scaleQuat)
        owned.geometry = isConvex
          ? new PHYSX.PxConvexMeshGeometry(owned.pmesh.value, scale)
          : new PHYSX.PxTriangleMeshGeometry(owned.pmesh.value, scale)
      } finally {
        if (scale) PHYSX.destroy(scale)
        if (scaleVec) PHYSX.destroy(scaleVec)
        if (scaleQuat) PHYSX.destroy(scaleQuat)
      }
    }
    if (!geometryOk(owned.geometry)) return ['invalid', 'geometry is not valid for physics']
    return null
  }

  createShapeFrom(owned, localPosition, localRotation) {
    const material = this.ctx.world.physics.getMaterial(this._staticFriction, this._dynamicFriction, this._restitution)
    const layer = Layers[this._layer]
    let pairFlags = PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND | PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST
    if (!this._trigger) {
      pairFlags |= PHYSX.PxPairFlagEnum.eNOTIFY_CONTACT_POINTS
    }
    const filterData = new PHYSX.PxFilterData(layer.group, layer.mask, pairFlags, 0)
    let pose
    try {
      const flags = new PHYSX.PxShapeFlags()
      let shape
      try {
        if (this._trigger) {
          flags.raise(PHYSX.PxShapeFlagEnum.eTRIGGER_SHAPE)
        } else {
          flags.raise(PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE)
        }
        shape = this.ctx.world.physics.physics.createShape(owned.geometry, material, true, flags)
      } catch (err) {
        handlePhysicsFailure(err, { entity: this.ctx.entity, world: this.ctx.world, phase: 'Collider.mount' })
        console.error('[collider] failed to create shape')
        console.error(err)
      } finally {
        PHYSX.destroy(flags)
      }
      if (!shape || shape.ptr === 0) {
        warnOnce('[collider] failed to create shape')
        return this.skipPhysics('shape', 'failed to create shape')
      }
      this.shape = shape
      this.pmesh = owned.pmesh
      owned.pmesh = null
      this.shape.setQueryFilterData(filterData)
      this.shape.setSimulationFilterData(filterData)
      pose = new PHYSX.PxTransform()
      vec3ToPxPos(localPosition, pose)
      quatToPxRot(localRotation, pose)
      this.shape.setLocalPose(pose)
      this.parent?.addShape?.(this.shape)
    } finally {
      PHYSX.destroy(filterData)
      if (pose) PHYSX.destroy(pose)
    }
    this.needsRebuild = false
    if (!this.ctx.portalCollisionProxy) this.ctx.world.physics.portalCollisions?.colliders.add(this)
  }

  // no physics for this node until an input changes: the visual stays, and the setters below schedule a rebuild
  // when physicsSkipped is set, so a script that fixes the value gets physics; a dirty commit does not re-cook
  skipPhysics(reason, message) {
    this.shape = null
    this.pmesh = null
    this.physicsSkipped = reason
    this.skipKey = TRANSFORM_SKIPS.has(reason) ? this.transformKey() : null
    this.needsRebuild = false
    warnPhysicsOnce(this, reason, `[collider] ${message}; physics skipped`)
  }

  // the decomposed world scale and the local pose the transform-dependent checks look at
  transformKey() {
    this.matrixWorld.decompose(_v1, _q1, _v2)
    const local = this.parent ? _v4.copy(this.position).multiply(this.parent.scale) : _v4.copy(this.position)
    const q = this.quaternion
    // exact values: any change can change what the checks decide, so none is rounded away
    return [_v2.x, _v2.y, _v2.z, local.x, local.y, local.z, q.x, q.y, q.z, q.w].join(',')
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    // a collider skipped for its transform tries again once that transform changed: mount() directly, since there is
    // no shape to release and an unmount would drop the held mesh
    if (
      didMove &&
      TRANSFORM_SKIPS.has(this.physicsSkipped) &&
      !this.ctx.moving &&
      this.transformKey() !== this.skipKey
    ) {
      this.mount()
    }
  }

  unmount() {
    if (!this.ctx.portalCollisionProxy) {
      const portalCollisions = this.ctx.world.physics?.portalCollisions
      portalCollisions?.remove(this)
      portalCollisions?.colliders.delete(this)
    }
    // if (this.type === 'geometry' && pxMeshes[this.geometry.uuid]) {
    //   pxMeshes[this.geometry.uuid].release()
    //   delete pxMeshes[this.geometry.uuid]
    // }
    this.parent?.removeShape?.(this.shape)
    this.shape?.release()
    this.shape = null
    this.pmesh?.release()
    this.pmesh = null
    this.heldPmesh?.release()
    this.heldPmesh = null
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this._type = source._type
    this._width = source._width
    this._height = source._height
    this._depth = source._depth
    this._radius = source._radius
    this._geometry = source._geometry
    this._convex = source._convex
    this._trigger = source._trigger
    this._layer = source._layer
    this._staticFriction = source._staticFriction
    this._dynamicFriction = source._dynamicFriction
    this._restitution = source._restitution
    return this
  }

  get type() {
    return this._type
  }

  set type(value = defaults.type) {
    if (!isType(value)) {
      throw new Error(`[collider] invalid type:`, value)
    }
    if (this._type === value) return
    this._type = value
    this.needsRebuild = true
    this.setDirty()
  }

  get width() {
    return this._width
  }

  set width(value = defaults.width) {
    if (!finiteNumber(value) || value < 0) {
      throw new Error('[collider] width must be a finite number >= 0')
    }
    if (this._width === value) return
    this._width = value
    if ((this.shape || this.physicsSkipped) && this._type === 'box') {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get height() {
    return this._height
  }

  set height(value = defaults.height) {
    if (!finiteNumber(value) || value < 0) {
      throw new Error('[collider] height must be a finite number >= 0')
    }
    if (this._height === value) return
    this._height = value
    if ((this.shape || this.physicsSkipped) && this._type === 'box') {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get depth() {
    return this._depth
  }

  set depth(value = defaults.depth) {
    if (!finiteNumber(value) || value < 0) {
      throw new Error('[collider] depth must be a finite number >= 0')
    }
    if (this._depth === value) return
    this._depth = value
    if ((this.shape || this.physicsSkipped) && this._type === 'box') {
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
    if (!finiteNumber(value) || value < 0) {
      throw new Error('[collider] radius must be a finite number >= 0')
    }
    if (this._radius === value) return
    this._radius = value
    if ((this.shape || this.physicsSkipped) && this._type === 'sphere') {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get geometry() {
    return secureRef({}, () => this._geometry)
  }

  set geometry(value = defaults.geometry) {
    const geometry = getRef(value)
    if (this._geometry === geometry) return
    this._geometry = geometry
    this.needsRebuild = true
    this.setDirty()
  }

  get convex() {
    return this._convex
  }

  set convex(value = defaults.convex) {
    if (!isBoolean(value)) {
      throw new Error('[collider] convex not a boolean')
    }
    if (this._convex === value) return
    this._convex = value
    if (this.shape || this.physicsSkipped) {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get trigger() {
    return this._trigger
  }

  set trigger(value = defaults.trigger) {
    if (!isBoolean(value)) {
      throw new Error('[collider] trigger not a boolean')
    }
    if (this._trigger === value) return
    this._trigger = value
    if (this.shape || this.physicsSkipped) {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get layer() {
    return this._layer
  }

  set layer(value = defaults.layer) {
    if (!isLayer(value)) {
      throw new Error(`[collider] invalid layer: ${value}`)
    }
    if (this._layer === value) return
    this._layer = value
    if (this.shape || this.physicsSkipped) {
      // TODO: we could just update the PxFilterData tbh
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get staticFriction() {
    return this._staticFriction
  }

  set staticFriction(value = defaults.staticFriction) {
    if (!finiteNumber(value) || value < 0) {
      throw new Error('[collider] staticFriction must be a finite number >= 0')
    }
    if (this._staticFriction === value) return
    this._staticFriction = value
    if (this.shape || this.physicsSkipped) {
      // todo: we could probably just update the PxMaterial tbh
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get dynamicFriction() {
    return this._dynamicFriction
  }

  set dynamicFriction(value = defaults.dynamicFriction) {
    if (!finiteNumber(value) || value < 0) {
      throw new Error('[collider] dynamicFriction must be a finite number >= 0')
    }
    if (this._dynamicFriction === value) return
    this._dynamicFriction = value
    if (this.shape || this.physicsSkipped) {
      // todo: we could probably just update the PxMaterial tbh
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get restitution() {
    return this._restitution
  }

  set restitution(value = defaults.restitution) {
    if (!finiteNumber(value) || value < 0) {
      throw new Error('[collider] restitution must be a finite number >= 0')
    }
    if (this._restitution === value) return
    this._restitution = value
    if (this.shape || this.physicsSkipped) {
      // todo: we could probably just update the PxMaterial tbh
      this.needsRebuild = true
      this.setDirty()
    }
  }

  setMaterial(staticFriction, dynamicFriction, restitution) {
    this.staticFriction = staticFriction
    this.dynamicFriction = dynamicFriction
    this.restitution = restitution
  }

  requestRebuild() {
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
              console.error('[collider] geometry invalid')
              return
            }
            value = ref.value
          }
          self.geometry = value
        },
        get convex() {
          return self.convex
        },
        set convex(value) {
          self.convex = value
        },
        get trigger() {
          return self.trigger
        },
        set trigger(value) {
          self.trigger = value
        },
        get layer() {
          return self.layer
        },
        set layer(value) {
          if (value === 'player') {
            throw new Error('[collider] layer invalid: player')
          }
          self.layer = value
        },
        get staticFriction() {
          return self.staticFriction
        },
        set staticFriction(value) {
          self.staticFriction = value
        },
        get dynamicFriction() {
          return self.dynamicFriction
        },
        set dynamicFriction(value) {
          self.dynamicFriction = value
        },
        get restitution() {
          return self.restitution
        },
        set restitution(value) {
          self.restitution = value
        },
        setMaterial(staticFriction, dynamicFriction, restitution) {
          self.setMaterial(staticFriction, dynamicFriction, restitution)
        },
        requestRebuild() {
          self.requestRebuild()
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

function isLayer(value) {
  return layers.includes(value)
}
