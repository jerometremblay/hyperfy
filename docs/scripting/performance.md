# App performance

## Object performance

- Static objects should have zero `update`/`fixedUpdate` callbacks. Create nodes once; subscribe only while ongoing animation or gameplay needs work, and unsubscribe when it ends.
- Parent ordinary geometry and static colliders with `app.add()` (or an app-owned group). Let native transforms propagate movement. Do not create a detached collider and a synchronization callback for each primitive.
- Use `world.add()` only for required independent world-space behavior or a verified builder-physics requirement. Compare position, quaternion and scale before writing them; copying unchanged transforms still dirties nodes and can cause PhysX pose work. Rebuild physics only on actual shape/scale changes, and remove detached nodes on destruction.
- Run decorative animation only on clients (`world.isClient`). Keep authoritative simulation on the server when gameplay requires it.
- Animate existing nodes with supported in-place setters: primitive `emissiveIntensity`, light `intensity`, or transforms for actual motion. In this fork, changing primitive `opacity`, `roughness`, `metalness`, geometry or physics rebuilds the primitive. Keep those values fixed during flicker; do not rebuild meshes/materials every frame. Check the target runtime's setters before choosing other animated properties.
- Preserve real animation and gameplay. Validate idle callbacks and rebuilds, then move, rotate and scale the app and check collisions. For live changes, compare before/after Object Profiler samples or Agent API profiling reports. CPU is milliseconds per second; client reports do not measure server CPU, GPU time or per-body physics time. Report unavailable runtime checks honestly; syntax/package validation alone does not prove performance.

See [Object Profiler](../object-profiler.md) and [Agent API profiling](../agent-api.md) for measurement and limitations.
