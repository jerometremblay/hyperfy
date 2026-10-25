import { handlePhysicsFailure } from '../extras/physicsFailure.js'
import * as THREE from '../extras/three'
import { isNumber } from 'lodash-es'

import { System } from './System'
import { LooseOctree } from '../extras/LooseOctree'
import { detectSplatFormat, getSparkFileType } from '../utils/splatFormats'
import { getSparkModule } from '../utils/sparkCache'

// Spark.js will be dynamically imported on client-side only
// Spark 2.0: SparkRenderer no longer needs camera attachment (auto camera-relative)

// Pre-computed 180° rotation quaternion around X-axis for splat orientation fix
// Splat files are typically exported upside-down and need this internal correction
const SPLAT_FLIP_QUATERNION = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI)
const _tempPosition = new THREE.Vector3()
const _tempQuaternion = new THREE.Quaternion()
const _tempScale = new THREE.Vector3()

// Render Order for Transparent Objects (Three.js renders lower values first):
// -1000: Gaussian Splats (SparkRenderer, SplatMesh) - render first so other transparents appear on top
//     0: Standard transparent meshes (GLTF, etc.) - default Three.js behavior
//   100: UI elements - render on top of splats and meshes
//   999: Action highlights (ClientActions)
//  9999: Nametags - always on top

// Device-based performance settings
const getDevicePerformanceTier = () => {
  if (typeof window === 'undefined') return 'desktop'

  const ua = navigator.userAgent
  const isQuest = /OculusBrowser|Quest/i.test(ua)
  const isVisionPro = /Apple.*XR|Vision/i.test(ua)
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)
  const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4

  if (isQuest) return 'quest'
  if (isVisionPro) return 'visionpro'
  if (isIOS) return 'ios'
  if (isAndroid || hasLowMemory) return 'android'
  return 'desktop'
}

// Spark 2.0: lodSplatCount = base number of splats to render (platform budget)
// These are the official Spark.js recommended defaults
const getDefaultLodSplatCount = () => {
  const tier = getDevicePerformanceTier()
  switch (tier) {
    case 'quest':
      return 500_000 // Quest: 500K splats max
    case 'visionpro':
      return 750_000 // Vision Pro: 750K splats
    case 'android':
      return 1_000_000 // Android: 1M splats
    case 'ios':
      return 1_500_000 // iOS: 1.5M splats
    default:
      return 2_500_000 // Desktop: 2.5M splats
  }
}

// Spark 2.0: lodSplatScale = multiplier on lodSplatCount
// Lower = fewer splats (better performance), Higher = more splats (better quality)
// Default 1.0 uses the full budget, 0.5 uses half, 2.0 uses double
const getDefaultLodSplatScale = () => {
  const tier = getDevicePerformanceTier()
  switch (tier) {
    case 'quest':
      return 0.5 // Quest: use 50% of budget for safety
    case 'visionpro':
      return 0.8 // Vision Pro: use 80%
    case 'android':
      return 0.7 // Android: use 70%
    case 'ios':
      return 0.8 // iOS: use 80%
    default:
      return 1.0 // Desktop: full budget
  }
}
import { serializeError } from '../extras/serializeError'

const vec2 = new THREE.Vector2()
const CLEAN_RETRY_CAP = 10

/**
 * Stage System
 *
 * - Runs on both the server and client.
 * - Allows inserting meshes etc into the world, and providing a handle back.
 * - Automatically handles instancing/batching.
 * - This is a logical scene graph, no rendering etc is handled here.
 *
 */
export class Stage extends System {
  constructor(world) {
    super(world)
    this.scene = new THREE.Scene()
    this.sparkRenderer = null
    this.models = new Map() // id -> Model
    this.splatMeshes = new Map() // id -> SplatMesh instances
    this.raycastObjects = new Set()
    this.octree = new LooseOctree({
      scene: this.scene,
      center: new THREE.Vector3(0, 0, 0),
      size: 10,
    })
    this.defaultMaterial = null
    this.raycaster = new THREE.Raycaster()
    this.raycaster.firstHitOnly = true
    this.raycastHits = []
    this.raycastObjectHits = []
    this.maskNone = new THREE.Layers()
    this.maskNone.enableAll()
    this.dirtyNodes = new Set()
  }

  init({ viewport }) {
    this.viewport = viewport
    this.scene.add(this.world.rig)
  }

