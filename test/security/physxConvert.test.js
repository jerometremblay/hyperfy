// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/physxConvert.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as esbuild from 'esbuild'
import { Vector3, Quaternion, Matrix4 } from 'three'
import { Vector3Enhanced } from '../../src/core/extras/Vector3Enhanced.js'
import {
  isVector3,
  isQuaternion,
  isFiniteF32,
  readVec3,
  readQuat,
  writeVec3,
  writeQuat,
  vec3ToPx,
  vec3ToPxPos,
  quatToPxRot,
  matrixToPxTransform,
  decomposeMatrix,
  pxToVec3,
  pxToQuat,
  scratchPxVec3,
  scratchPxExtVec3,
  warnOnce,
} from '../../src/core/extras/physxConvert.js'

const nativePose = () => ({ p: { x: 7, y: 8, z: 9 }, q: { x: 1, y: 2, z: 3, w: 4 } })
const components = value => [value.x, value.y, value.z]

test('imports without PHYSX; shared natives are allocated lazily and separately', () => {
  assert.equal(globalThis.PHYSX, undefined)
  let vectors = 0
  let extended = 0
  globalThis.PHYSX = {
    PxVec3: class {
      constructor() {
        vectors++
      }
    },
    PxExtendedVec3: class {
      constructor() {
        extended++
      }
    },
  }
  try {
    assert.equal(vectors + extended, 0)
    const vector = scratchPxVec3()
    const ext = scratchPxExtVec3()
    assert.equal(scratchPxVec3(), vector)
    assert.equal(scratchPxExtVec3(), ext)
    assert.notEqual(vector, ext)
    assert.equal(vectors, 1)
    assert.equal(extended, 1)
  } finally {
    delete globalThis.PHYSX
  }
})

test('vector brands accept both classes, subclasses and proxies, and reject flag spoofs', () => {
  class EnhancedChild extends Vector3Enhanced {}
  class StockChild extends Vector3 {}
  for (const Class of [Vector3Enhanced, Vector3, EnhancedChild, StockChild]) {
    for (const value of [new Class(1, 2, 3), new Proxy(new Class(1, 2, 3), {})]) {
      assert.equal(isVector3(value), true)
      for (const out of [new Vector3Enhanced(), new Vector3()]) {
        assert.equal(readVec3(value, out, 'vector required'), true)
        assert.deepEqual(components(out), [1, 2, 3])
      }
    }
  }
  const uninitialized = Object.create(Vector3Enhanced.prototype)
  assert.equal(isVector3(uninitialized), true)
  const out = new Vector3(4, 5, 6)
  assert.equal(readVec3(uninitialized, out, 'vector required'), false)
  assert.deepEqual(components(out), [4, 5, 6])
  for (const value of [null, undefined, {}, { isVector3: true, x: 1, y: 2, z: 3 }]) {
    assert.equal(isVector3(value), false)
    assert.throws(() => readVec3(value, out, 'vector required'), { message: 'vector required' })
  }
})

test('quaternion brands accept subclasses and proxies and reject flag spoofs', () => {
  class Child extends Quaternion {}
  for (const value of [new Quaternion(1, 2, 3, 4), new Child(1, 2, 3, 4), new Proxy(new Quaternion(1, 2, 3, 4), {})]) {
    const out = new Quaternion()
    assert.equal(isQuaternion(value), true)
    assert.equal(readQuat(value, out, 'quaternion required'), true)
    assert.deepEqual(out.toArray(), [1, 2, 3, 4])
  }
  const spoof = { isQuaternion: true, x: 1, y: 2, z: 3, w: 4 }
  assert.equal(isQuaternion(spoof), false)
  assert.throws(() => readQuat(spoof, new Quaternion(), 'quaternion required'), { message: 'quaternion required' })
})

test('captured ordinary instanceof ignores later static Symbol.hasInstance overrides', () => {
  const classes = [Vector3Enhanced, Vector3, Quaternion]
  const descriptors = classes.map(Class => Object.getOwnPropertyDescriptor(Class, Symbol.hasInstance))
  try {
    for (const Class of classes) {
      Object.defineProperty(Class, Symbol.hasInstance, { value: () => true, configurable: true })
    }
    assert.equal(isVector3({ isVector3: true }), false)
    assert.equal(isQuaternion({ isQuaternion: true }), false)
    assert.equal(isVector3(new Vector3Enhanced()), true)
    assert.equal(isVector3(new Vector3()), true)
    assert.equal(isQuaternion(new Quaternion()), true)
  } finally {
    classes.forEach((Class, i) => {
      if (descriptors[i]) Object.defineProperty(Class, Symbol.hasInstance, descriptors[i])
      else delete Class[Symbol.hasInstance]
    })
  }
})

