import assert from 'node:assert/strict'
import test from 'node:test'
import { getCelestialVisibility, getObservedMagnitude } from './celestialVisibility.js'

const direction = (altitude, azimuth = 0) => {
  const elevation = (altitude * Math.PI) / 180
  const bearing = (azimuth * Math.PI) / 180
  return [Math.cos(elevation) * Math.sin(bearing), Math.sin(elevation), -Math.cos(elevation) * Math.cos(bearing)]
}

test('twilight limiting magnitude admits bright objects before faint stars', () => {
  const sun = direction(-9)
  const moon = direction(-30)
  const bright = getCelestialVisibility(-1, direction(45, 90), sun, moon, 0)
  const faint = getCelestialVisibility(4, direction(45, -90), sun, moon, 0)
  const daytimeStar = getCelestialVisibility(-1, direction(45, 90), direction(10), moon, 0)

  assert.ok(bright > faint)
  assert.ok(bright > 0.5)
  assert.equal(daytimeStar, 0)
})

test('full Moon glow suppresses nearby stars more than distant stars', () => {
  const sun = direction(-30)
  const moon = direction(45)
  const nearby = direction(55)
  const distant = direction(45, 180)
  const newMoonVisibility = getCelestialVisibility(5.5, nearby, sun, moon, 0)
  const fullMoonNearby = getCelestialVisibility(5.5, nearby, sun, moon, 1)
  const fullMoonDistant = getCelestialVisibility(5.5, distant, sun, moon, 1)

  assert.ok(fullMoonNearby < fullMoonDistant)
  assert.ok(fullMoonDistant < newMoonVisibility)
})

test('atmospheric extinction dims objects as they approach the horizon', () => {
  const sun = direction(-30)
  const moon = direction(-20)
  const zenithMagnitude = getObservedMagnitude(2, direction(80), sun, moon, 0)
  const lowMagnitude = getObservedMagnitude(2, direction(4), sun, moon, 0)

  assert.ok(lowMagnitude > zenithMagnitude + 1)
  assert.ok(
    getCelestialVisibility(5.5, direction(4), sun, moon, 0) < getCelestialVisibility(5.5, direction(80), sun, moon, 0)
  )
})
