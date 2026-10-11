# Lighting optimization experiment log

Branch: `codex/lighting-optimization`.

Target: https://monstre.duckdns.org:3333/ (Évain).

## Protocol

Record an unchanged baseline before experiments. Change one variable at a time,
warm up after shader or render-target changes, then sample 30 seconds at the same
camera pose. Restore the original client state between experiments. Record the
change, frame/GPU timing, draw calls, visual limitations, and keep/reject decision
immediately after each experiment. Repeat the baseline after experiments to check
drift. Never compare results from different cameras, viewports, or quality settings.

E1–E8 are reversible diagnostic changes in one browser client; no shared world
settings/assets were edited. The initial deployed client was `/index-OTBMLGCV.js`;
its source revision was not verified against local base
`7cea6907993604cdfd0ec1dd7f1db5edb0a3c90d`. E9 validates the source implementation:
the target's existing watcher rebuilt `/index-JJUDRQKK.js` after the Stage edit,
and reconnect loaded it. Actual model methods were inspected to verify the change.
No manual deployment command, commit, or push was run.

Load `scripts/lighting-benchmark.js` in the target browser console, then run
`await lightingBenchmark.sample('baseline', 30)`. Keep the tab visible. The sampler
restores its temporary frame hooks and renderer statistics configuration afterward.
It counts complete-frame draw calls, including shadow and postprocessing passes.
CPU frame time includes synchronous GPU/driver waits, so it is not a measurement
of CPU utilization. GPU values come from unique completed timer queries in the
existing stats overlay, and can include a query from the preceding frame.

## Baseline — 2026-10-10, 19:42–19:44 America/Toronto

- Chrome 154 on macOS, Apple M1 Max / ANGLE Metal.
- Viewport: 1728 × 880 CSS pixels; drawing buffer: 3456 × 1760; DPR: 2.
- Shadows: high, three 2048² sun cascades, range 100 world units, PCF.
- Postprocessing, AO, and bloom enabled; stats overlay active; desktop, not XR.
- Day/night cycle remains active. Sun intensity is zero during this nighttime run.
- Scene: 951 mesh objects, 882 casters, 924 receivers; 871 casters disable
  frustum culling. Counts describe mesh objects/batches, not individual instances.
- Seven point lights cast shadows, adding 42 shadow views per refresh.
- Camera world position: (0.3, 2.0128566199333555, 1.4488887394336023).
  Camera basis: X=(1,0,0), Y=(0,0.9659258262890684,-0.25881904510252074),
  Z=(0,0.25881904510252074,0.9659258262890684). Camera stayed unchanged.
- Scene animations, flickering lights, and the astronomical clock remain active.
  These numbers are a stationary nighttime benchmark, not a daylight or motion test.

| Sample | Frames | FPS | Frame mean / p95 (ms) | CPU frame mean (ms) | GPU mean / p95 (ms) | Draw calls/frame | Triangles/frame |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline 2, 30.104 s | 344 | 11.428 | 87.508 / 92.400 | 87.108 | 42.306 / 51.863 | 41,157 | 53,891,630 |
| Baseline 3, 30.113 s | 344 | 11.425 | 87.530 / 92.200 | 87.139 | 42.608 / 51.544 | 41,157 | 53,891,628 |

An initial exploratory sample averaged 11.317 FPS and 88.364 ms/frame. Its GPU
accounting could count a pending query twice because the existing stats code
removes queries while iterating. The sampler now deduplicates query objects; the
table uses only the corrected repeat samples.

## Ranked hypotheses

1. Regenerating seven point-light maps plus three sun maps dominates work.
   Prediction: freezing shadow updates sharply reduces draw calls/frame time.
2. Rendering the zero-intensity sun wastes work at night.
   Prediction: disabling its three shadow updates improves timing while preserving
   the current nighttime image.
3. Sampling shadows on visible receivers is a secondary cost at DPR 2.
   Prediction: removing receiving costs gives further improvement after freezing
   map updates.

## Experiments

### E1 — Freeze all shadow-map updates (19:44:50)

