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
