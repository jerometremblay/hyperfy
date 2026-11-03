# Wider portal door openings

Only the two existing portal-door opening angles change in the current live
Larch House script. The wall-side leaf opens 137.3 degrees; the other reuses
the existing 175-degree house-door limit.

A sweep at 0.01-degree intervals checks the panel, rails, latches, hinge leaf
plates, and kinematic collider against house visual bounds and structural
collision. The wall-side leaf first contacts the window sill at 137.82
degrees. Its chosen limit retains more than 5 mm of clearance; the free
leaf clears its complete 175-degree swing.

The source is based on live blueprint version 26. The package targets
version 27. Existing closed geometry, other doors, portal blueprints and
placement, house placement, and current door/lighting states are preserved.
The deployment uses the configured `online-world` profile for `local-world`
and refuses a changed house blueprint or placement before writing.

`house.hyp` contains the exact source and existing bootstrap model.
`preview.html` renders that package and provides independent door states.
Portal arrival images in the preview are offline illustrations.
`deployment.json` records live readback and preservation checks after deployment.

```sh
node outputs/promptbox-portal-wall/wider-swing/measure.mjs
node outputs/promptbox-portal-wall/wider-swing/build.mjs
node outputs/promptbox-portal-wall/wider-swing/build-preview.mjs
python3 outputs/promptbox-portal-wall/wider-swing/validate.py outputs/promptbox-portal-wall/wider-swing/house.hyp
node --test outputs/promptbox-portal-wall/wider-swing/physics.test.mjs outputs/promptbox-portal-wall/wider-swing/actions.test.mjs outputs/promptbox-portal-wall/wider-swing/entry.test.mjs
node outputs/promptbox-portal-wall/wider-swing/render.mjs
node outputs/promptbox-portal-wall/wider-swing/deploy.mjs
```

`deploy.mjs` defaults to a guarded dry run; `--write` applies the validated
package once. No Git commit is created.
