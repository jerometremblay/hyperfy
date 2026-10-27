import * as THREE from '../extras/three'
import { N8AOPostPass } from 'n8ao'
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAPreset,
  SMAAEffect,
  ToneMappingEffect,
  ToneMappingMode,
  BloomEffect,
  BlendFunction,
} from 'postprocessing'

import { System } from './System'
import { updatePortalCamera } from '../extras/portalCamera'
import { limitLightShadows } from '../extras/shadowBudget'
import { getPortalArrival } from '../extras/portalArrival'
import { PortalAvatars } from '../extras/PortalAvatars'
import { PhotoCapture } from '../extras/PhotoCapture'

// NOTE: postprocessing is pinned to 6.x. The 7.x GeometryPass renders the scene
// with MRT (multiple render targets), which conflicts with Spark.js splat shaders
// (single `out vec4 fragColor` without layout locations). 6.x uses a classic
// single-target RenderPass, which Spark renders into like any forward pass.

const v1 = new THREE.Vector3()
const portalInverse = new THREE.Matrix4()

let renderer
function getRenderer() {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: true, // Required for CSS3D WebView occlusion
      // logarithmicDepthBuffer: true,
      // reverseDepthBuffer: true,
    })
  }
  return renderer
}

/**
 * Graphics System
 *
 * - Runs on the client
 * - Supports renderer, shadows, postprocessing, etc
 * - Renders to the viewport
 *
 */
export class ClientGraphics extends System {
  constructor(world) {
    super(world)
    this.photos = new PhotoCapture(this)
    this.portals = new Set()
    this.renderingPortal = false
    this.portalAvatars = new PortalAvatars(world)
    this.lightVisibility = new Map()
    this.lightCompilation = null
    this.lightPreparations = []
    this.lightPrograms = new WeakSet()
    this.lightProgramsInitialized = false
    this.lightDraws = new Set()
  }

