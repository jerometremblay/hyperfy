import assert from 'node:assert/strict'
import test, { after, mock } from 'node:test'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import * as THREE from 'three'
import EventEmitter from 'eventemitter3'
import { DEFAULT_LATITUDE, DEFAULT_LONGITUDE, getDayNightState } from '../extras/dayNight.js'
import { setCelestialRotation } from '../extras/celestialRotation.js'
import { getPlanetStates } from '../extras/planetPositions.js'
import { getCelestialVisibility } from '../extras/celestialVisibility.js'

const catalog = JSON.parse(await readFile(new URL('../../client/public/stars.json', import.meta.url), 'utf8'))
mock.method(globalThis, 'fetch', async url => {
  assert.equal(url, '/stars.json')
  return { ok: true, json: async () => catalog }
})
after(() => mock.restoreAll())

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
  await environment.starsLoading
  return { environment, world, messages }
}

test('catalog stars follow world time and location, emerge by magnitude, and hide with custom skies', async () => {
  const { environment, world } = await createEnvironment()
  const stars = environment.stars
  assert.equal(stars.geometry.getAttribute('position').count, 8920)
  environment.updateDayNight(Date.parse('2026-10-10T05:00:00Z'))
  assert.equal(stars.visible, true)
  assert.equal(stars.material.uniforms.opacity.value, 1)
  const rotation = stars.material.uniforms.celestialRotation.value.clone()
  const now = Date.parse('2026-10-10T05:00:00Z')
  world.settings.timeOffset = 3600000
  environment.updateDayNight(now)
  assert.notDeepEqual(stars.material.uniforms.celestialRotation.value.elements, rotation.elements)
  world.settings.timeOffset = 0
  world.settings.longitude += 15
  environment.updateDayNight(now)
  const offsetRotation = stars.material.uniforms.celestialRotation.value.clone()
  world.settings.latitude = -45
  environment.updateDayNight(now)
  assert.notDeepEqual(stars.material.uniforms.celestialRotation.value.elements, offsetRotation.elements)
  world.settings.latitude = DEFAULT_LATITUDE
  world.settings.longitude = DEFAULT_LONGITUDE
  let twilightFound = false
  for (let hour = 20; hour < 26; hour += 0.1) {
    environment.updateDayNight(Date.parse('2026-10-10T00:00:00Z') + hour * 3600000)
    const opacity = stars.material.uniforms.constellationOpacity.value
    if (opacity > 0 && opacity < 1) twilightFound = true
  }
  assert.ok(twilightFound)
  environment.updateDayNight(Date.parse('2026-06-21T17:00:00Z'))
  assert.equal(stars.visible, false)
  assert.equal(stars.material.uniforms.opacity.value, 1)
  assert.equal(stars.material.uniforms.constellationOpacity.value, 0)
  world.settings.dayNightCycle = false
  environment.updateDayNight(now)
  assert.equal(stars.visible, false)
  let geometryDisposed = false,
    materialDisposed = false
  stars.geometry.addEventListener('dispose', () => {
    geometryDisposed = true
  })
  stars.material.addEventListener('dispose', () => {
    materialDisposed = true
  })
  environment.destroy()
  assert.equal(stars.parent, null)
  assert.ok(geometryDisposed && materialDisposed)
})

test('constellation lines toggle immediately, persist, share star rotation/fading, and dispose with the world', async () => {
  const { environment, world } = await createEnvironment()
  const lines = environment.constellationLines
  const now = Date.parse('2026-10-10T05:00:00Z')
  world.network.getServerTime = () => now
  assert.equal(world.settings.constellationLines, false)
  assert.equal(lines.visible, false)
  assert.equal(world.settings.set('constellationLines', 'true'), false)
  world.settings.set('constellationLines', true, true)
  environment.onSettingsChange({ constellationLines: { value: true } })
  assert.equal(lines.visible, true)
  assert.equal(lines.material.uniforms.celestialRotation, environment.stars.material.uniforms.celestialRotation)
  assert.equal(lines.material.uniforms.opacity, environment.stars.material.uniforms.constellationOpacity)
  const restored = new Settings({})
  restored.deserialize(world.settings.serialize())
  assert.equal(restored.constellationLines, true)
  world.settings.set('dayNightCycle', false)
  environment.updateDayNight()
  assert.equal(environment.stars.visible, false)
  let geometryDisposed = false,
    materialDisposed = false
  lines.geometry.addEventListener('dispose', () => {
    geometryDisposed = true
  })
  lines.material.addEventListener('dispose', () => {
    materialDisposed = true
  })
  environment.destroy()
  assert.ok(geometryDisposed && materialDisposed)
})

