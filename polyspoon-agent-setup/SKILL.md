---
name: polyspoon
description: Create or customize editable Polyspoon 3D models and export GLB assets from the project-local procedural toolkit. Use for model requests, saved-design edits and recipe construction; not deployment or hosted account management.
---

Use the project-local `.polyspoon` runtime. Installing this skill does not install the engine. From the project root, inspect the installed scripts, toolkit archive, dependency lock and notices, then run `node .polyspoon/bootstrap.mjs`. This installs pinned local dependencies without lifecycle scripts and compiles the bundled original toolkit. Run trusted source only; this is not an execution sandbox.

Read the actual catalog before choosing construction:

```sh
node .polyspoon/runtime.mjs catalog
node .polyspoon/runtime.mjs build --family bench --parameters '{"width":2.2,"backrest":false}' --out exports/bench-01
```

Use the person's requested dimensions, style and target. The example is a runnable bench request, not a default for other requests. Prefer an existing recipe and supported controls before authoring new geometry. The catalog contains actual control ranges, units, presets and constraints. Parameters are meters unless the control specifies otherwise. Do not silently clamp invalid input or treat a static pose as animation.

For saved edits, preserve the complete validated design:

```sh
node .polyspoon/runtime.mjs build --config exports/bench-01/asset.design.json --out exports/bench-copy-01
```

Outputs are the raw GLB, canonical saved design, `asset.controls.json` (every control with its range, default, unit and applied value, plus materials and real size) and geometry/measurement report in a new directory. Add `--formats obj,fbx,usdz` (or `all`) for `asset.obj.zip` (OBJ + MTL), `asset.fbx` (binary FBX 7.4) and `asset.usdz`. All formats are meters, +Y up; FBX declares UnitScaleFactor 100 so engines import 1 unit = 1 m. Extra formats are static meshes with base-color materials; rigs and animation stay in the GLB. `model-controls.json` lists the controls of every built-in family. The runtime refuses an existing output directory. Retain failed outputs and use a fresh attempt after corrections. Do not overwrite the user's assets.

Own the request through inspection, repair and delivery. Inspect the actual model from useful neutral views, check supported joints and requested control effects, and verify the requested target. Geometry checks are not aesthetic approval or target import evidence. Record precise defects, part/view, correction, coverage and remaining limits. Human feedback is optional. Do not invent checks you did not perform.

Editable TypeScript is in `.polyspoon/toolkit/src` and `.polyspoon/toolkit/examples/recipes`. If existing controls cannot meet the request, read the actual recipe and its callers, make a scoped change and verify observable behavior. Use the included `REBUILD.md` and `build.mjs` to recompile after source edits. That portable compilation is not repository typecheck or a full verification suite. Keep user work, semantic part IDs, validated migration notices and license provenance intact.

Deliver the asset, saved design, editable source/reproduction inputs and honest limits. The bundle's local open-source toolkit is separate from any future protected hosted catalog. It supplies no account, publication permission or deployed polyspoon.com service. Your agent app may require its own subscription and tool approvals.
