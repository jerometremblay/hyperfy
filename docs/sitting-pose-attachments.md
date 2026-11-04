# Sitting-pose attachment points

While seated on desktop, open **Customize sitting** and select **Attachments**.
Choose **Add point**, select its point button or marker, then use **Move** or
**Rotate**, the gizmo, or the numeric coordinates to place it. Points are relative
to the avatar, including its saved seat placement. Apply the pose to save them
for your player, avatar, and seat. Reusable styles retain point transforms,
without retaining the identities of attached objects.

Close the editor while remaining seated. Aim near a point to reveal its orb,
click an empty orb, then click an app to move that object to the point's position
and rotation. Escape or right-click cancels the selection. Click an occupied orb
to return its object to the position and rotation recorded before attachment.
Returning the object is required before removing its point.

Moving or returning objects requires builder permission. Pinned objects and
objects being moved or uploaded are unavailable. The server validates the
current seat and saves and broadcasts the object transform; other players see
the actual app move. If someone has moved the app elsewhere since attachment,
the return is refused rather than overwriting that newer placement.

These controls are available outside build mode and XR, with the pose editor
closed. They place world objects; they do not provide continuous bone parenting
or a hand-held object API.

The default sitting pelvis is now 15 cm lower than the previous default.
Existing saved per-seat poses retain their own offsets. Use **Placement** to
adjust the whole avatar against furniture, and posture controls to adjust hips
within the avatar.

See the [Player pose API](scripting/world/Player.md) for editor invocation,
pose saving, scripted poses and GLB export. Implementation:
[editor](../src/core/systems/ClientPoseEditor.js),
[desktop interaction](../src/core/extras/SeatAttachments.js), and
[server validation](../src/core/systems/ServerNetwork.js).
