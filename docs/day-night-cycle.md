# Real-time day–night cycle

Open **World Settings** to configure **Day–Night Cycle**, **Constellation Lines**,
**Latitude**, **Longitude**, and **World Time Zone** (default `America/Toronto`). Use a valid IANA timezone, such as
`Europe/Paris` or `Asia/Tokyo`, or `UTC`. This timezone controls how `/time` commands
interpret hours; it does not change the geographic coordinates.
The cycle is enabled by default, at latitude `45.75689615017221` and longitude
`-74.01942099403277`. These settings are saved with the world and shared with all visitors.

The visible sun, moon, stars, planets, and directional sunlight shadows follow the current
date and time at that location, including seasonal changes. SunCalc calculates the sun and
moon positions; the night sky uses a star catalog and Astronomy Engine for planets.
Calculations run locally; no location permission or weather service is required.
The server owns the world clock.
Clients synchronize with it when joining, every ten seconds, and when returning to a tab,
estimating network delay,
and advance it using a monotonic clock rather than their device's date/time. The sun and
moon, stars, and planets normally refresh once per second, including when returning to a suspended tab.
Players share the same cycle regardless of their device timezone or clock accuracy.

Builders can enter `/time set 13h23` in chat to smoothly fast-forward to the next 13:23
in the world timezone over up to five seconds. The sun, moon, night sky, and lighting update
every frame during the transition. Earlier times advance through midnight. The world
then continues at normal speed using a saved, shared offset. A new command during a
transition starts from its current animated time. Late arrivals share the same transition.
Use `/time reset` to return to real time. Both commands enable the day–night cycle.
The server calculates the target and broadcasts the transition and a shared chat confirmation
to everyone. During daylight-saving changes, repeated times use the next matching occurrence;
if a requested time is skipped, the command targets its next valid occurrence.

World north is **−Z**, east is **+X**, and up is **+Y**. Latitude accepts −90 to 90,
and longitude accepts −180 to 180 (negative longitude is west).

## Reading world time and location in scripts

`world.time` is the shared cycle timestamp in Unix milliseconds, including any active
fast-forward and the saved offset. It is read-only and available on clients and the server.
`world.timeZone` is the shared timezone used by commands.

```js
const date = new Date(world.time)
console.log('World time:', date.toISOString())
console.log('World timezone:', world.timeZone)
```

Read the property again when you need a new time; a saved `Date` is only a snapshot.
The property remains available when the visual day–night cycle is disabled.

`world.getLocation()` is available in both client and server scripts:

```js
const { latitude, longitude } = world.getLocation()
console.log('World location:', latitude, longitude)
```

It returns a fresh snapshot of the configured coordinates. Changing the returned object
does not update World Settings; call it again to read later changes. Geographic coordinates
are separate from a player's 3D position, available through `world.getPlayer().position`
on the client. `world.settings` is not exposed to scripts.

## Moon visibility

The moon's illuminated portion and tilt follow its real phase, from crescent through
quarter, gibbous, and full moon. Its angular size changes with lunar distance. It is hidden
below the horizon and can appear during daylight when above it. Moonlight lights surfaces,
stronger near full moon, and fades at dawn and moonset; it does not cast additional shadows.
The moon is a shaded disc, without a photographic surface texture. It uses its real angular
size (roughly half a degree), so it is small on screen. Near new moon, the illuminated part
can be effectively invisible. The phase follows the resulting date and time; `/time set`
does not offer a phase or date selector.

## Night sky

The cycle displays 8,920 catalog stars and seven planets: Mercury, Venus, Mars, Jupiter,
Saturn, Uranus, and Neptune. Their bearings follow the world's latitude, longitude, and
shared date/time, including `/time set` transitions. Stars and planets fade in as the sun
descends from 6° to 18° below the horizon and fade out again at dawn. Stars fade near the
horizon; planets disappear below it.

Enable **Constellation Lines** in World Settings to show faint connections for all 88
modern constellations, plus a thin circle and name beside each visible planet. The toggle
is off by default and is saved and shared with the world. Stars and planet discs remain
visible with the toggle off.

The night sky follows camera rotation without shifting when players walk. It also renders
in XR and portal views, with planet labels fixed to celestial directions during head turns.
World geometry and the moon cover stars behind them. Disabling the day–night cycle hides
stars, constellation lines, planets, and their labels and restores the sky app's background.

Stars use approximate colors and compressed brightness. Planets are plain discs with
distance-based angular sizes and a minimum one-pixel diameter; they have no surface
textures, rings, or rendered phases. Moonlight does not dim the stars. The sky is intended
to be recognizable rather than a precision astronomy display. See the [night sky guide](night-sky.md)
for calculation details, limitations, catalog attribution, and data rebuilding.

## How lighting is handled

While enabled, Three.js's procedural sky replaces the background supplied by sky apps.
Direct sunlight fades at the horizon, and the existing HDR ambient lighting dims through
twilight to 20% brightness at night, so unlit surfaces remain visible. The procedural sky
and sun disc are scaled to avoid excessive bloom. The HDR reflection image remains the
world's existing image. App lights and emissive materials keep their own brightness.
The sky smoothly brightens to light blue as the sun rises above the horizon, reaching
full daytime color at one degree of elevation and retaining its twilight colors below it.

Switching the cycle off restores the sky app's background, sun direction, sunlight color
and intensity, and full HDR lighting.

Sky apps can still supply the HDR environment, its rotation, fog, sunlight color, and
the base sunlight intensity. With the cycle enabled, astronomical calculations control
the sunlight direction, and the base intensity is multiplied by the daylight strength.
The sky app's background and fixed sun direction take effect when the cycle is disabled.

For lamps and other local illumination, use a [Light node](scripting/nodes/types/Light.md).
Its `intensity` does not automatically fade or switch off with the cycle. Emissive geometry
can glow and produce bloom, but does not illuminate nearby surfaces; pair it with a light
node when both effects are needed. The linked reference includes complete lamp, spotlight,
and directional-light examples.

Use `world.time` for the cycle's adjusted date/time. Scripts do not currently expose sun
position, moon phase, or a nighttime flag. `world.getTime()` remains the network clock in
seconds and `world.getTimestamp()` uses the real clock of the client or server running
the script; neither includes the `/time set` offset. Use the chat commands to change cycle time.

## Validation

Run `node scripts/test-day-night-lighting.mjs` and open the printed URL for WebGL regression
checks of sun glare, moonless ambient light, and moonlight with shadows enabled and disabled.
The fixture uses the world's HDR image, cascaded shadows, bloom, and ACES tone mapping.

Run `node scripts/test-night-sky.mjs` and open the printed URL for night sky WebGL checks,
including constellation and planet labels, horizon masking, geometry and moon occlusion,
head rotation, stereo eyes, portal views, and desktop/direct rendering. Actual headset
appearance and frame cost still require a hardware check.
