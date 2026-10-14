import {
  VRMExpression,
  VRMExpressionManager,
  VRMExpressionMorphTargetBind,
  VRMExpressionMaterialColorBind,
  VRMExpressionTextureTransformBind,
} from '@pixiv/three-vrm'
import { normalizeExpression } from './playerExpressions.js'

export function cloneExpressionManager(source, sourceScene, scene) {
  if (!source) return null
  const objects = new Map()
  const materials = new Map()
  const boundMaterials = new Set(
    source.expressions.flatMap(expression => expression.binds.map(bind => bind.material)).filter(Boolean)
  )
  function pair(a, b) {
    objects.set(a, b)
    if (a.material) {
      const originals = Array.isArray(a.material) ? a.material : [a.material]
      const clones = originals.map(material => {
        if (!materials.has(material))
          materials.set(material, boundMaterials.has(material) ? material.clone() : material)
        return materials.get(material)
      })
      b.material = Array.isArray(a.material) ? clones : clones[0]
    }
    a.children.forEach((child, i) => pair(child, b.children[i]))
  }
  pair(sourceScene, scene)
  const manager = new VRMExpressionManager()
  for (const original of source.expressions) {
    const expression = new VRMExpression(original.expressionName)
    for (const key of ['isBinary', 'overrideBlink', 'overrideMouth', 'overrideLookAt']) expression[key] = original[key]
    for (const bind of original.binds) {
      if (Array.isArray(bind.primitives)) {
        expression.addBind(
          new VRMExpressionMorphTargetBind({
            primitives: bind.primitives.map(mesh => objects.get(mesh)).filter(Boolean),
            index: bind.index,
            weight: bind.weight,
          })
        )
      } else if (bind.material && bind.targetValue) {
        expression.addBind(
          new VRMExpressionMaterialColorBind({
            material: materials.get(bind.material),
            type: bind.type,
            targetValue: bind.targetValue,
            targetAlpha: bind.targetAlpha,
          })
        )
      } else if (bind.material && bind.scale && bind.offset) {
        expression.addBind(
          new VRMExpressionTextureTransformBind({
            material: materials.get(bind.material),
            scale: bind.scale,
            offset: bind.offset,
          })
        )
      }
    }
    manager.registerExpression(expression)
  }
  return manager
}

export function createAvatarExpressions(manager, random = Math.random) {
  let weights = {}
  let blinkWait = 2 + random() * 4
  let blinkTime = -1
  let mouthWait = 0
  let mouthName = 'aa'
  let mouthWeight = 0
  const mouths = ['aa', 'ih', 'ou', 'ee', 'oh'].filter(name => manager?.getExpression(name))
  return {
    setExpression(name, weight) {
      name = normalizeExpression(name)
      if (name && Number.isFinite(weight)) weights[name] = Math.max(0, Math.min(1, weight))
    },
    setExpressions(value) {
      weights = value || {}
    },
    update(delta, speaking) {
      if (!manager) return
      blinkWait -= delta
      if (blinkWait <= 0 && blinkTime < 0) blinkTime = 0
      let blink = 0
      if (blinkTime >= 0) {
        blinkTime += delta
        blink = Math.max(0, 1 - Math.abs(blinkTime / 0.075 - 1))
        if (blinkTime >= 0.15) {
          blinkTime = -1
          blinkWait = 2 + random() * 4
        }
      }
      mouthWait -= delta
      if (speaking && mouths.length && mouthWait <= 0) {
        mouthName = mouths[Math.floor(random() * mouths.length)]
        mouthWeight = 0.3 + random() * 0.5
        mouthWait = 1 / (8 + random() * 4)
      } else if (!speaking) {
        mouthWeight = Math.max(0, mouthWeight - delta * 10)
        mouthWait = 0
      }
      manager.resetValues()
      for (const [name, weight] of Object.entries(weights)) manager.setValue(name, weight)
      manager.setValue('blink', Math.max(weights.blink || 0, blink))
      manager.setValue(mouthName, Math.max(weights[mouthName] || 0, mouthWeight))
      // The standard manager applies overrideBlink/overrideMouth, including binary expressions.
      manager.update()
    },
  }
}
