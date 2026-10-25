// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/systems/controlProxy.js
// Script-facing control handle. Wraps an empty object so nothing but the resolver's
// results is reachable (enumeration and `in` see no keys).
export function createControlProxy(resolve) {
  return new Proxy({}, { get: (_target, prop) => resolve(prop) })
}