test('reads primitive components once through proxies without dispatching to input methods', () => {
  for (const [value, out, read, keys] of [
    [new Vector3Enhanced(), new Vector3(), readVec3, ['x', 'y', 'z']],
    [new Quaternion(), new Quaternion(), readQuat, ['x', 'y', 'z', 'w']],
  ]) {
    const reads = Object.fromEntries(keys.map(key => [key, 0]))
    const proxy = new Proxy(value, {
      get(target, key, receiver) {
        if (keys.includes(key)) return ++reads[key]
        return Reflect.get(target, key, receiver)
      },
    })
    value.copy = value.set = value.clone = () => assert.fail('input method called')
    assert.equal(read(proxy, out, 'required'), true)
    assert.deepEqual(
      keys.map(key => out[key]),
      keys.map(() => 1)
    )
    assert.deepEqual(
      Object.values(reads),
      keys.map(() => 1)
    )
  }
})

test('invalid components leave read outputs unchanged and produce only numeric native fallbacks', () => {
  let coerced = false
  const object = {
    valueOf() {
      coerced = true
      return 1
    },
  }
  const invalid = [NaN, Infinity, -Infinity, 1e39, -1e39, '1', undefined, null, 1n, object]
  for (const bad of invalid) {
    assert.equal(isFiniteF32(bad), false)
    for (const key of ['x', 'y', 'z']) {
      const value = new Vector3Enhanced(1, 2, 3)
      value[key] = bad
      const out = new Vector3(4, 5, 6)
      assert.equal(readVec3(value, out, 'required'), false)
      assert.deepEqual(components(out), [4, 5, 6])
      const px = { x: 4, y: 5, z: 6 }
      assert.equal(vec3ToPx(value, px), false)
      assert.deepEqual(px, { x: 0, y: 0, z: 0 })
      const tm = nativePose()
      assert.equal(vec3ToPxPos(value, tm), false)
      assert.deepEqual(tm.p, px)
      assert.deepEqual(tm.q, nativePose().q)
    }
    for (const key of ['x', 'y', 'z', 'w']) {
      const value = new Quaternion(1, 2, 3, 4)
      value[key] = bad
      const out = new Quaternion(5, 6, 7, 8)
      assert.equal(readQuat(value, out, 'required'), false)
      assert.deepEqual(out.toArray(), [5, 6, 7, 8])
      const tm = nativePose()
      assert.equal(quatToPxRot(value, tm), false)
      assert.deepEqual(tm.q, { x: 0, y: 0, z: 0, w: 1 })
      assert.deepEqual(tm.p, nativePose().p)
    }
  }
  assert.equal(coerced, false)
  for (const value of [0, -0, 1, -1, 1e-45, 3.4028234663852886e38]) assert.equal(isFiniteF32(value), true)
})

test('native writers read every source component and transform member once', () => {
  for (const [convert, member, keys] of [
    [vec3ToPxPos, 'p', ['x', 'y', 'z']],
    [quatToPxRot, 'q', ['x', 'y', 'z', 'w']],
  ]) {
    for (const valid of [true, false]) {
      const reads = {}
      const value = Object.fromEntries(keys.map((key, i) => [key, valid || i ? i + 1 : NaN]))
      const source = new Proxy(value, {
        get(target, key) {
          reads[key] = (reads[key] || 0) + 1
          return target[key]
        },
      })
      let memberReads = 0
      const px = {}
      const tm = {
        get [member]() {
          memberReads++
          return px
        },
      }
      assert.equal(convert(source, tm), valid)
      assert.equal(memberReads, 1)
      assert.deepEqual(
        keys.map(key => reads[key]),
        keys.map(() => 1)
      )
      assert.ok(Object.values(px).every(value => typeof value === 'number' && Number.isFinite(value)))
    }
  }
})

