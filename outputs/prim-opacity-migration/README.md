# Primitive opacity cleanup — October 25, 2026

The security backport applies `app.create` options through each node's proxy setters. Five active scripts still supplied `transparent: true`, which reaches Prim's deprecated, ignored setter. Each occurrence already had an explicit `opacity`; the existing material code derives transparency from that opacity.

Removed only the 14 redundant flags. Opacity values, invisible collision shapes, glass, flames, lighting, animations and interactions retain their existing options. The legitimate `'transparent'` UI background string in the photo booth is unchanged.

| App | Removed flags | Live version |
| --- | ---: | --- |
| Laser-Cut T-Rex Skeleton | 1 | 2 → 3 |
| Campfire Circle | 1 | 35 → 36 |
| Larch House — Wired Lighting Circuits | 4 | 3 → 4 |
| Steampunk Gas Street Light 01 | 4 | 12 → 13 |
| Steampunk Gas Street Light 02 | 4 | 15 → 16 |

The [plan](plan.json) identifies the exact source files, blueprint IDs and old/new script hashes. Each app directory contains `before.js`, `after.js` and its saved live blueprint.

## Verification

- AST comparison confirms that the script changes are limited to removing the deprecated properties.
- The [startup harness results](verification.json) cover each script's server and client branches using the actual node classes, `splitCreateOptions`, proxy setters and `applyCreateOptions`. All 5,255 created nodes retained matching options and opacity. Fresh module instances reproduce the warning before each edit and emit no warnings afterward. Nodes were constructed without mounting a renderer or native physics scene.
- Eight focused engine tests passed: `primDeprecation.test.js` and `createOptions.test.js`.
- The [live verification](live-verification.json) scanned all 38 active, placed script blueprints and found no remaining legacy assignments. All five updated script references and versions matched the persisted SQLite records. The live world page returned HTTP 200.

## Deployment

The [deployment script](deploy.mjs) uses the existing `online-world` profile, worldsync compiler/client and version-checked Agent API. It uploads and downloads each script to verify its hash, checks the live blueprint again before applying the update, and changes only `script`.

Every other blueprint field is checked against the saved live value afterward. This preserves the dinosaur's live frozen flag even though its source manifest differs. See the [deployment record](deployment.json).

The deployment step does not create Git commits. The engine's one-time compatibility warning remains available for other legacy scripts.
