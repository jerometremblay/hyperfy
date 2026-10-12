# Portal

A native doorway with built-in travel to another portal or a remote world.
No linked JavaScript asset, trigger, event listener, or arrival script is required.

For same-world destinations it supplies a live view through the other portal. It renders the existing
scene using a camera transformed through the source and destination doorways.
The view follows the viewer, with parallax, destination plane clipping, and
separate views for each XR eye.

```js
const portal = app.create('portal', {
  portalId: app.instanceId,
  target: props.destinationPortalId || '',
  url: props.destinationWorldUrl || '',
  width: 1.6,
  height: 2.4,
  resolution: 256,
  updateRate: 15,
  doubleside: false,
  position: [0, 1.2, 0],
})
app.add(portal)
```

| Property | Default | Meaning |
| --- | --- | --- |
| `portalId` | `''` | Unique endpoint ID, normally `app.instanceId`. |
| `target` | `''` | Destination portal ID, in this world or the remote world. |
| `url` | `''` | Remote HTTP(S) world URL. Empty means same-world travel. |
| `doubleside` | `false` | Activate the front (+Z) only, with a light-gray inactive back; `true` activates both sides. Can be changed at runtime. |
| `width` | `1.6` | Positive aperture width in local units. |
| `height` | `2.4` | Positive aperture height in local units. |
| `resolution` | `256` | Maximum texture dimension: 256, 512, or 1024 pixels; `'max'` uses the viewer's current render resolution. |
| `updateRate` | `15` | Preview updates per second: 15, 30, or 0 for every frame. |

Inherits [Node](../Node.md) transforms, activation, and parenting. The aperture
is centered on the node and faces local +Z. It is one-sided by default: the back is light gray and never triggers travel. Set `doubleside: true` to activate both sides.
An unconfigured, missing, or self-referencing destination displays an error inside
the aperture. Remote destinations are checked before travel and every 30 seconds,
with a five-second timeout. Network failures and readable HTTP errors appear on
the active surface and prevent travel. Errors clear when the destination recovers.
The inactive back of a one-sided portal remains light gray.

Updated remote worlds expose `/api/portal-status` so a missing destination portal
ID can be reported before leaving the current world. Older worlds fall back to
checking their page. If cross-origin restrictions hide the response, only network
reachability can be checked; HTTP status and portal-ID existence remain unknown.
Moving, resizing, deactivating, or deleting either endpoint updates the view.
The third-person camera boom stops at portal surfaces, like it does at walls,
so the camera stays on the player's side of the doorway after teleporting.
The player can still cross the surface normally.

Use **Add → World Portal** for the script-free primitive. Configure
**Destination world URL** and **Destination portal ID**; leave the URL empty for
same-world travel. **Copy portal ID** gives the destination endpoint's ID.
The native node handles entry detection, teleportation, URL query parameters,
waiting for the destination player to load, and placing arrivals clear of the exit.
Its **Sides** setting defaults to **One-sided**. The root sits on the floor,
and builder scaling resizes the aperture and entry region together.

Portal nodes can also be embedded directly in a GLB using an object's custom
properties (`extras`): `node: 'portal'`, `portalId`, `target`, `url`, `width`,
`height`, and `doubleside`. The aperture is centered on that object. Each embedded
endpoint should have its own unique `portalId`. The bundled primitive uses the
app's instance ID automatically and declares `appConfig: true` to expose its
native settings in the app inspector. Ordinary embedded endpoints use their
model properties without an accompanying script.

Same-world travel preserves lateral offset and viewing angle through the doorway
half-turn. A one-sided destination places back-side arrivals on its front.
Remote travel appends `portalId` while preserving the URL's other query parameters
and fragment; the destination consumes that parameter after successful arrival.

Restart the engine and refresh the client after updating. The two shipped legacy
World Portal script versions now use the native primitive automatically, preserving
instance IDs, placement, and destination settings. Custom scripts remain unchanged;
replace those with `WorldPortal.hyp` using Import to adopt native travel.

The World Portal properties expose **Preview resolution** and **Preview update
rate**, defaulting to Low (256 px) and Low (15 FPS).
**Max** uses the renderer's actual pixel dimensions, including pixel ratio,
and follows viewport resizing. In XR it matches each eye's viewport resolution.
The update rate remains independently configurable.
Preview textures and their
camera projections are cached between updates, so motion can look less smooth
at lower rates. Each eye has its own cache. Linking a different destination,
crossing to the other side, resizing the texture, or changing the update rate
refreshes the preview immediately.

Each visible portal renders an extra scene pass per eye at its configured rate,
capped at its configured resolution on the longest side. Nested portal surfaces
are omitted from that pass to prevent
recursion. The primary composer's AO/bloom are not rerun for the destination;
lighting and existing shadow maps are shared with the active view. CSS3D WebViews
are not WebGL content and cannot appear in this preview. Remote-world previews
are not implemented. Gaussian splats use separate Spark LOD/sort buffers per
portal so destination updates do not replace the active camera's buffers.
Desktop rendering, parallax, clipping, the composer, simulated stereo cameras,
and a procedural Gaussian splat scene have been checked in the browser. Headset
rendering and streamed splat LOD still require checks with representative content.
