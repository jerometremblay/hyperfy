# App performance

## Object performance

- Static objects should have zero `update`/`fixedUpdate` callbacks. Create nodes once; subscribe only while ongoing animation or gameplay needs work, and unsubscribe when it ends.
- Shared animated assets should register one frame callback on their owner, not callbacks on every instance that check ownership and return. Transfer that subscription when the owner unmounts. Tree wind uses one callback per shared preset/seed/options asset. The profiler includes native callbacks registered through app events.
- Registering `update`, `fixedUpdate`, `animate` or `lateUpdate` puts the app in the engine's active loop. An immediate return, a null effect check, or a `world.isClient` guard inside the callback still incurs dispatch on the server. Gate the subscription itself by runtime and active work; remove it with `app.off` when that work ends.
- Prefer existing action, trigger and effect lifecycle callbacks to polling. For seats, hide local prompts on interaction and restore them through `player.applyEffect({ onEnd })`. Check cancellation and replacement against the current fork before adding compatibility checks; do not assume an old workaround is still required.
- For transform-dependent geometry, initialize once and use `app.on('transform', ...)`; inspect its position/rotation/scale flags. For geographic calibration, read `world.getLocation()` initially and subscribe to `world.on('location', ...)`. These notifications do not activate idle apps. Child nodes already inherit position changes through native parenting.
- Parent ordinary geometry and static colliders with `app.add()` (or an app-owned group). Let native transforms propagate movement. Do not create a detached collider and a synchronization callback for each primitive.
- Use `world.add()` only for required independent world-space behavior or a verified builder-physics requirement. Compare position, quaternion and scale before writing them; copying unchanged transforms still dirties nodes and can cause PhysX pose work. Rebuild physics only on actual shape/scale changes, and remove detached nodes on destruction.
- Run decorative animation only on clients (`world.isClient`). Keep authoritative simulation on the server when gameplay requires it.
- Animate existing nodes with supported in-place setters: primitive `emissiveIntensity`, light `intensity`, or transforms for actual motion. In this fork, changing primitive `opacity`, `roughness`, `metalness`, geometry or physics rebuilds the primitive. Keep those values fixed during flicker; do not rebuild meshes/materials every frame. Check the target runtime's setters before choosing other animated properties.
- Preserve real animation and gameplay. Validate idle callbacks and rebuilds, then move, rotate and scale the app and check collisions. For live changes, compare before/after Object Profiler samples or Agent API profiling reports. CPU is milliseconds per second; client reports do not measure server CPU, GPU time or per-body physics time. Report unavailable runtime checks honestly; syntax/package validation alone does not prove performance.

The Object Profiler also offers **Measure GPU cost** for the selected app. This
on-demand, client-local comparison takes about 16 seconds: baseline, without the
app's light shadows, without its rendering, and a repeated baseline. Keep the
camera still and the tab visible. It uses WebGL GPU timer queries and temporarily
pauses the stats graph's GPU queries to avoid nesting timers. Scripts, physics,
networking and other players' views are unaffected. Closing the profiler,
changing selection, moving the camera, changing resolution, losing permission,
or disconnecting cancels the measurement and removes the rendering hook.

Results are whole-scene differences in milliseconds per frame, with a variation
estimate based on sampling error and baseline drift. Shared batches still submit
vertices even when an instance is hidden, and lighting, shadow budgets and
postprocessing interact; results are not additive or exclusive draw timings.
Differences within the variation estimate are marked inconclusive. Results are
local to the current profiler session and blueprint version, and are not sent in
Agent API profiling reports. Unsupported, unstable, or undersampled GPU timers
report an explanation instead of a fabricated cost. No GPU measurement hook,
polling, or timeout remains installed when the comparison is unused.

See [Object Profiler](../object-profiler.md) and [Agent API profiling](../agent-api.md) for measurement and limitations.

For static interactions, verify zero registered frame callbacks on both runtimes
before interaction, while seated, and after cancellation or another app replaces
the effect. Confirm that all prompts restore without a tick. After deploying,
check fresh server samples against the deployed blueprint version: idle callback
breakdowns should be empty. A low CPU reading is not proof that polling stopped.
