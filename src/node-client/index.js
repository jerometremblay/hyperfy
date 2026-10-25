import 'ses'
import '../core/lockdown'
import '../server/fetchGuardInstall'
import path from 'path'
import { fileURLToPath } from 'url'
import { enforceSecureRuntime } from '../server/runtimePolicy'

enforceSecureRuntime()

// support `__dirname` in ESM
globalThis.__dirname = path.dirname(fileURLToPath(import.meta.url))

export { createNodeClientWorld } from '../core/createNodeClientWorld'
export { System } from '../core/systems/System'
export { storage } from '../core/storage'
