# Portal

A live view through another portal in the same world. It renders the existing
scene using a camera transformed through the source and destination doorways.
The view follows the viewer, with parallax, destination plane clipping, and
separate views for each XR eye.

```js
const portal = app.create('portal', {
  portalId: app.instanceId,
  target: props.destinationPortalId || '',
  width: 1.6,
  height: 2.4,
  position: [0, 1.2, 0],
})
app.add(portal)
```

| Property | Default | Meaning |
| --- | --- | --- |
| `portalId` | `''` | Unique endpoint ID, normally `app.instanceId`. |
| `target` | `''` | ID of another mounted portal in this world. |
| `width` | `1.6` | Positive aperture width in local units. |
| `height` | `2.4` | Positive aperture height in local units. |

Inherits [Node](../Node.md) transforms, activation, and parenting. The aperture
is centered on the node and faces local +Z. Both sides can show a preview.
An unlinked, missing, or self-referencing destination shows a teal surface.
Moving, resizing, deactivating, or deleting either endpoint updates the view.
The third-person camera boom stops at portal surfaces, like it does at walls,
so the camera stays on the player's side of the doorway after teleporting.
The player can still cross the surface normally.

This node supplies the visual only. The World Portal app supplies its existing
travel trigger and copied IDs. Leave **Destination world URL** empty and paste
the other World Portal's ID into **Destination portal ID**. Same-world travel
uses the preview's half-turn between doorway frames, preserving your viewing
angle and lateral offset. Entering from the front exits the destination's front;
entering from the back exits its back. Arrival is placed clear of the exit
trigger to avoid immediately returning. Both endpoints must
use the updated World Portal app. After updating the engine, refresh the client
and replace existing apps with the new `WorldPortal.hyp` using Import; replacing
an app preserves its instance ID and placement.
Save and reapply destination settings when replacing an existing app; Import
uses the new package's default properties.

Each visible portal renders an extra scene pass per eye, capped at 1024 pixels
on its longest side. Nested portal surfaces are omitted from that pass to prevent
recursion. The primary composer's AO/bloom are not rerun for the destination;
lighting and existing shadow maps are shared with the active view. CSS3D WebViews
are not WebGL content and cannot appear in this preview. Remote-world previews
are not implemented. Gaussian splats use separate Spark LOD/sort buffers per
portal so destination updates do not replace the active camera's buffers.
Desktop rendering, parallax, clipping, the composer, simulated stereo cameras,
and a procedural Gaussian splat scene have been checked in the browser. Headset
rendering and streamed splat LOD still require checks with representative content.
