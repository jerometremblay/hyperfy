# Two matching closable portal doors

Deployed Larch House blueprint `WI0QjsRZ0R` version 22 to the configured
`online-world` / 3333 world. Each native portal remains in its original recess.

Two explicit `registerDoor` calls reuse the existing bedroom-door panel,
rails, iron latches, hinges, two moving native actions, authoritative door
state, and kinematic collision. The leaves are 1.58 × 2.34 m to fit the
existing 1.6 × 2.4 m apertures. Outer hinges open 90 degrees toward the pool
table; each leaf stops entry before the native portal plane when closed.

The doors operate independently through the existing Open/Close interaction.
Both started closed. Live verification observed a new door opening and kept
that interaction intact. Existing house door and lighting states, house
placement, portal destinations and transforms, other blueprints, and other
app placements were preserved.

- `source.js` and `house.hyp`: deployed source and exact distributable package.
- `preview.html`: exact-package geometry with four independent door-state views.
  Saved portal arrival images illustrate apertures offline; this preview does
  not perform portal travel.
- `closed.png`, `left-open.png`, `right-open.png`, `both-open.png`, and six
  directional screenshots: visual inspection.
- `validation.json`: native constructors, original geometry preservation,
  91-angle sweeps per leaf against static house collision, independent state,
  asset hashes, and zero idle callbacks.
- `physics-validation.json`: actual full-house PhysX checks on client and server
  under three app transforms, including nonuniform scale.
- `action-validation.json`: native pointer targeting, correct toggle events,
  moving handles, and first/third-person panel coverage.
- `deployment.json`: source readback, live state and placement preservation,
  observed live interaction, and fresh zero idle server CPU.

```sh
python3 outputs/promptbox-portal-wall/closable-doors/validate.py outputs/promptbox-portal-wall/closable-doors/house.hyp
node --test outputs/promptbox-portal-wall/closable-doors/physics.test.mjs outputs/promptbox-portal-wall/closable-doors/actions.test.mjs
```

`deploy.mjs` uses the original version-21 baseline and cannot deploy twice.
`verify-deployment.mjs` verifies the completed version-22 deployment without
writing the house or portals.
