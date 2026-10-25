// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/scriptTimers.js
// Timers handed to app scripts.
//
// Scripts get an opaque numeric handle; the real timers stay host-private and are all
// cleared when the app is unbuilt, so a script's callbacks never outlive its run.

export function createScriptTimers() {
  const timers = new Map()
  let ids = 0
  return {
    set(fn, ms) {
      const id = ++ids
      const timer = setTimeout(() => {
        timers.delete(id)
        try {
          fn()
        } catch (err) {
          console.error(err)
        }
      }, ms)
      timers.set(id, timer)
      return id
    },
    clear() {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    },
    get size() {
      return timers.size
    },
  }
}
