import fs from 'node:fs/promises'
import { build } from 'esbuild'

const directory = new URL('./', import.meta.url)
const house = await fs.readFile(new URL('house.hyp', directory))
const bundle = await build({
  entryPoints: [new URL('preview.mjs', directory).pathname],
  bundle: true, format: 'esm', platform: 'browser', write: false,
  define: { process: '{"env":{"PUBLIC_PLAYER_COLLISION":"false"}}' },
})
const template = await fs.readFile(new URL('../inset-doors/preview.html', directory), 'utf8')
const html = template
  .replace(/window.EMBEDDED_HYP="[^"]*"/, 'window.EMBEDDED_HYP=' + JSON.stringify(house.toString('base64')))
  .replace(/<script type="module">.*?<\/script>/s,
    () => '<script type="module">' + bundle.outputFiles[0].text.replaceAll('</script', '<\\/script') + '</script>')
  .replaceAll('Two separate upstairs-size doors', 'Wider portal door openings')
  .replaceAll('Two separate doors, the same size as upstairs', 'Portal doors · 137.3° beside the wall · 175° on the free side')
  .replace('<footer id="status">', '<div id="caption"></div><footer id="status">')
await fs.writeFile(new URL('preview.html', directory), html)
console.log('Built preview from exact wider-swing house package')
