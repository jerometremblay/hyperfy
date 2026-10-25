# Security backport review: Coo repositories

Reviewed on **2026-10-24** against these immutable revisions:

- This fork: [`66cd9212ed4f34e633b359f509ee19c41e7c5dfc`](https://github.com/jerometremblay/hyperfy/commit/66cd9212ed4f34e633b359f509ee19c41e7c5dfc), also the remote `main` at review time.
- Requested repository, `dwebxr/coo-hyperliza`: [`e76de13fedf0c0642bc6c1befb69148b0784f53b`](https://github.com/dwebxr/coo-hyperliza/commit/e76de13fedf0c0642bc6c1befb69148b0784f53b).
- Companion world engine, `dwebxr/coo-world`: [`bfa578afee8b08133018ac637a548f45a374f739`](https://github.com/dwebxr/coo-world/commit/bfa578afee8b08133018ac637a548f45a374f739).

**The scoped engine security backport described below is implemented in this fork.** The authorization hole, upload exposure, packet/resource limits, script boundaries, transform/physics safeguards, and persistence/cleaner protections described below have been addressed. The original review and implementation were kept local; upstream provenance and validation are recorded below.

**Follow-up implementation:** The [upstream additions review](upstream-review-2026-10-24.md) now records the applied outbound-fetch guard and loader fixes from [`66d5ff9`](https://github.com/dwebxr/coo-world/commit/66d5ff94742886ae8034661e870af681dbf57749), chat-echo correction, IME/wrapping, audio/UI fixes, headless session fixes and Docker/CI changes. Its updated validation reports 705 passing security tests and real two-client headless integration. The original test results below remain historical evidence for the earlier scope.

During implementation, the checkout independently advanced to `242a44fa1b6f8853bcbbb1ab8a77619dfac1daab` for the evening-sky change. Those five unrelated paths were preserved, and the security backport was kept separate from that change.

The original findings below describe the pinned baseline, before these changes. They retain explicit immutable upstream commit and fork-code links so the adaptations can be reviewed. This is an adapted backport: the tested upstream commits conflict with the fork, so it is not represented as an exact cherry-pick.

## Implemented changes

| Area | Enforcement in this fork | Upstream provenance |
| --- | --- | --- |
| Entity, blueprint, and settings authorization | Server allowlists reject self-assigned rank, health, identity, unauthorized app edits, and malformed or oversized blueprints. Fork hand tracking, loading, seat poses, expressions, and sessions remain supported. | [Initial policy](https://github.com/dwebxr/coo-world/commit/51bf43a10857519a815204c01fe588dc5fe7fa09), [blueprint enforcement](https://github.com/dwebxr/coo-world/commit/0e555977416cff52f7d7fdc30eaf01ecfaa2cbcf), [final inbound review](https://github.com/dwebxr/coo-world/commit/e3ef8a810407c169814e6c08272f39752b206df2) |
| Uploads and asset serving | A bearer token must identify a connected session. Builders can upload supported assets; visitors may upload VRM only when custom avatars are enabled. Admission precedes body parsing, with quotas, timeouts, signatures, storage checks, and per-session/IP concurrency. Local active assets get nosniff, attachment and sandbox headers, including 304 responses. JPEG controls and authenticated agent uploads remain. | [Authorization/types](https://github.com/dwebxr/coo-world/commit/944abda610c0ffb90d736958cefc43eae3ce1cda), [bounded upload admission](https://github.com/dwebxr/coo-world/commit/02912ae6e64fc0bec899a44e59092f250d0efd27) |
| Chat and relays | The server constructs chat IDs, sender and timestamps. Client packets cannot teleport, push, or change another player's avatar. Server scripts retain authority. | [Relay authorization](https://github.com/dwebxr/coo-world/commit/fe55661ecfe0f4dd7e60d3734242117a2650d914), [chat attribution](https://github.com/dwebxr/coo-world/commit/d1b678846528fd5e56d191a27c40a78cc0d14eed) |
| Protocol and pressure | Original fork packet IDs are preserved, with protocol v2 and plain client MessagePack. Direction/role checks precede strict decoding; per-socket/shared queues, fair scheduling, app-event queues, outgoing ledgers and connection reservations are bounded. Credentials are excluded from failure logs. | [Decoder](https://github.com/dwebxr/coo-world/commit/06c03681666a556d62b956ca474baca60f331e9e), [transport](https://github.com/dwebxr/coo-world/commit/2ca781dac2dd05f8ad9ec6f2efe0e6bc0e75c3ba), [scheduling](https://github.com/dwebxr/coo-world/commit/52e40a52910d0aa85ffc927ad17363bb9a92f9ba), [event queues](https://github.com/dwebxr/coo-world/commit/7ae9eb95733ce5ab0c5d2cd38fcb870eeb72b332), [lifecycle](https://github.com/dwebxr/coo-world/commit/d79942650eb6547ffbb1314a0cc8bc848ff9df4d) |
| Scripts and HTML | Real SES hardening, one compartment per script asset, locked endowments, protected callback receivers/arguments, timer and fetch/blob facades, node reference validation, and escaped shell substitutions. LiveKit initializes before lockdown so its inherited Promise.resolve assignment does not break browser startup. | [Compartments and host boundaries](https://github.com/dwebxr/coo-world/commit/f48c5821b49fa5bf3cabb8a11bf4f3ab11d96ee3) |
| Native physics and spatial indexes | Private conversions, finite branded inputs, bounded octree expansion, mesh cooking allocations/caches, deferred isolated callbacks, native-trap containment and bounded final saves. Fork controller, Prim, portal, and Stage behavior is retained. | [Private conversions](https://github.com/dwebxr/coo-world/commit/e2c6850dd6251858621d2ec0ca99c915cab825dc), [native inputs](https://github.com/dwebxr/coo-world/commit/8d681ea994c2a60ce36aab20660776df0d78e8be), [cooking](https://github.com/dwebxr/coo-world/commit/a8a8d8d6803e4edb900a839ce68d5f98f2e04f8b), [callbacks](https://github.com/dwebxr/coo-world/commit/69728c8f8dbb2d60b7e286eae7c189bf16068ce5), [final review](https://github.com/dwebxr/coo-world/commit/dd389c79c1db05ba798973ce52c138ed2e14f7b0) |
| Persistence and cleaning | Serialized saves, safe hydration and complete reference discovery before deletion. Script runtime state is excluded from database records. The fork's spawnedBy ownership field and storage asset retention are preserved. | [Final saves](https://github.com/dwebxr/coo-world/commit/7fb8ee1ebae9988494d56add3ae1b6bffc040bda), [hydration/cleaner](https://github.com/dwebxr/coo-world/commit/23a179417fa1d28418c63fd48e541732a2565f47) |
| Runtime/dependencies/decompression | .nvmrc and both Docker stages now select Node 26.12.1; engines and startup reject vulnerable Node releases. The existing dependency ranges resolve to patched versions. Brotli request decompression is disabled; gzip/deflate remain. See the subsequent [Node 26 validation](node-runtime.md). | [Node](https://github.com/dwebxr/coo-world/commit/4a5b70cd40a245d94bbc5f451c11aced9e9baa18), [request decompression](https://github.com/dwebxr/coo-world/commit/976881fc9ce2f9e6ea1d48a315006d4f4848f63e), [follow-up](https://github.com/dwebxr/coo-world/commit/adf1b060121c16f2ff81469f73fd4389ff108a4b) |

Directly copied helpers and test support files include immutable upstream blob links in their source headers. The detailed commit sequence below also records intermediate changes and review follow-ups.

## Why two upstream repositories?

[coo-hyperliza](https://github.com/dwebxr/coo-hyperliza) runs an Eliza agent, with TypeScript code under `src/plugin-hyperfy`, Bun dependencies, and Eliza integrations. This fork runs the Hyperfy engine and has none of those integration paths. Its Git history has no common ancestor with coo-hyperliza.

The agent's [upload-auth fix](https://github.com/dwebxr/coo-hyperliza/commit/9080ac4705488dba9f262afdc25e2684bb66f85f) and [protocol adaptation](https://github.com/dwebxr/coo-hyperliza/commit/1423b1cdcfe57149cf2c70f1e1fdc6f9042b37f5) explicitly accommodate protections in **coo-world**. That engine shares this fork's ancestor [`5d20037435a1d86cda088382bb12737e9f18d5f6`](https://github.com/hyperfy-xyz/hyperfy/commit/5d20037435a1d86cda088382bb12737e9f18d5f6) and is the relevant source for engine backports.

## What applies from coo-hyperliza?

| Source commit | Finding in this fork | Recommended action |
| --- | --- | --- |
| [`bdeda55`: recent dependency fixes](https://github.com/dwebxr/coo-hyperliza/commit/bdeda55528679a076a4fa310805f449c88f30853) | Zod is installed at vulnerable `4.6.5`. esbuild is already `0.28.2`. tsup, body-parser, multer, Puppeteer, extract-zip, and elliptic are absent from this lockfile. | Update Zod within the existing dependency ranges. No new override or tsup dependency is needed. |
| [`d8947f9`: dependency cleanup](https://github.com/dwebxr/coo-hyperliza/commit/d8947f9801249704fdb72a99e4ed4d842db4c5e8) | Eliza integrations, simple-git, basic-ftp, and pdfjs-dist are absent. Shared dependencies are a different tree. | Keep npm and this fork's integrations; audit/update its own lockfile. Do not copy Bun's lockfile or Eliza plugin stubs. |
| [`ed4607d`: stop tracking auth tokens](https://github.com/dwebxr/coo-hyperliza/commit/ed4607d013e5be9c53f54b5cd380ea85ab7c0c35) | `.gitignore` already ignores `localstorage.json`, `.env*` except `.env.example`, and `.DS_Store`. No `local.json`, `localstorage.json`, or runtime `.env` is currently tracked. | No equivalent file-removal patch is needed. This check does not certify historical secret removal. |
| [`b665d78`: URL and logging safety](https://github.com/dwebxr/coo-hyperliza/commit/b665d78963423ff186b7ff84e46bc677b6d169bc) | Agent import/reconnect code is absent. This fork's server still logs a failed authentication token in `ServerNetwork.onConnection`. | Remove that token-bearing log through the engine logging backport below. |
| [`9080ac4`: authenticated uploads](https://github.com/dwebxr/coo-hyperliza/commit/9080ac4705488dba9f262afdc25e2684bb66f85f) | Our ordinary upload route and client upload path have no session authorization. The separately protected agent API does not protect `/api/upload`. | Backport the world-engine upload policy, with client and server changes together. |
| [`1423b1c`: protocol v2](https://github.com/dwebxr/coo-hyperliza/commit/1423b1cdcfe57149cf2c70f1e1fdc6f9042b37f5) | Our packet table and MessagePack dialect differ from coo-world's. | Useful compatibility evidence, not a patch for this engine. Revisit node clients when changing the inbound protocol. |

## Prioritized engine backports

### 1. Entity authorization and field validation — urgent

Source: [`51bf43a`: validate client packets and tighten sandbox boundaries](https://github.com/dwebxr/coo-world/commit/51bf43a10857519a815204c01fe588dc5fe7fa09).

Our [`onEntityModified`](https://github.com/jerometremblay/hyperfy/blob/66cd9212ed4f34e633b359f509ee19c41e7c5dfc/src/core/systems/ServerNetwork.js#L557) verifies that a player belongs to the sender, then passes the remaining fields to `entity.modify`. [`PlayerRemote.modify`](https://github.com/jerometremblay/hyperfy/blob/66cd9212ed4f34e633b359f509ee19c41e7c5dfc/src/core/entities/PlayerRemote.js#L269) accepts `rank`, and `isAdmin` immediately uses that value.

**Verified with an isolated fixture:** the production `ServerNetwork` handler and the actual parsed `PlayerRemote.modify/isAdmin/isBuilder` methods changed a visitor from `isAdmin() === false` to `true`, and broadcast the rank change. No live world or external user was contacted. The rank mutation is in memory; it need not persist to make privileged handlers accessible during that session.

The app modification path also lacks an explicit builder/ownership gate before calling `App.modify`. Player ownership checks alone do not protect app edits.

Adapt the upstream allowlists and authorization checks to this fork. Preserve its explicit hand-tracking, loading, sitting-pose, facial-expression, and player-session validations. Keep privileged rank changes exclusively in the existing authorized rank handler. Follow the initial patch with the final [blueprint enforcement](https://github.com/dwebxr/coo-world/commit/0e555977416cff52f7d7fdc30eaf01ecfaa2cbcf) and [inbound review corrections](https://github.com/dwebxr/coo-world/commit/e3ef8a810407c169814e6c08272f39752b206df2), rather than assuming the initial patch is the final policy.

### 2. Ordinary upload authorization, types, and quotas — urgent

Sources:

- [`944abda`: builder session, upload validation, inert asset serving](https://github.com/dwebxr/coo-world/commit/944abda610c0ffb90d736958cefc43eae3ce1cda).
- [`02912ae`: upload admission, rate limits, byte quotas, and bounded transfers](https://github.com/dwebxr/coo-world/commit/02912ae6e64fc0bec899a44e59092f250d0efd27).

Our [`/api/upload`](https://github.com/jerometremblay/hyperfy/blob/66cd9212ed4f34e633b359f509ee19c41e7c5dfc/src/server/index.js#L255) receives and stores files without authenticating a connected session or checking builder permission. JPEG-specific size/rate/signature controls exist, but do not provide general upload authorization. [`ClientNetwork.upload`](https://github.com/jerometremblay/hyperfy/blob/66cd9212ed4f34e633b359f509ee19c41e7c5dfc/src/core/systems/ClientNetwork.js#L76) checks response status but sends no bearer token.

Use the existing session identity and rank checks. Adapt extension/signature handling for this fork's `spz`, `ply`, `splat`, `ksplat`, splat ZIP/SOGS assets, VRM avatars, scripts, and ordinary GLB assets. Preserve the JPEG checks and separately authorized agent/worldsync upload workflow. Review asset serving with `nosniff`, safe MIME types, and attachment/sandbox treatment for active content.

The upstream quota implementation includes Solana wallet identities; this fork does not need its wallet integration. Choose limits against actual world assets, especially large splats, rather than copying every upstream default.

### 3. Runtime and dependency patches — applied

Sources: [Coo's Node update](https://github.com/dwebxr/coo-world/commit/4a5b70cd40a245d94bbc5f451c11aced9e9baa18), [request decompression hardening](https://github.com/dwebxr/coo-world/commit/976881fc9ce2f9e6ea1d48a315006d4f4848f63e), and its [review follow-up](https://github.com/dwebxr/coo-world/commit/adf1b060121c16f2ff81469f73fd4389ff108a4b).

Our Dockerfile and `.nvmrc` use `22.23.3`; the shell used for this review runs `26.10.0`. The [October Node security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) supplies `22.23.4`, `24.22.1`, and `26.12.1`. The current `engines.node` range also permits older vulnerable releases. The local and deployed runtimes need to be updated separately; the live world's runtime was not inspected.

The lockfile audit reported **12 affected packages: 5 high, 7 moderate**, reflecting six unique advisories and their dependency propagation:

| Package | Installed at review | Patched floor | Prepared lockfile |
| --- | --- | --- | --- |
| Zod | `4.6.5` | `4.6.6` | `4.6.7` |
| Fastify | `5.12.5` | `5.12.6` | `5.12.7` |
| fast-uri, top-level | `4.2.1` | `4.2.3` | `4.2.3` |
| fast-uri, three nested copies | `3.1.8` | `3.1.9` | `3.1.9` |

Advisories: [Zod collection exhaustion](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), [Fastify header validation](https://github.com/advisories/GHSA-389g-gv7q-r4x8), and fast-uri [scheme spoofing](https://github.com/advisories/GHSA-w74x-v6f9-j3xg), [path equivalence](https://github.com/advisories/GHSA-xhq7-xmqj-769h), [host confusion](https://github.com/advisories/GHSA-wjr9-j795-jxcr), and [suffix scheme injection](https://github.com/advisories/GHSA-333x-w4r6-6crp). These are installed-dependency findings; exploitability of every dependency path was not established.

`npm update zod fast-uri fastify --package-lock-only --ignore-scripts` fixes this tree within its existing ranges, with **no new overrides**. The prepared tree audits at **zero findings**.

Our response `encodings: ['gzip', 'deflate']` does not restrict request decompression. With the exact production compression options, a harmless local Brotli request was decoded and handled. Adding `requestEncodings: ['gzip', 'deflate']` refuses it before the handler. This uses Fastify's existing option directly, preserving this fork's response settings and splat exclusions.

Prepared artifact: [runtime/dependency/request-decompression patch](security-backports/2026-10-24-runtime-and-dependencies.patch).

It updates `.nvmrc`, both Docker stages, the Node engine ranges, six resolved dependency copies, and the request decompression option. **It does not fix the entity authorization hole above.** The upstream system `brotli-libs >= 1.2.1` requirement is not included: the local Docker/Alpine package build was not verified and should be checked before carrying over that image-specific assertion.

### 4. Cross-player relay authorization and chat attribution — high

Sources: [`fe55661`: server-only cross-player effects](https://github.com/dwebxr/coo-world/commit/fe55661ecfe0f4dd7e60d3734242117a2650d914), [`d1b6788`: rebuild chat on the server](https://github.com/dwebxr/coo-world/commit/d1b678846528fd5e56d191a27c40a78cc0d14eed), and [`11e593c`: emote URLs and server-minted chat IDs](https://github.com/dwebxr/coo-world/commit/11e593c8695ac4db13d1a5b110468db3ddd407d8).

Our [`onPlayerTeleport`, `onPlayerPush`, and `onPlayerSessionAvatar`](https://github.com/jerometremblay/hyperfy/blob/66cd9212ed4f34e633b359f509ee19c41e7c5dfc/src/core/systems/ServerNetwork.js#L806) relay client payloads to the selected other socket. An isolated production-handler fixture confirmed the teleport relay is accepted. Server scripts already have a direct `sendTo` path, so client-origin cross-player relays can be refused while retaining server authority and local-player actions.

Our [`onChatAdded`](https://github.com/jerometremblay/hyperfy/blob/66cd9212ed4f34e633b359f509ee19c41e7c5dfc/src/core/systems/ServerNetwork.js#L384) stores and broadcasts the supplied message. Rebuild its ID, sender identity, timestamp, and bounded text server-side. Retain the final URL and grapheme-handling corrections, not just the first sanitizer.

### 5. Incoming packets, queues, connections, and outgoing pressure — high

Start from the final implementation represented by these commits:

- [`c4514cc`: initial admission and decoder hardening](https://github.com/dwebxr/coo-world/commit/c4514ccde5d842c4906cf29fa6357a2f2690e068).
- [`995acf9`: plain client encoding](https://github.com/dwebxr/coo-world/commit/995acf952504040b93179806b3abecaf3316ea6d) and [`7abb25e`: protocol version 2](https://github.com/dwebxr/coo-world/commit/7abb25e85b3c19bd76035f873e7b7e0c5cedd992).
- [`06c0368`: strict incoming decoder](https://github.com/dwebxr/coo-world/commit/06c03681666a556d62b956ca474baca60f331e9e).
- [`2ca781d`: transport, admission, and write limits](https://github.com/dwebxr/coo-world/commit/2ca781dac2dd05f8ad9ec6f2efe0e6bc0e75c3ba).
- [`414e1c5`: client limits and producer normalization](https://github.com/dwebxr/coo-world/commit/414e1c50053bbdfadc32feec1df750b1c04fccc4).
- [`52e40a5`: fair incoming scheduler](https://github.com/dwebxr/coo-world/commit/52e40a52910d0aa85ffc927ad17363bb9a92f9ba).
- [`7ae9eb9`: bounded app event queue](https://github.com/dwebxr/coo-world/commit/7ae9eb95733ce5ab0c5d2cd38fcb870eeb72b332).
- [`d799426`: connection lifecycle and safe logging](https://github.com/dwebxr/coo-world/commit/d79942650eb6547ffbb1314a0cc8bc848ff9df4d).
- [`e3ef8a8`: review corrections and shared budgets](https://github.com/dwebxr/coo-world/commit/e3ef8a810407c169814e6c08272f39752b206df2).

Our WebSocket plugin has no explicit `maxPayload` setting, [`Socket.onMessage`](https://github.com/jerometremblay/hyperfy/blob/66cd9212ed4f34e633b359f509ee19c41e7c5dfc/src/core/Socket.js#L44) decodes before admission, and [`ServerNetwork.queue/flush`](https://github.com/jerometremblay/hyperfy/blob/66cd9212ed4f34e633b359f509ee19c41e7c5dfc/src/core/systems/ServerNetwork.js#L129) is unbounded and drains the whole queue. `readPacket` uses `structuredClone: true` for incoming packets. Rejected async handlers are not caught by the synchronous dispatch `try/catch`. Failed authentication logging includes the token.

Use the WebSocket transport's standard payload limit and explicit direction/role validation first, then adapt decoder and fair scheduling budgets. The early 1 MiB frame policy was subsequently tightened upstream; do not treat the first limits commit as the final design.

This fork has additional packet names (`browserInput`, pose editing, expressions, profiler controls, and player sessions). Preserve their existing IDs and define authorization, shapes, byte limits, and queue behavior for each. Protocol/dialect changes require simultaneous browser/server deployment, node-client rebuilds, and portal-preview compatibility checks. Upstream snapshot/blueprint budgets also need testing against this fork's worlds.

### 6. Script sandbox and HTML shell — high

Sources: [`51bf43a`](https://github.com/dwebxr/coo-world/commit/51bf43a10857519a815204c01fe588dc5fe7fa09) and [`f48c582`: hardening and script compartments](https://github.com/dwebxr/coo-world/commit/f48c5821b49fa5bf3cabb8a11bf4f3ab11d96ee3).

Our [`lockdown.js`](https://github.com/jerometremblay/hyperfy/blob/66cd9212ed4f34e633b359f509ee19c41e7c5dfc/src/core/lockdown.js) still selects unsafe harden taming. [`Scripts`](https://github.com/jerometremblay/hyperfy/blob/66cd9212ed4f34e633b359f509ee19c41e7c5dfc/src/core/systems/Scripts.js) reuses one compartment for different script assets. Host callback receivers, timer handles, error values, fetch/blob facades, node references, and mutable endowments require review together.

Use SES's real hardening and compartments rather than inventing a different sandbox. Test the script editor and existing apps: the upstream changes intentionally alter fetch/blob semantics, writable globals, world.open schemes, and prototype mutation. Our private WebView/shared-browser features remain separate host interfaces that upstream does not cover.

The HTML shell currently substitutes title, description, and image strings directly. The newer loading-image JSON substitution escapes `<`, but it does not protect the other contexts. Backport context-appropriate escaping and test the loading-image/portal placeholders too.

### 7. Transform and physics availability — high when scripts/assets are untrusted

Sources:

- [`a3c9513`: finite bounded transforms](https://github.com/dwebxr/coo-world/commit/a3c9513f4c12609c8ed588c1e4e37318ed42ded0).
- [`de9351e`: terminating octrees and local-effect bounds](https://github.com/dwebxr/coo-world/commit/de9351ef119545075d0b089b7931e873ac504f2f), plus [`de29cea`: review fixes](https://github.com/dwebxr/coo-world/commit/de29cea3b6007be36e968a55264fd3b061766477).
- [`e2c6850`: host-private PhysX conversions](https://github.com/dwebxr/coo-world/commit/e2c6850dd6251858621d2ec0ca99c915cab825dc).
- [`8d681ea`: validated physics inputs](https://github.com/dwebxr/coo-world/commit/8d681ea994c2a60ce36aab20660776df0d78e8be).
- [`a8a8d8d`: mesh allocation/cooking safety](https://github.com/dwebxr/coo-world/commit/a8a8d8d6803e4edb900a839ce68d5f98f2e04f8b).
- [`69728c8`: contained native callbacks](https://github.com/dwebxr/coo-world/commit/69728c8f8dbb2d60b7e286eae7c189bf16068ce5).
- [`afe5978`: trap guards and fatal restart](https://github.com/dwebxr/coo-world/commit/afe59782163157463cc6b9d2f4bf9b51651562b7).
- [`7fb8ee1`: bounded final saves](https://github.com/dwebxr/coo-world/commit/7fb8ee1ebae9988494d56add3ae1b6bffc040bda).
- [`e226348`: bounded native caches](https://github.com/dwebxr/coo-world/commit/e226348b08ec5371c70e3da5a14294ee28630c90), plus [`dd389c7`: final review corrections](https://github.com/dwebxr/coo-world/commit/dd389c79c1db05ba798973ce52c138ed2e14f7b0).

Both local octrees still expand in a loop until they can contain an item, without the upstream finite-bounds preflight. Incoming player transforms are not generally normalized/bounded. Mesh cooking still allocates from the supplied position buffer length and passes descriptors assuming three float32 coordinates per vertex. The upstream patches address validation, heap growth, cleanup, callback isolation, and resource exhaustion.

Backport in dependency order. Preserve this fork's custom Prim extrusion, procedural trees, hand tracking, sitting poses, splats, and Stage optimizations. Include the upstream native/stub regressions and this fork's relevant tests; a clean patch alone would not demonstrate PhysX safety.

### 8. Persisted hydration and cleaning — follow-up

Source: [`23a1794`: validate stored data and discover references before cleaning](https://github.com/dwebxr/coo-world/commit/23a179417fa1d28418c63fd48e541732a2565f47).

This fork already discovers storage assets before cleaning and keeps stored user avatars. It still hydrates stored blueprints/apps without the upstream policy and can delete orphan blueprints before completing all later reference discovery. Retain the existing storage/collection behavior while adding sanitized hydration and complete validation before deletion.

The Solana wallet/token-gate changes, RPC-specific configuration changes, and Coo lip-sync work are not required security backports for this fork. In particular, do not import its wallet system merely to resolve dependencies in upload quotas.

## Cherry-pick feasibility

**Actually tested:** 43 individual `git cherry-pick --no-commit` attempts against a fresh disposable checkout of this fork's pinned revision. Each attempt started from that same clean base. The test reset only the disposable clone. It created no commits.

- Both recent coo-hyperliza dependency commits conflict and introduce unrelated agent paths.
- Every tested relevant coo-world security commit conflicts in at least one path.
- The only clean result is [`823106c`: chat input/IME and wrapping](https://github.com/dwebxr/coo-world/commit/823106c26fdc1c7190fe301ec649813caa52a7e7), which is not a security backport recommendation.
- The new protocol feature commits are linked above as dependencies; they were not part of the individual fix-commit trial set.
- An individual conflict does not prove an ordered series cannot be resolved. It means there is no verified one-command security cherry-pick at this revision. Some later commits also require files introduced by earlier ones.

Exact tested SHAs and conflicting paths are recorded in [the machine-readable results](security-backports/2026-10-24-cherry-pick-results.json). Git patch success and runtime correctness are separate checks.

To reproduce a conflict without touching the working checkout:

```sh
git clone --no-hardlinks /Users/jerome/metaverse/hyperfy /tmp/hyperfy-coo-review
git -C /tmp/hyperfy-coo-review checkout --detach 66cd9212ed4f34e633b359f509ee19c41e7c5dfc
git -C /tmp/hyperfy-coo-review fetch https://github.com/dwebxr/coo-world.git main
git -C /tmp/hyperfy-coo-review cherry-pick --no-commit 51bf43a10857519a815204c01fe588dc5fe7fa09
git -C /tmp/hyperfy-coo-review diff --name-only --diff-filter=U
```

That example is expected to conflict; it is not an automatic fix.

For an eventual full cherry-pick, retain the standard `(cherry picked from commit <full SHA>)` provenance trailer. For adapted changes, use explicit `Upstream-Commit: https://github.com/dwebxr/coo-world/commit/<full SHA>` trailers, with one source per line, instead of claiming an exact cherry-pick. Preserve the required bot author/committer identity and signing key when a commit is explicitly requested.

## Historical prepared patch

The [original prepared patch](security-backports/2026-10-24-runtime-and-dependencies.patch) is retained for provenance. It is based on the untouched baseline and is **already superseded by the working-tree implementation**. Do not apply it again here. Against that original baseline only, its instructions were:

```sh
git apply --check docs/security-backports/2026-10-24-runtime-and-dependencies.patch
git apply docs/security-backports/2026-10-24-runtime-and-dependencies.patch
```

Use a patched Node runtime before installing/building. The patch is based on the pinned revision above, so rerun `--check` if the checkout changes.

Original review-phase validation in the disposable clone:

- `npm ci --ignore-scripts`: installed the patched dependency tree.
- `npm audit`: **0 findings**, versus 12 affected packages before.
- `npm run build`: passed.
- 18 existing tests passed across `src/server/agent-api.test.mjs`, `src/server/photoUploads.test.mjs`, `src/core/systems/ServerNetwork.settings.test.mjs`, and `src/core/systems/ClientNetwork.time.test.mjs`.
- A Fastify injection probe using the actual source compression options showed Brotli handling change from `200` to plugin-level `415`, with the candidate handler never receiving that body. `BR` and `gzip, br` were refused too; gzip, deflate, plain request bodies, and gzip responses still worked. This server's custom error handler converts errors to `500`, so preserving the plugin's `415` in production would require a separate error-handler change.
- Production-handler fixtures verified the own-player rank escalation and cross-player teleport relay described above.
- `git diff --check` and the patch application check passed.

The build/tests ran under the existing `26.10.0` shell; they establish functional compatibility, not that the runtime was updated. Install scripts, native SQLite runtime, Docker/Alpine builds, browser behavior, full sandbox/physics regression suites, and the live 3333 world were not validated. A zero npm audit result does not cover the application vulnerabilities in this review.

## Validation of the implemented backport

The implementation was checked with a checksum-verified **Node 22.23.4** runtime. The native SQLite addon was rebuilt for that runtime.

- `npm run test:security`: **692 tests passed**, including strict decoding, authorization, uploads, script compartments/host boundaries, native PhysX cases, callbacks, cooking/cache limits, persistence and containment.
- Real built-server integration: **passed**, using temporary SQLite/assets, actual PhysX, HTTP and WebSocket clients. It checks rejected privilege escalation, upload permissions, separately authenticated agent multipart uploads, server chat attribution, escaped HTML, inert asset headers on 200/304, reconnects and absence of session-token logging. Reproduce with `npm run test:security:server`.
- Fork regression suite across `src`, `scripts`, `tools`, and `prototypes`: **495 passed, 2 failed out of 497**. Both failures reproduce against the unchanged source at the pinned baseline: the missing-asset rejection case in `src/core/extras/promptBox.test.mjs` and catalog asset-count assertion in `src/core/nodes/Portal.test.mjs`. They are retained as existing failures.
- Production browser smoke: **passed** with headless Chrome, the real client, WebSocket v2 and SES. A normal Vector3 script ran, intrinsic mutation was rejected, separate script assets could not share globals, and Monaco 0.49 created an editor and tokenized JavaScript. The particle bundle is now loaded with a standard module worker; no uncaught browser exceptions remained.
- `npm run build`, `npm run client:build`, and `npm run node-client:build`: **passed**. The rebuilt headless client also imported and constructed its world successfully. Its shared touch detection now guards browser-only globals so it can run in Node. The main build was restored after the standalone client build, which clears the shared build directory.
- `npm audit`: **0 findings**, down from the original 12 affected packages.
- Read-only compatibility checks against the configured local SQLite worlds accepted **44 blueprints/79 apps** and **3 blueprints/3 apps**, with no rejected records or transform repairs. Their sanitized blueprint totals were about 29 KiB and 4 KiB, below the new 512 KiB world blueprint budget. This is a local data check, not a live-server certification.
- `git diff --check`: **passed**. ESLint is not a clean gate in the existing repository: undeclared engine globals and existing style errors remain. With `PHYSX`, `Compartment`, `lockdown` and `env` declared for comparison, the changed files have 40 errors versus 46 at the baseline, with no added error signature. No repository-wide lint cleanup was included.

The default collection manifest also referenced `PerformanceSwitch.hyp`, which is absent from the repository and blocked fresh-world startup. That stale entry has been removed. The final server/browser checks boot the actual catalog without a replacement file or fixture workaround. No replacement performance app was introduced.

## Activation and compatibility

The working-tree changes are not deployed. Homebrew Node and this project's defaults have subsequently been upgraded to **26.12.1**, with the [compatibility fix and validation recorded here](node-runtime.md). Use the Homebrew Node path shown in that guide or select the project runtime with nvm:

```sh
nvm install
nvm use
npm ci
npm run build
```

Then restart the engine using the existing world profile/start command and reload its browser clients. Rebuild external node clients from this fork's packet definitions too. Protocol v1 clients are rejected; preserved fork packet IDs do not make coo-world's different packet table interchangeable. World asset synchronization alone does not activate these engine changes. The live 3333 world and its runtime have not been changed or tested here.

The backport intentionally bounds previously unbounded operations. Incoming transport frames are limited to 64 KiB, ordinary outgoing packets to 512 KiB, system snapshots to just under 1 MiB, and total sanitized blueprint storage to 512 KiB. Upload admission has per-user/IP/server quotas and transfer limits; inspect `src/server/uploadLimits.js` and `src/server/connectionLimits.js` before increasing their environment settings for unusually large worlds or splats. `PUBLIC_MAX_UPLOAD_SIZE=0` uses a finite 256 MiB ordinary-upload ceiling. Existing script runtime state is reset on hydration and excluded from saves; explicit world/app storage remains available, and spawnedBy ownership survives restart. Fetch/blob facades, allowed URLs, global mutation and callback receiver behavior also follow the upstream security policy.

Configured local worlds use the local asset backend. S3 writes now stamp safe content types/dispositions, but existing remote objects/CDN headers were not migrated or verified. Docker/Alpine builds and their system Brotli package were not tested; request Brotli decoding is disabled independently of that image-level check.
