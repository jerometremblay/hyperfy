# Billiards portal wall

Deployed to the 3333 world with the guarded `online-world` Agent API workflow.
The original wall deployment was Larch House blueprint `WI0QjsRZ0R` version 21.
The latest version is 26, with 378 mm mezzanine braces slightly inset from their
posts and trimmed to leave 1 mm clearance at both joins. Both separate closable doors
remain inset into their frames at the exact upstairs bedroom-door size.
Current source, package, preview, and verification are in
[`brace-clearance/`](brace-clearance/README.md). The preceding full-width brace
revision is retained in [`beam-width-braces/`](beam-width-braces/README.md). The preceding door inset
revision is retained in [`inset-doors/`](inset-doors/README.md). The version-23 size and wall revision is
retained in [`standard-size/`](standard-size/README.md). The preceding version-22 revision
is retained in [`closable-doors/`](closable-doors/README.md).

The prompt box marked the right mezzanine bay. The new timber partition aligns
with the existing house posts at local X=4.75 and X=8.83. Its two 1.6 × 2.4 m
doorways face the pool table and have a continuous physical backing, so they
are blind recesses. Their lower edges meet the existing floor without a step.

The original native World Portal entities `PBETNgBqKt` and `OL3wuJiVCk` were
moved into these frames. Their portal IDs, destinations, one-sided settings,
preview settings and blueprints were preserved. The completed prompt box was
removed after deployment verification. Existing house geometry, root transform,
door and lighting state, other blueprints and other app placements were preserved.

- `source.js` and `house.hyp`: deployed house source and exact package.
- `preview.html` and `preview.png`: exact-package geometry with saved portal
  arrival images illustrating the apertures; this offline viewer does not travel.
- `live-3333.png`: verification screenshot of the native live portal surfaces.
- `pre-deploy.json`: original live snapshot and target state.
- `deployment.json`: API readback, preservation checks and fresh server profiling.
- `final-live-verification.json`: final readback confirming both portal
  placements, unchanged destination blueprints and completed prompt removal.
- `travel-validation.json`: actual same-world crossing in the live engine using
  a separate anonymous test avatar. Remote travel was not exercised.

Validation executes the complete source through this fork's actual primitive,
portal, action, group and light constructors on both client and server. Native
PhysX checks cover both recess approaches and the solid back under identity,
translated/rotated/uniformly scaled, and rotated/nonuniformly scaled transforms.
All existing primitive configurations and initial state are preserved. There
are zero idle frame callbacks, and fresh live server sampling measured zero
house script CPU.

The bundled authoring mock predates the house's existing `app.configure` API.
`validate.py` keeps its canonical syntax, asset hash and package boundary checks,
and replaces only the obsolete mock with the actual fork constructors:

```sh
python3 outputs/promptbox-portal-wall/validate.py outputs/promptbox-portal-wall/source.js
python3 outputs/promptbox-portal-wall/validate.py outputs/promptbox-portal-wall/house.hyp
node --test outputs/promptbox-portal-wall/physics.test.mjs
```

Six directional exact-package views plus the in-house pool-side view were
reviewed. The guarded deployment verifies current versions and transforms before
changing the house or moving either portal. `deploy.mjs` defaults to a dry run.
Its original baseline intentionally prevents applying this deployment twice.
