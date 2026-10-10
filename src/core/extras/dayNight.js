import { getPosition, getMoonPosition, getMoonIllumination } from 'suncalc'

export const DEFAULT_LATITUDE = 45.75689615017221
export const DEFAULT_LONGITUDE = -74.01942099403277
export const TIME_PATTERN = /^([01]?\d|2[0-3])h([0-5]\d)$/
export const TIME_TRANSITION_DURATION = 5000

export function getTimeOffset(time, now = new Date()) {
  const match = typeof time === 'string' && time.match(TIME_PATTERN)
  if (!match) return null
  const target = new Date(now.getTime())
  target.setHours(Number(match[1]), Number(match[2]), 0, 0)
  if (target < now) target.setDate(target.getDate() + 1)
  return target.getTime() - now.getTime()
}

export function getWorldTime(settings, now = Date.now()) {
  const transition = settings.timeTransition
  if (!transition || now >= transition.endsAt) return now + settings.timeOffset
  const progress = smoothstep(transition.startedAt, transition.endsAt, now)
  return now + transition.fromOffset + (settings.timeOffset - transition.fromOffset) * progress
}

export function isValidDayNightSetting(key, value) {
  if (key === 'dayNightCycle') return typeof value === 'boolean'
  if (key === 'latitude') return Number.isFinite(value) && value >= -90 && value <= 90
  if (key === 'longitude') return Number.isFinite(value) && value >= -180 && value <= 180
  if (key === 'timeOffset') return Number.isFinite(value) && Number.isFinite(new Date(Date.now() + value).getTime())
  if (key === 'timeTransition') {
    return (
      value === null ||
      (typeof value === 'object' &&
        Number.isFinite(value?.startedAt) &&
        Number.isFinite(value?.endsAt) &&
        isValidDayNightSetting('timeOffset', value?.fromOffset) &&
        value.endsAt > value.startedAt &&
        value.endsAt - value.startedAt <= TIME_TRANSITION_DURATION)
    )
  }
  return true
}

export function getDayNightState(date, latitude, longitude) {
  const { altitude, azimuth } = getPosition(date, latitude, longitude)
  const moon = getMoonPosition(date, latitude, longitude)
  const illumination = getMoonIllumination(date)
  const tilt = ((illumination.angle - moon.parallacticAngle) * Math.PI) / 180
  // Light the visible hemisphere with the phase angle, then rotate the bright limb
  // relative to the local zenith. Billboard +X points right, toward celestial west.
  const lightZ = 2 * illumination.fraction - 1
  const lightXY = Math.sqrt(Math.max(0, 1 - lightZ * lightZ))
  const daylight = smoothstep(-6, 6, altitude)
  return {
    altitude,
    azimuth,
    sunPosition: skyDirection(altitude, azimuth),
    sunIntensity: smoothstep(-0.833, 10, altitude),
    skyDaylight: smoothstep(0, 1, altitude),
    environmentIntensity: 0.2 + 0.8 * daylight,
    warmth: 1 - smoothstep(0, 15, altitude),
    moon: {
      altitude: moon.altitude,
      position: skyDirection(moon.altitude, moon.azimuth),
      angularRadius: Math.asin(1737.4 / moon.distance),
      fraction: illumination.fraction,
      phase: illumination.phase,
      lightDirection: [-Math.sin(tilt) * lightXY, Math.cos(tilt) * lightXY, lightZ],
      opacity: 1 - 0.7 * daylight,
      lightIntensity: 0.5 * illumination.fraction * smoothstep(0, 5, moon.altitude) * (1 - daylight),
    },
  }
}

function skyDirection(altitude, azimuth) {
  const elevation = (altitude * Math.PI) / 180
  const bearing = (azimuth * Math.PI) / 180
  // Hyperfy is Y-up: north is -Z, east is +X. This points toward the sun;
  // directional lights use the opposite direction (from the sun to the ground).
  return [Math.cos(elevation) * Math.sin(bearing), Math.sin(elevation), -Math.cos(elevation) * Math.cos(bearing)]
}

function smoothstep(min, max, value) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return t * t * (3 - 2 * t)
}
