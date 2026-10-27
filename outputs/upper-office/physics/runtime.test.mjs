import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'
import EventEmitter from 'eventemitter3'
import 'ses'

const directory = await fs.mkdtemp(path.resolve('outputs/upper-office/physics/.engine-'))
await build({
  stdin: { contents: `
    export * as THREE from './src/core/extras/three.js';
    export { Apps } from './src/core/systems/Apps.js';
    export { Entities } from './src/core/systems/Entities.js';
    export { Blueprints } from './src/core/systems/Blueprints.js';
    export { Scripts } from './src/core/systems/Scripts.js';
    export { Physics } from './src/core/systems/Physics.js';
    export { Prim } from './src/core/nodes/Prim.js';
    export { RigidBody } from './src/core/nodes/RigidBody.js';
    export { Collider } from './src/core/nodes/Collider.js';
    export { PlayerLocal } from './src/core/entities/PlayerLocal.js';
  `, resolveDir: process.cwd() },
  bundle: true, platform: 'node', format: 'esm', packages: 'external',
  outfile: path.join(directory, 'engine.mjs'),
})
await fs.copyFile('src/core/physx-js-webidl.wasm', path.join(directory, 'physx-js-webidl.wasm'))
const { THREE, Apps, Entities, Blueprints, Scripts, Physics, RigidBody, Collider, PlayerLocal } =
  await import(path.join(directory, 'engine.mjs'))
const sources = Object.fromEntries(await Promise.all(['desk', 'chair'].map(async key =>
  [key, await fs.readFile(`outputs/upper-office/${key}.js`, 'utf8')])))
