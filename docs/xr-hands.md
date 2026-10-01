# Checking avatar hand tracking

Hand poses use absolute WebXR wrist and joint orientations in avatar-scene space.
The avatar computes fixed anatomical corrections from its VRM rest pose before
animations run, then converts each desired orientation through its current raw
parent. Tracking can start with a fist; no startup pose is treated as neutral.
Thumb corrections include the rolled skin surface specified by the VRM T-pose.
The terminal segments use their incoming rest direction because VRM has no tip bones.

The shared `h` packet contains `kind`, `p`, `w`, and `f`. `kind` distinguishes tracked
hands from controller grips. The server filters packets and remote avatars use the
same mapping. Reload the server and all clients together when switching from the
old calibration packet format.

Controller grips use the standard grip-space axes, with the wrist behind the grip
centroid by the avatar's palm length, and a generic closed holding pose. This is an
approximation; exact fit to each controller model has not been verified.

VR shoulders and elbows use the posture editor's `clampBoneRotation` limits in
the same normalized rest frame. The arm solver starts from rest each frame to
avoid accumulated twist. Elbows prefer a downward, outward bend and retain their
bend side when the wrist crosses the pole direction. Joint limits take priority
over wrist position, so a constrained reach can stop short of the tracked hand.
Absolute wrist and finger orientations still follow tracking.

## Validation

On October 1, 2026, the user confirmed in the headset that hand orientations are
correct and fingers move correctly. The automated regressions also check palmward
curl, terminal segments, thumb orientation, wrist flips, and shared poses.

## Headset comparison and recording

Add `?xrHands=1&xrRecord=1` to the world URL (use `&` if it already has a query).
Enter VR. Spheres show Three.js's standard tracked joints alongside the avatar.
Recording starts with the first valid hand/controller pose, captures at most 30
frames per second for 10 seconds, and downloads `xr-hands.json` when leaving VR.
It stays local; it is not uploaded. Each frame includes raw hand joints, the shared
pose, and XR/avatar root transforms.

During the recording:

1. Start with closed hands, then open them.
2. Close into fists again and point with each index finger.
3. Pinch each thumb to its index finger.
4. Rotate wrists palm up/down while holding the same curl.
5. Move the hands while preserving wrist orientation; turn or sit if possible.

Repeat with controllers and check that both hands wrap the handles. Remove the
query parameters to return to the normal view.

## Replay

From the repository root:

```sh
npm run xr:hands:replay -- /absolute/path/to/xr-hands.json
```

For another avatar, pass its VRM file as the second argument. The bundled avatar is
the default. Replay sends the recorded pose through the network sanitizer and the
actual avatar factory, then compares each rendered segment direction with the raw
tracked joint-to-child direction. It settles smoothing per frame to isolate the
mapping, reports the largest errors, and returns failure above 15 degrees.
This measures direction agreement, not mesh appearance, thumb/index contact,
elbow comfort, or live tracking latency. A real headset recording remains needed;
the automated regressions use synthetic anatomical poses.

References:

- [WebXR hand joint frames](https://www.w3.org/TR/webxr-hand-input-1/#xrjointspace)
- [WebXR controller grip frames](https://www.w3.org/TR/webxr/#dom-xrinputsource-gripspace)
- [VRM T-pose](https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/tpose.md)
