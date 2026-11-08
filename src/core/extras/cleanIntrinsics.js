// Runs just before SES lockdown (src/core/lockdown.js).
//
// Some browsers change built-in functions before the page runs. iPhone Brave's injected script
// (__firefox__.js) adds its own `call` / `apply` / `bind` / `toString` to Function.prototype.call, .apply and
// .bind and freezes them. Lockdown removes every property it does not know, and an undeletable one stops
// it ("Unable to delete property"), so the world never starts.
//
// Tolerating those properties would leave the browser's own functions reachable from app scripts (other
// builders' code). Instead, each affected method is replaced on Function.prototype with a clean equivalent.
// The browser keeps using the copies it captured; pages, the engine and app scripts get the clean ones, and
// lockdown hardens them like any other intrinsic. Nothing changes where no such property exists.

const EXPECTED = new Set(['length', 'name'])

// captured when this module loads, before lockdown and before any page or app script can rebind them
const reflectApply = Reflect.apply
const nativeBind = Function.prototype.bind

// Method shorthand: no own `prototype`, and lengths and names match the built-ins (apply 2, call 1, bind 1).
// bind delegates to the native bind (held only in this closure), so bound functions keep their name
// ("bound f"), length and construct behaviour.
const CLEAN = {
  apply(thisArg, args) {
    return reflectApply(this, thisArg, args === undefined || args === null ? [] : args)
  },
  call(thisArg, ...args) {
    return reflectApply(this, thisArg, args)
  },
  bind(thisArg, ...args) {
    return reflectApply(nativeBind, this, [thisArg, ...args])
  },
}

// the own properties of `fn` that lockdown would try to remove and cannot
function undeletable(fn) {
  return Reflect.ownKeys(fn).filter(key => {
    if (EXPECTED.has(key)) return false
    const descriptor = Reflect.getOwnPropertyDescriptor(fn, key)
    return !!descriptor && !descriptor.configurable
  })
}

// Returns what was replaced, eg ['apply (call, apply, bind)']; reports it once through `report`.
export function cleanFunctionPrototype(report = message => console.warn(message)) {
  const replaced = []
  for (const name of ['apply', 'call', 'bind']) {
    const method = Function.prototype[name]
    if (typeof method !== 'function') continue
    const extra = undeletable(method)
    if (!extra.length) continue
    const descriptor = Reflect.getOwnPropertyDescriptor(Function.prototype, name)
    // a method the browser also locked in place cannot be swapped; lockdown will then report it
    if (!descriptor || (!descriptor.configurable && !descriptor.writable)) continue
    const done = descriptor.configurable
      ? Reflect.defineProperty(Function.prototype, name, { ...descriptor, value: CLEAN[name] })
      : Reflect.set(Function.prototype, name, CLEAN[name])
    if (done && Function.prototype[name] === CLEAN[name]) replaced.push(`${name} (${extra.map(String).join(', ')})`)
  }
  if (replaced.length) {
    report(
      `[lockdown] replaced Function.prototype methods that carried undeletable browser additions: ${replaced.join('; ')}`
    )
  }
  return replaced
}
