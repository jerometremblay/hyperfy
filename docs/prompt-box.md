# Prompt-box creation and construction edits

Use **Add App → Prompt Box** to create a translucent 1 m cube. It starts with its
bottom on the spawn surface. Position and rotate it using the existing builder
controls, or the inspector's transform fields.

Enter a prompt such as “Create a coffee mug”, “Create a steampunk streetlight”, or
“Make a window in this timber-frame house”.
Set Width, Height, and Depth in meters.
Changing the Height field keeps the bottom face fixed; Width and Depth resize
around the center. **Resize with face handles** shows six
spheres at the face centers: drag a sphere to move that face while holding the
opposite face fixed. The builder's Scale mode uses these handles for prompt-boxes.
When a face points directly at the camera, drag upward to grow it outward or
downward to shrink it inward.
Press Escape to finish resizing. Minimum dimension: 0.01 m.

**Export prompt ZIP** downloads one archive containing:

- `prompt.md`: the user's request and return instructions.
- `authoring.md`: Hyperfy scripting, primitive, coordinate, and packaging guidance.
- `hyperfy-skill/`: the complete authoring skill, references, templates, tools,
  tests, and previews. Follow `hyperfy-skill/SKILL.md`; the prompt and request-specific
  manifest/authoring rules take precedence over its generic defaults.
- `manifest.json`: request identity, original world, exact position, quaternion,
  dimensions, replacement contract, and intersected app instances.
- `prompt-box.hyp`: a portable working placeholder with its script and prompt.
- `apps/<entityId>.hyp`: each intersected app's complete blueprint and assets.
  Shared blueprints still receive a separate entry for each placed instance.

The inspector lists the intersected apps and updates as the box or apps move.
Selection tests each geometry part's bounds against the oriented box, accounting
for child transforms and instance scale. It includes a box entirely inside a
wall's bounds. Separate parts are tested individually, so empty gaps between them
do not select the whole app. Bounds are conservative: empty space inside a curved
or hollow part can still count as an intersection. Invisible parts, scene apps,
players, disabled apps, and other prompt-boxes are excluded. Meshes, primitives,
world-space UI, animated meshes, and Gaussian splats supply geometry bounds.

Each manifest intersection records its entity ID, blueprint ID/version, filename,
world position, quaternion, and scale. Its column-major `boxLocalMatrix` maps
app-local geometry into the box's local frame **in meters**, including instance
scale. `boxInAppMatrix` maps a centered unit cube into the target app-local frame,
including the box dimensions and inverse app scale. The manifest also records
instance state and whether an app is editable. Apply each matrix once. This keeps
the location of the prompt volume relative to a wall or other object explicit.
Export checks the selection, app transforms, and blueprint versions again after
packaging; if they change during export, retry when the world is settled.

Submit the ZIP to ChatGPT. The bundled instructions distinguish two cases:

- **Edit a construction:** when the prompt clearly refers to an intersected app,
  return that modified app, authored in its original local coordinates. A window
  request in a timber-frame house means cut an opening in the house and integrate
  the window into it. Inspect the existing wall plane, thickness, bounds, and
  timber spacing; project the hinted location onto the wall and align with the
  house. The box is an approximate region: small offsets or stray rotation should
  not make a floating or tilted window. Preserve unrelated geometry and behavior.
- **Create a standalone object:** return `generated.hyp` to replace the box.
  Author it in meters around the box center, with its base at `Y = -height / 2`.
  Import uses the box position/quaternion and unit scale, as before.

A returned blueprint carries `props.promptBoxRequestId` matching the manifest and
`props.promptBoxTargetEntityId` identifying the instance to replace. Intersected
`.hyp` references already include these tags. Use the intersected entity ID for a
construction edit; use `manifest.box.entityId` for a standalone object. This
explicit result targeting prevents importing an edited house at the box's origin.
ChatGPT chooses the edit target and authors the alignment from the supplied prompt
and geometry; the importer does not infer architecture or cut meshes on its own.

Return one modified `.hyp` directly, or `result.zip` containing the unchanged
`manifest.json` and one `.hyp` for each changed target. Several construction edits
and an optional standalone object may be returned together. Include only changed
apps. Unknown targets, duplicate targets, scene apps, placeholders, and missing
assets are rejected. Locked/frozen constructions cannot be edited.

For every revision, rebuild the `.hyp` after editing asset bytes. A changed script
needs its final SHA-256 URL in **both** `blueprint.script` and the matching
`assets[].url` entry. Recalculate asset byte sizes and the UTF-8 header length, and
validate references, hashes, byte boundaries, and request/target IDs in the final
ZIP. The exported authoring guide includes these required preflight checks and
runs hyperfy-skill/tools/validate_result.py on each source script, rebuilt .hyp,
and final result.zip so primitive setter errors are caught before delivery.
Updating only the blueprint reference leaves a missing asset and is rejected.

Choose **Import result** in the original box inspector. The confirmation names the
constructions to update. The importer checks that the box and each edited target
still match the exported request, validates/uploads/loads all assets, then builds
all replacements before publishing their instance changes. On a detected build
failure it restores the original apps. Each target receives a fresh blueprint,
leaving other instances sharing the old blueprint unaffected.

Construction edits preserve their instance ID, position, quaternion, scale, and
state. Returned scripts must keep the root transform intact and change geometry
in the original frame. If no result targets the box, import removes the completed
prompt-box. If a standalone object also targets the box, it replaces it instead.

**Undo prompt result** appears in Add App and each edited app's inspector. One undo
restores every edited construction and the original prompt-box together; the
builder's undo shortcut does the same. Undo history lasts for the browser session.
The saved prompt and request survive reloads until the box is consumed.

If the box or a target changes after export, export a fresh request. This includes
construction state and blueprint versions. The latest export supersedes earlier
ones. Version 1 standalone results remain compatible; newly exported version 2
requests require explicit target tags. Imports are limited to 50 MB, including
expanded ZIP content. Use **Import result**; ordinary `.hyp` drops create apps and
ordinary ZIP drops still follow the splat workflow.

Desktop pointer resizing is supported; VR users can use dimension fields.

## Verification

Run the focused roundtrip and resize tests:

```sh
node --test src/core/extras/promptBox.test.mjs src/client/components/addableBlueprints.test.mjs
npm run build
```

For a browser smoke check, create a box, drag a face, export the ZIP, return a
generated app with the request ID, import it, and undo. Also verify that changing
the box after export rejects the older result, and that reloading preserves its
prompt, dimensions, and latest request.
Move the box into a wall, rotate it, and resize it across adjacent apps. Verify
the live list and ZIP entries match, including distinct instances of the same
blueprint and their world/box-local transforms.

For construction edits, return a wall/house with a real opening, confirm its root
placement stays fixed while the prompt-box disappears, then undo to restore both.
Check rotated/scaled houses and boxes with small offsets or stray rotation.