test('planet discs follow world time; constellation mode toggles their circles and names', async () => {
  const { environment, world } = await createEnvironment()
  const now = Date.parse('2026-10-12T05:00:00Z')
  world.network.getServerTime = () => now
  environment.updateDayNight()
  assert.equal(environment.planets.planets.length, 7)
  const expected = getPlanetStates(new Date(now), DEFAULT_LATITUDE, DEFAULT_LONGITUDE)
  for (const [i, planet] of environment.planets.planets.entries()) {
    const visibility = getCelestialVisibility(
      expected[i].magnitude,
      expected[i].direction,
      environment.celestialVisibility.sunDirection.value,
      environment.celestialVisibility.moonDirection.value,
      environment.celestialVisibility.moonFraction.value
    )
    assert.equal(planet.anchor.visible, expected[i].altitude > 0 && visibility > 0.001)
    assert.deepEqual(planet.direction.value.toArray(), expected[i].direction)
    assert.equal(planet.marker.visible, false)
  }
  world.settings.set('constellationLines', true)
  environment.onSettingsChange({ constellationLines: { value: true } })
  assert.ok(environment.planets.planets.some(planet => planet.marker.visible))
  assert.ok(environment.planets.planets.filter(planet => planet.marker.visible).every(planet => planet.anchor.visible))
  world.settings.timeOffset = 3600000
  environment.updateDayNight()
  const changed = getPlanetStates(new Date(now + 3600000), DEFAULT_LATITUDE, DEFAULT_LONGITUDE)
  assert.deepEqual(environment.planets.planets[0].direction.value.toArray(), changed[0].direction)
  world.settings.dayNightCycle = false
  environment.updateDayNight()
  assert.equal(environment.planets.visible, false)
  const planet = environment.planets.planets[0]
  let textureDisposed = false,
    geometryDisposed = false
  planet.marker.material.uniforms.map.value = {
    dispose: () => {
      textureDisposed = true
    },
  }
  planet.disc.geometry.addEventListener('dispose', () => {
    geometryDisposed = true
  })
  environment.destroy()
  assert.equal(environment.planets.parent, null)
  assert.ok(textureDisposed && geometryDisposed)
})

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
  assert.equal(
    environment.solarSky.material.uniforms.sunAltitude.value,
    getDayNightState(new Date('2026-06-21T17:00:00Z'), DEFAULT_LATITUDE, DEFAULT_LONGITUDE).altitude
  )
  assert.equal(environment.sky.visible, false)
  assert.ok(environment.csm.lightDirection.y < -0.9)
  assert.equal(world.stage.scene.environmentIntensity, 1)
  assert.ok(environment.csm.lights.every(light => light.intensity === 1))
  const sun = environment.solarSky.material.uniforms.sunPosition.value.clone().normalize()
  assert.ok(sun.clone().add(environment.csm.lightDirection).length() < 1e-10)

  environment.updateDayNight(Date.parse('2026-06-21T05:00:00Z'))
  assert.ok(environment.csm.lights.every(light => light.intensity === 0))
  assert.equal(world.stage.scene.environmentIntensity, 0.08)
  assert.equal(environment.renderExposure, 1.8)
  assert.ok(environment.solarSky.material.uniforms.sunAltitude.value < 0)

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
  world.settings.set('constellationLines', true)
  environment.onSettingsChange({ constellationLines: { value: true } })
  environment.updateDayNight(now)
  assert.equal(environment.moonMarker.name, 'Moon marker')
  assert.equal(environment.moonMarker.visible, true)
  world.rig.position.set(4000, 300, -2000)
  environment.lateUpdate()
  assert.equal(environment.moon.visible, true)
  const direction = environment.moon.material.uniforms.direction.value
  assert.ok(direction.distanceTo(new THREE.Vector3().fromArray(state.moon.position)) < 1e-10)
  assert.deepEqual(environment.moon.position.toArray(), [0, 0, 0])
  assert.equal(environment.moon.material.uniforms.angularRadius.value, state.moon.angularRadius)
  assert.equal(environment.moonMarker.material.uniforms.direction, environment.moon.material.uniforms.direction)
  assert.equal(environment.moonMarker.material.uniforms.right, environment.moon.material.uniforms.right)
  assert.equal(environment.moonMarker.material.uniforms.up, environment.moon.material.uniforms.up)
  assert.ok(
    environment.moon.material.uniforms.lightDirection.value.distanceTo(
      new THREE.Vector3().fromArray(state.moon.lightDirection)
    ) < 1e-10
  )
  assert.ok(environment.moonLight.intensity > 0.01)
  assert.equal(environment.moonLight.castShadow, false)
  assert.ok(environment.moonLight.target.position.equals(world.rig.position))
  assert.ok(
    environment.moonLight.position.distanceTo(world.rig.position.clone().add(direction.clone().multiplyScalar(900))) <
      1e-10
  )

  const beforeRise = Date.parse('2026-10-10T01:00:00Z')
  environment.updateDayNight(beforeRise)
  assert.equal(environment.moon.visible, false)
  assert.equal(environment.moonLight.intensity, 0)
  const daytime = Date.parse('2026-10-15T19:00:00Z')
  const daytimeState = getDayNightState(new Date(daytime), DEFAULT_LATITUDE, DEFAULT_LONGITUDE)
  assert.ok(daytimeState.altitude > 0)
  assert.ok(daytimeState.moon.altitude > 0)
  environment.updateDayNight(daytime)
  assert.equal(environment.moon.visible, true)
  assert.ok(environment.moon.material.uniforms.opacity.value >= 0.65)
  assert.equal(environment.moonMarker.visible, true)
  assert.equal(environment.moonMarker.material.uniforms.opacity.value, 0)
  world.settings.set('timeOffset', now - Date.parse('2026-10-25T13:00:00Z'))
  environment.updateDayNight(Date.parse('2026-10-25T13:00:00Z'))
  assert.equal(environment.moon.visible, true)
  assert.ok(environment.moonLight.intensity > 0.01)
  const moon = environment.moon
  const moonMarker = environment.moonMarker
  const light = environment.moonLight
  let markerTextureDisposed = false
  moonMarker.material.uniforms.map.value = { dispose: () => (markerTextureDisposed = true) }
  environment.destroy()
  assert.equal(moon.parent, null)
  assert.equal(moonMarker.parent, null)
  assert.equal(markerTextureDisposed, true)
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

