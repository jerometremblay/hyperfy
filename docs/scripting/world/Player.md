# Player

Represents a player. An instance of Player can be retrived via [World.getPlayer](/docs/scripting/world/World.md)

## Properties

### `.id`: String

The players unique ID. This is always the same for the same player, even when they leave and come back.

### `.name`: String

The players name.

### `.local`: Boolean

Whether the player is local to this client.

### `.admin`: Boolean

Whether the player is an admin in this world.

### `.position`: Vector3

The players position in the world.

### `.quaternion`: Quaternion

The players rotation in the world.

### `.rotation`: Euler

The players rotation in the world.

## Methods

### `.teleport(position, rotationY)`

Teleports the player instantly to the new position. The `rotationY` value is in radians, and if omitted the player will continue facing their current direction.

### `.push(force)`

Applies a short, impulse-like push to the local player in world-space. Multiple pushes accumulate vectorially and decay over time with high drag.

- **force**: A direction/impulse vector. Accepts a `Vector3`.

Behavior:
- Adds the impulse to the player’s current push; subsequent calls add to the existing push rather than replacing it.
- Can only be called on a local player.

Example:
```js
// Dash forward relative to camera yaw
const FORWARD = new Vector3(0, 0, -1)
const euler = new Euler(0, 0, 0, 'YXZ')
const quat = new Quaternion()

euler.setFromQuaternion(world.getPlayer().quaternion)
euler.x = 0; euler.z = 0
quat.setFromEuler(euler)

const dir = FORWARD.clone().applyQuaternion(quat).normalize()
world.getPlayer().push(dir.multiplyScalar(30)) // short forward burst
```

### `.editSittingPose({ guides })`

Opens the local sitting-pose editor while this client is occupying an anchor. Furniture apps can provide optional alignment guides in anchor-local coordinates. An anchor's optional `profileId` enables an explicit action to save the calibration for other compatible seat instances; the normal Apply action stays specific to the current anchor. It returns `false` when called for another player, outside a seat, or in VR.

```js
world.getPlayer().editSittingPose({
  guides: {
    seat: [0, 0.45, 0],
    backrest: [0, 1.05, -0.2],
    leftArmrest: [-0.35, 0.75, 0],
    rightArmrest: [0.35, 0.75, 0],
    floorY: 0,
  },
})
```

The editor preview is local until Apply. Applying saves a pose for the current player, avatar, and anchor and shares the resulting avatar placement and pose with everyone in the world.

**Download** saves `sitting-pose.glb`, a standard glTF 2.0 binary model containing the currently previewed avatar, its skeleton, and a one-second constant animation named `SittingPose`. It includes posture edits and hips translation in avatar-local coordinates; seat placement and editor guides are excluded. Download also works with an alternate preview avatar and does not require applying or saving the pose.

Import the GLB into Blender using **File → Import → glTF 2.0**, then include the posed avatar in your model or reuse the `SittingPose` action on a matching armature. A different skeleton needs retargeting. Export the combined model as GLB to include its animation. The download is a regular model, not a VRM avatar or a Hyperfy emote: VRM metadata is omitted and toon materials are approximated with standard materials.

### `.getBoneTransform(boneName)`: Matrix4

Returns a matrix of the bone transform in world space.

See [Avatar](/docs/scripting/nodes/types/Avatar.md) for full details.

### `.setPose({ bones, hands, root })`

Overrides the avatar's visible pose on this client. Available for local and remote
players. It returns `false` on the server or for invalid input. Apps share their
gameplay state as usual and calculate the same pose on each observing client.

`bones` uses normalized VRM bone names and quaternions relative to the avatar's
rest pose, as in the sitting editor. Only `hips` accepts a `position` offset.
`hands` optionally contains `left` and/or `right` targets in avatar-local metres:
`{ kind, p, w, f, pole }`. `kind: 'hand'` supplies a wrist and absolute anatomical
finger orientations; `kind: 'controller'` supplies a grip centroid and a closed
holding pose, using the existing WebXR hand frames. `pole` optionally selects an
elbow bend direction in avatar-local coordinates. Native arm IK preserves limb
lengths and clamps targets beyond the avatar's reach. Explicit scripted poses
are not constrained to the sitting editor's arm-angle limits.

For the local player, optional `root: { position, quaternion }` supplies a
predicted world-space render transform as arrays of three and four numbers.
The pose and eye bones update immediately, without moving the player's physical
transform, collision capsule or network state. Remote players cannot use this
option. A root-only pose predicts normal animation without overriding bones.

Call `setPose(null)` to return to normal animation immediately, or
`setPose(null, { duration: 0.45 })` to blend the solved body, arms and fingers back
to normal animation over 450 ms. Duration is in seconds, from 0 to 2. A new scripted
pose cancels the transition. The latest app owns the pose;
another app's cleanup cannot clear it. App destruction also clears its pose.
Poses persist when a player's avatar reloads.

### `.damage(amount)`

Removes health from the player. Health cannot go below zero.

### `.heal(amount)`

Adds health to the player. Health cannot go above 100.

