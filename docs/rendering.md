# Pixel rendering and world-2d

Existing worlds can switch between standard 3D, pixel isometric, and retro
orthographic rendering without reconnecting or replacing their scene.
Open **Preferences → Graphics → Rendering** to choose a view for the current
session. Choose **World default** to follow the saved world setting.
Builders can set **Default Rendering** in world settings.

Older worlds default to standard 3D. Build mode and XR temporarily use the
standard camera and restore the selected view when they finish.

## Start the village world

First install the root dependencies and configure the normal `.env` using
`.env.example`. Create an ignored `.env.world-2d` at the repository root:

```dotenv
WORLD=worlds/world-2d
PORT=3335
PUBLIC_ORIGIN=http://localhost:3335
DB_URI=local
ASSETS=local
TLS_KEY_FILE=
TLS_CERT_FILE=
```

Then run:

```sh
npm run world:2d:create
npm run dev -- world-2d
```

Open `http://localhost:3335`. The new world starts with The Crossing village,
the retro orthographic view, native Hyperfy avatars, and normal multiplayer.
`npm run world:2d` is a shortcut for the development launch command.

The named profile inherits the default `.env` configuration, including
`ADMIN_CODE` and `JWT_SECRET`, unless the profile or exported environment
explicitly overrides them. Use the same `/admin <code>` command as the default
world. A separate Git worktree needs access to that shared `.env`; it can link
the main checkout's file rather than copying or generating another admin code.
Keep configuration files private.

For direct HTTPS, use a certificate hostname in `PUBLIC_ORIGIN` and set
`TLS_KEY_FILE` and `TLS_CERT_FILE`, or omit those profile entries to inherit
the shared certificate paths. The profile loader derives HTTPS asset/API
URLs and a secure WebSocket URL from that origin.

The seed exports the shared procedural village as a GLB with native static
colliders and initializes a local SQLite world. Re-running the seed preserves
an initialized world; it refuses to seed an existing database without its
world-2d marker. To replace the village assets while preserving saved settings
and spawn, stop the server and run:

```sh
npm run world:2d:create -- --update-village
```

## Collision and recovery

The island, bridge, buildings, trees, and island boundaries have collision.
A primitive ground collider and an invisible catch floor prevent falls through
or outside the island. The village's server script checks players every
0.25 seconds and teleports anyone below Y = -5 to the world's current saved
spawn. Teleports received during avatar loading wait for the controller;
teleporting clears downward velocity and falling state.

Server scripts can read a copy of the saved spawn with `world.getSpawn()`.
See [the world scripting API](scripting/world/World.md).

## Portals

Use the existing native WorldPortal app to connect the village to another
world. Place the village endpoint inside the arch near `[0, 0.06, -5.7]`,
with scale `[1, 1.35, 1]`. Configure its destination URL and portal ID, then
create a reciprocal endpoint in the destination world using the village
URL and portal ID. Each world keeps its own saved rendering default.

Portal view cameras and clipping support perspective and orthographic views.
Saved arrival previews use a perspective endpoint camera in either mode.
Live endpoint addresses, IDs, saved databases, and assets are deployment data
and are not included in the source tree.

## Rendering behavior and limits

Pixel modes use the existing Three.js renderer and stage with a true
orthographic camera. The framebuffer fits within 1024×768 pixels while keeping
the viewport aspect ratio; a 4:3 viewport uses 1024×768. The canvas uses
pixelated presentation and the existing direct rendering path, without
composer bloom or ambient occlusion.

Isometric uses a 45-degree yaw and equal-axis foreshortening. Retro uses zero
yaw and a steeper view. Camera movement snaps to the screen pixel grid while
player physics and network positions remain continuous. Avatars turn toward
their walking direction, and compact pixel-font chat bubbles follow their heads.

## Keeping the avatar visible

Both orthographic pixel modes automatically cut an entire `.hyp` app when its
opaque geometry obstructs the local avatar. A horizontal plane stays 25 cm above
the avatar's standing height, removing geometry above the plane while keeping
lower walls and floors. The cut includes every model section and script-created
world node owned by the app, so separate roof sections and upstairs rooms are
removed together.

Separate apps inside the building, such as upstairs furniture, receive the same
cut. Containment uses visible geometry bounds in the building's local coordinates,
including its rotation and scale. An interior object's full bounds must fit inside
the building's bounds; outside objects and other placements remain complete.

Five rays cover the head, torso and shoulders, checked ten times per second.
The plane follows the player's actual elevation every frame, using the avatar's
fixed standing height rather than its animated head position so walking cannot
make the cut bob up and down. Apps return to their full shape
after the view has stayed clear for 200 ms.

Only the local player's main render applies the cut. Nodes, colliders and
geometry queries stay mounted. Other players and invisible meshes are excluded.
Glass does not trigger a cut, but glass inside a selected app is clipped along
with its other content. Lights above the plane are temporarily hidden, and model,
image, video, HTML and portal surfaces use the same plane. Standard rendering, build mode and XR
restore the scene immediately. Portal views and photos see the original scene.
Shadow maps use the complete, original geometry before the main view draws its
cut, preserving shadows from windows, walls and upper floors.

The cut also works when a building's roof and walls share one merged mesh.
Use the optional `cameraOcclusion` property in scripts or GLB custom properties:

- `null` (default): opaque geometry can trigger a cut of its entire owning app
  and interior objects.
- `true`: allow this node or its descendants to trigger the cut even when their
  materials are transparent. Nodes without an owning app clip as a subtree.
- `false`: exempt this node and its descendants, useful for large terrain.

For example, `app.cameraOcclusion = false` exempts the entire app, and
`app.get('Terrain').cameraOcclusion = false` keeps a terrain subtree visible. These flags
do not change node activation or physics. Shadows retain the original geometry.

Run `node scripts/test-camera-occlusion.mjs` and open its localhost URL to verify
the real WebGL whole-app clipping, interior furniture, lower-wall retention,
restoration and nested portal draw.

This is an experimental mesh-and-avatar mode. Photos, app-controlled
cameras, CSS3D views, touch controls, seated poses, and specialized renderers
still need dedicated compatibility checks. XR hardware has not been validated.
Sprite avatars, cinematic rendering, and animated water remain separate
experiments in [the comparison prototype](../prototypes/isometric-renderer/README.md).
