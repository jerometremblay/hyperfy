export function appHasBrowserSource(entity, url) {
  if (typeof url !== 'string') return false
  let found = false
  entity.root?.traverse(node => {
    if (node.name === 'browser' && node.src === url) found = true
  })
  return found
}
