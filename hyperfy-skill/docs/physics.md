# Transform-safe primitive physics

Hyperfy visual primitive transforms and PhysX shape transforms do not behave identically while an app is selected and edited. An app-owned `Prim` can visually inherit a changing app scale while its already-mounted PhysX geometry retains its previous dimensions, and app-owned primitive physics is skipped while the app context is marked `moving`.

The default authoring pattern therefore separates visual ownership from physics ownership:

```js
const visible = app.create('prim', {
  type: 'cylinder',
  size: [1.6, 1.6, 0.2],
  position: [0, 0.1, 0],
  physics: null,
})
app.add(visible)

const collider = app.create('prim', {
  type: 'cylinder',
  size: [1.6, 1.6, 0.2],
  opacity: 0,
  physics: 'static',
})
world.add(collider)
```

Synchronize the detached collider from the app transform and the visible primitive's local transform. When scale changes, force a primitive rebuild:

```js
function rebuildPhysics(prim) {
  const physics = prim.physics
  if (!physics) return
  prim.physics = null
  prim.physics = physics
}
```

The canonical complete implementation is in `templates/minimal_primitive_app.js`.

## Why `world.add()` matters

Hyperfy considers an app to be moving for the full time it is selected in the builder. App-owned primitive nodes do not mount physics in that context. A node activated by `world.add()` is detached from the app hierarchy and can mount/rebuild its PhysX shape while the app remains selected.

## Exact primitive, not approximation

Keep the collider's `type` and `size` identical to the visual primitive. A non-uniformly scaled cylinder should remain an elliptical cylinder collider after PhysX rebuild. Do not substitute AABBs or box-strip approximations unless the user explicitly asks for an approximate collider.
