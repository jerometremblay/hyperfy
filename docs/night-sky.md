# Astronomical night sky

The day/night environment displays 8,920 real stars down to apparent magnitude 6.5.
Stars rotate with the world's latitude, longitude, and synchronized effective time,
including time offsets and transitions. Their visibility follows apparent magnitude
and a limiting magnitude adjusted by sky glow from the procedural sky's twilight
luminance. Bright stars remain visible through twilight while fainter stars emerge as
the sky darkens. The diffuse Milky Way uses a stricter smooth contrast fade, so it
remains hidden while twilight washes out its broad structure. The magnitude limit
reaches 1 at the end of civil twilight, 4 at the end of nautical twilight, and 6.5 at
the end of astronomical twilight. The world's
**Bortle Class** also limits faint-object visibility, approximately using the midpoint
of each class's naked-eye limiting-magnitude range. Classes 1 through 9 run from
excellent dark-sky sites to inner-city skies. Objects fade near the horizon and
disappear when the day/night cycle is off. The existing custom background sky then
takes over.

World settings include a **Constellation Lines** toggle, off by default. When enabled,
faint connections highlight all 88 modern constellations. They share the star field's
time/location transform, sky-contrast fade, horizon masking, and portal/XR camera
behavior.
The toggle is saved and shared with the world using the existing builder-controlled
settings workflow. Custom sky mode hides the lines along with the stars.

Positions are directions at infinity in the active camera, including each XR eye and
portal view. Geometry and the Moon cover the stars. Apparent magnitude determines
brightness and point size; the dynamic range is compressed for display. The visibility
limit changes with twilight, Bortle class, and Moon illumination. A Kasten–Young
air-mass approximation reduces brightness near the horizon. B-V indices produce
approximate muted colors. Missing color indices use a neutral color.

This is a J2000 fixed catalog with mean sidereal rotation, using UTC as an approximation
to UT1. The point-star catalog omits precession, proper motion, nutation, refraction,
directional light pollution, and twinkling. Atmospheric extinction, Bortle-class limits,
and Moon-driven sky glow are approximate visibility cues, not a radiometric sky model.
It is intended for a recognizable night sky, not precision astrometry.

## Diffuse Milky Way

The diffuse background uses NASA Goddard's `milkyway_2020_4k.exr`, a 4096 × 2048
celestial-coordinate map built from Gaia DR2 and other star catalogs. The NASA map
omits its bright Hipparcos and Tycho foreground stars, so it complements rather than
duplicates Hyperfy's visible-star catalog. Its J2000 orientation shares the catalog's
sidereal rotation: right ascension zero is centered, increases to the left, and
declination increases toward the top.

The image is converted offline to a 2048 × 1024 JPEG with linear-light RGB values and
sampled as a linear texture inside the existing procedural sky shader. This adds no
sky draw call and does not illuminate scene objects. Twilight sky glow suppresses the
map while the rendered background is too bright for its diffuse contrast. Visibility
follows the background luminance smoothly, then dims near the horizon and under Moon
glow. It has no fixed solar-altitude cutoff, so it responds to the actual sky brightness
produced by the environment shader.

The world's **Bortle Class** setting reduces the map's contrast and caps faint-star
visibility. The Milky Way is suppressed by class 7, where it is normally invisible to
the naked eye. Class 1 is the darkest setting and class 9 the brightest. The default is
class 4. **Sky Appearance** remains an artistic adjustment from a muted baseline to a
brighter, more scenic presentation, with a default of 30 on its 0–100 scale.

