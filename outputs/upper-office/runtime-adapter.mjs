// Geometry preview only. Gameplay is exercised separately in the real engine.
import { executeSource as executeOriginal, parseHyp } from '../promptbox-large/runtime-adapter.mjs'
export { parseHyp }
export function executeSource(source, suffix = '', options = {}) {
  return executeOriginal('world.isPreview = true\n' + source, suffix, options)
}
