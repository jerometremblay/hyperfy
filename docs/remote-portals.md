# Remote portal previews

World Portal can show a live destination on another updated Hyperfy instance.
Configure its destination world URL and portal ID as before. An empty portal ID
previews the destination spawn. Crossing still navigates to the destination URL.
Vanilla worlds use a saved 3D preview captured through a brief anonymous join.
The destination does not need this fork or its custom preview endpoint.

## Set up a portal link

1. In the destination world, choose **Add → World Portal**, place the doorway,
   and click **Copy portal ID** in its properties.
2. In the source world, add another **World Portal** and paste the copied ID into
   **Destination portal ID**.
3. For a remote link, set **Destination world URL** to the destination's public
   world URL, including its port (for example `https://world.example:3334`). For
   a link in the same world, leave that URL blank.
4. Walk through the source's front (+Z). Its back is gray and inactive by default.
   Change **Sides** to **Two-sided** to enable entry from either side.
5. For a return route, configure the destination with the source portal's ID and
   world URL. Each direction is configured separately.

Leave the remote destination ID empty to visit the destination spawn instead.
Use explicit portal endpoints for doorway-relative arrival. A same-world portal
needs a destination ID. The native node handles crossing and arrival without
custom scripts, trigger colliders, or teleport handlers. For scripted or GLB
endpoints, see the [Portal node reference](scripting/nodes/types/Portal.md).

Crossing between updated portal endpoints preserves lateral offset and viewing
direction through the doorway half-turn, as internal portals do. A one-sided
destination places arrivals from the back on its front. The source passes
`portalId` and `portalPose` in the URL and initial connection. The destination
server creates the player at the portal before sending the first snapshot, and
the client consumes the acknowledged arrival before loading entities. This avoids
the visible spawn-to-portal jump. Missing or unavailable endpoints use normal
spawn; endpoints that mount later retain the client arrival fallback. Other query
parameters and fragments remain intact. Older links
without a pose use the default arrival direction. Remote crossing uses a page
navigation, so the preview is not a seamless world transfer.

## Straddling same-world portals

Same-world links that preserve upright orientation and physical size support
continuous crossings. The feet cross the actual doorway plane without an arrival
offset, preserving momentum and body facing. A clipped visual copy of the same
animated avatar remains at the other opening until the body clears it. Other
players in the same world also see the split avatar.

The viewpoint crosses independently of the feet. For a floor opening linked to a
ceiling opening, the destination stairs can support the feet while the head and
view remain above the source. Point the source's front upward and the exit's
front downward. Nearby static box and triangle-mesh collision receives a temporary
opening for the local character controller. Static collision on the far side is
mapped into the passage, allowing the feet to climb onto its stairs before crossing.
The rest of the floor and ceiling remains solid. Feet transfer during each controller
movement step, without waiting for the next rendered frame.
Configure both directions for normal return travel; while still straddling an
exit, backing out also works without a configured return link.

This uses one upright character controller and temporary scene-query geometry;
the original simulation shapes remain intact for other physics bodies. Moving
bodies, sphere colliders and convex collision hulls are not split across the opening.
Portal pairs that rotate gravity or change physical size retain ordinary teleport
arrival. Remote links retain their existing URL navigation and arrival behavior.

Run `node scripts/test-portal-traversal.mjs` and open its printed URL for a real
WebGL/VRM and PhysX fixture checking destination tread support with the head above
the opening, climbing back through a solid ceiling, and collision outside the
aperture. Physical headset walking and interactions across the opening still
need in-world verification.

## Saved loading images

In the **destination** portal's properties, click **Refresh arrival preview** to
save a screenshot from its default arrival position. The capture does not move
your player. It uses the existing asset upload and portal property storage; you
can also upload an image with **Arrival image**, or clear it to use the world's
image. Refresh the screenshot after changing the surrounding world or moving
the doorway.

When a link includes this portal's `portalId`, its saved image is included in the
initial loading page, before the engine downloads. The progress bar remains
visible while loading. Ordinary joins and portals without an arrival image use
the world image. This is a static view of the default arrival, so lateral offsets,
entry from the other side and later scene changes can differ from the screenshot.

## Preview quality and connection setup

The portal properties expose **Preview resolution** (256, 512, 1024, or Max) and
**Preview update rate** (15 FPS, 30 FPS, or Every frame). Defaults are 256 and
15 FPS. Max uses the current render resolution, including each eye's viewport in
XR. Higher settings render more destination scene passes; begin with defaults.