test('sun, moon, and stars update during fast-forward and resume the normal refresh interval', async t => {
  const start = Date.parse('2026-06-21T05:00:00Z')
  t.mock.timers.enable({ apis: ['Date'], now: start })
  const { environment, world } = await createEnvironment()
  const before = environment.csm.lightDirection.clone()
  const beforeStars = environment.stars.material.uniforms.celestialRotation.value.clone()
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
  assert.notDeepEqual(environment.stars.material.uniforms.celestialRotation.value.elements, beforeStars.elements)
  t.mock.timers.tick(4968)
  environment.update()
  assert.ok(environment.csm.lights.every(light => light.intensity === 1))
  assert.equal(environment.solarUpdatedAt, start + 5000)
  const afterStars = environment.stars.material.uniforms.celestialRotation.value.clone()
  t.mock.timers.tick(16)
  environment.update()
  assert.equal(environment.solarUpdatedAt, start + 5000)
  assert.deepEqual(environment.stars.material.uniforms.celestialRotation.value.elements, afterStars.elements)
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

test('sun, moon, and stars use server time even when the device clock is hours wrong', async t => {
  const { environment, world } = await createEnvironment()
  const serverTime = Date.parse('2026-10-26T01:00:00Z')
  world.network.getServerTime = () => serverTime
  t.mock.timers.enable({ apis: ['Date'], now: serverTime + 12 * 3600000 })
  environment.update()
  const state = getDayNightState(new Date(serverTime), DEFAULT_LATITUDE, DEFAULT_LONGITUDE)
  assert.equal(environment.solarUpdatedAt, serverTime)
  assert.ok(environment.solarDirection.distanceTo(new THREE.Vector3().fromArray(state.sunPosition)) < 1e-10)
  assert.ok(environment.moonDirection.distanceTo(new THREE.Vector3().fromArray(state.moon.position)) < 1e-10)
  assert.ok(environment.moonLight.intensity > 0.01)
  const rotation = setCelestialRotation(new THREE.Matrix3(), new Date(serverTime), DEFAULT_LATITUDE, DEFAULT_LONGITUDE)
  assert.deepEqual(environment.stars.material.uniforms.celestialRotation.value.elements, rotation.elements)
  environment.destroy()
})
