---
name: hyperfy-hyp-app-authoring
description: Create and validate Hyperfy .hyp apps from JavaScript primitives and native portal nodes, package and preview them, or inspect and manage apps in a running world through its authenticated Agent REST API.
---

# Hyperfy `.hyp` app authoring

Use this skill when the user asks to create, edit, diagnose, package, or preview a Hyperfy app, especially primitive-only 3D objects generated directly in JavaScript.

## Required delivery workflow

1. **Resolve the target Hyperfy runtime before packaging.** Prefer the version/commit shown in the user's logs, `package.json`, or repository. When diagnosing a failure, audit loader/import behavior against that exact tag rather than `main`.
2. Translate the requested object into a small geometric plan before writing primitives. For standalone objects intended to sit on surfaces, follow **Surface placement and selectable bounds** below and define the root at the physical contact plane.
3. Declare the coordinate convention at the top of the app source. Unless the user explicitly requests another convention, use **Y up, +X right, -Z forward**.
4. Author the app as Hyperfy primitive nodes with reusable helpers for repeated geometry.
5. For custom extrusions, follow [docs/extrusion.md](docs/extrusion.md): use a simple local-XY profile, keep the first point un-repeated, and treat `depth` as local-Z thickness.
6. Keep the first working version **visual-only by default** unless the user explicitly needs collision or interaction. Dense primitive scenes must not get one detached collider and one per-frame synchronization callback per visual primitive.
7. If physics is required, add the smallest practical collision representation and follow the **Physics discipline** below. Prefer a few structural colliders over per-detail colliders.
8. For structural members whose orientation matters, follow the **Orientation discipline** below. Do not hand-guess angle signs from a visual sketch.
9. Before packaging, run `python3 tools/validate_result.py app.js`. This preflight syntax-checks the source and executes it in a harness that validates primitive property types. When the target source is available, also execute the generated source through the actual `createNode`/`Prim` constructors.
10. Package according to the **actual target runtime's loader contract**. Do not assume that either `model: null` or a bootstrap model is universally correct. For Hyperfy **v0.16.0**, `App.build()` dereferences `blueprint.model.endsWith(...)` before executing the script, so `model: null` is invalid; use a tiny valid geometry-free GLB scene as a compatibility bootstrap. The GLB must contain no visible cabin/object geometry.
11. Package JavaScript assets using Hyperfy's canonical script convention for the target runtime. For v0.16.0, create the `.js` file with MIME `text/plain`, hash the exact bytes with SHA-256, and use `asset://<sha256>.js`.
12. Extract the just-created `.hyp` and verify every asset byte-for-byte. Recompute SHA-256 and assert that each `asset://<hash>.<ext>` URL matches the packaged bytes.
13. Generate the interactive preview from the **exact packaged `.hyp` bytes**, not from a separate scene reconstruction. Confirm that the selected viewer implements every primitive type used, including `extrude`.
14. Perform the **Mandatory geometric and visual validation** below on the exact-package preview. Syntax, runtime, and package validation do not replace this audit. If any geometry changes, rebuild the package and preview and repeat the audit.
15. Run the validation/self-test suite. For dense primitive scenes, also assert that there are no unintended `update`/`fixedUpdate` handlers, detached world nodes, or physics rebuild loops.
16. Deliver the `.hyp`, source `.js`, and exact-package preview. Include the validation report when useful.

When sitting interaction is requested, read [docs/sitting.md](docs/sitting.md) before defining furniture anchors, actions, occupancy, or cleanup. Apply the sitting validation pass below in the target runtime.

## Native portals and remote previews

For portal creation, linking, travel, or preview compatibility, read
[docs/portals.md](docs/portals.md). In this fork, prefer **Add → World Portal** or
`app.create('portal', ...)` over custom triggers, teleport handlers or arrival
scripts. Verify native portal support in the target runtime before packaging.
Each endpoint needs a unique ID; a remote link also needs the destination world
URL. Keep script-generated visuals available in `world.isPreview` mode without
requiring a local player, physics or outgoing gameplay requests. Validate actual
travel and live previews in the engine; the bundled primitive viewer cannot
establish portal behavior.

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

## Runtime property/type validation

Hyperfy validates primitive properties while `app.create('prim', ...)` constructs the node, before the object is rendered or imported successfully. JavaScript syntax checks, package hashes, and a permissive node-count mock do not establish that the app can run in Hyperfy.

