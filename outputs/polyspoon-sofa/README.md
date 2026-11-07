# Cognac leather sofa recipe

This is a geometry-only conversion of `../cognac-leather-furniture/cognac_leather_beveled_sofa_3_seat.hyp`. It is an executable `.mjs` recipe for this world's sandboxed Polyspoon loader, with no GLB dependency.

- `sofa.recipe.mjs`: standalone recipe to host at an HTTPS URL for the in-world Add panel. Its only import is `three`.
- `sofa.source.mjs`: editable source before bundling Three.js geometry utilities.
- `sofa.design.json` and `sofa.controls.json`: default saved design and control descriptions.
- `build-recipe.mjs`: rebuild the recipe and preview from the editable source. Run from the repository root: `node outputs/polyspoon-sofa/build-recipe.mjs`.
- `verify.mjs`: compare the default recipe's geometry with the original trusted Hyperfy script and test cushion colors and extrusion controls. Run from the repository root: `node outputs/polyspoon-sofa/verify.mjs`.
- `verify-sandbox.mjs`: exercise the world recipe compiler, sandbox, controls and PhysX colliders. Run from the repository root: `node outputs/polyspoon-sofa/verify-sandbox.mjs`.
- `preview.html`: self-contained preview with three neutral views; it can be opened directly. `preview.mjs` and `preview.template.html` are its editable inputs; `node outputs/polyspoon-sofa/build-preview.mjs --check` checks the generated page.

The default model matches the original's 88 visible meshes, including geometry, normals, UVs, transforms, roughness and metalness. Seat cushions now use the main leather color instead of their former separate color. Its bounds are approximately 2.64 × 1.08 × 0.89 metres.

Controls include seat count and width; seat, back and arm extrusion depths and rounded-profile radii; shared bevel size and depth in millimetres; and leather, dark leather, piping and feet colors. The bevel controls specify the seat cushion's dimensions and scale the other panels' bevels proportionally. They adjust rounded profiles, not arbitrary individual profile points. All seat and back cushions use the main leather color. The independent `color.leatherLight` control was removed in version 1.1.0.

The default and two extreme parameter combinations pass the local world sandbox and PhysX collider cooking. The preview provides the same controls for visual inspection.

The original's three Sit interactions and anchors are not carried over: the current recipe interface only returns geometry. Its two shadow controls are also unavailable through the current loader. The original uses four invisible box colliders; the loader constructs one static collider from the visible meshes, so collision behavior differs. The design and recipe have not been submitted to or verified with the Polyspoon website's editor or publishing workflow.

The recipe bundles the Three.js BufferGeometryUtils implementation; its MIT license is in `THREE-LICENSE.txt`. The original `.hyp` and script remain unchanged.

## Polyspoon-native recipe

`polyspoon-recipe/index.ts` implements the toolkit's `Recipe` contract. `polyspoon-recipe/sofa.ts` contains its typed procedural geometry. It registers a new `cognac-leather-sofa` family, with validated saved designs, named parts, material roles and anchors. It rotates the model to Polyspoon's +Z front; the Hyperfy recipe retains its original orientation. The two implementations are checked against one another by `validate-polyspoon.mjs`.

Prepare a separate copy of the installed toolkit and register the recipe without modifying the original:

```sh
node .polyspoon/bootstrap.mjs
node outputs/polyspoon-sofa/prepare-polyspoon.mjs /absolute/path/to/new-sofa-project
node outputs/polyspoon-sofa/validate-polyspoon.mjs /absolute/path/to/new-sofa-project
node /absolute/path/to/new-sofa-project/.polyspoon/runtime.mjs catalog
```

The last command includes the sofa family. Its saved design, controls and geometry report from the Polyspoon runtime are in `polyspoon-validation/`. The control labels specify millimetres for bevels because the toolkit's semantic unit enumeration has no millimetre value. The report's toolkit identity and hash refer to the original bench source archive, not an official sofa release; the registered sofa and modified registry are custom additions.

Verification covered the default and both limits of each numeric control, changed colors and seat counts, strict saved-design reload, stable remaining part names, geometry inspection and reproduction against the Hyperfy recipe. The toolkit's normal portable rebuild and a focused strict TypeScript check also passed, using Node 26.12.1 and separately installed `@types/three` 0.186.0. The toolkit documents Node 22.22.1 as its recorded rebuild environment; that version was not tested here. The original feet extend roughly 2 mm below the ground plane, as in the Hyperfy source.

This is a custom local Polyspoon recipe that must be registered in a toolkit copy. It is not a generic `.hyp` exporter, an official catalog family, or a verified upload to polyspoon.com. The original `sofa.recipe.mjs` is a separate Hyperfy interface. Polyspoon's own packager generated a procedural module under `submission-20261103/procedural-module/`; it also passes the Hyperfy sandbox. See that folder's submission notes for verification results and the remaining submission blocker. In-world placement of this sofa has not been performed.
