---
name: hyperfy-hyp-app-authoring
description: Create Hyperfy .hyp apps from JavaScript primitives, validate them against the target Hyperfy runtime, package them safely, and generate an exact-package interactive preview.
---

# Hyperfy `.hyp` app authoring

Use this skill when the user asks to create, edit, diagnose, package, or preview a Hyperfy app, especially primitive-only 3D objects generated directly in JavaScript.

## Required delivery workflow

1. **Resolve the target Hyperfy runtime before packaging.** Prefer the version/commit shown in the user's logs, `package.json`, or repository. When diagnosing a failure, audit loader/import behavior against that exact tag rather than `main`.
2. Translate the requested object into a small geometric plan before writing primitives.
3. Declare the coordinate convention at the top of the app source. Unless the user explicitly requests another convention, use **Y up, +X right, -Z forward**.
4. Author the app as Hyperfy primitive nodes with reusable helpers for repeated geometry.
5. For custom extrusions, follow [docs/extrusion.md](docs/extrusion.md): use a simple local-XY profile, keep the first point un-repeated, and treat `depth` as local-Z thickness.
6. Keep the first working version **visual-only by default** unless the user explicitly needs collision or interaction. Dense primitive scenes must not get one detached collider and one per-frame synchronization callback per visual primitive.
7. If physics is required, add the smallest practical collision representation and follow the **Physics discipline** below. Prefer a few structural colliders over per-detail colliders.
8. For structural members whose orientation matters, follow the **Orientation discipline** below. Do not hand-guess angle signs from a visual sketch.
9. Syntax-check the source and execute it in the mock Hyperfy runtime.
10. Package according to the **actual target runtime's loader contract**. Do not assume that either `model: null` or a bootstrap model is universally correct. For Hyperfy **v0.16.0**, `App.build()` dereferences `blueprint.model.endsWith(...)` before executing the script, so `model: null` is invalid; use a tiny valid geometry-free GLB scene as a compatibility bootstrap. The GLB must contain no visible cabin/object geometry.
11. Package JavaScript assets using Hyperfy's canonical script convention for the target runtime. For v0.16.0, create the `.js` file with MIME `text/plain`, hash the exact bytes with SHA-256, and use `asset://<sha256>.js`.
12. Extract the just-created `.hyp` and verify every asset byte-for-byte. Recompute SHA-256 and assert that each `asset://<hash>.<ext>` URL matches the packaged bytes.
13. Generate the interactive preview from the **exact packaged `.hyp` bytes**, not from a separate scene reconstruction. Confirm that the selected viewer implements every primitive type used, including `extrude`.
14. Run the validation/self-test suite. For dense primitive scenes, also assert that there are no unintended `update`/`fixedUpdate` handlers, detached world nodes, or physics rebuild loops.
15. Deliver the `.hyp`, source `.js`, and exact-package preview. Include the validation report when useful.

## Coordinate and primitive contract

Use one coordinate system consistently across source, preview, calculations, and comments:

- `+Y` = up.
- `+X` = right.
- `-Z` = Hyperfy forward.
- Box size is `[xWidth, yHeight, zDepth]`.
- `extrude.profile` is a simple polygon of `[x, y]` points in local XY; the engine closes it automatically and extrudes it along local Z.
- `extrude.depth` is positive local-Z thickness. Extrusion geometry is centered on its bounds, so place it with its node transform rather than assuming the profile origin is the ground.
- Cylinder and cone length is along local `+Y` before rotation.
- Plane/torus orientation must be checked against the viewer/runtime primitive definition before relying on a specific face direction.
- Rotations are radians, represented as `[rx, ry, rz]`.

Do not switch between “front means +Z” and “front means -Z” within one model. Put a short coordinate comment at the top of every generated source file.

## Orientation discipline

Orientation mistakes are much harder to notice from code than from a rendered object. Prefer **geometry defined by endpoints** over manually selected Euler-angle signs.

### 1. Anchor first, rotate second

For legs, braces, railings, stair stringers, handrails, booms, pipes, antenna elements, and similar linear members:

- Define the two intended world-space endpoints `a` and `b` first.
- Compute midpoint, length, and rotation from `b - a`.
- Create the member along a known local axis, preferably local `+Y`.
- Use a reusable helper such as `beamBetween()` or `cylinderBetween()`.
- Do **not** derive separate `+angle/-angle` cases for different faces unless endpoint alignment is impossible.

Use `templates/orientation_helpers.js` as the canonical implementation.

### 2. Use one local long axis

For arbitrary diagonal boxes, use `[thickness, length, thickness]` so the long dimension is local `Y`. This matches the natural axis of cylinders/cones and lets one endpoint-alignment helper serve both boxes and round members.