Before packaging, execute the complete generated source once through the target runtime's primitive constructors, or through a compatibility harness that mirrors their property setters. Treat the first constructor exception as a failed build. In particular:

- scalar material properties stay scalar: `color`, `emissive`, and `texture` are strings or `null` where supported;
- numeric material properties such as `opacity`, `metalness`, `roughness`, and `emissiveIntensity` are numbers;
- booleans such as `castShadow`, `receiveShadow`, `doubleside`, and `trigger` are not arrays;
- arrays are reserved for array-valued properties such as `size`, `profile`, `position`, `rotation`, and `scale`.

Do not wrap a scalar conditional in array brackets. This fails in the target runtime:

```js
box(size, position, [condition ? '#ffffff' : '#000000'], rotation)
```

Use the scalar expression directly:

```js
box(size, position, condition ? '#ffffff' : '#000000', rotation)
```

Run `python3 tools/validate_result.py app.js`; its primitive preflight must reject invalid property types. After creating the `.hyp`, run `python3 tools/validate_result.py app.hyp`. Before saving or returning a final ZIP, run `python3 tools/validate_result.py result.zip`. If the target runtime source is available, prefer the real `src/core/extras/createNode.js` and `src/core/nodes/Prim.js` path as the regression check. After any source change, rebuild the package and recompute every affected script asset URL and size from the final bytes.

## Surface placement and selectable bounds

For standalone Hyperfy objects that are intended to sit on surfaces, author the object so that the app/root origin corresponds to the object's physical contact plane—normally the bottom of the object. In Hyperfy grab mode, the app root is positioned directly at the raycast hit point, so placing the root at the object's center will cause the object to intersect the surface.

Keep decorative geometry that extends above or below the object—such as steam, smoke, glow, particles, or interaction markers—from distorting the object's selectable/raycast bounds. Prefer Hyperfy particle emitters or other non-raycast visual effects when possible. If the placement system uses bounds-centered positioning, balance or explicitly control those bounds so their placement reference still corresponds to the object's bottom contact plane.

Rule of thumb: **for an object meant to stand on a surface, local Y=0 should be the bottom/contact plane, not the visual or collider center.**

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

## Structural orientation checks

The mandatory geometric audit below covers all generated objects. When structural members are present, also check for these failure modes:

1. **Symmetry:** mirrored members should land on mirrored anchors, not merely have visually opposite angle values.
2. **Stairs:** treads, stringers, and handrails must all progress in the same run direction.
3. **Taper:** upper tower/gantry anchors move toward the intended center when the design tapers inward.
4. **Overrun:** diagonal members should use the actual endpoint distance as their length unless deliberate overlap is specified.
5. **Temporary debug markers:** if orientation is uncertain, add small differently colored spheres at `a` and `b` in the preview, validate, then remove them from the final source.

## Mandatory geometric and visual validation

Every generated object must pass this audit before delivery. Follow the detailed checks in [docs/orientation.md](docs/orientation.md) and use the preview generated from the exact packaged `.hyp` bytes. Syntax checks, constructor checks, package hashes, and a passing self-test are not substitutes. If the viewer cannot render a primitive or represent the target runtime's geometry, inspect the object in a compatible renderer or the target runtime instead.

1. **Readable surfaces:** Explicitly identify the intended viewing direction for every sign, display, label, and decorative surface that carries directional artwork or text. Text must read left-to-right from that side. Do not assume increasing world X is screen-right; verify the orientation of individual glyphs as well as character order.
2. **Sloped elements:** Define beams, rails, braces, trim, and other inclined structural members with two endpoints. Derive rotations with the canonical orientation helpers; do not infer Euler-angle signs manually. Numerically verify that the transformed local endpoints coincide with the intended endpoints.
3. **Shared surface coordinates:** For inclined screens, signs, panels, and their decorations, use one local coordinate system and outward normal for the whole surface assembly. Place frames, lettering, buttons, artwork, and other details relative to the same plane. Prefer a parent group when the assembly shares a rotation.
4. **Physical visibility:** Do not put screens, windows, openings, or recessed decorations behind opaque structural geometry. Build actual gaps in surrounding structure where an opening is intended. Check that surface details are visible and correctly offset from their supporting plane.
5. **Visual inspection:** Inspect front, back, left, right, top, and isometric views. Check text orientation, slopes, surface normals, occlusion, intersections, offsets, and structural alignment. Correct visible errors before packaging the final artifact.
6. **Numerical orientation tests:** For every endpoint-derived element, compare transformed endpoints with target coordinates within an appropriate tolerance. For every inclined surface, verify that the transformed top and bottom edges have the intended relative depth. Any failed check is a generation failure; correct it and repeat the audit.

