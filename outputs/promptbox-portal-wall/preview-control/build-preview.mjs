import fs from 'node:fs/promises'
import { build } from 'esbuild'

const directory = new URL('./', import.meta.url)
const house = await fs.readFile(new URL('house.hyp', directory))
// Geometry is unchanged; reuse the existing house preview and embed this exact package.
const bundle = await build({
  entryPoints: [new URL('preview.mjs', directory).pathname],
  bundle: true, format: 'esm', platform: 'browser', write: false, minify: true,
  supported: { 'template-literal': false },
  define: { process: '{"env":{"PUBLIC_PLAYER_COLLISION":"false"}}' },
})
const template = await fs.readFile(new URL('../inset-doors/preview.html', directory), 'utf8')
const html = template
  .replace(/window.EMBEDDED_HYP="[^"]*"/, 'window.EMBEDDED_HYP=' + JSON.stringify(house.toString('base64')))
  .replace(/<script type="module">.*?<\/script>/s,
    () => '<script type="module">' + bundle.outputFiles[0].text.replaceAll('</script', '<\\/script') + '</script>')
  .replaceAll('Two separate upstairs-size doors', 'Explicit door-controlled portal previews')
  .replaceAll('Two separate doors, the same size as upstairs', 'Explicit door-controlled portal previews')
  .replace('<footer id="status">', '<div id="caption"></div><footer id="status">')
await fs.writeFile(new URL('preview.html', directory), html)
console.log('Built preview from exact door-preview house package')
