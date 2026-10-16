# Folding journal

`journal.js` is the live app source for blueprint `EBE4MSm8zh` in the development world. Changes are uploaded through the agent REST API and applied with a blueprint version check.

Page turns are server-authoritative. The opener sends `journal:turn-request` with direction `1` or `-1`. The server keeps `firstPage` and `turn` in app state and broadcasts `journal:pages`. Each turn includes a start time from Hyperfy's synchronized network clock; all clients animate the same 0.65-second turn. Snapshot state lets late joiners recover the current spread or animation phase. Closing cancels the active animation and retains the accepted destination spread.

One hidden WebView loads the all-editions wrapper and reads its `journal-page-count` manifest. Each reading surface then loads its issue-specific page directly, instead of nesting the all-editions wrapper once per surface. The opener reports the validated manifest count to the server after assigning all page URLs; the server enables page turns after that count is accepted. The source uses `Cache-Control: no-store`, so the app assigns every page while closed and keeps those iframes mounted off-page rather than relying on browser caching or rebuilding them when reopened. Two-page spreads round an odd page count up by one surface so the final leaf can face a blank page.

Run the multiplayer script checks:

```sh
node --test outputs/folding-journal/journal.test.mjs
```

These exercise independent server/client script runtimes, delayed packets, late joins, ownership, boundaries, rapid clicks, closing, and stale completion timers. They do not replace visual testing in a live multiplayer session.
