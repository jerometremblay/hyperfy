// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/createOptions.js
// Script-facing node creation options (app.create(name, data)).
//
// The node is constructed from host-safe data only: its id, the transform values the Node
// constructor reads directly, and `type`, which selects other defaults (e.g. a prim's size).
// Every other option is applied through the node's own proxy setter, so creation enforces
// exactly the same validation as later assignment. Host-only constructor fields (an avatar
// factory, a skinned mesh's object3d, a raw material, ...) never come from scripts.

const ctorKeys = ['position', 'rotation', 'quaternion', 'scale']
const ctorAndSetterKeys = ['type'] // constructor for dependent defaults, setter for validation
const ignoredKeys = ['body0', 'body1'] // joint bodies bind to mounted nodes, never at creation
const hostOnlyKeys = ['factory', 'hooks', 'object3d', 'animations', 'material', 'parent']

// splits script options into constructor data and the options to apply through the proxy
export function splitCreateOptions(data) {
  const ctorData = {}
  const options = {}
  if (!data || typeof data !== 'object') return { ctorData, options }
  for (const key of Object.keys(data)) {
    const value = data[key]
    if (hostOnlyKeys.includes(key)) {
      console.error(`[app.create] ignoring host-only option: ${key}`)
    } else if (ignoredKeys.includes(key)) {
      continue
    } else if (key === 'id') {
      if (typeof value === 'string' || typeof value === 'number') ctorData.id = value
    } else if (ctorKeys.includes(key)) {
      ctorData[key] = value
    } else if (ctorAndSetterKeys.includes(key)) {
      ctorData[key] = value
      options[key] = value
    } else if (key === 'offset' && Array.isArray(value)) {
      // ui offset: the constructor takes the array form, the setter a Vector3
      ctorData[key] = value
    } else {
      options[key] = value
    }
  }
  return { ctorData, options }
}

// assigns options through the proxy's own setters; keys without a setter are ignored.
// `resolve(key, value)` may replace a value (e.g. unwrap a geometry ref) or return undefined to drop it
export function applyCreateOptions(proxy, options, resolve) {
  for (const key of Object.keys(options)) {
    const desc = Object.getOwnPropertyDescriptor(proxy, key)
    if (typeof desc?.set !== 'function') continue
    const value = resolve ? resolve(key, options[key]) : options[key]
    if (value !== undefined) proxy[key] = value
  }
}
