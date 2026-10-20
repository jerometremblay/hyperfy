import * as THREE from './three'
import { getRef } from '../nodes/Node'
import { hashFile } from '../utils-client'
import { limitLightShadows } from './shadowBudget'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export function photoOptions(entity, options = {}) {
  const { position, quaternion } = options
  if (!position?.isVector3 || !['x', 'y', 'z'].every(key => Number.isFinite(position[key]))) {
    throw new Error('capturePhoto: position must be a finite Vector3')
  }
  if (
    !quaternion?.isQuaternion ||
    !['x', 'y', 'z', 'w'].every(key => Number.isFinite(quaternion[key])) ||
    !Number.isFinite(quaternion.lengthSq()) ||
    quaternion.lengthSq() < 1e-12
  ) {
    throw new Error('capturePhoto: quaternion must be a finite, nonzero Quaternion')
  }
  const number = (key, fallback, min, max) => {
    const value = options[key] ?? fallback
    if (!Number.isFinite(value)) throw new Error(`capturePhoto: ${key} must be finite`)
    return THREE.MathUtils.clamp(value, min, max)
  }
  const near = number('near', 0.05, 0.01, 1000)
  const far = number('far', 50, 0.02, 10000)
  if (far <= near) throw new Error('capturePhoto: far must exceed near')
  if (options.format !== undefined && options.format !== 'jpeg') throw new Error('capturePhoto: only jpeg is supported')
  if (options.hide !== undefined && !Array.isArray(options.hide)) throw new Error('capturePhoto: hide must be an array')
  const hide = [...new Set((options.hide || []).map(getRef))]
  for (const node of hide) {
    if (!node?.traverse || node.ctx?.entity !== entity) {
      throw new Error('capturePhoto: hide nodes must belong to this app')
    }
  }
  return {
    position: new THREE.Vector3().copy(position),
    quaternion: new THREE.Quaternion().copy(quaternion).normalize(),
    width: Math.round(number('width', 512, 64, 1024)),
    height: Math.round(number('height', 512, 64, 1024)),
    fov: number('fov', 50, 1, 179),
    near,
    far,
    quality: number('quality', 0.85, 0, 1),
    hide,
  }
}

