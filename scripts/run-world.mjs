import { parseArgs } from 'node:util'
import { resolveWorldProfile } from './world-profile.mjs'
import { assertSecureRuntime } from '../src/server/runtimePolicy.js'

assertSecureRuntime()

let dev
try {
  const { values, positionals } = parseArgs({
    options: {
      dev: { type: 'boolean' },
      http: { type: 'boolean' },
      ip: { type: 'string' },
    },
    allowPositionals: true,
  })
  if (positionals.length > 1) {
    throw new Error('Usage: npm run dev -- [world] [--http] [--ip <address>] (or npm start)')
  }
  if (values.ip !== undefined && !values.http) throw new Error('--ip requires --http')
  dev = values.dev
  Object.assign(
    process.env,
    resolveWorldProfile(positionals[0], { httpHost: values.http ? (values.ip ?? '127.0.0.1') : undefined })
  )
  if (values.http) console.log(`[http] ${process.env.PUBLIC_ORIGIN}`)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
await import(dev ? './build.mjs' : '../build/index.js')
