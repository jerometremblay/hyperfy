// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/physicsFailure.js
import { createLogOnce } from './logOnce.js'

let traps = 0
const logTrap = createLogOnce(message => console.error(message))

export function isPhysicsTrap(err) {
  try {
    return err instanceof WebAssembly.RuntimeError
  } catch {
    return false // revoked proxies and other thrown values are not native traps
  }
}

export function getPhysicsTrapCount() {
  return traps
}

export function assertScriptActive(entity, world = entity?.world, allowDestroy = false) {
  if ((entity?.crashed && !(allowDestroy && entity.destroying)) || world?.fatalError) {
    throw new Error(
      entity?.nativeFailure ? '[physics] disabled for this app after a native failure' : '[app] this app has stopped'
    )
  }
}

export function handlePhysicsFailure(err, { entity, world = entity?.world, phase, count = 1 } = {}) {
  if (!isPhysicsTrap(err)) return false
  traps += count
  if (world?.physics) world.physics.needsProbe = true
  const subject = entity || world
  if (subject) {
    logTrap(
      subject,
      'trap',
      `[physics] native failure (entity ${entity?.data?.id ?? 'none'}, phase ${phase ?? 'script'})`
    )
  }
  if (entity?.isApp) {
    entity.nativeFailure = true
    entity.physicsFailureVersion = (entity.physicsFailureVersion || 0) + 1
    entity.scriptError = { name: 'RuntimeError', message: 'Native physics failure' }
    entity.crash()
  }
  return true
}
