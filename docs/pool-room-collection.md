# Default pool-room objects

The default Add collection includes Pool Table, Pool Cue Rack, Pool Table Light,
and Wall Light Switch. The pool table includes both the existing furniture model
and the simulator, balls, original OGG sounds, placement controls and volume setting;
no separate invisible game app needs to be placed.

The pool table is positioned at floor level. Its game visuals are grouped 0.708 m
above that origin, matching the existing model's cloth height. The light fixture
uses its existing cloth-level origin; place it on the table's playing surface and
adjust its mounting height in settings. Place the rack and switch on a wall.

Table and rack default to the shared `pool-room` channel. Pendant and wall switch
default to `pool-room-lights`. These differ from the existing installed house
objects, so newly added objects do not control that pool room. For another set,
change each pair to matching, distinct channels in their settings.

Rebuild after changing the source apps:

```sh
node hyperfy-billard/upstream-table/build.mjs
node hyperfy-billard/build.mjs
node scripts/create-pool-collection.mjs
```

The collection builder reads the existing pool/table/rack packages and the two
light object sources in `tools/worldsync/catalog/objects/apps/`. It emits four
self-contained packages into `src/world/collections/default/`. The combined table
script preserves the existing furniture and game scripts, adapting only the game
root and world-position getter to cloth height. Sound assets retain the upstream
provenance and license recorded under `hyperfy-billard/`.

The server imports its built-in collections on startup. Restart/reload the server
and reconnect clients after rebuilding the packages to refresh the Add menu.

Verification: `npm test --prefix hyperfy-billard` covers package dependencies,
playable combined table behavior, matching rack pickup, and switch/fixture state.
`node --test src/client/components/addableBlueprints.test.mjs` checks the Add-menu
collection source. The four choices were verified in 3333's live Add menu after a
normal development-watcher restart; see `hyperfy-billard/validation/default-pool-catalog.jpg`.
