import { build } from 'esbuild'

export async function compilePolyspoonRecipe(source) {
  if (typeof source !== 'string' || !source || Buffer.byteLength(source) > 512000) {
    throw new Error('Recipe must be between 1 and 512000 bytes')
  }
  const result = await build({
    stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'polyspoon-recipe.mjs', loader: 'js' },
    bundle: true,
    format: 'iife',
    globalName: 'PolyspoonRecipe',
    platform: 'neutral',
    target: 'es2022',
    minify: true,
    write: false,
    logLevel: 'silent',
    plugins: [{
      name: 'recipe-dependencies',
      setup(builder) {
        builder.onResolve({ filter: /.*/ }, args => {
          if (args.importer.endsWith('polyspoon-recipe.mjs') && args.path !== 'three') {
            return { errors: [{ text: 'Recipe may import only three' }] }
          }
        })
      },
    }],
  })
  const compiled = result.outputFiles[0].text
  if (Buffer.byteLength(compiled) > 512000) throw new Error('Compiled recipe is too large')
  return compiled
}
