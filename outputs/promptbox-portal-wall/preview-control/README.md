# Explicit portal-door preview control

The native portal node now exposes `previewFront` and `previewBack`, both
defaulting to `true`. Turning off a side skips its destination scene pass and
shows a black aperture without changing traversal, arrival, `doubleside`, or
the destination endpoint. Reopening invalidates cached eye views immediately.
Remote portals with no preview-enabled active side stop requesting and ticking
their replica, then release it after the existing ten-second grace period.

The house explicitly maps its two billiards doors to their existing portal IDs.
Opening enables that door's front preview before animation starts. Closing
retains the preview until the leaf finishes closing. Ordinary doors do not
participate. The portal receiver uses the existing local `app.emit` / `world.on`
pattern and a request handshake for either loading order, late joining and
portal rebuilds. There is no geometry detection or idle polling.

`house.hyp` packages the exact source and original bootstrap model.
`preview.html` embeds that package and reuses the existing geometry viewer;
its saved arrival images are offline illustrations. `webgl-validation.json`
records native portal shader pixels and destination scene-pass counts.
`validation.json` records actual constructor, door-transition and package checks.
`deployment.json` records guarded live readback and server profiling.
`live-validation.json` records native actions in the live client and restored
door states.

The deployment updates only the house script and two portal scripts, keeping
all door/lighting states, geometry, placement, portal links and inspector
settings. It uses `online-world` for `local-world`, and checks the current
blueprints and transforms before writing.

```sh
node outputs/promptbox-portal-wall/preview-control/validate.mjs
node outputs/promptbox-portal-wall/preview-control/build-preview.mjs
python3 outputs/promptbox-portal-wall/preview-control/validate.py outputs/promptbox-portal-wall/preview-control/source.js
python3 outputs/promptbox-portal-wall/preview-control/validate.py outputs/promptbox-portal-wall/preview-control/house.hyp
node outputs/promptbox-portal-wall/preview-control/browser-test.mjs
node outputs/promptbox-portal-wall/preview-control/deploy.mjs
node outputs/promptbox-portal-wall/preview-control/deploy.mjs --write
node outputs/promptbox-portal-wall/preview-control/live-test.mjs
```

`deploy.mjs` defaults to a guarded dry run and refuses a changed target.
After an engine update, existing browsers need a refresh to load the new API.