- Exact change: temporarily set `renderer.shadowMap.autoUpdate = false` and
  `renderer.shadowMap.needsUpdate = false`, retaining already-rendered maps.
  No shader/render-target change; maps were already warm from baseline sampling.
- Reference: corrected baselines 2–3; same camera and settings, tab visible.
- Sample: 30.059 s, 752 frames; 25.020 FPS.
- Frame interval mean/p95: 39.967 / 41.400 ms; CPU frame mean: 39.648 ms.
- GPU mean/p95: 24.163 / 28.643 ms.
- Draw calls: 1,929/frame; triangles: approximately 2,487,922/frame.
- Frame interval improves about 54.3%; shadow regeneration accounts for 39,228
  draw calls/frame here. FPS increases about 2.19×.
- Limitation: this freezes animated-caster and moving-sun shadows too. It proves
  that map regeneration is costly, not that blanket caching is correct.
- Decision: retain as a diagnostic result; do not ship a blanket freeze. Pursue
  selective refresh/invalidation and reduce shadow views/caster submissions.
- Original renderer `autoUpdate` and `needsUpdate` restored in `finally`.

### E2 — Skip zero-intensity sun shadow updates (19:45:35)

- Exact change: for the three CSM lights, temporarily set each shadow's
  `autoUpdate = false` and `needsUpdate = false`. Point lights continue updating.
  Assert all three sun intensities are zero before starting. No shader/map rebuild.
- Reference: corrected baselines 2–3; camera unchanged and tab visible.
- Sample: 30.148 s, 366 frames; 12.140 FPS.
- Frame interval mean/p95: 82.373 / 87.600 ms; CPU frame mean: 81.955 ms.
- GPU mean/p95: 41.710 / 52.425 ms.
- Draw calls: 38,517/frame; triangles: approximately 50,364,004/frame.
- Removes 2,640 draws/frame; frame interval improves about 5.9%.
- Visual scope: nighttime only, with zero sun intensity. A production version must
  request a fresh map before the sun contributes light again; this is not a
  daylight optimization. It also needs testing around dawn and time transitions.
- Decision: promising small optimization; the point-light passes remain the
  dominant draw burden. No production source change made.
- Restored each CSM light's original shadow flags in `finally`.

### E3 — Disable receiving with maps already frozen (19:46:26)

- Exact change: freeze maps as in E1, and temporarily set `receiveShadow = false`
  on the 924 receiving Three.js mesh objects. This is a uniform/state diagnostic;
  it does not change the authored node settings or remove lights/maps/shaders.
- Reference: E1, so the only additional variable is receiving. Camera unchanged,
  tab visible; no shader or render-target rebuild needed.
- Sample: 30.068 s, 753 frames; 25.044 FPS.
- Frame interval mean/p95: 39.930 / 41.300 ms; CPU frame mean: 39.610 ms.
- GPU mean/p95: 23.652 / 28.498 ms.
- Draw calls: 1,929/frame; triangles: approximately 2,487,923/frame.
- Relative to E1, frame interval improves only about 0.1%, well below a convincing
  performance gain. GPU mean falls about 0.51 ms, but this single sample does not
  establish significance. Receiving is not the principal frame bottleneck here.
- Visual limitation: receiving disabled removes visible cast shadows from those
  surfaces. Decision: do not sacrifice receiving quality for this negligible
  observed FPS change; focus on map generation.
- Restored all changed mesh flags and renderer flags in `finally`.

### E4 — Freeze only seven point-light maps (19:56:26)

- Reconnected session camera position: (0.8900067616616624, 2.015601149329651,
  2.4586486819857547), with the same orientation, viewport, DPR, and quality.
  This differs from E1–E3, so use a fresh matched baseline, not the old FPS.
- Matched baseline at 19:55:48: 30.109 s, 333 frames, 11.058 FPS; frame
  mean/p95 90.431 / 99.000 ms; CPU frame mean 90.001 ms; GPU mean/p95
  43.560 / 53.122 ms; 41,157 draws and about 53,891,629 triangles/frame.
