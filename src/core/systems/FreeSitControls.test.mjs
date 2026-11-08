import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'

globalThis.window = { matchMedia: () => ({ matches: false }) }
globalThis.document = { activeElement: { tagName: 'BODY' } }
const result = await build({
  stdin: {
    contents: `export { ClientControls } from './src/core/systems/ClientControls.js'; export { PlayerLocal } from './src/core/entities/PlayerLocal.js'`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
const { ClientControls, PlayerLocal } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString('base64')}`
)
const keyboard = (code, key, type = 'keydown') => {
  const e = new Event(type, { cancelable: true })
  Object.assign(e, { code, key, repeat: false })
  return e
}

test('Q and E rotate while seated, consume E before world actions, and release on standing', () => {
  const world = { emit() {} }
  world.controls = new ClientControls(world)
  const action = world.controls.bind({ priority: 4 })
  let actions = 0
  action.keyE.onPress = () => actions++
  const control = world.controls.bind({ priority: 5 })
  const turns = []
  const player = {
    world,
    data: { effect: { freeSit: { pose: {} } } },
    freeSitControl: control,
    syncFreeSitControls: PlayerLocal.prototype.syncFreeSitControls,
    rotateFreeSit: angle => turns.push(angle),
  }
  player.syncFreeSitControls()
  const e = keyboard('KeyE', 'e')
  world.controls.onKeyDown(e)
  assert.equal(e.defaultPrevented, true)
  assert.equal(actions, 0)
  PlayerLocal.prototype.updateFreeSitRotation.call(player, 0.016)
  assert.ok(turns[0] < 0)
  PlayerLocal.prototype.updateFreeSitRotation.call(player, 0.1)
  assert.equal(turns.length, 1)
  PlayerLocal.prototype.updateFreeSitRotation.call(player, 0.13)
  assert.equal(turns.length, 2)
  world.controls.onKeyUp(keyboard('KeyE', 'e', 'keyup'))
  const q = keyboard('KeyQ', 'q')
  world.controls.onKeyDown(q)
  PlayerLocal.prototype.updateFreeSitRotation.call(player, 0.25)
  assert.ok(turns.at(-1) > 0)
  world.controls.onKeyUp(keyboard('KeyQ', 'q', 'keyup'))
  player.data.effect = null
  player.syncFreeSitControls()
  assert.equal(control.keyE.capture, false)
  world.controls.onKeyDown(keyboard('KeyE', 'e'))
  assert.equal(actions, 1)
})

test('a failed re-fit leaves the current pose and network state untouched', () => {
  const effect = { freeSit: { kind: 'seat', offset: [0, 0, 0], pose: { hips: { rotation: [0, 0, 0, 1] } } } }
  const sent = []
  const player = {
    data: { id: 'player', effect },
    base: new THREE.Object3D(),
    avatar: {},
    world: { physics: { raycast: () => null }, network: { send: (...args) => sent.push(args) } },
  }
  assert.equal(PlayerLocal.prototype.rotateFreeSit.call(player, Math.PI / 12), false)
  assert.equal(player.data.effect, effect)
  assert.deepEqual(sent, [])
})
