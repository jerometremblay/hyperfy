// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/physicsInputs.test.js
import { after, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { bundleProbe } from './lib/workerProbe.mjs'

let bundle
let RigidBody, Controller, Joint, Node, Apps, PlayerLocal, createPlayerProxy, createEntityProxy
let Vector3, StockVector3, Quaternion, Object3D
const previousPhysX = Object.getOwnPropertyDescriptor(globalThis, 'PHYSX')
const calls = []
const warnings = []
const originalWarn = console.warn
let injected
class FakeRuntimeError extends Error {}
const native =
  (name, result) =>
  (...args) => {
    if (injected) throw injected
    calls.push({
      name,
      rawArgs: args,
      args: args.map(value => {
        if (value && typeof value === 'object') {
          if ('x' in value) return { x: value.x, y: value.y, z: value.z }
          return Array.isArray(value) ? [...value] : { ...value }
        }
        return value
      }),
    })
    return result
  }
class PxVec3 {
  constructor() {
    if (injected) throw injected
    Object.assign(this, { ptr: 1, x: 0, y: 0, z: 0 })
  }
}
class PxTransform {
  constructor() {
    if (injected) throw injected
    this.ptr = 2
    this.p = new PxVec3()
    this.q = { ptr: 3, x: 0, y: 0, z: 0, w: 1 }
  }
}
const velocity = { ptr: 4, x: 4, y: 5, z: 6 }
const physics = {
  PxVec3,
  PxExtendedVec3: PxVec3,
  PxTransform,
  PxIDENTITYEnum: { PxIdentity: 0 },
  PxRigidBodyFlagEnum: { eKINEMATIC: 1 },
  PxForceModeEnum: { eFORCE: 0, eIMPULSE: 1, eACCELERATION: 2, eVELOCITY_CHANGE: 3 },
  PxControllerCollisionFlagEnum: { eCOLLISION_DOWN: 1, eCOLLISION_UP: 2 },
  PxRigidBodyExt: {
    prototype: {
      addForceAtPos: native('addForceAtPos'),
      addForceAtLocalPos: native('addForceAtLocalPos'),
      getVelocityAtPos: native('getVelocityAtPos', velocity),
      getLocalVelocityAtLocalPos: native('getLocalVelocityAtLocalPos', velocity),
    },
  },
}

before(async () => {
  console.warn = value => warnings.push(value)
  globalThis.PHYSX = physics
  bundle = await bundleProbe(`
    export { RigidBody } from './src/core/nodes/RigidBody'
    export { Controller } from './src/core/nodes/Controller'
    export { Joint } from './src/core/nodes/Joint'
    export { Node } from './src/core/nodes/Node'
    export { Apps } from './src/core/systems/Apps'
    export { PlayerLocal } from './src/core/entities/PlayerLocal'
    export { createPlayerProxy } from './src/core/extras/createPlayerProxy'
    export { createEntityProxy } from './src/core/extras/createEntityProxy'
    export { Vector3, Quaternion, Object3D } from './src/core/extras/three'
    export { Vector3 as StockVector3 } from 'three'
  `)
  ;({
    RigidBody,
    Controller,
    Joint,
    Node,
    Apps,
    PlayerLocal,
    createPlayerProxy,
    createEntityProxy,
    Vector3,
    StockVector3,
    Quaternion,
    Object3D,
  } = await import(bundle.url))
})
beforeEach(() => {
  calls.length = 0
  injected = null
})
after(() => {
  console.warn = originalWarn
  bundle?.destroy()
  if (previousPhysX) Object.defineProperty(globalThis, 'PHYSX', previousPhysX)
  else delete globalThis.PHYSX
})

const xyz = v => [v.x, v.y, v.z]
const xyzw = q => [q.x, q.y, q.z, q.w]
const spoof = () => ({ isVector3: true, x: 1, y: 2, z: 3, toPxVec3: () => assert.fail('spoof called') })
const shadow = value => {
  for (const name of ['set', 'copy', 'clone', 'toArray', 'toPxVec3', 'toPxExtVec3', 'toPxTransform', 'fromPxVec3']) {
    value[name] = () => assert.fail(`shadowed ${name} called`)
  }
  return value
}
function vectors() {
  class EnhancedChild extends Vector3 {}
  class StockChild extends StockVector3 {}
  return [Vector3, StockVector3, EnhancedChild, StockChild]
    .map(Ctor => shadow(new Ctor(1, 2, 3)))
    .concat([new Proxy(shadow(new Vector3(1, 2, 3)), {})])
}
function body(actor = true) {
  const node = new RigidBody({ type: 'kinematic' })
  node._centerOfMass = new Vector3(9, 8, 7)
  const pose = new PxTransform()
  if (actor)
    node.actor = {
      getGlobalPose: native('getGlobalPose', pose),
      setGlobalPose: native('setGlobalPose'),
      addForce: native('addForce'),
      addTorque: native('addTorque'),
      getLinearVelocity: native('getLinearVelocity', velocity),
      getAngularVelocity: native('getAngularVelocity', velocity),
      setLinearVelocity: native('setLinearVelocity'),
      setAngularVelocity: native('setAngularVelocity'),
      getRigidBodyFlags: () => ({ isSet: () => true }),
      setKinematicTarget: native('setKinematicTarget'),
      isSleeping: native('isSleeping', true),
      release: native('release'),
    }
  return node
}
const mutators = {
  addForce: v => [v, 'impulse'],
  addForceAtPos: v => [v, new Vector3(7, 8, 9), 'impulse'],
  addForceAtLocalPos: v => [v, new Vector3(7, 8, 9), 'impulse'],
  addTorque: v => [v, 'impulse'],
  setPosition: v => [v],
  setLinearVelocity: v => [v],
  setAngularVelocity: v => [v],
  setCenterOfMass: v => [v],
  setKinematicTarget: v => [v, new Quaternion()],
}
const inputNames = {
  addForce: 'force',
  addForceAtPos: 'force',
  addForceAtLocalPos: 'force',
  addTorque: 'torque',
  setPosition: 'position',
  setLinearVelocity: 'velocity',
  setAngularVelocity: 'velocity',
  setCenterOfMass: 'pos',
  setKinematicTarget: 'position',
}
const vectorGetters = [
  'getPosition',
  'getLinearVelocity',
  'getAngularVelocity',
  'getVelocityAtPos',
  'getLocalVelocityAtLocalPos',
]
const getterArgs = (name, target) => (name.includes('At') ? [new Vector3(1, 2, 3), target] : [target])
const invalidComponents = () => [NaN, Infinity, -Infinity, 1e39, '1', { valueOf: () => assert.fail('coercion') }]

for (const name of Object.keys(mutators)) {
  test(`RigidBody.${name}: real brands, shadows, spoof rejection and non-finite no-op`, () => {
    const node = body()
    const proxy = node.getProxy()
    for (const v of vectors()) {
      calls.length = 0
      assert.equal(proxy[name](...mutators[name](v)), undefined)
      if (name === 'setCenterOfMass') {
        assert.notEqual(node._centerOfMass, v)
        assert.deepEqual(xyz(node._centerOfMass), [1, 2, 3])
      } else {
        assert.ok(calls.length > 0)
        const last = calls.at(-1)
        const input = last.args[name.startsWith('addForceAt') ? 1 : 0]
        assert.deepEqual(xyz(input.p || input), [1, 2, 3])
      }
    }
    for (const actor of [node.actor, null]) {
      node.actor = actor
      assert.throws(() => proxy[name](...mutators[name](spoof())), {
        message: `[rigidbody] ${name} ${inputNames[name]} must be Vector3`,
      })
      for (const bad of invalidComponents()) {
        calls.length = 0
        node.needsRebuild = false
        const before = xyz(node.position)
        const center = xyz(node._centerOfMass)
        assert.equal(proxy[name](...mutators[name](new Vector3(bad, 2, 3))), undefined)
        assert.equal(calls.length, 0)
        assert.equal(node.needsRebuild, false)
        assert.deepEqual(xyz(node.position), before)
        assert.deepEqual(xyz(node._centerOfMass), center)
      }
    }
  })
}

for (const name of vectorGetters) {
  test(`RigidBody.${name}: branded targets, defaults, zero fallbacks and captured setters`, () => {
    for (const mounted of [true, false]) {
      const node = body(mounted)
      const proxy = node.getProxy()
      for (const target of vectors()) {
        assert.equal(proxy[name](...getterArgs(name, target)), target)
        assert.deepEqual(xyz(target), mounted && name !== 'getPosition' ? [4, 5, 6] : [0, 0, 0])
      }
      for (const target of [undefined, null, false, 0]) {
        assert.equal(proxy[name](...getterArgs(name, target)), node.tempVec3)
      }
      for (const target of [spoof(), {}, new Quaternion(), true]) {
        assert.throws(() => proxy[name](...getterArgs(name, target)), {
          message: `[rigidbody] ${name} target must be Vector3`,
        })
      }
      if (name.includes('At')) {
        for (const pos of vectors()) {
          assert.deepEqual(xyz(proxy[name](pos)), mounted ? [4, 5, 6] : [0, 0, 0])
        }
        assert.throws(() => proxy[name](spoof()), { message: `[rigidbody] ${name} pos must be Vector3` })
        for (const bad of invalidComponents()) {
          calls.length = 0
          for (const target of [undefined, new Vector3(7, 8, 9), new StockVector3(7, 8, 9)]) {
            const result = proxy[name](new Vector3(0, bad, 0), target)
            assert.equal(result, target || node.tempVec3)
            assert.deepEqual(xyz(result), [0, 0, 0])
          }
          assert.equal(calls.length, 0)
          assert.throws(() => proxy[name](new Vector3(bad, 0, 0), spoof()), {
            message: `[rigidbody] ${name} target must be Vector3`,
          })
        }
      }
    }
  })
}

test('RigidBody quaternion inputs/outputs, second arguments, modes, and kinematic ordering', () => {
  const node = body()
  const proxy = node.getProxy()
  class QuaternionChild extends Quaternion {}
  for (const quat of [new Quaternion(), new QuaternionChild(), new Proxy(new Quaternion(), {})]) {
    shadow(quat)
    proxy.setQuaternion(quat)
    assert.deepEqual(xyzw(node.quaternion), [0, 0, 0, 1])
    assert.equal(proxy.getQuaternion(quat), quat)
    assert.deepEqual(xyzw(quat), [0, 0, 0, 1])
    proxy.setKinematicTarget(new Vector3(), quat)
  }
  for (const value of [{ isQuaternion: true }, new Vector3()]) {
    assert.throws(() => proxy.setQuaternion(value), {
      message: '[rigidbody] setQuaternion quaternion must be Quaternion',
    })
    assert.throws(() => proxy.getQuaternion(value), { message: '[rigidbody] getQuaternion target must be Quaternion' })
    assert.throws(() => proxy.setKinematicTarget(new Vector3(), value), {
      message: '[rigidbody] setKinematicTarget quaternion must be Quaternion',
    })
  }
  for (const bad of invalidComponents()) {
    calls.length = 0
    proxy.setQuaternion(new Quaternion(0, 0, 0, bad))
    proxy.setKinematicTarget(new Vector3(), new Quaternion(0, bad, 0, 1))
    assert.equal(calls.length, 0)
    assert.deepEqual(xyzw(node.quaternion), [0, 0, 0, 1])
  }
  for (const name of ['addForceAtPos', 'addForceAtLocalPos']) {
    for (const pos of vectors()) {
      proxy[name](new Vector3(7, 8, 9), pos)
      assert.deepEqual(xyz(calls.at(-1).args[1]), [7, 8, 9])
      assert.deepEqual(xyz(calls.at(-1).args[2]), [1, 2, 3])
    }
    assert.throws(() => proxy[name](new Vector3(), spoof()), { message: `[rigidbody] ${name} pos must be Vector3` })
    for (const bad of invalidComponents()) {
      calls.length = 0
      proxy[name](new Vector3(), new Vector3(0, 0, bad))
      assert.equal(calls.length, 0)
    }
  }
  for (const [mode, expected] of [
    ['force', 0],
    ['impulse', 1],
    ['acceleration', 2],
    ['velocityChange', 3],
    ['constructor', 0],
    ['toString', 0],
    ['__proto__', 0],
    [undefined, 0],
    [{ toString: () => assert.fail('mode coercion') }, 0],
  ]) {
    for (const name of ['addForce', 'addForceAtPos', 'addForceAtLocalPos', 'addTorque']) {
      proxy[name](...(name.includes('At') ? [new Vector3(), new Vector3(), mode] : [new Vector3(), mode]))
      assert.equal(calls.at(-1).args[name.includes('At') ? 3 : 1], expected)
    }
  }
  node.actor = null
  for (const target of [undefined, null, false, shadow(new Quaternion(1, 2, 3, 4))]) {
    assert.deepEqual(xyzw(proxy.getQuaternion(target)), [0, 0, 0, 1])
  }
  node.type = 'static'
  assert.throws(() => proxy.setKinematicTarget(spoof(), {}), {
    message: '[rigidbody] setKinematicTarget failed (not kinematic)',
  })
  node.actor = {}
  assert.doesNotThrow(() => proxy.setLinearVelocity(new Vector3()))
  assert.doesNotThrow(() => proxy.setAngularVelocity(new Vector3()))
})

test('RigidBody reads script components once, ignores forged hasInstance, and preserves node dirty tracking', () => {
  const node = body()
  const proxy = node.getProxy()
  const counts = { x: 0, y: 0, z: 0 }
  const v = new Proxy(new Vector3(1, 2, 3), {
    get(target, key) {
      if (key in counts) counts[key]++
      return Reflect.get(target, key)
    },
  })
  proxy.setPosition(v)
  assert.deepEqual(counts, { x: 1, y: 1, z: 1 })
  Object.defineProperty(Vector3, Symbol.hasInstance, { value: () => true, configurable: true })
  try {
    assert.throws(() => proxy.addForce(spoof()), { message: '[rigidbody] addForce force must be Vector3' })
  } finally {
    delete Vector3[Symbol.hasInstance]
  }
  calls.length = 0
  proxy.addForce(Object.create(Vector3.prototype))
  assert.equal(calls.length, 0)
  node.mounted = true
  node.isTransformed = false
  node.isDirty = false
  node.needsRebuild = false
  node.ctx = { world: { stage: { dirtyNodes: new Set() } } }
  node.actorHandle = { move: native('move') }
  proxy.getLinearVelocity(node.position)
  assert.equal(node.ctx.world.stage.dirtyNodes.has(node), true)
  proxy.clean()
  assert.equal(calls.at(-1).name, 'move')
})

function controller() {
  const node = new Controller()
  node.ctx = { world: { physics: { controllerFilters: {}, drainCallbackFailures() {} } } }
  node.controller = {
    invalidateCache() {},
    getStepOffset: () => 0.5,
    getContactOffset: () => 0.02,
    move: native('controller.move', { isSet: flag => flag === 1 }),
    setFootPosition: native('setFootPosition'),
    getFootPosition: native('getFootPosition', velocity),
  }
  return node
}
for (const name of ['teleport', 'move']) {
  test(`Controller.${name}: brands, finite copies, non-finite no-ops and unmounted calls`, () => {
    const node = controller()
    const proxy = node.getProxy()
    assert.equal(proxy.isGrounded, false)
    assert.equal(proxy.isCeiling, false)
    for (const v of vectors()) {
      calls.length = 0
      proxy[name](v)
      assert.deepEqual(xyz(calls[0].args[0]), [1, 2, 3])
      assert.deepEqual(xyz(node.position), name === 'move' ? [4, 5, 6] : [1, 2, 3])
    }
    if (name === 'move') {
      assert.equal(proxy.isGrounded, true)
      assert.equal(proxy.isCeiling, false)
    }
    for (const nativeController of [node.controller, null]) {
      node.controller = nativeController
      assert.throws(() => proxy[name](spoof()), { message: `[controller] ${name} expected Vector3` })
      for (const bad of invalidComponents()) {
        const before = xyz(node.position)
        calls.length = 0
        proxy[name](new Vector3(0, bad, 0))
        assert.equal(calls.length, 0)
        assert.deepEqual(xyz(node.position), before)
      }
      assert.doesNotThrow(() => proxy[name](new StockVector3(9, 8, 7)))
      if (name === 'teleport') assert.deepEqual(xyz(node.position), [9, 8, 7])
    }
  })
}

test('Joint verifies genuine bodies, rejects forged/wrong nodes without reading _ref, and mounts all four types', () => {
  for (const type of ['fixed', 'socket', 'hinge', 'distance']) {
    const node = new Joint({ type })
    const proxy = node.getProxy()
    for (const name of ['body0', 'body1']) {
      assert.equal(proxy[name], null)
      const rigidbody = body()
      proxy[name] = rigidbody.getProxy()
      assert.equal(node[name], rigidbody)
      assert.equal(proxy[name], rigidbody.getProxy())
      const throwingRef = Object.defineProperty({}, '_ref', { get: () => assert.fail('forged getter ran') })
      for (const value of [
        { _ref: { actor: { ptr: 123 } } },
        throwingRef,
        new Node().getProxy(),
        rigidbody,
        false,
        0,
      ]) {
        assert.throws(
          () => {
            proxy[name] = value
          },
          { message: `[joint] ${name} must be a rigidbody` }
        )
        assert.equal(node[name], rigidbody)
      }
      for (const value of [undefined, null]) {
        proxy[name] = value
        assert.equal(node[name], null)
        assert.equal(proxy[name], null)
      }
      proxy[name] = rigidbody.getProxy()
    }
    const ctor = {
      fixed: 'FixedJointCreate',
      socket: 'SphericalJointCreate',
      hinge: 'RevoluteJointCreate',
      distance: 'DistanceJointCreate',
    }[type]
    physics[ctor] = class {
      constructor(world, actor0, frame0, actor1, frame1) {
        assert.equal(actor0, node.body0.actor)
        assert.equal(actor1, node.body1.actor)
        assert.ok(frame0.ptr && frame1.ptr)
      }
      setBreakForce() {}
      setMinDistance() {}
      setMaxDistance() {}
      setDistanceJointFlag() {}
    }
    physics.PxDistanceJointFlagEnum = { eMIN_DISTANCE_ENABLED: 1, eMAX_DISTANCE_ENABLED: 2 }
    node.ctx = { world: { physics: { physics: {} } } }
    node.mount()
    assert.ok(node.joint)
    assert.equal('_allowRefs' in node.ctx.world, false)
    assert.equal(proxy._ref, null)
  }
})

function queries() {
  const world = {
    physics: {
      raycast: native('raycast', {
        point: new Vector3(1, 2, 3),
        normal: new Vector3(0, 1, 0),
        distance: 5,
        handle: { tag: 'box', playerId: 'p' },
      }),
      overlapSphere: native('overlapSphere', [{ proxy: { tag: 'box', playerId: 'p' } }]),
    },
  }
  const apps = new Apps(world)
  return createEntityProxy({}, { getters: apps.worldGetters, setters: apps.worldSetters, methods: apps.worldMethods })
}

test('Apps queries: both brands, host copies, no shadow dispatch, scalar rules and invalid results', () => {
  const proxy = queries()
  for (const origin of vectors()) {
    for (const direction of vectors()) {
      const hit = proxy.raycast(origin, direction, 0)
      assert.equal(hit.tag, 'box')
      assert.equal(hit.distance, 5)
      assert.deepEqual(xyz(hit.point), [1, 2, 3])
      assert.notEqual(calls.at(-1).rawArgs[0], origin)
      assert.notEqual(calls.at(-1).rawArgs[1], direction)
      assert.deepEqual(xyz(calls.at(-1).args[0]), [1, 2, 3])
      assert.deepEqual(xyz(calls.at(-1).args[1]), [1, 2, 3])
    }
    assert.deepEqual(proxy.overlapSphere(1, origin), [{ tag: 'box', playerId: 'p' }])
  }
  const v = new Vector3()
  for (const [distance, expected] of [
    [undefined, Infinity],
    [null, Infinity],
    [0, 0],
    [Infinity, Infinity],
    [1e300, 1e300],
  ]) {
    proxy.raycast(v, v, distance)
    assert.equal(calls.at(-1).args[2], expected)
  }
  for (const distance of [-1, -Infinity, NaN, '1', {}, new Number(1)]) {
    assert.throws(() => proxy.raycast(v, v, distance), { message: '[raycast] maxDistance must be number' })
  }
  for (const [mask, expected] of [
    [undefined, 0],
    [null, 0],
    [0, 0],
    [-1, 4294967295],
    [-2147483648, 2147483648],
    [4294967295, 4294967295],
  ]) {
    proxy.raycast(v, v, 1, mask)
    assert.equal(calls.at(-1).args[3], expected)
    proxy.overlapSphere(1, v, mask)
    assert.equal(calls.at(-1).args[2], expected)
  }
  for (const mask of [NaN, Infinity, -Infinity, -2147483649, 4294967296, 0.5, '1', {}, new Number(1)]) {
    assert.throws(() => proxy.raycast(v, v, 1, mask), { message: '[raycast] layerMask must be number' })
    assert.throws(() => proxy.overlapSphere(1, v, mask), { message: '[overlapSphere] layerMask must be number' })
  }
  for (const radius of [0, -1, 1e-50, ...invalidComponents()]) {
    assert.throws(() => proxy.overlapSphere(radius, v), { message: '[overlapSphere] radius must be a positive number' })
  }
  for (const radius of [1e-45, 1, 3e38]) assert.ok(proxy.overlapSphere(radius, v))
  assert.throws(() => proxy.raycast(spoof(), v), { message: '[raycast] origin must be Vector3' })
  assert.throws(() => proxy.raycast(v, spoof()), { message: '[raycast] direction must be Vector3' })
  assert.throws(() => proxy.overlapSphere(1, spoof()), { message: '[overlapSphere] origin must be Vector3' })
  for (const bad of invalidComponents()) {
    calls.length = 0
    const invalid = new Vector3(bad, 0, 0)
    assert.equal(proxy.raycast(invalid, v), null)
    assert.equal(proxy.raycast(v, invalid), null)
    assert.deepEqual(proxy.overlapSphere(1, invalid), [])
    assert.equal(calls.length, 0)
  }
})

function playerProxy(kind) {
  const local = kind === 'local'
  const network = {
    id: 'local',
    isClient: kind !== 'server',
    isServer: kind === 'server',
    enqueue: native('enqueue'),
    sendTo: native('sendTo'),
    asScript: fn => fn(),
  }
  const player = { world: { network }, data: { owner: local ? 'local' : 'remote' }, push: native('push') }
  return createPlayerProxy({}, player)
}
for (const kind of ['local', 'server']) {
  test(`createPlayerProxy ${kind}: finite numeric payloads, rotation compatibility and no local push cap`, () => {
    const proxy = playerProxy(kind)
    for (const v of vectors()) {
      for (const rotation of [undefined, NaN, Infinity, new Quaternion(), 1, 1e300]) {
        proxy.teleport(v, rotation)
        const payload = calls.at(-1).args.at(-1)
        assert.deepEqual(payload.position, [1, 2, 3])
        assert.equal('rotationY' in payload, Number.isFinite(rotation))
        if (Number.isFinite(rotation)) assert.equal(payload.rotationY, rotation)
      }
      proxy.push(v)
      const result = calls.at(-1).args.at(-1)
      assert.deepEqual(kind === 'local' ? Object.values(result) : result.force, [1, 2, 3])
    }
    for (const method of ['teleport', 'push']) {
      assert.throws(() => proxy[method](spoof()), {
        message: `[player] ${method} ${method === 'teleport' ? 'position' : 'force'} must be Vector3`,
      })
      for (const bad of invalidComponents()) {
        calls.length = 0
        proxy[method](new Vector3(0, bad, 0))
        assert.equal(calls.length, 0)
      }
    }
    proxy.push(new Vector3(10001, 0, 0))
    const payload = calls.at(-1).args.at(-1)
    assert.equal(kind === 'local' ? payload[0] : payload.force[0], 10001)
  })
}

test('createPlayerProxy remote-on-client keeps its early warning branch', t => {
  const errors = []
  t.mock.method(console, 'error', value => errors.push(value))
  const proxy = playerProxy('remote')
  for (let i = 0; i < 2; i++) {
    proxy.teleport(spoof())
    proxy.push(spoof())
  }
  assert.equal(calls.length, 0)
  assert.deepEqual(errors, [
    '[player] teleport on a remote player must be called on the server',
    '[player] push on a remote player must be called on the server',
  ])
})

test('PlayerLocal.teleport validates before pose reads, snap, visuals, camera or sends; valid inputs recover', () => {
  const pose = new PxTransform()
  const player = Object.assign(Object.create(PlayerLocal.prototype), {
    controller: {
      position: new Vector3(),
      teleport(position) {
        this.position.copy(position)
        calls.push({ name: 'teleport' })
      },
    },
    velocity: new Vector3(),
    platform: {},
    capsule: { getGlobalPose: native('getGlobalPose', pose) },
    capsuleHandle: { snap: native('snap') },
    base: new Object3D(),
    cam: new Object3D(),
    control: { camera: new Object3D() },
    camHeight: 1.2,
    world: { network: { send: native('send') } },
    data: { id: 'p' },
  })
  for (const bad of invalidComponents()) {
    for (const position of [[1, bad, 3], new Vector3(1, bad, 3), new StockVector3(1, bad, 3)]) {
      player.teleport({ position, rotationY: 1 })
      assert.equal(calls.length, 0)
      assert.deepEqual(xyz(player.base.position), [0, 0, 0])
      assert.deepEqual(xyzw(player.base.quaternion), [0, 0, 0, 1])
      assert.deepEqual(xyz(player.cam.position), [0, 0, 0])
      assert.deepEqual(xyz(player.control.camera.position), [0, 0, 0])
      assert.deepEqual(xyz(pose.p), [0, 0, 0])
    }
  }
  for (const position of [[1, 2, 3], ...vectors()]) {
    calls.length = 0
    player.teleport({ position, rotationY: new Quaternion() })
    assert.deepEqual(
      calls.map(call => call.name),
      ['teleport', 'send']
    )
    assert.deepEqual(xyz(player.controller.position), [1, 2, 3])
    assert.deepEqual(xyz(player.base.position), [1, 2, 3])
    assert.equal(player.base.rotation.y, 0)
    assert.deepEqual(xyz(player.cam.position), [1, 3.2, 3])
  }
  player.teleport({ position: [4, 5, 6], rotationY: 0.5 })
  assert.equal(player.base.rotation.y, 0.5)
  assert.equal(player.cam.rotation.y, 0.5)
})

function expectIntrinsic(fn) {
  injected = new FakeRuntimeError('injected native failure')
  try {
    assert.throws(fn, err => {
      assert.notEqual(err, injected)
      assert.equal(Object.getPrototypeOf(err), Error.prototype)
      assert.equal(err.message, injected.message)
      return true
    })
  } finally {
    injected = null
  }
}
for (const name of [...Object.keys(mutators), 'setQuaternion', ...vectorGetters, 'getQuaternion', 'sleeping']) {
  test(`N5 RigidBody.${name}: non-intrinsic native errors are replaced`, () => {
    const node = body()
    const proxy = node.getProxy()
    if (name === 'setCenterOfMass') {
      // This member only schedules a rebuild; inject at that host boundary.
      node.setDirty = native('setDirty')
    }
    const args = mutators[name]?.(new Vector3()) || (name === 'setQuaternion' ? [new Quaternion()] : getterArgs(name))
    expectIntrinsic(() => (name === 'sleeping' ? proxy.sleeping : proxy[name](...args)))
  })
}
for (const name of ['teleport', 'move', 'isGrounded', 'isCeiling']) {
  test(`N5 Controller.${name}: native methods and flag getters are guarded`, () => {
    const node = controller()
    node.moveFlags = { isSet: native('isSet') }
    const proxy = node.getProxy()
    expectIntrinsic(() => (name.startsWith('is') ? proxy[name] : proxy[name](new Vector3())))
  })
}
for (const name of ['active', 'add', 'remove', 'clone', 'clean']) {
  test(`N5 Node.${name}: inherited lifecycle reaches a throwing native and keeps errors intrinsic`, () => {
    const root = new Node()
    root.ctx = { world: { stage: { dirtyNodes: new Set() } } }
    const child = body()
    root.add(child)
    root.mounted = true
    child.mounted = true
    child.ctx = root.ctx
    const proxy = root.getProxy()
    if (name === 'add') {
      root.remove(child)
      child.mount = () => {
        new PHYSX.PxTransform()
      }
    }
    if (name === 'clean') {
      root.isDirty = true
      child.needsRebuild = false
      child.actorHandle = { move: native('move') }
    }
    if (name === 'clone')
      child.constructor = class extends RigidBody {
        constructor() {
          super()
          new PHYSX.PxTransform()
        }
      }
    expectIntrinsic(() => {
      if (name === 'active') proxy.active = false
      else if (name === 'add' || name === 'remove') proxy[name](child.getProxy())
      else if (name === 'clone') proxy.clone(true)
      else proxy.clean()
    })
  })
}

test('Node add/remove keep proxy chaining and registered reference getters', () => {
  const root = new Node().getProxy()
  const child = new Node().getProxy()
  assert.equal(root.add(child), root)
  assert.equal(root.remove(child), root)
  assert.equal(root._ref, null)
  assert.equal(root._isRef, true)
})

test('Apps query failures still pass through createEntityProxy error normalization', () => {
  const proxy = queries()
  const v = new Vector3()
  expectIntrinsic(() => proxy.raycast(v, v))
  expectIntrinsic(() => proxy.overlapSphere(1, v))
})

test('non-finite warnings are emitted once per operation across instances and calls', () => {
  assert.equal(warnings.length, 18)
  assert.equal(new Set(warnings).size, warnings.length)
  const before = warnings.length
  body()
    .getProxy()
    .addForce(new Vector3(NaN, 0, 0))
  controller()
    .getProxy()
    .teleport(new Vector3(NaN, 0, 0))
  queries().raycast(new Vector3(NaN, 0, 0), new Vector3())
  playerProxy('local').push(new Vector3(NaN, 0, 0))
  assert.equal(warnings.length, before)
})
