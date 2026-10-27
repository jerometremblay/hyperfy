import { handlePhysicsFailure } from '../extras/physicsFailure.js'
import * as THREE from '../extras/three'
import { mergeVertices, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { vec3ToPxPos, quatToPxRot, warnOnce } from '../extras/physxConvert.js'
import { isBoolean, isNumber, isString, isArray, isObject, isFunction, isEqual } from 'lodash-es'

import { Node, secureRef } from './Node'
import { getTrianglesFromGeometry } from '../extras/getTrianglesFromGeometry'
import { getTextureBytesFromMaterial } from '../extras/getTextureBytesFromMaterial'
import { Layers } from '../extras/Layers'
import { geometryToPxMesh } from '../extras/geometryToPxMesh'
import {
  extentOk,
  finiteNumber,
  geometryOk,
  lengthOk,
  MIN_MASS,
  positionOk,
  scaleOk,
  warnPhysicsOnce,
} from '../extras/physicsValidate.js'

const defaults = {
  type: 'box',
  size: null,
  profile: [
    [-0.5, -0.5],
    [0.5, -0.5],
    [0.5, 0.5],
    [-0.5, 0.5],
  ],
  depth: 1,
  bevelEnabled: true,
  bevelThickness: 0.04,
  bevelSize: 0.04,
  bevelSegments: 2,
  curveSegments: 12,
  smooth: false,
  creaseAngle: Math.PI / 3,
  color: '#ffffff',
  emissive: null,
  emissiveIntensity: 0,
  metalness: 0.2,
  roughness: 0.8,
  opacity: 1,
  texture: null,
  castShadow: true,
  receiveShadow: true,
  doubleside: false,
  // physics
  physics: null, // null | 'static' | 'kinematic' | 'dynamic'
  mass: 1,
  linearDamping: 0,
  angularDamping: 0.05,
  staticFriction: 0.6,
  dynamicFriction: 0.6,
  restitution: 0,
  layer: 'environment',
  trigger: false,
  tag: null,
  onContactStart: null,
  onContactEnd: null,
  onTriggerEnter: null,
  onTriggerLeave: null,
}

const _v1 = new THREE.Vector3()
const _v2 = new THREE.Vector3()
const _v3 = new THREE.Vector3()
const _q1 = new THREE.Quaternion()
const _m1 = new THREE.Matrix4()
const _m2 = new THREE.Matrix4()
const _m3 = new THREE.Matrix4()
const _defaultScale = new THREE.Vector3(1, 1, 1)

const TRANSFORM_SKIPS = new Set(['size', 'scale', 'extent', 'position', 'mirror'])
const layers = ['environment', 'prop', 'player', 'tool']
const types = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane', 'extrude']

const defaultSizes = {
  box: [1, 1, 1], // width, height, depth
  sphere: [0.5], // radius
  cylinder: [0.5, 0.5, 1], // radiusTop, radiusBtm, height
  cone: [0.5, 1], // radius, height
  torus: [0.4, 0.1], // radius, tubeRadius
  plane: [1, 1], // width, height
  extrude: [], // profile, depth, and bevel properties define the shape
}

// Geometry cache
let geometryCache = new Map()
const geometryRefs = new Map()
const materialRefs = new Map()
const IDLE_GEOMETRY_LIMIT = 1024
const IDLE_MATERIAL_LIMIT = 1024
const IDLE_GEOMETRY_BYTES = 64 * 1024 * 1024
const MAX_PROFILE_POINTS = 256
const MAX_BEVEL_SEGMENTS = 16
const MAX_CURVE_SEGMENTS = 64

function geometryBytes(geometry) {
  return (
    Object.values(geometry.attributes).reduce((bytes, attribute) => bytes + attribute.array.byteLength, 0) +
    (geometry.index?.array.byteLength || 0)
  )
}

function retainResource(refs, resource) {
  refs.set(resource, (refs.get(resource) || 0) + 1)
}

function releaseResource(cache, refs, resource, limit) {
  if (!resource) return
  const count = (refs.get(resource) || 0) - 1
  if (count > 0) refs.set(resource, count)
  else refs.delete(resource)
  trimResources(cache, refs, limit)
}

function trimResources(cache, refs, limit) {
  let idle = 0
  let bytes = 0
  for (const resource of cache.values()) {
    if (refs.has(resource)) continue
    idle++
    if (resource.isBufferGeometry) bytes += geometryBytes(resource)
  }
  for (const [key, resource] of cache) {
    if (idle <= limit && bytes <= IDLE_GEOMETRY_BYTES) break
    if (refs.has(resource)) continue
    cache.delete(key)
    if (resource.isBufferGeometry) bytes -= geometryBytes(resource)
    resource.disposeBoundsTree?.()
    resource.dispose()
    if (resource.map) resource.map.dispose()
    idle--
  }
}

const getGeometry = (type, size, extrudeOptions) => {
  // All primitives of the same type share one unit-sized geometry
  const key = type === 'extrude' ? `${type}${JSON.stringify(extrudeOptions)}` : `${type}${size}`
  let geometry = geometryCache.get(key)
  if (!geometry) {
    switch (type) {
      case 'box':
        {
          const [width, height, depth] = size
          geometry = new THREE.BoxGeometry(width, height, depth)
        }
        break
      case 'sphere':
        {
          const [radius] = size
          geometry = new THREE.SphereGeometry(radius, 20, 12)
        }
        break
      case 'cylinder':
        {
          const [radiusTop, radiusBtm, height] = size
          geometry = new THREE.CylinderGeometry(radiusTop, radiusBtm, height, 20)
        }
        break
      case 'cone':
        {
          const [radius, height] = size
          geometry = new THREE.ConeGeometry(radius, height, 16)
        }
        break
      case 'torus':
        {
          const [innerRadius, tubeRadius] = size
          geometry = new THREE.TorusGeometry(innerRadius, tubeRadius, 12, 30)
        }
        break
      case 'plane':
        {
          const [width, height] = size
          geometry = new THREE.PlaneGeometry(width, height)
        }
        break
      case 'extrude':
        geometry = createExtrudeGeometry(extrudeOptions)
        break
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1)
    }
    geometry.uuid = `prim:${key}`
  }
  geometryCache.delete(key)
  geometryCache.set(key, geometry)
  return geometry
}

// Material cache - reuse materials with identical properties
const materialCache = new Map()

