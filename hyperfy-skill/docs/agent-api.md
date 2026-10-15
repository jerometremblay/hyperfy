# Hyperfy Agent REST API

Use this reference when inspecting or managing apps in a running Hyperfy world. The API is scoped to one running world at `/api/agent` on that world's existing HTTP server. It does not control server processes or expose a general-purpose world scripting endpoint.

## Access

The operator enables the API by setting one or both variables on the Hyperfy server and restarting it:

```dotenv
AGENT_API_READ_TOKEN=long-random-read-token
AGENT_API_WRITE_TOKEN=separate-long-random-write-token
```

If both are unset, the routes are not registered. Send the configured token as `Authorization: Bearer <token>`. A read token is limited to `GET` and `HEAD`; a write token also permits reads and all mutations, including executable script uploads. Use HTTPS for remote worlds and separate tokens per world. Never put tokens in `PUBLIC_` variables, source files, checked-in artifacts, command output, or logs.

The API does not grant the caller access by itself. If the world is not configured or the token is unavailable, do not try another credential or enable the API as part of an unrelated task. For a live update, use the configured write token only when the user has requested that mutation.

## Routes

All paths below are relative to `/api/agent`.

| Method | Path | Operation |
| --- | --- | --- |
| GET | `/world` | Read world settings and object counts |
| GET | `/apps` | List app blueprints |
| GET | `/apps/:id` | Read one blueprint and its script/model asset URLs |
| POST | `/apps` | Create a blueprint (`name` and `model` required) |
| PATCH | `/apps/:id` | Update a blueprint using its current `version` |
| GET | `/entities` | List app instances |
| GET | `/entities/:id` | Read one app instance |
| POST | `/entities` | Instantiate an existing blueprint |
| PATCH | `/entities/:id` | Change an instance transform or `pinned` state |
| DELETE | `/entities/:id` | Remove an instance |
| POST | `/scripts` | Upload JavaScript source and receive its content-addressed asset URL |
| GET | `/openapi.json` | Read the authenticated OpenAPI schema |

Use `/openapi.json` for the live request schemas. The request body rejects unknown fields. Script source is limited to 262,144 characters.

## Update an existing script app

1. `GET /apps/:id` and retain the returned `version` and all blueprint fields.
2. `POST /scripts` with `{"source":"<full JavaScript source>"}`. The response contains a hashed `asset://...js` URL.
3. `PATCH /apps/:id` with the current `version`, the returned `script` URL, and any other intended changes. Include the blueprint fields that must be preserved.
4. Read the blueprint and a representative entity again to confirm the update reached the world.

A stale version returns `409`; fetch the latest blueprint and reconcile before retrying. A successful blueprint update increments the version and rebuilds every instance using that blueprint. Since `props` replaces the whole object, merge it with the fetched `props` when preserving existing values.

Uploading a script does not attach it to a blueprint. A new script-only app requires a blueprint (`POST /apps` with `model: "script-only"` and the script URL) and, if requested, a separate entity (`POST /entities` with that blueprint ID). A script-only app must create its own visible nodes. For an app backed by a model, `model` must be an existing hashed `asset://` URL; binary model upload is still handled by the existing `/api/upload` endpoint.

## Instances and conflicts

Entity transforms use world-space `position: [x,y,z]`, normalized `quaternion: [x,y,z,w]`, positive `scale: [x,y,z]`, and optional `pinned`. Creation defaults to the origin, identity rotation, and unit scale.

The API protects scene blueprints and instances. It cannot instantiate unique blueprints. Moving or deleting an instance that is currently being edited or uploaded returns `409`; retry after that operation finishes and re-read the instance first. `DELETE` has no API undo operation.

Mutations broadcast to the world and enter Hyperfy's normal persistence queue. A successful response does not guarantee that the next database save has completed. Verify the live result, and do not report durable persistence based on the HTTP response alone.
