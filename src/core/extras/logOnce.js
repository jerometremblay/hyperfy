// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/logOnce.js
// Log a message once per subject and key, then stay quiet. A client that keeps sending a packet the server
// drops, or an app whose events keep being refused, would otherwise write a line per occurrence. The subjects
// are held weakly, so a gone socket or app takes its keys with it.
export function createLogOnce(log = console.warn) {
  const seen = new WeakMap()
  return (subject, key, message) => {
    let keys = seen.get(subject)
    if (!keys) seen.set(subject, (keys = new Set()))
    if (keys.has(key)) return false
    keys.add(key)
    log(message)
    return true
  }
}

export function briefError(err) {
  try {
    const name = Object.getOwnPropertyDescriptor(err, 'name')?.value
    const message = Object.getOwnPropertyDescriptor(err, 'message')?.value
    return (
      [name, message]
        .filter(value => typeof value === 'string')
        .map(value => value.slice(0, 200))
        .join(': ')
        .slice(0, 200) || 'error'
    )
  } catch {
    return 'error'
  }
}
