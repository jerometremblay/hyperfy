const radians = Math.PI / 180

// UTC approximates UT1 here. Mean sidereal time, USNO's approximate formula:
// https://aa.usno.navy.mil/faq/GAST. Catalog positions stay at J2000.
export function getLocalSiderealTime(date, longitude) {
  const jd = date.getTime() / 86400000 + 2440587.5
  const midnight = Math.floor(jd - 0.5) + 0.5
  const days = midnight - 2451545
  const hours = (jd - midnight) * 24
  const centuries = (jd - 2451545) / 36525
  const gmst = 6.697375 + 0.065709824279 * days + 1.0027379 * hours + 0.0000258 * centuries * centuries
  const local = gmst + longitude / 15
  return (((local % 24) + 24) % 24) * 15 * radians
}

export function celestialDirection(raHours, decDegrees) {
  const ra = raHours * 15 * radians
  const dec = decDegrees * radians
  // Y is the celestial north pole; increasing RA runs toward -Z.
  return [Math.cos(dec) * Math.cos(ra), Math.sin(dec), -Math.cos(dec) * Math.sin(ra)]
}

export function setCelestialRotation(matrix, date, latitude, longitude) {
  const sidereal = getLocalSiderealTime(date, longitude)
  const s = Math.sin(sidereal)
  const c = Math.cos(sidereal)
  const sl = Math.sin(latitude * radians)
  const cl = Math.cos(latitude * radians)
  // Equatorial directions -> east (+X), up (+Y), south (+Z).
  return matrix.set(-s, 0, -c, cl * c, sl, -cl * s, sl * c, -cl, -sl * s)
}