  update(_delta) {
    this.models.forEach(model => model.clean())
  }

  postUpdate() {
    this.clean() // after update all matrices should be up to date for next step
  }

  postLateUpdate() {
    this.clean() // after lateUpdate all matrices should be up to date for next step
  }

  getDefaultMaterial() {
    if (!this.defaultMaterial) {
      this.defaultMaterial = this.createMaterial()
    }
    return this.defaultMaterial
  }

  clean() {
    let failed
    for (const node of this.dirtyNodes) {
      try {
        node.clean()
        if (node._cleanFailures) node._cleanFailures = 0
      } catch (err) {
        if (!failed) failed = []
        failed.push({ node, err })
      }
    }
    this.dirtyNodes.clear()
    if (failed) this.containCleanFailures(failed)
  }

  // A node whose update throws (eg a script put a throwing valueOf into its transform) must not stop
  // every other node from updating. App-owned nodes crash their app, which unbuilds the whole subtree.
  // Other nodes are retried on the next pass, up to CLEAN_RETRY_CAP consecutive failures; after that the
  // node is left untracked until a later write tracks it again.
  // A failed Node.clean() may have consumed transform flags part-way through its subtree, so a retry
  // re-tracks the top of that traversal with the whole subtree marked transformed (full recompute), and
  // giving up recomputes what it can before releasing the flags, so later writes find consistent matrices.
  // NOTE: until the shared THREE prototypes are hardened, the failing code may be another app's patch.
  containCleanFailures(failed) {
    const crashed = new Set()
    for (const { node, err } of failed) {
      const owner = node.ctx?.entity
      const trapped = handlePhysicsFailure(err, { entity: owner, world: this.world, phase: 'Stage.clean' })
      try {
        if (!node._cleanFailed) {
          node._cleanFailed = true
          console.error(`[stage] node update failed (node ${node.id}, entity ${owner?.data?.id ?? 'none'})`)
          console.error(err)
        }
        if (owner?.isApp && !crashed.has(owner)) owner.scriptError = serializeError(err)
      } catch {
        // a hostile error object (eg throwing getters) must not stop the containment itself
      }
      if (owner?.isApp) {
        if (crashed.has(owner)) continue
        crashed.add(owner)
        if (!trapped) owner.crash()
        continue
      }
      // the traversal that failed started at the top of the dirty chain, like Node.clean()
      let top = node
      while (top.parent && top.parent.isDirty) {
        top = top.parent
      }
      node._cleanFailures = (node._cleanFailures || 0) + 1
      if (node._cleanFailures >= CLEAN_RETRY_CAP) {
        if (!node._cleanGaveUp) {
          node._cleanGaveUp = true
          console.error(
            `[stage] giving up on node ${node.id} (entity ${owner?.data?.id ?? 'none'}) after ${CLEAN_RETRY_CAP} failures`
          )
        }
        node._cleanFailures = 0
        top.traverse(child => {
          try {
            child.updateTransform()
          } catch {
            // stays stale until its next write
          }
          child.isDirty = false
          child.isTransformed = false
          this.dirtyNodes.delete(child)
        })
        continue
      }
      top.traverse(child => {
        child.isTransformed = true
        child.isDirty = true
        this.dirtyNodes.delete(child)
      })
      this.dirtyNodes.add(top)
    }
  }

  insert(options) {
    if (options.linked) {
      return this.insertLinked(options)
    } else {
      return this.insertSingle(options)
    }
  }

  insertRaycastObject({ object, node }) {
    const item = {
      object,
      node,
      getEntity: () => node.ctx?.entity,
    }
    this.raycastObjects.add(item)
    return {
      destroy: () => {
        this.raycastObjects.delete(item)
      },
    }
  }

  releaseGeometry(geometry) {
    for (const [id, model] of this.models) {
      if (model.sourceGeometry !== geometry || model.items.length) continue
      model.dispose()
      this.models.delete(id)
    }
  }

  insertLinked({ geometry, material, uberShader, castShadow, receiveShadow, node, matrix }) {
    const id = `${geometry.uuid}/${material.uuid}/${uberShader}/${castShadow}/${receiveShadow}`
    if (!this.models.has(id)) {
      const model = new Model(this, geometry, material, uberShader, castShadow, receiveShadow)
      this.models.set(id, model)
    }
    return this.models.get(id).create(node, matrix)
  }

