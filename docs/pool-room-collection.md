# Default pool-room objects

The default Add collection includes Pool Table, Pool Cue Rack, Pool Table Light,
and Wall Light Switch. The pool table includes both the existing furniture model
and the simulator, balls, original OGG sounds, placement controls and volume setting;
no separate invisible game app needs to be placed.

The pool table is positioned at floor level. Its game visuals are grouped 0.708 m
above that origin, matching the existing model's cloth height. The light fixture
uses its existing cloth-level origin; place it on the table's playing surface and
adjust its mounting height in settings. Place the rack and switch on a wall.

Each added or duplicated table defaults to an automatic channel derived from its
entity ID. Leave **Pool game channel** blank to keep tables independent, including
volume. An explicit shared channel shares volume events; it does not mirror balls
or shots. Every table runs its own game, so you can play on either table.

Cues from any rack work on every table, including aiming poses seen by observers.
A player can hold only one cue across all racks. Return it with X before taking
another. Pickup is checked on the server; other racks also hide their pickup
prompts while you hold a cue. Updating or removing a rack preserves the holders
from other racks.

Pendant and wall switch default to `pool-room-lights`. To control another group
of lights separately, give that fixture/switch pair a matching, distinct channel.

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
playable combined table behavior, cross-table rack pickup, and switch/fixture state.
`node --test src/client/components/addableBlueprints.test.mjs` checks the Add-menu
collection source. The four choices were verified in 3333's live Add menu after a
normal development-watcher restart; see `hyperfy-billard/validation/default-pool-catalog.jpg`.
