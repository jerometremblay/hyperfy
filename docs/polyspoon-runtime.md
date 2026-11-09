# Runtime Polyspoon recipes

An administrator can add a self-contained Polyspoon `.mjs` recipe without
rebuilding or restarting the world. The module must export `metadata`,
`createAsset` and `disposeAsset` and may import `three`. Controls come from
`metadata.controls`; the returned Three.js object supplies the meshes and the
static collision geometry. Parameter changes rebuild the app and collider.

In the world, open **Add**, paste a Polyspoon asset page URL or direct HTTPS recipe URL into **Polyspoon
asset or recipe URL**, select **Load**, then **Place**. Position the object with the normal builder controls;
its parameters appear in the object's inspector. The original URL is saved in
Metadata. To check for a new recipe manually, select the object and choose
**Refresh from source** in its inspector. Refresh preserves its placement and
parameters, and refuses an update that cannot build with the current parameters.
Linked copies share a blueprint and update together. Older objects created
before URL retention need their source URL entered in Metadata first. For direct recipe URLs, the host must allow cross-origin browser downloads.
Polyspoon asset links are resolved by the world server using Polyspoon’s catalog;
assets delivered only as source packages are not supported. The source is downloaded without cookies and compiled by the
world server; it runs only inside the sandbox described below. Only connected
administrators can register recipes this way.

Alternatively, from this checkout, with the worldsync profile's write token available:

```sh
node scripts/add-polyspoon-recipe.mjs \
  --url https://example.com/model.recipe.mjs \
  --name "Example" --position '[0,0,0]' \
  --params '{"width":1.2}' \
  --root ../hyperfy-world-jerome --profile online-world
```

The URL must be a direct HTTPS response; redirects are refused. `--file` can be
used instead of `--url`. The command checks the recipe and parameters, compiles
the module, registers its content-addressed bytes, creates a blueprint, and
places it; when `--url` is used, the source URL is saved on the blueprint. Recipe registration requires the Agent API write token. If placement
fails after blueprint creation, the blueprint may remain unplaced.

Recipes run in separate workers on both server and clients. Each worker uses an
SES compartment with a bundled copy of Three.js; it receives only parameters
and returns bounded geometry and control data. Recipes cannot access the world,
host Three.js objects, filesystem, network, or a module loader. Workers time out
after ten seconds, and the server worker also has a V8 heap limit. This is not
an operating-system process sandbox and does not guarantee protection from
every resource-exhaustion attack.

Recipe output currently supports mesh geometry and basic or standard materials;
textures and other material types are rejected. Registration requires a connected admin session or the Agent API write token.
Ordinary builders and app scripts cannot approve recipes.
The recipe API also accepts `validateOnly: true` to test a bundle without
storing or approving it.

The compiled recipe asset and its approval marker are kept in the world
directory and included in whole-world backups. Keep both when moving or
restoring a world. Worldsync does not yet capture or deploy this recipe type:
its source capture must not be treated as a complete backup of these objects.
Existing connected clients must reload after the initial engine update; later
recipe additions and parameter edits do not require a reload.

## Polyfork HD models

Admins can choose **New Polyfork Object** in Add. Configure the server with
`POLYFORK_CDN_URL`, or enter an account CDN URL in the browser. HD is preferred by default; objects without an HD edition use
the standard edition. Uncheck **Prefer HD edition** to use standard models. A browser-entered URL is saved in that browser. The selected URL is
used to fetch HD modules directly from Polyfork; the original model page is
retained for refresh.

New Polyfork imports use `polyfork://` models. The server downloads the module
directly from Polyfork, stores the exact source and a content-addressed compiled
module, and runs the module in an SES compartment with Three.js supplied by
Hyperfy. The model's original Three.js groups and pivots remain intact in one
geometry attachment. In the script editor, the **Polyfork .mjs** tab displays
the saved source alongside the separate **App script** tab. Previously imported `polyspoon://` models
continue to use their existing worker path; refresh a Polyfork object to import
it again with the native path. Native modules run on the world thread, so unlike
worker recipes they cannot be interrupted by a timeout. Only direct Polyfork
CDN downloads are accepted for this path.

Native models create a static collider for the complete model. An app can opt
into script-controlled attachment with `props.__manualGeometry = true`, then
call `const geometry = app.attachGeometry()` and
`geometry.setPartRotation('door', 'y', angle)`. The module is selected by the
blueprint and loaded by Hyperfy; app scripts do not use JavaScript imports.
The rotation preserves the model's own pivot and rebuilds its static collider.
Use this for discrete changes, not per-frame animation.
Worldsync and `.hyp` export do not yet package native Polyfork modules; retain
the registry and assets in whole-world backups.

The recipe worker carries generated RGBA data textures and grouped physical
materials into Hyperfy at their original dimensions. The worker accepts textures
up to 2048 pixels per dimension and applies bounded total texture and geometry limits. Unsupported
texture formats or material maps are rejected; custom shader modifications are
not reproduced. Polyfork retains its own licensing terms for the assets.
