const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

export const celestialTwilightShader = `
  float getNightProgress(float sunAltitude) {
    return 1.0 - smoothstep(-18.0, -6.0, sunAltitude);
  }

  float getLimitingMagnitude(float sunAltitude) {
    if (sunAltitude >= -6.0) {
      return -4.5 + 5.5 * (1.0 - smoothstep(-6.0, 0.0, sunAltitude));
    }
    return 1.0 + 5.5 * getNightProgress(sunAltitude);
  }

  float getCelestialLimitingMagnitude(float sunAltitude) {
    if (sunAltitude >= -6.0) {
      return -4.5 + 5.5 * (1.0 - smoothstep(-6.0, 0.0, sunAltitude));
    }
    if (sunAltitude >= -12.0) {
      return 1.0 + 3.0 * (1.0 - smoothstep(-12.0, -6.0, sunAltitude));
    }
    return 4.0 + 2.5 * (1.0 - smoothstep(-18.0, -12.0, sunAltitude));
  }
`

// Keep this small shader helper in step with the CPU version below. It models
// visibility and contrast, not a photometrically calibrated display.
export const celestialVisibilityShader = celestialTwilightShader + `
  float getCelestialAltitude(vec3 direction) {
    return asin(clamp(direction.y, -1.0, 1.0)) * 57.2957795;
  }

  float getStarLimitingMagnitude(float sunAltitude, float starAltitude, float sunSeparation) {
    float twilight = 1.0 - getNightProgress(sunAltitude);
    float sunwardSky = 1.0 - smoothstep(0.2, 1.3, sunSeparation);
    float horizonSky = 1.0 - smoothstep(0.0, 55.0, starAltitude);
    float localSkyGlow = twilight * (0.45 * sunwardSky + 0.85 * horizonSky);
    return getLimitingMagnitude(sunAltitude) - localSkyGlow;
  }

  float getAtmosphericExtinction(float altitude) {
    float zenithAngle = 90.0 - clamp(altitude, 0.5, 90.0);
    float denominator = cos(radians(zenithAngle))
      + 0.50572 * pow(max(0.001, 96.07995 - zenithAngle), -1.6364);
    float airMass = min(40.0, 1.0 / max(0.025, denominator));
    return max(0.0, airMass - 1.0) * 0.18;
  }

  float getObservedMagnitude(
    float magnitude,
    vec3 direction,
    vec3 sunDirection,
    vec3 moonDirection,
    float moonFraction
  ) {
    float altitude = getCelestialAltitude(direction);
    float sunAltitude = getCelestialAltitude(sunDirection);
    float moonAltitude = getCelestialAltitude(moonDirection);
    float sunSeparation = acos(clamp(dot(direction, sunDirection), -1.0, 1.0));
    float moonSeparation = acos(clamp(dot(direction, moonDirection), -1.0, 1.0));
    float sunGlare = 2.0 * smoothstep(-12.0, 0.0, sunAltitude)
      * exp(-pow(sunSeparation / 0.28, 2.0));
    float moonGlow = moonFraction * smoothstep(-5.0, 15.0, moonAltitude)
      * (0.65 + 1.35 * exp(-pow(moonSeparation / 0.45, 2.0)));
    return magnitude + getAtmosphericExtinction(altitude) + sunGlare + moonGlow;
  }

  float getMagnitudeVisibility(
    float magnitude,
    vec3 direction,
    vec3 sunDirection,
    vec3 moonDirection,
    float moonFraction
  ) {
    float altitude = getCelestialAltitude(direction);
    float sunAltitude = getCelestialAltitude(sunDirection);
    float limitingMagnitude = getCelestialLimitingMagnitude(sunAltitude);
    float observedMagnitude = getObservedMagnitude(
      magnitude, direction, sunDirection, moonDirection, moonFraction
    );
    float contrast = 1.0 - smoothstep(limitingMagnitude - 0.5, limitingMagnitude + 0.5, observedMagnitude);
    return smoothstep(0.0, 2.0, altitude) * contrast;
  }

  float getStarVisibility(
    float magnitude,
    vec3 direction,
    vec3 sunDirection,
    vec3 moonDirection,
    float moonFraction
  ) {
    float altitude = getCelestialAltitude(direction);
    float sunAltitude = getCelestialAltitude(sunDirection);
    float sunSeparation = acos(clamp(dot(direction, sunDirection), -1.0, 1.0));
    float limitingMagnitude = getStarLimitingMagnitude(sunAltitude, altitude, sunSeparation);
    float observedMagnitude = getObservedMagnitude(
      magnitude, direction, sunDirection, moonDirection, moonFraction
    );
    float contrast = 1.0 - smoothstep(limitingMagnitude - 0.5, limitingMagnitude + 0.5, observedMagnitude);
    return smoothstep(0.0, 2.0, altitude) * contrast;
  }
`

