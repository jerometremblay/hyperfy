# Light

Create a light with `app.create('light')` and attach it with `app.add(light)`.
Light nodes inherit the position, rotation, parenting, and other properties of
[Node](../Node.md). Positions in the examples are relative to the app, in world units.

Lights render on clients. The examples use `world.isClient` because they only create
visuals. Server-side light nodes can exist, but do not create rendering objects.

## Properties

| Property | Default | Meaning |
| --- | --- | --- |
| `type` | `'point'` | `'point'`, `'spot'`, or `'directional'`. |
| `color` | `'#ffffff'` | Light color as a string, such as a hex color. |
| `intensity` | `1` | Brightness; `0` switches the light off. |
| `distance` | `100` | Point/spot cutoff distance; `0` removes the distance cutoff. |
| `decay` | `2` | Point/spot distance falloff. Keep `2` for inverse-square falloff. |
| `angle` | `Math.PI / 3` | Spotlight cone half-angle in radians. |
| `penumbra` | `0` | Spotlight edge softness, from `0` (hard) to `1` (soft). |
| `castShadow` | `false` | Whether this light casts shadows. |

Directional light intensity is illuminance; point and spot intensity is luminous
intensity. The same numeric intensity will not give the same result across all types.
Use nonnegative intensity/distance values and a spotlight angle between `0` and
`Math.PI / 2`. Start with a small number of lights and tune them in the actual scene.

Point lights radiate in all directions. Spot and directional lights point along
local **−Y**, transformed by the node's rotation and its parents. There is no script
`target` property: rotate the node to aim it. A directional light illuminates the whole
scene; its position does not limit its reach. `distance`, `decay`, `angle`, and
`penumbra` do not affect directional lights.

## Warm lamp with a visible bulb

An emissive bulb looks bright, while a point light illuminates nearby surfaces.
Setting only `emissive` does not light the room. The bulb below does not cast a shadow,
so it cannot block the point light placed inside it.

```js
if (world.isClient) {
  const bulb = app.create('prim')
  bulb.type = 'sphere'
  bulb.size = [0.08]
  bulb.position.set(0, 2, 0)
  bulb.color = '#fff0cf'
  bulb.emissive = '#ffcc88'
  bulb.emissiveIntensity = 2
  bulb.castShadow = false
  app.add(bulb)

  const light = app.create('light')
  light.type = 'point'
  light.color = '#ffcc88'
  light.intensity = 40
  light.distance = 8
  light.decay = 2
  light.position.copy(bulb.position)
  app.add(light)
}
```

Emissive materials can produce bloom when postprocessing and bloom are enabled.
Reduce `emissiveIntensity` if the bulb's glow overwhelms the scene.

## Spotlight with shadows

This spotlight starts above the app's origin and tilts from straight down toward −Z.
The cone's full angle is twice `angle`.

```js
if (world.isClient) {
  const light = app.create('light')
  light.type = 'spot'
  light.color = '#ffffff'
  light.intensity = 100
  light.distance = 12
  light.angle = Math.PI / 6
  light.penumbra = 0.4
  light.castShadow = true
  light.position.set(0, 4, 0)
  light.rotation.x = Math.PI / 6
  app.add(light)
}
```

For shadows to appear, the blocking geometry must cast shadows and the receiving
surface must receive them. Primitives default to both; set `castShadow` and
`receiveShadow` explicitly when needed. Imported mesh nodes expose those flags too.
Additional shadow-casting lights cost more to render. Leave shadows off for small
fill lights and enable them only where the scene needs them.

## Directional fill light

The day–night cycle already supplies sunlight and moonlight. Use an extra directional
light only when the app needs illumination across the scene. It remains on at night
unless the script changes its intensity.

```js
if (world.isClient) {
  const light = app.create('light')
  light.type = 'directional'
  light.color = '#c8dcff'
  light.intensity = 0.2
  light.rotation.x = Math.PI / 4
  app.add(light)
}
```

## Changing or removing a light

Use these operations on a light created by your script:

```js
light.intensity = 0           // Switch off without removing the node.
light.color = '#88bbff'       // Change color.
light.intensity = 40          // Switch back on.
light.position.set(1, 2, 0)   // Move relative to its parent.
app.remove(light)            // Remove a direct child of this app.
```

Removing a mounted light removes its renderer light and target. Lights attached to
the app are also cleaned up when the app is destroyed or rebuilt. If you add the node
with `world.add(light)` instead, remove it with `world.remove(light)`.

Property changes are local to that script instance. For a switch shared by all visitors,
use app state and network events as described in [Networking](../../Networking.md),
then apply the resulting state to each client's light.

## Interaction with the day–night cycle

App lights are independent of the [day–night cycle](../../../day-night-cycle.md).
The cycle changes sunlight, moonlight, sky color, and HDR ambient brightness; it does
not change app-light intensity or emissive brightness. A lamp therefore continues
lighting surfaces while the ambient lighting dims at dusk.

`world.getLocation()` reads the configured latitude and longitude. It does not return
sun position, moon phase, or whether it is night. Those values and the cycle's adjusted
date/time are not currently exposed to scripts. Do not use `world.getTime()` or
`world.getTimestamp()` to infer the cycle time after `/time set`.