## Object performance

- Static objects should have zero `update`/`fixedUpdate` callbacks. Create nodes once; subscribe only while ongoing animation or gameplay needs work, and unsubscribe when it ends.
- Parent ordinary geometry and static colliders with `app.add()` (or an app-owned group). Let native transforms propagate movement. Do not create a detached collider and a synchronization callback for each primitive.
- Use `world.add()` only for required independent world-space behavior or a verified builder-physics requirement. Compare position, quaternion and scale before writing them; copying unchanged transforms still dirties nodes and can cause PhysX pose work. Rebuild physics only on actual shape/scale changes, and remove detached nodes on destruction.
- Run decorative animation only on clients (`world.isClient`). Keep authoritative simulation on the server when gameplay requires it.
- Animate existing nodes with supported in-place setters: primitive `emissiveIntensity`, light `intensity`, or transforms for actual motion. In this fork, changing primitive `opacity`, `roughness`, `metalness`, geometry or physics rebuilds the primitive. Keep those values fixed during flicker; do not rebuild meshes/materials every frame. Check the target runtime's setters before choosing other animated properties.
- Preserve real animation and gameplay. Validate idle callbacks and rebuilds, then move, rotate and scale the app and check collisions. For live changes, compare before/after Object Profiler samples or Agent API profiling reports. CPU is milliseconds per second; client reports do not measure server CPU, GPU time or per-body physics time. Report unavailable runtime checks honestly; syntax/package validation alone does not prove performance.

Read [docs/performance.md](docs/performance.md) before adding callbacks, collision synchronization or animated material properties.

## Physics discipline

Hyperfy app instances can be translated, rotated, uniformly scaled, or non-uniformly distorted in the builder. Physics must continue to match the visible primitives after those edits.

### Default rule: keep dense generated models visual-only first

Primitive-heavy generated models such as cabins, boats, towers, furniture, and decorative structures should initially contain **no physics** unless collision is part of the request. A successful visual app is the baseline. Add collision in a second pass.

Do not create a detached `world.add()` collider plus an `update` callback for every decorative primitive. On large models this multiplies active nodes, callbacks, PhysX rebuild work, and allocation pressure, and can destabilize the Hyperfy process.

When collision is needed, prefer a few simple structural colliders for floors, walls, stairs, or major obstacles. Decorative logs, trim, shingles, panes, bolts, and similar details normally do not need individual colliders.

### Default collision ownership

Use app-owned static primitives/colliders when collision is required. The starter template follows this native hierarchy and has no update handlers. Validate the final builder transforms as described below; temporary physics suppression while selected is not a reason to detach every collider. Read [docs/physics.md](docs/physics.md) before using an exceptional detached collider.

### Exceptional detached exact-shape rule

Use the detached exact-shape pattern only when exact primitive collision under arbitrary app transforms is genuinely required:

1. Create the **visible primitive** under `app` with `physics: null`.
2. Create an **exact invisible collider primitive** with the same primitive `type` and `size`; do not approximate it with AABBs, strips, or generic boxes.
3. Add that collider with `world.add(collider)` instead of `app.add(collider)`. Hyperfy marks the app root as moving for the whole time it is selected in the builder, and app-owned `Prim` nodes skip physics mounting in that moving context. A detached world node can still mount and rebuild PhysX while the app is being edited.
4. Synchronize only when the source position, quaternion or scale actually changes. Compare before copying; unchanged copies still dirty transforms. Share synchronization work rather than adding one callback per primitive. Derive the collider from the visible primitive plus the app transform:
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
- Use transparent/invisible primitives only when needed for collision or interaction; exact-package previews skip `opacity <= 0` geometry. For static colliders, prefer the app-owned hierarchy above.
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

Do not assume an emissive primitive illuminates nearby geometry. This fork provides native `app.create('light', ...)` nodes; use them when actual illumination is needed, and animate `intensity` in place. Other runtimes may differ, and the normal `glbToNodes` path does not necessarily convert GLTF punctual lights into usable app nodes. Resolve these capabilities against the target runtime before relying on actual lights.

For script-only apps, treat emissive objects primarily as visible luminous surfaces. A convincing fire can combine:

