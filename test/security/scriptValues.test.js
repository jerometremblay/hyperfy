// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/scriptValues.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// the real lockdown config: scripts and the host share these frozen intrinsics
import 'ses'
await import('../../src/core/lockdown.js')

import { toScriptError } from '../../src/core/extras/scriptValues.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

// a fresh error of a built-in class carrying only string name/message/stack (on V8 a stack that was not
// copied is the engine's own accessor pair on the new error)
const isFreshIntrinsic = (err, Ctor = Error) => {
  if (Object.getPrototypeOf(err) !== Ctor.prototype) return false
  if ('cause' in err || Object.getOwnPropertySymbols(err).length) return false
  return Object.getOwnPropertyNames(err).every(k => {
    const d = Object.getOwnPropertyDescriptor(err, k)
    if (k === 'stack') return typeof d.value === 'string' || typeof d.get === 'function'
    return ['message', 'name'].includes(k) && typeof d.value === 'string'
  })
}

test('toScriptError: primitives pass through unchanged', () => {
  for (const value of ['a thrown string', 42, true, undefined, null, Symbol.for('x'), 10n]) {
    assert.equal(toScriptError(value), value)
  }
})

test('toScriptError: never returns the input object, even an intrinsic error', () => {
  const err = new TypeError('host type')
  const out = toScriptError(err)
  assert.notEqual(out, err)
  assert.ok(isFreshIntrinsic(out, TypeError))
  assert.equal(out.message, 'host type')
  assert.equal(out.stack, err.stack)
  assert.ok(out instanceof TypeError)
})

test('toScriptError: a Compartment-thrown ReferenceError keeps its class, name, message and stack text', () => {
  const c = new Compartment({})
  let thrown
  try {
    c.evaluate('(function scriptFn() { throw new ReferenceError("missing binding") })')()
  } catch (err) {
    thrown = err
  }
  assert.ok(thrown instanceof ReferenceError)
  const out = toScriptError(thrown)
  assert.ok(out instanceof ReferenceError)
  assert.ok(isFreshIntrinsic(out, ReferenceError))
  assert.equal(out.name, 'ReferenceError')
  assert.equal(out.message, thrown.message)
  assert.match(out.stack, /scriptFn/)
  assert.equal(out.stack, thrown.stack)
})

test('toScriptError: the constructor comes from an allowlist keyed by name', () => {
  for (const [Ctor, name] of [
    [Error, 'Error'],
    [TypeError, 'TypeError'],
    [RangeError, 'RangeError'],
    [ReferenceError, 'ReferenceError'],
    [SyntaxError, 'SyntaxError'],
    [EvalError, 'EvalError'],
    [URIError, 'URIError'],
  ]) {
    const out = toScriptError(new Ctor('m'))
    assert.ok(isFreshIntrinsic(out, Ctor), name)
    assert.equal(out.name, name)
    assert.equal(Object.getOwnPropertyDescriptor(out, 'name'), undefined, `${name} inherits its name`)
  }
  // any other name: a plain Error whose own name is that string
  const agg = toScriptError(new AggregateError([new Error('a')], 'many'))
  assert.ok(isFreshIntrinsic(agg, Error))
  assert.equal(agg.name, 'AggregateError')
  assert.equal(agg.message, 'many')
  const dom = toScriptError(new DOMException('The operation was aborted.', 'AbortError'))
  assert.ok(isFreshIntrinsic(dom, Error))
  assert.equal(dom.name, 'AbortError')
  assert.equal(dom.message, 'The operation was aborted.')
  assert.equal(typeof dom.stack, 'string')
  // a name that is not a string is dropped
  const odd = toScriptError({ name: 42, message: 'odd' })
  assert.equal(odd.name, 'Error')
  // a name spoofing an Object.prototype key is not looked up on the allowlist's prototype chain
  const spoof = toScriptError({ name: 'hasOwnProperty', message: 'x' })
  assert.ok(isFreshIntrinsic(spoof, Error))
  assert.equal(spoof.name, 'hasOwnProperty')
})

test('toScriptError: host subclasses, wasm errors and errors with object properties are flattened', () => {
  class HostError extends Error {
    constructor(m) {
      super(m)
      this.name = 'HostError'
      this.detail = { host: true }
    }
  }
  const sub = toScriptError(new HostError('sub'))
  assert.ok(isFreshIntrinsic(sub, Error))
  assert.equal(sub.name, 'HostError')
  assert.equal(sub.message, 'sub')
  assert.equal(sub.detail, undefined)
  let wasmErr
  try {
    new WebAssembly.Module(new Uint8Array([1, 2, 3]))
  } catch (err) {
    wasmErr = err
  }
  const wasm = toScriptError(wasmErr)
  assert.ok(isFreshIntrinsic(wasm, Error))
  assert.equal(wasm.name, 'CompileError')
  const withCause = new Error('with cause', { cause: { socket: true } })
  const out = toScriptError(withCause)
  assert.ok(isFreshIntrinsic(out, Error))
  assert.equal(out.stack, withCause.stack)
  const fn = new TypeError('fn')
  fn.retry = () => {}
  assert.ok(isFreshIntrinsic(toScriptError(fn), TypeError))
})

