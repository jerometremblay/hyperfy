# Validation — 2026-10-20

Target: this checkout's Hyperfy 0.16 fork and its existing built server/client.

- 14 Node tests passed. These cover dimension/spacing/ID invariants, malformed
  inputs, overlapping placements, a head-on impact, rebound, pocket capture,
  stopping, a maximum-speed break, deterministic spin shots, exclusive ownership,
  stale/duplicate requests, distance/disconnect/lease release, two synchronized
  clients, late join, delayed local-player initialization, idle network silence,
  package hashes, source/preview identity, native import/export round-trips, actual SES execution, and app isolation.
- Client tests construct the real Group, Prim, Action, UI and UIText classes.
  They do not mock their property setters. Rendering and world activation are
  disabled in this test harness; browser acceptance is separate below.
- The actual `.hyp` script ran in the real engine sandbox. Browser acceptance
  used an isolated local world seeded with the exact package assets/blueprint.
  E entered the overhead camera, arrows changed aim, Space sent a shot and displayed moving balls, R restored the rack, and Escape restored the normal world camera.
- The exact-package offline viewer was inspected from front, back, left, right,
  top and isometric views. The six PNGs are in this directory. Ball centres and
  play dimensions are checked numerically by the tests.
- Every embedded asset is checked against SHA-256, declared length and script
  MIME. All 17 assets also resolved byte-for-byte through the real Hyperfy HTTP asset route. The preview embeds the exact final package bytes.
- The Hyperfy authoring skill's own self-test passed.

The stock authoring smoke harness lacks Vector3/Quaternion/Euler, which the target
runtime provides. Its unmodified preflight fails with `Vector3 is not defined`.
`npm run validate` copies that harness to a temporary directory and supplies the
actual installed Three.js math classes. It checks the final JS, .hyp and source
ZIP without changing the shared skill. Real-node tests and real-world execution
remain the stronger runtime checks.

The default test-world environment emits a particle worker error in this browser
and GLTF texture/cooking warnings on server startup. The pool script itself loads
and runs. No engine-wide fix is included for those baseline environment messages.

Not established: physical correctness for every simultaneous/grazing contact,
certified WPA pocket geometry, two independent live browser sessions, mobile/XR
play or UI drag/drop import. The house-table fit was subsequently verified below.
The two-client checks use the real distributed script in separate JS contexts.


## House-table overlay

- 17 tests pass, including artist-model sphere removal, clear cloth geometry,
  regulation nose-to-nose scale, level surface alignment, native table click
  routing, and the fitted camera's world-space position and view direction.
- Live table source was deployed through its established worldsync mapping.
  Its placement was kept, its horizontal scale updated, and a separate pinned
  game instance placed 1 mm above the felt with the practice surface hidden.
- Verified live: native Play pool entry, low angled view beneath the lamps,
  a server-owned break visible on the furniture, and Escape release. The live
  screenshot is `../overlay/live-play.png`.
- All 17 game assets were uploaded through the supported Agent API asset route
  and verified by their content hashes. Original table source and placement are
  backed up under `overlay/`. No Git commits were created.

The final overlay blueprint and entity were also found in the saved local world
SQLite database, with the script hash matching the live deployment.

## Original upstream table replacement

- 20 tests pass, including pinned model hashes, GLB loading, original material
  retention, finite metric bounds, level cloth, grounded supports and interaction.
- Original `p8.min.gltf` and its binary buffer are converted to a 67 KB GLB.
  Original pocket shapes and material colors remain. Four plain support legs are
  added because the upstream asset contains only the tabletop.
- Inspected front, back, left, right, top and isometric exact-asset views; the
  screenshots and standalone preview are under `../upstream-table/`.
- World 3333 furniture blueprint version 19 uses the new model and action script,
  with unit entity scale and the original position/orientation. Game blueprint
  and entity are preserved. Supported worldsync deployment and API read-back pass.
- Verified in the live room: imported blue table, native click entry, cue-ball
  placement, a moving shot and Escape release. See `../upstream-table/live-play.png`.

## Held-cue aiming and immediate release

- 25 tests pass. New coverage uses the actual rack source and server game on a
  shared local event bus: no-cue denial, forged pickup/drop identities, remote
  ownership, return cancellation, low camera and cue endpoint geometry, a late
  observer's cue pose, delayed-network input release and non-staling aim packets.
