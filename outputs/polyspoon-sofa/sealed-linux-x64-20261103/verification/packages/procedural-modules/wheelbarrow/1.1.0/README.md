# Use a procedural module

Download the family-default procedural `.mjs` from the asset page. Every registered family also publishes `procedural-modules/<family>/<recipe-version>/asset.mjs`, `asset.d.mts`, `metadata.json`, notices and `example.html`. The module is ordinary JavaScript. Consumer construction is synchronous and requires no compiler or GLB loader.

Install the exact external dependency in your application:

```sh
npm install --save-exact three@0.186.1
```

The website download uses a versioned filename. For example:

```js
import { createAsset, disposeAsset, metadata } from './bench-1.1.0.mjs';

const asset = createAsset({ width: 2.1 });
scene.add(asset);
scene.remove(asset);
disposeAsset(asset);
```

Check the family's exported `metadata.controls` for valid parameter names, types and ranges. `metadata` also includes defaults, presets, palettes, constraints, identity, recipe version, source digests and the pinned dependency. All metadata is frozen. Copy the published `asset.d.mts` beside the downloaded module, using the same basename, for TypeScript completion and checking. Numeric bounds and relationships remain runtime checks.

`createAsset()` builds the family default. Each supplied object is a new complete request: omitted controls use canonical family defaults. A preset is explicit: `createAsset({ ...metadata.presets[0].parameters, width: 2.1 })`. Calls never merge with earlier builds. Each group owns independent geometry and materials. Its non-enumerable `dispose()` method and exported `disposeAsset(group)` use canonical cleanup and are idempotent. Remove it from your scene first. Clones do not copy resource ownership; do not dispose the original while a clone still uses its resources.

The website's current-design snippet uses exact `requested` controls and optional appearance. The adjacent JSON download is the full saved design, including `requested`, `applied`, identity and version. Do not pass that saved envelope directly to `createAsset`; use:

```js
const parameters = {
  ...design.requested,
  ...(design.appearance ? { appearance: design.appearance } : {})
};
const current = createAsset(parameters);
```

The created group's `userData.design` records canonical requested/applied parameters and appearance. Inspect these values when constraints normalize parameters. A full `appearance` override replaces the previous appearance; pass every wanted palette, shading and per-part color field. Saved-design migrations continue through the existing catalog `loadDesign` path before parameter extraction. A current-version module does not reconstruct historical geometry.

The separate **Snapshot .mjs** embeds a static GLB and loads it asynchronously. **Generator source (.zip)** contains editable TypeScript and its default configuration. Neither product is the synchronous procedural module.

## Browser example with local Three

Download the version directory's `asset.mjs` and `example.html`. Put these files together with `three.module.js` and `three.core.js` copied from the installed `three@0.186.1/build` directory. Serve that directory over HTTP. The example import map resolves `three` locally, constructs the Group immediately and reports the result in the page. It uses no remote dependency or checkout import. An application renderer, lights, camera and scene are consumer-owned.

Publish modules with `npm run recipe:module`. `npm run recipe:package` and the production build also publish them. Source entries, registration and canonical construction remain the only geometry authority. Modules bundle the selected registered source entry and the shared canonical build adapter. New contributed recipes include their own dependency closure. The six original builtins still share a grouped source entry, so their modules retain that fixed group. The Three ConvexGeometry/ConvexHull and BufferGeometryUtils helper code retains the Three MIT license in every module, with full notices beside the package.

The module also exports `setJointPose(root, id, degrees)`. `metadata.semantics` describes its default; created roots carry variant-specific `userData.openpoly`. See [semantic IDs, units and articulation](semantic-contract.md) for the versioned contract and runtime-pose boundary. Semantic GLB exports include the full authored asset even when preview meshes/groups are hidden.
