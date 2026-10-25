// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/scriptConsole.js
// The console handed to app scripts.
//
// On Node, console.log(value) formats objects with util.inspect, which calls a value's own
// `[Symbol.for('nodejs.util.inspect.custom')](depth, options, inspect)` hook and hands it the host's
// mutable, process-wide `inspect` function. That would be a channel between scripts (and into the
// host's logging configuration), so when an `inspect` is available every non-primitive argument is
// rendered to a string here first, with custom hooks disabled; the host console then only ever sees
// primitives. Browsers format lazily in devtools without calling into page code, so there the
// arguments pass through unchanged.

// one line per call: log drains are line-oriented and a multi-line object dump would interleave with other
// lines; depth, array and string limits still bound the size
const INSPECT_OPTIONS = { customInspect: false, depth: 4, breakLength: Infinity, compact: true }

function isPrimitive(value) {
  return value === null || (typeof value !== 'object' && typeof value !== 'function')
}

function render(inspect, value) {
  if (isPrimitive(value)) return value
  try {
    return inspect(value, INSPECT_OPTIONS)
  } catch {
    return '[unprintable value]'
  }
}

// `inspect`: util.inspect on Node, undefined in browsers; `target`: the host console
export function createScriptConsole({ inspect, target = console } = {}) {
  const format = inspect ? args => args.map(value => render(inspect, value)) : args => args
  return {
    log: (...args) => target.log(...format(args)),
    warn: (...args) => target.warn(...format(args)),
    error: (...args) => target.error(...format(args)),
    time: (...args) => target.time(...format(args)),
    timeEnd: (...args) => target.timeEnd(...format(args)),
  }
}

// util.inspect without a bundler-visible import: present on Node 20.16+/22.3+, absent in browsers
export function hostInspect() {
  try {
    return globalThis.process?.getBuiltinModule?.('util')?.inspect
  } catch {
    return undefined
  }
}
