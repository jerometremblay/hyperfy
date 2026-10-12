import assert from 'node:assert/strict'
import test from 'node:test'
import { getPlanetStates, PLANET_NAMES } from './planetPositions.js'

const date = new Date('2026-10-12T05:00:00Z')
const latitude = 45.75689615017221,
  longitude = -74.01942099403277
test('planet position agrees with an independent JPL Horizons airless reference', () => {
  // JPL Horizons target 599, geodetic observer (-74.019420994,45.756896150,0),
  // UTC 2026-10-12 05:00, quantity 4, APPARENT=AIRLESS, queried 2026-10-12.
  const jupiter = getPlanetStates(date, latitude, longitude).find(p => p.name === 'Jupiter')
  const [x, , z] = jupiter.direction
  const azimuth = ((Math.atan2(x, -z) * 180) / Math.PI + 360) % 360
  assert.ok(Math.abs(jupiter.altitude - -10.128533) < 0.01)
  assert.ok(Math.abs(azimuth - 56.046926) < 0.01)
})

test('all seven planets have finite unit directions and follow time and geographic location', () => {
  const states = getPlanetStates(date, latitude, longitude)
  assert.deepEqual(
    states.map(p => p.name),
    PLANET_NAMES
  )
  for (const planet of states) {
    assert.ok(Number.isFinite(planet.altitude) && Number.isFinite(planet.magnitude))
    assert.ok(Math.abs(Math.hypot(...planet.direction) - 1) < 1e-12)
  }
  assert.notDeepEqual(states, getPlanetStates(new Date(date.getTime() + 3600000), latitude, longitude))
  assert.notDeepEqual(states, getPlanetStates(date, -33.9, 151.2))
})
