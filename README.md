# Hyperfy feature fork

This repository is a fork of [Hyperfy](https://github.com/hyperfy-xyz/hyperfy).
It keeps the Hyperfy foundation and focuses this fork on the additional features
below.

## Additional features

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
