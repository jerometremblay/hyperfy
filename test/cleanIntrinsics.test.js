import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import vm from 'node:vm'
import fs from 'node:fs'

const sourceUrl = new URL('../src/core/extras/cleanIntrinsics.js', import.meta.url)

// The cleanup in a fresh realm (its own Function.prototype), so this process's built-ins are untouched.
// The fixture runs before the module loads, as Brave's script runs before the page.
function realm(prelude = '') {
  const source = fs.readFileSync(sourceUrl, 'utf8').replace('export function', 'function')
  const context = vm.createContext({})
  vm.runInContext(prelude, context)
  vm.runInContext(source, context)
  return {
    // arrays from the other realm are copied so deepStrictEqual compares them by value
    clean: report => [...vm.runInContext('cleanFunctionPrototype', context)(report)],
    run: code => vm.runInContext(code, context),
  }
}

// errors from the other realm have its own TypeError
const isTypeError = err => err?.name === 'TypeError'

// A stricter version of what iPhone Brave's __firefox__.js leaves (brave-core ios/.../UserScripts/__firefox__.js):
// Brave adds own call / apply to Function.prototype.call, .apply and .bind and freezes them; this fixture also adds
// bind and toString, so the cleanup is tested against more than Brave does.
const braveLike = `(() => {
  const { call, apply, bind, toString } = Function.prototype
  for (const fn of [call, apply, bind]) {
    fn.call = call
    fn.apply = apply
    for (const [name, value] of [['call', call], ['apply', apply], ['bind', bind]]) {
      Object.defineProperty(fn, name, { value, configurable: false, writable: false, enumerable: false })
    }
    Object.defineProperty(fn, 'toString', { value: toString, configurable: true, writable: true, enumerable: false })
    Object.freeze(fn)
  }
})()`
const ALL = 'call, apply, bind, toString'

test('clean intrinsics: nothing changes on an untouched Function.prototype', () => {
  const r = realm()
  const before = r.run('[Function.prototype.apply, Function.prototype.call, Function.prototype.bind]')
  const reports = []
  assert.deepEqual(
    r.clean(line => reports.push(line)),
    []
  )
  assert.deepEqual(reports, [])
  const after = r.run('[Function.prototype.apply, Function.prototype.call, Function.prototype.bind]')
  for (let i = 0; i < 3; i++) assert.equal(after[i], before[i])
})

test("clean intrinsics: Brave's apply, call and bind are replaced by clean ones of the same shape", () => {
  const r = realm(braveLike)
  const originals = r.run('[Function.prototype.apply, Function.prototype.call, Function.prototype.bind]')
  const reports = []
  assert.deepEqual(
    r.clean(line => reports.push(line)),
    [`apply (${ALL})`, `call (${ALL})`, `bind (${ALL})`]
  )
  assert.equal(reports.length, 1)
  for (const [index, name, length] of [
    [0, 'apply', 2],
    [1, 'call', 1],
    [2, 'bind', 1],
  ]) {
    const method = r.run(`Function.prototype.${name}`)
    assert.notEqual(method, originals[index], `${name} replaced`)
    assert.deepEqual([...Reflect.ownKeys(method)].sort(), ['length', 'name'], `${name} own keys`)
    assert.equal(method.length, length, `${name} length`)
    assert.equal(method.name, name)
    const descriptor = r.run(`Object.getOwnPropertyDescriptor(Function.prototype, '${name}')`)
    assert.deepEqual(
      [descriptor.enumerable, descriptor.writable, descriptor.configurable],
      [false, true, true],
      `${name} flags`
    )
  }
  assert.equal(originals[0].call, originals[1], "the browser's copies keep their additions")
})

