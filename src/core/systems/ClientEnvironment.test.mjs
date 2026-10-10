import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'
import EventEmitter from 'eventemitter3'
import { DEFAULT_LATITUDE, DEFAULT_LONGITUDE, getDayNightState } from '../extras/dayNight.js'

const bundle = await build({
  stdin: {
    contents: `export { ClientEnvironment } from './src/core/systems/ClientEnvironment.js';
      export { Settings } from './src/core/systems/Settings.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { ClientEnvironment, Settings } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

async function createEnvironment() {
  const messages = []
  const world = {
    stage: { scene: new THREE.Scene() },
    camera: new THREE.PerspectiveCamera(70, 1, 0.2, 1200),
    rig: new THREE.Object3D(),
    prefs: Object.assign(new EventEmitter(), { shadows: 'high' }),
    graphics: new EventEmitter(),
    network: { getServerTime: () => Date.now(), send: (...args) => messages.push(args) },
    loader: { load: async () => new THREE.Texture() },
  }
  world.settings = new Settings(world)
  const environment = new ClientEnvironment(world)
  environment.init({
    baseEnvironment: {
      bg: 'day.jpg',
      hdr: 'day.hdr',
      rotationY: 0,
      sunDirection: new THREE.Vector3(-1, -2, -2).normalize(),
      sunIntensity: 1,
      sunColor: '#ffffff',
    },
  })
  environment.buildCSM()
  await environment.updateSky()
  return { environment, world, messages }
}

test('old worlds get defaults; coordinates and enabled state survive serialization', () => {
  const settings = new Settings({})
  settings.deserialize({})
  assert.equal(settings.dayNightCycle, true)
  assert.equal(settings.latitude, DEFAULT_LATITUDE)
  assert.equal(settings.longitude, DEFAULT_LONGITUDE)
  assert.equal(settings.timeZone, 'America/Toronto')
  assert.equal(settings.timeOffset, 0)
  settings.set('latitude', 0)
  settings.set('longitude', 180)
  settings.set('dayNightCycle', false)
  settings.set('timeOffset', -123400)
  settings.set('timeZone', 'Asia/Tokyo')
  const restored = new Settings({})
  restored.deserialize(settings.serialize())
  assert.equal(restored.latitude, 0)
  assert.equal(restored.longitude, 180)
  assert.equal(restored.dayNightCycle, false)
  assert.equal(restored.timeOffset, -123400)
  assert.equal(restored.timeZone, 'Asia/Tokyo')
})

test('invalid coordinates and cycle values cannot be stored or broadcast', () => {
  const messages = []
  const settings = new Settings({ network: { send: (...args) => messages.push(args) } })
  for (const [key, values] of [
    ['latitude', [-91, 91, NaN, Infinity, '45', null]],
    ['longitude', [-181, 181, NaN, -Infinity, '-74', null]],
    ['dayNightCycle', [1, 'true', null]],
    ['timeZone', ['not/a-zone', '', 0, null]],
    ['timeOffset', [Infinity, NaN, '1000', null, 1e20]],
    [
      'timeTransition',
      [{}, { startedAt: 0, endsAt: 6000, fromOffset: 0 }, { startedAt: 10, endsAt: 5, fromOffset: 0 }],
    ],
  ]) {
    for (const value of values) assert.equal(settings.set(key, value, true), false)
  }
  assert.equal(settings.latitude, DEFAULT_LATITUDE)
  assert.equal(settings.longitude, DEFAULT_LONGITUDE)
  assert.equal(settings.dayNightCycle, true)
  assert.deepEqual(messages, [])
  settings.deserialize({ latitude: 100, longitude: '0', dayNightCycle: 'off' })
  assert.equal(settings.latitude, DEFAULT_LATITUDE)
  assert.equal(settings.longitude, DEFAULT_LONGITUDE)
  assert.equal(settings.dayNightCycle, true)
})

test('visible sun, shadows, and ambient light follow day and night; disabling restores app sky', async () => {
  const { environment, world } = await createEnvironment()
  environment.updateDayNight(Date.parse('2026-06-21T17:00:00Z'))
  assert.equal(environment.solarSky.visible, true)
  assert.equal(environment.solarSky.material.uniforms.daylight.value, 1)
  assert.equal(environment.sky.visible, false)
  assert.ok(environment.csm.lightDirection.y < -0.9)
  assert.equal(world.stage.scene.environmentIntensity, 1)
  assert.ok(environment.csm.lights.every(light => light.intensity === 1))
  const sun = environment.solarSky.material.uniforms.sunPosition.value.clone().normalize()
  assert.ok(sun.clone().add(environment.csm.lightDirection).length() < 1e-10)

  environment.updateDayNight(Date.parse('2026-06-21T05:00:00Z'))
  assert.ok(environment.csm.lights.every(light => light.intensity === 0))
  assert.equal(world.stage.scene.environmentIntensity, 0.2)
  assert.equal(environment.solarSky.material.uniforms.daylight.value, 0)

  world.settings.set('dayNightCycle', false)
  environment.onSettingsChange({ dayNightCycle: { value: false } })
  assert.equal(environment.sky.visible, true)
  assert.equal(environment.solarSky.visible, false)
  assert.equal(environment.moon.visible, false)
  assert.equal(environment.moonLight.intensity, 0)
  assert.equal(world.stage.scene.environmentIntensity, 1)
  assert.ok(environment.csm.lightDirection.equals(environment.base.sunDirection))
  assert.ok(environment.csm.lights.every(light => light.intensity === 1))
  environment.destroy()
})

test('moon follows the astronomical position and phase, disappears below the horizon, and uses time offsets', async () => {
  const { environment, world } = await createEnvironment()
  const now = Date.parse('2026-10-26T01:00:00Z')
  const state = getDayNightState(new Date(now), DEFAULT_LATITUDE, DEFAULT_LONGITUDE)
  environment.updateDayNight(now)
  world.rig.position.set(4000, 300, -2000)
  environment.lateUpdate()
  assert.equal(environment.moon.visible, true)
  const direction = environment.moon.position.clone().sub(world.rig.position).normalize()
  assert.ok(direction.distanceTo(new THREE.Vector3().fromArray(state.moon.position)) < 1e-10)
  assert.ok(
    environment.moon.material.uniforms.lightDirection.value.distanceTo(
      new THREE.Vector3().fromArray(state.moon.lightDirection)
    ) < 1e-10
  )
  assert.ok(environment.moonLight.intensity > 0.1)
  assert.equal(environment.moonLight.castShadow, false)
  assert.ok(environment.moonLight.target.position.equals(world.rig.position))
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(environment.moon.quaternion)
  assert.ok(forward.dot(direction) < -0.99999)

  const beforeRise = Date.parse('2026-10-10T01:00:00Z')
  environment.updateDayNight(beforeRise)
  assert.equal(environment.moon.visible, false)
  assert.equal(environment.moonLight.intensity, 0)
  world.settings.set('timeOffset', now - Date.parse('2026-10-25T13:00:00Z'))
  environment.updateDayNight(Date.parse('2026-10-25T13:00:00Z'))
  assert.equal(environment.moon.visible, true)
  assert.ok(environment.moonLight.intensity > 0.1)
  const moon = environment.moon
  const light = environment.moonLight
  environment.destroy()
  assert.equal(moon.parent, null)
  assert.equal(light.parent, null)
  assert.equal(light.target.parent, null)
})

test('time offset changes the visible sun and keeps advancing with wall time', async () => {
  const { environment, world } = await createEnvironment()
  const now = Date.parse('2026-06-21T05:00:00Z')
  world.settings.set('timeOffset', 12 * 60 * 60 * 1000)
  environment.updateDayNight(now)
  assert.ok(environment.csm.lightDirection.y < -0.9)
  assert.ok(environment.csm.lights.every(light => light.intensity === 1))
  const previous = environment.csm.lightDirection.clone()
  environment.updateDayNight(now + 60 * 60 * 1000)
  assert.ok(previous.distanceTo(environment.csm.lightDirection) > 0.1)
  assert.equal(environment.solarUpdatedAt, now + 60 * 60 * 1000)
  world.settings.set('timeOffset', 0)
  environment.updateDayNight(now)
  assert.ok(environment.csm.lights.every(light => light.intensity === 0))
  environment.destroy()
})

test('sun and moon update every frame during fast-forward and resume the normal refresh interval', async t => {
  const start = Date.parse('2026-06-21T05:00:00Z')
  t.mock.timers.enable({ apis: ['Date'], now: start })
  const { environment, world } = await createEnvironment()
  const before = environment.csm.lightDirection.clone()
  world.settings.set('timeOffset', 12 * 60 * 60 * 1000 - 5000)
  world.settings.set('timeTransition', { startedAt: start, endsAt: start + 5000, fromOffset: 0 })
  environment.onSettingsChange({ timeOffset: {}, timeTransition: {} })
  assert.ok(before.distanceTo(environment.csm.lightDirection) < 1e-10)
  t.mock.timers.tick(16)
  environment.update()
  assert.equal(environment.solarUpdatedAt, start + 16)
  t.mock.timers.tick(16)
  environment.update()
  assert.equal(environment.solarUpdatedAt, start + 32)
  t.mock.timers.tick(4968)
  environment.update()
  assert.ok(environment.csm.lights.every(light => light.intensity === 1))
  assert.equal(environment.solarUpdatedAt, start + 5000)
  t.mock.timers.tick(16)
  environment.update()
  assert.equal(environment.solarUpdatedAt, start + 5000)
  environment.destroy()
})

test('settings changes and shadow quality rebuilds refresh the real sun, and sky follows the viewer', async () => {
  const { environment, world } = await createEnvironment()
  environment.updateDayNight(Date.parse('2026-06-21T17:00:00Z'))
  const previous = environment.csm.lightDirection.clone()
  world.settings.set('longitude', 106)
  environment.onSettingsChange({ longitude: { value: 106 } })
  assert.ok(previous.distanceTo(environment.csm.lightDirection) > 0.5)
  world.prefs.shadows = 'none'
  environment.buildCSM()
  const sun = environment.solarSky.material.uniforms.sunPosition.value.clone().normalize()
  assert.ok(sun.clone().add(environment.csm.lightDirection).length() < 1e-10)
  assert.equal(environment.csm.lights[0].castShadow, false)
  world.rig.position.set(1234, 400, -3000)
  environment.lateUpdate()
  assert.ok(environment.solarSky.position.equals(world.rig.position))
  environment.destroy()
})

test('sun and moon use server time even when the device clock is hours wrong', async t => {
  const { environment, world } = await createEnvironment()
  const serverTime = Date.parse('2026-10-26T01:00:00Z')
  world.network.getServerTime = () => serverTime
  t.mock.timers.enable({ apis: ['Date'], now: serverTime + 12 * 3600000 })
  environment.update()
  const state = getDayNightState(new Date(serverTime), DEFAULT_LATITUDE, DEFAULT_LONGITUDE)
  assert.equal(environment.solarUpdatedAt, serverTime)
  assert.ok(environment.solarDirection.distanceTo(new THREE.Vector3().fromArray(state.sunPosition)) < 1e-10)
  assert.ok(environment.moonDirection.distanceTo(new THREE.Vector3().fromArray(state.moon.position)) < 1e-10)
  assert.ok(environment.moonLight.intensity > 0.4)
  environment.destroy()
})
