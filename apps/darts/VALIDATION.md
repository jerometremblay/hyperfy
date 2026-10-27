# Validation

`npm run test:darts` passes all 16 focused checks: analytic flight and boundary
termination, every scoring segment/ring, duplicate and invalid commands,
countdown bust/double-out, Cricket, Count Up completion, multiplayer turns,
disconnects, input semantics and frame-rate independence. The shipped script
also executes against this checkout's actual Hyperfy primitive, UI, action and
light constructors.

The free-stance checks cover changed physical flight from different player
positions, throws beyond the former range limit, safe floor misses when looking
away/sideways or standing behind the board, and server rejection of forged shot
origins. The native client check preserves camera position, rotation and zoom;
WASD and wheel input remain uncaptured, including after moving beyond six metres.

The final build verifies all three packaged assets byte-for-byte and hashes
their exact bytes. The preview reads the packaged `.hyp`, including its artwork
and script. Front, back, left, right, top, isometric and board close-up views
were inspected; screenshots are in `outputs/darts/`.

An isolated Hyperfy server loaded the initial package. Two independent browser
players joined and started Count Up. The first player scored three physical
hits for 9; Space advanced the turn; the second player scored 3 independently.
Both score displays synchronized. Closing the active player's browser removed
that player and safely transferred the turn. Esc restored the native action
and normal world controls. A fresh idle server profiler sample reported
0 ms/s script CPU and no update callbacks. No app errors appeared in the
browser console; two existing sandbox-intrinsic warnings appeared on startup.
The snapshots and profiler sample are in `outputs/darts/browser-check.json`.

The repository skill's older `validate_result.py` smoke harness fails on its
missing `app.configure`, `Vector3` and player APIs. Its result is not a runtime
failure: the actual-node tests and real Hyperfy browser checks above exercise
the packaged app. The old validator has not been changed.

The approved deployment registered the generated object in
`hyperfy-world-jerome`, its `local-world` scene and the `online-world` destination
map. The station is live beside the cue rack on 3333. All three live asset hashes
match the package; unrelated apps, placements, settings and spawn are unchanged.
In the live browser, Space started Count Up and a default throw scored 3; aiming
right and throwing scored 10, bringing the score to 13. Both impacts match the
standalone ballistic engine exactly. The live snapshots, profiling reports and
screenshot are in `outputs/darts/live-*`.

Fresh live samples before playing and after Esc reported 0 ms/s client and server
script CPU, no script callbacks, and no Hyperfy physics bodies or colliders.
The test browser left the match and disconnected; the station returned to an
empty lobby. Temporary client/server profiler requests were released.

The live world also logged errors in other startup scripts and in native video
and portal mounting. The startup error line numbers fall outside executable
darts code after accounting for the current script wrapper, and darts creates
neither video nor portal nodes. These unrelated errors were not changed.

No commits were created.

After removing the fixed stance and camera, the updated package was deployed
through the same mapped station and all three live asset hashes were checked.
In the live browser, the avatar remained visible in third person when joining.
Native S movement changed the local stance from `[-0.4, 0, 3.5]` to approximately
`[-0.577, 0, 5.050]`, then to `[-0.666, 0, 5.825]` during the match. Wheel input
changed the camera zoom normally. Both throws were accepted beyond the old
five-metre server limit, and their different release positions and impacts
matched the standalone model using the authenticated player's actual stance.
The current evidence is `free-stance-browser-check.json` and
`free-stance-live.png` in `outputs/darts/`.
After Esc, the updated game again reported zero idle client/server script CPU
and no callbacks, bodies or colliders (`free-stance-idle-profile.json`).
The installed source and live version 1 script match the final package exactly.
The test browser disconnected and the station returned to an empty lobby.

The right-arm update adds four Mixamo rotation tracks and an emote overlay in
the actual avatar runtime. All 18 darts checks and 30 avatar/player regression
checks pass, including a real VRM with walking and head look: hips, legs, head
and left hand match the unmodified walking avatar while the right hand moves.
Cancellation, repeated one-shot playback, wind-up duplicates, moving before
release, disconnects and reset are covered. The production build passes.
Four packaged asset hashes now include `throw.glb`.

In the isolated browser, the avatar threw while moving backward; the game
recorded the wind-up, then launched once from the updated stance. The trace is
`throw-local-trace.json`, with a screenshot in `throw-local.png`.
The same station is deployed at live blueprint version 2 and all four asset
hashes were read back. Fresh idle client/server samples were zero with no
callbacks, bodies or colliders (`throw-live-idle-before.json`). A final browser
reload loaded the new runtime. Another player started a match during the live
check; the test browser watched without resetting or interrupting that match.
After the station returned to an empty lobby, the test browser also completed
a live throw while walking backward in third person (`throw-live.png`).
Its persisted impact and duration match the standalone physics exactly
(`throw-live-check.json`). The test player left and the station returned to an
empty lobby. Fresh post-test server CPU is zero; the test client's callback
breakdown is empty, with no bodies/colliders. The displayed client CPU retains
0.0073 ms/s from its smoothing window (`throw-live-idle-after.json`).
All temporary profiling requests were released and the isolated server closed.

ESLint still reports 15 errors in `PlayerLocal.js`; the same 15 rules fail on
the unchanged HEAD version. The new arm helper has no lint errors.

The score panel is now centered within the cabinet below the dartboard, with
the play label underneath. All 18 darts checks pass and the four packaged hashes
are verified. The exact package was inspected from six directions, then deployed
through the existing mapped station. Live asset hashes match; unrelated apps,
placements, settings and spawn are unchanged. The live screenshot is
`score-integrated-live.png`; six package views are `score-integrated-*.png`.
The temporary viewer closed without joining or changing the match.

The pub remodel replaces the thin back panel with a 0.9 m wide, 2.27 m high
walnut and green cabinet, brass trim, a lit marquee, framed playing compartment,
recessed score console and service door. The dart face keeps its original
height, position and normal; the gameplay and arm animation are unchanged.
All 18 darts checks pass against the final package. Four front surfaces are
numerically clear of cabinet geometry, and the base meets local Y=0.
The final package was inspected from all six directions
(`pub-cabinet-*.png`); the preview now renders UI borders, text alignment and
emissive materials used by the package.

The same mapped live station is at version 4, with all four asset hashes
verified and unrelated world resources unchanged. The live depth check and
final screenshot are `pub-cabinet-live-depth.png` and `pub-cabinet-live.png`.
Fresh server samples before and after the update are zero; the new client
sample is also zero, with no callbacks, bodies, colliders or shadow casters,
42 meshes, 630 triangles and one light (`pub-cabinet-idle-*.json`).
Temporary profiling and browser sessions were released without joining the
match. The older skill smoke harness still stops at its missing
`app.configure`; the actual Hyperfy constructor checks and live browser pass.

The standalone package was rebuilt and all 18 darts checks pass.
This checkout's native `importApp` and `ClientBuilder.addApp` were executed
against the exact `.hyp` in an isolated upload/entity harness. All four embedded
asset hashes match. Import uploads/caches those four assets, creates one fresh
blueprint and one separate instance with empty match state, and completes the
normal upload lifecycle without entering scene replacement.
The report is `standalone-import.json`. This check does not add a duplicate
station to the live world.
