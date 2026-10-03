# hyperfy-hyp-app-authoring 2.4.1

Generic ChatGPT → Hyperfy primitive JavaScript → `.hyp` → exact-package preview workflow.

## 2.4.1 extrusion-primitive documentation update

This update documents Hyperfy's native `prim` extrusion extension and the packaging/preview limitations of the 2.4.0 authoring toolchain.

Key extrusion rules:

- Create extrusions with `app.create('prim', { type: 'extrude', profile, depth, ... })`.
- Profiles are simple, non-self-intersecting local-XY polygons; the engine closes them automatically.
- `depth` is local-Z thickness, `.size` is ignored, and the generated geometry is centered on its bounds.
- Keep static extrusions visual-only by default. Concave extrusion physics uses the profile's convex hull.
- The bundled v2.4.0 preview viewer does not render `extrude`; validate against a runtime that includes the extension.

## Runtime compatibility and crash-safety update

This version keeps the complete 2.3.0 toolchain and orientation helpers, but changes the authoring defaults based on failures diagnosed against Hyperfy 0.16.0.

Key rules:

- Resolve the target Hyperfy version/commit before packaging and validate against that runtime rather than assuming `main` behavior.
- Hyperfy 0.16.0 dereferences `blueprint.model` before running the script, so `model: null` is invalid there. Use a tiny valid geometry-free GLB compatibility bootstrap while keeping all visible geometry in JavaScript primitives.
- Package script assets using the target runtime's canonical convention; for 0.16.0, use a `.js` file with `text/plain`, SHA-256 the exact bytes, and reference it as `asset://<sha256>.js`.
- Dense primitive scenes are visual-only by default. Do not attach one detached collider and one per-frame synchronization callback to every visual primitive.
- Add physics only when required, using the smallest practical structural collision representation.
- Treat missing `/assets/<hash>.js` or `ENOENT .../world/assets/<hash>.js` as an upload/persistence or stale-blueprint issue before changing geometry.
- For heap growth, repeated world saves, or crashes, reduce to a static baseline with no update handlers, detached world nodes, or per-primitive physics before adding features back incrementally.

The package retains the orientation discipline introduced in 2.2.0: define structural members by endpoints and derive their orientation instead of guessing Euler signs.

## Included files

- `SKILL.md`
- `manifest.json`
- `docs/extrusion.md`
- `docs/orientation.md`
- `docs/physics.md`
- `docs/sitting.md`
- `templates/minimal_primitive_app.js`
- `templates/orientation_helpers.js`
- `tools/hyp_pack.py`
- `tools/hyp_extract.py`
- `tools/make_embedded_preview.py`
- `tools/validate_app.py`
- `tools/smoke_test.js`
- `tests/self_test.py`
- `viewer/hyp_primitive_viewer.html`
- `viewer/hyp_primitive_viewer_template.html`
- `viewer/navigation_wasd.js`
- `examples/orientation_regression/`
