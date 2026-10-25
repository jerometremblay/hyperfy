# Upstream additions reviewed on 2026-10-24

This review compared the working tree, including the pending security backports, at fork HEAD [`242a44fa1b6f8853bcbbb1ab8a77619dfac1daab`](https://github.com/jerometremblay/hyperfy/commit/242a44fa1b6f8853bcbbb1ab8a77619dfac1daab). **The user subsequently requested implementation, and the fixes below are applied in this fork.** The original application and validation were performed locally.

## Applied fixes

| Fix | Implementation | Explicit upstream source |
| --- | --- | --- |
| Outbound Brotli protection | Fetch guard installed after SES in both server and headless entry points; model/emote loads reject asynchronous parse failures. The fork's HDRLoader remains. | [Initial guard](https://github.com/dwebxr/coo-world/commit/0960a8d4df12c53d972f885616287ff9cbabec0b), [loader/review fixes](https://github.com/dwebxr/coo-world/commit/d17d631c168c62370f3d7f80b3f45554ad3c8c51), [buffer test](https://github.com/dwebxr/coo-world/commit/e5ec0b23e8d7da42cb18cd758b573c051cebdd57) |
| Chat correction | Local echo is sanitized; the server excludes the sender from its canonical peer broadcast. Chat envelopes and command text are bounded. | [Chat review](https://github.com/dwebxr/coo-world/commit/11e593c8695ac4db13d1a5b110468db3ddd407d8) |
| IME and wrapping | CoreUI and text fields ignore composition events, including React's native event and keyCode 229. UIText uses the existing grapheme-aware helper. | [IME/wrapping](https://github.com/dwebxr/coo-world/commit/823106c26fdc1c7190fe301ec649813caa52a7e7) |
| Audio and UI properties | AudioListener feature detection, flexWrap getters, padding early return, numeric Yoga position enums and valid flex-direction values. | [Audio](https://github.com/dwebxr/coo-world/commit/be3357b955fdced8af02cac262643f075eb200b5), [selected UI hunks](https://github.com/dwebxr/coo-world/commit/043b40c69a2d78e09df53ac4f5a755d607a61824) |
| Headless sessions | Optional AI deserialization, per-client login/upload credentials and caller token callback. Network initialization/cleanup tolerates the GLTF loader's DOM stubs. Received kicks are flushed before normal disconnect; fatal worlds discard queued mutations. | [Session/snapshot/close hunks](https://github.com/dwebxr/coo-world/commit/043b40c69a2d78e09df53ac4f5a755d607a61824) |
| Docker and CI | Exclude bare `.env` and agent-tool directories. A workflow gates the security suite, three builds and real server/headless integration under `.nvmrc`, with pinned GitHub Actions. | [Environment/CI](https://github.com/dwebxr/coo-world/commit/1f528221b240be0be73d4f97179d5fea36834bb2), [tool exclusions](https://github.com/dwebxr/coo-world/commit/0725a549c556165d2a54658894fc62fe47f36866) |

Audio-amplitude lip sync remains an optional feature. The existing standard VRM expression manager is retained.

Validation under **Node 22.23.4**:

- Security suite: **705 passed**. New tests cover refusal before Brotli decoder creation, external model-buffer errors, single chat echo, independent login/upload credentials, headless snapshots, disconnect ordering and fatal-close containment.
- Real built-server integration: **passed**, including actual SQLite/PhysX, HTTP/WebSocket permissions, peer chat delivery and two headless worlds reaching ready state with separate session credentials.
- Main, standalone browser-client and headless-client builds: **passed**.
- Actual Chrome/React input check: **passed**. Composing Enter/Escape and legacy keyCode 229 neither send nor close chat; normal Enter produces one local row and one peer delivery. SES isolation/hardening and Monaco editor/tokenization also passed, with no uncaught browser errors.
- Fork regression run: **495 passed, 2 existing baseline failures** in promptBox's missing-asset expectation and Portal's catalog asset-count expectation. These are not treated as passing checks.
- Network time/portal regression checks after the final headless adaptations: **20 passed**.
- All recorded UI/audio/chat/headless characterization failures are corrected. Audio fallback was tested with the legacy API shape; this does not certify an actual Firefox browser session.

The new CI workflow has been added locally; it has not run on GitHub. Deployment and Docker/Alpine validation remain separate.

The subsequent [Node 26 upgrade](node-runtime.md) changes the default to **26.12.1** and adapts the fetch guard to Undici's dispatcher API 2 while retaining API 1. The Node 26 security suite passed **707 tests**, all three builds and real server/headless integration passed, and nine guard/control/loader tests passed on both Node 22 and 26. The original Node 22 results above remain the validation record for the initial backport.

Machine-readable applied-file hashes, upstream URLs and final check results: [implementation evidence](security-backports/2026-10-24-incoming-implementation.json).

## Upstream coverage

The branch tips below were verified through GitHub and fetched into a disposable repository. Links pin immutable revisions.

| Repository / branch | Reviewed tip | Missing from fork HEAD's history | Conclusion |
| --- | --- | ---: | --- |
| Official Hyperfy / `main` | [`5d20037`](https://github.com/hyperfy-xyz/hyperfy/commit/5d20037435a1d86cda088382bb12737e9f18d5f6) | 0 | Already an ancestor of this fork. |
| Official Hyperfy / `dev` | [`b4081eb`](https://github.com/hyperfy-xyz/hyperfy/commit/b4081eb14478972eb7070d3b5bc0bf2b9f8cf92a) | 0 | Already an ancestor, including the Light-node change. |
| Splatting / `feature/gaussian-splatting` | [`c88ca0c`](https://github.com/moritzhckr/hyperfy-splatting/commit/c88ca0cbdf51df65db6c86772d6fa3de497da1ff) | 0 | Already an ancestor, including duplicate splat blueprint/app-list fixes. |
| Coo world / `main` | [`66d5ff9`](https://github.com/dwebxr/coo-world/commit/66d5ff94742886ae8034661e870af681dbf57749) | 93 | Many fixes are already adapted in the pending security backport; history counts do not mean 93 missing features. |
| Coo Hyperliza / `main` | [`e76de13`](https://github.com/dwebxr/coo-hyperliza/commit/e76de13fedf0c0642bc6c1befb69148b0784f53b) | Separate project | Unchanged since the earlier review. Its Eliza integrations are absent from this engine. |

Coo world advanced from the earlier reviewed [`bfa578a`](https://github.com/dwebxr/coo-world/commit/bfa578afee8b08133018ac637a548f45a374f739). The new [PR #15](https://github.com/dwebxr/coo-world/pull/15) merged on October 24 UTC. Author timestamps in another timezone can display October 25.

## Original findings and chosen adaptations

The descriptions and line numbers in this section refer to the pre-implementation snapshot. The applied status and current validation are recorded above.

### 1. Outbound fetch: refuse Brotli before decoding, and propagate loader errors

Take this sequence together:

1. [`0960a8d`: server-side fetch never decodes Brotli](https://github.com/dwebxr/coo-world/commit/0960a8d4df12c53d972f885616287ff9cbabec0b).
2. [`d17d631`: guard review and ServerLoader rejection paths](https://github.com/dwebxr/coo-world/commit/d17d631c168c62370f3d7f80b3f45554ad3c8c51).
3. [`e5ec0b2`: external model-buffer rejection test](https://github.com/dwebxr/coo-world/commit/e5ec0b23e8d7da42cb18cd758b573c051cebdd57).

The pending `compressOptions` protection concerns **incoming request bodies**. The script-fetch facade concerns **sandbox boundaries**. Neither stops Node's global `fetch` from decoding a Brotli response from a remote script/model URL.

The new guard removes Brotli/wildcard negotiation and rejects Brotli response headers at the dispatcher, before decoder creation. It covers global fetch, including redirects and GLTF secondary-buffer requests. Dependencies that use their own HTTP clients can bypass it. Keep the patched Node runtime too.

In this fork, [ServerLoader](../src/core/systems/ServerLoader.js) uses plain fetch at lines 64–83. Its model and emote `gltfLoader.parse` calls at lines 112 and 131 omit the failure callback. When an external buffer fails, the model promise may not reject correctly. Adapt the upstream asynchronous error handling while preserving the fork's `HDRLoader` import and existing supported formats. Install the guard at server startup after SES initialization, as upstream does.

**Verified:** eight upstream guard/control/loader tests passed under Node 22.23.4 in an isolated candidate. The control created one Brotli decoder without the guard; guarded responses created none. Gzip, deflate, plain responses, redirects and streamed bodies remained supported. Running the loader test against this fork's current ServerLoader with the candidate guard produced an unhandled external-buffer rejection. The loader follow-up is necessary, not just test cleanup.

The first full cherry-pick conflicts in changelog/E2E files. Selected production files from the first commit apply, but the loader follow-up needs adaptation. Do not stop after importing only the initial guard.

### 2. Correct the pending chat backport, then add IME and text wrapping

Relevant sources:

- [`11e593c`: chat/emote/grapheme review](https://github.com/dwebxr/coo-world/commit/11e593c8695ac4db13d1a5b110468db3ddd407d8).
- [`823106c`: IME input and bubble wrapping](https://github.com/dwebxr/coo-world/commit/823106c26fdc1c7190fe301ec649813caa52a7e7).

**Corrected regression in the earlier pending backport:** [Chat.send](../src/core/systems/Chat.js) added a local message immediately, while [ServerNetwork.onChatAdded](../src/core/systems/ServerNetwork.js) created a new authoritative ID and broadcast back to the sender. One sent message became **two rows with different IDs**. This was reproduced using the actual client/server classes before the correction.

Follow upstream's existing optimistic-chat pattern: sanitize locally before insertion and exclude the originating socket from the server broadcast with `this.send('chatAdded', message, socket.id)`. Preserve the server's authoritative sender/timestamp policy and peer validation.

Then ignore Enter/Escape while `event.isComposing` or `event.keyCode === 229` in CoreUI/Fields. The pending tree already contains the grapheme-aware [wrapText helper](../src/core/extras/wrapText.js), but [UIText](../src/core/nodes/UIText.js) still calls its old local implementation. Wire the existing helper into UIText rather than introducing another wrapper.

The complete IME commit conflicts with the already-added helper. Selected UI hunks also need context adaptation to this fork's CoreUI/Fields changes.

### 3. Firefox-compatible audio initialization

Source: [`be3357b`: Firefox audio startup](https://github.com/dwebxr/coo-world/commit/be3357b955fdced8af02cac262643f075eb200b5).

[ClientAudio](../src/core/systems/ClientAudio.js) initializes `positionX/forwardX/upX` AudioParams unconditionally at line 27. A listener exposing the legacy `setPosition/setOrientation` API throws during construction. The later update method already has the correct fallback; use the same feature detection in the constructor.

**Verified:** the current production constructor throws `TypeError` with the legacy listener shape; the selected upstream source patch passes that probe. This is an API-shape test, not an actual Firefox browser run.

The full commit conflicts in its unrelated E2E harness. Its **ClientAudio-only patch applies cleanly**.

### 4. Small UI/Yoga correctness fixes

Source: selected hunks from [`043b40c`](https://github.com/dwebxr/coo-world/commit/043b40c69a2d78e09df53ac4f5a755d607a61824).

| Current defect | Enforcement point | Reproduced result | Upstream correction |
| --- | --- | --- | --- |
| Recursive getter | [UI](../src/core/nodes/UI.js), line 782 | `RangeError` | Return `_flexWrap`. |
| Recursive getter | [UIView](../src/core/nodes/UIView.js), line 472 | `RangeError` | Return `_flexWrap`. |
| Misspelled early return | [UIText](../src/core/nodes/UIText.js), line 370 | `ReferenceError` when setting unchanged padding | Replace `rturn` with `return`. |
| Invalid absolute-position constant | UIView line 255; UIText line 250 | UIView passes `undefined` to Yoga | Use `Yoga.POSITION_TYPE_ABSOLUTE`. |
| Invalid flex directions accepted | [yoga.js](../src/core/extras/yoga.js), line 47 | `isFlexDirection('center') === true` | Accept only row/column directions. |

The selected four-file patch applies cleanly, and the production-class probes pass afterward. It also includes small `let/var` to `const` cleanups from those same upstream hunks.

Do not cherry-pick the entire July refactor: it touches 69 files and includes agent/Solana/UI changes beyond these defects. Keep this fork's established behavior.

### 5. Headless-client snapshot and session ownership

Source: [ClientNetwork hunks in `043b40c`](https://github.com/dwebxr/coo-world/commit/043b40c69a2d78e09df53ac4f5a755d607a61824).

[createNodeClientWorld](../src/core/createNodeClientWorld.js) does not register an AI system, while [ClientNetwork.onSnapshot](../src/core/systems/ClientNetwork.js) unconditionally calls `this.world.ai.deserialize(data.ai)` at line 229. An actual-class snapshot probe with a headless world throws `TypeError`. Use upstream's optional call, `this.world.ai?.deserialize(data.ai)`.

The earlier headless build/import/construction check did not exercise a received snapshot. It does not establish connected headless-client compatibility.

For multiple clients in one process, upstream also accepts caller-owned `authToken/onAuthToken` options instead of making all clients share singleton storage. Adapt both socket login and authenticated upload: this fork's `upload` at line 113 still reads the singleton token. Preserve protocol v2, fork packet IDs, loading, portal arrival and player sessions. Review upstream's receive-queue flush before close so the kick reason survives disconnect.

These changes need selected-hunk adaptation; the full July refactor is inappropriate.

### 6. Docker context exclusions, then a useful CI gate

Sources:

- [`1f52822`: bare .env exclusion and build/test CI](https://github.com/dwebxr/coo-world/commit/1f528221b240be0be73d4f97179d5fea36834bb2).
- [`0725a54`: exclude agent-tool context](https://github.com/dwebxr/coo-world/commit/0725a549c556165d2a54658894fc62fe47f36866).

[.dockerignore](../.dockerignore) excludes `.env.*` but **not bare `.env`**. The build stage uses `COPY . .`, so a bare `.env` can enter its context and build stage. The final stage copies selected paths; this review does not claim that a deployed final image contains the file. No configuration contents were read or printed.

The relevant file-matching and context rules are documented in [Docker's build-context reference](https://docs.docker.com/build/concepts/context/#dockerignore-files).

The `.dockerignore` hunk adding `.env` applies cleanly. The full CI commit conflicts with this fork's build scripts and ESLint setup. Add a CI gate around the existing patched runtime, builds, security tests and fork regressions when implementing; account for the two previously reproduced baseline failures rather than claiming the full suite is green.

The tool-context commit is the only tested whole commit that picks cleanly, but merely adds `.claude`. Match exclusions to actual tool directories in this fork when useful; clean application alone is not a reason to import it.

### 7. Optional: microphone-amplitude lip sync

Coo sources: [per-avatar mouth state](https://github.com/dwebxr/coo-world/commit/b5a9a259c9b7fec1d51426ae28e32f1e2025ae98), [voice analyser and smoothing](https://github.com/dwebxr/coo-world/commit/a1ab56c0fcd243d9b2e8ca89b34c94211e3af812), [preference](https://github.com/dwebxr/coo-world/commit/089d69b9ae3a054626e9c81d949f642ed63e2797), [review corrections](https://github.com/dwebxr/coo-world/commit/e19ac675a9324d56451cd0ca79ba437076f7e6db), [clone isolation test](https://github.com/dwebxr/coo-world/commit/d8b97c2e07d1562c764330f4d04895686f1326c5), [follow-up](https://github.com/dwebxr/coo-world/commit/50dac8e9c7d824596e58bc2f7cda4251013b0e96).

This fork already has cloned standard VRM expression managers in [AvatarExpressions](../src/core/extras/AvatarExpressions.js), including mouth/blink overrides and facial expression support. Its [ClientLiveKit](../src/core/systems/ClientLiveKit.js) already feeds speaking state to players. Replacing that with Coo's custom mouth writer would duplicate responsibilities.

If better lip sync is wanted, borrow the analyser/smoothing and feed amplitude into the existing manager, with mute/distance/cleanup behavior. This is a feature choice, not a required security fix. The first mouth-state commit conflicts in `createVRMFactory.js`; the remaining feature chain was not cherry-picked after that conflict.

## Tested application paths

Trials used a disposable clone of HEAD **plus all current pending tracked/untracked backport files**, staged only in that clone. Each whole-commit trial used `git cherry-pick --no-commit`; sequences stopped at the first conflict. Selected-file trials used `git apply --index --check` followed by application in that clone. No trial created a commit or changed the main checkout's index.

| Candidate | Whole commit | Selected production patch |
| --- | --- | --- |
| Fetch guard chain | First commit conflicts in changelog/E2E | Initial guard applies; ServerLoader follow-up needs adaptation. |
| Firefox audio | E2E conflicts | ClientAudio applies and passes the listener-shape probe. |
| IME/wrapping | Existing wrapText helper conflicts | CoreUI/Fields context needs adaptation. |
| July correctness refactor | Many engine/UI/dependency conflicts | Four UI/Yoga files apply and pass focused probes. |
| Voice lip sync | createVRMFactory conflict | Use an adapted amplitude signal with the existing VRM manager. |
| CI / environment | ESLint/build-script conflicts | `.dockerignore` applies. |
| Tool exclusion | Clean | Only adds `.claude`; optional. |

Exact hashes, paths and conflict messages: [application results](security-backports/2026-10-24-upstream-application-results.json). Focused before/after evidence and test limits: [validation results](security-backports/2026-10-24-upstream-validation-results.json).

### Historical prepared small patch — now applied

The [reviewed small-fixes patch](security-backports/2026-10-24-reviewed-small-fixes.patch) contains only ClientAudio, UI/UIView/UIText, Yoga validation and the bare `.env` exclusion. It includes explicit upstream commit URLs in its header. Those changes are now applied, together with the adaptations listed above. **Do not reapply this historical patch to the current checkout.**

To validate the implementation:

```sh
npm run test:security
npm run test:security:server
node docs/security-backports/2026-10-24-characterize.mjs
```

Use Node 22.23.4 or another runtime allowed by this fork's runtime policy. The [characterization script](security-backports/2026-10-24-characterize.mjs) runs actual production classes with small fixtures, avoids writing real session storage and cleans up its temporary module. The corrected results are one chat row, a successful headless snapshot, valid UI values and successful legacy audio construction.

The whole-commit feasibility trial below is historical. Its recorded conflict list applies to the pre-implementation snapshot, not the now-modified checkout:

```sh
gh api user --jq .login
# Expected account: jerometremblay-bot
git fetch https://github.com/dwebxr/coo-world.git main
git cherry-pick --no-commit 0960a8d4df12c53d972f885616287ff9cbabec0b
# Expected conflict: CHANGELOG.md and test/e2e/fullstack.mjs.
# Discard the disposable trial after inspecting it.
```

The prepared patch is a partial source selection, not an exact cherry-pick. If a commit is later explicitly requested, retain the upstream URLs as `Upstream-Commit:` trailers and follow the repository's bot identity/signing instructions.

The earlier review-phase evidence remains in the linked JSON files. The implementation checks above supersede the review's limited characterization results. Docker builds and the deployed world were not tested.
