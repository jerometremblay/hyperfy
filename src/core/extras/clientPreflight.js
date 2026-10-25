// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/clientPreflight.js
export const CHANGE_TOO_LARGE = 'This change is too large to save (limit 64 KB)'

export function preflightPacket(world, name, data) {
  if (world.network.fits(name, data)) return true
  world.emit('toast', CHANGE_TOO_LARGE)
  return false
}
