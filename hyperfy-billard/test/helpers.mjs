import { build } from 'esbuild'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import * as THREE from 'three'
export const root = fileURLToPath(new URL('../', import.meta.url))
const temp = await mkdtemp(`${tmpdir()}/hyperfy-billard-test-`)
await build({
  stdin: { contents: "export * from './src/simulation.js'; export * from './src/aim.js'", resolveDir: root },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: `${temp}/simulation.mjs`,
})
export const physics = await import(`${temp}/simulation.mjs`)
await build({
  stdin: {
    contents:
      ['Prim', 'Group', 'Action', 'UI', 'UIText']
        .map(n => `export { ${n} } from './src/core/nodes/${n}.js'`)
        .join(';') + "; export { importApp, exportApp } from './src/core/extras/appTools.js'",
    resolveDir: `${root}..`,
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: `${temp}/nodes.mjs`,
})
export const nodes = await import(`${temp}/nodes.mjs`)
const constructors = { prim: nodes.Prim, group: nodes.Group, action: nodes.Action, ui: nodes.UI, uitext: nodes.UIText }
export const code = await readFile(`${root}dist/hyperfy-billard.js`, 'utf8')
export function harness({ server = false, state = {}, props = {}, players = [], source = code, bus = {}, cueHolders } = {}) {
  const handlers = {},
    created = [],
    sent = []
  let released = 0
  let control = null, activeControl = null
  const pointer = { delta: new THREE.Vector3(), locked: false,
    lock() { this.locked = true }, unlock() { this.locked = false } }
  const app = {
    position: new THREE.Vector3(0, 0.762, 0),
    quaternion: new THREE.Quaternion(),
    scale: new THREE.Vector3(1, 1, 1),
    state,
    configure() {},
    get() { return null },
    add() {},
    remove() {},
    create(type, data) {
      const n = new constructors[type](data)
      n.activate = n.deactivate = () => {}
      created.push(n)
      return n.getProxy()
    },
    on(name, fn) {
      ;(handlers[name] ||= []).push(fn)
    },
    off(name, fn) {
      handlers[name] = (handlers[name] || []).filter(f => f !== fn)
    },
    emit(name, value) {
      world.emit(name, value)
    },
    send(name, value) {
      sent.push([name, structuredClone(value)])
      app.deliver?.(name, structuredClone(value))
    },
    control() {
      control?.release()
      let done = false
      control = new Proxy(
        {
          camera: { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() },
          pointer,
          scrollDelta: { value: 0 },
          release() {
            if (!done) released++
            done = true
            if (activeControl === control) activeControl = null
          },
        },
        {
          get(target, key) {
            return target[key] ?? (target[key] = { down: false })
          },
        }
      )
      activeControl = control
      return control
    },
  }
  const worldEvents = bus
  const world = {
    add() {},
    remove() {},
    on(name, callback) {
      ;(worldEvents[name] ||= []).push(callback)
    },
    emit(name, value) {
      for (const callback of worldEvents[name] || []) callback(value)
    },
    isServer: server,
    isClient: !server,
    getPlayers: () => players,
    getPlayer: id => (id ? players.find(p => p.id === id) : players[0]),
  }
  if (cueHolders) {
    const cueEvent = `billard:cues:${props.playChannel || 'classic-8-ft-pool-table'}`
    world.on(`${cueEvent}:request`, () => world.emit(cueEvent, cueHolders))
  }
  vm.runInNewContext(
    `(function(world, app, props) { const config = props\n${source}\n})(world, app, props)`,
    { app, world, props, console, Vector3: THREE.Vector3, Quaternion: THREE.Quaternion, Euler: THREE.Euler },
    { timeout: 5000 }
  )
  return {
    app,
    world,
    handlers,
    created,
    sent,
    get activeControl() { return activeControl },
    get control() {
      activeControl = control
      return control
    },
    get released() {
      return released
    },
    emit(name, value, sender) {
      for (const fn of handlers[name] || []) fn(value, sender)
    },
  }
}
export function player(id, networkId = id) {
  return { id, networkId, cameraCalls: [], setCamera(options) { this.cameraCalls.push({target: options.target.clone(), zoom: options.zoom, duration: options.duration}) }, position: new THREE.Vector3(0, 0, 1.5), quaternion: new THREE.Quaternion(),
    teleport(position, yaw) { this.position.copy(position); this.quaternion.setFromEuler(new THREE.Euler(0, yaw, 0)) } }
}