- Exact change: assert seven shadowed point lights, then set only their shadows'
  `autoUpdate = false` and `needsUpdate = false`. Retain existing maps. Sun
  cascades keep updating; casting and receiving remain enabled. No shader/map
  rebuild, with maps warmed by the baseline.
- Experiment sample: 30.086 s, 692 frames, 23.002 FPS; frame mean/p95
  43.474 / 46.000 ms; CPU frame mean 43.136 ms; GPU mean/p95
  25.494 / 30.854 ms; 4,569 draws and about 6,015,544 triangles/frame.
- Camera unchanged and tab visible in both samples. Removes 36,588 draws/frame;
  frame interval improves about 51.9%, FPS about 2.08×.
- All seven point lights' shadow flags restored in `finally` after timing.
- Moving-caster probe completed at 19:59:13: place the avatar inside a point
  light's coverage, warm the maps, then move its rendered pose one unit and
  rotate a nearby bedroom door pivot 90 degrees. Both changes are local render
  overrides, not player teleports or shared door-state changes.
- The avatar has five shadow-casting meshes, and both it and the door are inside
  point-light coverage. Their world transforms changed while the camera remained
  unchanged. With maps frozen, 47 frames produced zero point-light shadow faces.
  Re-enabling updates at the same changed poses produced 924 shadow faces over
  22 frames (42/frame). Cached maps cannot reflect these changed caster poses.
- An initial probe placed the avatar outside point-light coverage, so its avatar
  result was inconclusive. It was restored and replaced by the targeted probe.
- All avatar/door transforms, frame hooks, and light flags restored in `finally`.
  This is a rendering/invalidation check; a visual gameplay walkthrough and
  daylight checks remain necessary before shipping a selective cache.
- Decision: point-light map generation is the main shadow cost in this scene.
  Do not ship blanket freezing. Next test a modest refresh rate or dirty-map
  invalidation when relevant caster transforms/deformation change.
- Restored baseline at 19:59:29: 30.174 s, 307 frames, 10.174 FPS; frame
  mean/p95 98.292 / 120.400 ms; CPU frame mean 97.861 ms; GPU mean/p95
  45.403 / 53.865 ms. Repeat at 20:00:07: 30.186 s, 313 frames, 10.379 FPS;
  frame mean/p95 96.345 / 107.000 ms; CPU frame mean 96.013 ms; GPU mean/p95
  44.681 / 53.128 ms. Both restore 41,157 draws/frame and the original camera.
- Restored baseline frame time drifted about 6.5–8.7% above the starting
  matched baseline; cause not isolated. The exact percentage gain is therefore
  approximate, although the 36,588 eliminated draws and roughly doubled FPS
  strongly support the point-light map-generation hypothesis.
- Verified all seven point shadows and all three sun shadows update normally,
  avatar local position restored to (0,0,0), renderer statistics reset normally,
  and the temporary late-update override removed. No deployment or commit.
- Measurements and probe: [lighting-optimization-e4.json](./lighting-optimization-e4.json).

### E5 — Point-light shadow updates capped at 10 Hz (20:09:18)

- Fresh matched baseline at 20:08:09: 30.109 s, 326 frames, 10.827 FPS;
  frame mean/p95 92.358 / 101.100 ms; CPU frame mean 91.973 ms;
  GPU mean/p95 42.975 / 52.678 ms; 41,156 draws/frame.
- Camera back at the E1–E3 pose (0.3, 2.0128566199333555,
  1.4488887394336023); viewport, DPR, quality and postprocessing unchanged.
  Scene draw count differs by one, so compare this fresh baseline only.
- Exact change: disable automatic updates only for the seven point-light maps;
  before graphics commit, request all seven maps when 100 ms has elapsed since
  the preceding request. Sun updates and receiving remain normal. Reuse warmed
  maps between refreshes. No shader or render-target change.
- Sample: 30.174 s, 443 frames, 14.698 FPS; frame mean/p95
  68.036 / 96.600 ms; CPU frame mean 67.758 ms; GPU mean/p95
  33.380 / 48.241 ms; mean 23,398.844 draws/frame and 30,652,487 triangles/frame.
