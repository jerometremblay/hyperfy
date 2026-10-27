# Rendering direction and integration plan

## User requirement

Ideally switch the view of an existing game; a default configured per world is
also acceptable. Keep an isometric pixel style, with Chrono Trigger and Octopath
Traveler as visual references. Start in a separate workspace.

## Recommendation

Start with another rendering mode in the current Three.js client. Preserve the
world scene, entities, assets, physics, multiplayer, and scripts. Add a world
default and a local view switch. Do not begin with a new renderer backend, a
parallel game runtime, a generic engine plugin system, or mandatory sprite assets.

The native integration supports pixel isometric and retro orthographic views
using existing 3D meshes and avatars. Cinematic rendering remains a comparison
in the prototype.

Use a true orthographic camera for the isometric view; orthographic plus a
45 degree yaw and approximately 35.264 degree elevation gives equal foreshortening
of the three axes. A 2:1 tile-art diamond would use a different elevation.
Choose that visual convention explicitly before building a tileset.

The sprite-world reference and the cinematic 2D/3D reference represent different
camera and asset decisions. A render filter alone will not reproduce either
style. The prototype therefore compares composition first, before a palette
shader or a sprite baking pipeline.

## Verified repository connections

The existing dependencies include Three.js and postprocessing.
The demo was built with installed Three.js r186 and esbuild 0.28.2.

| Connection | Existing code | Consequence |
| --- | --- | --- |
| Default camera | `src/core/World.js` constructor creates a `PerspectiveCamera` and puts it in `world.rig` | A real orthographic mode needs deliberate active-camera ownership |
| Rendering and resize | `src/core/systems/ClientGraphics.js`, `init`, `resize`, `render` | RenderPass, AO and EffectPass retain camera references; resolution changes must retain correct CSS viewport dimensions |
| Screen-space scale | `ClientGraphics.preTick` uses `camera.fov` | Add an orthographic formula; blindly replacing the camera gives invalid screen-space calculations |
| Controls and camera writes | `src/core/systems/ClientControls.js`, `postLateUpdate` | Existing camera `zoom` is camera position Z, not orthographic zoom; respect control binding priority and app camera writes |
| Player movement and camera | `src/core/entities/PlayerLocal.js` | Movement uses camera yaw; pointer look, camera collision, transition, seated state, and XR need explicit behavior when changing modes |
| Picking | `src/core/systems/Stage.js` uses `world.camera` in `setFromCamera` | Rendering and interaction must see the same active projection |
| World settings | `src/core/systems/Settings.js`, `deserialize`, `serialize`, `modify`, `set` | Store the world default through the existing settings lifecycle |
| Server settings validation | `src/core/extras/settingsPolicy.js`; `ServerNetwork.onSettingsModified` | New settings require known-key, value, and permissions validation; adding a UI selector alone is insufficient |
| Local preferences | `src/core/systems/ClientPrefs.js` | Existing client prefs are separate from world settings; avoid a new global preference silently overriding every world |
| Portal camera | `src/core/extras/portalCamera.js` | Current clip-corner calculation and replacement of the depth row assume perspective; use the active inverse projection and its fourth row for orthographic clipping |
| Portal view construction | `src/core/nodes/Portal.js`, `ClientGraphics` arrival preview | Portal views now match the eye projection; saved arrival previews remain perspective |
| Photos and previews | `src/core/extras/PhotoCapture.js` and `ClientGraphics` | A style-correct capture needs the active view and pixel output, rather than an assumed perspective screenshot |
| XR | `ClientGraphics.render` and `PlayerLocal` | XR should keep its existing stereo perspective path |

The camera, graphics, player controls, settings validation, sidebar, compact
chat bubbles, and portal projection changes are implemented. Style-correct
photos remain follow-up work.

The portal assumption was checked numerically with the installed Three.js:
for near 0.1 and far 100, an orthographic far clip corner transformed by the
inverse projection has Z = -100 and W = 1; the current formula hardcodes Z = -1,
which belongs to the perspective construction. The current depth-row replacement
also assumes the perspective fourth row. Projection element 14 is nonzero in
both tested cameras; this is a projection compatibility issue, not division by
zero in the tested orthographic matrix.

## Smallest configuration

Implemented in the running `world-2d` Hyperfy server:

```js
// World setting, stored and validated by the existing Settings system.
renderStyle: 'standard' // or 'pixel-isometric' / 'pixel-retro'

// Local session choice defaults to world.settings.renderStyle.
// A player can change it without modifying the shared world.
```

Start with a fixed sensible pixel resolution, camera angle, and view span.
Expose additional world settings only after an actual world demonstrates a need.
Local quality settings can choose resolution independently from world art style.
The local override stays in memory; persistent overrides need a defined
world identity and an explicit “use world default” action.

## Native world integration

The default data directory is `worlds/world-2d`. See
[the setup guide](../../docs/rendering.md) for a portable named profile, shared
admin-code inheritance, HTTP/HTTPS configuration, and native portal placement.