- The trajectory-line primitive is removed. Aiming uses the existing held cue,
  with its chalk tip behind the selected ball contact; no duplicate cue is drawn.
- Game and rack scripts are deployed in world 3333 through the supported Agent
  API. Read-back matches the exact prepared script bytes. Rack source and channel
  are synchronized to the world-source repository. Other scene objects are untouched.
- Live browser check: clicked a wall cue to hold it, clicked the table to enter
  the low behind-ball view, struck, then moved sideways in normal third person
  while the balls continued rolling. X returned the cue; clicking the table then
  showed the cue-required message without taking the camera.
- Screenshots: `../cue-rack/aiming-live.png`, `after-shot-live.png`,
  `moving-after-shot-live.png` and `cue-required-live.png` in that directory.
- The camera evokes a crouched viewpoint. No avatar posture or custom emote is
  applied. Original furniture and rack geometry remain unchanged.

## Mouse orbit, outside stance and follow-through camera

- 28 tests pass. New geometry checks cover a full 360-degree orbit from nine ball
  positions on both 8-foot and 9-foot surfaces, including the native player's
  30 cm capsule clearance. The avatar stays behind the cue's butt and faces the shot.
- Mouse deltas orbit the actual cue-ball centre; the camera ray intersects that
  centre. Native player teleport calls update the aiming stance at up to 20 Hz,
  only when position/orientation changes. Floor height is preserved.
- At a strike, movement captures end immediately. A camera-only follow-through
  retains the exact last orientation and pre-strike focus, with the nearest native
  third-person zoom of 0.3 m behind the stance. The camera never follows a moving
  ball. Tests verify mouse look, walking camera offsets and Escape cleanup.
- Live world 3333 game blueprint v4 was checked with a new verification client:
  held-cue pickup, mouse orbit, an API read-back proving the avatar capsule was
  outside the rails, preserved post-shot direction, sideways walking and mouse
  look in the follow-through. Cue returned and verification client closed.
- Screenshots: `../cue-rack/orbit-aiming-live.png`, `orbit-after-shot-live.png`,
  `orbit-free-look-live.png`. Numerical/native acceptance is recorded in
  `../cue-rack/orbit-acceptance.json`.
- Existing avatars were never teleported. No engine source or server process
  changes were needed; deployment changes only the existing game script.

## Smooth pullback

- 29 tests pass. The follow-through begins at the exact aiming camera pose and
  zero zoom, then eases position and zoom to the existing third-person endpoint
  over 0.45 seconds. Orientation and pre-strike focus remain unchanged.
- The motion test checks intermediate views, monotonic movement, no initial
  jump, no overshoot and matching endpoints at 30, 60 and 144 frames per second.
  Movement keys are free throughout the transition.
- World 3333 game blueprint v5 uses the final script. Agent API read-back and
  exact asset-byte verification pass. This change leaves the rack script intact.

## Player-centred third-person return

- 30 tests pass. The return endpoint now matches standing PlayerLocal camera
  placement: avatar height minus head-to-top distance, 30 cm over the right
  shoulder, and the existing closest third-person zoom.
- The ball determines the initial look direction, never the camera's location.
  During the smooth return it can refine that look direction from current ball
  snapshots; manual mouse look takes priority. At the endpoint the camera orbits
  and follows the player normally. There is no stored ball-centred focus.
- Tests cover actual avatar eye-height inputs, shoulder radius, independent ball
  movement, normal mouse orbit and translating the camera with the player.
- World 3333 game blueprint v6 was checked live: aim, strike, completed shoulder
  view and sideways walking. See `../cue-rack/player-centered-after-shot.png`.
  The verification client's cue was returned and its browser client closed.

## Native player mode and cue-only Play (2026-10-20)

- Removed the custom post-shot camera, mouse orbit and scroll capture entirely.
  Shooting releases all game controls immediately, even before a server response.
  Native PlayerLocal owns movement, camera zoom and camera collision afterward.
- Three native Play actions cover the full cloth and rails within Hyperfy's
  one metre action targeting radius. All are disabled without a held rack cue;
  direct cloth/ball clicks silently return without warnings when empty-handed.
- 29 automated tests pass, including full-control release through 25 seconds of
  simulation, explicit next-shot activation, late player startup, cue pickup/drop,
  and a grid covering the complete table surface. JS, HYP and source ZIP preflight
  pass with native math and event API stubs supplied to the authoring smoke harness.
