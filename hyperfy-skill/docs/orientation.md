# Orientation and rotation guide

This document expands the orientation rules in `SKILL.md`.

## Readable faces and shared surface coordinates

For every sign, display, label, or directional decoration, state which side is intended for viewing and which way its outward normal points. Define a local surface frame with an origin, a screen-right axis, a screen-up axis, and an outward normal. Do not infer screen-right from world `+X`; derive it from the chosen viewing direction and the surface transform.

Build the panel, frame, lettering, buttons, and artwork in that same local frame. For an inclined assembly, parent the parts under a group with the shared rotation, and position each part relative to the supporting plane and its outward normal. Inspect the surface from its intended viewing side and verify individual glyphs: the word may be in the correct character order while each glyph is mirrored or rotated.

## Inclined surfaces and visibility

Give every inclined structural member two intended endpoints and use the canonical helpers in `templates/orientation_helpers.js` to derive its transform. Do not hand-adjust Euler signs. Transform the member's local endpoints back into world coordinates and compare them with the requested endpoint coordinates. If the member has different ends or end-specific details, verify the directed start/end mapping as well as the undirected segment.

For a sloped screen, sign, or panel, define its top and bottom edges in its local surface frame. Transform both edges and compare their depths along the design's intended depth axis; the top-to-bottom depth difference must have the expected direction and magnitude. A visual check from an isometric angle alone is not enough.

Openings must be gaps in surrounding opaque geometry. Do not place a window, screen, or recessed decoration behind a solid wall, beam, or trim piece and rely on its material or depth to make it visible. Check that surface details sit just off their support plane without being obscured or intersecting it.

## Geometric acceptance pass

Use the exact-package preview when it supports the generated primitives; otherwise use a compatible renderer or the target runtime. Inspect the object from the front, back, left, right, top, and an isometric view. Check text and glyph orientation from the intended side, face normals, slopes, openings, offsets, intersections, and structural alignment. Correct every visible issue, rebuild the package and preview, and repeat the checks before delivery.

For numeric checks:

- For each endpoint-derived beam, rail, brace, or trim piece, transform local `[-L/2,+L/2]` endpoints and compare them with the target endpoints within a small tolerance. Match direction too when end identity matters.
- For each inclined surface, transform top- and bottom-edge endpoints (or centers) and verify their relative depth along the intended depth axis.
- Treat any failed numerical check or visible geometric error as a failed generation. Syntax and package validation do not waive these checks.

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