- Camera unchanged and tab visible. FPS improves about 35.8%; frame interval
  improves about 26.3% relative to the matched baseline.
- Achieved refresh rate is **7.549 Hz**, not 10 Hz: 228 refresh batches / 9,576
  point shadow faces. Actual inter-refresh mean/p95/max: 132.474 / 139.800 /
  155.000 ms. This scheduler caps requests at 10 Hz and cannot guarantee 10 Hz
  under the measured frame load. Request timing and first-face timing differ
  slightly within a frame.
- Draws alternate between 4,568 (cached) and 41,156 (refresh). Mean frame time
  improves, but the p95 remains 96.600 ms. All seven maps refreshing together
  retains large frame spikes; average FPS alone overstates smoothness.
- Moving-caster probe at 20:10:49: locally place the rendered avatar inside
  light coverage, oscillate it ±1 unit at 0.5 Hz, and oscillate the nearby door
  pivot through 90 degrees at 0.5 Hz. No shared state or gameplay teleport.
- Six-second probe: 86 frames; actual refresh rate 7.450 Hz, mean/p95/max
  refresh interval 134.225 / 142.700 / 149.200 ms. The current avatar position
  differs from its last map-render pose by up to 0.297 world units (p95 0.289).
  The door differs by up to 13.355 degrees (p95 12.993). Cache age at frame end
  reaches 113.700 ms. These are transform/refresh measurements, not a pixel
  comparison or a claim that visual quality is acceptable.
- Decision: retain as diagnostic evidence. A global cap improves mean timing,
  but synchronized refresh spikes and moving-caster lag make it a weak default.
  Next compare staggered per-light refreshes at the same rate, then relevant
  caster invalidation if lower-latency moving shadows are required.
- Light flags, getCamera probes, avatar/door transforms, and graphics/frame
  overrides restored in `finally`.
- Restored baseline at 20:11:08: 30.124 s, 318 frames, 10.555 FPS;
  frame mean/p95 94.745 / 116.400 ms; CPU frame mean 94.339 ms;
  GPU mean/p95 43.464 / 53.306 ms; original 41,156 draws/frame.
  Mean frame-time drift is about 2.6% versus the starting baseline; p95 drift
  is larger, so tail improvements should not be treated as precise.
- Verified seven point lights and three sun lights update normally, original
  camera and avatar local position restored, statistics auto-reset restored,
  and all temporary frame/graphics helpers removed. No deployment or commit.
- Measurements and motion probe: [lighting-optimization-e5.json](./lighting-optimization-e5.json).
- Reproducible runner: `scripts/point-shadow-refresh-experiment.js`, loaded after
  `scripts/lighting-benchmark.js`, then call
  `await pointShadowRefreshExperiment('E5-point-shadows-10hz', 10, 30)`.

### E6 — Staggered point shadows, one map per frame (20:15:41)

- Fresh matched baseline at 20:14:54: 30.324 s, 295 frames, 9.753 FPS;
  frame mean/p95 102.531 / 138.300 ms; CPU mean 102.227 ms;
  GPU mean/p95 46.132 / 54.756 ms; 41,156 draws/frame.
- Same camera as E5, viewport 1728×880, DPR 2, high shadows, AO/bloom enabled;
  seven warmed 512² point maps, three 2048² sun cascades with intensity zero.
  Maps warmed during the baseline; no extra warmup or camera movement.
- Exact change: disable automatic updates only for point maps. Initially phase
  their deadlines across 100 ms; each graphics commit requests the oldest overdue
  light, at most one map. Its next deadline is request time + 100 ms. No catch-up
  bursts; sun shadow updates and receiving stay normal. Restore in `finally`.
- Sample: 30.009 s, 611 frames, 20.361 FPS; frame mean/p95 49.114 / 53.100 ms;
  CPU mean 48.769 ms; GPU mean/p95 25.547 / 30.416 ms; mean 9,794.854 draws
  and 12,851,398 triangles/frame. Camera unchanged and tab visible.
