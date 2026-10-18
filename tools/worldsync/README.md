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

## Live app-source deployment

`diff` and `deploy` use the Hyperfy Agent API to compare or update one existing
app blueprint. They require a `worldsync.config.json` profile with `apiUrl` and
`writeTokenEnv`, plus a matching `.worldsync/bootstrap-map.json` blueprint ID.
Keep the bearer token in an environment variable; do not put it in the source
repository. The CLI also loads the Hyperfy checkout's local `.env` files when the
configured token variable is not already exported. Remote profiles must use
HTTPS; HTTP is accepted only for localhost.

Example profile:

```json
{
  "profiles": {
    "online-world": {
      "apiUrl": "https://world.example.com/api/agent",
      "writeTokenEnv": "AGENT_API_WRITE_TOKEN"
    }
  }
}
```

From the Hyperfy checkout, compare and deploy the journal source with:

```sh
npm run worldsync -- diff --root ../hyperfy-world-jerome --object apps/hyperfy-news-folding-journal --profile online-world
npm run worldsync -- deploy --root ../hyperfy-world-jerome --object apps/hyperfy-news-folding-journal --profile online-world
```

The command updates only the mapped app blueprint fields `name`, `desc`,
`model`, `script`, `props`, and `disabled`; it leaves placements, world settings,
and the protected environment blueprint alone. It uses the API's version check,
uploads changed `.js` assets through `/scripts`, and reads the blueprint back to
verify the live values. The current Agent API cannot upload changed non-JavaScript
assets, so the command stops before changing the blueprint if one is required.
It also refuses unmapped objects instead of guessing which live app they replace.

## Upstream object updates

Keep canonical objects in `tools/worldsync/catalog/objects/<key>` in the Hyperfy
repository. Tracking records the repository, branch, and object path in that
world object's `object.json`, along with a baseline snapshot. `check` and `update`
read those settings from every tracked object's manifest, so they need no
per-object source path arguments:

```sh
npm run worldsync -- upstream track --root ../hyperfy-world-jerome --object apps/hyperfy-news-folding-journal
npm run worldsync -- upstream check --root ../hyperfy-world-jerome
npm run worldsync -- upstream update --root ../hyperfy-world-jerome
```

Pass `--object <key>` to `check` or `update` to limit either command to one
object. `track` uses the matching object in the Hyperfy catalog and saves the
upstream base inside the world object directory. The configured repository and
ref must match the Hyperfy checkout running `worldsync`; switch or update that
checkout before checking for new upstream versions. `check` reports upstream
changes, local edits, and merge conflicts without writing files. `update`
performs a three-way merge, keeps local-only changes, and leaves an object
unchanged when edits conflict or a changed file is binary. Updating source
files does not deploy them to a live world; use the separate `diff` and
`deploy` commands after reviewing an update.

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

The compiler does not execute app scripts. Full scene capture, placement reconciliation, and the in-world Git worker are not available yet.
