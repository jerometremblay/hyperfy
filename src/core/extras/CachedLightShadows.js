// Experimental, client-local cache. Three still shades surfaces every frame;
// only point/spot shadow-map generation is retained between scene changes.
import { MeshBasicMaterial, WebGLRenderTarget } from 'three'

const SETTLE_MS = 500

function sameValues(previous, current, count = current.length) {
  if (previous.length !== count) return false
  for (let i = 0; i < count; i++) {
    if (previous[i] !== current[i]) return false
  }
  return true
}

function animatedCaster(object) {
  return (
    object.isSkinnedMesh ||
    object.getEntity?.()?.isPlayer ||
    object.geometry?.morphAttributes.position?.length ||
    [object.material].flat().some(material => material?.hasWind || material?.userData.wind)
  )
}

export class CachedLightShadows {
  constructor() {
    this.lights = new Map()
    this.casters = new Map()
    this.startedAt = null
    this.target = null
    this.material = null
    this.shadowType = null
  }

  reset() {
    for (const [light, state] of this.lights) {
      light.shadow.autoUpdate = state.autoUpdate
      // Restore the normal caster population on the next render.
      light.shadow.needsUpdate = true
    }
    this.lights.clear()
    this.casters.clear()
    this.startedAt = null
    this.shadowType = null
  }

  dispose() {
    this.reset()
    this.target?.dispose()
    this.material?.dispose()
    this.target = null
    this.material = null
  }

