import sourceMapSupport from 'source-map-support'
import path from 'path'
import { fileURLToPath } from 'url'
import { enforceSecureRuntime } from './runtimePolicy'

// read .env files
import 'dotenv-flow/config'

enforceSecureRuntime()

// support node source maps
sourceMapSupport.install()

// support `__dirname` in ESM
globalThis.__dirname = path.dirname(fileURLToPath(import.meta.url))