  insertSingle({ geometry, material, castShadow, receiveShadow, node, matrix }) {
    material = this.createMaterial({ raw: material })
    const mesh = new THREE.Mesh(geometry, material.raw)
    mesh.castShadow = castShadow
    mesh.receiveShadow = receiveShadow
    mesh.matrixWorld.copy(matrix)
    mesh.matrixAutoUpdate = false
    mesh.matrixWorldAutoUpdate = false
    const sItem = {
      matrix,
      geometry,
      material: material.raw,
      getEntity: () => node.ctx.entity,
      node,
    }
    this.scene.add(mesh)
    this.octree.insert(sItem)
    return {
      material: material.proxy,
      hideForPhoto: () => {
        const visible = mesh.visible
        mesh.visible = false
        return () => {
          mesh.visible = visible
        }
      },
      move: matrix => {
        mesh.matrixWorld.copy(matrix)
        this.octree.move(sItem)
      },
      destroy: () => {
        this.scene.remove(mesh)
        this.octree.remove(sItem)
        material.dispose()
      },
    }
  }

  createMaterial(options = {}) {
    const material = {}
    let raw
    if (options.raw) {
      raw = options.raw.clone()
      const sourceMaterial = options.raw
      const sourceOnBeforeCompile = sourceMaterial.onBeforeCompile
      raw.customProgramCacheKey = () => sourceMaterial.customProgramCacheKey()
      raw.onBeforeCompile = (shader, renderer) => {
        sourceOnBeforeCompile?.call(raw, shader, renderer)
        raw.userData.shader = shader
        sourceMaterial._compiledStageShaders ||= new Set()
        sourceMaterial._compiledStageShaders.add(shader)
        raw._sourceShaders ||= new Set()
        raw._sourceShaders.add(shader)
      }
    } else if (options.unlit) {
      raw = new THREE.MeshBasicMaterial({
        color: options.color || 'white',
      })
    } else {
      raw = new THREE.MeshStandardMaterial({
        color: options.color || 'white',
        metalness: isNumber(options.metalness) ? options.metalness : 0,
        roughness: isNumber(options.roughness) ? options.roughness : 1,
      })
    }
    raw.shadowSide = THREE.BackSide // fix csm shadow banding
    const textures = []
    if (raw.map) {
      raw.map = raw.map.clone()
      textures.push(raw.map)
    }
    if (raw.emissiveMap) {
      raw.emissiveMap = raw.emissiveMap.clone()
      textures.push(raw.emissiveMap)
    }
    if (raw.normalMap) {
      raw.normalMap = raw.normalMap.clone()
      textures.push(raw.normalMap)
    }
    if (raw.bumpMap) {
      raw.bumpMap = raw.bumpMap.clone()
      textures.push(raw.bumpMap)
    }
    if (raw.roughnessMap) {
      raw.roughnessMap = raw.roughnessMap.clone()
      textures.push(raw.roughnessMap)
    }
    if (raw.metalnessMap) {
      raw.metalnessMap = raw.metalnessMap.clone()
      textures.push(raw.metalnessMap)
    }
    material.dispose = () => {
      raw.dispose()
      for (const texture of textures) texture.dispose()
      if (options.raw && raw._sourceShaders) {
        for (const shader of raw._sourceShaders) {
          options.raw._compiledStageShaders?.delete(shader)
        }
      }
    }
    this.world.setupMaterial(raw)
    const proxy = {
      get id() {
        return raw.uuid
      },
      get textureX() {
        return textures[0]?.offset.x
      },
      set textureX(val) {
        for (const tex of textures) {
          tex.offset.x = val
        }
        raw.needsUpdate = true
      },
      get textureY() {
        return textures[0]?.offset.y
      },
      set textureY(val) {
        for (const tex of textures) {
          tex.offset.y = val
        }
        raw.needsUpdate = true
      },
      get color() {
        return raw.color
      },
      set color(val) {
        if (typeof val !== 'string') {
          throw new Error('[material] color must be a string (e.g. "red", "#ff0000", "rgb(255,0,0)")')
        }
        raw.color.set(val)
        raw.needsUpdate = true
      },
      get emissiveIntensity() {
        return raw.emissiveIntensity
      },
      set emissiveIntensity(value) {
        if (!isNumber(value)) {
          throw new Error('[material] emissiveIntensity not a number')
        }
        raw.emissiveIntensity = value
        raw.needsUpdate = true
      },
      get fog() {
        return raw.fog
      },
      set fog(value) {
        raw.fog = value
        raw.needsUpdate = true
      },
      get _ref() {
        if (typeof globalThis.world !== 'undefined' && globalThis.world._allowMaterial) return material
        return undefined
      },
    }
    material.raw = raw
    material.proxy = proxy
    return material
  }

