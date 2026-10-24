# Primitive physics ownership

Start decorative objects visual-only. When collision is required, prefer a few app-owned static primitives matching the major surfaces. Native hierarchy transforms avoid custom synchronization and idle callbacks:

```js
const floor = app.create('prim', {
  type: 'box',
  size: [4, 0.2, 4],
  position: [0, 0.1, 0],
  physics: 'static',
})
app.add(floor)
```

See `templates/minimal_primitive_app.js` for the default helper. A separate invisible collider can also be app-owned; do not duplicate physics on its visible counterpart.

## Exceptional detached physics

An app-owned Prim suppresses physics while its app is marked moving in the builder. If collision must remain active during selection/editing, verify that requirement in the target runtime before choosing detached physics. Independent dynamic bodies may also need world ownership; do not force them to follow a stationary app each frame.

For a collider that genuinely must follow an app outside its hierarchy:

- Use `world.add(collider)` and `app.resetOnMove = false` only when required by that lifecycle.
- Compute the full source world transform, including nested parents. Compare position, quaternion and scale with the last synchronized values before writing anything. Identical `.copy()` calls still dirty transforms.
- Share the synchronization callback across colliders. Prefer an available change event; if polling is required, return immediately when unchanged and avoid idle allocation.
- On actual scale changes, recreate the PhysX shape only if the target runtime requires it (save `physics`, set it to `null`, restore it). Never toggle physics unconditionally.
- Remove detached nodes and callbacks when no longer needed, including app destruction.

Read [performance.md](performance.md) before adding synchronization or animation.

## Collision validation

Choose the smallest practical collision representation. When exact primitive collision is required, preserve the primitive type and its complete shape configuration (including extrusion profile/depth/bevel); do not silently replace it with an AABB. Concave extrusions use convex collision.

Test translation, rotation, identity scale, uniform scale, non-uniform scale, and rotation combined with non-uniform scale, including after releasing builder selection. Verify collisions follow the final shape without requiring delete/undo or respawn. Profile while idle and during actual movement. Do not promise exact behavior while selected without a runtime check.
