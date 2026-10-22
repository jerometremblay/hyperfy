# Hyperfy Published Objects — Phase 1 Development Specification

**Status:** Implementation-ready design specification
**Date:** 2026-10-22
**Primary codebase:** [jerometremblay/hyperfy](https://github.com/jerometremblay/hyperfy)
**Intended audience:** Codex / Hyperfy engine contributors
**Delivery format:** Markdown; deliberately independent of any external document system.

## 1. Purpose and scope

Implement source-aware, manually updatable Hyperfy objects as a **native enhancement of ordinary Hyperfy app entities**, not as a new `.hyp` app, new scene system, or marketplace. An object may carry an optional source URL pointing to **one directly downloadable `.hyp` file**. Hyperfy retains its own complete installed copy, periodically checks the source for changes, and offers a manual **Update** action. Updates replace the installed implementation while preserving entity identity, placement, and compatible locally configured properties. The update must be **Undo-able as one action** in the existing builder Undo system.

The broader goal is interoperability across the Hyperfy ecosystem: any compliant world should be able to use a direct `.hyp` URL and the same metadata semantics. Keep resolver logic extensible so a future GitHub repository provider can map a repository/object selection into one downloadable `.hyp`, but **do not implement repository support in Phase 1**.

### Agreed decisions (normative)

| Area | Decision |
|---|---|
| Existing import | Preserve drag-and-drop behavior for `.hyp` and other supported files. |
| Supported source | One direct public HTTPS `.hyp` URL per tracked object; redirects are allowed subject to security controls. |
| Create from URL | Fetch, validate, import, instantiate and associate the URL in one user workflow. |
| Attach to existing object | Store URL without changing its blueprint, props, transform, runtime state or running script; mark provenance unverified initially. |
| Checking | Check automatically, including after startup, then on a periodic schedule. Offer **Check now**. |
| Installation | **Manual only**. A detected change never installs itself. |
| Change detection | Compare content SHA-256 of actual `.hyp` bytes. Do not rely on filename, HTTP timestamp or a version string. |
| Update preservation | Keep entity ID, position, orientation, scale, pinned status, and compatible user-modified properties. New published defaults apply to untouched properties. |
| Local implementation edits | Warn and require explicit confirmation before overwriting edited scripts/models/implementation assets. Configuration edits are not implementation edits. |
| Undo | One builder Undo action restores the previous blueprint, props, runtime-state snapshot, installed hash, source URL and tracking metadata. It changes **only that instance**. |
| Failures | Invalid files, fetch failures, permissions/conflicts and failed replacements must leave the previous object usable; do not create an Undo entry on failure. |
| Packaging | Preserve ordinary self-contained `.hyp` semantics. Instance source tracking must **not automatically be embedded in exported `.hyp` files**. |
| Development workflow | **URL-only**. No push-based publishing, custom development channel, watcher, tunnel or Codex integration in Phase 1. |
| Deferred publishing | GitHub repository links, manifests, multi-object repositories, releases, provider-specific versions, auto-installation and dependency management are out of scope. |

**Terminology:** “auto-refresh” in this project means **automatically refresh update availability**; it does **not** mean automatically replace the running app.

### Suggested defaults, adjustable via configuration

- Recheck each distinct URL on server startup, then approximately every **6 hours**, with jitter, backoff, and a per-URL cache. Manual Check now can bypass normal staleness if rate-limited appropriately.
- Source checks are a **world-server responsibility**, shared among connected visitors.
- An unchanged package does not create a new revision and must not be offered as an update.
- The current builder permission is required for import, linking, replacing, unlinking, and Undo that changes the object.
- No separate persistent historical-version browser is required; retain previous assets/blueprints for the active builder Undo record. Persistent rollback across restart is deferred.

## 2. Existing implementation: verified integration points

The following files and behaviors were inspected in `jerometremblay/hyperfy` on 2026-10-22. **Codex must re-open them in the working checkout before editing**; file behavior may change.

| File | Existing behavior | Required change |
|---|---|---|
| [`src/core/extras/appTools.js`](https://github.com/jerometremblay/hyperfy/blob/main/src/core/extras/appTools.js) | `importApp()`, `exportApp()`, `replaceApp()`. Replacement imports and uploads assets, creates an isolated blueprint, switches the same entity to it, attempts to revert on detected script failure, and adds `replace-app` builder Undo. | Generalize replacement for downloaded bytes, compatible-property merge, and one complete update/Undo snapshot. |
| [`src/core/systems/ClientBuilder.js`](https://github.com/jerometremblay/hyperfy/blob/main/src/core/systems/ClientBuilder.js) | Handles URL/file drops, calls `addApp(file, transform)`, and holds a bounded in-memory Undo stack. It currently downloads arbitrary dropped HTTP URLs as blobs; a repository HTML page is not resolved to a `.hyp`. | Keep existing file behavior; add direct URL import UI entry point; extend `replace-app` Undo to cover source metadata and conflicts. |
| [`src/client/components/MenuApp.js`](https://github.com/jerometremblay/hyperfy/blob/main/src/client/components/MenuApp.js) | Inspector has **Replace from .hyp**, Download, props, Code, and Metadata; it has a descriptive `blueprint.url`. | Add Published Source panel, status, link/unlink, Check now, Update, warning dialog and progress. Handle blueprint/instance changes after replacement. |
| [`src/core/entities/App.js`](https://github.com/jerometremblay/hyperfy/blob/main/src/core/entities/App.js) | `App.modify()` explicitly handles blueprint, transform, state, etc.; blueprint switching causes `build()`. | Apply/synchronize instance `published` metadata **without rebuilding** and preserve its JSON serialization. |
| [`src/core/systems/Blueprints.js`](https://github.com/jerometremblay/hyperfy/blob/main/src/core/systems/Blueprints.js) | Blueprint registry. `modify()` rebuilds all entities referencing a modified blueprint and resets their states. | Avoid mutating a shared blueprint when updating only one instance. |
| [`src/core/systems/ServerNetwork.js`](https://github.com/jerometremblay/hyperfy/blob/main/src/core/systems/ServerNetwork.js) | Handles blueprint/entity messages; persists dirty blueprints/entities. Current general `onEntityModified` has no dedicated builder-rank check for app source changes. | Add **server-validated** published-object operations, concurrency protection, acknowledgements and broadcast order; never blindly trust client-supplied tracking/hash fields. |
| [`src/core/systems/ClientNetwork.js`](https://github.com/jerometremblay/hyperfy/blob/main/src/core/systems/ClientNetwork.js) | Applies `blueprintAdded`, `blueprintModified` and `entityModified`. | Apply coherent update/Undo messages; ensure replacement blueprint arrives before the entity uses it. |
| [`src/server/db.js`](https://github.com/jerometremblay/hyperfy/blob/main/src/server/db.js) | Blueprint/entity records store JSON in `data` columns. | Prefer entity JSON metadata; a new column/table is not needed purely for source fields. |
| [`src/server/index.js`](https://github.com/jerometremblay/hyperfy/blob/main/src/server/index.js) | Fastify HTTP server and asset routes. | Mount secure same-origin published-source check/download operations as needed. |
| [`src/server/agent-api.js`](https://github.com/jerometremblay/hyperfy/blob/main/src/server/agent-api.js) | Authenticated world automation and asset upload. | **No development push integration** for this phase. Reuse utility patterns only if appropriate. |

**Key cautions from actual code:**

1. `replaceApp()` currently resets `state` to `{}`, uses `world.network.send('blueprintAdded', ...)` and `world.network.send('entityModified', ...)` separately, and records only the prior blueprint ID and prior state in Undo. **This is not yet a server-acknowledged atomic source-aware update.**
2. `ClientBuilder.undo()` currently pops the Undo item before validating that it can apply it. For published updates, conflicts/permissions must not silently consume the action.
3. `App.modify()` does not automatically persist unknown incoming keys; add explicit `published` handling.
4. `Blueprints.modify()` rebuilds every instance sharing a blueprint. Never update a shared blueprint in place for an individual published-object update.
5. The inspector currently subscribes to blueprint modifications and must be updated to react when an entity switches to a newly created blueprint and when instance source/status changes.
6. `blueprint.url` is **author/descriptive metadata**, not the canonical update source. Keep its meaning unchanged.
7. Existing Worldsync tooling already supports object source deployment via the Agent API, but that is a **different workflow** and must not be pulled into this URL-only Phase 1.

## 3. Data model and identity

### 3.1 Blueprint versus entity

- **Blueprint:** Hyperfy implementation (model, script, default/configured props, flags, metadata, assets).
- **Entity:** A world instance (stable `id`, blueprint reference, transform, pinned state, transient state, optional published-source tracking).
- **Source cache:** A world-server service mapping canonical URLs to fetched package metadata/status/cached bytes. Shared among instances; not an entity source of truth.

Put optional tracking metadata in `entity.data.published`, **not** `blueprint.url` or user-script props. Importing a local file produces no `published` field. The field is additive; old worlds remain valid.

Example **illustrative** persisted entity fragment (not a final schema requiring these exact names):

```json
{
  "id": "entity-uuid",
  "blueprint": "blueprint-uuid",
  "position": [1, 0, 2],
  "quaternion": [0, 0, 0, 1],
  "scale": [1, 1, 1],
  "pinned": false,
  "published": {
    "schemaVersion": 1,
    "sourceUrl": "https://cdn.example.net/objects/chair.hyp",
    "verified": true,
    "installedHash": "sha256:<64 lowercase hex digits>",
    "baselineImplementationFingerprint": "sha256:<64 lowercase hex digits>",
    "baselineProps": { "color": "blue", "brightness": 1 },
    "lastCheckedAt": null
  }
}
```

Separate concerns:

- `installedHash` = SHA-256 of **exact installed source `.hyp` bytes**, and is known only for installs from an acquired package. Changing live properties does not change this hash.
- `baselineImplementationFingerprint` = digest of an intentionally defined **canonical implementation descriptor** from the installed blueprint (e.g. script/model/implementation-asset references plus applicable execution flags). Exclude placement and configurable property *values*. It detects local edits independently of raw `.hyp` bytes.
- `baselineProps` = **published defaults at installation**, for deciding which values the user customized. This is not the current effective props object.
- `verified` = whether the installed package is known to correspond to the currently assigned source. Merely attaching a URL does **not** prove it.
- Check result (`availableHash`, `etag`, `lastModified`, `checkedAt`, error/status) can be stored per URL server-side and exposed as derived status. Do not duplicate transient fetch status into every entity unless needed for persistence/UI.

Hashes must be calculated from actual bytes/canonical descriptors. Never let an arbitrary client assert that a remote URL was verified by the server.

### 3.2 Identity and multiple instances

- Entity ID remains **unchanged** throughout import-following, replacement and Undo (a new import gets one normal new entity ID).
- Preserve position, quaternion, scale, pinned and references that target the existing entity ID.
- New package installation must get its **own blueprint ID** for the selected entity, so siblings remain untouched even if they previously shared a blueprint.
- Duplicating a tracked instance may copy source metadata, but subsequent updates must remain per-instance; if a duplicate has a shared blueprint, isolate at update time. Do not share mutable instance metadata.
- Do not reparent, move or respawn the entity as an update technique.

### 3.3 Linking, editing and unlinking a URL

- **Link**: require builder privileges and validated direct HTTPS URL form; change only `published` metadata. **Do not fetch-and-replace** or rebuild the app. Mark `verified=false` and provenance `unverified`, even if the URL currently returns an identical-looking package. A later check may identify the source package but cannot establish byte-for-byte identity with a previously local `.hyp` absent prior provenance.
- **Change source URL**: same no-replacement behavior; mark provenance unverified for the newly selected source while keeping the currently installed implementation unchanged. Retain install/baseline provenance only where it is genuinely meaningful; do not treat a previous source hash as proof of the new one.
- **Unlink**: remove tracking without changing the live implementation or props.
- Linking/unlinking must synchronize, persist, and not trigger `App.build()`.

## 4. URL resolution, package acquisition, and update status

### 4.1 Supported sources

Accept a **direct HTTPS address to a downloadable `.hyp` file**. The final response body must parse as a valid single-app `.hyp`. Follow limited redirects with full validation at each hop; a GitHub release asset **download URL** or raw file URL may qualify, but a GitHub repository/HTML listing page does not. Keep the original URL as the source identity; record final redirect URL only as fetch metadata.

For Phase 1, do **not** implement GitHub API resolution, private repository authentication, multi-object manifests, automatic dependency resolution, branch/ref selectors, custom development publishing or localhost-only exceptions.

### 4.2 Server-side fetching

Introduce a `PublishedSourceResolver` on the Hyperfy server:

1. Canonicalize and validate the supplied HTTPS URL.
2. Enforce a DNS/IP/redirect policy to prevent SSRF; reject loopback, link-local, private, reserved/cloud-metadata endpoints, IP-literal bypasses and credential-bearing URLs by default. Revalidate on redirect and at connect time to resist DNS rebinding.
3. Apply connection/read timeouts, maximum redirects, decompressed/body-size limits, and bounded concurrency; stream into bounded storage rather than blindly buffering arbitrary responses. Reject unexpected HTML and invalid `.hyp` structure.
4. Validate package header/asset lengths, single-object (not scene) constraint, accepted asset types/paths, and configured upload limits **before** offering installation.
5. Compute SHA-256 over downloaded bytes. Use `If-None-Match`/`If-Modified-Since` conditionally when available; trust 304 only relative to a previously cached body/hash for the same source.
6. Cache by canonical source URL; deduplicate parallel fetches. Do not assume `ETag` is a content hash.
7. Make acquired candidate bytes available through **authenticated, same-origin, bounded** transfer to the builder installation flow; browser CORS rules must not block remote HTTPS sources.
8. On fetch failure, return an explicit status and keep the currently installed package operational.

Caching can be initially in memory, with a persisted cache only if needed for offline candidate availability. Correctness must not depend on retaining the remote copy across restart: the installed assets/blueprint stay local.

**Security boundary:** the server must authorize which user can fetch a package for installation and must never expose arbitrary server-side URL fetching to untrusted visitors. A configurable source-policy allowlist can be added later; safe outbound defaults are required now. Remote `.hyp` scripts are executable code: updating is a code deployment. Manual approval does not eliminate other standard package/script security checks.

### 4.3 Update-status state machine

Model status as a derived state, separate from update installation:

| State | Meaning | UI/action |
|---|---|---|
| `local` | No source URL | **Add source URL** |
| `unverified` | URL attached to existing object or newly changed, no trusted installed-source match | **Check now** / **Install from source** with explicit replacement warning |
| `checking` | Fetch/check in progress | Progress indicator; no duplicate request |
| `current` | Verified installed hash equals latest downloaded hash | No Update button or disabled **Up to date** |
| `update-available` | Verified installed hash differs from latest downloaded hash | **Update** (manual) |
| `locally-modified` | Local implementation fingerprint differs from baseline | Show separate warning state in addition to current/available status |
| `check-failed` | Remote cannot be checked | Display last error/date; **Retry**; installed app unaffected |
| `installing` | Manual installation transaction in progress | Disable concurrent update controls |

A *linked but unverified* object must **not** falsely advertise a newer version just because the remote package has a hash. Offer deliberate **Install from source** with a warning, after fetching.

### 4.4 Scheduling

- World server performs checks on startup and about every six hours by default; schedule jitter to avoid synchronized network bursts.
- Per-URL cache means twenty instances pointing to the same URL cause one source check.
- Check now should refresh a cached result when permissible, rate-limited.
- Installed objects continue working offline and when their source disappears.
- Automatic checking must never call installation, `replaceApp`, or rebuild an entity.

## 5. Import, install, merge and modification rules

### 5.1 Import new object from a URL

1. Builder selects **Import from URL** and enters a single HTTPS `.hyp` URL.
2. Server resolves/validates package; client receives a trusted candidate package and its server-computed hash.
3. Reuse the existing `importApp`/`ClientBuilder.addApp` asset-import logic and normal placement workflow. Preserve the existing drag-and-drop path; do not make old imports require a source URL.
4. Create a normal entity and a normal blueprint. Attach `published` metadata with `verified=true`, installed package hash, defaults baseline, implementation fingerprint and URL.
5. Publish and persist the linked instance only after assets and blueprint are accepted. Report errors without leaving a ghost instance.

Do not treat a URL pathname or Content-Type alone as proof of `.hyp`; validate binary structure. A download URL may have query parameters or a redirected filename.

### 5.2 Install an update on a verified object

1. Require builder permission; object must be a regular app (not `$scene`), present, and not currently moving, uploading, building or being replaced.
2. Obtain the latest validated candidate bytes from the server resolver and record its hash. Recheck that this is still the intended URL, entity revision/blueprint, and candidate hash when committing.
3. If hash equals `installedHash`, report up to date; perform no replacement/Undo.
4. Determine local implementation edits by comparing current canonical implementation fingerprint with the installed baseline. If edited, display explicit overwrite warning; require confirmation.
5. Compute merged props using rules below; report dropped or incompatible values when useful.
6. Prepare an undo snapshot containing **previous blueprint ID and complete blueprint/asset availability, entity state, published metadata, effective props where relevant, expected post-update revision, and transform/invariants**.
7. Upload/ensure all package assets, create a **new isolated blueprint** for the target instance; stage and prevalidate as much as possible.
8. Use a **server-validated update operation with acknowledgement and conflict check** to switch blueprint + source metadata coherently. Ensure blueprint availability precedes entity switch for observers.
9. Rebuild the instance using the existing app loading logic. Detect failures that can be observed; recover the previous blueprint and metadata if installation fails. A build failure on another connected client may be reported after commit; account for that limitation explicitly.
10. Register **exactly one** builder Undo action only after a successful, acknowledged update. Notify the user of success.

A rejected operation, connection loss before commit, failed script/model load, malformed asset, or mid-flight concurrent edit must not report success, corrupt source metadata or create a misleading Undo entry.

**Important architectural work:** the current two separate `blueprintAdded`/`entityModified` sends are not a transaction or server acknowledgement. Implement a dedicated server-authorized operation (or an equivalent acknowledged transaction coordinator) for published replacement/Undo. Do not merely put the new `published` key into the existing fire-and-forget `entityModified` packet and call that atomic. All clients must observe a coherent blueprint-before-entity order. Codex may choose the packet/API names after inspecting the current networking system.

### 5.3 Compatible-property merge

A published package contains defaults. Current blueprint props contain effective local values. Compare the old **published defaults baseline** with the current props to identify overrides.

For each key in **new** defaults:

- If key did not exist before: use new published default.
- If current value is semantically equal to old published default: use **new** published default (no local override).
- If current value differs from the old baseline and the value is compatible with the new field/default type: preserve **current** value.
- If user override is incompatible with the new property type/schema: use new default and report it. Do not silently insert an invalid override.
- If key disappeared in the new package: drop it rather than persisting a now-unsupported property.

Use a deterministic deep comparison appropriate for the property representation and validate asset-valued props (`{type, url}`) and availability. Primitive equality alone may not be sufficient for structured properties. Do not use `JSON.stringify` without considering key-order normalization.

Example:

| Property | Previous default | Locally effective | New default | Result |
|---|---:|---:|---:|---:|
| `color` | blue | red | green | red (user override) |
| `intensity` | 1 | 1 | 0.8 | 0.8 (new default) |
| `speed` | 2 | 3 | *(removed)* | *(removed)* |
| `radius` | *(absent)* | *(absent)* | 5 | 5 (new default) |

For **existing objects linked after manual import**, there is no reliable published-default baseline. Prior to their first verified installation, **preserve compatible current values conservatively** during explicit **Install from source**, instead of guessing that any old value was an untouched published default. Record the new published defaults baseline upon that verified installation.

Explicit per-key override flags and a property-schema migration API are future improvements, not Phase 1 requirements. If a user sets a value back to its old default, it is considered unmodified under this baseline comparison.

### 5.4 Local implementation edit detection

Compare a canonical descriptor of **implementation fields** at installation with live values before applying an update: script/model references, implementation assets and execution-related flags that affect behavior. Property **values** and entity transforms are not implementation changes. Content-addressed asset IDs can be used to detect asset substitution when source URLs are immutable; mutable external asset URLs cannot reliably expose byte-level changes without fetching them.

When source installation will overwrite edits, present a warning with choices **Cancel** or **Replace implementation**. A warning is not the same as automatically merging JavaScript. No three-way source-code merge in Phase 1.

### 5.5 Rebuild/runtime state and side effects

Placement and compatible properties survive. Runtime script state is **not generally migrated** across implementations; install may reset it to `{}`. Existing transient interactions (for example, seated players, script listeners, spawned effects or active physics interactions) may need rebuilding or detachment. Avoid falsely guaranteeing seamless hot module replacement.

Builder Undo can restore the prior blueprint and captured state, but **cannot reverse arbitrary external side effects already performed by the updated script**, such as outgoing API calls or server-wide actions. Document this UI limitation without weakening the required engine Undo behavior.

## 6. Undo: mandatory Phase 1 feature

**Invariant:** one successful published update → exactly **one** standard builder Undo entry. Ordinary Undo (including existing keyboard binding) must undo the update as a whole. Redo is not required.

### 6.1 Undo snapshot

Capture before mutation:

- Entity ID and its pre-update blueprint reference; ensure the old blueprint and referenced assets remain accessible.
- Previous complete `published` metadata: source URL, `verified`, `installedHash`, implementation baseline, defaults baseline, any other persistent tracking keys.
- Prior `state` snapshot and effective props (or blueprint reference guaranteeing those values).
- Relevant expected new blueprint ID, entity revision/operation token, and post-update installed hash for conflict detection.
- Transform/pinned invariants; restore them only if the update inadvertently changed them. Under normal replacement, user placement is unchanged.

### 6.2 Undo algorithm

1. Locate the same entity; verify it has not been destroyed or independently changed since the recorded update (respect normal LIFO Undo semantics).
2. Require builder permission. If conflict/permission failure occurs, **do not silently consume** the Undo action; report why Undo is blocked.
3. Request one server-acknowledged restore of prior blueprint, prior state and all prior source metadata. Keep the entity ID/placement intact.
4. Synchronize to other clients and persist. Rebuild prior implementation. Preserve previous installed package/blueprint assets until the Undo entry can no longer be used.
5. Restore source relationship and `installedHash`; if the remote server still reports a different hash, the object can show **Update available** again.
6. On failure, leave both the current installation and the Undo action recoverable when possible, rather than partially reverting metadata.

If another object shares the same source URL or former blueprint, **do not change it**. The Undo action restores the selected instance only.

### 6.3 Undo boundaries

- Undo is the existing builder session's bounded in-memory history (currently 50 items), not durable after process/client restart.
- Persistent rollback/version browsing across restarts is a separate future feature.
- If a user explicitly chooses **Install from source** on an unverified linked object, this replacement must receive the same complete Undo behavior.
- Failed installations create **zero** Undo entries.
- Existing **Replace from .hyp** should use the same underlying replacement/Undo machinery when practical, without changing its established user interaction unless needed.

## 7. UI design

Add an **Import from URL** entry in an appropriate builder/import menu. Do not remove or repurpose drag-and-drop.

Add a **Published Source** section to the selected object's inspector:

- Source URL (editable, with link and unlink controls).
- State: Local / Unverified / Checking / Up to date / Update available / Check failed / Installing.
- Last checked timestamp and an actionable error message on failure.
- **Check now** and **Update**. For unverified objects: **Install from source** instead of implying a newer version exists.
- Readable source/installed hash abbreviation; no requirement for semantic version numbers.
- Local modifications warning with explicit user confirmation before destructive replacement.
- After successful update: toast/feedback indicating that **Undo** restores the previous version.

Source association updates must not trigger an application rebuild or move the app. Disable install controls while one update is active. Protect long-running requests against inspector closure, disappearing entities and stale selections.

## 8. Component architecture and suggested files

Favor a small number of responsibilities and reuse existing code, avoiding an additional abstract package framework.

| Suggested location | Responsibility |
|---|---|
| `src/server/PublishedSourceResolver.js` | HTTPS-only URL resolver/fetcher; SSRF guards, size limits, hashing, conditional HTTP requests, shared per-URL cache. |
| `src/core/systems/PublishedSources.js` (or existing system extension) | Source metadata helpers, status derivation, baseline comparison; avoid coupled server/browser logic. |
| `src/core/extras/appTools.js` | Shared import/isolated-replacement machinery, property merge, implementation fingerprints, rollback staging. |
| `src/core/systems/ClientBuilder.js` | Import-from-URL integration and exactly-one-entry Undo restoration. |
| `src/client/components/MenuApp.js` | Source inspector UI and install/confirmation flows. |
| `src/core/entities/App.js` | No-rebuild instance source metadata updates. |
| `src/core/systems/ServerNetwork.js` | Server authorization, revision checks, acknowledged update and Undo coordination. |
| `src/core/systems/ClientNetwork.js` | Coherent update results and broadcast application. |
| `src/server/index.js` | Mount secure resolver routes as needed. |
| `src/server/db.js` | No schema migration expected solely for entity JSON; update persistence/serialization checks instead. |
| `test/published-objects/*.test.mjs` (or repository convention) | Node native test runner unit and integration tests. |

**Implementation guidance:** choose one canonical replacement entry point, conceptually `replaceInstance(entity, validatedPackage, options)`, that powers both manual `.hyp` replacement and tracked source updates. `options` should define preservation/Undo strategy; do not fork incompatible replacement algorithms. The operation must be interruptible/cancelable or stale-result-safe.

The source resolver should eventually admit provider plugins (for GitHub repositories), but Phase 1 should implement **only** direct HTTPS `.hyp` sources.

## 9. Networking, persistence and concurrency guarantees

- **Authorization:** source linking, unlinking, install, revert and creating instances require builder privileges enforced on the **server**, not only in browser UI. Do not rely on generic `onEntityModified` for trusted package metadata updates.
- **Revision check:** bind each install request to the entity ID, currently observed blueprint ID/version and source metadata revision (or server-side operation token). Reject stale/replayed concurrent writes and stale candidates.
- **Hash verification:** server derives source/candidate hash from bytes. The installed hash changes **only on committed installation** or restoring a committed previous version.
- **Coherent commit:** accept blueprint creation + entity switch + installed tracking metadata as a single logical operation, with acknowledgement; if the existing messages are reused, add explicit transaction sequencing/acknowledgement and rollback semantics instead of assuming ordinary sends are atomic.
- **Observation:** connected clients must not briefly point an entity at a missing blueprint; preserve ordering and/or stage the blueprint before announcing the switch.
- **Persistence:** entity `published` metadata must survive world save/reload, snapshots, network join, duplication behavior and ordinary entity changes; blueprint references remain valid after restart.
- **Conflict policy:** if the target entity is moving, uploading, deleted, concurrently edited or updated by another builder, reject/retry with a clear error. Do not replace someone else's newer changes.
- **Errors:** distinguish URL/network error, invalid package, permission denied, stale candidate, local-modification confirmation, app-load failure and partial-observer failure.
- **Performance:** cache checks per URL and bound fetches. Do not re-run scripts or rebuild entities just because a source was checked or a timestamp updated.

## 10. Test plan / acceptance criteria

Implement automated tests with the repo's Node test conventions (`node --test`); use the test infrastructure already present before creating new helpers. Mock remote sources so tests do not require public GitHub or unrestricted network access.

### Import and source metadata

- [ ] A valid direct HTTPS `.hyp` can be imported; the normal entity and blueprint are created.
- [ ] Existing file drag-and-drop and manual `.hyp` imports remain unchanged.
- [ ] A repository HTML page, scene `.hyp`, corrupted header, truncated assets, oversized package and invalid asset metadata fail safely.
- [ ] Source URL, installed SHA-256, baseline defaults and implementation fingerprint survive restart and fresh-client synchronization.
- [ ] Linking a previously local object changes metadata **only**; no build/script restart, transform change or props reset.
- [ ] A linked object is **Unverified** until an actual validated source installation; Check now does not fabricate installed provenance.
- [ ] Changing/removing source URL never rewrites the implementation.

### Checks and notifications

- [ ] `current` is reported for equal source/installed hashes; no update action is offered.
- [ ] A changed package at an identical URL is discovered automatically and manually; no automatic install occurs.
- [ ] Two or more tracked objects with the same URL use one cached remote check.
- [ ] Conditional `304 Not Modified` works only when prior bytes/hash are known.
- [ ] Redirects, DNS rebinding, private-IP destinations, timeout, enormous response, HTML response, invalid payload and failed downloads are rejected or surfaced appropriately.
- [ ] Source failures do not affect already running objects.

### Update + property merge

- [ ] Update retains entity ID, position, quaternion, scale, pinned and target references.
- [ ] Update isolates target blueprint: sibling objects sharing the old blueprint do not change.
- [ ] User-modified compatible props are preserved; untouched props adopt new defaults.
- [ ] New props get new defaults; removed/incompatible props are removed/reset with feedback.
- [ ] Asset-valued prop compatibility and asset availability are checked.
- [ ] Runtime state is reset according to the chosen policy; no claimed generic state migration.
- [ ] Local script/model/implementation edits produce a warning and require confirmation; placement/property changes alone do not.
- [ ] Unverified objects can explicitly install source with warning and subsequently become verified.
- [ ] A second builder's edit, deletion or new update while a package is being fetched rejects a stale install.

### Undo (mandatory)

- [ ] Import v1 → publish v2 to same URL → Check → Update → Undo: v1 implementation, previous effective props, `published` metadata and source hash restored, entity ID/placement unchanged.
- [ ] Rechecking after Undo offers v2 again when source remains v2.
- [ ] Two instances from one source: Update/Undo on A never changes B.
- [ ] Undo correctly restores a formerly **Unverified** linked object and its unverified metadata after an explicit installation.
- [ ] One successful update creates exactly one Undo item; no separate source-metadata Undo item.
- [ ] A failed fetch/invalid package/failed load/server rejection creates no Undo item and leaves v1 working.
- [ ] Undo conflicts or lack of permission do not silently discard its entry.
- [ ] An acknowledged update and Undo are visible and persisted for reconnecting clients.
- [ ] Updating does not break Undo of ordinary prior builder actions.

## 11. Implementation order and completion gate

**Milestone A — Source association + URL import**

- Add optional `entity.data.published`, serialization and server-authorized association updates.
- Add direct HTTPS `.hyp` fetch/validation and Import from URL UI.
- Establish precise baseline/hash storage for source imports and `unverified` semantics for linked objects.
- Validate that merely linking does not rebuild.

**Milestone B — Automatic checks**

- Implement server-side resolver, shared cache and periodic checks.
- Expose source status and inspector notifications. Manual **Check now**.
- Verify zero runtime effect when checking and all download/SSRF limits.

**Milestone C — Safe installation + Undo**

- Implement compatible-property merge and local implementation edit warning.
- Extend isolated instance replacement into an acknowledged, conflict-aware operation.
- Make source metadata and blueprint switch one logical commit.
- Extend standard builder Undo to restore the entire update with one action.
- Complete failure/rollback/concurrent-builder tests and restart/synchronization tests.

**Phase 1 is not finished until Milestone C and all mandatory Undo tests pass.** A prototype that fetches files and replaces code but cannot reliably Undo, isolate instances or survive restart is not complete.

## 12. Explicitly deferred work

- GitHub repository URL resolution; GitHub releases/tags and authentication.
- Repositories containing multiple objects; `.hyperfy/objects.json` or other manifests.
- Push from development machines, custom Codex publish endpoint, worldsync watch/push or special development source mode.
- Automatic installation, trusted-publisher policy and executable code signing.
- Dependency graph/package manager, semantic-version compatibility policy, world-wide bulk upgrades.
- Persistent multi-version history and rollback across server restart.
- Arbitrary runtime-state schema migration, in-place hot module replacement or reversing external script side effects.
- Script/source three-way merge and synchronization of repository source trees.

## 13. Decisions that do **not** block coding

No additional product decisions are required before starting Phase 1. Where details remain open, use these agreed/pragmatic defaults:

1. **Unknown provenance:** unverified, never assert an update is newer than the live object; allow deliberate installation after warning.
2. **Property policy:** preserve overrides relative to installed defaults; for previously local objects lacking baseline, conservatively preserve compatible values on first explicit source installation.
3. **Local code:** warn; do not merge code.
4. **Notifications:** inspector status only; checking is automatic, installing manual.
5. **Export:** a downloaded `.hyp` is standalone; no implicit instance source tracking in export.
6. **URL policy:** HTTPS direct `.hyp` bytes only; source hash is content identity, not an author-supplied version string.
7. **Undo scope:** current session's normal builder stack; one action for whole update; persistent history later.

---

### Instruction to implementing agent

Treat this document's **agreed decisions and acceptance criteria as requirements**. Before changing code, examine the listed current source files and their tests, then implement progressively in the existing Hyperfy architectural conventions. Preserve unrelated engine behavior, particularly drag-and-drop, independent instance updates, existing manual `.hyp` replacement, and ordinary builder Undo. Do not add GitHub repository provider behavior or a development-push architecture during Phase 1.
