# Hyperfy extrusion primitives

The target Hyperfy runtime must include the native `extrude` primitive before an app can use it. An older client or server rejects the node with `[prim] type invalid` and displays the standard red crash block.

## Minimal authoring pattern

Declare the coordinate convention in the source, then create one `prim` node and add it to the app:

```js
// Coordinate system: +Y up, +X right, -Z forward.
// The profile is local X/Y; depth extends along local Z.
const irregular = app.create('prim', {
  type: 'extrude',
  profile: [
    [-0.75, -0.5],
    [0.55, -0.5],
    [0.7, -0.18],
    [0.22, -0.05],
    [0.36, 0.62],
    [-0.15, 0.72],
    [-0.28, 0.16],
    [-0.72, 0.32],
  ],
  depth: 0.3,
  bevelEnabled: true,
  bevelThickness: 0.03,
  bevelSize: 0.04,
  bevelSegments: 2,
  curveSegments: 6,
  position: [0, 0.35, 0],
  color: '#d47a45',
})

app.add(irregular)
```

## Geometry contract

- `profile` is an array of finite `[x, y]` pairs in the primitive's local XY plane.
- The engine closes the polygon automatically. Do not repeat the first point.
- Use at least three points, with a simple non-self-intersecting outline. Holes and multiple rings are not supported.
- `depth` must be positive and is the solid's local-Z thickness.
- `bevelEnabled` defaults to `true`; `bevelThickness` and `bevelSize` must be non-negative.
- `bevelSegments` must be a non-negative integer. `curveSegments` must be a positive integer.
- `.size` is ignored for `extrude`; use the profile, depth, and node `scale` to control dimensions.
- The generated geometry is centered on its bounds. Position the node explicitly when its base must sit on the app origin.
- Use `app.add(node)`. Creating the node without adding it does not render it.

Keep profiles away from self-intersections, duplicate vertices, and bevel widths that consume narrow features. If triangulation is unstable, simplify the outline or disable beveling before adding detail back.

## Physics

Start with `physics: null`. Primitive-heavy authoring should be visual-only unless collision is part of the request.

When physics is required, Hyperfy creates a convex mesh from the extrusion. A concave visual profile therefore collides as its convex hull. Do not promise concave collision from this primitive.

An exact detached collider must repeat the complete extrusion configuration (`profile`, `depth`, and bevel settings); `size` alone cannot describe it. Prefer a few simple structural colliders over one detached collider and one per-frame synchronization callback for every decorative extrusion.

## `.hyp` packaging

For the bundled v2.4.0 authoring tools:

1. Keep the visible object in the script; the model is only a loader bootstrap.
2. Use `tools/hyp_pack.py`, which adds a minimal geometry-free GLB model asset because its validator and preview require a model.
3. SHA-256 the exact script bytes and keep the resulting `asset://<sha256>.js` URL identical in the blueprint and asset table.
4. Extract the package and compare every embedded asset byte-for-byte.
5. Generate the preview from the final `.hyp` bytes.

The bundled v2.4.0 preview viewer does not currently render `extrude`. A blank or incomplete preview is therefore a viewer limitation unless the target Hyperfy runtime also reports an error. Validate the final package in a runtime that contains the extension.
