# Mezzanine braces matching their beams

Deployed to 3333 through `online-world` / `local-world`. Larch House blueprint
`WI0QjsRZ0R` is version 25, with source
`asset://d0c58151a649c4c8555fe0d80bdbb04f48396a7e104bdc0dcc75733ea2e52688.js`.

All six mezzanine knee braces changed from 200 mm square to 380 mm square.
This matches the attached posts' cross-section and the horizontal beams' height.
They now project 77 mm in front of the log wall and 73 mm behind it. A 2 mm
forward offset avoids overlapping coplanar post faces flickering at their joins.
Their original X/Y endpoints and slopes remain unchanged.

Only those six visual primitives changed. All other geometry, physics, doors,
lights, native portal blueprints, and entity placements were verified unchanged.
The latest live door and lighting states were preserved through deployment.

`source.js` and `house.hyp` contain the deployed change. `preview.html` renders
the exact package; `brace-detail.png` shows its enlarged brace beside the door.
Six directional screenshots verify alignment. Saved portal images in this
offline viewer illustrate the native apertures without performing travel.

Validation executes both client and server through the actual native
constructors, checks every brace's transformed endpoints and visible depth,
and raycasts native geometry to verify the logs do not hide the brace.
Existing native PhysX door, standing avatar, and action checks pass. Fresh
live profiling records zero house script CPU when idle in `deployment.json`.

```sh
node outputs/promptbox-portal-wall/beam-width-braces/build.mjs
python3 outputs/promptbox-portal-wall/beam-width-braces/validate.py outputs/promptbox-portal-wall/beam-width-braces/house.hyp
node --test outputs/promptbox-portal-wall/beam-width-braces/physics.test.mjs outputs/promptbox-portal-wall/beam-width-braces/actions.test.mjs outputs/promptbox-portal-wall/beam-width-braces/entry.test.mjs
```

`deploy.mjs` defaults to a guarded dry run and refuses reuse after its captured
baseline has been deployed. No Git commit was created.
