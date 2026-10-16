# Cognac leather furniture pack

This pack contains the three-seat beveled sofa and one-seat beveled armchair from the Hyperfy world.

The missing sitting-idle GLB reference was removed from both scripts. Sitting still anchors the player at the seat and keeps the Sit prompts hidden until the effect ends; the avatar uses its normal idle animation.

## Files

- `cognac_leather_beveled_sofa_3_seat.hyp` — importable sofa app
- `cognac_leather_beveled_armchair_1_seat.hyp` — importable armchair app
- `source/` — editable app scripts
- `assets/` — the shared model asset included in both `.hyp` files
- `build.mjs` — rebuilds both `.hyp` files and `../cognac-leather-furniture.zip`

The saved blueprints in this checkout's `world/db.sqlite` now point to the corrected scripts. A world server that was already running may need a reload or restart before its in-memory blueprints use them. To update a different world, use the matching `.hyp` file on each existing app in Builder.

Rebuild with:

```sh
node outputs/cognac-leather-furniture/build.mjs
```