`npm run world:2d:create` exports the shared village builder as a standard GLB
with native static rigidbody/collider metadata and initializes the normal
Hyperfy database. It preserves an already initialized world on subsequent runs.
The village has 25 collision shapes, including invisible island boundaries,
primitive ground collision, and a catch floor. The scene script returns players
below Y = -5 to the current saved spawn, checking every 0.25 seconds on the server.
Preload-time teleports are deferred until the player controller is ready, and
teleporting clears downward velocity and falling state.
Players use normal Hyperfy avatars, movement, networking, and saving.

The saved `world-2d` renderStyle is `pixel-retro`. The real sidebar provides both a
world default and a local session override. Missing settings in older worlds
default to standard 3D. Build mode and XR select the standard camera.

Pixel modes use an orthographic camera, a framebuffer up to 1024×768 with nearest
presentation, and screen-space follow-camera snapping. It uses the existing
direct render path rather than bloom/AO postprocessing. The 3D camera state is
restored when switching back.

Retro uses the comparison's pitch of 0.88 radians and zero yaw, giving a steep,
straight-on view. Isometric retains its original 45-degree yaw and equal-axis
foreshortening. Framebuffer sizing preserves the viewport aspect ratio; 4:3
viewports render at 1024×768, while wide and portrait views fit inside that budget.

This first integration supports ordinary mesh scenes, avatars, and native
portals. Photos, app-controlled cameras, CSS3D views, seated poses, touch, and
specialized renderers still need compatibility checks. Sprite characters and
cinematic rendering remain preview experiments; the village water is static.

## Implementation slices

1. **Actual world, fixed camera, low-resolution view.** Add an opt-in developer
   mode for a normal Hyperfy scene. Keep the renderer and stage; select an
   orthographic camera and render at reduced resolution with nearest-neighbor
   presentation. Add one explicit camera-switch method to update retained
   postprocessing camera references. Implement orthographic resize and
   screen-space scale. Preserve the perspective camera state for returning to 3D.
   First acceptance: switch both ways without reconnecting, rebuilding entities,
   resetting the player, or changing physical state.

2. **Controls, readability, and live configuration.** Camera-relative movement,
   follow-camera snapping, compatible picking, and user view switching. Add the
   default to the current world settings form and server validation. Compare an
   outdoor scene and a furnished interior. Make a deliberate choice for
   foreground fade/cutaway; orthographic distance makes the existing third-person
   camera-collision behavior unsuitable without adjustment. App-controlled
   cameras and XR take precedence; show/restore the normal view when appropriate.
   First acceptance: interaction and multiplayer remain usable in both views.

3. **Compatibility.** Portal projection/clipping and world-space bubble scaling
   are implemented. Follow up with style-correct photos, app camera overrides,
   CSS3D WebViews, transparent objects, sky effects, splats, skinned avatars,
   touch input, and the build/editor camera.

4. **Art direction.** Once a real scene works, compare a constrained palette,
   dithered lighting, depth-aware edges, and carefully limited bloom. Prefer
   existing Three.js/postprocessing passes where they fit. Try authored sprite
   sheets or baked avatars only if the mesh mode's silhouette is inadequate.
   Directional sprite animation, shadows, equipment, and outfits are separate
   asset work; they are not solved by the demo's single sprite.

## Meaningful production checks

- Round trip view switching preserves player position, velocity, control state,
  app state, entity identity, network session, and the restored 3D camera.
- Isometric projection, resize, DPR, screen-space scale, and picking agree.
- Follow-camera motion and avatar motion are evaluated for pixel shimmer.
- Invalid rendering settings are rejected with the existing permission model.
- Existing world defaults migrate to standard 3D without surprises.
- An app camera override, seated pose, editor, touch control, portal, and XR have
  deliberate behavior and recover the chosen view when the override ends.
- Measure frame time on representative scenes and target devices. Low resolution
  reduces pixel work; it does not reduce every draw call, skinning cost, shadow
  map cost, physics cost, or script cost.

## Prototype verification

The local bundle builds successfully. Browser checks exercised all four view
presets, movement, sprite and mesh treatment, dusk, internal resolution,
world-default selection, and follow-camera controls. Player coordinates stayed
at `2.2, 4.4` through cinematic → retro → standard → isometric switching.
Hyperfy's existing `src/client/public/base-environment.glb` loaded locally.

The initial browser run found a Three.js r186 warning that PCFSoftShadowMap was
removed. The prototype now uses the existing application's PCFShadowMap choice.
The prototype is outside the production build, and has no automated test suite.
The browser FPS counter is only a preview observation, not a benchmark.

## Outstanding decisions

- Strict isometric/2:1 tile projection versus a lower cinematic view.
- Whether this style must work in arbitrary interiors, or worlds can be authored
  to keep the player visible from the chosen view.
- Whether a character stays 3D, uses an authored sprite, or eventually uses a
  generated/baked sprite representation.
- Whether users can always override the world view, or a world can restrict it.

The switchable native village is the first engineering milestone. Use it to
evaluate foreground occlusion and movement before extending the mode to complex
existing worlds or adding a sprite pipeline.
