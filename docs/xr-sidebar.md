# In-world sidebar

In VR, press the left controller's **Menu** button to toggle the desktop sidebar.
The `oculus-touch-v3` and `meta-quest-touch-plus` WebXR profiles expose this button
at index 7 when the browser makes it available. Older Touch profiles reserve it;
**Y** also toggles the panel on Quest controllers. A reserved system button cannot
be intercepted by a web application.

With tracked hands, touch the **Menu** button beside your left wrist using your
right index finger. This opens the same panel without holding a controller.

The panel sits at a fixed point 70 cm in front of the avatar's movement direction,
22 cm below eye level when opened. Walking, physical movement, controller turning,
and teleporting carry the panel with you. Looking around or tilting your head does
not move or rotate it. **Recenter** resets its height for your current posture;
**Close** hides it. The panel is about 54 cm wide and 58 cm tall.

Point your hand at a control and pinch your thumb and index finger to click.
The browser supplies the same pointing ray used in Quest's Home interface and
recognizes the pinch. A blue dot marks the target and turns yellow while pinching.
Hold the pinch and move the pointer to drag sliders. Controller rays and triggers
use the same selection events. **Up** and **Down** scroll the active sidebar pane.

The panel reuses the desktop React sidebar, including its permissions and actions,
through Three.js's `HTMLMesh`. Standard WebXR `targetRaySpace`, `selectstart`,
`select`, and `selectend` drive its pointer events; only a completed `select`
activates a control. The floating surface stays inside Hyperfy rather than using
Quest's system browser window. Stick movement and turning remain available while
the panel is open; world trigger interactions are captured for the sidebar. Leaving VR
restores the desktop sidebar.

Text entry, file pickers, fullscreen, and browser dialogs still depend on what the
headset browser permits inside an immersive session. They do not have a custom VR
keyboard or file picker.

## Validation

Automated tests cover controller menu mappings, toggle debouncing, native pointing
and selection, cancelled gestures, tracking loss, panel placement, avatar movement,
head-independent orientation, transformed player rigs, and input capture. Browser
checks use the actual React sidebar and synthetic WebXR hand rays and selection
events to verify icon clicks, sliders, scrolling, and closing/reopening.
Placement checks use separate headset and player cameras under a translated,
rotated player rig so the panel stays near the avatar's actual view.

Run the focused checks:

```sh
node --test src/core/extras/xrUI.test.mjs src/core/systems/ClientXRUI.test.mjs src/core/systems/ClientControls.xrUI.test.mjs src/core/systems/ClientPointer.test.mjs
```

Headset validation is still required:

1. Open/close with the left Menu button; try Y if the browser reserves Menu.
2. Put down the controllers and open the panel with the left-wrist Menu button.
3. Point and pinch at Preferences and Players, then hold a pinch to drag a slider
   and scroll a long pane.
4. Check that each pinch clicks once, including when pointing at SVG icons.
5. Look around and tilt your head: the panel should remain fixed. Walk using the
   stick, walk physically, turn with the right stick, and teleport: the panel
   should follow your avatar. Use Recenter to reset its height, including seated.
6. Lose/recover hand tracking and open/close the headset's own system menu. Neither
   should produce an accidental click or leave a slider pressed.
7. Check that sidebar trigger presses do not grab/build/activate world objects.
8. Exit and re-enter VR, then verify desktop sidebar behavior after exiting.

References:

- [WebXR reserved buttons](https://www.w3.org/TR/webxr-gamepads-module-1/#ua-platform-reserved-buttons)
- [Quest Touch Plus profile](https://github.com/immersive-web/webxr-input-profiles/blob/main/packages/registry/profiles/meta/meta-quest-touch-plus.json)
- [Three.js HTMLMesh](https://threejs.org/docs/pages/HTMLMesh.html)
- [Meta WebXR hands and pointing rays](https://developers.meta.com/vr/documentation/web/webxr-hands/)
- [WebXR primary actions and cancellation](https://www.w3.org/TR/webxr/#primary-action)
