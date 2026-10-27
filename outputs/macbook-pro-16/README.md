# MacBook Pro 16 — Space Gray

Standalone, individually movable Hyperfy app deployed on the leather pad of the
upstairs work desk in the 3333 world.

- `macbook-pro-16.hyp`: importable app, including its script, logo PNG, GitHub screenshot and an empty GLB bootstrap.
- `macbook.js`: rounded extrusion model and shared opening/closing interaction.
- `preview.html`: self-contained interactive preview of the exact package bytes.
- `validation.json`: native constructor, geometry, orientation, hinge, and event checks.
- `deployment.json`: live entity, source readback, placement, and server profiling.

Use the nearby **Open MacBook / Close MacBook** action with E. The screen shows a
static screenshot of the public `jerometremblay/hyperfy` GitHub repository. The lid opens
to 102 degrees, animates on clients, and has no idle frame callbacks. The closed
display clears the keyboard. Local Y=0 is the bottom of the rubber feet.
The hinge uses a low rear pivot and an offset display assembly. The lid perimeter
meets the deck when closed, and its lower edge swings just behind the base when
opened, below the deck height.

The body, lid, keys, trackpad, and small details use native extrusions with rounded
profiles and bevels. Dimensions follow the 16-inch Space Gray model with Touch Bar.
The Apple logo is a single transparent PNG on the lid, embedded in the package;
its source attribution is recorded in `apple-logo-source.json`.
The screen uses the same native Image node as the logo, with its screenshot
embedded in the package. It follows the lid through native transforms and faces
down into the closed laptop. There is no WebView, iframe, page loading or screen
update callback.

Rebuild and validate from the Hyperfy repository root:

```sh
node outputs/macbook-pro-16/build.mjs
node outputs/macbook-pro-16/validate.mjs
node outputs/macbook-pro-16/build-preview.mjs
python3 hyperfy-skill/tools/validate_result.py outputs/macbook-pro-16/macbook-pro-16.hyp
```

`deploy.mjs` uses the configured `online-world` profile, checks the current desk and
laptop state, reads uploaded assets back byte-for-byte, and verifies unchanged
placements for the other objects. Run without `--write` to inspect its plan.

`deployment-baseline.json` records only the laptop and desk state used to prepare
this update. Deployment checks it before replacing the script and preserves all
existing placements. Full world snapshots and diagnostic previews stay local.

No Git commit was created.