Both worlds must run the updated engine for live remote previews and the arrival
pose handoff. Vanilla worlds instead use the daily snapshot fallback described below. Rebuild and refresh both clients after updating. To run multiple
instances from one checkout, see [named world profiles](deployment.md#named-worlds-from-one-checkout).
Each server needs its own port and world data directory.

Use the destination's public hostname in its API, WebSocket and asset URLs.
`localhost` refers to the viewer's computer or headset, so it is suitable only for
testing on that same device. An HTTPS source needs secure HTTPS/WSS destination
connections. A profile's `PUBLIC_ORIGIN` derives these URLs; leave shared TLS
certificate settings inherited when serving HTTPS directly.

| Symptom | Check |
| --- | --- |
| Gray inactive surface | Enter the front or enable Two-sided. |
| Destination portal not found | Copy the destination endpoint's current ID; ensure it is mounted and not being moved. |
| Destination unreachable | Confirm the public URL, port and network access; check the destination directly. |
| `ERR_SSL_PROTOCOL_ERROR` | The URL may use HTTPS while that port serves HTTP. Check both TLS settings and `PUBLIC_ORIGIN`; restart after changing environment files. |
| Travel works but no live preview | Confirm destination preview support, secure public URLs, reachable WebSocket/assets, and cross-origin access. |
| Facing direction resets on arrival | Refresh updated clients in both worlds and use a destination portal ID; spawn travel has no doorway-relative arrival. |

## What the preview contains

The client downloads the destination's entity data, blueprints, scripts and assets,
and reconstructs a separate scene. It executes client scripts to create procedural
prims and animate content. Remote avatars and scene edits arrive live. Each XR eye
has its own camera and render target, using the same parallax and clipping path as
internal portals. Preview resolution and update rate remain independently configurable.

The scene uses the destination's synchronized world clock, location, daylight cycle,
time offset and transitions. Sky apps provide its HDR, fog and fixed sunlight settings.
App lights also render. Remote shadows, remote voice/audio, CSS WebViews and nested
portal previews are omitted. These omissions do not affect ordinary destination travel.

## Vanilla worlds and Hyperfy v1

When a destination has no versioned preview endpoint, the source server joins it
with a fresh anonymous connection, saves its first snapshot, and immediately
closes the connection. No user credentials are reused, no voice session is joined,
and player records, chat, authentication tokens and admin configuration are discarded.
The join briefly appears as a guest at the destination, as an ordinary anonymous visit does.

Snapshots are shared across viewers and persisted in the source world's
`portal-snapshots/` directory. The first access after 24 hours refreshes them;
unused destinations are not polled. Refresh failures retain the last successful
snapshot and are also limited to one attempt per 24 hours. The client replaces
an active snapshot after 24 hours, and releases unused replica scenes normally.
Only destinations with a portal placed in the source world can request a capture.

Vanilla v2 uses its public `env.js` and ordinary binary snapshot protocol.
Hyperfy v1 at `hyperfy.io` uses the public world/server discovery and guest join
protocol, including a shard in the supplied URL. Its models, images, VRMs,
grabbable models and sky are converted to current native nodes. Old custom app
scripts, mirrors and interactions are not converted. Draco models use the bundled
Three.js decoder. Vanilla worlds without daylight settings retain their fixed sky
and lighting rather than inheriting this fork's day/night defaults.

The preview is centered at destination spawn, with empty **Destination portal ID**.
It excludes distant apps once their complete geometry bounds are known (50 metres),
retaining overlapping large models, global sky/light providers and unknown bounds.
Vanilla sends a whole-world snapshot; geometry must load before bounds can be
checked. Asset URLs still reference the destination, so this is a saved scene
snapshot, not an offline copy of every asset. Existing preview script restrictions
still apply; apps depending on a local player or interactive initialization may
render incompletely. Crossing navigates to the original destination URL.

## Region and lifecycle

A preview subscribes to a 50 metre radius around the destination endpoint. Selection
includes complete apps whose geometry bounds overlap the region, not just apps with
origins inside it. Sky and light providers are retained. Apps without known bounds,
including scripts with client-only geometry, are retained conservatively. A large model
is downloaded whole; this is a selection radius, not a byte limit or mesh-cutting operation.

Portals within 30 metres of the local rig acquire a preview. Portals to the same world
share a scene and connection, subscribing to the union of their endpoint regions.
Rendering occurs when their surfaces are visible. Unused scenes are released after
10 seconds. Connection failures retry; a missing preview does not disable URL travel.

## Script behavior

Preview scripts see `world.isClient === true` and `world.isPreview === true`.
They receive the server's app state in `app.state`, alongside ordinary entity events.
Procedural creation, local animation and local event handlers work normally.

There is no local destination player or physics simulation. Prims, colliders, rigid
bodies and controllers do not create physics actors. Physics queries return no hits.
Navigation, controls, uploads, outgoing gameplay packets and persistent shared storage
are disabled. Script fetches permit only GET/HEAD with credentials omitted. Screen UI
and CSS WebViews do not mount. Audio stays in the active world.

Apps that require a local player, collision callbacks, or an `app.send()` request before
building visuals must handle preview mode, using their serialized `app.state` for initial
visuals. Preview sockets do not execute arbitrary server app handlers; a generic gameplay
event cannot safely be classified as a read-only initialization request.

## Protocol

`GET /api/portal-status` advertises `preview.version` and `preview.wsUrl`.
The versioned `/portal-preview` WebSocket is separate from player sockets and uses named
JSON messages, without changing existing binary player packet IDs.

Clients send only a version-1 `subscribe` message with up to 16 portal IDs, or a clock
`ping`. The server sends regional snapshots, deltas, endpoint transforms, visual settings,
app events and clock replies. Previewing creates no user record, player or LiveKit session.
Player credentials and admin/voice configuration are not included. Invalid messages close
the connection; capacity, subscription size and outbound buffering are bounded.

## Validation

Build the engine, then run:

```sh
node scripts/test-remote-portals.mjs
node scripts/check-remote-portal-protocol.mjs
node scripts/test-remote-portal-rendering.mjs
```

The first command creates disposable world databases and assets in the system temporary
directory and starts instances on ports 3334 and 3335. Existing world data is untouched.
The second checks live avatar movement across the region boundary and rejects mutations.
The third serves a real-WebGL stereo fixture on port 3336, connected to the destination,
checking separate eye targets, parallax, renderer-state restoration and replica disposal.
Open the printed URLs to inspect the views. Stop the runners to stop their test servers.
