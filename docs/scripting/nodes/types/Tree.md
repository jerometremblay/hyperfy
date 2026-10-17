# Tree

Creates a procedural tree with [EZ-Tree](https://github.com/dgreenheck/ez-tree). A tree renders its branches and leaves as meshes and supports EZ-Tree's built-in presets, options, and leaf wind animation.

The **Tree** item in the Add palette has a preset picker, an optional numeric seed, a button to randomize the seed, and an Advanced Mode JSON editor. A manual seed makes the shape repeatable; randomizing it generates a different shape. Leave the seed blank to use the preset's seed, or the seed in Advanced JSON when Advanced Mode is enabled. Advanced options are merged over the chosen preset, so only include the values you want to override. The editor accepts every EZ-Tree `TreeOptions` property.

```javascript
const tree = app.create('tree', {
  preset: 'Oak Small',
  seed: 123,
  options: {
    bark: { textured: false, tint: 0x76543a },
    leaves: { tint: 0x91b65a },
    branch: { levels: 2 },
  },
})
app.add(tree)
```

The app origin is the tree's ground position. EZ-Tree output is scaled to fit Hyperfy's meter-scale worlds; position and adjust its size with the regular node properties.

Tree geometry is visual-only. Add a separate collider if players need to collide with the trunk.

## Properties

### `.preset`: String

EZ-Tree preset name. Defaults to `'Oak Small'`.

Available presets are `Ash Small`, `Ash Medium`, `Ash Large`, `Aspen Small`, `Aspen Medium`, `Aspen Large`, `Bush 1`, `Bush 2`, `Bush 3`, `Oak Small`, `Oak Medium`, `Oak Large`, `Pine Small`, `Pine Medium`, `Pine Large`, and `Trellis`.

### `.seed`: Number | null

Optional deterministic seed. `null` uses the seed in the selected preset. Defaults to `null`.

In the palette app, the Seed field overrides any seed in Advanced JSON when it is non-empty. The Randomize Seed button writes a new unsigned 32-bit integer into the Seed field.

### `.options`: Object

Partial EZ-Tree options merged over the selected preset. Top-level properties are `seed`, `type`, `bark`, `branch`, `leaves`, and `trellis`. See the [EZ-Tree parameter reference](https://github.com/dgreenheck/ez-tree#tree-parameters) for the full schema. The palette's Advanced Mode accepts this same object as JSON.

For example, the palette editor accepts:

```json
{
  "seed": 123,
  "bark": { "type": "birch", "textured": false },
  "branch": {
    "levels": 2,
    "length": { "0": 18, "1": 7 }
  },
  "leaves": { "type": "aspen", "billboard": "single", "count": 20 },
  "trellis": { "enabled": false }
}
```

If you change a nested value after creation, call `.generate()` to rebuild the meshes:

```javascript
tree.options.branch.levels = 3
tree.generate()
```

### `.castShadow`: Boolean

Whether the tree meshes cast shadows. Defaults to `true`.

### `.receiveShadow`: Boolean

Whether the tree meshes receive shadows. Defaults to `true`.

## Methods

### `.generate()`

Rebuilds the tree from its current preset, seed, and options. Call this after changing nested `.options` values.
