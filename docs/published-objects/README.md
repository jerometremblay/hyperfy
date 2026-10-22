# Published objects

Builders can import one public HTTPS `.hyp` URL from **Add → Import from URL**, or associate an existing instance through **Published Source** in either inspector. Linking and unlinking change only instance metadata. An association starts **Unverified**; checking alone never verifies the installed implementation. **Install from source** explicitly replaces it after confirmation.

The server checks sources on startup and periodically. **Check now** refreshes availability; installation is always manual. An update keeps the entity ID, transform, pinning and compatible property overrides. Untouched properties adopt new defaults. Removed or incompatible properties are reported. Editing scripts/models/execution flags requires confirmation before an update overwrites them.

One standard builder **Undo** restores the previous implementation, effective properties, captured state and all source metadata. Permission and conflict failures retain the Undo action. Undo lasts for the current builder session and cannot reverse external script side effects. Runtime state is reset for installation; there is no generic state migration.

## Server settings and limits

- `PUBLISHED_CHECK_INTERVAL_MS`: defaults to six hours, minimum one minute; checks include jitter and failure backoff.
- Source download size: `PUBLIC_MAX_UPLOAD_SIZE` in MiB, capped at 64 MiB (32 MiB when upload size is unlimited).
- Three concurrent downloads, four redirects, 20 seconds total including DNS/redirects, ten seconds connection inactivity. Hosts must support uncompressed responses requested with `Accept-Encoding: identity`.
- The body cache holds at most 16 sources/64 MiB (or one maximum-sized package), with transient concurrency overhead. Bounded lightweight history avoids repeatedly checking URLs whose bodies were evicted.
- Manual checks share a ten-second per-URL minimum interval and a six-per-minute builder limit. Pending preparations expire after two minutes; Undo history is bounded to 50 operations per connected builder session.
- DNS answers are checked and pinned into the TLS connection. IP literals, credentials, custom ports, private/reserved addresses and unsafe redirects are refused. Packages must be self-contained, single-app files with consistent asset hashes, paths, types and lengths.

All published-object HTTP operations require an authenticated, connected builder. The server creates provenance from validated bytes and commits the blueprint plus entity JSON in one database transaction before acknowledging or broadcasting. Ordinary entity messages cannot mint source/hash metadata. Asset URLs follow the existing world asset transport; remote source CORS never affects the browser.

Other clients receive the blueprint before the entity switch. Loading failure on the initiating client or server prevents installation and creates no Undo action. A later observer-specific load failure is reported on that client; it cannot retroactively cancel an already committed installation. If a connection is lost during acknowledgement, the same operation token can retrieve its result while the builder session remains connected. Reconnecting loses the session Undo history.

Exported `.hyp` files remain standalone blueprint packages; instance source metadata is not exported. GitHub repository resolution, push/watch workflows, automatic installation and persistent version browsing are deferred.

## Verification

```sh
node --test src/server/published-objects.test.mjs src/server/published-objects.runtime.test.mjs src/core/extras/appTools.test.mjs
npm run build
```

The runtime tests use actual app/script/blueprint/entity systems, authenticated HTTP operations, SQLite, another client, and the standard builder Undo handler. Remote package bytes are mocked; outbound transport guards are separately tested without public network dependencies.
