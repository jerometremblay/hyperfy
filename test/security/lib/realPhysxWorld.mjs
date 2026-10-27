// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/lib/realPhysxWorld.mjs
import assert from 'node:assert/strict'
import { physxHeap } from './physxHeap.mjs'

export async function makeWorld(B) {
  const world = {
    network: { id: 'local', isClient: false, isServer: true },
    loader: null,
    stage: {
      octree: { insert() {}, remove() {}, move() {} },
      scene: { add() {}, remove() {} },
      dirtyNodes: new Set(),
      insertLinked: () => ({ move() {}, destroy() {} }),
      clean() {},
    },
    graphics: { scene: { add() {}, remove() {} } },
    setHot() {},
    events: { off() {} },
    apps: {},
    blueprints: { get: () => ({ id: 'bp', version: 0, model: 'cached.glb', scene: true }), authors: new Map() },
  }
  const callbacks = {}
  for (const [key, name] of [
    ['simulation', 'PxSimulationEventCallbackImpl'],
    ['query', 'PxQueryFilterCallbackImpl'],
    ['cct', 'PxControllerFilterCallbackImpl'],
  ]) {
    callbacks[key] = { name }
  }
  await B.loadPhysX()
  for (const [key, { name }] of Object.entries(callbacks)) {
    const Original = globalThis.PHYSX[name]
    globalThis.PHYSX[name] = new Proxy(Original, {
      construct(target, args) {
        const callback = Reflect.construct(target, args)
        callbacks[key] = callback
        return callback
      },
    })
  }
  const physics = new B.Physics(world)
  await physics.init()
  world.physics = physics
  const PHYSX = globalThis.PHYSX
  const gravity = new PHYSX.PxVec3(0, 0, 0)
  physics.scene.setGravity(gravity)
  PHYSX.destroy(gravity)
  const entity = { isApp: true, data: { id: 'app' }, deadHook: { dead: false } }
  const root = new B.Node()
  root.activate({ world, entity, moving: false })
  const step = (count = 1) => {
    for (let i = 0; i < count; i++) physics.postFixedUpdate(1 / 60)
  }
  const actorOf = node => node.actor || node.controller.getActor()
  const handleOf = node => physics.handles.get(actorOf(node).ptr)
  const body = (kind = 'RigidBody', options = {}, parent = root) => {
    const { trigger = false, ...data } = options
    let node
    if (kind === 'RigidBody') {
      node = new B.RigidBody({ type: 'dynamic', ...data })
      node.add(new B.Collider({ type: 'box', width: 2, height: 2, depth: 2, trigger }))
    } else if (kind === 'Prim') {
      node = new B.Prim({ type: 'box', size: [2, 2, 2], physics: 'dynamic', opacity: 0, trigger, ...data })
    } else {
      node = new B.Controller({ radius: 0.4, height: 1, ...data })
    }
    parent.add(node)
    assert.ok(actorOf(node)?.ptr, `${kind} mounted a real actor`)
    return node
  }
  const move = (node, x, y = 0, z = 0) => {
    if (node.controller) {
      node.teleport(new B.THREE.Vector3(x, y, z))
    } else {
      const pose = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
      const p = pose.p
      p.x = x
      p.y = y
      p.z = z
      node.actor.setGlobalPose(pose)
      PHYSX.destroy(pose)
      if (node.actor.setLinearVelocity) {
        const zero = new PHYSX.PxVec3(0, 0, 0)
        node.actor.setLinearVelocity(zero)
        node.actor.setAngularVelocity(zero)
        PHYSX.destroy(zero)
      }
    }
  }
  const healthy = () => {
    const sentinel = body('RigidBody', { position: [100, 0, 0] })
    const velocity = new PHYSX.PxVec3(1, 0, 0)
    sentinel.actor.setLinearVelocity(velocity)
    PHYSX.destroy(velocity)
    step(3)
    const p = sentinel.actor.getGlobalPose().p
    assert.ok(Number.isFinite(p.x) && p.x > 100, 'unrelated body still simulates')
    root.remove(sentinel)
  }
  let counter = null
  const liveChunks = () => (counter ??= physxHeap(PHYSX))()
  return { B, PHYSX, world, physics, entity, root, step, body, move, handleOf, actorOf, healthy, callbacks, liveChunks }
}