If the member requires a rectangular, non-square cross-section, first get the endpoint alignment correct with a square section. Add intentional roll only afterward and validate it visually.

### 3. Mirror endpoints, not rotations

For symmetric structures, mirror the endpoints and recompute the orientation. Do not copy a beam and negate an Euler angle by intuition.

Examples:

- A tower leg is defined from its bottom corner to its corresponding smaller top corner. The top endpoint must be closer to the tower center if the tower tapers inward.
- An X brace is two explicit endpoint pairs crossing the same face.
- Left/right stair rails are generated from the same stair path with a lateral offset; their rotations are then derived independently from endpoints.

### 4. Stairs use a single authoritative path

Choose `stairStart` and `stairEnd` once. Derive all stair geometry from that direction:

- tread centers interpolate from start to end;
- stringers run from the first support point to the last support point;
- handrails use the same direction plus a vertical offset;
- posts rise vertically from corresponding tread/path points.

Before packaging, check that the stringer and rail vectors have a positive dot product with the intended stair-run vector. This catches reversed stringers and rails.

### 5. Structural taper invariant

For a structure intended to taper inward, the horizontal distance of each successive leg anchor from the center must decrease with height. Validate this numerically rather than relying on angle signs.

### 6. Avoid sign tables when an endpoint helper works

Code like this is fragile:

```js
const angle = Math.atan2(dy, dx)
box(size, pos, color, [0, 0, side === 'left' ? angle : -angle])
```

Prefer:

```js
beamBetween(a, b, thickness, color)
```

The helper should own all Euler math.

## Orientation validation pass

Before final packaging, perform a dedicated orientation audit in addition to syntax/runtime validation:

1. **Endpoint test:** for every endpoint-derived helper, mathematically transform local `[-L/2,+L/2]` Y endpoints and assert they coincide with requested world endpoints within a small tolerance.
2. **Canonical views:** inspect front, back, left, right, top, and one isometric view. An isometric view alone can hide reversed slopes.
3. **Symmetry check:** mirrored structural members should land on mirrored anchors, not merely have visually opposite angle values.
4. **Stair check:** treads, stringers, and handrails must all progress in the same run direction.
5. **Taper check:** upper tower/gantry anchors move toward the intended center when the design tapers inward.
6. **Overrun check:** diagonal members should use the actual endpoint distance as their length unless deliberate overlap is specified.
7. **Temporary debug markers:** if orientation is uncertain, add small differently colored spheres at `a` and `b` in the preview, validate, then remove them from the final source.

When the generated object contains many diagonals, treat this orientation audit as mandatory.

## Physics discipline

Hyperfy app instances can be translated, rotated, uniformly scaled, or non-uniformly distorted in the builder. Physics must continue to match the visible primitives after those edits.

### Default rule: keep dense generated models visual-only first

Primitive-heavy generated models such as cabins, boats, towers, furniture, and decorative structures should initially contain **no physics** unless collision is part of the request. A successful visual app is the baseline. Add collision in a second pass.

Do not create a detached `world.add()` collider plus an `update` callback for every decorative primitive. On large models this multiplies active nodes, callbacks, PhysX rebuild work, and allocation pressure, and can destabilize the Hyperfy process.

When collision is needed, prefer a few simple structural colliders for floors, walls, stairs, or major obstacles. Decorative logs, trim, shingles, panes, bolts, and similar details normally do not need individual colliders.

### Transform-safe exact-shape rule

Use the detached exact-shape pattern only when exact primitive collision under arbitrary app transforms is genuinely required:

1. Create the **visible primitive** under `app` with `physics: null`.
2. Create an **exact invisible collider primitive** with the same primitive `type` and `size`; do not approximate it with AABBs, strips, or generic boxes.
3. Add that collider with `world.add(collider)` instead of `app.add(collider)`. Hyperfy marks the app root as moving for the whole time it is selected in the builder, and app-owned `Prim` nodes skip physics mounting in that moving context. A detached world node can still mount and rebuild PhysX while the app is being edited.
4. Synchronize the collider from the visible primitive plus the app transform:
   - world position = app position + rotated(app scale × local position);
   - world quaternion = app quaternion × local quaternion;
   - world scale = app scale × local scale.
5. When the resulting scale changes, force PhysX geometry recreation by toggling the collider's public `physics` property: save it, set it to `null`, then restore it. This marks the `Prim` for rebuild so `mountPhysics()` reconstructs the exact shape using the current non-uniform scale.
6. On app destruction, call `world.remove(collider)`.

Keep `app.resetOnMove = false` for this pattern so the script stays active while the builder transform is changing. Treat this pattern as an advanced opt-in, not the default for every primitive in a generated scene.

### Exact-shape requirement

