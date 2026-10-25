// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/callScript.js
// Invokes script-supplied callbacks from host code.
//
// `callScript` runs a callback with no receiver and only the arguments given. `callEntry` runs
// a callback stored on a script-visible plain object (a control button entry) with that object
// as receiver. Both contain errors so a throwing callback cannot abort host processing.

export function callScript(fn, ...args) {
  if (typeof fn !== 'function') return undefined
  try {
    return fn.call(undefined, ...args)
  } catch (err) {
    console.error(err)
  }
}

export function callEntry(entry, name) {
  const fn = entry[name]
  if (typeof fn !== 'function') return undefined
  try {
    return fn.call(entry)
  } catch (err) {
    console.error(err)
  }
}
