# Separate upstairs-size doors in one timber wall

Deployed Larch House blueprint `WI0QjsRZ0R` version 23 to the 3333 world through
the configured guarded `online-world` workflow.

The two door leaves now use exactly the upstairs bedroom-door dimensions:
0.96 × 2.12 m. They reuse the existing interior panel, rails, latches, hinges,
native Open/Close actions, authoritative state, and kinematic collision.
Each operates independently and opens toward the pool table.

The former flat backing and segmented front wall are replaced by one
continuous wall of the same horizontal logs used for the upstairs partitions.
No additional visible backing remains. The frames stop inside the wall so its
rear is uninterrupted timber. A 0.5 m timber band separates their outer frames.
The original prompt's blind, one-sided doorways are retained.

Both native portal models now declare 0.96 × 2.12 m apertures and a center
1.09 m above their instance origin, matching the leaves' floor clearance.
Their instance transforms remain unchanged with unit scale, so the aperture
resize preserves native seamless-traversal support. Destination IDs, links,
arrival images, and current live preview settings were retained. Preview-rate
edits made during construction were incorporated rather than overwritten.

Current house door and lighting states, all instance placements, and unrelated
blueprints were preserved. Fresh idle server sampling recorded zero house
script callback CPU.

- `source.js`, `house.hyp`, and `preview.html`: current source, exact package,
  and interactive package preview.
- `portal.glb`, `portal-0.hyp`, `portal-1.hyp`: resized native model and complete
  portal packages with their existing arrival images.
- `closed.png`, the independent open-state images, `timber-back.png`, and six
  directional images: final visual inspection. Offline portal images
  illustrate the apertures; this viewer does not perform portal travel.
- `validation.json`: actual constructors, GLTF loader and native portal
  nodes, exact upstairs dimensions, retained traversal support, package
  hashes, geometry/state preservation, and 91-angle sweeps for each leaf.
- `physics-validation.json`: full-house native PhysX door checks on client
  and server under three transforms, including nonuniform scale.
- `action-validation.json`: native targeting and correct independent toggle
  events from moving handles and first/third-person panel points.
- `entry-validation.json`: standing 0.3 m-radius, 1.6 m-height native PhysX
  controller reaches native portal activation through open doors, while
  closed doors keep it outside that volume.
- `deployment.json`: uploaded script/model readback, native portal settings
  and placement preservation, current state, and fresh server profiling.

```sh
python3 outputs/promptbox-portal-wall/standard-size/validate.py outputs/promptbox-portal-wall/standard-size/house.hyp
node --test outputs/promptbox-portal-wall/standard-size/physics.test.mjs outputs/promptbox-portal-wall/standard-size/actions.test.mjs outputs/promptbox-portal-wall/standard-size/entry.test.mjs
```

`build.mjs` validates native portal GLBs through the actual GLTF loader and
portal constructors. The script-app canonical validator is used for the
house package; it requires JavaScript and does not apply to scriptless native
portal packages.

The version-22 deployment baseline intentionally prevents applying this
revision twice. No Git commit was created.
