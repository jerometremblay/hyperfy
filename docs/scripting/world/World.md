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

### `.capturePhoto(options)`: Promise<{ url, width, height }>

Client-only. Takes a JPEG of the current 3D scene from a world-space camera pose,
then uploads it to the world's normal asset store. The returned `asset://<sha256>.jpg`
URL works with image nodes on every client. Camera forward is local **−Z**.

```js
if (world.isClient) {
  const { url } = await world.capturePhoto({
    position: new Vector3(0, 1.6, 3),
    quaternion: new Quaternion(), // looks toward −Z
    fov: 50,
    width: 512,
    height: 512,
  })
  const image = app.create('image', { src: url, height: 1 })
  app.add(image)
  app.send('photo', { url })
}

// Persist on the server; clients cannot write world storage.
if (world.isServer) {
  app.on('photo', ({ url }) => {
    if (/^asset:\/\/[0-9a-f]{64}\.jpg$/.test(url)) world.set('booth.latest', { url })
  })
}
```

`position` (Vector3) and `quaternion` (Quaternion) are required and copied when called.
Optional settings:

| Option | Default | Limits |
| --- | --- | --- |
| `width`, `height` | 512 | Rounded and clamped to 64–1024 pixels |
| `fov` | 50 | Vertical degrees, clamped to 1–179 |
| `near`, `far` | 0.05, 50 | 0.01–1000 and 0.02–10000; far must exceed near |
| `format` | `'jpeg'` | Only JPEG is supported |
| `quality` | 0.85 | Clamped to 0–1 |
| `hide` | `[]` | Nodes owned by this app; their descendants are hidden during the render |

Captures include loaded avatars (including the local head in first person), meshes,
prims, lights, sky and world-space UI. They exclude browser overlays, nametags,
chat bubbles, action prompts and builder controls. CSS/HTML surfaces are not WebGL
content and cannot be photographed. Photos use ACES tone mapping, world exposure and
sRGB output; viewport bloom, ambient occlusion and antialiasing effects are omitted.
Remote portal views use their most recently rendered textures.

At most one photo is rendered per graphics frame, with up to eight pending calls per
client. Encoding and uploads are asynchronous. Invalid options, rendering errors,
failed uploads and queue overflow reject the promise; handle these with `try/catch`.
Like `world.load`, callbacks are suppressed after the calling app is destroyed.

JPEG uploads are limited to 1 MB and 20 attempts per minute per IP address (including
ordinary JPEG asset uploads). Clients sharing an IP share that allowance. The upload
route has no socket identity; this limit does not require a new authentication protocol.
Reduce dimensions or quality if an encoded photo exceeds the size limit.

Photos are content-addressed assets, not database records. Share URLs through app
state/events as usual. Save retained URLs with server-side `world.set`; the asset
cleaner preserves `asset://` values nested anywhere in `storage.json`. Unsaved photos
may be removed by cleaning. As with other assets, anyone with the URL can view them.


### `.spawnApp(options)`: String

Server-only. Creates an independent, persistent script-only app and returns its entity
ID. Builders can select, move, duplicate and delete it normally. Deleting the caller
does not delete its spawned apps.

```js
if (world.isServer) {
  const id = world.spawnApp({
    name: 'Photo strip',
    script: props.stripScript.url,
    props: {
      photo0: { type: 'image', name: 'photo0.jpg', url: 'asset://PHOTO_HASH.jpg' },
      // photo1 ... photo4 belong in top-level file props too.
      names: ['Alice', 'Bob'],
    },
    position: new Vector3(1, 1, 0),
    quaternion: new Quaternion(),
    state: {}, // optional; defaults to an empty object
  })
}
```

The script must be an `asset://` JavaScript URL already referenced by the caller's
blueprint script or a top-level `props[key].url`. Uploading arbitrary JavaScript does
not grant permission to run it. Configure the strip script as a file prop on the booth
before spawning. The new app runs that script on both server and clients.

`name` is required (1–256 characters, with non-whitespace content). `position` and
`quaternion` are required finite Vector3/Quaternion values in world space and are copied.
Props default to `{}`; props and initial state must be JSON objects, at most 64 KiB each
in UTF-8. Nested values must be plain JSON (no cycles, functions, undefined, or non-finite
numbers). Top-level file props using `asset://` URLs must have a flat filename and a
lowercase alphanumeric extension. Keep photos in top-level image props so the existing
cleaner retains them while the strip exists. Initial state follows normal app lifecycle
rules: new clients receive it, but server restarts reset transient state. Store lasting
content in props or world storage.

Each parent instance may have at most 50 live spawned apps and make at most 10 successful
spawns in a rolling minute. Deleting children frees live capacity, but does not reset the
rate limit. Rebuilding the caller's script does not reset the rate limit either; restarting
the server does. Validation and limit failures throw before adding any records.

### `.removeApp(id)`

Server-only. Removes an app spawned by this caller instance, broadcasts its deletion,
and marks it for database removal. Throws for missing IDs, the caller itself, or apps
owned by another instance. The existing cleaner removes the orphaned blueprint and
unreferenced assets on its next enabled run. Builders retain their normal deletion
permissions for all spawned apps.