  render(renderer, scene, camera, enabled, now = performance.now()) {
    if (!enabled || !renderer.shadowMap.enabled) {
      this.reset()
      return
    }
    // Respect renderer-wide freezes used by other rendering paths.
    if (!renderer.shadowMap.autoUpdate && !renderer.shadowMap.needsUpdate) return
    if (this.shadowType !== renderer.shadowMap.type) {
      // Let the ordinary renderer recreate every light's maps on a type change.
      this.reset()
      this.shadowType = renderer.shadowMap.type
    }
    this.startedAt ??= now
    scene.updateMatrixWorld()
    const presentLights = new Set()
    const visibleLights = []
    scene.traverse(object => {
      if (object.isPointLight || object.isSpotLight) presentLights.add(object)
    })
    const presentCasters = new Set()
    const excluded = []
    const excludedInstances = []
    let changed = false
    scene.traverseVisible(object => {
      if (object.isLight) {
        if (presentLights.has(object) && object.castShadow && camera.layers.test(object.layers)) {
          visibleLights.push(object)
        }
        return
      }
      if (!object.castShadow || !object.geometry) return
      if (animatedCaster(object)) {
        excluded.push(object)
        return
      }
      presentCasters.add(object)
      let state = this.casters.get(object)
      if (!state) {
        state = {
          matrix: [],
          instances: [],
          instanceSettlesAt: [],
          instanceIncluded: [],
          included: false,
          settlesAt: now + SETTLE_MS,
        }
        this.casters.set(object, state)
      }
      const geometry = object.geometry
      const version = `${geometry.uuid}/${geometry.attributes.position?.version}/${geometry.index?.version}`
      const moved = !sameValues(state.matrix, object.matrixWorld.elements) || state.version !== version
      if (moved) {
        state.matrix = object.matrixWorld.elements.slice()
        state.version = version
        state.settlesAt = now + SETTLE_MS
      }
      if (object.isInstancedMesh) {
        const count = object.count
        const attribute = object.instanceMatrix
        if (state.instanceVersion !== attribute.version || state.instanceIncluded.length !== count) {
          for (let index = 0; index < count; index++) {
            const start = index * 16
            let instanceMoved = false
            for (let i = start; i < start + 16; i++) {
              if (state.instances[i] !== attribute.array[i]) instanceMoved = true
            }
            if (instanceMoved) state.instanceSettlesAt[index] = now + SETTLE_MS
          }
          if (state.instanceIncluded.slice(count).some(Boolean)) changed = true
          state.instances = attribute.array.slice(0, count * 16)
          state.instanceSettlesAt.length = count
          state.instanceIncluded.length = count
          state.instanceVersion = attribute.version
        }
        const hidden = []
        state.included = false
        for (let index = 0; index < count; index++) {
          const included = now >= Math.max(state.settlesAt, state.instanceSettlesAt[index])
          if (!!state.instanceIncluded[index] !== included) changed = true
          state.instanceIncluded[index] = included
          state.included ||= included
          if (!included) hidden.push(index)
        }
        if (!state.included) excluded.push(object)
        else if (hidden.length) excludedInstances.push([object, hidden, object.boundingSphere])
      } else {
        const included = now >= state.settlesAt
        if (state.included !== included) changed = true
        state.included = included
        if (!included) excluded.push(object)
      }
    })
    for (const [object, state] of this.casters) {
      if (presentCasters.has(object)) continue
      if (state.included) changed = true
      this.casters.delete(object)
    }
    for (const [light, state] of this.lights) {
      if (!presentLights.has(light)) {
        light.shadow.autoUpdate = state.autoUpdate
        light.shadow.needsUpdate = true
        this.lights.delete(light)
      } else if (changed) {
        light.shadow.needsUpdate = true
      }
    }
    // Observe movement while the initial scene settles; normal rendering remains
    // active during this warmup. Late assets join the cache after settling too.
    if (now - this.startedAt < SETTLE_MS) return
    const refresh = []
    for (const light of visibleLights) {
      const shadow = light.shadow
      let state = this.lights.get(light)
      if (!state) {
        // Leave explicitly frozen lights owned by another caller alone.
        if (!shadow.autoUpdate) continue
        state = { autoUpdate: shadow.autoUpdate }
        this.lights.set(light, state)
        shadow.autoUpdate = false
        shadow.needsUpdate = true
      }
      const pose = [
        ...light.matrixWorld.elements,
        ...(light.target?.matrixWorld.elements || []),
        light.distance,
        light.angle,
        shadow.camera.near,
        shadow.camera.far,
        shadow.mapSize.x,
        shadow.mapSize.y,
        renderer.shadowMap.type,
        camera.layers.mask,
      ].join('/')
      if (state.pose !== undefined && state.pose !== pose) state.settlesAt = now + SETTLE_MS
      state.pose = pose
      if (now < state.settlesAt) {
        // Moving lights use normal rendering until they become fixtures again.
        shadow.autoUpdate = true
        shadow.needsUpdate = true
        continue
      }
      if (shadow.autoUpdate || state.map !== shadow.map) shadow.needsUpdate = true
      shadow.autoUpdate = false
      if (shadow.needsUpdate) refresh.push(light)
    }
    if (!refresh.length) return
    // Render only cached fixture maps with moving casters removed. Restore the
    // flags before the ordinary render so sunlight still sees every caster.
    // Shadow rendering needs Three's normal render state; a 1px unlit color pass
    // establishes it without introducing a separate shadow renderer.
    this.target ||= new WebGLRenderTarget(1, 1)
    this.material ||= new MeshBasicMaterial()
    const target = renderer.getRenderTarget()
    const cubeFace = renderer.getActiveCubeFace()
    const mipLevel = renderer.getActiveMipmapLevel()
    const overrideMaterial = scene.overrideMaterial
    const autoClear = renderer.autoClear
    const xrEnabled = renderer.xr.enabled
    const globalNeedsUpdate = renderer.shadowMap.needsUpdate
    const otherShadows = []
    scene.traverse(object => {
      if (!object.isLight || !object.shadow || refresh.includes(object)) return
      otherShadows.push([object.shadow, object.shadow.autoUpdate, object.shadow.needsUpdate])
    })
    try {
      for (const object of excluded) object.castShadow = false
      // Same native matrix hiding used by Stage.hideForPhoto; the other
      // instances in the batch keep their shadows. Bounds remain conservative.
      for (const [object, indices] of excludedInstances) {
        for (const index of indices) {
          object.instanceMatrix.array.fill(0, index * 16, index * 16 + 16)
          object.instanceMatrix.array[index * 16 + 15] = 1
        }
        object.instanceMatrix.needsUpdate = true
      }
      for (const [shadow] of otherShadows) {
        shadow.autoUpdate = false
        shadow.needsUpdate = false
      }
      scene.overrideMaterial = this.material
      renderer.autoClear = true
      renderer.xr.enabled = false
      renderer.setRenderTarget(this.target)
      renderer.render(scene, camera)
      for (const light of refresh) this.lights.get(light).map = light.shadow.map
    } catch (error) {
      for (const light of refresh) light.shadow.needsUpdate = true
      throw error
    } finally {
      for (const object of excluded) object.castShadow = true
      for (const [object, indices, boundingSphere] of excludedInstances) {
        const original = this.casters.get(object).instances
        for (const index of indices) {
          object.instanceMatrix.array.set(original.subarray(index * 16, index * 16 + 16), index * 16)
        }
        object.instanceMatrix.needsUpdate = true
        // A shadow camera may have computed a sphere while instances were hidden.
        object.boundingSphere = boundingSphere
      }
      for (const [shadow, autoUpdate, needsUpdate] of otherShadows) {
        shadow.autoUpdate = autoUpdate
        shadow.needsUpdate = needsUpdate
      }
      scene.overrideMaterial = overrideMaterial
      renderer.autoClear = autoClear
      renderer.xr.enabled = xrEnabled
      renderer.shadowMap.needsUpdate = globalNeedsUpdate
      renderer.setRenderTarget(target, cubeFace, mipLevel)
    }
  }
}
