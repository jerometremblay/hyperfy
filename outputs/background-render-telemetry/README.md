# Background render comparison — 2026-10-21

Measured the live Évain world at 1280 × 720, DPR 1, medium shadows, with postprocessing, ambient occlusion, and bloom enabled. Camera and scene were retained in the same browser session. Each sample lasted approximately 15 seconds.

| Metric | Before, hidden | After, hidden |
| --- | ---: | ---: |
| World ticks/second | 5.00 | 5.00 |
| World tick elapsed time, ms/second | 115.83 | 12.31 |
| Main-thread task time, ms/second | 150.28 | 68.65 |
| WebGL draw calls/second | 20,862.83 | 0 |
| Scene renders in sample | 75 | 0 |
| GPU timer samples | 74 | 0 |

World tick time decreased 89.4%; main-thread task time decreased 54.3%. The visible control rendered at 36.66 FPS before and 37.10 FPS after. These are single samples, not repeated statistical estimates.

## Method and limits

- The in-app browser did not transition to `document.hidden` when its UI was hidden or another tab opened. Chrome's CDP profiler was unavailable because of a paused embedded-document response. Neither yielded a usable actual-background comparison.
- The accepted comparison therefore uses a **controlled visibility simulation** in the live world: a temporary `document.hidden` getter returns true, then a `visibilitychange` event invokes Hyperfy's existing 5 FPS worker path. Native browser visibility and timer throttling were not simulated. This is not a real minimized-window or OS utilization measurement.
- Baseline measurements preceded the source edit. The same guard was then wrapped around the live page's existing renderer, ahead of instrumentation, preserving its scene and camera. Source code contains the corresponding early return in `ClientGraphics.render()`.
- The guard allows active XR rendering, and leaves simulation and photo processing running. The focused regression test covers hidden commits, visible resumption, photo processing, and the XR exception.
- Tick timings use `performance.now()` around the real world tick. Main-thread task time uses CDP `Performance.getMetrics` deltas. Neither is a system-wide CPU percentage; task time can include other work on that renderer thread.
- Draw counts instrument `drawArrays`, `drawElements`, `drawArraysInstanced`, and `drawElementsInstanced` on the world's WebGL context. Embedded pages and other WebGL contexts are outside this count.
- GPU timings use `EXT_disjoint_timer_query_webgl2` around scene rendering. Visible cumulative query time exceeded wall time, so those raw timings must not be converted into hardware utilization. The reliable post-change finding is zero scene renders and zero instrumented draw calls in the hidden sample. Other pages, media, and browser compositing can still use the GPU.
- The source guard and test are saved, but the running server was **not rebuilt or restarted**. Existing unrelated dirty source files were left untouched. The in-memory test guard, telemetry, visibility override, and viewport override were removed and the test tab closed.

## Evidence

`2026-10-21.json` contains raw samples and CDP performance counters. `instrumentation.js` is the temporary browser instrumentation used to capture them; it defines `window.__hyperfyTelemetry.begin(label)`, `.end()`, and `.cleanup()`. It is not imported by the application.

Validation: `node --test src/core/systems/ClientGraphics.test.mjs` passed all 7 tests; `git diff --check` passed. No commit was created.