- Exactly one point map / six faces refreshed each frame: 611 maps, 3,666 faces.
  Each light refreshed 87–88 times, achieving 2.908–2.911 Hz. Per-light mean
  intervals 343.474–343.825 ms, p95 360.500–373.500 ms, maximum 387.800 ms.
  Cache age at frame end reached 379.100 ms; per-light p95 ages 335.500–336.900 ms.
- FPS approximately doubles versus the starting baseline; p95 improves strongly.
  This is **not an equal-workload comparison with E5**: E5 achieved 7.549 Hz
  per light. A nominal 10 Hz request cap plus one-map budget cannot deliver
  10 Hz to seven lights at 20 FPS. Lower refresh work explains part of the gain.
- No separate motion or visual quality probe was run for E6. Measured map age
  already shows substantially longer potential moving-shadow lag than E5;
  visual acceptance remains unverified.
- Restored baseline at 20:16:33: 30.165 s, 320 frames, 10.607 FPS;
  frame mean/p95 94.281 / 115.300 ms; CPU mean 93.832 ms;
  GPU mean/p95 42.812 / 52.627 ms; original 41,156 draws/frame.
  Mean frame time is about 8.0% lower than the starting baseline: environment
  drift limits precise attribution, although the gain remains large.
- Verified all seven point maps and three sun maps have automatic updates enabled,
  no pending updates or getCamera overrides, original camera, no graphics commit
  or frame hooks, statistics auto-reset enabled, helper globals removed.
  No shared scene edits, application changes, deployment, or commit.
- Decision: diagnostic only. Smoothness improves, but approximately 3 Hz shadows
  are a poor general default for moving casters. Next test vanilla frustum culling
  on caster batches with valid bounds, retaining every-frame refresh. The existing
  871 uncullable caster objects/batches are a likely source of excessive map draws;
  verify bounds and moving-instance correctness before retaining culling.
- Measurements: [lighting-optimization-e6.json](./lighting-optimization-e6.json).
  Reproduce with `scripts/staggered-point-shadow-experiment.js` after loading the
  benchmark helper: `await staggeredPointShadowExperiment('E6', 10, 30)`.

### E7 — Vanilla instance-batch frustum culling (20:21:06)

- Baseline at 20:20:11: 30.126 s, 316 frames, 10.489 FPS; frame mean/p95
  95.342 / 110.700 ms; CPU mean 94.892 ms; GPU mean/p95 44.240 / 53.248 ms;
  41,156 draws and 53,888,049 triangles/frame. Same camera/settings as E6.
- Enable culling for 942 linked batch models. Invalidate bounding spheres initially,
  after dirty batch clean, and immediately after move (including late-update moves).
  Three.js computes bounds lazily. No shadow throttling; all maps update normally.
- Result: 30.007 s, 803 frames, 26.762 FPS; frame mean/p95 37.366 / 41.000 ms;
  CPU mean 37.034 ms; GPU mean/p95 26.915 / 30.664 ms; 9,201.929 draws and
  22,615,349 triangles/frame. Tab visible and camera unchanged. Bounds computed
  26,462 times, including dirty animated batches. Baseline warmed assets/maps;
  initial bound construction is included in the sample.
- Restored baseline at 20:21:42: 30.086 s, 323 frames, 10.734 FPS; frame mean/p95
  93.164 / 110.000 ms; CPU mean 92.769 ms; GPU mean/p95 42.152 / 52.401 ms;
  original 41,156 draws/frame. Mean drift about -2.3%.
- Decision: strongest candidate so far, preserving normal refresh frequency.
  Gain approximately 155% FPS; p95 drops about 63%. Validate bounding spheres
  after movement, resize, and removal, and verify render/moving-shadow behavior
  before retaining. No visual acceptance claim from timing measurements alone.
- Runtime model hooks, culling flags, and original spheres restored in `finally`.
  No shared edits/deployment/commit. Runner: `scripts/caster-culling-experiment.js`.
- Measurements: [lighting-optimization-e7.json](./lighting-optimization-e7.json).

