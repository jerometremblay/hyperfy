# Real-time day–night cycle

Open **World Settings** to configure **Day–Night Cycle**, **Latitude**, and **Longitude**.
The cycle is enabled by default, at latitude `45.75689615017221` and longitude
`-74.01942099403277`. These settings are saved with the world and shared with all visitors.

The visible sun, moon, and directional sunlight shadows follow the current date and time
at that location, including seasonal changes. SunCalc calculates their positions locally;
no location permission, weather service, or timezone setting is required. Each client uses
its device clock and refreshes the position once per second, including when returning to
a suspended tab. Devices should have automatic clock synchronization enabled.

Builders can enter `/time set 13h23` in chat to smoothly fast-forward to the next 13:23
in their device's local timezone over up to five seconds. The sun, moon and lighting update
every frame during the transition. Earlier times advance through midnight. The world
then continues at normal speed using a saved, shared offset. A new command during a
transition starts from its current animated time. Late arrivals share the same transition.
Use `/time reset` to return to real time. Both commands enable the day–night cycle.

World north is **−Z**, east is **+X**, and up is **+Y**. Latitude accepts −90 to 90,
and longitude accepts −180 to 180 (negative longitude is west).

The moon's illuminated portion and tilt follow its real phase, from crescent through
quarter, gibbous, and full moon. Its angular size changes with lunar distance. It is hidden
below the horizon and can appear during daylight when above it. Moonlight lights surfaces,
stronger near full moon, and fades at dawn and moonset; it does not cast additional shadows.
The moon is a shaded disc, without a photographic surface texture. It uses its real angular
size (roughly half a degree), so it is small on screen. Near new moon, the illuminated part
can be effectively invisible; changing the hour does not change the lunar phase.

While enabled, Three.js's procedural sky replaces the background supplied by sky apps.
Direct sunlight fades at the horizon, and the existing HDR ambient lighting dims through
twilight to 20% brightness at night, so unlit surfaces remain visible. The procedural sky
and sun disc are scaled to avoid excessive bloom. The HDR reflection image remains the world's existing
image. App lights and emissive materials keep their own brightness.
The sky smoothly brightens to light blue as the sun rises above the horizon, reaching
full daytime color at one degree of elevation and retaining its twilight colors below it.

Switching the cycle off restores the sky app's background, sun direction, sunlight color
and intensity, and full HDR lighting.

Run `node scripts/test-day-night-lighting.mjs` and open the printed URL for WebGL regression
checks of sun glare, moonless ambient light, and moonlight with shadows enabled and disabled.
The fixture uses the world's HDR image, cascaded shadows, bloom, and ACES tone mapping.
