# Hyperfy World-as-Code — Source-First Development Specification

**Implementation brief for Codex**  
**Revision:** 2.0 (supersedes the `.hyp`-first specification)  
**Date:** 2026-10-18  
**Engine:** [`jerometremblay/hyperfy`](https://github.com/jerometremblay/hyperfy), inspected on `main` at [`10f53f0c02ae38e54af3f203d9e57850502e00d0`](https://github.com/jerometremblay/hyperfy/commit/10f53f0c02ae38e54af3f203d9e57850502e00d0). **Reinspect the working checkout before editing.**  
**New repository:** `hyperfy-world` (suggested name; distinct from the engine fork). This document specifies the implementation; it does not authorize creating a remote GitHub repository or changing a production world.

## 0. Codex execution contract

Implement a **source-first, bidirectional, reproducible world-as-code system**. The source of truth in Git is **individual object definitions and their loose source assets**, plus a **declarative combined scene**. Native `.hyp` must remain a first-class **import input** when it is the only source available, and an **optional compiled/exported output**. Do **not** check generated `.hyp` files into Git by default.

The system must deliver all of these outcomes:

1. A separate repository holds editable JSON blueprints, authored JavaScript, models, textures, and other dependencies of independently placeable objects (cabin, furniture, portal pairs, lights, etc.). Objects may instead have a legacy `.hyp` as their sole source, by explicit declaration.
2. A combined scene manifest lists object instances with stable logical identities, exact placement/rotation/scale, pinned flags, selected world settings/spawn, and an optional independently versioned **environment `$scene`**. The combined scene **is not** a native single `.hyp`.
3. A compiler resolves local asset references to Hyperfy's content-addressed `asset://<sha256>.<ext>` URLs, validates packages, and generates a portable `.hworld` bundle. It generates ordinary standalone `.hyp` files **only when requested**. Live deployment normally sends resolved assets and blueprint data directly via authenticated Agent API.
4. Existing standalone `.hyp` files can be used *without conversion*; an optional `import --extract` converts what can be recovered into loose source files. Unknown original authoring projects cannot be reconstructed from compiled models.
5. A CLI supports `validate`, `build`, `import`, `export-hyp`, `diff`, `capture`, `deploy`, `status`, and `verify`. Deployments are idempotent, targeted, resumable, and default to dry-run.
6. **Live-world-to-Git capture** saves changes made by players: moved/added/deleted furniture, linked blueprint updates, portal edits, approved settings/environment changes. It updates editable source files where faithfully recoverable; it never silently replaces authored source with a reconstructed approximation.
7. An appropriately authorized player can choose **Save scene to Git** from Hyperfy. A trusted worker captures a consistent server snapshot and creates a reviewable branch/pull request; Git credentials and Agent writer tokens stay off clients and untrusted apps.
8. Three-way merge detects concurrent Git/live changes, differentiates managed/unmanaged content, and preserves both source changes and live edits. Fresh-clone build/deploy/recapture is reproducible without spurious diffs.

**Working style:** Implement in vertical slices with tests and operational documentation. Start with read-only export from the existing cabin world, then a disposable-world round trip; **do not mutate the production world during initial development**. All network-write commands require explicit `--apply`/confirmation. Do not claim a phase done until its specified acceptance tests pass. Player-triggered capture is part of final scope, not an optional future idea.

### Critical distinction: three artifacts

| Artifact | Purpose | Git? | Native Hyperfy import? |
|---|---|---|---|
| **Loose object source** (`objects/.../object.json`, `script.js`, `model.glb`, assets) | Authoritative editable definition | **Yes, canonical** | Compiled/resolved first |
| **Legacy native `.hyp` source** (`objects/.../original.hyp`) | Allowed when no loose source exists | **Yes, only in `mode: "hyp"`** | Yes |
| **Generated native `.hyp`** (`dist/objects/.../*.hyp`) | Optional shareable standalone object export | Normally no | Yes |
| **Scene layout** (`scenes/.../scene.json`) | Authoritative complete arrangement of independent entities | **Yes, canonical** | Applied by deployer |
| **Portable `.hworld`** (`dist/.../*.hworld`) | Complete world bundle containing resolved definitions/assets/layout | Normally no | Our deployment tool only, unless explicit Hyperfy importer added |

Hyperfy's special `$scene` blueprint is **background/terrain/environment**, not all placed furniture and apps. Its optional native `scene.hyp` is one environment app, not a combined world. Do not make a giant scripted `.hyp` that instantiates all furniture: it changes physics, ownership, persistence, interactions, and per-object editing.

## 1. Existing engine: inspected facts and integration surface

| Concern | Current fork | Implementation implication |
|---|---|---|
| DB | `src/server/db.js`: SQLite `<WORLD>/db.sqlite` or PostgreSQL (`DB_URI`, `DB_SCHEMA`) | Git is not a copy of the runtime DB; use live API/snapshots. |
| Blueprints | DB table `blueprints`, serialized JSON | Model/script asset URLs, `props`, flags, `id`, `version`. Multiple entities share a blueprint. |
| Entities | DB table `entities`, serialized JSON | Placed app instances contain `id`, `blueprint`, position `[x,y,z]`, quaternion `[x,y,z,w]`, scale, pinned, plus runtime fields. |
| Runtime loading/saving | `src/core/systems/ServerNetwork.js` | Startup hydrates blueprints then entities; dirty sets flush on `SAVE_INTERVAL`. Reads of DB rows alone may be stale. |
| Assets | `src/server/AssetsLocal.js` or `AssetsS3.js` | Content-hash names such as `asset://<sha256>.<extension>`. Need authenticated, bounded read and write for sync. |
| HYP | `src/core/extras/appTools.js` `importApp` / `exportApp` | Native `.hyp`: little-endian 32-bit JSON-header length, `{blueprint,assets}` JSON header, followed by the listed raw asset bytes. Reuse logic, not a new incompatible format. |
| Environment | `$scene` blueprint, created from `src/world/scene.hyp` on initial migration; special path in `ClientBuilder.addApp` | `$scene` updates need a dedicated guarded endpoint; not a normal placed instance. |
| Collections | `src/server/collections.js` | App catalog; does **not** represent scene placement. |
| Live Agent API | `/api/agent` in `src/server/agent-api.js` | Has app/entity list, create, modify, delete, scripts upload, world metadata. New snapshot, asset and managed endpoints are required. |
| Build-time scripts | `src/core/entities/App.js`, `src/core/systems/Apps.js` | Script-created nodes are inside a single blueprint, not independently persistent entities. |
| Garbage collection | `src/server/cleaner.js` | Currently can prune orphan blueprints and assets. Managed uninstantiated objects must be retained. |
| World profiles | `scripts/world-profile.mjs` | Reuse for a disposable staging world. |
| Current REST auth | Read/write bearer tokens, constant-time comparison | Preserve and extend; protect new binary/deploy endpoints and worker operations. |

At the inspected revision, the Agent API also exposes write-protected player inspection/teleport; do not broaden these permissions and do not interpret player entities as scene content.

**Known bug:** `ServerNetwork.save()` creates a clone with `state = null` but then serializes the original `entity.data`. Fix this to serialize the sanitized clone, with tests, without changing the intended persistence of authored transforms.

**Compatibility rule:** Existing native `.hyp` files, builder drag-and-drop, existing non-managed objects, scene bootstrapping, and non-Git worlds must continue to work unmodified. Pin the engine commit in integration-test metadata; revisit assumptions if upstream/fork APIs change.

## 2. Scope, invariants, and exclusions

### Mandatory requirements

- **R01 Source-first:** Editable loose source and binary assets are authoritative when available. Compiler output is disposable. Source files are never overwritten merely to make generated hashes match.
- **R02 Legacy support:** A native `.hyp` can be the only source for an object, without extraction. Import must validate it and expose its blueprint/dependencies; an explicit extraction/promotion path must exist.
- **R03 Standalone export:** From either source mode, optionally produce a native `.hyp` that is directly drag-and-droppable into current Hyperfy; embed every declared local asset dependency. Preserve flags/props and validate hashes.
- **R04 Scene composition:** Track independent persistent instances with stable logical IDs, shared blueprint definitions, accurate transforms/pinned values, optional environment, selected world settings and spawn.
- **R05 Multi-world:** Multiple named scenes and world profiles, with isolated development/staging/production mappings and credentials only from local environment/secret store.
- **R06 Direct deployment:** Do **not** require generating intermediate `.hyp` files to deploy source-mode objects. Upload hashed assets and upsert blueprints/entities over authenticated API.
- **R07 Portable bundle:** Generate deterministic `.hworld` from resolved source and layout; clean-room deployment works without access to original source repository or runtime asset server.
- **R08 Bidirectional capture:** Capture live transforms, additions/deletions, blueprint props/scripts/models, environment/settings as scoped; use native source update when lossless, legacy HYP fallback when not.
- **R09 Identity:** Persist reliable `repoId/sceneKey/objectKey/instanceKey` ↔ per-world runtime ID mapping. Never identity-match by name or position.
- **R10 Ownership:** Do not silently claim, move, delete, or edit objects unmanaged by this repository. Adoption must be explicit.
- **R11 Concurrency:** Use frozen server snapshots and three-way comparison to last acknowledged baseline; refuse destructive stale writes and unsafe merge.
- **R12 In-world save:** Authorized in-world capture request, durable status, trusted Git worker and PR review; no client-side repository secrets.
- **R13 Safety/operations:** Preflight/dry-run, scoped access, audit trail, resumable deploy, verification after save/restart, rollback plan and independent DB/asset backups.
- **R14 No churn:** Repeated capture/build/deploy with no authored changes creates no diffs, no new UUIDs, and no regenerated tracked binaries.

### Exclusions / explicit limitations for v1

- Do not reverse-engineer a Blender file, CAD construction history, or generator prompt from a `.glb` embedded in `.hyp`. A `.hyp` may be losslessly **unpacked**, but this does not restore authoring history.
- Do not capture chat, player accounts, permissions, avatars, seating preferences, ephemeral `app.state`, network ownership, animation frames, transient physics, browser capture contents, or scripting runtime internal nodes.
- Do not automatically rewrite arbitrary JavaScript string literals containing URLs or asset hashes; use declared dependencies/blueprint props. Warn on untracked dynamic dependencies.
- Do not require app-level per-instance `props`: current props are blueprint-wide. Separate object definitions or a later explicitly designed engine extension are needed for differing per-instance configurations.
- Do not promise byte-for-byte deterministic *native `.hyp`* across engine changes unless output canonicalization is fully controlled and tested. Deterministic outputs for a given compiler version and unchanged input **are required**.
- Do not silently publish live-world changes to the protected default branch. Capture creates a proposal; merge remains reviewed.
- Do not treat Git history as operational disaster recovery for user data, full databases or S3/local asset stores.

## 3. New `hyperfy-world` repository layout

```text
hyperfy-world/
  README.md
  package.json                         # Node >=22 ESM; CLI and tests
  package-lock.json
  .gitignore
  .gitattributes                       # Git LFS for large GLB/texture/binary sources as needed
  worldsync.config.json                # logical repo ID, profile targets, policies; NO credentials
  schemas/
    object.schema.json
    scene.schema.json
    profile.schema.json
    bundle.schema.json
    snapshot.schema.json
  objects/
    cabin/main/
      object.json                       # canonical blueprint and local file references
      script.js                         # readable, authoritative procedural implementation
      model.glb                         # optional; 'script-only' supported
      textures/wood.webp
    furniture/chair/
      object.json
      model.glb
    portals/roof-up/
      object.json
      script.js
    portals/roof-down/
      object.json
      script.js
    antiques/clock/
      object.json                       # declares mode 'hyp'
      original.hyp                      # ONLY source available; tracked verbatim
    environment/terrain/
      object.json                       # blueprint.scene true, for $scene
      model.glb
  scenes/
    camp/
      scene.json                        # canonical combined arrangement; NOT native scene.hyp
      settings.json                     # reviewed portable settings and optional spawn
    test-room/
      scene.json
      settings.json
  dist/                                 # GENERATED AND GITIGNORED
    objects/cabin/main.hyp              # only if explicitly requested
    objects/antiques/clock.hyp
    camp.hworld                          # portable world bundle
  src/
    cli.mjs
    config.mjs
    object-source.mjs                    # mode 'files' | mode 'hyp'
    hyp-format.mjs                       # HYP unpack/pack compatibility utilities
    asset-resolver.mjs                   # file: -> SHA asset:// resolution
    canonicalize.mjs
    compiler.mjs                         # normalized compiled blueprint + asset map
    bundle.mjs
    api-client.mjs
    snapshot.mjs
    identity.mjs
    planner.mjs
    deployer.mjs
    capture.mjs
    source-reconciler.mjs                # recover live edits into editable sources
    merge.mjs
    git-adapter.mjs
    worker.mjs                            # runs out of process with Git permissions
  tests/
    fixtures/
      loose-script-app/
      loose-model-app/
      nested-props/
      legacy.hyp
      sample-scene/
    unit/
    integration/
    e2e/
  docs/
    AUTHORING.md
    SCHEMAS.md
    DEPLOYMENT.md
    CAPTURE.md
    OPERATIONS.md
    SECURITY.md
```

**Do not maintain a separate hand-edited object index unless it is necessary.** Discover `objects/**/object.json` by walking the repository in sorted order; each file declares its immutable `key`. Validate unique keys and paths. A registry can be generated for bundle output. Avoid redundant indices that could become inconsistent.

`.gitignore` must include `dist/`, deploy caches, secret profiles, temporary worktrees, backups and generated artifacts, but **not** `objects/**/*.hyp` wholesale: legacy source `.hyp` is intentionally versioned.

Example `worldsync.config.json`:

```json
{
  "schemaVersion": 1,
  "repoId": "laurentian-camp",
  "defaultScene": "camp",
  "profiles": {
    "development": { "agentApiUrl": "http://localhost:3334/api/agent", "scene": "camp" },
    "production": { "agentApiUrl": "https://example.invalid/api/agent", "scene": "camp" }
  },
  "capture": {
    "unmanaged": "review",
    "includeSettings": true,
    "includeEnvironment": true,
    "excludeRuntimeState": true
  }
}
```

`example.invalid` is a placeholder, not a real deployment URL. Tokens are read from appropriately scoped environment variables or a secret manager; never embed or log them.

### 3.1 Canonical loose-source object format

`objects/cabin/main/object.json`:

```json
{
  "schemaVersion": 1,
  "key": "cabin/main",
  "mode": "files",
  "blueprint": {
    "name": "Main log cabin",
    "desc": "Two-story cabin",
    "model": "file:./model.glb",
    "script": "file:./script.js",
    "props": {
      "woodTexture": {
        "type": "texture",
        "url": "file:./textures/wood.webp"
      },
      "portalTarget": "roof-entrance"
    },
    "preload": false,
    "public": false,
    "locked": false,
    "unique": false,
    "disabled": false
  },
  "extraAssets": []
}
```

**Precise semantics:**

- The manifest is an *authored blueprint*, not a copy of a runtime blueprint. `id`, `version`, `scene` (except the explicitly typed environment object), author timestamps, server URLs and runtime-only fields do not belong here. The compiler provides engine defaults and runtime IDs on deployment.
- `mode: "files"` is the canonical editable representation. Use ordinary files; `.js` is the **source script**, not an extracted generated bundle by default. `model` may be `"script-only"`, which is the existing Hyperfy convention.
- `file:./...` is a **declarative local asset reference** recognized **only in asset-valued fields**: `blueprint.model`, `blueprint.script`, `blueprint.image.url`, explicitly typed asset `url` properties within `blueprint.props`, and explicit `extraAssets`. The file scheme is a compiler convention, **never emitted to the runtime**. Regular external `https://` URLs remain external and must be tagged as nonportable if required for offline behavior.
- Add a conservative recursive scanner for `props`: resolve nested `url` references only where an object is a validated asset descriptor or explicitly covered by schema. Do not replace ordinary strings that happen to look like file paths. Support arrays. Record path and type for every resolved dependency.
- `extraAssets` is an array of local file descriptors for assets referenced dynamically from scripts (or metadata) but not otherwise discoverable. Each entry specifies a file and asset type; verify and include it. Dynamic JS references to hashed URLs should normally be passed through `props` instead of string substitution.
- Validate every path is relative to that object's root (or allow only an explicit shared asset root); reject `../` traversal, symlinks escaping the repository, absolute paths, `file://` host URLs and duplicate case-conflicting paths. Reject missing/empty/oversized files and unsupported extension/type combinations.
- Preserve all compatible native blueprint metadata, including `image`, `author`, `url`, `preload`, `locked`, `public`, `unique`, `frozen`, `disabled`; define defaults explicitly. Do not drop unknown recognized engine fields silently: preserve in `extensions` with schema versioning or fail with an actionable compatibility error.
- Distinguish `disabled` and `frozen` from native `exportApp()` behavior: the existing exporter may mutate these for drag-and-drop convenience. The source and live deployer must preserve **true authored state**. Native export can apply compatibility normalization only when documented and recoverable.
- An object can have a `scene` role only if explicitly declared `role: "environment"`; no ordinary instance can reference an environment object. Its compiled native blueprint is marked `scene: true` and deployed to `$scene` using a privileged endpoint.

### 3.2 Legacy `.hyp` object format

`objects/antiques/clock/object.json`:

```json
{
  "schemaVersion": 1,
  "key": "antiques/clock",
  "mode": "hyp",
  "source": "./original.hyp"
}
```

- `original.hyp` is **the authoritative source**, tracked in Git exactly as supplied. Do **not** rebuild it simply because another object or placement changed.
- Use `importApp`-compatible parsing to read the blueprint and embedded assets; validate structural bounds, dependency completeness, mime/types and hash-addressed filenames. Its original IDs/versions must be treated as import metadata, **not runtime identities** for the target world.
- Compiler normalizes the *in-memory* blueprint and reuses embedded byte payloads; deployment does not need to produce another `.hyp`.
- `worldsync export-hyp --object antiques/clock` may copy the original `.hyp` unchanged when appropriate, otherwise repackage with controlled metadata normalization. Explicitly state in command output when repacking changed bytes.
- `worldsync import path/to/app.hyp --key antiques/clock` creates this legacy form by default; this is the fastest non-destructive path for an unknown app. `--extract` performs the explicit source promotion described below.
- Objects must have exactly one active authoritative mode. Never allow a stale `original.hyp` to override an edited loose blueprint, or vice versa. Optional preservation of a `provenance/original.hyp` file in files mode is archival only and is excluded from builds.

### 3.3 Native `.hyp` → editable source promotion

Provide `worldsync import old.hyp --key category/name --extract` and `worldsync unpack --object category/name`:

1. Read and validate the HYP header and payloads without executing contained scripts.
2. Copy script bytes to `script.js` (if present), model bytes to extension-preserving `model.glb`/`model.vrm`/`.spz`, and other referenced assets to deterministic, readable `assets/` or `textures/` paths. Preserve bytes; no lossy model conversion.
3. Write `object.json` with `mode: "files"`; replace embedded `asset://hash.ext` references in known blueprint asset fields with relative `file:./...` mappings. Preserve all blueprint metadata and nested typed asset descriptors.
4. If multiple embedded assets share identical bytes, deduplicate in the extracted object tree when references can remain unambiguous; otherwise preserve original filenames with stable collision handling.
5. Write a `provenance.json` (optional) with source HYP SHA-256 and import tool/compiler version. Keep `original.hyp` only when `--keep-original` is supplied; if kept it is archival, not an alternative source. Never silently destroy an existing original during a destructive promotion.
6. Compile the extracted source; verify **semantic parity** with original HYP: blueprint fields (after explicit runtime metadata normalization), model/script payload hashes, all resolvable asset references and types. Report byte-level HYP differences separately, because header ordering/normalization can change packaging bytes.
7. Fail with diagnostics for unsupported layout fields, missing payload, unknown asset descriptor, duplicate conflicting embedded asset URLs or unresolved dependency. Do not claim a fully editable result that silently drops content.

A binary GLB extracted this way is editable with 3D tools but **does not become a Blender project or editable procedural source**. A compiled JS file is text-editable, but might be minified/obfuscated. The importer must distinguish extraction fidelity from authoring quality.

### 3.4 Scene: reusable objects placed independently

`scenes/camp/scene.json`:

```json
{
  "schemaVersion": 1,
  "sceneKey": "camp",
  "title": "Laurentian Camp",
  "environment": "environment/terrain",
  "settingsFile": "settings.json",
  "instances": [
    {
      "key": "buildings/main-cabin",
      "object": "cabin/main",
      "position": [12, 0, 8],
      "quaternion": [0, 0, 0, 1],
      "scale": [1, 1, 1],
      "pinned": true
    },
    {
      "key": "furniture/dining-chair-01",
      "object": "furniture/chair",
      "position": [13, 0.1, 9],
      "quaternion": [0, 0, 0, 1],
      "scale": [1, 1, 1],
      "pinned": false
    }
  ]
}
```

- `sceneKey`, object keys and instance keys must be unique, stable, case-sensitive, and validated (e.g., lowercase alphanumeric path segments separated by `/`, no `.`/`..` or empty segments).
- Each instance is one **persistent** Hyperfy app entity; instances sharing an object key intentionally share the same blueprint. Only the environment object maps to `$scene`; it is not included as an ordinary instance.
- Position values are finite meters, quaternion `[x,y,z,w]` must be unit length within tolerance, scales finite and strictly positive. Preserve precision. Canonicalize equivalent `q` and `-q` to reduce false diffs.
- Sort instances by stable `key`, not by positions or names; use consistent JSON field order and final newline. Only normalize tiny transform noise for comparisons under a documented tolerance, not by rounding scene files destructively.
- Runtime `state`, `mover`, `uploader`, `owner`, `id`, player/session fields and timestamps are excluded.
- **Portal-specific warning:** physical aperture orientation, `portalId`, target IDs/URLs and script-created nodes belong to each portal blueprint/source. Two portals that need different props currently require different object keys (even if they share most script source). Preserve pairs and test traversal.

`scenes/camp/settings.json` captures a reviewed allowlist from `Settings.serialize()`: title, description, selected lighting/geographic/day-night fields, image/avatar asset refs if resolvable, and an explicit spawn `{position,quaternion}`. Exclude volatile time offset/transition, user ranks/permissions and secret data by default. Do not reuse production URL or private metadata without review.

## 4. Compiler, resolution, optional HYP packaging and `.hworld`

### 4.1 Intermediate compiled object (internal API)

The compiler must normalize *both* `mode: files` and `mode: hyp` to an identical logical representation:

```json
{
  "key": "cabin/main",
  "compiledBlueprint": {
    "name": "Main log cabin",
    "model": "asset://<sha256>.glb",
    "script": "asset://<sha256>.js",
    "props": {
      "woodTexture": { "type": "texture", "url": "asset://<sha256>.webp" },
      "portalTarget": "roof-entrance"
    },
    "disabled": false
  },
  "assets": [
    { "url": "asset://<sha256>.glb", "source": "objects/cabin/main/model.glb", "type": "model" },
    { "url": "asset://<sha256>.js", "source": "objects/cabin/main/script.js", "type": "script" },
    { "url": "asset://<sha256>.webp", "source": "objects/cabin/main/textures/wood.webp", "type": "texture" }
  ]
}
```

The `<sha256>` markers are schematic, not literal runtime values. Runtime `id`/`version` are assigned by managed deployment, **not** by the source compiler. The intermediate representation is an in-memory structure or documented generated manifest; do not commit it as source.

**Required compile steps**:

1. Validate every object schema and referenced scene before any mutation.
2. Parse loose authored blueprints or legacy HYP. Normalize defaults and preserve supported fields/flags.
3. Hash *exact bytes* of every local dependency with SHA-256, preserving the extension used by the existing backend. Map duplicate identical `(digest, extension)` payloads to one asset upload. Do not assume identical bytes with different extensions share one runtime URL.
4. Resolve local refs **at schema-recognized paths only**; verify pre-existing `asset://` references are either included in `extraAssets`, embedded in HYP, supplied in an explicit vendored assets map, or deliberately declared to require a remote asset. Fail portable build if unresolved.
5. Compute an object **semantic fingerprint** from canonical compiled blueprint fields and asset hashes (not raw `.hyp` container bytes, runtime IDs, or source file paths). Separately retain an authored-source fingerprint for Git change tracking.
6. Compile scenes by resolving object keys to compiled definitions; verify no missing object, duplicate placement, invalid quaternion or illegal environment role.
7. For `deploy`, directly upload missing asset bytes, then create/update blueprints and instances. For `export-hyp`, call a compatible packer to embed dependencies. For `build`, construct the `.hworld` bundle.

Compile **must never execute app scripts on the host**. Static checks are not a proof of sandbox safety; execution belongs to Hyperfy's normal runtime security model.

### 4.2 Optional native HYP output

Use `worldsync export-hyp --object cabin/main --output dist/objects/cabin/main.hyp` or `worldsync build --scene camp --include-hyp` to generate per-object native packages.

- Reuse/align with `src/core/extras/appTools.js` `exportApp` and `importApp` header semantics. If importing shared engine helpers directly is impractical because of ESM/bundler coupling, implement a **test-proven byte-compatible standalone packer** and keep fixtures generated by the engine.
- The .hyp must contain the compiled blueprint with `asset://` URLs and the corresponding embedded assets, including nested recognized `props` references and declared extra dependencies.
- Preserve source flags and avoid `exportApp`'s legacy side effects (e.g. changing `disabled` or setting `frozen` from `locked`) unless deliberately exposed as a *drag-and-drop compatibility option* and clearly reported. Deploy and source remain faithful.
- Do not emit the source-only `file:` scheme or logical Git keys inside the native HYP blueprint unless extension-compatible and supported.
- Imported legacy HYP source may be exported byte-for-byte when requested; if repackaged, state that its byte hash changed and verify semantic equivalence.
- Determinism: same source, compiler version, options and dependency bytes yields the same generated `.hyp` bytes; ensure stable header property order, asset ordering, encoding and payload order.
- Ordinary HYP is an app package. It does **not** include scene placement IDs or all furniture; do not represent the complete cabin as an ordinary `.hyp`.

### 4.3 Portable combined scene bundle

Build `dist/camp.hworld` as a deterministic ZIP with an explicit schema:

```text
camp.hworld
  bundle.json                         # format, schema versions, hashes, compatibility
  scene.json                          # combined layout
  settings.json
  objects/index.json                  # logical key -> compiled blueprint + asset references
  objects/cabin/main/blueprint.json
  objects/furniture/chair/blueprint.json
  objects/environment/terrain/blueprint.json
  assets/<sha256>.js
  assets/<sha256>.glb
  assets/<sha256>.webp
  [optional] packages/cabin/main.hyp # only if --include-hyp
```

- The bundle contains compiled **definitions + asset bytes**, not necessarily editable loose scripts under their original authored paths. The Git repository remains canonical. The portable bundle must be deployable with no external object source checkout.
- Include each unique asset once. `bundle.json` lists SHA-256 for every payload, logical references, schema/tool/compiler versions, target-engine compatibility and entry sizes. Optionally include source-origin provenance, without private runtime identifiers.
- Canonical ZIP order, fixed timestamps, stable compression parameters. Reject ZIP-slip, symlinks, duplicate entries, overlong filenames, zip bombs, file-count/size excess and inconsistent CRC/hashes; don't trust HYP headers or ZIP entries just because they were generated previously.
- The bundle format **is not native Hyperfy `.hyp`**. Never rename `.hworld` to `.hyp`. Provide an explicit `worldsync deploy --bundle` path using the same planner as `--scene`.
- `worldsync build` creates `.hworld`; `worldsync export-hyp` creates native HYP separately. Do not require HYP compilation as a prerequisite to either live deploy or portable bundle generation.
- Fresh-source build twice must yield identical SHA-256. Fresh-bundle deploy to an isolated world must preserve shared blueprints, linked instances, transforms, relevant settings and portal behavior.

### 4.4 Asset lifecycle and large binaries

- Store authored GLB/VRM/SPZ/textures in the Git repository or Git LFS; Git LFS is recommended for large or frequently changing binary files. Correctly hydrate LFS objects before compile; reject unresolved pointer text masquerading as actual model data.
- Shared content-addressed assets are uploaded once. Avoid duplicating the same binary under both loose source and tracked generated HYP. The optional legacy `original.hyp` is the only normal exception.
- Source assets can be organized within each object's folder; a shared `assets/shared/` root is optional only if explicitly supported and path-safe. Deduplicate automatically in compiled/runtime storage, not by forcing authors to hand-manage hash filenames.
- Image/model URLs stored in props must be verified; static parsing cannot discover arbitrary script-generated remote URLs. Allow explicit dependency declaration and produce portability warnings/errors.
- Protect managed assets and blueprints from startup garbage collection even when temporarily uninstantiated or under deployment/capture. Do not remove an asset if referenced by any managed resource, deployment journal, active transfer, collection or unexpired rollback window.

## 5. Stable IDs, ownership, revisions and baseline state

### 5.1 Separate Git keys from Hyperfy IDs

Use four portable keys in Git:

- `repoId` — owner of managed resources, e.g. `laurentian-camp`.
- `sceneKey` — scene composition, e.g. `camp`.
- `objectKey` — reusable authored definition, e.g. `furniture/chair`.
- `instanceKey` — one placed entity, e.g. `furniture/chair-left-01`.

Runtime IDs remain world-local blueprints/entities. Do not derive identity from mutable name, coordinates, portal ID, or embedded `id` in imported HYP. A player-created duplicate gets a distinct runtime entity, **not** a second claim on the original `instanceKey`.

### 5.2 Proposed persistent tables in Hyperfy

Add **append-only** Knex migrations in `src/server/db.js`, SQLite and PostgreSQL compatible:

```text
world_managed_resources
  repo_id             TEXT NOT NULL
  scene_key           TEXT NOT NULL
  kind                TEXT NOT NULL   # blueprint | entity | environment
  logical_key         TEXT NOT NULL
  runtime_id          TEXT NOT NULL
  last_applied_hash   TEXT NULL
  last_seen_revision  BIGINT NULL
  deleted_at          TIMESTAMP NULL
  PRIMARY KEY (repo_id, scene_key, kind, logical_key)
  UNIQUE (kind, runtime_id)           # or equivalent app-enforced invariant

world_deployments
  repo_id             TEXT NOT NULL
  scene_key           TEXT NOT NULL
  source_commit       TEXT NULL
  manifest_hash       TEXT NOT NULL
  world_revision      BIGINT NULL
  applied_at          TIMESTAMP NOT NULL
  status              TEXT NOT NULL
  PRIMARY KEY (repo_id, scene_key)

world_deploy_operations
  id                  TEXT PRIMARY KEY
  repo_id             TEXT NOT NULL
  scene_key           TEXT NOT NULL
  plan_hash           TEXT NOT NULL
  operation_key       TEXT NOT NULL
  desired_hash        TEXT NOT NULL
  state               TEXT NOT NULL
  result              TEXT NULL
  created_at          TIMESTAMP NOT NULL
  updated_at          TIMESTAMP NOT NULL

world_capture_requests
  id                  TEXT PRIMARY KEY
  repo_id             TEXT NOT NULL
  scene_key           TEXT NOT NULL
  actor_user_id       TEXT NOT NULL
  scope               TEXT NOT NULL
  world_revision      BIGINT NULL
  status              TEXT NOT NULL
  result_url          TEXT NULL
  error_code          TEXT NULL
  requested_at        TIMESTAMP NOT NULL
  lease_expires_at    TIMESTAMP NULL
  expires_at          TIMESTAMP NULL
```

Use real SQL comments in migrations, not the illustrative `#` characters above. Add appropriate indices and foreign-key behavior for the actual database. **No GitHub token or private bearer token columns.** Use transactional mapping changes and operation journal where feasible.

For definitions shared between scenes in one running world: do not accidentally give one blueprint conflicting ownership. Choose and document one of: scene-scoped copied blueprint per scene (simplest v1), or repo-level definition map with strict shared-ownership semantics. **Recommended v1:** scene-scoped logical mappings with a stable runtime blueprint per `(repoId, sceneKey, objectKey)`; multiple instances *inside* that scene share it. Reject importing the same live blueprint as two different managed keys unless explicitly cloning during initial adoption.

### 5.3 Baseline and concurrent changes

Track two different concepts:

- **Deployed baseline**: last Git commit/manifest fingerprint *successfully applied and verified* in the target runtime.
- **Captured proposal**: Git branch/PR created from live modifications. This **does not** mean its changes have been merged or applied in production.

A pending PR must not advance the deployed baseline. Store enough immutable base manifest/compiled-object fingerprints to perform three-way merge even when files have moved or LFS content changed. Do not rely solely on `source_commit` if the object was not yet committed at bootstrap.

Track a monotonically increasing **authored-world revision**, incremented for meaningful server-authoritative changes to persistent app placements/blueprints and approved settings/environment. Player joins, frame ticks, transient physics and ephemeral `app.state` must not increment it. Increment on both builder-websocket and Agent API mutations. A snapshot must represent one coherent revision. Handle pending asynchronous builds/uploads: either wait until stable or mark object noncapturable.

### 5.4 Ownership and lifecycle

- Managed resource removed live: keep a tombstone until deletion has been reviewed and captured/deployed; otherwise disappearance might be mistaken for an object never present.
- Unknown live object: **unmanaged**, left alone by deploy; offered for explicit adoption during capture with a suggested human key.
- An object may have zero placements. Its editable definition must remain versioned; its managed compiled assets must remain retained while referenced by managed definitions.
- A deleted instance must not cause a reused instance key to silently point to another runtime entity. An accidental old mapping to a different runtime object is a conflict.
- Source edit to one object updates its mapped blueprint and intentionally rebuilds its linked instances; plan must report those affected instances. A placement-only edit must *not* repack HYP or change the blueprint.
- Deploy always snapshots/records previous managed state for a recovery plan; mapping/baseline advances only after successful verification and durable save.

## 6. Required Hyperfy engine changes

Keep new private routes under `/api/agent`, using established bearer auth, strict validation, and narrower worker-specific scopes where warranted. Refactor into service modules rather than bloating `agent-api.js`.

| Engine file | Required responsibility |
|---|---|
| `src/server/agent-api.js` | Register scoped read/write endpoints for snapshots, asset transfers, managed resources, deployment plans/apply/verify, settings/spawn/environment updates and capture requests. |
| `src/server/WorldRepository.js` **new** | Encapsulate stable mapping, current/baseline hashes, adoption, tombstones, CRUD, preconditions and DB transactions. |
| `src/server/WorldSnapshot.js` **new** | Return consistent, authoritative snapshot of stable entities, blueprints, settings, spawn, environment and managed map with revision. |
| `src/server/WorldDeploy.js` **new** | Plan/apply lifecycle, concurrency locks, integrity checks, staged assets, audit journal, explicit save and postcondition verification. |
| `src/server/WorldCaptureQueue.js` **new** | Durable authorized capture requests, leasing, status, expiry and trusted worker callbacks. |
| `src/core/systems/ServerNetwork.js` | Revision counter integration for authored edits; flush/save API; sanitize transient state during DB persistence; retry/failure-aware persistence. |
| `src/server/db.js` | Append-only portable schema changes. |
| `src/server/AssetsLocal.js` | Validated, bounded authenticated asset retrieval plus existing deduplicated upload support. |
| `src/server/AssetsS3.js` | Stream asset retrieval via AWS SDK `GetObject`, verify/read sizes; preserve hash naming. |
| `src/server/cleaner.js` | Retain managed/uninstantiated objects, referenced assets and in-flight rollback/capture data. |
| `src/core/systems/ClientBuilder.js` + appropriate UI/network packet files | Admin-authorized **Save scene to Git** action, queue/status/PR display, no client secrets. |
| `src/core/extras/appTools.js` | Extend bounded HYP parser/packer or reusable asset enumeration only as needed; preserve existing native format. |

### 6.1 API contract — proposed, not yet implemented

Existing API supports `GET /world`, `GET /apps`, `GET /apps/:id`, `POST/PATCH /apps`, `GET /entities`, `GET /entities/:id`, `POST/PATCH/DELETE /entities`, and `POST /scripts`. **Add**, rather than assume, the following:

```text
GET    /api/agent/snapshot?repoId=...&scene=...   # atomic/frozen authored snapshot
GET    /api/agent/managed?repoId=...&scene=...
POST   /api/agent/managed/adopt                 # reviewed mapping of existing IDs
GET    /api/agent/assets/:filename             # authenticated stream, exact hashed filename
PUT    /api/agent/assets/:filename             # authenticated bytes, digest validation
GET    /api/agent/apps/:id/hyp                  # optional native export, for tooling/backups
POST   /api/agent/deploy/plan                   # validate desired compiled manifest+base
POST   /api/agent/deploy/apply                  # apply immutable plan ID/hash, optimistic lock
GET    /api/agent/deploy/:id                    # journal, status, verification
PATCH  /api/agent/world-settings               # portable setting allowlist + ifMatch
PUT    /api/agent/spawn                        # validated transform + ifMatch
PUT    /api/agent/environment/scene            # guarded $scene upsert + expected version
POST   /api/agent/save                         # await durable flush; authorized
POST   /api/agent/capture-requests             # privileged in-world or service request
GET    /api/agent/capture-requests/:id         # status, scope, captured revision, PR link
POST   /api/agent/capture-requests/:id/claim    # trusted worker lease
POST   /api/agent/capture-requests/:id/complete # trusted worker completion
```

**Deployment uses `PUT /assets` + compiled blueprints and managed CRUD, not `POST /apps/import-hyp` by default.** Native HYP import/export may be provided for interoperability, but it is not the internal deployment representation. Existing `POST /apps` generates random UUIDs and `PATCH /apps/:id` requires current version; managed apply must maintain stable mapping, version compare-and-swap, and no accidental new IDs.

**Suggested contracts:**

- `snapshot` returns `{worldId, revision, capturedAt, settings, spawn, environment, blueprints, entities, managed}`; entities exclude players and transient internal node graphs; each referenced blueprint is present. Managed/tombstone rows are included. A snapshot represents one authoritative tick/revision, not independently queried asynchronous arrays.
- `assets/:filename` accepts only `^[0-9a-f]{64}\.[a-z0-9]+$`, verifies digest against bytes, handles streaming/backpressure/limits and MIME. Reject symlink/path escape. Do not make general `/api/upload` an alternate unprotected worldsync write path.
- `deploy/plan` consumes compiled **object definitions** (or references to previously uploaded, verified content), desired layout, mapping scope, base revision/hash, target world ID. It returns an immutable plan ID/hash, creates/updates/deletes, warnings and affected linked instances; it performs **no mutations**.
- `deploy/apply` requires plan ID, hash, expected world revision and explicit approval for deletes/reset/scene replacement. It revalidates preconditions immediately before mutation, journals operations and returns durable status. If one operation fails, it never records the full baseline as successful.
- `managed/adopt` requires exact runtime IDs observed in a preceding snapshot with current revision; validates they are not already owned. It cannot grant ownership based on a matching name/location alone.
- Settings/spawn/environment endpoints only apply intentionally included scoped fields. `$scene` cannot be overwritten by a normal entity PATCH or a scene manifest trick.
- `capture-requests` and status endpoints authenticate the actual player's server session/permission for in-world calls (or a narrow service principal for worker); never trust user IDs supplied by browser input.
- Every mutation returns expected revision/version or a machine-readable `409` conflict with current state. Missing assets and unsupported definitions return structured preflight errors, not partial successful responses.

### 6.2 Transaction and atomicity boundaries

Hyperfy live objects have immediate side effects (rendering, scripts, network broadcasts). **Do not claim database-style atomic rollback across an entire scene.** Implement guarded, resumable operations:

1. Validate everything offline and against the server, upload all immutable asset payloads first; no visible scene mutations yet.
2. Acquire scoped deployment lock and compare expected authored-world revision/base fingerprints. Recheck the relevant resources, not only a global timestamp.
3. Upsert definitions, then create/modify instances, then process explicitly approved removals, then settings/spawn/environment if requested; journal each completed operation.
4. Broadcast correctly through existing networking pathways and wait for (or report) asynchronous object rebuild/load errors. Preserve entity IDs when possible.
5. Flush dirty state and verify current server snapshot against the desired compiled manifest; only then advance deployed baseline/mapping hashes. A restart test is part of acceptance.
6. On failure, mark operation partial and present a resume/revert plan using prior snapshots; replay idempotently. Never delete all unrelated world data to simulate rollback.

A global `revision` alone can create overbroad conflicts in active multiplayer worlds; combine it with per-managed-resource fingerprint preconditions and a scoped lock. Do not retry stale destructive operations without re-planning.

## 7. New repository CLI and local developer workflow

Define the `worldsync` command (Node >=22 ESM) through `package.json` scripts/bin. The following are **requirements** for Codex, not existing commands:

```bash
# Offline inspection and authoring
worldsync validate --scene camp
worldsync import ./MyChair.hyp --key furniture/my-chair
worldsync import ./MyChair.hyp --key furniture/my-chair --extract
worldsync unpack --object antiques/clock --keep-original
worldsync export-hyp --object cabin/main --output dist/objects/cabin/main.hyp
worldsync build --scene camp                         # creates dist/camp.hworld
worldsync build --scene camp --include-hyp           # optional per-object packages
worldsync verify --bundle dist/camp.hworld

# Server inventory / initial bootstrap (read-only by default)
worldsync status --world production --scene camp
worldsync capture --world production --scene camp --bootstrap --dry-run
worldsync capture --world production --scene camp --bootstrap --write
worldsync adopt --world production --scene camp --plan adoption.json --apply

# Normal bidirectional operation
worldsync diff --world development --scene camp
worldsync deploy --world development --scene camp --dry-run
worldsync deploy --world development --scene camp --apply --plan-id <id> --confirm <hash>
worldsync capture --world production --scene camp --dry-run
worldsync capture --world production --scene camp --write
worldsync capture --world production --scene camp --propose
worldsync deploy --bundle dist/camp.hworld --world development --dry-run
```

Rules:

- `validate`, `build`, `import`, `unpack`, `export-hyp` are offline; they must not contact a runtime unless explicitly passed a remote source resolution option.
- `capture --dry-run`, `diff`, `status`, `deploy --dry-run` are read-only. `capture --write` modifies *local checkout only*, never silently commits/pushes. `capture --propose` creates an isolated worktree/branch and PR after validations and merges.
- `--apply` and validated plan/confirmation are required for runtime mutations. Never infer production profile from hostname/last used token. The CLI must print exact world ID, scene key, action counts, affected object keys/instances and destructive operations.
- The initial bootstrap may create authored source files and legacy HYP files **only in a staged workspace** until its adoption plan is reviewed. A dirty checkout must not be overwritten without explicit conflict resolution.
- Return distinct nonzero statuses for invalid source, missing dependency, stale plan, concurrent edit, permission error, partial deployment and merge conflict. Emit machine-readable JSON reports via `--json` without exposing secrets.
- Reuse Node `fetch`, `node:crypto`, safe `fs/promises`, `node:test`; use a small bounded tested ZIP implementation. Expose dependency-injected adapters for transport, clock, hash, filesystem and Git so tests do not touch production.

### 7.1 Developer's authoring flow

1. Create or modify `objects/<category>/<name>/object.json`, `script.js`, models, textures. **No manual asset hash management.**
2. Run `worldsync validate --scene camp` and optionally `export-hyp` to test normal drag-and-drop.
3. Run `worldsync diff --world development --scene camp`, then preview and apply the minimal plan.
4. Try the app in Hyperfy, interact with portals/furniture, make changes in the live editor as desired.
5. Run `worldsync capture --world development --scene camp --dry-run`, review which changes can be mapped back losslessly, then `--write` or `--propose`.
6. Commit/review source code and layout JSON. Generated packages are not required Git commit artifacts; CI may publish them for releases.

### 7.2 First bootstrap from the existing cabin world

Because the existing live world has random runtime blueprint/entity UUIDs and no worldsync ownership map:

1. Take a **real operational backup** of its DB and asset store (SQLite-aware backup or PostgreSQL tooling; S3 versioned backup if applicable).
2. Capture one consistent snapshot with all currently placed non-player apps, special `$scene`, selected settings/spawn, and their referenced assets. Inventory shared blueprints, scripts, legacy models, orphan assets, inactive drag/upload and missing dependencies. Do not mutate the world.
3. Assign human-reviewable `objectKey` per unique blueprint and `instanceKey` per persistent app entity, with collision-safe suggestions. Group chairs sharing one blueprint. Do not infer identity from spatial proximity after bootstrap.
4. Prefer `mode: files` **when blueprint data and asset bytes are fully recoverable**: extract authored JS verbatim, models and textures verbatim, write typed local refs and verify compile parity. If fidelity cannot be established or dependencies are ambiguous, use `mode: hyp` as an exact package fallback and flag it for possible later extraction. Never invent missing source.
5. Generate `scenes/camp/scene.json`, settings and environment object; stage the result in a new worktree. Validate/build without changing Git HEAD or production.
6. Present explicit adoption proposal for all managed candidate runtime IDs and any unsupported/excluded content. Record mapping *only after* approval and successful saved Git baseline. Existing unmanaged player additions remain unclaimed.
7. Deploy Git scene to disposable `development` world, verify count/placement, script behavior, portal pairs, collisions, lights and settings. Repeat capture there; except intentional runtime IDs, output must be semantically identical and Git-clean.
8. Begin normal production synchronization **after** staging verification and review, not merely after writing the first manifest.

## 8. Live-world → editable Git source capture (core reverse workflow)

This section is essential: the live runtime knows **compiled blueprints + hashed assets**, whereas Git owns editable source files. The capture implementation must **reconcile representations**, not simply dump a new `.hyp` on every save.

### 8.1 Capture normalization and categories

| Player's live action | Desired Git result |
|---|---|
| Move/rotate/scale existing managed chair | Change **only** that entry's transform in `scenes/camp/scene.json`. Do not rewrite any script, model, source JSON, or `.hyp`. |
| Pin/unpin managed item | Change only `pinned`. |
| Place/duplicate new object using an already managed blueprint | Offer explicit adoption as a **new instance** using existing object key. |
| Import/place new unknown `.hyp` | Offer a new object + instance; by default preserve it as `mode: hyp`, optionally extract to loose source. |
| Delete managed instance | Propose removing its instance entry; retain tombstone until review. Other instances of shared blueprint stay. |
| Change managed blueprint `props` | Edit only the corresponding fields in `object.json` if they can be faithfully mapped. Reuse local `file:` refs rather than replacing them with resolved hashes. |
| Change blueprint JavaScript through builder/updating an imported HYP | Download new script asset; safely update `script.js` **only after three-way content check**. If current source diverged, conflict rather than replace. |
| Replace model or texture of managed object | Download verified bytes, write to correct local source file or a newly named local file, update `object.json` reference, and preserve unrelated source assets. |
| Update a `mode: hyp` blueprint | Replace/propose `original.hyp` using compiled server definition + dependencies, with a binary content conflict if both Git and live differ. |
| Change allowed world settings or spawn | Update `settings.json` only when enabled in capture policy. |
| Change `$scene` environment | Update environment source or legacy HYP using same object-source rules; not via regular instance list. |
| Script creates procedural walls, portal mesh or animated internal nodes | Capture enclosing blueprint/source, **not** generated node graph or transient transforms. |
| Physics moves an object in a transient frame / player moves avatar / sits in seat | Exclude unless a separately defined authored persistence mechanism explicitly saves the relevant state. |

**Important**: `blueprint.props` are blueprint-wide in current Hyperfy. Never create an instance-only change to props that the engine cannot represent. If editing a copied chair created an independent blueprint, capture it as a new object/relinked entity, not as a change to all other chairs.

### 8.2 Track source ↔ compiled provenance

For each managed object, the deployer stores or can reconstruct an immutable per-deployed-baseline **compilation mapping**, for example:

```json
{
  "objectKey": "cabin/main",
  "mode": "files",
  "sourceCommit": "<git-commit>",
  "compiledBlueprintHash": "<sha256>",
  "assetBindings": {
    "blueprint.script": {
      "sourcePath": "objects/cabin/main/script.js",
      "sha256": "<sha256>"
    },
    "blueprint.model": {
      "sourcePath": "objects/cabin/main/model.glb",
      "sha256": "<sha256>"
    },
    "blueprint.props.woodTexture.url": {
      "sourcePath": "objects/cabin/main/textures/wood.webp",
      "sha256": "<sha256>"
    }
  }
}
```

This is schematic, a **generated deployment/capture record**; do not hand-author placeholder hashes. Capture uses it to distinguish `asset://...` (live resolved URL) from the original Git `file:./...` reference. Never automatically convert a local source reference into a hardcoded hash just because a snapshot contains the compiled form.

Provide a normalizer that computes:

- **Compiled semantic comparison** of current Git source vs live blueprint (excluding runtime ID/version).
- **Source ownership map** of each compiled asset/property field back to local files and source JSON paths.
- **Git-source fingerprint** and **last deployed compiled fingerprint** to detect whether the source changed independently since baseline.

If an object has a custom script dynamically creating nodes but using no local asset references, capture preserves the script bytes, not its executed graph. If a source depends on an external asset not embedded in runtime storage, capture cannot magically vendor it; return a nonportable dependency warning.

### 8.3 Fidelity rules for updating authored files

This is the pivotal correctness requirement:

1. **Placement-only changes:** never rewrite object source. In particular, no extraction/repacking of `original.hyp` just because a chair moved.
2. **Blueprint metadata/props changes:** patch only the changed JSON fields. Reconstitute existing local `file:` bindings from the recorded mapping. Keep key order/format stable where practical; do not discard unknown authored fields or extra dependency declarations.
3. **Script replacement:** download exact hashed JS bytes. Compare to the compiled script hash at `B` (baseline), current `G` (Git), and `W` (live). If only live changed, stage new `script.js`. If Git and live changed independently, attempt a normal text three-way merge only when a safe Git common ancestor exists; otherwise report a conflict. **Never overwrite a source file that changed in Git without review.**
4. **Model/image replacement:** download verified bytes and use binary three-way semantics. Keep original file if same content and only path/name differs. If content changed only in live, stage new binary; if both sides changed, report conflict and preserve both versions for manual choice, not destructive overwrite.
5. **Legacy `.hyp` changes:** when the only canonical source is `original.hyp`, re-export the full app as HYP (with complete dependencies) and compare **semantic compiled fingerprints** first. If changed, stage new `.hyp` bytes; apply binary merge rules. Unchanged compiled content must not change tracked HYP even if its export bytes could be normalized differently.
6. **Unknown or structurally changed blueprint:** if source mapping can no longer be reconstructed safely (e.g., new nested unsupported asset descriptor or a script-referenced dynamic asset), generate a conflict/proposed new object or legacy HYP fallback **for review**. Do not degrade a `mode: files` object silently to `mode: hyp` and erase authored code.
7. **New live object:** import as HYP source by default, with explicit choice to extract to loose files. Assign an immutable logical key only after adoption approval; all instances referencing the same live blueprint must share one logical object key.
8. **Optional source-only information:** keep comments, authoring notes, test fixtures, project files (e.g. Blender sources) and other assets not present in runtime untouched. Snapshot export must not infer they were deleted.

Capture must maintain a detailed list of **faithful**, **partial**, and **unrecoverable** changes. If any required dependency is missing, do not produce a falsely complete bundle or PR claiming clean replay. `--allow-incomplete` may generate a diagnostic proposal, but cannot mark a world deployable.

### 8.4 Consistent snapshot, normalization and review algorithm

1. Resolve `repoId`, `sceneKey`, target world profile, last deployed baseline and mapping. Acquire consistent server-authoritative snapshot at one `worldRevision`, including special environment, settings/spawn and resource tombstones.
2. Ensure managed entities are not mid-drag or mid-upload; exclude players and volatile fields. Treat unknown entities separately and do not auto-adopt.
3. For each **distinct** referenced blueprint, normalize its fields and fetch only assets whose content differs from known local/baseline hashes. Verify every fetched byte digest and size.
4. Resolve runtime fields to logical object keys and instance keys via managed mapping. Match each live compiled asset to its original source binding using the baseline compilation record. Use exact hashes rather than filenames/name matching.
5. Derive desired changes to `scene.json`, editable `object.json`, source scripts, models, textures, and HYP-only sources. Do not reserialize unaffected files. Optionally derive changes to `settings.json` and environment object.
6. Compare a fresh revision/snapshot token or confirm a snapshot lease to ensure no necessary resource was modified while reading assets. If stale, report/retry under bounded policy; state captured revision explicitly.
7. Perform three-way merge of `B` = deployed baseline, `G` = current Git branch, `W` = live snapshot normalized to source semantics. Generate machine-readable change/conflict report.
8. Stage candidate changes in an isolated worktree (for PR) or a temporary staging directory (for local `--write`); never clobber unrelated dirty Git files. Validate all source, build bundle, and verify live dependency completeness.
9. `--dry-run`: show diff only. `--write`: apply only approved, conflict-free edits to local checkout. `--propose`: commit to isolated branch, push via secure Git credentials, open/update PR; include snapshot revision, baseline source commit, summary of changed object/script/asset paths and limitations.
10. Mark request as proposed/completed, but **do not advance the deployed baseline on PR creation**. Advance appropriate capture review metadata separately; reconcile accepted Git commits through a normal verified deploy.

The read-only capture API should ideally provide one canonical snapshot plus an immutable asset-set reference/lease to avoid saving a blueprint that changes between a snapshot and binary download. Missing or garbage-collected assets are hard errors.

### 8.5 Three-way merge matrix

For each `instanceKey` and field, each object property, and each source file (or HYP binary), let `B` = last deployed baseline, `G` = current Git, `W` = captured live:

| Relation | Behavior |
|---|---|
| `G == B`, `W != B` | Propose live change. |
| `W == B`, `G != B` | Preserve Git change. |
| `G == W` | No conflict/no redundant diff. |
| Git and live edit **different** fields | Merge both, after schema validation. |
| Both edit same JSON property differently | Conflict; show all three values. |
| Both change same JS script | Git text 3-way merge if clean; otherwise conflict. |
| Both change same model/texture or HYP-only source | Binary conflict; never invent a merged asset. |
| Git deleted instance, live moved it | Conflict. |
| Live deleted managed instance, Git unchanged | Propose deletion, subject to explicit review. |
| New unmanaged object appears | Offer adoption, not automatic inclusion. |
| Live blueprint changed while Git moved only an instance | Merge safely: keep placement and update object source as appropriate. |

Compare quaternion `q` and `-q` as equivalent, and numeric transform noise within documented tolerances. When determining **semantic** blueprint equality, ignore transient runtime ID/version but not authored flags, props or dependency hashes. Surface conflicts with object/instance key, field/path, baseline, Git and live values plus `use-live`, `use-git`, `manual` strategies. Do not fabricate per-edit authorship when the engine has no reliable audit record.

### 8.6 Capture report example

```text
Scene: camp | World: production | Snapshot revision: 8192
Baseline: <last-verified-deployment-commit>

Placements:
  furniture/chair-left-01 position [13,0.1,9] -> [13.4,0.1,9]
  portals/roof-up quaternion [0,0,0,1] -> [0,1,0,0]

Loose source changes:
  objects/lights/fireplace/script.js (JS hash changed, safe update)
  objects/cabin/main/object.json (props.lightIntensity 1.2 -> 1.4)

Legacy HYP changes:
  objects/antiques/clock/original.hyp (compiled blueprint changed)

Unmanaged additions proposed: 1 (awaiting adoption)
Managed deletions proposed: 0
Conflicts: 0
Generated .hyp artifacts changed in Git: 0

Status: review required; no production write performed
```

## 9. Player-initiated **Save scene to Git**

Provide an in-world workflow **and** an administrator's equivalent CLI. A player can modify the environment with Hyperfy's builder, then request a source-aware capture; the browser must never commit directly to GitHub.

### 9.1 UI and permission model

- Add a **Save scene to Git** command/control to the builder/admin UI, visible to authorized users. Prefer an explicit `worldsync:capture` permission/capability; admin-only is acceptable for first secure iteration.
- Show currently managed scene, selected scope (`managed only`; `include unclaimed objects for review`; optionally settings/environment), captured revision policy and confirmation. Selecting unmanaged objects **does not** auto-adopt them.
- Send an authenticated client request using established network packet conventions. Server validates actor from the live socket and actual permissions; never trusts browser-supplied user IDs, token contents or arbitrary repo paths.
- Server writes durable request with unique request ID, actor, scene, scope and intended revision/time. Immediately return queued state; do **not** claim the PR exists yet.
- UI displays `queued → capturing → validating → reviewing → proposed / conflicts / failed`, and a link to PR/report once the trusted worker has completed. A player disconnect does not cancel an accepted request.
- Surface both changed **source paths** and changed **scene placements**, so a player understands that moving a chair doesn't rewrite its `.hyp` or model.

### 9.2 Trusted worker

- Run a separate process with a private checkout/worktree, GitHub App credentials or restricted SSH/`gh` authorization, and narrow world capture access. No Git credentials in engine client bundles, `.hyp` apps, browser JS, public config or world snapshots.
- Queue records live in durable DB. Worker claims via a lease/nonce with idempotency key, expiry, bounded retries, duplicate suppression, crash recovery and concurrency limits. Capture status API verifies worker identity.
- Worker uses a frozen authoritative snapshot, fetches required hashed assets, derives source-aware file changes, performs three-way merge, validates/builds in isolated worktree and creates/updates a dedicated `world-capture/<scene>/<request-id>` branch/PR. Never pushes directly to protected default branch.
- Worker posts a structured outcome with URL only if created, conflict paths, captured revision and an audit-safe summary. Limit accepted URL domains/hosts; don't leak private identities/secrets.
- Partial/unrecoverable source edits must produce an explicit **review-required** conflict, not false success. A commit with a diagnostic report is acceptable if clearly marked nondeployable and it does not overwrite authored files.
- The engine is responsible for authorized requests and status; the worker is responsible for Git actions. Adding a general-purpose Git API to the Hyperfy runtime is a non-goal.

### 9.3 Minimal early vertical slice

Before the in-world worker is ready, `worldsync capture --world production --scene camp --write` on the operator's machine must already capture player edits back to source/scene files. This proves reverse synchronization. **Project completion still requires the in-world action + trusted worker + review flow.**

## 10. Safe deployment and restore modes

### Normal incremental deploy

- **Read source:** compile loose files or unpack legacy HYP into common definitions; never require generated HYP.
- **Preflight:** validate source/assets/scene, target identity/world profile, managed ownership, current world revision and expected base; present planned create/update/remove and impact on linked instances.
- **Upload missing assets:** send exact bytes only when the content-addressed filename is absent, with digest/size verification.
- **Upsert blueprints:** use stable mapping; preserve runtime blueprint UUID; use version preconditions; rebuilding affected apps should be previewed and verified.
- **Upsert instances:** preserve entity UUIDs; modify transforms/pinned in place; if an instance changes object key, handle guarded blueprint relinking with expected current identity.
- **Delete:** require explicit allow-delete (or `--reset-managed`) with preview and confirmation; never prune the whole world because an object is absent from the manifest.
- **Settings/environment:** apply only requested allowlisted fields. `$scene` requires guarded dedicated update and must be imported as a special singleton, not a normal instance.
- **Save/verify:** await durable flush, read snapshot and compare semantic hashes/transforms, then optionally restart disposable world and compare again. Advance baseline only when verified.

### Reset and disaster recovery

- `--reset-managed` restores precisely this repo/scene's managed objects to the declared layout, **not** unrelated player objects, user records, chats or world files. It requires prominent exact-world confirmation.
- A **new empty world** may be deployed solely from the Git source or a portable `.hworld` (subject to explicitly documented external dependencies).
- Operational rollback must include last-known-good managed snapshot/artifact references and ability to reapply; do not pretend all network-visible operations are atomic. Always maintain separate DB and local/S3 backups.
- Captures made from the live world and PRs are *proposed source changes*. They do not themselves alter the production world or automatically overwrite competing authored Git source.

### Failure and concurrency examples

- Asset upload succeeds, blueprint update fails: keep immutable uploaded asset; journal failure, replan/resume safely, do not advance baseline.
- Blueprint modified in builder after preflight: return `409`, show drift; never overwrite without a newer explicit plan.
- Chair currently being dragged: block that instance, never capture its transient mover pose or reset it midway.
- User deletes a managed chair, another user places a new identical one: tombstone + unmanaged candidate; do not guess it's the same chair by position/model.
- Save-to-Git worker crashes: lease expires, next worker resumes idempotently, no duplicate PR/branch.
- Source `.js` changed in Git and player uploaded a different script: conflict, preserve both versions, require manual merge/choice.
- Imported HYP contains a new model referenced by hashed URL but payload is absent: fail portability validation before source registration or runtime mutation.

## 11. Hyperfy-specific implementation traps

1. **HYP native format:** The existing engine `exportApp` enumerates `model`, `script`, `image`, and top-level `props[key]?.url`. This may miss nested props and arbitrary script dependencies. Extend enumeration conservatively and verify parity. Retain existing HYP parser compatibility.
2. **No source in a runtime snapshot:** The engine stores compiled scripts/models/assets, not Git paths, so source ↔ compiled provenance is essential for **lossless** reverse updates. Never write runtime SHA URLs into authored `file:` refs during simple capture.
3. **Script-only apps:** `model: "script-only"` must compile/deploy/export correctly without inventing a GLB. The HYP parser treats this sentinel specially.
4. **Special `$scene`:** Scene/environment app is a singleton. It gets its own object definition and mapping, never ordinary placement; `src/world/scene.hyp` seeds only a new DB.
5. **Runtime transforms:** On `App.build`, a non-scene blueprint gets entity position/quaternion/scale; an environment scene is treated differently. Test both explicitly.
6. **Instance state:** `app.state` and script-created nodes can be dynamic; exclude from scene manifest by default. Repair the `ServerNetwork.save` clone/serialize defect; tests must prove state filtering actually happens.
7. **Blueprint sharing:** `Blueprints.modify` rebuilds every referencing instance. Planner must report blast radius and protect against concurrent editing/pinning. No per-instance props without a new engine feature.
8. **Portal IDs and orientation:** Portal target links can be in props or script code, including world URLs; preserve semantics, alignment, preview and XR traversal. The source-first compiler must not rename hardcoded portal IDs.
9. **Protected edit rules:** Agent API forbids normal modifications to scene instances and editing `mover`/`uploader` objects. Managed endpoints must preserve those protections rather than bypassing them unsafely.
10. **Cleaner interactions:** Current cleaner can delete blueprints with zero entities, even though a managed object may be intentionally unplaced; create GC retention rules. Check Set-versus-Array handling for `AssetsS3.delete` if touching that path.
11. **Asset hashes/extensions:** Local and S3 adapters use SHA-derived filenames. Never decide byte equality from readable filenames alone; verify exact content and extension mapping.
12. **Existing upload API:** `/api/upload` is not the authenticated, integrity-checked Agent binary endpoint specified for worldsync. Do not use it for privileged automated mutations without explicit hardening.
13. **Source path safety:** HYP/ZIP content is untrusted data. Never execute imported JS in Node; never allow traversal, symlink escape, arbitrary download URLs/SSRF, or unchecked decompression.
14. **Network state and save cycle:** Builder websocket edits and Agent API writes can race; snapshots must be server-authoritative and coherent. DB rows may lag live scene. `SAVE_INTERVAL=0` must be explicitly handled by deploy flush semantics.
15. **Settings:** `Settings.serialize()` has geographic/day-night values (including `latitude`, `longitude`, `timeZone`, offsets). Capture only reviewed portable settings; real-time offsets are normally excluded.
16. **External content:** A script fetching network resources or rendering WebViews/remote portals is not fully self-contained simply because its HYP is. Declare and report external dependencies in the portability manifest.
17. **Profiles:** Reuse existing `scripts/world-profile.mjs` for isolated staging; ensure explicit `worldId`/URL confirmation prevents accidental production changes.
18. **Binary Git UX:** Large GLB and legacy `.hyp` files show binary diffs, but source JSON/script should remain ordinary reviewed text. LFS setup belongs in docs/CI, and unresolved LFS pointers must fail compilation.
19. **Deterministic compiler versions:** Cache fingerprints and bundles must incorporate tool version and normalization rules, so new compiler behavior does not masquerade as a user edit.
20. **Source-specific warnings:** A source JSON file may contain extra meaningful metadata not supported in runtime. Deployment should preserve and ignore only explicitly documented fields, rather than drop them on round trip.

## 12. Test plan and acceptance matrix

Use `node:test` for the new CLI plus adjacent `*.test.mjs` in the engine. Tests of data format, planner, source reconciliation and merge should run entirely offline. Integration/e2e should use a disposable Hyperfy world profile with isolated DB/assets and stub Git provider. Never use production tokens in CI.

| ID | Test and setup | Required outcome |
|---|---|---|
| T01 | Loose JS-only object, `model: script-only` | Correct compiled blueprint, native optional HYP, no fabricated model. |
| T02 | Loose object with GLB + script + texture | Correct SHA assets, local references resolved, correct preserved flags/props. |
| T03 | Nested typed prop asset references and arrays | Dependencies found, included and resolved; unrelated strings untouched. |
| T04 | Extra script-dependent asset declarations | Included in HYP/bundle; undeclared required dependency flagged. |
| T05 | Two objects refer to byte-identical image | Runtime/bundle deduplicates by digest/extension. |
| T06 | Build source twice with no changes | Same `.hworld` and optional HYP output hashes. |
| T07 | Import native legacy HYP without `--extract` | Original tracked HYP is usable unchanged; no source loss. |
| T08 | Extract legacy HYP to loose files | JS/model bytes preserved; source compilation has semantic parity with input. |
| T09 | Extract malformed/incomplete HYP | No partial silent success; actionable error. |
| T10 | Promote legacy HYP with provenance preservation | One authoritative mode; archive never silently overrides edited files. |
| T11 | Model/asset LFS pointer not hydrated | Compiler rejects fake asset bytes. |
| T12 | Asset path traversal, symlink escape, ZIP-slip/oversized entries | Rejected before unsafe filesystem/network operation. |
| T13 | Scene places four chairs sharing one source object | One managed blueprint and four distinct stable persistent entities. |
| T14 | Invalid duplicate keys/quaternion/negative scale/missing object | Validation errors before any world writes. |
| T15 | Clean-room `.hworld` deploy with no original repo | Full independent scene reconstructed with assets/placements. |
| T16 | Deploy same scene twice | No new entities/blueprints, no unintended rebuilds or uploads. |
| T17 | Change only one chair position in Git | Only that entity changes; no source/HYP asset rewrite. |
| T18 | Change one shared chair's `script.js` | All linked instances intentionally receive one updated blueprint. |
| T19 | Existing unmanaged furniture near identical managed chair | Unmanaged furniture not edited, deleted or claimed. |
| T20 | Live builder moves managed chair, then capture | Only `scenes/.../scene.json` changes. |
| T21 | Live builder pins an object, then capture | Only instance `pinned` changes. |
| T22 | Live builder duplicates managed chair | Unmanaged adoption candidate; after approval distinct stable instance key; reused object source. |
| T23 | Live builder imports unknown HYP | Proposed HYP-only new object + instance; optional later extraction. |
| T24 | Live builder deletes managed object | Tombstone retained; capture proposes deletion, no unrelated changes. |
| T25 | Live blueprint prop changes on files-mode object | Source JSON patched, existing local file refs retained. |
| T26 | Live script changes, Git same as baseline | Exact new JS safely staged in original source path, no .hyp churn. |
| T27 | Live script changes and Git script also changes | Clean text merge or explicit conflict; no silent overwriting. |
| T28 | Live model binary changes and Git model also changes | Binary conflict, preserve both alternatives for review. |
| T29 | Live legacy HYP changes | Original HYP proposed only when compiled semantic content changed. |
| T30 | Missing hashed asset during capture | Capture fails/diagnostic incomplete; never claims successful bundle. |
| T31 | Capture unchanged live world twice | Second capture produces no tracked file diff. |
| T32 | Capture runtime player/seat pose/transient physics/state changes only | No authored Git changes. |
| T33 | Live blueprint/source and Git placement change independently | Three-way merge retains both compatible changes. |
| T34 | Live chair move conflicts with Git chair move | Machine-readable three-way conflict; no overwrite. |
| T35 | Builder changes entity during deploy preflight | Apply detects stale precondition and refuses unsafe mutation. |
| T36 | Asset upload succeeds then API fails mid-deploy | Journal remains partial; resume does not duplicate/relink unrelated entities. |
| T37 | Deployed world restarts | Managed IDs, authored transforms, links, special environment and settings survive. |
| T38 | Managed empty/unplaced object with cleaner enabled | Blueprint and required assets remain valid. |
| T39 | Unauthorized player requests Save scene to Git | Denied server-side; no request/PR created. |
| T40 | Authorized player moves chair then saves scene | Durable request + reviewable PR updates scene JSON, not HYP/script. |
| T41 | Worker crash, retry, double delivery | One idempotent request/branch/PR; no duplicated edits. |
| T42 | Capture PR opened but not merged | Deployed baseline unchanged; later three-way merge remains correct. |
| T43 | Scene settings or `$scene` intentionally change | Explicit policy/capture updates corresponding source; regular furniture unaffected. |
| T44 | Portal pair in restored cabin | IDs, orientation, entry/exit traversal, preview/fallback preserved. |
| T45 | Large repeated binary assets / S3 backend | Streaming, bounded memory, correct digest and no unnecessary uploads. |
| T46 | Nonportable external script dependencies | Visible diagnostic, portable build fails if declared essential. |
| T47 | Source-only authoring notes and unused files exist | Capture leaves these untouched. |
| T48 | Existing non-worldsync Hyperfy instance | API compatibility and native HYP drag-and-drop remain functional. |

**Manual scene acceptance:** Compare actual cabin interior/exterior, independently movable furniture, collision/physics, fireplace lights and shadows, two-way roof-stairs portals including 180° orientation constraints, environment/day-night settings, spawn, external WebView/remote portal behavior, desktop interaction and Quest XR where relevant. Verify visually, not only by hash/count.

**Definition of done:** Source-first loose object editing works; unknown HYP source works without extraction; optional standalone `.hyp` output is valid; complete `.hworld` deploys to a clean isolated world; live player changes return to **editable Git source and scene manifest** without unwanted package churn; admin-triggered capture generates a reviewable PR; conflict/permissions/rollback behavior passes tested cases. No pending production deployment is required to declare the implementation complete.

## 13. Ordered development plan for Codex

### Phase A — Offline source model and compiler

- Create separate repository scaffold, npm CLI, schemas, object discovery and fixtures; no network calls.
- Implement both authoritative modes (`files`, `hyp`), bounded HYP parsing, file refs, SHA hashing, typed nested props, `extraAssets`, canonicalization and compiled fingerprints.
- Implement `import`, `--extract`, `unpack`, optional `export-hyp`, deterministic `.hworld` build and verify.
- **Gate:** T01–T12 + T14 pass; fresh source builds without intermediate HYP.

### Phase B — Engine snapshot bridge and bootstrap

- Extend authenticated bounded asset read/write and server snapshot/revision; add managed mapping migrations and preservation rules.
- Implement read-only initial inventory/bootstrap of existing cabin, with lossless loose-source extraction where possible and HYP-only fallback where necessary.
- Build adoption plan and explicit mapping registration; stage Git writes safely.
- **Gate:** T19, T23, T30, T38, T45; actual-world bootstrap export validated before any production adoption.

### Phase C — Idempotent live deployment

- Implement compiled-manifest API planner/apply with optimistic locking, operation journal, stable runtime identities, flush/save and verification.
- Implement CLI `diff`, `deploy`, `verify` and clean-room `.hworld` deploy. Support multi-profile and explicit world/scene confirmation.
- Cover ordinary entities, settings/spawn, and guarded `$scene`; add staging cabin regression tests.
- **Gate:** T13, T15–T18, T35–T38, T43–T44. Deploy same source twice with no churn.

### Phase D — Source-aware live capture and Git reconciliation

- Implement inverse asset/source mapping, exact byte fetching, source file patches, JS text merge, binary/HYP conflicts, tombstones and unmanaged adoption review.
- Implement `capture --dry-run`, `--write`, and `--propose` with safe local worktree/Git operations and semantic compare.
- Demonstrate moving furniture changes only `scene.json`; demonstrate script and props edits update **loose source**, not generated HYP.
- **Gate:** T20–T34, T42, T46–T47. Clean round-trip produces no tracked diff.

### Phase E — In-world Save scene to Git

- Add guarded builder/admin UI and server packet/request validation, durable request queue, statuses and scoped worker claim/completion.
- Build trusted Git worker with isolated worktrees, replay-safe PR creation, capture reports and permission/race handling.
- **Gate:** T39–T42 plus live visual confirmation of PR content following builder edits.

### Phase F — Production hardening and rollout

- Full cabin and portal manual regression, local/S3 + SQLite/PostgreSQL combinations, native HYP compatibility, security review, clean-room restoration drill.
- CI schema/asset validation and build verification; optionally attach generated `.hworld`/`.hyp` releases. Configure Git LFS and safe PR checks.
- Write complete runbooks and backup/rollback procedures; enable production adoption/deploy only after disposable-world parity review.
- **Gate:** T01–T48 and operational checklist, or document any justified supported-platform exceptions with explicit user review.

## 14. Operations, security and documentation deliverables

Codex must author the following docs in the **new repository**:

- `docs/AUTHORING.md` — loose source object creation, typed `file:` refs, `extraAssets`, script-only examples, shared props constraints, legacy HYP import/extract, publishing standalone HYP.
- `docs/SCHEMAS.md` — exact JSON schema with compatibility version and examples, source/bundle fingerprints and canonicalization rules.
- `docs/DEPLOYMENT.md` — profiles, direct asset/blueprint deployment, dry-run/reconcile/reset, plan hashing and apply confirmation, failure/recovery, source/HYP/bundle distinctions.
- `docs/CAPTURE.md` — live capture, provenance, source-safe three-way merge, adoption, tombstones, conflict UX, PR lifecycle and review/merge/deployed-baseline distinction.
- `docs/SECURITY.md` — read/write/worker scopes, upload limits, path/zip validation, secret handling, SSRF prevention, audit events and untrusted script handling.
- `docs/OPERATIONS.md` — initial cabin backup + adoption, staging test, rollback, worker troubleshooting, token rotation, GitHub App/PR setup, CI/LFS setup, DB/S3 backup independence.

**Security constraints:**

- No Git PAT, GitHub App private key, Agent writer token, JWT, cloud credential or SQL connection URI in Git, browser JS, public env, `.hyp` source or logging.
- Authorize the in-world request with server-trusted user identity and capability. Separate Git worker credentials; minimize worker access to capture-specific API scopes.
- Validate and size-bound every HYP/ZIP, binary asset and JSON request. Prevent decompression bombs, path traversal, symlink escapes, hash substitution, URL-based SSRF and arbitrary subprocess command interpolation.
- Reject accidental prod writes based on mismatched world ID/scene key, not only a human-readable URL. Require explicit apply/confirm for destructive changes.
- Never run HYP-contained JavaScript in the CLI, worker, importer or tests outside normal isolated engine execution fixtures.
- Keep capture/audit records private by default and scrub player personal data. Do not disclose real-world coordinates or privately configured server URLs in public capture PRs without review.

**Recovery distinction:** Git replays a desired **managed scene**, not runtime user-state backups. Provide SQLite online backup/consistent PostgreSQL backup and S3/local asset copy/versioning runbooks. Backups should be taken before the initial adoption or engine migrations.

## 15. Codex change review checklist

Before opening implementation PRs, provide brief evidence for these questions:

1. Is authored loose `object.json` + `script.js` + raw models/textures canonical, and is `mode: hyp` the only ordinary case where tracked HYP is canonical?
2. Does **direct deployment avoid intermediate `.hyp` compilation** while optional native HYP export works?
3. Does importing a standalone HYP preserve exact bytes, and can extraction recover all bundled resources without inventing authoring history?
4. Do generated `.hyp` and `.hworld` always live outside tracked source by default?
5. Is `scenes/.../scene.json` the complete layout of independent persistent entities, with `$scene` as a separately handled environment?
6. Does a moved chair modify *only* the layout, and does a live blueprint edit modify the proper loose source file without overwriting unrelated source changes?
7. Can an object be represented and deployed from just one native `.hyp` when no source files exist?
8. Are logical IDs stable and unmixed with target-world UUIDs? Do shared chairs stay linked to one blueprint?
9. Are native imports and scripts free from host execution, arbitrary path reads and unbounded extraction?
10. Does capture use server-authoritative snapshots rather than stale DB rows, and does it exclude transient state?
11. Are three-way text/property merges and binary conflicts handled explicitly rather than with last-writer-wins?
12. Can the admin save in-world to a **reviewable PR** without exposing Git/Agent secrets or modifying the protected default branch?
13. Are plans idempotent/resumable; can a fresh Git clone rebuild/redeploy cleanly and survive restart?
14. Does cleanup retain managed assets/unused blueprints, and does production recovery remain independent from Git source control?
15. Were actual cabin geometry, furniture, portal pairs, lighting and interactive scripts tested in a separate world?

## 16. Primary implementation references

The following are the main inspected source files. Links are pinned to the inspected engine commit; **use the current checkout when implementing**:

- [`src/server/db.js`](https://github.com/jerometremblay/hyperfy/blob/10f53f0c02ae38e54af3f203d9e57850502e00d0/src/server/db.js)
- [`src/core/systems/ServerNetwork.js`](https://github.com/jerometremblay/hyperfy/blob/10f53f0c02ae38e54af3f203d9e57850502e00d0/src/core/systems/ServerNetwork.js)
- [`src/server/agent-api.js`](https://github.com/jerometremblay/hyperfy/blob/10f53f0c02ae38e54af3f203d9e57850502e00d0/src/server/agent-api.js)
- [`src/core/extras/appTools.js`](https://github.com/jerometremblay/hyperfy/blob/10f53f0c02ae38e54af3f203d9e57850502e00d0/src/core/extras/appTools.js)
- [`src/core/systems/ClientBuilder.js`](https://github.com/jerometremblay/hyperfy/blob/10f53f0c02ae38e54af3f203d9e57850502e00d0/src/core/systems/ClientBuilder.js)
- [`src/core/systems/Blueprints.js`](https://github.com/jerometremblay/hyperfy/blob/10f53f0c02ae38e54af3f203d9e57850502e00d0/src/core/systems/Blueprints.js)
- [`src/core/entities/App.js`](https://github.com/jerometremblay/hyperfy/blob/10f53f0c02ae38e54af3f203d9e57850502e00d0/src/core/entities/App.js)
- [`src/core/systems/Apps.js`](https://github.com/jerometremblay/hyperfy/blob/10f53f0c02ae38e54af3f203d9e57850502e00d0/src/core/systems/Apps.js)
- [`src/server/AssetsLocal.js`](https://github.com/jerometremblay/hyperfy/blob/10f53f0c02ae38e54af3f203d9e57850502e00d0/src/server/AssetsLocal.js)
- [`src/server/AssetsS3.js`](https://github.com/jerometremblay/hyperfy/blob/10f53f0c02ae38e54af3f203d9e57850502e00d0/src/server/AssetsS3.js)
- [`src/server/cleaner.js`](https://github.com/jerometremblay/hyperfy/blob/10f53f0c02ae38e54af3f203d9e57850502e00d0/src/server/cleaner.js)
- [`src/server/collections.js`](https://github.com/jerometremblay/hyperfy/blob/10f53f0c02ae38e54af3f203d9e57850502e00d0/src/server/collections.js)
- [`scripts/world-profile.mjs`](https://github.com/jerometremblay/hyperfy/blob/10f53f0c02ae38e54af3f203d9e57850502e00d0/scripts/world-profile.mjs)

---

**Final outcome:** A **separate Git-managed world repository of readable loose sources and assets**, with native `.hyp` accepted when it is the only source, optional independently usable compiled `.hyp` exports, a declarative composed scene and portable `.hworld` bundle, safe Git ↔ Hyperfy synchronization, and a player-triggered **Save scene to Git** review workflow. The existing live `world/` directory remains an operational persistence location, not the Git source of truth.
