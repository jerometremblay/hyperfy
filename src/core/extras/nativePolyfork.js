import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { createScriptCompartment } from './scriptCompartment.js'

export const runtimePolyforkHash = model => /^polyfork:\/\/([a-f0-9]{64})$/.exec(model || '')?.[1]

// The caller must establish the provenance of compiled code before running it
// on the world thread. Ordinary recipes must continue to use the worker.
export function loadNativePolyfork(compiled) {
  if (typeof compiled !== 'string' || !compiled || compiled.length > 512000) throw new Error('Invalid Polyfork module')
  const compartment = createScriptCompartment({
    __polyforkThree: THREE,
    __polyforkMergeGeometries: mergeGeometries,
    Float32Array,
    Float64Array,
    console: Object.freeze({ log() {}, info() {}, warn() {}, error() {}, debug() {} }),
  })
  // Polyfork's procedural textures call Math millions of times. Capture the
  // compartment intrinsic once so hot loops avoid SES global proxy lookups.
  const model = compartment.evaluate(`(function () { const Math = globalThis.Math; ${compiled}\n; return PolyforkModule; })()`)
  if (typeof model?.createAsset !== 'function') throw new Error('Polyfork module has no createAsset export')
  return model
}
