# Brace clearance

Deployed to 3333 through `online-world` / `local-world`, Larch House blueprint
`WI0QjsRZ0R` version 26. Source:
`asset://e6b2182cdc22304d2431dfc429162bb8f1a279715c4b5b0ab1713c88a598b3b1.js`.

The six mezzanine braces are 378 mm wide and deep, 1 mm inset on each side
relative to the 380 mm posts. The prior forward offset is removed. Their original
slope remains; vertical and horizontal end cuts stop 1 mm from the adjoining
post face and beam underside. They remain visible through the log wall without
overlapping either attached structural member.

Each brace uses the house's existing native extrusion helper with a convex
four-point profile and no bevel or physics. Numerical checks verify the
perpendicular width, both end clearances, face inset, and transformed native
geometry. Every other node configuration and all existing state remain identical.

`house.hyp` and `source.js` match the deployed bytes. `preview.html` renders
the exact package, with saved portal images illustrating the apertures.
`brace-detail.png` and six directional views record the clean joins.
`deployment.json` verifies live source readback, current door and lighting state,
portal and placement preservation, and zero fresh idle server script CPU.

Canonical package validation using the actual native constructors passes.
Native PhysX door checks under identity and rotated uniform/nonuniform scale,
standing-avatar access checks, and open/closed action targeting pass.

```sh
node outputs/promptbox-portal-wall/brace-clearance/build.mjs
python3 outputs/promptbox-portal-wall/brace-clearance/validate.py outputs/promptbox-portal-wall/brace-clearance/house.hyp
node --test outputs/promptbox-portal-wall/brace-clearance/physics.test.mjs outputs/promptbox-portal-wall/brace-clearance/actions.test.mjs outputs/promptbox-portal-wall/brace-clearance/entry.test.mjs
```

`deploy.mjs` defaults to a guarded dry run and refuses reuse after deployment.
No Git commit was created.
