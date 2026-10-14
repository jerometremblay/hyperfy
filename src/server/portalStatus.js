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

export function getPortalLoadingImage(world, portalId) {
  if (typeof portalId !== 'string' || !portalId || portalId.length > 256) return null
  for (const entity of world.entities.items.values()) {
    if (!entity.isApp || entity.blueprint?.disabled || entity.data.mover) continue
    let found = false
    const visit = node => {
      if (node.name === 'portal' && node.mounted && (node.portalId || entity.data.id || node.id) === portalId)
        found = true
    }
    entity.root?.traverse(visit)
    for (const node of entity.worldNodes || []) node.traverse(visit)
    if (found) {
      const image = entity.blueprint?.props?.[`arrivalImage_${portalId}`]
      return image?.type === 'image' && typeof image.url === 'string' ? image : null
    }
  }
  return null
}