test('matrix conversion writes decomposed numbers and leaves the native untouched on failure', () => {
  const position = new Vector3(1, 2, 3)
  const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.7)
  const matrix = new Matrix4().compose(position, rotation, new Vector3(2, 3, 4))
  const tm = nativePose()
  assert.equal(matrixToPxTransform(matrix, tm), true)
  assert.deepEqual(components(tm.p), components(position))
  assert.ok(rotation.angleTo(new Quaternion(tm.q.x, tm.q.y, tm.q.z, tm.q.w)) < 1e-7)
  for (const bad of [NaN, Infinity, -Infinity, 1e39]) {
    const invalid = matrix.clone()
    invalid.elements[12] = bad
    const untouched = nativePose()
    assert.equal(matrixToPxTransform(invalid, untouched), false)
    assert.deepEqual(untouched, nativePose())
  }
  assert.equal(matrixToPxTransform(new Matrix4().makeScale(0, 1, 1), tm), false)
  assert.equal(matrixToPxTransform(matrix, tm), true)
})

test('captured setters bypass prototype and own method replacements', () => {
  const enhanced = new Vector3Enhanced()
  const stock = new Vector3()
  const quat = new Quaternion()
  const prototypes = [Vector3Enhanced.prototype, Vector3.prototype, Quaternion.prototype]
  const originals = prototypes.map(prototype => prototype.set)
  const fail = () => assert.fail('patched setter called')
  enhanced.set = enhanced.copy = stock.set = stock.copy = quat.set = quat.copy = fail
  try {
    for (const prototype of prototypes) prototype.set = fail
    for (const out of [enhanced, stock]) {
      assert.equal(writeVec3(out, 1, 2, 3), out)
      assert.deepEqual(components(out), [1, 2, 3])
      assert.equal(readVec3(new Vector3(4, 5, 6), out, 'required'), true)
      assert.deepEqual(components(out), [4, 5, 6])
      assert.equal(pxToVec3(out, { ptr: 1, x: 7, y: 8, z: 9 }), out)
      assert.deepEqual(components(out), [7, 8, 9])
    }
    assert.equal(writeQuat(quat, 1, 2, 3, 4), quat)
    assert.deepEqual(quat.toArray(), [1, 2, 3, 4])
    assert.equal(readQuat(new Quaternion(4, 3, 2, 1), quat, 'required'), true)
    assert.deepEqual(quat.toArray(), [4, 3, 2, 1])
    assert.equal(pxToQuat(quat, { ptr: 1, x: 0, y: 0, z: 0, w: 1 }), quat)
    assert.deepEqual(quat.toArray(), [0, 0, 0, 1])
  } finally {
    prototypes.forEach((prototype, i) => {
      prototype.set = originals[i]
    })
  }
})

test('captured decompose bypasses its replacement; transitive methods receive no natives', () => {
  const calls = []
  const methods = [
    [Vector3.prototype, 'set'],
    [Vector3.prototype, 'length'],
    [Matrix4.prototype, 'determinant'],
    [Matrix4.prototype, 'copy'],
    [Quaternion.prototype, 'setFromRotationMatrix'],
  ]
  const originals = methods.map(([prototype, key]) => prototype[key])
  const originalDecompose = Matrix4.prototype.decompose
  const matrix = new Matrix4().makeTranslation(1, 2, 3)
  try {
    Matrix4.prototype.decompose = () => assert.fail('patched decompose called')
    methods.forEach(([prototype, key], i) => {
      prototype[key] = function (...args) {
        for (const value of [this, ...args]) {
          assert.equal(value !== null && typeof value === 'object' && 'ptr' in value, false)
        }
        calls.push(key)
        return Reflect.apply(originals[i], this, args)
      }
    })
    const tm = { ptr: 1, p: { ptr: 2 }, q: { ptr: 3 } }
    assert.equal(matrixToPxTransform(matrix, tm), true)
    assert.deepEqual(components(tm.p), [1, 2, 3])
    const position = new Vector3()
    const quaternion = new Quaternion()
    const scale = new Vector3()
    decomposeMatrix(matrix, position, quaternion, scale)
    assert.deepEqual(position.toArray(), [1, 2, 3])
    assert.deepEqual(quaternion.toArray(), [0, 0, 0, 1])
    assert.deepEqual(scale.toArray(), [1, 1, 1])
    assert.ok(calls.length > 0)
  } finally {
    Matrix4.prototype.decompose = originalDecompose
    methods.forEach(([prototype, key], i) => {
      prototype[key] = originals[i]
    })
  }
})