- Supported API deployment verified exact game script bytes at v7, table script
  at v20, and unchanged rack v1. Local world 3340 restarted with the new assets.
- Live world 3333 verification used a separate temporary browser/player: take cue,
  click empty cloth to aim, Space to shoot, observe normal third-person avatar,
  then walk and use native zoom. No game HUD or aiming camera remained after shot.
  Returned that cue and closed the verifier. Wall collision is delegated to native
  Hyperfy; no additional wall sweep test was performed.

## Closest native shot handoff (2026-10-20)

- Reproduced the missing handoff seam: the app released its control while native
  PlayerLocal retained its old zoom (initially 1.5 m, potentially up to 8 m) and
  pitch. Added a local desktop-only `player.setCamera({target, zoom})` API that
  updates the native eye/shoulder view once and exits first-person mode.
- A strike sets native zoom to 0.3 m and looks at the world-space pre-strike cue
  ball, accounting for the shoulder offset and actual zoom. It then releases all
  game controls as before. No ball tracking or custom post-shot camera returns.
- Added native regressions for distant-to-close zoom, exact target alignment at
  several angles, no player movement, invalid inputs and XR rejection. Updated
  the existing seated-camera fixture to supply the real PerspectiveCamera used
  by the native near-plane logic. Native camera tests and all 29 game tests pass.
- Rebuilt the engine client; remote and local HTML reference the same new client
  bundle. World 3333 game v8 and its script bytes were verified via the Agent API.
- A fresh live verifier picked up a cue, aimed from empty cloth and shot. The
  resulting normal shoulder view is close and frames the shot/table. Movement
  remained available. Returned verifier cue and closed its browser client.
  Screenshot: `../cue-rack/closest-native-after-shot.png`.
- Existing clients must reload to obtain the new native camera API.

## Animated native return (2026-10-20)

- The game's native camera handoff now requests a 0.45-second smoothstep return.
  PlayerLocal starts from the currently visible aiming pose and blends position,
  orientation and zoom to the normal close shoulder view. Walking offsets move
  with the player; mouse input continues to update the native destination.
- Native collision/portal zoom checks run during every animation frame. The game
  releases its own controls immediately. The transition clears at its endpoint,
  and teleports/portal traversal cancel it.
- Native tests cover intermediate poses, no initial snap, exact completion at
  30/60/144 FPS, walking and collision clamping. All 11 native camera/player tests
  and 29 billiards tests pass. Engine build and package preflight pass.
- Game v9 and exact script bytes deployed through the Agent API to world 3333.
  The updated engine client is served live; existing tabs require a reload.

## Play visibility and fresh-shot spin (2026-10-20)

- Game and visible table share client-local aiming state, including startup
  requests. Both ball and furniture Play actions hide during aiming and return
  after leaving/shooting. Furniture clicks are ignored during active aiming.
- Each successful new aiming session sets both top and side to zero before
  sending its first aim update.
- All 30 billiards tests pass, including an integrated game/furniture regression
  for action hiding, ignored duplicate clicks, exit/shoot restoration and spin
  reset. Deployed and verified game v10 and furniture v42 through the Agent API,
  preserving current live cloth selection and model.


## Spatial impact sounds (2026-10-21)

- Server snapshots now carry physics time and batches of cue-strike, ball-collision,
  cushion and pocket events. Each event has a monotonic ID, immutable local impact
  coordinates and incident speed. Re-racks carry a new generation.
- Clients consume events against the same interpolated physics time as ball
  positions. Duplicate packets, late-join history, queued effects from old racks,
  effects beyond 15 m, and effects over 120 ms behind displayed physics are skipped.
- Native spatial SFX nodes support up to 24 overlapping effects with strength-based
  volume. Nodes remount after repositioning so their initial panner transform is
  correct. Four original synthesized 0.3-second mono MP3s are packaged and preloaded;
  native audio file fields allow replacements. No engine changes are required.
- All 36 billiards tests pass, including six new event/timing/multiplayer tests.
  Tests use real native node properties with a mocked browser audio backend.
  Package byte hashes, audio props, preload flag and native import/export pass.
- Script, HYP and source ZIP authoring preflight pass. FFmpeg decodes all four MP3s
  without errors; each is 44.1 kHz mono. `git diff --check` passes.
