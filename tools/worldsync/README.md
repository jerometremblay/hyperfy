# Hyperfy world source tools

The `worldsync` CLI lives in this Hyperfy fork and operates on a separate world-source directory. That directory is the Git source of truth for loose app files and scene placement; it does not contain the live world database.

## Offline commands

```sh
npm run worldsync -- --help
npm run worldsync -- validate --root ../hyperfy-world-jerome --scene local-world
npm run worldsync -- build --root ../hyperfy-world-jerome --scene local-world
npm run worldsync -- verify --root ../hyperfy-world-jerome --bundle tools/worldsync/dist/local-world.hworld
npm run worldsync -- import ./my-app.hyp --root ../hyperfy-world-jerome --key props/my-app
npm run worldsync -- import ./my-app.hyp --root ../hyperfy-world-jerome --key props/my-app --extract
npm run worldsync -- unpack --root ../hyperfy-world-jerome --object props/my-app --keep-original
npm run worldsync -- export-hyp --root ../hyperfy-world-jerome --object props/my-app
```

Generated bundles and HYP exports go under `tools/worldsync/dist/` in the source directory and are ignored by Git. `build` refuses external asset references by default. `--allow-external` keeps those references and marks the bundle nonportable; diagnostics show source paths and line numbers without printing URLs.

Run the focused offline tests with:

```sh
npm run test:worldsync
```

## Source layout

- `objects/**/object.json` defines one stable logical object key and its active source mode (`files` or `hyp`).
- `objects/**` holds scripts and raw assets. Typed `file:./...` references are resolved only in known asset fields and explicit `extraAssets` declarations.
- `scenes/<key>/scene.json` records persistent placements and the separately managed environment object.
- `scenes/<key>/settings.json` contains only portable settings; private and transient settings are excluded.
- `schemas/` defines the current object, scene, settings and bundle formats.

The offline compiler does not execute app scripts. Live inventory, deploy, capture, and the in-world Git worker are later implementation phases and are not available yet.
