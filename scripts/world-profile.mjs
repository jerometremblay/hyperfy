import fs from 'node:fs'
import { isIP } from 'node:net'
import path from 'node:path'
import dotenvFlow from 'dotenv-flow'

// Resolve everything before changing process.env: a bad profile must not boot the default world.
export function resolveWorldProfile(profile, { root = process.cwd(), env = process.env, httpHost } = {}) {
  if (!profile && httpHost === undefined) return {}
  let overrides = {}
  if (profile) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(profile)) {
      throw new Error('World name must contain only letters, numbers, underscores or hyphens')
    }
    const profileFile = path.join(root, `.env.${profile}`)
    if (!fs.existsSync(profileFile)) throw new Error(`Unknown world: ${profile} (missing .env.${profile})`)
    const localFile = `${profileFile}.local`
    overrides = dotenvFlow.parse([profileFile, ...(fs.existsSync(localFile) ? [localFile] : [])])
  }
  const shared = dotenvFlow.parse(
    dotenvFlow.listFiles({
      path: env.DOTENV_FLOW_PATH || root,
      pattern: env.DOTENV_FLOW_PATTERN,
      node_env: env.NODE_ENV || env.DEFAULT_NODE_ENV,
    })
  )
  if (httpHost !== undefined) {
    const ipVersion = isIP(httpHost)
    if (!ipVersion) throw new Error('--ip must be an IPv4 or IPv6 address')
    const config = { ...shared, ...overrides, ...env }
    const port = Number(config.PORT)
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('PORT must be between 1 and 65535 when using --http')
    }
    const origin = `http://${ipVersion === 6 ? `[${httpHost}]` : httpHost}:${port}`
    return {
      ...config,
      TLS_KEY_FILE: '',
      TLS_CERT_FILE: '',
      HOST: ipVersion === 6 ? '::' : '0.0.0.0',
      PUBLIC_ORIGIN: origin,
      PUBLIC_WS_URL: `${origin.replace('http:', 'ws:')}/ws`,
      PUBLIC_API_URL: `${origin}/api`,
      ASSETS_BASE_URL: `${origin}/assets`,
      CORS_ORIGIN: origin,
    }
  }
  const origin = env.PUBLIC_ORIGIN ?? overrides.PUBLIC_ORIGIN
  if (origin) {
    const url = new URL(origin)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    ) {
      throw new Error('PUBLIC_ORIGIN must be an HTTP(S) origin, such as http://localhost:3334')
    }
    const derived = {
      PUBLIC_WS_URL: `${url.protocol === 'https:' ? 'wss' : 'ws'}://${url.host}/ws`,
      PUBLIC_API_URL: `${url.origin}/api`,
      ASSETS_BASE_URL: `${url.origin}/assets`,
    }
    return { ...shared, ...derived, ...overrides, ...env }
  }
  return { ...shared, ...overrides, ...env }
}