### E8 — Culling plus inactive sun-map caching (20:23:00)

- Same pose/settings as E7. Disable refresh only for the three zero-intensity sun
  maps while E7 culling is active; point maps continue to refresh every frame.
- First combined sample: 30.020 s, 766 frames, 25.522 FPS; frame mean/p95
  39.182 / 44.600 ms; CPU mean 38.858 ms; GPU mean/p95 32.655 / 39.389 ms;
  6,937 draws and 19,240,522 triangles/frame. Slower than E7's first culling run.
- Repeated culling control at 20:23:44: 30.099 s, 704 frames, 23.401 FPS;
  frame mean/p95 42.733 / 47.600 ms; CPU mean 42.423 ms;
  GPU mean/p95 27.237 / 32.186 ms; 9,203 draws/frame.
- Repeated combined run at 20:24:59: 30.038 s, 714 frames, 23.767 FPS;
  frame mean/p95 42.075 / 53.000 ms; CPU mean 41.664 ms;
  GPU mean/p95 34.206 / 43.148 ms; 6,937 draws/frame.
- All samples have unchanged camera and visible tab. Maps/assets warmed by E7.
  Bounds computed 25,365 / 24,173 / 24,255 times respectively.
- Decision: leave inactive-sun caching out. Removes 2,266 draws but no consistent
  frame gain; repeat improves FPS only 1.6% within observed drift, with worse p95
  and higher GPU time. Restore original light flags and model hooks in `finally`.
- A disconnected-world notice was observed after E8; exact disconnect time is
  unknown, so E7/E8 establish rendering performance, not connected gameplay.
  Reconnected for a separate implementation/interaction follow-up.
- No deployment/commit. Measurements: [lighting-optimization-e8.json](./lighting-optimization-e8.json).

### E9 — Implemented culling, connected validation (20:26–20:30)

- Retained change in `src/core/systems/Stage.js`: enable standard linked-batch
  frustum culling; invalidate the bounding sphere on `move()` and on dirty
  `clean()` after setting the active count/resizing. Three.js builds it lazily
  for the first camera needing it; unchanged static batches reuse their sphere.
  No custom shadow cache, distance cutoff, shader change, or refresh delay.
- Reconnection loaded `/index-JJUDRQKK.js`, containing the real source change;
  runtime model methods match the implementation, with no own-property wrappers.
  Existing target watcher serves this checkout. Initial sample was named
  `E9-reconnected-baseline` by mistake, before discovering it already contained
  the change; it is recorded as **implemented-initial**, not an old baseline.
- New camera position after reconnect: (0.890006761710829, 2.015601149329651,
  2.458648680231593), same basis as E7. All E9 samples match this camera.
  Same DPR/quality/postprocessing, meshes/casters/receivers as E7. Socket open
  and no disconnected notice throughout samples/probes. No extra warmup;
  resumed scene loaded before first sample, maps warmed thereafter.

| Sample | Seconds / frames | FPS | Frame mean / p95 ms | CPU mean ms | GPU mean / p95 ms | Draws/frame | Triangles/frame |
|---|---:|---:|---:|---:|---:|---:|---:|
| Implemented initial, 20:26:41 | 30.023 / 879 | 29.276 | 34.157 / 41.900 | 33.839 | 26.420 / 29.696 | 9,164.488 | 22,571,281 |
| Same-bundle culling disabled, 20:27:34 | 30.144 / 334 | 11.081 | 90.245 / 109.700 | 89.877 | 41.731 / 53.012 | 41,156 | 53,888,056 |
| Implemented final, 20:30:02 | 30.020 / 871 | 29.021 | 34.458 / 39.100 | 34.157 | 26.452 / 29.334 | 9,194.344 | 22,615,897 |

- Final improvement versus same-bundle control: FPS +161.9%, mean frame interval
  -61.8%, p95 -64.4%. Enabled initial/final mean timing differs about 0.9%.
  Dynamic scene draw counts vary slightly; no comparison with the E7 camera.
