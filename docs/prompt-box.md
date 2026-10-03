# Prompt-box object creation

Use **Add App → Prompt Box** to create a translucent 1 m cube. It starts with its
bottom on the spawn surface. Position and rotate it using the existing builder
controls, or the inspector's transform fields.

Enter a prompt such as “Create a coffee mug” or “Create a steampunk streetlight”.
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
- `manifest.json`: request identity, original world, exact position, quaternion,
  dimensions, and replacement contract.
- `prompt-box.hyp`: a portable working placeholder with its script and prompt.

Submit that ZIP to ChatGPT. Ask it to return `generated.hyp`, or a `result.zip`
containing the unchanged manifest and exactly one generated `.hyp`.
The generated blueprint must carry `props.promptBoxRequestId` matching the manifest.

Choose **Import result** in the original prompt-box inspector and confirm the
replacement. Assets are validated, uploaded, and loaded before replacement.
The generated object uses the original position and quaternion with unit scale.
It is authored in meters within the box's local bounds, centered horizontally;
its base is at `Y = -height / 2`. The dimensions are not applied again as scale.
The importer creates a fresh blueprint and retains the instance ID.

If the box's prompt, dimensions, position, rotation, or blueprint changes after
export, export a new ZIP and request a new result. The latest export supersedes
earlier exports. Imports are limited to 50 MB, including expanded ZIP content.
Use **Import result**, rather than the ordinary file-drop importer, to replace
the box: normal `.hyp` drops still create new apps, and ordinary ZIP drops still
follow the existing splat workflow.

**Undo prompt-box replacement** is available in Add App and the generated app's
inspector. The builder's usual undo shortcut also restores the original box.
Undo history lasts for the current browser session; the saved request and prompt
remain available across reloads. Invalid files, upload/load failures, and detected
script errors leave or restore the original prompt-box.

This workflow creates one new object. It does not select or modify surrounding
apps. Desktop pointer resizing is supported; VR users can use dimension fields.

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
