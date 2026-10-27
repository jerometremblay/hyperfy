import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import * as THREE from 'three'
import { DartsGame, DEFAULT_AIM } from '../../outputs/darts/game.mjs'

await build({
  stdin: {
    contents: `
export { Prim } from './src/core/nodes/Prim.js'
export { Group } from './src/core/nodes/Group.js'
export { Action } from './src/core/nodes/Action.js'
export { UI } from './src/core/nodes/UI.js'
export { UIText } from './src/core/nodes/UIText.js'
export { Light } from './src/core/nodes/Light.js'
`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'outputs/darts/runtime-nodes.mjs',
})
const { Prim, Group, Action, UI, UIText, Light } = await import('../../outputs/darts/runtime-nodes.mjs')
const constructors = { prim: Prim, group: Group, action: Action, ui: UI, uitext: UIText, light: Light }
const source = await readFile('outputs/darts/darts.js', 'utf8')
function emitter(target = {}) {
  const handlers = new Map()
  target.on = (name, fn) => {
    if (!handlers.has(name)) handlers.set(name, new Set())
    handlers.get(name).add(fn)
  }
  target.off = (name, fn) => handlers.get(name)?.delete(fn)
  target.emit = (name, ...args) => {
    for (const fn of [...(handlers.get(name) || [])]) fn(...args)
  }
  target.handlers = handlers
  return target
}
function makeApp(camera = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom: 3 }) {
  const app = emitter({
    state: {},
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    scale: new THREE.Vector3(1, 1, 1),
    nodes: [],
    roots: [],
    commands: [],
    controls: [],
    configure() {},
  })
  app.add = node => app.roots.push(node)
  app.create = (kind, data) => {
    const node = new constructors[kind](data)
    node.activate = node.deactivate = () => {}
    app.nodes.push(node)
    return node.getProxy()
  }
  app.control = () => {
    const control = {
      released: false,
      pointer: {
        delta: { x: 0, y: 0 },
        lock() {
          this.locked = true
        },
      },
      camera: {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
        zoom: camera.zoom,
        write: false,
      },
      scrollDelta: { value: 0 },
      release() {
        this.released = true
      },
    }
    for (const key of [
      'keyW',
      'keyA',
      'keyS',
      'keyD',
      'keyQ',
      'keyZ',
      'arrowRight',
      'arrowLeft',
      'arrowUp',
      'arrowDown',
      'space',
      'keyM',
      'keyR',
      'keyX',
      'escape',
    ])
      control[key] = { down: false }
    app.controls.push(control)
    return control
  }
  app.send = (name, data) => app.commands.push({ name, data })
  return app
}
const execute = (app, world) =>
  vm.runInNewContext(source, { app, world, props: {}, Vector3: THREE.Vector3, Quaternion: THREE.Quaternion, console })

test('exact packaged script constructs all geometry with real Hyperfy node setters and no physics/idle callbacks', () => {
  const app = makeApp()
  execute(app, { isClient: true, isPreview: true })
  assert.ok(app.nodes.filter(n => n instanceof Prim).length > 60)
  assert.equal(app.handlers.get('update')?.size || 0, 0)
  assert.equal(app.nodes.filter(n => n instanceof Prim && n.physics !== null).length, 0)
  const face = app.nodes.find(n => n instanceof Prim && n.type === 'plane')
  closeVec(new THREE.Vector3(0, 0, 1).applyQuaternion(face.quaternion), [0, 0, 1])
  closeVec(face.position, [0, 1.73, 0.0005])
  assert.equal(app.nodes.filter(n => n instanceof UIText).length, 13)
  assert.equal(app.nodes.filter(n => n instanceof Light).length, 1)
})
function closeVec(vector, values) {
  assert.ok(vector.distanceTo(new THREE.Vector3(...values)) < 1e-8)
}

