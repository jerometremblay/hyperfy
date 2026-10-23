# App performance

## Object performance

- Static objects should have zero `update`/`fixedUpdate` callbacks. Create nodes once; subscribe only while ongoing animation or gameplay needs work, and unsubscribe when it ends.
- Registering `update`, `fixedUpdate`, `animate` or `lateUpdate` puts the app in the engine's active loop. An immediate return, a null effect check, or a `world.isClient` guard inside the callback still incurs dispatch on the server. Gate the subscription itself by runtime and active work; remove it with `app.off` when that work ends.
- Prefer existing action, trigger and effect lifecycle callbacks to polling. For seats, hide local prompts on interaction and restore them through `player.applyEffect({ onEnd })`. Check cancellation and replacement against the current fork before adding compatibility checks; do not assume an old workaround is still required.
- Parent ordinary geometry and static colliders with `app.add()` (or an app-owned group). Let native transforms propagate movement. Do not create a detached collider and a synchronization callback for each primitive.
- Use `world.add()` only for required independent world-space behavior or a verified builder-physics requirement. Compare position, quaternion and scale before writing them; copying unchanged transforms still dirties nodes and can cause PhysX pose work. Rebuild physics only on actual shape/scale changes, and remove detached nodes on destruction.
- Run decorative animation only on clients (`world.isClient`). Keep authoritative simulation on the server when gameplay requires it.
- Animate existing nodes with supported in-place setters: primitive `emissiveIntensity`, light `intensity`, or transforms for actual motion. In this fork, changing primitive `opacity`, `roughness`, `metalness`, geometry or physics rebuilds the primitive. Keep those values fixed during flicker; do not rebuild meshes/materials every frame. Check the target runtime's setters before choosing other animated properties.
- Preserve real animation and gameplay. Validate idle callbacks and rebuilds, then move, rotate and scale the app and check collisions. For live changes, compare before/after Object Profiler samples or Agent API profiling reports. CPU is milliseconds per second; client reports do not measure server CPU, GPU time or per-body physics time. Report unavailable runtime checks honestly; syntax/package validation alone does not prove performance.

See [Object Profiler](../object-profiler.md) and [Agent API profiling](../agent-api.md) for measurement and limitations.

For static interactions, verify zero registered frame callbacks on both runtimes
before interaction, while seated, and after cancellation or another app replaces
the effect. Confirm that all prompts restore without a tick. After deploying,
check fresh server samples against the deployed blueprint version: idle callback
breakdowns should be empty. A low CPU reading is not proof that polling stopped.
