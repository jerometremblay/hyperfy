# Full-hemisphere twilight

The day/night sky uses one continuous, empirical linear-RGB radiance function in
`src/core/extras/twilightSky.js`. The existing Three.js Sky material calls it with
the viewing direction and the astronomical Sun direction/elevation. Dawn and dusk
use the same function. It adds no textures, draw calls, dependencies, or saved
settings. It blends into the existing daylight sky between solar elevations
−1.5° and +6°, and into the existing night background from −6° to −18°.

The function combines a blue diffuse background, a broad warm solar twilight arch,
subtle purple light, and a rising antisolar blue shadow with a broad pink Belt of
Venus above it. All contributions share the same direction, solar elevation, night
floor, and fading envelope. The solar arch contracts downward as the Sun descends;
the antisolar belt rises and loses contrast by −6°. Horizontal directional weights
vanish at the zenith, avoiding an azimuth seam or a colored pole singularity.

The shader returns linear RGB before the existing tone mapping and output color
conversion. The Milky Way's visibility uses the resulting local sky luminance, so
its contrast responds to the brighter solar hemisphere and darker antisolar sky.
Stars and planets retain their existing magnitude, solar elevation, extinction,
Moon, and Bortle visibility approximations. Sky Appearance remains the existing
Milky Way adjustment. The atmosphere is a fixed clear-sky, ground-observer
approximation; camera height does not change atmospheric optical depth.

## Observational basis and credits

- **David K. Lynch, David S. P. Dearborn, and Steven C. Richtsmeier (2017)**,
  *Antitwilight I: structure and optics*, Applied Optics **56**, G156–G168,
  [doi:10.1364/AO.56.00G156](https://doi.org/10.1364/AO.56.00G156)
  ([author-hosted paper](https://thulescientific.com/Lynch%20et%20al.%20Antitwilight%20I.pdf)).
  Table 2 supplies the approximate blue-band top / Belt of Venus top, in degrees:
  at solar depression 0°, 1°, 2°, 3°, 4°, 5°, the pairs are respectively
  (0,25), (2,30), (8,40), (13,50), (25,60), (35,80). The shader interpolates these
  observations, softens the shadow boundary, and uses a smooth broad belt within
  the measured interval. At 0° the blue band is absent; the first pair is an
  interpolation anchor, with shadow strength zero. The authors describe these
  boundaries as approximate and dependent on observing conditions, and report
  that the belt is barely discernible at −6°. They are not universal geometry.
- **Raymond L. Lee, Jr. (2015)**, *Measuring and modeling twilight's Belt of Venus*,
  Applied Optics **54**, B194–B203,
  [doi:10.1364/AO.54.00B194](https://doi.org/10.1364/AO.54.00B194).
  Scientific basis for restrained belt/shadow color differences and for the role
  of multiple scattering, aerosol extinction, and ozone. This implementation does
  not reproduce Lee's radiative-transfer calculations or use measured spectra.
- **American Meteorological Society, Glossary of Meteorology**,
  [“purple light”](https://glossary.ametsoc.org/wiki/purple-light/), accessed
  October 21, 2026. Basis for the solar purple contribution between depressions
  2° and 6°, peaking at 4°, and its downward movement. Its exact angular profile,
  RGB values, and strength here are artistic approximations.
- **Steve Albers**, [*Sunrise/Sunset, Twilight and Nighttime Sky Simulations &
  Photos*](https://stevealbers.net/albers/allsky/twilight.html), accessed
  October 21, 2026. Qualitative reference for the solar twilight arch, antisolar
  arch, blue upper sky, and their evolution across the whole hemisphere. No
  photographs, simulations, source code, or lookup tables from this site are
  bundled or sampled by the renderer.

The GLSL is original Hyperfy integration code under this repository's GPL-3.0-only
license. The observational boundary values above are credited to Lynch, Dearborn,
and Richtsmeier; this is not a port of their simulation. No third-party images or
paper figures have been redistributed.

The existing daylight shader comes from **Three.js Sky**, which credits
**A. J. Preetham, Peter Shirley, and Brian Smits**, *A Practical Analytic Model for
Daylight* (1999), [doi:10.1145/311535.311545](https://doi.org/10.1145/311535.311545).
Three.js retains its own MIT license and author notices in the installed package.

**Eric Bruneton and Fabrice Neyret**, *Precomputed Atmospheric Scattering* (2008),
and [Bruneton's 2017 implementation](https://ebruneton.github.io/precomputed_atmospheric_scattering/)
were considered in the research discussion as a future physical reference. Their
code, LUTs, and spectral model are not used here; no numerical validation against
their model is claimed.

## Scope and verification

This is an observation-informed visual approximation, not a calibrated atmospheric
scattering solver. The RGB coefficients, azimuth widths, boundary softness, glow
decay, and exposure are chosen for the existing display pipeline. A slowly fading
diffuse fill preserves readable blue hour and existing faint-object emergence;
it does not reproduce the full measured orders-of-magnitude radiance decline.
There is no spectral ozone calculation, ray integration, aerosol profile,
refraction, cloud shadowing, or physical multiple-scattering computation.

Run `node scripts/test-night-sky.mjs` and open the printed URL. The harness tests
the shipped GLSL on the GPU for solar/antisolar brightness, rising shadow, belt
color contrast, azimuth rotation, seam and zenith continuity, finite nonnegative
radiance, and the night transition. It displays full 360° upper-hemisphere
panoramas at solar elevations −1°, −3°, −5°, −12°, and −18°. The existing WebGL
checks also exercise Milky Way contrast, catalog visibility, stereo, portal,
occlusion, and tone-mapping behavior. Actual headset appearance and performance
still need a hardware check.