### `.applyEffect({ anchor, emote, snare, freeze, turn, duration, cancellable, onEnd })`

Applies an effect to the player. If the player already has an effect, it is replaced. If this function is called with `null` it removes any active effect.

All options are optional.

**anchor**: an [Anchor](/docs/scripting/nodes/types/Anchor.md) to attach the player to

**emote**: a url to an emote to play while this effect is active

In this fork, `?m=rightArm` overlays only the right shoulder, upper arm,
forearm and hand rotation tracks while retaining locomotion and head look.
Combine it with `&l=0` for a single throw. Optional `&t=0.2` starts that
arm clip at 0.2 seconds for a late snapshot; playback speed still uses `s`.
Movement remains enabled unless the effect also sets `freeze` or `snare`.

**snare**: a multiplier from 0 to 1 that reduces movement speed, where zero means no snaring and one means entirely snared. when snared, players can still turn and attempt to move.

**freeze**: when true, the player is frozen in place and all movement keys are ignored.

**turn**: when true, the player will continually face the direction the camera is looking in.

**duration**: how long this effect should last in seconds.

**cancellable**: whether any movement keys will cancel the effect. if enabled, freeze is ignored.

**onEnd**: a function that should be called either at the end of the `duration` or when the player moves if `cancellable`.

### `.screenshare(screenId)`

Can only be called on a local player.

Prompts the player to share their screen, and then casts it to all video nodes that have a matching `.screenId` property.

### `.setVoiceLevel(level)`

Overrides the players voice chat level to `disabled`, `spatial` or `global`.

By default all players have the voice level defined in the world settings menu, but `.setVoiceLevel` allows apps to override it using any logic needed.

Calling `player.setVoiceLevel(null)` removes the current apps override and reverting to the world setting (unless another app is overriding it).

**NOTE:** Changes stack with priority, so if two apps have set a voice level, the higher priority level takes precendence. Global is the highest priority.

Must be called on the server for security reasons.

### `.setExpression(name, weight, { duration })`

Sets a facial expression and shares it with every player, including late joiners.
Weight is clamped to 0–1. Optional `duration` is a nonnegative number of seconds;
expiry is controlled by the server. Calling again replaces that expression's timer.
Missing expressions on an avatar are harmless.

```js
world.getPlayer().setExpression('happy', 1, { duration: 2 })
```

Accepted names: `blink`, `blinkLeft`, `blinkRight`, `aa`, `ih`, `ou`, `ee`, `oh`,
`happy`, `angry`, `sad`, `relaxed`, `surprised`, `neutral`, `lookUp`, `lookDown`,
`lookLeft`, `lookRight`. Names are case insensitive. VRM 0 aliases `A`, `I`, `U`,
`E`, `O`, `joy`, `Sorrow`, `Fun`, `Blink_L`, and `Blink_R` are also accepted.

Client scripts can change only their local player; server scripts can change any
player. The server rejects unknown names, nonfinite or out-of-range network weights,
invalid durations, and more than 20 requests per player per second. The method returns
`false` for invalid names/weights (and server-side rejection); client requests are asynchronous.

### `.clearExpressions()`

Clears scripted expressions and their duration timers. Automatic blinking and voice
mouth movement continue. The avatar's standard VRM blink/mouth override rules apply.
All preset expressions are replicated; automatic blink and mouth animation are computed
locally from the existing speaking status.

Desktop keys **1–5** toggle happy, angry, sad, relaxed, and surprised respectively,
clearing the previous expression. Higher-priority controls take precedence, and shortcuts
are disabled in build mode, in VR, and while typing in chat or another input.

### .getCamera()

Returns a copy of the local native camera settings: `{ quaternion, zoom, firstPerson, headOnly }`.
Returns null for remote players and servers. Save this object and pass it back to
`setCamera` to restore the viewing direction, distance and mode later.

### .setCamera({ target, quaternion, firstPerson = false, headOnly = false, zoom = 0.3, duration = 0 })

Sets the local desktop player's normal camera once, looking at a world-space
Vector3 target. Zoom is clamped to the native third-person range (minimum 0.3 m).
Set `firstPerson: true` to use the native eye view with zero zoom. Alternatively,
pass a saved `quaternion` instead of a target to restore a previous direction.
With `firstPerson: true`, set `headOnly: true` to hide only the local avatar's
head while keeping its body and arms visible. Other players still see the full
avatar. The default first-person mask keeps the usual hands and feet.
By default this exits first-person mode and updates the native shoulder view without moving
the player or capturing input. Normal mouse look, zoom and collision continue;
the target is not tracked afterward. Returns false for remote players, servers,
XR or invalid target/zoom values.

```js
world.getPlayer().setCamera({ target: new Vector3(2, 0.8, 1), zoom: 0.3 })
```

Set `duration` in seconds (up to 2) for an eased return directly from the currently
visible camera position to the final view. Normal player input and native camera collision remain active during the
transition. A head-only eye view keeps the head hidden until the return finishes.
Teleporting or crossing a portal cancels the transition.
