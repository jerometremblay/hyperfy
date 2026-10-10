# World

The global `world` variable is always available within the app scripting runtime.

### `.networkId`: String

A unique ID for the current server or client.

### `.isServer`: Boolean

Whether the script is currently executing on the server.

### `.isClient`: Boolean

Whether the script is currently executing on the client.

### `.time`: Number

Read-only shared world timestamp in Unix milliseconds. It follows the server clock,
including the day–night cycle's saved offset and smooth `/time set` transitions.
Available on clients and the server, independent of each player's device clock/timezone.
The value keeps advancing even when the visual cycle is disabled.

```js
const date = new Date(world.time)
console.log(date.toISOString())
```

Read it again to get the current value. Use builder chat commands to change world time.
This differs from `world.getTime()` (network time in seconds) and `world.getTimestamp()`
(real time on the machine running the script), which do not include the cycle's offset.

### `.timeZone`: String

Read-only shared timezone configured in World Settings, default `America/Toronto`.
The server interprets `/time set 13h23` in this timezone for all players.
See the [day–night cycle guide](../../day-night-cycle.md).

### `.add(node)`

Adds a node into world-space, outside of the apps local hierarchy.

### `.remove(node)`

Removes a node from world-space, outside of the apps local hierarchy.

### `.attach(node)`

Adds a node into world-space, maintaining its current world transform.

### `.on(event, callback)`

Subscribes to both engine events (eg when players `enter` or `leave` the world) and custom events emitted by other apps (via `app.emit()`)

### `.off(event, callback)`

Unsubscribes from world events.

### `.raycast(origin: Vector3, direction: Vector3, maxDistance: ?Number, layerMask: ?Number)`

Raycasts the physics scene.
If `maxDistance` is not specified, max distance is infinite.
If `layerMask` is not specified, it will hit anything.

### `.createLayerMask(...groups)`

Creates a bitmask to be used in `world.raycast()`.
Currently the only groups available are `environment` and `player`.

### `.getPlayer(playerId)`: Player

Returns a player. If no `playerId` is provided it returns the local player.

### `.getPlayers()`: [...Player]

Returns an array of all players.

### `.getLocation()`: { latitude: Number, longitude: Number }

Returns the world's configured geographic coordinates in degrees, on both the server
and client. These are the coordinates from World Settings used by the sun and moon cycle.
North is −Z and east is +X in world space.

```js
const { latitude, longitude } = world.getLocation()
console.log(latitude, longitude)
```

Each call returns a fresh snapshot of the current settings. Changing the returned object
does not change the world's location. Call it again to read updated coordinates.

### `.getQueryParam(key)`

Gets a query parameter value from the browsers url

### `.setQueryParam(key, value)`

Sets a query parameter in the browsers url

### `.open(url: string, newTab: ?Boolean)`

Opens a link, defaults to new tab.