export function getCelestialVisibility(magnitude, direction, sunDirection, moonDirection, moonFraction = 0) {
  const altitude = altitudeDegrees(direction)
  if (altitude <= 0) return 0

  const sunAltitude = altitudeDegrees(sunDirection)
  const limitingMagnitude = getCelestialLimitingMagnitude(sunAltitude)
  const observedMagnitude = getObservedMagnitude(magnitude, direction, sunDirection, moonDirection, moonFraction)
  const contrast = 1 - smoothstep(limitingMagnitude - 0.5, limitingMagnitude + 0.5, observedMagnitude)
  return smoothstep(0, 2, altitude) * contrast
}

export function getStarVisibility(magnitude, direction, sunDirection, moonDirection, moonFraction = 0) {
  const altitude = altitudeDegrees(direction)
  if (altitude <= 0) return 0

  const sunAltitude = altitudeDegrees(sunDirection)
  const sunSeparation = angularSeparation(direction, sunDirection)
  const limitingMagnitude = getStarLimitingMagnitude(sunAltitude, altitude, sunSeparation)
  const observedMagnitude = getObservedMagnitude(magnitude, direction, sunDirection, moonDirection, moonFraction)
  const contrast = 1 - smoothstep(limitingMagnitude - 0.5, limitingMagnitude + 0.5, observedMagnitude)
  return smoothstep(0, 2, altitude) * contrast
}

export function getNightProgress(sunAltitude) {
  return 1 - smoothstep(-18, -6, sunAltitude)
}

// A smooth baseline from daylight through astronomical night. Each star also
// gets a local limit based on the sky around its own direction.
function getLimitingMagnitude(sunAltitude) {
  if (sunAltitude >= -6) return -4.5 + 5.5 * (1 - smoothstep(-6, 0, sunAltitude))
  return 1 + 5.5 * getNightProgress(sunAltitude)
}

function getCelestialLimitingMagnitude(sunAltitude) {
  if (sunAltitude >= -6) return -4.5 + 5.5 * (1 - smoothstep(-6, 0, sunAltitude))
  if (sunAltitude >= -12) return 1 + 3 * (1 - smoothstep(-12, -6, sunAltitude))
  return 4 + 2.5 * (1 - smoothstep(-18, -12, sunAltitude))
}

function getStarLimitingMagnitude(sunAltitude, starAltitude, sunSeparation) {
  const twilight = 1 - getNightProgress(sunAltitude)
  const sunwardSky = 1 - smoothstep(0.2, 1.3, sunSeparation)
  const horizonSky = 1 - smoothstep(0, 55, starAltitude)
  const localSkyGlow = twilight * (0.45 * sunwardSky + 0.85 * horizonSky)
  return getLimitingMagnitude(sunAltitude) - localSkyGlow
}

export function getObservedMagnitude(magnitude, direction, sunDirection, moonDirection, moonFraction = 0) {
  const altitude = altitudeDegrees(direction)
  const sunAltitude = altitudeDegrees(sunDirection)
  const moonAltitude = altitudeDegrees(moonDirection)
  const sunSeparation = angularSeparation(direction, sunDirection)
  const moonSeparation = angularSeparation(direction, moonDirection)
  const sunGlare = 2 * smoothstep(-12, 0, sunAltitude) * Math.exp(-((sunSeparation / 0.28) ** 2))
  const moonGlow =
    moonFraction * smoothstep(-5, 15, moonAltitude) * (0.65 + 1.35 * Math.exp(-((moonSeparation / 0.45) ** 2)))
  return magnitude + atmosphericExtinction(altitude) + sunGlare + moonGlow
}

function atmosphericExtinction(altitude) {
  const zenithAngle = 90 - Math.max(0.5, Math.min(90, altitude))
  const denominator = Math.cos(zenithAngle * DEG_TO_RAD) + 0.50572 * (96.07995 - zenithAngle) ** -1.6364
  const airMass = Math.min(40, 1 / Math.max(0.025, denominator))
  return Math.max(0, airMass - 1) * 0.18
}

function altitudeDegrees(direction) {
  return Math.asin(Math.max(-1, Math.min(1, component(direction, 'y', 1)))) * RAD_TO_DEG
}

function angularSeparation(a, b) {
  const dot =
    component(a, 'x', 0) * component(b, 'x', 0) +
    component(a, 'y', 1) * component(b, 'y', 1) +
    component(a, 'z', 2) * component(b, 'z', 2)
  return Math.acos(Math.max(-1, Math.min(1, dot)))
}

function component(vector, key, index) {
  return Array.isArray(vector) ? vector[index] : vector[key]
}

function smoothstep(min, max, value) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return t * t * (3 - 2 * t)
}
