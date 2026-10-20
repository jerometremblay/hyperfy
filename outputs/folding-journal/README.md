# Folding journal

`journal.js` is the live app source for blueprint `EBE4MSm8zh` in the development world. Changes are uploaded through the agent REST API and applied with a blueprint version check.

Page turns are server-authoritative. The opener sends `journal:turn-request` with direction `1` or `-1`. The server keeps `firstPage` and `turn` in app state and broadcasts `journal:pages`. Each turn includes a start time from Hyperfy's synchronized network clock; all clients animate the same 0.65-second turn. Snapshot state lets late joiners recover the current spread or animation phase. Closing cancels the active animation and retains the accepted destination spread.

One hidden WebView loads the all-editions wrapper and reads its `journal-page-count` manifest. Each reading surface then loads its issue-specific page directly, instead of nesting the all-editions wrapper once per surface. The opener reports the validated manifest count to the server after assigning all page URLs; the server enables page turns after that count is accepted. The source uses `Cache-Control: no-store`, so the app assigns every page while closed and keeps those iframes mounted off-page rather than relying on browser caching or rebuilding them when reopened. Two-page spreads round an odd page count up by one surface so the final leaf can face a blank page.

The journal page loads the reusable `hyperfy-webview-bridge.js` helper from the public Hyperfy GitHub repository through jsDelivr. An embed can select categories with `data-hyperfy-events`, for example:

```html
<script
  src="https://cdn.jsdelivr.net/gh/jerometremblay/hyperfy@main/hyperfy-webview-bridge.js"
  data-hyperfy-events="click,keyboard">
</script>
```

The journal requests `click` and `keyboard`; the bridge reports every click-like and keyboard event, regardless of target, with a small target description including the nearest link URL. The journal only acts on a trusted primary `click` on non-interactive paper and trusted `keydown` events for Escape or unmodified E. Either key closes the journal for its current reader and releases keyboard focus; E is ignored in editable controls. Hyperfy's WebView `interactive` setting lets the browser follow links inside the frame, and the 3D pointer handler only reserves the click for the iframe. Hyperfy verifies the News origin and handles these events through the iframe-specific `onMessage` callback. Newer WebView runtimes expose a `releaseFocus` callback. Older runtimes fall back to rebuilding the clicked surface to drop iframe focus.

The bridge defaults to `click` and `keyboard`; set `data-hyperfy-events="click"` on pages where relaying key names is not wanted. Keyboard messages include the pressed key, so they can reveal typing even though the bridge never sends field values. Additional categories are `pointer`, `pointermove`, `wheel`, `scroll`, `focus`, `form`, `dragdrop`, and `media`. `pointermove` and `scroll` are coalesced to at most one message per animation frame. Form messages omit field values. Pages that want to share app-specific state can call `window.HyperfyWebViewBridge.emit(name, detail)` with small JSON data; the receiving app must explicitly validate and handle that event. Do not send the `window` object or raw DOM nodes.

When the cursor is linked to the camera, primary clicks on a page turn it directly through the 3D reticle handler, keeping pointer lock active. Free-cursor clicks continue through the iframe bridge so links remain usable.

Run the multiplayer script checks:

```sh
node --test outputs/folding-journal/journal.test.mjs
```

These exercise independent server/client script runtimes, reticle page clicks through ClientPointer, delayed packets, late joins, ownership, boundaries, rapid clicks, closing, and stale completion timers. They do not replace visual testing in a live multiplayer session.
