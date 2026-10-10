import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_LATITUDE, DEFAULT_LONGITUDE, getDayNightState, getTimeOffset, getWorldTime } from './dayNight.js'

test('time commands target the next world-local occurrence, crossing midnight when needed', () => {
  const now = new Date('2026-10-10T00:00:10Z')
  assert.equal(getTimeOffset('13h23', now), (17 * 60 + 23) * 60000 - 10000)
  assert.equal(getTimeOffset('0h00', now), 4 * 60 * 60000 - 10000)
  assert.equal(getTimeOffset('23h59', now), (3 * 60 + 59) * 60000 - 10000)
  for (const value of ['24h00', '13h60', '-1h23', '13h2', '13:23', '13h23junk', '', null]) {
    assert.equal(getTimeOffset(value, now), null)
  }
})

test('world timezone determines the target independently of the caller timezone', () => {
  const now = new Date('2026-10-09T12:00:00Z')
  assert.equal(now.getTime() + getTimeOffset('13h23', now, 'America/Toronto'), Date.parse('2026-10-09T17:23:00Z'))
  assert.equal(now.getTime() + getTimeOffset('13h23', now, 'Asia/Tokyo'), Date.parse('2026-10-10T04:23:00Z'))
})

test('world time handles skipped and repeated daylight-saving times', () => {
  const spring = new Date('2026-03-08T06:00:00Z')
  assert.equal(spring.getTime() + getTimeOffset('2h30', spring), Date.parse('2026-03-09T06:30:00Z'))
  const fall = new Date('2026-11-01T05:45:00Z')
  assert.equal(fall.getTime() + getTimeOffset('1h30', fall), Date.parse('2026-11-01T06:30:00Z'))
})

test('world time advances continuously to the target, then runs at normal speed', () => {
  const start = Date.parse('2026-10-09T20:00:00Z')
  const settings = {
    timeOffset: 12 * 60 * 60000 - 5000,
    timeTransition: { startedAt: start, endsAt: start + 5000, fromOffset: 0 },
  }
  assert.equal(getWorldTime(settings, start), start)
  let previous = start
  for (let elapsed = 1; elapsed <= 5000; elapsed++) {
    const current = getWorldTime(settings, start + elapsed)
    assert.ok(current >= previous)
    assert.ok(current <= start + 12 * 60 * 60000)
    previous = current
  }
  assert.equal(getWorldTime(settings, start + 5000), start + 12 * 60 * 60000)
  assert.equal(getWorldTime(settings, start + 65000), start + 12 * 60 * 60000 + 60000)
})

test('the equinox sun rises in the east, crosses the south, and sets in the west', () => {
  const morning = getDayNightState(new Date('2026-03-20T08:00:00Z'), 45, 0)
  const noon = getDayNightState(new Date('2026-03-20T12:00:00Z'), 45, 0)
  const evening = getDayNightState(new Date('2026-03-20T16:00:00Z'), 45, 0)
  assert.ok(morning.sunPosition[0] > 0.5)
  assert.ok(evening.sunPosition[0] < -0.5)
  assert.ok(noon.sunPosition[2] > 0.6)
  assert.ok(Math.abs(noon.altitude - 45) < 1)
  assert.ok(Math.abs(Math.hypot(...noon.sunPosition) - 1) < 1e-10)
})

test('default location follows the season and switches off sunlight at night', () => {
  const summer = getDayNightState(new Date('2026-06-21T17:00:00Z'), DEFAULT_LATITUDE, DEFAULT_LONGITUDE)
  const winter = getDayNightState(new Date('2026-12-21T17:00:00Z'), DEFAULT_LATITUDE, DEFAULT_LONGITUDE)
  const night = getDayNightState(new Date('2026-06-21T05:00:00Z'), DEFAULT_LATITUDE, DEFAULT_LONGITUDE)
  assert.ok(summer.altitude > 65 && summer.altitude < 70)
  assert.ok(winter.altitude > 19 && winter.altitude < 23)
  assert.ok(night.sunPosition[1] < 0)
  assert.equal(night.sunIntensity, 0)
  assert.equal(night.environmentIntensity, 0.2)
  assert.equal(summer.sunIntensity, 1)
  assert.equal(summer.environmentIntensity, 1)
})

test('longitude changes local solar time, including across the date line', () => {
  const date = new Date('2026-03-20T12:00:00Z')
  const greenwich = getDayNightState(date, 0, 0)
  const opposite = getDayNightState(date, 0, 180)
  const oppositeWest = getDayNightState(date, 0, -180)
  assert.ok(greenwich.altitude > 85)
  assert.ok(opposite.altitude < -85)
  assert.ok(Math.abs(opposite.altitude - oppositeWest.altitude) < 1e-8)
})

test('polar day and night remain finite without requiring sunrise or sunset events', () => {
  for (const latitude of [-90, 90]) {
    for (const date of ['2026-06-21T12:00:00Z', '2026-12-21T12:00:00Z']) {
      const state = getDayNightState(new Date(date), latitude, 0)
      assert.ok(state.sunPosition.every(Number.isFinite))
      assert.ok(Number.isFinite(state.environmentIntensity))
      assert.equal(state.sunIntensity, state.altitude > 0 ? 1 : 0)
    }
  }
})

test('moon phase progresses through new, crescent, quarter and full', () => {
  const moonAt = time => getDayNightState(new Date(time), DEFAULT_LATITUDE, DEFAULT_LONGITUDE).moon
  const nearNew = moonAt('2026-10-10T01:00:00Z')
  const crescent = moonAt('2026-10-14T23:00:00Z')
  const quarter = moonAt('2026-10-18T23:00:00Z')
  const full = moonAt('2026-10-26T01:00:00Z')
  const waning = moonAt('2026-11-01T05:00:00Z')
  assert.ok(nearNew.fraction < 0.01)
  assert.ok(crescent.fraction > 0.1 && crescent.fraction < 0.25)
  assert.ok(Math.abs(quarter.fraction - 0.5) < 0.05)
  assert.ok(full.fraction > 0.99)
  assert.ok(waning.phase > 0.5)
  assert.ok(quarter.lightDirection[0] > 0)
  assert.ok(waning.lightDirection[0] < 0)
  assert.ok(full.lightIntensity > crescent.lightIntensity)
  assert.equal(nearNew.lightIntensity, 0) // below the horizon
  for (const moon of [nearNew, crescent, quarter, full, waning]) {
    assert.ok(Math.abs(Math.hypot(...moon.position) - 1) < 1e-10)
    assert.ok(Math.abs(Math.hypot(...moon.lightDirection) - 1) < 1e-10)
    assert.ok(moon.angularRadius > 0.004 && moon.angularRadius < 0.005)
  }
})

test('moon illumination faces toward the sun in the observer frame', () => {
  const state = getDayNightState(new Date('2026-10-18T23:00:00Z'), DEFAULT_LATITUDE, DEFAULT_LONGITUDE)
  const [x, , z] = state.moon.position
  const right = [-z, 0, x]
  const sunRight = state.sunPosition.reduce((sum, value, i) => sum + value * right[i], 0)
  assert.ok(sunRight * state.moon.lightDirection[0] > 0)
})
