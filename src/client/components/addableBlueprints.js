export function getAddableBlueprints(world) {
  const collection = world.collections.get('default')
  const blueprints = [...(collection?.blueprints || [])]
  const collectionIds = new Set(blueprints.map(blueprint => blueprint.id).filter(Boolean))

  for (const blueprint of world.blueprints.serialize()) {
    if (!blueprint?.id || blueprint.id === '$scene' || blueprint.scene || blueprint.disabled) continue
    if (collectionIds.has(blueprint.id)) continue
    blueprints.push(blueprint)
  }

  return blueprints
}
