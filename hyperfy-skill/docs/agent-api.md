# Agent REST API

Each running Hyperfy world exposes its own API at `/api/agent` on its existing HTTP server. This controls the live world; it does not start or stop server processes. No extra server or MCP package is required.

Set one or both server environment variables and restart the world:

```dotenv
AGENT_API_READ_TOKEN=use-a-long-random-read-token
AGENT_API_WRITE_TOKEN=use-a-different-long-random-write-token
```

With neither set, the routes do not exist. A read token allows GET requests. A write token allows all operations, including uploading executable app scripts. Keep tokens private, do not use a `PUBLIC_` prefix, and use HTTPS for remote access. Use separate tokens per instance. No token has been generated or enabled by this change.

| Method | Path under `/api/agent` | Operation |
| --- | --- | --- |
| GET | `/world` | Settings and counts |
| GET | `/snapshot` | One consistent world snapshot and revision (write token required); includes seat-pose storage keys by default, or omit them with `?excludeSeatPoses=true` |
| GET | `/apps` | All app blueprints |
| GET | `/apps/:id` | Blueprint, properties and script asset URL |
| POST | `/apps` | Create a blueprint; requires `name`, `model` |
| PATCH | `/apps/:id` | Edit shared blueprint; requires current `version` |
| GET | `/entities` | App instances (excludes players) |
| GET | `/entities/:id` | Inspect an app instance |
| POST | `/entities` | Instantiate an existing `blueprint` |
| PATCH | `/entities/:id` | Set position, quaternion, scale or pinned |
| DELETE | `/entities/:id` | Remove an app instance |
| GET | `/profiling` | Separate server and per-admin-client profiler samples with units and freshness (write token required); optional `?entityId=...` |
| POST | `/profiling` | Enable/disable server script profiling; body `{ "enabled": true }` (write token required) |
| POST | `/players/:id/profiling` | Request local profiling on/off on a connected admin browser; body `{ "enabled": true }` (write token required) |
| GET | `/players` | List connected players (write token required) |
| POST | `/players/:id/teleport` | Teleport a connected player (write token required) |
| POST | `/scripts` | Upload JavaScript source through existing local/S3 storage |
| GET | `/assets/:filename` | Read one content-addressed or built-in asset, up to 256 MiB |
| GET | `/openapi.json` | Authenticated OpenAPI schema |

Blueprints define apps; entities are placed instances. Creating a blueprint does not place it in the world. Editing a blueprint rebuilds **every instance sharing it**. `props` replaces the entire properties object, so fetch and merge it before updating. Supply the version returned by GET; a stale version returns 409. Successful updates increment the version. Scene blueprints/instances are protected from edits; unique blueprints cannot be instantiated through this API. Instance moves/removals return 409 while a builder is moving or uploading them.

Transforms use world coordinates, a normalized quaternion `[x,y,z,w]`, and positive scale. Omitted creation transforms default to the origin, identity rotation, and unit scale. New app `model` may be `script-only` or an existing hashed `asset://` URL. `script` accepts an existing hashed asset URL or null. Binary model upload continues to use the existing `/api/upload` endpoint; this API adds text script upload only.

Player operations are limited to connected players and require the write token, including `GET /players`. The listing returns only each player's ID, name, and last reported world position. `POST /players/:id/teleport` accepts `position: [x,y,z]` and optional `rotationY` in radians, then sends Hyperfy's normal client teleport event. Seated players are rejected. Verify completion by reading `/players` again after the client reports its new position; this does not change the saved spawn point.

Example from a terminal (also usable by a Codex agent with shell access):

```sh
export HYPERFY_URL=http://localhost:3000
# Set HYPERFY_TOKEN privately to the configured write token.
curl --fail-with-body "$HYPERFY_URL/api/agent/world" \
  -H "Authorization: Bearer $HYPERFY_TOKEN"

curl --fail-with-body "$HYPERFY_URL/api/agent/scripts" \
  -H "Authorization: Bearer $HYPERFY_TOKEN" -H 'Content-Type: application/json' \
  -d '{"source":"app.on(\"update\", delta => { app.rotation.y += delta })"}'

# Use the script URL returned above:
curl --fail-with-body "$HYPERFY_URL/api/agent/apps" \
  -H "Authorization: Bearer $HYPERFY_TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Spinner","model":"script-only","script":"asset://REPLACE_WITH_RETURNED_HASH.js"}'

# Use the blueprint ID returned above:
curl --fail-with-body "$HYPERFY_URL/api/agent/entities" \
  -H "Authorization: Bearer $HYPERFY_TOKEN" -H 'Content-Type: application/json' \
  -d '{"blueprint":"REPLACE_WITH_BLUEPRINT_ID","position":[0,1,0]}'
```