  async init({ viewport }) {
    this.viewport = viewport
    this.width = this.viewport.offsetWidth
    this.height = this.viewport.offsetHeight
    this.aspect = this.width / this.height
    this.renderer = getRenderer()
    this.renderer.localClippingEnabled = true
    this.renderer.setSize(this.width, this.height)
    this.renderer.setClearColor(0xffffff, 0)
    this.renderer.setPixelRatio(this.world.prefs.dpr)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    // Tone mapping happens in the composer (ToneMappingEffect). The direct-render
    // fallback (XR or postprocessing off) applies it on the renderer per-frame in render().
    this.renderer.toneMapping = THREE.NoToneMapping
    this.renderer.toneMappingExposure = 1
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.xr.enabled = true
    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy()
    THREE.Texture.DEFAULT_ANISOTROPY = this.maxAnisotropy
    this.usePostprocessing = this.world.prefs.postprocessing
    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
    })
    this.renderPass = new RenderPass(this.world.stage.scene, this.world.camera)
    this.composer.addPass(this.renderPass)
    this.aoPass = new N8AOPostPass(this.world.stage.scene, this.world.camera, this.width, this.height)
    this.aoPass.enabled = this.world.settings.ao && this.world.prefs.ao
    // we can't use this as it traverses the scene, but half our objects are in the octree
    this.aoPass.autoDetectTransparency = false
    // full res is pretty expensive
    this.aoPass.configuration.halfRes = true
    this.aoPass.configuration.screenSpaceRadius = true
    this.aoPass.configuration.aoRadius = 64
    this.aoPass.configuration.distanceFalloff = 0.3
    this.aoPass.configuration.intensity = 1
    this.composer.addPass(this.aoPass)
    this.bloom = new BloomEffect({
      blendFunction: BlendFunction.ADD,
      mipmapBlur: true,
      luminanceThreshold: 1,
      luminanceSmoothing: 0.3,
      intensity: 0.5,
      radius: 0.8,
    })
    this.bloomEnabled = this.world.prefs.bloom
    this.smaa = new SMAAEffect({
      preset: SMAAPreset.ULTRA,
    })
    this.tonemapping = new ToneMappingEffect({
      mode: ToneMappingMode.ACES_FILMIC,
    })
    this.effectPass = new EffectPass(this.world.camera)
    this.updatePostProcessingEffects()
    this.composer.addPass(this.effectPass)
    this.world.prefs.on('change', this.onPrefsChange)
    this.resizer = new ResizeObserver(() => {
      this.resize(this.viewport.offsetWidth, this.viewport.offsetHeight)
    })
    this.viewport.appendChild(this.renderer.domElement)
    // Canvas renders on top via alpha compositing, but pointer events pass through to CSS layer
    this.renderer.domElement.style.position = 'relative'
    this.renderer.domElement.style.pointerEvents = 'none'
    this.resizer.observe(this.viewport)

    this.xrWidth = null
    this.xrHeight = null
    this.xrDimensionsNeeded = false
  }

  start() {
    this.world.on('xrSession', this.onXRSession)
    this.world.settings.on('change', this.onSettingsChange)
  }

  resize(width, height) {
    this.width = width
    this.height = height
    this.aspect = this.width / this.height
    this.world.camera.aspect = this.aspect
    this.world.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height)
    this.composer.setSize(this.width, this.height)
    this.emit('resize')
    this.render()
  }

  render() {
    if (typeof document !== 'undefined' && document.hidden && !this.renderer.xr.isPresenting) return
    this.portalAvatars.update()
    const restoreCamera = this.portalAvatars.mapCamera()
    this.renderer.toneMappingExposure = this.world.environment?.renderExposure ?? 1
    let disabled = []
    const toneMapping = this.renderer.toneMapping
    const autoClear = this.renderer.autoClear
    try {
      this.updateLightVisibility()
      disabled = this.renderer.shadowMap.enabled
        ? limitLightShadows(
            this.world.stage.scene,
            this.world.camera,
            this.renderer.capabilities.maxTextures,
            this.world.environment?.csm?.lights
          )
        : []
      if (this.renderer.xr.isPresenting || !this.usePostprocessing) {
        // The composer disables autoClear. XR must clear color/depth for the
        // current eye pose, including when Three uses an internal output target.
        this.renderer.autoClear = true
        // Direct render: apply tone mapping on the renderer since the
        // composer's ToneMappingEffect is not in the loop here
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.render(this.world.stage.scene, this.world.camera)
      } else {
        this.composer.render()
      }
    } finally {
      restoreCamera?.()
      this.renderer.toneMapping = toneMapping
      this.renderer.autoClear = autoClear
      for (const light of disabled) light.castShadow = true
    }
    if (this.xrDimensionsNeeded) {
      this.checkXRDimensions()
    }
    this.emit('render')
  }

  setLightVisibility(light, visible) {
    if (!this.renderer?.compileAsync || !this.renderer.extensions.has('KHR_parallel_shader_compile')) {
      light.visible = visible
      return
    }
    if (light.visible === visible) this.lightVisibility.delete(light)
    else this.lightVisibility.set(light, visible)
  }

  updateLightVisibility() {
    for (const preparation of this.lightPreparations) {
      if (--preparation.frames === 0) {
        for (const material of preparation.materials) material.dispose()
        preparation.target?.dispose()
      }
    }
    this.lightPreparations = this.lightPreparations.filter(preparation => preparation.frames > 0)
    for (const light of this.lightVisibility.keys()) {
      if (!light.parent) this.lightVisibility.delete(light)
    }
    const direct = this.renderer.xr.isPresenting || !this.usePostprocessing
    const compilation = this.lightCompilation
    if (compilation) {
      const programs = new Set(this.renderer.info.programs)
      if (!compilation.ready || !compilation.programs.every(program => !programs.has(program) || program.isReady()))
        return
      this.lightCompilation = null
      // Apply the entire prepared configuration. Applying only the requests
      // that survived a rapid toggle would introduce another, uncompiled count.
      if (
        compilation.direct === direct &&
        compilation.changes.size === this.lightVisibility.size &&
        [...compilation.changes].every(([light, visible]) => this.lightVisibility.get(light) === visible)
      ) {
        // Initialize shader reflection before drawing. Interleaving first-use
        // GL queries with draws can stall even after parallel linking completes.
        if (!compilation.initialized) {
          for (const program of compilation.programs) {
            if (programs.has(program)) program.getUniforms()
          }
          compilation.initialized = true
        }
        if (compilation.draws.length) {
          this.lightCompilation = compilation
          try {
            this.prepareLightDraw(compilation)
          } catch (error) {
            console.warn('[graphics] light pipeline preparation failed', error)
          }
          return
        }
        for (const [light, visible] of compilation.changes) light.visible = visible
        this.lightVisibility.clear()
        // Shadow rendering uses the preceding frame's light state. Keep its
        // prepared materials until the new configuration has rendered twice.
        this.lightPreparations.push({
          frames: 3,
          materials: compilation.materials,
          target: compilation.shadowTarget,
        })
      } else {
        for (const material of compilation.materials) material.dispose()
        compilation.shadowTarget?.dispose()
      }
    }
    if (!this.lightVisibility.size) return

    const renderer = this.renderer
    const scene = this.world.stage.scene
    const camera = this.world.camera
    if (!this.lightProgramsInitialized) {
      for (const program of renderer.info.programs) this.lightPrograms.add(program)
      this.lightProgramsInitialized = true
    }
    const pending = {
      changes: new Map(this.lightVisibility),
      direct,
      ready: false,
      programs: [],
      materials: [],
      draws: [],
      drawKeys: new Set(),
    }
    this.lightCompilation = pending
    const visibility = [...pending.changes.keys()].map(light => [light, light.visible])
    const target = renderer.getRenderTarget()
    const cubeFace = renderer.getActiveCubeFace()
    const mipLevel = renderer.getActiveMipmapLevel()
    const toneMapping = renderer.toneMapping
    let disabled = []
    const materials = []
    try {
      for (const [light, visible] of pending.changes) light.visible = visible
      disabled = renderer.shadowMap.enabled
        ? limitLightShadows(scene, camera, renderer.capabilities.maxTextures, this.world.environment?.csm?.lights)
        : []
      renderer.setRenderTarget(direct ? null : this.composer.inputBuffer)
      renderer.toneMapping = direct ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping
      const preparations = [renderer.compileAsync(scene, camera)]
      this.collectLightDraws(pending, direct)
      if (direct && this.portals.size) {
        // Portals render linear HDR even when the main view uses direct output.
        renderer.setRenderTarget(this.composer.inputBuffer)
        renderer.toneMapping = THREE.NoToneMapping
        preparations.push(renderer.compileAsync(scene, camera))
        this.collectLightDraws(pending, false)
      }
      if (renderer.shadowMap.enabled) {
        // compileAsync visits scene materials, so prepare the depth/distance
        // variants too. These mirror Three's shadow material properties.
        const casters = []
        scene.traverse(object => {
          if (object.material && (object.isMesh || object.isPoints || object.isLine)) {
            materials.push([object, object.material])
            if (object.castShadow) casters.push([object, object.material])
            object.material = null
          }
        })
        const shadowTypes = new Set()
        scene.traverseVisible(object => {
          if (object.isLight && object.castShadow) shadowTypes.add(object.isPointLight ? 'distance' : 'depth')
        })
        renderer.setRenderTarget(this.composer.inputBuffer)
        renderer.toneMapping = THREE.NoToneMapping
        for (const type of casters.length ? shadowTypes : []) {
          const cache = new Map()
          const shadowMaterial = source => {
            if (cache.has(source)) return cache.get(source)
            const material = type === 'distance' ? new THREE.MeshDistanceMaterial() : new THREE.MeshDepthMaterial()
            material.side =
              source.shadowSide ??
              (renderer.shadowMap.type === THREE.VSMShadowMap
                ? source.side
                : source.side === THREE.DoubleSide
                  ? THREE.DoubleSide
                  : source.side === THREE.FrontSide
                    ? THREE.BackSide
                    : THREE.FrontSide)
            for (const key of [
              'visible',
              'wireframe',
              'alphaMap',
              'map',
              'clipShadows',
              'clippingPlanes',
              'clipIntersection',
              'displacementMap',
              'displacementScale',
              'displacementBias',
            ])
              material[key] = source[key]
            material.alphaTest = source.alphaToCoverage ? 0.5 : source.alphaTest
            cache.set(source, material)
            pending.materials.push(material)
            return material
          }
          for (const [object, source] of casters) {
            const custom = type === 'distance' ? object.customDistanceMaterial : object.customDepthMaterial
            object.material = custom || (Array.isArray(source) ? source.map(shadowMaterial) : shadowMaterial(source))
          }
          preparations.push(renderer.compileAsync(scene, camera))
          let shadowLight
          scene.traverseVisible(object => {
            if (object.isLight && object.castShadow && (object.isPointLight ? 'distance' : 'depth') === type) {
              shadowLight = object
            }
          })
          this.collectLightDraws(pending, false, shadowLight)
        }
        for (const [object, material] of materials) object.material = material
      }
      for (const [light, visible] of visibility) light.visible = visible
      for (const light of disabled) light.castShadow = true
      disabled = renderer.shadowMap.enabled
        ? limitLightShadows(scene, camera, renderer.capabilities.maxTextures, this.world.environment?.csm?.lights)
        : []
      renderer.setRenderTarget(direct ? null : this.composer.inputBuffer)
      renderer.toneMapping = direct ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping
      // compile mutates the scene's cached light state. Restore it before the
      // old configuration renders its shadows while preparation is pending.
      renderer.compile(scene, camera)
      // Three polls material.currentProgram, which switches back to the old
      // program while frames continue. Retain the actual programs being warmed.
      pending.programs = [...renderer.info.programs]
      Promise.all(preparations).then(
        () => {
          pending.ready = true
        },
        error => {
          console.warn('[graphics] light shader preparation failed', error)
          pending.programs = []
          pending.draws = []
          pending.ready = true
        }
      )
    } catch (error) {
      console.warn('[graphics] light shader preparation failed', error)
      pending.programs = []
      pending.draws = []
      pending.ready = true
    } finally {
      for (const [object, material] of materials) object.material = material
      for (const [light, visible] of visibility) light.visible = visible
      for (const light of disabled) light.castShadow = true
      renderer.setRenderTarget(target, cubeFace, mipLevel)
      renderer.toneMapping = toneMapping
    }
  }

  collectLightDraws(preparation, direct, shadowLight) {
    const renderer = this.renderer
    if (!renderer.renderBufferDirect) return
    this.world.stage.scene.traverse(object => {
      if (!object.material || !object.geometry || (object.isInstancedMesh && !object.count)) return
      const geometry = object.geometry
      const layout = Object.entries(geometry.attributes)
        .map(([name, attribute]) =>
          [
            name,
            attribute.itemSize,
            attribute.normalized,
            attribute.array?.constructor.name,
            attribute.data?.stride,
            attribute.offset,
            attribute.gpuType,
          ].join(':')
        )
        .join(',')
      for (const [index, material] of [object.material].flat().entries()) {
        const program = renderer.properties.get(material).currentProgram
        if (!program) continue
        const sides =
          material.transparent && material.side === THREE.DoubleSide && !material.forceSinglePass
            ? [THREE.BackSide, THREE.FrontSide]
            : [material.side]
        for (const side of sides) {
          const key = [
            program.id,
            direct,
            !!shadowLight,
            side,
            layout,
            object.isSkinnedMesh,
            object.isInstancedMesh,
            !!object.instanceColor,
            !!object.morphTexture,
            object.isBatchedMesh,
            !!object._colorsTexture,
            ...Object.entries(geometry.morphAttributes).map(([name, attributes]) => `${name}:${attributes.length}`),
          ].join('/')
          if (preparation.drawKeys.has(key)) continue
          preparation.drawKeys.add(key)
          if (this.lightPrograms.has(program) || this.lightDraws.has(key)) continue
          const group = Array.isArray(object.material)
            ? geometry.groups.find(group => group.materialIndex === index)
            : null
          if (Array.isArray(object.material) && !group) continue
          preparation.draws.push({ object, material, side, group, direct, shadowLight, key })
        }
      }
    })
  }

  prepareLightDraw(preparation) {
    // Some drivers compile their native pipeline only on the first draw, after
    // KHR_parallel_shader_compile reports ready. Warm one layout per frame.
    const draw = preparation.draws.shift()
    if (!draw.object.parent) return
    const renderer = this.renderer
    const scene = this.world.stage.scene
    const camera = this.world.camera
    const target = renderer.getRenderTarget()
    const cubeFace = renderer.getActiveCubeFace()
    const mipLevel = renderer.getActiveMipmapLevel()
    const viewport = renderer.getCurrentViewport(new THREE.Vector4())
    const toneMapping = renderer.toneMapping
    const visibility = [...preparation.changes.keys()].map(light => [light, light.visible])
    const side = draw.material.side
    const modelView = draw.object.modelViewMatrix.clone()
    const normal = draw.object.normalMatrix.clone()
    let disabled = []
    try {
      for (const [light, visible] of preparation.changes) light.visible = visible
      disabled = renderer.shadowMap.enabled
        ? limitLightShadows(scene, camera, renderer.capabilities.maxTextures, this.world.environment?.csm?.lights)
        : []
      if (draw.shadowLight && !preparation.shadowTarget) {
        preparation.shadowTarget = new THREE.WebGLRenderTarget(1, 1, {
          depthTexture: new THREE.DepthTexture(1, 1, THREE.UnsignedIntType),
        })
      }
      renderer.setRenderTarget(
        draw.shadowLight ? preparation.shadowTarget : draw.direct ? null : this.composer.inputBuffer
      )
      renderer.toneMapping = draw.direct ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping
      renderer.compile(scene, camera)
      renderer.state.viewport(new THREE.Vector4(0, 0, 1, 1))
      renderer.state.scissor(new THREE.Vector4(0, 0, 1, 1))
      renderer.state.setScissorTest(true)
      if (draw.material.isMeshDistanceMaterial) renderer.properties.get(draw.material).light = draw.shadowLight
      if (draw.material.side !== draw.side) {
        draw.material.side = draw.side
        draw.material.needsUpdate = true
      }
      draw.object.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, draw.object.matrixWorld)
      draw.object.normalMatrix.getNormalMatrix(draw.object.modelViewMatrix)
      renderer.renderBufferDirect(camera, scene, draw.object.geometry, draw.material, draw.object, draw.group)
      this.lightDraws.add(draw.key)
    } finally {
      if (draw.material.side !== side) {
        draw.material.side = side
        draw.material.needsUpdate = true
      }
      draw.object.modelViewMatrix.copy(modelView)
      draw.object.normalMatrix.copy(normal)
      for (const [light, visible] of visibility) light.visible = visible
      for (const light of disabled) light.castShadow = true
      disabled = renderer.shadowMap.enabled
        ? limitLightShadows(scene, camera, renderer.capabilities.maxTextures, this.world.environment?.csm?.lights)
        : []
      renderer.setRenderTarget(preparation.direct ? null : this.composer.inputBuffer)
      renderer.toneMapping = preparation.direct ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping
      try {
        renderer.compile(scene, camera)
      } finally {
        for (const light of disabled) light.castShadow = true
        renderer.setRenderTarget(target, cubeFace, mipLevel)
        renderer.state.viewport(viewport)
        renderer.toneMapping = toneMapping
      }
    }
  }

  // Like Three's Reflector, render just before drawing the aperture. Three calls
  // this with each XR eye, so each eye gets its own perspective and depth cues.
  renderPortal(portal, eye) {
    if (this.renderingPortal || this.world.stage.scene.overrideMaterial) return
    portalInverse.copy(portal.matrixWorld).invert()
    const side = v1.setFromMatrixPosition(eye.matrixWorld).applyMatrix4(portalInverse).z >= 0 ? 1 : -1
    if (!portal.doubleside && side < 0) return
    const uniforms = portal.mesh.material.uniforms
    const destination = portal.url
      ? this.world.portalPreviews?.get(portal)
      : portal.getTraversalReturn?.() ||
        [...this.portals].find(item => item.portalId === portal.target && item !== portal)
    const destinationWorld = destination?.world || this.world
    uniforms.linked.value = !!destination
    if (!uniforms.linked.value) return
    if (!portal.url) portal.setStatus?.('')

    const renderer = this.renderer
    const view = portal.getView(eye)
    uniforms.preview.value = view.target.texture
    uniforms.textureMatrix.value = view.textureMatrix
    const size = renderer.getDrawingBufferSize(new THREE.Vector2())
    const requestedWidth = eye.viewport?.z || size.x
    const requestedHeight = eye.viewport?.w || size.y
    const factor =
      portal.resolution === 'max'
        ? 1
        : Math.min(1, portal.resolution / requestedWidth, portal.resolution / requestedHeight)
    const width = Math.max(1, Math.round(requestedWidth * factor))
    const height = Math.max(1, Math.round(requestedHeight * factor))
    const resized = view.target.width !== width || view.target.height !== height
    const now = performance.now()
    if (
      !resized &&
      view.destination === destination &&
      view.side === side &&
      view.updateRate === portal.updateRate &&
      portal.updateRate > 0 &&
      now - view.lastRender < 1000 / portal.updateRate
    )
      return
    if (resized) view.target.setSize(width, height)
    updatePortalCamera(view, portal.matrixWorld, destination.matrixWorld, eye)

    const target = renderer.getRenderTarget()
    const cubeFace = renderer.getActiveCubeFace()
    const mipLevel = renderer.getActiveMipmapLevel()
    const viewport = renderer.getCurrentViewport(new THREE.Vector4())
    const xrEnabled = renderer.xr.enabled
    const shadows = renderer.shadowMap.autoUpdate
    const toneMapping = renderer.toneMapping
    const toneMappingExposure = renderer.toneMappingExposure
    const visible = [...destinationWorld.graphics.portals].map(item => [item.mesh, item.mesh.visible])
    // Spark keeps camera-dependent LOD and sort buffers. Its built-in override
    // lets this view own those buffers without changing the active world's view.
    const spark = destinationWorld.stage.getSparkRenderer?.()
    const SparkRenderer = spark?.constructor
    const previousSpark = SparkRenderer?.sparkOverride
    if (view.sparkSource !== spark) {
      const previous = view.spark
      if (previous) {
        if (view.sparkUpdate) view.sparkUpdate.then(() => previous.dispose())
        else previous.dispose()
      }
      view.spark = null
      view.sparkUpdate = null
      view.sparkUpdating = false
      view.sparkSource = spark
    }
    if (spark) {
      if (!view.spark) {
        view.spark = new SparkRenderer({ renderer, timer: spark.timer, autoUpdate: false, enableLod: spark.enableLod })
      }
      view.spark.lodSplatCount = spark.lodSplatCount
      view.spark.lodSplatScale = spark.lodSplatScale
      view.spark.maxStdDev = spark.maxStdDev
      if (!view.sparkUpdating) {
        view.sparkUpdating = true
        const current = view.spark
        view.sparkUpdate = current
          .update({ scene: destinationWorld.stage.scene, camera: view.camera.clone() })
          .catch(error => console.error('[portal] splat update failed', error))
          .finally(() => {
            if (view.spark !== current) return
            view.sparkUpdate = null
            view.sparkUpdating = false
            if (view.disposed) current.dispose()
          })
      }
    }
    this.renderingPortal = true
    try {
      for (const [mesh] of visible) mesh.visible = false
      renderer.xr.enabled = false
      renderer.shadowMap.autoUpdate = false
      renderer.toneMapping = THREE.NoToneMapping
      renderer.setRenderTarget(view.target)
      renderer.state.buffers.depth.setMask(true)
      renderer.clear()
      if (SparkRenderer) SparkRenderer.sparkOverride = view.spark
      if (destinationWorld !== this.world) {
        view.camera.matrixWorld.decompose(
          destinationWorld.rig.position,
          destinationWorld.rig.quaternion,
          destinationWorld.rig.scale
        )
        destinationWorld.camera.projectionMatrix.copy(view.camera.projectionMatrix)
        destinationWorld.camera.matrixWorld.copy(view.camera.matrixWorld)
        destinationWorld.camera.matrixWorldInverse.copy(view.camera.matrixWorldInverse)
        destinationWorld.environment.lateUpdate(0)
        destinationWorld.environment.csm.camera = view.camera
        destinationWorld.environment.csm.update()
      }
      renderer.toneMappingExposure = destinationWorld.environment?.renderExposure ?? toneMappingExposure
      renderer.render(destinationWorld.stage.scene, view.camera)
    } finally {
      if (SparkRenderer) SparkRenderer.sparkOverride = previousSpark
      for (const [mesh, value] of visible) mesh.visible = value
      renderer.xr.enabled = xrEnabled
      renderer.shadowMap.autoUpdate = shadows
      renderer.toneMapping = toneMapping
      renderer.toneMappingExposure = toneMappingExposure
      renderer.setRenderTarget(target, cubeFace, mipLevel)
      renderer.state.viewport(eye.viewport || viewport)
      this.renderingPortal = false
    }
    view.lastRender = now
    view.destination = destination
    view.side = side
    view.updateRate = portal.updateRate
  }

  async capturePortalArrival(portal) {
    const width = 1280
    const height = 720
    const arrival = getPortalArrival(portal)
    const camera = new THREE.PerspectiveCamera(this.world.camera.fov, width / height, 0.2, 1200)
    camera.zoom = 1.5
    camera.position.copy(arrival.position)
    camera.position.y += 1.2
    camera.rotation.set((-15 * Math.PI) / 180, arrival.rotationY, 0, 'YXZ')
    camera.layers.mask = this.world.camera.layers.mask
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
    const renderer = this.renderer
    const target = new THREE.WebGLRenderTarget(width, height, { colorSpace: THREE.SRGBColorSpace })
    const previousTarget = renderer.getRenderTarget()
    const cubeFace = renderer.getActiveCubeFace()
    const mipLevel = renderer.getActiveMipmapLevel()
    const viewport = renderer.getCurrentViewport(new THREE.Vector4())
    const xrEnabled = renderer.xr.enabled
    const toneMapping = renderer.toneMapping
    const toneMappingExposure = renderer.toneMappingExposure
    const autoClear = renderer.autoClear
    const renderingPortal = this.renderingPortal
    const pixels = new Uint8Array(width * height * 4)
    try {
      this.renderingPortal = true
      renderer.xr.enabled = false
      renderer.autoClear = true
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = this.world.environment?.renderExposure ?? 1
      renderer.setRenderTarget(target)
      renderer.clear()
      renderer.render(this.world.stage.scene, camera)
      renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels)
    } finally {
      renderer.setRenderTarget(previousTarget, cubeFace, mipLevel)
      renderer.state.viewport(viewport)
      renderer.xr.enabled = xrEnabled
      renderer.toneMapping = toneMapping
      renderer.toneMappingExposure = toneMappingExposure
      renderer.autoClear = autoClear
      this.renderingPortal = renderingPortal
      target.dispose()
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    const image = context.createImageData(width, height)
    const stride = width * 4
    for (let y = 0; y < height; y++) {
      image.data.set(pixels.subarray((height - y - 1) * stride, (height - y) * stride), y * stride)
    }
    context.putImageData(image, 0, 0)
    return new Promise((resolve, reject) =>
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Could not encode arrival preview'))),
        'image/jpeg',
        0.85
      )
    )
  }

  commit() {
    this.photos.process()
    this.render()
  }

  preTick() {
    // calc world to screen factor
    const camera = this.world.camera
    const fovRadians = camera.fov * (Math.PI / 180)
    const rendererHeight = this.xrHeight || this.height
    this.worldToScreenFactor = (Math.tan(fovRadians / 2) * 2) / rendererHeight
  }

  onPrefsChange = changes => {
    // pixel ratio
    if (changes.dpr) {
      this.renderer.setPixelRatio(changes.dpr.value)
      this.resize(this.width, this.height)
    }
    // postprocessing
    if (changes.postprocessing) {
      this.usePostprocessing = changes.postprocessing.value
    }
    // bloom
    if (changes.bloom) {
      this.bloomEnabled = changes.bloom.value
      this.updatePostProcessingEffects()
    }
    // ao
    if (changes.ao) {
      this.aoPass.enabled = changes.ao.value && this.world.settings.ao
    }
  }

  onXRSession = session => {
    if (session) {
      this.xrSession = session
      this.xrWidth = null
      this.xrHeight = null
      this.xrDimensionsNeeded = true
    } else {
      this.xrSession = null
      this.xrWidth = null
      this.xrHeight = null
      this.xrDimensionsNeeded = false
    }
  }

  checkXRDimensions = () => {
    // Get the current XR reference space
    const referenceSpace = this.renderer.xr.getReferenceSpace()
    // Get frame information
    const frame = this.renderer.xr.getFrame()
    if (frame && referenceSpace) {
      // Get view information which contains projection matrices
      const views = frame.getViewerPose(referenceSpace)?.views
      if (views && views.length > 0) {
        const renderState = this.xrSession.renderState
        const baseLayer = renderState.baseLayer
        if (baseLayer) {
          // Get the actual resolution being used for rendering
          this.xrWidth = baseLayer.framebufferWidth
          this.xrHeight = baseLayer.framebufferHeight
          this.xrDimensionsNeeded = false
        }
      }
    }
  }

  onSettingsChange = changes => {
    if (changes.ao) {
      this.aoPass.enabled = changes.ao.value && this.world.prefs.ao
    }
  }

  updatePostProcessingEffects() {
    const effects = []
    if (this.bloomEnabled) {
      effects.push(this.bloom)
    }
    effects.push(this.smaa)
    effects.push(this.tonemapping)
    this.effectPass.setEffects(effects)
    this.effectPass.recompile()
  }

  destroy() {
    this.lightCompilation?.shadowTarget?.dispose()
    for (const material of this.lightCompilation?.materials || []) material.dispose()
    for (const preparation of this.lightPreparations) {
      for (const material of preparation.materials) material.dispose()
      preparation.target?.dispose()
    }
    this.lightPreparations = []
    this.lightDraws.clear()
    this.lightVisibility.clear()
    this.lightCompilation = null
    this.photos.destroy()
    this.portalAvatars.destroy()
    this.resizer.disconnect()
    this.viewport.removeChild(this.renderer.domElement)
  }
}
