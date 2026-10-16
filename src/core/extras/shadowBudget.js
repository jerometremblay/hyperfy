import { Vector3 } from 'three'

const cameraPosition = new Vector3()
const lightPosition = new Vector3()
const proximityBandSize = 32

function textureCount(value) {
  if (value?.isTexture) return 1
  if (Array.isArray(value)) return value.reduce((count, item) => count + textureCount(item), 0)
  return 0
}

// Three allocates a unit per sampler binding, even when several maps share a
// texture. Shadow samplers compete with material maps, environment and skinning.
export function limitLightShadows(scene, camera, maxTextures, cascades = []) {
  const lights = []
  const materials = new Map()
  let reserved = 0
  let projectedMaps = 0
  scene.traverseVisible(object => {
    if (object.isLight) {
      if (!camera.layers.test(object.layers)) return
      if (object.isSpotLight && object.map) projectedMaps++
      if (object.castShadow) lights.push(object)
    }
    if (!object.material) return
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material.visible) continue
      let count = materials.get(material)
      if (count === undefined) {
        if (material.isShaderMaterial) {
          count = Object.values(material.uniforms).reduce((sum, uniform) => sum + textureCount(uniform.value), 0)
        } else {
          count = Object.values(material).reduce((sum, value) => sum + textureCount(value), 0)
          if (!material.envMap && scene.environment && material.isMeshStandardMaterial) count++
          if (material.transmission > 0) count++ // renderer's transmission buffer
        }
        materials.set(material, count)
      }
      // Use the same conservative combined-unit limit as Three's allocator.
      if (object.isSkinnedMesh) count++
      const morph = object.geometry?.morphAttributes
      if (morph?.position?.length || morph?.normal?.length || morph?.color?.length) count++
      if (object.isInstancedMesh && object.morphTexture) count++
      reserved = Math.max(reserved, count)
    }
  })
  const budget = Math.max(0, maxTextures - reserved - projectedMaps)
  if (lights.length <= budget) return []

  // CSM relies on all its cascades being present and first in the directional
  // shadow array. Rank broad proximity bands first, then dynamic lights,
  // brighter cached lights and stable IDs within each band.
  const protectedLights = new Set(cascades)
  camera.getWorldPosition(cameraPosition)
  const candidates = lights
    .filter(light => !protectedLights.has(light))
    .map(light => {
      const distance = light.isDirectionalLight
        ? 0
        : light.getWorldPosition(lightPosition).distanceTo(cameraPosition)
      return { light, proximityBand: Math.floor(distance / proximityBandSize) }
    })
    .sort((a, b) => {
      const aStatic = a.light.shadow?.autoUpdate === false
      const bStatic = b.light.shadow?.autoUpdate === false
      return (
        a.proximityBand - b.proximityBand ||
        Number(aStatic) - Number(bStatic) ||
        (bStatic ? b.light.intensity - a.light.intensity : 0) ||
        a.light.id - b.light.id
      )
    })
  const remaining = Math.max(0, budget - lights.filter(light => protectedLights.has(light)).length)
  const disabled = candidates.slice(remaining).map(({ light }) => light)
  for (const light of disabled) light.castShadow = false
  return disabled
}
