import { Equator, Horizon, Illumination, Observer, KM_PER_AU } from 'astronomy-engine'

export const PLANET_NAMES = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
// Mean radii in km: https://ssd.jpl.nasa.gov/planets/phys_par.html
const radii = [2439.4, 6051.8, 3389.5, 69911, 58232, 25362, 24622]

export function getPlanetStates(date, latitude, longitude) {
  const observer = new Observer(latitude, longitude, 0)
  return PLANET_NAMES.map((name, i) => {
    // Horizon requires equator-of-date coordinates. Include light travel time
    // and aberration; omit refraction to match the stars' geometric horizon.
    const equator = Equator(name, date, observer, true, true)
    const { altitude, azimuth } = Horizon(date, observer, equator.ra, equator.dec)
    const elevation = (altitude * Math.PI) / 180
    const bearing = (azimuth * Math.PI) / 180
    return {
      name,
      altitude,
      direction: [
        Math.cos(elevation) * Math.sin(bearing),
        Math.sin(elevation),
        -Math.cos(elevation) * Math.cos(bearing),
      ],
      magnitude: Illumination(name, date).mag,
      angularRadius: Math.asin(radii[i] / (equator.dist * KM_PER_AU)),
    }
  })
}