// Create material with specific properties
const getMaterial = (props, cache = materialCache) => {
  // Create a cache key from material properties
  const cacheKey = JSON.stringify([
    props.metalness,
    props.roughness,
    props.opacity,
    props.texture || null,
    props.doubleside,
  ])

  // Check cache first
  if (cache.has(cacheKey)) {
    const material = cache.get(cacheKey)
    cache.delete(cacheKey)
    cache.set(cacheKey, material)
    return material
  }

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x000000,
    emissiveIntensity: 0,
    metalness: props.metalness,
    roughness: props.roughness,
    opacity: props.opacity,
    transparent: props.opacity < 1,
    side: props.doubleside ? THREE.DoubleSide : THREE.FrontSide,
    shadowSide: THREE.BackSide, // fix csm shadow banding

    // fight z-fighting with fire (especially for AI generated objects)
    polygonOffset: true,
    polygonOffsetFactor: Math.random(),
    polygonOffsetUnits: Math.random(),
  })

  // Cache the material
  material.uuid = `prim-material:${cacheKey}`
  cache.set(cacheKey, material)

  return material
}

let count = 0

if (typeof window !== 'undefined') {
  window.prims = {
    material: materialCache,
    geometry: geometryCache,
    get count() {
      return count
    },
  }
}

const applyTexture = (material, textureUrl, loader) => {
  if (!material._texPromise) {
    material._texPromise = (async () => {
      let texture = loader.get('texture', textureUrl)
      if (!texture) texture = await loader.load('texture', textureUrl)
      material.map = texture
      material._texApplied = true
    })().catch(err => {
      delete material._texPromise // a later mount can retry a failed load
      throw err
    })
  }
  return material._texPromise
}

