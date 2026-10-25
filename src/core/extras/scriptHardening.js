// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/scriptHardening.js
// Hardening of host values handed to app scripts.
//
// harden() only exists after lockdown (server, client, node-client). The viewer, the standalone client
// bundle and unit tests run without it, so every call here is a no-op unless the real hardener is present
// (the fake one installed by `__hardenTaming__: 'unsafe'` is flagged with `isFake`).

let classesHardened = false

export function canHarden() {
  const harden = globalThis.harden
  return typeof harden === 'function' && !harden.isFake
}

// freezes the value and everything reachable from it; returns the value either way
export function hardenForScripts(value) {
  return canHarden() ? globalThis.harden(value) : value
}

// Classes endowed to scripts (Vector3, Quaternion, ...) are hardened here once their prep patches land;
// until then the list is empty and the call only reserves the hook. Idempotent.
const SCRIPT_CLASSES = []

export function hardenScriptClasses() {
  if (classesHardened || !canHarden()) return
  classesHardened = true
  for (const cls of SCRIPT_CLASSES) globalThis.harden(cls)
}
