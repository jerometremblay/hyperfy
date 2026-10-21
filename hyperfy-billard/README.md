# Hyperfy Billard

A portable, server-owned pool practice app for this Hyperfy 0.16 fork. One `.hyp`
contains the physics code, renderer adapter, numbered ball textures and empty GLB
bootstrap. The physics needs no external service or runtime downloads. The close,
animated camera return uses this fork's native player camera API.
Playing requires a held cue from the companion rack (`cue-rack/rack.hyp`). The
installed world uses its existing four-cue rack, with the same pickup/return flow.

Based on [tailuge/billiards](https://github.com/tailuge/billiards), the original
open-source pool project by tailuge and contributors. The physics solver and
original table model are adapted from that project under GPL-3.0. See
[third-party attribution](THIRD_PARTY.md) for the pinned revision and changes.

## Run

Use this directory inside the Hyperfy checkout, with its existing npm dependencies
and engine build available:

```sh
cd hyperfy-billard
npm run build
npm test
npm run validate
npm run preview
```

Open http://localhost:3340. The preview command starts the **real Hyperfy server**
with its own `.local-world` database and assets. It creates a plain play surface at
0.762 m above the default ground, with a cue rack beside it. It never reads or changes the
house world. `BILLARD_PORT=3342 npm run preview` selects another port. Stop the existing preview before changing ports, because the isolated database is shared. Ctrl-C stops
it. This command requires the parent's `build/index.js` and `build/public` files;
run the parent's normal build first if these are missing.

`dist/preview.html` is a separate, offline geometry viewer. It executes the exact
packaged script and reads the exact packaged PNGs. It supports six inspection
views and orbit/zoom. It does not emulate multiplayer gameplay.

## Controls

Point at a cue on the wall rack and click, or hold **E**, to take it. **X** returns
it to the rack. Then click the table, or point at it and hold **E**, to aim. The
server checks actual rack ownership before granting controls and again on each
shot/place/reset. Pickup and return identify players from the transport sender.

The aiming camera starts 68 cm behind the cue ball and 14 cm above its centre.
Mouse movement orbits that ball and changes aim; vertical movement changes the
viewing elevation. The avatar moves around the outside of the rails, behind the
cue's butt, with clearance for its full collision capsule.
The actual held 1.47 m cue aligns behind the
ball, including spin offsets; other players see its aiming pose too. There is
no trajectory line. This is a low camera view; it does not replace the avatar's
standing animation with a custom crouching animation.

- Mouse or left/right arrows: turn aim. Up/down: change shot speed (0.1–5 m/s).
- W/S: top/back spin. A/D: side spin. Offset is limited to 0.45 ball radii.
- Space: shoot, return the cue to the hand and release all game camera/input
  controls immediately. The native player camera resumes at its nearest third-person
  zoom (0.3 m) with a 0.45-second eased motion, looking toward the cue ball at
  the instant of the shot. Normal mouse
  look, movement, zoom and wall collision remain active; no ball tracking follows. Click Play on the table again for your next shot.
- After a scratch: arrows move the transparent cue-ball marker; Space places it.
  The server rejects occupied or out-of-bounds positions.
- R: re-rack while stopped. Escape: release the camera and movement controls.

Other nearby players see the same balls. One player owns the controls at a time.
Leaving the area, disconnecting, or letting the 60-second lease expire frees the
table. Returning the cue also cancels aiming. A client renews the lease every
15 seconds while aiming. Each accepted strike releases ownership. Balls continue
moving after their shooter leaves. A server restart or blueprint rebuild starts
a fresh rack; in-progress practice is not persisted.

## Fit it to an artist's table

The app origin is **the centre of the cloth surface**, with +Y up, +X along the
long rail and -Z forward. Use scale `[1,1,1]`, keep it level, and position/rotate it
independently of the furniture. The editor offers WPA 9-foot (2.54 × 1.27 m) and
8-foot (2.3368 × 1.1684 m) playing surfaces. These are nose-to-nose dimensions,
not the furniture's exterior size. Balls have 57.15 mm diameter and 170 g mass.

Turn **Show practice surface** off to retain only the simulated balls and controls.
For another artist's table, hide its static balls and align the overlay before
combining them. The installed house table now uses the original Tailuge model,
as described below.

### Installed house overlay

The game and original Tailuge table are deployed in the online 3333 world.
`overlay/fit.json` records its exact placement and regulation 8-foot dimensions.
The table's position and orientation are preserved.
The previous custom artwork was replaced with upstream `dist/models/p8.min.gltf`
from the same pinned revision as the physics. It is converted to a self-contained
Y-up GLB, with its end sections translated to fit the 8-foot surface while retaining
the original pocket sizes. The cloth is at local Y=0.708 m. The upstream asset is
a tabletop; four plain support legs are added to ground it. Entity scale is `[1,1,1]`.
Native Play actions cover the entire table surface and route clicks/E to the game.
They appear only while holding a rack cue; empty-handed clicks do nothing.

Run `node upstream-table/build.mjs` followed by `npm run build` to rebuild the
table and combined preview. `npm run preview:overlay` uses the original model and
fitted game in the isolated local world. `upstream-table/deploy.mjs` defaults to
a read-only plan; `--apply` uses the configured Agent API and existing worldsync
mapping. The old `overlay/deploy.mjs` entry point delegates to it. Deployment IDs
remain under `overlay/`; model provenance, backups, exact-asset preview, screenshots
and current verification are under `upstream-table/`. The world-source repository
also contains the replacement GLB and interaction script. The game app is separate.

Enter through the table's Play action or click the table. Escape leaves.
As with any in-world camera, other avatars can walk in front of the view.

`cue-rack/deploy.mjs` defaults to a read-only plan; `--apply` updates only the
existing rack and game scripts through the supported Agent API and verifies their
exact script bytes. The rack source is also maintained in the world-source repo.
`cue-rack/live.json` and its screenshots record the current aiming-flow acceptance.

## Physics choice and limits

Reuses [tailuge/billiards](https://github.com/tailuge/billiards), pinned to
`b23b1d9f0da103783f70fa48a6c6f7f288290d9e`. The headless subset retains its ball
motion, sliding/rolling friction, spin, collision throw, Han-blend cushion
response, rounded pocket jaws, and pocket capture/fall code. The adapter supplies
standard surface dimensions and ball mass/radius, a fixed 1/480-second step, and
bounded inputs. Ball collision restitution is upstream's **0.925**, not 1.

This is a numerical model, not perfect physical truth. Upstream detects predicted
end-step overlaps; it is not an exact event-time solver. Small steps and bounded
speed reduce missed contacts but do not prove every grazing or simultaneous
contact. Pocket circles/jaws retain upstream proportions; they are not a certified
WPA pocket cut. The six black disks on the practice surface mark capture zones.
The app provides no jumps, masse/elevated-cue shots, full 8-ball foul/win rules,
VR cue tracking, tournament scoring, audio, or durable match persistence.

The server alone advances physics. Clients render snapshots at up to 20 Hz with
100 ms interpolation. All connected clients receive the normal Hyperfy app
broadcast; ball rendering stops beyond 15 m. Interest-managed network delivery
would need a later engine feature. The current desktop camera/controls are tested;
mobile/XR input is not provided.

The alternative [3d-pool-physics-simulation](https://github.com/iamyoussef2005/3d-pool-physics-simulation)
was inspected, but no license file was present. Tailuge already offered a reusable,
licensed billiards model. This implementation does not replace its equations with
a new generic rigid-body engine.

Dimensions source: [WPA Recommended Equipment Specifications](https://www.wpapool.com/wp-content/uploads/2024/01/RECOMMENDED-EQUIPMENT-SPECIFICATIONS.pdf),
sections 5 and 16. The 8-foot specification here is the WPA 92 × 46 inch surface,
not the common domestic 88 × 44 inch surface.

## Validation and licensing

See `validation/REPORT.md` for executed checks and boundaries. Run `npm run build`
before `npm test`; tests exercise the distributed script as well as source physics.
Source and vendor notices are included in `dist/hyperfy-billard-source.zip`.

GPL-3.0-only. See `LICENSE` and `THIRD_PARTY.md`. Do not remove upstream notices
when distributing the `.hyp`; provide the accompanying source archive too.

The close shot handoff requires this fork's local `player.setCamera({target, zoom})` API. Reload clients after updating the engine build.

Play is hidden while aiming. Each new aiming session resets top and side spin to zero.
