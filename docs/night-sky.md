# Catalog night sky

The day/night environment displays 8,920 real stars down to apparent magnitude 6.5.
Stars rotate with the world's latitude, longitude, and synchronized effective time,
including time offsets and transitions. Their visibility follows apparent magnitude
and Sun altitude: the limiting magnitude reaches 1 at the end of civil twilight, 4 at
the end of nautical twilight, and 6.5 at the end of astronomical twilight. They fade
near the horizon and disappear when the day/night cycle is off. The existing custom
background sky then takes over.

World settings includes a **Constellation Lines** toggle, off by default. When enabled,
faint connections highlight all 88 modern constellations. They share the star field's
time/location transform, twilight fade, horizon masking, and portal/XR camera behavior.
The toggle is saved and shared with the world using the existing builder-controlled
settings workflow. Custom sky mode hides the lines along with the stars.

Positions are directions at infinity in the active camera, including each XR eye and
portal view. Geometry and the Moon cover the stars. Apparent magnitude determines
brightness and point size; the dynamic range is compressed for display. The visibility
limit changes with twilight and Moon illumination. A Kasten–Young air-mass approximation
reduces brightness near the horizon. B-V indices produce approximate muted colors.
Missing color indices use a neutral color.

This is a J2000 fixed catalog with mean sidereal rotation, using UTC as an approximation
to UT1. It omits precession, proper motion, nutation, refraction, light pollution,
twinkling, and a Milky Way image. Atmospheric extinction and Moon-driven sky glow are
approximate visibility cues, not a radiometric sky model. It is intended for a recognizable
night sky, not precision astrometry.

## Planets

Mercury, Venus, Mars, Jupiter, Saturn, Uranus, and Neptune are plain, full discs.
[Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT, pinned to 2.1.19)
calculates topocentric apparent positions for the same effective world date and
location as the existing Sun/Moon, including light travel time and aberration.
The conversion uses equator-of-date coordinates and an airless geometric horizon.
The Sun/Moon implementation remains the existing SunCalc implementation.

Planet positions update on the environment's existing one-second cadence and every frame
during time transitions. Planet point size and brightness follow apparent magnitude, using
the star rendering curve. Their visibility changes with twilight and Moon glow; atmospheric
extinction dims objects near the horizon.

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
