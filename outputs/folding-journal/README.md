# Folding journal

## Daily content and the ChatGPT scheduled task

The [Daily Hyperfy Activity task](https://chatgpt.com/scheduled?automationId=6ace4e1aa46881919663561af465546b&automationSource=cloud&edit_modal=true) researches journal content daily; its schedule displayed 5:00 a.m. when inspected on 21 October 2026. It publishes only materially new, verified developments to [The Hyperfy Journal](https://hyperfy-news.jerometremblay.chatgpt.site). Quiet days leave the journal unchanged and produce no notification.

The task researches upstream Hyperfy, the public engine fork, Hyperfy apps and the wider ecosystem using a non-overlapping research cutoff. It checks existing reports for duplicates, then publishes through the site's `/api/reports` endpoint and verifies the saved report and issue archive. Same-date corrections preserve unrelated published stories and create an immutable revision. Personal/private world-instance repositories are excluded. Routine updates change feed data rather than redeploying the site; the in-world journal discovers new editions when opened.

To inspect or recover the executed prompt, sign in to ChatGPT, open **Scheduled**, find **Daily Hyperfy Activity**, and choose **Edit**. The **Prompt** field contains the complete saved instructions, including editorial tone, repository attribution, layout, archive preservation and no-news rules. Copy that field and close the dialog without saving for a read-only recovery. The prompt recovered on 21 October 2026 contained 14,160 characters. Codex's automation tool does not expose this ChatGPT task; it was recovered through the signed-in ChatGPT browser interface. The task was left unchanged.

## In-world app and interaction

`journal.js` is the live app source for blueprint `EBE4MSm8zh` in the development world. Changes are uploaded through the agent REST API and applied with a blueprint version check.

Opening transitions the reader's native camera into first person, aimed at the center of the reading spread, over 0.65 seconds. Closing restores the direction, zoom and view mode saved at the first open with the same transition, even after looking around while reading. Duplicate open state does not replace the snapshot. Other players' views are unaffected. This requires the updated client camera API and a browser reload; older clients retain the paper animation without the camera transition.

Page turns are server-authoritative. The opener sends `journal:turn-request` with direction `1` or `-1`. The server keeps `firstPage` and `turn` in app state and broadcasts `journal:pages`. Each turn includes a start time from Hyperfy's synchronized network clock; all clients animate the same 0.65-second turn. Snapshot state lets late joiners recover the current spread or animation phase. Closing cancels the active animation and retains the accepted destination spread.

On every opening, one hidden WebView reloads the all-editions wrapper with a fresh request URL and checks for new releases. Cached manifests cannot acknowledge the new opening. Failed loads retry after 30 seconds, at most twice while open. The WebView reads its `journal-page-count` manifest and then unmounts. Each reading surface loads its issue-specific page directly, instead of nesting the all-editions wrapper once per surface. The opener reports the validated manifest count to the server after assigning page URLs; the server enables page turns after that count is accepted. Only the current spread is mounted, with at most four surfaces kept loaded during a turn. Unused pages are inactive native nodes, so they have no iframe or CSS3D renderer. Finishing the closing animation unmounts every reading surface, and closed journals have no idle frame callbacks on clients or servers. Reopening remounts the retained spread and checks a fresh manifest. Two-page spreads round an odd page count up by one surface so the final leaf can face a blank page.

The journal page loads the reusable `hyperfy-webview-bridge.js` helper from the public Hyperfy GitHub repository through jsDelivr. An embed can select categories with `data-hyperfy-events`, for example:

```html
<script
  src="https://cdn.jsdelivr.net/gh/jerometremblay/hyperfy@main/hyperfy-webview-bridge.js"
  data-hyperfy-events="click,keyboard">
</script>
```

The journal requests `click` and `keyboard`; the bridge reports every click-like and keyboard event, regardless of target, with a small target description including the nearest link URL. The journal only acts on a trusted primary `click` on non-interactive paper and trusted `keydown` events for Escape or unmodified X. Escape releases keyboard focus while leaving the journal open. X closes the journal for its current reader and releases keyboard focus; X is ignored in editable controls. The same X shortcut is captured in world controls only while the local player is reading the journal. Hyperfy's WebView `interactive` setting lets the browser follow links inside the frame, and the 3D pointer handler only reserves the click for the iframe. Hyperfy verifies the News origin and handles these events through the iframe-specific `onMessage` callback. Newer WebView runtimes expose a `releaseFocus` callback. Older runtimes fall back to rebuilding the clicked surface to drop iframe focus.

The bridge defaults to `click` and `keyboard`; set `data-hyperfy-events="click"` on pages where relaying key names is not wanted. Keyboard messages include the pressed key, so they can reveal typing even though the bridge never sends field values. Additional categories are `pointer`, `pointermove`, `wheel`, `scroll`, `focus`, `form`, `dragdrop`, and `media`. `pointermove` and `scroll` are coalesced to at most one message per animation frame. Form messages omit field values. Pages that want to share app-specific state can call `window.HyperfyWebViewBridge.emit(name, detail)` with small JSON data; the receiving app must explicitly validate and handle that event. Do not send the `window` object or raw DOM nodes.

When the cursor is linked to the camera, primary clicks on a page turn it directly through the 3D reticle handler, keeping pointer lock active. The WebView runtime disables iframe pointer events and drops iframe focus on camera lock, including when surfaces are created while locked; cursor hover cannot re-enable iframe input until the camera is unlocked. Free-cursor clicks continue through the iframe bridge so links remain usable.

Run the multiplayer script checks:

```sh
node --test outputs/folding-journal/journal.test.mjs
```

These exercise independent server/client script runtimes, native WebView mount/unmount behavior, zero closed-state frame callbacks, bounded page mounting, reticle page clicks through ClientPointer, delayed packets, late joins, ownership, boundaries, rapid clicks, closing, and stale completion timers. They do not replace visual testing in a live multiplayer session.

Source changes are also mirrored in `tools/worldsync/catalog/objects/apps/hyperfy-news-folding-journal/script.js` and the default `HyperfyJournal.hyp` package. The WebView input fix requires rebuilding the client and reloading browser sessions; updating only an app script cannot apply that runtime fix.
