# Coo security follow-ups, 2026-10-27

Issue: https://github.com/jerometremblay/hyperfy/issues/18

Compared Hyperfy `00d40a1a990ac10fa8faaa66ace312cb3b1b25b6` with Coo
`f40fb416e19909b1a22e5807d18be587b6d8b871`. This implementation adapts the
physics input checks, native lifetimes, budgets, retry behavior, idle resource
cleanup, JWT configuration check, and HTTP error handling from Coo PRs
[17](https://github.com/dwebxr/coo-world/pull/17),
[18](https://github.com/dwebxr/coo-world/pull/18),
[19](https://github.com/dwebxr/coo-world/pull/19), and
[20](https://github.com/dwebxr/coo-world/pull/20), plus the HTTP handling from
[16](https://github.com/dwebxr/coo-world/pull/16).

## Resulting behavior

- Invalid dimensions, poses, quaternions, masses, joint limits, geometry and
  accumulated pushes are rejected before they can corrupt the shared simulation.
  Mesh extents come from scanned vertices rather than file-supplied bounding boxes.
  Nodes skipped for a transform retry when that exact transform becomes valid.
- Native temporaries and cooked-mesh references are released on unmount and failed
  construction. Joints detach before their bodies are rebuilt and reconnect when
  both actors are available. Failed scene insertion publishes no stale handle.
- Cooking limits are 200,000 vertices or triangles per triangle mesh, 50,000
  convex input points, 400,000 vertices-plus-triangles per holder, and 2,000,000
  across the process. These limits account for shared meshes once per holder.
- Idle Stage Models expire after ten seconds of world time. Their material
  proxies and edits survive recreation; unused retained materials are bounded
  to 8,192, with live Models exempt from eviction.
- Mesh and Prim caches keep mounted resources pinned and evict unused recipes.
  Prim preserves exact shape, metalness and roughness values and stable recipe
  identities, instead of importing Coo's quantization or palette fallback.
  Prim caches retain at most 1,024 unused geometries and materials; unused geometry
  buffers also have a 64 MiB budget. Pending texture loads retain a separate pin,
  failed loads can retry, and stale loads cannot tear down a newer mount.
- The fork's extrusion profile accepts 3–256 copied finite points, bevel segments
  0–16, and curve segments 1–64. Size and profile getters return copies. Portal
  collision registration, controller stepping and callback behavior are retained.
- Startup rejects empty JWT secrets and the public `hyper` and
  `CHANGE_ME_TO_A_RANDOM_SECRET` templates, including whitespace/case variants.
  It returns a failing process status under SES. Shorter-than-32-character custom
  secrets warn; generation is documented as `openssl rand -hex 32`.
- HTTP errors retain their 4xx status, headers and existing JSON response shape.
  Client-error logs omit query strings, URL credentials and stack traces; server
  errors retain stack logging and the generic JSON 500 response.

The dependency refresh and multipart removal were not imported: this fork already
has the dependency updates, and its authenticated agent upload API uses multipart.
Worldsync deployment only updates world assets and cannot activate this engine
change; deployment requires the reviewed engine build and server/client restart.

## Verification

- 74 new focused regression tests pass, including real PhysX/SES probes for the
  five previously reproduced scene-corruption cases, native heap ownership,
  constructor failures, joint remounts, quotas, retries and resource eviction.
  The existing physics input and shape-failure mocks were updated without
  removing their cleanup assertions.
- Full security suite: 788/788 pass. The catalog test checks that the bundled
  `.hyp` files match the nonempty collection manifest, then validates all
  production and catalog blueprints unchanged. This replaces the stale
  twelve-file assertion after the three pool apps were removed in `00d40a1`.
- Existing fork suite: 502/504 pass, matching the unchanged-main results. The
  remaining failures are `promptBox.test.mjs` missing-asset expectations and
  `Portal.test.mjs` catalog asset-count expectations.
- Browser client, headless client and production server builds pass. All five
  built-server integration tests pass with real SQLite, PhysX, WebSockets,
  independent headless clients, reconnects, authenticated multipart uploads and
  asset response headers; known-secret startup rejection is exercised directly.
- Isolated Chrome production-client smoke passes under real SES and WebGL:
  exact torus/extrusion values render, a dynamic primitive creates a real actor,
  an expired Model remounts with its original material, and no uncaught or shader
  compilation errors occur. The browser profile and temporary world are removed.
- 51 local GLBs were inspected: the largest primitive has 8,643 vertices and
  2,881 triangles, below the cooking limits. This covers those local assets,
  not every possible uploaded asset or the live server's configuration.
- Scoped formatting and whitespace checks pass. Repository lint still reports
  its existing undeclared `PHYSX` global and two existing rule violations; the
  async Promise executor violation in Prim is removed.

Primary upstream references:
[physics inputs](https://github.com/dwebxr/coo-world/commit/ef671a86999746dee5457a360ac061c4ccea07b6),
[native lifetimes](https://github.com/dwebxr/coo-world/commit/cb07f3f443599cedbb6fd6b5079a36aaec007737),
[constructor cleanup](https://github.com/dwebxr/coo-world/commit/e886de9744cd8f0b813232901676e938fbaf09c8),
[JWT normalization](https://github.com/dwebxr/coo-world/commit/65502a3632c8dc42b62c787b4fe2342516270a65),
[final cache/retry fixes](https://github.com/dwebxr/coo-world/commit/f40fb416e19909b1a22e5807d18be587b6d8b871).
