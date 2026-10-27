# Deployment

## Self-hosting a server

### 1. Configure environment

```bash
cp .env.example .env
```

Generate a secret with `openssl rand -hex 32`, then put it in `.env` as
`JWT_SECRET`. Empty and known public template values stop startup. Edit `.env`
and set at minimum:

| Variable | Description |
|---|---|
| `JWT_SECRET` | Random secret key for signing auth tokens (32+ chars recommended) |
| `ADMIN_CODE` | Password for admin operations (backup, restore) |
| `PORT` | HTTP port (default: `3000`) |
| `PUBLIC_WS_URL` | Public WebSocket URL, e.g. `wss://your-server.com/ws` |
| `PUBLIC_API_URL` | Public API URL, e.g. `https://your-server.com` |
| `ASSETS_BASE_URL` | Base URL for serving uploaded assets |
| `CORS_ORIGIN` | Allowed CORS origin (default: `*`) |

### 2. Build and start

```bash
npm run build
npm start
```

The server listens on `PORT` (default 3000). Visit `http://localhost:3000` to confirm it's running.

### Named worlds from one checkout

`npm start` and `npm run dev` retain the existing `.env` loading behavior. Select a
world by adding its name:

```bash
npm start -- world2
npm run dev -- world2
```

Create `.env.world2` containing only the overrides:

```dotenv
WORLD=worlds/world2
PORT=3334
PUBLIC_ORIGIN=https://your-server.com:3334
DB_URI=local
ASSETS=local
```

This profile uses a separate SQLite database and assets directory, and inherits
TLS certificates from the shared configuration. Use the hostname covered by your
certificate in `PUBLIC_ORIGIN`. For local HTTP instead, use
`PUBLIC_ORIGIN=http://localhost:3334` and explicitly clear both `TLS_KEY_FILE=` and
`TLS_CERT_FILE=` in the profile. Add `.env.world1` or other named files the same way;
a missing profile stops startup with an error.

The usual dotenv-flow files load first, followed by `.env.<world>` and optional
`.env.<world>.local`. Exported environment variables have the highest priority.
World selection does not change `NODE_ENV`. `PUBLIC_ORIGIN` derives the WebSocket
(`/ws`), API (`/api`) and assets (`/assets`) URLs, replacing shared URLs. Explicit
URL settings in the world profile or exported environment take precedence, so
separate API or asset hosts still work. Profile files are ignored by Git.

Build once with `npm run build`, then run multiple `npm start -- <world>` processes
using different ports and data directories. Use only one development build watcher
per checkout because development commands share the build directory. PostgreSQL
worlds also need separate `DB_SCHEMA` values; S3 worlds need separate storage locations.

### Docker

```bash
docker run -d \
  --name hyperfy \
  -p 3000:3000 \
  -v $(pwd)/world:/app/world \
  --env-file .env \
  ghcr.io/hyperfy-xyz/hyperfy:latest
```

See [DOCKER.md](../DOCKER.md) for full details.

### Reverse proxy (nginx / Caddy)

Hyperfy uses WebSockets, so your proxy must forward upgrade headers.

**nginx snippet:**
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

**Caddyfile snippet:**
```
your-server.com {
    reverse_proxy localhost:3000
}
```

---

## Connecting the GitHub Pages preview to a server

The static build deployed to GitHub Pages boots in **offline mode** by default (no server required). There are two ways to point it at a real server.

### Option 1 — Bake in a default server URL

Edit `.github/workflows/static-deploy.yml` and add an `env` block to the build step:

```yaml
- run: npm run static:build
  env:
    PUBLIC_WS_URL: ''  # wss://your-server.com/ws
```

Replace the empty string with your WebSocket URL, push to `dev`, and the next deploy will bake it in. Setting it back to `''` (or removing the line) returns to offline mode.

### Option 2 — Per-link override

Share URLs with a `?connect=` query parameter:

```
https://your-org.github.io/hyperfy/?connect=wss://your-server.com/ws
```

This works without any build changes — visitors are connected to your server for that session only.
