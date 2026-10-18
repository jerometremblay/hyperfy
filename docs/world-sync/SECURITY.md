# World source tool security

- HYP and ZIP inputs have explicit byte, header, entry, count and expansion limits. Asset digests, HYP type/extension/MIME metadata and bundle payload hashes are checked.
- Import and extraction validate paths before writing, reject traversal and symbolic-link escapes, refuse overwrites, stage promotion writes and retain the old HYP source until the new manifest is installed.
- `.hworld` verification rejects ZIP-slip paths, duplicate entries, symlinks, encryption, unsupported flags/methods, overlapping local entries, oversized payloads, excessive compression ratios and inconsistent local/central headers.
- The CLI never executes scripts contained in loose source or HYP packages. A Hyperfy runtime remains responsible for its own script sandbox.
- External URLs are preserved but are never fetched by the offline compiler. They generate path-only diagnostics and require explicit `--allow-external` for a marked-nonportable bundle.
- Never commit Agent API tokens, Git credentials, database files, player records, local storage or private world settings. Keep generated bundles and HYP exports out of source control.

Live API authentication, upload permissions, server-side snapshots, deployment confirmation, capture and Git worker scopes are not implemented in this phase. Do not use this offline CLI to mutate a running world.
