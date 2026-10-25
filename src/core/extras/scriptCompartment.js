// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/scriptCompartment.js
// One Compartment per script asset.
//
// Scripts share the (frozen) intrinsics with the host, and each script gets its own global object
// whose endowed globals are locked: a script cannot reassign, redefine or delete them (strict-mode
// TypeError inside that script), and nothing it stashes on its globalThis is visible to another script.

export function createScriptCompartment(endowments) {
  const compartment = new Compartment(endowments)
  lockGlobals(compartment.globalThis, Object.keys(endowments))
  return compartment
}

export function lockGlobals(globalObject, names) {
  for (const name of names) {
    const desc = Object.getOwnPropertyDescriptor(globalObject, name)
    if (!desc) continue
    Object.defineProperty(globalObject, name, { ...desc, writable: false, configurable: false })
  }
}

// NOTE: config is deprecated and renamed to props
export function wrapRawCode(code) {
  return `
  (function() {
    const shared = {}
    return (world, app, fetch, props, setTimeout) => {
      const config = props // deprecated
      ${code}
    }
  })()
  `
}
