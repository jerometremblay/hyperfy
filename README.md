# Hyperfy feature fork

This repository is a fork of [Hyperfy](https://github.com/hyperfy-xyz/hyperfy).
It keeps the Hyperfy foundation and focuses this fork on the additional features
below.

## Additional features

### Prompt-box object creation

Create a translucent prompt-box, resize it with face handles, and describe a new
object. Export one ZIP for ChatGPT, then import the generated `.hyp` to replace
the box at its saved position and orientation. See the
[prompt-box workflow](docs/prompt-box.md) for the return format and undo behavior.

### Gaussian splats

Gaussian splats can be loaded, rendered, selected, and transformed in-world.
The implementation comes from the
[Hyperfy splatting repository](https://github.com/moritzhckr/hyperfy-splatting)
and supports common splat formats such as PLY, SPLAT, KSPLAT, SPZ, SOG/SOGS,
and ZIP.

### Extruded pieces

The primitive system includes an `extrude` type for turning a 2D polygon profile
into a solid. Extrusions support depth, beveling, crease-angle smoothing, and
the corresponding editor and physics behavior.

### Private and shared browsers

- **Private browser:** an interactive `webview` gives each user an independent
  browser surface and page state.
- **Shared browser:** a `browser` surface is backed by one server-owned browser
  session, so viewers see the same page and share its input.

### Sitting-pose editor

The in-world sitting-pose editor makes it possible to align an avatar to a seat,
adjust joint rotations and hip placement, preview the result on another avatar,
and save reusable pose styles. It also includes posture presets, joint markers,
rotation gizmos, undo/redo, and seat-local placement controls.

### VR avatar hands and movement

On headsets with WebXR hand tracking, avatar hands follow tracked wrist
orientations and finger movements, including fists and pinches. Tracking works
from the first valid pose without requiring open hands for calibration, and hand
poses are shared with other players. Controllers use their tracked grip poses
with a generic closed holding pose.

Shoulders and elbows respect the sitting-pose editor's joint limits. Elbows bend
downward and outward, with continuity through positions that would otherwise
cause flips. Joint limits can make the avatar stop short of a tracked hand
position; wrist and finger orientations continue to follow tracking. The avatar
body remains visible in first person while its head is hidden.

VR also includes continuous right-stick turning and camera alignment with the
avatar's head. Sitting recenters the view to the seated head position and facing
direction, including after sitting-pose adjustments.

See [avatar hand tracking validation](docs/xr-hands.md) for joint visualization,
local pose recording, and replay instructions.