// All temporary scene changes are synchronous and end before encoding or uploading.
export function renderPhoto(graphics, options) {
  const { world, renderer } = graphics
  const { width, height, fov, near, far } = options
  const camera = new THREE.PerspectiveCamera(fov, width / height, near, far)
  camera.position.copy(options.position)
  camera.quaternion.copy(options.quaternion)
  camera.layers.enable(2) // VRM third-person layer, for assets that still use VRM layers.
  camera.updateMatrixWorld(true)
  const linear = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType })
  // OutputPass encodes sRGB in its shader; use RGBA8 to avoid a second GPU conversion.
  const target = new THREE.WebGLRenderTarget(width, height)
  const output = new OutputPass()
  const pixels = new Uint8Array(width * height * 4)
  const previousTarget = renderer.getRenderTarget()
  const face = renderer.getActiveCubeFace()
  const mip = renderer.getActiveMipmapLevel()
  const viewport = renderer.getCurrentViewport(new THREE.Vector4())
  const state = {
    toneMapping: renderer.toneMapping,
    toneMappingExposure: renderer.toneMappingExposure,
    autoClear: renderer.autoClear,
    outputColorSpace: renderer.outputColorSpace,
  }
  const clearColor = renderer.getClearColor(new THREE.Color())
  const clearAlpha = renderer.getClearAlpha()
  const xrEnabled = renderer.xr.enabled
  const renderingPortal = graphics.renderingPortal
  const restores = []
  const seen = new Set()
  const hideObject = object => {
    if (!object || seen.has(object)) return
    seen.add(object)
    const visible = object.visible
    restores.push(() => {
      object.visible = visible
    })
    object.visible = false
  }
  const hideNode = node => {
    if (seen.has(node)) return
    seen.add(node)
    if (node.handle?.hideForPhoto) restores.push(node.handle.hideForPhoto())
    // Nodes such as UI, image, light, avatar and splats own their draw objects.
    for (const value of Object.values(node)) if (value?.isObject3D) hideObject(value)
    hideObject(node.instance?.raw?.scene)
  }
  let disabled = []
  const avatar = world.entities?.player?.avatar
  const firstPerson = avatar?._firstPerson
  try {
    if (firstPerson) {
      restores.push(() => {
        avatar.setFirstPerson(firstPerson)
        avatar.instance?.raw?.scene.updateMatrixWorld(true)
      })
      avatar.setFirstPerson(false)
      avatar.instance?.raw?.scene.updateMatrixWorld(true)
    }
    for (const node of options.hide) {
      // Ownership can change while a request waits in the queue.
      if (!node.ctx?.entity || node.ctx.entity !== options.entity)
        throw new Error('capturePhoto: hide node is no longer owned by this app')
      node.traverse(hideNode)
    }
    for (const player of world.entities?.players?.values() || []) hideObject(player.bubble?.mesh)
    hideObject(world.nametags?.mesh)
    hideObject(world.builder?.gizmoHelper)
    hideObject(world.builder?.xrLaser)
    hideObject(world.builder?.promptBoxResize?.group)
    hideObject(world.actions?.action?.getMesh?.())
    hideObject(world.xrUI?.panelAnchor)
    hideObject(world.xrUI?.launcher)
    hideObject(world.poseEditor?.gizmoHelper)
    const poseSession = world.poseEditor?.session
    if (poseSession) {
      for (const value of Object.values(poseSession)) {
        if (value?.isObject3D) hideObject(value)
      }
      for (const markers of [poseSession.jointMarkers, poseSession.guideMarkers]) {
        for (const marker of markers?.values() || []) hideObject(marker)
      }
    }
    disabled = renderer.shadowMap.enabled
      ? limitLightShadows(world.stage.scene, camera, renderer.capabilities.maxTextures, world.environment?.csm?.lights)
      : []
    // Avoid recursively rendering portal previews into the photo target.
    graphics.renderingPortal = true
    renderer.xr.enabled = false
    renderer.autoClear = true
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = world.environment?.renderExposure ?? 1
    renderer.outputColorSpace = THREE.SRGBColorSpace
    // Three renders ordinary targets in linear space without tone mapping.
    // Use its standard output pass to apply ACES + exposure + sRGB exactly once.
    renderer.setRenderTarget(linear)
    renderer.clear()
    renderer.render(world.stage.scene, camera)
    output.render(renderer, target, linear)
    renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels)
  } finally {
    for (const restore of restores.reverse()) restore()
    for (const light of disabled) light.castShadow = true
    renderer.setRenderTarget(previousTarget, face, mip)
    renderer.state.viewport(viewport)
    renderer.xr.enabled = xrEnabled
    Object.assign(renderer, state)
    renderer.setClearColor(clearColor, clearAlpha)
    graphics.renderingPortal = renderingPortal
    target.dispose()
    linear.dispose()
    output.dispose()
  }
  return pixels
}

export function encodePhoto(pixels, { width, height, quality }) {
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
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('capturePhoto: JPEG encoding failed'))),
      'image/jpeg',
      quality
    )
  })
}

export class PhotoCapture {
  constructor(graphics) {
    this.graphics = graphics
    this.queue = []
    this.pending = 0
    this.destroyed = false
  }

  capture(entity, options, hook) {
    if (this.destroyed) return Promise.reject(new Error('capturePhoto: graphics destroyed'))
    if (this.pending >= 8) return Promise.reject(new Error('capturePhoto: too many pending photos'))
    const snapshot = { ...photoOptions(entity, options), entity }
    this.pending++
    return new Promise((resolve, reject) => {
      this.queue.push({ options: snapshot, hook, resolve, reject })
    }).finally(() => {
      this.pending--
    })
  }

  // Called once per graphics commit, never by resize() or a portal render.
  process() {
    const request = this.queue.shift()
    if (!request) return
    const { options, hook, resolve, reject } = request
    try {
      if (hook.dead) throw new Error('capturePhoto: app destroyed')
      const pixels = renderPhoto(this.graphics, options)
      this.save(pixels, options, hook).then(resolve, reject)
    } catch (err) {
      reject(err)
    }
  }

  async save(pixels, options, hook) {
    const blob = await encodePhoto(pixels, options)
    if (blob.size > 1024 * 1024) throw new Error('capturePhoto: JPEG exceeds 1 MB; reduce size or quality')
    const hash = await hashFile(blob)
    const file = new File([blob], `${hash}.jpg`, { type: 'image/jpeg' })
    const url = `asset://${file.name}`
    if (hook.dead || this.destroyed) throw new Error('capturePhoto: capture cancelled')
    const { world } = this.graphics
    await world.network.upload(file)
    if (hook.dead || this.destroyed) throw new Error('capturePhoto: capture cancelled')
    world.loader.insert('image', url, file)
    return { url, width: options.width, height: options.height }
  }

  destroy() {
    this.destroyed = true
    for (const request of this.queue.splice(0)) request.reject(new Error('capturePhoto: graphics destroyed'))
  }
}
