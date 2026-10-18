import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getBortleDiffuseVisibility,
  getBortleLimitingMagnitude,
  getCelestialSkyContrastVisibility,
  getCelestialSkyGlowMagnitudePenalty,
  getCelestialVisibility,
  getMilkyWayVisibility,
  getObservedMagnitude,
  getStarVisibility,
} from './celestialVisibility.js'

const direction = (altitude, azimuth = 0) => {
  const elevation = (altitude * Math.PI) / 180
  const bearing = (azimuth * Math.PI) / 180
  return [Math.cos(elevation) * Math.sin(bearing), Math.sin(elevation), -Math.cos(elevation) * Math.cos(bearing)]
}

test('twilight contrast still admits bright objects before faint stars', () => {
  const sun = direction(-17)
  const moon = direction(-30)
  const bright = getCelestialVisibility(-4.5, direction(45, 90), sun, moon, 0)
  const faint = getCelestialVisibility(6.5, direction(45, -90), sun, moon, 0)
  const daytimeStar = getCelestialVisibility(-1, direction(45, 90), direction(10), moon, 0)

  assert.ok(bright > faint)
  assert.ok(bright > 0)
  assert.equal(daytimeStar, 0)
})

test('stars and planets use sky glow as a gradual magnitude penalty', () => {
  const target = direction(45, 90)
  const moon = direction(-30)
  const twilightSun = direction(-12)
  const darkSkySun = direction(-30)

  assert.equal(getCelestialSkyContrastVisibility(-12), 0)
  assert.equal(getCelestialSkyContrastVisibility(-19), 1)
  assert.ok(getCelestialSkyGlowMagnitudePenalty(-12) > getCelestialSkyGlowMagnitudePenalty(-17))
  assert.equal(getCelestialSkyGlowMagnitudePenalty(-30), 0)

  const twilightBrightStar = getStarVisibility(0, target, twilightSun, moon, 0)
  const twilightModerateStar = getStarVisibility(3.25, target, twilightSun, moon, 0)
  const twilightFaintStar = getStarVisibility(5.5, target, twilightSun, moon, 0)
  const twilightPlanet = getCelestialVisibility(-4.5, target, twilightSun, moon, 0)
  const twilightModeratePlanet = getCelestialVisibility(3.5, target, twilightSun, moon, 0)
  const nightStar = getStarVisibility(0, target, darkSkySun, moon, 0)
  const nightPlanet = getCelestialVisibility(-4.5, target, darkSkySun, moon, 0)

  assert.ok(twilightBrightStar > 0)
  assert.ok(twilightModerateStar > 0 && twilightModerateStar < nightStar)
  assert.ok(twilightFaintStar < 0.001)
  assert.ok(twilightPlanet > 0)
  assert.ok(twilightModeratePlanet > 0 && twilightModeratePlanet < nightPlanet)
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

test('Milky Way visibility follows twilight contrast with a smooth threshold', () => {
  const darkSkyLuminance = 0.0023
  const civilTwilightLuminance = 0.0177
  const nauticalTwilightLuminance = 0.0097
  const lateTwilightLuminance = 0.00265

  assert.equal(getMilkyWayVisibility(civilTwilightLuminance, darkSkyLuminance), 0)
  assert.equal(getMilkyWayVisibility(nauticalTwilightLuminance, darkSkyLuminance), 0)
  assert.ok(getMilkyWayVisibility(lateTwilightLuminance, darkSkyLuminance) > 0)
  assert.ok(getMilkyWayVisibility(lateTwilightLuminance, darkSkyLuminance) < 1)
  assert.equal(getMilkyWayVisibility(darkSkyLuminance, darkSkyLuminance), 1)
  assert.equal(getMilkyWayVisibility(0.001, darkSkyLuminance), 1)
})

test('Bortle class limits faint star visibility and Milky Way contrast', () => {
  const sun = direction(-30)
  const moon = direction(-30)
  const star = direction(45, 90)
  const darkSiteVisibility = getCelestialVisibility(5.5, star, sun, moon, 0, 1)
  const suburbanVisibility = getCelestialVisibility(5.5, star, sun, moon, 0, 5)
  const cityVisibility = getCelestialVisibility(5.5, star, sun, moon, 0, 9)

  assert.ok(Math.abs(getBortleLimitingMagnitude(1) - 7.8) < 1e-9)
  assert.ok(Math.abs(getBortleLimitingMagnitude(4) - 6.3) < 1e-9)
  assert.ok(Math.abs(getBortleLimitingMagnitude(9) - 3.8) < 1e-9)
  assert.ok(darkSiteVisibility > suburbanVisibility)
  assert.equal(cityVisibility, 0)
  assert.equal(getBortleDiffuseVisibility(1), 1)
  assert.ok(getBortleDiffuseVisibility(5) > getBortleDiffuseVisibility(6))
  assert.equal(getBortleDiffuseVisibility(7), 0)
})