- bright emissive flame geometry;
- a brighter inner flame;
- glowing coals;
- tiny animated sparks;
- one or more extremely transparent emissive glow volumes around the source.

Bloom/post-processing, when enabled, can make these surfaces appear to cast light visually even without actual punctual lights. Do not describe an emissive halo as a physically real point light unless the target runtime actually provides one.

For flicker or moving sparks, create the geometry once and animate existing nodes with a shared client-only update handler. Keep opacity fixed; animate emissive intensity instead of rebuilding materials every frame. Change `emissiveIntensity` directly for brightness animation; do not recreate primitives every frame.

## Sitting positions, action markers, and seat behavior

For sittable furniture, follow [docs/sitting.md](docs/sitting.md). Use normal Hyperfy **Press E — Sit** action markers and explicit seat anchors. Each physical sitting place needs a stable deterministic ID, its own anchor and facing direction, action marker, server-authoritative occupancy, and safe exit position outside the furniture's collision volume.

Derive seat positions and spacing from the visible sitting surfaces. Keep interaction-marker positions separate from seated-avatar anchors, and use a consistent seated animation within the construction. Correct anchor placement, height, and rotation before changing the pose.

Only enter the seated state after the server accepts the seat claim. While the local player is seated, hide **all Sit markers on that furniture**. Also hide or disable occupied, pending, and destroyed seats. Update marker availability without rebuilding the furniture.

Movement and jumping must end sitting. Use the seated effect's `onEnd`/cleanup lifecycle to release occupancy, move the player to the safe exit, clear local seated state, and restore only available markers. Cleanup must be idempotent and associated with the exact current sitting entry, so obsolete callbacks cannot release a newer claim, restore stale markers, or teleport the player after switching seats.

### Sitting validation pass

Validate sitting behavior in the target Hyperfy runtime; the bundled primitive preview alone does not establish interaction or multiplayer correctness:

1. Every cushion/chair has its own reachable action, correctly oriented anchor, natural seated height, and safe exit point.
2. Sitting hides all of that furniture's Sit markers locally; movement and jumping end the effect and restore only free seats.
3. Concurrent claims cannot seat two players in the same place. Pending or occupied seats have no actionable Sit prompt; rejected claims restore appropriate availability.
4. Effect cancellation/replacement, seat switching, disconnect, seat loss, and app destruction/rebuild release claims and leave no stale markers. Old callbacks cannot alter a newer sitting entry.

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

Use `tools/hyp_pack.py` and `tools/hyp_extract.py`. Use `tools/make_embedded_preview.py` so the preview embeds the exact final `.hyp` bytes. The bundled viewer 2.3.0 mock runtime supports app transforms, quaternion composition, `world.add()`/`world.remove()`, update hooks, and detached invisible colliders used by exceptional independent physics patterns.

## Validation

Run:

```bash
python3 tests/self_test.py
```

For an authored app, run the pre-save validator on the source, rebuilt `.hyp`, and final ZIP:

```bash
python3 tools/validate_result.py app.js
python3 tools/validate_result.py app.hyp
python3 tools/validate_result.py result.zip
```

Do not claim the package is validated unless those checks actually ran successfully.

A smoke test that only counts nodes is insufficient. A package is not ready if the runtime harness reports a primitive setter error, even when the `.hyp` header, asset hashes, and local parser are valid.

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

## Live-world app operations

When the user asks to inspect, deploy, or change an app in a running Hyperfy world, read [docs/agent-api.md](docs/agent-api.md). The Agent API controls that live world; it does not start or stop server processes. It is disabled unless the world has an Agent API token configured, and loading this skill does not grant API access. Use live mutations only when the user asks for them.

For an existing script blueprint, fetch its current version, upload the exact JavaScript source, then PATCH the blueprint with the returned script asset URL and current version. Preserve the other blueprint fields: `props` replaces the entire properties object, and changing a blueprint rebuilds every instance that uses it. For a new script-only app, create the blueprint and then create an entity only when placement is requested. The Agent API uploads JavaScript source; model assets use Hyperfy's existing upload path.

Keep bearer tokens in the configured secret environment, never in source, skill files, output artifacts, or logs. A successful mutation is broadcast immediately but may still be waiting for Hyperfy's normal persistence save.

## Delivery

Prefer these outputs:

- `<name>.hyp`
- `<name>_script.js`
- `<name>_preview.html`
- optional `validation_report.json`

The `.hyp` and preview must correspond to the same package bytes.