test('clean intrinsics: the clean apply, call and bind behave like the built-ins', () => {
  const r = realm(braveLike)
  r.clean(() => {})
  // apply
  assert.equal(r.run('Math.max.apply(null, [1, 5, 3])'), 5)
  assert.equal(r.run('(function (a, b) { return this.x + a + b }).apply({ x: 1 }, [2, 3])'), 6)
  assert.equal(r.run('(function () { return arguments.length }).apply(null, undefined)'), 0)
  assert.equal(r.run('(function () { return arguments.length }).apply(null, null)'), 0)
  assert.equal(
    r.run("(function () { return [].join.call(arguments, '') }).apply(null, { length: 2, 0: 'a', 1: 'b' })"),
    'ab'
  )
  assert.throws(() => r.run('(function () {}).apply(null, 1)'), isTypeError)
  assert.throws(() => r.run('Function.prototype.apply.call({}, null, [])'), isTypeError)
  // call
  assert.equal(r.run('(function (a, b) { return this.x + a + b }).call({ x: 1 }, 2, 3)'), 6)
  assert.equal(r.run("'abc'.slice.call('hello', 1, 3)"), 'el')
  assert.throws(() => r.run('Function.prototype.call.call({})'), isTypeError)
  // bind: bound name and length, partial arguments, receiver, and construction
  assert.equal(r.run('(function add(a, b) { return this.x + a + b }).bind({ x: 1 }, 2)(3)'), 6)
  assert.equal(r.run('(function add(a, b) {}).bind(null).name'), 'bound add')
  assert.equal(r.run('(function add(a, b) {}).bind(null, 1).length'), 1)
  assert.equal(
    r.run(
      '(() => { function P(a, b) { this.s = a + b }; const B = P.bind(null, 2); const o = new B(3); return o.s === 5 && o instanceof P })()'
    ),
    true
  )
  assert.throws(() => r.run('Function.prototype.bind.call({})'), isTypeError)
})

test('clean intrinsics: configurable additions are left to lockdown; a locked method is left for it to report', () => {
  const r = realm(`Object.defineProperty(Function.prototype.apply, 'deletable', { value: 1, configurable: true })`)
  assert.deepEqual(
    r.clean(() => {}),
    []
  )
  assert.equal(r.run("Object.hasOwn(Function.prototype.apply, 'deletable')"), true, 'apply untouched')

  const locked = realm(
    `${braveLike}; Object.defineProperty(Function.prototype, 'apply', { configurable: false, writable: false })`
  )
  assert.deepEqual(
    locked.clean(() => {}),
    [`call (${ALL})`, `bind (${ALL})`]
  )
})

// The real SES with the real lockdown config, in subprocesses.
function lockdownWith(prelude, { clean = true } = {}) {
  const lockdownUrl = new URL('../src/core/lockdown.js', import.meta.url).href
  const script = `
    ${prelude}
    await import('ses')
    try {
      ${clean ? `await import(${JSON.stringify(lockdownUrl)})` : 'lockdown()'}
      const keys = fn => Reflect.ownKeys(fn).map(String).join(',')
      const host = {
        frozen: Object.isFrozen(Function.prototype),
        keys: [keys(Function.prototype.apply), keys(Function.prototype.call), keys(Function.prototype.bind)],
        max: Math.max.apply(null, [1, 5, 3]),
        sum: (function (a, b) { return this.x + a + b }).call({ x: 1 }, 2, 3),
        bound: (function (a, b) { return a + b }).bind(null, 2)(3),
      }
      // app scripts run in compartments: they must see the same clean intrinsics
      const inside = new Compartment().evaluate(\`[
        [Function.prototype.apply, Function.prototype.call, Function.prototype.bind].map(fn => Reflect.ownKeys(fn).join(',')),
        Math.max.apply(null, [1, 5, 3]),
        (function (a, b) { return a + b }).bind(null, 2)(3),
      ]\`)
      // rebinding the host's global Reflect after lockdown does not change the clean methods
      globalThis.Reflect = { apply: () => 'hijacked' }
      host.afterRebind = Math.max.apply(null, [1, 5, 3])
      console.log(JSON.stringify({ ok: true, host, inside }))
    } catch (err) {
      console.log(JSON.stringify({ ok: false, error: String(err && err.message) }))
    }
  `
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
  })
  assert.equal(run.status, 0, run.stderr)
  return { result: JSON.parse(run.stdout.trim().split('\n').pop()), stderr: run.stderr }
}

const cleanResult = {
  ok: true,
  host: {
    frozen: true,
    keys: ['length,name', 'length,name', 'length,name'],
    max: 5,
    sum: 6,
    bound: 5,
    afterRebind: 5,
  },
  inside: [['length,name', 'length,name', 'length,name'], 5, 5],
}

test("clean intrinsics: without the cleanup, Brave's additions stop SES lockdown", () => {
  const { result } = lockdownWith(braveLike, { clean: false })
  assert.equal(result.ok, false)
  assert.match(result.error, /delete/i)
})

test('clean intrinsics: with the cleanup, lockdown completes and hosts and compartments see clean intrinsics', () => {
  const { result, stderr } = lockdownWith(braveLike)
  assert.deepEqual(result, cleanResult)
  assert.match(stderr, /\[lockdown\] replaced Function\.prototype methods .*apply \(call, apply, bind, toString\)/)
  // a plain environment: no replacement, no message
  const plain = lockdownWith('')
  assert.deepEqual(plain.result, cleanResult)
  assert.equal(/\[lockdown\] replaced/.test(plain.stderr), false)
})
