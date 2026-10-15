# Laser-cut T-Rex extrusion demo

Import `laser_cut_t_rex.hyp` into Hyperfy. The skeleton uses 67 native extruded pieces and an empty GLB loader bootstrap.

Open `laser_cut_t_rex_preview.html` for a standalone interactive preview of the exact packaged asset. Drag to orbit; scroll to zoom. No network dependencies.

The spine placement accounts for Hyperfy centering extrusion bounds. Each kit piece is now one solid extrusion. Overlapping skull and limb plates occupy separate depth layers with 0.05 spacing, exceeding their beveled thickness. Decorative overlapping burn layers were removed.

A triangle-plane and projected-overlap check found zero overlapping coplanar faces between different pieces; the previous version failed that check. Perpendicular cross-piece intersections and the original broad static colliders are retained. This is an assembled visual demo, without fabricated clearance slots.

JavaScript syntax, primitive preflight, actual Hyperfy node constructors (139 nodes, 67 extrusions), package hashes and lengths, source bytes, and exact preview-package bytes passed. Side and perspective views were visually inspected. No live-world import was performed.

Lower jaw corrected: its tooth tips point upward toward the upper jaw. Package and embedded preview updated; syntax, 139-node smoke test, tooth direction, asset hashes, and embedded package bytes verified. This correction has not been imported into a live world.

Lower jaws now sit 5 mm inside the upper tooth rows and angle downward 16 degrees to open the mouth. The earlier full-scene overlap check and visual inspection predate this alignment; syntax and the 139-node smoke check passed again.
