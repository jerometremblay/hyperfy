# Doors inset into their frames

Deployed to 3333 using `online-world` / `local-world`. Larch House blueprint
`WI0QjsRZ0R` is version 24, with source
`asset://d6a594c160ccbd249db559a3451e69fda3f3d1fd4bb421c5fbf5d2b06ef083b4.js`.

The two 0.96 × 2.12 m portal leaves retain the upstairs room-door construction.
Their closed panels moved from house-local Z=1.208 to Z=1.35, placing the front
panel surface 21 mm behind the casing face. The portal plane at Z=1.34 intersects
the closed leaf as requested. Front-face hinge pins let the leaves swing toward
the pool table without clipping the frame.

The existing door helper accepts an optional hinge depth. Its default preserves
all other doors. Only the two portal doors use the front-face override; their
hinge plates follow that face. Frames, continuous timber wall, native portal
models, IDs, destinations, settings, and all entity transforms are preserved.
Deployment captured the latest door and lighting state immediately before the
house update and verified it after rebuilding.

`house.hyp` contains the exact deployed source and bootstrap model.
`preview.html` renders that package, with saved arrival images illustrating
portal apertures. The offline preview does not perform portal travel.
`deployment.json` records live readback, preservation checks, and fresh profiling.

Validation covers:

- Both client and server with actual native constructors.
- Every degree of each 90-degree swing against visual jambs, casings, and
  structural colliders, including panel, rails, handles, and hinge leaf plates.
- Native PhysX under identity, rotated uniform scale, and rotated nonuniform
  scale; both independent doors block when closed and clear the approach when open.
- Native targeting for open and closed door handles and panels.
- A standing PhysX avatar reaching the native portal activation zone only with
  the door open.
- Six directional visual checks, a closed recess view, and all four door states.
- Zero idle frame handlers and zero fresh live server script CPU.

```sh
node outputs/promptbox-portal-wall/inset-doors/build.mjs
python3 outputs/promptbox-portal-wall/inset-doors/validate.py outputs/promptbox-portal-wall/inset-doors/house.hyp
node --test outputs/promptbox-portal-wall/inset-doors/physics.test.mjs outputs/promptbox-portal-wall/inset-doors/actions.test.mjs outputs/promptbox-portal-wall/inset-doors/entry.test.mjs
```

`deploy.mjs` defaults to a guarded dry run and intentionally refuses reuse after
the captured baseline has been deployed. No Git commit was created.
