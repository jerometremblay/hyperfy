import { build } from 'esbuild'

// Bundle only Three.js and its geometry helper. The downloaded module never has
// access to the server's filesystem, network, or other packages.
export async function compilePolyforkRecipe(source) {
  if (typeof source !== 'string' || !source || Buffer.byteLength(source) > 512000)
    throw new Error('Invalid model source')
  const wrapper = `
import * as model from 'polyfork-model';
const create = model.createAsset, params = model.params || {};
const controls = Object.entries(params).flatMap(([key, p]) => {
  if (!p || !['choice','range','integer','toggle','color'].includes(p.type)) return [];
  const c = {key, kind:p.type, label:p.label || key, hint:p.describe || ''};
  if (p.type === 'choice') {
    if (!Array.isArray(p.options) || !p.options.every(v => typeof v === 'string')) return [];
    c.options = p.options.map(value => ({value, label:value}));
  }
  if (p.type === 'range' || p.type === 'integer') {
    if (![p.min,p.max,p.step].every(Number.isFinite)) return [];
    Object.assign(c, {min:p.min,max:p.max,step:p.step});
  }
  return [{...c, default:p.default}];
});
export const metadata = {controls:controls.map(({default:ignored,...control}) => control)};
export function createAsset(input = {}) {
  const applied = Object.fromEntries(controls.map(c => [c.key, input[c.key] ?? c.default]));
  const object = create(input);
  object.userData.design = {applied};
  return object;
}
export function disposeAsset(object) {
  object.traverse(node => { node.geometry?.dispose(); if (Array.isArray(node.material)) node.material.forEach(m => m.dispose()); else node.material?.dispose(); });
}`
  const result = await build({
    stdin: { contents: wrapper, resolveDir: process.cwd(), sourcefile: 'polyfork-wrapper.mjs', loader: 'js' },
    bundle: true,
    format: 'iife',
    globalName: 'PolyspoonRecipe',
    platform: 'neutral',
    target: 'es2022',
    minify: true,
    write: false,
    logLevel: 'silent',
    plugins: [
      {
        name: 'polyfork-dependencies',
        setup(builder) {
          builder.onResolve({ filter: /^polyfork-model$/ }, () => ({ path: 'model', namespace: 'polyfork' }))
          builder.onLoad({ filter: /.*/, namespace: 'polyfork' }, () => ({
            contents: source,
            loader: 'js',
            resolveDir: process.cwd(),
          }))
          builder.onResolve({ filter: /.*/, namespace: 'polyfork' }, args => {
            if (args.path === 'three' || args.path === 'three/addons/utils/BufferGeometryUtils.js') return
            return { errors: [{ text: 'Unsupported Polyfork dependency' }] }
          })
        },
      },
    ],
  })
  const compiled = result.outputFiles[0].text
  if (Buffer.byteLength(compiled) > 512000) throw new Error('Compiled model is too large')
  return compiled
}