- Moving-caster probe completed 20:28:45: 6.021 s / 182 frames. Local rendered
  avatar inside point-light coverage oscillates ±1 unit at 0.5 Hz; door pivot
  oscillates through 90° at 0.5 Hz before stage late-update clean. No shared
  teleport. 40,702 model moves immediately invalidated their spheres; 638,850
  transformed-instance sphere-containment checks had **zero failures** (1e-4
  tolerance). Selected point map refreshed all 182 frames; measured avatar X
  difference between shadow capture and main render was zero. This checks
  geometry/refresh timing, not perceptual quality during arbitrary gameplay.
- Render comparison completed 20:29:49: full-buffer RGBA readback of direct renders
  with culling disabled/enabled, without simulation ticks between renders. Current
  camera and an offset camera, at night and with local simulated daylight sun.
  Offset view is pixel-identical in both lighting conditions (nonblack images).
  Current view varies even between repeated disabled controls: mean channel
  difference 0.034831 night / 0.023078 day, versus 0.024879 / 0.016739 when
  enabling culling; maximum differences 29/17 versus 25/14. Culling differences
  stay below control-repeat magnitude; no exact equality claim for this view.
  Daylight is a correctness probe, not a daylight performance benchmark.
- Unit regressions use the real Stage/Model and patched Three.js namespace:
  off-camera rejection, separate camera frusta, late movement into/out of view,
  stable bounds reuse, growth past initial capacity, swap removal, last removal,
  empty-batch removal and reinsertion. Both new tests failed before the fix and
  pass afterward. Existing skinned selection, light and environment tests pass:
  **15 tests, zero failures**. Lint: zero errors, three pre-existing unused-variable
  warnings in Stage.js. Diagnostic script syntax/JSON/format and diff checks pass.
- Final verified state: all linked batches culled; zero uncullable casters; all
  seven point and three sun maps update normally; no pending refresh requests,
  getCamera/model/frame/graphics overrides, or diagnostic globals. Original
  avatar/door transforms, camera, light intensity/direction and rendering state
  restored. Normal AO/bloom/postprocessing enabled, stats auto-reset restored.
- Decision: retain E7 implementation. Reject E1/E4 frozen maps and E5/E6 throttling
  due moving-shadow lag; E3 receiving removal yielded no useful FPS benefit;
  E2/E8 inactive-sun caching did not show a consistent additional benefit.
  The vanilla culling change is the best measured improvement and preserves
  every-frame shadows. No commit or push; target automatically rebuilt via its
  existing watcher. No shared world settings/assets changed.
- Measurements/probes: [lighting-optimization-e9.json](./lighting-optimization-e9.json).

## Restoration check (19:47:22)

Unchanged baseline sampled again after all experiments: 30.006 s, 342 frames,
11.400 FPS; frame mean/p95 87.721 / 92.700 ms; CPU frame mean 87.340 ms;
GPU mean/p95 42.619 / 51.845 ms; 41,157 draws/frame and approximately
53,891,629 triangles/frame. Camera unchanged and tab visible. Frame-time drift
relative to the initial corrected baseline is about 0.2%.

Confirmed renderer shadow `autoUpdate = true`, `needsUpdate = false`, all three
CSM shadow `autoUpdate = true`, and all 924 receivers restored. No optimization
was deployed, no shared scene data was changed, and no commit was created.

Machine-readable measurements: [lighting-optimization-results.json](./lighting-optimization-results.json).

This early restoration checkpoint predates E4–E9. Point-light cache/rate experiments
were subsequently measured and rejected as defaults; instance-batch culling was
implemented and verified in E9. Light intensity flicker alone does not invalidate
shadow depth, but selective caster caching remains future work if further gains
are needed. It is not required to retain the measured culling improvement.

For every new entry record: exact runtime/source change, timestamp, baseline used,
warmup and sample duration, unchanged-camera/visibility checks, mean and p95 frame
time, FPS, GPU timing, draw calls and triangles, visual tradeoffs, restoration, and
the decision. Do not claim a shipping improvement from a diagnostic-only change.
