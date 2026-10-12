export function getPortalStatus(world, portalId = '') {
  if (!portalId) return { available: true }
  for (const entity of world.entities.items.values()) {
    if (!entity.isApp || entity.blueprint?.disabled || entity.data.mover) continue
    let found = false
    entity.root?.traverse(node => {
      if (node.name !== 'portal' || !node.mounted) return
      const id = node.portalId || entity.data.id || node.id
      if (id === portalId) found = true
    })
    if (found) return { available: true }
  }
  return { available: false, error: 'Destination portal not found' }
}
