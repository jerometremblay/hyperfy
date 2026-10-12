import fs from 'node:fs'
import path from 'node:path'
import dotenvFlow from 'dotenv-flow'

// Resolve everything before changing process.env: a bad profile must not boot the default world.
export function resolveWorldProfile(profile, { root = process.cwd(), env = process.env } = {}) {
  if (!profile) return {}
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(profile)) {
    throw new Error('World name must contain only letters, numbers, underscores or hyphens')
  }
  const profileFile = path.join(root, `.env.${profile}`)
  if (!fs.existsSync(profileFile)) throw new Error(`Unknown world: ${profile} (missing .env.${profile})`)
  const localFile = `${profileFile}.local`
  const overrides = dotenvFlow.parse([profileFile, ...(fs.existsSync(localFile) ? [localFile] : [])])
  const shared = dotenvFlow.parse(
    dotenvFlow.listFiles({
      path: env.DOTENV_FLOW_PATH || root,
      pattern: env.DOTENV_FLOW_PATTERN,
      node_env: env.NODE_ENV || env.DEFAULT_NODE_ENV,
    })
  )
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
