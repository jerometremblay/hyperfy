import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
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
    export { Controller } from './src/core/nodes/Controller.js';
    export { Group } from './src/core/nodes/Group.js';
    export { Avatar } from './src/core/nodes/Avatar.js';
    export { simpleCamLerp } from './src/core/extras/simpleCamLerp.js';
  `, resolveDir: process.cwd() },
  bundle: true, platform: 'node', format: 'esm', packages: 'external',
  plugins: process.env.MOTION_PLAYER_SOURCE ? [{
    name: 'camera-baseline',
    setup(build) {
      build.onLoad({ filter: /\/entities\/PlayerLocal\.js$/ }, async args => ({
        contents: await fs.readFile(process.env.MOTION_PLAYER_SOURCE, 'utf8'),
        loader: 'js', resolveDir: path.dirname(args.path),
      }))
    },
  }] : [],
  outfile: path.join(directory, 'engine.mjs'),
})
await fs.copyFile('src/core/physx-js-webidl.wasm', path.join(directory, 'physx-js-webidl.wasm'))
const { THREE, Apps, Entities, Blueprints, Scripts, Physics, RigidBody, Collider, PlayerLocal, Controller, Group, Avatar, simpleCamLerp } =
  await import(path.join(directory, 'engine.mjs'))
const sources = Object.fromEntries(await Promise.all(['desk', 'chair'].map(async key =>
  [key, await fs.readFile(key === 'chair' && process.env.MOTION_CHAIR_SOURCE || `outputs/upper-office/${key}.js`, 'utf8')])))
const worlds = []
const checks = []
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
    time: 0, fatalError: null, fatal(reason) { throw new Error(reason) },
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
      get(id) { return this.values.get(id)?.matrix },
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
  w.stage.clean = () => clean(w)
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
    const base = new Group()
    base.position.set(0, 0, -0.8)
    const p = {
      world: w, isPlayer: true, data: { id, owner: id }, base, destroyed: false,
      setEffect(effect, onEnd) { PlayerLocal.prototype.setEffect.call(this, effect, onEnd) },
      applySeatPose() {}, modify(data) { Object.assign(this.data, data) },
    }
    w.entities.items.set(id, p)
    w.entities.players.set(id, p)
    if (id === w.network.id) w.entities.player = p
    base.activate({ world: w, entity: p })
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

export { world, clean, flush, hotCallbacks, events, claim, THREE, PlayerLocal, Controller, Group, Avatar, simpleCamLerp }
export async function destroyWorlds() {
  for (const w of worlds) {
    for (const e of w.entities.items.values()) if (e.isApp) e.unbuild()
    for (const body of w.bodies) body.deactivate()
  }
  await fs.rm(directory, { recursive: true, force: true })
}
