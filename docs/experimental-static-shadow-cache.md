# Experimental cached fixture shadows

Branch: `codex/experimental-static-shadow-cache`. No commit or push is required
to try the experiment.

Enable **Cache fixture shadows (experimental)** in Graphics preferences. It is
off by default and applies only to this browser. Turn it off for the normal
renderer comparison; no reconnect is needed. Build mode uses normal shadows.

The client generates point/spot shadow maps with the existing Three.js renderer
and retains them in GPU memory. Stable maps generate no further shadow faces.
Surface lighting and shadow sampling still happen every frame. The textures
are regenerated after a reload; they are not stored in browser storage.

## Scene changes

- Observe the scene for 500 ms before enabling the cache.
- Exclude avatars, skinned meshes, morph-target meshes and known wind materials
  from fixture captures. Their ordinary casting flags are restored before the
  main render, so sun shadows remain dynamic.
- Remove moving props from the fixture maps once. Restore their contribution
  after 500 ms without a transform/geometry change.
- Track instance transforms individually. Moving one instance does not remove
  the stationary instances in its batch.
- Add late assets after they settle, and remove deleted or hidden casters.
- Fall back to normal shadows for moving lights, then cache them after settling.
- Keep color, brightness and switches live without invalidating shadow depth.
- Respect the existing texture budget. A suppressed fixture keeps its pending
  capture until it becomes eligible again.
- Reset on renderer context restoration and shadow-type changes.

Capture uses a reusable 1×1 target and an unlit override for the otherwise unused
color pass. This gives Three.js its normal rendering context for generating the
shadow maps. Other lights' shadow updates are suspended only during that capture,
then restored before the normal main/composer render. Portals are suppressed
during the capture; XR is temporarily disabled for the offscreen pass.

## Validation

```sh
node --test src/core/extras/CachedLightShadows.test.mjs \
  src/core/nodes/Light.test.mjs src/core/systems/ClientGraphics.test.mjs \
  src/core/extras/shadowBudget.test.mjs src/core/systems/Stage.test.mjs
node scripts/test-light-shadows.mjs --cached
```

Open the printed localhost URL for actual WebGL checks and an automatic
normal → cached → normal workload comparison. It exercises `ClientGraphics`
direct rendering and the real postprocessing composer, uses six point-shadow
faces, compares rendered pixels, verifies avatar exclusion and sun updates,
and checks moving instances and their restored bounds.

The synthetic workload has 400 static meshes, five point lights, one spotlight
and one directional light. At the same camera and 384×384 drawing buffer, its
normal render submits **3,831 draws/frame**, versus **779 cached draws/frame**
(79.7% fewer). Stable fixture shadows match the static reference exactly, and
4,928 image pixels differ when receiving those shadows is disabled.

The first timing run varied substantially between its surrounding baselines.
It supports the draw-call reduction, not a reliable FPS prediction for the
live world. Complete samples are recorded in
`experimental-static-shadow-cache-results.json`.

The approved live 3333 comparison ran three 30-second samples on an Apple M1 Max,
with an unchanged camera, high shadows, DPR 2, and postprocessing enabled:

| Mode | FPS | Median draws/frame | Mean CPU/frame | Mean GPU/frame |
| --- | ---: | ---: | ---: | ---: |
| Normal before | 17.06 | 4,551 | 58.31 ms | 102.76 ms |
| Cached | 18.36 | 2,702 | 54.18 ms | 100.07 ms |
| Normal after | 17.03 | 4,551 | 58.43 ms | 102.82 ms |

That is 40.6% fewer draws and 7.7% more FPS against the mean of the two
surrounding baselines. The sun/day cycle remained active. The reduced shadow
generation does not remove the remaining surface-lighting and postprocessing
cost, so the live gain is much smaller than the draw reduction.
Full samples are in `experimental-static-shadow-cache-live.json`; screenshots
are in `screenshots/static-shadow-cache/live-cached.png` and `live-normal.png`.
The browser preference was restored to Off, temporary benchmark helpers were
removed, and ordinary per-light updates and renderer counters were restored.
No rendering errors appeared during the comparison. Existing audio playback
errors occurred with both normal and cached rendering.

## Limits

This is a runtime shadow cache, not a surface lightmap or persisted bake.
It retains the normal shadow texture/sampler cost. Moving or newly loaded props
can have no fixture shadow during the settling window. Custom shader deformation
or changes to alpha/displacement textures without geometry/transform changes
are not yet tracked; use normal shadows for those cases.

Browser validation covers desktop WebGL and the live 3333 scene.
XR hardware still needs separate validation.