test('real-node client preserves vanilla camera, movement and zoom, follows the player and cleans up', () => {
  const g = new DartsGame()
  g.join('p0', 'Test')
  g.start('p0')
  const camera = {
    position: new THREE.Vector3(12.37, 1.6, 7),
    quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
    zoom: 3,
  }
  const app = makeApp(camera)
  app.position.set(10, 0, 4)
  app.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
  app.state.darts = g.snapshot()
  const effects = []
  const me = {
    id: 'p0',
    position: new THREE.Vector3(12.37, 0, 4),
    applyEffect(options) {
      const effect = {
        options,
        cancelled: false,
        cancel() {
          this.cancelled = true
        },
      }
      effects.push(effect)
      return effect
    },
    getBoneTransform: () => new THREE.Matrix4().makeTranslation(18.2, 1.5, 4.7),
  }
  const world = emitter({ isClient: true, getPlayer: () => me })
  execute(app, world)
  assert.equal(app.handlers.get('update')?.size || 0, 0)
  assert.equal(app.commands.at(-1).data.type, 'sync')
  const action = app.nodes.find(n => n instanceof Action)
  assert.equal(action.distance, Infinity)
  action.onTrigger()
  const control = app.controls.at(-1)
  for (const key of ['keyW', 'keyA', 'keyS', 'keyD']) assert.notEqual(control[key].capture, true)
  assert.notEqual(control.scrollDelta.capture, true)
  assert.equal(control.keyQ.capture, true)
  assert.equal(control.pointer.locked, undefined)
  assert.equal(control.camera.write, false)
  app.emit('update', 0.016)
  closeVec(control.camera.position, camera.position.toArray())
  assert.equal(control.camera.zoom, 3)
  assert.ok(control.camera.quaternion.equals(camera.quaternion))
  me.position.set(18, 0, 5) // Eight metres out, one metre to the side in this rotated app.
  control.camera.zoom = 6
  control.arrowRight.down = true
  app.emit('update', 0.05)
  control.space.onPress()
  const request = app.commands.at(-1).data
  assert.equal(request.type, 'throw')
  assert.ok(request.aim.yaw > 0)
  assert.equal(control.camera.zoom, 6)
  assert.equal(control.released, false)
  control.space.onPress()
  assert.equal(app.commands.at(-1).data, request)
  app.emit('darts:rejected', { state: g.snapshot(), message: 'Refreshed' })
  control.space.onPress()
  assert.equal(app.commands.at(-1).data.type, 'throw')
  g.beginThrow('p0', request.aim, g.seq)
  app.emit('darts:state', g.snapshot())
  assert.equal(effects.length, 1)
  assert.match(effects[0].options.emote, /m=rightArm&l=0/)
  assert.equal(effects[0].options.freeze, undefined)
  assert.equal(effects[0].options.anchor, undefined)
  app.emit('darts:state', g.snapshot())
  assert.equal(effects.length, 1, 'state refresh must not restart the animation')
  control.escape.onPress()
  assert.equal(control.released, true)
  assert.equal(control.camera.write, false)
  assert.equal(app.handlers.get('update').size, 1, 'wind-up remains visible after closing controls')
  app.emit('destroy')
  assert.ok(effects[0].cancelled)
  assert.equal(app.handlers.get('update').size, 0)
})

test('packaged server authenticates players, accepts free distance, derives the real release and sleeps after flight', () => {
  const app = makeApp()
  const players = [
    { id: 'p0', name: 'Host', networkId: 's0', position: new THREE.Vector3(0, 0, 2.4) },
    { id: 'p1', name: 'Guest', networkId: 's1', position: new THREE.Vector3(0, 0, 2.4) },
  ]
  const messages = []
  app.sendTo = (...args) => messages.push(args)
  const world = emitter({ isServer: true, getPlayers: () => players })
  execute(app, world)
  const command = (sender, data) => app.emit('darts:command', data, sender)
  command('spoof', { type: 'join' })
  assert.equal(app.state.darts.players.length, 0)
  players[1].position.x = 30
  command('s1', { type: 'join' })
  assert.equal(app.state.darts.players.length, 1)
  players[1].position.x = 0
  command('s1', { type: 'leave' })
  command('s0', { type: 'join' })
  command('s1', { type: 'join' })
  const seq = app.state.darts.seq
  command('s1', { type: 'start', seq })
  assert.equal(app.state.darts.phase, 'lobby')
  command('s0', { type: 'start', seq })
  assert.equal(app.state.darts.phase, 'playing')
  const shotSeq = app.state.darts.seq
  command('s1', { type: 'throw', seq: shotSeq, aim: DEFAULT_AIM, playerId: 'p0' })
  assert.equal(app.state.darts.flight, null)
  players[0].position.set(0.4, 0, 8)
  command('s0', { type: 'throw', seq: shotSeq, aim: DEFAULT_AIM, origin: [0, 1.55, 0.1] })
  assert.equal(app.state.darts.flight, null)
  assert.ok(app.state.darts.windup)
  players[0].position.z = 9 // Movement during wind-up changes the real release.
  for (let i = 0; i < 28; i++) app.emit('update', 1 / 60)
  assert.ok(app.state.darts.flight)
  closeVec(new THREE.Vector3(...app.state.darts.flight.origin), [0.4, 1.55, 8.73])
  command('s0', { type: 'throw', seq: shotSeq, aim: DEFAULT_AIM })
  assert.equal(app.handlers.get('update').size, 1)
  for (let i = 0; i < 180 && app.handlers.get('update').size; i++) app.emit('update', 1 / 60)
  assert.equal(app.state.darts.visit, 1)
  assert.equal(app.state.darts.players[0].throws, 1)
  assert.equal(app.handlers.get('update').size, 0)
  command('s1', { type: 'sync' })
  assert.equal(messages.at(-1)[0], 'p1')
  assert.equal(messages.at(-1)[1], 'darts:state')
  assert.equal(messages.at(-1)[2].visit, 1)
  world.emit('leave', { playerId: 'p0' })
  assert.equal(app.state.darts.host, 'p1')
  assert.equal(app.state.darts.turn, 0)
  app.emit('destroy')
  assert.equal(world.handlers.get('leave').size, 0)
})