  raycastPointer(position, layers = this.maskNone, min = 0, max = Infinity) {
    if (!this.viewport) throw new Error('no viewport')
    const rect = this.viewport.getBoundingClientRect()
    vec2.x = ((position.x - rect.left) / rect.width) * 2 - 1
    vec2.y = -((position.y - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(vec2, this.world.camera)
    this.raycaster.layers = layers
    this.raycaster.near = min
    this.raycaster.far = max
    this.raycastHits.length = 0
    this.octree.raycast(this.raycaster, this.raycastHits)
    this._raycastObjects(this.raycaster, this.raycastHits)

    // Also raycast against SplatMeshes using Three.js standard raycasting
    this._raycastSplatMeshes(this.raycaster, this.raycastHits)

    return this.raycastHits
  }

  raycastReticle(layers = this.maskNone, min = 0, max = Infinity) {
    if (!this.viewport) throw new Error('no viewport')
    vec2.x = 0
    vec2.y = 0
    this.raycaster.setFromCamera(vec2, this.world.camera)
    this.raycaster.layers = layers
    this.raycaster.near = min
    this.raycaster.far = max
    this.raycastHits.length = 0
    this.octree.raycast(this.raycaster, this.raycastHits)
    this._raycastObjects(this.raycaster, this.raycastHits)

    // Also raycast against SplatMeshes using Three.js standard raycasting
    this._raycastSplatMeshes(this.raycaster, this.raycastHits)

    return this.raycastHits
  }

  // Internal splat raycast - DISABLED for continuous raycasting (performance)
  _raycastSplatMeshes(raycaster, hits) {
    // Disabled for continuous use - too expensive every frame
    // Use raycastSplatsOnDemand() for on-click selection instead
    return
  }

  _raycastObjects(raycaster, hits) {
    const objectHits = this.raycastObjectHits
    for (const item of this.raycastObjects) {
      const { object } = item
      if (!object.parent) continue
      object.updateMatrixWorld(true)
      objectHits.length = 0
      object.raycast(raycaster, objectHits)
      for (const hit of objectHits) {
        hit.getEntity = item.getEntity
        hit.node = item.node
        hit.direction = raycaster.ray.direction
        hits.push(hit)
      }
    }
    hits.sort((a, b) => a.distance - b.distance)
  }

  // On-demand splat raycasting - call this only on click/selection, not every frame!
  // Uses Spark.js native WASM-based ellipsoid raycasting for precision
  raycastSplatsOnDemand(raycaster) {
    if (this.splatMeshes.size === 0) return []

    const hits = []

    // Raycast ALL splats directly using Spark's precise ellipsoid raycasting
    // No bounding box pre-check needed - Spark's WASM is fast enough for on-demand use
    for (const [id, splatMesh] of this.splatMeshes) {
      if (!splatMesh.isInitialized) continue

      const splatHits = []
      // Spark.js raycast uses WASM with RAYCAST_ELLIPSOID=true
      // This tests against actual splat ellipsoids, not just bounding boxes
      splatMesh.raycast(raycaster, splatHits)

      for (const hit of splatHits) {
        const foundNode = splatMesh._hyperfyNode
        hits.push({
          distance: hit.distance,
          point: hit.point,
          node: foundNode,
          getEntity: () => foundNode?.ctx?.entity,
          object: splatMesh,
        })
      }
    }

    hits.sort((a, b) => a.distance - b.distance)
    return hits
  }

  // Helper: Setup raycaster from pointer position for on-demand splat selection
  raycastSplatsAtPointer(position) {
    if (!this.viewport) return []
    const rect = this.viewport.getBoundingClientRect()
    vec2.x = ((position.x - rect.left) / rect.width) * 2 - 1
    vec2.y = -((position.y - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(vec2, this.world.camera)
    return this.raycastSplatsOnDemand(this.raycaster)
  }

  // Helper: Setup raycaster from reticle (center screen) for on-demand splat selection
  raycastSplatsAtReticle() {
    if (!this.viewport) return []
    vec2.x = 0
    vec2.y = 0
    this.raycaster.setFromCamera(vec2, this.world.camera)
    return this.raycastSplatsOnDemand(this.raycaster)
  }

  // Helper: Setup common splat mesh properties
  // Note: Spark 2.0 - lodSplatScale is now on SparkRenderer, not SplatMesh
  _setupSplatMesh(splatMesh, { node, matrix, color, opacity, splatScale }) {
    // Apply user scale
    if (splatScale && splatScale !== 1.0) {
      splatMesh.scale.setScalar(splatScale)
    }

    // Apply transform with internal 180° X-axis flip for correct splat orientation
    // Decompose user matrix, apply flip rotation, recompose
    matrix.decompose(_tempPosition, _tempQuaternion, _tempScale)
    _tempQuaternion.multiply(SPLAT_FLIP_QUATERNION) // Apply flip in local space
    splatMesh.matrix.compose(_tempPosition, _tempQuaternion, _tempScale)
    splatMesh.matrixAutoUpdate = false
    splatMesh.updateMatrixWorld(true)

    // Store node reference for raycasting
    splatMesh._hyperfyNode = node
    // Render splats early in transparent pass so UI/transparent meshes render on top
    splatMesh.renderOrder = -1000
    this.scene.add(splatMesh)

    // Store reference (mesh uuid avoids collisions when nodes have no id)
    const id = node.id || splatMesh.uuid
    this.splatMeshes.set(id, splatMesh)

    // Apply color/opacity - use already imported THREE
    if (color && color !== '#ffffff') {
      const colorObj = new THREE.Color(color)
      splatMesh.recolor.set(colorObj.r, colorObj.g, colorObj.b)
    }
    if (opacity !== undefined && opacity !== 1.0) {
      splatMesh.opacity = opacity
    }

    return id
  }

  // Helper: Create splat handle object
  _createSplatHandle(splatMesh, { id, srcUrl, removeFromCache = false }) {
    return {
      splatMesh,
      move: newMatrix => {
        // Apply same internal 180° flip as in _setupSplatMesh
        newMatrix.decompose(_tempPosition, _tempQuaternion, _tempScale)
        _tempQuaternion.multiply(SPLAT_FLIP_QUATERNION)
        splatMesh.matrix.compose(_tempPosition, _tempQuaternion, _tempScale)
        splatMesh.updateMatrixWorld(true)
      },
      updateColor: newColor => {
        const colorObj = new THREE.Color(newColor)
        splatMesh.recolor.set(colorObj.r, colorObj.g, colorObj.b)
      },
      updateOpacity: newOpacity => {
        splatMesh.opacity = newOpacity
      },
      updateSplatScale: newScale => {
        splatMesh.scale.setScalar(newScale)
      },
      // Spark 2.0: lodSplatScale is global - use world.stage.setLodSplatScale()
      updateLodSplatScale: () => {},
      destroy: () => {
        this.scene.remove(splatMesh)
        this.splatMeshes.delete(id)
        splatMesh.dispose?.()
        if (removeFromCache && srcUrl) {
          this.world.loader.remove('splat', srcUrl)
        }
      },
    }
  }

  async insertGaussianSplat({
    url,
    node,
    matrix,
    color = '#ffffff',
    opacity = 1.0,
    splatScale = 1.0,
    onProgress = null,
  }) {
    // Only create SplatMesh on client
    if (this.world.network.isServer) {
      return {
        splatMesh: null,
        move: () => {},
        destroy: () => {},
      }
    }

    try {
      // Dynamically import Spark.js only on client using cached import
      const { SplatMesh, SparkRenderer } = await getSparkModule()

      // Create SparkRenderer singleton (Spark 2.0: no camera attachment needed)
      if (!this.sparkRenderer && this.world.camera && this.world.graphics?.renderer) {
        const tier = getDevicePerformanceTier()
        const lodSplatCount = getDefaultLodSplatCount()
        const lodSplatScale = getDefaultLodSplatScale()

        // Spark 2.0: maxStdDev limits Gaussian extent (lower = better perf, slightly lower quality)
        const maxStdDev =
          tier === 'quest' || tier === 'android' ? 1.8 : tier === 'ios' || tier === 'visionpro' ? 2.0 : Math.sqrt(8) // Desktop: ~2.83

        // Spark 2.0: LOD settings are now on Renderer level
        this.sparkRenderer = new SparkRenderer({
          renderer: this.world.graphics.renderer,
          enableLod: true,
          lodSplatCount: lodSplatCount,
          lodSplatScale: lodSplatScale,
          maxStdDev: maxStdDev,
        })

        // Render splats early in transparent pass so UI/transparent meshes render on top
        // Three.js renders lower renderOrder first in the transparent pass
        this.sparkRenderer.renderOrder = -1000

        this.scene.add(this.sparkRenderer)
      }

      // Detect file type from source URL using shared utility
      const srcUrl = node._src || url
      const ext = srcUrl ? detectSplatFormat(srcUrl) : null
      const fileType = ext ? getSparkFileType(ext) : null

      const isSOGS = fileType === 'pcsogs' || fileType === 'pcsogszip'
      // Spark 2.0: lodSplatScale is now on SparkRenderer, not per-SplatMesh
      const setupOptions = { node, matrix, color, opacity, splatScale }

      // SOGS/ZIP: Use URL-based loading (Spark.js handles decompression)
      if (isSOGS) {
        const splatMesh = new SplatMesh({
          url: url,
          fileType: fileType,
          lod: true,
          onProgress: onProgress,
        })

        const id = this._setupSplatMesh(splatMesh, setupOptions)

        return this._createSplatHandle(splatMesh, { id, srcUrl: null })
      }

      // All other formats: Load via Hyperfy's asset system
      let splatData = this.world.loader.get('splat', srcUrl)
      if (!splatData) {
        splatData = await this.world.loader.load('splat', srcUrl)
      }

      const splatMesh = await splatData.createSplatMesh({ onProgress })
      const id = this._setupSplatMesh(splatMesh, setupOptions)

      return this._createSplatHandle(splatMesh, { id, srcUrl, removeFromCache: true })
    } catch (error) {
      console.error('❌ SplatMesh creation failed:', error)
      return null
    }
  }

  raycast(origin, direction, layers = this.maskNone, min = 0, max = Infinity) {
    if (!this.viewport) throw new Error('no viewport')
    vec2.x = 0
    vec2.y = 0
    this.raycaster.set(origin, direction)
    this.raycaster.layers = layers
    this.raycaster.near = min
    this.raycaster.far = max
    this.raycastHits.length = 0
    this.octree.raycast(this.raycaster, this.raycastHits)
    this._raycastObjects(this.raycaster, this.raycastHits)

    // Also raycast against SplatMeshes using Three.js standard raycasting
    this._raycastSplatMeshes(this.raycaster, this.raycastHits)

    return this.raycastHits
  }

  // Spark 2.0: Global LOD control methods
  getSparkRenderer() {
    return this.sparkRenderer
  }

  setLodSplatScale(scale) {
    if (this.sparkRenderer) {
      this.sparkRenderer.lodSplatScale = Math.max(0.1, scale)
    }
  }

  getLodSplatScale() {
    return this.sparkRenderer?.lodSplatScale || getDefaultLodSplatScale()
  }

  setLodSplatCount(count) {
    if (this.sparkRenderer) {
      this.sparkRenderer.lodSplatCount = count
    }
  }

  getLodSplatCount() {
    return this.sparkRenderer?.lodSplatCount || getDefaultLodSplatCount()
  }

  // Get current device tier for debugging
  getDeviceTier() {
    return getDevicePerformanceTier()
  }

  destroy() {
    if (this.world.isPreview) {
      for (const model of this.models.values()) {
        model.iMesh.removeFromParent()
        model.iMesh.dispose()
        model.material.dispose()
        model.geometry.dispose()
      }
      this.defaultMaterial?.dispose()
    }
    this.models.clear()
    this.raycastObjects.clear()
    this.raycastObjectHits.length = 0
    // Clean up splat meshes
    for (const [_id, splatMesh] of this.splatMeshes) {
      this.scene.remove(splatMesh)
      if (splatMesh.dispose) {
        splatMesh.dispose()
      }
    }
    this.splatMeshes.clear()

    // Clean up SparkRenderer
    if (this.sparkRenderer) {
      this.scene.remove(this.sparkRenderer)
      this.sparkRenderer.dispose?.()
      this.sparkRenderer = null
    }
  }
}

class Model {
  constructor(stage, geometry, material, uberShader, castShadow, receiveShadow) {
    material = stage.createMaterial({ raw: material })

    this.stage = stage
    this.sourceGeometry = geometry
    this.geometry = geometry.clone() // important since uber shader needs unique buffer attributes
    this.material = material
    this.uberShader = uberShader
    this.castShadow = castShadow
    this.receiveShadow = receiveShadow

    if (!this.geometry.boundsTree) this.geometry.computeBoundsTree()

    // this.mesh = mesh.clone()
    // this.mesh.geometry.computeBoundsTree() // three-mesh-bvh
    // // this.mesh.geometry.computeBoundingBox() // spatial octree
    // // this.mesh.geometry.computeBoundingSphere() // spatial octree
    // this.mesh.material.shadowSide = THREE.BackSide // fix csm shadow banding
    // this.mesh.castShadow = true
    // this.mesh.receiveShadow = true
    // this.mesh.matrixAutoUpdate = false
    // this.mesh.matrixWorldAutoUpdate = false

    this.iMesh = new THREE.InstancedMesh(this.geometry, this.material.raw, 10)
    // this.iMesh.name = this.mesh.name
    this.iMesh.castShadow = this.castShadow
    this.iMesh.receiveShadow = this.receiveShadow
    this.iMesh.matrixAutoUpdate = false
    this.iMesh.matrixWorldAutoUpdate = false
    this.iMesh.frustumCulled = true
    this.iMesh.getEntity = this.getEntity.bind(this)
    this.items = [] // { idx, node, matrix, color }
    this.dirty = true

    // uber shader extends to support more per-instance properties like emissive, emissiveItensity and anything else in the future
    if (this.uberShader) {
      const prev = this.material.raw.onBeforeCompile
      // see: https://claude.ai/chat/b73be3e5-bb52-4da2-a47e-fbbf4f3eb54b
      this.material.raw.onBeforeCompile = function (shader) {
        prev?.(shader)
        shader.vertexShader = shader.vertexShader.replace(
          `#include <color_pars_vertex>`,
          `
          #include <color_pars_vertex>
          #ifdef USE_UBER_SHADER
            attribute vec3 instanceEmissive;
            attribute float instanceEmissiveIntensity;
            varying vec3 vInstanceEmissive;
          #endif
          `
        )
        shader.vertexShader = shader.vertexShader.replace(
          `#include <color_vertex>`,
          `
          #include <color_vertex>
          #ifdef USE_UBER_SHADER
            vInstanceEmissive = instanceEmissive * instanceEmissiveIntensity;
          #endif
          `
        )
        shader.fragmentShader = shader.fragmentShader.replace(
          `#include <color_pars_fragment>`,
          `
          #include <color_pars_fragment>
          #ifdef USE_UBER_SHADER
            varying vec3 vInstanceEmissive;
          #endif
          `
        )
        shader.fragmentShader = shader.fragmentShader.replace(
          `vec3 totalEmissiveRadiance = emissive;`,
          `
          vec3 totalEmissiveRadiance = emissive;
          #ifdef USE_UBER_SHADER
            totalEmissiveRadiance = vInstanceEmissive;
          #endif
          `
        )
      }
      this.material.raw.defines.USE_UBER_SHADER = ''
      this.material.raw.needsUpdate = true
    }
  }

  dispose() {
    this.stage.scene.remove(this.iMesh)
    this.iMesh.dispose()
    this.geometry.dispose()
    this.material.dispose()
  }

  create(node, matrix) {
    const item = {
      idx: this.items.length,
      node,
      matrix,
      color: null,
      emissive: null,
      emissiveIntensity: null,
      // octree
    }
    this.items.push(item)
    this.iMesh.setMatrixAt(item.idx, item.matrix) // silently fails if too small, gets increased in clean()
    this.dirty = true
    const sItem = {
      matrix,
      geometry: this.geometry,
      material: this.material.raw,
      getEntity: () => this.items[item.idx]?.node.ctx.entity,
      node,
    }
    this.stage.octree.insert(sItem)
    return {
      material: this.material.proxy,
      hideForPhoto: () => {
        const matrix = new THREE.Matrix4()
        this.iMesh.getMatrixAt(item.idx, matrix)
        this.iMesh.setMatrixAt(item.idx, new THREE.Matrix4().makeScale(0, 0, 0))
        this.iMesh.instanceMatrix.needsUpdate = true
        return () => {
          this.iMesh.setMatrixAt(item.idx, matrix)
          this.iMesh.instanceMatrix.needsUpdate = true
        }
      },
      move: matrix => {
        this.move(item, matrix)
        this.stage.octree.move(sItem)
      },
      setColor: value => {
        if (!item.color) item.color = new THREE.Color()
        item.color.set(value)
        this.iMesh.setColorAt(item.idx, item.color)
        this.iMesh.instanceColor.needsUpdate = true
      },
      setEmissive: value => {
        if (!item.emissive) item.emissive = new THREE.Color()
        item.emissive.set(value)
        this.iMesh.setEmissiveAt(item.idx, item.emissive)
        this.iMesh.instanceEmissive.needsUpdate = true
      },
      setEmissiveIntensity: value => {
        item.emissiveIntensity = value
        this.iMesh.setEmissiveIntensityAt(item.idx, item.emissiveIntensity)
        this.iMesh.instanceEmissiveIntensity.needsUpdate = true
      },
      destroy: () => {
        this.destroy(item)
        this.stage.octree.remove(sItem)
      },
    }
  }

  move(item, matrix) {
    item.matrix.copy(matrix)
    this.iMesh.setMatrixAt(item.idx, matrix)
    // Moves can happen after clean(), before a main or shadow camera renders.
    this.iMesh.boundingSphere = null
    this.dirty = true
  }

  destroy(item) {
    const last = this.items[this.items.length - 1]
    const isOnly = this.items.length === 1
    const isLast = item === last
    if (isOnly) {
      this.items = []
      this.dirty = true
    } else if (isLast) {
      // this is the last instance in the buffer, pop it off the end
      this.items.pop()
      this.dirty = true
    } else {
      // there are other instances after this one in the buffer, swap it with the last one and pop it off the end
      this.iMesh.setMatrixAt(item.idx, last.matrix)
      if (last.color) this.iMesh.setColorAt(item.idx, last.color)
      if (last.emissive) this.iMesh.setEmissiveAt(item.idx, last.emissive)
      if (last.emissiveIntensity || last.emissiveIntensity === 0) {
        this.iMesh.setEmissiveIntensityAt(item.idx, last.emissiveIntensity)
      }
      last.idx = item.idx
      this.items[item.idx] = last
      this.items.pop()
      this.dirty = true
    }
  }

  clean() {
    if (!this.dirty) return
    const size = this.iMesh.instanceMatrix.array.length / 16
    const count = this.items.length
    if (!count) {
      this.iMesh.count = 0
      this.iMesh.boundingSphere = null
      this.stage.scene.remove(this.iMesh)
      this.dirty = false
      return
    }
    if (size < this.items.length) {
      const newSize = count + 100
      // console.log('increase', this.mesh.name, 'from', size, 'to', newSize)
      this.iMesh.resize(newSize)
      for (let i = size; i < count; i++) {
        const item = this.items[i]
        this.iMesh.setMatrixAt(i, item.matrix)
        if (item.color) this.iMesh.setColorAt(i, item.color)
        if (item.emissive) this.iMesh.setEmissiveAt(i, item.emissive)
        if (item.emissiveIntensity || item.emissiveIntensity === 0) {
          this.iMesh.setEmissiveIntensityAt(i, item.emissiveIntensity)
        }
      }
    }
    this.iMesh.count = count
    // Three.js rebuilds the batch sphere lazily, using only active instances.
    this.iMesh.boundingSphere = null
    if (!this.iMesh.parent && count) {
      this.stage.scene.add(this.iMesh)
    }
    this.iMesh.instanceMatrix.needsUpdate = true
    if (this.iMesh.instanceColor) {
      this.iMesh.instanceColor.needsUpdate = true
    }
    if (this.iMesh.instanceEmissive) {
      this.iMesh.instanceEmissive.needsUpdate = true
    }
    if (this.iMesh.instanceEmissiveIntensity) {
      this.iMesh.instanceEmissiveIntensity.needsUpdate = true
    }
    this.dirty = false
  }

  getEntity(instanceId) {
    return this.items[instanceId]?.node.ctx.entity
  }

  getTriangles() {
    const geometry = this.geometry
    if (geometry.index !== null) {
      return geometry.index.count / 3
    } else {
      return geometry.attributes.position.count / 3
    }
  }
}
