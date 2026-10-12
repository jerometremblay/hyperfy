import assert from 'node:assert/strict'
import test from 'node:test'
import { Matrix3, Vector3 } from 'three'
import { celestialDirection, getLocalSiderealTime, setCelestialRotation } from './celestialRotation.js'

const date = new Date('2000-01-01T12:00:00Z')
const radians = Math.PI / 180
function direction(ra, dec, latitude, longitude = 0, time = date) {
  const rotation = setCelestialRotation(new Matrix3(), time, latitude, longitude)
  assert.ok(Math.abs(rotation.determinant() - 1) < 1e-12)
  return new Vector3(...celestialDirection(ra, dec)).applyMatrix3(rotation)
}
function close(actual, expected, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`)
}

test('sidereal time agrees with USNO J2000 reference and east-positive longitude', () => {
  close(getLocalSiderealTime(date, 0) / radians / 15, 18.697375)
  close(getLocalSiderealTime(date, 30) / radians / 15, 20.697375)
  const later = new Date(date.getTime() + 86164090.5)
  close(getLocalSiderealTime(later, 0), getLocalSiderealTime(date, 0))
  assert.ok(getLocalSiderealTime(new Date('1900-01-01T00:00:00Z'), -180) >= 0)
})

test('meridian stars, rising stars, and celestial poles map to world bearings', () => {
  const ra = getLocalSiderealTime(date, 0) / radians / 15
  const zenith = direction(ra, 45, 45)
  close(zenith.y, 1)
  const east = direction((ra + 6) % 24, 0, 0)
  close(east.x, 1)
  close(east.y, 0)
  const west = direction((ra + 18) % 24, 0, 0)
  close(west.x, -1)
  const northPole = direction(0, 90, 45)
  close(northPole.y, Math.sin(45 * radians))
  close(northPole.z, -Math.cos(45 * radians))
  const southPole = direction(0, -90, -30)
  close(southPole.y, 0.5)
  close(southPole.z, Math.cos(30 * radians))
  close(direction(0, 90, 90).y, 1)
  close(direction(0, -90, -90).y, 1)
})

test('rotation agrees with independent spherical altitude and azimuth equations', () => {
  // Sirius, Polaris, and southern bright-star bearings at multiple sites/times.
  for (const [ra, dec] of [
    [6.752481, -16.716116],
    [2.530301, 89.264109],
    [14.660139, -60.833993],
  ]) {
    for (const latitude of [-80, -33.9, 0, 45.75, 90]) {
      for (const longitude of [-180, -74, 151, 180]) {
        const time = new Date('2026-10-12T03:00:00Z')
        const h = getLocalSiderealTime(time, longitude) - ra * 15 * radians
        const phi = latitude * radians,
          delta = dec * radians
        const up = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(h)
        const east = -Math.cos(delta) * Math.sin(h)
        const north = Math.cos(phi) * Math.sin(delta) - Math.sin(phi) * Math.cos(delta) * Math.cos(h)
        const actual = direction(ra, dec, latitude, longitude, time)
        close(actual.y, up)
        close(actual.x, east)
        close(actual.z, -north)
      }
    }
  }
})
