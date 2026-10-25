# Pickup return hints

The journal and fireplace tools publish a native `keyX` action hint while held by the local player. It appears centered below the pointer for 0.75 seconds, then slides into the screen's lower-left corner over 0.45 seconds. Returning the object clears it; releasing its control also clears its hints.

Source locations:

- Journal: `outputs/folding-journal/journal.js` (also mirrored in the worldsync catalog and default package).
- Fireplace tools: `outputs/pickup-hints/hearth.js`.
- Shared rendering: `src/client/components/CoreUI.js`.

`deployment.json` records the verified script versions deployed to `https://monstre.duckdns.org:3333`. The adjacent world source repository contains the matching scripts. Live deployments updated only each blueprint's script, preserving other fields. The client update requires a browser reload.

Focused checks:

```sh
node --test src/client/components/CoreUI.actionHints.test.mjs src/core/systems/ClientControls.xrUI.test.mjs outputs/folding-journal/journal.test.mjs
```