The NASA map is a rendered star-density/color visualization, not an absolute
radiometric sky model. Bortle Class is a qualitative visual approximation, not a
calibrated sky-brightness measurement; the renderer does not synthesize urban light
domes or physically calibrated skyglow. The diffuse texture provides the Milky Way
band and dust-lane structure, but does not add a separate H-alpha nebula layer. The
default display is intentionally subdued, and its appearance still depends on the
device's tone mapping and headset display. The class descriptions follow
[John Bortle's nine-level dark-sky scale](https://skyandtelescope.org/astronomy-resources/light-pollution-and-astronomy-the-bortle-dark-sky-scale/).

Run `node scripts/build-diffuse-sky.mjs` to download the source from NASA and reproduce
`src/client/public/milkyway.jpg`. The script verifies the source SHA-256 and requires
`ffmpeg` for the resize and conversion. Credit: NASA/Goddard Space Flight Center
Scientific Visualization Studio; Gaia DR2: ESA/Gaia/DPAC. NASA's media guidelines
generally allow reuse of NASA content without a separate license, subject to proper
credit and no implied NASA endorsement. The source map is linked from
[NASA Deep Star Maps 2020](https://svs.gsfc.nasa.gov/4851/).

## Planets

Mercury, Venus, Mars, Jupiter, Saturn, Uranus, and Neptune are plain, full discs.
[Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT, pinned to 2.1.19)
calculates topocentric apparent positions for the same effective world date and
location as the existing Sun/Moon, including light travel time and aberration.
The conversion uses equator-of-date coordinates and an airless geometric horizon.
The Sun/Moon implementation remains the existing SunCalc implementation.

Planet positions update on the environment's existing one-second cadence and every frame
during time transitions. Planet point size and brightness follow apparent magnitude, using
the star rendering curve. Sky glow lowers the point-source limiting magnitude, so bright
planets can appear before the diffuse Milky Way while dimmer objects wait for darker sky.
Bortle class, Moon glow, and horizon extinction further limit visibility.

With **Constellation Lines** enabled, visible planets show a thin circle and their name
to the right during the night. These are scene-rendered annotations, so they work in XR
and portal cameras. They share the planet's direction, visibility, and nighttime fading.
The annotations ignore camera translation, matching the star renderer. The circle is an
outline with a transparent center, so the magnitude-rendered planet point remains visible.
Name textures are created once on first use and disposed with the environment.

Annotation vertices are fixed angular directions on the celestial sphere, using a
world-oriented tangent frame at the planet. They follow the sky through head yaw,
pitch, and roll rather than retaining a screen-space offset. Sprite size uses the
active eye viewport during stereo rendering. Direct/XR frames clear color and depth
even after desktop postprocessing disables automatic clearing, then restore the
composer's clearing state. This prevents the previous head pose's depth buffer from
masking the current sky.

## Rebuilding the data

Run `node scripts/build-star-catalog.mjs` to download and filter the pinned HYG 4.1
source, or pass a local CSV path. The script verifies the source SHA-256 before
generating `src/client/public/stars.json`. The generated asset is checked in and
copied by the normal application build; browsers do not contact the catalog host.
CPU catalog data is shared between environments. Geometry and materials belong to
each environment and are disposed when the world closes. A failed catalog load
leaves the Sun, Moon, and lighting operational; a later environment load may retry.

The same script generates `src/core/extras/constellations.json` from a checksum-pinned
Stellarium modern sky-culture file. Pass that local JSON as the second argument after
the HYG CSV to rebuild offline. Hipparcos IDs match the line endpoints to HYG positions;
missing endpoints fail the generation. Only constellation connections are retained,
excluding asterisms, boundaries, names, illustrations, and descriptive text.

## Data attribution and license

HYG Database 4.1 by David Nash / Astronexus:
[current project](https://codeberg.org/astronexus/hyg),
[4.1 documentation and source archive](https://github.com/astronexus/HYG-Database/blob/main/hyg/README.md).

The filtered `src/client/public/stars.json` is an adaptation of that database and
is distributed under [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).
Changes: exclude the Sun, retain stars with magnitude ≤6.5, and retain only right
ascension in hours, declination in degrees, apparent magnitude, and B-V color index.
The asset embeds attribution, source URL, source checksum, epoch, and field names.
These data terms are separate from Hyperfy's GPL source-code license.

Constellation connections are adapted from the Stellarium team's
[modern sky culture](https://github.com/Stellarium/stellarium/tree/master/skycultures/modern).
Its [description and data license](https://github.com/Stellarium/stellarium/blob/master/skycultures/modern/description.md)
specify CC BY-SA 4.0. The derived `constellations.json` uses that license and embeds
attribution and checksums. Changes: resolve Hipparcos endpoints to HYG J2000 coordinates
and retain only consecutive connection pairs for the 88 constellations.

Sidereal rotation follows the
[US Naval Observatory's approximate mean sidereal time formula](https://aa.usno.navy.mil/faq/GAST).

## Checks

Run `node --test src/core/extras/celestialRotation.test.mjs src/core/extras/celestialVisibility.test.mjs src/core/extras/createStarField.test.mjs src/core/systems/ClientEnvironment.test.mjs`
for astronomical bearings and environment lifecycle checks.
Run `node scripts/test-night-sky.mjs` and open the printed URL for WebGL checks with
the shipped catalog, geometry occlusion, Moon ordering, horizon masking, translation,
stereo eye views, portal projection, and display pipelines.
Actual headset appearance and frame cost also require a hardware check.

For real remote-world stereo checks, build the app and run
`node scripts/test-remote-portals.mjs` plus `node scripts/test-remote-portal-rendering.mjs`.
The fixture worlds use ports 3334/3335 by default. Set `PORTAL_TEST_SOURCE_PORT` and
`PORTAL_TEST_DESTINATION_PORT` to use free ports; append
`?destination=http://localhost:<destination-port>` to the rendering harness URL.
Its daylight phase checks geometry/parallax, and its night phase checks stars in
both eyes with the destination's time and location, then checks replica cleanup.