export class Prim extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'prim'

    this.type = data.type
    this.size = data.size
    this.profile = data.profile
    this.depth = data.depth
    this.bevelEnabled = data.bevelEnabled
    this.bevelThickness = data.bevelThickness
    this.bevelSize = data.bevelSize
    this.bevelSegments = data.bevelSegments
    this.curveSegments = data.curveSegments
    this.smooth = data.smooth
    this.creaseAngle = data.creaseAngle
    this.color = data.color
    this.emissive = data.emissive
    this.emissiveIntensity = data.emissiveIntensity
    this.metalness = data.metalness
    this.roughness = data.roughness
    this.opacity = data.opacity
    this.texture = data.texture
    this.castShadow = data.castShadow
    this.receiveShadow = data.receiveShadow
    this.doubleside = data.doubleside
    // Physics properties
    this.physics = data.physics
    this.mass = data.mass
    this.linearDamping = data.linearDamping
    this.angularDamping = data.angularDamping
    this.staticFriction = data.staticFriction
    this.dynamicFriction = data.dynamicFriction
    this.restitution = data.restitution
    this.layer = data.layer
    this.trigger = data.trigger
    this.tag = data.tag
    this.onContactStart = data.onContactStart
    this.onContactEnd = data.onContactEnd
    this.onTriggerEnter = data.onTriggerEnter
    this.onTriggerLeave = data.onTriggerLeave

    // Physics state
    this.shapes = new Set()
    this._tm = null
    this.tempVec3 = new THREE.Vector3()
    this.tempQuat = new THREE.Quaternion()

    this.matrixWorldOffset = new THREE.Matrix4()
    this.scaleOffset = new THREE.Vector3()
    this.n = 0
  }

  async mount() {
    const n = ++this.n
    try {
      this.needsRebuild = false

      // do some trickery to get a unit geometry size with a scale offset we can apply.
      // essentially lets us use unit-sized geometry and transfers the offset to scale.
      // for example there will only ever be ONE box geometry used, scaling will form its size.
      // but for shapes with varying config, eg cylinder top and bottom radii, these are normalized by ratio.
      const config = getGeometryConfig(this._type, this._size)
      if (config.invalid) {
        // no visual and no physics: these sizes divide by zero or lack values
        warnPhysicsOnce(this, 'config', `[prim] ${this._type} size ${config.invalid}; skipped`)
        return
      }
      const { size, scaleOffset } = config
      this.scaleOffset.fromArray(scaleOffset)
      this.updateMatrixWorldOffset()

      // Get unit-sized geometry for this type
      const geometry = getGeometry(this._type, size, this.getExtrudeOptions())
      retainResource(geometryRefs, geometry)
      this.cachedGeometry = geometry
      trimResources(geometryCache, geometryRefs, IDLE_GEOMETRY_LIMIT)

      // Create material with current properties
      const cache = this.ctx.world.isPreview ? (this.ctx.world.primMaterials ||= new Map()) : materialCache
      const material = getMaterial(
        {
          // color: this._color,
          // emissive: this._emissive,
          // emissiveIntensity: this._emissiveIntensity,
          metalness: this._metalness,
          roughness: this._roughness,
          opacity: quantizeOpacity(this._opacity), // reduce material variations
          texture: this._texture ? this.ctx.world.resolveURL(this._texture) : null,
          doubleside: this._doubleside,
        },
        cache
      )

      retainResource(materialRefs, material)
      this.cachedMaterial = material
      this.materialCache = cache
      trimResources(cache, materialRefs, IDLE_MATERIAL_LIMIT)

      // Get loader if available (client-side only)
      const loader = this.ctx.world.loader || null

      if (this._texture && !material._texApplied) {
        // An unmount during the load releases the node's pin; keep a second one until the texture settles.
        retainResource(materialRefs, material)
        try {
          await applyTexture(material, this._texture, loader)
        } finally {
          releaseResource(cache, materialRefs, material, IDLE_MATERIAL_LIMIT)
        }
        if (n !== this.n) return // remounted or destroyed
      }

      // Create visual if visible
      if (this._opacity > 0) {
        // Create mesh
        this.handle = this.ctx.world.stage.insertLinked({
          geometry,
          material,
          uberShader: true,
          castShadow: this._castShadow,
          receiveShadow: this._receiveShadow,
          matrix: this.matrixWorldOffset,
          // color: this._color,
          node: this,
        })
        // console.log('FOO', this._color)
        this.handle.setColor(this._color)
        this.handle.setEmissive(this._emissive)
        this.handle.setEmissiveIntensity(this._emissiveIntensity)
        count++
      } else {
        // not visible but add to octree
        this.sItem = {
          matrix: this.matrixWorldOffset,
          geometry,
          material,
          getEntity: () => this.ctx.entity,
          node: this,
        }
        this.ctx.world.stage.octree.insert(this.sItem)
        count++
      }

      // Create physics if enabled
      if (this._physics && !this.ctx.moving && !this.ctx.world.isPreview) {
        this.mountPhysics(size, geometry)
      }
    } catch (err) {
      if (n !== this.n) return // an older texture load must not tear down a newer mount
      handlePhysicsFailure(err, { entity: this.ctx.entity, world: this.ctx.world, phase: 'Prim.mount' })
      console.error('[prim] mount failed')
      this.unmount()
    }
  }

  getExtrudeOptions() {
    if (this._type !== 'extrude') return null
    return {
      profile: this._profile,
      depth: this._depth,
      bevelEnabled: this._bevelEnabled,
      bevelThickness: this._bevelThickness,
      bevelSize: this._bevelSize,
      bevelSegments: this._bevelSegments,
      curveSegments: this._curveSegments,
      smooth: this._smooth,
      creaseAngle: this._creaseAngle,
    }
  }

  mountPhysics(size, geometry) {
    this.physicsSize = size
    this.physicsGeometry = geometry
    this.physicsSkip = null
    const held = this.heldPmesh
    this.heldPmesh = null
    try {
      this.mountPhysicsChecked(size, geometry)
    } finally {
      held?.release()
    }
  }

  mountPhysicsChecked(size, geometry) {
    if (!PHYSX) return

    const type = this._physics // 'static' | 'kinematic' | 'dynamic'
    const mass = this._mass
    const linearDamping = this._linearDamping
    const angularDamping = this._angularDamping
    const trigger = this._trigger

    // Decompose once. A mirror folds into the scale and every prim shape is symmetric under it, so the pose keeps
    // the decomposed rotation and the shape uses the absolute scale. Every size is checked before PhysX sees it,
    // and the actor is created only once the geometry is known to be valid.
    this.matrixWorldOffset.decompose(_v1, _q1, _v2)
    const absScale = _v3.set(Math.abs(_v2.x), Math.abs(_v2.y), Math.abs(_v2.z))
    if (!positionOk(_v1)) {
      return this.skipPhysics('position', 'position is outside the physics range')
    }
    // a mirror (decompose puts it in a negative x) is exact for the static shape, but a moving prim's actor pose is
    // copied back into the node without it, so its visual would flip away from its collider
    if (_v2.x < 0 && type !== 'static') {
      return this.skipPhysics('mirror', 'a mirrored prim only has static physics')
    }

    let pxGeometry = null
    let pmesh = null

    if (this._type === 'box') {
      const hx = 0.5 * absScale.x
      const hy = 0.5 * absScale.y
      const hz = 0.5 * absScale.z
      if (!lengthOk(hx) || !lengthOk(hy) || !lengthOk(hz)) {
        return this.skipPhysics('size', 'box size is outside the physics range')
      }
      pxGeometry = new PHYSX.PxBoxGeometry(hx, hy, hz)
    } else if (this._type === 'sphere' && isUniformScale(absScale)) {
      const [radius] = size
      if (!lengthOk(radius * absScale.x)) {
        return this.skipPhysics('size', 'sphere radius is outside the physics range')
      }
      pxGeometry = new PHYSX.PxSphereGeometry(radius * absScale.x)
    } else {
      if (!scaleOk(absScale)) {
        return this.skipPhysics('scale', 'scale is outside the physics range')
      }
      // Use a convex mesh for cylinder, cone, torus, plane, and extrude.
      // Concave extrude profiles therefore use their convex hull for physics.
      const threeGeometry = geometry

      // Create convex mesh
      pmesh = geometryToPxMesh(this.ctx.world, threeGeometry, true, this.ctx.entity)
      if (pmesh && pmesh.value) {
        if (!extentOk(pmesh.maxAbs, absScale)) {
          this.heldPmesh = pmesh
          return this.skipPhysics('extent', 'shape is larger than the physics range')
        }
        // Create scale and its components explicitly so we can free them; the cooked mesh handle is the node's from
        // here (unmountPhysics releases it), so a throw below cannot strand it
        this.pmesh = pmesh
        // each temporary is destroyed if it was created, whichever constructor throws
        let _scaleVec, _scaleQuat, _scale
        try {
          _scaleVec = new PHYSX.PxVec3(absScale.x, absScale.y, absScale.z)
          _scaleQuat = new PHYSX.PxQuat(0, 0, 0, 1)
          _scale = new PHYSX.PxMeshScale(_scaleVec, _scaleQuat)
          pxGeometry = new PHYSX.PxConvexMeshGeometry(pmesh.value, _scale)
        } finally {
          if (_scale) PHYSX.destroy(_scale)
          if (_scaleVec) PHYSX.destroy(_scaleVec)
          if (_scaleQuat) PHYSX.destroy(_scaleQuat)
        }
      } else {
        // cooking failed: a box from the unit geometry's own bounds (host-made, so trustworthy) times the scale
        console.warn(`[prim] Failed to create convex mesh for ${this._type}, falling back to box`)
        if (!threeGeometry.boundingBox) threeGeometry.computeBoundingBox()
        const box = threeGeometry.boundingBox
        const hx = 0.5 * (box.max.x - box.min.x) * absScale.x
        const hy = 0.5 * (box.max.y - box.min.y) * absScale.y
        const hz = 0.5 * (box.max.z - box.min.z) * absScale.z
        if (!lengthOk(hx) || !lengthOk(hy) || !lengthOk(hz)) {
          return this.skipPhysics('size', 'fallback box is outside the physics range')
        }
        pxGeometry = new PHYSX.PxBoxGeometry(hx, hy, hz)
      }
    }
    if (!geometryOk(pxGeometry)) {
      PHYSX.destroy(pxGeometry)
      this.pmesh?.release()
      this.pmesh = null
      return this.skipPhysics('invalid', 'geometry is not valid for physics')
    }

    // the geometry is copied into the shape, so it is destroyed on every exit, a throw included
    try {
      this.mountActor(pxGeometry, { type, mass, linearDamping, angularDamping, trigger })
    } finally {
      PHYSX.destroy(pxGeometry)
    }
    if (this.actor && type === 'static' && !trigger && ['environment', 'prop'].includes(this._layer)) {
      this.portalCollisionGeometry = geometry
      this.ctx.world.physics.portalCollisions?.colliders.add(this)
    }
  }

  mountActor(pxGeometry, { type, mass, linearDamping, angularDamping, trigger }) {
    // Create transform
    if (!this._tm) this._tm = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    vec3ToPxPos(_v1, this._tm)
    quatToPxRot(_q1, this._tm)

    // Create actor
    if (type === 'static') {
      this.actor = this.ctx.world.physics.physics.createRigidStatic(this._tm)
    } else if (type === 'kinematic') {
      this.actor = this.ctx.world.physics.physics.createRigidDynamic(this._tm)
      this.actor.setRigidBodyFlag(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC, true)
      PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(this.actor, mass)
    } else if (type === 'dynamic') {
      this.actor = this.ctx.world.physics.physics.createRigidDynamic(this._tm)
      PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(this.actor, mass)
      this.actor.setLinearDamping(linearDamping)
      this.actor.setAngularDamping(angularDamping)
    }

    // Get material
    const staticFriction = this._staticFriction
    const dynamicFriction = this._dynamicFriction
    const restitution = this._restitution
    const material = this.ctx.world.physics.getMaterial(staticFriction, dynamicFriction, restitution)

    // Create shape flags and the shape; the flags are destroyed on every exit, a throw from raise() included
    const flags = new PHYSX.PxShapeFlags()
    let shape
    try {
      if (trigger) {
        flags.raise(PHYSX.PxShapeFlagEnum.eTRIGGER_SHAPE)
      } else {
        flags.raise(PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE)
      }
      shape = this.ctx.world.physics.physics.createShape(pxGeometry, material, true, flags)
    } finally {
      PHYSX.destroy(flags)
      if (!shape || shape.ptr === 0) {
        this.shape = null
        this.pmesh?.release()
        this.pmesh = null
        this.actor.release()
        this.actor = null
        PHYSX.destroy(this._tm)
        this._tm = null
        warnOnce('[prim] failed to create shape')
      }
    }
    if (!shape || shape.ptr === 0) return
    this.shape = shape

    // Set filter data
    const layerName = this._layer
    const layer = Layers[layerName]
    let pairFlags = PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND | PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST
    if (!trigger) {
      pairFlags |= PHYSX.PxPairFlagEnum.eNOTIFY_CONTACT_POINTS
    }
    const filterData = new PHYSX.PxFilterData(layer.group, layer.mask, pairFlags, 0)
    try {
      this.shape.setQueryFilterData(filterData)
      this.shape.setSimulationFilterData(filterData)
    } finally {
      PHYSX.destroy(filterData)
    }

    // const position = _v1.copy(this.position).multiply(this.parent.scale)
    // const pose = new PHYSX.PxTransform()
    // vec3ToPxPos(position, pose)
    // quatToPxRot(this.quaternion, pose)
    // this.shape.setLocalPose(pose)

    // Attach shape to actor
    this.actor.attachShape(this.shape)
    this.shapes.add(this.shape)

    // Add to physics world
    const self = this
    const playerId = this.ctx.entity?.isPlayer ? this.ctx.entity.data.id : null
    this.actorHandle = this.ctx.world.physics.addActor(this.actor, {
      onInterpolate: type === 'kinematic' || type === 'dynamic' ? this.onInterpolate : null,
      node: this,
      get tag() {
        return self._tag
      },
      get playerId() {
        return playerId
      },
      get onContactStart() {
        return self._onContactStart
      },
      get onContactEnd() {
        return self._onContactEnd
      },
      get onTriggerEnter() {
        return self._onTriggerEnter
      },
      get onTriggerLeave() {
        return self._onTriggerLeave
      },
    })
  }

  // no physics for this prim (its visual stays); a property setter rebuilds it, a transform edit does not
  skipPhysics(reason, message) {
    warnPhysicsOnce(this, reason, `[prim] ${message}; physics skipped`)
    if (TRANSFORM_SKIPS.has(reason)) this.physicsSkip = { reason, key: this.physicsKey(), n: this.n }
  }

  // the signed decomposed scale the physics checks depend on (position is checked on its own)
  physicsKey() {
    this.matrixWorldOffset.decompose(_v1, _q1, _v2)
    // exact values: any change can change what the checks decide, so none is rounded away
    return `${_v2.x},${_v2.y},${_v2.z}`
  }

  // a prim whose physics was skipped for its transform tries again once the transform changed; only for the current
  // mount (Prim.mount awaits a texture before mountPhysics) and never while an actor exists
  retryPhysics() {
    const skip = this.physicsSkip
    if (!skip || skip.n !== this.n || this.actor || this.ctx.moving || !this._physics) return
    if (skip.reason === 'position') {
      this.matrixWorldOffset.decompose(_v1, _q1, _v2)
      if (!positionOk(_v1)) return
    } else if (this.physicsKey() === skip.key) {
      return
    }
    try {
      this.mountPhysics(this.physicsSize, this.physicsGeometry)
    } catch (err) {
      handlePhysicsFailure(err, { entity: this.ctx.entity, world: this.ctx.world, phase: 'Prim.retryPhysics' })
      console.error('[prim] physics retry failed')
      console.error(err)
    }
  }

  unmountPhysics() {
    this.ctx?.world?.physics?.portalCollisions?.remove(this)
    this.ctx?.world?.physics?.portalCollisions?.colliders.delete(this)
    this.portalCollisionGeometry = null
    if (this.actor) {
      this.actorHandle?.destroy()
      this.actorHandle = null
      this.shapes.clear()
      this.shape?.release()
      this.shape = null
      this.actor.release()
      this.actor = null
    }
    if (this._tm) {
      PHYSX.destroy(this._tm)
      this._tm = null
    }
    if (this.pmesh) {
      this.pmesh.release()
      this.pmesh = null
    }
    this.heldPmesh?.release()
    this.heldPmesh = null
    this.physicsGeometry = null
  }

  onInterpolate = (position, quaternion) => {
    if (this.parent) {
      _m1.compose(position, quaternion, _defaultScale)
      _m2.copy(this.parent.matrixWorld).invert()
      _m3.multiplyMatrices(_m2, _m1)
      _m3.decompose(this.position, this.quaternion, _v1)
    } else {
      this.position.copy(position)
      this.quaternion.copy(quaternion)
    }
  }

  getColliderSize() {
    // Returns appropriate collider dimensions
    switch (this._type) {
      case 'cylinder':
        return [this.scale.x * 2, this.scale.y, this.scale.z * 2]
      case 'cone':
        return [this.scale.x * 2, this.scale.y, this.scale.z * 2]
      case 'torus':
        const diameter = (this.scale.x + this.scale.x * 0.3) * 2
        return [diameter, this.scale.x * 0.3 * 2, diameter]
      case 'extrude': {
        const { minX, maxX, minY, maxY } = getProfileBounds(this._profile)
        return [(maxX - minX) * this.scale.x, (maxY - minY) * this.scale.y, this._depth * this.scale.z]
      }
      default:
        return [this.scale.x, this.scale.y, this.scale.z]
    }
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      this.updateMatrixWorldOffset()
      if (this.handle) {
        this.handle.move(this.matrixWorldOffset)
      }
      if (this.actorHandle) {
        this.actorHandle.move(this.matrixWorldOffset)
      }
      if (this.sItem) {
        this.ctx.world.stage.octree.move(this.sItem)
      }
      this.retryPhysics()
    }
  }

  unmount() {
    this.n++
    this.physicsSkip = null
    if (this.handle) {
      this.handle.destroy()
      this.handle = null
      count--
    }
    if (this.sItem) {
      this.ctx.world.stage.octree.remove(this.sItem)
      this.sItem = null
    }
    this.unmountPhysics()
    releaseResource(geometryCache, geometryRefs, this.cachedGeometry, IDLE_GEOMETRY_LIMIT)
    if (this.materialCache) releaseResource(this.materialCache, materialRefs, this.cachedMaterial, IDLE_MATERIAL_LIMIT)
    this.cachedGeometry = null
    this.cachedMaterial = null
    this.materialCache = null
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this._type = source._type
    this._size = source._size.slice()
    this._profile = source._profile.map(point => point.slice())
    this._depth = source._depth
    this._bevelEnabled = source._bevelEnabled
    this._bevelThickness = source._bevelThickness
    this._bevelSize = source._bevelSize
    this._bevelSegments = source._bevelSegments
    this._curveSegments = source._curveSegments
    this._smooth = source._smooth
    this._creaseAngle = source._creaseAngle
    this._color = source._color
    this._emissive = source._emissive
    this._emissiveIntensity = source._emissiveIntensity
    this._metalness = source._metalness
    this._roughness = source._roughness
    this._opacity = source._opacity
    this._texture = source._texture
    this._castShadow = source._castShadow
    this._receiveShadow = source._receiveShadow
    this._doubleside = source._doubleside
    // Physics properties
    this._physics = source._physics
    this._mass = source._mass
    this._linearDamping = source._linearDamping
    this._angularDamping = source._angularDamping
    this._staticFriction = source._staticFriction
    this._dynamicFriction = source._dynamicFriction
    this._restitution = source._restitution
    this._layer = source._layer
    this._trigger = source._trigger
    this._tag = source._tag
    this._onContactStart = source._onContactStart
    this._onContactEnd = source._onContactEnd
    this._onTriggerEnter = source._onTriggerEnter
    this._onTriggerLeave = source._onTriggerLeave
    return this
  }

  updateMatrixWorldOffset() {
    this.matrixWorld.decompose(_v1, _q1, _v2)
    _v2.multiply(this.scaleOffset)
    this.matrixWorldOffset.compose(_v1, _q1, _v2)
  }

  // applyStats(stats) {
  //   const geometry = getGeometry(this._type)
  //   if (geometry && !stats.geometries.has(geometry.uuid)) {
  //     stats.geometries.add(geometry.uuid)
  //     stats.triangles += getTrianglesFromGeometry(geometry)
  //   }
  //   // const material = getMaterial()
  //   if (material && !stats.materials.has(material.uuid)) {
  //     stats.materials.add(material.uuid)
  //     stats.textureBytes += getTextureBytesFromMaterial(material)
  //   }
  // }

  get type() {
    return this._type
  }

  set type(value = defaults.type) {
    if (!isString(value) || !types.includes(value)) {
      throw new Error('[prim] type invalid')
    }
    if (this._type === value) return
    this._type = value
    this.needsRebuild = true
    this.setDirty()
  }

  get size() {
    return this._size.slice()
  }

  set size(value) {
    if (value === null || value === undefined) {
      value = defaultSizes[this._type].slice()
    }
    // the length read once, and a primitive integer within bounds: an array proxy could report any length, a different
    // one each time, or an object whose valueOf answers differently on every comparison
    const length = isArray(value) ? value.length : undefined
    if (!Number.isInteger(length) || length < 0 || length > MAX_SIZE_VALUES) {
      throw new Error('[prim] size must be an array of finite numbers')
    }
    // a plain copy first and the checks on the copy: the script's array could carry its own iterator or index getters
    // and hand different values to the checks and to the geometry (a loop over every index, because every() would
    // skip the holes of a sparse array such as new Array(3))
    const copy = []
    for (let i = 0; i < length; i++) copy.push(value[i])
    if (!allFinite(copy, copy.length)) {
      throw new Error('[prim] size must be an array of finite numbers')
    }
    value = copy
    if (isEqual(this._size, value)) return
    this._size = value
    this.needsRebuild = true
    this.setDirty()
  }

  get profile() {
    return this._profile.map(point => point.slice())
  }

  set profile(value = defaults.profile) {
    const length = isArray(value) ? value.length : undefined
    if (!Number.isInteger(length) || length < 3 || length > MAX_PROFILE_POINTS) {
      throw new Error('[prim] profile must contain 3 to 256 points')
    }
    const copy = []
    for (let i = 0; i < length; i++) {
      const point = value[i]
      if (!isArray(point) || point.length !== 2)
        throw new Error('[prim] profile points must be [x, y] finite number pairs')
      copy.push([point[0], point[1]])
    }
    validateProfile(copy)
    if (isEqual(this._profile, copy)) return
    this._profile = copy
    this.needsRebuild = true
    this.setDirty()
  }

  get depth() {
    return this._depth
  }

  set depth(value = defaults.depth) {
    if (!finiteNumber(value) || value <= 0) {
      throw new Error('[prim] depth must be a positive number')
    }
    if (this._depth === value) return
    this._depth = value
    this.needsRebuild = true
    this.setDirty()
  }

  get bevelEnabled() {
    return this._bevelEnabled
  }

  set bevelEnabled(value = defaults.bevelEnabled) {
    if (typeof value !== 'boolean') {
      throw new Error('[prim] bevelEnabled must be a boolean')
    }
    if (this._bevelEnabled === value) return
    this._bevelEnabled = value
    this.needsRebuild = true
    this.setDirty()
  }

  get bevelThickness() {
    return this._bevelThickness
  }

  set bevelThickness(value = defaults.bevelThickness) {
    if (!finiteNumber(value) || value < 0) {
      throw new Error('[prim] bevelThickness must be a non-negative number')
    }
    if (this._bevelThickness === value) return
    this._bevelThickness = value
    this.needsRebuild = true
    this.setDirty()
  }

  get bevelSize() {
    return this._bevelSize
  }

  set bevelSize(value = defaults.bevelSize) {
    if (!finiteNumber(value) || value < 0) {
      throw new Error('[prim] bevelSize must be a non-negative number')
    }
    if (this._bevelSize === value) return
    this._bevelSize = value
    this.needsRebuild = true
    this.setDirty()
  }

  get bevelSegments() {
    return this._bevelSegments
  }

  set bevelSegments(value = defaults.bevelSegments) {
    if (!Number.isInteger(value) || value < 0 || value > MAX_BEVEL_SEGMENTS) {
      throw new Error('[prim] bevelSegments must be an integer from 0 to 16')
    }
    if (this._bevelSegments === value) return
    this._bevelSegments = value
    this.needsRebuild = true
    this.setDirty()
  }

  get curveSegments() {
    return this._curveSegments
  }

  set curveSegments(value = defaults.curveSegments) {
    if (!Number.isInteger(value) || value < 1 || value > MAX_CURVE_SEGMENTS) {
      throw new Error('[prim] curveSegments must be an integer from 1 to 64')
    }
    if (this._curveSegments === value) return
    this._curveSegments = value
    this.needsRebuild = true
    this.setDirty()
  }

  get smooth() {
    return this._smooth
  }

  set smooth(value = defaults.smooth) {
    if (!isBoolean(value)) {
      throw new Error('[prim] smooth must be a boolean')
    }
    if (this._smooth === value) return
    this._smooth = value
    this.needsRebuild = true
    this.setDirty()
  }

  get creaseAngle() {
    return this._creaseAngle
  }

  set creaseAngle(value = defaults.creaseAngle) {
    if (!isNumber(value) || !Number.isFinite(value) || value < 0 || value > Math.PI) {
      throw new Error('[prim] creaseAngle must be a number between 0 and PI')
    }
    if (this._creaseAngle === value) return
    this._creaseAngle = value
    this.needsRebuild = true
    this.setDirty()
  }

  get color() {
    return this._color
  }

  set color(value = defaults.color) {
    if (!isString(value)) {
      throw new Error('[prim] color must be string')
    }
    if (this._color === value) return
    this._color = value
    this.handle?.setColor(value) // no rebuild needed!
  }

  get emissive() {
    return this._emissive
  }

  set emissive(value = defaults.emissive) {
    if (value !== null && !isString(value)) {
      throw new Error('[prim] emissive must be string or null')
    }
    if (this._emissive === value) return
    this._emissive = value
    this.handle?.setEmissive(value) // no rebuild needed!
  }

  get castShadow() {
    return this._castShadow
  }

  set castShadow(value = defaults.castShadow) {
    if (typeof value !== 'boolean') {
      throw new Error('[prim] castShadow not a boolean')
    }
    if (this._castShadow === value) return
    this._castShadow = value
    this.needsRebuild = true
    this.setDirty()
  }

  get receiveShadow() {
    return this._receiveShadow
  }

  set receiveShadow(value = defaults.receiveShadow) {
    if (typeof value !== 'boolean') {
      throw new Error('[prim] receiveShadow not a boolean')
    }
    if (this._receiveShadow === value) return
    this._receiveShadow = value
    this.needsRebuild = true
    this.setDirty()
  }

  get emissiveIntensity() {
    return this._emissiveIntensity
  }

  set emissiveIntensity(value = defaults.emissiveIntensity) {
    if (!isNumber(value) || value < 0) {
      throw new Error('[prim] emissiveIntensity must be positive number')
    }
    if (this._emissiveIntensity === value) return
    this._emissiveIntensity = value
    this.handle?.setEmissiveIntensity(value) // no rebuild needed!
  }

  get metalness() {
    return this._metalness
  }

  set metalness(value = defaults.metalness) {
    if (!finiteNumber(value) || value < 0 || value > 1) {
      throw new Error('[prim] metalness must be number between 0 and 1')
    }
    if (this._metalness === value) return
    this._metalness = value
    this.needsRebuild = true
    this.setDirty()
  }

  get roughness() {
    return this._roughness
  }

  set roughness(value = defaults.roughness) {
    if (!finiteNumber(value) || value < 0 || value > 1) {
      throw new Error('[prim] roughness must be number between 0 and 1')
    }
    if (this._roughness === value) return
    this._roughness = value
    this.needsRebuild = true
    this.setDirty()
  }

  get opacity() {
    return this._opacity
  }

  set opacity(value = defaults.opacity) {
    if (!finiteNumber(value) || value < 0 || value > 1) {
      throw new Error('[prim] opacity must be number between 0 and 1')
    }
    if (this._opacity === value) return
    this._opacity = value
    this.needsRebuild = true
    this.setDirty()
  }

  get texture() {
    return this._texture
  }

  set texture(value = defaults.texture) {
    if (value !== null && typeof value !== 'string') {
      throw new Error('[prim] texture must be string or null')
    }
    if (this._texture === value) return
    this._texture = value
    this.needsRebuild = true
    this.setDirty()
  }

  get physics() {
    return this._physics
  }

  set physics(value = defaults.physics) {
    if (value !== null && value !== 'static' && value !== 'kinematic' && value !== 'dynamic') {
      throw new Error('[prim] physics must be null, "static", "kinematic", or "dynamic"')
    }
    if (this._physics === value) return
    this._physics = value
    this.needsRebuild = true
    this.setDirty()
  }

  get mass() {
    return this._mass
  }

  set mass(value = defaults.mass) {
    // below MIN_MASS PhysX rounds the mass to 0 with an infinite inverse, and a body that hits it goes NaN
    if (!finiteNumber(value) || !(Math.fround(value) >= Math.fround(MIN_MASS))) {
      throw new Error(`[prim] mass must be a finite number >= ${MIN_MASS}`)
    }
    if (this._mass === value) return
    this._mass = value
    this.needsRebuild = true
    this.setDirty()
  }

  get linearDamping() {
    return this._linearDamping
  }

  set linearDamping(value = defaults.linearDamping) {
    if (!finiteNumber(value) || value < 0) {
      throw new Error('[prim] linearDamping must be non-negative number')
    }
    if (this._linearDamping === value) return
    this._linearDamping = value
    this.needsRebuild = true
    this.setDirty()
  }

  get angularDamping() {
    return this._angularDamping
  }

  set angularDamping(value = defaults.angularDamping) {
    if (!finiteNumber(value) || value < 0) {
      throw new Error('[prim] angularDamping must be non-negative number')
    }
    if (this._angularDamping === value) return
    this._angularDamping = value
    this.needsRebuild = true
    this.setDirty()
  }

  get staticFriction() {
    return this._staticFriction
  }

  set staticFriction(value = defaults.staticFriction) {
    if (!finiteNumber(value) || value < 0 || value > 1) {
      throw new Error('[prim] staticFriction must be number between 0 and 1')
    }
    if (this._staticFriction === value) return
    this._staticFriction = value
    this.needsRebuild = true
    this.setDirty()
  }

  get dynamicFriction() {
    return this._dynamicFriction
  }

  set dynamicFriction(value = defaults.dynamicFriction) {
    if (!finiteNumber(value) || value < 0 || value > 1) {
      throw new Error('[prim] dynamicFriction must be number between 0 and 1')
    }
    if (this._dynamicFriction === value) return
    this._dynamicFriction = value
    this.needsRebuild = true
    this.setDirty()
  }

  get restitution() {
    return this._restitution
  }

  set restitution(value = defaults.restitution) {
    if (!finiteNumber(value) || value < 0 || value > 1) {
      throw new Error('[prim] restitution must be number between 0 and 1')
    }
    if (this._restitution === value) return
    this._restitution = value
    this.needsRebuild = true
    this.setDirty()
  }

  get layer() {
    return this._layer
  }

  set layer(value = defaults.layer) {
    if (!layers.includes(value)) {
      throw new Error(`[prim] invalid layer: ${value}`)
    }
    if (this._layer === value) return
    this._layer = value
    this.needsRebuild = true
    this.setDirty()
  }

  get trigger() {
    return this._trigger
  }

  set trigger(value = defaults.trigger) {
    if (!isBoolean(value)) {
      throw new Error('[prim] trigger must be boolean')
    }
    if (this._trigger === value) return
    this._trigger = value
    this.needsRebuild = true
    this.setDirty()
  }

  get tag() {
    return this._tag
  }

  set tag(value = defaults.tag) {
    if (value !== null && !isString(value)) {
      throw new Error('[prim] tag must be string or null')
    }
    if (this._tag === value) return
    this._tag = value
    // Tag can be updated without rebuild since it uses getter
  }

  get onContactStart() {
    return this._onContactStart
  }

  set onContactStart(value = defaults.onContactStart) {
    if (value !== null && typeof value !== 'function') {
      throw new Error('[prim] onContactStart must be function or null')
    }
    this._onContactStart = value
    // Callbacks can be updated without rebuild since they use getters
  }

  get onContactEnd() {
    return this._onContactEnd
  }

  set onContactEnd(value = defaults.onContactEnd) {
    if (value !== null && typeof value !== 'function') {
      throw new Error('[prim] onContactEnd must be function or null')
    }
    this._onContactEnd = value
    // Callbacks can be updated without rebuild since they use getters
  }

  get onTriggerEnter() {
    return this._onTriggerEnter
  }

  set onTriggerEnter(value = defaults.onTriggerEnter) {
    if (value !== null && typeof value !== 'function') {
      throw new Error('[prim] onTriggerEnter must be function or null')
    }
    this._onTriggerEnter = value
    // Callbacks can be updated without rebuild since they use getters
  }

  get onTriggerLeave() {
    return this._onTriggerLeave
  }

  set onTriggerLeave(value = defaults.onTriggerLeave) {
    if (value !== null && typeof value !== 'function') {
      throw new Error('[prim] onTriggerLeave must be function or null')
    }
    this._onTriggerLeave = value
    // Callbacks can be updated without rebuild since they use getters
  }

  get doubleside() {
    return this._doubleside
  }

  set doubleside(value = defaults.doubleside) {
    if (typeof value !== 'boolean') {
      throw new Error('[prim] doubleside must be boolean')
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
        get type() {
          return self.type
        },
        set type(value) {
          self.type = value
        },
        get size() {
          return self.size
        },
        set size(value) {
          self.size = value
        },
        get profile() {
          return self.profile
        },
        set profile(value) {
          self.profile = value
        },
        get depth() {
          return self.depth
        },
        set depth(value) {
          self.depth = value
        },
        get bevelEnabled() {
          return self.bevelEnabled
        },
        set bevelEnabled(value) {
          self.bevelEnabled = value
        },
        get bevelThickness() {
          return self.bevelThickness
        },
        set bevelThickness(value) {
          self.bevelThickness = value
        },
        get bevelSize() {
          return self.bevelSize
        },
        set bevelSize(value) {
          self.bevelSize = value
        },
        get bevelSegments() {
          return self.bevelSegments
        },
        set bevelSegments(value) {
          self.bevelSegments = value
        },
        get curveSegments() {
          return self.curveSegments
        },
        set curveSegments(value) {
          self.curveSegments = value
        },
        get smooth() {
          return self.smooth
        },
        set smooth(value) {
          self.smooth = value
        },
        get creaseAngle() {
          return self.creaseAngle
        },
        set creaseAngle(value) {
          self.creaseAngle = value
        },
        get color() {
          return self.color
        },
        set color(value) {
          self.color = value
        },
        get emissive() {
          return self.emissive
        },
        set emissive(value) {
          self.emissive = value
        },
        get emissiveIntensity() {
          return self.emissiveIntensity
        },
        set emissiveIntensity(value) {
          self.emissiveIntensity = value
        },
        get metalness() {
          return self.metalness
        },
        set metalness(value) {
          self.metalness = value
        },
        get roughness() {
          return self.roughness
        },
        set roughness(value) {
          self.roughness = value
        },
        get opacity() {
          return self.opacity
        },
        set opacity(value) {
          self.opacity = value
        },
        get transparent() {
          // return self.transparent
        },
        set transparent(value) {
          warnOnce('[prim] transparent is deprecated and ignored; use opacity instead')
          // self.transparent = value
        },
        get texture() {
          return self.texture
        },
        set texture(value) {
          self.texture = value
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
        get physics() {
          return self.physics
        },
        set physics(value) {
          self.physics = value
        },
        get mass() {
          return self.mass
        },
        set mass(value) {
          self.mass = value
        },
        get linearDamping() {
          return self.linearDamping
        },
        set linearDamping(value) {
          self.linearDamping = value
        },
        get angularDamping() {
          return self.angularDamping
        },
        set angularDamping(value) {
          self.angularDamping = value
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
        get layer() {
          return self.layer
        },
        set layer(value) {
          if (value === 'player') {
            throw new Error('[prim] layer invalid: player')
          }
          self.layer = value
        },
        get trigger() {
          return self.trigger
        },
        set trigger(value) {
          self.trigger = value
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
        get onTriggerEnter() {
          return self.onTriggerEnter
        },
        set onTriggerEnter(value) {
          self.onTriggerEnter = value
        },
        get onTriggerLeave() {
          return self.onTriggerLeave
        },
        set onTriggerLeave(value) {
          self.onTriggerLeave = value
        },
        get doubleside() {
          return self.doubleside
        },
        set doubleside(value) {
          self.doubleside = value
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}

function isUniformScale(vec3) {
  return vec3.x === vec3.y && vec3.y === vec3.z
}

function allFinite(values, count) {
  for (let i = 0; i < count; i++) if (!finiteNumber(values[i])) return false
  return true
}

// how many numbers each type reads from size (extra ones are ignored)
const MAX_SIZE_VALUES = 16
const sizeArity = { box: 3, sphere: 1, cylinder: 3, cone: 2, torus: 2, plane: 2 }

// returns { size, scaleOffset }, or { invalid } for sizes that lack values or would divide by zero
function getGeometryConfig(type, requestedSize) {
  let size
  let scaleOffset

  const arity = sizeArity[type]
  if (arity && !(requestedSize?.length >= arity && allFinite(requestedSize, arity))) {
    return { invalid: 'lacks values' }
  }

  switch (type) {
    case 'box': {
      // Always use unit box [1,1,1] and put ALL size into scale
      size = [1, 1, 1]
      scaleOffset = [...requestedSize] // Direct mapping to scale
      break
    }

    case 'sphere': {
      // Unit sphere with radius 1
      size = [1]
      scaleOffset = [requestedSize[0], requestedSize[0], requestedSize[0]]
      break
    }

    case 'cylinder': {
      const [rt, rb, h] = requestedSize
      if (rt === 0 && rb === 0) return { invalid: 'has zero radii' }
      // Only create different geometry if the taper ratio is different
      // If rt === rb, it's a uniform cylinder - use unit cylinder
      if (rt === rb) {
        size = [1, 1, 1] // Unit cylinder (uniform radius)
        scaleOffset = [rt, h, rt] // Scale X/Z for radius, Y for height
      } else {
        // Tapered cylinder - normalize by the ratio (of the magnitudes: a radius may be negative, a mirror)
        const maxR = Math.max(Math.abs(rt), Math.abs(rb))
        size = [rt / maxR, rb / maxR, 1]
        scaleOffset = [maxR, h, maxR]
      }
      break
    }

    case 'cone': {
      // All cones are the same shape (just a tapered cylinder with top radius 0)
      // Use unit cone and scale it
      size = [1, 1] // Unit cone
      const [r, h] = requestedSize
      scaleOffset = [r, h, r]
      break
    }

    case 'torus': {
      const [r, tube] = requestedSize
      if (r === 0) return { invalid: 'has a zero radius' }
      // Only the tube-to-main ratio matters for shape
      // Normalize so main radius is 1
      size = [1, tube / r]
      scaleOffset = [r, r, r]
      break
    }

    case 'plane': {
      // Always use unit plane and scale it
      size = [1, 1]
      scaleOffset = [...requestedSize, 1] // Scale X/Y, keep Z at 1
      break
    }

    case 'extrude': {
      // Extrusions keep their authored dimensions in the geometry. Ordinary
      // node scaling still applies, but size is intentionally not used.
      size = [1, 1, 1]
      scaleOffset = [1, 1, 1]
      break
    }

    default: {
      size = [1, 1, 1]
      scaleOffset = [1, 1, 1]
    }
  }

  // a ratio such as tube / r can leave float32 even when both inputs are finite (torus [1e-6, 1e38])
  if (!allFinite(size, size.length) || !allFinite(scaleOffset, scaleOffset.length)) {
    return { invalid: 'gives a shape outside float32' }
  }
  return { size, scaleOffset }
}

function createExtrudeGeometry(options) {
  const shape = new THREE.Shape()
  const profile = options.profile
  shape.moveTo(profile[0][0], profile[0][1])
  for (let i = 1; i < profile.length; i++) {
    shape.lineTo(profile[i][0], profile[i][1])
  }
  shape.closePath()

  let geometry = new THREE.ExtrudeGeometry(shape, {
    depth: options.depth,
    bevelEnabled: options.bevelEnabled,
    bevelThickness: options.bevelThickness,
    bevelSize: options.bevelSize,
    bevelSegments: options.bevelSegments,
    curveSegments: options.curveSegments,
  })
  if (options.smooth) {
    geometry = mergeVertices(geometry)
    geometry = toCreasedNormals(geometry, options.creaseAngle ?? Math.PI / 3)
  }
  geometry.center()
  return geometry
}

function validateProfile(value) {
  if (!isArray(value) || value.length < 3) {
    throw new Error('[prim] profile must be an array of at least 3 points')
  }
  for (const point of value) {
    if (!isArray(point) || point.length !== 2 || !finiteNumber(point[0]) || !finiteNumber(point[1])) {
      throw new Error('[prim] profile points must be [x, y] finite number pairs')
    }
  }
}

function getProfileBounds(profile) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const [x, y] of profile) {
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
  return { minX, maxX, minY, maxY }
}

function quantizeOpacity(opacity) {
  // For fully opaque, keep it exact
  if (opacity >= 0.99) return 1
  // For nearly transparent, keep it at 0
  if (opacity <= 0.01) return 0
  // Quantize to 20 steps (0.05 increments)
  // This gives smooth enough transitions while limiting materials to ~20 variants
  return Math.round(opacity * 20) / 20
}
