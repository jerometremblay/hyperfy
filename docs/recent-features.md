# Recent features

This guide covers additions after the [pinned October 10 fork comparison](fork-changes.md),
reviewed against source through `9e15982` on November 3, 2026. Linked references
contain the detailed controls and API contracts. This is a source review, not a
new live-world or headset validation report.

## World building and rendering

- **Runtime Polyspoon assets:** administrators can load an asset-page or recipe
  URL from Add, place the generated object, edit recipe parameters, and refresh
  from its source. Recipes run in bounded workers; approved recipe bytes and
  approval markers belong in world backups. Worldsync capture does not yet
  include this recipe type. See [runtime recipes](polyspoon-runtime.md).
- **Pixel views and interior cutaways:** choose standard, pixel isometric, or
  retro orthographic rendering in Graphics preferences. Builders can save the
  world default. Build mode and XR use the standard view. Orthographic views
  clip obstructing building interiors while preserving shadow behavior.
  See [rendering and the world-2d seed](rendering.md).
- **Fixture shadow cache:** an optional, off-by-default Graphics setting caches
  stable point/spot shadow maps. It remains experimental; see the
  [cache behavior and limits](experimental-static-shadow-cache.md).
- **Object profiling:** local CPU/resource readings, server timings and on-demand
  GPU comparisons help identify expensive apps. WebView and iframe resource
  counts expose page costs that app-script CPU alone misses. See the
  [profiler guide](object-profiler.md).

## Portals, avatars and audio

- **Portal interaction:** cursor, reticle and XR rays can operate pointer callbacks
  and action nodes through same-world portals. Remote and nested previews do not
  forward input. `previewFront` and `previewBack` let a door script suspend a
  covered preview without disabling travel. Remote worlds can provide a separate
  preview scene. See [portal setup](remote-portals.md) and the
  [Portal API](scripting/nodes/types/Portal.md).
- **Sitting attachments:** the pose editor saves attachment points for placing
  and returning actual world objects. The default sitting pose is also lower;
  saved seat poses are preserved. See [attachment controls](sitting-pose-attachments.md).
- **Scripted avatar poses:** partial bone overrides blend with native animation;
  entry and release can interpolate over a specified duration. Solved target bone
  transforms let a camera aim at the final pose during entry. Local camera return
  can also animate. See [Player](scripting/world/Player.md).
- **External speakers:** streamed audio follows a speaker app, with volume and
  configurable near/far stereo-to-directional playback. See [speakers](speakers.md).

## App scripting

- **Live property edits:** fields with `live: true` emit `props` changes without
  rebuilding the app when every changed field opts in. Use the event payload for
  current values. Normal fields and other blueprint edits still rebuild. See
  [Props](scripting/app/Props.md).
- **Persistent independent apps:** server scripts can spawn and remove app
  instances and persist an app's world transform. See
  [World](scripting/world/World.md#spawnappoptions-string) and
  [App](scripting/app/App.md).
- **Photo filters:** `world.capturePhoto` accepts `none`, `grayscale`, or `sepia`,
  applied to the returned JPEG. See [photo capture](scripting/world/World.md).
