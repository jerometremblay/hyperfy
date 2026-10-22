// Each rack publishes its own holders; replacing one rack must not erase others.
export const CUE_EVENT = 'billard:cues'
export const POSE_EVENT = 'billard:cue-pose'
export function watchCues(world, changed) {
  const racks = new Map()
  world.on(CUE_EVENT, data => {
    if (!data || typeof data.rackId !== 'string' || !Array.isArray(data.holders)) return
    if (data.holders.length) racks.set(data.rackId, data.holders.filter(id => typeof id === 'string'))
    else racks.delete(data.rackId)
    changed([...new Set([...racks.values()].flat())])
  })
}
