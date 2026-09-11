# App Design Rules

Status: active

## Core rule

**User actions send intents to the server. Authoritative server updates update every client's world.**

For a shared world, the client is an input surface and renderer. It is not the authority for shared state.

## Scope

These rules apply to anything that changes a world-visible or shared value: object color, position, visibility, doors, inventory, scores, permissions, and similar state.

Purely local concerns may remain client-side when they do not affect another user's world: camera movement, local UI open/closed state, local audio preferences, and visual effects that are explicitly non-shared.

## Standard architecture

```text
client input
    -> app.send(request intent)
    -> server validates and authorizes
    -> server computes the next canonical state
    -> server persists shared state
    -> server app.send(authoritative update)
    -> every client applies the update to its local world
```

When a user joins, the server also provides the current state through the app snapshot (and an optional initialization event). The joining client renders that state before processing later updates.

In this fork, `app.send` is the existing Hyperfy app-messaging transport over the world connection. Do not add an HTTP endpoint just to handle an in-world click unless the action crosses an external service boundary.

## Rules

### 1. Send intent, not a result

User input must send a request describing what the user wants, for example:

```js
app.send('cycleColor')
```

The client must not calculate and send the next shared color, position, score, or permission result. It must not optimistically apply a shared change before the server accepts it.

### 2. The server owns shared state

The server handler treats every client payload as untrusted. It validates the payload, checks permission, calculates the next value, and updates the canonical app state. For example, the server—not each browser—chooses the next snowman color.

If a request is invalid or unauthorized, reject it or send an explicit failure event. Do not allow a client to bypass the rule by sending a value that looks authoritative.

### 3. Persist state on the server

`app.state` is useful runtime state and is included in the state received by new clients, but it is not by itself a restart-persistence contract in this fork.

For durable shared state, use the server-side world storage API (`world.get` and `world.set`), with a key namespaced by the app instance:

```js
const storageKey = `snowman:${app.instanceId}:color`
```

Read the value during server initialization, use a documented default when it is absent, put the value in `app.state`, and persist the new value when it changes. Never use browser `localStorage` for shared world state.

The current JSON storage writes are throttled, so this is durable storage with a small flush window—not a transaction log. If losing the last second of updates is unacceptable, the project needs a transactional/shared persistence layer rather than a private database invented inside one app.

### 4. Broadcast authoritative updates

After accepting a request, the server broadcasts the resulting state or state delta:

```js
app.send('colorChanged', { color })
```

Every client listens for that server event and updates its local world nodes from the payload. A client may update its own rendering in response to the event, but it must not broadcast an update to other clients.

`app.emit` and `world.on` are local event mechanisms; they are not substitutes for a server-to-client update.

### 5. Initialize late joiners from canonical state

The initial app snapshot is the source for a newly connected client. A client should apply the snapshot when `app.state.ready` is available and handle the initialization event if the app uses one. After initialization, all shared changes come from server update events.

Do not initialize from a hard-coded client default and hope a later click corrects it. A user who joins after ten changes must see the current tenth value immediately.

### 6. Let the server serialize competing requests

Two users can click at nearly the same time. Both clients may send `cycleColor`; the server processes those intents in order and computes each next value from the current canonical value. This avoids races caused by two clients both calculating from stale state.

Prefer small request and update payloads. Use request-style names for client intents (`cycleColor`, `openDoor`) and result-style names for server updates (`colorChanged`, `doorOpened`).

### 7. Rehydrate after live rebuilds

The current live blueprint rebuild path clears an entity's runtime app state. A hot-reloaded prototype must therefore re-read durable state, restore `app.state`, and send initialization data again after rebuilding.

Use stable blueprint and entity identifiers for live prototypes. The watcher may update code, but it must not become a second authority for world state.

### 8. Keep permission checks server-side

The client can hide or disable controls for usability, but that is not security. Enforce builder/admin or per-user permissions in the server request handler. The server must not trust a rank, user ID, or capability supplied by the client.

### 9. Know the deployment boundary

The local JSON storage model assumes one authoritative world server. If the project later runs multiple server instances, all instances must share durable state and server-to-server update fan-out, or the world must remain pinned to one authority. Do not scale this design by giving each process its own independent storage file.

## Canonical app shape

This is conceptual pseudocode for a shared color, not a drop-in implementation. The important order is request -> validate/compute -> persist -> broadcast -> render.

```js
const storageKey = `snowman:${app.instanceId}:color`

if (world.isServer) {
  const savedColor = world.get(storageKey)
  app.state.color = savedColor ?? colors[0]
  app.state.ready = true

  app.on('cycleColor', () => {
    const color = nextColor(app.state.color)
    app.state.color = color
    world.set(storageKey, color)
    app.send('colorChanged', { color })
  })

  app.send('init', { color: app.state.color })
}

if (world.isClient) {
  const applyColor = ({ color }) => setColor(color)

  if (app.state.ready) applyColor(app.state)
  app.on('init', applyColor)
  app.on('colorChanged', applyColor)

  body.onPointerDown = () => app.send('cycleColor')
}
```

## Review checklist

Before merging an app change, verify:

- Does each world-affecting user action send a server intent?
- Is the payload validated and authorized on the server?
- Does the server calculate and own the canonical result?
- Is shared state persisted with an app-instance-scoped key?
- Does the server broadcast the accepted result to every client?
- Does a fresh or late-joining client render from the snapshot?
- Does reload, server restart, and live rebuild preserve the intended state?
- Do two browser sessions converge after concurrent actions?
- Are local-only concerns kept local instead of adding unnecessary networking?

## Repository references

- [Hyperfy networking notes](../docs/scripting/Networking.md)
- [App state and lifecycle](../docs/scripting/app/App.md)
- [App access to world storage](../src/core/systems/Apps.js)
- [Server JSON storage](../src/server/Storage.js)
- [Server entity state loading](../src/core/systems/ServerNetwork.js)
- [Live blueprint rebuild behavior](../src/core/systems/Blueprints.js)
- [Snowman prototype](../prototypes/snowman.js)