test('outputs enforce brands and fire exactly one callback with no native arguments', () => {
  const vector = new Vector3Enhanced()
  const quat = new Quaternion()
  let vectorChanges = 0
  let quatChanges = 0
  vector._onChange((...args) => {
    assert.deepEqual(args, [])
    vectorChanges++
  })
  quat._onChange((...args) => {
    assert.deepEqual(args, [])
    quatChanges++
  })
  pxToVec3(vector, { ptr: 1, x: 1, y: 2, z: 3 })
  pxToQuat(quat, { ptr: 2, x: 0, y: 0, z: 0, w: 1 })
  assert.equal(vectorChanges, 1)
  assert.equal(quatChanges, 1)
  assert.throws(() => writeVec3({}, 1, 2, 3), { name: 'TypeError', message: 'expected Vector3' })
  assert.throws(() => writeQuat({}, 0, 0, 0, 1), { name: 'TypeError', message: 'expected Quaternion' })
})

test('native readers read each binding getter once', () => {
  for (const [target, convert, keys] of [
    [new Vector3Enhanced(), pxToVec3, ['x', 'y', 'z']],
    [new Quaternion(), pxToQuat, ['x', 'y', 'z', 'w']],
  ]) {
    const reads = {}
    const px = { ptr: 1 }
    for (const key of keys) {
      Object.defineProperty(px, key, {
        get() {
          reads[key] = (reads[key] || 0) + 1
          return reads[key]
        },
      })
    }
    assert.equal(convert(target, px), target)
    assert.deepEqual(
      keys.map(key => target[key]),
      keys.map(() => 1)
    )
    assert.deepEqual(
      Object.values(reads),
      keys.map(() => 1)
    )
  }
})

test('warnOnce suppresses repeats per key, with an optional message', t => {
  const warn = t.mock.method(console, 'warn', () => {})
  warnOnce('conversion-test', 'first')
  warnOnce('conversion-test', 'second')
  warnOnce('conversion-test-other')
  assert.deepEqual(
    warn.mock.calls.map(call => call.arguments),
    [['first'], ['conversion-test-other']]
  )
})

test('converted node positions still dirty and commit; Physics move skips invalid matrices and recovers', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'physx-convert-'))
  try {
    const outfile = path.join(dir, 'integration.mjs')
    await esbuild.build({
      stdin: {
        contents: `
          export { Node } from './src/core/nodes/Node'
          export { Stage } from './src/core/systems/Stage'
          export { Physics } from './src/core/systems/Physics'
          export { pxToVec3 } from './src/core/extras/physxConvert.js'
        `,
        resolveDir: fileURLToPath(new URL('../..', import.meta.url)),
      },
      outfile,
      bundle: true,
      platform: 'node',
      format: 'esm',
      plugins: [
        {
          name: 'stub-physx-loader',
          setup(build) {
            build.onLoad({ filter: /\/loadPhysX\.js$/ }, () => ({
              contents: "export function loadPhysX() { throw new Error('unexpected PhysX initialization') }",
            }))
          },
        },
      ],
      define: { 'process.env.CLIENT': 'false', 'process.env.SERVER': 'true' },
      logLevel: 'silent',
    })
    const { Node, Stage, Physics, pxToVec3: convert } = await import(pathToFileURL(outfile))
    const stage = new Stage({})
    const node = new Node()
    let commits = 0
    node.commit = moved => {
      assert.equal(moved, true)
      commits++
    }
    node.activate({ world: { stage } })
    convert(node.position, { ptr: 1, x: 1, y: 2, z: 3 })
    assert.equal(stage.dirtyNodes.has(node), true)
    stage.clean()
    assert.equal(commits, 1)
    assert.equal(node.matrixWorld.elements[12], 1)
    assert.equal(stage.dirtyNodes.size, 0)
    convert(node.position, { ptr: 1, x: 4, y: 5, z: 6 })
    stage.clean()
    assert.equal(commits, 2)
    assert.equal(node.matrixWorld.elements[12], 4)

    const physics = new Physics({})
    physics.handles = new Map()
    physics.registrations = new WeakMap()
    physics.scene = { addActor() {} }
    physics.transform = nativePose()
    const poses = []
    const handle = physics.addActor({ ptr: 1, setGlobalPose: pose => poses.push(structuredClone(pose)) }, {})
    const matrix = new Matrix4().makeTranslation(1, 2, 3)
    handle.move(matrix)
    matrix.elements[12] = NaN
    handle.move(matrix)
    assert.equal(poses.length, 1)
    assert.deepEqual(components(physics.transform.p), [1, 2, 3])
    matrix.elements[12] = 4
    handle.move(matrix)
    assert.equal(poses.length, 2)
    assert.deepEqual(components(poses[1].p), [4, 2, 3])
    physics.ignoreSetGlobalPose = true
    handle.move(null)
    assert.equal(poses.length, 2)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
