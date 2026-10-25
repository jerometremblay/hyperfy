// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/scriptValues.js
import { assertScriptActive, handlePhysicsFailure } from './physicsFailure.js'

// Values crossing from the host into app scripts.
//
// Scripts share the frozen intrinsics with the host, but host-API objects (DOMException, undici errors,
// WebAssembly errors, anything with an unfrozen prototype) must not reach them, since a script could
// patch those prototypes under the host. Every exception or rejection the host hands to a script goes
// through toScriptError(), which never passes an object through: it builds a fresh intrinsic error of
// the matching built-in class (so `instanceof TypeError` etc. still holds) carrying only string
// name/message/stack. Custom error classes lose their identity; nothing else is copied.

const INTRINSIC_ERRORS = {
  Error,
  TypeError,
  RangeError,
  ReferenceError,
  SyntaxError,
  EvalError,
  URIError,
}
const FALLBACK_MESSAGE = 'Error'

function isPrimitive(value) {
  return value === null || (typeof value !== 'object' && typeof value !== 'function')
}

// one read per property, inside try/catch: a getter or Proxy trap that throws yields null
function readString(value, key) {
  try {
    const v = value[key]
    return typeof v === 'string' ? v : null
  } catch {
    return null
  }
}

function define(error, key, value) {
  Object.defineProperty(error, key, { value, writable: true, configurable: true })
}

export function toScriptError(err) {
  if (isPrimitive(err)) return err
  const name = readString(err, 'name')
  let message = readString(err, 'message')
  if (message === null) {
    try {
      message = String(err)
    } catch {
      message = FALLBACK_MESSAGE
    }
  }
  const stack = readString(err, 'stack')
  const Ctor =
    (name !== null && Object.prototype.hasOwnProperty.call(INTRINSIC_ERRORS, name) && INTRINSIC_ERRORS[name]) || Error
  const error = new Ctor(message)
  if (name !== null && name !== Ctor.name) define(error, 'name', name)
  if (stack !== null) define(error, 'stack', stack)
  return error
}

export function callForScript(fn, thisArg, args, allowDestroy = false) {
  const entity = thisArg?.ctx?.entity || thisArg
  const world = thisArg?.ctx?.world || entity?.world
  try {
    assertScriptActive(entity, world, allowDestroy)
    return Reflect.apply(fn, thisArg, args)
  } catch (err) {
    handlePhysicsFailure(err, { entity, world, phase: 'callForScript' })
    throw toScriptError(err)
  }
}
