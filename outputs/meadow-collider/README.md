# Meadow collider repair — October 25, 2026

The Meadow's `Ground_Collider` contained edges up to 983.778 units long. The installed PhysX cooking implementation reproduced its large-triangle warning. The collider is a separate mesh from the visible ground.

The [repair script](../../scripts/repair-meadow-collider.mjs) uses Three.js's standard [TessellateModifier](https://threejs.org/docs/pages/TessellateModifier.html), with a 250-unit edge limit. It splits triangle edges at their midpoints, preserving the terrain shape. The GLB keeps its original binary data and appends the replacement collider attributes and indices. Existing visible geometry, texture bytes, materials, node transforms and collider metadata are unchanged.

| Check | Result |
| --- | --- |
| Collider triangles | 2,621 → 2,881 (+260, about 10%) |
| Maximum collider edge | 983.778 → 248.417 units |
| Model size | 530,256 → 842,056 bytes |
| Terrain bounds | Identical |
| Terrain coverage | All 4,221 samples matched: a 1,600-point interior grid and every original triangle's centroid |
| Largest sampled height difference | 0.000002355 units |
| Native PhysX cooking | Original warning reproduced; repaired mesh cooked without warnings |
| Actual server GLTF loader | Loaded the repair with 2,881 collider triangles |
| Khronos GLB validator | Zero errors and warnings; three informational notices for retained unused original collider accessors |
| Regression tests | Three passed |

Exact-perimeter raycasts can differ at float32 rounding boundaries after subdivision; those are not used for the height comparison. The interior grid and original-face samples matched, including the large outer triangles.

## Source and live update

The tested [model.glb](model.glb) replaced only:

```text
/Users/jerome/metaverse/hyperfy-world-jerome/objects/environment/the-meadow/model.glb
```

The [deployment script](deploy.mjs) uses the existing `online-world` profile and worldsync API client. It uploads the content-addressed model, downloads it to verify its hash, checks that the scene did not change during upload, and updates only `model` through the protected `PATCH /world/scene` endpoint with the current version.

The [deployment record](deployment.json) confirms `$scene` version **250 → 251**. Every other scene field matched the [saved live blueprint](live-before-v250.json), including the live script, props and flags. The new model/version were also verified in the running world's SQLite database. The live HTTPS page continued to return HTTP 200. No server restart was needed.

```text
Original: asset://1aa2381f0fb25ba2fe9941b62eb2cad1fe2c77afa0316df8828ba5eba5d3d374.glb
Repaired: asset://845488eb943361c6bda105b8befa17c40c884e15e3cd94cac5a4e55fe91abded.glb
```

## Reproduce and restore

From the Hyperfy checkout, with Node 26 selected:

```sh
node scripts/repair-meadow-collider.mjs outputs/meadow-collider/original-model.glb /tmp/meadow-repaired.glb
node --test scripts/repair-meadow-collider.test.mjs
```

The repair script refuses a changed input hash and refuses to overwrite its output. The deployment script refuses an unexpected live model or a concurrent scene change.

The [original-model.glb](original-model.glb) is retained for rollback. Restore that file to the source model, upload it through the Agent API if needed, then version-check and patch only the live scene's `model` back to the original asset URL. Preserve the current live scene fields rather than restoring the entire old blueprint.

The repair and deployment steps do not create Git commits.
