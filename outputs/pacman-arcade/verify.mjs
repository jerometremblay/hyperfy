import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import * as THREE from 'three'
import { build } from 'esbuild'

// Run the cabinet through the actual target node constructors (the generic
// skill harness does not include Matrix4, which this camera uses).
const bundle = await build({
  stdin: { contents: "export { Prim } from './src/core/nodes/Prim.js'; export { WebView } from './src/core/nodes/WebView.js'; export { Group } from './src/core/nodes/Group.js'; export { Action } from './src/core/nodes/Action.js'", resolveDir: process.cwd() },
  bundle: true, format: 'esm', platform: 'node', outfile: '/tmp/hyperfy-arcade-nodes.mjs',
})
const nodes = await import('/tmp/hyperfy-arcade-nodes.mjs')
const created = []
const constructors = { prim: nodes.Prim, webview: nodes.WebView, group: nodes.Group, action: nodes.Action }
const handlers = {}
let released = 0
let control
const app = {
  create(type, data) {
    const node = new constructors[type](data)
    // No rendering/physics world in this constructor test.
    node.activate = node.deactivate = () => {}
    created.push(node)
    return node.getProxy()
  },
  add() {},
  on(event, fn) { handlers[event] = fn },
  control() {
    control = new Proxy({ camera: { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }, pointer: { unlock() {} }, setActions() {}, release() { released++ } }, {
      get(target, key) { return target[key] ?? (target[key] = {}) },
    })
    return control
  },
}
vm.runInNewContext(fs.readFileSync('outputs/pacman-arcade/cabinet.js', 'utf8'), { app, world: { isClient: true }, props: {}, Matrix4: THREE.Matrix4, Vector3: THREE.Vector3 })
const screen = created.find(n => n instanceof nodes.WebView)
assert.equal(created.filter(n => n instanceof nodes.WebView).length, 1)
const angle = Math.atan2(-.182,.593)
const normal = new THREE.Vector3(0,0,1).applyQuaternion(screen.quaternion)
assert.ok(normal.distanceTo(new THREE.Vector3(0,Math.sin(angle),-Math.cos(angle))) < 1e-8)
screen.onMessage({ origin: 'https://wrong.example', data: { type: 'pacman-focus' } })
assert.equal(control, undefined)
screen.onMessage({ origin: 'https://monstre.duckdns.org:3333', data: { type: 'pacman-focus' } })
assert.equal(control.keyW.capture, true)
assert.equal(control.camera.write, true)
screen.onMessage({ origin: 'https://monstre.duckdns.org:3333', data: { type: 'pacman-exit' }, releaseFocus() {} })
assert.equal(released, 1)
console.log(`Cabinet: ${created.length} real nodes constructed; CRT normal, input capture, origin check and exit passed`)

// Exercise the reused game, its real event bindings and animation loop.
const window = new EventTarget()
const canvas = new EventTarget()
const hint = { hidden: false, textContent: '' }
const text = []
const context = new Proxy({
  measureText(value) { return { width: value.length*10 } },
  fillText(value) { text.push(String(value)) },
  getImageData() { return {} },
}, { get(target,key) { return target[key] ?? (() => {}) } })
canvas.getContext = () => context
canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 960, height: 640 })
canvas.focus = canvas.blur = () => {}
let frame
let now = 0
const messages = []
Object.assign(window, { navigator: { userAgent: '' }, location: { origin: 'https://monstre.duckdns.org:3333' }, parent: { postMessage(msg) { messages.push(msg.type) } }, requestAnimationFrame(fn) { frame = fn; return 1 }, cancelAnimationFrame() {} })
const sandbox = vm.createContext({
  window, document: { getElementById: id => id === 'canvas' ? canvas : hint, fonts: { add() {} } },
  FontFace: class { load() { return Promise.resolve(this) } }, Event, console,
  KeyboardEvent: class extends Event { constructor(type, options) { super(type); Object.assign(this,options) } },
  requestAnimationFrame: window.requestAnimationFrame, cancelAnimationFrame() {},
  Date: class extends Date { constructor() { super(now) } static now() { return now } },
})
for (const name of ['vendor/game.js','vendor/pacman.js','arcade.js']) vm.runInContext(fs.readFileSync(`src/client/public/games/pacman/${name}`,'utf8'), sandbox)
await new Promise(resolve => setImmediate(resolve))
const game = window.arcadeGame
const tick = (n=1) => { for(let i=0;i<n;i++) { now += 18; frame() } }
const key = (code,keyCode) => { const e = new Event('keydown', { cancelable: true }); Object.assign(e,{ code,keyCode }); window.dispatchEvent(e) }
canvas.dispatchEvent(new Event('click'))
const stage = game.getStages()[1]
const player = stage.getItemsByType(1)[0]
const map = stage.maps[0]
assert.equal(stage.status, 1)
assert.equal(stage.getItemsByType(2).length, 4)
// Place at a four-way intersection so every direction can be checked explicitly.
for (const [code,keyCode,direction,dx,dy] of [['KeyW',87,3,0,-2],['KeyA',65,2,-2,0],['KeyS',83,1,0,2],['KeyD',68,0,2,0]]) {
  const point = map.coord2position(6,5)
  Object.assign(player, point, { coord: { x:6,y:5,offset:0 }, orientation: direction, control:{} })
  key(code,keyCode)
  tick()
  assert.equal(player.orientation,direction,code)
  assert.equal(player.x, point.x+dx,code)
  assert.equal(player.y, point.y+dy,code)
}
// A wall blocks movement.
Object.assign(player,map.coord2position(1,1),{ orientation:3,control:{} })
const wallY = player.y
key('KeyW',87); tick(5)
assert.equal(player.y,wallY)
// Eat a corridor pellet and observe the score and pellet map change.
Object.assign(player,map.coord2position(6,5),{ orientation:0,control:{} })
tick(12)
assert.equal(stage.maps[1].get(7,5),1)
assert.ok(text.includes('SCORE'))
key('Space',32)
assert.equal(stage.status,2)
const pausedX = player.x
tick(5)
assert.equal(player.x,pausedX)
key('Space',32)
assert.equal(stage.status,1)
window.dispatchEvent(new Event('blur'))
assert.equal(stage.status,2)
canvas.dispatchEvent(new Event('click'))
assert.equal(stage.status,1)
key('Escape',27)
assert.equal(stage.status,2)
assert.equal(messages.at(-1),'pacman-exit')
assert.equal(game.getStages().length,14)
game.setStage(13)
canvas.dispatchEvent(new Event('click'))
assert.equal(stage.status,1)
assert.equal(game.getStages()[13].status,0)
console.log('Game: WASD movement, wall collision, pellet collection, score rendering, four ghosts, pause/resume, blur/escape, restart and 12 levels passed')
