# World source authoring

## Objects

Create `objects/<logical-key>/object.json`. Keys use lowercase path segments separated by `/` and must match the directory. A files-mode manifest looks like:

```json
{
  "schemaVersion": 1,
  "key": "furniture/chair",
  "mode": "files",
  "blueprint": {
    "name": "Chair",
    "model": "file:./chair.glb",
    "script": "file:./script.js",
    "props": {
      "fabric": { "type": "texture", "url": "file:./textures/fabric.webp" },
      "label": "file:./this-is-an-ordinary-string"
    },
    "disabled": false,
    "frozen": false
  },
  "extraAssets": [
    { "file": "file:./animations/sit.glb", "type": "emote" }
  ]
}
```

The compiler resolves `file:./...` only in `model`, `script`, `image.url`, typed asset descriptors in `props`, and `extraAssets`. It leaves ordinary strings alone. Local files must stay inside the object directory, use a supported type and extension, be hydrated from Git LFS, and fit the read limits.

Scripts are source files and are never executed by the CLI. Script-only objects can use `"model": "script-only"`. External URLs are retained as external references and reported without printing their URL values. A bundle with external references requires the explicit `--allow-external` option and is marked nonportable.

## Scenes

Create `scenes/<scene-key>/scene.json`. Each instance has a stable logical `key`, an `object` key, finite meter coordinates, a unit `[x,y,z,w]` quaternion, positive scale and a `pinned` flag. Repeated instances may reference one object source so they share a single blueprint. An object may be used as the environment only when its manifest declares `"role": "environment"`.

Keep reviewed portable settings in the adjacent `settings.json`. Do not include live URLs, tokens, user ranks, player data, volatile time offsets or real-world coordinates without review.

## Native HYP packages

Use `worldsync import path/to/app.hyp --key category/name` to retain an unknown app as exact HYP source. Use `--extract` to promote it to editable files; add `--keep-original` to retain an archival copy. `worldsync unpack --object category/name` performs the same promotion for an existing HYP-mode object. The original HYP remains authoritative until promotion has been validated and committed.

The compiler verifies embedded asset hashes and semantic references without running scripts. Extraction writes `script.js`, `model.<ext>`, and deterministic asset paths; it checks that compilation preserves blueprint fields and embedded payloads. Binary models remain binary assets, not source projects.