A script-only app must create its own visible nodes. To rotate a visible model, use its uploaded model asset URL instead.

For a REST-capable ChatGPT integration, download `/api/agent/openapi.json`, change its relative `servers[0].url` to your externally reachable HTTPS URL ending in `/api/agent`, and configure bearer authentication in the client. Providing this API does not automatically give an ordinary chat access to it. The schema can also serve as the contract for a later thin MCP adapter.

Mutations broadcast immediately and enter Hyperfy's existing periodic persistence queues. A successful response does not mean the next database save has completed. Script upload returns its content-addressed URL; source is retrieved through the existing asset URL, not included in blueprint inspection. As with UI edits, removal has no API undo operation. Back up valuable worlds before agent editing.

The snapshot route reads the server's in-memory app, blueprint, settings, spawn, and storage state in one request. It excludes players and transient app state. The write token acts as the capture permission. Its optional seat-pose section contains only `seatPose:`, `seatPoseProfile:`, and `seatPoseStyles:` storage entries. Asset reads verify content-addressed hashes, allow simple built-in filenames, and reject assets larger than 256 MiB.

Verification:

```sh
node --test src/server/agent-api.test.mjs
```

## Server profiling

Send `POST /profiling` with `{ "enabled": true }` using the write token. Server profiling is off by default and does not require a connected browser when enabled through the API. Fresh connected admin Object Profiler viewers also enable sampling automatically; only these viewers receive server samples over the existing WebSocket. Automatic sampling stops when no fresh admin viewer remains (within ten seconds), unless explicitly enabled through the API. After at least one second, `GET /profiling` returns `server` with `source: "server"`, `active`, `sampledAt` (server Unix milliseconds), `ageMs`, `stale`, `sampleSeconds`, and per-app `rows`. Before the first sample, timestamps and sample duration are null and rows are empty. Use `?entityId=...` to filter both server and client rows. Send `{ "enabled": false }` to release the API request; sampling stops and clears once there are also no fresh admin profiler viewers. App scripts cannot switch server profiling through `world.toggleProfiler()`.

Server rows contain app identity/version, `cpuMsPerSecond`, `peakCallbackMs`, and `callbackMsPerSecond`. These are exclusive synchronous callback durations measured on the server, divided by the actual sample window, without client smoothing. Nested app callbacks are not counted twice. Idle apps appear with zero callback time; removed apps and outdated blueprint samples are excluded. Server samples remain separate from client samples and are not added to them. This is script wall-clock time, not whole-process CPU usage; it excludes asynchronous continuations, native node callbacks, and engine/PhysX simulation time. A sample older than ten seconds is stale.

## Client profiling

`GET /profiling` returns browser-reported diagnostics in `clients` and server-measured script timings in `server`. It requires the write token, like player inspection. Each `clients` entry identifies its reporting `playerId` and includes server `receivedAt`, `ageMs`, `stale`, `sampleSeconds`, `smoothingSeconds`, `totalApps`, `truncated`, and per-app `rows`. Reports older than ten seconds are explicitly stale; disconnected or no-longer-admin clients are excluded. Removed apps and samples for an outdated blueprint version are excluded. No reports means no compatible connected admin client is currently profiling.

An admin enables the existing Object Profiler, or an agent sends `POST /players/:id/profiling` with `{ "enabled": true }`. The 202 response means requested, not that a sample has arrived. Poll `GET /profiling` for a fresh sample, optionally filtered with `?entityId=...`. Use `{ "enabled": false }` to stop. The target must be a connected admin; this cannot enable profiling for a non-admin. Updated client and server builds are both required; an older browser must reload before it can report.

Rows expose `cpuMsPerSecond`, `peakCallbackMs`, `callbackMsPerSecond`, `sentBytesPerSecond`, `receivedBytesPerSecond`, `messagesPerSecond`, and mounted geometry, material, physics-body/collider/activity/contact-link, light and shadow-caster counts. CPU and byte rates use the profiler's two-second smoothing; callback breakdown and message rates are from the last sample. API queries do not trigger extra sampling. Reports are sent at most once a second while profiling is enabled; disabled clients send no periodic diagnostics. Worlds above 2,048 apps report the highest-CPU rows with explicit truncation.

These measurements include synchronous app callbacks and exclude async continuations, native node handlers, GPU timings, per-body physics milliseconds, server CPU and unrelated network traffic. Client reports are diagnostic data, not a trusted accounting mechanism. App names and blueprint identities come from the server. Reports contain no camera or player positions and are held only in memory.
