export function getServerProvidedBlueprints(world) {
  return world.collections.serialize().flatMap(collection => collection.blueprints || [])
}