test('toScriptError: custom accessors, shallow-frozen prototypes and deceptive Proxies cannot smuggle references', () => {
  const dom = new DOMException('inner', 'AbortError')
  // a custom stack accessor (its functions have frozen chains after lockdown) is read once, as a string only
  const accessor = Object.freeze({
    name: 'Error',
    message: 'm',
    get stack() {
      return dom
    },
  })
  const a = toScriptError(accessor)
  assert.ok(isFreshIntrinsic(a, Error))
  assert.notEqual(a.stack, dom)
  assert.equal(typeof a.stack, 'string')
  // a shallow-frozen prototype holding a mutable reference
  const shallow = Object.create(Object.freeze({ leak: dom, name: 'TypeError', message: 'shallow' }))
  const s = toScriptError(shallow)
  assert.ok(isFreshIntrinsic(s, TypeError))
  assert.equal(s.leak, undefined)
  // a Proxy that answers differently per read: only the first read of each key is used
  // (an unfrozen target, so the trap is free to lie)
  let reads = 0
  const proxy = new Proxy(
    { name: 'Error' },
    {
      get(target, key) {
        if (key === 'message') return ++reads === 1 ? 'first' : 'second'
        if (key === 'stack') return dom
        return Reflect.get(target, key)
      },
    }
  )
  const p = toScriptError(proxy)
  assert.ok(isFreshIntrinsic(p, Error))
  assert.equal(p.message, 'first')
  assert.notEqual(p.stack, dom)
  assert.equal(typeof p.stack, 'string')
  // the original objects are never the result
  for (const value of [accessor, shallow, proxy, dom]) assert.notEqual(toScriptError(value), value)
})

test('toScriptError: hostile objects convert without hanging or throwing', () => {
  const cyclic = new Proxy(
    {},
    {
      getPrototypeOf: () => cyclic,
    }
  )
  assert.ok(isFreshIntrinsic(toScriptError(cyclic), Error))
  const throwing = new Proxy(
    {},
    {
      get() {
        throw new Error('trap')
      },
      ownKeys() {
        throw new Error('trap')
      },
    }
  )
  const t = toScriptError(throwing)
  assert.ok(isFreshIntrinsic(t, Error))
  assert.equal(t.message, 'Error')
  const sneaky = Object.freeze({
    get name() {
      return 'Sneaky'
    },
    message: 'm',
  })
  const out = toScriptError(sneaky)
  assert.ok(isFreshIntrinsic(out, Error))
  assert.equal(out.name, 'Sneaky')
  // no message and no usable String(): a plain "Error"
  const mute = Object.create(null)
  const m = toScriptError(mute)
  assert.ok(isFreshIntrinsic(m, Error))
  assert.equal(m.message, 'Error')
  // a thrown function is an object too
  assert.ok(
    isFreshIntrinsic(
      toScriptError(() => {}),
      Error
    )
  )
})

test('escape scan: host rejections reach scripts through toScriptError', () => {
  const scriptFetch = read('src/core/extras/scriptFetch.js')
  assert.match(scriptFetch, /throw toScriptError\(err\)/)
  for (const method of ['json', 'text', 'blob', 'arrayBuffer']) {
    assert.match(scriptFetch, new RegExp(`${method}: \\(\\) => guarded\\(`), `${method} is guarded`)
  }
  const scriptBlob = read('src/core/extras/scriptBlob.js')
  assert.match(scriptBlob, /await hostBlob\.arrayBuffer\(\)[\s\S]*?catch \(err\) \{\s*throw toScriptError\(err\)/)
  const apps = read('src/core/systems/Apps.js')
  assert.match(apps, /reject\(toScriptError\(err\)\)/)
  assert.doesNotMatch(apps, /reject\(err\)/)
  const proxy = read('src/core/extras/createEntityProxy.js')
  assert.match(proxy, /return callForScript\(method, entity, \[entity, \.\.\.args\], destroyMethods.includes\(prop\)\)/)
})

test('escape scan: synchronous physics methods and accessors use guarded calls', () => {
  const values = read('src/core/extras/scriptValues.js')
  assert.match(
    values,
    /return Reflect.apply\(fn, thisArg, args\)[\s\S]*?catch \(err\) \{\s*handlePhysicsFailure\(err,[^\n]+\n\s*throw toScriptError\(err\)/
  )
  for (const file of ['Node', 'RigidBody', 'Controller']) {
    const source = read(`src/core/nodes/${file}.js`)
    assert.match(source, /import \{ callForScript \}/)
    assert.match(source, /callForScript\(self\./)
    assert.match(source, /callForScript\(\s*\(\) =>/)
  }
})
