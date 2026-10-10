# Hyperfy feature fork

This repository is a fork of [Hyperfy](https://github.com/hyperfy-xyz/hyperfy).
It keeps the Hyperfy foundation and focuses this fork on the additional features
below.

## Additional features

### Real-time day–night cycle and lighting

The sun and moon follow their real positions at the latitude and longitude set in
**World Settings**. The cycle includes seasonal sunlight, a light-blue daytime sky,
twilight, moon phases, and moonlight. Nighttime ambient lighting keeps unlit surfaces
visible. The default location is `45.75689615017221, -74.01942099403277`.

Builders can use `/time set 13h23` to smoothly fast-forward to the next 13:23 over
up to five seconds, then continue at normal speed. The server owns the clock, and commands
use the shared **World Time Zone** (default `America/Toronto`). The time offset is saved with
the world. `/time reset` returns to real time. Disabling the cycle restores the app sky.

Scripts can read coordinates with `world.getLocation()` and the shared cycle time with
`world.time` (Unix milliseconds). Create point, spot, and directional lights with
`app.create('light')`, including shadows.
See the [day–night cycle guide](docs/day-night-cycle.md) and
[lighting reference and examples](docs/scripting/nodes/types/Light.md).

### Prompt-box creation and construction edits

Create a translucent prompt-box, resize it with face handles, and describe a new
object. Export one ZIP with intersected apps and their coordinates for ChatGPT,
then import returned `.hyp` files to edit the existing construction or create a
standalone object. Construction edits keep their original placement; the box marks
the intended region. See the
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

The [in-world sidebar](docs/xr-sidebar.md) opens within arm's reach with the left
Menu button (Y if reserved), or by touching the Menu button beside your left
wrist. Point with a tracked hand and pinch, or use controller triggers, to interact
with the existing sidebar, with Recenter and scrolling controls on the panel.
