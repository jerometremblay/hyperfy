# .hyp File Format Documentation

The `.hyp` file format is a custom binary format used for Hyperfy Apps that bundles a blueprint configuration with its associated assets.

## File Structure

A `.hyp` file consists of three main sections:

1. Header Size (4 bytes)
   - Uint32 value (little-endian) indicating the size of the header JSON in bytes

2. Header (JSON)
   - Contains two main objects:
     - `blueprint`: The app configuration
     - `assets`: Metadata for all bundled assets

3. Asset Data
   - Raw binary data of all assets concatenated sequentially

## Header Format

The header is a JSON object with the following structure:

```json
{
  "blueprint": {
    "name": "string",
    "model": "string (optional)",
    "script": "string (optional)",
    "props": {
      [key: string]: {
        "type": "string",
        "url": "string"
      }
    },
    "frozen": "boolean"
  },
  "assets": [
    {
      "type": "model | avatar | script",
      "url": "string",
      "size": "number",
      "mime": "string"
    }
  ]
}
```

### Blueprint Properties

- `name`: The name of the app (used for the output filename if not specified)
- `model`: (Optional) URL of the main 3D model file
- `script`: (Optional) URL of the app's script file
- `props`: Object containing additional properties with associated assets
- `frozen`: Boolean flag indicating if the app is locked/frozen

## Primitive-only apps and `extrude`

An extrusion app is still a normal Hyperfy app: the visible geometry belongs in the script as a `prim` with `type: "extrude"`. Do not put the extrusion mesh in the model asset or expose `THREE.ExtrudeGeometry` to the app sandbox.

For the current Hyperfy runtime, a primitive-only blueprint may use the script-only model marker:

```json
{
  "blueprint": {
    "name": "Irregular Extrude",
    "model": "script-only",
    "script": "asset://<sha256>.js",
    "props": {}
  }
}
```

The script asset URL must refer to the exact JavaScript bytes packaged in the payload. The canonical authoring convention is to SHA-256 those bytes and use `asset://<sha256>.js`; recompute the hash after every edit. Every asset URL in `blueprint` must also appear once in `assets` with the correct byte count, and the bytes must be present in the same order after the header.

The bundled `hyperfy-hyp-app-authoring` 2.4.0 tools are stricter than the runtime: its packer and preview expect a model asset. When using those tools, use their minimal geometry-free GLB bootstrap and keep the requested extrusion entirely in the script. The bootstrap must not contain visible geometry. The archive's 2.4.0 preview viewer currently has no `extrude` renderer, so validate an extrusion in the target Hyperfy runtime rather than treating a blank preview as a geometry failure.

If Hyperfy displays a red crash block, check the script and asset errors first. In particular, `[prim] type invalid` means the running client/server build does not contain the `extrude` primitive yet; rebuild that runtime before changing the `.hyp` geometry.

### Asset Types

Assets can be of different types:
- `model`: 3D model files (e.g., .glb)
- `avatar`: VRM avatar files
- `script`: JavaScript files

## File Operations

### Exporting

When creating a .hyp file:
1. The blueprint is cloned
2. All assets are collected from:
   - Main model file
   - Script file
   - Props with URLs
3. Header is created with blueprint and asset metadata
4. Header size is written as first 4 bytes
5. Header JSON is converted to bytes and written
6. All asset files are appended sequentially

### Importing

When reading a .hyp file:
1. First 4 bytes are read to determine header size
2. Header JSON is parsed from the next bytes
3. Remaining bytes are split into individual asset files based on size metadata
4. Returns an object containing:
   - The blueprint configuration
   - Array of asset files with their metadata

## Usage Example

```javascript
// Export a .hyp file
const hypFile = await exportApp(blueprint, resolveFile)

// Import a .hyp file
const { blueprint, assets } = await importApp(hypFile)
```

## Binary Format Specification

```
[Header Size (4 bytes)][Header JSON (variable size)][Asset1 Data][Asset2 Data]...
```

The format uses little-endian encoding for the header size value.
