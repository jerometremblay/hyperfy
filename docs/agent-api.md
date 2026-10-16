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
| GET | `/apps` | All app blueprints |
| GET | `/apps/:id` | Blueprint, properties and script asset URL |
| POST | `/apps` | Create a blueprint; requires `name`, `model` |
| PATCH | `/apps/:id` | Edit shared blueprint; requires current `version` |
| GET | `/entities` | App instances (excludes players) |
| GET | `/entities/:id` | Inspect an app instance |
| POST | `/entities` | Instantiate an existing `blueprint` |
| PATCH | `/entities/:id` | Set position, quaternion, scale or pinned |
| DELETE | `/entities/:id` | Remove an app instance |
| GET | `/players` | List connected players (write token required) |
| POST | `/players/:id/teleport` | Teleport a connected player (write token required) |
| POST | `/scripts` | Upload JavaScript source through existing local/S3 storage |
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

Verification:

```sh
node --test src/server/agent-api.test.mjs
```
