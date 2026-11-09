import { build } from 'esbuild'
import * as THREE from 'three'

// Compile a verified Polyfork module against capabilities supplied by the host.
// Provenance must be verified by the caller before this code is made executable.
export async function compileNativePolyfork(source) {
  if (typeof source !== 'string' || !source || Buffer.byteLength(source) > 512000) {
    throw new Error('Invalid Polyfork source')
  }
  const exports = Object.keys(THREE).filter(key => /^[A-Za-z_$][\w$]*$/.test(key))
  const result = await build({
    stdin: { contents: source, sourcefile: 'polyfork-model.mjs', loader: 'js', resolveDir: process.cwd() },
    bundle: true, format: 'iife', globalName: 'PolyforkModule', platform: 'neutral', target: 'es2022',
    write: false, logLevel: 'silent',
    plugins: [{
      name: 'injected-polyfork-dependencies',
      setup(builder) {
        builder.onResolve({ filter: /.*/ }, args => {
          if (args.path === 'three') return { path: 'three', namespace: 'injected' }
          if (args.path === 'three/addons/utils/BufferGeometryUtils.js') return { path: 'geometry', namespace: 'injected' }
          return { errors: [{ text: 'Unsupported Polyfork dependency' }] }
        })
        builder.onLoad({ filter: /.*/, namespace: 'injected' }, args => ({
          contents: args.path === 'three'
            ? exports.map(key => `export const ${key} = globalThis.__polyforkThree.${key};`).join('\n')
            : 'export const mergeGeometries = globalThis.__polyforkMergeGeometries;',
          loader: 'js',
        }))
      },
    }],
  })
  const compiled = result.outputFiles[0].text
  if (Buffer.byteLength(compiled) > 512000) throw new Error('Compiled Polyfork model is too large')
  return compiled
}
