# Node runtime

The project default is **Node 26.12.1** in `.nvmrc` and both Docker stages. The security workflow reads `.nvmrc`, so it follows that default. The existing package engines and startup policy continue to accept patched Node 22 and 24 releases.

Node 26.12.1 is part of the [October 2026 security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases). Its [Homebrew formula](https://formulae.brew.sh/formula/node) and [Alpine image tag](https://hub.docker.com/v2/repositories/library/node/tags/26.12.1-alpine) were verified on October 24.

## Selecting the runtime

On this Mac, Homebrew's `node` installation is now 26.12.1. Use its path instead of the previous explicit `node@22` path:

```sh
PATH=/opt/homebrew/opt/node/bin:$PATH node --version
PATH=/opt/homebrew/opt/node/bin:$PATH npm run dev
```

For several commands in a POSIX shell:

```sh
export PATH="/opt/homebrew/opt/node/bin:$PATH"
npm ci
npm run test:security
npm run client:build
npm run test:security:server
```

With nvm instead of Homebrew:

```sh
nvm install
nvm use
npm ci
```

`npm ci` reinstalls the locked dependencies. It does not upgrade their versions. The native SQLite dependency loaded successfully after the clean install.

## Compatibility fix required for Node 26

The first Node 26 security run exposed four failures in the outbound Brotli guard. Node 22's bundled Undici uses `undici.globalDispatcher.1`, while Node 26's Undici 8 uses `undici.globalDispatcher.2` and new response callbacks. Wrapping only the legacy dispatcher printed an installation message but left Node 26's fetch unguarded.

The [guard](../src/server/fetchGuard.js) now wraps both available dispatcher slots and checks response headers before forwarding either API's header callback. Parsed header objects and duplicate encoding values are supported; callback receivers and return values are preserved.

Primary sources for the adaptation:

- [Node 26.12.1 dispatcher slots and legacy adapter](https://github.com/nodejs/node/blob/v26.12.1/deps/undici/src/lib/global.js).
- [Node 26.12.1 response callbacks and abort behavior](https://github.com/nodejs/node/blob/v26.12.1/deps/undici/src/lib/core/request.js).
- [Original Coo guard backport](https://github.com/dwebxr/coo-world/blob/66d5ff94742886ae8034661e870af681dbf57749/src/server/fetchGuard.js).

The [guard tests](../test/security/fetchGuard.test.js) exercise real HTTP responses and spy on Brotli decoder construction. They also cover the legacy dispatcher, modern callbacks, repeated installation, gzip/deflate, redirects and streamed bodies.

## Upgrade validation on October 24, 2026

| Check | Result |
| --- | --- |
| Homebrew Node | Upgraded from 26.10.0 to 26.12.1; the missing shared-library startup error is resolved. |
| Native SQLite | In-memory query passed under Node 26.12.1. |
| Clean dependency install | Passed; package.json and package-lock.json unchanged; npm audit reported zero findings. |
| Security suite | 707 passed, zero failures. |
| Guard/control/loader tests on Node 22.23.4 and 26.12.1 | Nine passed on each runtime. |
| Guard after the actual SES lockdown imports | Brotli response rejected on Node 26. |
| Main, browser-client and headless-client builds | Passed. |
| Real built-server integration | Passed with SQLite, PhysX, HTTP/WebSocket permissions, uploads, reconnects and two independently authenticated headless clients. |
| `npm run dev` | Served the actual browser page using a temporary world and isolated configuration. The test server was stopped and the production build restored. |
| Fork regression suite | 495 passed; the same two existing failures remain in promptBox's missing-asset expectation and Portal's catalog asset-count expectation. |

Homebrew also upgraded required libraries (`simdutf`, `ada-url`, `hdrhistogram_c`, `merve`, `openssl@4`) and its dependent `mongosh` from 2.12.0 to 2.13.0. Node 22.23.4 remains installed and launches.

Docker's Node 26.12.1 Alpine tag exists for arm64 and amd64. A Docker build was not run because this host has no Docker CLI. The live 3333 world was not restarted or deployed during the upgrade validation. That validation did not create Git commits.

## Startup warning fixes on October 25, 2026

Three issues in the reported startup output are addressed:

- **`DEP0180: fs.Stats constructor is deprecated`** came from `esbuild-plugin-polyfill-node`'s nested `import-meta-resolve` 3.1.1. A scoped npm override uses the already-installed 4.2.0, whose [resolver avoids constructing `Stats` on failed lookups](https://github.com/wooorm/import-meta-resolve/blob/4.2.0/lib/resolve.js). Only that redundant nested package was removed from the lockfile. A polyfill build with `--trace-deprecation` passed without the warning.
- **`THREE.GLTFLoader: Couldn't load texture blob:nodedata:…`** came from trying to decode images with the server's minimal DOM mock. [ServerLoader](../src/core/systems/ServerLoader.js) now uses the existing GLTFLoader plugin mechanism to skip textures before its image-format plugins run. Model geometry, transforms and material settings still load. PNG, WebP, AVIF and KTX2 paths are covered by [regression tests](../test/security/serverTextures.test.js); the browser's loader is unchanged.
- **Repeated `prim.transparent deprecated`** messages now use the existing `warnOnce` helper. The legacy setter remains ignored, and the single warning names `opacity` as its replacement. A [regression test](../test/security/primDeprecation.test.js) checks repeated writes across multiple primitives and verifies that opacity still controls transparency.

The remaining calls in five active world scripts were subsequently [removed and deployed](../outputs/prim-opacity-migration/README.md). All 14 already supplied an explicit opacity value. Actual node-creation checks reproduced the warning before the edits and emitted none afterward in both server and client branches; a live scan of 38 active script blueprints found no remaining legacy assignments.

Validation under Node 26.12.1: 712 security tests passed in this checkout, all three builds passed, and the real built-server integration passed. Builds ran in an isolated copy, so they did not clear the live world's build directory. The scoped install in this checkout removed one package and reported zero audit findings; npm also marked the deduplicated resolver as a production dependency. The existing development watcher rebuilt the server with these source fixes, and the live HTTPS page on port 3333 returned HTTP 200.

### PhysX warning: repaired scene collider

A read-only scan of the running server's `world/db.sqlite` and eight distinct active model assets reproduced the native warning while cooking **The Meadow / `Ground_Collider`**. This is the `$scene` blueprint, with 2,621 collider triangles:

```text
world/assets/1aa2381f0fb25ba2fe9941b62eb2cad1fe2c77afa0316df8828ba5eba5d3d374.glb
```

PhysX's [triangle-mesh cooking implementation](https://github.com/NVIDIA-Omniverse/PhysX/blob/main/physx/source/geomutils/src/cooking/GuCookingTriangleMesh.cpp) warns about large triangles but still creates the mesh.

The collider was subsequently [repaired and deployed](../outputs/meadow-collider/README.md) on October 25. Three.js's standard tessellation modifier reduced its longest edge from 983.778 to 248.417 units, increasing the triangle count from 2,621 to 2,881. Terrain bounds and visible model data are preserved; 4,221 terrain samples matched within 0.000002355 units. Native PhysX cooking passes without warnings, and the GLB validator reports zero errors and warnings.

Only the live scene model changed, through the existing protected, version-checked Agent API: `$scene` version 250 → 251. The updated model was verified in SQLite, and the world source now contains the same tested repair. The original model and live blueprint are retained for rollback. Deployment did not create Git commits.
