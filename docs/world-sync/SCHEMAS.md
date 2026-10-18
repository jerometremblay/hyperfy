# World source schemas

The current JSON Schemas are in [`tools/worldsync/schemas`](../../tools/worldsync/schemas). The CLI also performs filesystem, transform, HYP payload and cross-file checks that JSON Schema cannot express.

## Canonicalization and fingerprints

- Object and scene keys are stable, case-sensitive logical keys; they are never Hyperfy runtime UUIDs.
- JSON object keys are emitted in sorted order with a final newline. Scene instances are sorted by logical instance key. Quaternion `q` and `-q` are canonicalized to the same orientation, including positive zero values.
- Authored-source fingerprints include the manifest bytes and exact bytes of declared dependencies. Semantic fingerprints use canonical compiled blueprint values and content-addressed asset digests/types; they exclude source paths and runtime IDs.
- Asset URLs use `asset://<sha256>.<extension>`. Identical bytes with the same extension are deduplicated; assets with different extensions retain separate URLs.
- `.hworld` is a deterministic ZIP with a versioned manifest, compiled definitions, scene/settings, asset payload hashes, engine compatibility and portability metadata. It is not a native `.hyp` file.

## Compatibility behavior

Files-mode blueprints accept the native Hyperfy metadata fields listed in `object.schema.json`; unknown fields fail with an actionable error. The compiler adds explicit engine defaults and preserves authored flags such as `locked`, `frozen` and `disabled`. HYP-mode objects retain their original bytes as source. Promotion to files mode is explicit.

Settings are limited to the allowlist in `settings.schema.json`. `description` is accepted as a source alias and normalized to Hyperfy's `desc`; source schema version metadata is not emitted into compiled runtime settings.
