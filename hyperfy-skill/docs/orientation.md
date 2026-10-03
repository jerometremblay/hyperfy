# Orientation and rotation guide

This document expands the orientation rules in `SKILL.md`.

## Why endpoint-derived geometry is safer

Euler-angle sign choices are easy to get wrong when a scene contains multiple faces, mirrored parts, stairs, or tapered frames. Instead of asking “which sign should this angle have?”, define where the member begins and ends.

For a local-Y member from `a=[ax,ay,az]` to `b=[bx,by,bz]`:

```text
dx = bx - ax
dy = by - ay
dz = bz - az
L  = sqrt(dx² + dy² + dz²)
h  = sqrt(dx² + dz²)
rx = atan2(h, dy)
ry = atan2(dx, dz)
rz = 0
position = (a + b) / 2
```

With the skill viewer/runtime's XYZ-style rotation application, this maps local `+Y` onto the normalized direction `(b-a)/L`.

The implementation in `templates/orientation_helpers.js` also exposes a numeric endpoint assertion.

## Canonical modeling patterns

### Tapered tower legs

Define each leg with two corner anchors:

```js
const bottom = [sx * bottomHalfWidth, bottomY, sz * bottomHalfWidth]
const top    = [sx * topHalfWidth,    topY,    sz * topHalfWidth]
beamBetween(bottom, top, legThickness, color)
```

For an inward taper, require `topHalfWidth < bottomHalfWidth`.

### X braces

On a face with fixed `z`:

```js
beamBetween([x0, y0, z], [x1, y1, z], t, color)
beamBetween([x1, y0, z], [x0, y1, z], t, color)
```

On a face with fixed `x`, swap the changing X coordinate for Z. Do not use a face-specific hand-written `+/-rx` table.

### Stairs

Define one path:

```js
const start = [x0, y0, z0]
const end   = [x1, y1, z1]
```

Interpolate treads along that path. Generate stringers from near the first tread to near the last tread. Generate handrails from the same path with vertical/lateral offsets. The structural direction should never be independently guessed.

## Debugging orientation

When an element looks wrong:

1. draw a red sphere at endpoint `a` and green sphere at endpoint `b`;
2. temporarily make the beam bright yellow;
3. view from the face normal, not only isometrically;
4. verify the transformed local endpoints numerically;
5. only then adjust thickness/roll/detailing.

If reversing `a` and `b` changes the visible geometry of a square-section beam, the helper or transform convention is wrong; endpoint reversal should describe the same segment.
