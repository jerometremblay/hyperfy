# Remote portal previews

World Portal can show a live destination on another updated Hyperfy instance.
Configure its destination world URL and portal ID as before. An empty portal ID
previews the destination spawn. Crossing still navigates to the destination URL.
Older worlds remain valid travel destinations but do not supply a 3D preview.

The client downloads the destination's entity data, blueprints, scripts and assets,
and reconstructs a separate scene. It executes client scripts to create procedural
prims and animate content. Remote avatars and scene edits arrive live. Each XR eye
has its own camera and render target, using the same parallax and clipping path as
internal portals. Preview resolution and update rate remain independently configurable.

The scene uses the destination's synchronized world clock, location, daylight cycle,
time offset and transitions. Sky apps provide its HDR, fog and fixed sunlight settings.
App lights also render. Remote shadows, remote voice/audio, CSS WebViews and nested
portal previews are omitted. These omissions do not affect ordinary destination travel.

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