- No live-world deployment or in-world listening test was performed. Playback is
  frame based; sample quality and perceived synchronization still need listening
  in the target world. Existing browser gesture requirements apply.


## Original Tailuge OGG sounds (2026-10-21)

- Replaced all four synthesized MP3 defaults with the unmodified upstream
  `cue.ogg`, `ballcollision.ogg`, `cushion.ogg` and `pot.ogg` from pinned commit
  b23b1d9f0da103783f70fa48a6c6f7f288290d9e. Removed the synthesized samples and
  generator. `sounds/provenance.json` records verified Git blob and SHA-256 hashes.
- All four files are stereo Ogg Vorbis at 48 kHz, under 0.15 seconds each, within
  the existing 0.5-second voice lifetime. No transcoding or timing changes.
- A localhost browser check decoded each original with AudioContext.decodeAudioData:
  cue 0.0680 s, collision 0.0773 s, cushion 0.1200 s, pocket 0.1440 s.
  This confirms browser decoding; no in-world listening test was performed.
- All 37 tests and script/HYP/source ZIP preflight pass. A package regression
  verifies exact original asset bytes, OGG URLs, MIME types and Git blob hashes.
- Deployed pool game v12 to the configured 3333 world through the Agent API.
  Read-back verified all five uploaded assets byte for byte, audio props,
  preload flag and preserved table settings. Receipt: `sounds/deployment.json`.


## Cue-ball placement orbit and WASD (2026-10-21)

- Scratch placement retains the same mouse and left/right-arrow orbit and
  elevation controls as aiming. WASD moves the real white-ball mesh relative to
  the view at 0.5 m/s, with normalized diagonal movement and existing rail limits.
  The camera and outside-rail avatar stance follow the selected position.
- Placement remains a local preview until Space commits through existing server
  validation; Escape cancels it. Spin inputs are inactive while placing. A new
  placement starts at the standard cue-ball spot. Confirmation drops buffered
  scratch coordinates so the ball does not flicker back into the pocket.
- All 40 billiards tests pass, including three placement tests for orbit without
  translation, WASD directions under a rotated table, diagonal speed, rail bounds,
  confirmation without a positional jump, continuing aim and Escape cancellation.
  Script/HYP/source ZIP authoring preflight and `git diff --check` pass.
- Deployed game v13 to the configured 3333 world through the Agent API. Read-back
  verified exact script/audio asset bytes, props and preload. Existing table
  settings and original OGG sounds were preserved. No in-world manual test or
  commit was performed.


## Visible table sound-volume setting (2026-10-21)

- Added the native table-settings range `Sound volume (1 = normal)`: 0 to 5 in
  0.1 increments, default 1. Table-local channel events set the game audio gain,
  with startup request/response supporting either app initialization order.
- The multiplier preserves impact-strength/type balance, updates active voices,
  and affects future sounds. Zero mutes; 1 restores the prior volume. Only the
  furniture reloads on settings changes, leaving server pool physics running.
- All 41 billiards tests and script/HYP/source ZIP preflight pass. The new
  integration test covers both startup orders, 3x boost, mute/restore, maximum
  clamp and channel isolation. `git diff --check` passes.
- Deployed game v14 and visible table v70 to 3333; verified script and audio
  bytes, table props/model, and game preload. Preserved live orange cloth color
  (#d77939) and all existing table props. Volume remains 1 for the user to adjust.


## Immediate spatial audio initialization (2026-10-21)

- Fixed native Audio panner initialization: position and orientation now use
  setValueAtTime at the current audio time before a newly created source starts.
  New and reused impacts no longer ramp from the default world origin. Later
  movement retains the existing one-frame interpolation; legacy panners and
  non-spatial playback retain their existing paths.
- Native regression reproduced six startup ramps before the fix. All three
  native Audio tests now pass, covering initial position/orientation before
  start, reused sources, continued movement smoothing, and legacy/non-spatial
  paths. All 41 billiards tests and `git diff --check` pass.
- Production engine build succeeded. Verified 3333 serves the exact new client
  /index-UZS4XNUX.js (SHA-256 cded07c85895ff4db746d0fdba46bbbbd41136c8b0aded07312ab1ea58dda6ed),
  whose source map contains the fixed Audio source. Existing clients must reload.
  No in-world listening test was performed; volume and samples were unchanged.