Use the same primitive for collision as for the visible shape:

- box → box collider;
- sphere → sphere/convex behavior handled by Hyperfy;
- cylinder → cylinder convex mesh;
- cone → cone convex mesh;
- extrude → convex hull of the generated extrusion; concave visual profiles do not retain concave collision.
- torus/plane → corresponding primitive behavior supported by Hyperfy.

Do **not** replace a transformed cylinder with rectangular strips or an AABB just because the app is non-uniformly scaled. Hyperfy can rebuild the primitive's PhysX geometry with the new scale when the collider is remounted.

### Scope and hierarchy

The default helper assumes generated collidable primitives are direct children of the app root. If a collidable visual is nested below custom groups/pivots, either compute the full parent-chain world transform before synchronizing its detached collider or keep the collidable primitive at the app root and group only its non-colliding visual details.

### Physics validation pass

For any app with colliders, validate at least these states before delivery:

1. identity scale `[1,1,1]`;
2. uniform scale such as `[1.5,1.5,1.5]`;
3. non-uniform scale such as `[2,1,0.5]`;
4. rotation combined with non-uniform scale.

The collider must preserve the primitive's transformed shape in all cases. Delete/undo or respawn must not be required to obtain correct physics.

## Primitive modeling guidance

- Build large masses first, then structural members, then small details.
- Use arrays/loops for repeated geometry instead of copying literal primitive calls.
- Use groups/pivots when a repeated assembly moves or rotates as a unit.
- Represent openings as actual gaps where practical rather than painting them onto solid walls.
- Prefer continuous rails, beams, trim, and edges over many tiny disconnected pieces when a single primitive is sufficient.
- Keep scale believable relative to a roughly human-sized avatar unless the user requests another scale.
- Use transparent/invisible primitives only when needed for collision or interaction; exact-package previews skip `opacity <= 0` geometry. For colliders, prefer the detached exact-primitive pattern above.
- For a static `extrude`, keep `physics: null` unless collision is required. If collision is required, duplicate the complete profile/depth/bevel configuration for the collider; a generic `size` array is not an extrusion definition.
- Avoid per-frame work for static generated models. Static cabins, buildings, furniture, props, and sculptures should normally have zero `update`/`fixedUpdate` handlers.
- Avoid `world.add()` for ordinary visual geometry. Add visible primitives under `app`; reserve detached world nodes for features that specifically require them.
- If an app begins causing repeated rebuilds, repeated world saves, rapidly increasing memory, or PhysX churn, remove physics and update handlers first and reduce to a static visual primitive baseline.

## Lights, emissive surfaces, fire, and glow

Hyperfy primitives support emissive materials directly. Use emissive geometry for flames, coals, lamps, glowing signs, magical effects, and similar visible light sources.

```js
const glow = app.create('prim', {
  type: 'sphere',
  size: [0.2],
  position: [0, 1, 0],
  color: '#ffb34a',
  emissive: '#ff6818',
  emissiveIntensity: 4,
  opacity: 0.5,
  roughness: 0.3,
  metalness: 0,
  physics: null,
})
app.add(glow)
```

Supported primitive material properties include `color`, `emissive`, `emissiveIntensity`, `opacity`, `roughness`, and `metalness`. `emissive` is a color string such as `'#ff6818'`. `emissiveIntensity` is a non-negative number and can be changed at runtime without rebuilding the primitive. Use `opacity` for soft visible glow geometry; keep it low for large glow volumes.

### Emissive geometry and real lights

Do not assume an emissive primitive illuminates nearby geometry. The current Hyperfy script-node API does not expose a general `PointLight`/`SpotLight` primitive equivalent, and the normal `glbToNodes` path does not convert GLTF punctual lights into usable Hyperfy app nodes. Resolve these capabilities against the target runtime before relying on actual lights.

For script-only apps, treat emissive objects primarily as visible luminous surfaces. A convincing fire can combine:

- bright emissive flame geometry;
- a brighter inner flame;
- glowing coals;
- tiny animated sparks;
- one or more extremely transparent emissive glow volumes around the source.

Bloom/post-processing, when enabled, can make these surfaces appear to cast light visually even without actual punctual lights. Do not describe an emissive halo as a physically real point light unless the target runtime actually provides one.

For flicker or moving sparks, create the geometry once and animate existing nodes with a shared update handler. Change `emissiveIntensity` directly for brightness animation; do not recreate primitives every frame.

## Packaging rules

A `.hyp` is:

```text
[4-byte little-endian header JSON length][header JSON][asset bytes...]
```

The blueprint must reference packaged assets using `asset://...` URLs.

### Extrusion package and preview requirements