const worlds = []
const checks = []
test.after(async () => {
  for (const w of worlds) {
    for (const e of w.entities.items.values()) if (e.isApp) e.unbuild()
    for (const body of w.bodies) body.deactivate()
  }
  await fs.rm(directory, { recursive: true, force: true })
  await fs.writeFile('outputs/upper-office/physics/validation.json', JSON.stringify({
    valid: checks.length === 6, actualScriptSandbox: true, actualPhysXWasm: true,
    checks,
    scripts: Object.fromEntries(Object.entries(sources).map(([key, source]) =>
      [key, 'asset://' + createHash('sha256').update(source).digest('hex') + '.js'])),
  }, null, 2))
})
function clean(w) {
  for (let i = 0; w.stage.dirtyNodes.size && i < 8; i++) {
    const nodes = [...w.stage.dirtyNodes]
    w.stage.dirtyNodes.clear()
    for (const node of nodes) node.clean()
  }
}
async function flush(w) {
  clean(w)
  await new Promise(resolve => setTimeout(resolve, 4))
  clean(w)
}
async function world({ client = false, id = 'p1' } = {}) {
  const messages = [], controls = []
  const w = {
    networkRate: 1 / 8, isPreview: false,
    events: new EventEmitter(), networkMessages: messages, bodies: [], controlsMade: controls,
    stage: {
      dirtyNodes: new Set(), scene: new THREE.Scene(),
      octree: { insert() {}, remove() {}, move() {} },
      insertLinked() { return { setColor() {}, setEmissive() {}, setEmissiveIntensity() {}, move() {}, destroy() {} } },
    },
    anchors: {
      values: new Map(),
      add(id, matrix, profile) { this.values.set(id, { matrix, profile }) },
      remove(id) { this.values.delete(id) },
    },
    actions: { register() {}, unregister() {} },
    graphics: { portals: new Set() }, setHot() {}, emit() {},
    settings: { deserialize() {}, setHasAdminCode() {}, on() {} },
    controls: {
      bind(options) {
        const c = { release() { if (c.released) return; c.released = true; options.onRelease?.() }, setActions(actions) { c.actions = actions } }
        for (const key of ['keyW', 'keyA', 'keyS', 'keyD', 'arrowUp', 'arrowDown', 'arrowLeft', 'arrowRight', 'space', 'keyQ', 'keyE'])
          c[key] = { down: false, capture: false }
        controls.push(c)
        return c
      },
    },
    network: {
      id: client ? id : 'server', isServer: !client, isClient: client,
      dirtyApps: new Set(), dirtyBlueprints: new Set(),
      send(...args) { messages.push({ type: 'send', args: structuredClone(args) }) },
      sendTo(id, ...args) { messages.push({ type: 'to', id, args: structuredClone(args) }) },
      asScript(fn) { return fn() },
      getTime() { return 0 },
      enqueue(name, data) {
        messages.push({ type: 'enqueue', args: [name, structuredClone(data)] })
        if (name === 'onPlayerTeleport') w.entities.player.base.position.fromArray(data.position)
      },
    },
  }
  w.apps = new Apps(w)
  w.entities = new Entities(w)
  w.blueprints = new Blueprints(w)
  w.physics = new Physics(w)
  await w.physics.init()
  w.scripts = new Scripts(w)
  const executables = new Map(Object.entries(sources).map(([key, source]) => [key, w.scripts.evaluate(source)]))
  w.loader = { get(kind, url) { return kind === 'script' ? executables.get(url) : null } }
  w.addFurniture = (key, position = [0, 0.002, 0], quaternion = [0, 0, 0, 1], scale = [1, 1, 1], state = {}) => {
    const blueprint = { id: key + '-bp', version: 1, model: 'script-only', script: key, props: {} }
    w.blueprints.add(blueprint)
    const app = w.entities.add({ id: key, type: 'app', blueprint: blueprint.id, position, quaternion, scale, state })
    assert.equal(app.scriptError, null, JSON.stringify(app.scriptError))
    return app
  }
  w.addPlayer = id => {
    const base = new THREE.Object3D()
    base.position.set(0, 0, -0.8)
    const p = {
      world: w, isPlayer: true, data: { id, owner: id }, base, destroyed: false,
      setEffect(effect, onEnd) { PlayerLocal.prototype.setEffect.call(this, effect, onEnd) },
      applySeatPose() {}, modify(data) { Object.assign(this.data, data) },
    }
    w.entities.items.set(id, p)
    w.entities.players.set(id, p)
    if (id === w.network.id) w.entities.player = p
    return p
  }
  w.box = (size, position, layer = 'environment') => {
    const body = new RigidBody({ type: 'static', position })
    body.add(new Collider({ type: 'box', width: size[0], height: size[1], depth: size[2], layer }))
    body.activate({ world: w })
    w.bodies.push(body)
    return body
  }
  w.box([100, 0.2, 100], [0, -0.1, 0])
  worlds.push(w)
  return w
}
function hotCallbacks(app) {
  return ['update', 'fixedUpdate', 'lateUpdate'].reduce((sum, key) => sum + (app.listeners[key]?.size || 0), 0)
}
function events(w, name, playerId) {
  return w.networkMessages.filter(m => m.args[0] === 'entityEvent' && m.args[1][2] === name &&
    (playerId === undefined || m.id === playerId))
}
function claim(w, app, id = 'p1', request = 1) {
  app.emit('seat-claim', { request }, id)
  const reply = events(w, 'seat-reply', id).at(-1).args[1][3]
  assert.equal(reply.accepted, true)
  return reply.token
}
test('native collision shells, root transforms, floor snapping and idle behavior', async () => {
  const w = await world()
  const desk = w.addFurniture('desk')
  const chair = w.addFurniture('chair', [5, 0.002, 0])
  await flush(w)
  assert.equal(hotCallbacks(desk), 0)
  assert.equal(hotCallbacks(chair), 0)
  assert.equal(chair.worldNodes.size, 0)
  const down = new THREE.Vector3(0, -1, 0)
  const propMask = desk.getWorldProxy().createLayerMask('environment')
  const ray = (x, z) => w.physics.raycast(new THREE.Vector3(x, 2, z), down, 3, propMask)
  const bayHit = ray(0, -0.65)
  assert(bayHit && Math.abs(bayHit.point.y) < .0001, 'U bay must remain open down to the floor')
  for (const [x, z] of [[0, .8], [-1.75, -.6], [1.75, -.6]]) assert(ray(x, z), 'Desk collision slab missing')
  assert.equal([...desk.root.children].filter(n => n._physics).length, 8)
  assert.equal([...chair.root.children, ...chair.root.get('chair-back').children].filter(n => n._physics).length, 5)
  desk.modify({ mover: 'builder' })
  desk.root.position.set(4, 0.30, -5)
  desk.root.quaternion.setFromEuler(new THREE.Euler(.17, .7, -.12, 'YXZ'))
  desk.root.scale.set(1.3, 0.9, 1.1)
  clean(w)
  assert.equal(hotCallbacks(desk), 1)
  desk.modify({ mover: null })
  desk.update(1 / 60)
  await flush(w)
  assert(Math.abs(desk.root.position.y - 0.002) < 1e-5)
  assert(Math.abs(desk.root.rotation.x) < 1e-6 && Math.abs(desk.root.rotation.z) < 1e-6)
  assert.equal(hotCallbacks(desk), 0)
  // Raycast a transformed return through the actual PhysX collision geometry.
  const sample = new THREE.Vector3(-1.725, 2, -.35).multiply(desk.root.scale)
    .applyQuaternion(desk.root.quaternion).add(desk.root.position)
  const hit = w.physics.raycast(sample, down, 3, propMask)
  assert(hit)
  assert(Math.abs(hit.point.y - (0.779 * .9 + .002)) < .00001)
  assert.deepEqual(desk.data.position, desk.root.position.toArray(), 'Grounded placement must be persisted')
  checks.push('native collision shells, nonuniform scale, floor snapping and zero idle callbacks')
})
test('authoritative occupancy, real CCT rolling, collision, persistence and disconnect', async () => {
  const w = await world()
  w.addPlayer('p1'); w.addPlayer('p2')
  const chair = w.addFurniture('chair')
  await flush(w)
  const token = claim(w, chair)
  chair.emit('seat-claim', { request: 2 }, 'p2')
  assert.equal(events(w, 'seat-reply', 'p2').at(-1).args[1][3].accepted, false)
  await flush(w)
  assert.equal(chair.worldNodes.size, 1)
  const start = chair.root.position.clone()
  const send = (x, z) => chair.emit('chair-input', { token, x, z }, 'p1')
  const step = (count, x = 0, z = 0) => {
    for (let i = 0; i < count; i++) {
      if (i % 5 === 0) send(x, z)
      chair.fixedUpdate(1 / 60)
      clean(w)
    }
  }
  chair.emit('chair-input', { token, x: 1, z: 0 }, 'p2')
  step(120, 0, -1)
  assert(chair.root.position.z < start.z - 2.0, `Chair failed to roll: ${chair.root.position.toArray()}`)
  assert(Math.abs(chair.root.position.y) < .008, `Chair lost floor contact: ${chair.root.position.y}`)
  const anchor = w.anchors.values.get('chair:executive-seat').matrix
  const anchorPosition = new THREE.Vector3().setFromMatrixPosition(anchor)
  assert(Math.abs(anchorPosition.z - (chair.root.position.z - .025)) < 1e-5, 'Seated anchor must move with chair')
  assert(!w.networkMessages.some(m => m.args[0] === 'entityModified'), 'A ride must not rebuild remote apps every frame')
  // A physical wall stops the same controller used by the actual app source.
  w.box([6, 2.5, .2], [0, 1.25, -3.5])
  step(180, 0, -1)
  const blocker = [...chair.worldNodes][0]
  assert(blocker.position.z - blocker.radius > -3.401,
    `Rear-half blocker passed through wall: ${blocker.position.z}`)
  step(2, 0, 0)
  assert.equal(hotCallbacks(chair), 0, 'Stationary seated chair must have no idle loop')
  const finalPosition = chair.root.position.clone()
  chair.emit('seat-release', { token: 'wrong' }, 'p1')
  assert.equal(chair.data.state.slot.owner, 'p1')
  chair.emit('seat-release', { token }, 'p1')
  await flush(w)
  assert.equal(chair.data.state.slot.owner, null)
  assert.equal(chair.worldNodes.size, 0)
  assert.equal(hotCallbacks(chair), 0)
  assert.deepEqual(chair.data.position, finalPosition.toArray(), 'Rolled position must survive reload')
  assert(events(w, 'seat-ended', 'p1').at(-1).args[1][3].exit, 'Standing exit must have clear support')
  w.entities.players.get('p1').base.position.copy(chair.root.position)
  const secondToken = claim(w, chair, 'p1', 3)
  await flush(w)
  w.events.emit('leave', { playerId: 'p1' })
  assert.equal(chair.data.state.slot.owner, null)
  assert.equal(chair.worldNodes.size, 0)
  assert.notEqual(token, secondToken)
  checks.push('exclusive occupancy, CCT rolling and wall collision, saved final position, disconnect cleanup')
})
test('native sitting effect, captured roll controls, stand, replacement and late join', async () => {
  const w = await world({ client: true })
  const player = w.addPlayer('p1')
  const chair = w.addFurniture('chair')
  await flush(w)
  const action = chair.root.get('executive-seat-action')
  action.onTrigger()
  const request = events(w, 'seat-claim').at(-1).args[1][3].request
  chair.emit('seat-slot', { owner: 'p1', token: 'seat-one' })
  chair.emit('seat-reply', { request, accepted: true, owner: 'p1', token: 'seat-one' })
  await flush(w)
  assert.equal(player.data.effect.anchorId, 'chair:executive-seat')
  assert.equal(player.data.effect.snare, 1)
  assert(!player.data.effect.cancellable, 'Movement must roll instead of cancelling the seat')
  assert.equal(action.active, false)
  const control = w.controlsMade.at(-1)
  assert(control.keyW.capture && control.keyE.capture && control.space.capture)
  control.keyW.down = true
  control.keyW.onPress()
  assert.equal(events(w, 'chair-input').at(-1).args[1][3].z, -1)
  assert.equal(hotCallbacks(chair), 2)
  const predictedStart = chair.root.position.z
  chair.update(1 / 60)
  clean(w)
  assert(chair.root.position.z < predictedStart - .01, 'The seated rider must move before a server reply')
  chair.emit('chair-pose', { token: 'seat-one', sequence: 1, position: [0, .002, -2], quaternion: [0, 0, 0, 1],
    casters: Array.from({ length: 5 }, () => [.5, -1.25, .75]) })
  clean(w)
  assert(Math.abs(chair.root.get('caster-0-swivel').rotation.y - .5) < 1e-8)
  assert(Math.abs(chair.root.get('caster-0-wheel--1').rotation.x + 1.25) < 1e-8)
  assert(Math.abs(chair.root.get('caster-0-wheel-1').rotation.x - .75) < 1e-8)
  assert(Math.abs(w.anchors.values.get('chair:executive-seat').matrix.elements[14] + 2.025) < 1e-5)
  control.keyW.down = false
  control.keyW.onRelease()
  chair.update(1 / 60)
  clean(w)
  assert.equal(hotCallbacks(chair), 0)
  control.space.onPress()
  assert.equal(events(w, 'seat-release').at(-1).args[1][3].token, 'seat-one')
  chair.emit('seat-ended', { token: 'seat-one', exit: [0, .01, -.95] })
  chair.emit('seat-slot', { owner: null, token: null })
  assert.equal(player.data.effect, null)
  assert(control.released)
  assert.equal(action.active, true)
  assert.deepEqual(player.base.position.toArray(), [0, .01, -.95])
  action.onTrigger()
  const secondRequest = events(w, 'seat-claim').at(-1).args[1][3].request
  chair.emit('seat-slot', { owner: 'p1', token: 'seat-two' })
  chair.emit('seat-reply', { request: secondRequest, accepted: true, token: 'seat-two' })
  player.setEffect({ snare: .5 })
  assert.equal(events(w, 'seat-release').at(-1).args[1][3].token, 'seat-two')
  assert.equal(player.data.effect.snare, .5, 'Old seat cleanup must not cancel its replacement')
  assert.equal(hotCallbacks(chair), 0)
  chair.emit('seat-slot', { owner: null, token: null })
  assert.equal(action.active, true)
  const late = await world({ client: true, id: 'p2' })
  late.addPlayer('p2')
  const remote = late.addFurniture('chair', [0, .002, 0], [0, 0, 0, 1], [1, 1, 1],
    { slot: { owner: 'p1', token: 'seat-late' }, pose: { position: [1, .002, -4], quaternion: [0, 0, 0, 1] } })
  await flush(late)
  assert.deepEqual(remote.root.position.toArray(), [1, .002, -4])
  assert.equal(remote.root.get('executive-seat-action').active, false)
  assert.equal(hotCallbacks(remote), 0)
  remote.emit('chair-pose', { token: 'seat-late', position: [1, .002, -5], quaternion: [0, 0, 0, 1],
    casters: Array.from({ length: 5 }, () => [.5, -1.25, .75]) })
  remote.update(1 / 30)
  clean(late)
  assert(Math.abs(remote.root.get('caster-0-swivel').rotation.y - (Math.PI + .5) / 2) < 1e-8)
  assert(Math.abs(remote.root.get('caster-0-wheel--1').rotation.x + .625) < 1e-8)
  assert(Math.abs(remote.root.get('caster-0-wheel-1').rotation.x - .375) < 1e-8)
  remote.update(1 / 30)
  clean(late)
  assert.equal(remote.root.position.z, -5)
  assert.equal(hotCallbacks(remote), 0)
  checks.push('native seated effect, roll controls, standing exit, effect replacement and late-joining clients')
})
test('rolling respects the U desk and builder movement ends the ride safely', async () => {
  const w = await world()
  const player = w.addPlayer('p1')
  const desk = w.addFurniture('desk')
  // The front can tuck underneath; the rear-half rolling blocker stops
  // against the physical desktop.
  const chair = w.addFurniture('chair', [.075, .002, .006], [0, 1, 0, 0])
  player.base.position.copy(chair.root.position)
  await flush(w)
  const token = claim(w, chair)
  await flush(w)
  for (let i = 0; i < 180; i++) {
    if (i % 5 === 0) chair.emit('chair-input', { token, x: 0, z: -1 }, 'p1')
    chair.fixedUpdate(1 / 60); clean(w)
  }
  assert(chair.root.position.z > .39 && chair.root.position.z < .45,
    `Chair should tuck halfway under the desktop: ${chair.root.position.toArray()}`)
  assert(Math.abs(chair.root.position.y) < .01, `Chair lost floor contact at the desktop: ${chair.root.position.toArray()}`)
  chair.modify({ mover: 'builder' })
  chair.root.position.set(2.5, .45, -2)
  clean(w)
  assert.equal(chair.data.state.slot.owner, null)
  assert.equal(chair.worldNodes.size, 0)
  assert.equal(events(w, 'seat-ended', 'p1').at(-1).args[1][3].token, token)
  chair.modify({ mover: null })
  chair.update(1 / 60)
  await flush(w)
  assert(Math.abs(chair.root.position.y - .002) < .0001)
  assert.deepEqual(chair.root.position.toArray(), [2.5, .002, -2])
  assert.equal(hotCallbacks(chair), 0)
  assert.equal(hotCallbacks(desk), 0)
  checks.push('rolling collides with the U desk; builder movement releases the seat and grounds the chair')
})
test('claim validation and destruction release the native controller', async () => {
  const w = await world()
  w.addPlayer('p1')
  const chair = w.addFurniture('chair')
  await flush(w)
  chair.emit('seat-claim', null, 'p1')
  assert.equal(events(w, 'seat-reply', 'p1').at(-1).args[1][3].accepted, false)
  assert.equal(chair.scriptError, null)
  claim(w, chair)
  await flush(w)
  assert.equal(chair.worldNodes.size, 1)
  chair.unbuild()
  assert.equal(chair.worldNodes.size, 0)
  assert.equal(w.anchors.values.size, 0)
  assert.equal(w.events.listenerCount('leave'), 0)
  assert.equal(chair.scriptError, null)
  checks.push('invalid claims rejected; destruction removes the controller, anchor and leave listener')
})
test('actual WASD travel steers and spins casters; blocked input leaves them stationary', async () => {
  const w = await world()
  w.addPlayer('p1')
  const chair = w.addFurniture('chair')
  await flush(w)
  const token = claim(w, chair)
  await flush(w)
  const move = (x, z, frames) => {
    for (let i = 0; i < frames; i++) {
      if (i % 5 === 0) chair.emit('chair-input', { token, x, z }, 'p1')
      chair.fixedUpdate(1 / 60); clean(w)
    }
  }
  const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle))
  move(0, -1, 50)
  assert(chair.data.state.casters.every(state => Math.abs(wrap(state[0])) < .001), 'W must align all casters forward')
  move(1, 0, 50)
  assert(chair.data.state.casters.every(state => Math.abs(wrap(state[0] + Math.PI / 2)) < .001), 'D must align all casters right')
  move(-1, 0, 50)
  assert(chair.data.state.casters.every(state => Math.abs(wrap(state[0] - Math.PI / 2)) < .001), 'A must swing reversed casters around')
  move(0, 1, 50)
  assert(chair.data.state.casters.every(state => Math.abs(Math.abs(wrap(state[0])) - Math.PI) < .001), 'S must align all casters backward')
  w.box([6, 2.5, .2], [0, 1.25, 1])
  move(0, 1, 100)
  const stopped = structuredClone(chair.data.state.casters)
  move(0, 1, 100)
  assert.deepEqual(chair.data.state.casters, stopped, 'A collision must stop wheel rotation despite held input')
  for (let i = 0; i < 5; i++) {
    const swivel = chair.root.get(`caster-${i}-swivel`)
    const startingYaw = i * Math.PI * 2 / 5 + Math.PI
    assert(Math.abs(swivel.rotation.y - startingYaw) < 1e-6, 'Server computes numbers without animating decorative nodes')
  }
  checks.push('actual WASD travel aligns casters; reversals swing them around; blocked motion stops wheels; no server visual animation')
})
