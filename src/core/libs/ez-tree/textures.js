import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader()
const textureRoot = '/tree-textures'

const barkSources = {
  birch: {
    ao: `${textureRoot}/bark/birch_ao_1k.jpg`,
    color: `${textureRoot}/bark/birch_color_1k.jpg`,
    normal: `${textureRoot}/bark/birch_normal_1k.jpg`,
    roughness: `${textureRoot}/bark/birch_roughness_1k.jpg`,
  },
  oak: {
    ao: `${textureRoot}/bark/oak_ao_1k.jpg`,
    color: `${textureRoot}/bark/oak_color_1k.jpg`,
    normal: `${textureRoot}/bark/oak_normal_1k.jpg`,
    roughness: `${textureRoot}/bark/oak_roughness_1k.jpg`,
  },
  pine: {
    ao: `${textureRoot}/bark/pine_ao_1k.jpg`,
    color: `${textureRoot}/bark/pine_color_1k.jpg`,
    normal: `${textureRoot}/bark/pine_normal_1k.jpg`,
    roughness: `${textureRoot}/bark/pine_roughness_1k.jpg`,
  },
  willow: {
    ao: `${textureRoot}/bark/willow_ao_1k.jpg`,
    color: `${textureRoot}/bark/willow_color_1k.jpg`,
    normal: `${textureRoot}/bark/willow_normal_1k.jpg`,
    roughness: `${textureRoot}/bark/willow_roughness_1k.jpg`,
  },
}

const leafSources = {
  ash: `${textureRoot}/leaves/ash_color.png`,
  aspen: `${textureRoot}/leaves/aspen_color.png`,
  oak: `${textureRoot}/leaves/oak_color.png`,
  pine: `${textureRoot}/leaves/pine_color.png`,
}

const barkTypes = {
  Bark001: 'oak',
  Bark002: 'birch',
  Bark003: 'pine',
  birch: 'birch',
  oak: 'oak',
  pine: 'pine',
  willow: 'willow',
}

const barkCache = new Map()
const leafCache = new Map()

function loadTexture(url, color = false) {
  const texture = textureLoader.load(url)
  texture.premultiplyAlpha = true
  if (color) texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function getBarkMaps(type) {
  const sourceType = barkTypes[type] || 'oak'
  if (!barkCache.has(sourceType)) {
    const maps = Object.fromEntries(
      Object.entries(barkSources[sourceType]).map(([kind, url]) => [
        kind,
        loadTexture(url, kind === 'color'),
      ])
    )
    barkCache.set(sourceType, maps)
  }
  return barkCache.get(sourceType)
}

function getLeafMap(type) {
  const sourceType = leafSources[type] ? type : 'oak'
  if (!leafCache.has(sourceType)) {
    leafCache.set(sourceType, loadTexture(leafSources[sourceType], true))
  }
  return leafCache.get(sourceType)
}

/**
 * Fill missing maps using the texture set associated with the tree preset.
 * Bark maps are cloned per asset because EZ-Tree applies each tree's texture
 * scale to the supplied maps. Leaf maps are shared and treated as read-only.
 * @returns {THREE.Texture[]} Textures owned by the generated tree asset
 */
export function applyTreeTextureDefaults(options) {
  const ownedTextures = []
  const bark = options.bark

  if (bark?.textured !== false && bark?.maps) {
    const defaults = getBarkMaps(bark.type)
    for (const [kind, texture] of Object.entries(defaults)) {
      if (bark.maps[kind]) continue
      const clone = texture.clone()
      bark.maps[kind] = clone
      ownedTextures.push(clone)
    }
  }

  if (options.leaves && !options.leaves.map) {
    options.leaves.map = getLeafMap(options.leaves.type)
  }

  return ownedTextures
}