An extrusion app is still a script-driven primitive app. Keep the visible shape in `app.create('prim', { type: 'extrude', ... })`; do not expose `THREE.ExtrudeGeometry` or put a generated mesh in the bootstrap model.

The bundled v2.4.0 authoring tools require a model asset for validation and preview. Use their minimal geometry-free GLB bootstrap when packaging with `tools/hyp_pack.py`, then verify that the script URL and every packaged asset URL match the exact SHA-256 bytes. The bootstrap must contain no visible geometry.

The v2.4.0 bundled preview viewer does not implement `extrude`. Do not treat a blank or incomplete preview as proof that the Hyperfy app is broken; either update the viewer primitive renderer or validate the package in the target Hyperfy runtime. The target runtime itself must contain the `extrude` extension or it will display the crash block with `[prim] type invalid`.

### Runtime-dependent model bootstrap

Do not guess whether a primitive-only app may use `blueprint.model = null`.

- Inspect the target version's `App.build()` implementation.
- Hyperfy **v0.16.0** calls `blueprint.model.endsWith(...)` before loading/executing the script, so `model: null` is invalid and can crash the app-loading path.
- For runtimes with that behavior, package a **minimal valid geometry-free GLB scene** solely as a loader bootstrap. It must have no meshes, materials, textures, colliders, or visible geometry.
- The requested object must still be built entirely with `app.create('prim', ...)` when the user asks for primitives only. The bootstrap GLB is not part of the modeled object.
- Do not infer compatibility from an old `.hyp` artifact alone; an old script-only package may have been produced for a different loader implementation.

### Script asset naming and MIME

Hash the exact JavaScript bytes with SHA-256 and name the asset `<sha256>.js`. The blueprint script URL must be `asset://<sha256>.js` and the header asset URL must match it exactly.

For Hyperfy v0.16.0, mirror the built-in Script Editor: create the JavaScript `File` with filename `script.js` and MIME `text/plain`; the uploaded/canonical filename is then the SHA-256 name with `.js` extension.

Use `tools/hyp_pack.py` and `tools/hyp_extract.py`. Use `tools/make_embedded_preview.py` so the preview embeds the exact final `.hyp` bytes. The bundled viewer 2.3.0 mock runtime supports app transforms, quaternion composition, `world.add()`/`world.remove()`, update hooks, and detached invisible colliders used by the default physics pattern.

## Validation

Run:

```bash
python3 tests/self_test.py
```

For an authored app, also syntax-check JavaScript and smoke-test it:

```bash
node --check app.js
node tools/smoke_test.js app.js
```

Do not claim the package is validated unless those checks actually ran successfully.

### Import/upload validation

Local parsing of the `.hyp` is necessary but not sufficient. A package can parse correctly and still fail after Hyperfy imports it if an embedded asset is not uploaded or persisted.

For each packaged asset:

1. recompute SHA-256 from the extracted bytes;
2. assert the blueprint URL and header URL use that hash and extension;
3. assert asset ordering and declared sizes exactly match the concatenated payload;
4. when testing against a real world, verify `POST /api/upload` succeeds and then verify `GET /assets/<sha256>.<ext>` resolves;
5. if Hyperfy reports `Route GET:/assets/<hash>.js not found` or `ENOENT .../world/assets/<hash>.js`, treat that as an asset upload/persistence or stale-blueprint problem before changing primitive geometry;
6. if the failing hash does not equal the current package's script hash, search the world data for that hash because a stale broken blueprint/app may still reference an older script.

Note that Hyperfy v0.16.0's client upload path does not reliably surface every HTTP upload failure before the blueprint later requests the asset, so the explicit GET check is valuable.

### Crash-safety validation

For a static primitive model, assert all of the following before delivery:

- no `app.on('update', ...)` or `app.on('fixedUpdate', ...)` unless animation requires it;
- no detached `world.add()` nodes unless explicitly required;
- no per-primitive physics by default;
- no loop that creates nodes from an update/event callback;
- no physics-property toggling loop;
- primitive creation happens once during script execution, not continuously.

If a user reports V8 heap growth, repeated world saves, or a process crash after inserting the app, immediately reduce to this static baseline before adding features back one at a time.

## Editing existing `.hyp` apps

When the user supplies an existing `.hyp`:

1. extract it;
2. modify the relevant source asset rather than rebuilding unrelated assets;
3. preserve blueprint metadata unless the requested change requires otherwise;
4. repack;
5. compare extracted output to intended inputs;
6. regenerate the preview from the repacked file;
7. run the orientation audit if geometry rotations changed.

## Delivery

Prefer these outputs:

- `<name>.hyp`
- `<name>_script.js`
- `<name>_preview.html`
- optional `validation_report.json`

The `.hyp` and preview must correspond to the same package bytes.
