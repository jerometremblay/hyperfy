# Folding journal

`journal.js` is the live app source for blueprint `EBE4MSm8zh` in the development world. Changes are uploaded through the agent REST API and applied with a blueprint version check.

Page turns are server-authoritative. The opener sends `journal:turn-request` with direction `1` or `-1`. The server keeps `firstPage` and `turn` in app state and broadcasts `journal:pages`. Each turn includes a start time from Hyperfy's synchronized network clock; all clients animate the same 0.65-second turn. Snapshot state lets late joiners recover the current spread or animation phase. Closing cancels the active animation and retains the accepted destination spread.

Run the multiplayer script checks:

```sh
node --test outputs/folding-journal/journal.test.mjs
```

These exercise independent server/client script runtimes, delayed packets, late joins, ownership, boundaries, rapid clicks, closing, and stale completion timers. They do not replace visual testing in a live multiplayer session.
