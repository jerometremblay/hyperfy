# Native portals

These instructions apply to this feature fork's native `portal` node. Confirm the
target runtime includes it; official or older Hyperfy versions may not. Prefer
the existing native node to custom collision triggers, teleport code, navigation
handlers or arrival scripts.

## Link existing worlds in the builder

1. Add a **World Portal** at the destination and use **Copy portal ID**.
2. Add a source **World Portal** and paste that ID into **Destination portal ID**.
3. Leave **Destination world URL** blank for same-world travel. For remote travel,
   use the destination's full public HTTP(S) world URL, including its port.
4. Keep **Sides → One-sided** for front-only entry (+Z, with an inactive gray back),
   or select **Two-sided** to allow entry from either side.
5. To allow return travel, configure the destination portal with the source ID
   and, for remote travel, the source world's URL. Links are directional.

An empty remote destination ID previews and travels to that world's spawn. An
empty ID with no world URL has no destination. Use explicit destination portals
when doorway-relative offset and facing direction need to be preserved.

## Author a portal node

```js
// Y up, +X right, -Z forward; the portal's active front faces +Z.
const doorway = app.create('portal', {
  portalId: app.instanceId,
  target: 'destination-endpoint-id',
  url: '', // Same world; use a public HTTPS world URL for remote travel.
  width: 1.6,
  height: 2.4,
  position: [0, 1.2, 0], // Aperture center; its bottom is at local Y=0.
  doubleside: false,
  resolution: 256,
  updateRate: 15,
})
app.add(doorway)
```

Use `app.instanceId` for an app with one portal. If an app contains multiple
endpoints, assign each a distinct stable ID, such as `app.instanceId + ':north'`.
Create these nodes in the server app tree as well as the client tree so the remote
status and preview services can discover their endpoint transforms. Do not hide
endpoint creation behind a client-only guard.

Native nodes inherit parent transforms; width and height describe the local
aperture. Portals being moved in the builder do not accept travel. A portal can
also be embedded in a GLB using `extras.node: 'portal'` and the same properties.
The shipped World Portal primitive uses native inspector settings without a
JavaScript asset. Keep normal target-runtime packaging rules for scripted apps.

Preview resolution accepts `256`, `512`, `1024` or `'max'`; update rate accepts
`15`, `30` or `0` (every frame). Start at 256 and 15 FPS. Higher settings add scene
passes per visible portal and per XR eye. Max follows the current eye/viewport
resolution. Do not infer support from the bundled primitive-only preview viewer.

## Arrival and URL travel

Same-world and updated remote portal endpoints preserve lateral offset and
viewing direction through the doorway half-turn. A one-sided destination redirects
back-side arrivals to its front. The engine serializes the source-local crossing
position and direction in `portalPose`, alongside `portalId`, and consumes both
after the destination player is ready. Other query parameters and the fragment
are preserved. Leave this handoff to the native node. Legacy links without a pose
use the destination's default arrival direction.

Remote crossing reloads/navigates to the destination URL. It does not seamlessly
transfer the active world or retain an XR session. Both worlds need the updated
engine/client for the pose handoff; older worlds can still receive URL travel.

## Make app visuals available to remote previews

Updated worlds stream geometry, scripts, avatar movement and lighting for a
50-metre region around the destination portal or spawn. Whole apps overlapping
the region are included. A separate client scene executes visual scripts with
`world.isClient === true` and `world.isPreview === true`; it has no local player
or physics simulation.

- Build initial procedural geometry from props and serialized `app.state`.
- Let ordinary visual animation run in preview mode; avoid duplicate per-frame
  geometry creation.
- Handle absent local players and disable interactions that require controls,
  collision callbacks, uploads, navigation, or outgoing gameplay messages.
- Do not wait for `app.send()` replies to construct preview visuals. Persistent
  shared storage writes are disabled and fetch allows only GET/HEAD without credentials.

Remote daylight uses the destination clock and location. HDR, fog and app lights
also come from the destination. Remote shadows, audio, screen UI, CSS WebViews and
nested portal previews are omitted. Unsupported destinations receive ordinary
URL travel without a live 3D preview.

## Validate in the target engine

Check front and back entry, rotated/scaled endpoints, offset and facing direction
after arrival, and no immediate return trip. For remote links, test two instances
with separate ports and world data; refresh both clients after an engine update.
Confirm live procedural visuals, lighting and avatars, and that missing IDs or
unreachable destinations show errors. Use HTTPS/WSS and public destination URLs
when the source is HTTPS; `localhost` points to the viewer's device. Do not clear
inherited TLS certificates unless intentionally configuring local HTTP.

Desktop stereo software checks do not establish headset correctness. Report XR
hardware validation separately and do not claim it passed from a primitive viewer.
